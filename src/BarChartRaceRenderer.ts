import { RenderPipeline, RenderConfig, RenderResult } from './RenderPipeline';
import { OutputManager } from './OutputManager';
import { BatchConfigBuilder, ExampleConfigs } from './BatchConfig';

/**
 * Main class that orchestrates the entire Bar Chart Race rendering process
 * Integrates RenderPipeline, OutputManager, and BatchConfig for complete functionality
 */
export class BarChartRaceRenderer {
  private pipeline: RenderPipeline;
  private outputManager: OutputManager;
  private onProgress?: (progress: any) => void;

  constructor(outputDir: string = './output', onProgress?: (progress: any) => void) {
    this.onProgress = onProgress;
    this.pipeline = new RenderPipeline(onProgress);
    this.outputManager = new OutputManager(outputDir);
  }

  /**
   * Initialize the renderer
   */
  async initialize(projectName: string = 'Bar Chart Race'): Promise<void> {
    await this.outputManager.initialize(projectName);
  }

  /**
   * Get available compositions
   */
  async getCompositions(): Promise<any[]> {
    return await this.pipeline.getAvailableCompositions();
  }

  /**
   * Render a single composition with full tracking
   */
  async renderComposition(config: {
    compositionId: string;
    format?: 'mp4' | 'webm';
    quality?: 'low' | 'medium' | 'high' | 'max';
    outputPath?: string;
    props?: Record<string, any>;
    category?: 'production' | 'test' | 'draft';
  }): Promise<RenderResult> {
    const startTime = Date.now();
    
    // Create render configuration
    const renderConfig: RenderConfig = {
      compositionId: config.compositionId,
      outputPath: config.outputPath || this.outputManager.getSuggestedPath(
        config.compositionId,
        config.format || 'mp4',
        config.quality || 'medium',
        config.category || 'production'
      ),
      format: config.format || 'mp4',
      quality: config.quality || 'medium',
      props: config.props,
    };

    // Validate configuration
    const errors = RenderPipeline.validateConfig(renderConfig);
    if (errors.length > 0) {
      return {
        success: false,
        error: new Error(`Configuration errors: ${errors.join(', ')}`),
      };
    }

    // Perform render
    const result = await this.pipeline.render(renderConfig);
    const renderTime = Date.now() - startTime;

    // Record result in output manager
    await this.outputManager.recordRender(renderConfig, result, renderTime);

    return result;
  }

  /**
   * Render quality comparison
   */
  async renderQualityComparison(compositionId: string, props?: Record<string, any>): Promise<RenderResult[]> {
    const batchConfig = ExampleConfigs.qualityComparison(compositionId);
    
    // Update props for all renders
    if (props) {
      batchConfig.renders.forEach(render => {
        render.props = { ...render.props, ...props };
      });
    }

    return await this.renderBatch(batchConfig.renders);
  }

  /**
   * Render format comparison
   */
  async renderFormatComparison(
    compositionId: string, 
    quality: 'medium' | 'high' = 'medium',
    props?: Record<string, any>
  ): Promise<RenderResult[]> {
    const batchConfig = ExampleConfigs.formatComparison(compositionId, quality);
    
    // Update props for all renders
    if (props) {
      batchConfig.renders.forEach(render => {
        render.props = { ...render.props, ...props };
      });
    }

    return await this.renderBatch(batchConfig.renders);
  }

  /**
   * Render production versions
   */
  async renderProduction(compositionId: string, props?: Record<string, any>): Promise<RenderResult[]> {
    const batchConfig = ExampleConfigs.production(compositionId, props);
    return await this.renderBatch(batchConfig.renders);
  }

  /**
   * Render batch with full tracking
   */
  private async renderBatch(configs: RenderConfig[]): Promise<RenderResult[]> {
    const results: RenderResult[] = [];
    
    for (const config of configs) {
      const startTime = Date.now();
      const result = await this.pipeline.render(config);
      const renderTime = Date.now() - startTime;
      
      await this.outputManager.recordRender(config, result, renderTime);
      results.push(result);
    }

    return results;
  }

  /**
   * Get render statistics
   */
  async getStatistics(): Promise<any> {
    return await this.outputManager.getRenderStats();
  }

  /**
   * Generate render report
   */
  async generateReport(): Promise<string> {
    return await this.outputManager.generateReport();
  }

  /**
   * Clean up old renders
   */
  async cleanup(options?: {
    keepDays?: number;
    keepSuccessful?: number;
    deleteFailed?: boolean;
  }): Promise<{ filesDeleted: number; spaceFreed: number }> {
    return await this.outputManager.cleanup(options);
  }

  /**
   * Export render data
   */
  async exportData(filePath?: string): Promise<string> {
    return await this.outputManager.exportToCsv(filePath);
  }

  /**
   * Create a batch configuration builder
   */
  createBatchBuilder(name?: string, outputDirectory?: string): BatchConfigBuilder {
    return new BatchConfigBuilder(name, outputDirectory);
  }

  /**
   * Estimate render requirements
   */
  async estimateRender(compositionId: string, quality: string = 'medium'): Promise<{
    estimatedTime: number;
    estimatedSize: number;
    composition: any;
  }> {
    const compositions = await this.getCompositions();
    const composition = compositions.find(c => c.id === compositionId);
    
    if (!composition) {
      throw new Error(`Composition '${compositionId}' not found`);
    }

    const estimatedSize = RenderPipeline.estimateFileSize(
      composition.durationInFrames,
      composition.fps,
      quality as any
    );

    // Rough time estimate: 1 second per frame (varies greatly)
    const estimatedTime = composition.durationInFrames * 1000;

    return {
      estimatedTime,
      estimatedSize,
      composition,
    };
  }

  /**
   * Get render history
   */
  async getRenderHistory(limit: number = 10): Promise<any[]> {
    return await this.outputManager.getRenderHistory(limit);
  }
}