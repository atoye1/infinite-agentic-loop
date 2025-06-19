import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ValidateOptions } from '../types';
import { ConfigValidator } from '../validators/configValidator';
import { DataValidator } from '../validators/dataValidator';

export const validateCommand = new Command('validate')
  .description('Validate configuration and data files without rendering')
  .requiredOption('-c, --config <path>', 'Config JSON file path')
  .requiredOption('-d, --data <path>', 'CSV data file path')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options: ValidateOptions) => {
    const spinner = ora('Starting validation...').start();
    
    try {
      // Validate configuration
      spinner.text = 'Validating configuration file...';
      const configValidator = new ConfigValidator();
      const config = await configValidator.loadAndValidate(options.config);
      
      if (options.verbose) {
        console.log(chalk.blue('\n📋 Configuration Summary:'));
        console.log(chalk.gray(`  Output Format: ${config.output.format}`));
        console.log(chalk.gray(`  Dimensions: ${config.output.width}x${config.output.height}`));
        console.log(chalk.gray(`  FPS: ${config.output.fps}`));
        console.log(chalk.gray(`  Duration: ${config.output.duration}s`));
        console.log(chalk.gray(`  Quality: ${config.output.quality}`));
        console.log(chalk.gray(`  Date Column: ${config.data.dateColumn}`));
        console.log(chalk.gray(`  Value Columns: ${config.data.valueColumns.join(', ')}`));
        console.log(chalk.gray(`  Interpolation: ${config.data.interpolation}`));
      }
      
      // Validate data
      spinner.text = 'Validating data file...';
      const dataValidator = new DataValidator();
      const dataInfo = await dataValidator.validate(options.data, config);
      
      if (options.verbose) {
        console.log(chalk.blue('\n📊 Data Summary:'));
        console.log(chalk.gray(`  Total Rows: ${dataInfo.totalRows}`));
        console.log(chalk.gray(`  Date Range: ${dataInfo.dateRange.start} to ${dataInfo.dateRange.end}`));
        console.log(chalk.gray(`  Value Columns Found: ${dataInfo.valueColumnsFound.join(', ')}`));
        console.log(chalk.gray(`  Missing Values: ${dataInfo.missingValues}`));
        console.log(chalk.gray(`  Data Quality: ${dataInfo.quality}`));
      }
      
      // Check compatibility
      spinner.text = 'Checking configuration and data compatibility...';
      await validateCompatibility(config, dataInfo);
      
      spinner.succeed(chalk.green('✓ All validation checks passed'));
      
      console.log(chalk.green('\n🎉 Configuration and data are valid!'));
      console.log(chalk.blue('You can now run the render command to generate your video.'));
      
    } catch (error) {
      spinner.fail(chalk.red('✗ Validation failed'));
      
      if (error instanceof Error) {
        console.error(chalk.red(`\nError: ${error.message}`));
        
        if (options.verbose && error.stack) {
          console.error(chalk.gray(error.stack));
        }
      } else {
        console.error(chalk.red('\nAn unknown error occurred'));
      }
      
      // Provide helpful suggestions
      console.log(chalk.yellow('\n💡 Suggestions:'));
      console.log(chalk.gray('  • Check file paths are correct'));
      console.log(chalk.gray('  • Verify JSON syntax in config file'));
      console.log(chalk.gray('  • Ensure CSV has proper headers'));
      console.log(chalk.gray('  • Use --verbose for detailed error information'));
      
      process.exit(1);
    }
  });

async function validateCompatibility(config: any, dataInfo: any): Promise<void> {
  // Check if date column exists in data
  if (!dataInfo.headers.includes(config.data.dateColumn)) {
    throw new Error(`Date column "${config.data.dateColumn}" not found in CSV data`);
  }
  
  // Check if all value columns exist
  const missingColumns = config.data.valueColumns.filter(
    (col: string) => !dataInfo.headers.includes(col)
  );
  
  if (missingColumns.length > 0) {
    throw new Error(`Value columns not found in CSV data: ${missingColumns.join(', ')}`);
  }
  
  // Check minimum data requirements
  if (dataInfo.totalRows < 2) {
    throw new Error('CSV must contain at least 2 data rows for animation');
  }
  
  // Validate video duration vs data points
  const estimatedFrames = config.output.fps * config.output.duration;
  if (estimatedFrames < dataInfo.totalRows) {
    console.warn(chalk.yellow(`⚠️  Warning: Video duration (${config.output.duration}s) may be too short for ${dataInfo.totalRows} data points`));
  }
}