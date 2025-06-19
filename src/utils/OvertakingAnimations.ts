/**
 * Advanced Overtaking Animation System for Bar Chart Race
 * Implements smooth, physics-based overtaking animations with multiple effects
 */

import { interpolate, spring, SpringConfig } from 'remotion';

export interface OvertakingState {
  isOvertaking: boolean;
  overtakeStartFrame: number;
  overtakeEndFrame: number;
  targetRank: number;
  previousRank: number;
  overtakeVelocity: number;
}

export interface OvertakingConfig {
  duration: number;
  easing: 'smooth' | 'elastic' | 'bounce' | 'aggressive';
  trailEffect: boolean;
  glowIntensity: number;
  curveIntensity: number;
  accelerationCurve: 'linear' | 'exponential' | 'logarithmic';
}

// Default overtaking configurations
export const OvertakingPresets: Record<string, OvertakingConfig> = {
  smooth: {
    duration: 0.8,
    easing: 'smooth',
    trailEffect: true,
    glowIntensity: 0.3,
    curveIntensity: 0.2,
    accelerationCurve: 'exponential',
  },
  dramatic: {
    duration: 1.2,
    easing: 'elastic',
    trailEffect: true,
    glowIntensity: 0.6,
    curveIntensity: 0.4,
    accelerationCurve: 'exponential',
  },
  swift: {
    duration: 0.4,
    easing: 'aggressive',
    trailEffect: false,
    glowIntensity: 0.2,
    curveIntensity: 0.1,
    accelerationCurve: 'linear',
  },
  bouncy: {
    duration: 1.0,
    easing: 'bounce',
    trailEffect: true,
    glowIntensity: 0.4,
    curveIntensity: 0.3,
    accelerationCurve: 'logarithmic',
  },
};

// Calculate overtaking path with bezier curve
export const calculateOvertakingPath = (
  progress: number,
  fromY: number,
  toY: number,
  curveIntensity: number,
  isMovingUp: boolean
): { y: number; x: number } => {
  // Bezier curve control points
  const direction = isMovingUp ? -1 : 1;
  const maxOffset = Math.abs(toY - fromY) * curveIntensity;
  
  // Cubic bezier interpolation
  const t = progress;
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  
  // Horizontal offset curve (bulge out during overtake)
  const xOffset = (4 * t * mt) * maxOffset * direction;
  
  // Vertical position with easing
  const y = interpolate(progress, [0, 1], [fromY, toY]);
  
  return { y, x: xOffset };
};

// Enhanced spring configuration for overtaking
export const getOvertakingSpringConfig = (easing: string): SpringConfig => {
  switch (easing) {
    case 'smooth':
      return { damping: 200, stiffness: 150, mass: 1 };
    case 'elastic':
      return { damping: 150, stiffness: 200, mass: 1.2 };
    case 'bounce':
      return { damping: 180, stiffness: 300, mass: 0.8 };
    case 'aggressive':
      return { damping: 300, stiffness: 400, mass: 0.6 };
    default:
      return { damping: 200, stiffness: 150, mass: 1 };
  }
};

// Calculate acceleration based on curve type
export const calculateAcceleration = (
  progress: number,
  accelerationCurve: string
): number => {
  switch (accelerationCurve) {
    case 'exponential':
      return Math.pow(progress, 2);
    case 'logarithmic':
      return Math.log10(progress * 9 + 1);
    case 'linear':
    default:
      return progress;
  }
};

// Generate trail effect opacity for overtaking bars
export const calculateTrailOpacity = (
  frame: number,
  overtakeStartFrame: number,
  duration: number,
  fps: number
): number => {
  const overtakeProgress = (frame - overtakeStartFrame) / (duration * fps);
  if (overtakeProgress < 0 || overtakeProgress > 1) return 0;
  
  // Fade in quickly, fade out slowly
  if (overtakeProgress < 0.3) {
    return interpolate(overtakeProgress, [0, 0.3], [0, 0.6]);
  } else {
    return interpolate(overtakeProgress, [0.3, 1], [0.6, 0]);
  }
};

// Calculate glow effect for overtaking
export const calculateOvertakeGlow = (
  frame: number,
  overtakeStartFrame: number,
  duration: number,
  fps: number,
  glowIntensity: number
): {
  shadowBlur: number;
  shadowColor: string;
  glowScale: number;
} => {
  const overtakeProgress = (frame - overtakeStartFrame) / (duration * fps);
  if (overtakeProgress < 0 || overtakeProgress > 1) {
    return { shadowBlur: 0, shadowColor: 'transparent', glowScale: 1 };
  }
  
  // Pulse effect during overtake
  const pulseFrequency = 3;
  const pulseMagnitude = Math.sin(overtakeProgress * Math.PI * pulseFrequency) * 0.5 + 0.5;
  
  const shadowBlur = glowIntensity * 20 * pulseMagnitude;
  const glowOpacity = glowIntensity * pulseMagnitude;
  const shadowColor = `rgba(255, 215, 0, ${glowOpacity})`; // Golden glow
  const glowScale = 1 + (glowIntensity * 0.05 * pulseMagnitude);
  
  return { shadowBlur, shadowColor, glowScale };
};

// Main overtaking animation function
export const animateOvertaking = (
  frame: number,
  fps: number,
  fromRank: number,
  toRank: number,
  itemHeight: number,
  spacing: number,
  config: OvertakingConfig = OvertakingPresets.smooth
): {
  position: { x: number; y: number };
  effects: {
    trailOpacity: number;
    glow: { shadowBlur: number; shadowColor: string; glowScale: number };
    zIndex: number;
  };
} => {
  const fromY = (fromRank - 1) * (itemHeight + spacing);
  const toY = (toRank - 1) * (itemHeight + spacing);
  const isMovingUp = toRank < fromRank;
  
  // Calculate progress
  const durationFrames = config.duration * fps;
  const progress = Math.min(Math.max(frame / durationFrames, 0), 1);
  
  // Apply acceleration curve
  const acceleratedProgress = calculateAcceleration(progress, config.accelerationCurve);
  
  // Calculate position with curve
  const position = calculateOvertakingPath(
    acceleratedProgress,
    fromY,
    toY,
    config.curveIntensity,
    isMovingUp
  );
  
  // Calculate effects
  const trailOpacity = config.trailEffect ? calculateTrailOpacity(frame, 0, config.duration, fps) : 0;
  const glow = calculateOvertakeGlow(frame, 0, config.duration, fps, config.glowIntensity);
  
  // Dynamic z-index during overtake
  const zIndex = progress > 0 && progress < 1 ? 100 : 1;
  
  return {
    position,
    effects: {
      trailOpacity,
      glow,
      zIndex,
    },
  };
};

// Helper to detect overtaking moments
export const detectOvertaking = (
  currentRank: number,
  previousRank: number | undefined,
  threshold: number = 0
): boolean => {
  if (!previousRank) return false;
  return Math.abs(currentRank - previousRank) > threshold;
};

// Create smooth rank transition with momentum
export const createMomentumTransition = (
  frame: number,
  fps: number,
  fromRank: number,
  toRank: number,
  momentum: number = 0.2
): number => {
  const springConfig: SpringConfig = {
    damping: 200 - (momentum * 100),
    stiffness: 150 + (momentum * 150),
    mass: 1 - (momentum * 0.5),
  };
  
  return spring({
    frame,
    fps,
    from: fromRank,
    to: toRank,
    config: springConfig,
  });
};