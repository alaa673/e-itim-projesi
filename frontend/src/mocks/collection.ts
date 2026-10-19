/**
 * In-memory collection used by the development-only mock adapters.
 * Seeds lazily (deterministic data), keeps changes for the browser session only,
 * and implements the same list contract as the backend: search, filters, sort, offset/limit.
 */
import type { ListQuery, PaginatedResponse } from '@/types';

export type { ListQuery };
import { ApiError } from '@/utils/errorHandling';
import { mockDelay } from './utils';


interface CollectionOptions<T> {
  /** Text searched by `search` (case- and accent-insensitive). */
  searchText?: (item: T) => string;
  /** Custom filter; by default a filter key is compared with String(item[key]). */
  filter?: (item: T, key: string, value: string) => boolean;
  sorters?: Record<string, (a: T, b: T) => number>;
  defaultSort?: string;
}

export function normalise(value: string): string {
  return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
}

const collator = new Intl.Collator('tr', { sensitivity: 'base', numeric: true });
export const compareText = (a: string, b: string) => collator.compare(a, b);

let sequence = 1000;
export function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export interface Collection<T extends { id: string }> {
  all(): T[];
  find(id: string): T | undefined;
  list(query: ListQuery, signal?: AbortSignal): Promise<PaginatedResponse<T>>;
  get(id: string, signal?: AbortSignal): Promise<T>;
  insert(item: T): Promise<T>;
  patch(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
  /** Synchronous update used by other mock handlers (e.g. counters). */
  mutate(id: string, change: (item: T) => T): T | undefined;
}

export function createCollection<T extends { id: string }>(seed: () => T[], options: CollectionOptions<T> = {}): Collection<T> {
  let rows: T[] | null = null;
  const data = () => (rows ??= seed());

  const matches = (item: T, query: ListQuery) => {
    for (const [key, value] of Object.entries(query.filters ?? {})) {
      if (!value) continue;
      const ok = options.filter ? options.filter(item, key, value) : String((item as Record<string, unknown>)[key]) === value;
      if (!ok) return false;
    }
    const term = normalise(query.search?.trim() ?? '');
    if (!term) return true;
    return normalise(options.searchText ? options.searchText(item) : JSON.stringify(item)).includes(term);
  };

  return {
    all: () => data(),
    find: (id) => data().find((r) => r.id === id),
    list(query, signal) {
      return mockDelay(() => {
        const key = query.sortKey ?? options.defaultSort;
        const sorter = key ? options.sorters?.[key] : undefined;
        const filtered = data().filter((r) => matches(r, query));
        if (sorter) {
          filtered.sort((a, b) => {
            const result = sorter(a, b) || a.id.localeCompare(b.id); // stable order across batches
            return query.sortDirection === 'desc' ? -result : result;
          });
        }
        return {
          items: filtered.slice(query.offset, query.offset + query.limit).map((r) => structuredClone(r)),
          total: filtered.length,
          offset: query.offset,
          limit: query.limit,
        };
      }, signal);
    },
    get(id, signal) {
      return mockDelay(() => {
        const found = data().find((r) => r.id === id);
        if (!found) throw new ApiError('not_found', { status: 404 });
        return structuredClone(found);
      }, signal, 200);
    },
    insert(item) {
      return mockDelay(() => {
        data().unshift(item);
        return structuredClone(item);
      }, undefined, 450);
    },
    patch(id, change) {
      return mockDelay(() => {
        const list = data();
        const index = list.findIndex((r) => r.id === id);
        if (index < 0) throw new ApiError('not_found', { status: 404 });
        list[index] = { ...list[index], ...change };
        return structuredClone(list[index]);
      }, undefined, 380);
    },
    remove(id) {
      return mockDelay(() => {
        const list = data();
        const index = list.findIndex((r) => r.id === id);
        if (index < 0) throw new ApiError('not_found', { status: 404 });
        list.splice(index, 1);
      }, undefined, 380);
    },
    mutate(id, change) {
      const list = data();
      const index = list.findIndex((r) => r.id === id);
      if (index < 0) return undefined;
      list[index] = change(list[index]);
      return list[index];
    },
  };
}
