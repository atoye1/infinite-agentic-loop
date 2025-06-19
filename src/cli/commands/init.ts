import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';
import * as path from 'path';
import { InitOptions, BarChartRaceConfig } from '../types';

export const initCommand = new Command('init')
  .description('Initialize a new bar chart race project with template files')
  .option('-t, --template <name>', 'Template name to use', 'default')
  .option('-o, --output <dir>', 'Output directory for template files', '.')
  .action(async (options: InitOptions) => {
    const spinner = ora('Initializing bar chart race project...').start();
    
    try {
      const outputDir = options.output || '.';
      const templateName = options.template || 'default';
      
      // Create output directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });
      
      // Generate template files based on template name
      switch (templateName) {
        case 'default':
          await createDefaultTemplate(outputDir);
          break;
        case 'minimal':
          await createMinimalTemplate(outputDir);
          break;
        case 'advanced':
          await createAdvancedTemplate(outputDir);
          break;
        default:
          throw new Error(`Unknown template: ${templateName}. Available templates: default, minimal, advanced`);
      }
      
      spinner.succeed(chalk.green('✓ Project initialized successfully'));
      
      console.log(chalk.blue('\n🎉 Bar Chart Race project created!'));
      console.log(chalk.gray(`\nCreated files in: ${path.resolve(outputDir)}`));
      console.log(chalk.gray('  • config.json - Configuration file'));
      console.log(chalk.gray('  • sample-data.csv - Sample data file'));
      console.log(chalk.gray('  • README.md - Usage instructions'));
      
      console.log(chalk.blue('\n🚀 Next steps:'));
      console.log(chalk.gray('  1. Edit config.json with your preferences'));
      console.log(chalk.gray('  2. Replace sample-data.csv with your data'));
      console.log(chalk.gray('  3. Run: barchart-race validate -c config.json -d sample-data.csv'));
      console.log(chalk.gray('  4. Run: barchart-race render -c config.json -d sample-data.csv'));
      
    } catch (error) {
      spinner.fail(chalk.red('✗ Project initialization failed'));
      
      if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
      } else {
        console.error(chalk.red('An unknown error occurred'));
      }
      
      process.exit(1);
    }
  });

async function createDefaultTemplate(outputDir: string): Promise<void> {
  const configPath = path.join(outputDir, 'config.json');
  const dataPath = path.join(outputDir, 'sample-data.csv');
  const readmePath = path.join(outputDir, 'README.md');
  
  // Default configuration
  const defaultConfig: BarChartRaceConfig = {
    output: {
      filename: 'output.mp4',
      format: 'mp4',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 30,
      quality: 'high'
    },
    data: {
      csvPath: './sample-data.csv',
      dateColumn: 'Date',
      dateFormat: 'YYYY-MM',
      valueColumns: ['YouTube', 'Netflix', 'Disney+', 'HBO Max'],
      interpolation: 'smooth'
    },
    layers: {
      background: {
        color: '#1a1a1a',
        opacity: 100
      },
      chart: {
        position: {
          top: 150,
          right: 50,
          bottom: 100,
          left: 50
        },
        chart: {
          visibleItemCount: 10,
          maxValue: 'local',
          itemSpacing: 20
        },
        animation: {
          type: 'continuous',
          overtakeDuration: 0.5
        },
        bar: {
          colors: 'auto',
          cornerRadius: 10,
          opacity: 100
        },
        labels: {
          title: {
            show: true,
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#ffffff',
            position: 'outside'
          },
          value: {
            show: true,
            fontSize: 20,
            fontFamily: 'Arial',
            color: '#ffffff',
            format: '{value:,.0f}',
            suffix: ' subscribers'
          },
          rank: {
            show: true,
            fontSize: 18,
            backgroundColor: '#333333',
            textColor: '#ffffff'
          }
        }
      },
      title: {
        text: 'Top Streaming Platforms 2020-2024',
        position: {
          top: 50,
          align: 'center'
        },
        style: {
          fontSize: 48,
          fontFamily: 'Arial',
          color: '#ffffff',
          opacity: 100
        },
        timeline: {
          startTime: 0,
          duration: 30
        }
      },
      date: {
        position: {
          bottom: 50,
          right: 50
        },
        format: {
          pattern: 'MMMM YYYY',
          locale: 'en-US'
        },
        style: {
          fontSize: 36,
          fontFamily: 'Arial',
          color: '#ffffff',
          opacity: 80
        },
        animation: {
          type: 'continuous',
          duration: 0.3
        }
      }
    }
  };
  
  // Sample CSV data
  const sampleData = `Date,YouTube,Netflix,Disney+,HBO Max
2020-01,1000000,800000,0,0
2020-02,1200000,850000,100000,50000
2020-03,1400000,900000,200000,100000
2020-04,1600000,950000,300000,150000
2020-05,1800000,1000000,400000,200000
2020-06,2000000,1050000,500000,250000
2020-07,2200000,1100000,600000,300000
2020-08,2400000,1150000,700000,350000
2020-09,2600000,1200000,800000,400000
2020-10,2800000,1250000,900000,450000
2020-11,3000000,1300000,1000000,500000
2020-12,3200000,1350000,1100000,550000`;
  
  // README content
  const readmeContent = `# Bar Chart Race Project

This project was generated using the barchart-race CLI tool.

## Files

- \`config.json\` - Configuration file defining video output settings, data mapping, and visual styling
- \`sample-data.csv\` - Sample CSV data file with time series data
- \`README.md\` - This file

## Usage

### 1. Validate your configuration and data
\`\`\`bash
barchart-race validate --config config.json --data sample-data.csv --verbose
\`\`\`

### 2. Render your video
\`\`\`bash
barchart-race render --config config.json --data sample-data.csv --verbose
\`\`\`

### 3. Advanced options
\`\`\`bash
# High quality render with multiple workers
barchart-race render --config config.json --data sample-data.csv --quality max --parallel 4

# Dry run (validation only)
barchart-race render --config config.json --data sample-data.csv --dry-run

# Custom output file
barchart-race render --config config.json --data sample-data.csv --output my-video.mp4
\`\`\`

## Configuration

Edit \`config.json\` to customize:
- Video dimensions, duration, and quality
- Data column mapping and interpolation
- Visual styling (colors, fonts, positioning)
- Animation settings

## Data Format

Your CSV file should have:
- A date column (format specified in config)
- One or more value columns for the entities to visualize
- Consistent data structure across all rows

## Need Help?

Run any command with \`--help\` for detailed options:
\`\`\`bash
barchart-race --help
barchart-race render --help
barchart-race validate --help
\`\`\`
`;
  
  await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  await fs.writeFile(dataPath, sampleData);
  await fs.writeFile(readmePath, readmeContent);
}

async function createMinimalTemplate(outputDir: string): Promise<void> {
  // Simplified version with minimal configuration
  const configPath = path.join(outputDir, 'config.json');
  const dataPath = path.join(outputDir, 'data.csv');
  
  const minimalConfig = {
    output: {
      filename: 'video.mp4',
      format: 'mp4',
      width: 1280,
      height: 720,
      fps: 24,
      duration: 15,
      quality: 'medium'
    },
    data: {
      csvPath: './data.csv',
      dateColumn: 'Date',
      dateFormat: 'YYYY-MM',
      valueColumns: ['A', 'B', 'C'],
      interpolation: 'linear'
    },
    layers: {
      background: { color: '#000000', opacity: 100 },
      chart: {
        position: { top: 100, right: 50, bottom: 50, left: 50 },
        chart: { visibleItemCount: 5, maxValue: 'local', itemSpacing: 15 },
        animation: { type: 'continuous', overtakeDuration: 0.3 },
        bar: { colors: 'auto', cornerRadius: 5, opacity: 100 },
        labels: {
          title: { show: true, fontSize: 16, fontFamily: 'Arial', color: '#ffffff', position: 'outside' },
          value: { show: true, fontSize: 14, fontFamily: 'Arial', color: '#ffffff', format: '{value}' },
          rank: { show: false, fontSize: 12, backgroundColor: '#333333', textColor: '#ffffff' }
        }
      }
    }
  };
  
  const minimalData = `Date,A,B,C
2024-01,100,200,150
2024-02,120,180,160
2024-03,140,160,170
2024-04,160,140,180
2024-05,180,120,190`;
  
  await fs.writeFile(configPath, JSON.stringify(minimalConfig, null, 2));
  await fs.writeFile(dataPath, minimalData);
}

async function createAdvancedTemplate(outputDir: string): Promise<void> {
  // Full-featured template with all options
  // Implementation would include all possible configuration options
  // This is a placeholder for the advanced template
  await createDefaultTemplate(outputDir);
}