import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/utils/errorHandling';
import { apiRequest, onUnauthorized, requestHeaders } from './api';

function mockFetch(impl: (...args: Parameters<typeof fetch>) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
  onUnauthorized(null);
});

describe('apiRequest', () => {
  it('returns parsed JSON on success and sends query params', async () => {
    mockFetch(async () => json(200, { ok: true }));
    await expect(apiRequest('/x', { query: { offset: 20, limit: 20, search: '' } })).resolves.toEqual({ ok: true });
    const url = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(url).toContain('offset=20');
    expect(url).not.toContain('search='); // empty values are dropped
  });

  it.each([
    [400, 'validation'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [429, 'rate_limited'],
    [500, 'server'],
  ])('maps HTTP %i to "%s"', async (status, kind) => {
    mockFetch(async () => json(status, { message: 'internal detail' }));
    await expect(apiRequest('/x')).rejects.toMatchObject({ kind, status });
  });

  it('signals 401 to the auth layer', async () => {
    const handler = vi.fn();
    onUnauthorized(handler);
    mockFetch(async () => json(401, {}));
    await expect(apiRequest('/x')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('exposes field errors from validation responses', async () => {
    mockFetch(async () => json(409, { fieldErrors: { schoolNumber: 'duplicate', bad: 3 } }));
    const error = (await apiRequest('/x').catch((e: unknown) => e)) as ApiError;
    expect(error.fieldErrors).toEqual({ schoolNumber: 'duplicate' });
  });

  it('handles non-JSON error pages without leaking them', async () => {
    mockFetch(async () => new Response('<html>Stack trace…</html>', { status: 502, headers: { 'content-type': 'text/html' } }));
    const error = (await apiRequest('/x').catch((e: unknown) => e)) as ApiError;
    expect(error.kind).toBe('server');
    expect(error.message).not.toContain('Stack');
  });

  it('maps network failures and timeouts', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(apiRequest('/x')).rejects.toMatchObject({ kind: 'network' });

    mockFetch(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    await expect(apiRequest('/x', { timeoutMs: 20 })).rejects.toMatchObject({ kind: 'timeout' });
  });
});

describe('request headers', () => {
  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('sends the UI language and marks API calls', () => {
    document.documentElement.lang = 'en';
    const headers = requestHeaders('GET', false);
    expect(headers['Accept-Language']).toBe('en');
    expect(headers['X-Requested-With']).toBe('XMLHttpRequest');
    expect(headers['Content-Type']).toBeUndefined();
    document.documentElement.lang = 'tr';
  });

  it('echoes the CSRF cookie only on state-changing requests', () => {
    document.cookie = 'XSRF-TOKEN=abc%20123; path=/';
    expect(requestHeaders('POST', true)['X-XSRF-TOKEN']).toBe('abc 123');
    expect(requestHeaders('DELETE', false)['X-XSRF-TOKEN']).toBe('abc 123');
    expect(requestHeaders('GET', false)['X-XSRF-TOKEN']).toBeUndefined();
    expect(requestHeaders('POST', true)['Content-Type']).toBe('application/json');
  });

  it('never sets Content-Type for file uploads', async () => {
    mockFetch(async () => json(200, {}));
    const body = new FormData();
    body.append('file', new Blob(['x']), 'a.pdf');
    await apiRequest('/upload', { method: 'POST', body });
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    expect(init.credentials).toBe('include');
  });
});
