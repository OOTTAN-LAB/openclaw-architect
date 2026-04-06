// components/Skeleton/SkeletonLoader.tsx
import React, { memo, useMemo } from 'react';
interface SkeletonProps {
  readonly width?: string | number;
  readonly height?: string | number;
  readonly borderRadius?: string | number;
  readonly className?: string;
}
interface SkeletonLoaderProps {
  readonly count?: number;
  readonly variant?: 'text' | 'card' | 'chart' | 'circle';
  readonly width?: string | number;
  readonly height?: string | number;
  readonly ariaLabel?: string;
  readonly animation?: 'shimmer' | 'pulse' | 'none';
}
const SkeletonUnit = memo(function SkeletonUnit({
  width = '100%', height = 16, borderRadius = 4, className,
}: SkeletonProps) {
  const style = useMemo((): React.CSSProperties => ({
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }), [width, height, borderRadius]);
  return (
    <div className={className} style={style} role="status" aria-label="Loading..." />
  );
});
export const SkeletonLoader = memo(function SkeletonLoader({
  count = 3, variant = 'text', width, height,
  ariaLabel = 'Loading dashboard content', animation = 'shimmer',
}: SkeletonLoaderProps) {
  const safeCount = Math.max(1, Math.min(count, 20));
  const safeVariant = ['text', 'card', 'chart', 'circle'].includes(variant) ? variant : 'text';
  const baseStyle = useMemo((): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', gap: 8, padding: 16,
  }), []);
  const cardStyle = useMemo((): React.CSSProperties => ({
    ...baseStyle, background: '#252525', borderRadius: 8, border: '1px solid #333',
  }), [baseStyle]);
  const renderVariant = (index: number) => {
    switch (safeVariant) {
      case 'card':
        return (
          <div key={index} style={cardStyle}>
            <SkeletonUnit height={24} width="60%" borderRadius={6} />
            <SkeletonUnit height={80} borderRadius={4} />
            <SkeletonUnit height={16} width="80%" />
          </div>
        );
      case 'chart':
        return (
          <div key={index} style={cardStyle}>
            <SkeletonUnit height={200} borderRadius={4} />
            <SkeletonUnit height={12} width="40%" />
          </div>
        );
      case 'circle':
        return <SkeletonUnit key={index} width={64} height={64} borderRadius="50%" />;
      case 'text':
      default:
        return (
          <div key={index} style={{ ...baseStyle, flexDirection: 'row', gap: 12 }}>
            <SkeletonUnit width={16} height={16} borderRadius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonUnit height={14} width="75%" />
              <SkeletonUnit height={10} width="50%" />
            </div>
          </div>
        );
    }
  };
  return (
    <div role="status" aria-label={ariaLabel} aria-busy="true"
      style={safeVariant === 'text' ? baseStyle : { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
      {Array.from({ length: safeCount }, (_, i) => renderVariant(i))}
      <span className="sr-only">Loading...</span>
    </div>
  );
});
