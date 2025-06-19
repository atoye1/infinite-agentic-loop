/**
 * Integration test for the complete Bar Chart Race rendering system
 * Tests all components working together
 */

import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import { BarChartRaceRenderer } from './BarChartRaceRenderer';
import { RenderPipeline } from './RenderPipeline';
import { OutputManager } from './OutputManager';
import { BatchConfigBuilder, ExampleConfigs } from './BatchConfig';

class IntegrationTest {
  private testOutputDir = './test-output';
  private testsPassed = 0;
  private testsTotal = 0;

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Bar Chart Race Integration Tests\n');

    // Clean up previous test output
    await this.cleanupTestOutput();

    try {
      await this.testRenderPipeline();
      await this.testOutputManager();
      await this.testBatchConfig();
      await this.testBarChartRaceRenderer();
      await this.testCLIIntegration();
      
      console.log(`\n✅ Tests completed: ${this.testsPassed}/${this.testsTotal} passed`);
      
      if (this.testsPassed !== this.testsTotal) {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  private async testRenderPipeline(): Promise<void> {
    console.log('🔧 Testing RenderPipeline...');
    
    const pipeline = new RenderPipeline();
    
    // Test getting compositions
    await this.test('Get available compositions', async () => {
      const compositions = await pipeline.getAvailableCompositions();
      return compositions.length > 0 && compositions[0].id;
    });

    // Test configuration validation
    await this.test('Validate render configuration', async () => {
      const errors = RenderPipeline.validateConfig({
        compositionId: 'HelloWorld',
        outputPath: './test.mp4',
        format: 'mp4',
        quality: 'medium',
      });
      return errors.length === 0;
    });

    // Test file size estimation
    await this.test('Estimate file size', async () => {
      const size = RenderPipeline.estimateFileSize(150, 30, 'medium');
      return size > 0;
    });

    // Test output path creation
    await this.test('Create output path', async () => {
      const path = RenderPipeline.createOutputPath('./output', 'test', 'mp4', 'high');
      return path.includes('test') && path.includes('high') && path.endsWith('.mp4');
    });

    console.log('✅ RenderPipeline tests passed\n');
  }

  private async testOutputManager(): Promise<void> {
    console.log('📁 Testing OutputManager...');
    
    const outputManager = new OutputManager(this.testOutputDir);
    
    // Test initialization
    await this.test('Initialize output manager', async () => {
      await outputManager.initialize('Test Project');
      return existsSync(this.testOutputDir);
    });

    // Test suggested path generation
    await this.test('Generate suggested path', async () => {
      const path = outputManager.getSuggestedPath('test', 'mp4', 'medium');
      return path.includes('test') && path.includes('medium') && path.endsWith('.mp4');
    });

    // Test statistics (should work even with no renders)
    await this.test('Get render statistics', async () => {
      const stats = await outputManager.getRenderStats();
      return typeof stats.totalRenders === 'number';
    });

    // Test report generation
    await this.test('Generate report', async () => {
      const report = await outputManager.generateReport();
      return report.includes('Bar Chart Race') && report.includes('Statistics');
    });

    console.log('✅ OutputManager tests passed\n');
  }

  private async testBatchConfig(): Promise<void> {
    console.log('📦 Testing BatchConfig...');
    
    // Test BatchConfigBuilder
    await this.test('Create batch configuration', async () => {
      const config = new BatchConfigBuilder('Test Batch')
        .addRender({
          compositionId: 'HelloWorld',
          format: 'mp4',
          quality: 'medium',
        })
        .addQualityVariants('HelloWorld', 'mp4', ['low', 'high'])
        .build();
      
      return config.renders.length === 3 && config.name === 'Test Batch';
    });

    // Test example configurations
    await this.test('Create quality comparison config', async () => {
      const config = ExampleConfigs.qualityComparison('HelloWorld');
      return config.renders.length === 4; // low, medium, high, max
    });

    await this.test('Create format comparison config', async () => {
      const config = ExampleConfigs.formatComparison('HelloWorld');
      return config.renders.length === 2; // mp4, webm
    });

    await this.test('Create production config', async () => {
      const config = ExampleConfigs.production('HelloWorld');
      return config.renders.length === 2 && config.renders.every(r => r.quality === 'high');
    });

    console.log('✅ BatchConfig tests passed\n');
  }

  private async testBarChartRaceRenderer(): Promise<void> {
    console.log('🎬 Testing BarChartRaceRenderer...');
    
    const renderer = new BarChartRaceRenderer(`${this.testOutputDir}/renderer`);
    
    // Test initialization
    await this.test('Initialize renderer', async () => {
      await renderer.initialize('Test Renderer');
      return existsSync(`${this.testOutputDir}/renderer`);
    });

    // Test getting compositions
    await this.test('Get compositions from renderer', async () => {
      const compositions = await renderer.getCompositions();
      return compositions.length > 0;
    });

    // Test estimation
    await this.test('Estimate render requirements', async () => {
      const estimation = await renderer.estimateRender('HelloWorld', 'medium');
      return estimation.estimatedTime > 0 && estimation.estimatedSize > 0;
    });

    // Test batch builder creation
    await this.test('Create batch builder', async () => {
      const builder = renderer.createBatchBuilder('Test');
      const config = builder.addRender({
        compositionId: 'HelloWorld',
        format: 'mp4',
        quality: 'low',
      }).build();
      return config.renders.length === 1;
    });

    // Test statistics
    await this.test('Get renderer statistics', async () => {
      const stats = await renderer.getStatistics();
      return typeof stats.totalRenders === 'number';
    });

    console.log('✅ BarChartRaceRenderer tests passed\n');
  }

  private async testCLIIntegration(): Promise<void> {
    console.log('💻 Testing CLI Integration...');
    
    // Test CLI color utility
    await this.test('CLI colors utility', async () => {
      const { chalk } = await import('./colors');
      const redText = chalk.red('test');
      return redText.includes('test') && redText.length > 4; // includes color codes
    });

    console.log('✅ CLI Integration tests passed\n');
  }

  private async test(description: string, testFn: () => Promise<boolean>): Promise<void> {
    this.testsTotal++;
    try {
      const result = await testFn();
      if (result) {
        console.log(`  ✅ ${description}`);
        this.testsPassed++;
      } else {
        console.log(`  ❌ ${description} - Test returned false`);
      }
    } catch (error) {
      console.log(`  ❌ ${description} - Error: ${error}`);
    }
  }

  private async cleanupTestOutput(): Promise<void> {
    try {
      if (existsSync(this.testOutputDir)) {
        await fs.rm(this.testOutputDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new IntegrationTest();
  test.runAllTests().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { IntegrationTest };