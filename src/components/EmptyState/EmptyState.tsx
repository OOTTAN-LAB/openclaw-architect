// components/EmptyState/EmptyState.tsx ───────────────────────────────────────
import React, { memo, useMemo } from 'react';
import { buildDrillDownAria } from '../../utils/accessibilityUtils';

type EmptyStateVariant = 'no-data' | 'error' | 'loading' | 'no-results';

interface EmptyStateProps {
  readonly variant?: EmptyStateVariant;
  readonly title?: string;
  readonly description?: string;
  readonly icon?: React.ReactNode;
  readonly action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  readonly ariaLabel?: string;
}

/**
 * Empty / error / loading-placeholder state component for SOC dashboard
 */
export const EmptyState = memo(function EmptyState({
  variant = 'no-data',
  title,
  description,
  icon,
  action,
  ariaLabel,
}: EmptyStateProps) {
  // ── Input validation ────────────────────────────────────────────────────
  const safeVariant = ['no-data', 'error', 'loading', 'no-results'].includes(variant)
    ? variant : 'no-data';

  // ── Defaults per variant ─────────────────────────────────────────────────
  const defaults = useMemo((): Record<EmptyStateVariant, { title: string; description: string; icon: string }>(() => ({
    'no-data': {
      title: 'No Data Available',
      description: 'There is currently no data to display for this panel.',
      icon: '📊',
    },
    'error': {
      title: 'Failed to Load',
      description: 'An error occurred while loading data. Please try again.',
      icon: '⚠️',
    },
    'loading': {
      title: 'Loading...',
      description: 'Fetching the latest data, please wait.',
      icon: '⏳',
    },
    'no-results': {
      title: 'No Results Found',
      description: 'Your search or filter returned no matching results.',
      icon: '🔍',
    },
  }), []);

  const resolved = defaults[safeVariant];
  const resolvedTitle = title ?? resolved.title;
  const resolvedDesc = description ?? resolved.description;
  const resolvedIcon = icon ?? resolved.icon;
  const computedAriaLabel = ariaLabel ?? buildDrillDownAria(resolvedTitle, 0);

  // ── Styles ──────────────────────────────────────────────────────────────
  const containerStyle = useMemo((): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    textAlign: 'center',
    minHeight: 200,
    background: '#1e1e1e',
    borderRadius: 8,
    border: '1px solid #333',
    color: '#888',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  }), []);

  const iconStyle = useMemo((): React.CSSProperties => ({
    fontSize: 48,
    marginBottom: 16,
    lineHeight: 1,
  }), []);

  const titleStyle = useMemo((): React.CSSProperties => ({
    fontSize: 18,
    fontWeight: 600,
    color: '#c7d1d9',
    marginBottom: 8,
  }), []);

  const descStyle = useMemo((): React.CSSProperties => ({
    fontSize: 14,
    color: '#666',
    maxWidth: 320,
    lineHeight: 1.5,
    marginBottom: action ? 16 : 0,
  }), [action]);

  const btnStyle = useMemo((): React.CSSProperties => ({
    padding: '8px 16px',
    background: '#ff9630',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background 0.2s',
  }), []);

  return (
    <div
      role="status"
      aria-label={computedAriaLabel}
      style={containerStyle}
    >
      <div aria-hidden="true" style={iconStyle}>{resolvedIcon}</div>
      <div style={titleStyle}>{resolvedTitle}</div>
      <div style={descStyle}>{resolvedDesc}</div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          style={btnStyle}
          aria-disabled={action.disabled}
        >
          {action.label}
        </button>
      )}
    </div>
  );
});
