import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_BATCH_SIZE } from '@/config/constants';
import type { PaginatedResponse, PaginationParams } from '@/types';
import { ApiError } from '@/utils/errorHandling';
import { useIncrementalList } from './useIncrementalList';

interface Row {
  id: string;
}

const makeRows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: `r${i + 1}` }));

function makeFetcher(rows: Row[]) {
  return vi.fn(
    async (page: PaginationParams): Promise<PaginatedResponse<Row>> => ({
      items: rows.slice(page.offset, page.offset + page.limit),
      total: rows.length,
      offset: page.offset,
      limit: page.limit,
    }),
  );
}

describe('useIncrementalList (20-record batches)', () => {
  it('uses a batch size of 20', () => {
    expect(TABLE_BATCH_SIZE).toBe(20);
  });

  it('loads at most 20 records first, then 20 more per click, then the remainder', async () => {
    const fetcher = makeFetcher(makeRows(47));
    const { result } = renderHook(() => useIncrementalList(fetcher, (r) => r.id, 'q'));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items).toHaveLength(20);
    expect(result.current.total).toBe(47);
    expect(result.current.nextBatchSize).toBe(20);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(40));
    expect(result.current.nextBatchSize).toBe(7);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(47));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.nextBatchSize).toBe(0);

    // every request asked for exactly one batch
    for (const [page] of fetcher.mock.calls) expect(page.limit).toBe(20);
    expect(fetcher.mock.calls.map(([page]) => page.offset)).toEqual([0, 20, 40]);
  });

  it('never shows duplicate rows even if the server repeats records', async () => {
    const rows = makeRows(30);
    const fetcher = vi.fn(async (page: PaginationParams): Promise<PaginatedResponse<Row>> => {
      // overlapping page: returns rows 15..34 for the second request
      const start = page.offset === 0 ? 0 : 15;
      return { items: rows.slice(start, start + page.limit), total: rows.length, offset: page.offset, limit: page.limit };
    });
    const { result } = renderHook(() => useIncrementalList(fetcher, (r) => r.id, 'q'));
    await waitFor(() => expect(result.current.items).toHaveLength(20));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const ids = result.current.items.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('caps a batch at 20 even if the server returns more', async () => {
    const rows = makeRows(60);
    const fetcher = vi.fn(async (): Promise<PaginatedResponse<Row>> => ({ items: rows, total: 60, offset: 0, limit: 60 }));
    const { result } = renderHook(() => useIncrementalList(fetcher, (r) => r.id, 'q'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items).toHaveLength(20);
  });

  it('restarts from the first batch when the query (search/filter) changes', async () => {
    const all = makeRows(50);
    const filtered = makeRows(8);
    const fetcher = vi.fn(async (page: PaginationParams, _signal: AbortSignal, key?: string): Promise<PaginatedResponse<Row>> => {
      const source = key === 'filtered' ? filtered : all;
      return { items: source.slice(page.offset, page.offset + page.limit), total: source.length, offset: page.offset, limit: page.limit };
    });
    const { result, rerender } = renderHook(({ key }) => useIncrementalList((page, signal) => fetcher(page, signal, key), (r) => r.id, key), {
      initialProps: { key: 'all' },
    });
    await waitFor(() => expect(result.current.items).toHaveLength(20));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(40));

    rerender({ key: 'filtered' });
    await waitFor(() => expect(result.current.total).toBe(8));
    expect(result.current.items).toHaveLength(8);
    expect(result.current.hasMore).toBe(false);
  });

  it('keeps already displayed rows when loading the next batch fails, and retry continues', async () => {
    const rows = makeRows(45);
    let fail = false;
    const fetcher = vi.fn(async (page: PaginationParams): Promise<PaginatedResponse<Row>> => {
      if (fail) throw new ApiError('network');
      return { items: rows.slice(page.offset, page.offset + page.limit), total: rows.length, offset: page.offset, limit: page.limit };
    });
    const { result } = renderHook(() => useIncrementalList(fetcher, (r) => r.id, 'q'));
    await waitFor(() => expect(result.current.items).toHaveLength(20));

    fail = true;
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.status).toBe('loadMoreError'));
    expect(result.current.items).toHaveLength(20);

    fail = false;
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.items).toHaveLength(40));
    expect(fetcher.mock.calls.at(-1)?.[0].offset).toBe(20);
  });
});
