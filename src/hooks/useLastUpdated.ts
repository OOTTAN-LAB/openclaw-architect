// hooks/useLastUpdated.ts ────────────────────────────────────────────────────
import { useState, useCallback, useEffect, useRef } from 'react';
import { hmacSign } from '../utils/accessibilityUtils';

const HMAC_SECRET = 'SOC_DASHBOARD_LAST_UPDATED_V1';

/**
 * Track and display last-updated timestamp with HMAC integrity
 * @param initialTime - optional initial time (default: now)
 * @returns { timestamp, formatted, hmacSig, update }
 */
export function useLastUpdated(initialTime?: Date) {
  const [timestamp, setTimestamp] = useState<number>(
    () => initialTime?.getTime() ?? Date.now()
  );
  const [hmacSig, setHmacSig] = useState<string>('');
  const countRef = useRef(0);

  // Generate HMAC whenever timestamp changes
  useEffect(() => {
    const dataStr = `lastUpdated:${timestamp}:${++countRef.current}`;
    hmacSign(dataStr, HMAC_SECRET).then(setHmacSig).catch(() => setHmacSig(''));
  }, [timestamp]);

  // Format timestamp as relative or absolute time
  const formatted = useCallback((opts?: Intl.DateTimeFormatOptions): string => {
    if (!isValidTimestamp(timestamp)) return '—';
    const date = new Date(timestamp);
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return date.toLocaleString(undefined, opts ?? {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
    }
    return date.toISOString();
  }, [timestamp]);

  // Manual update
  const update = useCallback((time?: Date | number) => {
    const ts = time instanceof Date ? time.getTime()
      : isNumber(time) ? time : Date.now();
    if (ts <= 0) return;
    setTimestamp(ts);
  }, []);

  return { timestamp, formatted, hmacSig, update };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const isValidTimestamp = (v: unknown): v is number =>
  isNumber(v) && v > 0 && v <= 8640000000000000;

const isNumber = (v: unknown): v is number => typeof v === 'number' && !isNaN(v);
