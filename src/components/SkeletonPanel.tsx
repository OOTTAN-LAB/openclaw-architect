import React from 'react';

interface SkeletonPanelProps {
  height?: number;
  width?: string | number;
  borderRadius?: number;
}

/**
 * Loading skeleton with shimmer animation.
 * Displayed while data is being fetched to improve perceived performance.
 */
export function SkeletonPanel({
  height = 120,
  width = '100%',
  borderRadius = 8,
}: SkeletonPanelProps) {
  return (
    <div
      aria-busy="true"
      aria-label="載入中，請稍候"
      role="status"
      style={{
        height,
        width,
        background: 'linear-gradient(90deg, #1a1f2e 25%, #252b3d 50%, #1a1f2e 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius,
      }}
    />
  );
}

export default SkeletonPanel;
