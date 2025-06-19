import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { BarItemProps } from './types';
import { formatValue, getItemColor, calculateItemHeight } from './utils';
import { 
  createAdvancedAnimation, 
  createShakeAnimation, 
  createPulseAnimation, 
  interpolateColor,
  createRevealAnimation,
  SpringPresets 
} from './utils/AnimationUtils';

export const BarItem: React.FC<BarItemProps> = ({
  item,
  index,
  config,
  maxValue,
  containerWidth,
  containerHeight,
  totalItems,
  previousRank,
  isNewRecord,
  isOvertaking
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Calculate dimensions
  const itemHeight = calculateItemHeight(containerHeight, config.chart.visibleItemCount, config.chart.itemSpacing);
  const barWidth = (item.value / maxValue) * containerWidth;
  
  // Advanced bar width animation with configurable effects
  const animationConfig = config.animations?.bar || { type: 'spring', springPreset: 'gentle' };
  
  const animatedWidth = animationConfig.type === 'spring' ? 
    spring({
      frame,
      fps,
      config: SpringPresets[animationConfig.springPreset as keyof typeof SpringPresets] || SpringPresets.gentle,
      from: 0,
      to: barWidth,
    }) :
    createAdvancedAnimation(
      frame,
      fps,
      0,
      barWidth,
      {
        type: 'interpolate',
        duration: animationConfig.duration || 1,
        easing: animationConfig.easing || 'easeOutCubic',
        delay: index * (animationConfig.staggerDelay || 0.1)
      }
    );
  
  // Advanced vertical position animation for rank changes
  const fromY = index * (itemHeight + config.chart.itemSpacing);
  const toY = (item.rank - 1) * (itemHeight + config.chart.itemSpacing);
  
  const rankAnimationConfig = config.animations?.rank || { type: 'spring', springPreset: 'bouncy' };
  
  const yPosition = rankAnimationConfig.type === 'spring' ?
    spring({
      frame,
      fps,
      config: SpringPresets[rankAnimationConfig.springPreset as keyof typeof SpringPresets] || SpringPresets.bouncy,
      from: fromY,
      to: toY,
    }) :
    createAdvancedAnimation(
      frame,
      fps,
      fromY,
      toY,
      {
        type: 'interpolate',
        duration: rankAnimationConfig.duration || 0.8,
        easing: rankAnimationConfig.easing || 'easeInOutElastic',
        delay: Math.abs(previousRank - item.rank) * 0.05 // Longer distance = more delay
      }
    );
  
  // Dynamic color system with transitions
  const colors = config.bar.colors === 'auto' ? [] : config.bar.colors;
  const baseColor = getItemColor(item, colors, index);
  
  // Special color effects
  let barColor = baseColor;
  if (isNewRecord && config.animations?.effects?.recordHighlight) {
    const pulseColor = '#FFD700'; // Gold for records
    const pulseIntensity = createPulseAnimation(frame, fps, 0, 1, 3); // Fast pulse
    barColor = interpolateColor(Math.abs(pulseIntensity), baseColor, pulseColor);
  } else if (isOvertaking && config.animations?.effects?.overtakeHighlight) {
    const overtakeColor = '#00FF00'; // Green for overtaking
    const pulseIntensity = createPulseAnimation(frame, fps, 0, 0.3, 2);
    barColor = interpolateColor(Math.abs(pulseIntensity), baseColor, overtakeColor);
  }
  
  // Calculate label positions
  const labelPadding = 10;
  const valueWidth = 100; // Approximate width for value text
  
  const titleX = config.labels.title.position === 'inside' 
    ? labelPadding 
    : Math.max(animatedWidth + labelPadding, labelPadding);
  
  // Advanced entry/exit animations
  const entryConfig = config.animations?.entry || { effect: 'fade', duration: 0.5, delay: index * 0.1 };
  const entryAnimation = createRevealAnimation(
    frame,
    fps,
    entryConfig.effect as any,
    entryConfig.duration,
    entryConfig.delay
  );
  
  // Base opacity with smooth entry/exit
  const baseOpacity = interpolate(
    frame,
    [0, 10, Math.max(0, totalItems * 2 - 10), totalItems * 2],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  const opacity = baseOpacity * entryAnimation.opacity;
  
  // Shake effect for dramatic moments
  const shakeOffset = (isNewRecord || isOvertaking) && config.animations?.effects?.shake ?
    createShakeAnimation(frame, fps, isNewRecord ? 8 : 4, 0.5) :
    { x: 0, y: 0 };
  
  // Pulse effect for highlighting
  const pulseScale = (isNewRecord || isOvertaking) && config.animations?.effects?.pulse ?
    createPulseAnimation(frame, fps, 1, isNewRecord ? 0.1 : 0.05, 2) :
    1;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: shakeOffset.x,
        top: yPosition + shakeOffset.y,
        width: containerWidth,
        height: itemHeight,
        opacity: opacity,
        transform: `${entryAnimation.transform} scale(${pulseScale})`,
        transition: config.animation.type === 'continuous' ? 'none' : 'all 0.3s ease-in-out',
        zIndex: isNewRecord ? 100 : isOvertaking ? 50 : 1,
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
          background: config.animations?.effects?.gradient && (isNewRecord || isOvertaking) ?
            `linear-gradient(45deg, ${barColor}, ${barColor}88, ${barColor})` :
            barColor,
          borderRadius: config.bar.cornerRadius,
          opacity: config.bar.opacity / 100,
          boxShadow: isNewRecord 
            ? `0 0 20px ${barColor}, 0 4px 16px rgba(0, 0, 0, 0.2)` 
            : isOvertaking 
              ? `0 0 12px ${barColor}66, 0 2px 12px rgba(0, 0, 0, 0.15)` 
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'box-shadow 0.3s ease-in-out',
        }}
      >
        {/* Shimmer effect for special moments */}
        {(isNewRecord || isOvertaking) && config.animations?.effects?.shimmer && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: -100,
              width: '100px',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              transform: `translateX(${animatedWidth + 100}px)`,
              transition: 'transform 0.8s ease-in-out',
            }}
          />
        )}
      </div>
      
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