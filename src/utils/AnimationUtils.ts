/**
 * Advanced Animation Utilities for Bar Chart Race
 * Provides sophisticated easing functions, transition effects, and animation helpers
 */

import { interpolate, spring, SpringConfig } from 'remotion';

// Advanced Easing Functions
export const EasingFunctions = {
  // Cubic Bezier curves
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  
  // Quartic easing
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  
  // Elastic easing
  easeInElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t: number) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  
  // Bounce easing
  easeInBounce: (t: number) => 1 - EasingFunctions.easeOutBounce(1 - t),
  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t: number) => t < 0.5
    ? (1 - EasingFunctions.easeOutBounce(1 - 2 * t)) / 2
    : (1 + EasingFunctions.easeOutBounce(2 * t - 1)) / 2,
};

// Animation Timing Functions
export type TimingFunction = keyof typeof EasingFunctions;

// Spring Animation Presets
export const SpringPresets: Record<string, SpringConfig> = {
  gentle: { damping: 200, stiffness: 100, mass: 1, overshootClamping: false },
  wobbly: { damping: 180, stiffness: 120, mass: 1, overshootClamping: false },
  stiff: { damping: 260, stiffness: 200, mass: 1, overshootClamping: false },
  slow: { damping: 280, stiffness: 60, mass: 1, overshootClamping: false },
  molasses: { damping: 280, stiffness: 20, mass: 1, overshootClamping: false },
  bouncy: { damping: 150, stiffness: 180, mass: 1, overshootClamping: false },
  elastic: { damping: 120, stiffness: 200, mass: 1.2, overshootClamping: false },
  snappy: { damping: 300, stiffness: 400, mass: 0.8, overshootClamping: false },
};

// Advanced Animation Options
export interface AdvancedAnimationConfig {
  type: 'spring' | 'interpolate' | 'custom';
  duration?: number;
  delay?: number;
  easing?: TimingFunction;
  springConfig?: string | SpringConfig;
  customFunction?: (progress: number) => number;
  loop?: boolean;
  yoyo?: boolean;
}

// Enhanced animation function
export const createAdvancedAnimation = (
  frame: number,
  fps: number,
  from: number,
  to: number,
  config: AdvancedAnimationConfig
): number => {
  const startFrame = (config.delay || 0) * fps;
  const animationFrame = Math.max(0, frame - startFrame);
  
  if (frame < startFrame) return from;
  
  switch (config.type) {
    case 'spring':
      const springConfig = typeof config.springConfig === 'string' 
        ? SpringPresets[config.springConfig] || SpringPresets.gentle
        : config.springConfig || SpringPresets.gentle;
      
      return spring({
        frame: animationFrame,
        fps,
        config: springConfig,
        from,
        to,
      });
      
    case 'interpolate':
      const duration = config.duration || 1;
      const durationFrames = duration * fps;
      const easingFn = config.easing ? EasingFunctions[config.easing] : undefined;
      
      let progress = Math.min(animationFrame / durationFrames, 1);
      
      if (config.loop && animationFrame > durationFrames) {
        const cycleFrame = animationFrame % durationFrames;
        progress = cycleFrame / durationFrames;
      }
      
      if (config.yoyo) {
        const cycleProgress = progress * 2;
        progress = cycleProgress <= 1 ? cycleProgress : 2 - cycleProgress;
      }
      
      if (easingFn) {
        progress = easingFn(progress);
      }
      
      return interpolate(progress, [0, 1], [from, to], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      
    case 'custom':
      if (!config.customFunction) return from;
      const customDuration = config.duration || 1;
      const customProgress = Math.min(animationFrame / (customDuration * fps), 1);
      const customValue = config.customFunction(customProgress);
      return interpolate(customValue, [0, 1], [from, to]);
      
    default:
      return to;
  }
};

// Staggered animation helper
export const createStaggeredAnimation = (
  frame: number,
  fps: number,
  index: number,
  totalItems: number,
  from: number,
  to: number,
  config: AdvancedAnimationConfig & { staggerDelay: number }
): number => {
  const staggeredConfig = {
    ...config,
    delay: (config.delay || 0) + (config.staggerDelay * index),
  };
  
  return createAdvancedAnimation(frame, fps, from, to, staggeredConfig);
};

// Color transition utilities
export const interpolateColor = (
  progress: number,
  fromColor: string,
  toColor: string
): string => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
  };
  
  const fromRgb = hexToRgb(fromColor);
  const toRgb = hexToRgb(toColor);
  
  const r = interpolate(progress, [0, 1], [fromRgb.r, toRgb.r]);
  const g = interpolate(progress, [0, 1], [fromRgb.g, toRgb.g]);
  const b = interpolate(progress, [0, 1], [fromRgb.b, toRgb.b]);
  
  return rgbToHex(r, g, b);
};

// Create gradient background
export const createAnimatedGradient = (
  frame: number,
  fps: number,
  colors: string[],
  duration: number = 4,
  direction: number = 45
): string => {
  const progress = (frame / fps) % duration / duration;
  const colorCount = colors.length;
  const currentIndex = Math.floor(progress * colorCount);
  const nextIndex = (currentIndex + 1) % colorCount;
  const localProgress = (progress * colorCount) % 1;
  
  const currentColor = colors[currentIndex];
  const nextColor = colors[nextIndex];
  const interpolatedColor = interpolateColor(localProgress, currentColor, nextColor);
  
  return `linear-gradient(${direction}deg, ${currentColor}, ${interpolatedColor}, ${nextColor})`;
};

// Shake animation for emphasis
export const createShakeAnimation = (
  frame: number,
  fps: number,
  intensity: number = 5,
  duration: number = 0.5
): { x: number; y: number } => {
  const progress = (frame / fps) % duration / duration;
  if (progress > 1) return { x: 0, y: 0 };
  
  const shakeProgress = progress * Math.PI * 12; // Multiple oscillations
  const decay = 1 - progress; // Diminishing intensity
  
  return {
    x: Math.sin(shakeProgress) * intensity * decay,
    y: Math.cos(shakeProgress * 1.1) * intensity * decay * 0.5,
  };
};

// Pulse animation for highlighting
export const createPulseAnimation = (
  frame: number,
  fps: number,
  baseValue: number = 1,
  amplitude: number = 0.2,
  frequency: number = 2
): number => {
  const time = frame / fps;
  const pulse = Math.sin(time * Math.PI * 2 * frequency) * amplitude;
  return baseValue + pulse;
};

// Typewriter effect helper
export const createTypewriterEffect = (
  frame: number,
  fps: number,
  text: string,
  duration: number = 2,
  delay: number = 0
): string => {
  const startFrame = delay * fps;
  if (frame < startFrame) return '';
  
  const animationFrame = frame - startFrame;
  const progress = Math.min(animationFrame / (duration * fps), 1);
  const charactersToShow = Math.floor(progress * text.length);
  
  return text.substring(0, charactersToShow);
};

// Reveal animation with different effects
export type RevealEffect = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'flip';

export const createRevealAnimation = (
  frame: number,
  fps: number,
  effect: RevealEffect,
  duration: number = 1,
  delay: number = 0
): {
  opacity: number;
  transform: string;
} => {
  const startFrame = delay * fps;
  if (frame < startFrame) {
    return { opacity: 0, transform: getInitialTransform(effect) };
  }
  
  const animationFrame = frame - startFrame;
  const progress = Math.min(animationFrame / (duration * fps), 1);
  const easedProgress = EasingFunctions.easeOutCubic(progress);
  
  return {
    opacity: easedProgress,
    transform: getAnimatedTransform(effect, easedProgress),
  };
};

const getInitialTransform = (effect: RevealEffect): string => {
  switch (effect) {
    case 'slide-up': return 'translateY(50px)';
    case 'slide-down': return 'translateY(-50px)';
    case 'slide-left': return 'translateX(50px)';
    case 'slide-right': return 'translateX(-50px)';
    case 'zoom': return 'scale(0.5)';
    case 'flip': return 'rotateY(90deg)';
    default: return 'none';
  }
};

const getAnimatedTransform = (effect: RevealEffect, progress: number): string => {
  switch (effect) {
    case 'slide-up': 
      return `translateY(${50 * (1 - progress)}px)`;
    case 'slide-down': 
      return `translateY(${-50 * (1 - progress)}px)`;
    case 'slide-left': 
      return `translateX(${50 * (1 - progress)}px)`;
    case 'slide-right': 
      return `translateX(${-50 * (1 - progress)}px)`;
    case 'zoom': 
      return `scale(${0.5 + 0.5 * progress})`;
    case 'flip': 
      return `rotateY(${90 * (1 - progress)}deg)`;
    default: 
      return 'none';
  }
};

export default {
  EasingFunctions,
  SpringPresets,
  createAdvancedAnimation,
  createStaggeredAnimation,
  interpolateColor,
  createAnimatedGradient,
  createShakeAnimation,
  createPulseAnimation,
  createTypewriterEffect,
  createRevealAnimation,
};