/**
 * DataProcessorTest - Comprehensive test suite for data processing pipeline
 */

import { DataProcessor, ProcessingConfig } from './DataProcessor';
import { DataUtils } from './DataUtils';
import { random } from 'remotion';

export class DataProcessorTest {
  /**
   * Run all tests and return results
   */
  public static runAllTests(): {
    passed: number;
    failed: number;
    total: number;
    results: Array<{
      name: string;
      passed: boolean;
      error?: string;
      duration: number;
    }>;
  } {
    const tests = [
      'testCSVParsing',
      'testDateParsing',
      'testDataTransformation',
      'testLinearInterpolation',
      'testSmoothInterpolation',
      'testStepInterpolation',
      'testFrameGeneration',
      'testRankingCalculations',
      'testErrorHandling',
      'testConfigValidation',
      'testDataUtils',
      'testPerformance'
    ];

    const results = tests.map(testName => {
      const startTime = performance.now();
      
      try {
        (this as unknown as Record<string, () => void>)[testName]();
        const duration = performance.now() - startTime;
        
        return {
          name: testName,
          passed: true,
          duration
        };
      } catch (error) {
        const duration = performance.now() - startTime;
        
        return {
          name: testName,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration
        };
      }
    });

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return {
      passed,
      failed,
      total: results.length,
      results
    };
  }

  /**
   * Test CSV parsing functionality
   */
  private static testCSVParsing(): void {
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['A', 'B', 'C'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    });

    // Test basic CSV
    const csvData = `Date,A,B,C
2020-01-01,100,200,150
2020-02-01,120,180,160
2020-03-01,140,220,170`;

    processor.parseCSV(csvData);
    
    // Test CSV with quotes and commas
    const complexCSV = `Date,"Company A","Company B, Inc","Company C"
2020-01-01,100,"200,000",150
2020-02-01,120,"180,500",160`;

    const processor2 = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['Company A', 'Company B, Inc', 'Company C'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    });

    processor2.parseCSV(complexCSV);

    // Test error cases
    try {
      processor.parseCSV('Date,A\n'); // No data rows
      throw new Error('Should have failed');
    } catch (error) {
      if (!error || !(error instanceof Error) || !error.message.includes('No valid data rows')) {
        throw new Error('Wrong error type');
      }
    }

    console.log('✓ CSV parsing tests passed');
  }

  /**
   * Test date parsing with different formats
   */
  private static testDateParsing(): void {
    const configs = [
      { format: 'YYYY-MM-DD' as const, testDate: '2020-12-25', expected: new Date(2020, 11, 25) },
      { format: 'YYYY-MM' as const, testDate: '2020-12', expected: new Date(2020, 11, 1) },
      { format: 'YYYY' as const, testDate: '2020', expected: new Date(2020, 0, 1) },
      { format: 'MM/DD/YYYY' as const, testDate: '12/25/2020', expected: new Date(2020, 11, 25) },
      { format: 'DD/MM/YYYY' as const, testDate: '25/12/2020', expected: new Date(2020, 11, 25) }
    ];

    for (const config of configs) {
      const processor = new DataProcessor({
        dateColumn: 'Date',
        valueColumns: ['Value'],
        dateFormat: config.format,
        interpolationMethod: 'linear',
        fps: 30
      });

      const parsedDate = processor.parseDate(config.testDate);
      
      if (parsedDate.getTime() !== config.expected.getTime()) {
        throw new Error(`Date parsing failed for format ${config.format}: expected ${config.expected}, got ${parsedDate}`);
      }
    }

    // Test invalid dates
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['Value'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    });

    try {
      processor.parseDate('2020-13-01'); // Invalid month
      throw new Error('Should have failed');
    } catch (error) {
      if (!error || !(error instanceof Error) || !error.message.includes('Invalid')) {
        throw new Error('Wrong error type');
      }
    }

    console.log('✓ Date parsing tests passed');
  }

  /**
   * Test data transformation
   */
  private static testDataTransformation(): void {
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['A', 'B'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    });

    const csvData = `Date,A,B
2020-01-01,100,200
2020-02-01,120,180`;

    processor.parseCSV(csvData);
    processor.transformData();

    const processedData = processor.getProcessedData();
    
    if (processedData.length !== 4) {
      throw new Error(`Expected 4 data points, got ${processedData.length}`);
    }

    const stats = processor.getDataStats();
    if (stats.categories.length !== 2) {
      throw new Error(`Expected 2 categories, got ${stats.categories.length}`);
    }

    if (stats.totalDataPoints !== 4) {
      throw new Error(`Expected 4 total data points, got ${stats.totalDataPoints}`);
    }

    console.log('✓ Data transformation tests passed');
  }

  /**
   * Test linear interpolation
   */
  private static testLinearInterpolation(): void {
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['A'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 2
    });

    const csvData = `Date,A
2020-01-01,100
2020-03-01,200`;

    processor.parseCSV(csvData);
    processor.transformData();

    const frameData = processor.generateFrameData(2); // 2 seconds, 2 fps = 4 frames
    
    if (frameData.length !== 4) {
      throw new Error(`Expected 4 frames, got ${frameData.length}`);
    }

    // Check that interpolation is working (middle values should be between start and end)
    const firstValue = frameData[0].data[0].value;
    const lastValue = frameData[frameData.length - 1].data[0].value;
    const middleValue = frameData[1].data[0].value;

    if (middleValue <= firstValue || middleValue >= lastValue) {
      throw new Error(`Linear interpolation not working correctly: ${firstValue} -> ${middleValue} -> ${lastValue}`);
    }

    console.log('✓ Linear interpolation tests passed');
  }

  /**
   * Test smooth interpolation
   */
  private static testSmoothInterpolation(): void {
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['A'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'smooth',
      fps: 2
    });

    const csvData = `Date,A
2020-01-01,100
2020-02-01,150
2020-03-01,200
2020-04-01,180`;

    processor.parseCSV(csvData);
    processor.transformData();

    const frameData = processor.generateFrameData(2);
    
    if (frameData.length !== 4) {
      throw new Error(`Expected 4 frames, got ${frameData.length}`);
    }

    // Smooth interpolation should produce different results than linear
    // (This is a basic check - more sophisticated tests could verify curve properties)
    const values = frameData.map(f => f.data[0].value);
    const hasVariation = values.some((v, i) => i > 0 && Math.abs(v - values[i - 1]) > 0.1);
    
    if (!hasVariation) {
      throw new Error('Smooth interpolation not producing expected variation');
    }

    console.log('✓ Smooth interpolation tests passed');
  }

  /**
   * Test step interpolation
   */
  private static testStepInterpolation(): void {
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['A'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'step',
      fps: 2
    });

    const csvData = `Date,A
2020-01-01,100
2020-03-01,200`;

    processor.parseCSV(csvData);
    processor.transformData();

    const frameData = processor.generateFrameData(2);
    
    // With step interpolation, values should stay constant until the next data point
    const firstHalfFrames = frameData.slice(0, Math.floor(frameData.length / 2));
    const firstValue = firstHalfFrames[0].data[0].value;
    
    for (const frame of firstHalfFrames) {
      if (Math.abs(frame.data[0].value - firstValue) > 0.001) {
        throw new Error(`Step interpolation should maintain constant values: expected ${firstValue}, got ${frame.data[0].value}`);
      }
    }

    console.log('✓ Step interpolation tests passed');
  }

  /**
   * Test frame generation
   */
  private static testFrameGeneration(): void {
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['A', 'B', 'C'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30,
      topN: 2
    });

    const csvData = `Date,A,B,C
2020-01-01,100,200,150
2020-02-01,120,180,160`;

    processor.parseCSV(csvData);
    processor.transformData();

    const frameData = processor.generateFrameData(1); // 1 second
    
    if (frameData.length !== 30) {
      throw new Error(`Expected 30 frames for 1 second at 30fps, got ${frameData.length}`);
    }

    // Check that each frame has the expected structure
    for (let i = 0; i < frameData.length; i++) {
      const frame = frameData[i];
      
      if (frame.frame !== i) {
        throw new Error(`Frame ${i} has incorrect frame number: ${frame.frame}`);
      }

      if (frame.data.length > 2) {
        throw new Error(`Frame ${i} should have max 2 items (topN=2), got ${frame.data.length}`);
      }

      if (!frame.date || !(frame.date instanceof Date)) {
        throw new Error(`Frame ${i} has invalid date`);
      }

      // Check that data is ranked (first item should have highest value)
      if (frame.data.length > 1 && frame.data[0].value < frame.data[1].value) {
        throw new Error(`Frame ${i} data is not properly ranked`);
      }
    }

    console.log('✓ Frame generation tests passed');
  }

  /**
   * Test ranking calculations
   */
  private static testRankingCalculations(): void {
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['A', 'B', 'C', 'D'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    });

    const csvData = `Date,A,B,C,D
2020-01-01,100,200,150,200`;

    processor.parseCSV(csvData);
    processor.transformData();

    const frameData = processor.generateFrameData(0.1); // Short duration
    const frame = frameData[0];

    // Check ranking order (B and D tied for first with 200, then C with 150, then A with 100)
    if (frame.data[0].value !== 200 || frame.data[1].value !== 200) {
      throw new Error(`Expected tied values at top: got ${frame.data[0].value} and ${frame.data[1].value}`);
    }

    if (frame.data[0].rank !== 1 || frame.data[1].rank !== 1) {
      throw new Error(`Expected both top values to have rank 1`);
    }

    if (frame.data[2].rank !== 3) {
      throw new Error(`Expected third place to have rank 3 (accounting for tie)`);
    }

    console.log('✓ Ranking calculation tests passed');
  }

  /**
   * Test error handling
   */
  private static testErrorHandling(): void {
    // Test invalid configuration
    try {
      new DataProcessor({
        dateColumn: '',
        valueColumns: [],
        dateFormat: 'YYYY-MM-DD',
        interpolationMethod: 'linear',
        fps: 30
      });
    } catch {
      // Expected to fail during validation
    }

    // Test missing columns
    const processor = new DataProcessor({
      dateColumn: 'MissingDate',
      valueColumns: ['MissingValue'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    });

    try {
      processor.parseCSV('Date,Value\n2020-01-01,100');
      throw new Error('Should have failed');
    } catch (error) {
      if (!error || !(error instanceof Error) || !error.message.includes('not found')) {
        throw new Error('Wrong error type');
      }
    }

    // Test malformed CSV
    try {
      processor.parseCSV('');
      throw new Error('Should have failed');
    } catch (error) {
      if (!error || !(error instanceof Error)) {
        throw new Error('Expected error for empty CSV');
      }
    }

    console.log('✓ Error handling tests passed');
  }

  /**
   * Test configuration validation
   */
  private static testConfigValidation(): void {
    const validConfig: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['A', 'B'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    };

    const validErrors = DataProcessor.validateConfig(validConfig);
    if (validErrors.length > 0) {
      throw new Error(`Valid config should not have errors: ${validErrors.join(', ')}`);
    }

    const invalidConfig = {
      dateColumn: '',
      valueColumns: [],
      dateFormat: 'invalid',
      interpolationMethod: 'invalid',
      fps: -1
    } as unknown as ProcessingConfig;

    const invalidErrors = DataProcessor.validateConfig(invalidConfig);
    if (invalidErrors.length === 0) {
      throw new Error('Invalid config should have errors');
    }

    console.log('✓ Configuration validation tests passed');
  }

  /**
   * Test DataUtils functionality
   */
  private static testDataUtils(): void {
    // Test CSV analysis
    const sampleCSV = DataUtils.generateSampleCSV();
    const analysis = DataUtils.analyzeCSV(sampleCSV);
    
    if (!analysis.suggestedDateColumn) {
      throw new Error('Should detect date column in sample CSV');
    }

    if (analysis.suggestedValueColumns.length === 0) {
      throw new Error('Should detect value columns in sample CSV');
    }

    // Test value formatting
    const formatted = DataUtils.formatValue(1234567);
    if (!formatted.includes('M')) {
      throw new Error(`Expected formatted value to contain 'M', got: ${formatted}`);
    }

    // Test color palette generation
    const colors = DataUtils.generateColorPalette(5);
    if (colors.length !== 5) {
      throw new Error(`Expected 5 colors, got ${colors.length}`);
    }

    // Test optimal duration calculation
    const duration = DataUtils.calculateOptimalDuration(100, 5);
    if (duration < 5 || duration > 30) {
      throw new Error(`Duration should be between 5 and 30 seconds, got ${duration}`);
    }

    console.log('✓ DataUtils tests passed');
  }

  /**
   * Test performance with larger datasets
   */
  private static testPerformance(): void {
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['A', 'B', 'C', 'D', 'E'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'smooth',
      fps: 30
    });

    // Generate larger dataset
    const rows = ['Date,A,B,C,D,E'];
    for (let i = 0; i < 100; i++) {
      const date = new Date(2020, 0, i + 1).toISOString().split('T')[0];
      const values = Array.from({ length: 5 }, (_, j) => Math.floor(random(`${i}-${j}`) * 1000));
      rows.push(`${date},${values.join(',')}`);
    }

    const startTime = performance.now();
    
    processor.parseCSV(rows.join('\n'));
    processor.transformData();
    processor.generateFrameData(5); // 5 seconds = 150 frames

    const duration = performance.now() - startTime;
    
    if (duration > 5000) { // Should complete within 5 seconds
      throw new Error(`Performance test took too long: ${duration}ms`);
    }

    const frameData = processor.getFrameData();
    if (frameData.length !== 150) {
      throw new Error(`Expected 150 frames, got ${frameData.length}`);
    }

    console.log(`✓ Performance tests passed (${duration.toFixed(2)}ms for 500 data points, 150 frames)`);
  }

  /**
   * Create sample data for demonstration
   */
  public static createSampleData(): string {
    return `Date,Apple,Google,Microsoft,Amazon,Meta
2020-01,100,90,80,70,60
2020-02,110,95,85,75,65
2020-03,105,100,90,80,70
2020-04,115,105,95,85,75
2020-05,120,110,100,90,80
2020-06,125,115,105,95,85
2020-07,130,120,110,100,90
2020-08,135,125,115,105,95
2020-09,140,130,120,110,100
2020-10,145,135,125,115,105
2020-11,150,140,130,120,110
2020-12,155,145,135,125,115`;
  }

  /**
   * Demonstrate complete workflow
   */
  public static demonstrateWorkflow(): void {
    console.log('🔄 Starting complete data processing workflow demonstration...\n');

    // 1. Create sample data
    console.log('📊 Step 1: Creating sample data...');
    const csvData = this.createSampleData();
    console.log(`Generated CSV with ${csvData.split('\n').length - 1} rows\n`);

    // 2. Analyze CSV
    console.log('🔍 Step 2: Analyzing CSV structure...');
    const analysis = DataUtils.analyzeCSV(csvData);
    console.log(`Suggested date column: ${analysis.suggestedDateColumn}`);
    console.log(`Suggested value columns: ${analysis.suggestedValueColumns.join(', ')}`);
    console.log(`Suggested date format: ${analysis.suggestedDateFormat}\n`);

    // 3. Create configuration
    console.log('⚙️ Step 3: Creating processing configuration...');
    const config: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Apple', 'Google', 'Microsoft', 'Amazon', 'Meta'],
      dateFormat: 'YYYY-MM',
      interpolationMethod: 'smooth',
      fps: 30,
      topN: 5
    };

    const configErrors = DataProcessor.validateConfig(config);
    if (configErrors.length > 0) {
      throw new Error(`Configuration errors: ${configErrors.join(', ')}`);
    }
    console.log('Configuration validated successfully\n');

    // 4. Process data
    console.log('🔄 Step 4: Processing data...');
    const processor = new DataProcessor(config);
    
    const startTime = performance.now();
    processor.parseCSV(csvData);
    processor.transformData();
    
    const stats = processor.getDataStats();
    console.log(`Processed ${stats.totalDataPoints} data points`);
    console.log(`Date range: ${stats.dateRange.start.toDateString()} to ${stats.dateRange.end.toDateString()}`);
    console.log(`Value range: ${stats.valueRange.min.toFixed(0)} to ${stats.valueRange.max.toFixed(0)}`);
    console.log(`Categories: ${stats.categories.join(', ')}\n`);

    // 5. Generate frame data
    console.log('🎬 Step 5: Generating frame data for animation...');
    const frameData = processor.generateFrameData(10); // 10 second animation
    const processingTime = performance.now() - startTime;
    
    console.log(`Generated ${frameData.length} frames for 10-second animation`);
    console.log(`Processing completed in ${processingTime.toFixed(2)}ms\n`);

    // 6. Validate data quality
    console.log('✅ Step 6: Validating data quality...');
    const processedData = processor.getProcessedData();
    const validation = DataUtils.validateDataQuality(processedData);
    
    console.log(`Data is ${validation.isValid ? 'valid' : 'invalid'}`);
    if (validation.warnings.length > 0) {
      console.log(`Warnings: ${validation.warnings.join(', ')}`);
    }
    if (validation.errors.length > 0) {
      console.log(`Errors: ${validation.errors.join(', ')}`);
    }

    // 7. Sample frame inspection
    console.log('\n📋 Step 7: Sample frame data...');
    const sampleFrame = frameData[Math.floor(frameData.length / 2)];
    console.log(`Frame ${sampleFrame.frame} (${sampleFrame.date.toDateString()}):`);
    sampleFrame.data.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.category}: ${DataUtils.formatValue(item.value)} (Rank ${item.rank})`);
    });

    console.log('\n🎉 Workflow demonstration completed successfully!');
  }
}