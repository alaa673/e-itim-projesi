import type { ApiErrorKind, FieldErrors } from '@/types';

/** Normalised error thrown by the API client and by mock adapters. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly fieldErrors: FieldErrors;

  constructor(kind: ApiErrorKind, options: { status?: number | null; message?: string; fieldErrors?: FieldErrors } = {}) {
    super(options.message ?? kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status ?? null;
    this.fieldErrors = options.fieldErrors ?? {};
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === 'AbortError') return new ApiError('aborted');
  if (error instanceof TypeError) return new ApiError('network');
  return new ApiError('unknown');
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof ApiError && error.kind === 'aborted') ||
    (error instanceof DOMException && error.name === 'AbortError')
  );
}

/** i18n key (common namespace) describing the error for end users — never raw server details. */
export function errorMessageKey(error: unknown): string {
  return `errors.${toApiError(error).kind}`;
}
