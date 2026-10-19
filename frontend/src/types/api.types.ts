export interface PaginationParams {
  offset: number;
  limit: number;
}

/** Provisional contract — see docs/BACKEND_API_REQUIREMENTS.md */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'aborted'
  | 'unknown';

export interface FieldErrors {
  [field: string]: string;
}

/**
 * List request used by every table and card list. Sent as
 * `?offset&limit&search&sort=<sortKey>&order=<sortDirection>&<filter>=<value>`.
 */
export interface ListQuery {
  offset: number;
  limit: number;
  search?: string;
  /** Exact-match filters; empty values are ignored. */
  filters?: Record<string, string | undefined>;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
}
