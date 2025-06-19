/**
 * Bar Chart Race Renderer Usage Examples
 * 
 * This file demonstrates various ways to use the Bar Chart Race rendering system
 */

import { BarChartRaceRenderer } from '../BarChartRaceRenderer';
import { BatchConfigBuilder, ExampleConfigs } from '../BatchConfig';

async function basicUsageExample() {
  console.log('🎬 Basic Usage Example');
  
  // Initialize renderer
  const renderer = new BarChartRaceRenderer('./output', (progress) => {
    console.log(`${progress.stage}: ${progress.percentage.toFixed(1)}%`);
  });
  
  await renderer.initialize('My Bar Chart Race Project');
  
  // List available compositions
  const compositions = await renderer.getCompositions();
  console.log('Available compositions:', compositions.map(c => c.id));
  
  // Render a single composition
  const result = await renderer.renderComposition({
    compositionId: 'HelloWorld', // Use available composition
    format: 'mp4',
    quality: 'medium',
    category: 'test',
    props: {
      titleText: 'My Custom Title',
      titleColor: '#FF0000',
    },
  });
  
  if (result.success) {
    console.log('✅ Render completed:', result.outputPath);
  } else {
    console.error('❌ Render failed:', result.error?.message);
  }
}

async function qualityComparisonExample() {
  console.log('🎨 Quality Comparison Example');
  
  const renderer = new BarChartRaceRenderer('./output/quality-test');
  await renderer.initialize();
  
  // Render all quality levels for comparison
  const results = await renderer.renderQualityComparison('HelloWorld', {
    titleText: 'Quality Test',
    logoColor1: '#FF6B6B',
    logoColor2: '#4ECDC4',
  });
  
  console.log('Quality comparison results:');
  results.forEach((result, index) => {
    const qualities = ['low', 'medium', 'high', 'max'];
    console.log(`${qualities[index]}: ${result.success ? '✅' : '❌'}`);
  });
}

async function batchRenderExample() {
  console.log('📦 Batch Render Example');
  
  const renderer = new BarChartRaceRenderer('./output/batch-test');
  await renderer.initialize();
  
  // Create custom batch configuration
  const batchConfig = renderer.createBatchBuilder('Custom Batch', './output/custom')
    .addRender({
      compositionId: 'HelloWorld',
      format: 'mp4',
      quality: 'high',
      props: { titleText: 'High Quality MP4' },
      filename: 'helloworld_high.mp4',
    })
    .addRender({
      compositionId: 'HelloWorld',
      format: 'webm',
      quality: 'medium',
      props: { titleText: 'Medium Quality WebM' },
      filename: 'helloworld_medium.webm',
    })
    .setDescription('Custom batch render for testing')
    .build();
  
  // Save batch configuration for reuse
  await renderer.createBatchBuilder().saveToFile('./batch-configs/custom.json');
  
  console.log('Batch configuration created with', batchConfig.renders.length, 'renders');
}

async function productionWorkflowExample() {
  console.log('🏭 Production Workflow Example');
  
  const renderer = new BarChartRaceRenderer('./output/production');
  await renderer.initialize('Production Bar Chart Race');
  
  // Production render with high quality
  const results = await renderer.renderProduction('HelloWorld', {
    titleText: 'Final Production Video',
    titleColor: '#2C3E50',
    logoColor1: '#3498DB',
    logoColor2: '#E74C3C',
  });
  
  // Generate report
  const report = await renderer.generateReport();
  console.log(report);
  
  // Export data for analysis
  const csvPath = await renderer.exportData('./output/production/render-data.csv');
  console.log('Render data exported to:', csvPath);
}

async function estimationExample() {
  console.log('📊 Estimation Example');
  
  const renderer = new BarChartRaceRenderer();
  await renderer.initialize();
  
  // Estimate render requirements
  const estimation = await renderer.estimateRender('HelloWorld', 'high');
  
  console.log('Render Estimation:');
  console.log('- Estimated time:', Math.round(estimation.estimatedTime / 1000), 'seconds');
  console.log('- Estimated size:', Math.round(estimation.estimatedSize / 1024 / 1024), 'MB');
  console.log('- Duration:', estimation.composition.durationInFrames, 'frames');
  console.log('- Resolution:', `${estimation.composition.width}x${estimation.composition.height}`);
}

async function monitoringExample() {
  console.log('📈 Monitoring Example');
  
  const renderer = new BarChartRaceRenderer('./output/monitoring', (progress) => {
    // Detailed progress monitoring
    const { frame, totalFrames, percentage, stage, timeElapsed, estimatedTimeRemaining } = progress;
    
    switch (stage) {
      case 'bundling':
        console.log(`📦 Bundling: ${percentage.toFixed(1)}%`);
        break;
      case 'rendering':
        const fps = frame / (timeElapsed / 1000);
        const eta = estimatedTimeRemaining ? ` (ETA: ${Math.round(estimatedTimeRemaining / 1000)}s)` : '';
        console.log(`🎬 Rendering: ${percentage.toFixed(1)}% (${frame}/${totalFrames}) ${fps.toFixed(1)} fps${eta}`);
        break;
      case 'cleanup':
        console.log(`🧹 Cleanup: ${percentage.toFixed(1)}%`);
        break;
      case 'complete':
        console.log(`✅ Complete: ${percentage.toFixed(1)}%`);
        break;
    }
  });
  
  await renderer.initialize();
  
  const result = await renderer.renderComposition({
    compositionId: 'HelloWorld',
    quality: 'medium',
  });
  
  if (result.success) {
    console.log('Render completed successfully!');
    
    // Get statistics
    const stats = await renderer.getStatistics();
    console.log(`Total renders: ${stats.totalRenders}`);
    console.log(`Success rate: ${((stats.successfulRenders / stats.totalRenders) * 100).toFixed(1)}%`);
  }
}

async function cleanupExample() {
  console.log('🧹 Cleanup Example');
  
  const renderer = new BarChartRaceRenderer('./output/cleanup-test');
  await renderer.initialize();
  
  // Perform cleanup
  const cleanupResult = await renderer.cleanup({
    keepDays: 7, // Keep renders from last 7 days
    keepSuccessful: 10, // Keep last 10 successful renders
    deleteFailed: true, // Delete failed renders
  });
  
  console.log(`Cleanup completed:`);
  console.log(`- Files deleted: ${cleanupResult.filesDeleted}`);
  console.log(`- Space freed: ${Math.round(cleanupResult.spaceFreed / 1024 / 1024)} MB`);
}

async function advancedConfigExample() {
  console.log('⚙️ Advanced Configuration Example');
  
  const renderer = new BarChartRaceRenderer('./output/advanced');
  await renderer.initialize();
  
  // Create sophisticated batch configuration
  const advancedBatch = renderer.createBatchBuilder('Advanced Test Suite')
    .setDescription('Comprehensive test with multiple configurations')
    .addQualityVariants('HelloWorld', 'mp4', ['medium', 'high'])
    .addFormatVariants('HelloWorld', 'high')
    .addRender({
      compositionId: 'HelloWorld',
      format: 'mp4',
      quality: 'max',
      parallel: 2, // Use 2 parallel processes
      props: {
        titleText: 'Ultra High Quality',
        titleColor: '#8E44AD',
      },
      filename: 'helloworld_ultra.mp4',
    })
    .build();
  
  console.log('Advanced batch created with', advancedBatch.renders.length, 'renders');
  
  // Get render history
  const history = await renderer.getRenderHistory(5);
  console.log('Recent renders:', history.map(r => `${r.compositionId} (${r.quality})`));
}

// Export all examples for easy execution
export const examples = {
  basicUsage: basicUsageExample,
  qualityComparison: qualityComparisonExample,
  batchRender: batchRenderExample,
  productionWorkflow: productionWorkflowExample,
  estimation: estimationExample,
  monitoring: monitoringExample,
  cleanup: cleanupExample,
  advancedConfig: advancedConfigExample,
};

// Run example if this file is executed directly
if (require.main === module) {
  const exampleName = process.argv[2] || 'basicUsage';
  const example = examples[exampleName as keyof typeof examples];
  
  if (example) {
    console.log(`Running example: ${exampleName}`);
    example().catch(console.error);
  } else {
    console.log('Available examples:', Object.keys(examples).join(', '));
  }
}