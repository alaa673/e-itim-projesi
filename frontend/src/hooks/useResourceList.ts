import { useCallback } from 'react';
import type { ListQuery } from '@/types';
import type { PaginatedResponse, PaginationParams } from '@/types';
import { useIncrementalList } from './useIncrementalList';

type ListFn<T> = (query: ListQuery, signal?: AbortSignal) => Promise<PaginatedResponse<T>>;

/**
 * 20-record incremental list for any resource. Changing search, filters or sort restarts from the first batch.
 */
export function useResourceList<T extends { id: string }>(list: ListFn<T>, query: Omit<ListQuery, 'offset' | 'limit'>) {
  const key = JSON.stringify(query);
  const fetcher = useCallback(
    (page: PaginationParams, signal: AbortSignal) => list({ ...query, ...page }, signal),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list, key],
  );
  return useIncrementalList<T>(fetcher, (item) => item.id, key);
}
