import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Img } from 'remotion';
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
import { 
  animateOvertaking, 
  detectOvertaking, 
  OvertakingPresets 
} from './utils/OvertakingAnimations';
import { 
  createSparkleEffect,
  createBurstEffect 
} from './utils/CelebrationAnimations';

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
  
  // Enhanced overtaking detection
  const isActuallyOvertaking = detectOvertaking(item.rank, previousRank, 0);
  const overtakeIntensity = previousRank ? Math.abs(item.rank - previousRank) : 0;
  
  // Use enhanced overtaking animation system
  let yPosition: number;
  let xOffset: number = 0;
  let overtakeEffects: any = { trailOpacity: 0, glow: { shadowBlur: 0, shadowColor: 'transparent', glowScale: 1 }, zIndex: 1 };
  
  if (isActuallyOvertaking && config.animations?.overtaking?.enabled !== false) {
    // Select overtaking preset based on intensity
    const overtakePreset = overtakeIntensity > 3 ? 'dramatic' : overtakeIntensity > 1 ? 'smooth' : 'swift';
    const overtakeConfig = config.animations?.overtaking?.preset ? 
      OvertakingPresets[config.animations.overtaking.preset] : 
      OvertakingPresets[overtakePreset];
    
    const overtakeAnimation = animateOvertaking(
      frame,
      fps,
      previousRank || item.rank,
      item.rank,
      itemHeight,
      config.chart.itemSpacing,
      overtakeConfig
    );
    
    yPosition = overtakeAnimation.position.y;
    xOffset = overtakeAnimation.position.x;
    overtakeEffects = overtakeAnimation.effects;
  } else {
    // Regular position animation
    const fromY = index * (itemHeight + config.chart.itemSpacing);
    const toY = (item.rank - 1) * (itemHeight + config.chart.itemSpacing);
    
    const rankAnimationConfig = config.animations?.rank || { type: 'spring', springPreset: 'bouncy' };
    
    yPosition = rankAnimationConfig.type === 'spring' ?
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
          delay: Math.abs((previousRank || item.rank) - item.rank) * 0.05
        }
      );
  }
  
  // Dynamic color system with transitions
  const colors = config.bar.colors === 'auto' ? [] : config.bar.colors;
  const baseColor = getItemColor(item, colors, index);
  
  // Enhanced color effects with celebrations
  let barColor = baseColor;
  let celebrationEffects = { sparkle: null, burst: null };
  
  if (isNewRecord && config.animations?.effects?.recordHighlight) {
    const pulseColor = '#FFD700'; // Gold for records
    const pulseIntensity = createPulseAnimation(frame, fps, 0, 1, 3); // Fast pulse
    barColor = interpolateColor(Math.abs(pulseIntensity), baseColor, pulseColor);
    
    // Add sparkle effect for new records
    if (config.animations?.celebrations?.enabled !== false) {
      const sparkle = createSparkleEffect(
        frame,
        fps,
        animatedWidth / 2,
        itemHeight / 2,
        1.5,
        0.8
      );
      celebrationEffects.sparkle = sparkle;
    }
  } else if (isActuallyOvertaking && config.animations?.effects?.overtakeHighlight) {
    const overtakeColor = overtakeIntensity > 3 ? '#FF6B6B' : '#00FF00'; // Red for dramatic, green for normal
    const pulseIntensity = createPulseAnimation(frame, fps, 0, 0.3, 2);
    barColor = interpolateColor(Math.abs(pulseIntensity), baseColor, overtakeColor);
    
    // Add burst effect for dramatic overtakes
    if (overtakeIntensity > 3 && config.animations?.celebrations?.enabled !== false) {
      const burst = createBurstEffect(frame, fps, 0.8, 0.6);
      celebrationEffects.burst = burst;
    }
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
  
  // Base opacity - keep bars visible throughout the video
  // Simple fade in at start, no fade out
  const fadeInFrames = 5;
  
  const baseOpacity = interpolate(
    frame,
    [0, fadeInFrames],
    [0, 1],
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
        left: shakeOffset.x + xOffset,
        top: yPosition + shakeOffset.y,
        width: containerWidth,
        height: itemHeight,
        opacity: opacity,
        transform: `${entryAnimation.transform} scale(${pulseScale * overtakeEffects.glow.glowScale})`,
        transition: config.animation.type === 'continuous' ? 'none' : 'all 0.3s ease-in-out',
        zIndex: isNewRecord ? 150 : overtakeEffects.zIndex,
        filter: overtakeEffects.glow.shadowBlur > 0 ? `drop-shadow(0 0 ${overtakeEffects.glow.shadowBlur}px ${overtakeEffects.glow.shadowColor})` : 'none',
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
          background: config.animations?.effects?.gradient && (isNewRecord || isActuallyOvertaking) ?
            `linear-gradient(45deg, ${barColor}, ${barColor}88, ${barColor})` :
            barColor,
          borderRadius: config.bar.cornerRadius,
          opacity: (config.bar.opacity / 100) * (1 - overtakeEffects.trailOpacity * 0.3),
          boxShadow: isNewRecord 
            ? `0 0 20px ${barColor}, 0 4px 16px rgba(0, 0, 0, 0.2)` 
            : isActuallyOvertaking 
              ? `0 0 12px ${barColor}66, 0 2px 12px rgba(0, 0, 0, 0.15)` 
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'box-shadow 0.3s ease-in-out',
        }}
      >
        {/* Shimmer effect for special moments */}
        {(isNewRecord || isActuallyOvertaking) && config.animations?.effects?.shimmer && (
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
        
        {/* Sparkle effect for new records */}
        {celebrationEffects.sparkle && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '90%',
              transform: `translate(-50%, -50%) scale(${celebrationEffects.sparkle.scale})`,
              width: 40,
              height: 40,
              opacity: celebrationEffects.sparkle.opacity,
              filter: `blur(${celebrationEffects.sparkle.blur}px)`,
              pointerEvents: 'none',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path
                d="M20,1 L25,15 L39,15 L27,25 L32,39 L20,29 L8,39 L13,25 L1,15 L15,15 Z"
                fill="#FFD700"
                opacity="0.8"
              />
            </svg>
          </div>
        )}
        
        {/* Burst effect for dramatic overtakes */}
        {celebrationEffects.burst && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${celebrationEffects.burst.scale})`,
              width: 60,
              height: 60,
              opacity: celebrationEffects.burst.opacity,
              pointerEvents: 'none',
            }}
          >
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#FF6B6B"
                strokeWidth={celebrationEffects.burst.strokeWidth}
              />
            </svg>
          </div>
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
          <Img
            src={item.image}
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