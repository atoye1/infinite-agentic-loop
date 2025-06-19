/**
 * PerformanceOptimizer - Intelligent optimization engine for Bar Chart Race rendering
 */

import { PerformanceMonitor, PerformanceMetrics } from './PerformanceMonitor';
import { RenderConfig } from '../RenderPipeline';
import * as os from 'os';

export interface OptimizationConfig {
  targetRenderTime?: number; // Maximum desired render time in ms
  targetQuality?: 'auto' | 'low' | 'medium' | 'high' | 'max';
  maxMemoryUsage?: number; // Maximum memory usage in bytes
  preferSpeed?: boolean; // Prefer speed over quality
  allowQualityAuto?: boolean; // Allow automatic quality adjustment
  concurrencyMode?: 'auto' | 'conservative' | 'aggressive';
  enableCaching?: boolean;
}

export interface OptimizationResult {
  originalConfig: RenderConfig;
  optimizedConfig: RenderConfig;
  expectedImprovements: {
    renderTime: number; // Percentage improvement
    memoryUsage: number;
    quality: number; // Quality score 0-100
  };
  optimizations: Array<{
    type: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  warnings: string[];
}

export interface AdaptiveSettings {
  qualityLevel: string;
  concurrency: number;
  codecSettings: Record<string, any>;
  memoryOptimizations: boolean;
  cachingStrategy: string;
}

export class PerformanceOptimizer {
  private monitor: PerformanceMonitor;
  private systemSpecs: {
    cpuCount: number;
    totalMemory: number;
    platform: string;
    arch: string;
  };

  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
    this.systemSpecs = {
      cpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      platform: os.platform(),
      arch: os.arch(),
    };
  }

  /**
   * Optimize render configuration based on system specs and historical performance
   */
  optimizeRenderConfig(
    config: RenderConfig,
    optimizationConfig: OptimizationConfig = {}
  ): OptimizationResult {
    const originalConfig = { ...config };
    const optimizedConfig = { ...config };
    const optimizations = [];
    const warnings = [];

    // Get historical performance data
    const stats = this.monitor.getStats();
    const historicalData = this.getRelevantHistoricalData(config, stats.metrics);

    // Optimize concurrency
    const concurrencyOptimization = this.optimizeConcurrency(
      config,
      optimizationConfig,
      historicalData
    );
    if (concurrencyOptimization.changed) {
      optimizedConfig.parallel = concurrencyOptimization.value;
      optimizations.push({
        type: 'concurrency',
        description: `Adjusted concurrency from ${config.parallel || 1} to ${concurrencyOptimization.value}`,
        impact: 'high',
      });
    }

    // Optimize quality settings
    const qualityOptimization = this.optimizeQuality(
      config,
      optimizationConfig,
      historicalData
    );
    if (qualityOptimization.changed) {
      optimizedConfig.quality = qualityOptimization.value;
      optimizations.push({
        type: 'quality',
        description: `Adjusted quality from ${config.quality} to ${qualityOptimization.value}`,
        impact: qualityOptimization.impact,
      });
    }

    // Optimize format if beneficial
    const formatOptimization = this.optimizeFormat(config, optimizationConfig);
    if (formatOptimization.changed) {
      optimizedConfig.format = formatOptimization.value;
      optimizations.push({
        type: 'format',
        description: `Changed format from ${config.format} to ${formatOptimization.value}`,
        impact: 'medium',
      });
    }

    // Check for potential issues
    const potentialWarnings = this.analyzeConfiguration(optimizedConfig, optimizationConfig);
    warnings.push(...potentialWarnings);

    // Calculate expected improvements
    const expectedImprovements = this.calculateExpectedImprovements(
      originalConfig,
      optimizedConfig,
      historicalData
    );

    return {
      originalConfig,
      optimizedConfig,
      expectedImprovements,
      optimizations,
      warnings,
    };
  }

  /**
   * Generate adaptive settings based on current system load and performance
   */
  generateAdaptiveSettings(
    baseConfig: RenderConfig,
    currentLoad: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
    }
  ): AdaptiveSettings {
    const stats = this.monitor.getStats();
    
    // Determine quality level based on system load
    let qualityLevel = baseConfig.quality;
    if (currentLoad.cpuUsage > 80 || currentLoad.memoryUsage > 80) {
      qualityLevel = this.downgradeQuality(qualityLevel);
    } else if (currentLoad.cpuUsage < 40 && currentLoad.memoryUsage < 50) {
      qualityLevel = this.upgradeQuality(qualityLevel);
    }

    // Adjust concurrency based on load
    let concurrency = baseConfig.parallel || this.getOptimalConcurrency('medium');
    if (currentLoad.cpuUsage > 70) {
      concurrency = Math.max(1, Math.floor(concurrency * 0.7));
    } else if (currentLoad.cpuUsage < 30) {
      concurrency = Math.min(this.systemSpecs.cpuCount, Math.floor(concurrency * 1.3));
    }

    // Codec settings based on performance
    const codecSettings = this.getOptimalCodecSettings(qualityLevel, currentLoad);

    // Memory optimizations
    const memoryOptimizations = currentLoad.memoryUsage > 60;

    // Caching strategy
    const cachingStrategy = this.determineCachingStrategy(currentLoad, stats);

    return {
      qualityLevel,
      concurrency,
      codecSettings,
      memoryOptimizations,
      cachingStrategy,
    };
  }

  /**
   * Benchmark different configurations to find optimal settings
   */
  async runOptimizationBenchmark(
    baseConfig: RenderConfig,
    testDuration: number = 30000 // 30 seconds
  ): Promise<{
    bestConfig: RenderConfig;
    benchmarkResults: Array<{
      config: RenderConfig;
      metrics: PerformanceMetrics;
      score: number;
    }>;
  }> {
    const testConfigurations = this.generateTestConfigurations(baseConfig);
    const benchmarkResults = [];

    for (const testConfig of testConfigurations) {
      // Note: In a real implementation, this would actually run renders
      // For now, we'll simulate based on historical data and estimations
      const estimatedMetrics = this.estimatePerformanceMetrics(testConfig);
      const score = this.calculatePerformanceScore(estimatedMetrics);

      benchmarkResults.push({
        config: testConfig,
        metrics: estimatedMetrics,
        score,
      });
    }

    // Find best configuration
    benchmarkResults.sort((a, b) => b.score - a.score);
    const bestConfig = benchmarkResults[0].config;

    return {
      bestConfig,
      benchmarkResults,
    };
  }

  /**
   * Provide real-time optimization suggestions during rendering
   */
  getRealTimeOptimizations(
    currentMetrics: PerformanceMetrics,
    config: RenderConfig
  ): Array<{
    type: 'immediate' | 'next_render';
    suggestion: string;
    impact: 'low' | 'medium' | 'high';
    action?: () => void;
  }> {
    const suggestions = [];

    // Check for immediate optimizations
    if (currentMetrics.memoryUsage.rss > this.systemSpecs.totalMemory * 0.8) {
      suggestions.push({
        type: 'immediate',
        suggestion: 'Memory usage is critically high. Consider reducing concurrency immediately.',
        impact: 'high',
        action: () => {
          // In a real implementation, this could trigger immediate concurrency reduction
          console.warn('Reducing concurrency due to high memory usage');
        },
      });
    }

    if (currentMetrics.framesPerSecond < 0.1) {
      suggestions.push({
        type: 'immediate',
        suggestion: 'Rendering is extremely slow. Consider stopping and using lower quality.',
        impact: 'high',
      });
    }

    // Check for next render optimizations
    if (currentMetrics.cpuUsage < 50) {
      suggestions.push({
        type: 'next_render',
        suggestion: 'CPU utilization is low. Consider increasing concurrency for next render.',
        impact: 'medium',
      });
    }

    if (currentMetrics.renderTime > 300000) { // 5 minutes
      suggestions.push({
        type: 'next_render',
        suggestion: 'Render time is very long. Consider using lower quality settings.',
        impact: 'high',
      });
    }

    return suggestions;
  }

  /**
   * Optimize concurrency based on system specs and historical data
   */
  private optimizeConcurrency(
    config: RenderConfig,
    optimizationConfig: OptimizationConfig,
    historicalData: PerformanceMetrics[]
  ): { changed: boolean; value: number } {
    const currentConcurrency = config.parallel || 1;
    let optimalConcurrency = currentConcurrency;

    switch (optimizationConfig.concurrencyMode) {
      case 'aggressive':
        optimalConcurrency = Math.min(this.systemSpecs.cpuCount, 8);
        break;
      case 'conservative':
        optimalConcurrency = Math.max(1, Math.floor(this.systemSpecs.cpuCount / 2));
        break;
      case 'auto':
      default:
        optimalConcurrency = this.getOptimalConcurrency(config.quality);
        break;
    }

    // Adjust based on historical memory usage
    if (historicalData.length > 0) {
      const avgMemoryUsage = historicalData.reduce((sum, m) => sum + m.memoryUsage.rss, 0) / historicalData.length;
      const memoryPerProcess = avgMemoryUsage / historicalData[0].concurrency;
      const maxProcesses = Math.floor(this.systemSpecs.totalMemory * 0.8 / memoryPerProcess);
      optimalConcurrency = Math.min(optimalConcurrency, maxProcesses);
    }

    return {
      changed: optimalConcurrency !== currentConcurrency,
      value: optimalConcurrency,
    };
  }

  /**
   * Optimize quality settings
   */
  private optimizeQuality(
    config: RenderConfig,
    optimizationConfig: OptimizationConfig,
    historicalData: PerformanceMetrics[]
  ): { changed: boolean; value: RenderConfig['quality']; impact: 'low' | 'medium' | 'high' } {
    if (optimizationConfig.targetQuality && optimizationConfig.targetQuality !== 'auto') {
      return {
        changed: config.quality !== optimizationConfig.targetQuality,
        value: optimizationConfig.targetQuality,
        impact: 'medium',
      };
    }

    let optimalQuality = config.quality;
    let impact: 'low' | 'medium' | 'high' = 'low';

    // If preferring speed, downgrade quality
    if (optimizationConfig.preferSpeed) {
      optimalQuality = this.downgradeQuality(config.quality);
      impact = 'high';
    }

    // Check target render time
    if (optimizationConfig.targetRenderTime && historicalData.length > 0) {
      const avgRenderTime = historicalData.reduce((sum, m) => sum + m.renderTime, 0) / historicalData.length;
      if (avgRenderTime > optimizationConfig.targetRenderTime) {
        optimalQuality = this.downgradeQuality(config.quality);
        impact = 'high';
      }
    }

    return {
      changed: optimalQuality !== config.quality,
      value: optimalQuality,
      impact,
    };
  }

  /**
   * Optimize output format
   */
  private optimizeFormat(
    config: RenderConfig,
    optimizationConfig: OptimizationConfig
  ): { changed: boolean; value: RenderConfig['format'] } {
    // WebM generally has better compression for animations
    if (optimizationConfig.preferSpeed && config.format === 'mp4') {
      return { changed: true, value: 'webm' };
    }

    return { changed: false, value: config.format };
  }

  /**
   * Get optimal concurrency for quality level
   */
  private getOptimalConcurrency(quality: string): number {
    const baseConcurrency = Math.min(this.systemSpecs.cpuCount, 4);
    
    switch (quality) {
      case 'low':
        return Math.min(this.systemSpecs.cpuCount, 8);
      case 'medium':
        return baseConcurrency;
      case 'high':
        return Math.max(1, Math.floor(baseConcurrency * 0.75));
      case 'max':
        return Math.max(1, Math.floor(baseConcurrency * 0.5));
      default:
        return baseConcurrency;
    }
  }

  /**
   * Downgrade quality level
   */
  private downgradeQuality(quality: string): RenderConfig['quality'] {
    switch (quality) {
      case 'max': return 'high';
      case 'high': return 'medium';
      case 'medium': return 'low';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  /**
   * Upgrade quality level
   */
  private upgradeQuality(quality: string): RenderConfig['quality'] {
    switch (quality) {
      case 'low': return 'medium';
      case 'medium': return 'high';
      case 'high': return 'max';
      case 'max': return 'max';
      default: return 'medium';
    }
  }

  /**
   * Get relevant historical data
   */
  private getRelevantHistoricalData(
    config: RenderConfig,
    allMetrics: PerformanceMetrics[]
  ): PerformanceMetrics[] {
    return allMetrics.filter(m => 
      m.quality === config.quality &&
      m.codec === 'h264' // Assuming H.264 codec
    );
  }

  /**
   * Analyze configuration for potential issues
   */
  private analyzeConfiguration(
    config: RenderConfig,
    optimizationConfig: OptimizationConfig
  ): string[] {
    const warnings = [];

    // Check concurrency vs system specs
    if (config.parallel && config.parallel > this.systemSpecs.cpuCount * 2) {
      warnings.push('Concurrency setting is much higher than CPU count. This may cause performance degradation.');
    }

    // Check memory requirements
    const estimatedMemoryPerProcess = this.estimateMemoryUsage(config);
    const totalEstimatedMemory = estimatedMemoryPerProcess * (config.parallel || 1);
    if (totalEstimatedMemory > this.systemSpecs.totalMemory * 0.8) {
      warnings.push('Estimated memory usage may exceed available system memory.');
    }

    // Check for conflicting settings
    if (optimizationConfig.targetRenderTime && config.quality === 'max') {
      warnings.push('Target render time may be difficult to achieve with max quality setting.');
    }

    return warnings;
  }

  /**
   * Calculate expected improvements
   */
  private calculateExpectedImprovements(
    originalConfig: RenderConfig,
    optimizedConfig: RenderConfig,
    historicalData: PerformanceMetrics[]
  ): { renderTime: number; memoryUsage: number; quality: number } {
    const renderTimeImprovement = this.estimateRenderTimeImprovement(
      originalConfig,
      optimizedConfig,
      historicalData
    );

    const memoryImprovement = this.estimateMemoryImprovement(
      originalConfig,
      optimizedConfig
    );

    const qualityScore = this.calculateQualityScore(optimizedConfig.quality);

    return {
      renderTime: renderTimeImprovement,
      memoryUsage: memoryImprovement,
      quality: qualityScore,
    };
  }

  /**
   * Estimate render time improvement
   */
  private estimateRenderTimeImprovement(
    original: RenderConfig,
    optimized: RenderConfig,
    historicalData: PerformanceMetrics[]
  ): number {
    let improvement = 0;

    // Quality impact
    if (original.quality !== optimized.quality) {
      const qualityImprovements = { low: 50, medium: 25, high: -15, max: -40 };
      improvement += qualityImprovements[optimized.quality as keyof typeof qualityImprovements] || 0;
    }

    // Concurrency impact
    const originalConcurrency = original.parallel || 1;
    const optimizedConcurrency = optimized.parallel || 1;
    if (optimizedConcurrency !== originalConcurrency) {
      const concurrencyImprovement = Math.min(40, (optimizedConcurrency - originalConcurrency) * 15);
      improvement += concurrencyImprovement;
    }

    return Math.max(-50, Math.min(70, improvement)); // Cap between -50% and 70%
  }

  /**
   * Estimate memory improvement
   */
  private estimateMemoryImprovement(
    original: RenderConfig,
    optimized: RenderConfig
  ): number {
    let improvement = 0;

    // Quality impact on memory
    const qualityMemoryImpact = { low: 30, medium: 15, high: -10, max: -25 };
    if (original.quality !== optimized.quality) {
      improvement += qualityMemoryImpact[optimized.quality as keyof typeof qualityMemoryImpact] || 0;
    }

    // Concurrency impact
    const originalConcurrency = original.parallel || 1;
    const optimizedConcurrency = optimized.parallel || 1;
    const concurrencyRatio = optimizedConcurrency / originalConcurrency;
    if (concurrencyRatio < 1) {
      improvement += (1 - concurrencyRatio) * 40;
    }

    return Math.max(-30, Math.min(50, improvement));
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(quality: string): number {
    const scores = { low: 40, medium: 65, high: 85, max: 100 };
    return scores[quality as keyof typeof scores] || 65;
  }

  /**
   * Generate test configurations for benchmarking
   */
  private generateTestConfigurations(baseConfig: RenderConfig): RenderConfig[] {
    const configurations = [];
    const qualities: RenderConfig['quality'][] = ['low', 'medium', 'high'];
    const concurrencies = [1, 2, 4, Math.min(8, this.systemSpecs.cpuCount)];

    for (const quality of qualities) {
      for (const concurrency of concurrencies) {
        configurations.push({
          ...baseConfig,
          quality,
          parallel: concurrency,
        });
      }
    }

    return configurations;
  }

  /**
   * Estimate performance metrics for a configuration
   */
  private estimatePerformanceMetrics(config: RenderConfig): PerformanceMetrics {
    // This is a simplified estimation - in reality, this would use ML models
    // or more sophisticated prediction algorithms
    const baseRenderTime = 60000; // 1 minute base
    const qualityMultipliers = { low: 0.5, medium: 1, high: 2, max: 4 };
    const concurrencyDivisor = Math.max(1, (config.parallel || 1) * 0.8);

    const renderTime = baseRenderTime * 
      (qualityMultipliers[config.quality as keyof typeof qualityMultipliers] || 1) / 
      concurrencyDivisor;

    return {
      timestamp: Date.now(),
      renderTime,
      framesPerSecond: 300 / (renderTime / 1000), // Assuming 300 frames
      bundleTime: 5000,
      cpuUsage: Math.min(95, (config.parallel || 1) * 25),
      memoryUsage: {
        heapUsed: 100 * 1024 * 1024 * (config.parallel || 1),
        heapTotal: 150 * 1024 * 1024 * (config.parallel || 1),
        external: 50 * 1024 * 1024,
        rss: 200 * 1024 * 1024 * (config.parallel || 1),
      },
      quality: config.quality,
      resolution: { width: 1920, height: 1080 },
      codec: 'h264',
      fileSize: 50 * 1024 * 1024, // 50MB
      compressionRatio: 0.8,
      concurrency: config.parallel || 1,
      totalFrames: 300,
      droppedFrames: 0,
    };
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    // Weighted scoring system
    const renderTimeScore = Math.max(0, 100 - (metrics.renderTime / 1000)); // Prefer faster renders
    const qualityScore = this.calculateQualityScore(metrics.quality);
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage.rss / (1024 * 1024 * 1024)) * 50); // Penalize high memory
    
    return renderTimeScore * 0.5 + qualityScore * 0.3 + memoryScore * 0.2;
  }

  /**
   * Get optimal codec settings
   */
  private getOptimalCodecSettings(
    quality: string,
    currentLoad: { cpuUsage: number; memoryUsage: number; diskUsage: number }
  ): Record<string, any> {
    const baseSettings = {
      low: { crf: 28, preset: 'fast' },
      medium: { crf: 23, preset: 'medium' },
      high: { crf: 18, preset: 'slow' },
      max: { crf: 15, preset: 'veryslow' },
    };

    let settings = baseSettings[quality as keyof typeof baseSettings] || baseSettings.medium;

    // Adjust for system load
    if (currentLoad.cpuUsage > 80) {
      settings.preset = 'ultrafast';
    } else if (currentLoad.cpuUsage > 60) {
      settings.preset = 'fast';
    }

    return settings;
  }

  /**
   * Determine caching strategy
   */
  private determineCachingStrategy(
    currentLoad: { cpuUsage: number; memoryUsage: number; diskUsage: number },
    stats: any
  ): string {
    if (currentLoad.diskUsage > 80) {
      return 'memory-only';
    } else if (currentLoad.memoryUsage > 80) {
      return 'disk-only';
    } else {
      return 'hybrid';
    }
  }

  /**
   * Estimate memory usage for configuration
   */
  private estimateMemoryUsage(config: RenderConfig): number {
    const baseMemory = 200 * 1024 * 1024; // 200MB base
    const qualityMultipliers = { low: 0.5, medium: 1, high: 1.5, max: 2 };
    return baseMemory * (qualityMultipliers[config.quality as keyof typeof qualityMultipliers] || 1);
  }
}