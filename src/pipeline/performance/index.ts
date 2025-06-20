/**
 * Performance Module - Central export for all performance optimization components
 */

export { PerformanceMonitor } from './PerformanceMonitor';
export { PerformanceProfiler } from './PerformanceProfiler';
export { PerformanceOptimizer } from './PerformanceOptimizer';
export { PerformanceDashboard } from './PerformanceDashboard';
export { OptimizedRenderPipeline } from './OptimizedRenderPipeline';
export { DataCache, FrameDataCache, ProcessedDataCache, CacheManager } from './DataCache';
export { PerformanceBenchmarkRunner } from './PerformanceBenchmarkRunner';

// Re-export types
export type {
  PerformanceMetrics,
  PerformanceProfile,
  PerformanceBenchmark,
  PerformanceAlert,
  ProfileSection,
  BottleneckAnalysis,
  PerformanceFlameGraph,
  OptimizationConfig,
  OptimizationResult,
  AdaptiveSettings,
  DashboardConfig,
  DashboardMetrics,
  RenderJob,
  CacheEntry,
  CacheStatistics,
  CacheConfig,
  OptimizedRenderConfig,
  RenderMetrics,
  OptimizationProfile,
  BenchmarkScenario,
  BenchmarkResult
} from './types';

/**
 * Factory function to create a complete performance optimization setup
 */
export function createPerformanceOptimizationSystem() {
  const monitor = new PerformanceMonitor();
  const profiler = new PerformanceProfiler(monitor);
  const optimizer = new PerformanceOptimizer(monitor);
  const dashboard = new PerformanceDashboard(monitor, profiler, optimizer);
  const cacheManager = new CacheManager();
  const pipeline = new OptimizedRenderPipeline();

  return {
    monitor,
    profiler,
    optimizer,
    dashboard,
    cacheManager,
    pipeline,
    
    // Helper methods
    async startMonitoring(port?: number) {
      monitor.startMonitoring();
      await dashboard.start();
      console.log(`Performance monitoring started${port ? ` on port ${port}` : ''}`);
    },
    
    async stopMonitoring() {
      monitor.stopMonitoring();
      await dashboard.stop();
      console.log('Performance monitoring stopped');
    },
    
    async runBenchmarks() {
      const runner = new PerformanceBenchmarkRunner();
      return runner.runAllBenchmarks();
    },
    
    getOptimizationSuggestions() {
      return optimizer.getOptimizationSuggestions();
    },
    
    getCacheStatistics() {
      return cacheManager.getAllStatistics();
    },
    
    clearAllCaches() {
      cacheManager.clearAll();
      console.log('All caches cleared');
    }
  };
}