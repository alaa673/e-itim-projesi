import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Deep links into a page: `?open=<id>` (e.g. "Başla" on the dashboard) and router state flags such as
 * `{ openCreate: true }` from header quick actions. Calls the handler once, then clears the param/state.
 */
export function useOpenParam(onOpen: (id: string) => void, enabled = true) {
  const [params, setParams] = useSearchParams();
  const id = params.get('open');
  const handler = useRef(onOpen);
  handler.current = onOpen;
  useEffect(() => {
    if (!id || !enabled) return;
    handler.current(id);
    const next = new URLSearchParams(params);
    next.delete('open');
    setParams(next, { replace: true });
  }, [id, enabled, params, setParams]);
}

export function useStateFlag(flag: string, onFlag: () => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const handler = useRef(onFlag);
  handler.current = onFlag;
  const state = location.state as Record<string, unknown> | null;
  useEffect(() => {
    if (state?.[flag]) {
      handler.current();
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [state, flag, navigate, location.pathname, location.search]);
}

/** Current value of a search param with a setter that keeps the others. */
export function useParam(name: string): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? '';
  const set = useCallback(
    (v: string) => {
      const next = new URLSearchParams(params);
      if (v) next.set(name, v);
      else next.delete(name);
      setParams(next, { replace: true });
    },
    [name, params, setParams],
  );
  return [value, set];
}
