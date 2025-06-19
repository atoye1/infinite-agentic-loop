import { SimpleBarChartRaceConfig, AdvancedBarChartRaceConfig } from '../types/SimpleConfig'

/**
 * Pre-built configuration templates for common use cases
 * These templates provide optimized settings for different scenarios
 */
export class ConfigTemplates {
  
  /**
   * Social Media Optimized Templates
   */
  static readonly social = {
    instagram: (): SimpleBarChartRaceConfig => ({
      dataFile: './data.csv',
      title: 'Instagram Analytics',
      columns: ['Followers', 'Engagement', 'Reach'],
      theme: 'social',
      duration: 30,
      quality: 'good',
      speed: 'fast',
      topN: 5,
      outputFile: 'instagram-analytics.mp4'
    }),
    
    tiktok: (): SimpleBarChartRaceConfig => ({
      dataFile: './data.csv',
      title: 'TikTok Trending',
      columns: ['Views', 'Likes', 'Shares'],
      theme: 'gaming',
      duration: 15,
      quality: 'good',
      speed: 'fast',
      topN: 10,
      outputFile: 'tiktok-trending.mp4'
    }),
    
    youtube: (): SimpleBarChartRaceConfig => ({
      dataFile: './data.csv',
      title: 'YouTube Channel Growth',
      columns: ['Subscribers', 'Views', 'Watch Time'],
      theme: 'dark',
      duration: 45,
      quality: 'high',
      speed: 'normal',
      topN: 10,
      outputFile: 'youtube-growth.mp4'
    })
  }
  
  /**
   * Business & Corporate Templates
   */
  static readonly business = {
    quarterly: (): AdvancedBarChartRaceConfig => ({
      dataFile: './revenue-data.csv',
      title: 'Quarterly Revenue Report',
      columns: ['Q1', 'Q2', 'Q3', 'Q4'],
      theme: 'corporate',
      duration: 60,
      quality: 'high',
      speed: 'slow',
      topN: 8,
      advanced: {
        styling: {
          barColors: ['#2563eb', '#7c3aed', '#dc2626', '#16a34a'],
          fontFamily: 'Inter, Arial, sans-serif',
          cornerRadius: 6
        },
        layout: {
          showRanks: true,
          showValues: true,
          valueFormat: '${value:,.0f}',
          margins: { top: 180, right: 80, bottom: 120, left: 80 }
        },
        animation: {
          type: 'continuous',
          overtakeDuration: 0.8
        },
        layers: {
          showDate: true,
          dateFormat: 'Q[Q] YYYY',
          customText: 'Financial Year 2024'
        }
      }
    }),
    
    sales: (): SimpleBarChartRaceConfig => ({
      dataFile: './sales-data.csv',
      title: 'Sales Performance Dashboard',
      columns: ['Product A', 'Product B', 'Product C', 'Product D'],
      theme: 'professional',
      duration: 90,
      quality: 'high',
      speed: 'normal',
      topN: 10,
      outputFile: 'sales-dashboard.mp4'
    }),
    
    market: (): SimpleBarChartRaceConfig => ({
      dataFile: './market-data.csv',
      title: 'Market Share Analysis',
      columns: ['Company A', 'Company B', 'Company C', 'Company D', 'Company E'],
      theme: 'minimal',
      duration: 120,
      quality: 'max',
      speed: 'slow',
      topN: 5,
      outputFile: 'market-analysis.mp4'
    })
  }
  
  /**
   * Sports & Gaming Templates
   */
  static readonly sports = {
    championship: (): AdvancedBarChartRaceConfig => ({
      dataFile: './championship-data.csv',
      title: 'Championship Standings',
      columns: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
      theme: 'sports',
      duration: 60,
      quality: 'high',
      speed: 'normal',
      topN: 10,
      advanced: {
        styling: {
          barColors: ['#dc2626', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
          fontFamily: 'Roboto, Arial, sans-serif',
          cornerRadius: 10
        },
        layout: {
          showRanks: true,
          showValues: true,
          valueFormat: '{value:,.0f} pts',
          itemSpacing: 25
        },
        animation: {
          type: 'continuous',
          overtakeDuration: 0.6,
          effects: true
        }
      }
    }),
    
    esports: (): SimpleBarChartRaceConfig => ({
      dataFile: './esports-data.csv',
      title: 'Tournament Leaderboard',
      columns: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'],
      theme: 'gaming',
      duration: 45,
      quality: 'high',
      speed: 'fast',
      topN: 15,
      outputFile: 'tournament-leaderboard.mp4'
    })
  }
  
  /**
   * Educational & Research Templates
   */
  static readonly educational = {
    population: (): SimpleBarChartRaceConfig => ({
      dataFile: './population-data.csv',
      title: 'Population Growth by Country',
      columns: ['USA', 'China', 'India', 'Indonesia', 'Brazil'],
      theme: 'light',
      duration: 120,
      quality: 'good',
      speed: 'normal',
      topN: 10,
      dateColumn: 'Year',
      outputFile: 'population-growth.mp4'
    }),
    
    research: (): AdvancedBarChartRaceConfig => ({
      dataFile: './research-data.csv',
      title: 'Research Output by Institution',
      columns: ['MIT', 'Stanford', 'Harvard', 'Oxford', 'Cambridge'],
      theme: 'professional',
      duration: 90,
      quality: 'high',
      speed: 'slow',
      topN: 8,
      advanced: {
        styling: {
          barColors: ['#1e40af', '#7c2d12', '#166534', '#7c2d12', '#4c1d95'],
          fontFamily: 'Georgia, serif',
          cornerRadius: 4
        },
        layout: {
          showRanks: true,
          showValues: true,
          valueFormat: '{value:,.0f}',
          margins: { top: 150, right: 60, bottom: 100, left: 60 }
        },
        layers: {
          showDate: true,
          dateFormat: 'YYYY',
          customText: 'Source: Academic Database 2024'
        }
      }
    })
  }
  
  /**
   * Quick Start Templates (Minimal Configuration)
   */
  static readonly quickStart = {
    minimal: (): SimpleBarChartRaceConfig => ({
      dataFile: './data.csv',
      title: 'Simple Bar Chart Race',
      columns: ['A', 'B', 'C']
    }),
    
    demo: (): SimpleBarChartRaceConfig => ({
      dataFile: './demo-data.csv',
      title: 'Demo Animation',
      columns: ['Category 1', 'Category 2', 'Category 3', 'Category 4'],
      duration: 20,
      quality: 'draft',
      speed: 'fast'
    }),
    
    test: (): SimpleBarChartRaceConfig => ({
      dataFile: './test-data.csv',
      title: 'Test Render',
      columns: ['Test A', 'Test B'],
      duration: 10,
      quality: 'draft',
      speed: 'fast',
      topN: 5
    })
  }
  
  /**
   * Get a template by category and name
   */
  static getTemplate(category: string, name: string): SimpleBarChartRaceConfig | AdvancedBarChartRaceConfig | null {
    const templates = this[category as keyof typeof ConfigTemplates]
    if (!templates || typeof templates !== 'object') {
      return null
    }
    
    const template = templates[name as keyof typeof templates]
    if (!template || typeof template !== 'function') {
      return null
    }
    
    return template()
  }
  
  /**
   * List all available templates
   */
  static listTemplates(): { category: string, templates: string[] }[] {
    const categories = Object.keys(this).filter(key => 
      typeof this[key as keyof typeof ConfigTemplates] === 'object' &&
      !['prototype', 'getTemplate', 'listTemplates', 'createFromTemplate'].includes(key)
    )
    
    return categories.map(category => ({
      category,
      templates: Object.keys(this[category as keyof typeof ConfigTemplates] || {})
    }))
  }
  
  /**
   * Create a customized configuration from a template
   */
  static createFromTemplate(
    category: string,
    name: string,
    overrides: Partial<SimpleBarChartRaceConfig | AdvancedBarChartRaceConfig>
  ): SimpleBarChartRaceConfig | AdvancedBarChartRaceConfig | null {
    const template = this.getTemplate(category, name)
    if (!template) {
      return null
    }
    
    return { ...template, ...overrides }
  }
  
  /**
   * Generate documentation for all templates
   */
  static generateDocumentation(): string {
    const templates = this.listTemplates()
    
    let doc = '# Bar Chart Race Configuration Templates\n\n'
    doc += 'Pre-built templates optimized for common use cases.\n\n'
    
    templates.forEach(({ category, templates }) => {
      doc += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Templates\n\n`
      
      templates.forEach(templateName => {
        const template = this.getTemplate(category, templateName)
        if (template) {
          doc += `### ${templateName}\n`
          doc += `\`\`\`json\n${JSON.stringify(template, null, 2)}\n\`\`\`\n\n`
        }
      })
    })
    
    doc += '## Usage\n\n'
    doc += '```typescript\n'
    doc += 'import { ConfigTemplates } from "./utils/ConfigTemplates"\n\n'
    doc += '// Get a template\n'
    doc += 'const config = ConfigTemplates.social.instagram()\n\n'
    doc += '// Customize a template\n'
    doc += 'const customConfig = ConfigTemplates.createFromTemplate(\n'
    doc += '  "business",\n'
    doc += '  "quarterly",\n'
    doc += '  { dataFile: "./my-data.csv", title: "My Custom Report" }\n'
    doc += ')\n'
    doc += '```\n'
    
    return doc
  }
}