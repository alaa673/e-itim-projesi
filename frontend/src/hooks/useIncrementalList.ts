import { useCallback, useEffect, useRef, useState } from 'react';
import { TABLE_BATCH_SIZE } from '@/config/constants';
import type { PaginatedResponse, PaginationParams } from '@/types';
import { isAbortError } from '@/utils/errorHandling';

export type IncrementalStatus = 'loading' | 'ready' | 'error' | 'loadingMore' | 'loadMoreError';

export interface IncrementalList<T> {
  items: T[];
  total: number;
  status: IncrementalStatus;
  error: unknown;
  hasMore: boolean;
  /** Size of the next batch (≤ TABLE_BATCH_SIZE, smaller for the final batch). */
  nextBatchSize: number;
  loadMore: () => void;
  retry: () => void;
  /** Re-fetch from the first batch (e.g. after create/update). */
  refresh: () => void;
  /** Replace one already-loaded item in place (after an edit) without re-fetching. */
  updateItem: (item: T) => void;
  /** Re-fetch the rows already shown without a loading state (polling live statuses). */
  refreshSilently: () => void;
}

type Fetcher<T> = (page: PaginationParams, signal: AbortSignal) => Promise<PaginatedResponse<T>>;

/**
 * Shared "Show 20 more" loading mechanism.
 * - first load: at most TABLE_BATCH_SIZE records
 * - each loadMore: the next ≤ TABLE_BATCH_SIZE records, appended without duplicates
 * - any change to `resetKey` (search, filters, sort) restarts from the first batch
 * - a failed loadMore keeps already-visible records and exposes retry
 */
export function useIncrementalList<T>(
  fetcher: Fetcher<T>,
  getId: (item: T) => string,
  resetKey: string,
  batchSize: number = TABLE_BATCH_SIZE,
): IncrementalList<T> {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<IncrementalStatus>('loading');
  const [error, setError] = useState<unknown>(null);
  const [generation, setGeneration] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const getIdRef = useRef(getId);
  getIdRef.current = getId;
  const controllerRef = useRef<AbortController | null>(null);
  const itemsRef = useRef<T[]>([]);
  itemsRef.current = items;

  const runFetch = useCallback(
    (offset: number, mode: 'reset' | 'append') => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus(mode === 'reset' ? 'loading' : 'loadingMore');
      setError(null);

      fetcherRef
        .current({ offset, limit: batchSize }, controller.signal)
        .then((response) => {
          if (controller.signal.aborted) return;
          const batch = response.items.slice(0, batchSize);
          setTotal(response.total);
          setItems((prev) => {
            if (mode === 'reset') return batch;
            const seen = new Set(prev.map((item) => getIdRef.current(item)));
            return [...prev, ...batch.filter((item) => !seen.has(getIdRef.current(item)))];
          });
          setStatus('ready');
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted || isAbortError(err)) return;
          setError(err);
          setStatus(mode === 'reset' ? 'error' : 'loadMoreError');
        });
    },
    [batchSize],
  );

  // Restart from the first batch whenever the query changes. Previous rows stay visible (dimmed)
  // until the new first batch replaces them, which avoids flicker while typing.
  useEffect(() => {
    runFetch(0, 'reset');
    return () => controllerRef.current?.abort();
  }, [resetKey, generation, runFetch]);

  const hasMore = items.length < total;

  const loadMore = useCallback(() => {
    if (status === 'loading' || status === 'loadingMore') return;
    if (itemsRef.current.length >= total) return;
    runFetch(itemsRef.current.length, 'append');
  }, [runFetch, status, total]);

  const retry = useCallback(() => {
    if (status === 'loadMoreError') runFetch(itemsRef.current.length, 'append');
    else setGeneration((g) => g + 1);
  }, [runFetch, status]);

  const refresh = useCallback(() => setGeneration((g) => g + 1), []);

  const refreshSilently = useCallback(() => {
    if (controllerRef.current && !controllerRef.current.signal.aborted && status !== 'ready') return;
    const controller = new AbortController();
    controllerRef.current = controller;
    const limit = Math.max(batchSize, itemsRef.current.length);
    fetcherRef
      .current({ offset: 0, limit }, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setTotal(response.total);
        setItems(response.items.slice(0, limit));
      })
      .catch(() => undefined);
  }, [batchSize, status]);

  const updateItem = useCallback((updated: T) => {
    const id = getIdRef.current(updated);
    setItems((prev) => prev.map((item) => (getIdRef.current(item) === id ? updated : item)));
  }, []);

  return {
    items,
    total,
    status,
    error,
    hasMore,
    nextBatchSize: Math.min(batchSize, Math.max(0, total - items.length)),
    loadMore,
    retry,
    refresh,
    updateItem,
    refreshSilently,
  };
}
