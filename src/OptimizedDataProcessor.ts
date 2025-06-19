/**
 * OptimizedDataProcessor - Performance-optimized data processing for Bar Chart Race
 * Implements aggressive caching, streaming, and memory-efficient algorithms
 */

import { DataPoint, FrameData, ProcessingConfig } from './DataProcessor';

export interface ProcessingCache {
  rawDataHash: string;
  processedData: DataPoint[];
  frameDataCache: Map<string, FrameData[]>;
  interpolationCache: Map<string, number>;
}

export interface OptimizedProcessingOptions {
  enableCaching: boolean;
  streamingMode: boolean;
  maxMemoryUsage: number; // bytes
  parallelProcessing: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
}

export class OptimizedDataProcessor {
  private config: ProcessingConfig;
  private options: OptimizedProcessingOptions;
  private cache: ProcessingCache;
  private processedData: DataPoint[] = [];
  private isInitialized = false;

  // Performance monitoring
  private performanceMetrics = {
    parseTime: 0,
    transformTime: 0,
    interpolationTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0,
  };

  constructor(config: ProcessingConfig, options: OptimizedProcessingOptions = {
    enableCaching: true,
    streamingMode: false,
    maxMemoryUsage: 1024 * 1024 * 1024, // 1GB default
    parallelProcessing: true,
    compressionLevel: 'medium'
  }) {
    this.config = config;
    this.options = options;
    this.cache = {
      rawDataHash: '',
      processedData: [],
      frameDataCache: new Map(),
      interpolationCache: new Map(),
    };
    this.isInitialized = true;
  }

  /**
   * Fast CSV parsing with streaming and memory optimization
   */
  public async parseCSVOptimized(csvContent: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Generate hash for caching
      const contentHash = this.generateHash(csvContent);
      
      // Check cache first
      if (this.options.enableCaching && this.cache.rawDataHash === contentHash) {
        this.processedData = [...this.cache.processedData];
        this.performanceMetrics.cacheHits++;
        console.log('📦 Using cached processed data');
        return;
      }

      this.performanceMetrics.cacheMisses++;
      
      if (this.options.streamingMode) {
        await this.parseCSVStreaming(csvContent);
      } else {
        await this.parseCSVMemoryOptimized(csvContent);
      }

      // Transform data immediately after parsing for better memory usage
      await this.transformDataOptimized();

      // Cache results
      if (this.options.enableCaching) {
        this.cache.rawDataHash = contentHash;
        this.cache.processedData = [...this.processedData];
      }

    } finally {
      this.performanceMetrics.parseTime = performance.now() - startTime;
    }
  }

  /**
   * Memory-optimized CSV parsing
   */
  private async parseCSVMemoryOptimized(csvContent: string): Promise<void> {
    const lines = csvContent.split('\n');
    const headers = this.parseCSVLineOptimized(lines[0]);
    
    // Validate headers once
    this.validateHeaders(headers);
    
    // Pre-allocate arrays for better performance
    const dateColumnIndex = headers.indexOf(this.config.dateColumn);
    const valueColumnIndices = this.config.valueColumns.map(col => headers.indexOf(col));
    
    this.processedData = [];
    
    // Batch process lines to manage memory
    const batchSize = Math.min(1000, Math.max(100, Math.floor(this.options.maxMemoryUsage / (1024 * 100))));
    
    for (let i = 1; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const batchData = this.processBatch(batch, headers, dateColumnIndex, valueColumnIndices);
      
      // Merge batch results
      this.processedData.push(...batchData);
      
      // Check memory usage
      if (i % (batchSize * 10) === 0) {
        await this.checkMemoryUsage();
      }
    }
  }

  /**
   * Streaming CSV parser for very large files
   */
  private async parseCSVStreaming(csvContent: string): Promise<void> {
    const stream = this.createLineStream(csvContent);
    let isFirstLine = true;
    let headers: string[] = [];
    let dateColumnIndex = -1;
    let valueColumnIndices: number[] = [];
    
    this.processedData = [];
    
    for await (const line of stream) {
      if (isFirstLine) {
        headers = this.parseCSVLineOptimized(line);
        this.validateHeaders(headers);
        dateColumnIndex = headers.indexOf(this.config.dateColumn);
        valueColumnIndices = this.config.valueColumns.map(col => headers.indexOf(col));
        isFirstLine = false;
        continue;
      }

      const lineData = this.processLineOptimized(line, headers, dateColumnIndex, valueColumnIndices);
      if (lineData.length > 0) {
        this.processedData.push(...lineData);
      }
      
      // Yield control periodically for non-blocking processing
      if (this.processedData.length % 1000 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
  }

  /**
   * Process a batch of lines efficiently
   */
  private processBatch(
    lines: string[], 
    headers: string[], 
    dateColumnIndex: number, 
    valueColumnIndices: number[]
  ): DataPoint[] {
    const batchResults: DataPoint[] = [];
    
    for (const line of lines) {
      if (line.trim().length === 0) continue;
      
      const lineData = this.processLineOptimized(line, headers, dateColumnIndex, valueColumnIndices);
      batchResults.push(...lineData);
    }
    
    return batchResults;
  }

  /**
   * Optimized single line processing
   */
  private processLineOptimized(
    line: string, 
    headers: string[], 
    dateColumnIndex: number, 
    valueColumnIndices: number[]
  ): DataPoint[] {
    try {
      const values = this.parseCSVLineOptimized(line);
      if (values.length !== headers.length) return [];

      const dateStr = values[dateColumnIndex];
      if (!dateStr || dateStr.trim() === '') return [];

      const date = this.parseDateOptimized(dateStr);
      const results: DataPoint[] = [];

      for (let i = 0; i < valueColumnIndices.length; i++) {
        const valueIndex = valueColumnIndices[i];
        const valueStr = values[valueIndex];
        const category = this.config.valueColumns[i];
        
        const value = valueStr ? parseFloat(valueStr) : 0;
        const finalValue = isNaN(value) ? 0 : value;
        
        results.push({
          category,
          value: finalValue,
          date,
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Optimized CSV line parsing with reduced allocations
   */
  private parseCSVLineOptimized(line: string): string[] {
    // Fast path for simple lines (no quotes)
    if (!line.includes('"')) {
      return line.split(',').map(s => s.trim());
    }
    
    // Full parsing for complex lines
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Optimized date parsing with caching
   */
  private parseDateOptimized(dateString: string): Date {
    const cacheKey = `date_${dateString}`;
    
    if (this.options.enableCaching && this.cache.interpolationCache.has(cacheKey)) {
      return new Date(this.cache.interpolationCache.get(cacheKey)!);
    }
    
    const date = this.parseDateFast(dateString);
    
    if (this.options.enableCaching) {
      this.cache.interpolationCache.set(cacheKey, date.getTime());
    }
    
    return date;
  }

  /**
   * Fast date parsing without regex
   */
  private parseDateFast(dateString: string): Date {
    const clean = dateString.trim();
    
    switch (this.config.dateFormat) {
      case 'YYYY-MM-DD': {
        const [year, month, day] = clean.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      case 'YYYY-MM': {
        const [year, month] = clean.split('-').map(Number);
        return new Date(year, month - 1, 1);
      }
      case 'YYYY': {
        const year = Number(clean);
        return new Date(year, 0, 1);
      }
      case 'MM/DD/YYYY': {
        const [month, day, year] = clean.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      case 'DD/MM/YYYY': {
        const [day, month, year] = clean.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      default:
        throw new Error(`Unsupported date format: ${this.config.dateFormat}`);
    }
  }

  /**
   * Optimized data transformation
   */
  private async transformDataOptimized(): Promise<void> {
    const startTime = performance.now();
    
    try {
      if (this.options.parallelProcessing && this.processedData.length > 10000) {
        await this.transformDataParallel();
      } else {
        this.transformDataSequential();
      }
    } finally {
      this.performanceMetrics.transformTime = performance.now() - startTime;
    }
  }

  /**
   * Sequential data transformation
   */
  private transformDataSequential(): void {
    // Sort by date for better cache locality
    this.processedData.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Parallel data transformation (simplified for this implementation)
   */
  private async transformDataParallel(): Promise<void> {
    // In a real implementation, this would use worker threads
    // For now, we'll simulate with batching
    const batchSize = Math.ceil(this.processedData.length / 4);
    const batches = [];
    
    for (let i = 0; i < this.processedData.length; i += batchSize) {
      batches.push(this.processedData.slice(i, i + batchSize));
    }
    
    // Process batches
    const results = await Promise.all(
      batches.map(async (batch) => {
        batch.sort((a, b) => a.date.getTime() - b.date.getTime());
        return batch;
      })
    );
    
    // Merge results
    this.processedData = results.flat();
  }

  /**
   * Optimized frame data generation with caching
   */
  public async generateFrameDataOptimized(durationSeconds: number): Promise<FrameData[]> {
    const startTime = performance.now();
    
    try {
      const cacheKey = `frames_${durationSeconds}_${this.config.fps}_${this.options.compressionLevel}`;
      
      if (this.options.enableCaching && this.cache.frameDataCache.has(cacheKey)) {
        this.performanceMetrics.cacheHits++;
        return this.cache.frameDataCache.get(cacheKey)!;
      }

      this.performanceMetrics.cacheMisses++;
      
      const frameData = await this.generateFramesOptimized(durationSeconds);
      
      if (this.options.enableCaching) {
        this.cache.frameDataCache.set(cacheKey, frameData);
      }
      
      return frameData;
      
    } finally {
      this.performanceMetrics.interpolationTime = performance.now() - startTime;
    }
  }

  /**
   * Generate frames with optimized interpolation
   */
  private async generateFramesOptimized(durationSeconds: number): Promise<FrameData[]> {
    const totalFrames = Math.ceil(durationSeconds * this.config.fps);
    const startDate = this.getMinDate();
    const endDate = this.getMaxDate();
    const timeSpan = endDate.getTime() - startDate.getTime();
    
    const frameData: FrameData[] = [];
    
    // Pre-calculate category data maps for faster lookups
    const categoryMaps = this.buildCategoryMaps();
    
    // Generate frames in batches
    const batchSize = Math.min(100, totalFrames);
    
    for (let batchStart = 0; batchStart < totalFrames; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalFrames);
      const batchFrames = await this.generateFrameBatch(
        batchStart, batchEnd, totalFrames, startDate, timeSpan, categoryMaps
      );
      
      frameData.push(...batchFrames);
      
      // Yield control
      if (batchStart % (batchSize * 10) === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    return frameData;
  }

  /**
   * Generate a batch of frames
   */
  private async generateFrameBatch(
    startFrame: number,
    endFrame: number,
    totalFrames: number,
    startDate: Date,
    timeSpan: number,
    categoryMaps: Map<string, DataPoint[]>
  ): Promise<FrameData[]> {
    const frames: FrameData[] = [];
    
    for (let frame = startFrame; frame < endFrame; frame++) {
      const progress = totalFrames > 1 ? frame / (totalFrames - 1) : 0;
      const currentTime = startDate.getTime() + (progress * timeSpan);
      const currentDate = new Date(currentTime);
      
      const frameDataPoints = this.interpolateDataAtTimeOptimized(currentDate, categoryMaps);
      const rankedData = this.calculateRankingsOptimized(frameDataPoints);
      const topData = rankedData.slice(0, this.config.topN || 10);
      
      frames.push({
        frame,
        timestamp: currentTime,
        date: currentDate,
        data: topData,
      });
    }
    
    return frames;
  }

  /**
   * Build category data maps for faster lookups
   */
  private buildCategoryMaps(): Map<string, DataPoint[]> {
    const categoryMaps = new Map<string, DataPoint[]>();
    
    for (const dataPoint of this.processedData) {
      if (!categoryMaps.has(dataPoint.category)) {
        categoryMaps.set(dataPoint.category, []);
      }
      categoryMaps.get(dataPoint.category)!.push(dataPoint);
    }
    
    // Sort each category's data by date
    Array.from(categoryMaps.values()).forEach(data => {
      data.sort((a, b) => a.date.getTime() - b.date.getTime());
    });
    
    return categoryMaps;
  }

  /**
   * Optimized interpolation with caching
   */
  private interpolateDataAtTimeOptimized(
    targetDate: Date,
    categoryMaps: Map<string, DataPoint[]>
  ): DataPoint[] {
    const targetTime = targetDate.getTime();
    const result: DataPoint[] = [];
    
    for (const [category, data] of Array.from(categoryMaps.entries())) {
      const cacheKey = `interp_${category}_${targetTime}`;
      
      let value: number;
      if (this.options.enableCaching && this.cache.interpolationCache.has(cacheKey)) {
        value = this.cache.interpolationCache.get(cacheKey)!;
        this.performanceMetrics.cacheHits++;
      } else {
        value = this.interpolateValueOptimized(data, targetTime);
        if (this.options.enableCaching) {
          this.cache.interpolationCache.set(cacheKey, value);
        }
        this.performanceMetrics.cacheMisses++;
      }
      
      result.push({
        category,
        value,
        date: targetDate,
      });
    }
    
    return result;
  }

  /**
   * Optimized value interpolation using binary search
   */
  private interpolateValueOptimized(data: DataPoint[], targetTime: number): number {
    if (data.length === 0) return 0;
    if (data.length === 1) return data[0].value;
    
    // Binary search for surrounding points
    let left = 0;
    let right = data.length - 1;
    
    // Handle edge cases
    if (targetTime <= data[0].date.getTime()) return data[0].value;
    if (targetTime >= data[right].date.getTime()) return data[right].value;
    
    // Binary search
    while (left < right - 1) {
      const mid = Math.floor((left + right) / 2);
      const midTime = data[mid].date.getTime();
      
      if (midTime === targetTime) return data[mid].value;
      if (midTime < targetTime) left = mid;
      else right = mid;
    }
    
    const beforePoint = data[left];
    const afterPoint = data[right];
    
    // Linear interpolation (fastest method)
    const beforeTime = beforePoint.date.getTime();
    const afterTime = afterPoint.date.getTime();
    const ratio = (targetTime - beforeTime) / (afterTime - beforeTime);
    
    return beforePoint.value + (afterPoint.value - beforePoint.value) * ratio;
  }

  /**
   * Optimized ranking calculation
   */
  private calculateRankingsOptimized(data: DataPoint[]): DataPoint[] {
    // Use a single pass with insertion sort for small arrays (typical case)
    if (data.length <= 50) {
      const sorted = [...data];
      
      // Insertion sort (fast for small arrays)
      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        let j = i - 1;
        
        while (j >= 0 && (sorted[j].value < current.value || 
               (sorted[j].value === current.value && sorted[j].category > current.category))) {
          sorted[j + 1] = sorted[j];
          j--;
        }
        sorted[j + 1] = current;
      }
      
      // Assign ranks
      let currentRank = 1;
      for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i].value !== sorted[i - 1].value) {
          currentRank = i + 1;
        }
        sorted[i].rank = currentRank;
      }
      
      return sorted;
    } else {
      // Use native sort for larger arrays
      return data
        .slice()
        .sort((a, b) => b.value - a.value || a.category.localeCompare(b.category))
        .map((item, index, arr) => ({
          ...item,
          rank: index === 0 || item.value !== arr[index - 1].value ? index + 1 : arr[index - 1].rank!
        }));
    }
  }

  /**
   * Memory usage check
   */
  private async checkMemoryUsage(): Promise<void> {
    const usage = process.memoryUsage();
    this.performanceMetrics.memoryUsage = usage.rss;
    
    if (usage.rss > this.options.maxMemoryUsage) {
      console.warn(`Memory usage (${Math.floor(usage.rss / 1024 / 1024)}MB) exceeds limit (${Math.floor(this.options.maxMemoryUsage / 1024 / 1024)}MB)`);
      
      // Clear some caches
      if (this.cache.interpolationCache.size > 1000) {
        this.cache.interpolationCache.clear();
      }
    }
  }

  /**
   * Generate hash for content
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Create line stream generator
   */
  private async* createLineStream(content: string): AsyncGenerator<string> {
    const lines = content.split('\n');
    for (const line of lines) {
      yield line;
    }
  }

  /**
   * Validate headers
   */
  private validateHeaders(headers: string[]): void {
    if (!headers.includes(this.config.dateColumn)) {
      throw new Error(`Date column '${this.config.dateColumn}' not found`);
    }
    
    const missingColumns = this.config.valueColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Value columns not found: ${missingColumns.join(', ')}`);
    }
  }

  /**
   * Get date range
   */
  private getMinDate(): Date {
    return new Date(Math.min(...this.processedData.map(d => d.date.getTime())));
  }

  private getMaxDate(): Date {
    return new Date(Math.max(...this.processedData.map(d => d.date.getTime())));
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100,
      totalProcessingTime: this.performanceMetrics.parseTime + this.performanceMetrics.transformTime + this.performanceMetrics.interpolationTime,
    };
  }

  /**
   * Clear caches to free memory
   */
  public clearCaches(): void {
    this.cache.frameDataCache.clear();
    this.cache.interpolationCache.clear();
    console.log('🧹 Caches cleared');
  }

  /**
   * Get processed data
   */
  public getProcessedData(): DataPoint[] {
    return this.processedData;
  }
}