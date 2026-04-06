// components/DrillDownPanel/DrillDownPanel.tsx ────────────────────────────────
import React, { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { createFocusTrap } from '../../utils/accessibilityUtils';
import type { FocusTrapConfig } from '../../types/accessibility';

interface DrillDownItem {
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
  readonly severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  readonly timestamp?: string;
  readonly description?: string;
}

interface DrillDownPanelProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly items: DrillDownItem[];
  readonly onClose: () => void;
  readonly panelId?: string;
  readonly ariaLabel?: string;
  readonly focusTrapConfig?: FocusTrapConfig;
  readonly renderItemExtra?: (item: DrillDownItem) => React.ReactNode;
}

/**
 * Drill-down detail panel for SOC dashboard
 * Features: focus trap, keyboard dismiss, ARIA compliance, gradient severity badges
 */
export const DrillDownPanel = memo(function DrillDownPanel({
  isOpen,
  title,
  items,
  onClose,
  panelId = 'drill-down-panel',
  ariaLabel,
  focusTrapConfig,
  renderItemExtra,
}: DrillDownPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `${panelId}-title`;
  const descId = `${panelId}-desc`;

  // Focus trap on open
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const trap = createFocusTrap(panelRef, focusTrapConfig ?? {
      returnFocusOnDeactivate: true,
      escapeDeactivates: true,
    });
    trap.activate();
    return trap.deactivate;
  }, [isOpen, focusTrapConfig]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Severity gradient colors ────────────────────────────────────────────
  const severityColor = useCallback((sev?: string): string => {
    const map: Record<string, string> = {
      critical: '#dc2626',
      high: '#f97316',
      medium: '#eab308',
      low: '#22c55e',
      info: '#3b82f6',
    };
    return map[sev ?? 'info'] ?? '#3b82f6';
  }, []);

  const itemStyle = useMemo((): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#1e1e1e',
    borderLeft: '3px solid',
    borderRadius: 4,
    marginBottom: 8,
    cursor: 'pointer',
    transition: 'background 0.15s',
    gap: 12,
  }), []);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={items.length > 0 ? descId : undefined}
      aria-label={ariaLabel ?? `${title}, drill-down panel`}
      id={panelId}
      style={{
        position: 'fixed',
        top: 0, right: 0,
        width: '100%',
        maxWidth: 480,
        height: '100vh',
        background: '#1e1e1e',
        borderLeft: '1px solid #333',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid #333',
      }}>
        <h2 id={titleId} style={{ margin: 0, fontSize: 18, color: '#c7d1d9' }}>
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close drill-down panel"
          style={{
            background: 'none', border: 'none', color: '#888',
            fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: 4,
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div
        id={descId}
        role="list"
        aria-label={`${title} items`}
        style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}
      >
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '32px 0' }}>
            No items to display
          </div>
        ) : items.map(item => (
          <div
            key={item.id}
            role="listitem"
            tabIndex={0}
            style={{ ...itemStyle, borderLeftColor: severityColor(item.severity) }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1e1e1e')}
            onKeyDown={e => { if (e.key === 'Enter') renderItemExtra?.(item); }}
            aria-label={`${item.label}: ${item.value}${item.severity ? `, severity: ${item.severity}` : ''}`}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#c7d1d9', fontSize: 14 }}>
                {item.label}
              </div>
              {item.description && (
                <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                  {item.description}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, color: severityColor(item.severity), fontSize: 16 }}>
                {item.value}
              </div>
              {item.timestamp && (
                <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                  {item.timestamp}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
