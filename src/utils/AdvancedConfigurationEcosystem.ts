import { BarChartRaceConfig } from '../types/config'
import { ProcessedData } from '../types/config'

// Import all the advanced systems
import { IndustryTemplates } from './IndustryTemplates'
import { ConfigGenerator as DynamicConfigGenerator } from '../config/ConfigGenerator'
import { AdvancedThemeSystem, BrandProfile, ThemeDefinition } from './AdvancedThemeSystem'
import { ConditionalConfigSystem, ConfigInheritanceSystem, ConfigInheritance } from './ConditionalConfigSystem'
import { ABTestingSystem, ABTestVariant, VariantGenerationOptions } from './ABTestingSystem'
import { AccessibilitySystem, AccessibilityOptions, ResponsiveConfig } from './AccessibilitySystem'
import { ConfigOptimizationSystem, OptimizationContext, OptimizationReport } from './ConfigOptimizationSystem'

export interface AdvancedConfigRequest {
  // Core requirements
  data: ProcessedData
  purpose: 'presentation' | 'social-media' | 'analysis' | 'marketing' | 'report'
  audience: 'technical' | 'business' | 'general' | 'academic'
  
  // Industry and branding
  industry?: string
  brandProfile?: BrandProfile
  customTheme?: ThemeDefinition
  
  // Configuration preferences
  generationOptions?: ConfigGenerationOptions
  baseTemplate?: string
  inheritanceRules?: ConfigInheritance
  
  // Accessibility and responsive design
  accessibilityRequirements?: AccessibilityOptions
  responsiveTargets?: { width: number, height: number }[]
  
  // A/B testing
  enableABTesting?: boolean
  testDimensions?: ('colors' | 'typography' | 'animations' | 'layout' | 'performance')[]
  
  // Optimization
  optimizationContext?: OptimizationContext
  autoOptimize?: boolean
  
  // Output preferences
  outputFormats?: ('landscape' | 'portrait' | 'square')[]
  qualityTargets?: ('performance' | 'quality' | 'accessibility' | 'engagement')[]
}

export interface AdvancedConfigResponse {
  // Primary configuration
  primaryConfig: BarChartRaceConfig
  
  // Alternative configurations
  variants: {
    responsive?: ResponsiveConfig
    accessible?: BarChartRaceConfig
    optimized?: BarChartRaceConfig
    themed?: BarChartRaceConfig[]
  }
  
  // A/B testing variants
  abTestVariants?: ABTestVariant[]
  
  // Analysis and recommendations
  dataAnalysis: DataCharacteristics
  optimizationReport: OptimizationReport
  accessibilityAudit?: any
  
  // Metadata
  metadata: {
    generationTime: number
    appliedSystems: string[]
    confidenceScore: number
    recommendations: string[]
    warnings: string[]
  }
}

/**
 * Advanced Configuration Ecosystem
 * Orchestrates all configuration systems to provide comprehensive configuration generation
 */
export class AdvancedConfigurationEcosystem {
  
  /**
   * Generate comprehensive configuration package
   */
  static async generateAdvancedConfiguration(
    request: AdvancedConfigRequest
  ): Promise<AdvancedConfigResponse> {
    const startTime = Date.now()
    const appliedSystems: string[] = []
    const recommendations: string[] = []
    const warnings: string[] = []
    
    try {
      // 1. Analyze data characteristics
      const dataAnalysis = DynamicConfigGenerator.analyzeDataCharacteristics(request.data)
      appliedSystems.push('Data Analysis')
      
      // 2. Generate base configuration
      let primaryConfig = await this.generateBaseConfiguration(
        request,
        dataAnalysis,
        appliedSystems,
        recommendations
      )
      
      // 3. Apply conditional configurations
      primaryConfig = ConditionalConfigSystem.applyConditionalConfig(primaryConfig, dataAnalysis)
      appliedSystems.push('Conditional Configuration')
      
      // 4. Apply theme if specified
      let themedConfigs: BarChartRaceConfig[] = []
      if (request.brandProfile || request.customTheme || request.industry) {
        const themedConfig = await this.applyAdvancedTheming(
          primaryConfig,
          request,
          appliedSystems,
          recommendations
        )
        if (themedConfig) {
          primaryConfig = themedConfig
          themedConfigs = [themedConfig]
        }
      }
      
      // 5. Generate responsive variants
      let responsiveConfig: ResponsiveConfig | undefined
      if (request.responsiveTargets && request.responsiveTargets.length > 0) {
        responsiveConfig = AccessibilitySystem.createResponsiveConfig(
          primaryConfig,
          request.responsiveTargets
        )
        appliedSystems.push('Responsive Design')
      }
      
      // 6. Generate accessible variant
      let accessibleConfig: BarChartRaceConfig | undefined
      let accessibilityAudit: any
      if (request.accessibilityRequirements) {
        accessibleConfig = AccessibilitySystem.applyAccessibilityOptimizations(
          primaryConfig,
          request.accessibilityRequirements
        )
        accessibilityAudit = AccessibilitySystem.auditAccessibility(primaryConfig)
        appliedSystems.push('Accessibility System')
        
        if (accessibilityAudit.level === 'Fail') {
          warnings.push('Configuration fails basic accessibility requirements')
        }
      }
      
      // 7. Generate optimization report and optimized variant
      const optimizationContext = request.optimizationContext || this.createDefaultOptimizationContext(request)
      const optimizationReport = ConfigOptimizationSystem.generateOptimizationReport(
        primaryConfig,
        dataAnalysis,
        optimizationContext,
        accessibilityAudit
      )
      appliedSystems.push('Optimization System')
      
      let optimizedConfig: BarChartRaceConfig | undefined
      if (request.autoOptimize && optimizationReport.quickWins.length > 0) {
        const quickWinIds = optimizationReport.quickWins.map(qw => qw.id)
        optimizedConfig = ConfigOptimizationSystem.applyOptimizations(primaryConfig, quickWinIds)
        recommendations.push(`Applied ${quickWinIds.length} quick optimizations`)
      }
      
      // 8. Generate A/B testing variants
      let abTestVariants: ABTestVariant[] | undefined
      if (request.enableABTesting && request.testDimensions) {
        const variantOptions: VariantGenerationOptions = {
          baseConfig: primaryConfig,
          testDimensions: request.testDimensions,
          variationIntensity: 'moderate',
          targetAudience: request.audience
        }
        abTestVariants = ABTestingSystem.generateTestVariants(variantOptions)
        appliedSystems.push('A/B Testing System')
        recommendations.push(`Generated ${abTestVariants.length} A/B test variants`)
      }
      
      // 9. Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(
        dataAnalysis,
        optimizationReport,
        appliedSystems.length,
        warnings.length
      )
      
      // 10. Generate final recommendations
      this.generateFinalRecommendations(
        optimizationReport,
        dataAnalysis,
        request,
        recommendations
      )
      
      const generationTime = Date.now() - startTime
      
      return {
        primaryConfig,
        variants: {
          responsive: responsiveConfig,
          accessible: accessibleConfig,
          optimized: optimizedConfig,
          themed: themedConfigs.length > 0 ? themedConfigs : undefined
        },
        abTestVariants,
        dataAnalysis,
        optimizationReport,
        accessibilityAudit,
        metadata: {
          generationTime,
          appliedSystems,
          confidenceScore,
          recommendations,
          warnings
        }
      }
      
    } catch (error) {
      throw new Error(`Failed to generate advanced configuration: ${error}`)
    }
  }

  /**
   * Quick configuration generation with smart defaults
   */
  static async generateQuickConfiguration(
    data: ProcessedData,
    purpose: string = 'analysis',
    industry?: string
  ): Promise<BarChartRaceConfig> {
    const request: AdvancedConfigRequest = {
      data,
      purpose: purpose as any,
      audience: 'general',
      industry,
      autoOptimize: true,
      generationOptions: {
        purpose: purpose as any,
        audience: 'general',
        style: 'professional',
        outputFormat: 'landscape',
        duration: 'auto',
        emphasis: 'data-accuracy'
      }
    }
    
    const response = await this.generateAdvancedConfiguration(request)
    return response.variants.optimized || response.primaryConfig
  }

  /**
   * Generate configuration with brand integration
   */
  static async generateBrandedConfiguration(
    data: ProcessedData,
    brandProfile: BrandProfile,
    purpose: string = 'marketing'
  ): Promise<{ primary: BarChartRaceConfig, variants: BarChartRaceConfig[] }> {
    const request: AdvancedConfigRequest = {
      data,
      purpose: purpose as any,
      audience: 'business',
      brandProfile,
      autoOptimize: true,
      accessibilityRequirements: {
        level: 'AA',
        features: {
          highContrast: false,
          largeText: false,
          reducedMotion: false,
          colorBlindFriendly: true,
          screenReaderOptimized: false,
          dyslexiaFriendly: false,
          slowAnimations: false,
          enhancedFocus: false
        }
      }
    }
    
    const response = await this.generateAdvancedConfiguration(request)
    
    // Generate additional brand-aligned variants
    const theme = AdvancedThemeSystem.createThemeFromBrand(brandProfile)
    const variants = AdvancedThemeSystem.generateThemeVariations(theme, 3)
    const brandVariants = variants.map(variant => 
      AdvancedThemeSystem.applyTheme(response.primaryConfig, variant)
    )
    
    return {
      primary: response.primaryConfig,
      variants: brandVariants
    }
  }

  /**
   * Generate accessibility-first configuration
   */
  static async generateAccessibleConfiguration(
    data: ProcessedData,
    accessibilityLevel: 'AA' | 'AAA' = 'AA'
  ): Promise<{ config: BarChartRaceConfig, audit: any, responsive: ResponsiveConfig }> {
    const request: AdvancedConfigRequest = {
      data,
      purpose: 'presentation',
      audience: 'general',
      accessibilityRequirements: {
        level: accessibilityLevel,
        features: {
          highContrast: true,
          largeText: true,
          reducedMotion: true,
          colorBlindFriendly: true,
          screenReaderOptimized: true,
          dyslexiaFriendly: true,
          slowAnimations: true,
          enhancedFocus: true
        }
      },
      responsiveTargets: [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1080, height: 1920 }, // Mobile portrait
        { width: 1024, height: 768 }   // Tablet
      ],
      autoOptimize: true,
      optimizationContext: {
        purpose: 'presentation',
        audience: 'general',
        constraints: { accessibility: true },
        priorities: { performance: 6, quality: 8, accessibility: 10, engagement: 6 }
      }
    }
    
    const response = await this.generateAdvancedConfiguration(request)
    
    return {
      config: response.variants.accessible || response.primaryConfig,
      audit: response.accessibilityAudit,
      responsive: response.variants.responsive!
    }
  }

  // Private helper methods

  private static async generateBaseConfiguration(
    request: AdvancedConfigRequest,
    dataAnalysis: DataCharacteristics,
    appliedSystems: string[],
    recommendations: string[]
  ): Promise<BarChartRaceConfig> {
    
    // Try to use industry template first
    if (request.industry) {
      const industryTemplate = IndustryTemplates.getIndustryTemplate(request.industry)
      if (industryTemplate) {
        appliedSystems.push('Industry Templates')
        recommendations.push(`Used ${request.industry} industry template`)
        return industryTemplate
      }
    }
    
    // Use inheritance if specified
    if (request.inheritanceRules && request.baseTemplate) {
      ConfigInheritanceSystem.registerBaseConfig(request.baseTemplate, request.inheritanceRules.baseConfigId as any)
      const inheritedConfig = ConfigInheritanceSystem.createInheritedConfig(request.inheritanceRules)
      appliedSystems.push('Configuration Inheritance')
      return inheritedConfig
    }
    
    // Use dynamic generation
    if (request.generationOptions) {
      const dynamicConfig = DynamicConfigGenerator.generateConfiguration(
        dataAnalysis,
        request.generationOptions
      )
      appliedSystems.push('Dynamic Configuration Generator')
      return dynamicConfig
    }
    
    // Fallback to default template selection
    const templates = IndustryTemplates.getAllIndustryTemplates()
    const templateNames = Object.keys(templates)
    const selectedTemplate = templateNames[0] // Use first available template
    
    appliedSystems.push('Fallback Template Selection')
    recommendations.push('Consider specifying industry or generation options for better results')
    
    return templates[selectedTemplate]
  }

  private static async applyAdvancedTheming(
    config: BarChartRaceConfig,
    request: AdvancedConfigRequest,
    appliedSystems: string[],
    recommendations: string[]
  ): Promise<BarChartRaceConfig | null> {
    
    // Apply custom theme
    if (request.customTheme) {
      appliedSystems.push('Custom Theme Application')
      return AdvancedThemeSystem.applyTheme(config, request.customTheme)
    }
    
    // Generate theme from brand profile
    if (request.brandProfile) {
      const theme = AdvancedThemeSystem.createThemeFromBrand(request.brandProfile)
      appliedSystems.push('Brand Theme Generation')
      recommendations.push(`Generated custom theme for ${request.brandProfile.name}`)
      return AdvancedThemeSystem.applyTheme(config, theme)
    }
    
    // Apply industry-specific theming
    if (request.industry) {
      const industryThemes = {
        'technology': 'vibrant-tech',
        'finance': 'corporate-blue',
        'healthcare': 'minimal-mono',
        'education': 'warm-earth'
      }
      
      const themeId = industryThemes[request.industry as keyof typeof industryThemes]
      if (themeId) {
        const theme = AdvancedThemeSystem.getTheme(themeId)
        if (theme) {
          appliedSystems.push('Industry Theme Application')
          return AdvancedThemeSystem.applyTheme(config, theme)
        }
      }
    }
    
    return null
  }

  private static createDefaultOptimizationContext(request: AdvancedConfigRequest): OptimizationContext {
    const purposePriorities = {
      'presentation': { performance: 7, quality: 9, accessibility: 8, engagement: 6 },
      'social-media': { performance: 8, quality: 7, accessibility: 6, engagement: 9 },
      'analysis': { performance: 6, quality: 8, accessibility: 6, engagement: 5 },
      'marketing': { performance: 7, quality: 8, accessibility: 7, engagement: 9 },
      'report': { performance: 6, quality: 9, accessibility: 8, engagement: 5 }
    }
    
    return {
      purpose: request.purpose,
      audience: request.audience,
      constraints: {
        accessibility: !!request.accessibilityRequirements,
        performance: request.qualityTargets?.includes('performance') || false
      },
      priorities: purposePriorities[request.purpose] || purposePriorities['analysis']
    }
  }

  private static calculateConfidenceScore(
    dataAnalysis: DataCharacteristics,
    optimizationReport: OptimizationReport,
    systemsApplied: number,
    warningCount: number
  ): number {
    let score = 70 // Base confidence
    
    // Boost confidence based on data quality
    if (dataAnalysis.rowCount > 100 && dataAnalysis.columnCount > 3) score += 10
    if (dataAnalysis.rowCount > 1000) score += 5
    
    // Boost confidence based on optimization score
    score += (optimizationReport.overallScore - 70) * 0.3
    
    // Boost confidence based on systems applied
    score += systemsApplied * 2
    
    // Reduce confidence for warnings
    score -= warningCount * 5
    
    return Math.max(50, Math.min(100, Math.round(score)))
  }

  private static generateFinalRecommendations(
    optimizationReport: OptimizationReport,
    dataAnalysis: DataCharacteristics,
    request: AdvancedConfigRequest,
    recommendations: string[]
  ): void {
    
    // Add optimization-based recommendations
    if (optimizationReport.criticalIssues.length > 0) {
      recommendations.push(`Address ${optimizationReport.criticalIssues.length} critical optimization issues`)
    }
    
    if (optimizationReport.quickWins.length > 0) {
      recommendations.push(`Consider applying ${optimizationReport.quickWins.length} quick optimizations`)
    }
    
    // Add data-based recommendations
    if (dataAnalysis.columnCount > 15) {
      recommendations.push('Consider focusing on top performing items to reduce visual complexity')
    }
    
    if (dataAnalysis.dateRange.durationDays < 30) {
      recommendations.push('Short time series may benefit from discrete animation type')
    }
    
    // Add purpose-based recommendations
    if (request.purpose === 'social-media' && !request.responsiveTargets) {
      recommendations.push('Consider generating mobile-optimized variants for social media')
    }
    
    if (request.purpose === 'presentation' && !request.accessibilityRequirements) {
      recommendations.push('Consider accessibility optimizations for presentation use')
    }
    
    // Add A/B testing recommendations
    if (!request.enableABTesting && request.purpose === 'marketing') {
      recommendations.push('A/B testing recommended for marketing campaigns')
    }
  }

  /**
   * Batch generate configurations for multiple scenarios
   */
  static async generateBatchConfigurations(
    data: ProcessedData,
    scenarios: Array<{
      name: string
      purpose: string
      audience: string
      industry?: string
      outputFormat?: string
    }>
  ): Promise<Record<string, BarChartRaceConfig>> {
    const results: Record<string, BarChartRaceConfig> = {}
    
    for (const scenario of scenarios) {
      const request: AdvancedConfigRequest = {
        data,
        purpose: scenario.purpose as any,
        audience: scenario.audience as any,
        industry: scenario.industry,
        autoOptimize: true,
        generationOptions: {
          purpose: scenario.purpose as any,
          audience: scenario.audience as any,
          style: 'professional',
          outputFormat: (scenario.outputFormat || 'landscape') as any,
          duration: 'auto',
          emphasis: 'data-accuracy'
        }
      }
      
      const response = await this.generateAdvancedConfiguration(request)
      results[scenario.name] = response.variants.optimized || response.primaryConfig
    }
    
    return results
  }

  /**
   * Export configuration ecosystem state
   */
  static exportEcosystemState(): {
    industryTemplates: Record<string, any>
    themes: Record<string, any>
    optimizationRules: any[]
    systemVersion: string
  } {
    return {
      industryTemplates: IndustryTemplates.getAllIndustryTemplates(),
      themes: AdvancedThemeSystem.getAllThemes(),
      optimizationRules: ConfigOptimizationSystem.getAllOptimizationRules(),
      systemVersion: '1.0.0'
    }
  }
}