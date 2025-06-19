import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { BarChartRaceConfig } from '../types/config'
import { SimpleBarChartRaceConfig, AdvancedBarChartRaceConfig } from '../types/SimpleConfig'
import { ConfigConverter } from './ConfigConverter'
import { SimpleConfigResolver } from './SimpleConfigResolver'

export class UnifiedConfigLoader {
  
  /**
   * Load configuration from file or object, supporting both simple and complex formats
   */
  static loadConfig(configInput: string | object): BarChartRaceConfig {
    let configObject: unknown
    
    // Handle string input (file path)
    if (typeof configInput === 'string') {
      const configPath = resolve(configInput)
      
      if (!existsSync(configPath)) {
        throw new Error(`Configuration file not found: ${configPath}`)
      }
      
      try {
        const configContent = readFileSync(configPath, 'utf-8')
        configObject = JSON.parse(configContent)
      } catch (error) {
        throw new Error(`Failed to parse configuration file: ${error}`)
      }
    } else {
      configObject = configInput
    }
    
    // Validate and convert to full configuration
    const validation = ConfigConverter.validate(configObject)
    
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed:\n${validation.errors.join('\n')}`)
    }
    
    // Convert to full configuration format
    return ConfigConverter.toFullConfig(configObject)
  }
  
  /**
   * Create a simple configuration template
   */
  static createSimpleTemplate(options: {
    dataFile?: string
    title?: string
    columns?: string[]
    theme?: string
  } = {}): SimpleBarChartRaceConfig {
    return {
      dataFile: options.dataFile || './data.csv',
      title: options.title || 'My Bar Chart Race',
      columns: options.columns || ['Column1', 'Column2', 'Column3'],
      theme: (options.theme as SimpleBarChartRaceConfig['theme']) || 'default'
    }
  }
  
  /**
   * Create an advanced configuration template
   */
  static createAdvancedTemplate(options: {
    simple?: Partial<SimpleBarChartRaceConfig>
    advanced?: Partial<AdvancedBarChartRaceConfig['advanced']>
  } = {}): AdvancedBarChartRaceConfig {
    const simple = {
      dataFile: './data.csv',
      title: 'Advanced Bar Chart Race',
      columns: ['Column1', 'Column2', 'Column3', 'Column4'],
      theme: 'corporate' as const,
      duration: 120,
      quality: 'high' as const,
      ...options.simple
    }
    
    const advanced = {
      styling: {
        barColors: ['#4299E1', '#48BB78', '#ED8936', '#9F7AEA'],
        fontFamily: 'Arial'
      },
      layout: {
        showRanks: true,
        showValues: true,
        valueFormat: '{value:,.0f}'
      },
      animation: {
        effects: true
      },
      ...options.advanced
    }
    
    return { ...simple, advanced }
  }
  
  /**
   * Get configuration examples for different use cases
   */
  static getExamples(): Record<string, SimpleBarChartRaceConfig | AdvancedBarChartRaceConfig> {
    return {
      // Minimal example - just the essentials
      minimal: {
        dataFile: './data.csv',
        title: 'Simple Chart',
        columns: ['A', 'B', 'C']
      },
      
      // Social media optimized
      social: {
        dataFile: './social-data.csv',
        title: 'Social Media Followers',
        columns: ['Instagram', 'TikTok', 'YouTube', 'Twitter'],
        theme: 'social',
        duration: 30,
        quality: 'good',
        speed: 'fast'
      },
      
      // Corporate presentation
      corporate: {
        dataFile: './revenue-data.csv',
        title: 'Quarterly Revenue Performance',
        columns: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
        theme: 'corporate',
        duration: 90,
        quality: 'high',
        topN: 8
      },
      
      // Sports championship
      sports: {
        dataFile: './sports-data.csv',
        title: 'Championship Leaderboard',
        columns: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
        theme: 'sports',
        duration: 60,
        speed: 'normal',
        topN: 5
      },
      
      // Gaming statistics
      gaming: {
        dataFile: './gaming-data.csv',
        title: 'Most Played Games',
        columns: ['Fortnite', 'Valorant', 'League of Legends', 'CS:GO'],
        theme: 'gaming',
        duration: 45,
        speed: 'fast'
      },
      
      // Advanced with custom styling
      advanced: {
        dataFile: './custom-data.csv',
        title: 'Custom Styled Chart',
        columns: ['Category A', 'Category B', 'Category C'],
        theme: 'dark',
        duration: 75,
        advanced: {
          styling: {
            barColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
            fontFamily: 'Helvetica',
            cornerRadius: 15
          },
          layout: {
            showRanks: false,
            valueFormat: '${value:,.2f}M',
            itemSpacing: 25
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.8,
            effects: true
          },
          layers: {
            showDate: true,
            dateFormat: 'YYYY Q[Q]',
            customText: 'Data source: Internal Analytics'
          }
        }
      }
    }
  }
  
  /**
   * Generate configuration documentation
   */
  static getDocumentation(): string {
    return `
# Bar Chart Race Configuration Guide

## Simple Configuration (Recommended)
The simple configuration reduces complexity from 50+ options to just 10 essential settings.

### Required Fields (3):
- \`dataFile\`: Path to your CSV data file
- \`title\`: Chart title that appears in the video
- \`columns\`: Array of column names to visualize

### Optional Fields (7):
- \`dateColumn\`: Date column name (default: 'Date')
- \`outputFile\`: Output filename (auto-generated from title)
- \`duration\`: Video length in seconds (default: 60)
- \`theme\`: Visual style (default: 'default')
- \`topN\`: Number of bars to show (default: 10)
- \`speed\`: Animation speed (default: 'normal')
- \`quality\`: Video quality (default: 'good')

### Available Themes:
${Object.keys(SimpleConfigResolver['SMART_DEFAULTS']?.themes || {}).map(theme => `- ${theme}`).join('\n')}

### Available Speeds:
${Object.keys(SimpleConfigResolver['SMART_DEFAULTS']?.speeds || {}).map(speed => `- ${speed}`).join('\n')}

### Available Qualities:
${Object.keys(SimpleConfigResolver['SMART_DEFAULTS']?.qualities || {}).map(quality => `- ${quality}`).join('\n')}

## Advanced Configuration
For users who need more control, add an 'advanced' object with detailed overrides.
This maintains full backward compatibility with existing complex configurations.

## Examples:

### Minimal Example:
\`\`\`json
{
  "dataFile": "./data.csv",
  "title": "Population Growth",
  "columns": ["USA", "China", "India"]
}
\`\`\`

### Social Media Example:
\`\`\`json
{
  "dataFile": "./social-data.csv",
  "title": "Social Media Followers",
  "columns": ["Instagram", "TikTok", "YouTube"],
  "theme": "social",
  "duration": 30,
  "speed": "fast"
}
\`\`\`

### Advanced Example:
\`\`\`json
{
  "dataFile": "./data.csv",
  "title": "Sales Performance",
  "columns": ["Q1", "Q2", "Q3", "Q4"],
  "theme": "corporate",
  "advanced": {
    "styling": {
      "barColors": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
      "fontFamily": "Helvetica"
    },
    "layout": {
      "showRanks": false,
      "valueFormat": "$\{value:,.0f\}"
    }
  }
}
\`\`\`

## Migration from Complex Configuration:
Existing complex configurations will continue to work without changes.
Use the ConfigConverter.generateMigrationGuide() method to get suggestions
for simplifying your existing configurations.

## Loading Configurations:
\`\`\`typescript
import { UnifiedConfigLoader } from './UnifiedConfigLoader'

// Load from file
const config = UnifiedConfigLoader.loadConfig('./my-config.json')

// Load from object
const config = UnifiedConfigLoader.loadConfig({
  dataFile: './data.csv',
  title: 'My Chart',
  columns: ['A', 'B', 'C']
})
\`\`\`
`
  }
  
  /**
   * Validate a configuration file
   */
  static validateConfigFile(configPath: string): { isValid: boolean, errors: string[], suggestions: string[] } {
    try {
      const config = this.loadConfig(configPath)
      const validation = ConfigConverter.validate(config)
      
      const suggestions: string[] = []
      
      // Generate suggestions for improvement
      if (validation.configType === 'complex') {
        suggestions.push('Consider migrating to the simplified configuration format for easier maintenance')
        suggestions.push('Use ConfigConverter.generateMigrationGuide() to see how to simplify your config')
      }
      
      if (validation.configType === 'simple') {
        suggestions.push('Great! You\'re using the simplified configuration format')
      }
      
      return {
        isValid: validation.isValid,
        errors: validation.errors,
        suggestions
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        suggestions: ['Check if the configuration file exists and contains valid JSON']
      }
    }
  }
}