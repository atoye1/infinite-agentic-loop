import { BarChartRaceConfig } from '../BarChartRace'
import { ProcessedData } from '../BarChartRace'

export interface DataCharacteristics {
  rowCount: number
  columnCount: number
  dateRange: {
    start: Date
    end: Date
    durationDays: number
  }
  valueRanges: Record<string, {
    min: number
    max: number
    avg: number
    volatility: number
  }>
  dataTypes: Record<string, 'numeric' | 'categorical' | 'mixed'>
  trendPatterns: Record<string, 'increasing' | 'decreasing' | 'stable' | 'volatile'>
  seasonality: Record<string, boolean>
  outliers: Record<string, number[]>
  correlations: Record<string, Record<string, number>>
}

export interface ConfigGenerationOptions {
  purpose: 'presentation' | 'social-media' | 'analysis' | 'marketing' | 'report'
  audience: 'technical' | 'business' | 'general' | 'academic'
  style: 'professional' | 'casual' | 'energetic' | 'minimal' | 'creative'
  outputFormat: 'landscape' | 'portrait' | 'square'
  duration: 'short' | 'medium' | 'long' | 'auto'
  emphasis: 'data-accuracy' | 'visual-appeal' | 'performance' | 'accessibility'
  industry?: string
  brandColors?: string[]
  customRequirements?: Partial<BarChartRaceConfig>
}

export class ConfigGenerator {
  
  /**
   * Analyze data characteristics to inform configuration decisions
   */
  static analyzeDataCharacteristics(data: ProcessedData): DataCharacteristics {
    const characteristics: DataCharacteristics = {
      rowCount: data.frames.length,
      columnCount: data.columns.length,
      dateRange: {
        start: data.dateRange.start,
        end: data.dateRange.end,
        durationDays: Math.ceil((data.dateRange.end.getTime() - data.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
      },
      valueRanges: {},
      dataTypes: {},
      trendPatterns: {},
      seasonality: {},
      outliers: {},
      correlations: {}
    }

    // Analyze each column
    data.columns.forEach(column => {
      const values = data.frames.map(frame => 
        frame.items.find(item => item.id === column)?.value || 0
      )
      
      // Calculate basic statistics
      const min = Math.min(...values)
      const max = Math.max(...values)
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length
      const volatility = this.calculateVolatility(values)
      
      characteristics.valueRanges[column] = { min, max, avg, volatility }
      
      // Determine data type
      characteristics.dataTypes[column] = this.determineDataType(values)
      
      // Analyze trend patterns
      characteristics.trendPatterns[column] = this.analyzeTrend(values)
      
      // Detect seasonality
      characteristics.seasonality[column] = this.detectSeasonality(values)
      
      // Identify outliers
      characteristics.outliers[column] = this.identifyOutliers(values)
    })

    // Calculate correlations between columns
    characteristics.correlations = this.calculateCorrelations(data)

    return characteristics
  }

  /**
   * Generate configuration based on data characteristics and user preferences
   */
  static generateConfiguration(
    characteristics: DataCharacteristics,
    options: ConfigGenerationOptions
  ): BarChartRaceConfig {
    // Start with base template based on options
    let config = this.selectBaseTemplate(options)
    
    // Apply data-driven optimizations
    config = this.optimizeForDataCharacteristics(config, characteristics)
    
    // Apply user preference optimizations
    config = this.applyUserPreferences(config, options)
    
    // Apply performance optimizations
    config = this.optimizeForPerformance(config, characteristics)
    
    // Apply accessibility optimizations if requested
    if (options.emphasis === 'accessibility') {
      config = this.applyAccessibilityOptimizations(config)
    }
    
    return config
  }

  private static selectBaseTemplate(options: ConfigGenerationOptions): BarChartRaceConfig {
    // For now, return a basic template since we're not implementing templating features
    // This can be expanded later when templating is explicitly requested
    return {
      output: {
        width: options.outputFormat === 'portrait' ? 1080 : options.outputFormat === 'square' ? 1080 : 1920,
        height: options.outputFormat === 'portrait' ? 1920 : options.outputFormat === 'square' ? 1080 : 1080,
        fps: 30,
        duration: 60,
        quality: 'high',
        format: 'mp4'
      },
      layers: {
        background: {
          color: '#ffffff'
        },
        chart: {
          position: {
            top: 150,
            bottom: 150,
            left: 80,
            right: 80
          },
          chart: {
            visibleItemCount: 10,
            itemSpacing: 20,
            maxValue: 'global'
          },
          bar: {
            cornerRadius: 8,
            colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
          },
          labels: {
            title: {
              fontSize: 24,
              color: '#1f2937',
              show: true
            },
            value: {
              fontSize: 20,
              color: '#374151',
              show: true,
              format: '{value:,.0f}'
            },
            rank: {
              fontSize: 16,
              show: true,
              textColor: '#ffffff',
              backgroundColor: '#374151'
            }
          },
          animation: {
            type: 'continuous',
            overtakeDuration: 0.6
          }
        },
        title: {
          text: 'Bar Chart Race',
          position: {
            top: 60
          },
          style: {
            fontSize: 48,
            color: '#1f2937',
            fontWeight: 'bold'
          }
        },
        date: {
          format: {
            pattern: 'YYYY-MM'
          },
          position: {
            bottom: 60,
            right: 80
          },
          style: {
            fontSize: 32,
            color: '#6b7280'
          },
          animation: {
            duration: 0.5
          }
        }
      }
    }
  }

  private static optimizeForDataCharacteristics(
    config: BarChartRaceConfig,
    characteristics: DataCharacteristics
  ): BarChartRaceConfig {
    const optimizedConfig = { ...config }

    // Optimize duration based on data points
    const optimalDuration = this.calculateOptimalDuration(characteristics)
    optimizedConfig.output.duration = optimalDuration

    // Optimize visible item count based on data size
    const optimalItemCount = Math.min(
      Math.max(5, Math.floor(characteristics.columnCount * 0.8)),
      15
    )
    optimizedConfig.layers.chart.chart.visibleItemCount = optimalItemCount

    // Optimize animation speed based on data volatility
    const avgVolatility = Object.values(characteristics.valueRanges)
      .reduce((sum, range) => sum + range.volatility, 0) / characteristics.columnCount
    
    if (avgVolatility > 0.5) {
      optimizedConfig.layers.chart.animation.overtakeDuration = 0.8 // Slower for volatile data
    } else if (avgVolatility < 0.2) {
      optimizedConfig.layers.chart.animation.overtakeDuration = 0.4 // Faster for stable data
    }

    // Optimize value scaling based on data ranges
    const hasWideRange = Object.values(characteristics.valueRanges)
      .some(range => range.max / range.min > 1000)
    
    if (hasWideRange) {
      optimizedConfig.layers.chart.chart.maxValue = 'local' // Use local scaling for wide ranges
    }

    // Optimize label formatting based on value ranges
    const maxValue = Math.max(...Object.values(characteristics.valueRanges).map(r => r.max))
    
    if (maxValue > 1000000000) {
      optimizedConfig.layers.chart.labels.value.format = '{value:.1f}B'
      optimizedConfig.layers.chart.labels.value.suffix = 'B'
    } else if (maxValue > 1000000) {
      optimizedConfig.layers.chart.labels.value.format = '{value:.1f}M'
      optimizedConfig.layers.chart.labels.value.suffix = 'M'
    } else if (maxValue > 1000) {
      optimizedConfig.layers.chart.labels.value.format = '{value:,.0f}K'
      optimizedConfig.layers.chart.labels.value.suffix = 'K'
    }

    return optimizedConfig
  }

  private static applyUserPreferences(
    config: BarChartRaceConfig,
    options: ConfigGenerationOptions
  ): BarChartRaceConfig {
    const optimizedConfig = { ...config }

    // Apply output format preferences
    if (options.outputFormat === 'portrait') {
      optimizedConfig.output.width = 1080
      optimizedConfig.output.height = 1920
    } else if (options.outputFormat === 'square') {
      optimizedConfig.output.width = 1080
      optimizedConfig.output.height = 1080
    } else {
      optimizedConfig.output.width = 1920
      optimizedConfig.output.height = 1080
    }

    // Apply duration preferences
    if (options.duration === 'short') {
      optimizedConfig.output.duration = Math.min(30, optimizedConfig.output.duration)
    } else if (options.duration === 'long') {
      optimizedConfig.output.duration = Math.max(120, optimizedConfig.output.duration)
    }

    // Apply style preferences
    if (options.style === 'professional') {
      optimizedConfig.layers.background.color = '#ffffff'
      optimizedConfig.layers.chart.labels.title.color = '#333333'
      optimizedConfig.layers.chart.labels.value.color = '#333333'
      optimizedConfig.layers.chart.bar.cornerRadius = 4
    } else if (options.style === 'energetic') {
      optimizedConfig.output.fps = 60
      optimizedConfig.layers.chart.animation.overtakeDuration = 0.3
      optimizedConfig.layers.chart.bar.cornerRadius = 15
    } else if (options.style === 'minimal') {
      optimizedConfig.layers.chart.labels.rank.show = false
      optimizedConfig.layers.chart.bar.cornerRadius = 0
      optimizedConfig.layers.chart.bar.opacity = 80
    }

    // Apply brand colors if provided
    if (options.brandColors && options.brandColors.length > 0) {
      optimizedConfig.layers.chart.bar.colors = options.brandColors
    }

    // Apply custom requirements
    if (options.customRequirements) {
      this.mergeConfigurations(optimizedConfig, options.customRequirements)
    }

    return optimizedConfig
  }

  private static optimizeForPerformance(
    config: BarChartRaceConfig,
    characteristics: DataCharacteristics
  ): BarChartRaceConfig {
    const optimizedConfig = { ...config }

    // Reduce quality for large datasets
    if (characteristics.rowCount > 1000) {
      optimizedConfig.output.quality = 'medium'
    }

    // Optimize FPS based on duration and data size
    if (characteristics.rowCount > 500 && optimizedConfig.output.duration > 60) {
      optimizedConfig.output.fps = 24 // Lower FPS for long, data-heavy animations
    }

    // Simplify animations for complex datasets
    if (characteristics.columnCount > 20) {
      optimizedConfig.layers.chart.animation.type = 'discrete'
    }

    return optimizedConfig
  }

  private static applyAccessibilityOptimizations(config: BarChartRaceConfig): BarChartRaceConfig {
    const optimizedConfig = { ...config }

    // Increase font sizes for better readability
    optimizedConfig.layers.chart.labels.title.fontSize += 4
    optimizedConfig.layers.chart.labels.value.fontSize += 2
    optimizedConfig.layers.chart.labels.rank.fontSize += 2
    
    if (optimizedConfig.layers.title) {
      optimizedConfig.layers.title.style.fontSize += 6
    }
    
    if (optimizedConfig.layers.date) {
      optimizedConfig.layers.date.style.fontSize += 4
    }

    // Improve color contrast
    optimizedConfig.layers.background.color = '#ffffff'
    optimizedConfig.layers.chart.labels.title.color = '#000000'
    optimizedConfig.layers.chart.labels.value.color = '#000000'
    optimizedConfig.layers.chart.labels.rank.textColor = '#ffffff'
    optimizedConfig.layers.chart.labels.rank.backgroundColor = '#000000'

    // Use accessible color palette
    optimizedConfig.layers.chart.bar.colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ]

    // Slow down animations for better comprehension
    optimizedConfig.layers.chart.animation.overtakeDuration = 1.0
    optimizedConfig.output.fps = 24

    return optimizedConfig
  }

  // Helper methods for data analysis

  private static calculateVolatility(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return Math.sqrt(variance) / mean
  }

  private static determineDataType(values: number[]): 'numeric' | 'categorical' | 'mixed' {
    // For this implementation, we assume all values are numeric
    // In a real implementation, you might analyze the original data types
    return 'numeric'
  }

  private static analyzeTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (values.length < 2) return 'stable'
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const volatility = this.calculateVolatility(values)
    
    if (volatility > 0.5) return 'volatile'
    
    const change = (secondAvg - firstAvg) / firstAvg
    
    if (change > 0.1) return 'increasing'
    if (change < -0.1) return 'decreasing'
    return 'stable'
  }

  private static detectSeasonality(values: number[]): boolean {
    // Simple seasonality detection based on autocorrelation
    if (values.length < 12) return false
    
    const quarterlyCorrelation = this.calculateAutocorrelation(values, 4)
    const monthlyCorrelation = this.calculateAutocorrelation(values, 12)
    
    return quarterlyCorrelation > 0.3 || monthlyCorrelation > 0.3
  }

  private static calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0
    
    const n = values.length - lag
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    
    let numerator = 0
    let denominator = 0
    
    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean)
    }
    
    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2)
    }
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  private static identifyOutliers(values: number[]): number[] {
    const sorted = [...values].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    const iqr = q3 - q1
    
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    
    return values.filter(val => val < lowerBound || val > upperBound)
  }

  private static calculateCorrelations(data: ProcessedData): Record<string, Record<string, number>> {
    const correlations: Record<string, Record<string, number>> = {}
    
    data.columns.forEach(col1 => {
      correlations[col1] = {}
      
      data.columns.forEach(col2 => {
        if (col1 === col2) {
          correlations[col1][col2] = 1
        } else {
          const values1 = data.frames.map(frame => 
            frame.items.find(item => item.id === col1)?.value || 0
          )
          const values2 = data.frames.map(frame => 
            frame.items.find(item => item.id === col2)?.value || 0
          )
          
          correlations[col1][col2] = this.calculatePearsonCorrelation(values1, values2)
        }
      })
    })
    
    return correlations
  }

  private static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length)
    if (n === 0) return 0
    
    const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0)
    const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0)
    const sumXY = x.slice(0, n).reduce((sum, val, i) => sum + val * y[i], 0)
    const sumX2 = x.slice(0, n).reduce((sum, val) => sum + val * val, 0)
    const sumY2 = y.slice(0, n).reduce((sum, val) => sum + val * val, 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  private static calculateOptimalDuration(characteristics: DataCharacteristics): number {
    // Base duration on data points and volatility
    const baseSeconds = Math.max(30, Math.min(120, characteristics.rowCount * 0.5))
    
    // Adjust for volatility
    const avgVolatility = Object.values(characteristics.valueRanges)
      .reduce((sum, range) => sum + range.volatility, 0) / characteristics.columnCount
    
    if (avgVolatility > 0.5) {
      return Math.round(baseSeconds * 1.5) // Longer for volatile data
    } else if (avgVolatility < 0.2) {
      return Math.round(baseSeconds * 0.8) // Shorter for stable data
    }
    
    return Math.round(baseSeconds)
  }

  private static mergeConfigurations(target: BarChartRaceConfig, source: Partial<BarChartRaceConfig>): void {
    // Deep merge configurations
    Object.keys(source).forEach(key => {
      if (source[key as keyof BarChartRaceConfig] && typeof source[key as keyof BarChartRaceConfig] === 'object') {
        if (!target[key as keyof BarChartRaceConfig]) {
          target[key as keyof BarChartRaceConfig] = {} as any
        }
        Object.assign(target[key as keyof BarChartRaceConfig], source[key as keyof BarChartRaceConfig])
      } else {
        (target as any)[key] = (source as any)[key]
      }
    })
  }

  /**
   * Generate multiple configuration variants for A/B testing
   */
  static generateVariants(
    characteristics: DataCharacteristics,
    options: ConfigGenerationOptions,
    variantCount: number = 3
  ): BarChartRaceConfig[] {
    const variants: BarChartRaceConfig[] = []
    
    // Generate base configuration
    const baseConfig = this.generateConfiguration(characteristics, options)
    variants.push(baseConfig)
    
    // Generate variants with different styles
    for (let i = 1; i < variantCount; i++) {
      const variantOptions = { ...options }
      
      // Vary style
      const styles = ['professional', 'casual', 'energetic', 'minimal', 'creative']
      variantOptions.style = styles[i % styles.length] as any
      
      // Vary some parameters
      if (i === 1) {
        variantOptions.outputFormat = 'portrait'
      } else if (i === 2) {
        variantOptions.duration = 'short'
      }
      
      variants.push(this.generateConfiguration(characteristics, variantOptions))
    }
    
    return variants
  }

  /**
   * Score configuration quality based on data characteristics
   */
  static scoreConfiguration(
    config: BarChartRaceConfig,
    characteristics: DataCharacteristics
  ): number {
    let score = 0
    
    // Score based on duration appropriateness
    const optimalDuration = this.calculateOptimalDuration(characteristics)
    const durationScore = 1 - Math.abs(config.output.duration - optimalDuration) / optimalDuration
    score += durationScore * 0.2
    
    // Score based on visible item count
    const optimalItemCount = Math.min(Math.max(5, Math.floor(characteristics.columnCount * 0.8)), 15)
    const itemCountScore = 1 - Math.abs(config.layers.chart.chart.visibleItemCount - optimalItemCount) / optimalItemCount
    score += itemCountScore * 0.2
    
    // Score based on performance considerations
    const performanceScore = this.calculatePerformanceScore(config, characteristics)
    score += performanceScore * 0.3
    
    // Score based on visual appeal
    const visualScore = this.calculateVisualScore(config)
    score += visualScore * 0.3
    
    return Math.max(0, Math.min(1, score))
  }

  private static calculatePerformanceScore(config: BarChartRaceConfig, characteristics: DataCharacteristics): number {
    let score = 1
    
    // Penalize high settings for large datasets
    if (characteristics.rowCount > 1000) {
      if (config.output.quality === 'max') score -= 0.3
      if (config.output.fps > 30) score -= 0.2
    }
    
    // Penalize very long durations
    if (config.output.duration > 120) score -= 0.2
    
    return Math.max(0, score)
  }

  private static calculateVisualScore(config: BarChartRaceConfig): number {
    let score = 0.5 // Base score
    
    // Bonus for having title
    if (config.layers.title) score += 0.2
    
    // Bonus for having date display
    if (config.layers.date) score += 0.1
    
    // Bonus for showing images
    if (config.layers.chart.images?.show) score += 0.1
    
    // Bonus for reasonable font sizes
    if (config.layers.chart.labels.title.fontSize >= 20) score += 0.1
    
    return Math.min(1, score)
  }
}