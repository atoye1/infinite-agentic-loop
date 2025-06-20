/**
 * Unit tests for DataProcessor
 */

import { DataProcessor, ProcessingConfig, DataProcessingError } from '../dataprocessor/DataProcessor';
import { ProcessedData, FrameData } from '../types';

describe('DataProcessor', () => {
  const baseConfig: ProcessingConfig = {
    dateColumn: 'Date',
    valueColumns: ['Item1', 'Item2', 'Item3'],
    dateFormat: 'YYYY-MM-DD',
    interpolationMethod: 'linear',
    fps: 30
  };

  const sampleCSV = `Date,Item1,Item2,Item3
2023-01-01,100,200,150
2023-01-02,150,180,200
2023-01-03,200,160,250
2023-01-04,180,220,300`;

  describe('Constructor and Configuration', () => {
    test('should create instance with valid config', () => {
      const processor = new DataProcessor(baseConfig);
      expect(processor).toBeInstanceOf(DataProcessor);
    });

    test('should throw error with invalid config', () => {
      const invalidConfig = { ...baseConfig, dateColumn: '' };
      expect(() => new DataProcessor(invalidConfig)).toThrow(DataProcessingError);
    });

    test('should accept all interpolation methods', () => {
      const methods = ['linear', 'cubic', 'none'] as const;
      methods.forEach(method => {
        const config = { ...baseConfig, interpolationMethod: method };
        expect(() => new DataProcessor(config)).not.toThrow();
      });
    });
  });

  describe('CSV Parsing', () => {
    test('should parse valid CSV successfully', () => {
      const processor = new DataProcessor(baseConfig);
      expect(() => processor.parseCSV(sampleCSV)).not.toThrow();
      const rawData = processor.getRawData();
      expect(rawData).toHaveLength(4); // 4 data rows
      expect(rawData[0]).toHaveProperty('Date', '2023-01-01');
      expect(rawData[0]).toHaveProperty('Item1', '100');
    });

    test('should handle CSV with extra spaces', () => {
      const csvWithSpaces = `Date, Item1 , Item2
2023-01-01, 100 , 200
2023-01-02, 150 , 180`;
      const processor = new DataProcessor(baseConfig);
      expect(() => processor.parseCSV(csvWithSpaces)).not.toThrow();
    });

    test('should handle empty lines in CSV', () => {
      const csvWithEmptyLines = `Date,Item1,Item2,Item3
2023-01-01,100,200,150

2023-01-02,150,180,200
`;
      const processor = new DataProcessor(baseConfig);
      expect(() => processor.parseCSV(csvWithEmptyLines)).not.toThrow();
      const rawData = processor.getRawData();
      expect(rawData).toHaveLength(2);
    });

    test('should throw error for missing columns', () => {
      const csvMissingColumn = `Date,Item1
2023-01-01,100
2023-01-02,150`;
      const processor = new DataProcessor(baseConfig);
      expect(() => processor.parseCSV(csvMissingColumn)).toThrow();
    });
  });

  describe('Data Transformation', () => {
    test('should transform parsed data correctly', () => {
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(sampleCSV);
      processor.transformData();
      
      const transformedData = processor.getTransformedData();
      expect(transformedData).toBeDefined();
      expect(transformedData).toHaveLength(4);
      
      // Check first entry
      expect(transformedData[0]).toHaveProperty('date');
      expect(transformedData[0]).toHaveProperty('timestamp');
      expect(transformedData[0]).toHaveProperty('items');
      expect(Object.keys(transformedData[0].items)).toEqual(['Item1', 'Item2', 'Item3']);
    });

    test('should handle date parsing correctly', () => {
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(sampleCSV);
      processor.transformData();
      
      const transformedData = processor.getTransformedData();
      const firstDate = new Date(transformedData[0].timestamp);
      expect(firstDate.toISOString()).toContain('2023-01-01');
    });

    test('should parse numeric values correctly', () => {
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(sampleCSV);
      processor.transformData();
      
      const transformedData = processor.getTransformedData();
      expect(transformedData[0].items.Item1).toBe(100);
      expect(transformedData[0].items.Item2).toBe(200);
      expect(transformedData[0].items.Item3).toBe(150);
    });

    test('should handle non-numeric values', () => {
      const csvWithNonNumeric = `Date,Item1,Item2,Item3
2023-01-01,100,not-a-number,150
2023-01-02,150,180,200`;
      
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(csvWithNonNumeric);
      processor.transformData();
      
      const transformedData = processor.getTransformedData();
      expect(transformedData[0].items.Item2).toBe(0); // Non-numeric values become 0
    });
  });

  describe('Frame Generation', () => {
    test('should generate correct number of frames', () => {
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(sampleCSV);
      processor.transformData();
      
      const duration = 3; // seconds
      const frameData = processor.generateFrameData(duration);
      
      expect(frameData.totalFrames).toBe(duration * baseConfig.fps);
      expect(frameData.frames).toHaveLength(duration * baseConfig.fps);
    });

    test('should generate frames with correct structure', () => {
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(sampleCSV);
      processor.transformData();
      
      const frameData = processor.generateFrameData(1);
      const firstFrame = frameData.frames[0];
      
      expect(firstFrame).toHaveProperty('frame', 0);
      expect(firstFrame).toHaveProperty('date');
      expect(firstFrame).toHaveProperty('items');
      expect(firstFrame).toHaveProperty('maxValue');
      expect(Array.isArray(firstFrame.items)).toBe(true);
    });

    test('should rank items correctly', () => {
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(sampleCSV);
      processor.transformData();
      
      const frameData = processor.generateFrameData(1);
      const firstFrame = frameData.frames[0];
      
      // Items should be sorted by value in descending order
      const values = firstFrame.items.map(item => item.value);
      const sortedValues = [...values].sort((a, b) => b - a);
      expect(values).toEqual(sortedValues);
      
      // Ranks should be correct
      firstFrame.items.forEach((item, index) => {
        expect(item.rank).toBe(index + 1);
      });
    });

    test('should interpolate values with linear method', () => {
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(sampleCSV);
      processor.transformData();
      
      const frameData = processor.generateFrameData(1);
      
      // Check that values change smoothly between frames
      const item1Values = frameData.frames.map(f => 
        f.items.find(item => item.id === 'Item1')?.value || 0
      );
      
      // Values should change gradually
      for (let i = 1; i < item1Values.length; i++) {
        const diff = Math.abs(item1Values[i] - item1Values[i - 1]);
        expect(diff).toBeLessThan(10); // Small incremental changes
      }
    });

    test('should handle step interpolation', () => {
      const stepConfig = { ...baseConfig, interpolationMethod: 'none' as const };
      const processor = new DataProcessor(stepConfig);
      processor.parseCSV(sampleCSV);
      processor.transformData();
      
      const frameData = processor.generateFrameData(1);
      
      // With step interpolation, values should remain constant between data points
      const item1Values = frameData.frames.map(f => 
        f.items.find(item => item.id === 'Item1')?.value || 0
      );
      
      // Check for step changes
      let previousValue = item1Values[0];
      let changeCount = 0;
      for (let i = 1; i < item1Values.length; i++) {
        if (item1Values[i] !== previousValue) {
          changeCount++;
          previousValue = item1Values[i];
        }
      }
      
      // Should have fewer changes than with linear interpolation
      expect(changeCount).toBeLessThan(5);
    });
  });

  describe('Edge Cases', () => {
    test('should handle single data point', () => {
      const singlePointCSV = `Date,Item1,Item2,Item3
2023-01-01,100,200,150`;
      
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(singlePointCSV);
      processor.transformData();
      
      const frameData = processor.generateFrameData(1);
      expect(frameData.frames).toHaveLength(30); // 1 second at 30fps
      
      // All frames should have the same values
      const firstValue = frameData.frames[0].items[0].value;
      frameData.frames.forEach(frame => {
        expect(frame.items[0].value).toBe(firstValue);
      });
    });

    test('should handle duplicate dates', () => {
      const duplicateDateCSV = `Date,Item1,Item2,Item3
2023-01-01,100,200,150
2023-01-01,150,180,200
2023-01-02,200,160,250`;
      
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(duplicateDateCSV);
      processor.transformData();
      
      const transformedData = processor.getTransformedData();
      // Should keep last value for duplicate dates
      expect(transformedData).toHaveLength(2);
      expect(transformedData[0].items.Item1).toBe(150); // Last value for 2023-01-01
    });

    test('should handle zero and negative values', () => {
      const zeroNegativeCSV = `Date,Item1,Item2,Item3
2023-01-01,0,-100,150
2023-01-02,150,0,-200`;
      
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(zeroNegativeCSV);
      processor.transformData();
      
      const frameData = processor.generateFrameData(1);
      const firstFrame = frameData.frames[0];
      
      // Should handle zero and negative values
      const item1 = firstFrame.items.find(item => item.id === 'Item1');
      const item2 = firstFrame.items.find(item => item.id === 'Item2');
      
      expect(item1?.value).toBe(0);
      expect(item2?.value).toBe(-100);
    });
  });

  describe('Performance', () => {
    test('should handle large datasets efficiently', () => {
      // Generate large CSV
      let largeCSV = 'Date,Item1,Item2,Item3,Item4,Item5\n';
      const startDate = new Date('2023-01-01');
      
      for (let i = 0; i < 100; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        largeCSV += `${dateStr},${100 + i},${200 - i},${150 + i * 2},${300 - i * 2},${250 + i}\n`;
      }
      
      const processor = new DataProcessor({
        ...baseConfig,
        valueColumns: ['Item1', 'Item2', 'Item3', 'Item4', 'Item5']
      });
      
      const startTime = Date.now();
      processor.parseCSV(largeCSV);
      processor.transformData();
      const frameData = processor.generateFrameData(5); // 5 seconds
      const endTime = Date.now();
      
      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
      expect(frameData.frames).toHaveLength(150); // 5 seconds at 30fps
    });
  });

  describe('Error Recovery', () => {
    test('should provide meaningful error messages', () => {
      const processor = new DataProcessor(baseConfig);
      
      try {
        processor.transformData();
      } catch (error) {
        expect(error).toBeInstanceOf(DataProcessingError);
        expect((error as DataProcessingError).code).toBe('NO_RAW_DATA');
        expect(error.message).toContain('parse');
      }
    });

    test('should validate duration parameter', () => {
      const processor = new DataProcessor(baseConfig);
      processor.parseCSV(sampleCSV);
      processor.transformData();
      
      expect(() => processor.generateFrameData(0)).toThrow();
      expect(() => processor.generateFrameData(-1)).toThrow();
      expect(() => processor.generateFrameData(Infinity)).toThrow();
      expect(() => processor.generateFrameData(NaN)).toThrow();
    });
  });
});