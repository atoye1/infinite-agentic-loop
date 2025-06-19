import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";
import { Config } from "@remotion/cli/config";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

export interface RenderConfig {
  compositionId: string;
  outputPath: string;
  format: 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'max';
  parallel?: number;
  props?: Record<string, any>;
}

export interface RenderProgress {
  frame: number;
  totalFrames: number;
  percentage: number;
  stage: 'bundling' | 'rendering' | 'cleanup' | 'complete';
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

export interface RenderResult {
  success: boolean;
  outputPath?: string;
  duration?: number;
  fileSize?: number;
  error?: Error;
}

export class RenderPipeline {
  private bundlePath?: string;
  private startTime?: number;
  private onProgress?: (progress: RenderProgress) => void;

  constructor(onProgress?: (progress: RenderProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Get quality settings for different quality levels
   */
  private getQualitySettings(quality: RenderConfig['quality']) {
    switch (quality) {
      case 'low':
        return {
          crf: 28,
          pixelFormat: 'yuv420p' as const,
          codec: 'h264' as const,
          proResProfile: undefined,
          x264Preset: 'fast' as const,
        };
      case 'medium':
        return {
          crf: 23,
          pixelFormat: 'yuv420p' as const,
          codec: 'h264' as const,
          proResProfile: undefined,
          x264Preset: 'medium' as const,
        };
      case 'high':
        return {
          crf: 18,
          pixelFormat: 'yuv420p' as const,
          codec: 'h264' as const,
          proResProfile: undefined,
          x264Preset: 'slow' as const,
        };
      case 'max':
        return {
          crf: 15,
          pixelFormat: 'yuv420p' as const,
          codec: 'h264' as const,
          proResProfile: undefined,
          x264Preset: 'veryslow' as const,
        };
      default:
        return this.getQualitySettings('medium');
    }
  }

  /**
   * Bundle the Remotion project
   */
  private async bundleProject(): Promise<string> {
    this.reportProgress({
      frame: 0,
      totalFrames: 0,
      percentage: 0,
      stage: 'bundling',
      timeElapsed: this.getElapsedTime(),
    });

    try {
      const bundleLocation = await bundle({
        entryPoint: path.resolve(process.cwd(), 'src/index.ts'),
        onProgress: (progress) => {
          this.reportProgress({
            frame: 0,
            totalFrames: 0,
            percentage: Math.round(progress * 100),
            stage: 'bundling',
            timeElapsed: this.getElapsedTime(),
          });
        },
        webpackOverride: (config) => {
          // Apply existing webpack config from remotion.config.ts
          return config;
        },
      });

      this.bundlePath = bundleLocation;
      return bundleLocation;
    } catch (error) {
      throw new Error(`Failed to bundle project: ${error}`);
    }
  }

  /**
   * Get available compositions from the bundle
   */
  async getAvailableCompositions(): Promise<any[]> {
    if (!this.bundlePath) {
      await this.bundleProject();
    }

    try {
      const compositions = await getCompositions(this.bundlePath!, {
        inputProps: {},
      });
      return compositions;
    } catch (error) {
      throw new Error(`Failed to get compositions: ${error}`);
    }
  }

  /**
   * Render a single composition
   */
  async render(config: RenderConfig): Promise<RenderResult> {
    this.startTime = Date.now();
    
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(config.outputPath);
      if (!existsSync(outputDir)) {
        await fs.mkdir(outputDir, { recursive: true });
      }

      // Bundle the project if not already done
      if (!this.bundlePath) {
        await this.bundleProject();
      }

      // Get compositions and find the target composition
      const compositions = await this.getAvailableCompositions();
      const composition = compositions.find(c => c.id === config.compositionId);
      
      if (!composition) {
        throw new Error(`Composition '${config.compositionId}' not found. Available: ${compositions.map(c => c.id).join(', ')}`);
      }

      // Get quality settings
      const qualitySettings = this.getQualitySettings(config.quality);

      // Start rendering
      this.reportProgress({
        frame: 0,
        totalFrames: composition.durationInFrames,
        percentage: 0,
        stage: 'rendering',
        timeElapsed: this.getElapsedTime(),
      });

      const startRenderTime = Date.now();
      
      await renderMedia({
        composition,
        serveUrl: this.bundlePath!,
        codec: config.format === 'webm' ? 'vp8' : qualitySettings.codec,
        outputLocation: config.outputPath,
        inputProps: config.props || {},
        concurrency: config.parallel || null,
        onProgress: ({ renderedFrames, totalFrames }) => {
          const percentage = Math.round((renderedFrames / totalFrames) * 100);
          const timeElapsed = this.getElapsedTime();
          const framesPerSecond = renderedFrames / (timeElapsed / 1000);
          const remainingFrames = totalFrames - renderedFrames;
          const estimatedTimeRemaining = remainingFrames > 0 && framesPerSecond > 0 
            ? (remainingFrames / framesPerSecond) * 1000 
            : undefined;

          this.reportProgress({
            frame: renderedFrames,
            totalFrames,
            percentage,
            stage: 'rendering',
            timeElapsed,
            estimatedTimeRemaining,
          });
        },
        ...qualitySettings,
      });

      const renderDuration = Date.now() - startRenderTime;

      // Get file size
      let fileSize: number | undefined;
      try {
        const stats = await fs.stat(config.outputPath);
        fileSize = stats.size;
      } catch (error) {
        // File size not critical, continue
      }

      // Report completion
      this.reportProgress({
        frame: composition.durationInFrames,
        totalFrames: composition.durationInFrames,
        percentage: 100,
        stage: 'complete',
        timeElapsed: this.getElapsedTime(),
      });

      return {
        success: true,
        outputPath: config.outputPath,
        duration: renderDuration,
        fileSize,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Render multiple configurations in parallel
   */
  async renderBatch(configs: RenderConfig[]): Promise<RenderResult[]> {
    const results: RenderResult[] = [];
    
    // Bundle once for all renders
    if (!this.bundlePath) {
      await this.bundleProject();
    }

    // Process renders with controlled concurrency
    const maxConcurrency = 3; // Limit parallel renders to prevent resource exhaustion
    const chunks = this.chunkArray(configs, maxConcurrency);
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async (config) => {
          const pipeline = new RenderPipeline(this.onProgress);
          pipeline.bundlePath = this.bundlePath; // Share bundle
          return pipeline.render(config);
        })
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Create output filename with timestamp and quality
   */
  static createOutputPath(
    outputDir: string, 
    compositionId: string, 
    format: RenderConfig['format'], 
    quality: RenderConfig['quality']
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${compositionId}_${quality}_${timestamp}.${format}`;
    return path.join(outputDir, filename);
  }

  /**
   * Validate render configuration
   */
  static validateConfig(config: RenderConfig): string[] {
    const errors: string[] = [];

    if (!config.compositionId) {
      errors.push('compositionId is required');
    }

    if (!config.outputPath) {
      errors.push('outputPath is required');
    }

    if (!['mp4', 'webm'].includes(config.format)) {
      errors.push('format must be mp4 or webm');
    }

    if (!['low', 'medium', 'high', 'max'].includes(config.quality)) {
      errors.push('quality must be low, medium, high, or max');
    }

    if (config.parallel !== undefined && (config.parallel < 1 || config.parallel > 16)) {
      errors.push('parallel must be between 1 and 16');
    }

    return errors;
  }

  /**
   * Get estimated file size based on duration and quality
   */
  static estimateFileSize(
    durationInFrames: number, 
    fps: number, 
    quality: RenderConfig['quality']
  ): number {
    const durationInSeconds = durationInFrames / fps;
    const baseSizePerSecond = 1024 * 1024; // 1MB per second baseline

    const qualityMultipliers = {
      low: 0.5,
      medium: 1.0,
      high: 2.0,
      max: 4.0,
    };

    return Math.round(durationInSeconds * baseSizePerSecond * qualityMultipliers[quality]);
  }

  private reportProgress(progress: RenderProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  private getElapsedTime(): number {
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async cleanup(): Promise<void> {
    this.reportProgress({
      frame: 0,
      totalFrames: 0,
      percentage: 100,
      stage: 'cleanup',
      timeElapsed: this.getElapsedTime(),
    });

    // Cleanup is handled automatically by Remotion
    // Bundle files are temporary and cleaned up by the bundler
  }
}