/**
 * Unit tests for Configuration Validation
 */

import { validateConfig, validateOutputConfig, validateDataConfig, validateLayerConfig } from '../utils/ValidationUtils';
import { BarChartRaceConfig } from '../types';

describe('Configuration Validation', () => {
  const validConfig: BarChartRaceConfig = {
    output: {
      filename: "test.mp4",
      format: "mp4",
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5,
      quality: "high"
    },
    data: {
      csvPath: "./test.csv",
      dateColumn: "Date",
      dateFormat: "YYYY-MM-DD",
      valueColumns: ["Item1", "Item2"],
      interpolation: "smooth"
    },
    layers: {
      background: {
        color: "#000000",
        opacity: 100
      },
      chart: {
        position: {
          top: 100,
          right: 100,
          bottom: 100,
          left: 100
        },
        chart: {
          visibleItemCount: 10,
          maxValue: "auto",
          itemSpacing: 20
        },
        animation: {
          type: "continuous",
          overtakeDuration: 0.5
        },
        bar: {
          colors: ["#FF0000", "#00FF00"],
          cornerRadius: 5,
          opacity: 90
        },
        labels: {
          title: {
            show: true,
            fontSize: 16,
            fontFamily: "Arial",
            color: "#FFFFFF",
            position: "inside"
          },
          value: {
            show: true,
            fontSize: 14,
            fontFamily: "Arial",
            color: "#FFFFFF",
            format: "{value}"
          },
          rank: {
            show: true,
            fontSize: 12,
            backgroundColor: "#333333",
            textColor: "#FFFFFF"
          }
        }
      }
    }
  };

  describe('validateConfig', () => {
    test('should validate complete valid config', () => {
      const result = validateConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should catch missing required fields', () => {
      const invalidConfig = {
        output: validConfig.output,
        // Missing data and layers
      } as any;
      
      const result = validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'data',
          message: expect.stringContaining('required')
        })
      );
    });

    test('should validate nested structures', () => {
      const configWithInvalidNested = {
        ...validConfig,
        output: {
          ...validConfig.output,
          width: -1920 // Invalid negative width
        }
      };
      
      const result = validateConfig(configWithInvalidNested);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'output.width',
          message: expect.stringContaining('positive')
        })
      );
    });
  });

  describe('validateOutputConfig', () => {
    test('should validate valid output config', () => {
      const result = validateOutputConfig(validConfig.output);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate format options', () => {
      const validFormats = ['mp4', 'webm', 'gif'];
      validFormats.forEach(format => {
        const config = { ...validConfig.output, format: format as any };
        const result = validateOutputConfig(config);
        expect(result.isValid).toBe(true);
      });
      
      const invalidFormat = { ...validConfig.output, format: 'avi' as any };
      const result = validateOutputConfig(invalidFormat);
      expect(result.isValid).toBe(false);
    });

    test('should validate dimension constraints', () => {
      const testCases = [
        { width: 0, height: 1080, valid: false },
        { width: 1920, height: 0, valid: false },
        { width: 8000, height: 1080, valid: false }, // Too large
        { width: 1920, height: 5000, valid: false }, // Too large
        { width: 640, height: 480, valid: true },
        { width: 3840, height: 2160, valid: true }, // 4K
      ];
      
      testCases.forEach(({ width, height, valid }) => {
        const config = { ...validConfig.output, width, height };
        const result = validateOutputConfig(config);
        expect(result.isValid).toBe(valid);
      });
    });

    test('should validate fps constraints', () => {
      const testCases = [
        { fps: 0, valid: false },
        { fps: 15, valid: true },
        { fps: 30, valid: true },
        { fps: 60, valid: true },
        { fps: 120, valid: false }, // Too high
      ];
      
      testCases.forEach(({ fps, valid }) => {
        const config = { ...validConfig.output, fps };
        const result = validateOutputConfig(config);
        expect(result.isValid).toBe(valid);
      });
    });

    test('should validate quality options', () => {
      const validQualities = ['low', 'medium', 'high', 'max'];
      validQualities.forEach(quality => {
        const config = { ...validConfig.output, quality: quality as any };
        const result = validateOutputConfig(config);
        expect(result.isValid).toBe(true);
      });
      
      const invalidQuality = { ...validConfig.output, quality: 'ultra' as any };
      const result = validateOutputConfig(invalidQuality);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateDataConfig', () => {
    test('should validate valid data config', () => {
      const result = validateDataConfig(validConfig.data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate date formats', () => {
      const validFormats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD'];
      validFormats.forEach(dateFormat => {
        const config = { ...validConfig.data, dateFormat };
        const result = validateDataConfig(config);
        expect(result.isValid).toBe(true);
      });
      
      const invalidFormat = { ...validConfig.data, dateFormat: 'invalid' };
      const result = validateDataConfig(invalidFormat);
      expect(result.isValid).toBe(false);
    });

    test('should validate value columns', () => {
      const testCases = [
        { valueColumns: [], valid: false }, // Empty
        { valueColumns: ['Item1'], valid: true }, // Single
        { valueColumns: ['Item1', 'Item2', 'Item3'], valid: true }, // Multiple
        { valueColumns: new Array(50).fill('Item'), valid: true }, // Many
      ];
      
      testCases.forEach(({ valueColumns, valid }) => {
        const config = { ...validConfig.data, valueColumns };
        const result = validateDataConfig(config);
        expect(result.isValid).toBe(valid);
      });
    });

    test('should validate interpolation methods', () => {
      const validMethods = ['smooth', 'linear', 'step'];
      validMethods.forEach(interpolation => {
        const config = { ...validConfig.data, interpolation: interpolation as any };
        const result = validateDataConfig(config);
        expect(result.isValid).toBe(true);
      });
      
      const invalidMethod = { ...validConfig.data, interpolation: 'cubic' as any };
      const result = validateDataConfig(invalidMethod);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateLayerConfig', () => {
    test('should validate complete layer config', () => {
      const result = validateLayerConfig(validConfig.layers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate background layer', () => {
      const testCases = [
        { color: '#FF0000', opacity: 100, valid: true },
        { color: 'red', opacity: 100, valid: false }, // Invalid color format
        { color: '#FF0000', opacity: -1, valid: false }, // Invalid opacity
        { color: '#FF0000', opacity: 101, valid: false }, // Invalid opacity
      ];
      
      testCases.forEach(({ color, opacity, valid }) => {
        const config = {
          ...validConfig.layers,
          background: { color, opacity }
        };
        const result = validateLayerConfig(config);
        expect(result.isValid).toBe(valid);
      });
    });

    test('should validate chart position', () => {
      const testCases = [
        { top: 0, right: 0, bottom: 0, left: 0, valid: true },
        { top: -10, right: 0, bottom: 0, left: 0, valid: false },
        { top: 100, right: 100, bottom: 100, left: 100, valid: true },
      ];
      
      testCases.forEach(({ top, right, bottom, left, valid }) => {
        const config = {
          ...validConfig.layers,
          chart: {
            ...validConfig.layers.chart,
            position: { top, right, bottom, left }
          }
        };
        const result = validateLayerConfig(config);
        expect(result.isValid).toBe(valid);
      });
    });

    test('should validate chart settings', () => {
      const testCases = [
        { visibleItemCount: 0, valid: false },
        { visibleItemCount: 5, valid: true },
        { visibleItemCount: 50, valid: true },
        { maxValue: 'auto', valid: true },
        { maxValue: 'local', valid: true },
        { maxValue: 'global', valid: true },
        { maxValue: 'fixed', valid: false }, // Invalid option
      ];
      
      testCases.forEach(({ visibleItemCount, maxValue, valid }) => {
        const config = {
          ...validConfig.layers,
          chart: {
            ...validConfig.layers.chart,
            chart: {
              ...validConfig.layers.chart.chart,
              visibleItemCount: visibleItemCount || validConfig.layers.chart.chart.visibleItemCount,
              maxValue: (maxValue || validConfig.layers.chart.chart.maxValue) as any
            }
          }
        };
        const result = validateLayerConfig(config);
        expect(result.isValid).toBe(valid);
      });
    });

    test('should validate animation settings', () => {
      const testCases = [
        { type: 'continuous', overtakeDuration: 0.5, valid: true },
        { type: 'stepped', overtakeDuration: 0, valid: true },
        { type: 'invalid', overtakeDuration: 0.5, valid: false },
        { type: 'continuous', overtakeDuration: -0.5, valid: false },
        { type: 'continuous', overtakeDuration: 10, valid: false }, // Too long
      ];
      
      testCases.forEach(({ type, overtakeDuration, valid }) => {
        const config = {
          ...validConfig.layers,
          chart: {
            ...validConfig.layers.chart,
            animation: { type: type as any, overtakeDuration }
          }
        };
        const result = validateLayerConfig(config);
        expect(result.isValid).toBe(valid);
      });
    });

    test('should validate bar colors', () => {
      const testCases = [
        { colors: [], valid: false }, // Empty
        { colors: ['#FF0000'], valid: true }, // Single
        { colors: ['#FF0000', '#00FF00', '#0000FF'], valid: true }, // Multiple
        { colors: ['red', 'green'], valid: false }, // Invalid format
        { colors: 'auto', valid: true }, // Auto colors
      ];
      
      testCases.forEach(({ colors, valid }) => {
        const config = {
          ...validConfig.layers,
          chart: {
            ...validConfig.layers.chart,
            bar: {
              ...validConfig.layers.chart.bar,
              colors: colors as any
            }
          }
        };
        const result = validateLayerConfig(config);
        expect(result.isValid).toBe(valid);
      });
    });

    test('should validate optional layers', () => {
      // Config without optional layers should still be valid
      const minimalLayers = {
        background: validConfig.layers.background,
        chart: validConfig.layers.chart
      };
      
      const result = validateLayerConfig(minimalLayers);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined gracefully', () => {
      expect(() => validateConfig(null as any)).not.toThrow();
      expect(() => validateConfig(undefined as any)).not.toThrow();
      
      const nullResult = validateConfig(null as any);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors.length).toBeGreaterThan(0);
    });

    test('should handle partial configs', () => {
      const partialConfig = {
        output: validConfig.output
        // Missing other required fields
      };
      
      const result = validateConfig(partialConfig as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: expect.stringContaining('data')
        })
      );
    });

    test('should provide helpful error messages', () => {
      const invalidConfig = {
        ...validConfig,
        output: {
          ...validConfig.output,
          fps: 200 // Too high
        }
      };
      
      const result = validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      const fpsError = result.errors.find(e => e.field.includes('fps'));
      expect(fpsError?.message).toContain('60');
    });
  });
});