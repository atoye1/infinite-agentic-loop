import { RenderConfig } from './RenderPipeline';

export interface BatchRenderConfig {
  name?: string;
  description?: string;
  outputDirectory: string;
  renders: RenderConfig[];
}

export class BatchConfigBuilder {
  private config: BatchRenderConfig;

  constructor(name?: string, outputDirectory: string = './output') {
    this.config = {
      name,
      outputDirectory,
      renders: [],
    };
  }

  /**
   * Add a render configuration to the batch
   */
  addRender(config: Omit<RenderConfig, 'outputPath'> & { filename?: string }): BatchConfigBuilder {
    const { filename, ...renderConfig } = config;
    const outputPath = filename 
      ? `${this.config.outputDirectory}/${filename}`
      : `${this.config.outputDirectory}/${config.compositionId}_${config.quality}.${config.format}`;

    this.config.renders.push({
      ...renderConfig,
      outputPath,
    });

    return this;
  }

  /**
   * Add multiple quality variants of the same composition
   */
  addQualityVariants(
    compositionId: string,
    format: 'mp4' | 'webm' = 'mp4',
    qualities: Array<'low' | 'medium' | 'high' | 'max'> = ['low', 'medium', 'high'],
    props?: Record<string, unknown>
  ): BatchConfigBuilder {
    qualities.forEach(quality => {
      this.addRender({
        compositionId,
        format,
        quality,
        props,
        filename: `${compositionId}_${quality}.${format}`,
      });
    });

    return this;
  }

  /**
   * Add format variants (MP4 and WebM) of the same composition
   */
  addFormatVariants(
    compositionId: string,
    quality: 'low' | 'medium' | 'high' | 'max' = 'medium',
    props?: Record<string, unknown>
  ): BatchConfigBuilder {
    ['mp4', 'webm'].forEach(format => {
      this.addRender({
        compositionId,
        format: format as 'mp4' | 'webm',
        quality,
        props,
        filename: `${compositionId}_${quality}.${format}`,
      });
    });

    return this;
  }

  /**
   * Add a grid of all quality and format combinations
   */
  addFullGrid(
    compositionId: string,
    props?: Record<string, unknown>
  ): BatchConfigBuilder {
    const qualities: Array<'low' | 'medium' | 'high' | 'max'> = ['low', 'medium', 'high', 'max'];
    const formats: Array<'mp4' | 'webm'> = ['mp4', 'webm'];

    qualities.forEach(quality => {
      formats.forEach(format => {
        this.addRender({
          compositionId,
          format,
          quality,
          props,
          filename: `${compositionId}_${quality}.${format}`,
        });
      });
    });

    return this;
  }

  /**
   * Set description for the batch
   */
  setDescription(description: string): BatchConfigBuilder {
    this.config.description = description;
    return this;
  }

  /**
   * Set output directory for all renders
   */
  setOutputDirectory(directory: string): BatchConfigBuilder {
    this.config.outputDirectory = directory;
    // Update existing render paths
    this.config.renders = this.config.renders.map(render => ({
      ...render,
      outputPath: render.outputPath.replace(/^.*\/([^\/]+)$/, `${directory}/$1`),
    }));
    return this;
  }

  /**
   * Build and return the configuration
   */
  build(): BatchRenderConfig {
    return { ...this.config };
  }

  /**
   * Save configuration to JSON file
   */
  async saveToFile(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Save config
    await fs.writeFile(filePath, JSON.stringify(this.config, null, 2));
  }

  /**
   * Load configuration from JSON file
   */
  static async loadFromFile(filePath: string): Promise<BatchRenderConfig> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
}

// Example batch configurations
export const ExampleConfigs = {
  /**
   * Create a basic quality comparison batch
   */
  qualityComparison(compositionId: string): BatchRenderConfig {
    return new BatchConfigBuilder('Quality Comparison', './output/quality-test')
      .addQualityVariants(compositionId, 'mp4', ['low', 'medium', 'high', 'max'])
      .setDescription(`Quality comparison for ${compositionId} composition`)
      .build();
  },

  /**
   * Create a format comparison batch
   */
  formatComparison(compositionId: string, quality: 'medium' | 'high' = 'medium'): BatchRenderConfig {
    return new BatchConfigBuilder('Format Comparison', './output/format-test')
      .addFormatVariants(compositionId, quality)
      .setDescription(`Format comparison (MP4 vs WebM) for ${compositionId} composition`)
      .build();
  },

  /**
   * Create a complete test suite batch
   */
  completeSuite(compositions: string[]): BatchRenderConfig {
    const builder = new BatchConfigBuilder('Complete Test Suite', './output/complete-suite')
      .setDescription('Complete rendering test suite with all compositions, formats, and qualities');

    compositions.forEach(compositionId => {
      builder.addFullGrid(compositionId);
    });

    return builder.build();
  },

  /**
   * Create a production batch with optimized settings
   */
  production(compositionId: string, props?: Record<string, unknown>): BatchRenderConfig {
    return new BatchConfigBuilder('Production Render', './output/production')
      .addRender({
        compositionId,
        format: 'mp4',
        quality: 'high',
        parallel: 4,
        props,
        filename: `${compositionId}_final.mp4`,
      })
      .addRender({
        compositionId,
        format: 'webm',
        quality: 'high',
        parallel: 4,
        props,
        filename: `${compositionId}_final.webm`,
      })
      .setDescription(`Production quality renders for ${compositionId}`)
      .build();
  },
};

// Utility functions for batch processing

interface Composition {
  id: string;
  durationInFrames: number;
  fps: number;
}

export class BatchUtils {
  /**
   * Estimate total batch processing time
   */
  static estimateBatchTime(
    config: BatchRenderConfig,
    compositions: Composition[]
  ): { totalFrames: number; estimatedMinutes: number } {
    let totalFrames = 0;
    
    config.renders.forEach(render => {
      const composition = compositions.find(c => c.id === render.compositionId);
      if (composition) {
        totalFrames += composition.durationInFrames;
      }
    });

    // Rough estimate: 1 frame per second rendering (varies greatly by complexity)
    const estimatedSeconds = totalFrames;
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

    return { totalFrames, estimatedMinutes };
  }

  /**
   * Calculate total estimated file size for batch
   */
  static estimateBatchSize(
    config: BatchRenderConfig,
    compositions: Composition[]
  ): number {
    let totalSize = 0;

    config.renders.forEach(render => {
      const composition = compositions.find(c => c.id === render.compositionId);
      if (composition) {
        totalSize += this.estimateRenderSize(composition, render.quality);
      }
    });

    return totalSize;
  }

  /**
   * Estimate size for a single render
   */
  private static estimateRenderSize(composition: Composition, quality: string): number {
    const durationInSeconds = composition.durationInFrames / composition.fps;
    const baseSizePerSecond = 1024 * 1024; // 1MB per second baseline

    const qualityMultipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 2.0,
      max: 4.0,
    };

    return Math.round(durationInSeconds * baseSizePerSecond * (qualityMultipliers[quality] || 1.0));
  }

  /**
   * Generate a summary report for a batch configuration
   */
  static generateSummary(config: BatchRenderConfig, compositions: Composition[]): string {
    const { totalFrames, estimatedMinutes } = this.estimateBatchTime(config, compositions);
    const totalSize = this.estimateBatchSize(config, compositions);
    
    const formatFileSize = (bytes: number): string => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    return `
Batch Configuration Summary
===========================
Name: ${config.name || 'Unnamed Batch'}
Description: ${config.description || 'No description'}
Output Directory: ${config.outputDirectory}

Render Count: ${config.renders.length}
Total Frames: ${totalFrames.toLocaleString()}
Estimated Time: ${estimatedMinutes} minutes
Estimated Size: ${formatFileSize(totalSize)}

Renders:
${config.renders.map((render, index) => 
  `  ${index + 1}. ${render.compositionId} (${render.format.toUpperCase()}, ${render.quality})`
).join('\n')}
`;
  }
}