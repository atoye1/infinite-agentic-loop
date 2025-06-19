/**
 * Milestone Indicator System
 * Dynamic milestone detection, visualization, and celebration effects
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { createAdvancedAnimation, createPulseAnimation, EasingFunctions } from '../utils/AnimationUtils';
import { MilestoneConfig, CelebrationEffect, DataItem } from '../types';
import CelebrationEffects from './CelebrationEffects';
import AnimatedText from './AnimatedText';

export interface Milestone {
  id: string;
  type: 'value' | 'rank' | 'time' | 'custom';
  threshold: number;
  itemId?: string; // For item-specific milestones
  title: string;
  description: string;
  achieved: boolean;
  achievedFrame?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  visual: {
    icon: string;
    color: string;
    size: number;
    position: { x: number; y: number };
    duration: number; // seconds
  };
  celebration?: CelebrationEffect;
}

interface MilestoneSystemProps {
  config: MilestoneConfig;
  currentData: DataItem[];
  previousData?: DataItem[];
  containerWidth: number;
  containerHeight: number;
  frame: number;
  fps: number;
}

export const MilestoneSystem: React.FC<MilestoneSystemProps> = ({
  config,
  currentData,
  previousData,
  containerWidth,
  containerHeight,
  frame,
  fps,
}) => {
  if (!config.enabled) return null;

  // Detect milestones
  const activeMilestones = React.useMemo(() => {
    return detectMilestones(
      config,
      currentData,
      previousData,
      frame,
      containerWidth,
      containerHeight
    );
  }, [config, currentData, previousData, frame, containerWidth, containerHeight]);

  // Generate celebrations from milestones
  const celebrations: CelebrationEffect[] = activeMilestones
    .filter(milestone => milestone.celebration)
    .map(milestone => milestone.celebration!);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerWidth,
        height: containerHeight,
        pointerEvents: 'none',
        zIndex: 500,
      }}
    >
      {/* Milestone Indicators */}
      {activeMilestones.map((milestone) => (
        <MilestoneIndicator
          key={milestone.id}
          milestone={milestone}
          frame={frame}
          fps={fps}
        />
      ))}

      {/* Celebration Effects */}
      {celebrations.length > 0 && (
        <CelebrationEffects
          celebrations={celebrations}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          frame={frame}
          fps={fps}
        />
      )}

      {/* Achievement Notifications */}
      <AchievementNotifications
        milestones={activeMilestones}
        frame={frame}
        fps={fps}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
      />
    </div>
  );
};

const MilestoneIndicator: React.FC<{
  milestone: Milestone;
  frame: number;
  fps: number;
}> = ({ milestone, frame, fps }) => {
  if (!milestone.achieved || !milestone.achievedFrame) return null;

  const milestoneFrame = frame - milestone.achievedFrame;
  const duration = milestone.visual.duration * fps;

  if (milestoneFrame < 0 || milestoneFrame > duration) return null;

  const progress = milestoneFrame / duration;
  const scale = getMilestoneScale(milestone.priority, progress, frame, fps);
  const opacity = getMilestoneOpacity(progress);
  const glowIntensity = createPulseAnimation(milestoneFrame, fps, 0.5, 1, 2);

  return (
    <div
      style={{
        position: 'absolute',
        left: milestone.visual.position.x - milestone.visual.size / 2,
        top: milestone.visual.position.y - milestone.visual.size / 2,
        width: milestone.visual.size,
        height: milestone.visual.size,
        transform: `scale(${scale})`,
        opacity,
        zIndex: getMilestoneZIndex(milestone.priority),
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${milestone.visual.color}${Math.floor(Math.abs(glowIntensity) * 100).toString(16).padStart(2, '0')}, transparent)`,
          filter: 'blur(8px)',
        }}
      />

      {/* Main indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: milestone.visual.color,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: milestone.visual.size * 0.4,
          color: '#FFFFFF',
          textShadow: '0 0 4px rgba(0,0,0,0.5)',
          boxShadow: `0 0 ${Math.abs(glowIntensity) * 20}px ${milestone.visual.color}`,
        }}
      >
        {milestone.visual.icon}
      </div>

      {/* Pulse rings */}
      {milestone.priority === 'critical' && (
        <>
          {[1, 2, 3].map((ringIndex) => {
            const ringDelay = ringIndex * 0.2 * fps;
            const ringFrame = Math.max(0, milestoneFrame - ringDelay);
            const ringProgress = Math.min(ringFrame / (fps * 1), 1);
            
            if (ringProgress <= 0) return null;

            const ringSize = milestone.visual.size * (1 + ringProgress * 2);
            const ringOpacity = (1 - ringProgress) * 0.6;

            return (
              <div
                key={ringIndex}
                style={{
                  position: 'absolute',
                  left: milestone.visual.size / 2 - ringSize / 2,
                  top: milestone.visual.size / 2 - ringSize / 2,
                  width: ringSize,
                  height: ringSize,
                  border: `3px solid ${milestone.visual.color}`,
                  borderRadius: '50%',
                  opacity: ringOpacity,
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
};

const AchievementNotifications: React.FC<{
  milestones: Milestone[];
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ milestones, frame, fps, containerWidth, containerHeight }) => {
  const recentAchievements = milestones.filter(
    milestone => 
      milestone.achieved && 
      milestone.achievedFrame &&
      frame - milestone.achievedFrame < fps * 5 // Show for 5 seconds
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        right: 50,
        width: 400,
        zIndex: 600,
      }}
    >
      {recentAchievements.map((milestone, index) => {
        const achievementFrame = frame - milestone.achievedFrame!;
        const delay = index * 0.5; // Stagger notifications
        
        return (
          <AchievementNotification
            key={milestone.id}
            milestone={milestone}
            frame={achievementFrame}
            fps={fps}
            delay={delay}
            index={index}
          />
        );
      })}
    </div>
  );
};

const AchievementNotification: React.FC<{
  milestone: Milestone;
  frame: number;
  fps: number;
  delay: number;
  index: number;
}> = ({ milestone, frame, fps, delay, index }) => {
  const delayedFrame = Math.max(0, frame - delay * fps);
  const duration = 4 * fps; // 4 seconds total
  
  if (delayedFrame > duration) return null;

  const progress = delayedFrame / duration;
  
  // Entry animation
  const entryProgress = Math.min(delayedFrame / (fps * 0.5), 1);
  const exitProgress = Math.max(0, (delayedFrame - fps * 3.5) / (fps * 0.5));
  
  const slideX = createAdvancedAnimation(
    delayedFrame,
    fps,
    400,
    0,
    {
      type: 'interpolate',
      duration: 0.5,
      easing: 'easeOutElastic',
    }
  );
  
  const opacity = interpolate(
    progress,
    [0, 0.125, 0.875, 1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const backgroundColor = getPriorityColor(milestone.priority);
  
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 10,
        transform: `translateX(${slideX}px)`,
        opacity,
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${backgroundColor}, ${backgroundColor}CC)`,
          borderRadius: 12,
          padding: '16px 20px',
          color: '#FFFFFF',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: `2px solid ${milestone.visual.color}`,
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Achievement icon */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 20,
            width: 24,
            height: 24,
            backgroundColor: milestone.visual.color,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
          }}
        >
          {milestone.visual.icon}
        </div>

        {/* Content */}
        <div style={{ marginLeft: 40 }}>
          <AnimatedText
            text={milestone.title}
            animation={{
              type: 'reveal',
              effect: 'slide-left',
              duration: 0.8,
              delay: 0.2,
            }}
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              marginBottom: 4,
              display: 'block',
            }}
          />
          
          <AnimatedText
            text={milestone.description}
            animation={{
              type: 'reveal',
              effect: 'fade',
              duration: 0.6,
              delay: 0.5,
            }}
            style={{
              fontSize: 14,
              opacity: 0.9,
              display: 'block',
            }}
          />
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 3,
            width: `${(1 - progress) * 100}%`,
            backgroundColor: milestone.visual.color,
            borderRadius: '0 0 0 12px',
          }}
        />

        {/* Shimmer effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${progress * 100 - 30}%`,
            width: '30%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transform: 'skewX(-20deg)',
          }}
        />
      </div>
    </div>
  );
};

// Helper functions
const detectMilestones = (
  config: MilestoneConfig,
  currentData: DataItem[],
  previousData: DataItem[] = [],
  frame: number,
  containerWidth: number,
  containerHeight: number
): Milestone[] => {
  const milestones: Milestone[] = [];

  // Value-based milestones
  config.thresholds.forEach((threshold, index) => {
    currentData.forEach((item) => {
      const previousItem = previousData.find(p => p.id === item.id);
      const wasAboveThreshold = previousItem && previousItem.value >= threshold;
      const isAboveThreshold = item.value >= threshold;

      if (isAboveThreshold && !wasAboveThreshold) {
        milestones.push({
          id: `value-${item.id}-${threshold}`,
          type: 'value',
          threshold,
          itemId: item.id,
          title: `${item.name} reaches ${threshold.toLocaleString()}!`,
          description: `Achieved milestone of ${threshold.toLocaleString()} units`,
          achieved: true,
          achievedFrame: frame,
          priority: getThresholdPriority(threshold, config.thresholds),
          visual: {
            icon: '🎯',
            color: '#FFD700',
            size: 40,
            position: {
              x: containerWidth * 0.8,
              y: 100 + index * 60,
            },
            duration: 3,
          },
          celebration: {
            type: 'sparkles',
            intensity: 0.8,
            duration: 2,
            colors: ['#FFD700', '#FFA500', '#FF6347'],
            position: { x: containerWidth * 0.8, y: 100 + index * 60 },
          },
        });
      }
    });
  });

  // Rank-based milestones
  currentData.forEach((item) => {
    const previousItem = previousData.find(p => p.id === item.id);
    
    // First time reaching #1
    if (item.rank === 1 && previousItem && previousItem.rank !== 1) {
      milestones.push({
        id: `rank-${item.id}-1`,
        type: 'rank',
        threshold: 1,
        itemId: item.id,
        title: `${item.name} takes the lead!`,
        description: 'Reached #1 position',
        achieved: true,
        achievedFrame: frame,
        priority: 'critical',
        visual: {
          icon: '👑',
          color: '#FF6B6B',
          size: 50,
          position: {
            x: containerWidth / 2,
            y: 80,
          },
          duration: 4,
        },
        celebration: {
          type: 'fireworks',
          intensity: 1,
          duration: 3,
          colors: ['#FF6B6B', '#FFD700', '#4ECDC4'],
          position: { x: containerWidth / 2, y: 200 },
        },
      });
    }

    // Entering top 3
    if (item.rank <= 3 && previousItem && previousItem.rank > 3) {
      milestones.push({
        id: `rank-${item.id}-top3`,
        type: 'rank',
        threshold: 3,
        itemId: item.id,
        title: `${item.name} enters top 3!`,
        description: `Climbed to position #${item.rank}`,
        achieved: true,
        achievedFrame: frame,
        priority: 'high',
        visual: {
          icon: '🏆',
          color: '#4ECDC4',
          size: 35,
          position: {
            x: containerWidth * 0.9,
            y: 150,
          },
          duration: 2.5,
        },
        celebration: {
          type: 'burst',
          intensity: 0.7,
          duration: 2,
          colors: ['#4ECDC4', '#45B7D1'],
          position: { x: containerWidth * 0.9, y: 150 },
        },
      });
    }
  });

  return milestones;
};

const getMilestoneScale = (
  priority: Milestone['priority'],
  progress: number,
  frame: number,
  fps: number
): number => {
  const baseScale = createAdvancedAnimation(
    frame,
    fps,
    0,
    1,
    {
      type: 'interpolate',
      duration: 0.5,
      easing: 'easeOutElastic',
    }
  );

  const priorityMultiplier = {
    low: 1,
    medium: 1.2,
    high: 1.4,
    critical: 1.6,
  }[priority];

  const pulse = priority === 'critical' 
    ? createPulseAnimation(frame, fps, 1, 0.2, 2)
    : 0;

  return baseScale * priorityMultiplier * (1 + Math.abs(pulse));
};

const getMilestoneOpacity = (progress: number): number => {
  return interpolate(
    progress,
    [0, 0.1, 0.9, 1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
};

const getMilestoneZIndex = (priority: Milestone['priority']): number => {
  return {
    low: 501,
    medium: 502,
    high: 503,
    critical: 504,
  }[priority];
};

const getThresholdPriority = (
  threshold: number,
  allThresholds: number[]
): Milestone['priority'] => {
  const index = allThresholds.indexOf(threshold);
  const total = allThresholds.length;
  
  if (index < total * 0.25) return 'low';
  if (index < total * 0.5) return 'medium';
  if (index < total * 0.75) return 'high';
  return 'critical';
};

const getPriorityColor = (priority: Milestone['priority']): string => {
  return {
    low: '#6C5CE7',
    medium: '#00B894',
    high: '#FDCB6E',
    critical: '#E84393',
  }[priority];
};

export default MilestoneSystem;