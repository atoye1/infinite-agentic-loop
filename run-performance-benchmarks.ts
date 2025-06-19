#!/usr/bin/env tsx

/**
 * Performance Benchmark Execution Script
 * Run comprehensive performance tests to validate optimizations
 */

import { createPerformanceOptimizationSystem } from './src/performance';
import { PerformanceBenchmarkRunner } from './src/performance/PerformanceBenchmarkRunner';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  console.log('🚀 Bar Chart Race Performance Optimization Validation');
  console.log('====================================================\n');

  // Create performance system
  const perfSystem = createPerformanceOptimizationSystem();

  try {
    // Start monitoring
    console.log('📊 Starting performance monitoring...');
    await perfSystem.startMonitoring();

    // Clear caches for clean benchmark
    console.log('🧹 Clearing caches...');
    perfSystem.clearAllCaches();

    // Run benchmarks
    console.log('\n🏃 Running performance benchmarks...\n');
    const benchmarkRunner = new PerformanceBenchmarkRunner();
    const results = await benchmarkRunner.runAllBenchmarks();

    // Analyze results
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const passRate = (passed / total) * 100;

    console.log('\n📈 Performance Summary');
    console.log('=====================');
    console.log(`Tests Passed: ${passed}/${total} (${passRate.toFixed(1)}%)`);

    // Check key metrics
    const quickTest = results.find(r => r.scenario.name === 'quick-test');
    const longVideo = results.find(r => r.scenario.name === 'long-video');

    if (quickTest) {
      console.log(`\n3-second video render speed: ${quickTest.metrics.renderSpeedRatio.toFixed(2)}x (target: <3x)`);
      console.log(`Memory usage: ${(quickTest.metrics.peakMemoryUsage / (1024 * 1024)).toFixed(0)}MB`);
    }

    if (longVideo) {
      console.log(`\n10-minute video render speed: ${longVideo.metrics.renderSpeedRatio.toFixed(2)}x (target: <3x)`);
      console.log(`Memory usage: ${(longVideo.metrics.peakMemoryUsage / (1024 * 1024 * 1024)).toFixed(2)}GB (target: <2GB)`);
    }

    // Get optimization suggestions
    console.log('\n💡 Optimization Insights');
    console.log('========================');
    const suggestions = perfSystem.getOptimizationSuggestions();
    suggestions.forEach(s => {
      console.log(`${s.priority.toUpperCase()}: ${s.suggestion}`);
    });

    // Cache statistics
    console.log('\n📦 Cache Performance');
    console.log('===================');
    const cacheStats = perfSystem.getCacheStatistics();
    console.log(`Overall hit rate: ${cacheStats.summary.overallHitRate.toFixed(1)}%`);
    console.log(`Total memory used: ${(cacheStats.summary.totalMemoryUsed / (1024 * 1024)).toFixed(1)}MB`);

    // Save detailed results
    const reportPath = path.join(process.cwd(), 'performance-results.json');
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        passRate,
        testsRun: total,
        testsPassed: passed
      },
      results,
      cacheStatistics: cacheStats,
      optimizationSuggestions: suggestions
    }, null, 2));

    console.log(`\n📄 Detailed results saved to: ${reportPath}`);

    // Check if all performance targets are met
    const allTargetsMet = results.every(r => 
      r.metrics.renderSpeedRatio <= 3 && 
      (r.scenario.expectedMaxMemory ? r.metrics.peakMemoryUsage <= r.scenario.expectedMaxMemory : true)
    );

    if (allTargetsMet) {
      console.log('\n✅ ALL PERFORMANCE TARGETS MET!');
      console.log('The system successfully achieves:');
      console.log('  • Render time < 3x video duration');
      console.log('  • Memory usage < 2GB for 10-minute videos');
      console.log('  • Efficient caching and optimization');
    } else {
      console.log('\n⚠️  Some performance targets not met. See report for details.');
    }

    // Stop monitoring
    await perfSystem.stopMonitoring();

    process.exit(allTargetsMet ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Benchmark execution failed:', error);
    await perfSystem.stopMonitoring();
    process.exit(1);
  }
}

// Run the benchmarks
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});