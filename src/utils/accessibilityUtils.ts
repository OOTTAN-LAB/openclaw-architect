// utils/accessibilityUtils.ts ────────────────────────────────────────────────
import type { A11yConfig, KeyboardNavItem, FocusTrapConfig } from '../types/accessibility';

// ── Input validation helpers ────────────────────────────────────────────────
const isNumber = (v: unknown): v is number => typeof v === 'number' && !isNaN(v);
const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
const isString = (v: unknown): v is string => typeof v === 'string';
const isFunction = (v: unknown): v is (...args: unknown[]) => unknown =>
  typeof v === 'function';

/**
 * Generate HMAC-SHA256 signature for cross-component data integrity
 * @param data - stringified payload
 * @param secret - shared secret key
 * @returns hex-encoded signature with timestamp
 */
export function hmacSign(data: string, secret: string): string {
  if (!isString(data) || !isString(secret)) {
    throw new Error('INVALID_ARGS: data and secret must be string');
  }
  // Dynamic import for Node crypto (browser uses web crypto)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(data);
  // Use SubtleCrypto for browser-compatible HMAC
  return crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  ).then(cryptoKey =>
    crypto.subtle.sign('HMAC', cryptoKey, msgData)
  ).then(buf =>
    Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Verify HMAC signature (async, returns boolean)
 */
export function hmacVerify(
  data: string,
  sig: string,
  secret: string
): Promise<boolean> {
  if (!isString(data) || !isString(sig) || !isString(secret)) {
    return Promise.resolve(false);
  }
  return hmacSign(data, secret).then(generated => generated === sig);
}

/**
 * Build ARIA label for interactive chart element
 */
export function buildChartAriaLabel(
  title: string,
  value: string | number,
  unit: string = ''
): string {
  if (!isString(title) || !(isString(value) || isNumber(value))) {
    return 'Chart data';
  }
  return `${title}: ${value}${unit ? ' ' + unit : ''}`.trim();
}

/**
 * Build ARIA description for drill-down panel trigger
 */
export function buildDrillDownAria(
  panelTitle: string,
  itemCount: number
): string {
  if (!isString(panelTitle) || !isNumber(itemCount)) {
    return 'Drill down panel';
  }
  return `${panelTitle} panel, ${itemCount} items available for drill-down. Press Enter to expand.`;
}

/**
 * Get WCAG-compliant focus style
 */
export function getFocusStyle(config: A11yConfig): React.CSSProperties {
  if (!config || typeof config !== 'object') {
    return { outline: '2px solid #ff9630', outlineOffset: '2px' };
  }
  return {
    outline: config.focusIndicator,
    outlineOffset: '2px',
  };
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Trap focus within a container element
 */
export function createFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  config: FocusTrapConfig
): { activate: () => void; deactivate: () => void } {
  if (!containerRef?.current || !config) {
    return { activate: () => {}, deactivate: () => {} };
  }
  const container = containerRef.current;
  const previouslyFocused = container.contains(document.activeElement)
    ? document.activeElement
    : null;

  const getFocusableElements = (): HTMLElement[] => {
    const selectors = [
      'button:not([disabled])', 'a[href]', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = getFocusableElements();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return {
    activate: () => {
      container.addEventListener('keydown', handleKeyDown);
      const initial = config.initialFocus
        ? container.querySelector<HTMLElement>(config.initialFocus)
        : getFocusableElements()[0];
      (initial || container).focus();
    },
    deactivate: () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (config.returnFocusOnDeactivate && previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    },
  };
}
