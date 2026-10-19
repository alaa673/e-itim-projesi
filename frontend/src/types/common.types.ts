export type Locale = 'tr' | 'en';
export type ThemeName = 'light' | 'dark';

/** Educational stage. A student attribute, never a permission role. */
export type SchoolLevel = 'primary' | 'middle' | 'high';

export type RecordStatus = 'active' | 'inactive' | 'archived';

export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string = string> {
  key: K;
  direction: SortDirection;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
