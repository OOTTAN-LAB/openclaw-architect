import { useState, useEffect, useCallback } from 'react';

/**
 * Auto-refresh hook with pause/ resume control.
 * @param callback  — function invoked on each interval
 * @param intervalMs — milliseconds between calls (default 30000 = 30s)
 */
export function useAutoRefresh(callback: () => void, intervalMs = 30000) {
  const [paused, setPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      callback();
      setLastRefresh(new Date());
    }, intervalMs);
    return () => clearInterval(id);
  }, [callback, intervalMs, paused]);

  const toggle = useCallback(() => setPaused(p => !p), []);

  return { paused, toggle, lastRefresh };
}
