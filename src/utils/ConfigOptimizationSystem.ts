import { BarChartRaceConfig } from '../types/config'
import { DataCharacteristics } from '../config/ConfigGenerator'
import { AccessibilityAudit } from './AccessibilitySystem'

export interface OptimizationRecommendation {
  id: string
  category: 'performance' | 'visual' | 'accessibility' | 'data-accuracy' | 'engagement'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: {
    performance: number // -5 to +5
    quality: number // -5 to +5
    accessibility: number // -5 to +5
    engagement: number // -5 to +5
  }
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard'
    timeEstimate: string
    changes: Partial<BarChartRaceConfig>
  }
  reasoning: string
  benefits: string[]
  tradeoffs: string[]
  conditions?: string[] // When this recommendation applies
}

export interface OptimizationReport {
  overallScore: number // 0-100
  categoryScores: {
    performance: number
    visual: number
    accessibility: number
    dataAccuracy: number
    engagement: number
  }
  recommendations: OptimizationRecommendation[]
  quickWins: OptimizationRecommendation[]
  criticalIssues: OptimizationRecommendation[]
  summary: string
  estimatedImprovements: {
    performanceGain: number
    qualityImprovement: number
    accessibilityImprovement: number
    engagementBoost: number
  }
}

export interface OptimizationContext {
  purpose: 'presentation' | 'social-media' | 'analysis' | 'marketing' | 'report'
  audience: 'technical' | 'business' | 'general' | 'academic'
  constraints: {
    maxDuration?: number
    maxFileSize?: number
    minQuality?: 'low' | 'medium' | 'high' | 'max'
    targetFPS?: number
    accessibility?: boolean
    performance?: boolean
  }
  priorities: {
    performance: number // 1-10
    quality: number // 1-10
    accessibility: number // 1-10
    engagement: number // 1-10
  }
}

export class ConfigOptimizationSystem {
  
  private static optimizationRules: OptimizationRecommendation[] = [
    // Performance optimizations
    {
      id: 'reduce-fps-large-dataset',
      category: 'performance',
      priority: 'high',
      title: 'Reduce Frame Rate for Large Datasets',
      description: 'Lower FPS to improve rendering performance with large amounts of data',
      impact: { performance: 4, quality: -1, accessibility: 1, engagement: -1 },
      implementation: {
        difficulty: 'easy',
        timeEstimate: '1 minute',
        changes: { output: { fps: 24 } }
      },
      reasoning: 'High frame rates with large datasets can cause performance issues and are often unnecessary',
      benefits: ['Faster rendering', 'Lower memory usage', 'Better stability'],
      tradeoffs: ['Slightly less smooth animation'],
      conditions: ['large-dataset', 'high-fps']
    },
    
    {
      id: 'optimize-quality-duration',
      category: 'performance',
      priority: 'medium',
      title: 'Balance Quality and Duration',
      description: 'Adjust quality settings for long-duration videos to manage file size',
      impact: { performance: 3, quality: -1, accessibility: 0, engagement: 0 },
      implementation: {
        difficulty: 'easy',
        timeEstimate: '1 minute',
        changes: { output: { quality: 'medium' } }
      },
      reasoning: 'Long videos with high quality settings result in very large files',
      benefits: ['Smaller file size', 'Faster upload/sharing', 'Lower bandwidth usage'],
      tradeoffs: ['Slightly reduced visual quality'],
      conditions: ['long-duration']
    },

    // Visual optimizations
    {
      id: 'increase-item-spacing',
      category: 'visual',
      priority: 'medium',
      title: 'Increase Item Spacing for Better Readability',
      description: 'Add more space between chart items to improve visual clarity',
      impact: { performance: 0, quality: 2, accessibility: 2, engagement: 1 },
      implementation: {
        difficulty: 'easy',
        timeEstimate: '1 minute',
        changes: {
          layers: {
            chart: {
              chart: { itemSpacing: 25 }
            }
          }
        }
      },
      reasoning: 'Crowded layouts make it difficult to distinguish between items',
      benefits: ['Better readability', 'Cleaner appearance', 'Easier to follow'],
      tradeoffs: ['May require larger canvas or fewer visible items'],
      conditions: ['many-columns', 'small-spacing']
    },

    {
      id: 'optimize-color-accessibility',
      category: 'accessibility',
      priority: 'high',
      title: 'Use Color-Blind Friendly Palette',
      description: 'Switch to a color palette that works for users with color vision deficiencies',
      impact: { performance: 0, quality: 1, accessibility: 5, engagement: 0 },
      implementation: {
        difficulty: 'easy',
        timeEstimate: '2 minutes',
        changes: {
          layers: {
            chart: {
              bar: {
                colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
              }
            }
          }
        }
      },
      reasoning: 'Standard color palettes often exclude users with color vision deficiencies',
      benefits: ['Inclusive design', 'Better accessibility', 'Professional appearance'],
      tradeoffs: ['May be less vibrant than original colors'],
      conditions: ['low-contrast', 'accessibility-required']
    },

    {
      id: 'increase-font-sizes',
      category: 'accessibility',
      priority: 'high',
      title: 'Increase Font Sizes for Better Readability',
      description: 'Make text larger to improve readability across different viewing conditions',
      impact: { performance: 0, quality: 2, accessibility: 4, engagement: 1 },
      implementation: {
        difficulty: 'easy',
        timeEstimate: '2 minutes',
        changes: {
          layers: {
            chart: {
              labels: {
                title: { fontSize: 26 },
                value: { fontSize: 22 },
                rank: { fontSize: 20 }
              }
            }
          }
        }
      },
      reasoning: 'Small text is difficult to read, especially on mobile devices or projectors',
      benefits: ['Better readability', 'Accessibility compliance', 'Professional appearance'],
      tradeoffs: ['May require layout adjustments'],
      conditions: ['small-fonts', 'mobile-target']
    },

    // Data accuracy optimizations
    {
      id: 'use-local-scaling',
      category: 'data-accuracy',
      priority: 'medium',
      title: 'Use Local Scaling for Volatile Data',
      description: 'Switch to local scaling to better show relative changes in volatile data',
      impact: { performance: 0, quality: 3, accessibility: 0, engagement: 2 },
      implementation: {
        difficulty: 'easy',
        timeEstimate: '1 minute',
        changes: {
          layers: {
            chart: {
              chart: { maxValue: 'local' }
            }
          }
        }
      },
      reasoning: 'Global scaling can hide important trends in highly variable data',
      benefits: ['Better trend visibility', 'More engaging visualization', 'Clearer comparisons'],
      tradeoffs: ['May be misleading for absolute comparisons'],
      conditions: ['high-volatility', 'wide-value-range']
    },

    {
      id: 'optimize-animation-speed',
      category: 'engagement',
      priority: 'medium',
      title: 'Optimize Animation Speed for Data Complexity',
      description: 'Adjust animation timing based on data complexity and viewer needs',
      impact: { performance: 1, quality: 1, accessibility: 2, engagement: 3 },
      implementation: {
        difficulty: 'medium',
        timeEstimate: '3 minutes',
        changes: {
          layers: {
            chart: {
              animation: { overtakeDuration: 0.6 }
            }
          }
        }
      },
      reasoning: 'Animation speed should match data complexity and audience needs',
      benefits: ['Better comprehension', 'Improved engagement', 'Professional pacing'],
      tradeoffs: ['May affect overall video duration'],
      conditions: ['complex-data', 'business-audience']
    },

    // Engagement optimizations
    {
      id: 'add-visual-hierarchy',
      category: 'engagement',
      priority: 'medium',
      title: 'Enhance Visual Hierarchy',
      description: 'Improve the visual hierarchy to guide viewer attention effectively',
      impact: { performance: 0, quality: 3, accessibility: 1, engagement: 4 },
      implementation: {
        difficulty: 'medium',
        timeEstimate: '5 minutes',
        changes: {
          layers: {
            chart: {
              labels: {
                rank: {
                  show: true,
                  backgroundColor: '#ff6b35',
                  textColor: '#ffffff'
                }
              }
            }
          }
        }
      },
      reasoning: 'Clear visual hierarchy helps viewers understand the most important information',
      benefits: ['Better storytelling', 'Clearer communication', 'Increased engagement'],
      tradeoffs: ['Slightly more complex visual design'],
      conditions: ['presentation-purpose', 'business-audience']
    },

    {
      id: 'optimize-mobile-layout',
      category: 'visual',
      priority: 'high',
      title: 'Optimize for Mobile Viewing',
      description: 'Adjust layout and sizing for better mobile experience',
      impact: { performance: 1, quality: 2, accessibility: 3, engagement: 3 },
      implementation: {
        difficulty: 'medium',
        timeEstimate: '10 minutes',
        changes: {
          output: { width: 1080, height: 1920 },
          layers: {
            chart: {
              position: { top: 300, bottom: 250, left: 40, right: 40 },
              chart: { itemSpacing: 30 }
            }
          }
        }
      },
      reasoning: 'Mobile consumption requires different layout considerations',
      benefits: ['Better mobile experience', 'Wider audience reach', 'Social media optimization'],
      tradeoffs: ['May not work well on desktop'],
      conditions: ['social-media-purpose', 'mobile-target']
    }
  ]

  /**
   * Generate comprehensive optimization report
   */
  static generateOptimizationReport(
    config: BarChartRaceConfig,
    data: DataCharacteristics,
    context: OptimizationContext,
    accessibilityAudit?: AccessibilityAudit
  ): OptimizationReport {
    
    // Calculate current scores
    const categoryScores = this.calculateCategoryScores(config, data, accessibilityAudit)
    const overallScore = this.calculateOverallScore(categoryScores, context.priorities)
    
    // Get applicable recommendations
    const recommendations = this.getApplicableRecommendations(config, data, context)
    
    // Categorize recommendations
    const quickWins = recommendations.filter(r => 
      r.implementation.difficulty === 'easy' && r.priority !== 'low'
    )
    
    const criticalIssues = recommendations.filter(r => 
      r.priority === 'critical'
    )
    
    // Generate summary
    const summary = this.generateSummary(overallScore, recommendations, context)
    
    // Estimate improvements
    const estimatedImprovements = this.estimateImprovements(recommendations, context.priorities)
    
    return {
      overallScore,
      categoryScores,
      recommendations,
      quickWins,
      criticalIssues,
      summary,
      estimatedImprovements
    }
  }

  /**
   * Apply selected optimizations to configuration
   */
  static applyOptimizations(
    config: BarChartRaceConfig,
    recommendationIds: string[]
  ): BarChartRaceConfig {
    let optimizedConfig = JSON.parse(JSON.stringify(config)) // Deep clone
    
    // Apply each selected recommendation
    recommendationIds.forEach(id => {
      const recommendation = this.optimizationRules.find(r => r.id === id)
      if (recommendation) {
        optimizedConfig = this.mergeConfigChanges(optimizedConfig, recommendation.implementation.changes)
      }
    })
    
    return optimizedConfig
  }

  /**
   * Get quick optimization suggestions
   */
  static getQuickOptimizations(
    config: BarChartRaceConfig,
    data: DataCharacteristics
  ): OptimizationRecommendation[] {
    const context: OptimizationContext = {
      purpose: 'analysis',
      audience: 'general',
      constraints: {},
      priorities: { performance: 5, quality: 5, accessibility: 5, engagement: 5 }
    }
    
    const allRecommendations = this.getApplicableRecommendations(config, data, context)
    
    return allRecommendations
      .filter(r => r.implementation.difficulty === 'easy' && r.priority !== 'low')
      .sort((a, b) => this.priorityScore(b) - this.priorityScore(a))
      .slice(0, 5)
  }

  /**
   * Validate optimization compatibility
   */
  static validateOptimizations(
    config: BarChartRaceConfig,
    recommendationIds: string[]
  ): { isValid: boolean, conflicts: string[], warnings: string[] } {
    const conflicts: string[] = []
    const warnings: string[] = []
    
    // Check for conflicting recommendations
    const recommendations = recommendationIds.map(id => 
      this.optimizationRules.find(r => r.id === id)
    ).filter(Boolean) as OptimizationRecommendation[]
    
    // Check performance vs quality conflicts
    const performanceChanges = recommendations.filter(r => r.impact.performance > 2)
    const qualityChanges = recommendations.filter(r => r.impact.quality < -1)
    
    if (performanceChanges.length > 0 && qualityChanges.length > 0) {
      warnings.push('Some optimizations may reduce quality in favor of performance')
    }
    
    // Check FPS conflicts
    const fpsChanges = recommendations.filter(r => 
      r.implementation.changes.output?.fps
    )
    
    if (fpsChanges.length > 1) {
      conflicts.push('Multiple recommendations try to change FPS settings')
    }
    
    // Check layout conflicts
    const layoutChanges = recommendations.filter(r => 
      r.implementation.changes.layers?.chart?.position ||
      r.implementation.changes.output?.width ||
      r.implementation.changes.output?.height
    )
    
    if (layoutChanges.length > 1) {
      warnings.push('Multiple layout changes may interact unexpectedly')
    }
    
    return {
      isValid: conflicts.length === 0,
      conflicts,
      warnings
    }
  }

  /**
   * Get optimization history and trends
   */
  static getOptimizationTrends(
    configs: BarChartRaceConfig[],
    appliedOptimizations: string[][]
  ): {
    popularOptimizations: { id: string, count: number, successRate: number }[]
    categoryTrends: Record<string, number>
    effectivenessRatings: Record<string, number>
  } {
    const optimizationCounts: Record<string, number> = {}
    const categoryTrends: Record<string, number> = {}
    
    // Count optimization usage
    appliedOptimizations.flat().forEach(id => {
      optimizationCounts[id] = (optimizationCounts[id] || 0) + 1
      
      const recommendation = this.optimizationRules.find(r => r.id === id)
      if (recommendation) {
        categoryTrends[recommendation.category] = (categoryTrends[recommendation.category] || 0) + 1
      }
    })
    
    // Calculate popularity and success rates (mock data)
    const popularOptimizations = Object.entries(optimizationCounts).map(([id, count]) => ({
      id,
      count,
      successRate: 0.7 + Math.random() * 0.3 // Mock success rate
    }))
    
    // Mock effectiveness ratings
    const effectivenessRatings: Record<string, number> = {}
    this.optimizationRules.forEach(rule => {
      effectivenessRatings[rule.id] = 3 + Math.random() * 2 // 3-5 rating
    })
    
    return {
      popularOptimizations,
      categoryTrends,
      effectivenessRatings
    }
  }

  // Private helper methods

  private static calculateCategoryScores(
    config: BarChartRaceConfig,
    data: DataCharacteristics,
    accessibilityAudit?: AccessibilityAudit
  ): OptimizationReport['categoryScores'] {
    return {
      performance: this.calculatePerformanceScore(config, data),
      visual: this.calculateVisualScore(config),
      accessibility: accessibilityAudit?.score || this.calculateAccessibilityScore(config),
      dataAccuracy: this.calculateDataAccuracyScore(config, data),
      engagement: this.calculateEngagementScore(config)
    }
  }

  private static calculatePerformanceScore(config: BarChartRaceConfig, data: DataCharacteristics): number {
    let score = 100
    
    // Penalize high settings with large data
    if (data.rowCount > 1000) {
      if (config.output.fps > 30) score -= 20
      if (config.output.quality === 'max') score -= 15
      if (config.output.duration > 120) score -= 10
    }
    
    // Penalize very high FPS
    if (config.output.fps > 60) score -= 15
    
    // Reward optimized settings
    if (config.output.quality === 'medium' && data.rowCount > 500) score += 10
    
    return Math.max(0, Math.min(100, score))
  }

  private static calculateVisualScore(config: BarChartRaceConfig): number {
    let score = 70 // Base score
    
    // Reward good practices
    if (config.layers.title) score += 15
    if (config.layers.date) score += 10
    if (config.layers.chart.images?.show) score += 10
    if (config.layers.chart.chart.itemSpacing >= 20) score += 5
    if (config.layers.chart.labels.title.fontSize >= 22) score += 5
    
    return Math.min(100, score)
  }

  private static calculateAccessibilityScore(config: BarChartRaceConfig): number {
    let score = 60 // Base score
    
    // Check font sizes
    if (config.layers.chart.labels.title.fontSize >= 18) score += 15
    if (config.layers.chart.labels.value.fontSize >= 16) score += 10
    
    // Check animation speed
    if (config.layers.chart.animation.overtakeDuration >= 0.5) score += 15
    
    return Math.min(100, score)
  }

  private static calculateDataAccuracyScore(config: BarChartRaceConfig, data: DataCharacteristics): number {
    let score = 80 // Base score
    
    // Check scaling strategy appropriateness
    const avgVolatility = Object.values(data.valueRanges)
      .reduce((sum, range) => sum + range.volatility, 0) / data.columnCount
    
    if (avgVolatility > 0.5 && config.layers.chart.chart.maxValue === 'global') {
      score -= 20 // Global scaling not ideal for volatile data
    }
    
    if (avgVolatility < 0.2 && config.layers.chart.chart.maxValue === 'local') {
      score -= 10 // Local scaling may be misleading for stable data
    }
    
    return Math.max(0, score)
  }

  private static calculateEngagementScore(config: BarChartRaceConfig): number {
    let score = 60 // Base score
    
    // Reward engaging features
    if (config.layers.chart.labels.rank.show) score += 15
    if (config.layers.chart.animation.type === 'continuous') score += 10
    if (config.layers.chart.images?.show) score += 15
    
    return Math.min(100, score)
  }

  private static calculateOverallScore(
    categoryScores: OptimizationReport['categoryScores'],
    priorities: OptimizationContext['priorities']
  ): number {
    const totalPriority = Object.values(priorities).reduce((sum, p) => sum + p, 0)
    
    return Math.round(
      (categoryScores.performance * priorities.performance +
       categoryScores.visual * priorities.quality +
       categoryScores.accessibility * priorities.accessibility +
       categoryScores.engagement * priorities.engagement +
       categoryScores.dataAccuracy * 5) / (totalPriority + 5)
    )
  }

  private static getApplicableRecommendations(
    config: BarChartRaceConfig,
    data: DataCharacteristics,
    context: OptimizationContext
  ): OptimizationRecommendation[] {
    return this.optimizationRules.filter(rule => {
      // Check if conditions are met
      if (rule.conditions) {
        return rule.conditions.every(condition => 
          this.checkCondition(condition, config, data, context)
        )
      }
      
      // Check if recommendation aligns with context priorities
      return this.isRecommendationRelevant(rule, context)
    })
  }

  private static checkCondition(
    condition: string,
    config: BarChartRaceConfig,
    data: DataCharacteristics,
    context: OptimizationContext
  ): boolean {
    switch (condition) {
      case 'large-dataset':
        return data.rowCount > 1000
      case 'high-fps':
        return config.output.fps > 40
      case 'long-duration':
        return config.output.duration > 120
      case 'many-columns':
        return data.columnCount > 15
      case 'high-volatility':
        const avgVolatility = Object.values(data.valueRanges)
          .reduce((sum, range) => sum + range.volatility, 0) / data.columnCount
        return avgVolatility > 0.6
      case 'wide-value-range':
        return Object.values(data.valueRanges).some(range => 
          range.max / Math.max(range.min, 1) > 1000
        )
      case 'small-spacing':
        return config.layers.chart.chart.itemSpacing < 20
      case 'small-fonts':
        return config.layers.chart.labels.title.fontSize < 20
      case 'mobile-target':
        return context.purpose === 'social-media'
      case 'accessibility-required':
        return context.constraints.accessibility === true
      case 'presentation-purpose':
        return context.purpose === 'presentation'
      case 'business-audience':
        return context.audience === 'business'
      case 'complex-data':
        return data.columnCount > 10 && data.rowCount > 100
      case 'low-contrast':
        // Simple check - in real implementation, calculate actual contrast
        return true
      default:
        return true
    }
  }

  private static isRecommendationRelevant(
    rule: OptimizationRecommendation,
    context: OptimizationContext
  ): boolean {
    // Check if the recommendation category aligns with high-priority areas
    const categoryPriority = context.priorities[rule.category as keyof typeof context.priorities] || 5
    
    // Only show recommendations for areas that are prioritized (>= 6)
    return categoryPriority >= 6 || rule.priority === 'critical'
  }

  private static generateSummary(
    overallScore: number,
    recommendations: OptimizationRecommendation[],
    context: OptimizationContext
  ): string {
    const criticalCount = recommendations.filter(r => r.priority === 'critical').length
    const highCount = recommendations.filter(r => r.priority === 'high').length
    const quickWinCount = recommendations.filter(r => 
      r.implementation.difficulty === 'easy' && r.priority !== 'low'
    ).length
    
    let summary = `Configuration scored ${overallScore}/100. `
    
    if (overallScore >= 90) {
      summary += 'Excellent configuration with minimal room for improvement.'
    } else if (overallScore >= 75) {
      summary += 'Good configuration with some optimization opportunities.'
    } else if (overallScore >= 60) {
      summary += 'Decent configuration that would benefit from optimization.'
    } else {
      summary += 'Configuration needs significant optimization.'
    }
    
    if (criticalCount > 0) {
      summary += ` ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} require immediate attention.`
    }
    
    if (highCount > 0) {
      summary += ` ${highCount} high-priority optimization${highCount > 1 ? 's' : ''} available.`
    }
    
    if (quickWinCount > 0) {
      summary += ` ${quickWinCount} quick win${quickWinCount > 1 ? 's' : ''} can be implemented easily.`
    }
    
    return summary
  }

  private static estimateImprovements(
    recommendations: OptimizationRecommendation[],
    priorities: OptimizationContext['priorities']
  ): OptimizationReport['estimatedImprovements'] {
    const improvements = {
      performanceGain: 0,
      qualityImprovement: 0,
      accessibilityImprovement: 0,
      engagementBoost: 0
    }
    
    recommendations.forEach(rec => {
      const weight = this.priorityScore(rec) / 100
      improvements.performanceGain += rec.impact.performance * weight
      improvements.qualityImprovement += rec.impact.quality * weight
      improvements.accessibilityImprovement += rec.impact.accessibility * weight
      improvements.engagementBoost += rec.impact.engagement * weight
    })
    
    return improvements
  }

  private static priorityScore(recommendation: OptimizationRecommendation): number {
    const priorityScores = { low: 25, medium: 50, high: 75, critical: 100 }
    return priorityScores[recommendation.priority]
  }

  private static mergeConfigChanges(
    config: BarChartRaceConfig,
    changes: Partial<BarChartRaceConfig>
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
    
    return deepMerge(result, changes)
  }

  /**
   * Add custom optimization rule
   */
  static addOptimizationRule(rule: OptimizationRecommendation): void {
    this.optimizationRules.push(rule)
  }

  /**
   * Remove optimization rule
   */
  static removeOptimizationRule(ruleId: string): boolean {
    const index = this.optimizationRules.findIndex(r => r.id === ruleId)
    if (index !== -1) {
      this.optimizationRules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Get all optimization rules
   */
  static getAllOptimizationRules(): OptimizationRecommendation[] {
    return [...this.optimizationRules]
  }
}