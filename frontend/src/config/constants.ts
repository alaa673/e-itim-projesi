/** Maximum number of records added to a table per load ("Show 20 more"). */
export const TABLE_BATCH_SIZE = 20;

export const SEARCH_DEBOUNCE_MS = 300;

export const API_MODE: 'mock' | 'real' = import.meta.env.VITE_API_MODE === 'real' ? 'real' : 'mock';
export const IS_MOCK_MODE = API_MODE === 'mock';

export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const parsedTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
export const API_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 15_000;

/** Optional link to the school's privacy notice (KVKK aydınlatma metni); https only. */
const privacyEnv = (import.meta.env.VITE_PRIVACY_URL ?? '').trim();
export const PRIVACY_URL: string | null = privacyEnv.startsWith('https://') ? privacyEnv : null;

const routerModeEnv = import.meta.env.VITE_ROUTER_MODE;
/** browser: clean URLs · hash: #/path on any static host · memory: no URL changes (embedded demos) */
export const ROUTER_MODE: 'hash' | 'browser' | 'memory' = routerModeEnv === 'hash' || routerModeEnv === 'memory' ? routerModeEnv : 'browser';

export const STORAGE_KEYS = {
  theme: 'sep.theme',
  language: 'sep.lang',
  demoSession: 'sep.demo-session',
} as const;

export const SUPPORTED_LOCALES = ['tr', 'en'] as const;
export const DEFAULT_LOCALE = 'tr';

/** Grades available per school level (Turkish K-12 system). */
export const GRADES_BY_LEVEL = {
  primary: [1, 2, 3, 4],
  middle: [5, 6, 7, 8],
  high: [9, 10, 11, 12],
} as const;

export const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** Topic scores under this percentage are flagged as "needs review". */
export const TOPIC_REVIEW_THRESHOLD = 50;
