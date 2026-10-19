import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/constants';
import type { FieldErrors } from '@/types';
import { ApiError, kindFromStatus } from '@/utils/errorHandling';

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

let unauthorizedHandler: (() => void) | null = null;

/** Registered by AuthProvider so a 401 anywhere signs the user out cleanly. */
export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const type = response.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  // Non-JSON responses (HTML error pages, plain text) are never shown to users.
  return null;
}

function extractFieldErrors(payload: unknown): FieldErrors {
  if (payload && typeof payload === 'object' && 'fieldErrors' in payload) {
    const raw = (payload as { fieldErrors: unknown }).fieldErrors;
    if (raw && typeof raw === 'object') {
      return Object.fromEntries(
        Object.entries(raw as Record<string, unknown>).filter(([, v]) => typeof v === 'string'),
      ) as FieldErrors;
    }
  }
  return {};
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Double-submit CSRF token: the backend sets a readable `XSRF-TOKEN` cookie; we echo it in a header. */
function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='));
  return match ? decodeURIComponent(match.slice('XSRF-TOKEN='.length)) : null;
}

/** Headers sent with every request. Exported for tests. */
export function requestHeaders(method: string, hasJsonBody: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    // Lets the server tell API calls from page loads (and forces a CORS preflight for cross-site requests).
    'X-Requested-With': 'XMLHttpRequest',
    // UI language (tr | en) for messages and localised content.
    'Accept-Language': (typeof document !== 'undefined' && document.documentElement.lang) || 'tr',
  };
  if (hasJsonBody) headers['Content-Type'] = 'application/json';
  if (UNSAFE_METHODS.has(method)) {
    const token = readCsrfToken();
    if (token) headers['X-XSRF-TOKEN'] = token;
  }
  return headers;
}

/**
 * Central HTTP client. Cookies carry the session (httpOnly, set by the backend),
 * so no token is ever stored in JavaScript-readable storage.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal, timeoutMs = API_TIMEOUT_MS } = options;

  const controller = new AbortController();
  let timedOut = false;
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      credentials: 'include',
      // FormData (file uploads) sets its own multipart boundary, so no Content-Type for it.
      headers: requestHeaders(method, body !== undefined && !(body instanceof FormData)),
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await parseBody(response);

    if (!response.ok) {
      const kind = kindFromStatus(response.status);
      if (kind === 'unauthorized') unauthorizedHandler?.();
      throw new ApiError(kind, { status: response.status, fieldErrors: extractFieldErrors(payload) });
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(timedOut ? 'timeout' : 'aborted');
    }
    throw new ApiError('network');
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) => apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
