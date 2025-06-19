/**
 * Unit tests for Animation Utilities
 */

import {
  interpolate,
  spring,
  interpolateColor,
  calculateProgress,
  easeInOut,
  easeIn,
  easeOut,
  calculateBarPosition,
  calculateOvertakeProgress
} from '../utils/AnimationUtils';

describe('AnimationUtils', () => {
  describe('interpolate', () => {
    test('should interpolate linear values correctly', () => {
      expect(interpolate(0, 100, 0)).toBe(0);
      expect(interpolate(0, 100, 0.5)).toBe(50);
      expect(interpolate(0, 100, 1)).toBe(100);
    });

    test('should handle negative values', () => {
      expect(interpolate(-100, 100, 0.5)).toBe(0);
      expect(interpolate(-50, -10, 0.25)).toBe(-40);
    });

    test('should clamp progress values', () => {
      expect(interpolate(0, 100, -0.5)).toBe(0);
      expect(interpolate(0, 100, 1.5)).toBe(100);
    });

    test('should handle same start and end values', () => {
      expect(interpolate(50, 50, 0)).toBe(50);
      expect(interpolate(50, 50, 0.5)).toBe(50);
      expect(interpolate(50, 50, 1)).toBe(50);
    });
  });

  describe('spring', () => {
    test('should apply spring animation', () => {
      // Spring should overshoot slightly
      const configs = [
        { mass: 1, damping: 10, stiffness: 100 },
        { mass: 2, damping: 20, stiffness: 50 },
        { mass: 0.5, damping: 5, stiffness: 200 }
      ];

      configs.forEach(config => {
        const result = spring(0.5, config);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(1);
      });
    });

    test('should handle edge values', () => {
      const config = { mass: 1, damping: 10, stiffness: 100 };
      expect(spring(0, config)).toBe(0);
      expect(spring(1, config)).toBeCloseTo(1, 5);
    });
  });

  describe('interpolateColor', () => {
    test('should interpolate between colors', () => {
      const result = interpolateColor('#000000', '#FFFFFF', 0.5);
      expect(result).toBe('#808080');
    });

    test('should handle RGB colors', () => {
      const result = interpolateColor('#FF0000', '#0000FF', 0.5);
      expect(result).toMatch(/^#[0-9A-F]{6}$/i);
    });

    test('should handle edge cases', () => {
      expect(interpolateColor('#FF0000', '#0000FF', 0)).toBe('#FF0000');
      expect(interpolateColor('#FF0000', '#0000FF', 1)).toBe('#0000FF');
    });

    test('should handle invalid colors gracefully', () => {
      expect(interpolateColor('invalid', '#FFFFFF', 0.5)).toBe('#FFFFFF');
      expect(interpolateColor('#000000', 'invalid', 0.5)).toBe('#000000');
    });
  });

  describe('calculateProgress', () => {
    test('should calculate progress correctly', () => {
      expect(calculateProgress(0, 100)).toBe(0);
      expect(calculateProgress(50, 100)).toBe(0.5);
      expect(calculateProgress(100, 100)).toBe(1);
    });

    test('should handle zero total frames', () => {
      expect(calculateProgress(50, 0)).toBe(1);
    });

    test('should clamp values', () => {
      expect(calculateProgress(-10, 100)).toBe(0);
      expect(calculateProgress(110, 100)).toBe(1);
    });
  });

  describe('Easing Functions', () => {
    describe('easeInOut', () => {
      test('should ease in and out correctly', () => {
        expect(easeInOut(0)).toBe(0);
        expect(easeInOut(0.5)).toBe(0.5);
        expect(easeInOut(1)).toBe(1);
        
        // Should be symmetrical
        expect(easeInOut(0.25)).toBeCloseTo(easeInOut(0.75), 5);
      });
    });

    describe('easeIn', () => {
      test('should ease in correctly', () => {
        expect(easeIn(0)).toBe(0);
        expect(easeIn(1)).toBe(1);
        
        // Should start slow
        expect(easeIn(0.1)).toBeLessThan(0.1);
        expect(easeIn(0.5)).toBeLessThan(0.5);
      });
    });

    describe('easeOut', () => {
      test('should ease out correctly', () => {
        expect(easeOut(0)).toBe(0);
        expect(easeOut(1)).toBe(1);
        
        // Should end slow
        expect(easeOut(0.5)).toBeGreaterThan(0.5);
        expect(easeOut(0.9)).toBeGreaterThan(0.9);
      });
    });
  });

  describe('calculateBarPosition', () => {
    test('should calculate positions correctly', () => {
      const containerHeight = 1000;
      const barHeight = 50;
      const spacing = 10;
      
      expect(calculateBarPosition(0, containerHeight, barHeight, spacing)).toBe(0);
      expect(calculateBarPosition(1, containerHeight, barHeight, spacing)).toBe(60); // 50 + 10
      expect(calculateBarPosition(2, containerHeight, barHeight, spacing)).toBe(120); // 2 * (50 + 10)
    });

    test('should handle zero spacing', () => {
      const containerHeight = 1000;
      const barHeight = 50;
      
      expect(calculateBarPosition(0, containerHeight, barHeight, 0)).toBe(0);
      expect(calculateBarPosition(1, containerHeight, barHeight, 0)).toBe(50);
    });

    test('should handle edge cases', () => {
      expect(calculateBarPosition(-1, 1000, 50, 10)).toBe(0);
      expect(calculateBarPosition(0, 0, 50, 10)).toBe(0);
    });
  });

  describe('calculateOvertakeProgress', () => {
    test('should calculate overtake progress', () => {
      const currentRank = 3;
      const previousRank = 5;
      const transitionProgress = 0.5;
      
      const result = calculateOvertakeProgress(currentRank, previousRank, transitionProgress);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    test('should handle no rank change', () => {
      const result = calculateOvertakeProgress(3, 3, 0.5);
      expect(result).toBe(0);
    });

    test('should handle rank improvements', () => {
      // Moving from rank 5 to rank 3 (improvement)
      const result = calculateOvertakeProgress(3, 5, 0.5);
      expect(result).toBeGreaterThan(0);
    });

    test('should handle rank drops', () => {
      // Moving from rank 3 to rank 5 (drop)
      const result = calculateOvertakeProgress(5, 3, 0.5);
      expect(result).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    test('should compose animations correctly', () => {
      // Test combining easing with interpolation
      const progress = 0.3;
      const easedProgress = easeInOut(progress);
      const value = interpolate(0, 100, easedProgress);
      
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(100);
      expect(value).not.toBe(30); // Should be different due to easing
    });

    test('should handle complex color transitions', () => {
      const colors = ['#FF0000', '#00FF00', '#0000FF'];
      const progress = 0.5;
      
      // Interpolate between first two colors
      const color1 = interpolateColor(colors[0], colors[1], progress);
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i);
      
      // Should be different from both source colors
      expect(color1).not.toBe(colors[0]);
      expect(color1).not.toBe(colors[1]);
    });

    test('should handle bar position animations', () => {
      const ranks = [1, 3, 2, 4, 5];
      const containerHeight = 500;
      const barHeight = 80;
      const spacing = 10;
      
      const positions = ranks.map(rank => 
        calculateBarPosition(rank - 1, containerHeight, barHeight, spacing)
      );
      
      // All positions should be unique
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(ranks.length);
      
      // Positions should be non-negative
      positions.forEach(pos => {
        expect(pos).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Performance', () => {
    test('should handle rapid calculations efficiently', () => {
      const iterations = 10000;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const progress = i / iterations;
        interpolate(0, 100, progress);
        easeInOut(progress);
        calculateBarPosition(i % 10, 1000, 50, 10);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(100); // Less than 100ms for 10k operations
    });
  });
});