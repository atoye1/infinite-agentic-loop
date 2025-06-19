/**
 * Type definitions for the performance optimization system
 */

import { RenderConfig } from '../RenderPipeline';
import { Composition } from '@remotion/renderer';

// PerformanceMonitor types
export interface PerformanceMetrics {
  timestamp: number;
  renderTime: number;
  framesPerSecond: number;
  bundleTime: number;
  cpuUsage: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  quality: string;
  resolution: { width: number; height: number };
  codec: string;
  fileSize: number;
  compressionRatio: number;
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
  metadata: Record<string, unknown>;
}

export interface PerformanceBenchmark {
  testName: string;
  configuration: Record<string, unknown>;
  metrics: PerformanceMetrics;
  baseline?: PerformanceMetrics;
  regressionScore: number;
}

export interface PerformanceAlert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// PerformanceProfiler types
export interface ProfileSection {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  children: ProfileSection[];
  metadata: Record<string, unknown>;
}

export interface BottleneckAnalysis {
  section: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  percentage: number;
  suggestions: string[];
}

export interface PerformanceFlameGraph {
  name: string;
  value: number;
  children: PerformanceFlameGraph[];
}

// PerformanceOptimizer types
export interface OptimizationConfig {
  targetRenderTime?: number;
  targetQuality?: 'auto' | 'low' | 'medium' | 'high' | 'max';
  maxMemoryUsage?: number;
  preferSpeed?: boolean;
  allowQualityAuto?: boolean;
  concurrencyMode?: 'auto' | 'conservative' | 'aggressive';
  enableCaching?: boolean;
}

export interface OptimizationResult {
  originalConfig: RenderConfig;
  optimizedConfig: RenderConfig;
  expectedImprovements: {
    renderTime: number;
    memoryUsage: number;
    quality: number;
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
  codecSettings: Record<string, unknown>;
  memoryOptimizations: boolean;
  cachingStrategy: string;
}

// PerformanceDashboard types
export interface DashboardConfig {
  port?: number;
  updateInterval?: number;
  historyLimit?: number;
  enableWebInterface?: boolean;
  enableWebSocket?: boolean;
}

export interface DashboardMetrics {
  timestamp: number;
  system: {
    cpu: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  rendering: {
    activeRenders: number;
    queuedRenders: number;
    completedRenders: number;
    failedRenders: number;
    averageRenderTime: number;
    averageFrameRate: number;
  };
  performance: {
    bottlenecks: number;
    criticalAlerts: number;
    optimizationOpportunities: number;
    overallScore: number;
  };
}

export interface RenderJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  config: RenderConfig;
  startTime?: number;
  endTime?: number;
  progress: number;
  metrics?: PerformanceMetrics;
  error?: string;
}

// DataCache types
export interface CacheEntry<T> {
  key: string;
  value: T;
  size: number;
  timestamp: number;
  hits: number;
  compressed?: boolean;
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  maxSize: number;
  hitRate: number;
  avgHitTime: number;
  avgMissTime: number;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number;
  compressionThreshold: number;
  enableCompression: boolean;
  enableStatistics: boolean;
}

// OptimizedRenderPipeline types
export interface OptimizedRenderConfig extends RenderConfig {
  enableMemoryOptimization?: boolean;
  enableConcurrencyOptimization?: boolean;
  enableProgressiveRendering?: boolean;
  chunkSize?: number;
  maxConcurrentFrames?: number;
  bufferSize?: number;
}

export interface RenderMetrics {
  startTime: number;
  endTime?: number;
  bundleTime?: number;
  compositionLoadTime?: number;
  renderStartTime?: number;
  frameRenderTimes: number[];
  memorySnapshots: Array<{
    timestamp: number;
    heapUsed: number;
    external: number;
    rss: number;
  }>;
  cpuSnapshots: Array<{
    timestamp: number;
    usage: number;
  }>;
}

export interface OptimizationProfile {
  name: string;
  concurrency: number;
  chunkSize: number;
  bufferSize: number;
  qualitySettings: {
    crf: number;
    pixelFormat: 'yuv420p' | 'yuv422p' | 'yuv444p';
    codec: 'h264' | 'h265' | 'vp8' | 'vp9';
    preset?: string;
  };
}

// PerformanceBenchmarkRunner types
export interface BenchmarkScenario {
  name: string;
  description: string;
  videoDuration: number;
  dataPoints: number;
  categories: number;
  fps: number;
  quality: 'low' | 'medium' | 'high' | 'max';
  expectedMaxRenderTime?: number;
  expectedMaxMemory?: number;
}

export interface BenchmarkResult {
  scenario: BenchmarkScenario;
  passed: boolean;
  metrics: {
    dataProcessingTime: number;
    renderTime: number;
    totalTime: number;
    peakMemoryUsage: number;
    avgCpuUsage: number;
    cacheHitRate: number;
    renderSpeedRatio: number;
  };
  optimizations: string[];
  issues: string[];
  suggestions: string[];
}