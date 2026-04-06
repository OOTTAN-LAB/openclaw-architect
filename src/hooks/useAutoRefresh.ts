// hooks/useAutoRefresh.ts ────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from 'react';
import { hmacSign } from '../utils/accessibilityUtils';

const HMAC_SECRET = 'SOC_DASHBOARD_AUTO_REFRESH_V1';

/**
 * 30-second auto-refresh hook with pause/resume + HMAC signing
 * @param intervalMs - refresh interval in ms (default 30000)
 * @param onRefresh - callback fired on each refresh
 * @returns { isPaused, toggle, lastRefresh, signature }
 */
export function useAutoRefresh(
  intervalMs: number = 30000,
  onRefresh?: () => void
) {
  const [isPaused, setIsPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(() => new Date());
  const [signature, setSignature] = useState<string>('');
  const callbackRef = useRef(onRefresh);

  // Keep callback ref current
  useEffect(() => { callbackRef.current = onRefresh; }, [onRefresh]);

  // Main refresh interval
  useEffect(() => {
    if (isPaused) return;
    if (!isNumber(intervalMs) || intervalMs < 1000) return;

    const id = setInterval(async () => {
      const ts = Date.now();
      const dataStr = `refresh:${ts}`;
      const sig = await hmacSign(dataStr, HMAC_SECRET);
      setSignature(sig);
      setLastRefresh(new Date(ts));
      callbackRef.current?.();
    }, intervalMs);

    return () => clearInterval(id);
  }, [isPaused, intervalMs]);

  const toggle = useCallback(() => {
    setIsPaused(p => !p);
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  return { isPaused, toggle, pause, resume, lastRefresh, signature };
}

// ── Type guard ─────────────────────────────────────────────────────────────
const isNumber = (v: unknown): v is number => typeof v === 'number' && !isNaN(v);
