/**
 * PerformanceMonitor - Comprehensive performance monitoring and profiling system
 * for Bar Chart Race rendering pipeline
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PerformanceMetrics {
  timestamp: number;
  
  // Render performance
  renderTime: number;
  framesPerSecond: number;
  bundleTime: number;
  
  // System resources
  cpuUsage: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  
  // Quality metrics
  quality: string;
  resolution: { width: number; height: number };
  codec: string;
  
  // Output metrics
  fileSize: number;
  compressionRatio: number;
  
  // Process metrics
  concurrency: number;
  totalFrames: number;
  droppedFrames: number;
}

export interface PerformanceProfile {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  children: PerformanceProfile[];
  metadata: Record<string, any>;
}

export interface PerformanceBenchmark {
  testName: string;
  configuration: Record<string, any>;
  metrics: PerformanceMetrics;
  baseline?: PerformanceMetrics;
  regressionScore: number; // 0-1, where 1 is perfect performance
}

export interface PerformanceAlert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export class PerformanceMonitor extends EventEmitter {
  private profiles: Map<string, PerformanceProfile> = new Map();
  private activeProfiles: Map<string, PerformanceProfile> = new Map();
  private metrics: PerformanceMetrics[] = [];
  private benchmarks: PerformanceBenchmark[] = [];
  private alerts: PerformanceAlert[] = [];
  
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  
  // Performance thresholds
  private thresholds = {
    maxRenderTime: 300000, // 5 minutes
    minFramesPerSecond: 0.5,
    maxMemoryUsage: 2 * 1024 * 1024 * 1024, // 2GB
    maxCpuUsage: 90,
    maxFileSize: 500 * 1024 * 1024, // 500MB
  };

  constructor() {
    super();
    this.setupProcessListeners();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, intervalMs);

    this.emit('monitoring:started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emit('monitoring:stopped');
  }

  /**
   * Start a performance profile
   */
  startProfile(id: string, name: string, metadata: Record<string, any> = {}): void {
    const profile: PerformanceProfile = {
      id,
      name,
      startTime: performance.now(),
      children: [],
      metadata,
    };

    this.activeProfiles.set(id, profile);
    this.emit('profile:started', profile);
  }

  /**
   * End a performance profile
   */
  endProfile(id: string, metadata: Record<string, any> = {}): PerformanceProfile | null {
    const profile = this.activeProfiles.get(id);
    if (!profile) {
      return null;
    }

    profile.endTime = performance.now();
    profile.duration = profile.endTime - profile.startTime;
    profile.metadata = { ...profile.metadata, ...metadata };

    this.activeProfiles.delete(id);
    this.profiles.set(id, profile);

    this.emit('profile:ended', profile);
    return profile;
  }

  /**
   * Add a child profile to a parent
   */
  addChildProfile(parentId: string, childId: string, name: string, metadata: Record<string, any> = {}): void {
    const parent = this.activeProfiles.get(parentId);
    if (!parent) {
      return;
    }

    const child: PerformanceProfile = {
      id: childId,
      name,
      startTime: performance.now(),
      children: [],
      metadata,
    };

    parent.children.push(child);
    this.activeProfiles.set(childId, child);
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: Partial<PerformanceMetrics>): void {
    const fullMetrics: PerformanceMetrics = {
      timestamp: Date.now(),
      renderTime: 0,
      framesPerSecond: 0,
      bundleTime: 0,
      cpuUsage: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      },
      quality: 'medium',
      resolution: { width: 1920, height: 1080 },
      codec: 'h264',
      fileSize: 0,
      compressionRatio: 0,
      concurrency: 1,
      totalFrames: 0,
      droppedFrames: 0,
      ...metrics,
    };

    this.metrics.push(fullMetrics);
    this.checkThresholds(fullMetrics);
    this.emit('metrics:recorded', fullMetrics);
  }

  /**
   * Add performance benchmark
   */
  addBenchmark(benchmark: PerformanceBenchmark): void {
    this.benchmarks.push(benchmark);
    this.emit('benchmark:added', benchmark);
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    profiles: PerformanceProfile[];
    metrics: PerformanceMetrics[];
    benchmarks: PerformanceBenchmark[];
    alerts: PerformanceAlert[];
    summary: {
      averageRenderTime: number;
      averageFramesPerSecond: number;
      averageMemoryUsage: number;
      averageCpuUsage: number;
      totalRenders: number;
      failureRate: number;
    };
  } {
    const completedProfiles = Array.from(this.profiles.values());
    const renderProfiles = completedProfiles.filter(p => p.name.includes('render'));
    
    const summary = {
      averageRenderTime: this.calculateAverage(this.metrics.map(m => m.renderTime)),
      averageFramesPerSecond: this.calculateAverage(this.metrics.map(m => m.framesPerSecond)),
      averageMemoryUsage: this.calculateAverage(this.metrics.map(m => m.memoryUsage.rss)),
      averageCpuUsage: this.calculateAverage(this.metrics.map(m => m.cpuUsage)),
      totalRenders: renderProfiles.length,
      failureRate: this.calculateFailureRate(),
    };

    return {
      profiles: completedProfiles,
      metrics: this.metrics,
      benchmarks: this.benchmarks,
      alerts: this.alerts,
      summary,
    };
  }

  /**
   * Generate performance report
   */
  async generateReport(outputPath: string): Promise<void> {
    const stats = this.getStats();
    const report = {
      generatedAt: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        nodeVersion: process.version,
      },
      ...stats,
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    this.emit('report:generated', outputPath);
  }

  /**
   * Predict render time based on historical data
   */
  predictRenderTime(config: {
    quality: string;
    resolution: { width: number; height: number };
    totalFrames: number;
    concurrency: number;
  }): {
    estimated: number;
    confidence: number;
    factors: string[];
  } {
    const similarRenders = this.metrics.filter(m => 
      m.quality === config.quality &&
      Math.abs(m.resolution.width - config.resolution.width) <= 100 &&
      Math.abs(m.resolution.height - config.resolution.height) <= 100
    );

    if (similarRenders.length === 0) {
      return {
        estimated: this.estimateBasedOnQuality(config),
        confidence: 0.3,
        factors: ['No historical data available', 'Using quality-based estimation'],
      };
    }

    const avgTimePerFrame = this.calculateAverage(
      similarRenders.map(m => m.renderTime / m.totalFrames)
    );

    const concurrencyFactor = Math.max(0.3, 1 / config.concurrency);
    const estimated = avgTimePerFrame * config.totalFrames * concurrencyFactor;

    return {
      estimated,
      confidence: Math.min(0.9, similarRenders.length / 10),
      factors: [
        `Based on ${similarRenders.length} similar renders`,
        `Average ${avgTimePerFrame.toFixed(0)}ms per frame`,
        `Concurrency factor: ${concurrencyFactor.toFixed(2)}`,
      ],
    };
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): Array<{
    type: 'quality' | 'concurrency' | 'memory' | 'system';
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    expectedImprovement: string;
  }> {
    const suggestions = [];
    const stats = this.getStats();

    // Quality vs Speed suggestions
    if (stats.summary.averageRenderTime > 120000) { // 2 minutes
      suggestions.push({
        type: 'quality',
        priority: 'high',
        suggestion: 'Consider using lower quality settings for faster renders',
        expectedImprovement: '30-50% faster render times',
      });
    }

    // Memory optimization
    if (stats.summary.averageMemoryUsage > 1024 * 1024 * 1024) { // 1GB
      suggestions.push({
        type: 'memory',
        priority: 'high',
        suggestion: 'High memory usage detected. Consider reducing concurrency or frame buffer size',
        expectedImprovement: 'Reduced memory pressure and better stability',
      });
    }

    // Concurrency optimization
    const cpuCount = os.cpus().length;
    const avgConcurrency = this.calculateAverage(this.metrics.map(m => m.concurrency));
    if (avgConcurrency < cpuCount / 2) {
      suggestions.push({
        type: 'concurrency',
        priority: 'medium',
        suggestion: `Consider increasing concurrency to ${Math.floor(cpuCount * 0.8)} for better CPU utilization`,
        expectedImprovement: '20-40% faster render times',
      });
    }

    // System optimization
    if (stats.summary.averageCpuUsage < 50) {
      suggestions.push({
        type: 'system',
        priority: 'low',
        suggestion: 'CPU utilization is low. System may be I/O bound or underutilized',
        expectedImprovement: 'Investigate bottlenecks for potential improvements',
      });
    }

    return suggestions;
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    if (metrics.renderTime > this.thresholds.maxRenderTime) {
      alerts.push({
        level: 'warning',
        message: 'Render time exceeded threshold',
        metric: 'renderTime',
        value: metrics.renderTime,
        threshold: this.thresholds.maxRenderTime,
        timestamp: Date.now(),
      });
    }

    if (metrics.framesPerSecond < this.thresholds.minFramesPerSecond) {
      alerts.push({
        level: 'critical',
        message: 'Frame rate is critically low',
        metric: 'framesPerSecond',
        value: metrics.framesPerSecond,
        threshold: this.thresholds.minFramesPerSecond,
        timestamp: Date.now(),
      });
    }

    if (metrics.memoryUsage.rss > this.thresholds.maxMemoryUsage) {
      alerts.push({
        level: 'critical',
        message: 'Memory usage exceeded threshold',
        metric: 'memoryUsage',
        value: metrics.memoryUsage.rss,
        threshold: this.thresholds.maxMemoryUsage,
        timestamp: Date.now(),
      });
    }

    if (metrics.cpuUsage > this.thresholds.maxCpuUsage) {
      alerts.push({
        level: 'warning',
        message: 'CPU usage is very high',
        metric: 'cpuUsage',
        value: metrics.cpuUsage,
        threshold: this.thresholds.maxCpuUsage,
        timestamp: Date.now(),
      });
    }

    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.emit('alert', alert);
    });
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Simple CPU usage calculation (not perfectly accurate but good enough for monitoring)
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) / 1000 * 100;

    this.emit('system:metrics', {
      memory: memUsage,
      cpu: cpuPercent,
      timestamp: Date.now(),
    });
  }

  /**
   * Setup process listeners for cleanup
   */
  private setupProcessListeners(): void {
    const cleanup = () => {
      this.stopMonitoring();
      // End all active profiles
      this.activeProfiles.forEach((profile, id) => {
        this.endProfile(id);
      });
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  /**
   * Calculate average of array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate failure rate
   */
  private calculateFailureRate(): number {
    const totalRenders = this.profiles.size;
    if (totalRenders === 0) return 0;
    
    const failures = Array.from(this.profiles.values()).filter(
      p => p.metadata.failed === true
    ).length;
    
    return failures / totalRenders;
  }

  /**
   * Estimate render time based on quality when no historical data is available
   */
  private estimateBasedOnQuality(config: {
    quality: string;
    totalFrames: number;
    concurrency: number;
  }): number {
    const baseTimePerFrame = {
      low: 100,
      medium: 200,
      high: 400,
      max: 800,
    }[config.quality] || 200;

    const concurrencyFactor = Math.max(0.3, 1 / config.concurrency);
    return baseTimePerFrame * config.totalFrames * concurrencyFactor;
  }

  /**
   * Clear all stored data
   */
  clearData(): void {
    this.profiles.clear();
    this.activeProfiles.clear();
    this.metrics.length = 0;
    this.benchmarks.length = 0;
    this.alerts.length = 0;
    this.emit('data:cleared');
  }

  /**
   * Export data for external analysis
   */
  exportData(): {
    profiles: PerformanceProfile[];
    metrics: PerformanceMetrics[];
    benchmarks: PerformanceBenchmark[];
    alerts: PerformanceAlert[];
  } {
    return {
      profiles: Array.from(this.profiles.values()),
      metrics: [...this.metrics],
      benchmarks: [...this.benchmarks],
      alerts: [...this.alerts],
    };
  }
}