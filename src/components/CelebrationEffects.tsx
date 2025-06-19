/**
 * Celebration Effects System
 * Advanced celebration animations for overtaking moments, records, and milestones
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { createAdvancedAnimation, createPulseAnimation, EasingFunctions } from '../utils/AnimationUtils';
import ParticleSystem, { ParticleEvent, ParticleSystemConfig } from './ParticleSystem';
import { CelebrationEffect } from '../types';

interface CelebrationEffectsProps {
  celebrations: CelebrationEffect[];
  containerWidth: number;
  containerHeight: number;
  frame: number;
  fps: number;
}

interface ActiveCelebration extends CelebrationEffect {
  startFrame: number;
  endFrame: number;
  isActive: boolean;
}

export const CelebrationEffects: React.FC<CelebrationEffectsProps> = ({
  celebrations,
  containerWidth,
  containerHeight,
  frame,
  fps,
}) => {
  // Convert celebrations to active celebrations with timing
  const activeCelebrations: ActiveCelebration[] = React.useMemo(() => {
    return celebrations.map((celebration, index) => ({
      ...celebration,
      startFrame: frame,
      endFrame: frame + celebration.duration * fps,
      isActive: true,
    }));
  }, [celebrations, frame, fps]);

  // Generate particle events from celebrations
  const particleEvents: ParticleEvent[] = React.useMemo(() => {
    return activeCelebrations.map((celebration, index) => ({
      type: getParticleEventType(celebration.type),
      x: celebration.position.x,
      y: celebration.position.y,
      intensity: celebration.intensity,
      duration: celebration.duration,
      startFrame: celebration.startFrame,
      config: {
        colors: celebration.colors,
        maxParticles: Math.floor(celebration.intensity * 100),
        emissionRate: celebration.intensity * 50,
      },
    }));
  }, [activeCelebrations]);

  const baseParticleConfig: ParticleSystemConfig = {
    enabled: true,
    maxParticles: 200,
    emissionRate: 60,
    lifespan: 3,
    size: { min: 4, max: 12 },
    speed: { min: 50, max: 200 },
    colors: ['#FFD700', '#FF6347', '#00FF00', '#FF69B4'],
    shapes: ['circle', 'star', 'sparkle'],
    gravity: 100,
    wind: 0,
    fadeOut: true,
    trail: false,
    blendMode: 'normal',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerWidth,
        height: containerHeight,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Particle System */}
      <ParticleSystem
        events={particleEvents}
        baseConfig={baseParticleConfig}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
      />

      {/* Individual Celebration Effects */}
      {activeCelebrations.map((celebration, index) => (
        <CelebrationRenderer
          key={`celebration-${index}-${celebration.startFrame}`}
          celebration={celebration}
          frame={frame}
          fps={fps}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      ))}
    </div>
  );
};

const CelebrationRenderer: React.FC<{
  celebration: ActiveCelebration;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ celebration, frame, fps, containerWidth, containerHeight }) => {
  const celebrationFrame = frame - celebration.startFrame;
  const progress = Math.min(celebrationFrame / (celebration.duration * fps), 1);

  if (celebrationFrame < 0 || progress > 1) return null;

  switch (celebration.type) {
    case 'confetti':
      return (
        <ConfettiEffect
          celebration={celebration}
          progress={progress}
          frame={celebrationFrame}
          fps={fps}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      );

    case 'fireworks':
      return (
        <FireworksEffect
          celebration={celebration}
          progress={progress}
          frame={celebrationFrame}
          fps={fps}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      );

    case 'sparkles':
      return (
        <SparklesEffect
          celebration={celebration}
          progress={progress}
          frame={celebrationFrame}
          fps={fps}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      );

    case 'burst':
      return (
        <BurstEffect
          celebration={celebration}
          progress={progress}
          frame={celebrationFrame}
          fps={fps}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      );

    default:
      return null;
  }
};

const ConfettiEffect: React.FC<{
  celebration: ActiveCelebration;
  progress: number;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ celebration, progress, frame, fps, containerWidth, containerHeight }) => {
  const confettiPieces = React.useMemo(() => {
    const pieces = [];
    const count = Math.floor(celebration.intensity * 50);
    
    for (let i = 0; i < count; i++) {
      pieces.push({
        id: i,
        x: celebration.position.x + (Math.random() - 0.5) * 200,
        y: celebration.position.y + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 300,
        vy: Math.random() * -200 - 100,
        color: celebration.colors[Math.floor(Math.random() * celebration.colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 720,
        width: Math.random() * 8 + 4,
        height: Math.random() * 12 + 6,
      });
    }
    return pieces;
  }, [celebration]);

  return (
    <>
      {confettiPieces.map((piece) => {
        const time = frame / fps;
        const currentX = piece.x + piece.vx * time;
        const currentY = piece.y + piece.vy * time + 0.5 * 300 * time * time; // gravity
        const currentRotation = piece.rotation + piece.rotationSpeed * time;
        
        const opacity = interpolate(
          progress,
          [0, 0.1, 0.8, 1],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        if (currentY > containerHeight || opacity <= 0) return null;

        return (
          <div
            key={piece.id}
            style={{
              position: 'absolute',
              left: currentX,
              top: currentY,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              transform: `rotate(${currentRotation}deg)`,
              opacity,
              borderRadius: '2px',
            }}
          />
        );
      })}
    </>
  );
};

const FireworksEffect: React.FC<{
  celebration: ActiveCelebration;
  progress: number;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ celebration, progress, frame, fps, containerWidth, containerHeight }) => {
  const explosions = React.useMemo(() => {
    const explosionCount = Math.floor(celebration.intensity * 3) + 1;
    const explosions = [];
    
    for (let i = 0; i < explosionCount; i++) {
      const delay = (i / explosionCount) * 0.5; // Stagger explosions
      explosions.push({
        id: i,
        x: celebration.position.x + (Math.random() - 0.5) * 100,
        y: celebration.position.y + (Math.random() - 0.5) * 100,
        delay: delay * fps,
        color: celebration.colors[i % celebration.colors.length],
      });
    }
    return explosions;
  }, [celebration]);

  return (
    <>
      {explosions.map((explosion) => {
        const explosionFrame = frame - explosion.delay;
        if (explosionFrame < 0) return null;

        const explosionProgress = Math.min(explosionFrame / (fps * 0.8), 1);
        if (explosionProgress > 1) return null;

        // Create radiating particles
        const particles = [];
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2;
          const distance = explosionProgress * 80 * celebration.intensity;
          const x = explosion.x + Math.cos(angle) * distance;
          const y = explosion.y + Math.sin(angle) * distance;
          
          const opacity = interpolate(
            explosionProgress,
            [0, 0.2, 0.8, 1],
            [0, 1, 1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          
          const size = interpolate(
            explosionProgress,
            [0, 0.3, 1],
            [8, 4, 2],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          particles.push(
            <div
              key={`${explosion.id}-${i}`}
              style={{
                position: 'absolute',
                left: x - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
                backgroundColor: explosion.color,
                borderRadius: '50%',
                opacity,
                boxShadow: `0 0 ${size * 2}px ${explosion.color}`,
              }}
            />
          );
        }

        return particles;
      })}
    </>
  );
};

const SparklesEffect: React.FC<{
  celebration: ActiveCelebration;
  progress: number;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ celebration, progress, frame, fps, containerWidth, containerHeight }) => {
  const sparkles = React.useMemo(() => {
    const sparkleCount = Math.floor(celebration.intensity * 20);
    const sparkles = [];
    
    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push({
        id: i,
        x: celebration.position.x + (Math.random() - 0.5) * 300,
        y: celebration.position.y + (Math.random() - 0.5) * 300,
        delay: Math.random() * fps * 0.5,
        duration: fps * (0.3 + Math.random() * 0.4),
        color: celebration.colors[Math.floor(Math.random() * celebration.colors.length)],
        size: Math.random() * 8 + 4,
      });
    }
    return sparkles;
  }, [celebration]);

  return (
    <>
      {sparkles.map((sparkle) => {
        const sparkleFrame = frame - sparkle.delay;
        if (sparkleFrame < 0 || sparkleFrame > sparkle.duration) return null;

        const sparkleProgress = sparkleFrame / sparkle.duration;
        const twinkle = createPulseAnimation(sparkleFrame, fps, 0.5, 0.5, 8);
        
        const opacity = interpolate(
          sparkleProgress,
          [0, 0.2, 0.8, 1],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        ) * (0.5 + Math.abs(twinkle));

        const scale = 0.5 + Math.abs(twinkle) * 0.5;

        return (
          <div
            key={sparkle.id}
            style={{
              position: 'absolute',
              left: sparkle.x - sparkle.size / 2,
              top: sparkle.y - sparkle.size / 2,
              width: sparkle.size,
              height: sparkle.size,
              opacity,
              transform: `scale(${scale}) rotate(${sparkleFrame * 4}deg)`,
            }}
          >
            {/* Star shape */}
            <svg width={sparkle.size} height={sparkle.size} viewBox="0 0 24 24" fill={sparkle.color}>
              <path d="M12 2l2.5 7.5L22 11l-7.5 2.5L12 22l-2.5-7.5L2 11l7.5-2.5L12 2z" />
            </svg>
          </div>
        );
      })}
    </>
  );
};

const BurstEffect: React.FC<{
  celebration: ActiveCelebration;
  progress: number;
  frame: number;
  fps: number;
  containerWidth: number;
  containerHeight: number;
}> = ({ celebration, progress, frame, fps, containerWidth, containerHeight }) => {
  const rings = React.useMemo(() => {
    const ringCount = Math.floor(celebration.intensity * 3) + 1;
    return Array.from({ length: ringCount }, (_, i) => ({
      id: i,
      delay: (i / ringCount) * 0.3 * fps,
      color: celebration.colors[i % celebration.colors.length],
    }));
  }, [celebration]);

  return (
    <>
      {rings.map((ring) => {
        const ringFrame = frame - ring.delay;
        if (ringFrame < 0) return null;

        const ringProgress = Math.min(ringFrame / (fps * 0.6), 1);
        if (ringProgress > 1) return null;

        const radius = ringProgress * 150 * celebration.intensity;
        const opacity = interpolate(
          ringProgress,
          [0, 0.2, 0.8, 1],
          [0.8, 0.6, 0.3, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        const strokeWidth = interpolate(
          ringProgress,
          [0, 0.5, 1],
          [8, 4, 2],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <div
            key={ring.id}
            style={{
              position: 'absolute',
              left: celebration.position.x - radius,
              top: celebration.position.y - radius,
              width: radius * 2,
              height: radius * 2,
              border: `${strokeWidth}px solid ${ring.color}`,
              borderRadius: '50%',
              opacity,
              boxShadow: `0 0 ${strokeWidth * 4}px ${ring.color}`,
            }}
          />
        );
      })}
    </>
  );
};

// Helper function to map celebration types to particle event types
const getParticleEventType = (celebrationType: CelebrationEffect['type']): ParticleEvent['type'] => {
  switch (celebrationType) {
    case 'confetti':
      return 'celebration';
    case 'fireworks':
      return 'record';
    case 'sparkles':
      return 'achievement';
    case 'burst':
      return 'overtake';
    default:
      return 'celebration';
  }
};

export default CelebrationEffects;