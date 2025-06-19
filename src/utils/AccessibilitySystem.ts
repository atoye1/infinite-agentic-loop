import { BarChartRaceConfig } from '../types/config'

export interface AccessibilityOptions {
  level: 'AA' | 'AAA' // WCAG compliance level
  features: {
    highContrast: boolean
    largeText: boolean
    reducedMotion: boolean
    colorBlindFriendly: boolean
    screenReaderOptimized: boolean
    dyslexiaFriendly: boolean
    slowAnimations: boolean
    enhancedFocus: boolean
  }
  customizations?: {
    minFontSize?: number
    minContrastRatio?: number
    maxAnimationDuration?: number
    colorPalette?: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome'
  }
}

export interface ResponsiveBreakpoint {
  name: string
  minWidth: number
  maxWidth?: number
  config: Partial<BarChartRaceConfig>
}

export interface ResponsiveConfig {
  baseConfig: BarChartRaceConfig
  breakpoints: ResponsiveBreakpoint[]
  scalingStrategy: 'proportional' | 'discrete' | 'adaptive'
  aspectRatioStrategy: 'maintain' | 'optimize' | 'flexible'
}

export interface AccessibilityAudit {
  score: number // 0-100
  level: 'A' | 'AA' | 'AAA' | 'Fail'
  issues: AccessibilityIssue[]
  recommendations: string[]
  complianceReport: {
    perceivable: boolean
    operable: boolean
    understandable: boolean
    robust: boolean
  }
}

export interface AccessibilityIssue {
  severity: 'critical' | 'major' | 'minor'
  category: 'color' | 'typography' | 'motion' | 'timing' | 'structure'
  description: string
  element: string
  guideline: string
  suggestion: string
}

export class AccessibilitySystem {
  
  private static colorBlindPalettes = {
    protanopia: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
    deuteranopia: ['#1f77b4', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728'],
    tritanopia: ['#c5b0d5', '#ff9896', '#aec7e8', '#ffbb78', '#98df8a', '#f7b6d3'],
    monochrome: ['#000000', '#404040', '#808080', '#b0b0b0', '#d0d0d0', '#f0f0f0']
  }

  /**
   * Apply accessibility optimizations to configuration
   */
  static applyAccessibilityOptimizations(
    config: BarChartRaceConfig,
    options: AccessibilityOptions
  ): BarChartRaceConfig {
    let accessibleConfig = JSON.parse(JSON.stringify(config)) // Deep clone

    // Apply each accessibility feature
    if (options.features.highContrast) {
      accessibleConfig = this.applyHighContrast(accessibleConfig)
    }

    if (options.features.largeText) {
      accessibleConfig = this.applyLargeText(accessibleConfig, options.customizations?.minFontSize)
    }

    if (options.features.reducedMotion) {
      accessibleConfig = this.applyReducedMotion(accessibleConfig)
    }

    if (options.features.colorBlindFriendly) {
      accessibleConfig = this.applyColorBlindFriendlyPalette(
        accessibleConfig,
        options.customizations?.colorPalette
      )
    }

    if (options.features.screenReaderOptimized) {
      accessibleConfig = this.optimizeForScreenReaders(accessibleConfig)
    }

    if (options.features.dyslexiaFriendly) {
      accessibleConfig = this.applyDyslexiaFriendlyTypography(accessibleConfig)
    }

    if (options.features.slowAnimations) {
      accessibleConfig = this.applySlowAnimations(
        accessibleConfig,
        options.customizations?.maxAnimationDuration
      )
    }

    if (options.features.enhancedFocus) {
      accessibleConfig = this.applyEnhancedFocus(accessibleConfig)
    }

    // Ensure minimum contrast ratios based on WCAG level
    const minContrastRatio = options.level === 'AAA' ? 7.0 : 4.5
    accessibleConfig = this.ensureContrastCompliance(
      accessibleConfig,
      options.customizations?.minContrastRatio || minContrastRatio
    )

    return accessibleConfig
  }

  /**
   * Audit configuration for accessibility compliance
   */
  static auditAccessibility(config: BarChartRaceConfig): AccessibilityAudit {
    const issues: AccessibilityIssue[] = []
    let score = 100

    // Check color contrast
    const contrastIssues = this.checkColorContrast(config)
    issues.push(...contrastIssues)
    score -= contrastIssues.length * 10

    // Check font sizes
    const typographyIssues = this.checkTypography(config)
    issues.push(...typographyIssues)
    score -= typographyIssues.length * 8

    // Check motion and animations
    const motionIssues = this.checkMotionCompliance(config)
    issues.push(...motionIssues)
    score -= motionIssues.length * 6

    // Check timing
    const timingIssues = this.checkTiming(config)
    issues.push(...timingIssues)
    score -= timingIssues.length * 5

    // Check structure and labeling
    const structureIssues = this.checkStructure(config)
    issues.push(...structureIssues)
    score -= structureIssues.length * 7

    score = Math.max(0, score)

    // Determine compliance level
    let level: 'A' | 'AA' | 'AAA' | 'Fail'
    if (score < 60) level = 'Fail'
    else if (score < 75) level = 'A'
    else if (score < 90) level = 'AA'
    else level = 'AAA'

    // Generate compliance report
    const complianceReport = {
      perceivable: !issues.some(i => ['color', 'typography'].includes(i.category)),
      operable: !issues.some(i => ['motion', 'timing'].includes(i.category)),
      understandable: !issues.some(i => i.category === 'structure'),
      robust: true // Assuming robust implementation
    }

    // Generate recommendations
    const recommendations = this.generateAccessibilityRecommendations(issues)

    return {
      score,
      level,
      issues,
      recommendations,
      complianceReport
    }
  }

  /**
   * Create responsive configuration for different screen sizes
   */
  static createResponsiveConfig(
    baseConfig: BarChartRaceConfig,
    targetSizes: { width: number, height: number }[]
  ): ResponsiveConfig {
    const breakpoints: ResponsiveBreakpoint[] = []

    // Create breakpoints for each target size
    targetSizes.forEach((size, index) => {
      const breakpoint: ResponsiveBreakpoint = {
        name: this.getBreakpointName(size.width),
        minWidth: index === 0 ? 0 : targetSizes[index - 1].width + 1,
        maxWidth: index === targetSizes.length - 1 ? undefined : size.width,
        config: this.adaptConfigForSize(baseConfig, size)
      }
      breakpoints.push(breakpoint)
    })

    return {
      baseConfig,
      breakpoints,
      scalingStrategy: 'adaptive',
      aspectRatioStrategy: 'optimize'
    }
  }

  /**
   * Generate configuration for specific screen size
   */
  static adaptConfigForSize(
    config: BarChartRaceConfig,
    targetSize: { width: number, height: number }
  ): Partial<BarChartRaceConfig> {
    const scaleFactor = Math.min(
      targetSize.width / config.output.width,
      targetSize.height / config.output.height
    )

    return {
      output: {
        width: targetSize.width,
        height: targetSize.height,
        fps: config.output.fps,
        duration: config.output.duration,
        quality: config.output.quality,
        format: config.output.format,
        filename: config.output.filename
      },
      layers: {
        chart: {
          position: {
            top: Math.round(config.layers.chart.position.top * scaleFactor),
            right: Math.round(config.layers.chart.position.right * scaleFactor),
            bottom: Math.round(config.layers.chart.position.bottom * scaleFactor),
            left: Math.round(config.layers.chart.position.left * scaleFactor)
          },
          chart: {
            ...config.layers.chart.chart,
            itemSpacing: Math.round(config.layers.chart.chart.itemSpacing * scaleFactor),
            visibleItemCount: this.adaptVisibleItemsForSize(
              config.layers.chart.chart.visibleItemCount,
              targetSize.height
            )
          },
          labels: {
            title: {
              ...config.layers.chart.labels.title,
              fontSize: Math.round(config.layers.chart.labels.title.fontSize * scaleFactor)
            },
            value: {
              ...config.layers.chart.labels.value,
              fontSize: Math.round(config.layers.chart.labels.value.fontSize * scaleFactor)
            },
            rank: {
              ...config.layers.chart.labels.rank,
              fontSize: Math.round(config.layers.chart.labels.rank.fontSize * scaleFactor)
            }
          }
        },
        title: config.layers.title ? {
          ...config.layers.title,
          style: {
            ...config.layers.title.style,
            fontSize: Math.round(config.layers.title.style.fontSize * scaleFactor)
          }
        } : undefined,
        date: config.layers.date ? {
          ...config.layers.date,
          style: {
            ...config.layers.date.style,
            fontSize: Math.round(config.layers.date.style.fontSize * scaleFactor)
          }
        } : undefined
      }
    }
  }

  // Private helper methods for accessibility features

  private static applyHighContrast(config: BarChartRaceConfig): BarChartRaceConfig {
    config.layers.background.color = '#000000'
    config.layers.chart.labels.title.color = '#ffffff'
    config.layers.chart.labels.value.color = '#ffffff'
    config.layers.chart.labels.rank.backgroundColor = '#ffffff'
    config.layers.chart.labels.rank.textColor = '#000000'

    if (config.layers.title) {
      config.layers.title.style.color = '#ffffff'
    }

    if (config.layers.date) {
      config.layers.date.style.color = '#ffffff'
    }

    // Use high-contrast color palette
    config.layers.chart.bar.colors = [
      '#ffffff', '#ffff00', '#ff0000', '#00ff00', '#00ffff', '#ff00ff'
    ]

    return config
  }

  private static applyLargeText(config: BarChartRaceConfig, minFontSize = 18): BarChartRaceConfig {
    config.layers.chart.labels.title.fontSize = Math.max(
      config.layers.chart.labels.title.fontSize * 1.5,
      minFontSize + 6
    )
    config.layers.chart.labels.value.fontSize = Math.max(
      config.layers.chart.labels.value.fontSize * 1.3,
      minFontSize
    )
    config.layers.chart.labels.rank.fontSize = Math.max(
      config.layers.chart.labels.rank.fontSize * 1.3,
      minFontSize - 2
    )

    if (config.layers.title) {
      config.layers.title.style.fontSize = Math.max(
        config.layers.title.style.fontSize * 1.2,
        minFontSize + 12
      )
    }

    if (config.layers.date) {
      config.layers.date.style.fontSize = Math.max(
        config.layers.date.style.fontSize * 1.2,
        minFontSize + 4
      )
    }

    return config
  }

  private static applyReducedMotion(config: BarChartRaceConfig): BarChartRaceConfig {
    config.layers.chart.animation.type = 'discrete'
    config.layers.chart.animation.overtakeDuration = 2.0

    if (config.layers.date) {
      config.layers.date.animation.type = 'fixed'
      config.layers.date.animation.duration = 1.0
    }

    return config
  }

  private static applyColorBlindFriendlyPalette(
    config: BarChartRaceConfig,
    paletteType: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome' = 'deuteranopia'
  ): BarChartRaceConfig {
    config.layers.chart.bar.colors = this.colorBlindPalettes[paletteType]
    return config
  }

  private static optimizeForScreenReaders(config: BarChartRaceConfig): BarChartRaceConfig {
    // Slow down animations to give screen readers time to announce changes
    config.layers.chart.animation.overtakeDuration = Math.max(
      config.layers.chart.animation.overtakeDuration,
      1.5
    )

    // Ensure clear value formatting
    if (!config.layers.chart.labels.value.format.includes('value')) {
      config.layers.chart.labels.value.format = '{value:,.0f}'
    }

    return config
  }

  private static applyDyslexiaFriendlyTypography(config: BarChartRaceConfig): BarChartRaceConfig {
    // Use dyslexia-friendly fonts
    const dyslexiaFriendlyFont = 'OpenDyslexic, Arial, sans-serif'
    
    config.layers.chart.labels.title.fontFamily = dyslexiaFriendlyFont
    config.layers.chart.labels.value.fontFamily = dyslexiaFriendlyFont
    
    if (config.layers.title) {
      config.layers.title.style.fontFamily = dyslexiaFriendlyFont
    }
    
    if (config.layers.date) {
      config.layers.date.style.fontFamily = dyslexiaFriendlyFont
    }

    // Increase line spacing
    config.layers.chart.chart.itemSpacing = Math.round(
      config.layers.chart.chart.itemSpacing * 1.3
    )

    return config
  }

  private static applySlowAnimations(
    config: BarChartRaceConfig,
    maxDuration = 3.0
  ): BarChartRaceConfig {
    config.layers.chart.animation.overtakeDuration = Math.min(
      maxDuration,
      Math.max(config.layers.chart.animation.overtakeDuration, 1.5)
    )

    if (config.layers.date) {
      config.layers.date.animation.duration = Math.min(
        maxDuration / 2,
        Math.max(config.layers.date.animation.duration, 0.8)
      )
    }

    return config
  }

  private static applyEnhancedFocus(config: BarChartRaceConfig): BarChartRaceConfig {
    // Add visual emphasis to important elements
    config.layers.chart.labels.rank.backgroundColor = '#ffd700'
    config.layers.chart.labels.rank.textColor = '#000000'
    
    // Increase contrast for better focus visibility
    config.layers.chart.bar.opacity = 100
    
    return config
  }

  private static ensureContrastCompliance(
    config: BarChartRaceConfig,
    minRatio: number
  ): BarChartRaceConfig {
    // Check and adjust text colors to meet contrast requirements
    const backgroundColor = config.layers.background.color
    
    config.layers.chart.labels.title.color = this.ensureContrast(
      config.layers.chart.labels.title.color,
      backgroundColor,
      minRatio
    )
    
    config.layers.chart.labels.value.color = this.ensureContrast(
      config.layers.chart.labels.value.color,
      backgroundColor,
      minRatio
    )

    if (config.layers.title) {
      config.layers.title.style.color = this.ensureContrast(
        config.layers.title.style.color,
        backgroundColor,
        minRatio
      )
    }

    if (config.layers.date) {
      config.layers.date.style.color = this.ensureContrast(
        config.layers.date.style.color,
        backgroundColor,
        minRatio
      )
    }

    return config
  }

  // Audit helper methods

  private static checkColorContrast(config: BarChartRaceConfig): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []
    const backgroundColor = config.layers.background.color

    // Check title contrast
    const titleContrast = this.calculateContrast(
      config.layers.chart.labels.title.color,
      backgroundColor
    )
    if (titleContrast < 4.5) {
      issues.push({
        severity: 'critical',
        category: 'color',
        description: `Title text contrast ratio is ${titleContrast.toFixed(2)}, below WCAG AA minimum of 4.5`,
        element: 'chart.labels.title',
        guideline: 'WCAG 2.1 SC 1.4.3',
        suggestion: 'Increase contrast between title text and background colors'
      })
    }

    // Check value label contrast
    const valueContrast = this.calculateContrast(
      config.layers.chart.labels.value.color,
      backgroundColor
    )
    if (valueContrast < 4.5) {
      issues.push({
        severity: 'major',
        category: 'color',
        description: `Value label contrast ratio is ${valueContrast.toFixed(2)}, below WCAG AA minimum`,
        element: 'chart.labels.value',
        guideline: 'WCAG 2.1 SC 1.4.3',
        suggestion: 'Improve contrast for value labels'
      })
    }

    return issues
  }

  private static checkTypography(config: BarChartRaceConfig): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []

    // Check minimum font sizes
    if (config.layers.chart.labels.title.fontSize < 16) {
      issues.push({
        severity: 'major',
        category: 'typography',
        description: `Title font size ${config.layers.chart.labels.title.fontSize}px is below recommended minimum of 16px`,
        element: 'chart.labels.title.fontSize',
        guideline: 'WCAG 2.1 SC 1.4.4',
        suggestion: 'Increase title font size to at least 16px'
      })
    }

    if (config.layers.chart.labels.value.fontSize < 14) {
      issues.push({
        severity: 'minor',
        category: 'typography',
        description: `Value label font size ${config.layers.chart.labels.value.fontSize}px is below recommended minimum`,
        element: 'chart.labels.value.fontSize',
        guideline: 'WCAG 2.1 SC 1.4.4',
        suggestion: 'Consider increasing value label font size'
      })
    }

    return issues
  }

  private static checkMotionCompliance(config: BarChartRaceConfig): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []

    // Check animation duration
    if (config.layers.chart.animation.overtakeDuration < 0.3) {
      issues.push({
        severity: 'major',
        category: 'motion',
        description: `Animation duration ${config.layers.chart.animation.overtakeDuration}s may be too fast for some users`,
        element: 'chart.animation.overtakeDuration',
        guideline: 'WCAG 2.1 SC 2.3.3',
        suggestion: 'Consider providing option for reduced motion or slower animations'
      })
    }

    return issues
  }

  private static checkTiming(config: BarChartRaceConfig): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []

    // Check if duration allows sufficient time to process information
    const itemsPerSecond = config.layers.chart.chart.visibleItemCount / config.output.duration
    if (itemsPerSecond > 2) {
      issues.push({
        severity: 'minor',
        category: 'timing',
        description: 'Information density may be too high for some users to process',
        element: 'output.duration',
        guideline: 'WCAG 2.1 SC 2.2.1',
        suggestion: 'Consider longer duration or fewer visible items'
      })
    }

    return issues
  }

  private static checkStructure(config: BarChartRaceConfig): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []

    // Check if title is present
    if (!config.layers.title) {
      issues.push({
        severity: 'major',
        category: 'structure',
        description: 'Chart lacks a descriptive title',
        element: 'layers.title',
        guideline: 'WCAG 2.1 SC 1.3.1',
        suggestion: 'Add a descriptive title to provide context'
      })
    }

    // Check value formatting
    if (!config.layers.chart.labels.value.format.includes('value')) {
      issues.push({
        severity: 'minor',
        category: 'structure',
        description: 'Value format may not be clear for screen readers',
        element: 'chart.labels.value.format',
        guideline: 'WCAG 2.1 SC 1.3.1',
        suggestion: 'Ensure value format includes clear numeric representation'
      })
    }

    return issues
  }

  // Utility methods

  private static calculateContrast(color1: string, color2: string): number {
    const getLuminance = (hex: string): number => {
      const rgb = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
      ].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
    }
    
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }

  private static ensureContrast(textColor: string, backgroundColor: string, minRatio: number): string {
    const currentContrast = this.calculateContrast(textColor, backgroundColor)
    
    if (currentContrast >= minRatio) {
      return textColor
    }
    
    // Try to adjust brightness to meet contrast requirement
    const backgroundLuminance = this.getLuminance(backgroundColor)
    
    // If background is light, use dark text; if dark, use light text
    return backgroundLuminance > 0.5 ? '#000000' : '#ffffff'
  }

  private static getLuminance(hex: string): number {
    const rgb = [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
  }

  private static generateAccessibilityRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations: string[] = []
    
    const criticalIssues = issues.filter(i => i.severity === 'critical')
    const majorIssues = issues.filter(i => i.severity === 'major')
    
    if (criticalIssues.length > 0) {
      recommendations.push('Address critical accessibility issues immediately to ensure basic usability')
    }
    
    if (majorIssues.length > 0) {
      recommendations.push('Resolve major accessibility issues to improve user experience for people with disabilities')
    }
    
    if (issues.some(i => i.category === 'color')) {
      recommendations.push('Consider implementing a high-contrast mode option')
    }
    
    if (issues.some(i => i.category === 'motion')) {
      recommendations.push('Provide user controls for animation speed and motion preferences')
    }
    
    if (issues.some(i => i.category === 'typography')) {
      recommendations.push('Allow users to customize font sizes and choose dyslexia-friendly fonts')
    }
    
    recommendations.push('Test configuration with assistive technologies like screen readers')
    recommendations.push('Consider conducting usability testing with users who have disabilities')
    
    return recommendations
  }

  private static getBreakpointName(width: number): string {
    if (width < 576) return 'xs'
    if (width < 768) return 'sm'
    if (width < 992) return 'md'
    if (width < 1200) return 'lg'
    if (width < 1400) return 'xl'
    return 'xxl'
  }

  private static adaptVisibleItemsForSize(baseCount: number, height: number): number {
    // Adjust visible items based on screen height
    if (height < 600) return Math.max(5, Math.floor(baseCount * 0.6))
    if (height < 800) return Math.max(6, Math.floor(baseCount * 0.8))
    return baseCount
  }
}