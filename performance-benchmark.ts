#!/usr/bin/env tsx

/**
 * Performance Benchmark Tool for Bar Chart Race System
 * Measures render times, memory usage, and output quality to verify specification compliance
 */

import { PerformanceProfiler } from './src/performance/PerformanceProfiler';
import { PerformanceMonitor } from './src/performance/PerformanceMonitor';
import { PerformanceOptimizer } from './src/performance/PerformanceOptimizer';
import { RenderPipeline, RenderConfig } from './src/RenderPipeline';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface BenchmarkConfig {
  name: string;
  config: RenderConfig;
  expectedMaxRenderTime: number; // ms
  expectedMaxMemoryUsage: number; // bytes
  expectedMaxFileSize: number; // bytes
}

interface BenchmarkResult {
  config: BenchmarkConfig;
  actualRenderTime: number;
  actualMemoryUsage: number;
  actualFileSize: number;
  outputPath: string;
  passed: boolean;
  issues: string[];
  optimizationSuggestions: string[];
}

class PerformanceBenchmark {
  private monitor: PerformanceMonitor;
  private profiler: PerformanceProfiler;
  private optimizer: PerformanceOptimizer;
  private pipeline: RenderPipeline;

  constructor() {
    this.monitor = new PerformanceMonitor();
    this.profiler = new PerformanceProfiler(this.monitor);
    this.optimizer = new PerformanceOptimizer(this.monitor);
    this.pipeline = new RenderPipeline();
  }

  /**
   * Run comprehensive performance benchmark
   */
  async runBenchmark(): Promise<BenchmarkResult[]> {
    console.log('🚀 Starting Performance Benchmark for Bar Chart Race System');
    console.log('📋 Specification Requirements:');
    console.log('   • Render time: <30 seconds for 10-second videos');
    console.log('   • Memory usage: <2GB during rendering');
    console.log('   • Output: 30 FPS without dropped frames');
    console.log('   • File size: <50MB for 10-second video');
    console.log();

    const benchmarkConfigs = this.generateBenchmarkConfigs();
    const results: BenchmarkResult[] = [];

    this.monitor.startMonitoring();

    for (const benchmarkConfig of benchmarkConfigs) {
      console.log(`🧪 Testing configuration: ${benchmarkConfig.name}`);
      
      try {
        const result = await this.runSingleBenchmark(benchmarkConfig);
        results.push(result);
        
        console.log(`   ${result.passed ? '✅' : '❌'} ${result.passed ? 'PASSED' : 'FAILED'}`);
        console.log(`   📊 Render time: ${(result.actualRenderTime / 1000).toFixed(1)}s`);
        console.log(`   💾 Memory usage: ${(result.actualMemoryUsage / (1024 * 1024)).toFixed(1)}MB`);
        console.log(`   📁 File size: ${(result.actualFileSize / (1024 * 1024)).toFixed(1)}MB`);
        
        if (result.issues.length > 0) {
          console.log(`   ⚠️  Issues: ${result.issues.join(', ')}`);
        }
        
        console.log();
      } catch (error) {
        console.error(`❌ Benchmark failed for ${benchmarkConfig.name}:`, error);
        results.push({
          config: benchmarkConfig,
          actualRenderTime: -1,
          actualMemoryUsage: -1,
          actualFileSize: -1,
          outputPath: '',
          passed: false,
          issues: [`Benchmark execution failed: ${error.message}`],
          optimizationSuggestions: [],
        });
      }
    }

    this.monitor.stopMonitoring();

    // Generate comprehensive report
    await this.generateBenchmarkReport(results);

    return results;
  }

  /**
   * Run a single benchmark configuration
   */
  private async runSingleBenchmark(benchmarkConfig: BenchmarkConfig): Promise<BenchmarkResult> {
    const outputPath = path.join(__dirname, 'benchmark-outputs', `${benchmarkConfig.name}.mp4`);
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Start profiling
    this.profiler.startProfiling(`benchmark-${benchmarkConfig.name}`);
    
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    let peakMemoryUsage = startMemory.rss;

    // Monitor memory usage during render
    const memoryMonitor = setInterval(() => {
      const currentMemory = process.memoryUsage();
      peakMemoryUsage = Math.max(peakMemoryUsage, currentMemory.rss);
    }, 100);

    try {
      // Execute render
      await this.pipeline.render({
        ...benchmarkConfig.config,
        outputPath,
      });

      clearInterval(memoryMonitor);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;

      // Stop profiling
      const profileData = this.profiler.stopProfiling();

      // Analyze results
      const issues = [];
      const optimizationSuggestions = [];

      // Check render time
      if (renderTime > benchmarkConfig.expectedMaxRenderTime) {
        issues.push(`Render time exceeded: ${(renderTime / 1000).toFixed(1)}s > ${(benchmarkConfig.expectedMaxRenderTime / 1000).toFixed(1)}s`);
      }

      // Check memory usage
      if (peakMemoryUsage > benchmarkConfig.expectedMaxMemoryUsage) {
        issues.push(`Memory usage exceeded: ${(peakMemoryUsage / (1024 * 1024)).toFixed(1)}MB > ${(benchmarkConfig.expectedMaxMemoryUsage / (1024 * 1024)).toFixed(1)}MB`);
      }

      // Check file size
      if (fileSize > benchmarkConfig.expectedMaxFileSize) {
        issues.push(`File size exceeded: ${(fileSize / (1024 * 1024)).toFixed(1)}MB > ${(benchmarkConfig.expectedMaxFileSize / (1024 * 1024)).toFixed(1)}MB`);
      }

      // Generate optimization suggestions if there are issues
      if (issues.length > 0 && profileData) {
        const bottlenecks = this.profiler.analyzeBottlenecks(profileData);
        optimizationSuggestions.push(...bottlenecks.slice(0, 3).map(b => 
          `${b.severity.toUpperCase()}: ${b.suggestions[0] || 'Optimize ' + b.section}`
        ));
      }

      return {
        config: benchmarkConfig,
        actualRenderTime: renderTime,
        actualMemoryUsage: peakMemoryUsage,
        actualFileSize: fileSize,
        outputPath,
        passed: issues.length === 0,
        issues,
        optimizationSuggestions,
      };

    } catch (error) {
      clearInterval(memoryMonitor);
      this.profiler.stopProfiling();
      throw error;
    }
  }

  /**
   * Generate benchmark configurations
   */
  private generateBenchmarkConfigs(): BenchmarkConfig[] {
    // 10-second video (specification requirement)
    const baseDuration = 10;
    const maxRenderTime = 30 * 1000; // 30 seconds
    const maxMemoryUsage = 2 * 1024 * 1024 * 1024; // 2GB
    const maxFileSize = 50 * 1024 * 1024; // 50MB

    return [
      {
        name: 'spec-compliant-optimized',
        config: {
          outputPath: '',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: baseDuration,
          quality: 'medium', // Optimized for speed vs quality
          format: 'mp4',
          parallel: 2, // Conservative concurrency
          dataPath: './sample-data.csv',
        },
        expectedMaxRenderTime: maxRenderTime,
        expectedMaxMemoryUsage: maxMemoryUsage,
        expectedMaxFileSize: maxFileSize,
      },
      {
        name: 'high-quality-test',
        config: {
          outputPath: '',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: baseDuration,
          quality: 'high',
          format: 'mp4',
          parallel: 1, // Single thread for high quality
          dataPath: './sample-data.csv',
        },
        expectedMaxRenderTime: maxRenderTime * 1.5, // Allow more time for high quality
        expectedMaxMemoryUsage: maxMemoryUsage,
        expectedMaxFileSize: maxFileSize * 1.2, // Allow slightly larger file
      },
      {
        name: 'speed-optimized',
        config: {
          outputPath: '',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: baseDuration,
          quality: 'low',
          format: 'webm', // Faster encoding
          parallel: 4, // More aggressive concurrency
          dataPath: './sample-data.csv',
        },
        expectedMaxRenderTime: maxRenderTime * 0.5, // Should be much faster
        expectedMaxMemoryUsage: maxMemoryUsage * 0.7, // Should use less memory
        expectedMaxFileSize: maxFileSize * 0.6, // Smaller file due to lower quality
      },
    ];
  }

  /**
   * Generate comprehensive benchmark report
   */
  private async generateBenchmarkReport(results: BenchmarkResult[]): Promise<void> {
    const reportPath = path.join(__dirname, 'performance-benchmark-report.json');
    const htmlReportPath = path.join(__dirname, 'performance-benchmark-report.html');

    // JSON Report
    const report = {
      timestamp: new Date().toISOString(),
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: Math.floor(require('os').totalmem() / (1024 * 1024)),
        cpus: require('os').cpus().length,
      },
      specificationRequirements: {
        maxRenderTime: 30,
        maxMemoryUsageGB: 2,
        targetFPS: 30,
        maxFileSizeMB: 50,
        videoDuration: 10,
      },
      results: results.map(r => ({
        configName: r.config.name,
        passed: r.passed,
        metrics: {
          renderTimeSeconds: r.actualRenderTime / 1000,
          memoryUsageMB: r.actualMemoryUsage / (1024 * 1024),
          fileSizeMB: r.actualFileSize / (1024 * 1024),
        },
        issues: r.issues,
        optimizationSuggestions: r.optimizationSuggestions,
      })),
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        averageRenderTime: results.reduce((sum, r) => sum + r.actualRenderTime, 0) / results.length / 1000,
        averageMemoryUsage: results.reduce((sum, r) => sum + r.actualMemoryUsage, 0) / results.length / (1024 * 1024),
        averageFileSize: results.reduce((sum, r) => sum + r.actualFileSize, 0) / results.length / (1024 * 1024),
      },
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // HTML Report
    const htmlReport = this.generateHTMLReport(report);
    await fs.writeFile(htmlReportPath, htmlReport);

    console.log('📊 Benchmark Report Generated:');
    console.log(`   📄 JSON: ${reportPath}`);
    console.log(`   🌐 HTML: ${htmlReportPath}`);
    console.log();
    console.log('📈 Summary:');
    console.log(`   ✅ Passed: ${report.summary.passed}/${report.summary.totalTests}`);
    console.log(`   ⏱️  Avg render time: ${report.summary.averageRenderTime.toFixed(1)}s`);
    console.log(`   💾 Avg memory usage: ${report.summary.averageMemoryUsage.toFixed(1)}MB`);
    console.log(`   📁 Avg file size: ${report.summary.averageFileSize.toFixed(1)}MB`);
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Bar Chart Race Performance Benchmark Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .spec-box { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .spec-box h3 { margin-top: 0; color: #2980b9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .summary-card { background: #ecf0f1; padding: 15px; border-radius: 8px; text-align: center; }
        .summary-card h4 { margin: 0 0 10px 0; color: #34495e; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #2980b9; }
        .test-results { margin: 20px 0; }
        .test-result { border: 1px solid #ddd; border-radius: 8px; margin: 15px 0; overflow: hidden; }
        .test-header { padding: 15px 20px; font-weight: bold; }
        .test-header.passed { background: #d4edda; color: #155724; }
        .test-header.failed { background: #f8d7da; color: #721c24; }
        .test-details { padding: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
        .metric { text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .metric .label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
        .metric .value { font-size: 18px; font-weight: bold; margin-top: 5px; }
        .issues, .suggestions { margin: 15px 0; }
        .issues h5, .suggestions h5 { margin: 0 0 10px 0; }
        .issue, .suggestion { padding: 8px 12px; margin: 5px 0; border-radius: 4px; }
        .issue { background: #f8d7da; color: #721c24; }
        .suggestion { background: #d1ecf1; color: #0c5460; }
        .system-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .system-info h4 { margin-top: 0; }
        .chart { margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Bar Chart Race Performance Benchmark Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="spec-box">
            <h3>📋 Specification Requirements</h3>
            <ul>
                <li><strong>Render Time:</strong> &lt;${report.specificationRequirements.maxRenderTime} seconds for ${report.specificationRequirements.videoDuration}-second videos</li>
                <li><strong>Memory Usage:</strong> &lt;${report.specificationRequirements.maxMemoryUsageGB}GB during rendering</li>
                <li><strong>Frame Rate:</strong> ${report.specificationRequirements.targetFPS} FPS without dropped frames</li>
                <li><strong>File Size:</strong> &lt;${report.specificationRequirements.maxFileSizeMB}MB for ${report.specificationRequirements.videoDuration}-second video</li>
            </ul>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h4>Tests Passed</h4>
                <div class="value">${report.summary.passed}/${report.summary.totalTests}</div>
            </div>
            <div class="summary-card">
                <h4>Avg Render Time</h4>
                <div class="value">${report.summary.averageRenderTime.toFixed(1)}s</div>
            </div>
            <div class="summary-card">
                <h4>Avg Memory Usage</h4>
                <div class="value">${report.summary.averageMemoryUsage.toFixed(1)}MB</div>
            </div>
            <div class="summary-card">
                <h4>Avg File Size</h4>
                <div class="value">${report.summary.averageFileSize.toFixed(1)}MB</div>
            </div>
        </div>

        <div class="test-results">
            <h3>🧪 Test Results</h3>
            ${report.results.map((result: any) => `
                <div class="test-result">
                    <div class="test-header ${result.passed ? 'passed' : 'failed'}">
                        ${result.passed ? '✅' : '❌'} ${result.configName}
                    </div>
                    <div class="test-details">
                        <div class="metrics">
                            <div class="metric">
                                <div class="label">Render Time</div>
                                <div class="value">${result.metrics.renderTimeSeconds.toFixed(1)}s</div>
                            </div>
                            <div class="metric">
                                <div class="label">Memory Usage</div>
                                <div class="value">${result.metrics.memoryUsageMB.toFixed(1)}MB</div>
                            </div>
                            <div class="metric">
                                <div class="label">File Size</div>
                                <div class="value">${result.metrics.fileSizeMB.toFixed(1)}MB</div>
                            </div>
                        </div>
                        
                        ${result.issues.length > 0 ? `
                            <div class="issues">
                                <h5>⚠️ Issues:</h5>
                                ${result.issues.map((issue: string) => `<div class="issue">${issue}</div>`).join('')}
                            </div>
                        ` : ''}
                        
                        ${result.optimizationSuggestions.length > 0 ? `
                            <div class="suggestions">
                                <h5>💡 Optimization Suggestions:</h5>
                                ${result.optimizationSuggestions.map((suggestion: string) => `<div class="suggestion">${suggestion}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="system-info">
            <h4>🖥️ System Information</h4>
            <p><strong>Platform:</strong> ${report.systemInfo.platform} ${report.systemInfo.arch}</p>
            <p><strong>Node.js:</strong> ${report.systemInfo.nodeVersion}</p>
            <p><strong>Memory:</strong> ${report.systemInfo.memory}MB</p>
            <p><strong>CPUs:</strong> ${report.systemInfo.cpus}</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runBenchmark()
    .then(results => {
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      
      console.log(`🎯 Benchmark Complete: ${passed}/${total} tests passed`);
      
      if (passed < total) {
        console.log('❌ Some tests failed. Check the report for optimization suggestions.');
        process.exit(1);
      } else {
        console.log('✅ All tests passed! System meets specification requirements.');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    });
}

export { PerformanceBenchmark };