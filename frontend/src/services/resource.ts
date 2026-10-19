import { IS_MOCK_MODE } from '@/config/constants';
import type { Collection } from '@/mocks/collection';
import type { ListQuery } from '@/types';
import type { PaginatedResponse } from '@/types';
import { api } from './api';

/**
 * Generic REST resource with a mock twin.
 * Real mode calls the (provisional) endpoint: GET list with offset/limit/search/filters/sort,
 * GET /:id, POST, PATCH /:id, DELETE /:id. Mock mode reads and writes the in-memory collection.
 * Contracts are proposals — see docs/BACKEND_API_REQUIREMENTS.md.
 */
export interface ResourceService<T, TInput> {
  list(query: ListQuery, signal?: AbortSignal): Promise<PaginatedResponse<T>>;
  get(id: string, signal?: AbortSignal): Promise<T>;
  create(input: TInput): Promise<T>;
  update(id: string, input: Partial<TInput>): Promise<T>;
  remove(id: string): Promise<void>;
}

/** The in-memory twin: a collection, or a function returning one (per-profile stores, lazy imports). */
export type MockSource<T extends { id: string }> = Collection<T> | (() => Collection<T> | Promise<Collection<T>>);

export async function resolveMock<T extends { id: string }>(source: MockSource<T>): Promise<Collection<T>> {
  return typeof source === 'function' ? source() : source;
}

export function createResourceService<T extends { id: string }, TInput>(
  endpoint: string,
  mockSource: MockSource<T>,
  build: {
    /** Mock only: turns form input into a stored record. */
    create: (input: TInput) => T;
    /** Mock only: applies an edit; defaults to a shallow merge. */
    update?: (current: T, input: Partial<TInput>) => Partial<T>;
  },
): ResourceService<T, TInput> {
  const path = (id: string) => `${endpoint}/${encodeURIComponent(id)}`;
  return {
    async list(query, signal) {
      if (IS_MOCK_MODE) return (await resolveMock(mockSource)).list(query, signal);
      return api.get<PaginatedResponse<T>>(endpoint, {
        signal,
        query: {
          offset: query.offset,
          limit: query.limit,
          search: query.search?.trim(),
          sort: query.sortKey,
          order: query.sortDirection,
          ...query.filters,
        },
      });
    },
    async get(id, signal) {
      if (IS_MOCK_MODE) return (await resolveMock(mockSource)).get(id, signal);
      return api.get<T>(path(id), { signal });
    },
    async create(input) {
      if (IS_MOCK_MODE) return (await resolveMock(mockSource)).insert(build.create(input));
      return api.post<T>(endpoint, input);
    },
    async update(id, input) {
      if (IS_MOCK_MODE) {
        const mock = await resolveMock(mockSource);
        const current = mock.find(id);
        const change = current && build.update ? build.update(current, input) : (input as unknown as Partial<T>);
        return mock.patch(id, change);
      }
      return api.patch<T>(path(id), input);
    },
    async remove(id) {
      if (IS_MOCK_MODE) return (await resolveMock(mockSource)).remove(id);
      return api.delete<void>(path(id));
    },
  };
}

/** Runs the mock implementation in mock mode and the real request otherwise (custom, non-CRUD actions). */
export function mockOr<T>(real: () => Promise<T>, mock: () => Promise<T>): Promise<T> {
  return IS_MOCK_MODE ? mock() : real();
}
