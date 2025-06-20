#!/usr/bin/env node

/**
 * Unified CLI for Bar Chart Race Rendering
 * Simplified interface focused on essential functionality
 * 
 * Basic usage:
 *   npm run render data.csv
 *   npm run render data.csv config.json
 *   npm run render data.csv --output video.mp4 --quality high
 */

import { program } from 'commander';
// Simple color utility (instead of importing chalk)
const chalk = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`
};
import { existsSync, readFileSync } from 'fs';
import path from 'path';

// Import types and necessary modules
interface SimplifiedRenderOptions {
  data: string;
  config?: string;
  output?: string;
  quality?: 'low' | 'medium' | 'high' | 'max';
  verbose?: boolean;
  dryRun?: boolean;
}

interface SimpleConfig {
  output: {
    filename: string;
    format: 'mp4' | 'webm';
    quality: 'low' | 'medium' | 'high' | 'max';
  };
  data: {
    dateColumn: string;
    dateFormat: string;
    valueColumns: string[];
  };
}

class UnifiedBarChartRaceCLI {
  private verbose: boolean = false;

  /**
   * Main render function - simplified interface
   */
  async render(options: SimplifiedRenderOptions): Promise<void> {
    this.verbose = options.verbose || false;
    
    try {
      // Validate CSV data file
      if (!existsSync(options.data)) {
        throw new Error(`CSV data file not found: ${options.data}`);
      }

      // Load configuration (use default if not provided)
      const config = await this.loadConfiguration(options.config);
      
      // Override config with CLI options
      if (options.output) {
        config.output.filename = options.output;
        config.output.format = path.extname(options.output).slice(1) as 'mp4' | 'webm';
      }
      
      if (options.quality) {
        config.output.quality = options.quality;
      }

      // Display render information
      console.log(chalk.blue('🎬 Bar Chart Race Renderer'));
      console.log(chalk.gray(`Data: ${options.data}`));
      console.log(chalk.gray(`Config: ${options.config || 'default'}`));
      console.log(chalk.gray(`Output: ${config.output.filename}`));
      console.log(chalk.gray(`Quality: ${config.output.quality}`));
      console.log();

      // Validate data structure
      await this.validateData(options.data, config);

      // Check if dry run
      if (options.dryRun) {
        console.log(chalk.green('✅ Validation completed successfully!'));
        console.log(chalk.blue('Dry run completed. No video was rendered.'));
        return;
      }

      // Start rendering process
      console.log(chalk.blue('Starting render process...'));
      
      // Import and use the RenderPipeline or appropriate rendering system
      const { RenderPipeline } = await import('./RenderPipeline');
      const pipeline = new RenderPipeline(this.onProgress.bind(this));

      // Create render configuration
      const renderConfig = {
        compositionId: 'BarChartRaceComposition',
        outputPath: config.output.filename,
        format: config.output.format,
        quality: config.output.quality,
        props: {
          dataPath: options.data,
          config: config,
        },
      };

      // Execute render
      const result = await pipeline.render(renderConfig);

      if (result.success) {
        console.log(chalk.green('\n✅ Render completed successfully!'));
        console.log(chalk.gray(`Output: ${result.outputPath}`));
        if (result.duration) {
          console.log(chalk.gray(`Render time: ${this.formatTime(result.duration)}`));
        }
        if (result.fileSize) {
          console.log(chalk.gray(`File size: ${this.formatFileSize(result.fileSize)}`));
        }
      } else {
        throw new Error(result.error?.message || 'Render failed');
      }

    } catch (error) {
      console.error(chalk.red('❌ Render failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * Validate only mode - runs validation without rendering
   */
  async validateOnly(options: { data: string; config?: string; verbose?: boolean }): Promise<void> {
    this.verbose = options.verbose || false;
    
    try {
      // Validate CSV data file
      if (!existsSync(options.data)) {
        throw new Error(`CSV data file not found: ${options.data}`);
      }

      // Load configuration (use default if not provided)
      const config = await this.loadConfiguration(options.config);

      // Display validation information
      console.log(chalk.blue('🔍 Bar Chart Race Validator'));
      console.log(chalk.gray(`Data: ${options.data}`));
      console.log(chalk.gray(`Config: ${options.config || 'default'}`));
      console.log();

      // Validate data structure
      await this.validateData(options.data, config);

      console.log(chalk.green('✅ Validation completed successfully!'));
      console.log(chalk.blue('Data and configuration are valid. Ready for rendering.'));
      
    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * Progress callback for rendering
   */
  private onProgress(progress: any): void {
    const { frame, totalFrames, percentage, stage, timeElapsed, estimatedTimeRemaining } = progress;

    // Clear previous line and write new progress
    process.stdout.write('\r\x1b[K');

    let statusColor = chalk.blue;
    switch (stage) {
      case 'bundling':
        statusColor = chalk.yellow;
        break;
      case 'rendering':
        statusColor = chalk.green;
        break;
      case 'cleanup':
        statusColor = chalk.cyan;
        break;
      case 'complete':
        statusColor = chalk.green;
        break;
    }

    const progressBar = this.createProgressBar(percentage, 30);
    const timeStr = this.formatTime(timeElapsed);
    const etaStr = estimatedTimeRemaining ? ` ETA: ${this.formatTime(estimatedTimeRemaining)}` : '';

    if (stage === 'rendering' && totalFrames > 0) {
      process.stdout.write(
        `${statusColor(stage.toUpperCase())}: ${progressBar} ${percentage.toFixed(1)}% (${frame}/${totalFrames}) ${timeStr}${etaStr}`
      );
    } else {
      process.stdout.write(
        `${statusColor(stage.toUpperCase())}: ${progressBar} ${percentage.toFixed(1)}% ${timeStr}`
      );
    }

    if (stage === 'complete') {
      process.stdout.write('\n');
    }
  }

  /**
   * Load configuration file or use defaults
   */
  private async loadConfiguration(configPath?: string): Promise<SimpleConfig> {
    let config: SimpleConfig;

    if (configPath) {
      if (!existsSync(configPath)) {
        throw new Error(`Configuration file not found: ${configPath}`);
      }
      
      try {
        const configData = JSON.parse(readFileSync(configPath, 'utf8'));
        config = this.normalizeConfig(configData);
      } catch (error) {
        throw new Error(`Invalid configuration file: ${error instanceof Error ? error.message : error}`);
      }
    } else {
      // Use default configuration
      config = this.getDefaultConfig();
    }

    return config;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): SimpleConfig {
    return {
      output: {
        filename: 'bar-chart-race.mp4',
        format: 'mp4',
        quality: 'high',
      },
      data: {
        dateColumn: 'Date',
        dateFormat: 'YYYY-MM',
        valueColumns: [], // Will be auto-detected
      },
    };
  }

  /**
   * Normalize configuration from file
   */
  private normalizeConfig(rawConfig: any): SimpleConfig {
    return {
      output: {
        filename: rawConfig.output?.filename || 'bar-chart-race.mp4',
        format: rawConfig.output?.format || 'mp4',
        quality: rawConfig.output?.quality || 'high',
      },
      data: {
        dateColumn: rawConfig.data?.dateColumn || 'Date',
        dateFormat: rawConfig.data?.dateFormat || 'YYYY-MM',
        valueColumns: rawConfig.data?.valueColumns || [],
      },
    };
  }

  /**
   * Validate CSV data file
   */
  private async validateData(dataPath: string, config: SimpleConfig): Promise<void> {
    try {
      const csvContent = readFileSync(dataPath, 'utf8');
      const lines = csvContent.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Check if date column exists
      if (!headers.includes(config.data.dateColumn)) {
        throw new Error(`Date column "${config.data.dateColumn}" not found in CSV headers: ${headers.join(', ')}`);
      }

      // Auto-detect value columns if not specified
      if (config.data.valueColumns.length === 0) {
        config.data.valueColumns = headers.filter(h => h !== config.data.dateColumn);
        if (this.verbose) {
          console.log(chalk.gray(`Auto-detected value columns: ${config.data.valueColumns.join(', ')}`));
        }
      } else {
        // Validate specified value columns
        const missingColumns = config.data.valueColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          throw new Error(`Value columns not found in CSV: ${missingColumns.join(', ')}`);
        }
      }

      if (this.verbose) {
        console.log(chalk.gray(`✓ CSV validation passed - ${lines.length - 1} data rows, ${config.data.valueColumns.length} value columns`));
      }

    } catch (error) {
      throw new Error(`CSV validation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Create ASCII progress bar
   */
  private createProgressBar(percentage: number, length: number): string {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  /**
   * Format time in readable format
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// CLI Program Setup
program
  .name('bar-chart-race')
  .description('Simple Bar Chart Race renderer')
  .version('1.0.0');

// Main render command - simplified interface
program
  .command('render')
  .description('Render bar chart race video from CSV data')
  .argument('<data>', 'CSV data file path')
  .option('-c, --config <path>', 'Configuration file (optional)')
  .option('-o, --output <path>', 'Output video file path')
  .option('-q, --quality <level>', 'Render quality (low, medium, high, max)', 'high')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Validate configuration without rendering')
  .action(async (data: string, options: Omit<SimplifiedRenderOptions, 'data'> & { dryRun?: boolean }) => {
    const cli = new UnifiedBarChartRaceCLI();
    await cli.render({ data, ...options });
  });

// Validate command
program
  .command('validate')
  .description('Validate CSV data and configuration without rendering')
  .argument('<data>', 'CSV data file path')
  .option('-c, --config <path>', 'Configuration file (optional)')
  .option('-v, --verbose', 'Verbose output')
  .action(async (data: string, options: { config?: string; verbose?: boolean }) => {
    const cli = new UnifiedBarChartRaceCLI();
    await cli.validateOnly({ data, ...options });
  });

// Default command - if no command is provided, treat first argument as data file
program
  .argument('[data]', 'CSV data file path')
  .option('-c, --config <path>', 'Configuration file (optional)')
  .option('-o, --output <path>', 'Output video file path')
  .option('-q, --quality <level>', 'Render quality (low, medium, high, max)', 'high')
  .option('-v, --verbose', 'Verbose output')
  .action(async (data?: string, options?: Omit<SimplifiedRenderOptions, 'data'>) => {
    if (data) {
      const cli = new UnifiedBarChartRaceCLI();
      await cli.render({ data, ...options });
    } else {
      program.help();
    }
  });

// Parse CLI arguments
if (require.main === module) {
  program.parse();
}

export { UnifiedBarChartRaceCLI };