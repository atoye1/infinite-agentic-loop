/**
 * Demonstration of comprehensive error handling in the Bar Chart Race system
 */

import { DataProcessor, DataProcessingError, ProcessingConfig } from '../dataprocessor/DataProcessor';
import { ValidationUtils } from '../utils/ValidationUtils';
import { validateProcessedData } from '../utils';

export class ErrorHandlingDemo {
  /**
   * Demonstrate graceful handling of various error scenarios
   */
  static async demonstrateErrorHandling(): Promise<void> {
    console.log('🛡️ Demonstrating Error Handling Capabilities\n');

    // Example 1: Configuration Validation
    console.log('1. Configuration Validation:');
    console.log('   Testing invalid configuration...');
    
    try {
      // This will fail with clear error messages
      const invalidConfig = {
        dateColumn: '', // Invalid: empty string
        valueColumns: [], // Invalid: empty array
        dateFormat: 'INVALID' as any, // Invalid: unsupported format
        interpolationMethod: 'unknown' as any, // Invalid: unsupported method
        fps: 200 // Invalid: too high
      };

      new DataProcessor(invalidConfig);
    } catch (error) {
      if (error instanceof DataProcessingError) {
        console.log(`   ✅ Caught configuration error: ${error.message}`);
        console.log(`   📋 Error code: ${error.code}`);
        if (error.context) {
          console.log(`   📝 Context: ${JSON.stringify(error.context, null, 2)}`);
        }
      } else {
        console.log(`   ❌ Unexpected error type: ${error}`);
      }
    }

    console.log();

    // Example 2: CSV Validation
    console.log('2. CSV Data Validation:');
    console.log('   Testing malformed CSV data...');

    const malformedCSV = `Date,Revenue,Users
2023-01-01,1000000,50000
2023-02-01,not-a-number,60000
2023-03-01,1500000,invalid
,1200000,55000
2023-05-01,1800000
2023-06-01,2000000,80000,extra-column`;

    const csvValidation = ValidationUtils.validateCSVContent(malformedCSV, ['Date', 'Revenue', 'Users']);
    
    if (!csvValidation.isValid) {
      console.log('   ✅ CSV validation detected issues:');
      csvValidation.errors.forEach(error => {
        console.log(`      - ${error.field}: ${error.message} (${error.code})`);
      });
    }

    if (csvValidation.warnings.length > 0) {
      console.log('   ⚠️ CSV validation warnings:');
      csvValidation.warnings.forEach(warning => {
        console.log(`      - ${warning.field}: ${warning.message} (${warning.code})`);
      });
    }

    console.log();

    // Example 3: Graceful Data Processing
    console.log('3. Graceful Data Processing:');
    console.log('   Processing data with issues but continuing safely...');

    try {
      const config: ProcessingConfig = {
        dateColumn: 'Date',
        valueColumns: ['Revenue', 'Users'],
        dateFormat: 'YYYY-MM-DD',
        interpolationMethod: 'linear',
        fps: 30
      };

      const processor = new DataProcessor(config);
      
      // Parse CSV with known issues - processor should handle gracefully
      processor.parseCSV(malformedCSV);
      
      // Get processing statistics
      const stats = processor.getProcessingStats();
      console.log('   📊 Processing Statistics:');
      console.log(`      - Total rows: ${stats.totalRows}`);
      console.log(`      - Valid rows: ${stats.validRows}`);
      console.log(`      - Skipped rows: ${stats.skippedRows}`);
      console.log(`      - Errors encountered: ${stats.errors.length}`);
      
      if (stats.errors.length > 0) {
        console.log('   📝 Sample errors:');
        stats.errors.slice(0, 3).forEach(error => {
          console.log(`      - ${error}`);
        });
      }

      // Transform data - should handle invalid values gracefully
      processor.transformData();
      console.log('   ✅ Data transformation completed with error handling');

      // Generate frames - should work even with imperfect data
      const frames = processor.generateFrameData(5);
      console.log(`   ✅ Generated ${frames.length} frames successfully`);

    } catch (error) {
      if (error instanceof DataProcessingError) {
        console.log(`   ❌ Processing failed: ${error.message} (${error.code})`);
        if (error.context) {
          console.log(`   📝 Context: ${JSON.stringify(error.context, null, 2)}`);
        }
      } else {
        console.log(`   ❌ Unexpected error: ${error}`);
      }
    }

    console.log();

    // Example 4: Edge Case Handling
    console.log('4. Edge Case Handling:');
    console.log('   Testing extreme scenarios...');

    const edgeCases = [
      {
        name: 'Empty CSV after header',
        csv: 'Date,Value\n'
      },
      {
        name: 'Single data point',
        csv: 'Date,Value\n2023-01-01,100\n'
      },
      {
        name: 'All zero values',
        csv: 'Date,Value\n2023-01-01,0\n2023-01-02,0\n'
      },
      {
        name: 'Extreme numbers',
        csv: 'Date,Value\n2023-01-01,1e15\n2023-01-02,-1e15\n'
      },
      {
        name: 'Same dates',
        csv: 'Date,Value\n2023-01-01,100\n2023-01-01,200\n'
      }
    ];

    for (const testCase of edgeCases) {
      console.log(`   Testing: ${testCase.name}`);
      
      try {
        const config: ProcessingConfig = {
          dateColumn: 'Date',
          valueColumns: ['Value'],
          dateFormat: 'YYYY-MM-DD',
          interpolationMethod: 'linear',
          fps: 30
        };

        const processor = new DataProcessor(config);
        processor.parseCSV(testCase.csv);
        processor.transformData();
        const frames = processor.generateFrameData(1);
        
        console.log(`      ✅ Handled gracefully (${frames.length} frames generated)`);
        
      } catch (error) {
        if (error instanceof DataProcessingError) {
          console.log(`      ⚠️ Expected handling: ${error.message} (${error.code})`);
        } else {
          console.log(`      ❌ Unexpected error: ${error}`);
        }
      }
    }

    console.log();

    // Example 5: Safe Data Access
    console.log('5. Safe Data Access:');
    console.log('   Demonstrating safe data retrieval...');

    // Create some test data
    const validConfig: ProcessingConfig = {
      dateColumn: 'Date',
      valueColumns: ['Value'],
      dateFormat: 'YYYY-MM-DD',
      interpolationMethod: 'linear',
      fps: 30
    };

    try {
      const processor = new DataProcessor(validConfig);
      const validCSV = 'Date,Value\n2023-01-01,100\n2023-01-02,200\n';
      processor.parseCSV(validCSV);
      processor.transformData();
      const frames = processor.generateFrameData(2);

      // Create processed data structure
      const processedData = {
        frames: frames.map(frame => ({
          frame: frame.frame,
          date: frame.date.toISOString(),
          items: frame.data.map(item => ({
            id: item.category,
            name: item.category,
            value: item.value,
            rank: item.rank || 1
          })),
          maxValue: Math.max(...frame.data.map(item => item.value))
        })),
        totalFrames: frames.length,
        dateRange: {
          start: frames[0].date.toISOString(),
          end: frames[frames.length - 1].date.toISOString()
        },
        valueColumns: ['Value'],
        globalMaxValue: Math.max(...frames.map(f => Math.max(...f.data.map(d => d.value))))
      };

      // Validate the processed data structure
      const validation = validateProcessedData(processedData);
      if (validation.isValid) {
        console.log('   ✅ ProcessedData structure is valid');
      } else {
        console.log('   ❌ ProcessedData validation failed:');
        validation.errors.forEach(error => {
          console.log(`      - ${error}`);
        });
      }

    } catch (error) {
      console.log(`   ❌ Safe data access demo failed: ${error}`);
    }

    console.log();

    // Example 6: Error Recovery Strategies
    console.log('6. Error Recovery Strategies:');
    console.log('   Demonstrating automatic error recovery...');

    const problematicCSV = `Date,Revenue,Users,Country
2023-01-01,1000000,50000,USA
invalid-date,1500000,60000,Canada
2023-03-01,,70000,UK
2023-04-01,2000000,invalid,Germany
2023-05-01,2500000,90000,France`;

    try {
      const config: ProcessingConfig = {
        dateColumn: 'Date',
        valueColumns: ['Revenue', 'Users'],
        dateFormat: 'YYYY-MM-DD',
        interpolationMethod: 'linear',
        fps: 30
      };

      const processor = new DataProcessor(config);
      processor.parseCSV(problematicCSV);
      processor.transformData();
      
      const stats = processor.getProcessingStats();
      const dataStats = processor.getDataStats();
      
      console.log('   📊 Recovery Results:');
      console.log(`      - Original rows: ${stats.totalRows}`);
      console.log(`      - Successfully processed: ${stats.validRows}`);
      console.log(`      - Recovered data points: ${dataStats.totalDataPoints}`);
      console.log(`      - Date range: ${dataStats.dateRange.start.toISOString()} to ${dataStats.dateRange.end.toISOString()}`);
      console.log(`      - Value range: ${dataStats.valueRange.min} to ${dataStats.valueRange.max}`);
      
      console.log('   ✅ Successfully recovered usable data from problematic input');

    } catch (error) {
      console.log(`   ❌ Error recovery failed: ${error}`);
    }

    console.log('\n🎉 Error handling demonstration completed!');
    console.log('💡 Key takeaways:');
    console.log('   • All errors provide clear, actionable messages');
    console.log('   • System gracefully handles malformed data');
    console.log('   • Processing continues where possible with warnings');
    console.log('   • Edge cases are handled safely');
    console.log('   • Data validation prevents runtime errors');
    console.log('   • Error recovery maximizes usable data');
  }
}

// Uncomment to run the demonstration:
// ErrorHandlingDemo.demonstrateErrorHandling().catch(console.error);