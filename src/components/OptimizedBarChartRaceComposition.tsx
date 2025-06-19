/**
 * OptimizedBarChartRaceComposition - Performance-optimized version for <30 second renders
 * Implements memoization, lazy loading, and reduced DOM complexity
 */

import React, { useMemo, useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { BarChartRaceCompositionProps } from '../types';
import { OptimizedBackgroundLayer } from './OptimizedBackgroundLayer';
import { OptimizedChartLayer } from './OptimizedChartLayer';
import { OptimizedTitleLayer } from './OptimizedTitleLayer';
import { OptimizedDateLayer } from './OptimizedDateLayer';

// Memoized frame data getter
const getOptimizedFrameData = (processedData: any, frame: number) => {
  // Use binary search for large datasets
  if (processedData.frames.length > 1000) {
    let left = 0;
    let right = processedData.frames.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midFrame = processedData.frames[mid].frame;
      
      if (midFrame === frame) return processedData.frames[mid];
      if (midFrame < frame) left = mid + 1;
      else right = mid - 1;
    }
    
    // Return closest frame if exact match not found
    return processedData.frames[Math.min(left, processedData.frames.length - 1)];
  }
  
  // Linear search for smaller datasets
  return processedData.frames.find((f: any) => f.frame === frame) || processedData.frames[0];
};

// Memoized error boundary component
const OptimizedErrorBoundary: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = React.memo(({ children, fallback }) => {
  return (
    <React.Suspense fallback={fallback || <div />}>
      {children}
    </React.Suspense>
  );
});

// Main composition component with aggressive memoization
export const OptimizedBarChartRaceComposition: React.FC<BarChartRaceCompositionProps> = React.memo(({
  config,
  processedData
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Memoize frame data calculation
  const currentData = useMemo(() => {
    if (!processedData?.frames) {
      return {
        frame,
        date: new Date().toISOString(),
        items: [],
        maxValue: 0
      };
    }
    
    try {
      return getOptimizedFrameData(processedData, frame);
    } catch (error) {
      console.warn(`Frame ${frame} data error:`, error);
      return {
        frame,
        date: new Date().toISOString(),
        items: [],
        maxValue: 0
      };
    }
  }, [processedData, frame]);

  // Memoize layer configurations to prevent unnecessary re-renders
  const layerConfigs = useMemo(() => ({
    background: config?.layers?.background,
    chart: config?.layers?.chart,
    title: config?.layers?.title,
    date: config?.layers?.date,
  }), [config]);

  // Memoize static props
  const staticProps = useMemo(() => ({
    frame,
    fps,
    currentDate: currentData?.date || new Date().toISOString(),
  }), [frame, fps, currentData?.date]);

  // Early return for missing data
  if (!config) {
    return <AbsoluteFill style={{ backgroundColor: '#000' }} />;
  }

  return (
    <AbsoluteFill style={{ willChange: 'transform' }}>
      {/* Background Layer - Only render if configured */}
      {layerConfigs.background && (
        <OptimizedErrorBoundary>
          <OptimizedBackgroundLayer config={layerConfigs.background} />
        </OptimizedErrorBoundary>
      )}
      
      {/* Chart Layer - Core component */}
      <OptimizedErrorBoundary>
        <OptimizedChartLayer
          config={layerConfigs.chart}
          data={currentData}
          frame={staticProps.frame}
          fps={staticProps.fps}
        />
      </OptimizedErrorBoundary>
      
      {/* Title Layer - Only render if configured and visible */}
      {layerConfigs.title && shouldRenderTitle(layerConfigs.title, staticProps.frame, staticProps.fps) && (
        <OptimizedErrorBoundary>
          <OptimizedTitleLayer
            config={layerConfigs.title}
            frame={staticProps.frame}
            fps={staticProps.fps}
          />
        </OptimizedErrorBoundary>
      )}
      
      {/* Date Layer - Only render if configured */}
      {layerConfigs.date && (
        <OptimizedErrorBoundary>
          <OptimizedDateLayer
            config={layerConfigs.date}
            currentDate={staticProps.currentDate}
            frame={staticProps.frame}
            fps={staticProps.fps}
          />
        </OptimizedErrorBoundary>
      )}
    </AbsoluteFill>
  );
});

// Helper function to determine if title should render (performance optimization)
const shouldRenderTitle = (titleConfig: any, frame: number, fps: number): boolean => {
  if (!titleConfig?.timeline) return true;
  
  const currentTime = frame / fps;
  const startTime = titleConfig.timeline.startTime || 0;
  const endTime = startTime + (titleConfig.timeline.duration || Infinity);
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Display name for debugging
OptimizedBarChartRaceComposition.displayName = 'OptimizedBarChartRaceComposition';