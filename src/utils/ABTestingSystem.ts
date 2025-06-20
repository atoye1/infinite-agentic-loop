import { BarChartRaceConfig } from '../types/config'
import { DataCharacteristics } from '../config/ConfigGenerator'

export interface ABTestVariant {
  id: string
  name: string
  description: string
  config: BarChartRaceConfig
  hypothesis: string
  expectedOutcome: string
  weight: number // For weighted random selection
  metadata: {
    created: Date
    category: 'visual' | 'performance' | 'accessibility' | 'engagement'
    targetAudience?: string
    estimatedPerformanceImpact?: number
    estimatedEngagement?: number
  }
}

export interface ABTest {
  id: string
  name: string
  description: string
  variants: ABTestVariant[]
  controlVariant: string // ID of control variant
  status: 'draft' | 'active' | 'paused' | 'completed'
  trafficAllocation: Record<string, number> // variant ID -> percentage
  startDate?: Date
  endDate?: Date
  successMetrics: string[]
  results?: ABTestResults
}

export interface ABTestResults {
  totalViews: number
  variantPerformance: Record<string, {
    views: number
    engagement: number
    conversionRate: number
    averageWatchTime: number
    bounceRate: number
    qualityScore: number
  }>
  winner?: string
  confidenceLevel: number
  statisticalSignificance: boolean
  recommendations: string[]
}

export interface VariantGenerationOptions {
  baseConfig: BarChartRaceConfig
  testDimensions: ('colors' | 'typography' | 'animations' | 'layout' | 'performance')[]
  variationIntensity: 'subtle' | 'moderate' | 'bold'
  preserveConstraints?: {
    outputFormat?: boolean
    duration?: boolean
    quality?: boolean
  }
  targetAudience?: 'general' | 'technical' | 'business' | 'creative'
}

export class ABTestingSystem {
  
  private static activeTests: Map<string, ABTest> = new Map()
  private static testHistory: Map<string, ABTest> = new Map()

  /**
   * Generate A/B test variants automatically
   */
  static generateTestVariants(options: VariantGenerationOptions): ABTestVariant[] {
    const variants: ABTestVariant[] = []
    const { baseConfig, testDimensions, variationIntensity } = options
    
    // Control variant (original config)
    variants.push({
      id: 'control',
      name: 'Control (Original)',
      description: 'Original configuration as baseline',
      config: baseConfig,
      hypothesis: 'Original configuration performs as expected',
      expectedOutcome: 'Baseline performance metrics',
      weight: 50, // 50% traffic for control
      metadata: {
        created: new Date(),
        category: 'visual'
      }
    })

    // Generate variants for each test dimension
    testDimensions.forEach((dimension, index) => {
      const variant = this.createVariantForDimension(
        baseConfig,
        dimension,
        variationIntensity,
        index + 1,
        options
      )
      variants.push(variant)
    })

    // Generate combination variants if multiple dimensions
    if (testDimensions.length > 1) {
      const combinationVariant = this.createCombinationVariant(
        baseConfig,
        testDimensions,
        variationIntensity,
        options
      )
      variants.push(combinationVariant)
    }

    return variants
  }

  /**
   * Create a new A/B test
   */
  static createABTest(
    name: string,
    description: string,
    variants: ABTestVariant[],
    successMetrics: string[]
  ): ABTest {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Ensure we have a control variant
    const controlVariant = variants.find(v => v.id === 'control') || variants[0]
    
    // Calculate traffic allocation
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0)
    const trafficAllocation: Record<string, number> = {}
    
    variants.forEach(variant => {
      trafficAllocation[variant.id] = Math.round((variant.weight / totalWeight) * 100)
    })

    const test: ABTest = {
      id: testId,
      name,
      description,
      variants,
      controlVariant: controlVariant.id,
      status: 'draft',
      trafficAllocation,
      successMetrics
    }

    this.activeTests.set(testId, test)
    return test
  }

  /**
   * Start an A/B test
   */
  static startTest(testId: string): boolean {
    const test = this.activeTests.get(testId)
    if (!test) return false

    test.status = 'active'
    test.startDate = new Date()
    return true
  }

  /**
   * Pause an A/B test
   */
  static pauseTest(testId: string): boolean {
    const test = this.activeTests.get(testId)
    if (!test) return false

    test.status = 'paused'
    return true
  }

  /**
   * Complete an A/B test
   */
  static completeTest(testId: string, results: ABTestResults): boolean {
    const test = this.activeTests.get(testId)
    if (!test) return false

    test.status = 'completed'
    test.endDate = new Date()
    test.results = results
    
    // Move to history
    this.testHistory.set(testId, test)
    this.activeTests.delete(testId)
    
    return true
  }

  /**
   * Select variant for user (based on traffic allocation)
   */
  static selectVariantForUser(testId: string, userId?: string): ABTestVariant | null {
    const test = this.activeTests.get(testId)
    if (!test || test.status !== 'active') return null

    // Use user ID for consistent variant assignment, or random selection
    const seed = userId ? this.hashString(userId) : Math.random()
    const randomValue = (seed * 100) % 100

    let cumulativePercentage = 0
    for (const variant of test.variants) {
      cumulativePercentage += test.trafficAllocation[variant.id] || 0
      if (randomValue < cumulativePercentage) {
        return variant
      }
    }

    // Fallback to control variant
    return test.variants.find(v => v.id === test.controlVariant) || test.variants[0]
  }

  /**
   * Get variant by ID for a specific test
   */
  static getVariant(testId: string, variantId: string): ABTestVariant | null {
    const test = this.activeTests.get(testId) || this.testHistory.get(testId)
    if (!test) return null

    return test.variants.find(v => v.id === variantId) || null
  }

  /**
   * Record test interaction for analytics
   */
  static recordInteraction(
    testId: string,
    variantId: string,
    userId: string,
    eventType: 'view' | 'engagement' | 'conversion' | 'bounce',
    metadata?: Record<string, any>
  ): boolean {
    const test = this.activeTests.get(testId)
    if (!test || test.status !== 'active') return false

    // In a real implementation, this would send data to analytics service
    console.log(`AB Test Event: ${testId}/${variantId} - ${eventType}`, {
      userId,
      timestamp: new Date(),
      metadata
    })

    return true
  }

  /**
   * Analyze test results and determine winner
   */
  static analyzeTestResults(testId: string): ABTestResults | null {
    const test = this.activeTests.get(testId) || this.testHistory.get(testId)
    if (!test) return null

    // In a real implementation, this would fetch actual performance data
    // For now, we'll generate mock results
    const mockResults: ABTestResults = {
      totalViews: 10000,
      variantPerformance: {},
      confidenceLevel: 95,
      statisticalSignificance: true,
      recommendations: []
    }

    // Generate mock performance data for each variant
    test.variants.forEach(variant => {
      const views = Math.floor(10000 * (test.trafficAllocation[variant.id] / 100))
      mockResults.variantPerformance[variant.id] = {
        views,
        engagement: 0.15 + Math.random() * 0.3,
        conversionRate: 0.05 + Math.random() * 0.15,
        averageWatchTime: 30 + Math.random() * 60,
        bounceRate: 0.3 + Math.random() * 0.4,
        qualityScore: 6 + Math.random() * 4
      }
    })

    // Determine winner (highest engagement * conversion rate)
    let bestScore = 0
    let winner = test.controlVariant

    Object.entries(mockResults.variantPerformance).forEach(([variantId, performance]) => {
      const score = performance.engagement * performance.conversionRate
      if (score > bestScore) {
        bestScore = score
        winner = variantId
      }
    })

    mockResults.winner = winner
    mockResults.recommendations = this.generateRecommendations(test, mockResults)

    return mockResults
  }

  /**
   * Get active tests
   */
  static getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values())
  }

  /**
   * Get test by ID
   */
  static getTest(testId: string): ABTest | null {
    return this.activeTests.get(testId) || this.testHistory.get(testId) || null
  }

  /**
   * Generate champion config from winning variant
   */
  static generateChampionConfig(testId: string): BarChartRaceConfig | null {
    const test = this.testHistory.get(testId)
    if (!test || !test.results || !test.results.winner) return null

    const winningVariant = test.variants.find(v => v.id === test.results!.winner)
    return winningVariant?.config || null
  }

  // Private helper methods

  private static createVariantForDimension(
    baseConfig: BarChartRaceConfig,
    dimension: string,
    intensity: string,
    variantNumber: number,
    options: VariantGenerationOptions
  ): ABTestVariant {
    const config = JSON.parse(JSON.stringify(baseConfig)) // Deep clone
    let hypothesis = ''
    let expectedOutcome = ''
    let category: 'visual' | 'performance' | 'accessibility' | 'engagement' = 'visual'

    switch (dimension) {
      case 'colors':
        this.varyColors(config, intensity)
        hypothesis = 'Different color scheme will improve visual appeal'
        expectedOutcome = 'Higher engagement and lower bounce rate'
        category = 'visual'
        break

      case 'typography':
        this.varyTypography(config, intensity)
        hypothesis = 'Optimized typography will improve readability'
        expectedOutcome = 'Better comprehension and longer watch time'
        category = 'accessibility'
        break

      case 'animations':
        this.varyAnimations(config, intensity)
        hypothesis = 'Adjusted animation speed will optimize viewing experience'
        expectedOutcome = 'Improved user engagement and completion rate'
        category = 'engagement'
        break

      case 'layout':
        this.varyLayout(config, intensity)
        hypothesis = 'Optimized layout will improve information hierarchy'
        expectedOutcome = 'Better comprehension and visual flow'
        category = 'visual'
        break

      case 'performance':
        this.varyPerformance(config, intensity)
        hypothesis = 'Performance optimizations will reduce load times'
        expectedOutcome = 'Lower bounce rate and higher completion rate'
        category = 'performance'
        break
    }

    return {
      id: `variant_${dimension}_${variantNumber}`,
      name: `${dimension.charAt(0).toUpperCase() + dimension.slice(1)} Variant`,
      description: `Variation focused on ${dimension} optimization`,
      config,
      hypothesis,
      expectedOutcome,
      weight: 25, // Equal weight for variants
      metadata: {
        created: new Date(),
        category,
        targetAudience: options.targetAudience
      }
    }
  }

  private static createCombinationVariant(
    baseConfig: BarChartRaceConfig,
    dimensions: string[],
    intensity: string,
    options: VariantGenerationOptions
  ): ABTestVariant {
    const config = JSON.parse(JSON.stringify(baseConfig)) // Deep clone

    // Apply all dimension variations
    dimensions.forEach(dimension => {
      switch (dimension) {
        case 'colors':
          this.varyColors(config, intensity)
          break
        case 'typography':
          this.varyTypography(config, intensity)
          break
        case 'animations':
          this.varyAnimations(config, intensity)
          break
        case 'layout':
          this.varyLayout(config, intensity)
          break
        case 'performance':
          this.varyPerformance(config, intensity)
          break
      }
    })

    return {
      id: 'variant_combination',
      name: 'Combined Optimization',
      description: `Combination of optimizations: ${dimensions.join(', ')}`,
      config,
      hypothesis: 'Combined optimizations will provide best overall experience',
      expectedOutcome: 'Highest engagement and conversion rates',
      weight: 15, // Slightly lower weight
      metadata: {
        created: new Date(),
        category: 'engagement',
        targetAudience: options.targetAudience
      }
    }
  }

  private static varyColors(config: BarChartRaceConfig, intensity: string): void {
    const intensityMultiplier = intensity === 'subtle' ? 0.3 : intensity === 'moderate' ? 0.6 : 1.0
    
    // Rotate hue of bar colors
    if (Array.isArray(config.layers.chart.bar.colors)) {
      config.layers.chart.bar.colors = config.layers.chart.bar.colors.map(color => 
        this.adjustColorHue(color, 30 * intensityMultiplier)
      )
    }
    
    // Adjust background color slightly
    config.layers.background.color = this.adjustColorBrightness(
      config.layers.background.color,
      0.1 * intensityMultiplier
    )
  }

  private static varyTypography(config: BarChartRaceConfig, intensity: string): void {
    const sizeMultiplier = intensity === 'subtle' ? 1.1 : intensity === 'moderate' ? 1.2 : 1.3
    
    // Adjust font sizes
    config.layers.chart.labels.title.fontSize = Math.round(
      config.layers.chart.labels.title.fontSize * sizeMultiplier
    )
    config.layers.chart.labels.value.fontSize = Math.round(
      config.layers.chart.labels.value.fontSize * sizeMultiplier
    )
    
    if (config.layers.title) {
      config.layers.title.style.fontSize = Math.round(
        config.layers.title.style.fontSize * sizeMultiplier
      )
    }
  }

  private static varyAnimations(config: BarChartRaceConfig, intensity: string): void {
    const speedMultiplier = intensity === 'subtle' ? 0.9 : intensity === 'moderate' ? 0.7 : 0.5
    
    // Adjust animation speed
    config.layers.chart.animation.overtakeDuration *= speedMultiplier
    
    if (config.layers.date) {
      config.layers.date.animation.duration *= speedMultiplier
    }
  }

  private static varyLayout(config: BarChartRaceConfig, intensity: string): void {
    const spacingMultiplier = intensity === 'subtle' ? 1.1 : intensity === 'moderate' ? 1.3 : 1.5
    
    // Adjust spacing
    config.layers.chart.chart.itemSpacing = Math.round(
      config.layers.chart.chart.itemSpacing * spacingMultiplier
    )
    
    // Adjust margins
    config.layers.chart.position.top = Math.round(
      config.layers.chart.position.top * spacingMultiplier
    )
    config.layers.chart.position.bottom = Math.round(
      config.layers.chart.position.bottom * spacingMultiplier
    )
  }

  private static varyPerformance(config: BarChartRaceConfig, intensity: string): void {
    if (intensity === 'bold') {
      config.output.fps = Math.max(20, config.output.fps - 10)
      config.output.quality = 'medium'
    } else if (intensity === 'moderate') {
      config.output.fps = Math.max(24, config.output.fps - 6)
    }
    // Subtle changes don't affect performance significantly
  }

  private static adjustColorHue(hexColor: string, hueDelta: number): string {
    // Simple hue adjustment - in a real implementation, use proper color libraries
    const hsl = this.hexToHsl(hexColor)
    hsl.h = (hsl.h + hueDelta) % 360
    return this.hslToHex(hsl)
  }

  private static adjustColorBrightness(hexColor: string, brightnessDelta: number): string {
    const hsl = this.hexToHsl(hexColor)
    hsl.l = Math.max(0, Math.min(1, hsl.l + brightnessDelta))
    return this.hslToHex(hsl)
  }

  private static hexToHsl(hex: string): { h: number, s: number, l: number } {
    // Convert hex to HSL - simplified implementation
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min
    const add = max + min
    const l = add * 0.5
    
    let s = 0
    let h = 0
    
    if (diff !== 0) {
      s = l < 0.5 ? diff / add : diff / (2 - add)
      
      switch (max) {
        case r: h = ((g - b) / diff) + (g < b ? 6 : 0); break
        case g: h = (b - r) / diff + 2; break
        case b: h = (r - g) / diff + 4; break
      }
      h /= 6
    }
    
    return { h: h * 360, s, l }
  }

  private static hslToHex(hsl: { h: number, s: number, l: number }): string {
    const h = hsl.h / 360
    const s = hsl.s
    const l = hsl.l
    
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    let r: number, g: number, b: number
    
    if (s === 0) {
      r = g = b = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    
    const toHex = (c: number): string => {
      const hex = Math.round(c * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  private static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647 // Normalize to 0-1
  }

  private static generateRecommendations(test: ABTest, results: ABTestResults): string[] {
    const recommendations: string[] = []
    const winner = results.winner
    const winnerPerformance = winner ? results.variantPerformance[winner] : null

    if (winnerPerformance) {
      if (winnerPerformance.engagement > 0.3) {
        recommendations.push('High engagement rate suggests strong visual appeal')
      }
      
      if (winnerPerformance.averageWatchTime > 60) {
        recommendations.push('Extended watch time indicates good content pacing')
      }
      
      if (winnerPerformance.bounceRate < 0.3) {
        recommendations.push('Low bounce rate suggests effective initial impression')
      }
      
      if (winnerPerformance.qualityScore > 8) {
        recommendations.push('High quality score indicates professional presentation')
      }
    }

    recommendations.push(`Implement winning variant (${winner}) across all campaigns`)
    recommendations.push('Consider running follow-up tests to further optimize performance')

    return recommendations
  }
}