// types/accessibility.ts ──────────────────────────────────────────────────────
import type { ReactNode, CSSProperties } from 'react';

/**
 * HMAC signature verification context
 * All cross-component data must carry HMAC signature
 */
export interface HmacSignature {
  readonly sig: string;   // hex-encoded HMAC-SHA256
  readonly ts: number;    // unix timestamp (ms)
}

/**
 * WCAG 2.1 AA compliance config
 */
export interface A11yConfig {
  readonly contrastRatio: number;   // min 4.5:1 for normal text
  readonly focusIndicator: string; // CSS outline style
  readonly reducedMotion: boolean;  // prefers-reduced-motion
  readonly textZoom: number;        // 200% = 2.0
}

/**
 * ARIA live region config for dynamic content updates
 */
export interface AriaLiveRegion {
  readonly politeness: 'polite' | 'assertive' | 'off';
  readonly label: string;
  readonly atomic: boolean;
}

/**
 * Keyboard navigation item
 */
export interface KeyboardNavItem {
  readonly key: string;           // e.g. 'Enter', 'Space', 'ArrowRight'
  readonly action: () => void;
  readonly description: string;   // for screen readers
  readonly disabled?: boolean;
}

/**
 * Focus trap config for modal/drawer
 */
export interface FocusTrapConfig {
  readonly returnFocusOnDeactivate: boolean;
  readonly escapeDeactivates: boolean;
  readonly initialFocus?: string; // CSS selector
}

/**
 * Skip link target
 */
export interface SkipLinkTarget {
  readonly id: string;
  readonly label: string;
  readonly style?: CSSProperties;
}

/**
 * Announcement for screen readers
 */
export interface SRAnnouncement {
  readonly message: string;
  readonly priority: 'polite' | 'assertive';
}
