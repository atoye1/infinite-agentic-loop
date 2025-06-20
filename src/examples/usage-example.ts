/**
 * Example usage of the Bar Chart Race configuration system
 * This demonstrates how to use all the validation and configuration utilities
 */

import {
  BarChartRaceConfig,
  ValidationResult
} from '../types/config'
import {
  ConfigValidator,
  ConfigTemplates
} from '../config'
import { DataValidator } from '../validation/DataValidator'
import { ColorGenerator } from '../utils/ColorGenerator'

// Example 1: Using ConfigValidator to validate a configuration
export function validateConfigExample() {
  console.log('=== Config Validation Example ===')
  
  const validator = new ConfigValidator()
  
  // Example of an invalid config to show validation errors
  const invalidConfig = {
    output: {
      filename: '', // Invalid: empty filename
      format: 'avi', // Invalid: unsupported format
      width: -100, // Invalid: negative width
      fps: 70, // Invalid: fps too high
      duration: 0 // Invalid: zero duration
    },
    data: {
      csvPath: './nonexistent.csv', // Invalid: file doesn't exist
      dateColumn: '', // Invalid: empty date column
      valueColumns: [], // Invalid: empty array
      interpolation: 'invalid' // Invalid: unsupported interpolation
    },
    layers: {
      // Missing required background and chart layers
    }
  }
  
  const result = validator.validate(invalidConfig)
  
  if (!result.isValid) {
    console.log('Validation errors found:')
    result.errors.forEach(error => {
      console.log(`  - ${error.field}: ${error.message}`)
      if (error.value !== undefined) {
        console.log(`    Current value: ${JSON.stringify(error.value)}`)
      }
    })
  }
  
  return result
}

// Example 2: Using DataValidator to validate CSV data
export function validateDataExample() {
  console.log('\n=== Data Validation Example ===')
  
  const dataValidator = new DataValidator()
  const config = ConfigTemplates.getDefaultConfig()
  
  // This would validate against an actual CSV file
  const csvPath = './example-data.csv'
  
  try {
    const result = dataValidator.validate(csvPath, config)
    
    if (!result.isValid) {
      console.log('Data validation errors found:')
      result.errors.forEach(error => {
        console.log(`  - ${error.field}: ${error.message}`)
      })
    } else {
      console.log('Data validation passed!')
    }
    
    return result
  } catch (error) {
    console.log(`Could not validate data: ${error}`)
    return { isValid: false, errors: [] }
  }
}

// Example 3: Using ConfigTemplates to generate different configurations
export function configTemplatesExample() {
  console.log('\n=== Config Templates Example ===')
  
  // Get all available templates
  const templates = ConfigTemplates.getAllTemplates()
  const descriptions = ConfigTemplates.getTemplateDescriptions()
  
  console.log('Available templates:')
  Object.keys(templates).forEach(templateName => {
    console.log(`  - ${templateName}: ${descriptions[templateName]}`)
  })
  
  // Get a specific template
  const socialMediaConfig = ConfigTemplates.getTemplate('social-media')
  console.log('\nSocial media template settings:')
  console.log(`  Output format: ${socialMediaConfig.output.width}x${socialMediaConfig.output.height}`)
  console.log(`  Duration: ${socialMediaConfig.output.duration}s`)
  console.log(`  FPS: ${socialMediaConfig.output.fps}`)
  
  return templates
}

// Example 4: Using ColorGenerator for automatic color generation
export function colorGeneratorExample() {
  console.log('\n=== Color Generator Example ===')
  
  // Generate colors for different scenarios
  const scenarios = [
    { name: 'Professional presentation', count: 5, palette: 'professional' },
    { name: 'Social media content', count: 8, palette: 'vibrant' },
    { name: 'Gaming statistics', count: 12, palette: 'gaming' },
    { name: 'Accessible design', count: 6, palette: 'accessible' }
  ]
  
  scenarios.forEach(scenario => {
    console.log(`\n${scenario.name} (${scenario.count} colors):`)
    const colors = ColorGenerator.generateColors(scenario.count, scenario.palette)
    console.log(`  Colors: ${colors.join(', ')}`)
    
    // Check contrast with white text
    const contrastChecks = colors.map(color => ({
      color,
      goodContrast: ColorGenerator.hasGoodContrast(color, '#ffffff'),
      suggestedText: ColorGenerator.suggestTextColor(color)
    }))
    
    console.log('  Contrast analysis:')
    contrastChecks.forEach(check => {
      console.log(`    ${check.color}: ${check.goodContrast ? 'Good' : 'Poor'} contrast with white, suggested text: ${check.suggestedText}`)
    })
  })
  
  // Show available palettes
  console.log('\nAvailable color palettes:')
  ColorGenerator.getAvailablePalettes().forEach(palette => {
    const colors = ColorGenerator.getPaletteColors(palette)
    console.log(`  ${palette}: ${colors.slice(0, 3).join(', ')}... (${colors.length} total)`)
  })
}

// Example 5: Complete workflow - validate, generate, and customize config
export function completeWorkflowExample() {
  console.log('\n=== Complete Workflow Example ===')
  
  // Step 1: Start with a template
  const baseConfig = ConfigTemplates.getTemplate('gaming')
  console.log('1. Started with gaming template')
  
  // Step 2: Customize the configuration
  const customConfig: BarChartRaceConfig = {
    ...baseConfig,
    output: {
      ...baseConfig.output,
      filename: 'my-custom-chart.mp4',
      duration: 90,
      quality: 'max'
    },
    data: {
      ...baseConfig.data,
      csvPath: './my-data.csv',
      valueColumns: ['Fortnite', 'Minecraft', 'Roblox', 'Among Us', 'Fall Guys']
    }
  }
  
  // Step 3: Generate colors automatically
  const autoColors = ColorGenerator.generateContrastingColors(
    customConfig.data.valueColumns.length,
    'gaming'
  )
  
  // Update config with auto-generated colors
  customConfig.layers.chart.bar.colors = autoColors
  console.log('2. Generated colors:', autoColors)
  
  // Step 4: Validate the final configuration
  const validator = new ConfigValidator()
  const validationResult = validator.validate(customConfig)
  
  if (validationResult.isValid) {
    console.log('3. Configuration is valid!')
    console.log('4. Ready to use for rendering')
    
    // Show final config summary
    console.log('\nFinal configuration summary:')
    console.log(`  Output: ${customConfig.output.filename} (${customConfig.output.width}x${customConfig.output.height})`)
    console.log(`  Duration: ${customConfig.output.duration}s at ${customConfig.output.fps}fps`)
    console.log(`  Data columns: ${customConfig.data.valueColumns.join(', ')}`)
    console.log(`  Colors: ${autoColors.join(', ')}`)
    
    return customConfig
  } else {
    console.log('3. Configuration has errors:')
    validationResult.errors.forEach(error => {
      console.log(`     - ${error.field}: ${error.message}`)
    })
    
    return null
  }
}

// Example 6: Error handling and recovery
export function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===')
  
  const validator = new ConfigValidator()
  
  // Create a config with multiple issues
  const problematicConfig = {
    output: {
      filename: 'test.mp4',
      format: 'mp4',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 60,
      quality: 'high'
    },
    data: {
      csvPath: './test.csv',
      dateColumn: 'Date',
      dateFormat: 'YYYY-MM-DD',
      valueColumns: ['A', 'B'],
      interpolation: 'smooth'
    },
    layers: {
      background: {
        color: 'invalid-color', // Error: invalid hex color
        opacity: 150 // Error: opacity over 100
      },
      chart: {
        position: {
          top: -10, // Error: negative position
          right: 50,
          bottom: 50,
          left: 50
        },
        chart: {
          visibleItemCount: 0, // Error: zero visible items
          maxValue: 'invalid', // Error: invalid maxValue
          itemSpacing: -5 // Error: negative spacing
        },
        animation: {
          type: 'continuous',
          overtakeDuration: 0.5
        },
        bar: {
          colors: ['#ff0000', 'invalid'], // Error: mixed valid/invalid colors
          cornerRadius: 5,
          opacity: 100
        },
        labels: {
          title: {
            show: true,
            fontSize: 0, // Error: zero font size
            fontFamily: '', // Error: empty font family
            color: '#ffffff',
            position: 'outside'
          },
          value: {
            show: true,
            fontSize: 20,
            fontFamily: 'Arial',
            color: '#ffffff',
            format: '' // Error: empty format
          },
          rank: {
            show: true,
            fontSize: 18,
            backgroundColor: '#333333',
            textColor: '#ffffff'
          }
        }
      }
    }
  }
  
  const result = validator.validate(problematicConfig)
  
  console.log(`Found ${result.errors.length} validation errors:`)
  result.errors.forEach((error, index) => {
    console.log(`  ${index + 1}. ${error.field}: ${error.message}`)
    if (error.value !== undefined) {
      console.log(`     Current value: ${JSON.stringify(error.value)}`)
    }
  })
  
  // Show how to fix issues by using a default config as base
  console.log('\nSuggestion: Start with a default template and modify gradually:')
  const defaultConfig = ConfigTemplates.getDefaultConfig()
  const defaultValidation = validator.validate(defaultConfig)
  console.log(`Default template validation: ${defaultValidation.isValid ? 'PASSED' : 'FAILED'}`)
  
  return result
}

// Run all examples
export function runAllExamples() {
  console.log('Bar Chart Race Configuration System Examples')
  console.log('===========================================')
  
  try {
    validateConfigExample()
    validateDataExample()
    configTemplatesExample()
    colorGeneratorExample()
    completeWorkflowExample()
    errorHandlingExample()
    
    console.log('\n=== All Examples Completed ===')
  } catch (error) {
    console.error('Error running examples:', error)
  }
}

// Export for external use
export {
  validateConfigExample,
  validateDataExample,
  configTemplatesExample,
  colorGeneratorExample,
  completeWorkflowExample,
  errorHandlingExample,
  runAllExamples
}