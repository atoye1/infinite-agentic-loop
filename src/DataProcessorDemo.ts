/**
 * DataProcessorDemo - Complete demonstration of the Bar Chart Race data processing pipeline
 * This file shows how to use all components together for real-world scenarios
 */

import { DataProcessor, ProcessingConfig } from './DataProcessor';
import { DataUtils } from './DataUtils';
import { DataProcessorTest } from './DataProcessorTest';
import { random } from 'remotion';

export class DataProcessorDemo {
  /**
   * Main demo function - runs comprehensive demonstration
   */
  public static async runDemo(): Promise<void> {
    console.log('🚀 Bar Chart Race Data Processing Pipeline Demo\n');
    console.log('=' .repeat(60) + '\n');

    try {
      // Run tests first
      console.log('🧪 Running comprehensive test suite...\n');
      const testResults = DataProcessorTest.runAllTests();
      
      console.log(`Test Results: ${testResults.passed}/${testResults.total} passed`);
      if (testResults.failed > 0) {
        console.log('❌ Failed tests:');
        testResults.results
          .filter(r => !r.passed)
          .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        console.log();
      } else {
        console.log('✅ All tests passed!\n');
      }

      // Demonstrate workflow
      console.log('📊 Demonstrating complete workflow...\n');
      DataProcessorTest.demonstrateWorkflow();

      // Advanced scenarios
      console.log('\n' + '=' .repeat(60));
      console.log('🔬 Advanced Scenarios\n');

      await this.demonstrateRealWorldScenarios();
      
      console.log('\n' + '=' .repeat(60));
      console.log('✨ Demo completed successfully!');

    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }

  /**
   * Demonstrate real-world scenarios
   */
  private static async demonstrateRealWorldScenarios(): Promise<void> {
    // Scenario 1: Tech company market cap over time
    console.log('📈 Scenario 1: Tech Company Market Cap Analysis');
    await this.demoTechCompanyData();

    console.log('\n📊 Scenario 2: Different Interpolation Methods Comparison');
    this.demoInterpolationComparison();

    console.log('\n🌍 Scenario 3: International Date Formats');
    this.demoInternationalFormats();

    console.log('\n⚡ Scenario 4: Large Dataset Performance');
    this.demoLargeDatasetPerformance();

    console.log('\n🔧 Scenario 5: Error Recovery and Data Cleaning');
    this.demoErrorRecovery();
  }

  /**
   * Demo with tech company data
   */
  private static async demoTechCompanyData(): Promise<void> {
    const csvData = `Date,Apple,Microsoft,Google,Amazon,Tesla,Meta,Netflix,NVIDIA,Adobe,Salesforce
2019-01,750,850,800,700,50,400,150,100,200,120
2019-07,950,1050,900,850,60,500,300,150,250,150
2020-01,1300,1400,1000,900,80,550,200,200,300,180
2020-07,1600,1500,1200,1500,200,700,250,250,400,200
2021-01,2000,1800,1300,1600,800,850,500,300,500,250
2021-07,2400,2200,1800,1700,650,950,550,400,600,280
2022-01,2800,2300,1900,1500,900,800,400,500,700,300
2022-07,2200,1800,1600,1200,750,400,180,450,350,150
2023-01,2400,2000,1400,1000,600,300,150,400,300,140`;

    console.log('Processing tech company market cap data...');
    
    const config: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla', 'Meta', 'Netflix', 'NVIDIA', 'Adobe', 'Salesforce'],
      dateFormat: 'YYYY-MM',
      interpolationMethod: 'smooth',
      fps: 30,
      topN: 5
    };

    const processor = new DataProcessor(config);
    processor.parseCSV(csvData);
    processor.transformData();

    const stats = processor.getDataStats();
    console.log(`  • ${stats.totalDataPoints} data points processed`);
    console.log(`  • ${stats.categories.length} companies tracked`);
    console.log(`  • Date range: ${stats.dateRange.start.getFullYear()}-${String(stats.dateRange.start.getMonth() + 1).padStart(2, '0')} to ${stats.dateRange.end.getFullYear()}-${String(stats.dateRange.end.getMonth() + 1).padStart(2, '0')}`);
    console.log(`  • Value range: $${DataUtils.formatValue(stats.valueRange.min)} to $${DataUtils.formatValue(stats.valueRange.max)}`);

    // Generate 15-second animation
    const frameData = processor.generateFrameData(15);
    console.log(`  • Generated ${frameData.length} frames for 15-second animation`);

    // Show evolution at key points
    const keyFrames = [0, Math.floor(frameData.length * 0.5), frameData.length - 1];
    keyFrames.forEach((frameIndex, i) => {
      const frame = frameData[frameIndex];
      const period = ['Start', 'Middle', 'End'][i];
      console.log(`  • ${period} (${frame.date.getFullYear()}-${String(frame.date.getMonth() + 1).padStart(2, '0')}):`);
      frame.data.slice(0, 3).forEach((item, rank) => {
        console.log(`    ${rank + 1}. ${item.category}: $${DataUtils.formatValue(item.value)}`);
      });
    });
  }

  /**
   * Compare different interpolation methods
   */
  private static demoInterpolationComparison(): void {
    const csvData = `Date,Company A,Company B
2020-01,100,80
2020-06,200,120
2020-12,150,200`;

    const methods: Array<ProcessingConfig['interpolationMethod']> = ['step', 'linear', 'smooth'];
    
    console.log('Comparing interpolation methods with same data:');

    methods.forEach(method => {
      const processor = new DataProcessor({
        dateColumn: 'Date',
        valueColumns: ['Company A', 'Company B'],
        dateFormat: 'YYYY-MM',
        interpolationMethod: method,
        fps: 4 // Low fps for clear comparison
      });

      processor.parseCSV(csvData);
      processor.transformData();
      
      const frameData = processor.generateFrameData(1); // 1 second = 4 frames
      console.log(`  • ${method.toUpperCase()} interpolation:`);
      
      frameData.forEach((frame, i) => {
        const companyA = frame.data.find(d => d.category === 'Company A');
        if (companyA) {
          console.log(`    Frame ${i}: Company A = ${companyA.value.toFixed(1)}`);
        }
      });
    });
  }

  /**
   * Demo international date formats
   */
  private static demoInternationalFormats(): void {
    const formats = [
      { format: 'YYYY-MM-DD' as const, data: '2020-01-15,100\n2020-02-15,120', name: 'ISO (YYYY-MM-DD)' },
      { format: 'MM/DD/YYYY' as const, data: '01/15/2020,100\n02/15/2020,120', name: 'US (MM/DD/YYYY)' },
      { format: 'DD/MM/YYYY' as const, data: '15/01/2020,100\n15/02/2020,120', name: 'European (DD/MM/YYYY)' },
      { format: 'YYYY-MM' as const, data: '2020-01,100\n2020-02,120', name: 'Monthly (YYYY-MM)' },
      { format: 'YYYY' as const, data: '2020,100\n2021,120', name: 'Yearly (YYYY)' }
    ];

    console.log('Testing different international date formats:');

    formats.forEach(({ format, data, name }) => {
      try {
        const processor = new DataProcessor({
          dateColumn: 'Date',
          valueColumns: ['Value'],
          dateFormat: format,
          interpolationMethod: 'linear',
          fps: 30
        });

        const csvData = `Date,Value\n${data}`;
        processor.parseCSV(csvData);
        processor.transformData();

        const stats = processor.getDataStats();
        console.log(`  ✅ ${name}: ${stats.totalDataPoints} points, ${stats.dateRange.start.toDateString()} to ${stats.dateRange.end.toDateString()}`);
      } catch (error) {
        console.log(`  ❌ ${name}: ${error instanceof Error ? error.message : 'Failed'}`);
      }
    });
  }

  /**
   * Test performance with large datasets
   */
  private static demoLargeDatasetPerformance(): void {
    console.log('Testing performance with large dataset...');

    // Generate large dataset
    const categories = Array.from({ length: 20 }, (_, i) => `Category${i + 1}`);
    const dates = Array.from({ length: 365 }, (_, i) => {
      const date = new Date(2020, 0, i + 1);
      return date.toISOString().split('T')[0];
    });

    const rows = [`Date,${categories.join(',')}`];
    dates.forEach(date => {
      const values = categories.map((_, index) => Math.floor(random(`${date}-${index}`) * 1000) + 100);
      rows.push(`${date},${values.join(',')}`);
    });

    const csvData = rows.join('\n');
    
    const startTime = performance.now();
    
    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: categories,
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'smooth',
      fps: 30,
      topN: 10
    });

    processor.parseCSV(csvData);
    processor.transformData();
    
    const parseTime = performance.now();
    
    const frameData = processor.generateFrameData(10); // 10 seconds = 300 frames
    
    const totalTime = performance.now() - startTime;
    const frameTime = performance.now() - parseTime;

    console.log(`  • Dataset: ${categories.length} categories × ${dates.length} dates = ${categories.length * dates.length} data points`);
    console.log(`  • Parsing time: ${(parseTime - startTime).toFixed(2)}ms`);
    console.log(`  • Frame generation: ${frameTime.toFixed(2)}ms`);
    console.log(`  • Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`  • Generated: ${frameData.length} frames`);
    console.log(`  • Performance: ${(frameData.length / (totalTime / 1000)).toFixed(0)} frames/second`);
  }

  /**
   * Demo error recovery and data cleaning
   */
  private static demoErrorRecovery(): void {
    console.log('Testing error recovery and data cleaning:');

    // Test with messy data
    const messyData = `Date,Company A,Company B,Company C
2020-01-01,100,200,invalid
2020-02-01,,180,160
2020-03-01,140,220,
2020-04-01,160,"300,000",180
2020-05-01,invalid,250,200
2020-06-01,200,270,220`;

    const processor = new DataProcessor({
      dateColumn: 'Date',
      valueColumns: ['Company A', 'Company B', 'Company C'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    });

    console.log('  • Processing messy CSV data...');
    processor.parseCSV(messyData);
    processor.transformData();

    const processedData = processor.getProcessedData();
    const validation = DataUtils.validateDataQuality(processedData);

    console.log(`  • Processed ${processedData.length} valid data points`);
    console.log(`  • Data quality: ${validation.isValid ? 'Valid' : 'Invalid'}`);
    
    if (validation.warnings.length > 0) {
      console.log('  • Warnings:');
      validation.warnings.forEach(warning => console.log(`    - ${warning}`));
    }
    
    if (validation.errors.length > 0) {
      console.log('  • Errors:');
      validation.errors.forEach(error => console.log(`    - ${error}`));
    }

    // Show how interpolation handles gaps
    const frameData = processor.generateFrameData(2);
    console.log(`  • Generated ${frameData.length} frames despite missing data`);
    
    const midFrame = frameData[Math.floor(frameData.length / 2)];
    console.log(`  • Mid-frame data (showing interpolated values):`);
    midFrame.data.forEach(item => {
      console.log(`    ${item.category}: ${item.value.toFixed(1)}`);
    });
  }

  /**
   * Export sample data for external use
   */
  public static exportSampleData(): {
    csv: string;
    json: string;
    config: ProcessingConfig;
  } {
    const csvData = DataProcessorTest.createSampleData();
    
    const config: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Apple', 'Google', 'Microsoft', 'Amazon', 'Meta'],
      dateFormat: 'YYYY-MM',
      interpolationMethod: 'smooth',
      fps: 30,
      topN: 5
    };

    const processor = new DataProcessor(config);
    processor.parseCSV(csvData);
    processor.transformData();
    
    const frameData = processor.generateFrameData(10);
    const jsonData = DataUtils.exportFrameData(frameData, 'json');

    return {
      csv: csvData,
      json: jsonData,
      config
    };
  }

  /**
   * Generate comprehensive documentation
   */
  public static generateDocumentation(): string {
    return `
# Bar Chart Race Data Processing Pipeline

## Overview
Complete data processing system for generating animated bar chart race videos.

## Features
- ✅ Robust CSV parsing with error handling
- ✅ Multiple date format support (YYYY-MM-DD, YYYY-MM, YYYY, MM/DD/YYYY, DD/MM/YYYY)
- ✅ Three interpolation methods (linear, smooth, step)
- ✅ Frame-by-frame data generation for video rendering
- ✅ Ranking calculation with tie handling
- ✅ Performance optimization for large datasets
- ✅ Data quality validation and error recovery
- ✅ Comprehensive test suite

## Quick Start

\`\`\`typescript
import { DataProcessor, ProcessingConfig } from './DataProcessor';

const config: ProcessingConfig = {
  dateColumn: 'Date',
  valueColumns: ['Company A', 'Company B', 'Company C'],
  dateFormat: 'YYYY-MM-DD',
  interpolationMethod: 'smooth',
  fps: 30,
  topN: 10
};

const processor = new DataProcessor(config);
processor.parseCSV(csvData);
processor.transformData();
const frameData = processor.generateFrameData(10); // 10 seconds
\`\`\`

## Interpolation Methods

1. **Linear**: Straight line interpolation between data points
2. **Smooth**: Catmull-Rom spline for smooth curves
3. **Step**: Maintains constant values until next data point

## Performance
- Handles 10,000+ data points efficiently
- Generates 300+ frames per second of processing
- Memory-optimized for large datasets

## Error Handling
- Graceful handling of malformed CSV data
- Missing value interpolation
- Data quality validation and reporting

## Testing
Run the comprehensive test suite:
\`\`\`typescript
import { DataProcessorTest } from './DataProcessorTest';
DataProcessorTest.runAllTests();
\`\`\`
`;
  }
}

// Auto-run demo if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  DataProcessorDemo.runDemo().catch(console.error);
}