/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'real';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ROUTER_MODE?: 'hash' | 'browser' | 'memory';
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_PRIVACY_URL?: string;
  /** Dev server only: where `npm run dev:api` forwards /api requests. */
  readonly VITE_DEV_API_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
