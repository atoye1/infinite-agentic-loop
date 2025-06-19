/**
 * Celebration Animation System for Bar Chart Race
 * Implements various celebration effects for milestones and achievements
 */

import { interpolate, spring, random } from 'remotion';

export interface CelebrationConfig {
  type: 'confetti' | 'fireworks' | 'sparkle' | 'burst' | 'wave';
  duration: number;
  intensity: number;
  colors: string[];
  particleCount: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  lifetime: number;
}

// Celebration presets
export const CelebrationPresets: Record<string, CelebrationConfig> = {
  subtle: {
    type: 'sparkle',
    duration: 1.5,
    intensity: 0.3,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
    particleCount: 20,
  },
  exciting: {
    type: 'confetti',
    duration: 2.5,
    intensity: 0.7,
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
    particleCount: 50,
  },
  epic: {
    type: 'fireworks',
    duration: 3,
    intensity: 1,
    colors: ['#FFD700', '#FF6347', '#00CED1', '#FF1493', '#00FF00'],
    particleCount: 100,
  },
};

// Generate deterministic particles using Remotion's random
export const generateCelebrationParticles = (
  seed: string,
  config: CelebrationConfig,
  centerX: number,
  centerY: number
): Particle[] => {
  const particles: Particle[] = [];
  
  for (let i = 0; i < config.particleCount; i++) {
    const particleSeed = `${seed}-${i}`;
    
    const angle = random(particleSeed + '-angle') * Math.PI * 2;
    const velocity = random(particleSeed + '-velocity') * config.intensity * 10;
    const size = random(particleSeed + '-size') * 10 + 5;
    const colorIndex = Math.floor(random(particleSeed + '-color') * config.colors.length);
    
    particles.push({
      id: particleSeed,
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 5, // Slight upward bias
      size,
      color: config.colors[colorIndex],
      rotation: random(particleSeed + '-rotation') * 360,
      lifetime: config.duration,
    });
  }
  
  return particles;
};

// Animate confetti particles
export const animateConfettiParticle = (
  particle: Particle,
  frame: number,
  fps: number,
  gravity: number = 0.5
): {
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  scale: number;
} => {
  const time = frame / fps;
  const progress = Math.min(time / particle.lifetime, 1);
  
  // Physics simulation
  const x = particle.x + particle.vx * time;
  const y = particle.y + particle.vy * time + 0.5 * gravity * time * time;
  
  // Rotation animation
  const rotation = particle.rotation + time * 360;
  
  // Fade out
  const opacity = interpolate(progress, [0, 0.7, 1], [1, 1, 0]);
  
  // Scale down at the end
  const scale = interpolate(progress, [0, 0.8, 1], [1, 1, 0.5]);
  
  return { x, y, rotation, opacity, scale };
};

// Create sparkle effect
export const createSparkleEffect = (
  frame: number,
  fps: number,
  x: number,
  y: number,
  duration: number,
  intensity: number
): {
  scale: number;
  opacity: number;
  blur: number;
} => {
  const progress = Math.min(frame / (fps * duration), 1);
  
  // Pulsing scale
  const pulseFrequency = 5 * intensity;
  const pulse = Math.sin(progress * Math.PI * pulseFrequency) * 0.2 + 0.8;
  const scale = pulse * interpolate(progress, [0, 0.5, 1], [0, 1, 0]);
  
  // Fade in and out
  const opacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  // Blur effect
  const blur = interpolate(progress, [0, 0.5, 1], [0, 2, 5]) * intensity;
  
  return { scale, opacity, blur };
};

// Create burst effect
export const createBurstEffect = (
  frame: number,
  fps: number,
  duration: number,
  intensity: number
): {
  scale: number;
  opacity: number;
  strokeWidth: number;
} => {
  const progress = Math.min(frame / (fps * duration), 1);
  
  // Expanding ring
  const scale = interpolate(progress, [0, 1], [0, 3]) * (1 + intensity);
  
  // Fade out
  const opacity = interpolate(progress, [0, 0.3, 1], [1, 1, 0]);
  
  // Stroke gets thinner as it expands
  const strokeWidth = interpolate(progress, [0, 1], [4, 1]) * intensity;
  
  return { scale, opacity, strokeWidth };
};

// Create wave effect
export const createWaveEffect = (
  frame: number,
  fps: number,
  startX: number,
  amplitude: number,
  frequency: number,
  speed: number
): {
  path: string;
  opacity: number;
} => {
  const time = frame / fps;
  const progress = Math.min(time / 2, 1); // 2 second wave
  
  // Generate wave path
  const points: string[] = [];
  const segments = 50;
  
  for (let i = 0; i <= segments; i++) {
    const x = startX + (i / segments) * 200;
    const phase = (x / 50) + (time * speed);
    const y = Math.sin(phase * frequency) * amplitude * (1 - progress);
    
    if (i === 0) {
      points.push(`M ${x} ${y}`);
    } else {
      points.push(`L ${x} ${y}`);
    }
  }
  
  const path = points.join(' ');
  const opacity = interpolate(progress, [0, 0.8, 1], [1, 1, 0]);
  
  return { path, opacity };
};

// Milestone detection
export const detectMilestone = (
  value: number,
  milestones: number[],
  tolerance: number = 0.01
): number | null => {
  for (const milestone of milestones) {
    if (Math.abs(value - milestone) < milestone * tolerance) {
      return milestone;
    }
  }
  return null;
};

// Create achievement badge animation
export const createAchievementBadge = (
  frame: number,
  fps: number,
  text: string,
  duration: number = 2
): {
  scale: number;
  opacity: number;
  rotation: number;
  y: number;
} => {
  const progress = Math.min(frame / (fps * duration), 1);
  
  // Spring entrance
  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 150, stiffness: 300, mass: 0.8 },
  });
  
  // Subtle rotation
  const rotation = Math.sin(progress * Math.PI * 2) * 5;
  
  // Float upward
  const y = interpolate(progress, [0, 1], [0, -50]);
  
  // Fade out at the end
  const opacity = interpolate(progress, [0, 0.7, 1], [1, 1, 0]);
  
  return { scale, opacity, rotation, y };
};

// Create streak effect for continuous achievements
export const createStreakEffect = (
  consecutiveWins: number,
  frame: number,
  fps: number
): {
  glowIntensity: number;
  particleSpeed: number;
  trailLength: number;
} => {
  const streakLevel = Math.min(consecutiveWins / 5, 1); // Max at 5 wins
  
  // Pulsing glow based on streak
  const time = frame / fps;
  const glowBase = 0.3 + streakLevel * 0.7;
  const glowPulse = Math.sin(time * Math.PI * 2) * 0.2;
  const glowIntensity = glowBase + glowPulse;
  
  // Faster particles with higher streak
  const particleSpeed = 1 + streakLevel * 2;
  
  // Longer trail with higher streak
  const trailLength = 0.5 + streakLevel * 0.5;
  
  return { glowIntensity, particleSpeed, trailLength };
};