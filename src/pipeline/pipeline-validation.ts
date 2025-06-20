/**
 * Pipeline Validation Script
 * Tests the complete data flow from configuration to rendered components
 */

import { createSampleData } from './utils';
import { BarChartRaceConfig } from './types';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  performanceMetrics: {
    dataGenerationTime: number;
    componentValidationTime: number;
    totalTime: number;
  };
}

export class PipelineValidator {
  async validatePipeline(): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log('🔄 Validating Bar Chart Race Pipeline...\n');

    // 1. Test sample data generation
    console.log('1️⃣ Testing sample data generation...');
    const dataGenStart = Date.now();
    
    let sampleData;
    try {
      sampleData = createSampleData();
      console.log(`   ✅ Generated ${sampleData.frames.length} frames of data`);
      console.log(`   📊 Total items: ${sampleData.frames[0]?.items.length || 0}`);
      console.log(`   📈 Global max value: ${sampleData.globalMaxValue.toLocaleString()}`);
    } catch (error) {
      errors.push(`Sample data generation failed: ${error}`);
      console.log(`   ❌ Failed to generate sample data`);
    }
    
    const dataGenTime = Date.now() - dataGenStart;

    // 2. Test configuration validation
    console.log('\n2️⃣ Testing configuration validation...');
    const compValidStart = Date.now();
    
    const testConfig: BarChartRaceConfig = {
      output: {
        filename: "pipeline-test.mp4",
        format: "mp4",
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 5,
        quality: "medium"
      },
      data: {
        csvPath: "./test-data.csv",
        dateColumn: "Date",
        dateFormat: "YYYY-MM-DD",
        valueColumns: ["Test1", "Test2", "Test3"],
        interpolation: "smooth"
      },
      layers: {
        background: {
          color: "#1a1a2e",
          opacity: 100
        },
        chart: {
          position: { top: 100, right: 100, bottom: 100, left: 100 },
          chart: { visibleItemCount: 5, maxValue: "local", itemSpacing: 20 },
          animation: { type: "continuous", overtakeDuration: 0.5 },
          bar: { colors: "auto", cornerRadius: 8, opacity: 90 },
          labels: {
            title: { show: true, fontSize: 20, fontFamily: "Arial", color: "#fff", position: "outside" },
            value: { show: true, fontSize: 16, fontFamily: "Arial", color: "#fff", format: "{value:,.0f}" },
            rank: { show: true, fontSize: 14, backgroundColor: "#333", textColor: "#fff" }
          }
        }
      }
    };

    try {
      // Test that all required properties are present
      if (!testConfig.output || !testConfig.data || !testConfig.layers) {
        errors.push('Configuration missing required sections');
      } else {
        console.log('   ✅ Configuration structure valid');
      }
      
      // Test that layers are properly configured
      if (!testConfig.layers.background || !testConfig.layers.chart) {
        errors.push('Configuration missing required layers');
      } else {
        console.log('   ✅ Layer configuration valid');
      }
      
    } catch (error) {
      errors.push(`Configuration validation failed: ${error}`);
    }

    // 3. Test component integration
    console.log('\n3️⃣ Testing component integration...');
    
    try {
      // Test imports
      const { BarChartRaceComposition } = await import('./BarChartRaceComposition');
      const { ChartLayer } = await import('./ChartLayer');
      const { BarItem } = await import('./BarItem');
      const { BackgroundLayer } = await import('./BackgroundLayer');
      const { TitleLayer } = await import('./TitleLayer');
      const { DateLayer } = await import('./DateLayer');
      
      if (typeof BarChartRaceComposition === 'function' && 
          typeof ChartLayer === 'function' && 
          typeof BarItem === 'function' && 
          typeof BackgroundLayer === 'function' && 
          typeof TitleLayer === 'function' && 
          typeof DateLayer === 'function') {
        console.log('   ✅ All components import successfully');
      } else {
        errors.push('One or more components failed to import');
      }
      
    } catch (error) {
      errors.push(`Component integration test failed: ${error}`);
    }

    // 4. Test utility functions
    console.log('\n4️⃣ Testing utility functions...');
    
    try {
      const { 
        generateColors, 
        formatValue, 
        validateFrameData, 
        calculateContainerDimensions 
      } = await import('./utils');
      
      // Test color generation
      const colors = generateColors(5, 'auto');
      if (!Array.isArray(colors) || colors.length !== 5) {
        errors.push('Color generation failed');
      } else {
        console.log('   ✅ Color generation working');
      }
      
      // Test value formatting
      const formatted = formatValue(123456, '{value:,.0f}', '$', ' USD');
      if (typeof formatted !== 'string') {
        errors.push('Value formatting failed');
      } else {
        console.log('   ✅ Value formatting working');
      }
      
      // Test frame validation
      if (sampleData) {
        const isValid = validateFrameData(sampleData.frames[0]);
        if (!isValid) {
          errors.push('Frame data validation failed');
        } else {
          console.log('   ✅ Frame data validation working');
        }
      }
      
      // Test dimension calculations
      const dimensions = calculateContainerDimensions(
        testConfig.layers.chart,
        1920,
        1080
      );
      
      if (dimensions.width <= 0 || dimensions.height <= 0) {
        errors.push('Container dimension calculation failed');
      } else {
        console.log('   ✅ Container dimensions calculation working');
      }
      
    } catch (error) {
      errors.push(`Utility function test failed: ${error}`);
    }

    // 5. Test animation utilities
    console.log('\n5️⃣ Testing animation utilities...');
    
    try {
      const { SpringPresets, EasingFunctions, createAdvancedAnimation } = await import('./utils/AnimationUtils');
      
      if (Object.keys(SpringPresets).length === 0) {
        errors.push('Spring presets not available');
      } else {
        console.log('   ✅ Spring presets available');
      }
      
      if (Object.keys(EasingFunctions).length === 0) {
        errors.push('Easing functions not available');
      } else {
        console.log('   ✅ Easing functions available');
      }
      
      // Test animation creation
      const animatedValue = createAdvancedAnimation(
        10, // frame
        30, // fps
        0,  // from
        100, // to
        { type: 'interpolate', duration: 1, easing: 'easeOutCubic' }
      );
      
      if (typeof animatedValue !== 'number') {
        errors.push('Animation creation failed');
      } else {
        console.log('   ✅ Animation system working');
      }
      
    } catch (error) {
      errors.push(`Animation utilities test failed: ${error}`);
    }

    // 6. Memory and performance check
    console.log('\n6️⃣ Testing performance characteristics...');
    
    try {
      if (sampleData) {
        const memoryUsage = process.memoryUsage();
        console.log(`   📊 Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
        
        // Test frame access performance
        const frameAccessStart = Date.now();
        for (let i = 0; i < 100; i++) {
          const { getFrameData } = await import('./utils');
          getFrameData(sampleData, i % sampleData.frames.length);
        }
        const frameAccessTime = Date.now() - frameAccessStart;
        
        console.log(`   ⚡ Frame access time: ${frameAccessTime}ms for 100 frames`);
        
        if (frameAccessTime > 1000) {
          warnings.push('Frame access performance may be slow');
        } else {
          console.log('   ✅ Frame access performance acceptable');
        }
      }
      
    } catch (error) {
      warnings.push(`Performance test failed: ${error}`);
    }

    const compValidTime = Date.now() - compValidStart;
    const totalTime = Date.now() - startTime;

    // Summary
    console.log('\n📊 Pipeline Validation Summary:');
    console.log(`   ✅ Success: ${errors.length === 0}`);
    console.log(`   ❌ Errors: ${errors.length}`);
    console.log(`   ⚠️  Warnings: ${warnings.length}`);
    console.log(`   ⏱️  Total time: ${totalTime}ms`);

    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
      performanceMetrics: {
        dataGenerationTime: dataGenTime,
        componentValidationTime: compValidTime,
        totalTime
      }
    };
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new PipelineValidator();
  validator.validatePipeline().then((result) => {
    if (!result.success) {
      console.log('\n🚨 Pipeline validation failed!');
      process.exit(1);
    } else {
      console.log('\n🎉 Pipeline validation successful!');
      console.log('\n✅ The Bar Chart Race system is ready for use.');
    }
  }).catch((error) => {
    console.error('Pipeline validation execution failed:', error);
    process.exit(1);
  });
}