import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BarChartRaceConfig } from '../types';

interface WizardAnswers {
  projectName: string;
  outputFormat: 'mp4' | 'webm';
  videoResolution: string;
  videoDuration: number;
  videoFps: number;
  dataSource: 'csv' | 'api' | 'database';
  csvPath?: string;
  apiEndpoint?: string;
  databaseConfig?: DatabaseConfig;
  chartTheme: string;
  animationStyle: 'smooth' | 'discrete';
  showImages: boolean;
  advancedFeatures: string[];
}

interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  table: string;
  dateColumn: string;
  valueColumns: string[];
}

const VIDEO_RESOLUTIONS = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '4K': { width: 3840, height: 2160 }
};

const CHART_THEMES = {
  'dark-modern': {
    background: '#1a1a1a',
    textColor: '#ffffff',
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd']
  },
  'light-clean': {
    background: '#ffffff',
    textColor: '#333333',
    colors: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']
  },
  'corporate-blue': {
    background: '#f8f9fa',
    textColor: '#2c3e50',
    colors: ['#2980b9', '#3498db', '#5dade2', '#85c1e9', '#aed6f1', '#d6eaf8']
  },
  'vibrant-gradient': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
    colors: ['#ff9a9e', '#a8edea', '#fad0c4', '#ffecd2', '#c3cfe2', '#fbc2eb']
  }
};

export const wizardCommand = new Command('wizard')
  .alias('w')
  .description('Interactive project setup wizard with smart defaults and guidance')
  .option('--preset <name>', 'Use a predefined preset (quick, professional, showcase)')
  .option('--skip-validation', 'Skip data validation during setup')
  .action(async (options) => {
    console.log(chalk.blue.bold('🧙‍♂️ Bar Chart Race Project Wizard'));
    console.log(chalk.gray('Let\'s create your perfect animated chart!\n'));

    try {
      let answers: WizardAnswers;

      if (options.preset) {
        answers = await loadPreset(options.preset);
        console.log(chalk.green(`✓ Loaded preset: ${options.preset}\n`));
      } else {
        answers = await runInteractiveWizard();
      }

      const spinner = ora('Generating project files...').start();
      
      // Create project directory
      const projectDir = path.join(process.cwd(), answers.projectName);
      await fs.mkdir(projectDir, { recursive: true });

      // Generate configuration
      const config = await generateConfig(answers);
      
      // Write configuration file
      const configPath = path.join(projectDir, 'config.json');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));

      // Generate sample data or setup data source
      await setupDataSource(answers, projectDir);

      // Create additional project files
      await createProjectFiles(answers, projectDir);

      // Setup integrations if needed
      if (answers.advancedFeatures.includes('live-preview')) {
        await setupLivePreview(projectDir);
      }

      if (answers.advancedFeatures.includes('version-control')) {
        await setupVersionControl(projectDir);
      }

      spinner.succeed(chalk.green('✓ Project created successfully!'));

      // Show next steps
      displayNextSteps(answers.projectName, projectDir);

    } catch (error) {
      console.error(chalk.red('❌ Wizard failed:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

async function runInteractiveWizard(): Promise<WizardAnswers> {
  return await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What\'s your project name?',
      default: 'my-chart-race',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Project name is required';
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
          return 'Project name can only contain letters, numbers, hyphens, and underscores';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'outputFormat',
      message: 'Choose output format:',
      choices: [
        { name: 'MP4 (Best compatibility)', value: 'mp4' },
        { name: 'WebM (Smaller file size)', value: 'webm' }
      ],
      default: 'mp4'
    },
    {
      type: 'list',
      name: 'videoResolution',
      message: 'Video resolution:',
      choices: [
        { name: '720p HD (1280x720) - Fast rendering', value: '720p' },
        { name: '1080p Full HD (1920x1080) - Recommended', value: '1080p' },
        { name: '1440p QHD (2560x1440) - High quality', value: '1440p' },
        { name: '4K UHD (3840x2160) - Max quality', value: '4K' }
      ],
      default: '1080p'
    },
    {
      type: 'number',
      name: 'videoDuration',
      message: 'Video duration (seconds):',
      default: 30,
      validate: (input) => input > 0 && input <= 3600 ? true : 'Duration must be between 1 and 3600 seconds'
    },
    {
      type: 'list',
      name: 'videoFps',
      message: 'Frame rate (FPS):',
      choices: [
        { name: '24 FPS - Cinematic', value: 24 },
        { name: '30 FPS - Standard', value: 30 },
        { name: '60 FPS - Smooth', value: 60 }
      ],
      default: 30
    },
    {
      type: 'list',
      name: 'dataSource',
      message: 'How will you provide data?',
      choices: [
        { name: 'CSV file - Simple and flexible', value: 'csv' },
        { name: 'REST API - Live data integration', value: 'api' },
        { name: 'Database - Direct database connection', value: 'database' }
      ],
      default: 'csv'
    },
    {
      type: 'input',
      name: 'csvPath',
      message: 'CSV file path (relative to project):',
      default: 'data.csv',
      when: (answers) => answers.dataSource === 'csv'
    },
    {
      type: 'input',
      name: 'apiEndpoint',
      message: 'API endpoint URL:',
      when: (answers) => answers.dataSource === 'api',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'list',
      name: 'chartTheme',
      message: 'Choose a visual theme:',
      choices: [
        { name: 'Dark Modern - Sleek and professional', value: 'dark-modern' },
        { name: 'Light Clean - Bright and minimal', value: 'light-clean' },
        { name: 'Corporate Blue - Business-friendly', value: 'corporate-blue' },
        { name: 'Vibrant Gradient - Eye-catching colors', value: 'vibrant-gradient' }
      ],
      default: 'dark-modern'
    },
    {
      type: 'list',
      name: 'animationStyle',
      message: 'Animation style:',
      choices: [
        { name: 'Smooth - Continuous transitions', value: 'smooth' },
        { name: 'Discrete - Step-by-step changes', value: 'discrete' }
      ],
      default: 'smooth'
    },
    {
      type: 'confirm',
      name: 'showImages',
      message: 'Include images/icons for chart items?',
      default: false
    },
    {
      type: 'checkbox',
      name: 'advancedFeatures',
      message: 'Select advanced features:',
      choices: [
        { name: 'Live Preview Server - Real-time preview while editing', value: 'live-preview' },
        { name: 'Version Control Setup - Git integration and hooks', value: 'version-control' },
        { name: 'Performance Profiling - Render time optimization', value: 'profiling' },
        { name: 'Batch Processing - Multiple configurations', value: 'batch' },
        { name: 'Plugin System - Custom extensions', value: 'plugins' },
        { name: 'Collaboration Tools - Shared configs', value: 'collaboration' }
      ]
    }
  ]);
}

async function loadPreset(presetName: string): Promise<WizardAnswers> {
  const presets = {
    quick: {
      projectName: 'quick-chart',
      outputFormat: 'mp4' as const,
      videoResolution: '1080p',
      videoDuration: 15,
      videoFps: 30,
      dataSource: 'csv' as const,
      csvPath: 'data.csv',
      chartTheme: 'dark-modern',
      animationStyle: 'smooth' as const,
      showImages: false,
      advancedFeatures: []
    },
    professional: {
      projectName: 'professional-chart',
      outputFormat: 'mp4' as const,
      videoResolution: '1080p',
      videoDuration: 30,
      videoFps: 30,
      dataSource: 'csv' as const,
      csvPath: 'data.csv',
      chartTheme: 'corporate-blue',
      animationStyle: 'smooth' as const,
      showImages: true,
      advancedFeatures: ['live-preview', 'version-control', 'profiling']
    },
    showcase: {
      projectName: 'showcase-chart',
      outputFormat: 'mp4' as const,
      videoResolution: '4K',
      videoDuration: 60,
      videoFps: 60,
      dataSource: 'api' as const,
      apiEndpoint: 'https://api.example.com/data',
      chartTheme: 'vibrant-gradient',
      animationStyle: 'smooth' as const,
      showImages: true,
      advancedFeatures: ['live-preview', 'version-control', 'profiling', 'batch', 'plugins']
    }
  };

  const preset = presets[presetName as keyof typeof presets];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}. Available presets: ${Object.keys(presets).join(', ')}`);
  }

  return preset;
}

async function generateConfig(answers: WizardAnswers): Promise<BarChartRaceConfig> {
  const resolution = VIDEO_RESOLUTIONS[answers.videoResolution as keyof typeof VIDEO_RESOLUTIONS];
  const theme = CHART_THEMES[answers.chartTheme as keyof typeof CHART_THEMES];

  const config: BarChartRaceConfig = {
    output: {
      filename: `${answers.projectName}.${answers.outputFormat}`,
      format: answers.outputFormat,
      width: resolution.width,
      height: resolution.height,
      fps: answers.videoFps,
      duration: answers.videoDuration,
      quality: 'high'
    },
    data: {
      csvPath: answers.csvPath || 'data.csv',
      dateColumn: 'Date',
      dateFormat: 'YYYY-MM',
      valueColumns: ['Category A', 'Category B', 'Category C', 'Category D'],
      interpolation: answers.animationStyle === 'smooth' ? 'smooth' : 'linear'
    },
    layers: {
      background: {
        color: theme.background,
        opacity: 100
      },
      chart: {
        position: {
          top: Math.round(resolution.height * 0.15),
          right: Math.round(resolution.width * 0.05),
          bottom: Math.round(resolution.height * 0.15),
          left: Math.round(resolution.width * 0.05)
        },
        chart: {
          visibleItemCount: 10,
          maxValue: 'local',
          itemSpacing: Math.round(resolution.height * 0.02)
        },
        animation: {
          type: answers.animationStyle === 'smooth' ? 'continuous' : 'discrete',
          overtakeDuration: 0.5
        },
        bar: {
          colors: theme.colors,
          cornerRadius: Math.round(resolution.height * 0.008),
          opacity: 90
        },
        labels: {
          title: {
            show: true,
            fontSize: Math.round(resolution.height * 0.025),
            fontFamily: 'Arial',
            color: theme.textColor,
            position: 'outside'
          },
          value: {
            show: true,
            fontSize: Math.round(resolution.height * 0.02),
            fontFamily: 'Arial',
            color: theme.textColor,
            format: '{value:,.0f}'
          },
          rank: {
            show: true,
            fontSize: Math.round(resolution.height * 0.018),
            backgroundColor: '#333333',
            textColor: '#ffffff'
          }
        },
        images: answers.showImages ? {
          show: true,
          mapping: {},
          size: Math.round(resolution.height * 0.04),
          borderRadius: Math.round(resolution.height * 0.02)
        } : undefined
      },
      title: {
        text: `${answers.projectName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Race`,
        position: {
          top: Math.round(resolution.height * 0.05),
          align: 'center'
        },
        style: {
          fontSize: Math.round(resolution.height * 0.045),
          fontFamily: 'Arial',
          color: theme.textColor,
          opacity: 100
        },
        timeline: {
          startTime: 0,
          duration: answers.videoDuration
        }
      },
      date: {
        position: {
          bottom: Math.round(resolution.height * 0.05),
          right: Math.round(resolution.width * 0.05)
        },
        format: {
          pattern: 'MMMM YYYY',
          locale: 'en-US'
        },
        style: {
          fontSize: Math.round(resolution.height * 0.035),
          fontFamily: 'Arial',
          color: theme.textColor,
          opacity: 80
        },
        animation: {
          type: 'continuous',
          duration: 0.3
        }
      }
    }
  };

  return config;
}

async function setupDataSource(answers: WizardAnswers, projectDir: string): Promise<void> {
  switch (answers.dataSource) {
    case 'csv':
      await createSampleCSV(path.join(projectDir, answers.csvPath || 'data.csv'));
      break;
    case 'api':
      await createAPIIntegration(projectDir, answers.apiEndpoint!);
      break;
    case 'database':
      await createDatabaseIntegration(projectDir, answers.databaseConfig!);
      break;
  }
}

async function createSampleCSV(filePath: string): Promise<void> {
  const sampleData = `Date,Category A,Category B,Category C,Category D,Category E
2024-01,1200,800,600,400,200
2024-02,1300,850,650,450,250
2024-03,1400,900,700,500,300
2024-04,1500,950,750,550,350
2024-05,1600,1000,800,600,400
2024-06,1700,1050,850,650,450
2024-07,1800,1100,900,700,500
2024-08,1900,1150,950,750,550
2024-09,2000,1200,1000,800,600
2024-10,2100,1250,1050,850,650
2024-11,2200,1300,1100,900,700
2024-12,2300,1350,1150,950,750`;

  await fs.writeFile(filePath, sampleData);
}

async function createAPIIntegration(projectDir: string, endpoint: string): Promise<void> {
  const apiScript = `#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_ENDPOINT = '${endpoint}';
const OUTPUT_FILE = path.join(__dirname, 'data.csv');

async function fetchData() {
  return new Promise((resolve, reject) => {
    const req = https.get(API_ENDPOINT, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
}

function convertToCSV(data) {
  // Implement conversion logic based on your API response format
  // This is a basic example - customize based on your data structure
  if (!Array.isArray(data)) {
    throw new Error('Expected array data from API');
  }
  
  if (data.length === 0) {
    throw new Error('No data received from API');
  }
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => row[header]).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\\n');
}

async function main() {
  try {
    console.log('Fetching data from API...');
    const data = await fetchData();
    
    console.log('Converting to CSV...');
    const csv = convertToCSV(data);
    
    console.log('Writing to file...');
    fs.writeFileSync(OUTPUT_FILE, csv);
    
    console.log(\`✓ Data saved to \${OUTPUT_FILE}\`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchData, convertToCSV };
`;

  await fs.writeFile(path.join(projectDir, 'fetch-data.js'), apiScript);
  await fs.chmod(path.join(projectDir, 'fetch-data.js'), 0o755);
}

async function createDatabaseIntegration(projectDir: string, config: DatabaseConfig): Promise<void> {
  // Create database connection script
  const dbScript = `#!/usr/bin/env node

// Database integration script
// Install required dependencies: npm install mysql2 pg sqlite3
// Choose the appropriate driver based on your database type

const fs = require('fs');
const path = require('path');

const DATABASE_CONFIG = ${JSON.stringify(config, null, 2)};
const OUTPUT_FILE = path.join(__dirname, 'data.csv');

async function connectAndFetch() {
  let connection;
  let rows;
  
  try {
    switch (DATABASE_CONFIG.type) {
      case 'mysql':
        const mysql = require('mysql2/promise');
        connection = await mysql.createConnection({
          host: DATABASE_CONFIG.host,
          port: DATABASE_CONFIG.port || 3306,
          user: DATABASE_CONFIG.username,
          password: DATABASE_CONFIG.password,
          database: DATABASE_CONFIG.database
        });
        
        const query = \`SELECT \${DATABASE_CONFIG.dateColumn}, \${DATABASE_CONFIG.valueColumns.join(', ')} FROM \${DATABASE_CONFIG.table} ORDER BY \${DATABASE_CONFIG.dateColumn}\`;
        [rows] = await connection.execute(query);
        break;
        
      case 'postgresql':
        const { Client } = require('pg');
        connection = new Client({
          host: DATABASE_CONFIG.host,
          port: DATABASE_CONFIG.port || 5432,
          user: DATABASE_CONFIG.username,
          password: DATABASE_CONFIG.password,
          database: DATABASE_CONFIG.database
        });
        
        await connection.connect();
        const pgQuery = \`SELECT \${DATABASE_CONFIG.dateColumn}, \${DATABASE_CONFIG.valueColumns.join(', ')} FROM \${DATABASE_CONFIG.table} ORDER BY \${DATABASE_CONFIG.dateColumn}\`;
        const result = await connection.query(pgQuery);
        rows = result.rows;
        break;
        
      case 'sqlite':
        const sqlite3 = require('sqlite3');
        const { open } = require('sqlite');
        
        connection = await open({
          filename: DATABASE_CONFIG.database,
          driver: sqlite3.Database
        });
        
        const sqliteQuery = \`SELECT \${DATABASE_CONFIG.dateColumn}, \${DATABASE_CONFIG.valueColumns.join(', ')} FROM \${DATABASE_CONFIG.table} ORDER BY \${DATABASE_CONFIG.dateColumn}\`;
        rows = await connection.all(sqliteQuery);
        break;
        
      default:
        throw new Error(\`Unsupported database type: \${DATABASE_CONFIG.type}\`);
    }
    
    return rows;
    
  } finally {
    if (connection) {
      if (DATABASE_CONFIG.type === 'mysql') {
        await connection.end();
      } else if (DATABASE_CONFIG.type === 'postgresql') {
        await connection.end();
      } else if (DATABASE_CONFIG.type === 'sqlite') {
        await connection.close();
      }
    }
  }
}

function convertToCSV(rows) {
  if (!rows || rows.length === 0) {
    throw new Error('No data retrieved from database');
  }
  
  const headers = Object.keys(rows[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = rows.map(row => 
    headers.map(header => row[header]).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\\n');
}

async function main() {
  try {
    console.log('Connecting to database...');
    const rows = await connectAndFetch();
    
    console.log(\`Retrieved \${rows.length} rows\`);
    
    console.log('Converting to CSV...');
    const csv = convertToCSV(rows);
    
    console.log('Writing to file...');
    fs.writeFileSync(OUTPUT_FILE, csv);
    
    console.log(\`✓ Data saved to \${OUTPUT_FILE}\`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { connectAndFetch, convertToCSV };
`;

  await fs.writeFile(path.join(projectDir, 'fetch-database.js'), dbScript);
  await fs.chmod(path.join(projectDir, 'fetch-database.js'), 0o755);
}

async function createProjectFiles(answers: WizardAnswers, projectDir: string): Promise<void> {
  // Create package.json
  const packageJson = {
    name: answers.projectName,
    version: '1.0.0',
    description: `Bar Chart Race project: ${answers.projectName}`,
    scripts: {
      'fetch-data': answers.dataSource === 'api' ? 'node fetch-data.js' : 
                    answers.dataSource === 'database' ? 'node fetch-database.js' : 
                    'echo "Using CSV data"',
      'validate': 'barchart-race validate --config config.json --data data.csv',
      'render': 'barchart-race render --config config.json --data data.csv',
      'render-hq': 'barchart-race render --config config.json --data data.csv --quality max',
      'preview': answers.advancedFeatures.includes('live-preview') ? 'barchart-race preview --config config.json --data data.csv' : 'echo "Live preview not enabled"'
    },
    dependencies: {},
    devDependencies: {}
  };

  // Add database dependencies if needed
  if (answers.dataSource === 'database') {
    packageJson.dependencies = {
      mysql2: '^3.6.0',
      pg: '^8.11.0',
      sqlite3: '^5.1.6',
      sqlite: '^5.0.1'
    };
  }

  await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create README.md
  const readme = `# ${answers.projectName}

An animated bar chart race video project created with the Bar Chart Race CLI.

## Quick Start

1. **Install dependencies** (if using database integration):
   \`\`\`bash
   npm install
   \`\`\`

2. **Prepare your data**:
   ${answers.dataSource === 'csv' ? '- Edit `data.csv` with your data' : 
     answers.dataSource === 'api' ? '- Run `npm run fetch-data` to get data from API' :
     '- Run `npm run fetch-data` to get data from database'}

3. **Validate configuration**:
   \`\`\`bash
   npm run validate
   \`\`\`

4. **Render your video**:
   \`\`\`bash
   npm run render
   \`\`\`

## Project Configuration

- **Video Format**: ${answers.outputFormat.toUpperCase()}
- **Resolution**: ${answers.videoResolution}
- **Duration**: ${answers.videoDuration} seconds
- **Frame Rate**: ${answers.videoFps} FPS
- **Theme**: ${answers.chartTheme}
- **Animation**: ${answers.animationStyle}

## Advanced Features

${answers.advancedFeatures.length > 0 ? answers.advancedFeatures.map(feature => `- ${feature}`).join('\n') : 'None selected'}

## Commands

- \`npm run validate\` - Validate configuration and data
- \`npm run render\` - Render video with standard quality
- \`npm run render-hq\` - Render video with maximum quality
${answers.advancedFeatures.includes('live-preview') ? '- `npm run preview` - Start live preview server' : ''}
${answers.dataSource !== 'csv' ? '- `npm run fetch-data` - Fetch data from configured source' : ''}

## File Structure

\`\`\`
${answers.projectName}/
├── config.json          # Video and styling configuration
├── data.csv             # Data file (generated or provided)
├── package.json         # Project dependencies and scripts
${answers.dataSource === 'api' ? '├── fetch-data.js        # API data fetching script' : ''}
${answers.dataSource === 'database' ? '├── fetch-database.js   # Database integration script' : ''}
${answers.advancedFeatures.includes('live-preview') ? '├── preview-server.js    # Live preview server' : ''}
└── README.md            # This file
\`\`\`

## Need Help?

Run any command with \`--help\` for detailed options:

\`\`\`bash
barchart-race --help
barchart-race render --help
barchart-race validate --help
\`\`\`
`;

  await fs.writeFile(path.join(projectDir, 'README.md'), readme);
}

async function setupLivePreview(projectDir: string): Promise<void> {
  const previewServer = `#!/usr/bin/env node

const express = require('express');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;

// WebSocket server for live reload
const wss = new WebSocket.Server({ port: 3001 });

// Serve static files
app.use(express.static('.'));

// Main preview page
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bar Chart Race Preview</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .preview-area { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .controls { margin-bottom: 20px; }
        button { padding: 10px 20px; margin-right: 10px; border: none; border-radius: 4px; cursor: pointer; }
        .primary { background: #007bff; color: white; }
        .secondary { background: #6c757d; color: white; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .loading { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        #output { font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎬 Bar Chart Race Live Preview</h1>
        
        <div class="controls">
          <button class="primary" onclick="validateConfig()">Validate Config</button>
          <button class="primary" onclick="renderPreview()">Render Preview</button>
          <button class="secondary" onclick="renderFull()">Render Full Quality</button>
          <button class="secondary" onclick="clearOutput()">Clear Output</button>
        </div>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <div class="preview-area">
          <h3>Configuration</h3>
          <pre id="config-preview">Loading...</pre>
          
          <h3>Output</h3>
          <div id="output">Ready to render...</div>
        </div>
      </div>
      
      <script>
        const ws = new WebSocket('ws://localhost:3001');
        
        ws.onmessage = function(event) {
          const data = JSON.parse(event.data);
          if (data.type === 'reload') {
            location.reload();
          } else if (data.type === 'config-changed') {
            loadConfig();
          }
        };
        
        function showStatus(message, type = 'loading') {
          const status = document.getElementById('status');
          status.textContent = message;
          status.className = 'status ' + type;
          status.style.display = 'block';
        }
        
        function hideStatus() {
          document.getElementById('status').style.display = 'none';
        }
        
        function appendOutput(text) {
          const output = document.getElementById('output');
          output.textContent += text + '\\n';
          output.scrollTop = output.scrollHeight;
        }
        
        function clearOutput() {
          document.getElementById('output').textContent = '';
        }
        
        function loadConfig() {
          fetch('/config.json')
            .then(response => response.json())
            .then(config => {
              document.getElementById('config-preview').textContent = JSON.stringify(config, null, 2);
            })
            .catch(error => {
              document.getElementById('config-preview').textContent = 'Error loading config: ' + error.message;
            });
        }
        
        function validateConfig() {
          showStatus('Validating configuration...', 'loading');
          clearOutput();
          
          fetch('/api/validate', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showStatus('Configuration is valid!', 'success');
                appendOutput(data.output);
              } else {
                showStatus('Configuration has errors', 'error');
                appendOutput(data.error);
              }
            })
            .catch(error => {
              showStatus('Validation failed', 'error');
              appendOutput('Error: ' + error.message);
            });
        }
        
        function renderPreview() {
          showStatus('Rendering preview...', 'loading');
          clearOutput();
          
          fetch('/api/render-preview', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showStatus('Preview rendered successfully!', 'success');
                appendOutput(data.output);
              } else {
                showStatus('Render failed', 'error');
                appendOutput(data.error);
              }
            })
            .catch(error => {
              showStatus('Render failed', 'error');
              appendOutput('Error: ' + error.message);
            });
        }
        
        function renderFull() {
          showStatus('Rendering full quality video...', 'loading');
          clearOutput();
          
          fetch('/api/render-full', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showStatus('Full render completed!', 'success');
                appendOutput(data.output);
              } else {
                showStatus('Render failed', 'error');
                appendOutput(data.error);
              }
            })
            .catch(error => {
              showStatus('Render failed', 'error');
              appendOutput('Error: ' + error.message);
            });
        }
        
        // Load initial config
        loadConfig();
      </script>
    </body>
    </html>
  \`);
});

// API endpoints
app.post('/api/validate', (req, res) => {
  exec('barchart-race validate --config config.json --data data.csv', (error, stdout, stderr) => {
    if (error) {
      res.json({ success: false, error: stderr || error.message });
    } else {
      res.json({ success: true, output: stdout });
    }
  });
});

app.post('/api/render-preview', (req, res) => {
  exec('barchart-race render --config config.json --data data.csv --quality low --output preview.mp4', (error, stdout, stderr) => {
    if (error) {
      res.json({ success: false, error: stderr || error.message });
    } else {
      res.json({ success: true, output: stdout });
    }
  });
});

app.post('/api/render-full', (req, res) => {
  exec('barchart-race render --config config.json --data data.csv --quality max', (error, stdout, stderr) => {
    if (error) {
      res.json({ success: false, error: stderr || error.message });
    } else {
      res.json({ success: true, output: stdout });
    }
  });
});

// Watch for file changes
const watcher = chokidar.watch(['config.json', 'data.csv'], {
  ignored: /node_modules/,
  persistent: true
});

watcher.on('change', (path) => {
  console.log(\`File changed: \${path}\`);
  
  // Broadcast change to all connected clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'config-changed',
        file: path
      }));
    }
  });
});

app.listen(PORT, () => {
  console.log(\`📺 Preview server running at http://localhost:\${PORT}\`);
  console.log(\`👀 Watching for file changes...\`);
});
`;

  await fs.writeFile(path.join(projectDir, 'preview-server.js'), previewServer);
  await fs.chmod(path.join(projectDir, 'preview-server.js'), 0o755);

  // Add preview dependencies to package.json
  const packageJsonPath = path.join(projectDir, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  
  packageJson.dependencies = {
    ...packageJson.dependencies,
    express: '^4.18.2',
    chokidar: '^3.5.3',
    ws: '^8.13.0'
  };
  
  packageJson.scripts.preview = 'node preview-server.js';
  
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

async function setupVersionControl(projectDir: string): Promise<void> {
  // Initialize git repository
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    await execAsync('git init', { cwd: projectDir });
    
    // Create .gitignore
    const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Output files
*.mp4
*.webm
*.mov
*.avi

# Temporary files
*.tmp
*.temp
preview.*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# Log files
*.log

# Environment variables
.env
.env.local
.env.*.local

# Cache
.cache/
.parcel-cache/
`;

    await fs.writeFile(path.join(projectDir, '.gitignore'), gitignore);
    
    // Create pre-commit hook for validation
    const hooksDir = path.join(projectDir, '.git', 'hooks');
    await fs.mkdir(hooksDir, { recursive: true });
    
    const preCommitHook = `#!/bin/sh
# Pre-commit hook for Bar Chart Race project

echo "🔍 Running pre-commit validation..."

# Check if config.json exists and is valid
if [ -f "config.json" ]; then
  echo "✓ Config file exists"
  
  # Validate JSON syntax
  if ! python -m json.tool config.json > /dev/null 2>&1; then
    echo "❌ config.json has invalid JSON syntax"
    exit 1
  fi
  
  echo "✓ Config JSON is valid"
else
  echo "❌ config.json not found"
  exit 1
fi

# Check if data file exists
if [ -f "data.csv" ]; then
  echo "✓ Data file exists"
else
  echo "⚠️  data.csv not found (this might be OK if using API/database)"
fi

# Run validation if barchart-race CLI is available
if command -v barchart-race > /dev/null 2>&1; then
  echo "🔍 Running configuration validation..."
  if barchart-race validate --config config.json --data data.csv; then
    echo "✅ Pre-commit validation passed"
  else
    echo "❌ Pre-commit validation failed"
    exit 1
  fi
else
  echo "⚠️  barchart-race CLI not found, skipping validation"
fi

exit 0
`;

    await fs.writeFile(path.join(hooksDir, 'pre-commit'), preCommitHook);
    await fs.chmod(path.join(hooksDir, 'pre-commit'), 0o755);
    
    console.log(chalk.green('✓ Git repository initialized with pre-commit hooks'));
    
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Git setup failed:', error instanceof Error ? error.message : error));
  }
}

function displayNextSteps(projectName: string, projectDir: string): void {
  console.log(chalk.blue.bold('\n🎉 Project created successfully!'));
  console.log(chalk.gray(`Created in: ${projectDir}\n`));
  
  console.log(chalk.blue.bold('📋 Next Steps:'));
  console.log(chalk.cyan('1.'), 'Navigate to your project:');
  console.log(chalk.gray(`   cd ${projectName}\n`));
  
  console.log(chalk.cyan('2.'), 'Install dependencies (if needed):');
  console.log(chalk.gray('   npm install\n'));
  
  console.log(chalk.cyan('3.'), 'Prepare your data:');
  console.log(chalk.gray('   - Edit data.csv with your data'));
  console.log(chalk.gray('   - Or run npm run fetch-data for API/database integration\n'));
  
  console.log(chalk.cyan('4.'), 'Validate your setup:');
  console.log(chalk.gray('   npm run validate\n'));
  
  console.log(chalk.cyan('5.'), 'Render your video:');
  console.log(chalk.gray('   npm run render\n'));
  
  console.log(chalk.blue.bold('🔗 Useful Commands:'));
  console.log(chalk.gray('   npm run validate    - Check configuration and data'));
  console.log(chalk.gray('   npm run render      - Render with standard quality'));
  console.log(chalk.gray('   npm run render-hq   - Render with maximum quality'));
  console.log(chalk.gray('   npm run preview     - Start live preview server (if enabled)'));
  
  console.log(chalk.green.bold('\n✨ Happy charting!'));
}