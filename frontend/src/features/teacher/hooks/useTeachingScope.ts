import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/authContext';
import { teachingScopeApi } from '../services/teacherApi';
import type { TeachingScope } from '../types';

/** One request per signed-in teacher; every teacher page shares it. */
let cache: { userId: string; promise: Promise<TeachingScope> } | null = null;

function load(userId: string): Promise<TeachingScope> {
  if (!cache || cache.userId !== userId) {
    const promise = teachingScopeApi();
    cache = { userId, promise };
    promise.catch(() => {
      if (cache?.promise === promise) cache = null; // allow a retry after a failure
    });
  }
  return cache.promise;
}

/**
 * Classes and topics the signed-in teacher works with (from the server, never hard-coded).
 * `enabled: false` skips the request (e.g. a shared page opened by an administrator).
 */
export function useTeachingScope(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [state, setState] = useState<{ data: TeachingScope | null; error: unknown }>({ data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !userId) return;
    let alive = true;
    load(userId).then(
      (data) => alive && setState({ data, error: null }),
      (error: unknown) => alive && setState({ data: null, error }),
    );
    return () => {
      alive = false;
    };
  }, [enabled, userId, attempt]);

  const data = state.data;
  const classNames = useMemo(() => (data?.classes ?? []).map((c) => c.name), [data]);
  const allTopics = useMemo(() => [...new Set(Object.values(data?.topicsByClass ?? {}).flat())].sort((a, b) => a.localeCompare(b, 'tr')), [data]);
  const topicsFor = useCallback((className: string) => data?.topicsByClass[className] ?? [], [data]);
  /** Subject of the first of `classNames` (or of the teacher's first class). */
  const subjectOf = useCallback(
    (classNames: string[] = []) => data?.classes.find((c) => classNames.includes(c.name))?.subject ?? data?.classes[0]?.subject ?? '',
    [data],
  );
  const retry = useCallback(() => {
    setState({ data: null, error: null });
    setAttempt((n) => n + 1);
  }, []);

  return { scope: data, loading: enabled && !data && !state.error, error: state.error, classNames, allTopics, topicsFor, subjectOf, retry };
}

/** Test helper: forget the cached scope (e.g. between test cases). */
export function resetTeachingScopeCache() {
  cache = null;
}
