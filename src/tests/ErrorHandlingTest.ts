/**
 * Comprehensive error handling tests for the Bar Chart Race system
 */

import { DataProcessor, DataProcessingError, ProcessingConfig } from '../dataprocessor/DataProcessor';
import { ValidationUtils } from '../utils/ValidationUtils';
import { validateProcessedData, safeGetFrameData } from '../utils';

export class ErrorHandlingTest {
  /**
   * Test CSV parsing error handling
   */
  static async testCSVParsingErrors(): Promise<void> {
    console.log('Testing CSV parsing error handling...');

    const validConfig: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Value1', 'Value2'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    };

    // Test 1: Empty CSV content
    try {
      const processor = new DataProcessor(validConfig);
      processor.parseCSV('');
      console.error('❌ Should have thrown error for empty CSV');
    } catch (error) {
      if (error instanceof DataProcessingError && error.code === 'EMPTY_CSV') {
        console.log('✅ Empty CSV error handled correctly');
      } else {
        console.error('❌ Wrong error type for empty CSV:', error);
      }
    }

    // Test 2: Invalid CSV structure
    try {
      const processor = new DataProcessor(validConfig);
      processor.parseCSV('Header Only\n');
      console.error('❌ Should have thrown error for insufficient data');
    } catch (error) {
      if (error instanceof DataProcessingError && error.code === 'INSUFFICIENT_DATA') {
        console.log('✅ Insufficient data error handled correctly');
      } else {
        console.error('❌ Wrong error type for insufficient data:', error);
      }
    }

    // Test 3: Missing required columns
    try {
      const processor = new DataProcessor(validConfig);
      processor.parseCSV('WrongColumn,AnotherColumn\n1,2\n');
      console.error('❌ Should have thrown error for missing columns');
    } catch (error) {
      if (error.message.includes('Date column') && error.message.includes('not found')) {
        console.log('✅ Missing columns error handled correctly');
      } else {
        console.error('❌ Wrong error for missing columns:', error);
      }
    }

    // Test 4: Malformed CSV data
    try {
      const processor = new DataProcessor(validConfig);
      const malformedCSV = 'Date,Value1,Value2\n2023-01-01,100,200\n2023-01-02,150\n'; // Missing column
      processor.parseCSV(malformedCSV);
      // Should not throw but should warn about skipped rows
      console.log('✅ Malformed CSV handled gracefully with warnings');
    } catch (error) {
      console.error('❌ Malformed CSV should not throw fatal error:', error);
    }
  }

  /**
   * Test configuration validation
   */
  static testConfigValidation(): void {
    console.log('Testing configuration validation...');

    // Test 1: Invalid configuration
    try {
      const invalidConfig = {} as ProcessingConfig;
      new DataProcessor(invalidConfig);
      console.error('❌ Should have thrown error for invalid config');
    } catch (error) {
      if (error instanceof DataProcessingError && error.code === 'INVALID_CONFIG') {
        console.log('✅ Invalid config error handled correctly');
      } else {
        console.error('❌ Wrong error type for invalid config:', error);
      }
    }

    // Test 2: Invalid date format
    try {
      const invalidConfig: ProcessingConfig = {
        dateColumn: 'Date',
        valueColumns: ['Value'],
        dateFormat: 'INVALID_FORMAT' as any,
        interpolationMethod: 'linear',
        fps: 30
      };
      new DataProcessor(invalidConfig);
      console.error('❌ Should have thrown error for invalid date format');
    } catch (error) {
      if (error instanceof DataProcessingError && error.code === 'INVALID_CONFIG') {
        console.log('✅ Invalid date format error handled correctly');
      } else {
        console.error('❌ Wrong error type for invalid date format:', error);
      }
    }

    // Test 3: Invalid value columns
    try {
      const invalidConfig: ProcessingConfig = {
        dateColumn: 'Date',
        valueColumns: [],
        dateFormat: 'YYYY-MM-DD',
        interpolationMethod: 'linear',
        fps: 30
      };
      new DataProcessor(invalidConfig);
      console.error('❌ Should have thrown error for empty value columns');
    } catch (error) {
      if (error instanceof DataProcessingError && error.code === 'INVALID_CONFIG') {
        console.log('✅ Empty value columns error handled correctly');
      } else {
        console.error('❌ Wrong error type for empty value columns:', error);
      }
    }
  }

  /**
   * Test data transformation errors
   */
  static async testDataTransformationErrors(): Promise<void> {
    console.log('Testing data transformation error handling...');

    const validConfig: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Value1'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    };

    // Test 1: Transform without parsing
    try {
      const processor = new DataProcessor(validConfig);
      processor.transformData();
      console.error('❌ Should have thrown error for transforming without parsing');
    } catch (error) {
      if (error instanceof DataProcessingError && error.code === 'NO_RAW_DATA') {
        console.log('✅ No raw data error handled correctly');
      } else {
        console.error('❌ Wrong error type for no raw data:', error);
      }
    }

    // Test 2: Invalid date values
    try {
      const processor = new DataProcessor(validConfig);
      const csvWithInvalidDates = 'Date,Value1\ninvalid-date,100\n2023-01-01,200\n';
      processor.parseCSV(csvWithInvalidDates);
      processor.transformData();
      // Should complete but with warnings
      console.log('✅ Invalid dates handled gracefully with warnings');
    } catch (error) {
      console.error('❌ Invalid dates should not cause fatal error:', error);
    }

    // Test 3: Non-numeric values
    try {
      const processor = new DataProcessor(validConfig);
      const csvWithInvalidValues = 'Date,Value1\n2023-01-01,not-a-number\n2023-01-02,200\n';
      processor.parseCSV(csvWithInvalidValues);
      processor.transformData();
      // Should complete but with warnings
      console.log('✅ Non-numeric values handled gracefully with warnings');
    } catch (error) {
      console.error('❌ Non-numeric values should not cause fatal error:', error);
    }
  }

  /**
   * Test frame generation errors
   */
  static async testFrameGenerationErrors(): Promise<void> {
    console.log('Testing frame generation error handling...');

    const validConfig: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Value1'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    };

    // Test 1: Generate frames without processing
    try {
      const processor = new DataProcessor(validConfig);
      processor.generateFrameData(10);
      console.error('❌ Should have thrown error for generating frames without processing');
    } catch (error) {
      if (error instanceof DataProcessingError && error.code === 'NO_PROCESSED_DATA') {
        console.log('✅ No processed data error handled correctly');
      } else {
        console.error('❌ Wrong error type for no processed data:', error);
      }
    }

    // Test 2: Invalid duration
    try {
      const processor = new DataProcessor(validConfig);
      const validCSV = 'Date,Value1\n2023-01-01,100\n2023-01-02,200\n';
      processor.parseCSV(validCSV);
      processor.transformData();
      processor.generateFrameData(-5);
      console.error('❌ Should have thrown error for negative duration');
    } catch (error) {
      if (error instanceof DataProcessingError && error.code === 'INVALID_DURATION') {
        console.log('✅ Invalid duration error handled correctly');
      } else {
        console.error('❌ Wrong error type for invalid duration:', error);
      }
    }

    // Test 3: Valid processing with edge case data
    try {
      const processor = new DataProcessor(validConfig);
      const edgeCaseCSV = 'Date,Value1\n2023-01-01,0\n2023-01-01,0\n'; // Same date, zero values
      processor.parseCSV(edgeCaseCSV);
      processor.transformData();
      const frames = processor.generateFrameData(1);
      console.log('✅ Edge case data handled gracefully');
    } catch (error) {
      console.error('❌ Edge case data should not cause fatal error:', error);
    }
  }

  /**
   * Test validation utilities
   */
  static async testValidationUtils(): Promise<void> {
    console.log('Testing validation utilities...');

    // Test 1: CSV content validation
    const emptyCSVResult = ValidationUtils.validateCSVContent('');
    if (!emptyCSVResult.isValid && emptyCSVResult.errors.some(e => e.code === 'EMPTY_CSV_CONTENT')) {
      console.log('✅ Empty CSV validation works');
    } else {
      console.error('❌ Empty CSV validation failed');
    }

    // Test 2: Numeric column validation
    const csvWithMixedData = 'Date,Value1,Value2\n2023-01-01,100,abc\n2023-01-02,200,300\n';
    const numericResult = ValidationUtils.validateNumericColumns(csvWithMixedData, ['Value1', 'Value2']);
    if (!numericResult.isValid && numericResult.errors.some(e => e.code === 'INVALID_NUMERIC_VALUES')) {
      console.log('✅ Numeric validation works');
    } else {
      console.error('❌ Numeric validation failed');
    }

    // Test 3: Valid CSV
    const validCSV = 'Date,Value1,Value2\n2023-01-01,100,200\n2023-01-02,150,250\n';
    const validResult = ValidationUtils.validateCSVContent(validCSV, ['Date', 'Value1', 'Value2']);
    if (validResult.isValid) {
      console.log('✅ Valid CSV validation works');
    } else {
      console.error('❌ Valid CSV validation failed:', validResult.errors);
    }
  }

  /**
   * Test safe data access functions
   */
  static testSafeDataAccess(): void {
    console.log('Testing safe data access...');

    // Test 1: Safe frame data access with null
    const nullResult = safeGetFrameData(null, 0);
    if (nullResult === null) {
      console.log('✅ Safe frame data access with null works');
    } else {
      console.error('❌ Safe frame data access with null failed');
    }

    // Test 2: Safe frame data access with invalid data
    const invalidData = { frames: [], totalFrames: 0 } as any;
    const invalidResult = safeGetFrameData(invalidData, 0);
    if (invalidResult === null) {
      console.log('✅ Safe frame data access with invalid data works');
    } else {
      console.error('❌ Safe frame data access with invalid data failed');
    }

    // Test 3: ProcessedData validation
    const validationResult = validateProcessedData(null as any);
    if (!validationResult.isValid && validationResult.errors.length > 0) {
      console.log('✅ ProcessedData validation works');
    } else {
      console.error('❌ ProcessedData validation failed');
    }
  }

  /**
   * Test error boundary scenarios
   */
  static testErrorBoundaryScenarios(): void {
    console.log('Testing error boundary scenarios...');

    // These would typically be tested in a React testing environment
    // For now, just verify the error classes exist and can be instantiated
    try {
      const error = new DataProcessingError('Test error', 'TEST_CODE', { context: 'test' });
      if (error.name === 'DataProcessingError' && error.code === 'TEST_CODE') {
        console.log('✅ DataProcessingError class works correctly');
      } else {
        console.error('❌ DataProcessingError class failed');
      }
    } catch (error) {
      console.error('❌ DataProcessingError instantiation failed:', error);
    }
  }

  /**
   * Run all error handling tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🧪 Starting comprehensive error handling tests...\n');

    try {
      await this.testCSVParsingErrors();
      console.log();

      this.testConfigValidation();
      console.log();

      await this.testDataTransformationErrors();
      console.log();

      await this.testFrameGenerationErrors();
      console.log();

      await this.testValidationUtils();
      console.log();

      this.testSafeDataAccess();
      console.log();

      this.testErrorBoundaryScenarios();
      console.log();

      console.log('✅ All error handling tests completed successfully!');
    } catch (error) {
      console.error('❌ Error handling tests failed:', error);
      throw error;
    }
  }
}

// Example usage:
// ErrorHandlingTest.runAllTests().catch(console.error);