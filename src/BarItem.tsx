import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { BarItemProps } from './types';
import { formatValue, getItemColor, calculateItemHeight } from './utils';

export const BarItem: React.FC<BarItemProps> = ({
  item,
  index,
  config,
  maxValue,
  containerWidth,
  containerHeight,
  totalItems
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Calculate dimensions
  const itemHeight = calculateItemHeight(containerHeight, config.chart.visibleItemCount, config.chart.itemSpacing);
  const barWidth = (item.value / maxValue) * containerWidth;
  
  // Animate bar width with spring
  const animatedWidth = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 1,
    },
    from: 0,
    to: barWidth,
  });
  
  // Animate vertical position for rank changes
  const yPosition = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 1,
    },
    from: index * (itemHeight + config.chart.itemSpacing),
    to: (item.rank - 1) * (itemHeight + config.chart.itemSpacing),
  });
  
  // Get colors
  const colors = config.bar.colors === 'auto' ? [] : config.bar.colors;
  const barColor = getItemColor(item, colors, index);
  
  // Calculate label positions
  const labelPadding = 10;
  const valueWidth = 100; // Approximate width for value text
  
  const titleX = config.labels.title.position === 'inside' 
    ? labelPadding 
    : Math.max(animatedWidth + labelPadding, labelPadding);
  
  // Animate opacity for smooth entry/exit
  const opacity = interpolate(
    frame,
    [0, 10, Math.max(0, totalItems * 2 - 10), totalItems * 2],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: yPosition,
        width: containerWidth,
        height: itemHeight,
        opacity: opacity,
        transition: config.animation.type === 'continuous' ? 'none' : 'all 0.3s ease-in-out',
      }}
    >
      {/* Bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: animatedWidth,
          height: itemHeight,
          backgroundColor: barColor,
          borderRadius: config.bar.cornerRadius,
          opacity: config.bar.opacity / 100,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      />
      
      {/* Item Image */}
      {config.images?.show && item.image && (
        <div
          style={{
            position: 'absolute',
            left: labelPadding,
            top: (itemHeight - config.images.size) / 2,
            width: config.images.size,
            height: config.images.size,
            borderRadius: config.images.borderRadius,
            overflow: 'hidden',
            zIndex: 2,
          }}
        >
          <img
            src={item.image}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
      
      {/* Rank */}
      {config.labels.rank.show && (
        <div
          style={{
            position: 'absolute',
            left: config.images?.show ? config.images.size + labelPadding * 2 : labelPadding,
            top: (itemHeight - config.labels.rank.fontSize * 1.2) / 2,
            width: config.labels.rank.fontSize * 1.5,
            height: config.labels.rank.fontSize * 1.2,
            backgroundColor: config.labels.rank.backgroundColor,
            color: config.labels.rank.textColor,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: config.labels.rank.fontSize,
            fontWeight: 'bold',
            zIndex: 2,
          }}
        >
          {item.rank}
        </div>
      )}
      
      {/* Title Label */}
      {config.labels.title.show && (
        <div
          style={{
            position: 'absolute',
            left: titleX + (config.images?.show ? config.images.size + labelPadding : 0) + (config.labels.rank.show ? config.labels.rank.fontSize * 1.5 + labelPadding : 0),
            top: (itemHeight - config.labels.title.fontSize * 1.2) / 2,
            fontSize: config.labels.title.fontSize,
            fontFamily: config.labels.title.fontFamily,
            color: config.labels.title.color,
            fontWeight: '600',
            maxWidth: containerWidth - titleX - valueWidth - labelPadding * 3,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            zIndex: 2,
            textShadow: config.labels.title.position === 'inside' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          {item.name}
        </div>
      )}
      
      {/* Value Label */}
      {config.labels.value.show && (
        <div
          style={{
            position: 'absolute',
            right: labelPadding,
            top: (itemHeight - config.labels.value.fontSize * 1.2) / 2,
            fontSize: config.labels.value.fontSize,
            fontFamily: config.labels.value.fontFamily,
            color: config.labels.value.color,
            fontWeight: '600',
            textAlign: 'right',
            minWidth: valueWidth,
            zIndex: 2,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {formatValue(
            item.value,
            config.labels.value.format,
            config.labels.value.prefix,
            config.labels.value.suffix
          )}
        </div>
      )}
    </div>
  );
};