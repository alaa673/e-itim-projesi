import { useEffect, useRef } from 'react';

/** Calls `callback` every `ms` while `active` (paused when the tab is hidden). */
export function useInterval(callback: () => void, ms: number, active = true) {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') saved.current();
    }, ms);
    return () => window.clearInterval(id);
  }, [ms, active]);
}
