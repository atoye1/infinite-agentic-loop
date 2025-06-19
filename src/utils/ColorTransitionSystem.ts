/**
 * Dynamic Color Transition System
 * Advanced color transitions, gradients, and dynamic theming for Bar Chart Race
 */

import { interpolate } from 'remotion';
import { interpolateColor, createAnimatedGradient } from './AnimationUtils';

export interface ColorScheme {
  name: string;
  primary: string[];
  secondary: string[];
  accent: string[];
  background: string;
  text: string;
}

export interface DynamicColorConfig {
  baseColors: string[];
  transitionDuration: number; // seconds
  cycleColors: boolean;
  gradientMode: boolean;
  hueShift: {
    enabled: boolean;
    speed: number; // cycles per minute
    range: number; // degrees
  };
  saturationPulse: {
    enabled: boolean;
    intensity: number; // 0-1
    frequency: number; // Hz
  };
  contextualColors: {
    recordBreaking: string;
    overtaking: string;
    milestone: string;
    declining: string;
  };
}

export interface ColorTransitionState {
  currentScheme: ColorScheme;
  nextScheme?: ColorScheme;
  transitionProgress: number;
}

// Predefined color schemes
export const ColorSchemes: Record<string, ColorScheme> = {
  vibrant: {
    name: 'Vibrant',
    primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'],
    secondary: ['#FF8E53', '#1DD1A1', '#3742FA', '#7FB069', '#F8B500', '#EE5A6F', '#2F3542'],
    accent: ['#FFD93D', '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#00B894', '#E17055'],
    background: '#2F3640',
    text: '#F5F6FA',
  },
  
  ocean: {
    name: 'Ocean',
    primary: ['#0066CC', '#0080FF', '#3399FF', '#66B2FF', '#99CCFF', '#00CCFF', '#33DDFF'],
    secondary: ['#004C99', '#0066CC', '#1A75FF', '#4D94FF', '#80B3FF', '#00B8E6', '#26C9FF'],
    accent: ['#00FFFF', '#40E0D0', '#20B2AA', '#48CAE4', '#90E0EF', '#ADE8F4', '#CAF0F8'],
    background: '#001122',
    text: '#E0F6FF',
  },
  
  sunset: {
    name: 'Sunset',
    primary: ['#FF4E50', '#FC913A', '#F9D62E', '#EAE374', '#E8F5C8', '#FF8A80', '#FFAB91'],
    secondary: ['#E3434E', '#F1824C', '#F5C842', '#E6DE6B', '#E4F2C1', '#FF7A6B', '#FF9E80'],
    accent: ['#FFB74D', '#FFCC02', '#FFF350', '#D4FF8A', '#B2FF59', '#FF6E40', '#FF5722'],
    background: '#2E1065',
    text: '#FFF8E1',
  },
  
  forest: {
    name: 'Forest',
    primary: ['#27AE60', '#2ECC71', '#58D68D', '#82E0AA', '#ABEBC6', '#52C41A', '#73D13D'],
    secondary: ['#229954', '#25B358', '#4FC978', '#7DD894', '#A2E6B0', '#49B016', '#6CB32E'],
    accent: ['#F1C40F', '#F39C12', '#E67E22', '#D68910', '#CA6F1E', '#B7950B', '#A04000'],
    background: '#0D2818',
    text: '#E8F5E8',
  },
  
  neon: {
    name: 'Neon',
    primary: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0080', '#80FF00', '#0080FF', '#FF8000'],
    secondary: ['#E600E6', '#00E6E6', '#E6E600', '#E60073', '#73E600', '#0073E6', '#E67300'],
    accent: ['#FF66FF', '#66FFFF', '#FFFF66', '#FF6699', '#99FF66', '#6699FF', '#FF9966'],
    background: '#0A0A0A',
    text: '#FFFFFF',
  },
  
  cosmic: {
    name: 'Cosmic',
    primary: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#EC4899', '#F472B6'],
    secondary: ['#7C3AED', '#9333EA', '#A855F7', '#C084FC', '#D8B4FE', '#DB2777', '#E879F9'],
    accent: ['#F59E0B', '#F97316', '#EF4444', '#10B981', '#06B6D4', '#3B82F6', '#6366F1'],
    background: '#1E1B4B',
    text: '#F8FAFC',
  },
};

export class ColorTransitionSystem {
  private currentScheme: ColorScheme;
  private config: DynamicColorConfig;
  private startTime: number = 0;
  
  constructor(initialScheme: string, config: DynamicColorConfig) {
    this.currentScheme = ColorSchemes[initialScheme] || ColorSchemes.vibrant;
    this.config = config;
  }
  
  // Get color for a specific item with dynamic effects
  getItemColor(
    itemId: string,
    index: number,
    frame: number,
    fps: number,
    specialState?: 'record' | 'overtaking' | 'milestone' | 'declining'
  ): string {
    const time = frame / fps;
    let baseColor = this.getBaseColor(index);
    
    // Apply special state colors
    if (specialState && this.config.contextualColors[specialState]) {
      const specialColor = this.config.contextualColors[specialState];
      const pulseIntensity = Math.sin(time * Math.PI * 4) * 0.5 + 0.5; // 0-1 pulse
      baseColor = interpolateColor(pulseIntensity * 0.6, baseColor, specialColor);
    }
    
    // Apply hue shift if enabled
    if (this.config.hueShift.enabled) {
      const hueShiftAmount = (time * this.config.hueShift.speed / 60) * this.config.hueShift.range;
      baseColor = this.shiftHue(baseColor, hueShiftAmount);
    }
    
    // Apply saturation pulse if enabled
    if (this.config.saturationPulse.enabled) {
      const saturationPulse = Math.sin(time * Math.PI * 2 * this.config.saturationPulse.frequency) * 
                              this.config.saturationPulse.intensity;
      baseColor = this.adjustSaturation(baseColor, 1 + saturationPulse);
    }
    
    return baseColor;
  }
  
  // Get gradient for bars
  getBarGradient(
    itemId: string,
    index: number,
    frame: number,
    fps: number,
    direction: 'horizontal' | 'vertical' | 'radial' = 'horizontal'
  ): string {
    if (!this.config.gradientMode) {
      return this.getItemColor(itemId, index, frame, fps);
    }
    
    const baseColor = this.getBaseColor(index);
    const accentColor = this.getAccentColor(index);
    const time = frame / fps;
    
    // Animate gradient colors
    const animatedBase = this.config.hueShift.enabled 
      ? this.shiftHue(baseColor, (time * this.config.hueShift.speed / 60) * this.config.hueShift.range)
      : baseColor;
    
    const animatedAccent = this.config.hueShift.enabled
      ? this.shiftHue(accentColor, (time * this.config.hueShift.speed / 60) * this.config.hueShift.range)
      : accentColor;
    
    switch (direction) {
      case 'horizontal':
        return `linear-gradient(90deg, ${animatedBase}, ${animatedAccent})`;
      case 'vertical':
        return `linear-gradient(180deg, ${animatedBase}, ${animatedAccent})`;
      case 'radial':
        return `radial-gradient(circle, ${animatedBase}, ${animatedAccent})`;
      default:
        return animatedBase;
    }
  }
  
  // Get animated background
  getAnimatedBackground(frame: number, fps: number): string {
    const time = frame / fps;
    const colors = [
      this.currentScheme.background,
      this.adjustBrightness(this.currentScheme.background, 1.2),
      this.adjustBrightness(this.currentScheme.background, 0.8),
    ];
    
    return createAnimatedGradient(frame, fps, colors, 8, 45);
  }
  
  // Transition to new color scheme
  transitionToScheme(newSchemeName: string, frame: number, fps: number): void {
    const newScheme = ColorSchemes[newSchemeName];
    if (!newScheme) return;
    
    // Implement smooth transition logic
    // This would involve interpolating between current and new scheme colors
    this.currentScheme = newScheme;
  }
  
  // Get color palette for current frame
  getCurrentPalette(frame: number, fps: number): string[] {
    const time = frame / fps;
    const palette = [...this.currentScheme.primary];
    
    if (this.config.cycleColors) {
      // Rotate colors over time
      const rotationIndex = Math.floor(time / this.config.transitionDuration) % palette.length;
      return [...palette.slice(rotationIndex), ...palette.slice(0, rotationIndex)];
    }
    
    return palette;
  }
  
  // Private helper methods
  private getBaseColor(index: number): string {
    const palette = this.currentScheme.primary;
    return palette[index % palette.length];
  }
  
  private getAccentColor(index: number): string {
    const palette = this.currentScheme.accent;
    return palette[index % palette.length];
  }
  
  private shiftHue(color: string, degrees: number): string {
    const hsl = this.hexToHsl(color);
    hsl.h = (hsl.h + degrees) % 360;
    return this.hslToHex(hsl);
  }
  
  private adjustSaturation(color: string, factor: number): string {
    const hsl = this.hexToHsl(color);
    hsl.s = Math.min(100, Math.max(0, hsl.s * factor));
    return this.hslToHex(hsl);
  }
  
  private adjustBrightness(color: string, factor: number): string {
    const hsl = this.hexToHsl(color);
    hsl.l = Math.min(100, Math.max(0, hsl.l * factor));
    return this.hslToHex(hsl);
  }
  
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
  
  private hslToHex({ h, s, l }: { h: number; s: number; l: number }): string {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

// Theme presets for different chart types
export const ThemePresets = {
  sports: {
    scheme: 'vibrant',
    config: {
      baseColors: ColorSchemes.vibrant.primary,
      transitionDuration: 2,
      cycleColors: false,
      gradientMode: true,
      hueShift: { enabled: false, speed: 1, range: 30 },
      saturationPulse: { enabled: true, intensity: 0.2, frequency: 0.5 },
      contextualColors: {
        recordBreaking: '#FFD700',
        overtaking: '#00FF00',
        milestone: '#FF6B6B',
        declining: '#FF4757',
      },
    } as DynamicColorConfig,
  },
  
  business: {
    scheme: 'ocean',
    config: {
      baseColors: ColorSchemes.ocean.primary,
      transitionDuration: 4,
      cycleColors: false,
      gradientMode: true,
      hueShift: { enabled: true, speed: 0.5, range: 15 },
      saturationPulse: { enabled: false, intensity: 0, frequency: 0 },
      contextualColors: {
        recordBreaking: '#00FFFF',
        overtaking: '#3399FF',
        milestone: '#0080FF',
        declining: '#FF4757',
      },
    } as DynamicColorConfig,
  },
  
  entertainment: {
    scheme: 'neon',
    config: {
      baseColors: ColorSchemes.neon.primary,
      transitionDuration: 1,
      cycleColors: true,
      gradientMode: true,
      hueShift: { enabled: true, speed: 2, range: 60 },
      saturationPulse: { enabled: true, intensity: 0.4, frequency: 1 },
      contextualColors: {
        recordBreaking: '#FF00FF',
        overtaking: '#00FFFF',
        milestone: '#FFFF00',
        declining: '#FF0080',
      },
    } as DynamicColorConfig,
  },
  
  nature: {
    scheme: 'forest',
    config: {
      baseColors: ColorSchemes.forest.primary,
      transitionDuration: 6,
      cycleColors: false,
      gradientMode: true,
      hueShift: { enabled: true, speed: 0.3, range: 20 },
      saturationPulse: { enabled: true, intensity: 0.15, frequency: 0.3 },
      contextualColors: {
        recordBreaking: '#F1C40F',
        overtaking: '#2ECC71',
        milestone: '#E67E22',
        declining: '#E74C3C',
      },
    } as DynamicColorConfig,
  },
};