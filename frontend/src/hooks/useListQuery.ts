import { useCallback, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '@/config/constants';
import type { ListQuery } from '@/types';
import { useDebounce } from './useDebounce';

export type SortState = { key: string; direction: 'asc' | 'desc' };

/**
 * Search + filters + sort state for a list page. `query` is debounced (search) and stable,
 * so it can be passed straight to useResourceList.
 */
export function useListQuery<F extends string = string>(options: { filters?: Partial<Record<F, string>>; sort?: SortState; descFirst?: string[]; search?: string } = {}) {
  const [initialFilters] = useState(() => ({ ...(options.filters ?? {}) }) as Partial<Record<F, string>>);
  const [search, setSearch] = useState(options.search ?? '');
  const [filters, setFilters] = useState<Partial<Record<F, string>>>(initialFilters);
  const [sort, setSort] = useState<SortState | undefined>(options.sort);
  const debounced = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const descFirst = options.descFirst;

  const setFilter = useCallback((key: F, value: string) => setFilters((prev) => ({ ...prev, [key]: value })), []);
  const clear = useCallback(() => {
    setSearch('');
    setFilters(initialFilters);
  }, [initialFilters]);
  const onSortChange = useCallback(
    (key: string) =>
      setSort((prev) => ({
        key,
        direction: prev?.key === key ? (prev.direction === 'asc' ? 'desc' : 'asc') : descFirst?.includes(key) ? 'desc' : 'asc',
      })),
    [descFirst],
  );

  const active = Boolean(search) || Object.entries(filters).some(([k, v]) => Boolean(v) && v !== initialFilters[k as F]);
  const query = useMemo<Omit<ListQuery, 'offset' | 'limit'>>(
    () => ({ search: debounced, filters: filters as Record<string, string | undefined>, sortKey: sort?.key, sortDirection: sort?.direction }),
    [debounced, filters, sort],
  );

  return { search, setSearch, filters, setFilter, clear, active, sort, onSortChange, query };
}
