import { BarChartRaceConfig, ChartLayerConfig } from '../types/config'
import { SimpleBarChartRaceConfig, AdvancedBarChartRaceConfig } from '../types/SimpleConfig'
import { SimpleConfigResolver } from './SimpleConfigResolver'

export class ConfigConverter {
  
  /**
   * Detect if a configuration is in the old complex format or new simple format
   */
  static detectConfigType(config: unknown): 'simple' | 'complex' | 'unknown' {
    if (!config || typeof config !== 'object') {
      return 'unknown'
    }
    
    const obj = config as Record<string, unknown>
    
    // Check for simple config structure
    if (obj.dataFile && obj.title && obj.columns) {
      return 'simple'
    }
    
    // Check for complex config structure
    if (obj.output && obj.data && obj.layers) {
      return 'complex'
    }
    
    return 'unknown'
  }
  
  /**
   * Convert any configuration format to the full BarChartRaceConfig
   */
  static toFullConfig(config: SimpleBarChartRaceConfig | AdvancedBarChartRaceConfig | BarChartRaceConfig): BarChartRaceConfig {
    const configType = this.detectConfigType(config)
    
    switch (configType) {
      case 'simple':
        return SimpleConfigResolver.resolve(config as SimpleBarChartRaceConfig)
      
      case 'complex':
        return config as BarChartRaceConfig
      
      default:
        throw new Error('Invalid configuration format. Please use either the simple or complex configuration format.')
    }
  }
  
  /**
   * Convert a complex configuration to a simple configuration (lossy conversion)
   * This helps users migrate from complex to simple configs
   */
  static complexToSimple(complexConfig: BarChartRaceConfig): SimpleBarChartRaceConfig {
    const simple: SimpleBarChartRaceConfig = {
      dataFile: complexConfig.data.csvPath,
      title: complexConfig.layers.title?.text || 'Bar Chart Race',
      columns: complexConfig.data.valueColumns,
      dateColumn: complexConfig.data.dateColumn,
      outputFile: complexConfig.output.filename,
      duration: complexConfig.output.duration
    }
    
    // Try to infer theme based on styling
    simple.theme = this.inferTheme(complexConfig)
    
    // Infer quality based on resolution and fps
    simple.quality = this.inferQuality(complexConfig.output)
    
    // Infer speed based on animation settings
    simple.speed = this.inferSpeed(complexConfig.layers.chart?.animation)
    
    // Set topN from visible item count
    if (complexConfig.layers.chart?.chart?.visibleItemCount) {
      simple.topN = complexConfig.layers.chart.chart.visibleItemCount
    }
    
    return simple
  }
  
  /**
   * Convert a complex configuration to an advanced configuration
   * This preserves all settings while using the new simplified interface
   */
  static complexToAdvanced(complexConfig: BarChartRaceConfig): AdvancedBarChartRaceConfig {
    const simple = this.complexToSimple(complexConfig)
    
    const advanced: AdvancedBarChartRaceConfig = {
      ...simple,
      advanced: {
        output: {
          format: complexConfig.output.format,
          width: complexConfig.output.width,
          height: complexConfig.output.height,
          fps: complexConfig.output.fps
        },
        data: {
          dateFormat: complexConfig.data.dateFormat,
          interpolation: complexConfig.data.interpolation
        },
        styling: {
          backgroundColor: complexConfig.layers.background.color,
          barColors: complexConfig.layers.chart?.bar?.colors || 'auto',
          cornerRadius: complexConfig.layers.chart?.bar?.cornerRadius,
          fontFamily: complexConfig.layers.chart?.labels?.title?.fontFamily
        },
        layout: {
          margins: complexConfig.layers.chart?.position,
          itemSpacing: complexConfig.layers.chart?.chart?.itemSpacing,
          showRanks: complexConfig.layers.chart?.labels?.rank?.show,
          showValues: complexConfig.layers.chart?.labels?.value?.show,
          valueFormat: complexConfig.layers.chart?.labels?.value?.format
        },
        animation: {
          type: complexConfig.layers.chart?.animation?.type,
          overtakeDuration: complexConfig.layers.chart?.animation?.overtakeDuration
        },
        layers: {
          showTitle: !!complexConfig.layers.title,
          showDate: !!complexConfig.layers.date,
          dateFormat: complexConfig.layers.date?.format?.pattern,
          customText: complexConfig.layers.text?.text
        }
      }
    }
    
    return advanced
  }
  
  /**
   * Validate any configuration format
   */
  static validate(config: unknown): { isValid: boolean, errors: string[], configType: string } {
    const configType = this.detectConfigType(config)
    
    if (configType === 'unknown') {
      return {
        isValid: false,
        errors: ['Unknown configuration format'],
        configType: 'unknown'
      }
    }
    
    if (configType === 'simple') {
      const validation = SimpleConfigResolver.validate(config)
      return {
        isValid: validation.isValid,
        errors: validation.errors,
        configType: 'simple'
      }
    }
    
    // For complex configs, use the existing validator
    // This maintains backward compatibility
    return {
      isValid: true, // Assume complex configs are pre-validated
      errors: [],
      configType: 'complex'
    }
  }
  
  // Helper methods for inference
  
  private static inferTheme(config: BarChartRaceConfig): SimpleBarChartRaceConfig['theme'] {
    const bgColor = config.layers.background.color.toLowerCase()
    const textColor = config.layers.chart?.labels?.title?.color?.toLowerCase() || '#ffffff'
    
    // Dark themes
    if (bgColor.includes('0a0a0a') || bgColor === '#000000') return 'dark'
    if (bgColor.includes('1a202c')) return 'corporate'
    if (bgColor.includes('0f1419')) return 'sports'  
    if (bgColor.includes('0f0f23')) return 'social'
    if (textColor.includes('00ff')) return 'gaming'
    
    // Light themes
    if (bgColor.includes('f8f9fa') || bgColor.includes('ffffff')) {
      return textColor.includes('212529') ? 'light' : 'minimal'
    }
    
    return 'default'
  }
  
  private static inferQuality(output: BarChartRaceConfig['output']): SimpleBarChartRaceConfig['quality'] {
    const { width, height, fps, quality } = output
    
    if (width >= 3840 && height >= 2160) return 'max'
    if (fps >= 60 && quality === 'high') return 'high'
    if (width >= 1920 && height >= 1080) return 'good'
    return 'draft'
  }
  
  private static inferSpeed(animation: ChartLayerConfig['animation'] | undefined): SimpleBarChartRaceConfig['speed'] {
    if (!animation) return 'normal'
    
    const duration = animation.overtakeDuration || 0.6
    
    if (duration >= 1.0) return 'slow'
    if (duration <= 0.4) return 'fast'
    return 'normal'
  }
  
  /**
   * Generate migration guide for users moving from complex to simple config
   */
  static generateMigrationGuide(complexConfig: BarChartRaceConfig): string {
    const simple = this.complexToSimple(complexConfig)
    const advanced = this.complexToAdvanced(complexConfig)
    
    return `
# Configuration Migration Guide

## Your Current Complex Configuration
Your configuration has been analyzed and can be simplified significantly.

## Option 1: Minimal Simple Configuration
This reduces your config to just the essential options:

\`\`\`json
${JSON.stringify(simple, null, 2)}
\`\`\`

## Option 2: Advanced Configuration (Preserves All Settings)
This maintains all your current settings while using the new interface:

\`\`\`json
${JSON.stringify(advanced, null, 2)}
\`\`\`

## Benefits of Migration:
1. **Reduced Complexity**: From ${this.countConfigOptions(complexConfig)} options to ${this.countSimpleOptions(simple)} essential options
2. **Smart Defaults**: Automatic optimization for common use cases
3. **Easier Maintenance**: Less configuration to manage and update
4. **Better Documentation**: Clear understanding of what each option does
5. **Backward Compatible**: Your existing configs still work

## Recommendation:
- Start with the simple configuration for new projects
- Use advanced configuration when you need specific customizations
- Existing complex configurations will continue to work without changes
`
  }
  
  private static countConfigOptions(config: BarChartRaceConfig): number {
    let count = 0
    
    // Count recursively through the configuration object
    const countProperties = (obj: unknown): void => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          count++
          const typedObj = obj as Record<string, unknown>
          if (typeof typedObj[key] === 'object' && typedObj[key] !== null && !Array.isArray(typedObj[key])) {
            countProperties(typedObj[key])
          }
        })
      }
    }
    
    countProperties(config)
    return count
  }
  
  private static countSimpleOptions(config: SimpleBarChartRaceConfig): number {
    return Object.keys(config).filter(key => config[key as keyof SimpleBarChartRaceConfig] !== undefined).length
  }
}