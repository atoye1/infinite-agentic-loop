import React from 'react';
import { useVideoConfig } from 'remotion';
import { ChartLayerProps } from './types';
import { BarItem } from './BarItem';
import { getMaxValue, calculateContainerDimensions, generateColors } from './utils';

export const ChartLayer: React.FC<ChartLayerProps> = ({
  config,
  data,
  frame,
  fps
}) => {
  const { width: videoWidth, height: videoHeight } = useVideoConfig();
  
  // Calculate container dimensions
  const { width: containerWidth, height: containerHeight } = calculateContainerDimensions(
    config,
    videoWidth,
    videoHeight
  );
  
  // Get max value for scaling
  const maxValue = getMaxValue(data, config.chart.maxValue);
  
  // Sort items by value (descending) and take only visible items
  const sortedItems = [...data.items]
    .sort((a, b) => b.value - a.value)
    .slice(0, config.chart.visibleItemCount);
  
  // Generate colors if needed
  generateColors(sortedItems.length, config.bar.colors);
  
  return (
    <div
      style={{
        position: 'absolute',
        top: config.position.top,
        left: config.position.left,
        width: containerWidth,
        height: containerHeight,
        overflow: 'hidden',
      }}
    >
      {sortedItems.map((item, index) => (
        <BarItem
          key={item.id}
          item={item}
          index={index}
          config={config}
          maxValue={maxValue}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          totalItems={sortedItems.length}
        />
      ))}
      
      {/* Optional grid lines for better readability */}
      {config.chart.maxValue === 'global' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {/* Vertical grid lines */}
          {[0.25, 0.5, 0.75, 1].map((percentage) => (
            <div
              key={percentage}
              style={{
                position: 'absolute',
                left: `${percentage * 100}%`,
                top: 0,
                width: 1,
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};