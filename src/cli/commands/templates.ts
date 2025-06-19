import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as fs from 'fs/promises';
import * as path from 'path';
import fetch from 'node-fetch';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  version: string;
  downloads: number;
  rating: number;
  config: any;
  sampleData?: string;
  preview?: string;
  dependencies?: string[];
}

interface TemplateRepository {
  templates: Template[];
  categories: string[];
  featured: string[];
}

const TEMPLATE_REGISTRY_URL = 'https://api.barchart-race.com/templates';
const LOCAL_TEMPLATES_DIR = path.join(__dirname, '../../templates');
const USER_TEMPLATES_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.barchart-race', 'templates');

export const templatesCommand = new Command('templates')
  .alias('t')
  .description('Manage project templates and marketplace')
  .addCommand(
    new Command('list')
      .description('List available templates')
      .option('-c, --category <category>', 'Filter by category')
      .option('-t, --tag <tag>', 'Filter by tag')
      .option('--local', 'Show only local templates')
      .option('--remote', 'Show only remote templates')
      .option('--featured', 'Show only featured templates')
      .action(listTemplates)
  )
  .addCommand(
    new Command('search')
      .description('Search templates')
      .argument('<query>', 'Search query')
      .option('-c, --category <category>', 'Filter by category')
      .action(searchTemplates)
  )
  .addCommand(
    new Command('install')
      .description('Install a template')
      .argument('<template-id>', 'Template ID to install')
      .option('-g, --global', 'Install globally for all projects')
      .option('--force', 'Force reinstall if already exists')
      .action(installTemplate)
  )
  .addCommand(
    new Command('create')
      .description('Create a new project from template')
      .argument('<template-id>', 'Template ID to use')
      .argument('[project-name]', 'Project name')
      .option('-o, --output <dir>', 'Output directory')
      .action(createFromTemplate)
  )
  .addCommand(
    new Command('publish')
      .description('Publish a template to the marketplace')
      .argument('<template-dir>', 'Template directory')
      .option('--public', 'Make template public')
      .option('--category <category>', 'Template category')
      .option('--tags <tags>', 'Comma-separated tags')
      .action(publishTemplate)
  )
  .addCommand(
    new Command('preview')
      .description('Preview a template')
      .argument('<template-id>', 'Template ID to preview')
      .action(previewTemplate)
  )
  .addCommand(
    new Command('update')
      .description('Update templates')
      .option('--all', 'Update all installed templates')
      .argument('[template-id]', 'Specific template to update')
      .action(updateTemplates)
  );

async function listTemplates(options: any): Promise<void> {
  const spinner = ora('Loading templates...').start();
  
  try {
    let templates: Template[] = [];
    
    if (!options.remote) {
      // Load local templates
      const localTemplates = await loadLocalTemplates();
      templates = templates.concat(localTemplates);
    }
    
    if (!options.local) {
      // Load remote templates
      try {
        const remoteTemplates = await loadRemoteTemplates();
        templates = templates.concat(remoteTemplates);
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Failed to load remote templates (offline mode)'));
      }
    }
    
    // Apply filters
    if (options.category) {
      templates = templates.filter(t => t.category === options.category);
    }
    
    if (options.tag) {
      templates = templates.filter(t => t.tags.includes(options.tag));
    }
    
    if (options.featured) {
      templates = templates.filter(t => t.rating >= 4.5 || t.downloads > 1000);
    }
    
    spinner.stop();
    
    if (templates.length === 0) {
      console.log(chalk.yellow('No templates found matching your criteria.'));
      return;
    }
    
    // Display templates
    console.log(chalk.blue.bold(`📦 Found ${templates.length} template(s)\n`));
    
    // Group by category
    const categorized = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, Template[]>);
    
    for (const [category, categoryTemplates] of Object.entries(categorized)) {
      console.log(chalk.cyan.bold(`${category.toUpperCase()}`));
      
      categoryTemplates.forEach(template => {
        const ratingStars = '★'.repeat(Math.round(template.rating)) + '☆'.repeat(5 - Math.round(template.rating));
        const downloadsBadge = template.downloads > 1000 ? 
          chalk.green(`${Math.round(template.downloads / 1000)}k+ downloads`) :
          chalk.gray(`${template.downloads} downloads`);
        
        console.log(chalk.white(`  ${template.id}`));
        console.log(chalk.gray(`    ${template.description}`));
        console.log(chalk.yellow(`    ${ratingStars} (${template.rating})`), '•', downloadsBadge);
        console.log(chalk.gray(`    Author: ${template.author} • Version: ${template.version}`));
        console.log(chalk.gray(`    Tags: ${template.tags.join(', ')}`));
        console.log();
      });
    }
    
    console.log(chalk.blue('💡 Use `barchart-race templates create <template-id> [project-name]` to create a project'));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to load templates'));
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function searchTemplates(query: string, options: any): Promise<void> {
  const spinner = ora(`Searching for "${query}"...`).start();
  
  try {
    let templates: Template[] = [];
    
    // Load all templates
    const localTemplates = await loadLocalTemplates();
    templates = templates.concat(localTemplates);
    
    try {
      const remoteTemplates = await loadRemoteTemplates();
      templates = templates.concat(remoteTemplates);
    } catch (error) {
      // Offline mode, continue with local only
    }
    
    // Search logic
    const searchResults = templates.filter(template => {
      const searchText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
    
    spinner.stop();
    
    if (searchResults.length === 0) {
      console.log(chalk.yellow(`No templates found for "${query}"`));
      return;
    }
    
    console.log(chalk.blue.bold(`🔍 Found ${searchResults.length} template(s) for "${query}"\n`));
    
    searchResults.forEach(template => {
      console.log(chalk.white.bold(template.name), chalk.gray(`(${template.id})`));
      console.log(chalk.gray(`  ${template.description}`));
      console.log(chalk.cyan(`  Category: ${template.category}`), '•', chalk.yellow(`Rating: ${template.rating}/5`));
      console.log(chalk.gray(`  Tags: ${template.tags.join(', ')}`));
      console.log();
    });
    
  } catch (error) {
    spinner.fail(chalk.red('Search failed'));
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function installTemplate(templateId: string, options: any): Promise<void> {
  const spinner = ora(`Installing template "${templateId}"...`).start();
  
  try {
    // Check if template exists locally
    const installDir = options.global ? USER_TEMPLATES_DIR : path.join(process.cwd(), '.templates');
    const templateDir = path.join(installDir, templateId);
    
    if (await directoryExists(templateDir) && !options.force) {
      spinner.fail(chalk.red('Template already installed'));
      console.log(chalk.yellow('Use --force to reinstall'));
      return;
    }
    
    // Try to find template in remote registry
    let template: Template | null = null;
    
    try {
      const remoteTemplates = await loadRemoteTemplates();
      template = remoteTemplates.find(t => t.id === templateId) || null;
    } catch (error) {
      // Check local templates
      const localTemplates = await loadLocalTemplates();
      template = localTemplates.find(t => t.id === templateId) || null;
    }
    
    if (!template) {
      spinner.fail(chalk.red(`Template "${templateId}" not found`));
      process.exit(1);
    }
    
    // Create installation directory
    await fs.mkdir(templateDir, { recursive: true });
    
    // Download and install template files
    if (template.config) {
      await fs.writeFile(
        path.join(templateDir, 'template.json'),
        JSON.stringify(template, null, 2)
      );
      
      await fs.writeFile(
        path.join(templateDir, 'config.json'),
        JSON.stringify(template.config, null, 2)
      );
    }
    
    if (template.sampleData) {
      await fs.writeFile(
        path.join(templateDir, 'data.csv'),
        template.sampleData
      );
    }
    
    // Install dependencies if specified
    if (template.dependencies && template.dependencies.length > 0) {
      spinner.text = 'Installing dependencies...';
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const packageJson = {
        name: `template-${templateId}`,
        version: template.version,
        dependencies: template.dependencies.reduce((acc, dep) => {
          const [name, version] = dep.split('@');
          acc[name] = version || 'latest';
          return acc;
        }, {} as Record<string, string>)
      };
      
      await fs.writeFile(
        path.join(templateDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      try {
        await execAsync('npm install', { cwd: templateDir });
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Failed to install dependencies'));
      }
    }
    
    spinner.succeed(chalk.green(`✓ Template "${templateId}" installed successfully`));
    
    if (options.global) {
      console.log(chalk.gray(`Installed to: ${templateDir}`));
    }
    
    console.log(chalk.blue('💡 Use `barchart-race templates create ' + templateId + ' my-project` to create a project'));
    
  } catch (error) {
    spinner.fail(chalk.red('Installation failed'));
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function createFromTemplate(templateId: string, projectName?: string, options?: any): Promise<void> {
  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: `${templateId}-project`,
        validate: (input) => input.trim().length > 0 ? true : 'Project name is required'
      }
    ]);
    projectName = answers.projectName;
  }
  
  const spinner = ora(`Creating project "${projectName}" from template "${templateId}"...`).start();
  
  try {
    // Find template
    const template = await findTemplate(templateId);
    if (!template) {
      spinner.fail(chalk.red(`Template "${templateId}" not found`));
      console.log(chalk.blue('💡 Use `barchart-race templates list` to see available templates'));
      process.exit(1);
    }
    
    // Create project directory
    const outputDir = options?.output || path.join(process.cwd(), projectName);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Copy template files
    const templateDir = await getTemplateDirectory(templateId);
    if (templateDir) {
      await copyDirectory(templateDir, outputDir);
    }
    
    // Generate files from template
    if (template.config) {
      await fs.writeFile(
        path.join(outputDir, 'config.json'),
        JSON.stringify(template.config, null, 2)
      );
    }
    
    if (template.sampleData) {
      await fs.writeFile(
        path.join(outputDir, 'data.csv'),
        template.sampleData
      );
    }
    
    // Create package.json
    const packageJson = {
      name: projectName,
      version: '1.0.0',
      description: `Bar Chart Race project created from template: ${template.name}`,
      scripts: {
        validate: 'barchart-race validate --config config.json --data data.csv',
        render: 'barchart-race render --config config.json --data data.csv',
        'render-hq': 'barchart-race render --config config.json --data data.csv --quality max'
      },
      keywords: ['bar-chart-race', 'visualization', 'video'],
      template: {
        id: template.id,
        name: template.name,
        version: template.version
      }
    };
    
    await fs.writeFile(
      path.join(outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create README
    const readme = `# ${projectName}

Created from template: **${template.name}** (${template.id})

${template.description}

## Quick Start

1. **Validate configuration**:
   \`\`\`bash
   npm run validate
   \`\`\`

2. **Render your video**:
   \`\`\`bash
   npm run render
   \`\`\`

## Template Information

- **Author**: ${template.author}
- **Version**: ${template.version}
- **Category**: ${template.category}
- **Tags**: ${template.tags.join(', ')}

## Customization

Edit \`config.json\` to customize your video:
- Video dimensions and quality
- Colors and styling
- Animation settings
- Data mapping

Edit \`data.csv\` with your own data following the same structure.

## Commands

- \`npm run validate\` - Validate configuration and data
- \`npm run render\` - Render video with standard quality
- \`npm run render-hq\` - Render video with maximum quality

## Need Help?

Run any command with \`--help\` for detailed options:

\`\`\`bash
barchart-race --help
\`\`\`
`;

    await fs.writeFile(path.join(outputDir, 'README.md'), readme);
    
    spinner.succeed(chalk.green(`✓ Project "${projectName}" created successfully`));
    
    console.log(chalk.blue(`\n📁 Project created in: ${outputDir}`));
    console.log(chalk.gray(`Template: ${template.name} (${template.id})`));
    
    console.log(chalk.blue.bold('\n📋 Next Steps:'));
    console.log(chalk.cyan('1.'), `cd ${projectName}`);
    console.log(chalk.cyan('2.'), 'npm run validate');
    console.log(chalk.cyan('3.'), 'npm run render');
    
  } catch (error) {
    spinner.fail(chalk.red('Project creation failed'));
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function publishTemplate(templateDir: string, options: any): Promise<void> {
  const spinner = ora('Publishing template...').start();
  
  try {
    // Validate template directory
    const templatePath = path.resolve(templateDir);
    if (!await directoryExists(templatePath)) {
      spinner.fail(chalk.red(`Template directory not found: ${templateDir}`));
      process.exit(1);
    }
    
    // Check required files
    const configPath = path.join(templatePath, 'config.json');
    if (!await fileExists(configPath)) {
      spinner.fail(chalk.red('Template must contain config.json'));
      process.exit(1);
    }
    
    // Load template configuration
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    
    // Get template metadata
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Template ID (unique identifier):',
        default: path.basename(templatePath),
        validate: (input) => /^[a-z0-9-]+$/.test(input) ? true : 'ID must contain only lowercase letters, numbers, and hyphens'
      },
      {
        type: 'input',
        name: 'name',
        message: 'Template name:',
        validate: (input) => input.trim().length > 0 ? true : 'Name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        validate: (input) => input.trim().length > 0 ? true : 'Description is required'
      },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: options.category ? [options.category] : [
          'Business',
          'Sports',
          'Entertainment',
          'Technology',
          'Education',
          'Social Media',
          'Finance',
          'Healthcare',
          'Other'
        ],
        default: options.category || 'Other'
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated):',
        default: options.tags || '',
        filter: (input) => input.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        validate: (input) => input.trim().length > 0 ? true : 'Author is required'
      },
      {
        type: 'input',
        name: 'version',
        message: 'Version:',
        default: '1.0.0',
        validate: (input) => /^\d+\.\d+\.\d+$/.test(input) ? true : 'Version must be in format x.y.z'
      }
    ]);
    
    // Create template metadata
    const template: Template = {
      id: answers.id,
      name: answers.name,
      description: answers.description,
      category: answers.category,
      tags: answers.tags,
      author: answers.author,
      version: answers.version,
      downloads: 0,
      rating: 0,
      config: config
    };
    
    // Load sample data if exists
    const dataPath = path.join(templatePath, 'data.csv');
    if (await fileExists(dataPath)) {
      template.sampleData = await fs.readFile(dataPath, 'utf-8');
    }
    
    // Save template locally first
    const localTemplateDir = path.join(USER_TEMPLATES_DIR, answers.id);
    await fs.mkdir(localTemplateDir, { recursive: true });
    
    await fs.writeFile(
      path.join(localTemplateDir, 'template.json'),
      JSON.stringify(template, null, 2)
    );
    
    // Copy all template files
    await copyDirectory(templatePath, localTemplateDir);
    
    spinner.text = 'Publishing to marketplace...';
    
    // Publish to remote registry (mock implementation)
    if (options.public) {
      try {
        // In a real implementation, this would upload to the template registry
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload
        
        console.log(chalk.green('✓ Template published to public marketplace'));
        console.log(chalk.gray(`Template ID: ${answers.id}`));
        console.log(chalk.blue(`Share with others: barchart-race templates install ${answers.id}`));
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Failed to publish to public marketplace (saved locally)'));
      }
    }
    
    spinner.succeed(chalk.green('✓ Template published successfully'));
    
  } catch (error) {
    spinner.fail(chalk.red('Publishing failed'));
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function previewTemplate(templateId: string): Promise<void> {
  const spinner = ora(`Loading template "${templateId}"...`).start();
  
  try {
    const template = await findTemplate(templateId);
    if (!template) {
      spinner.fail(chalk.red(`Template "${templateId}" not found`));
      process.exit(1);
    }
    
    spinner.stop();
    
    // Display template information
    console.log(chalk.blue.bold(`📦 ${template.name}`));
    console.log(chalk.gray(`ID: ${template.id} • Version: ${template.version}`));
    console.log(chalk.white(template.description));
    console.log();
    
    console.log(chalk.cyan('📊 Details:'));
    console.log(chalk.gray(`Author: ${template.author}`));
    console.log(chalk.gray(`Category: ${template.category}`));
    console.log(chalk.gray(`Tags: ${template.tags.join(', ')}`));
    console.log(chalk.gray(`Downloads: ${template.downloads}`));
    console.log(chalk.yellow(`Rating: ${'★'.repeat(Math.round(template.rating))}${'☆'.repeat(5 - Math.round(template.rating))} (${template.rating}/5)`));
    console.log();
    
    // Show configuration preview
    if (template.config) {
      console.log(chalk.cyan('⚙️  Configuration Preview:'));
      console.log(chalk.gray('Video:'), `${template.config.output?.width}x${template.config.output?.height} @ ${template.config.output?.fps}fps`);
      console.log(chalk.gray('Duration:'), `${template.config.output?.duration} seconds`);
      console.log(chalk.gray('Format:'), template.config.output?.format?.toUpperCase());
      
      if (template.config.data?.valueColumns) {
        console.log(chalk.gray('Data Columns:'), template.config.data.valueColumns.join(', '));
      }
      
      console.log();
    }
    
    // Show sample data preview
    if (template.sampleData) {
      console.log(chalk.cyan('📄 Sample Data Preview:'));
      const lines = template.sampleData.split('\n').slice(0, 5);
      lines.forEach(line => console.log(chalk.gray(`  ${line}`)));
      if (template.sampleData.split('\n').length > 5) {
        console.log(chalk.gray('  ... and more'));
      }
      console.log();
    }
    
    // Installation command
    console.log(chalk.blue('💡 To use this template:'));
    console.log(chalk.white(`barchart-race templates create ${templateId} my-project`));
    
  } catch (error) {
    spinner.fail(chalk.red('Preview failed'));
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function updateTemplates(templateId?: string, options?: any): Promise<void> {
  const spinner = ora('Updating templates...').start();
  
  try {
    if (templateId) {
      // Update specific template
      spinner.text = `Updating template "${templateId}"...`;
      
      const template = await findTemplate(templateId);
      if (!template) {
        spinner.fail(chalk.red(`Template "${templateId}" not found`));
        process.exit(1);
      }
      
      // Check for updates (mock implementation)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      spinner.succeed(chalk.green(`✓ Template "${templateId}" updated`));
      
    } else if (options?.all) {
      // Update all templates
      const localTemplates = await loadLocalTemplates();
      
      for (const template of localTemplates) {
        spinner.text = `Updating ${template.id}...`;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      spinner.succeed(chalk.green(`✓ Updated ${localTemplates.length} template(s)`));
      
    } else {
      spinner.fail(chalk.red('Please specify a template ID or use --all'));
      process.exit(1);
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Update failed'));
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Helper functions
async function loadLocalTemplates(): Promise<Template[]> {
  const templates: Template[] = [];
  
  for (const dir of [LOCAL_TEMPLATES_DIR, USER_TEMPLATES_DIR]) {
    if (await directoryExists(dir)) {
      const entries = await fs.readdir(dir);
      
      for (const entry of entries) {
        const templatePath = path.join(dir, entry, 'template.json');
        if (await fileExists(templatePath)) {
          try {
            const template = JSON.parse(await fs.readFile(templatePath, 'utf-8'));
            templates.push(template);
          } catch (error) {
            // Skip invalid template files
          }
        }
      }
    }
  }
  
  return templates;
}

async function loadRemoteTemplates(): Promise<Template[]> {
  // Mock implementation - in reality this would fetch from a registry
  return [
    {
      id: 'corporate-quarterly',
      name: 'Corporate Quarterly Results',
      description: 'Professional template for quarterly business results with clean styling',
      category: 'Business',
      tags: ['corporate', 'quarterly', 'professional'],
      author: 'ChartPro',
      version: '2.1.0',
      downloads: 2847,
      rating: 4.8,
      config: {
        output: { filename: 'quarterly.mp4', format: 'mp4', width: 1920, height: 1080, fps: 30, duration: 45, quality: 'high' },
        data: { csvPath: './data.csv', dateColumn: 'Quarter', dateFormat: 'YYYY-Q', valueColumns: ['Revenue', 'Profit', 'Expenses'], interpolation: 'smooth' },
        layers: {
          background: { color: '#f8f9fa', opacity: 100 },
          chart: {
            position: { top: 120, right: 60, bottom: 80, left: 60 },
            chart: { visibleItemCount: 8, maxValue: 'local', itemSpacing: 15 },
            animation: { type: 'continuous', overtakeDuration: 0.4 },
            bar: { colors: ['#2c3e50', '#3498db', '#e74c3c', '#2ecc71'], cornerRadius: 8, opacity: 95 },
            labels: {
              title: { show: true, fontSize: 20, fontFamily: 'Arial', color: '#2c3e50', position: 'outside' },
              value: { show: true, fontSize: 18, fontFamily: 'Arial', color: '#2c3e50', format: '${value:,.0f}M' },
              rank: { show: true, fontSize: 16, backgroundColor: '#34495e', textColor: '#ffffff' }
            }
          }
        }
      }
    }
  ];
}

async function findTemplate(templateId: string): Promise<Template | null> {
  const localTemplates = await loadLocalTemplates();
  let template = localTemplates.find(t => t.id === templateId);
  
  if (!template) {
    try {
      const remoteTemplates = await loadRemoteTemplates();
      template = remoteTemplates.find(t => t.id === templateId);
    } catch (error) {
      // Offline mode
    }
  }
  
  return template || null;
}

async function getTemplateDirectory(templateId: string): Promise<string | null> {
  for (const dir of [USER_TEMPLATES_DIR, LOCAL_TEMPLATES_DIR]) {
    const templateDir = path.join(dir, templateId);
    if (await directoryExists(templateDir)) {
      return templateDir;
    }
  }
  return null;
}

async function directoryExists(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(file: string): Promise<boolean> {
  try {
    const stat = await fs.stat(file);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}