import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { BarChartRaceConfig } from '../types';

// Zod schemas for validation
const BackgroundLayerSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  opacity: z.number().min(0).max(100),
  image: z.object({
    path: z.string(),
    cropping: z.enum(['cover', 'contain', 'fill']),
    opacity: z.number().min(0).max(100)
  }).optional()
});

const ChartLayerSchema = z.object({
  position: z.object({
    top: z.number().min(0),
    right: z.number().min(0),
    bottom: z.number().min(0),
    left: z.number().min(0)
  }),
  chart: z.object({
    visibleItemCount: z.number().min(1).max(50),
    maxValue: z.enum(['local', 'global']),
    itemSpacing: z.number().min(0)
  }),
  animation: z.object({
    type: z.enum(['continuous', 'discrete']),
    overtakeDuration: z.number().min(0.1).max(5)
  }),
  bar: z.object({
    colors: z.union([z.array(z.string()), z.literal('auto')]),
    cornerRadius: z.number().min(0),
    opacity: z.number().min(0).max(100)
  }),
  labels: z.object({
    title: z.object({
      show: z.boolean(),
      fontSize: z.number().min(8).max(100),
      fontFamily: z.string(),
      color: z.string(),
      position: z.enum(['inside', 'outside'])
    }),
    value: z.object({
      show: z.boolean(),
      fontSize: z.number().min(8).max(100),
      fontFamily: z.string(),
      color: z.string(),
      format: z.string(),
      prefix: z.string().optional(),
      suffix: z.string().optional()
    }),
    rank: z.object({
      show: z.boolean(),
      fontSize: z.number().min(8).max(100),
      backgroundColor: z.string(),
      textColor: z.string()
    })
  }),
  images: z.object({
    show: z.boolean(),
    mapping: z.record(z.string()),
    size: z.number().min(16).max(200),
    borderRadius: z.number().min(0)
  }).optional()
});

const TitleLayerSchema = z.object({
  text: z.string(),
  position: z.object({
    top: z.number().min(0),
    align: z.enum(['left', 'center', 'right'])
  }),
  style: z.object({
    fontSize: z.number().min(8).max(200),
    fontFamily: z.string(),
    color: z.string(),
    opacity: z.number().min(0).max(100)
  }),
  timeline: z.object({
    startTime: z.number().min(0),
    duration: z.number().min(0.1)
  })
});

const DateLayerSchema = z.object({
  position: z.object({
    bottom: z.number().min(0),
    right: z.number().min(0)
  }),
  format: z.object({
    pattern: z.string(),
    locale: z.string()
  }),
  style: z.object({
    fontSize: z.number().min(8).max(100),
    fontFamily: z.string(),
    color: z.string(),
    opacity: z.number().min(0).max(100)
  }),
  animation: z.object({
    type: z.enum(['fixed', 'continuous']),
    duration: z.number().min(0.1).max(2)
  })
});

const BarChartRaceConfigSchema = z.object({
  output: z.object({
    filename: z.string().min(1),
    format: z.enum(['mp4', 'webm']),
    width: z.number().min(320).max(7680), // Up to 8K width
    height: z.number().min(240).max(4320), // Up to 8K height
    fps: z.number().min(1).max(120),
    duration: z.number().min(1).max(3600), // Max 1 hour
    quality: z.enum(['low', 'medium', 'high', 'max'])
  }),
  data: z.object({
    csvPath: z.string().min(1),
    dateColumn: z.string().min(1),
    dateFormat: z.string().min(1),
    valueColumns: z.array(z.string()).min(1).max(50),
    interpolation: z.enum(['linear', 'smooth', 'step'])
  }),
  layers: z.object({
    background: BackgroundLayerSchema,
    chart: ChartLayerSchema,
    title: TitleLayerSchema.optional(),
    text: z.object({
      text: z.string(),
      position: z.object({
        top: z.number().min(0),
        left: z.number().min(0)
      }),
      style: z.object({
        fontSize: z.number().min(8).max(100),
        fontFamily: z.string(),
        color: z.string(),
        opacity: z.number().min(0).max(100)
      })
    }).optional(),
    date: DateLayerSchema.optional()
  })
});

export class ConfigValidator {
  async loadAndValidate(configPath: string): Promise<BarChartRaceConfig> {
    try {
      // Check if file exists
      const resolvedPath = path.resolve(configPath);
      await fs.access(resolvedPath);
      
      // Read and parse JSON
      const configContent = await fs.readFile(resolvedPath, 'utf-8');
      let configData: unknown;
      
      try {
        configData = JSON.parse(configContent);
      } catch (parseError) {
        throw new Error(`Invalid JSON in config file: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }
      
      // Validate against schema
      const validatedConfig = BarChartRaceConfigSchema.parse(configData);
      
      // Additional business logic validations
      await this.validateBusinessRules(validatedConfig, path.dirname(resolvedPath));
      
      return validatedConfig;
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        throw new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`);
      }
      
      if (error instanceof Error) {
        if (error.code === 'ENOENT') {
          throw new Error(`Configuration file not found: ${configPath}`);
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred during configuration validation');
    }
  }
  
  private async validateBusinessRules(config: BarChartRaceConfig, configDir: string): Promise<void> {
    // Validate video aspect ratio makes sense
    const aspectRatio = config.output.width / config.output.height;
    if (aspectRatio < 0.5 || aspectRatio > 4.0) {
      console.warn(`Warning: Unusual aspect ratio ${aspectRatio.toFixed(2)}. Common ratios are 16:9, 4:3, or 1:1`);
    }
    
    // Validate frame rate and duration combination for performance
    const totalFrames = config.output.fps * config.output.duration;
    if (totalFrames > 36000) { // 10 minutes at 60fps
      console.warn(`Warning: High frame count (${totalFrames}). This may result in long render times.`);
    }
    
    // Validate CSV path if relative
    if (!path.isAbsolute(config.data.csvPath)) {
      const csvPath = path.resolve(configDir, config.data.csvPath);
      try {
        await fs.access(csvPath);
      } catch {
        throw new Error(`CSV file not found: ${config.data.csvPath} (resolved to: ${csvPath})`);
      }
    }
    
    // Validate image paths if specified
    if (config.layers.chart.images?.show && config.layers.chart.images.mapping) {
      const imagePaths = Object.values(config.layers.chart.images.mapping);
      for (const imagePath of imagePaths) {
        if (!path.isAbsolute(imagePath)) {
          const fullPath = path.resolve(configDir, imagePath);
          try {
            await fs.access(fullPath);
          } catch {
            console.warn(`Warning: Image file not found: ${imagePath}`);
          }
        }
      }
    }
    
    // Validate background image if specified
    if (config.layers.background.image?.path) {
      const imagePath = config.layers.background.image.path;
      if (!path.isAbsolute(imagePath)) {
        const fullPath = path.resolve(configDir, imagePath);
        try {
          await fs.access(fullPath);
        } catch {
          throw new Error(`Background image not found: ${imagePath}`);
        }
      }
    }
    
    // Validate chart positioning doesn't exceed video dimensions
    const chartArea = {
      width: config.output.width - config.layers.chart.position.left - config.layers.chart.position.right,
      height: config.output.height - config.layers.chart.position.top - config.layers.chart.position.bottom
    };
    
    if (chartArea.width <= 0 || chartArea.height <= 0) {
      throw new Error('Chart positioning leaves no space for the chart area');
    }
    
    if (chartArea.width < 200 || chartArea.height < 100) {
      console.warn('Warning: Chart area is very small, labels may be cramped');
    }
    
    // Validate timeline consistency
    if (config.layers.title?.timeline) {
      const titleEnd = config.layers.title.timeline.startTime + config.layers.title.timeline.duration;
      if (titleEnd > config.output.duration) {
        throw new Error('Title timeline extends beyond video duration');
      }
    }
  }
}