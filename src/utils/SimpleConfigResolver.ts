import { BarChartRaceConfig } from '../types/config'
import { 
  SimpleBarChartRaceConfig, 
  AdvancedBarChartRaceConfig, 
  ResolvedBarChartRaceConfig,
  SMART_DEFAULTS 
} from '../types/SimpleConfig'

export class SimpleConfigResolver {
  
  /**
   * Convert a simple config to a full BarChartRaceConfig with smart defaults
   */
  static resolve(simpleConfig: SimpleBarChartRaceConfig | AdvancedBarChartRaceConfig): BarChartRaceConfig {
    const resolved = this.resolveToInternal(simpleConfig)
    return this.convertToFullConfig(resolved)
  }
  
  /**
   * Resolve simple config to internal representation with all defaults applied
   */
  static resolveToInternal(config: SimpleBarChartRaceConfig | AdvancedBarChartRaceConfig): ResolvedBarChartRaceConfig {
    // Apply smart defaults to simple config
    const simple: Required<SimpleBarChartRaceConfig> = {
      dataFile: config.dataFile,
      title: config.title,
      columns: config.columns,
      dateColumn: config.dateColumn || SMART_DEFAULTS.dateColumn,
      outputFile: config.outputFile || this.generateOutputFileName(config.title),
      duration: config.duration || SMART_DEFAULTS.duration,
      theme: config.theme || SMART_DEFAULTS.theme,
      topN: config.topN || SMART_DEFAULTS.topN,
      speed: config.speed || SMART_DEFAULTS.speed,
      quality: config.quality || SMART_DEFAULTS.quality
    }
    
    // Extract advanced config if provided
    const advanced = 'advanced' in config ? config.advanced : undefined
    
    // Compute derived values
    const computed = {
      outputFileName: simple.outputFile,
      themeConfig: SMART_DEFAULTS.themes[simple.theme],
      speedConfig: SMART_DEFAULTS.speeds[simple.speed],
      qualityConfig: SMART_DEFAULTS.qualities[simple.quality]
    }
    
    return { simple, advanced, computed }
  }
  
  /**
   * Convert resolved config to full BarChartRaceConfig format
   */
  private static convertToFullConfig(resolved: ResolvedBarChartRaceConfig): BarChartRaceConfig {
    const { simple, advanced, computed } = resolved
    
    // Start with base configuration using smart defaults
    const baseConfig: BarChartRaceConfig = {
      output: {
        filename: computed.outputFileName,
        format: advanced?.output?.format || 'mp4',
        width: advanced?.output?.width || computed.qualityConfig.width,
        height: advanced?.output?.height || computed.qualityConfig.height,
        fps: advanced?.output?.fps || computed.speedConfig.fps,
        duration: simple.duration,
        quality: computed.qualityConfig.quality
      },
      
      data: {
        csvPath: simple.dataFile,
        dateColumn: simple.dateColumn,
        dateFormat: advanced?.data?.dateFormat || 'YYYY-MM-DD',
        valueColumns: simple.columns,
        interpolation: advanced?.data?.interpolation || computed.speedConfig.interpolation
      },
      
      layers: {
        background: {
          color: advanced?.styling?.backgroundColor || computed.themeConfig.backgroundColor,
          opacity: 100
        },
        
        chart: {
          position: this.getChartPosition(advanced?.layout?.margins),
          
          chart: {
            visibleItemCount: simple.topN,
            maxValue: 'local',
            itemSpacing: advanced?.layout?.itemSpacing || this.getDefaultItemSpacing(simple.topN)
          },
          
          animation: {
            type: advanced?.animation?.type || 'continuous',
            overtakeDuration: advanced?.animation?.overtakeDuration || computed.speedConfig.overtakeDuration
          },
          
          bar: {
            colors: advanced?.styling?.barColors || computed.themeConfig.barColors,
            cornerRadius: advanced?.styling?.cornerRadius || this.getDefaultCornerRadius(computed.themeConfig.style),
            opacity: 100
          },
          
          labels: {
            title: {
              show: advanced?.layout?.showValues !== false,
              fontSize: this.getFontSize('title', computed.qualityConfig),
              fontFamily: advanced?.styling?.fontFamily || 'Arial',
              color: computed.themeConfig.textColor,
              position: 'outside'
            },
            value: {
              show: advanced?.layout?.showValues !== false,
              fontSize: this.getFontSize('value', computed.qualityConfig),
              fontFamily: advanced?.styling?.fontFamily || 'Arial',
              color: computed.themeConfig.textColor,
              format: advanced?.layout?.valueFormat || '{value:,.0f}'
            },
            rank: {
              show: advanced?.layout?.showRanks !== false,
              fontSize: this.getFontSize('rank', computed.qualityConfig),
              backgroundColor: this.getRankBackgroundColor(computed.themeConfig),
              textColor: this.getRankTextColor(computed.themeConfig)
            }
          }
        }
      }
    }
    
    // Add optional title layer if title is provided
    if (simple.title && (advanced?.layers?.showTitle !== false)) {
      baseConfig.layers.title = {
        text: simple.title,
        position: {
          top: this.getTitleTop(computed.qualityConfig),
          align: 'center'
        },
        style: {
          fontSize: this.getFontSize('mainTitle', computed.qualityConfig),
          fontFamily: advanced?.styling?.fontFamily || 'Arial',
          color: computed.themeConfig.textColor,
          opacity: 100
        },
        timeline: {
          startTime: 0,
          duration: simple.duration
        }
      }
    }
    
    // Add optional date layer (default: show)
    if (advanced?.layers?.showDate !== false) {
      baseConfig.layers.date = {
        position: {
          bottom: this.getDateBottom(computed.qualityConfig),
          right: this.getDateRight(computed.qualityConfig)
        },
        format: {
          pattern: advanced?.layers?.dateFormat || 'MMMM YYYY',
          locale: 'en-US'
        },
        style: {
          fontSize: this.getFontSize('date', computed.qualityConfig),
          fontFamily: advanced?.styling?.fontFamily || 'Arial',
          color: computed.themeConfig.textColor,
          opacity: 80
        },
        animation: {
          type: 'continuous',
          duration: 0.3
        }
      }
    }
    
    // Add custom text layer if provided
    if (advanced?.layers?.customText) {
      baseConfig.layers.text = {
        text: advanced.layers.customText,
        position: {
          top: computed.qualityConfig.height - 150,
          left: 50,
          align: 'left'
        },
        style: {
          fontSize: this.getFontSize('text', computed.qualityConfig),
          fontFamily: advanced?.styling?.fontFamily || 'Arial',
          color: computed.themeConfig.textColor,
          opacity: 90
        },
        timeline: {
          startTime: 0,
          duration: simple.duration
        }
      }
    }
    
    return baseConfig
  }
  
  // Helper methods for smart defaults
  
  private static generateOutputFileName(title: string): string {
    const sanitized = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    return `${sanitized || 'bar-chart-race'}.mp4`
  }
  
  private static getChartPosition(margins?: { top: number, right: number, bottom: number, left: number }) {
    return margins || { top: 150, right: 50, bottom: 100, left: 50 }
  }
  
  private static getDefaultItemSpacing(topN: number): number {
    // Adjust spacing based on number of items
    if (topN <= 5) return 30
    if (topN <= 10) return 20
    if (topN <= 15) return 15
    return 10
  }
  
  private static getDefaultCornerRadius(style: string): number {
    switch (style) {
      case 'modern': return 12
      case 'clean': return 5
      case 'professional': return 6
      case 'energetic': return 8
      case 'vibrant': return 15
      case 'neon': return 12
      case 'simple': return 0
      default: return 10
    }
  }
  
  private static getFontSize(element: string, qualityConfig: typeof SMART_DEFAULTS.qualities.good): number {
    const scale = qualityConfig.height / 1080 // Scale based on resolution
    
    const baseSizes = {
      mainTitle: 48,
      title: 24,
      value: 20,
      rank: 18,
      date: 36,
      text: 16
    }
    
    return Math.round((baseSizes[element as keyof typeof baseSizes] || 16) * scale)
  }
  
  private static getTitleTop(qualityConfig: typeof SMART_DEFAULTS.qualities.good): number {
    return Math.round(50 * (qualityConfig.height / 1080))
  }
  
  private static getDateBottom(qualityConfig: typeof SMART_DEFAULTS.qualities.good): number {
    return Math.round(50 * (qualityConfig.height / 1080))
  }
  
  private static getDateRight(qualityConfig: typeof SMART_DEFAULTS.qualities.good): number {
    return Math.round(50 * (qualityConfig.width / 1920))
  }
  
  private static getRankBackgroundColor(themeConfig: typeof SMART_DEFAULTS.themes.default): string {
    // Generate appropriate rank background based on theme
    if (themeConfig.textColor === '#ffffff') {
      return '#333333' // Dark background for light text
    } else {
      return '#f0f0f0' // Light background for dark text
    }
  }
  
  private static getRankTextColor(themeConfig: typeof SMART_DEFAULTS.themes.default): string {
    // Contrast color for rank text
    if (themeConfig.textColor === '#ffffff') {
      return '#FFD700' // Gold text on dark background
    } else {
      return '#333333' // Dark text on light background
    }
  }
  
  /**
   * Validate a simple configuration
   */
  static validate(config: SimpleBarChartRaceConfig | AdvancedBarChartRaceConfig): { isValid: boolean, errors: string[] } {
    const errors: string[] = []
    
    // Required fields
    if (!config.dataFile || typeof config.dataFile !== 'string') {
      errors.push('dataFile is required and must be a string')
    }
    
    if (!config.title || typeof config.title !== 'string') {
      errors.push('title is required and must be a string')
    }
    
    if (!config.columns || !Array.isArray(config.columns) || config.columns.length === 0) {
      errors.push('columns is required and must be a non-empty array')
    }
    
    // Optional fields validation
    if (config.duration !== undefined && (typeof config.duration !== 'number' || config.duration <= 0)) {
      errors.push('duration must be a positive number')
    }
    
    if (config.theme && !Object.keys(SMART_DEFAULTS.themes).includes(config.theme)) {
      errors.push(`theme must be one of: ${Object.keys(SMART_DEFAULTS.themes).join(', ')}`)
    }
    
    if (config.topN !== undefined && (typeof config.topN !== 'number' || config.topN <= 0)) {
      errors.push('topN must be a positive number')
    }
    
    if (config.speed && !Object.keys(SMART_DEFAULTS.speeds).includes(config.speed)) {
      errors.push(`speed must be one of: ${Object.keys(SMART_DEFAULTS.speeds).join(', ')}`)
    }
    
    if (config.quality && !Object.keys(SMART_DEFAULTS.qualities).includes(config.quality)) {
      errors.push(`quality must be one of: ${Object.keys(SMART_DEFAULTS.qualities).join(', ')}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Get documentation for the simplified configuration
   */
  static getDocumentation(): string {
    return `
# Simplified Bar Chart Race Configuration

This configuration system reduces complexity from 50+ options to just 10 essential settings.
All other options are handled by smart defaults that work for 90% of use cases.

## Required Options (3):
- dataFile: Path to your CSV data file
- title: Chart title that appears in the video  
- columns: Array of column names to visualize from your CSV

## Optional Options (7):
- dateColumn: Date column name (default: 'Date')
- outputFile: Output filename (default: auto-generated from title)
- duration: Video length in seconds (default: 60)
- theme: Visual style (default: 'default')
  - Options: ${Object.keys(SMART_DEFAULTS.themes).join(', ')}
- topN: Number of bars to show (default: 10)
- speed: Animation speed (default: 'normal')
  - Options: ${Object.keys(SMART_DEFAULTS.speeds).join(', ')}
- quality: Video quality (default: 'good')
  - Options: ${Object.keys(SMART_DEFAULTS.qualities).join(', ')}

## Advanced Configuration:
For users who need more control, add an 'advanced' object with detailed overrides.
This maintains full backward compatibility with existing complex configurations.

## Example Simple Config:
{
  "dataFile": "./data.csv",
  "title": "Population Growth Over Time", 
  "columns": ["USA", "China", "India", "Brazil"],
  "theme": "corporate",
  "duration": 90,
  "topN": 8
}

## Example with Advanced Overrides:
{
  "dataFile": "./data.csv",
  "title": "Sales Performance",
  "columns": ["Q1", "Q2", "Q3", "Q4"],
  "theme": "corporate",
  "advanced": {
    "styling": {
      "barColors": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"],
      "fontFamily": "Helvetica"
    },
    "layout": {
      "showRanks": false,
      "valueFormat": "\\${value:,.0f}"
    }
  }
}
`
  }
}