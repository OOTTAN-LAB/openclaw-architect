// hooks/useKeyboardNav.ts ────────────────────────────────────────────────────
import { useEffect, useCallback, useRef } from 'react';
import type { KeyboardNavItem } from '../types/accessibility';

/**
 * Keyboard navigation hook for dashboard panels
 * @param items - ordered list of keyboard navigation items
 * @param enabled - whether keyboard nav is active
 * @returns { activeIndex, setActiveIndex, reset }
 */
export function useKeyboardNav(
  items: KeyboardNavItem[],
  enabled: boolean = true
) {
  const [activeIndex, setActiveIndex] = useStateRef(0);
  const itemsRef = useRef(items);

  // Keep items ref current
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Register global keydown handler
  useEffect(() => {
    if (!enabled || !Array.isArray(itemsRef.current)) return;

    const handleKey = (e: KeyboardEvent) => {
      const currentItems = itemsRef.current;
      if (!currentItems.length) return;

      const target = e.target as HTMLElement;
      const isInputLike = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (isInputLike) return;

      const keyActions: Record<string, () => void> = {
        ArrowRight: () => setActiveIndex(i => Math.min(i + 1, currentItems.length - 1)),
        ArrowLeft: () => setActiveIndex(i => Math.max(i - 1, 0)),
        ArrowDown: () => setActiveIndex(i => Math.min(i + 1, currentItems.length - 1)),
        ArrowUp: () => setActiveIndex(i => Math.max(i - 1, 0)),
        Home: () => setActiveIndex(0),
        End: () => setActiveIndex(currentItems.length - 1),
        Enter: () => { currentItems[activeIndex]?.action(); },
        Space: () => { currentItems[activeIndex]?.action(); },
      };

      const handler = keyActions[e.key];
      if (!handler) return;
      e.preventDefault();
      handler();
    };

    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [enabled, setActiveIndex, activeIndex]);

  const reset = useCallback(() => setActiveIndex(0), [setActiveIndex]);

  return { activeIndex, setActiveIndex, reset };
}

// ── useStateRef: useState with stable set API ──────────────────────────────
function useStateRef<T>(initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const { useState } = require('react');
  return useState<T>(initial);
}
