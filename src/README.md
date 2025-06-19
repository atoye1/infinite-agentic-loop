# Bar Chart Race Configuration System

A comprehensive TypeScript configuration system for creating animated bar chart race videos using Remotion.js.

## Overview

This system provides:
- **Type-safe configuration** with complete TypeScript interfaces
- **Comprehensive validation** for both config files and CSV data
- **Template system** with pre-built configurations for common use cases
- **Automatic color generation** with accessibility considerations
- **Error handling** with detailed validation messages

## Quick Start

```typescript
import { 
  ConfigValidator, 
  DataValidator, 
  ConfigTemplates, 
  ColorGenerator 
} from './index'

// 1. Get a template configuration
const config = ConfigTemplates.getTemplate('social-media')

// 2. Validate the configuration
const configValidator = new ConfigValidator()
const configResult = configValidator.validate(config)

// 3. Validate your data
const dataValidator = new DataValidator()
const dataResult = dataValidator.validate('./data.csv', config)

// 4. Generate colors automatically
const colors = ColorGenerator.generateColors(5, 'vibrant')
```

## Core Components

### 1. Configuration Types (`types/config.ts`)

Complete TypeScript interfaces for all configuration options:

#### Main Configuration Interface
```typescript
interface BarChartRaceConfig {
  output: OutputConfig        // Video output settings
  data: DataConfig           // CSV data and processing options
  layers: LayerConfig        // Visual layers (background, chart, title, etc.)
}
```

#### Layer Configurations
- **BackgroundLayerConfig**: Background color, opacity, optional image
- **ChartLayerConfig**: Chart positioning, animation, bars, labels, images
- **TitleLayerConfig**: Title text, positioning, styling, timeline
- **DateLayerConfig**: Date display, formatting, positioning, animation
- **TextLayerConfig**: Additional text elements

### 2. Configuration Validator (`validation/ConfigValidator.ts`)

Comprehensive validation system that checks:

#### Output Settings
- ✅ Valid filename and format (mp4/webm)
- ✅ Positive dimensions and frame rate (1-60 fps)
- ✅ Valid duration and quality settings

#### Data Settings
- ✅ CSV file existence and accessibility
- ✅ Date column and format validation
- ✅ Value columns existence and naming
- ✅ Interpolation method validation

#### Layer Configurations
- ✅ Required fields and proper typing
- ✅ Color validation (hex format)
- ✅ Range validation (opacity 0-100, positive numbers)
- ✅ Position and spacing validation
- ✅ Font and styling validation

#### File Path Validation
- ✅ CSV file existence
- ✅ Image file accessibility
- ✅ Relative and absolute path support

### 3. Data Validator (`validation/DataValidator.ts`)

CSV data validation and integrity checking:

#### Structure Validation
- ✅ Header row presence and uniqueness
- ✅ Data row sufficiency
- ✅ Column consistency

#### Date Validation
- ✅ Date column existence in CSV
- ✅ Date format compliance
- ✅ Duplicate date detection
- ✅ Chronological ordering

#### Value Validation
- ✅ Numeric value validation
- ✅ Missing data handling
- ✅ Extreme value detection
- ✅ Data range analysis

#### Data Sufficiency
- ✅ Minimum data requirements
- ✅ Variation analysis
- ✅ Time span coverage
- ✅ Animation feasibility

### 4. Configuration Templates (`utils/ConfigTemplates.ts`)

Pre-built configurations for common scenarios:

#### Available Templates

1. **Default** - Balanced settings for general use
   ```typescript
   const config = ConfigTemplates.getTemplate('default')
   ```

2. **Social Media** - Vertical format for Instagram/TikTok
   ```typescript
   const config = ConfigTemplates.getTemplate('social-media')
   // 1080x1920, 30s duration, vibrant colors
   ```

3. **Presentation** - Professional business style
   ```typescript
   const config = ConfigTemplates.getTemplate('presentation')
   // Clean design, longer duration, professional colors
   ```

4. **Gaming** - High-energy gaming aesthetics
   ```typescript
   const config = ConfigTemplates.getTemplate('gaming')
   // 60fps, gaming colors, dynamic styling
   ```

5. **Minimal** - Clean, simple design
   ```typescript
   const config = ConfigTemplates.getTemplate('minimal')
   // Minimal visual elements, subtle colors
   ```

### 5. Color Generator (`utils/ColorGenerator.ts`)

Automatic color generation with accessibility features:

#### Color Palettes
- **Professional**: Business-appropriate colors
- **Vibrant**: High-energy social media colors
- **Gaming**: Gaming/tech themed colors
- **Pastel**: Soft, minimal colors  
- **Accessible**: High-contrast colors for accessibility
- **Monochrome**: Grayscale variations

#### Features
```typescript
// Generate colors for any number of items
const colors = ColorGenerator.generateColors(10, 'professional')

// Generate colors with good contrast between adjacent items
const contrastColors = ColorGenerator.generateContrastingColors(8, 'accessible')

// Check color accessibility
const hasGoodContrast = ColorGenerator.hasGoodContrast('#000000', '#ffffff')

// Get suggested text color for background
const textColor = ColorGenerator.suggestTextColor('#3498db') // Returns '#ffffff'
```

## Usage Examples

### Basic Configuration

```typescript
import { ConfigValidator, ConfigTemplates } from './index'

// Start with a template
const config = ConfigTemplates.getTemplate('default')

// Customize as needed
config.output.filename = 'my-video.mp4'
config.data.csvPath = './my-data.csv'
config.data.valueColumns = ['YouTube', 'Netflix', 'Disney+']

// Validate
const validator = new ConfigValidator()
const result = validator.validate(config)

if (result.isValid) {
  console.log('Configuration is valid!')
} else {
  result.errors.forEach(error => {
    console.log(`${error.field}: ${error.message}`)
  })
}
```

### Data Validation

```typescript
import { DataValidator } from './index'

const dataValidator = new DataValidator()
const result = dataValidator.validate('./data.csv', config)

if (!result.isValid) {
  result.errors.forEach(error => {
    console.log(`Data error - ${error.field}: ${error.message}`)
  })
}
```

### Color Generation

```typescript
import { ColorGenerator } from './index'

// Generate colors automatically
const colors = ColorGenerator.generateColors(5, 'vibrant')

// Update config with generated colors
config.layers.chart.bar.colors = colors
```

## Error Handling

The validation system provides detailed error messages:

```typescript
{
  field: 'layers.chart.bar.colors[0]',
  message: 'Each color must be a valid hex color',
  value: 'invalid-color'
}
```

Common error categories:
- **Type errors**: Wrong data types
- **Range errors**: Values outside valid ranges
- **File errors**: Missing or inaccessible files
- **Format errors**: Invalid formats (colors, dates, etc.)
- **Logic errors**: Inconsistent settings

## Integration with Remotion

This configuration system is designed to work seamlessly with Remotion components:

```typescript
// In your Remotion composition
export const BarChartRace: React.FC<{config: BarChartRaceConfig}> = ({config}) => {
  return (
    <AbsoluteFill>
      <BackgroundLayer config={config.layers.background} />
      <ChartLayer config={config.layers.chart} />
      {config.layers.title && <TitleLayer config={config.layers.title} />}
      {config.layers.date && <DateLayer config={config.layers.date} />}
    </AbsoluteFill>
  )
}
```

## Best Practices

1. **Start with templates** - Use pre-built templates as starting points
2. **Validate early** - Run validation before processing
3. **Handle errors gracefully** - Check validation results and provide feedback
4. **Use auto-generation** - Leverage automatic color generation
5. **Test with real data** - Validate against actual CSV files
6. **Consider accessibility** - Use accessible color palettes when appropriate

## File Structure

```
src/
├── types/
│   └── config.ts              # TypeScript interfaces
├── validation/
│   ├── ConfigValidator.ts     # Configuration validation
│   └── DataValidator.ts       # CSV data validation
├── utils/
│   ├── ConfigTemplates.ts     # Pre-built templates
│   └── ColorGenerator.ts      # Color generation utilities
├── examples/
│   └── usage-example.ts       # Complete usage examples
└── index.ts                   # Main exports
```

## Dependencies

- Node.js file system operations for file validation
- CSV parsing for data validation
- TypeScript for type safety
- Color manipulation utilities

## Contributing

When adding new features:
1. Update TypeScript interfaces in `types/config.ts`
2. Add corresponding validation in validators
3. Update templates if needed
4. Add usage examples
5. Update this documentation