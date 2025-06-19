/**
 * Comprehensive error handling tests for the Bar Chart Race system
 */

import { DataProcessor, DataProcessingError, ProcessingConfig } from '../DataProcessor';
import { ValidationUtils } from '../utils/ValidationUtils';
import { validateProcessedData, safeGetFrameData } from '../utils';

describe('Error Handling Tests', () => {
  describe('CSV Parsing Error Handling', () => {
    const validConfig: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Value1', 'Value2'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    };

    test('should throw error for empty CSV content', () => {
      const processor = new DataProcessor(validConfig);
      expect(() => processor.parseCSV('')).toThrow(DataProcessingError);
      expect(() => processor.parseCSV('')).toThrow(
        expect.objectContaining({
          code: 'EMPTY_CSV'
        })
      );
    });

    test('should throw error for insufficient data', () => {
      const processor = new DataProcessor(validConfig);
      expect(() => processor.parseCSV('Header Only\n')).toThrow(DataProcessingError);
      expect(() => processor.parseCSV('Header Only\n')).toThrow(
        expect.objectContaining({
          code: 'INSUFFICIENT_DATA'
        })
      );
    });

    test('should throw error for missing required columns', () => {
      const processor = new DataProcessor(validConfig);
      expect(() => processor.parseCSV('WrongColumn,AnotherColumn\n1,2\n')).toThrow();
      expect(() => processor.parseCSV('WrongColumn,AnotherColumn\n1,2\n')).toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Date column')
        })
      );
    });

    test('should handle malformed CSV data gracefully', () => {
      const processor = new DataProcessor(validConfig);
      const malformedCSV = 'Date,Value1,Value2\n2023-01-01,100,200\n2023-01-02,150\n'; // Missing column
      // Should not throw but should handle gracefully
      expect(() => processor.parseCSV(malformedCSV)).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    test('should throw error for invalid config', () => {
      const invalidConfig = {} as ProcessingConfig;
      expect(() => new DataProcessor(invalidConfig)).toThrow(DataProcessingError);
      expect(() => new DataProcessor(invalidConfig)).toThrow(
        expect.objectContaining({
          code: 'INVALID_CONFIG'
        })
      );
    });

    test('should throw error for invalid date format', () => {
      const invalidConfig: ProcessingConfig = {
        dateColumn: 'Date',
        valueColumns: ['Value'],
        dateFormat: 'INVALID_FORMAT' as any,
        interpolationMethod: 'linear',
        fps: 30
      };
      expect(() => new DataProcessor(invalidConfig)).toThrow(DataProcessingError);
      expect(() => new DataProcessor(invalidConfig)).toThrow(
        expect.objectContaining({
          code: 'INVALID_CONFIG'
        })
      );
    });

    test('should throw error for empty value columns', () => {
      const invalidConfig: ProcessingConfig = {
        dateColumn: 'Date',
        valueColumns: [],
        dateFormat: 'YYYY-MM-DD',
        interpolationMethod: 'linear',
        fps: 30
      };
      expect(() => new DataProcessor(invalidConfig)).toThrow(DataProcessingError);
      expect(() => new DataProcessor(invalidConfig)).toThrow(
        expect.objectContaining({
          code: 'INVALID_CONFIG'
        })
      );
    });
  });

  describe('Data Transformation Errors', () => {
    const validConfig: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Value1'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    };

    test('should throw error when transforming without parsing', () => {
      const processor = new DataProcessor(validConfig);
      expect(() => processor.transformData()).toThrow(DataProcessingError);
      expect(() => processor.transformData()).toThrow(
        expect.objectContaining({
          code: 'NO_RAW_DATA'
        })
      );
    });

    test('should handle invalid date values gracefully', () => {
      const processor = new DataProcessor(validConfig);
      const csvWithInvalidDates = 'Date,Value1\ninvalid-date,100\n2023-01-01,200\n';
      processor.parseCSV(csvWithInvalidDates);
      // Should complete but with warnings
      expect(() => processor.transformData()).not.toThrow();
    });

    test('should handle non-numeric values gracefully', () => {
      const processor = new DataProcessor(validConfig);
      const csvWithInvalidValues = 'Date,Value1\n2023-01-01,not-a-number\n2023-01-02,200\n';
      processor.parseCSV(csvWithInvalidValues);
      // Should complete but with warnings
      expect(() => processor.transformData()).not.toThrow();
    });
  });

  describe('Frame Generation Errors', () => {
    const validConfig: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Value1'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    };

    test('should throw error when generating frames without processing', () => {
      const processor = new DataProcessor(validConfig);
      expect(() => processor.generateFrameData(10)).toThrow(DataProcessingError);
      expect(() => processor.generateFrameData(10)).toThrow(
        expect.objectContaining({
          code: 'NO_PROCESSED_DATA'
        })
      );
    });

    test('should throw error for invalid duration', () => {
      const processor = new DataProcessor(validConfig);
      const validCSV = 'Date,Value1\n2023-01-01,100\n2023-01-02,200\n';
      processor.parseCSV(validCSV);
      processor.transformData();
      expect(() => processor.generateFrameData(-5)).toThrow(DataProcessingError);
      expect(() => processor.generateFrameData(-5)).toThrow(
        expect.objectContaining({
          code: 'INVALID_DURATION'
        })
      );
    });

    test('should handle edge case data gracefully', () => {
      const processor = new DataProcessor(validConfig);
      const edgeCaseCSV = 'Date,Value1\n2023-01-01,0\n2023-01-01,0\n'; // Same date, zero values
      processor.parseCSV(edgeCaseCSV);
      processor.transformData();
      expect(() => processor.generateFrameData(1)).not.toThrow();
      const frames = processor.generateFrameData(1);
      expect(frames).toBeDefined();
      expect(frames.frames).toBeDefined();
    });
  });

  describe('Validation Utilities', () => {
    test('should validate empty CSV content', () => {
      const result = ValidationUtils.validateCSVContent('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'EMPTY_CSV_CONTENT'
        })
      );
    });

    test('should validate numeric columns', () => {
      const csvWithMixedData = 'Date,Value1,Value2\n2023-01-01,100,abc\n2023-01-02,200,300\n';
      const result = ValidationUtils.validateNumericColumns(csvWithMixedData, ['Value1', 'Value2']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_NUMERIC_VALUES'
        })
      );
    });

    test('should validate valid CSV', () => {
      const validCSV = 'Date,Value1,Value2\n2023-01-01,100,200\n2023-01-02,150,250\n';
      const result = ValidationUtils.validateCSVContent(validCSV, ['Date', 'Value1', 'Value2']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Safe Data Access Functions', () => {
    test('should safely handle null frame data', () => {
      const result = safeGetFrameData(null, 0);
      expect(result).toBeNull();
    });

    test('should safely handle invalid frame data', () => {
      const invalidData = { frames: [], totalFrames: 0 } as any;
      const result = safeGetFrameData(invalidData, 0);
      expect(result).toBeNull();
    });

    test('should validate ProcessedData', () => {
      const result = validateProcessedData(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Classes', () => {
    test('should create DataProcessingError correctly', () => {
      const error = new DataProcessingError('Test error', 'TEST_CODE', { context: 'test' });
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DataProcessingError);
      expect(error.name).toBe('DataProcessingError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test error');
    });
  });
});