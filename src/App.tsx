import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { StatCards } from './components/StatCards';
import { KillChain } from './components/KillChain';
import { ATTACKMatrix } from './components/ATTACKMatrix';
import { AssetGraph } from './components/AssetGraph';
import { AlertTimeline } from './components/AlertTimeline';
import { AIAnalysis } from './components/AIAnalysis';
import { CaseGraph } from './components/CaseGraph';
import { Drawer } from './components/Drawer';
import { SkeletonLoader } from './components/Skeleton/SkeletonLoader';
import { EmptyState } from './components/EmptyState/EmptyState';
import { DrillDownPanel } from './components/DrillDownPanel/DrillDownPanel';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { useLastUpdated } from './hooks/useLastUpdated';
import { buildDrillDownAria } from './utils/accessibilityUtils';

// ── Types ──────────────────────────────────────────────────────────────────
export interface DrawerData {
  title: string; content: string;
  items?: Array<{ id: string; label: string; value: string | number; severity?: string; timestamp?: string; description?: string; }>;
}

// ── App Component ──────────────────────────────────────────────────────────
function App() {
  const [drawer, setDrawer] = useState<DrawerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Auto-refresh (30s) + last-updated tracking ──────────────────────────
  const { isPaused, toggle, lastRefresh } = useAutoRefresh(30000, () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 600);
  });

  const { formatted } = useLastUpdated(lastRefresh);

  // ── Drill-down open/close ────────────────────────────────────────────────
  const openDrawer = useCallback((title: string, content: string, items?: DrawerData['items']) => {
    setDrawer({ title, content, items });
  }, []);

  const closeDrawer = useCallback(() => setDrawer(null), []);

  // ── Escape key ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawer) setDrawer(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [drawer]);

  // ── Global styles ───────────────────────────────────────────────────────
  const mainStyle = useMemo((): React.CSSProperties => ({
    background: '#1e1e1e', minHeight: '100vh', color: '#c7d1d9',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  }), []);

  const containerStyle = useMemo((): React.CSSProperties => ({
    padding: '12px 16px', maxWidth: 1600, margin: '0 auto',
  }), []);

  const topRowStyle = useMemo((): React.CSSProperties => ({
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12,
  }), []);

  const midRowStyle = useMemo((): React.CSSProperties => ({
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12,
  }), []);

  return (
    <div style={mainStyle}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (max-width: 1024px) { .top-row { grid-template-columns: repeat(2, 1fr) !important; } .mid-row { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { .top-row { grid-template-columns: 1fr !important; } .mid-row { grid-template-columns: 1fr !important; } }
        @media (max-width: 375px) { .top-row { grid-template-columns: 1fr !important; } .mid-row { grid-template-columns: 1fr !important; } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1e1e1e; }
        ::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #4a4a4a; }
        :focus-visible { outline: 2px solid #ff9630; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      <TopBar lastRefresh={lastRefresh} isPaused={isPaused} onTogglePause={toggle} />

      <main style={containerStyle} role="main" aria-label="SOC Dashboard main content">
        {/* Loading / skeleton state for stat row */}
        <div aria-live="polite" aria-label="Dashboard refresh status">
          {isLoading
            ? <SkeletonLoader count={3} variant="card" ariaLabel="Loading dashboard statistics" />
            : <StatCards isLoading={false} />
          }
        </div>

        {/* Row 1 */}
        <div style={topRowStyle} className="top-row" role="region" aria-label="Threat visualization panels">
          <KillChain openDrawer={openDrawer} />
          <ATTACKMatrix openDrawer={openDrawer} />
          <AssetGraph openDrawer={openDrawer} />
        </div>

        {/* Row 2 */}
        <div style={midRowStyle} className="mid-row" role="region" aria-label="Alert and analysis panels">
          {isLoading
            ? <SkeletonLoader variant="chart" ariaLabel="Loading alert timeline" />
            : <AlertTimeline openDrawer={openDrawer} isLoading={false} />
          }
          {isLoading
            ? <SkeletonLoader variant="chart" ariaLabel="Loading AI analysis" />
            : <AIAnalysis openDrawer={openDrawer} isLoading={false} />
          }
        </div>

        {/* Row 3 */}
        <CaseGraph openDrawer={openDrawer} isLoading={isLoading} />
      </main>

      {/* Original Drawer for legacy content */}
      <Drawer drawer={drawer} onClose={closeDrawer} />

      {/* New DrillDownPanel for structured data */}
      <DrillDownPanel
        isOpen={Boolean(drawer?.items?.length)}
        title={drawer?.title ?? ''}
        items={drawer?.items ?? []}
        onClose={closeDrawer}
        ariaLabel={drawer ? buildDrillDownAria(drawer.title, drawer.items?.length ?? 0) : undefined}
      />

      {/* Skip link */}
      <a href="#main-content"
        style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}
        onFocus={e => {
          const a = e.currentTarget as HTMLAnchorElement;
          a.style.position = 'fixed'; a.style.top = '10px'; a.style.left = '10px';
          a.style.width = 'auto'; a.style.height = 'auto'; a.style.zIndex = '9999';
          a.style.padding = '8px 16px'; a.style.background = '#ff9630'; a.style.color = '#fff';
          a.style.borderRadius = '4px'; a.style.fontSize = '12px'; a.style.textDecoration = 'none';
        }}
        onBlur={e => {
          const a = e.currentTarget as HTMLAnchorElement;
          a.style.position = 'absolute'; a.style.left = '-9999px'; a.style.width = '1px'; a.style.height = '1px';
        }}
      >
        Skip to main content
      </a>
    </div>
  );
}

export default App;
