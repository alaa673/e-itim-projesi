/**
 * Safe wrappers around Web Storage. Storage can be unavailable (private mode, blocked
 * site data, sandboxed previews), so every access is guarded and failures are ignored.
 * Only non-sensitive UI preferences are stored here.
 */
type StorageKind = 'local' | 'session';

function getStore(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorage(key: string, kind: StorageKind = 'local'): string | null {
  try {
    return getStore(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string, kind: StorageKind = 'local'): void {
  try {
    getStore(kind)?.setItem(key, value);
  } catch {
    /* ignore quota / access errors */
  }
}

export function removeStorage(key: string, kind: StorageKind = 'local'): void {
  try {
    getStore(kind)?.removeItem(key);
  } catch {
    /* ignore */
  }
}
