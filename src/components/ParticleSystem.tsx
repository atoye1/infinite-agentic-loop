/**
 * Particle System Component for Bar Chart Race
 * Provides sophisticated particle effects for celebrations, milestones, and special events
 */

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { createAdvancedAnimation, EasingFunctions } from '../utils/AnimationUtils';

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  size: number;
  color: string;
  life: number; // 0 to 1
  maxLife: number; // frames
  shape: 'circle' | 'square' | 'star' | 'heart' | 'sparkle';
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  trail?: boolean;
}

export interface ParticleSystemConfig {
  enabled: boolean;
  maxParticles: number;
  emissionRate: number; // particles per second
  lifespan: number; // seconds
  size: { min: number; max: number };
  speed: { min: number; max: number };
  colors: string[];
  shapes: Particle['shape'][];
  gravity: number;
  wind: number;
  fadeOut: boolean;
  trail: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
}

export interface ParticleEvent {
  type: 'milestone' | 'overtake' | 'record' | 'celebration' | 'achievement';
  x: number;
  y: number;
  intensity: number; // 0-1
  duration: number; // seconds
  startFrame: number;
  config?: Partial<ParticleSystemConfig>;
}

interface ParticleSystemProps {
  events: ParticleEvent[];
  baseConfig: ParticleSystemConfig;
  containerWidth: number;
  containerHeight: number;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  events,
  baseConfig,
  containerWidth,
  containerHeight,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Generate particles for active events
  const activeParticles = React.useMemo(() => {
    const particles: Particle[] = [];
    
    events.forEach((event) => {
      const eventConfig = { ...baseConfig, ...event.config };
      const eventDuration = event.duration * fps;
      const eventEndFrame = event.startFrame + eventDuration;
      
      if (frame >= event.startFrame && frame <= eventEndFrame) {
        const eventFrame = frame - event.startFrame;
        const particleCount = Math.floor(
          (eventConfig.emissionRate * event.intensity * event.duration) / fps * 60
        );
        
        // Generate particles based on event type
        const eventParticles = generateEventParticles(
          event,
          eventConfig,
          eventFrame,
          particleCount,
          fps
        );
        
        particles.push(...eventParticles);
      }
    });
    
    return particles;
  }, [events, baseConfig, frame, fps]);
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerWidth,
        height: containerHeight,
        pointerEvents: 'none',
        zIndex: 10,
        mixBlendMode: baseConfig.blendMode,
      }}
    >
      {activeParticles.map((particle) => (
        <ParticleRenderer
          key={particle.id}
          particle={particle}
          frame={frame}
          fps={fps}
        />
      ))}
    </div>
  );
};

const ParticleRenderer: React.FC<{
  particle: Particle;
  frame: number;
  fps: number;
}> = ({ particle, frame, fps }) => {
  // Calculate particle position based on physics
  const age = (frame * (1 / fps)) - (particle.life * particle.maxLife / fps);
  const lifeProgress = Math.max(0, Math.min(1, age / (particle.maxLife / fps)));
  
  // Apply physics
  const currentX = particle.x + particle.vx * age;
  const currentY = particle.y + particle.vy * age + 0.5 * particle.gravity * age * age;
  
  // Fade out over lifetime
  const opacity = particle.fadeOut 
    ? particle.opacity * (1 - EasingFunctions.easeInQuart(lifeProgress))
    : particle.opacity;
  
  // Size animation
  const currentSize = interpolate(
    lifeProgress,
    [0, 0.2, 0.8, 1],
    [0, particle.size, particle.size, particle.size * 0.5],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  // Rotation
  const currentRotation = particle.rotation + particle.rotationSpeed * age * 180 / Math.PI;
  
  if (opacity <= 0 || lifeProgress >= 1) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: currentX - currentSize / 2,
        top: currentY - currentSize / 2,
        width: currentSize,
        height: currentSize,
        opacity,
        transform: `rotate(${currentRotation}deg)`,
        pointerEvents: 'none',
      }}
    >
      <ParticleShape
        shape={particle.shape}
        size={currentSize}
        color={particle.color}
        opacity={opacity}
      />
      
      {/* Trail effect */}
      {particle.trail && (
        <div
          style={{
            position: 'absolute',
            left: -particle.vx * 0.1,
            top: -particle.vy * 0.1,
            width: currentSize * 0.8,
            height: currentSize * 0.8,
            opacity: opacity * 0.3,
            transform: `rotate(${currentRotation}deg)`,
          }}
        >
          <ParticleShape
            shape={particle.shape}
            size={currentSize * 0.8}
            color={particle.color}
            opacity={opacity * 0.3}
          />
        </div>
      )}
    </div>
  );
};

const ParticleShape: React.FC<{
  shape: Particle['shape'];
  size: number;
  color: string;
  opacity: number;
}> = ({ shape, size, color, opacity }) => {
  const baseStyle = {
    width: size,
    height: size,
    opacity,
  };
  
  switch (shape) {
    case 'circle':
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: color,
            borderRadius: '50%',
            boxShadow: `0 0 ${size * 0.3}px ${color}`,
          }}
        />
      );
      
    case 'square':
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: color,
            borderRadius: '10%',
            boxShadow: `0 0 ${size * 0.2}px ${color}`,
          }}
        />
      );
      
    case 'star':
      return (
        <div
          style={{
            ...baseStyle,
            position: 'relative',
          }}
        >
          <StarShape size={size} color={color} />
        </div>
      );
      
    case 'heart':
      return (
        <div
          style={{
            ...baseStyle,
            position: 'relative',
          }}
        >
          <HeartShape size={size} color={color} />
        </div>
      );
      
    case 'sparkle':
      return (
        <div
          style={{
            ...baseStyle,
            position: 'relative',
          }}
        >
          <SparkleShape size={size} color={color} />
        </div>
      );
      
    default:
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: color,
            borderRadius: '50%',
          }}
        />
      );
  }
};

const StarShape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const HeartShape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const SparkleShape: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 1l2.5 7.5L22 11l-7.5 2.5L12 21l-2.5-7.5L2 11l7.5-2.5L12 1z" />
    <path d="M8 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" opacity="0.6" />
    <path d="M18 8l0.5 1.5L20 10l-1.5 0.5L18 12l-0.5-1.5L16 10l1.5-0.5L18 8z" opacity="0.4" />
  </svg>
);

// Particle generation functions
const generateEventParticles = (
  event: ParticleEvent,
  config: ParticleSystemConfig,
  eventFrame: number,
  particleCount: number,
  fps: number
): Particle[] => {
  const particles: Particle[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = createParticle(event, config, eventFrame, i, fps);
    particles.push(particle);
  }
  
  return particles;
};

const createParticle = (
  event: ParticleEvent,
  config: ParticleSystemConfig,
  eventFrame: number,
  index: number,
  fps: number
): Particle => {
  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomChoice = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
  
  // Base particle properties
  const angle = random(0, Math.PI * 2);
  const speed = random(config.speed.min, config.speed.max);
  const size = random(config.size.min, config.size.max);
  
  // Event-specific modifications
  const eventModifications = getEventModifications(event.type, event.intensity);
  
  return {
    id: `${event.type}-${eventFrame}-${index}`,
    x: event.x + random(-50, 50) * event.intensity,
    y: event.y + random(-50, 50) * event.intensity,
    vx: Math.cos(angle) * speed * eventModifications.speedMultiplier,
    vy: Math.sin(angle) * speed * eventModifications.speedMultiplier,
    size: size * eventModifications.sizeMultiplier,
    color: randomChoice(eventModifications.colors || config.colors),
    life: eventFrame / fps,
    maxLife: config.lifespan * fps,
    shape: randomChoice(eventModifications.shapes || config.shapes),
    opacity: random(0.6, 1) * event.intensity,
    rotation: random(0, 360),
    rotationSpeed: random(-5, 5),
    gravity: config.gravity * eventModifications.gravityMultiplier,
    trail: config.trail,
  };
};

const getEventModifications = (eventType: ParticleEvent['type'], intensity: number) => {
  switch (eventType) {
    case 'milestone':
      return {
        speedMultiplier: 1.5,
        sizeMultiplier: 1.2,
        gravityMultiplier: 0.8,
        colors: ['#FFD700', '#FFA500', '#FF6347'],
        shapes: ['star', 'sparkle'] as Particle['shape'][],
      };
      
    case 'overtake':
      return {
        speedMultiplier: 2,
        sizeMultiplier: 1,
        gravityMultiplier: 1.2,
        colors: ['#00FF00', '#32CD32', '#7FFF00'],
        shapes: ['circle', 'square'] as Particle['shape'][],
      };
      
    case 'record':
      return {
        speedMultiplier: 2.5,
        sizeMultiplier: 1.5,
        gravityMultiplier: 0.5,
        colors: ['#FF0000', '#FF4500', '#DC143C'],
        shapes: ['star', 'heart'] as Particle['shape'][],
      };
      
    case 'celebration':
      return {
        speedMultiplier: 1.8,
        sizeMultiplier: 1.3,
        gravityMultiplier: 0.9,
        colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FFD700'],
        shapes: ['heart', 'star', 'sparkle'] as Particle['shape'][],
      };
      
    case 'achievement':
      return {
        speedMultiplier: 1.2,
        sizeMultiplier: 1.1,
        gravityMultiplier: 1,
        colors: ['#9370DB', '#8A2BE2', '#4B0082'],
        shapes: ['sparkle', 'star'] as Particle['shape'][],
      };
      
    default:
      return {
        speedMultiplier: 1,
        sizeMultiplier: 1,
        gravityMultiplier: 1,
      };
  }
};

export default ParticleSystem;