import { BarChartRaceConfig } from '../types/config'
import { DataCharacteristics } from './DynamicConfigGenerator'

export interface ConfigCondition {
  id: string
  name: string
  description: string
  condition: (data: DataCharacteristics, config: BarChartRaceConfig) => boolean
  priority: number // Higher priority conditions override lower priority ones
}

export interface ConfigRule {
  id: string
  conditions: string[] // Condition IDs that must be met
  modifications: Partial<BarChartRaceConfig>
  description: string
  category: 'performance' | 'visual' | 'accessibility' | 'data-driven' | 'user-preference'
}

export interface ConfigInheritance {
  baseConfigId: string
  overrides: Partial<BarChartRaceConfig>
  inheritanceRules: {
    colors: 'inherit' | 'override' | 'merge'
    typography: 'inherit' | 'override' | 'merge'
    animations: 'inherit' | 'override' | 'merge'
    layout: 'inherit' | 'override' | 'merge'
  }
}

export class ConditionalConfigSystem {
  
  private static conditions: Map<string, ConfigCondition> = new Map([
    
    // Data size conditions
    ['large-dataset', {
      id: 'large-dataset',
      name: 'Large Dataset',
      description: 'Dataset has more than 1000 data points',
      condition: (data) => data.rowCount > 1000,
      priority: 8
    }],
    
    ['small-dataset', {
      id: 'small-dataset',
      name: 'Small Dataset',
      description: 'Dataset has fewer than 50 data points',
      condition: (data) => data.rowCount < 50,
      priority: 7
    }],
    
    ['many-columns', {
      id: 'many-columns',
      name: 'Many Columns',
      description: 'Dataset has more than 15 columns',
      condition: (data) => data.columnCount > 15,
      priority: 6
    }],
    
    ['few-columns', {
      id: 'few-columns',
      name: 'Few Columns',
      description: 'Dataset has fewer than 5 columns',
      condition: (data) => data.columnCount < 5,
      priority: 5
    }],
    
    // Data volatility conditions
    ['high-volatility', {
      id: 'high-volatility',
      name: 'High Volatility',
      description: 'Data shows high volatility (frequent dramatic changes)',
      condition: (data) => {
        const avgVolatility = Object.values(data.valueRanges)
          .reduce((sum, range) => sum + range.volatility, 0) / data.columnCount
        return avgVolatility > 0.6
      },
      priority: 9
    }],
    
    ['low-volatility', {
      id: 'low-volatility',
      name: 'Low Volatility',
      description: 'Data shows low volatility (stable, gradual changes)',
      condition: (data) => {
        const avgVolatility = Object.values(data.valueRanges)
          .reduce((sum, range) => sum + range.volatility, 0) / data.columnCount
        return avgVolatility < 0.2
      },
      priority: 8
    }],
    
    // Data range conditions
    ['wide-value-range', {
      id: 'wide-value-range',
      name: 'Wide Value Range',
      description: 'Values span several orders of magnitude',
      condition: (data) => {
        return Object.values(data.valueRanges).some(range => 
          range.max / Math.max(range.min, 1) > 1000
        )
      },
      priority: 7
    }],
    
    ['narrow-value-range', {
      id: 'narrow-value-range',
      name: 'Narrow Value Range',
      description: 'Values are within similar ranges',
      condition: (data) => {
        return Object.values(data.valueRanges).every(range => 
          range.max / Math.max(range.min, 1) < 10
        )
      },
      priority: 6
    }],
    
    // Time range conditions
    ['long-time-series', {
      id: 'long-time-series',
      name: 'Long Time Series',
      description: 'Data spans more than 5 years',
      condition: (data) => data.dateRange.durationDays > 1825,
      priority: 5
    }],
    
    ['short-time-series', {
      id: 'short-time-series',
      name: 'Short Time Series',
      description: 'Data spans less than 30 days',
      condition: (data) => data.dateRange.durationDays < 30,
      priority: 4
    }],
    
    // Trend conditions
    ['trending-data', {
      id: 'trending-data',
      name: 'Trending Data',
      description: 'Most columns show clear increasing or decreasing trends',
      condition: (data) => {
        const trendingColumns = Object.values(data.trendPatterns)
          .filter(pattern => pattern === 'increasing' || pattern === 'decreasing').length
        return trendingColumns / data.columnCount > 0.7
      },
      priority: 6
    }],
    
    ['volatile-data', {
      id: 'volatile-data',
      name: 'Volatile Data',
      description: 'Most columns show volatile patterns',
      condition: (data) => {
        const volatileColumns = Object.values(data.trendPatterns)
          .filter(pattern => pattern === 'volatile').length
        return volatileColumns / data.columnCount > 0.5
      },
      priority: 7
    }],
    
    ['stable-data', {
      id: 'stable-data',
      name: 'Stable Data',
      description: 'Most columns show stable patterns',
      condition: (data) => {
        const stableColumns = Object.values(data.trendPatterns)
          .filter(pattern => pattern === 'stable').length
        return stableColumns / data.columnCount > 0.6
      },
      priority: 5
    }],
    
    // Seasonal conditions
    ['seasonal-data', {
      id: 'seasonal-data',
      name: 'Seasonal Data',
      description: 'Data shows seasonal patterns',
      condition: (data) => {
        const seasonalColumns = Object.values(data.seasonality)
          .filter(Boolean).length
        return seasonalColumns / data.columnCount > 0.3
      },
      priority: 6
    }],
    
    // Output format conditions
    ['vertical-format', {
      id: 'vertical-format',
      name: 'Vertical Format',
      description: 'Output is in vertical/portrait format',
      condition: (data, config) => config.output.height > config.output.width,
      priority: 10
    }],
    
    ['square-format', {
      id: 'square-format',
      name: 'Square Format',
      description: 'Output is in square format',
      condition: (data, config) => config.output.height === config.output.width,
      priority: 9
    }],
    
    // Performance conditions
    ['high-fps', {
      id: 'high-fps',
      name: 'High FPS',
      description: 'Output uses high frame rate (>40 FPS)',
      condition: (data, config) => config.output.fps > 40,
      priority: 4
    }],
    
    ['long-duration', {
      id: 'long-duration',
      name: 'Long Duration',
      description: 'Output duration is longer than 2 minutes',
      condition: (data, config) => config.output.duration > 120,
      priority: 5
    }]
  ])

  private static rules: Map<string, ConfigRule> = new Map([
    
    // Performance optimization rules
    ['optimize-large-dataset', {
      id: 'optimize-large-dataset',
      conditions: ['large-dataset'],
      modifications: {
        output: {
          quality: 'medium',
          fps: 24
        }
      },
      description: 'Optimize performance for large datasets',
      category: 'performance'
    }],
    
    ['optimize-long-animation', {
      id: 'optimize-long-animation',
      conditions: ['long-duration', 'large-dataset'],
      modifications: {
        output: {
          fps: 20,
          quality: 'medium'
        },
        layers: {
          chart: {
            animation: {
              type: 'discrete'
            }
          }
        }
      },
      description: 'Optimize for long animations with large datasets',
      category: 'performance'
    }],
    
    // Visual optimization rules
    ['enhance-volatile-visualization', {
      id: 'enhance-volatile-visualization',
      conditions: ['high-volatility'],
      modifications: {
        layers: {
          chart: {
            animation: {
              overtakeDuration: 0.8
            },
            chart: {
              maxValue: 'local'
            }
          }
        }
      },
      description: 'Slow down animations for volatile data',
      category: 'visual'
    }],
    
    ['optimize-stable-visualization', {
      id: 'optimize-stable-visualization',
      conditions: ['stable-data', 'low-volatility'],
      modifications: {
        layers: {
          chart: {
            animation: {
              overtakeDuration: 0.4
            },
            chart: {
              maxValue: 'global'
            }
          }
        }
      },
      description: 'Speed up animations for stable data',
      category: 'visual'
    }],
    
    ['adjust-for-many-columns', {
      id: 'adjust-for-many-columns',
      conditions: ['many-columns'],
      modifications: {
        layers: {
          chart: {
            chart: {
              visibleItemCount: 8,
              itemSpacing: 15
            },
            labels: {
              title: {
                fontSize: 20
              },
              value: {
                fontSize: 16
              }
            }
          }
        }
      },
      description: 'Compact layout for datasets with many columns',
      category: 'visual'
    }],
    
    ['adjust-for-few-columns', {
      id: 'adjust-for-few-columns',
      conditions: ['few-columns'],
      modifications: {
        layers: {
          chart: {
            chart: {
              itemSpacing: 40
            },
            labels: {
              title: {
                fontSize: 28
              },
              value: {
                fontSize: 24
              }
            }
          }
        }
      },
      description: 'Spacious layout for datasets with few columns',
      category: 'visual'
    }],
    
    // Data-driven formatting rules
    ['format-wide-ranges', {
      id: 'format-wide-ranges',
      conditions: ['wide-value-range'],
      modifications: {
        layers: {
          chart: {
            labels: {
              value: {
                format: '{value:.2e}' // Scientific notation for wide ranges
              }
            },
            chart: {
              maxValue: 'local'
            }
          }
        }
      },
      description: 'Use scientific notation for wide value ranges',
      category: 'data-driven'
    }],
    
    ['enhance-seasonal-display', {
      id: 'enhance-seasonal-display',
      conditions: ['seasonal-data'],
      modifications: {
        layers: {
          date: {
            format: {
              pattern: 'MMM YYYY'
            },
            style: {
              fontSize: 32
            }
          }
        }
      },
      description: 'Emphasize date display for seasonal data',
      category: 'data-driven'
    }],
    
    // Format-specific rules
    ['optimize-vertical-layout', {
      id: 'optimize-vertical-layout',
      conditions: ['vertical-format'],
      modifications: {
        layers: {
          chart: {
            position: {
              top: 300,
              bottom: 250,
              left: 40,
              right: 40
            },
            chart: {
              itemSpacing: 25
            }
          },
          title: {
            position: {
              top: 120
            },
            style: {
              fontSize: 48
            }
          }
        }
      },
      description: 'Optimize layout for vertical format',
      category: 'visual'
    }],
    
    ['optimize-square-layout', {
      id: 'optimize-square-layout',
      conditions: ['square-format'],
      modifications: {
        layers: {
          chart: {
            position: {
              top: 120,
              bottom: 120,
              left: 60,
              right: 60
            }
          },
          title: {
            position: {
              top: 40
            },
            style: {
              fontSize: 44
            }
          }
        }
      },
      description: 'Optimize layout for square format',
      category: 'visual'
    }],
    
    // Performance vs Quality tradeoffs
    ['balance-quality-performance', {
      id: 'balance-quality-performance',
      conditions: ['large-dataset', 'high-fps'],
      modifications: {
        output: {
          fps: 30,
          quality: 'medium'
        }
      },
      description: 'Balance quality and performance for demanding settings',
      category: 'performance'
    }]
  ])

  /**
   * Apply conditional configurations based on data characteristics
   */
  static applyConditionalConfig(
    config: BarChartRaceConfig,
    data: DataCharacteristics
  ): BarChartRaceConfig {
    let processedConfig = { ...config }
    
    // Evaluate all conditions
    const metConditions = new Set<string>()
    
    this.conditions.forEach((condition, id) => {
      if (condition.condition(data, processedConfig)) {
        metConditions.add(id)
      }
    })
    
    // Find applicable rules and sort by priority
    const applicableRules: ConfigRule[] = []
    
    this.rules.forEach(rule => {
      const allConditionsMet = rule.conditions.every(conditionId => 
        metConditions.has(conditionId)
      )
      
      if (allConditionsMet) {
        applicableRules.push(rule)
      }
    })
    
    // Sort rules by priority (based on highest priority condition)
    applicableRules.sort((a, b) => {
      const aPriority = Math.max(...a.conditions.map(id => 
        this.conditions.get(id)?.priority || 0
      ))
      const bPriority = Math.max(...b.conditions.map(id => 
        this.conditions.get(id)?.priority || 0
      ))
      return bPriority - aPriority
    })
    
    // Apply rules in priority order
    applicableRules.forEach(rule => {
      processedConfig = this.mergeConfigModifications(processedConfig, rule.modifications)
    })
    
    return processedConfig
  }

  /**
   * Get conditions that are met for given data
   */
  static getMetConditions(
    data: DataCharacteristics,
    config: BarChartRaceConfig
  ): ConfigCondition[] {
    const metConditions: ConfigCondition[] = []
    
    this.conditions.forEach(condition => {
      if (condition.condition(data, config)) {
        metConditions.push(condition)
      }
    })
    
    return metConditions.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get applicable rules for given conditions
   */
  static getApplicableRules(metConditionIds: string[]): ConfigRule[] {
    const applicableRules: ConfigRule[] = []
    const conditionSet = new Set(metConditionIds)
    
    this.rules.forEach(rule => {
      const allConditionsMet = rule.conditions.every(conditionId => 
        conditionSet.has(conditionId)
      )
      
      if (allConditionsMet) {
        applicableRules.push(rule)
      }
    })
    
    return applicableRules
  }

  /**
   * Add custom condition
   */
  static addCondition(condition: ConfigCondition): void {
    this.conditions.set(condition.id, condition)
  }

  /**
   * Add custom rule
   */
  static addRule(rule: ConfigRule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * Remove condition
   */
  static removeCondition(conditionId: string): void {
    this.conditions.delete(conditionId)
    
    // Remove rules that depend on this condition
    this.rules.forEach((rule, ruleId) => {
      if (rule.conditions.includes(conditionId)) {
        this.rules.delete(ruleId)
      }
    })
  }

  /**
   * Remove rule
   */
  static removeRule(ruleId: string): void {
    this.rules.delete(ruleId)
  }

  /**
   * Get all conditions
   */
  static getAllConditions(): ConfigCondition[] {
    return Array.from(this.conditions.values())
  }

  /**
   * Get all rules
   */
  static getAllRules(): ConfigRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Deep merge configuration modifications
   */
  private static mergeConfigModifications(
    config: BarChartRaceConfig,
    modifications: Partial<BarChartRaceConfig>
  ): BarChartRaceConfig {
    const result = JSON.parse(JSON.stringify(config)) // Deep clone
    
    const deepMerge = (target: any, source: any): any => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {}
          deepMerge(target[key], source[key])
        } else {
          target[key] = source[key]
        }
      }
      return target
    }
    
    return deepMerge(result, modifications)
  }

  /**
   * Validate rule dependencies
   */
  static validateRule(rule: ConfigRule): { isValid: boolean, errors: string[] } {
    const errors: string[] = []
    
    // Check if all referenced conditions exist
    rule.conditions.forEach(conditionId => {
      if (!this.conditions.has(conditionId)) {
        errors.push(`Condition '${conditionId}' does not exist`)
      }
    })
    
    // Check for conflicting modifications
    if (rule.modifications.output?.fps && rule.modifications.output.fps > 60) {
      errors.push('FPS should not exceed 60 for performance reasons')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get rule recommendations based on data characteristics
   */
  static getRecommendations(
    data: DataCharacteristics,
    config: BarChartRaceConfig
  ): { condition: ConfigCondition, rules: ConfigRule[] }[] {
    const metConditions = this.getMetConditions(data, config)
    const recommendations: { condition: ConfigCondition, rules: ConfigRule[] }[] = []
    
    metConditions.forEach(condition => {
      const applicableRules = this.getApplicableRules([condition.id])
      if (applicableRules.length > 0) {
        recommendations.push({
          condition,
          rules: applicableRules
        })
      }
    })
    
    return recommendations
  }
}

/**
 * Configuration inheritance and composition system
 */
export class ConfigInheritanceSystem {
  
  private static baseConfigs: Map<string, BarChartRaceConfig> = new Map()
  
  /**
   * Register a base configuration
   */
  static registerBaseConfig(id: string, config: BarChartRaceConfig): void {
    this.baseConfigs.set(id, config)
  }

  /**
   * Create configuration with inheritance
   */
  static createInheritedConfig(inheritance: ConfigInheritance): BarChartRaceConfig {
    const baseConfig = this.baseConfigs.get(inheritance.baseConfigId)
    
    if (!baseConfig) {
      throw new Error(`Base configuration '${inheritance.baseConfigId}' not found`)
    }
    
    return this.applyInheritance(baseConfig, inheritance)
  }

  /**
   * Apply inheritance rules to create final configuration
   */
  private static applyInheritance(
    baseConfig: BarChartRaceConfig,
    inheritance: ConfigInheritance
  ): BarChartRaceConfig {
    const result = JSON.parse(JSON.stringify(baseConfig)) // Deep clone
    
    // Apply overrides based on inheritance rules
    Object.entries(inheritance.overrides).forEach(([section, overrides]) => {
      if (!overrides) return
      
      const ruleName = section as keyof typeof inheritance.inheritanceRules
      const rule = inheritance.inheritanceRules[ruleName] || 'override'
      
      switch (rule) {
        case 'inherit':
          // Keep base config values, do nothing
          break
          
        case 'override':
          // Replace entire section
          (result as any)[section] = overrides
          break
          
        case 'merge':
          // Deep merge
          if (result[section as keyof BarChartRaceConfig]) {
            this.deepMerge(
              result[section as keyof BarChartRaceConfig] as any,
              overrides
            )
          } else {
            (result as any)[section] = overrides
          }
          break
      }
    })
    
    return result
  }

  /**
   * Deep merge objects
   */
  private static deepMerge(target: any, source: any): void {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {}
        }
        this.deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    })
  }

  /**
   * Compose multiple configurations
   */
  static composeConfigurations(
    configs: { config: BarChartRaceConfig, weight: number }[]
  ): BarChartRaceConfig {
    if (configs.length === 0) {
      throw new Error('At least one configuration is required')
    }
    
    if (configs.length === 1) {
      return configs[0].config
    }
    
    // Normalize weights
    const totalWeight = configs.reduce((sum, item) => sum + item.weight, 0)
    const normalizedConfigs = configs.map(item => ({
      config: item.config,
      weight: item.weight / totalWeight
    }))
    
    // Start with the first config as base
    const result = JSON.parse(JSON.stringify(normalizedConfigs[0].config))
    
    // Compose numeric values using weighted averages
    for (let i = 1; i < normalizedConfigs.length; i++) {
      const { config, weight } = normalizedConfigs[i]
      this.blendConfigurations(result, config, weight)
    }
    
    return result
  }

  /**
   * Blend two configurations using weighted average for numeric values
   */
  private static blendConfigurations(
    target: any,
    source: any,
    weight: number
  ): void {
    Object.keys(source).forEach(key => {
      if (typeof source[key] === 'number' && typeof target[key] === 'number') {
        // Weighted average for numeric values
        target[key] = target[key] * (1 - weight) + source[key] * weight
      } else if (typeof source[key] === 'object' && typeof target[key] === 'object') {
        // Recursive blend for objects
        this.blendConfigurations(target[key], source[key], weight)
      } else if (weight > 0.5) {
        // Use source value if weight is significant
        target[key] = source[key]
      }
      // Otherwise keep target value (weight <= 0.5)
    })
  }

  /**
   * Get all registered base configurations
   */
  static getAllBaseConfigs(): Record<string, BarChartRaceConfig> {
    const result: Record<string, BarChartRaceConfig> = {}
    this.baseConfigs.forEach((config, id) => {
      result[id] = config
    })
    return result
  }

  /**
   * Remove base configuration
   */
  static removeBaseConfig(id: string): boolean {
    return this.baseConfigs.delete(id)
  }
}