import * as path from 'path';
import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { BarChartRaceConfig, ProcessedData } from '../types';
import { DataProcessor } from './dataProcessor';

export interface RenderPipelineOptions {
  verbose: boolean;
  onProgress?: (progress: number) => void;
}

export interface RenderOptions {
  config: BarChartRaceConfig;
  data: string;
  output?: string;
  quality?: 'low' | 'medium' | 'high' | 'max';
  parallel?: number;
  verbose?: boolean;
}

export class RenderPipeline {
  private options: RenderPipelineOptions;
  private dataProcessor: DataProcessor;
  
  constructor(options: RenderPipelineOptions) {
    this.options = options;
    this.dataProcessor = new DataProcessor();
  }
  
  async render(renderOptions: RenderOptions): Promise<string> {
    const { config, data: dataPath } = renderOptions;
    
    try {
      // Step 1: Process data
      if (this.options.verbose) {
        console.log('📊 Processing data...');
      }
      
      const processedData = await this.dataProcessor.processData(dataPath, config);
      
      // Step 2: Create Remotion bundle
      if (this.options.verbose) {
        console.log('📦 Creating Remotion bundle...');
      }
      
      const bundleLocation = await this.createBundle(config, processedData);
      
      // Step 3: Render video
      if (this.options.verbose) {
        console.log('🎬 Rendering video...');
      }
      
      const outputPath = await this.renderVideo(bundleLocation, config, renderOptions);
      
      return outputPath;
      
    } catch (error) {
      if (this.options.verbose) {
        console.error('🚨 Render pipeline failed:', error);
      }
      throw error;
    }
  }
  
  private async createBundle(config: BarChartRaceConfig, processedData: ProcessedData): Promise<string> {
    try {
      const bundleLocation = await bundle({
        entryPoint: path.resolve(__dirname, '../../index.ts'),
        webpackOverride: (webpackConfig) => {
          // Add any custom webpack configuration here
          return webpackConfig;
        },
        onProgress: this.options.verbose ? (progress) => {
          console.log(`Bundle progress: ${(progress * 100).toFixed(1)}%`);
        } : undefined
      });
      
      return bundleLocation;
      
    } catch (error) {
      throw new Error(`Bundle creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async renderVideo(
    bundleLocation: string,
    config: BarChartRaceConfig,
    renderOptions: RenderOptions
  ): Promise<string> {
    try {
      // Select composition
      const compositions = await selectComposition({
        serveUrl: bundleLocation,
        id: 'bar-chart-race',
        inputProps: {
          config,
          processedData: {} // Will be passed from data processor
        }
      });
      
      // Determine output path
      const outputPath = renderOptions.output || config.output.filename;
      const resolvedOutputPath = path.resolve(outputPath);
      
      // Configure codec based on format
      const codec = config.output.format === 'mp4' ? 'h264' : 'vp8';
      
      // Configure quality settings
      const qualitySettings = this.getQualitySettings(renderOptions.quality || config.output.quality);
      
      // Render the video
      await renderMedia({
        composition: compositions,
        serveUrl: bundleLocation,
        codec,
        outputLocation: resolvedOutputPath,
        inputProps: {
          config,
          processedData: {} // Will be populated by data processor
        },
        parallelism: renderOptions.parallel || 1,
        onProgress: (progress) => {
          if (this.options.onProgress) {
            this.options.onProgress(progress.progress);
          }
          
          if (this.options.verbose) {
            console.log(`Render progress: ${(progress.progress * 100).toFixed(1)}%`);
          }
        },
        onDownload: this.options.verbose ? (src) => {
          console.log(`Downloaded: ${src}`);
        } : undefined,
        ...qualitySettings
      });
      
      return resolvedOutputPath;
      
    } catch (error) {
      throw new Error(`Video rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private getQualitySettings(quality: 'low' | 'medium' | 'high' | 'max') {
    switch (quality) {
      case 'low':
        return {
          crf: 28,
          pixelFormat: 'yuv420p',
          proResProfile: undefined
        };
      case 'medium':
        return {
          crf: 23,
          pixelFormat: 'yuv420p',
          proResProfile: undefined
        };
      case 'high':
        return {
          crf: 18,
          pixelFormat: 'yuv420p',
          proResProfile: undefined
        };
      case 'max':
        return {
          crf: 15,
          pixelFormat: 'yuv444p',
          proResProfile: undefined
        };
      default:
        return {
          crf: 18,
          pixelFormat: 'yuv420p',
          proResProfile: undefined
        };
    }
  }
}