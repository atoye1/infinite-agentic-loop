# Bar Chart Race Rendering System

A complete rendering pipeline and output management system for Bar Chart Race videos built with Remotion.

## Overview

This rendering system provides a comprehensive solution for generating high-quality Bar Chart Race videos with:

- **Full Rendering Pipeline**: Complete integration with Remotion's bundling and rendering APIs
- **Multiple Output Formats**: Support for MP4 and WebM with configurable quality settings
- **Batch Processing**: Render multiple configurations in parallel with progress tracking
- **Output Management**: Organized file structure with metadata tracking and statistics
- **CLI Interface**: Command-line tool for easy rendering and batch operations
- **Error Handling**: Robust error handling and cleanup mechanisms

## Components

### RenderPipeline
Core rendering orchestrator that handles:
- Project bundling with Remotion
- Composition selection and validation
- Video rendering with quality optimization
- Progress reporting and parallel processing
- Error handling and resource cleanup

### OutputManager
Manages render outputs and metadata:
- Organized directory structure
- Render history and statistics tracking
- Project metadata management
- File cleanup and space management
- CSV export for analysis

### BatchConfig
Batch rendering configuration system:
- Flexible batch configuration builder
- Pre-built configuration templates
- Quality and format comparison utilities
- Estimation tools for time and file size

### BarChartRaceRenderer
High-level orchestrator combining all components:
- Simplified API for common operations
- Integrated progress monitoring
- Production workflow management
- Statistics and reporting

## Quick Start

### Installation

```bash
npm install
```

### Basic Usage

```typescript
import { BarChartRaceRenderer } from './src/BarChartRaceRenderer';

const renderer = new BarChartRaceRenderer('./output');
await renderer.initialize();

// Render a single composition
const result = await renderer.renderComposition({
  compositionId: 'HelloWorld',
  format: 'mp4',
  quality: 'high',
  props: {
    titleText: 'My Custom Title',
    titleColor: '#FF0000'
  }
});
```

### CLI Usage

```bash
# List available compositions
npm run list

# Render a composition
npm run render -- -c HelloWorld -f mp4 -q high

# Run batch from config file
npm run cli -- batch -c ./batch-configs/production.json

# Get help
npm run cli -- --help
```

## Quality Settings

| Quality | CRF | Speed | Use Case |
|---------|-----|-------|----------|
| `low` | 28 | Fast | Quick previews, drafts |
| `medium` | 23 | Medium | Standard quality, testing |
| `high` | 18 | Slow | Production quality |
| `max` | 15 | Very Slow | Ultra high quality, archival |

## Batch Configuration

### Using the Builder

```typescript
import { BatchConfigBuilder } from './src/BatchConfig';

const config = new BatchConfigBuilder('My Batch')
  .addQualityVariants('HelloWorld', 'mp4', ['medium', 'high'])
  .addFormatVariants('HelloWorld', 'high')
  .addRender({
    compositionId: 'HelloWorld',
    format: 'mp4',
    quality: 'max',
    props: { titleText: 'Ultra Quality' }
  })
  .build();
```

### Pre-built Templates

```typescript
import { ExampleConfigs } from './src/BatchConfig';

// Quality comparison
const qualityTest = ExampleConfigs.qualityComparison('HelloWorld');

// Format comparison
const formatTest = ExampleConfigs.formatComparison('HelloWorld', 'high');

// Production render
const production = ExampleConfigs.production('HelloWorld', {
  titleText: 'Final Version'
});
```

## Directory Structure

```
output/
├── production/          # Production renders
├── test/               # Test renders
├── drafts/             # Draft renders
├── batch/              # Batch render outputs
├── .metadata.json      # Project metadata
└── render-history.csv  # Exported render data
```

## CLI Commands

### List Compositions
```bash
npm run list
npm run cli -- list --verbose
```

### Render Single Composition
```bash
npm run render -- -c HelloWorld -f mp4 -q high
npm run cli -- render -c HelloWorld -o ./my-video.mp4 --props '{"titleText":"Custom"}'
```

### Batch Render
```bash
npm run cli -- batch -c ./batch-configs/quality-test.json
npm run cli -- batch -c ./batch-configs/production.json --verbose
```

### Estimate Render
```bash
npm run cli -- estimate -c HelloWorld -q high
```

## Advanced Features

### Progress Monitoring
```typescript
const renderer = new BarChartRaceRenderer('./output', (progress) => {
  console.log(`${progress.stage}: ${progress.percentage}%`);
  if (progress.estimatedTimeRemaining) {
    console.log(`ETA: ${progress.estimatedTimeRemaining}ms`);
  }
});
```

### Statistics and Reporting
```typescript
// Get render statistics
const stats = await renderer.getStatistics();
console.log(`Success rate: ${stats.successfulRenders / stats.totalRenders * 100}%`);

// Generate report
const report = await renderer.generateReport();
console.log(report);

// Export data
await renderer.exportData('./analysis.csv');
```

### Cleanup Management
```typescript
// Clean up old renders
const cleanup = await renderer.cleanup({
  keepDays: 30,
  keepSuccessful: 50,
  deleteFailed: true
});
console.log(`Freed ${cleanup.spaceFreed} bytes`);
```

## Error Handling

The system provides comprehensive error handling:
- Configuration validation before rendering
- Graceful handling of missing compositions
- Resource cleanup on failures
- Detailed error reporting

```typescript
const result = await renderer.renderComposition(config);
if (!result.success) {
  console.error('Render failed:', result.error?.message);
  // Handle error appropriately
}
```

## Performance Optimization

### Parallel Rendering
```typescript
// Use parallel processing for faster renders
await renderer.renderComposition({
  compositionId: 'HelloWorld',
  parallel: 4, // Use 4 parallel processes
  quality: 'high'
});
```

### Batch Processing
```typescript
// Render multiple configurations efficiently
const results = await renderer.renderBatch(configs);
```

## Testing

Run the integration test suite:
```bash
npm run test
```

Run specific examples:
```bash
npm run example basicUsage
npm run example qualityComparison
npm run example productionWorkflow
```

## File Size Estimation

The system provides file size estimation:
```typescript
const estimation = await renderer.estimateRender('HelloWorld', 'high');
console.log(`Estimated size: ${estimation.estimatedSize} bytes`);
console.log(`Estimated time: ${estimation.estimatedTime}ms`);
```

## Integration with Other Components

The rendering system integrates seamlessly with other Bar Chart Race components:
- Configuration validation from Sub Agent 1
- Data processing from Sub Agent 2
- Animation components from Sub Agent 3
- UI components from Sub Agent 4

## Troubleshooting

### Common Issues

1. **Bundle failures**: Ensure all dependencies are installed
2. **Composition not found**: Check composition ID spelling
3. **Output directory errors**: Ensure write permissions
4. **Memory issues**: Reduce parallel processes or quality

### Debug Mode
```bash
npm run cli -- render -c HelloWorld --verbose
```

### Logs
Check the output directory for:
- `.metadata.json` - Project metadata
- Error logs in console output
- Failed renders in statistics

## Contributing

To extend the rendering system:
1. Add new quality presets in `RenderPipeline.ts`
2. Create new batch templates in `BatchConfig.ts`
3. Extend CLI commands in `cli.ts`
4. Add integration tests in `integration-test.ts`

## API Reference

See the TypeScript definitions in the source files for complete API documentation:
- `RenderPipeline.ts` - Core rendering functionality
- `OutputManager.ts` - Output and metadata management
- `BatchConfig.ts` - Batch configuration utilities
- `BarChartRaceRenderer.ts` - High-level orchestrator