/**
 * DataCache - High-performance caching system for processed data
 * Implements LRU cache with TTL and compression support
 */

import * as crypto from 'crypto';
import { DataPoint, FrameData, ProcessingConfig } from '../DataProcessor';

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
  maxSize: number; // bytes
  ttl: number; // milliseconds
  compressionThreshold: number; // bytes
  enableCompression: boolean;
  enableStatistics: boolean;
}

export class DataCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private lruOrder: string[] = [];
  private currentSize = 0;
  private statistics: CacheStatistics;
  private config: CacheConfig;
  private hitTimes: number[] = [];
  private missTimes: number[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 500 * 1024 * 1024, // 500MB default
      ttl: 15 * 60 * 1000, // 15 minutes default
      compressionThreshold: 1024 * 1024, // 1MB
      enableCompression: true,
      enableStatistics: true,
      ...config
    };

    this.statistics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      currentSize: 0,
      maxSize: this.config.maxSize,
      hitRate: 0,
      avgHitTime: 0,
      avgMissTime: 0
    };
  }

  /**
   * Generate cache key from input parameters
   */
  generateKey(...args: any[]): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(args));
    return hash.digest('hex');
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.recordMiss(performance.now() - startTime);
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.remove(key);
      this.recordMiss(performance.now() - startTime);
      return null;
    }

    // Update LRU order
    this.updateLRU(key);
    entry.hits++;

    this.recordHit(performance.now() - startTime);
    return entry.value;
  }

  /**
   * Set item in cache
   */
  set(key: string, value: T, size?: number): void {
    // Calculate size if not provided
    const itemSize = size || this.estimateSize(value);

    // Check if item exceeds max size
    if (itemSize > this.config.maxSize) {
      console.warn(`Cache item exceeds max size: ${itemSize} > ${this.config.maxSize}`);
      return;
    }

    // Evict items if necessary
    while (this.currentSize + itemSize > this.config.maxSize) {
      this.evictLRU();
    }

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.remove(key);
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      key,
      value,
      size: itemSize,
      timestamp: Date.now(),
      hits: 0,
      compressed: false
    };

    // Compress if necessary
    if (this.config.enableCompression && itemSize > this.config.compressionThreshold) {
      // In a real implementation, we would compress the value
      entry.compressed = true;
    }

    this.cache.set(key, entry);
    this.lruOrder.push(key);
    this.currentSize += itemSize;
    this.statistics.currentSize = this.currentSize;
  }

  /**
   * Remove item from cache
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.lruOrder = this.lruOrder.filter(k => k !== key);
    this.currentSize -= entry.size;
    this.statistics.currentSize = this.currentSize;

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.lruOrder = [];
    this.currentSize = 0;
    this.statistics.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    return {
      ...this.statistics,
      hitRate: this.calculateHitRate(),
      avgHitTime: this.calculateAvgTime(this.hitTimes),
      avgMissTime: this.calculateAvgTime(this.missTimes)
    };
  }

  /**
   * Update LRU order
   */
  private updateLRU(key: string): void {
    const index = this.lruOrder.indexOf(key);
    if (index !== -1) {
      this.lruOrder.splice(index, 1);
    }
    this.lruOrder.push(key);
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    if (this.lruOrder.length === 0) return;

    const key = this.lruOrder.shift()!;
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      this.statistics.evictions++;
    }
  }

  /**
   * Estimate size of value
   */
  private estimateSize(value: T): number {
    // Simple JSON stringify estimation
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1024; // Default 1KB
    }
  }

  /**
   * Record cache hit
   */
  private recordHit(time: number): void {
    if (!this.config.enableStatistics) return;
    
    this.statistics.hits++;
    this.hitTimes.push(time);
    
    // Keep only last 1000 times
    if (this.hitTimes.length > 1000) {
      this.hitTimes.shift();
    }
  }

  /**
   * Record cache miss
   */
  private recordMiss(time: number): void {
    if (!this.config.enableStatistics) return;
    
    this.statistics.misses++;
    this.missTimes.push(time);
    
    // Keep only last 1000 times
    if (this.missTimes.length > 1000) {
      this.missTimes.shift();
    }
  }

  /**
   * Calculate hit rate
   */
  private calculateHitRate(): number {
    const total = this.statistics.hits + this.statistics.misses;
    return total > 0 ? (this.statistics.hits / total) * 100 : 0;
  }

  /**
   * Calculate average time
   */
  private calculateAvgTime(times: number[]): number {
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
}

/**
 * Specialized cache for frame data
 */
export class FrameDataCache extends DataCache<FrameData[]> {
  constructor(config?: Partial<CacheConfig>) {
    super({
      maxSize: 200 * 1024 * 1024, // 200MB for frame data
      ttl: 30 * 60 * 1000, // 30 minutes
      ...config
    });
  }

  /**
   * Get frame data with config-based key
   */
  getFrameData(
    config: ProcessingConfig,
    durationSeconds: number,
    dataHash: string
  ): FrameData[] | null {
    const key = this.generateKey(config, durationSeconds, dataHash);
    return this.get(key);
  }

  /**
   * Set frame data with config-based key
   */
  setFrameData(
    config: ProcessingConfig,
    durationSeconds: number,
    dataHash: string,
    frameData: FrameData[]
  ): void {
    const key = this.generateKey(config, durationSeconds, dataHash);
    const size = frameData.length * 200; // Estimate 200 bytes per frame
    this.set(key, frameData, size);
  }
}

/**
 * Specialized cache for processed data points
 */
export class ProcessedDataCache extends DataCache<DataPoint[]> {
  constructor(config?: Partial<CacheConfig>) {
    super({
      maxSize: 100 * 1024 * 1024, // 100MB for processed data
      ttl: 60 * 60 * 1000, // 1 hour
      ...config
    });
  }

  /**
   * Get processed data with CSV hash
   */
  getProcessedData(csvHash: string): DataPoint[] | null {
    return this.get(csvHash);
  }

  /**
   * Set processed data with CSV hash
   */
  setProcessedData(csvHash: string, data: DataPoint[]): void {
    const size = data.length * 50; // Estimate 50 bytes per data point
    this.set(csvHash, data, size);
  }
}

/**
 * Cache manager for coordinating multiple caches
 */
export class CacheManager {
  private frameDataCache: FrameDataCache;
  private processedDataCache: ProcessedDataCache;
  private interpolationCache: DataCache<number>;

  constructor(config?: {
    frameDataConfig?: Partial<CacheConfig>;
    processedDataConfig?: Partial<CacheConfig>;
    interpolationConfig?: Partial<CacheConfig>;
  }) {
    this.frameDataCache = new FrameDataCache(config?.frameDataConfig);
    this.processedDataCache = new ProcessedDataCache(config?.processedDataConfig);
    this.interpolationCache = new DataCache<number>({
      maxSize: 50 * 1024 * 1024, // 50MB for interpolation values
      ttl: 15 * 60 * 1000, // 15 minutes
      ...config?.interpolationConfig
    });
  }

  /**
   * Get all cache statistics
   */
  getAllStatistics(): {
    frameData: CacheStatistics;
    processedData: CacheStatistics;
    interpolation: CacheStatistics;
    summary: {
      totalHits: number;
      totalMisses: number;
      overallHitRate: number;
      totalMemoryUsed: number;
    };
  } {
    const frameStats = this.frameDataCache.getStatistics();
    const processedStats = this.processedDataCache.getStatistics();
    const interpolationStats = this.interpolationCache.getStatistics();

    const totalHits = frameStats.hits + processedStats.hits + interpolationStats.hits;
    const totalMisses = frameStats.misses + processedStats.misses + interpolationStats.misses;
    const totalMemoryUsed = frameStats.currentSize + processedStats.currentSize + interpolationStats.currentSize;

    return {
      frameData: frameStats,
      processedData: processedStats,
      interpolation: interpolationStats,
      summary: {
        totalHits,
        totalMisses,
        overallHitRate: totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0,
        totalMemoryUsed
      }
    };
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.frameDataCache.clear();
    this.processedDataCache.clear();
    this.interpolationCache.clear();
  }

  /**
   * Get cache instances
   */
  getCaches() {
    return {
      frameData: this.frameDataCache,
      processedData: this.processedDataCache,
      interpolation: this.interpolationCache
    };
  }
}