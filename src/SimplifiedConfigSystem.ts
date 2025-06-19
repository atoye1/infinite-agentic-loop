/**
 * Simplified Configuration System for Bar Chart Race v1.1
 * Consolidates complex configuration into 10 essential options
 * 
 * Part of the 5-component architecture simplification initiative
 */

export interface SimplifiedBarChartRaceConfig {
  // Core 10 configuration options for simplified architecture
  output: string;              // 1. Output file path (e.g., "./video.mp4")
  data: string;               // 2. CSV data file path (e.g., "./data.csv")
  duration: number;           // 3. Video duration in seconds
  fps: number;                // 4. Frames per second (1-120)
  quality: 'low' | 'medium' | 'high' | 'max';  // 5. Video quality
  topN: number;               // 6. Number of bars to show (1-50)
  theme: 'light' | 'dark' | 'auto';  // 7. Visual theme
  animation: 'smooth' | 'linear' | 'step';  // 8. Animation style
  title?: string;             // 9. Chart title (optional)
  dateFormat: string;         // 10. Date display format
}

export interface FullBarChartRaceConfig {
  output: {
    filename: string;
    format: 'mp4' | 'webm';
    width: number;
    height: number;
    fps: number;
    duration: number;
    quality: 'low' | 'medium' | 'high' | 'max';
  };
  data: {
    csvPath: string;
    dateColumn: string;
    dateFormat: string;
    valueColumns: string[];
    interpolation: 'linear' | 'smooth' | 'step';
  };
  layers: {
    background: {
      color: string;
      opacity: number;
    };
    chart: {
      position: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
      chart: {
        visibleItemCount: number;
        maxValue: 'local' | 'global';
        itemSpacing: number;
      };
      animation: {
        type: 'continuous' | 'discrete';
        overtakeDuration: number;
      };
      bar: {
        colors: string[] | 'auto';
        cornerRadius: number;
        opacity: number;
      };
      labels: {
        title: {
          show: boolean;
          fontSize: number;
          fontFamily: string;
          color: string;
          position: 'inside' | 'outside';
        };
        value: {
          show: boolean;
          fontSize: number;
          fontFamily: string;
          color: string;
          format: string;
          prefix?: string;
          suffix?: string;
        };
        rank: {
          show: boolean;
          fontSize: number;
          backgroundColor: string;
          textColor: string;
        };
      };
    };
    title?: {
      text: string;
      position: {
        top: number;
        align: 'left' | 'center' | 'right';
      };
      style: {
        fontSize: number;
        fontFamily: string;
        color: string;
        opacity: number;
      };
      timeline: {
        startTime: number;
        duration: number;
      };
    };
    date?: {
      position: {
        bottom: number;
        right: number;
      };
      format: {
        pattern: string;
        locale: string;
      };
      style: {
        fontSize: number;
        fontFamily: string;
        color: string;
        opacity: number;
      };
      animation: {
        type: 'fixed' | 'continuous';
        duration: number;
      };
    };
  };
}

export interface ThemeConfiguration {
  background: {
    color: string;
    opacity: number;
  };
  text: {
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
  };
  accent: string;
  bars: {
    colors: string[];
    opacity: number;
    cornerRadius: number;
  };
}

export class SimplifiedConfigSystem {
  private static readonly DEFAULT_VALUES: Partial<SimplifiedBarChartRaceConfig> = {
    duration: 30,
    fps: 30,
    quality: 'medium',
    topN: 10,
    theme: 'dark',
    animation: 'smooth',
    dateFormat: 'YYYY-MM'
  };

  private static readonly THEME_CONFIGURATIONS: Record<string, ThemeConfiguration> = {
    light: {
      background: { color: '#ffffff', opacity: 100 },
      text: { fontSize: 24, fontFamily: 'Inter, Arial, sans-serif', color: '#1a1a1a', opacity: 100 },
      accent: '#2563eb',
      bars: {
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'],
        opacity: 90,
        cornerRadius: 8
      }
    },
    dark: {
      background: { color: '#0f172a', opacity: 100 },
      text: { fontSize: 24, fontFamily: 'Inter, Arial, sans-serif', color: '#f8fafc', opacity: 100 },
      accent: '#60a5fa',
      bars: {
        colors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#fb923c', '#a3e635'],
        opacity: 95,
        cornerRadius: 10
      }
    },
    auto: {
      background: { color: '#1e293b', opacity: 100 },
      text: { fontSize: 24, fontFamily: 'Inter, Arial, sans-serif', color: '#e2e8f0', opacity: 100 },
      accent: '#38bdf8',
      bars: {
        colors: ['#38bdf8', '#22c55e', '#eab308', '#f87171', '#a855f7', '#06b6d4', '#f97316', '#84cc16'],
        opacity: 92,
        cornerRadius: 9
      }
    }
  };

  /**
   * Validate simplified configuration
   */
  public static validateConfig(config: SimplifiedBarChartRaceConfig): string[] {
    const errors: string[] = [];

    // 1. Output validation
    if (!config.output || typeof config.output !== 'string' || config.output.trim() === '') {
      errors.push('Output path is required and must be a non-empty string');
    } else {
      const validExtensions = ['.mp4', '.webm'];
      const hasValidExtension = validExtensions.some(ext => config.output.toLowerCase().endsWith(ext));
      if (!hasValidExtension) {
        errors.push('Output file must have .mp4 or .webm extension');
      }
    }

    // 2. Data validation
    if (!config.data || typeof config.data !== 'string' || config.data.trim() === '') {
      errors.push('Data path is required and must be a non-empty string');
    } else if (!config.data.toLowerCase().endsWith('.csv')) {
      errors.push('Data file must have .csv extension');
    }

    // 3. Duration validation
    if (typeof config.duration !== 'number' || config.duration <= 0) {
      errors.push('Duration must be a positive number');
    } else if (config.duration > 7200) {
      errors.push('Duration cannot exceed 7200 seconds (2 hours)');
    }

    // 4. FPS validation
    if (typeof config.fps !== 'number' || config.fps < 1 || config.fps > 120) {
      errors.push('FPS must be a number between 1 and 120');
    }

    // 5. Quality validation
    if (!['low', 'medium', 'high', 'max'].includes(config.quality)) {
      errors.push('Quality must be one of: low, medium, high, max');
    }

    // 6. TopN validation
    if (typeof config.topN !== 'number' || config.topN < 1 || config.topN > 50) {
      errors.push('TopN must be a number between 1 and 50');
    }

    // 7. Theme validation
    if (!['light', 'dark', 'auto'].includes(config.theme)) {
      errors.push('Theme must be one of: light, dark, auto');
    }

    // 8. Animation validation
    if (!['smooth', 'linear', 'step'].includes(config.animation)) {
      errors.push('Animation must be one of: smooth, linear, step');
    }

    // 9. Title validation (optional)
    if (config.title !== undefined) {
      if (typeof config.title !== 'string') {
        errors.push('Title must be a string if provided');
      } else if (config.title.length > 100) {
        errors.push('Title cannot exceed 100 characters');
      }
    }

    // 10. Date format validation
    if (!config.dateFormat || typeof config.dateFormat !== 'string') {
      errors.push('Date format is required and must be a string');
    } else {
      const validFormats = ['YYYY-MM-DD', 'YYYY-MM', 'YYYY', 'MM/DD/YYYY', 'DD/MM/YYYY', 'MMMM YYYY', 'MMM YYYY'];
      if (!validFormats.includes(config.dateFormat)) {
        errors.push(`Date format must be one of: ${validFormats.join(', ')}`);
      }
    }

    return errors;
  }

  /**
   * Apply default values to partial configuration
   */
  public static applyDefaults(config: Partial<SimplifiedBarChartRaceConfig>): SimplifiedBarChartRaceConfig {
    return {
      ...this.DEFAULT_VALUES,
      ...config
    } as SimplifiedBarChartRaceConfig;
  }

  /**
   * Transform simplified config to full configuration
   */
  public static transformToFullConfig(
    config: SimplifiedBarChartRaceConfig,
    csvHeaders?: string[]
  ): FullBarChartRaceConfig {
    const theme = this.getThemeConfiguration(config.theme);
    const format = config.output.toLowerCase().endsWith('.webm') ? 'webm' : 'mp4';
    
    // Infer value columns from CSV headers if provided, otherwise use common defaults
    const valueColumns = csvHeaders ? 
      csvHeaders.filter(header => header.toLowerCase() !== 'date') :
      ['Category1', 'Category2', 'Category3', 'Category4', 'Category5'];

    return {
      output: {
        filename: config.output,
        format,
        width: 1920,
        height: 1080,
        fps: config.fps,
        duration: config.duration,
        quality: config.quality
      },
      data: {
        csvPath: config.data,
        dateColumn: 'Date',
        dateFormat: this.convertDateFormat(config.dateFormat),
        valueColumns: valueColumns.slice(0, config.topN), // Only include topN columns
        interpolation: config.animation === 'smooth' ? 'smooth' : 
                      config.animation === 'step' ? 'step' : 'linear'
      },
      layers: {
        background: theme.background,
        chart: {
          position: {
            top: 120,
            right: 50,
            bottom: config.title ? 120 : 80,
            left: 50
          },
          chart: {
            visibleItemCount: config.topN,
            maxValue: 'local',
            itemSpacing: Math.max(10, Math.min(30, (1080 - 240) / config.topN - 40))
          },
          animation: {
            type: 'continuous',
            overtakeDuration: config.animation === 'step' ? 0.1 : 
                            config.animation === 'smooth' ? 0.8 : 0.5
          },
          bar: {
            colors: theme.bars.colors,
            cornerRadius: theme.bars.cornerRadius,
            opacity: theme.bars.opacity
          },
          labels: {
            title: {
              show: true,
              fontSize: Math.max(16, Math.min(28, 32 - config.topN)),
              fontFamily: theme.text.fontFamily,
              color: theme.text.color,
              position: 'outside'
            },
            value: {
              show: true,
              fontSize: Math.max(14, Math.min(24, 28 - config.topN)),
              fontFamily: theme.text.fontFamily,
              color: theme.text.color,
              format: '{value:,.0f}',
              suffix: ''
            },
            rank: {
              show: true,
              fontSize: Math.max(12, Math.min(20, 24 - config.topN)),
              backgroundColor: theme.accent,
              textColor: config.theme === 'light' ? '#ffffff' : '#000000'
            }
          }
        },
        title: config.title ? {
          text: config.title,
          position: {
            top: 40,
            align: 'center'
          },
          style: {
            fontSize: 42,
            fontFamily: theme.text.fontFamily,
            color: theme.text.color,
            opacity: theme.text.opacity
          },
          timeline: {
            startTime: 0,
            duration: config.duration
          }
        } : undefined,
        date: {
          position: {
            bottom: 40,
            right: 50
          },
          format: {
            pattern: config.dateFormat,
            locale: 'en-US'
          },
          style: {
            fontSize: 32,
            fontFamily: theme.text.fontFamily,
            color: theme.text.color,
            opacity: 85
          },
          animation: {
            type: config.animation === 'step' ? 'fixed' : 'continuous',
            duration: 0.3
          }
        }
      }
    };
  }

  /**
   * Get theme configuration
   */
  public static getThemeConfiguration(theme: string): ThemeConfiguration {
    return this.THEME_CONFIGURATIONS[theme] || this.THEME_CONFIGURATIONS.dark;
  }

  /**
   * Convert simplified date format to internal format
   */
  private static convertDateFormat(format: string): 'YYYY-MM-DD' | 'YYYY-MM' | 'YYYY' | 'MM/DD/YYYY' | 'DD/MM/YYYY' {
    const formatMap: Record<string, 'YYYY-MM-DD' | 'YYYY-MM' | 'YYYY' | 'MM/DD/YYYY' | 'DD/MM/YYYY'> = {
      'YYYY-MM-DD': 'YYYY-MM-DD',
      'YYYY-MM': 'YYYY-MM',
      'YYYY': 'YYYY',
      'MM/DD/YYYY': 'MM/DD/YYYY',
      'DD/MM/YYYY': 'DD/MM/YYYY',
      'MMMM YYYY': 'YYYY-MM',
      'MMM YYYY': 'YYYY-MM'
    };

    return formatMap[format] || 'YYYY-MM';
  }

  /**
   * Create a simplified config from CLI arguments
   */
  public static fromCLIArgs(args: Record<string, unknown>): SimplifiedBarChartRaceConfig {
    const config: Partial<SimplifiedBarChartRaceConfig> = {};

    if (args.output) config.output = String(args.output);
    if (args.data) config.data = String(args.data);
    if (args.duration) config.duration = Number(args.duration);
    if (args.fps) config.fps = Number(args.fps);
    if (args.quality) config.quality = args.quality as SimplifiedBarChartRaceConfig['quality'];
    if (args.topN || args['top-n']) config.topN = Number(args.topN || args['top-n']);
    if (args.theme) config.theme = args.theme as SimplifiedBarChartRaceConfig['theme'];
    if (args.animation) config.animation = args.animation as SimplifiedBarChartRaceConfig['animation'];
    if (args.title) config.title = String(args.title);
    if (args.dateFormat || args['date-format']) config.dateFormat = String(args.dateFormat || args['date-format']);

    return this.applyDefaults(config);
  }

  /**
   * Create example configurations for testing
   */
  public static createExampleConfigs(): Record<string, SimplifiedBarChartRaceConfig> {
    return {
      basic: {
        output: './basic-chart.mp4',
        data: './data.csv',
        duration: 30,
        fps: 30,
        quality: 'medium',
        topN: 10,
        theme: 'dark',
        animation: 'smooth',
        title: 'Basic Chart Race',
        dateFormat: 'YYYY-MM'
      },
      quick: {
        output: './quick-chart.mp4',
        data: './data.csv',
        duration: 10,
        fps: 60,
        quality: 'low',
        topN: 5,
        theme: 'light',
        animation: 'linear',
        dateFormat: 'YYYY'
      },
      production: {
        output: './production-chart.mp4',
        data: './data.csv',
        duration: 120,
        fps: 30,
        quality: 'max',
        topN: 15,
        theme: 'auto',
        animation: 'smooth',
        title: 'Production Quality Chart Race',
        dateFormat: 'MMMM YYYY'
      },
      minimal: {
        output: './minimal-chart.webm',
        data: './data.csv',
        duration: 15,
        fps: 24,
        quality: 'high',
        topN: 8,
        theme: 'dark',
        animation: 'step',
        dateFormat: 'YYYY-MM-DD'
      }
    };
  }

  /**
   * Estimate processing requirements for a configuration
   */
  public static estimateRequirements(config: SimplifiedBarChartRaceConfig): {
    estimatedFileSize: number; // MB
    estimatedProcessingTime: number; // seconds
    memoryUsage: number; // MB
    complexity: 'low' | 'medium' | 'high';
  } {
    const totalFrames = config.duration * config.fps;
    const qualityMultiplier = {
      low: 0.5,
      medium: 1.0,
      high: 2.0,
      max: 4.0
    }[config.quality];

    const complexityFactors = {
      topN: config.topN / 10,
      animation: config.animation === 'smooth' ? 1.5 : config.animation === 'linear' ? 1.0 : 0.8,
      fps: config.fps / 30,
      duration: Math.log10(config.duration)
    };

    const complexityScore = Object.values(complexityFactors).reduce((sum, factor) => sum + factor, 0);
    const complexity = complexityScore < 3 ? 'low' : complexityScore < 5 ? 'medium' : 'high';

    return {
      estimatedFileSize: Math.round(totalFrames * qualityMultiplier * 0.01), // Rough estimate
      estimatedProcessingTime: Math.round(totalFrames / 100 * complexityScore),
      memoryUsage: Math.round(config.topN * config.fps * 0.1 + 50),
      complexity
    };
  }

  /**
   * Generate optimized configuration suggestions
   */
  public static optimizeConfig(
    config: SimplifiedBarChartRaceConfig,
    targetConstraints?: {
      maxFileSize?: number; // MB
      maxProcessingTime?: number; // seconds
      maxMemoryUsage?: number; // MB
    }
  ): {
    optimizedConfig: SimplifiedBarChartRaceConfig;
    optimizations: string[];
  } {
    const optimizedConfig = { ...config };
    const optimizations: string[] = [];

    if (targetConstraints) {
      const requirements = this.estimateRequirements(config);

      // Optimize file size
      if (targetConstraints.maxFileSize && requirements.estimatedFileSize > targetConstraints.maxFileSize) {
        if (config.quality === 'max') {
          optimizedConfig.quality = 'high';
          optimizations.push('Reduced quality from max to high to meet file size constraint');
        } else if (config.quality === 'high') {
          optimizedConfig.quality = 'medium';
          optimizations.push('Reduced quality from high to medium to meet file size constraint');
        }

        if (config.fps > 30) {
          optimizedConfig.fps = 30;
          optimizations.push('Reduced FPS to 30 to meet file size constraint');
        }
      }

      // Optimize processing time
      if (targetConstraints.maxProcessingTime && requirements.estimatedProcessingTime > targetConstraints.maxProcessingTime) {
        if (config.animation === 'smooth') {
          optimizedConfig.animation = 'linear';
          optimizations.push('Changed animation from smooth to linear for faster processing');
        }

        if (config.topN > 10) {
          optimizedConfig.topN = 10;
          optimizations.push('Reduced topN to 10 for faster processing');
        }
      }

      // Optimize memory usage
      if (targetConstraints.maxMemoryUsage && requirements.memoryUsage > targetConstraints.maxMemoryUsage) {
        if (config.fps > 30) {
          optimizedConfig.fps = Math.min(30, config.fps);
          optimizations.push('Reduced FPS to optimize memory usage');
        }

        if (config.topN > 8) {
          optimizedConfig.topN = 8;
          optimizations.push('Reduced topN to 8 to optimize memory usage');
        }
      }
    }

    // General optimizations
    if (config.duration > 300 && config.quality === 'max') {
      optimizedConfig.quality = 'high';
      optimizations.push('Reduced quality for long videos to prevent excessive file sizes');
    }

    if (config.topN > 20 && config.animation === 'smooth') {
      optimizedConfig.animation = 'linear';
      optimizations.push('Simplified animation for large topN to improve readability');
    }

    return {
      optimizedConfig,
      optimizations
    };
  }
}