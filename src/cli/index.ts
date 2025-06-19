#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { renderCommand } from './commands/render';
import { validateCommand } from './commands/validate';
import { initCommand } from './commands/init';

const program = new Command();

// Configure main program
program
  .name('barchart-race')
  .description('CLI tool for generating Bar Chart Race videos with Remotion.js')
  .version('1.0.0')
  .configureOutput({
    outputError: (str, write) => write(chalk.red(str))
  });

// Add commands
program.addCommand(renderCommand);
program.addCommand(validateCommand);
program.addCommand(initCommand);

// Global error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('💥 Unexpected error:'), error.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('💥 Unhandled rejection at:'), promise);
  console.error(chalk.red('Reason:'), reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}