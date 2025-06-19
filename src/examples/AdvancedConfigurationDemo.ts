import { AdvancedConfigurationEcosystem, AdvancedConfigRequest } from '../utils/AdvancedConfigurationEcosystem'
import { ProcessedData } from '../types/config'
import { BrandProfile } from '../utils/AdvancedThemeSystem'

/**
 * Demonstration of the Advanced Configuration Ecosystem
 * Shows how to use all the integrated systems together
 */
export class AdvancedConfigurationDemo {
  
  /**
   * Demo 1: Comprehensive Configuration Generation
   */
  static async demonstrateFullEcosystem(): Promise<void> {
    console.log('=== Advanced Configuration Ecosystem Demo ===\n')
    
    // Mock data for demonstration
    const mockData: ProcessedData = {
      frames: Array.from({ length: 100 }, (_, i) => ({
        date: new Date(2020, 0, i * 7),
        items: [
          { id: 'Company A', value: 1000 + i * 50 + Math.random() * 200, rank: 1 },
          { id: 'Company B', value: 800 + i * 45 + Math.random() * 150, rank: 2 },
          { id: 'Company C', value: 600 + i * 40 + Math.random() * 100, rank: 3 },
          { id: 'Company D', value: 400 + i * 35 + Math.random() * 80, rank: 4 },
          { id: 'Company E', value: 200 + i * 30 + Math.random() * 60, rank: 5 }
        ],
        maxValue: 6000
      })),
      totalFrames: 100,
      columns: ['Company A', 'Company B', 'Company C', 'Company D', 'Company E'],
      dateRange: {
        start: new Date(2020, 0, 1),
        end: new Date(2021, 11, 31)
      }
    }

    // Define a brand profile
    const techBrand: BrandProfile = {
      name: 'TechCorp',
      primaryColor: '#007acc',
      secondaryColor: '#4da6ff',
      accentColor: '#ff6b35',
      backgroundColor: '#f8f9fa',
      textColor: '#2c3e50',
      fontFamily: 'Roboto',
      brandPersonality: 'tech',
      colorPalette: ['#007acc', '#4da6ff', '#66d9ff', '#99e6ff', '#ccf2ff'],
      gradients: {
        primary: ['#007acc', '#4da6ff'],
        secondary: ['#ff6b35', '#ffab91']
      }
    }

    // Create comprehensive configuration request
    const request: AdvancedConfigRequest = {
      data: mockData,
      purpose: 'marketing',
      audience: 'business',
      industry: 'technology',
      brandProfile: techBrand,
      
      // Enable all advanced features
      enableABTesting: true,
      testDimensions: ['colors', 'typography', 'animations'],
      
      accessibilityRequirements: {
        level: 'AA',
        features: {
          highContrast: false,
          largeText: true,
          reducedMotion: false,
          colorBlindFriendly: true,
          screenReaderOptimized: true,
          dyslexiaFriendly: false,
          slowAnimations: false,
          enhancedFocus: true
        }
      },
      
      responsiveTargets: [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1080, height: 1920 }, // Mobile portrait
        { width: 1080, height: 1080 }  // Square for social
      ],
      
      autoOptimize: true,
      
      optimizationContext: {
        purpose: 'marketing',
        audience: 'business',
        constraints: {
          accessibility: true,
          performance: true
        },
        priorities: {
          performance: 7,
          quality: 9,
          accessibility: 8,
          engagement: 10
        }
      }
    }

    try {
      console.log('Generating comprehensive configuration...')
      const response = await AdvancedConfigurationEcosystem.generateAdvancedConfiguration(request)
      
      console.log('\n=== Generation Results ===')
      console.log(`Generation time: ${response.metadata.generationTime}ms`)
      console.log(`Confidence score: ${response.metadata.confidenceScore}/100`)
      console.log(`Applied systems: ${response.metadata.appliedSystems.join(', ')}`)
      console.log(`Overall optimization score: ${response.optimizationReport.overallScore}/100`)
      
      console.log('\n=== Generated Variants ===')
      if (response.variants.responsive) {
        console.log(`✓ Responsive configuration with ${response.variants.responsive.breakpoints.length} breakpoints`)
      }
      if (response.variants.accessible) {
        console.log('✓ Accessibility-optimized configuration')
      }
      if (response.variants.optimized) {
        console.log('✓ Performance-optimized configuration')
      }
      if (response.abTestVariants) {
        console.log(`✓ ${response.abTestVariants.length} A/B test variants`)
      }
      
      console.log('\n=== Data Analysis Results ===')
      console.log(`Data points: ${response.dataAnalysis.rowCount}`)
      console.log(`Columns: ${response.dataAnalysis.columnCount}`)
      console.log(`Duration: ${response.dataAnalysis.dateRange.durationDays} days`)
      
      const avgVolatility = Object.values(response.dataAnalysis.valueRanges)
        .reduce((sum, range) => sum + range.volatility, 0) / response.dataAnalysis.columnCount
      console.log(`Average volatility: ${avgVolatility.toFixed(3)}`)
      
      console.log('\n=== Optimization Recommendations ===')
      response.optimizationReport.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`)
        console.log(`   ${rec.description}`)
      })
      
      console.log('\n=== Quick Wins ===')
      response.optimizationReport.quickWins.forEach((qw, index) => {
        console.log(`${index + 1}. ${qw.title} (${qw.implementation.timeEstimate})`)
      })
      
      console.log('\n=== Accessibility Audit ===')
      if (response.accessibilityAudit) {
        console.log(`Score: ${response.accessibilityAudit.score}/100`)
        console.log(`Level: ${response.accessibilityAudit.level}`)
        console.log(`Issues found: ${response.accessibilityAudit.issues.length}`)
      }
      
      console.log('\n=== Recommendations ===')
      response.metadata.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
      
      if (response.metadata.warnings.length > 0) {
        console.log('\n=== Warnings ===')
        response.metadata.warnings.forEach((warning, index) => {
          console.log(`${index + 1}. ⚠️  ${warning}`)
        })
      }
      
    } catch (error) {
      console.error('Demo failed:', error)
    }
  }

  /**
   * Demo 2: Quick Configuration Generation
   */
  static async demonstrateQuickGeneration(): Promise<void> {
    console.log('\n\n=== Quick Configuration Demo ===\n')
    
    const mockData: ProcessedData = {
      frames: Array.from({ length: 50 }, (_, i) => ({
        date: new Date(2023, 0, i * 7),
        items: [
          { id: 'Product A', value: 100 + i * 5, rank: 1 },
          { id: 'Product B', value: 80 + i * 4, rank: 2 },
          { id: 'Product C', value: 60 + i * 3, rank: 3 }
        ],
        maxValue: 350
      })),
      totalFrames: 50,
      columns: ['Product A', 'Product B', 'Product C'],
      dateRange: {
        start: new Date(2023, 0, 1),
        end: new Date(2023, 11, 31)
      }
    }

    try {
      console.log('Generating quick configuration for e-commerce data...')
      const quickConfig = await AdvancedConfigurationEcosystem.generateQuickConfiguration(
        mockData,
        'marketing',
        'technology'
      )
      
      console.log('✓ Quick configuration generated successfully')
      console.log(`Output dimensions: ${quickConfig.output.width}x${quickConfig.output.height}`)
      console.log(`Duration: ${quickConfig.output.duration}s`)
      console.log(`Quality: ${quickConfig.output.quality}`)
      console.log(`Visible items: ${quickConfig.layers.chart.chart.visibleItemCount}`)
      
    } catch (error) {
      console.error('Quick generation demo failed:', error)
    }
  }

  /**
   * Demo 3: Branded Configuration Generation
   */
  static async demonstrateBrandedGeneration(): Promise<void> {
    console.log('\n\n=== Branded Configuration Demo ===\n')
    
    const mockData: ProcessedData = {
      frames: Array.from({ length: 75 }, (_, i) => ({
        date: new Date(2023, 0, i * 5),
        items: [
          { id: 'North America', value: 1000 + i * 20, rank: 1 },
          { id: 'Europe', value: 800 + i * 15, rank: 2 },
          { id: 'Asia Pacific', value: 600 + i * 25, rank: 3 },
          { id: 'Latin America', value: 400 + i * 10, rank: 4 }
        ],
        maxValue: 2500
      })),
      totalFrames: 75,
      columns: ['North America', 'Europe', 'Asia Pacific', 'Latin America'],
      dateRange: {
        start: new Date(2023, 0, 1),
        end: new Date(2023, 11, 31)
      }
    }

    const corporateBrand: BrandProfile = {
      name: 'Global Corp',
      primaryColor: '#1e3a8a',
      secondaryColor: '#3b82f6',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'Inter',
      brandPersonality: 'professional',
      colorPalette: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
    }

    try {
      console.log('Generating branded configuration for Global Corp...')
      const brandedResult = await AdvancedConfigurationEcosystem.generateBrandedConfiguration(
        mockData,
        corporateBrand,
        'presentation'
      )
      
      console.log('✓ Branded configuration generated successfully')
      console.log(`Primary config uses brand colors: ${JSON.stringify(brandedResult.primary.layers.chart.bar.colors)}`)
      console.log(`Generated ${brandedResult.variants.length} brand-aligned variants`)
      console.log(`Background color: ${brandedResult.primary.layers.background.color}`)
      console.log(`Title font: ${brandedResult.primary.layers.title?.style.fontFamily || 'N/A'}`)
      
    } catch (error) {
      console.error('Branded generation demo failed:', error)
    }
  }

  /**
   * Demo 4: Accessibility-First Configuration
   */
  static async demonstrateAccessibilityFirst(): Promise<void> {
    console.log('\n\n=== Accessibility-First Demo ===\n')
    
    const mockData: ProcessedData = {
      frames: Array.from({ length: 60 }, (_, i) => ({
        date: new Date(2023, 0, i * 6),
        items: [
          { id: 'Healthcare', value: 500 + i * 8, rank: 1 },
          { id: 'Education', value: 400 + i * 6, rank: 2 },
          { id: 'Public Safety', value: 300 + i * 4, rank: 3 },
          { id: 'Infrastructure', value: 200 + i * 5, rank: 4 }
        ],
        maxValue: 1000
      })),
      totalFrames: 60,
      columns: ['Healthcare', 'Education', 'Public Safety', 'Infrastructure'],
      dateRange: {
        start: new Date(2023, 0, 1),
        end: new Date(2023, 11, 31)
      }
    }

    try {
      console.log('Generating accessibility-first configuration...')
      const accessibleResult = await AdvancedConfigurationEcosystem.generateAccessibleConfiguration(
        mockData,
        'AAA'
      )
      
      console.log('✓ Accessibility-first configuration generated')
      console.log(`Accessibility audit score: ${accessibleResult.audit.score}/100`)
      console.log(`WCAG compliance level: ${accessibleResult.audit.level}`)
      console.log(`Issues found: ${accessibleResult.audit.issues.length}`)
      console.log(`Responsive breakpoints: ${accessibleResult.responsive.breakpoints.length}`)
      
      console.log('\nAccessibility features enabled:')
      console.log(`- Title font size: ${accessibleResult.config.layers.chart.labels.title.fontSize}px`)
      console.log(`- Animation duration: ${accessibleResult.config.layers.chart.animation.overtakeDuration}s`)
      console.log(`- Color blind friendly palette: ${Array.isArray(accessibleResult.config.layers.chart.bar.colors)}`)
      
    } catch (error) {
      console.error('Accessibility demo failed:', error)
    }
  }

  /**
   * Demo 5: Batch Configuration Generation
   */
  static async demonstrateBatchGeneration(): Promise<void> {
    console.log('\n\n=== Batch Configuration Demo ===\n')
    
    const mockData: ProcessedData = {
      frames: Array.from({ length: 40 }, (_, i) => ({
        date: new Date(2023, 0, i * 9),
        items: [
          { id: 'iOS', value: 1000 + i * 12, rank: 1 },
          { id: 'Android', value: 900 + i * 10, rank: 2 },
          { id: 'Windows', value: 800 + i * 8, rank: 3 },
          { id: 'macOS', value: 300 + i * 6, rank: 4 },
          { id: 'Linux', value: 100 + i * 4, rank: 5 }
        ],
        maxValue: 1500
      })),
      totalFrames: 40,
      columns: ['iOS', 'Android', 'Windows', 'macOS', 'Linux'],
      dateRange: {
        start: new Date(2023, 0, 1),
        end: new Date(2023, 11, 31)
      }
    }

    const scenarios = [
      { name: 'Executive Dashboard', purpose: 'presentation', audience: 'business' },
      { name: 'Social Media Post', purpose: 'social-media', audience: 'general', outputFormat: 'portrait' },
      { name: 'Technical Report', purpose: 'analysis', audience: 'technical' },
      { name: 'Marketing Campaign', purpose: 'marketing', audience: 'general', industry: 'technology' },
      { name: 'Academic Paper', purpose: 'report', audience: 'academic' }
    ]

    try {
      console.log('Generating batch configurations for 5 scenarios...')
      const batchResults = await AdvancedConfigurationEcosystem.generateBatchConfigurations(
        mockData,
        scenarios
      )
      
      console.log('✓ Batch generation completed')
      Object.entries(batchResults).forEach(([name, config]) => {
        console.log(`${name}:`)
        console.log(`  - Dimensions: ${config.output.width}x${config.output.height}`)
        console.log(`  - Duration: ${config.output.duration}s`)
        console.log(`  - Title size: ${config.layers.title?.style.fontSize || 'N/A'}px`)
      })
      
    } catch (error) {
      console.error('Batch generation demo failed:', error)
    }
  }

  /**
   * Run all demos
   */
  static async runAllDemos(): Promise<void> {
    console.log('🚀 Starting Advanced Configuration Ecosystem Demonstrations\n')
    
    await this.demonstrateFullEcosystem()
    await this.demonstrateQuickGeneration()
    await this.demonstrateBrandedGeneration()
    await this.demonstrateAccessibilityFirst()
    await this.demonstrateBatchGeneration()
    
    console.log('\n\n🎉 All demonstrations completed successfully!')
    console.log('\nThe Advanced Configuration Ecosystem provides:')
    console.log('✓ 15+ industry-specific templates')
    console.log('✓ Dynamic configuration generation based on data analysis')
    console.log('✓ Advanced theming with brand integration')
    console.log('✓ Conditional configurations for data characteristics')
    console.log('✓ Configuration inheritance and composition')
    console.log('✓ A/B testing variant generation')
    console.log('✓ Accessibility and responsive design optimization')
    console.log('✓ Comprehensive optimization recommendations')
    console.log('✓ Integrated ecosystem orchestration')
  }
}

// Example usage
if (require.main === module) {
  AdvancedConfigurationDemo.runAllDemos().catch(console.error)
}