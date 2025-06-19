import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { RenderOptions } from '../types';
import { ConfigValidator } from '../validators/configValidator';
import { DataValidator } from '../validators/dataValidator';
import { RenderPipeline } from '../pipeline/renderPipeline';

export const renderCommand = new Command('render')
  .description('Render a bar chart race video from config and data files')
  .requiredOption('-c, --config <path>', 'Config JSON file path')
  .requiredOption('-d, --data <path>', 'CSV data file path')
  .option('-o, --output <path>', 'Output video file path (overrides config)')
  .option('-q, --quality <level>', 'Render quality level', /^(low|medium|high|max)$/i, 'high')
  .option('-p, --parallel <count>', 'Number of parallel workers', (value) => parseInt(value, 10), 1)
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--dry-run', 'Validate configuration without rendering', false)
  .action(async (options: RenderOptions) => {
    const spinner = ora('Starting render process...').start();
    
    try {
      // Validate inputs
      spinner.text = 'Validating configuration...';
      const configValidator = new ConfigValidator();
      const config = await configValidator.loadAndValidate(options.config);
      
      spinner.text = 'Validating data...';
      const dataValidator = new DataValidator();
      await dataValidator.validate(options.data, config);
      
      if (options.dryRun) {
        spinner.succeed(chalk.green('✓ Configuration and data validation passed'));
        console.log(chalk.blue('Dry run completed successfully. No video was rendered.'));
        return;
      }
      
      // Initialize render pipeline
      const pipeline = new RenderPipeline({
        verbose: options.verbose || false,
        onProgress: (progress) => {
          if (options.verbose) {
            spinner.text = `Rendering: ${(progress * 100).toFixed(1)}%`;
          }
        }
      });
      
      // Execute render
      spinner.text = 'Processing data and rendering video...';
      const outputPath = await pipeline.render({
        config,
        data: options.data,
        output: options.output,
        quality: options.quality,
        parallel: options.parallel,
        verbose: options.verbose
      });
      
      spinner.succeed(chalk.green(`✓ Video rendered successfully: ${outputPath}`));
      
      if (options.verbose) {
        console.log(chalk.blue(`\nRender Details:`));
        console.log(chalk.gray(`Config: ${options.config}`));
        console.log(chalk.gray(`Data: ${options.data}`));
        console.log(chalk.gray(`Output: ${outputPath}`));
        console.log(chalk.gray(`Quality: ${options.quality}`));
        console.log(chalk.gray(`Parallel Workers: ${options.parallel}`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red('✗ Render failed'));
      
      if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
        
        if (options.verbose && error.stack) {
          console.error(chalk.gray(error.stack));
        }
      } else {
        console.error(chalk.red('An unknown error occurred'));
      }
      
      process.exit(1);
    }
  });