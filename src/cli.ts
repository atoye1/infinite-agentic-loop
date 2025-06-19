#!/usr/bin/env node

import { program } from 'commander';
import { RenderPipeline, RenderConfig, RenderProgress } from './RenderPipeline';
import { chalk } from './colors';
import path from 'path';
import { existsSync } from 'fs';

interface CLIOptions {
  composition: string;
  output?: string;
  format: 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'max';
  parallel?: number;
  props?: string;
  batch?: string;
  verbose?: boolean;
}

class BarChartRaceCLI {
  private pipeline: RenderPipeline;
  private verbose: boolean = false;

  constructor() {
    this.pipeline = new RenderPipeline(this.onProgress.bind(this));
  }

  /**
   * Progress callback for rendering
   */
  private onProgress(progress: RenderProgress): void {
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
   * List available compositions
   */
  async listCompositions(): Promise<void> {
    try {
      console.log(chalk.blue('📋 Available Compositions:'));
      const compositions = await this.pipeline.getAvailableCompositions();
      
      if (compositions.length === 0) {
        console.log(chalk.yellow('  No compositions found'));
        return;
      }

      compositions.forEach((comp, index) => {
        console.log(chalk.cyan(`  ${index + 1}. ${comp.id}`));
        console.log(chalk.gray(`     Duration: ${comp.durationInFrames} frames @ ${comp.fps} fps (${(comp.durationInFrames / comp.fps).toFixed(1)}s)`));
        console.log(chalk.gray(`     Resolution: ${comp.width}x${comp.height}`));
        if (this.verbose && comp.defaultProps) {
          console.log(chalk.gray(`     Default Props: ${JSON.stringify(comp.defaultProps, null, 2)}`));
        }
        console.log();
      });
    } catch (error) {
      console.error(chalk.red('❌ Error listing compositions:'), error);
      process.exit(1);
    }
  }

  /**
   * Render single composition
   */
  async renderSingle(options: CLIOptions): Promise<void> {
    try {
      // Validate options
      const errors = RenderPipeline.validateConfig({
        compositionId: options.composition,
        outputPath: options.output || '',
        format: options.format,
        quality: options.quality,
        parallel: options.parallel,
      });

      if (errors.length > 0) {
        console.error(chalk.red('❌ Configuration errors:'));
        errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
        process.exit(1);
      }

      // Create output path if not provided
      const outputPath = options.output || RenderPipeline.createOutputPath(
        './output',
        options.composition,
        options.format,
        options.quality
      );

      // Parse props if provided
      let props: Record<string, any> | undefined;
      if (options.props) {
        try {
          props = JSON.parse(options.props);
        } catch (error) {
          console.error(chalk.red('❌ Invalid props JSON:'), error);
          process.exit(1);
        }
      }

      // Create render config
      const config: RenderConfig = {
        compositionId: options.composition,
        outputPath,
        format: options.format,
        quality: options.quality,
        parallel: options.parallel,
        props,
      };

      console.log(chalk.blue('🎬 Starting render...'));
      console.log(chalk.gray(`Composition: ${options.composition}`));
      console.log(chalk.gray(`Output: ${outputPath}`));
      console.log(chalk.gray(`Format: ${options.format.toUpperCase()}`));
      console.log(chalk.gray(`Quality: ${options.quality}`));
      if (options.parallel) {
        console.log(chalk.gray(`Parallel: ${options.parallel}`));
      }
      console.log();

      const result = await this.pipeline.render(config);

      if (result.success) {
        console.log(chalk.green('✅ Render completed successfully!'));
        console.log(chalk.gray(`Output: ${result.outputPath}`));
        if (result.duration) {
          console.log(chalk.gray(`Render time: ${this.formatTime(result.duration)}`));
        }
        if (result.fileSize) {
          console.log(chalk.gray(`File size: ${this.formatFileSize(result.fileSize)}`));
        }
      } else {
        console.error(chalk.red('❌ Render failed:'), result.error?.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    }
  }

  /**
   * Render batch from configuration file
   */
  async renderBatch(batchConfigPath: string): Promise<void> {
    try {
      if (!existsSync(batchConfigPath)) {
        console.error(chalk.red(`❌ Batch config file not found: ${batchConfigPath}`));
        process.exit(1);
      }

      const batchConfig = JSON.parse(await import('fs').then(fs => fs.promises.readFile(batchConfigPath, 'utf-8')));
      
      if (!Array.isArray(batchConfig.renders)) {
        console.error(chalk.red('❌ Batch config must have "renders" array'));
        process.exit(1);
      }

      console.log(chalk.blue(`🎬 Starting batch render (${batchConfig.renders.length} renders)...`));
      console.log();

      const results = await this.pipeline.renderBatch(batchConfig.renders);
      
      let successCount = 0;
      let failedCount = 0;

      results.forEach((result, index) => {
        const config = batchConfig.renders[index];
        if (result.success) {
          successCount++;
          console.log(chalk.green(`✅ ${config.compositionId} → ${result.outputPath}`));
        } else {
          failedCount++;
          console.log(chalk.red(`❌ ${config.compositionId} → ${result.error?.message}`));
        }
      });

      console.log();
      console.log(chalk.blue(`📊 Batch Summary:`));
      console.log(chalk.green(`  Successful: ${successCount}`));
      if (failedCount > 0) {
        console.log(chalk.red(`  Failed: ${failedCount}`));
      }

      if (failedCount > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Batch render error:'), error);
      process.exit(1);
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

  /**
   * Set verbose mode
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
}

// CLI Program Setup
program
  .name('bar-chart-race')
  .description('Render Bar Chart Race videos with Remotion')
  .version('1.0.0');

// List compositions command
program
  .command('list')
  .description('List available compositions')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    const cli = new BarChartRaceCLI();
    cli.setVerbose(options.verbose);
    await cli.listCompositions();
  });

// Render command
program
  .command('render')
  .description('Render a composition to video')
  .requiredOption('-c, --composition <id>', 'Composition ID to render')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (mp4, webm)', 'mp4')
  .option('-q, --quality <quality>', 'Render quality (low, medium, high, max)', 'medium')
  .option('-p, --parallel <number>', 'Number of parallel render processes', parseInt)
  .option('--props <json>', 'Composition props as JSON string')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: CLIOptions) => {
    const cli = new BarChartRaceCLI();
    cli.setVerbose(options.verbose || false);
    await cli.renderSingle(options);
  });

// Batch render command
program
  .command('batch')
  .description('Render multiple compositions from config file')
  .requiredOption('-c, --config <path>', 'Path to batch configuration JSON file')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    const cli = new BarChartRaceCLI();
    cli.setVerbose(options.verbose);
    await cli.renderBatch(options.config);
  });

// Estimate command
program
  .command('estimate')
  .description('Estimate file size for a composition')
  .requiredOption('-c, --composition <id>', 'Composition ID')
  .option('-q, --quality <quality>', 'Render quality (low, medium, high, max)', 'medium')
  .action(async (options) => {
    try {
      const cli = new BarChartRaceCLI();
      const compositions = await cli['pipeline'].getAvailableCompositions();
      const composition = compositions.find(c => c.id === options.composition);
      
      if (!composition) {
        console.error(chalk.red(`❌ Composition '${options.composition}' not found`));
        process.exit(1);
      }

      const estimatedSize = RenderPipeline.estimateFileSize(
        composition.durationInFrames,
        composition.fps,
        options.quality
      );

      console.log(chalk.blue('📊 Size Estimation:'));
      console.log(chalk.gray(`Composition: ${composition.id}`));
      console.log(chalk.gray(`Duration: ${composition.durationInFrames} frames @ ${composition.fps} fps`));
      console.log(chalk.gray(`Quality: ${options.quality}`));
      console.log(chalk.cyan(`Estimated size: ${cli['formatFileSize'](estimatedSize)}`));
    } catch (error) {
      console.error(chalk.red('❌ Estimation error:'), error);
      process.exit(1);
    }
  });

// Parse CLI arguments
if (require.main === module) {
  program.parse();
}

export { BarChartRaceCLI };