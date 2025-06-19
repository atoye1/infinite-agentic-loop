/**
 * Unit tests for utility functions
 */

import {
  generateColors,
  formatValue,
  validateFrameData,
  calculateContainerDimensions,
  getFrameData,
  safeGetFrameData,
  validateProcessedData,
  createSampleData,
  parseCSVContent,
  sanitizeFilename,
  formatDuration,
  formatBytes
} from '../utils';
import { ProcessedData, FrameData } from '../types';

describe('Utils', () => {
  describe('generateColors', () => {
    test('should generate auto colors', () => {
      const colors = generateColors(5, 'auto');
      expect(colors).toHaveLength(5);
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('should use custom colors when provided', () => {
      const customColors = ['#FF0000', '#00FF00', '#0000FF'];
      const colors = generateColors(3, customColors);
      expect(colors).toEqual(customColors);
    });

    test('should cycle custom colors if needed', () => {
      const customColors = ['#FF0000', '#00FF00'];
      const colors = generateColors(5, customColors);
      expect(colors).toHaveLength(5);
      expect(colors[0]).toBe('#FF0000');
      expect(colors[1]).toBe('#00FF00');
      expect(colors[2]).toBe('#FF0000'); // Cycling
      expect(colors[3]).toBe('#00FF00');
      expect(colors[4]).toBe('#FF0000');
    });

    test('should handle edge cases', () => {
      expect(generateColors(0, 'auto')).toEqual([]);
      expect(generateColors(1, [])).toHaveLength(1);
    });
  });

  describe('formatValue', () => {
    test('should format basic values', () => {
      expect(formatValue(1234, '{value}')).toBe('1234');
      expect(formatValue(1234.56, '{value:.2f}')).toBe('1234.56');
      expect(formatValue(1234567, '{value:,.0f}')).toBe('1,234,567');
    });

    test('should handle prefix and suffix', () => {
      expect(formatValue(100, '{value}', '$')).toBe('$100');
      expect(formatValue(100, '{value}', '', '%')).toBe('100%');
      expect(formatValue(100, '{value}', '$', ' USD')).toBe('$100 USD');
    });

    test('should handle different number formats', () => {
      expect(formatValue(1234567.89, '{value:,.2f}')).toBe('1,234,567.89');
      expect(formatValue(0.123456, '{value:.4f}')).toBe('0.1235');
      expect(formatValue(1234, '{value:.0f}')).toBe('1234');
    });

    test('should handle special values', () => {
      expect(formatValue(0, '{value}')).toBe('0');
      expect(formatValue(-1234, '{value:,.0f}')).toBe('-1,234');
      expect(formatValue(NaN, '{value}')).toBe('NaN');
      expect(formatValue(Infinity, '{value}')).toBe('Infinity');
    });
  });

  describe('validateFrameData', () => {
    const validFrameData: FrameData = {
      frame: 0,
      date: '2024-01-01',
      items: [
        { id: 'item1', name: 'Item 1', value: 100, rank: 1 },
        { id: 'item2', name: 'Item 2', value: 50, rank: 2 }
      ],
      maxValue: 100
    };

    test('should validate correct frame data', () => {
      expect(validateFrameData(validFrameData)).toBe(true);
    });

    test('should reject invalid frame data', () => {
      expect(validateFrameData(null)).toBe(false);
      expect(validateFrameData(undefined)).toBe(false);
      expect(validateFrameData({})).toBe(false);
      expect(validateFrameData({ frame: 0 })).toBe(false);
    });

    test('should validate required fields', () => {
      const invalidData = [
        { ...validFrameData, frame: undefined },
        { ...validFrameData, date: undefined },
        { ...validFrameData, items: undefined },
        { ...validFrameData, items: [] },
        { ...validFrameData, maxValue: undefined }
      ];

      invalidData.forEach(data => {
        expect(validateFrameData(data as any)).toBe(false);
      });
    });

    test('should validate item structure', () => {
      const invalidItem = {
        ...validFrameData,
        items: [{ id: 'item1', value: 100 }] // Missing name and rank
      };
      expect(validateFrameData(invalidItem as any)).toBe(false);
    });
  });

  describe('calculateContainerDimensions', () => {
    test('should calculate dimensions with padding', () => {
      const chartConfig = {
        position: { top: 100, right: 50, bottom: 100, left: 50 }
      };
      const result = calculateContainerDimensions(chartConfig as any, 1920, 1080);
      
      expect(result.width).toBe(1820); // 1920 - 50 - 50
      expect(result.height).toBe(880); // 1080 - 100 - 100
      expect(result.x).toBe(50);
      expect(result.y).toBe(100);
    });

    test('should handle zero padding', () => {
      const chartConfig = {
        position: { top: 0, right: 0, bottom: 0, left: 0 }
      };
      const result = calculateContainerDimensions(chartConfig as any, 1920, 1080);
      
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    test('should handle edge cases', () => {
      const chartConfig = {
        position: { top: 500, right: 900, bottom: 500, left: 900 }
      };
      const result = calculateContainerDimensions(chartConfig as any, 1920, 1080);
      
      // Should return minimum viable dimensions
      expect(result.width).toBe(120); // 1920 - 900 - 900
      expect(result.height).toBe(80); // 1080 - 500 - 500
    });
  });

  describe('getFrameData & safeGetFrameData', () => {
    const processedData: ProcessedData = {
      frames: [
        {
          frame: 0,
          date: '2024-01-01',
          items: [{ id: 'item1', name: 'Item 1', value: 100, rank: 1 }],
          maxValue: 100
        },
        {
          frame: 1,
          date: '2024-01-02',
          items: [{ id: 'item1', name: 'Item 1', value: 150, rank: 1 }],
          maxValue: 150
        }
      ],
      totalFrames: 2,
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        categories: ['item1'],
        maxGlobalValue: 150
      }
    };

    test('should get frame data by index', () => {
      expect(getFrameData(processedData, 0)).toEqual(processedData.frames[0]);
      expect(getFrameData(processedData, 1)).toEqual(processedData.frames[1]);
    });

    test('should handle out of bounds indices', () => {
      expect(getFrameData(processedData, -1)).toEqual(processedData.frames[0]);
      expect(getFrameData(processedData, 2)).toEqual(processedData.frames[1]);
    });

    test('safeGetFrameData should handle null/undefined', () => {
      expect(safeGetFrameData(null, 0)).toBeNull();
      expect(safeGetFrameData(undefined, 0)).toBeNull();
    });

    test('safeGetFrameData should validate data', () => {
      const invalidData = { frames: [], totalFrames: 0 } as any;
      expect(safeGetFrameData(invalidData, 0)).toBeNull();
    });
  });

  describe('validateProcessedData', () => {
    const validData: ProcessedData = {
      frames: [
        {
          frame: 0,
          date: '2024-01-01',
          items: [{ id: 'item1', name: 'Item 1', value: 100, rank: 1 }],
          maxValue: 100
        }
      ],
      totalFrames: 1,
      metadata: {
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        categories: ['item1'],
        maxGlobalValue: 100
      }
    };

    test('should validate correct processed data', () => {
      const result = validateProcessedData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid data', () => {
      const invalidCases = [
        null,
        undefined,
        {},
        { frames: [] },
        { frames: [], totalFrames: 0 },
        { frames: [{}], totalFrames: 1 }
      ];

      invalidCases.forEach(data => {
        const result = validateProcessedData(data as any);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('createSampleData', () => {
    test('should create valid sample data', () => {
      const sampleData = createSampleData();
      expect(sampleData).toBeDefined();
      expect(sampleData.frames).toBeDefined();
      expect(sampleData.frames.length).toBeGreaterThan(0);
      expect(sampleData.totalFrames).toBe(sampleData.frames.length);
    });

    test('should create data with correct structure', () => {
      const sampleData = createSampleData();
      const firstFrame = sampleData.frames[0];
      
      expect(firstFrame).toHaveProperty('frame');
      expect(firstFrame).toHaveProperty('date');
      expect(firstFrame).toHaveProperty('items');
      expect(firstFrame).toHaveProperty('maxValue');
      
      expect(Array.isArray(firstFrame.items)).toBe(true);
      expect(firstFrame.items.length).toBeGreaterThan(0);
    });

    test('should create valid metadata', () => {
      const sampleData = createSampleData();
      expect(sampleData.metadata).toBeDefined();
      expect(sampleData.metadata.startDate).toBeDefined();
      expect(sampleData.metadata.endDate).toBeDefined();
      expect(sampleData.metadata.categories).toBeDefined();
      expect(sampleData.metadata.maxGlobalValue).toBeGreaterThan(0);
    });
  });

  describe('parseCSVContent', () => {
    test('should parse valid CSV', () => {
      const csv = `Name,Value,Date
Item1,100,2024-01-01
Item2,200,2024-01-02`;
      
      const result = parseCSVContent(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Name: 'Item1', Value: '100', Date: '2024-01-01' });
      expect(result[1]).toEqual({ Name: 'Item2', Value: '200', Date: '2024-01-02' });
    });

    test('should handle empty CSV', () => {
      expect(parseCSVContent('')).toEqual([]);
      expect(parseCSVContent('\n\n')).toEqual([]);
    });

    test('should handle CSV with quotes', () => {
      const csv = `Name,Value
"Item with, comma",100
"Item with ""quotes""",200`;
      
      const result = parseCSVContent(csv);
      expect(result[0].Name).toBe('Item with, comma');
      expect(result[1].Name).toBe('Item with "quotes"');
    });
  });

  describe('sanitizeFilename', () => {
    test('should sanitize invalid characters', () => {
      expect(sanitizeFilename('file/name')).toBe('file-name');
      expect(sanitizeFilename('file:name')).toBe('file-name');
      expect(sanitizeFilename('file*name')).toBe('file-name');
      expect(sanitizeFilename('file<>name')).toBe('file--name');
    });

    test('should handle edge cases', () => {
      expect(sanitizeFilename('')).toBe('unnamed');
      expect(sanitizeFilename('   ')).toBe('unnamed');
      expect(sanitizeFilename('valid-file_name.mp4')).toBe('valid-file_name.mp4');
    });
  });

  describe('formatDuration', () => {
    test('should format durations correctly', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3661)).toBe('1:01:01');
    });

    test('should handle negative values', () => {
      expect(formatDuration(-30)).toBe('0:00');
    });
  });

  describe('formatBytes', () => {
    test('should format byte sizes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    test('should handle decimals', () => {
      expect(formatBytes(1536, 2)).toBe('1.50 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });

    test('should handle negative values', () => {
      expect(formatBytes(-1024)).toBe('-1 KB');
    });
  });
});