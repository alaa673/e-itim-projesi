/**
 * Turns a file URL from the API into a link the browser may open, or null.
 * Accepts https URLs and server paths ("/files/…", resolved against the API origin); plain http only
 * while developing on localhost. Anything else (javascript:, data:, protocol-relative "//host") is refused.
 */
export function resolveFileUrl(url: string | null | undefined, apiBaseUrl: string): string | null {
  if (!url) return null;
  const value = url.trim();
  if (value.startsWith('https://')) return value;
  if (value.startsWith('http://') && ['localhost', '127.0.0.1'].includes(window.location.hostname)) return value;
  if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')) {
    try {
      const base = /^https?:\/\//.test(apiBaseUrl) ? apiBaseUrl : window.location.origin;
      return new URL(value, base).toString();
    } catch {
      return null;
    }
  }
  return null;
}
