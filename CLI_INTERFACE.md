# Bar Chart Race CLI Interface (v1.0 Foundation Fix)

## Overview

This document describes the **unified CLI interface** created for the Bar Chart Race system. The CLI has been consolidated from multiple competing implementations into a single, simple command system focused on essential functionality.

## Architecture (Post-Consolidation)

The unified CLI system uses a single entry point:

```
src/
├── unified-cli.ts        # Main unified CLI implementation
├── cli.ts               # Legacy CLI (preserved)
└── cli/                 # Legacy CLI directory (preserved)
    ├── index.ts
    ├── commands/
    └── validators/
```

**Key Changes:**
- **Single CLI implementation** replaces dual/competing systems
- **Simplified interface** focuses on essential render and validate functions
- **Smart defaults** reduce configuration complexity
- **Auto-detection** of CSV structure minimizes required configuration

## Commands (Unified Interface)

### 1. `npm run render` - Primary Render Command

The main command for rendering videos from CSV data.

**Basic Usage (Recommended):**
```bash
npm run render -- data.csv
```

**Full Syntax:**
```bash
npm run render -- <data.csv> [options]
```

**Options:**
- `-c, --config <path>` - Config JSON file path (optional, uses smart defaults)
- `-o, --output <path>` - Output video file path (default: bar-chart-race.mp4)
- `-q, --quality <level>` - Render quality: low, medium, high, max (default: high)
- `-v, --verbose` - Enable verbose logging
- `--dry-run` - Validate configuration without rendering

**Examples:**
```bash
# Simple render with defaults
npm run render -- sample-data.csv

# Custom quality and output
npm run render -- sample-data.csv --quality max --output my-video.mp4

# Use custom configuration
npm run render -- sample-data.csv --config config.json

# Dry run validation
npm run render -- sample-data.csv --dry-run --verbose
```

### 2. `npm run validate` - Data Validation

Validates CSV data and configuration without rendering.

**Usage:**
```bash
npm run validate -- data.csv [options]
```

**Options:**
- `-c, --config <path>` - Config JSON file path (optional)
- `-v, --verbose` - Enable verbose logging

**Examples:**
```bash
# Basic validation
npm run validate -- sample-data.csv

# Verbose validation with config
npm run validate -- sample-data.csv --config config.json --verbose
```

### 3. `barchart-race init`

Initializes a new bar chart race project with template files.

**Usage:**
```bash
barchart-race init [options]
```

**Options:**
- `-t, --template <name>` - Template name: default, minimal, advanced (default: default)
- `-o, --output <dir>` - Output directory for template files (default: current directory)

**Examples:**
```bash
# Create default template in current directory
barchart-race init

# Create minimal template in specific directory
barchart-race init --template minimal --output ./my-project
```

## Implementation Details

### Configuration Validation

The CLI implements comprehensive configuration validation using Zod schemas:

- **Structure validation**: Ensures all required fields are present
- **Type validation**: Validates data types and formats
- **Range validation**: Checks numeric ranges (fps: 1-120, quality levels, etc.)
- **File validation**: Verifies file paths exist and are accessible
- **Business logic validation**: Checks aspect ratios, timeline consistency, etc.

### Data Validation

CSV data validation includes:

- **Header validation**: Ensures required columns exist
- **Data type validation**: Validates numeric values and date formats
- **Completeness checks**: Identifies missing values
- **Quality scoring**: Rates data quality (excellent, good, fair, poor)
- **Compatibility checks**: Ensures data matches configuration requirements

### Error Handling

The CLI provides comprehensive error handling:

- **Graceful failures**: Clear error messages with actionable suggestions
- **Verbose logging**: Detailed error information when requested
- **Exit codes**: Proper exit codes for scripting integration
- **Progress indicators**: Visual feedback during long operations

### Integration Points

The CLI is designed to integrate with other components:

- **Data Processing**: Interfaces with data processor components
- **Rendering Pipeline**: Hooks into Remotion.js rendering system
- **Configuration System**: Uses validated configuration schemas
- **Output Management**: Handles video output and metadata

## Development Scripts

The following npm scripts are available for development:

```bash
# Run CLI directly
npm run cli -- --help

# Test specific commands
npm run cli-render -- --help
npm run cli-validate -- --help
npm run cli-init -- --help

# Development and testing
npm run lint
npm run build
```

## TypeScript Interfaces

### Core Types

```typescript
interface CLIOptions {
  config: string;
  data: string;
  output?: string;
  quality?: 'low' | 'medium' | 'high' | 'max';
  parallel?: number;
  verbose?: boolean;
  dryRun?: boolean;
}

interface BarChartRaceConfig {
  output: OutputConfig;
  data: DataConfig;
  layers: LayersConfig;
}
```

### Command-Specific Types

```typescript
interface RenderOptions extends CLIOptions {
  config: string;
  data: string;
}

interface ValidateOptions {
  config: string;
  data: string;
  verbose?: boolean;
}

interface InitOptions {
  template?: string;
  output?: string;
}
```

## Installation and Setup

The CLI is integrated into the package.json with a binary entry point:

```json
{
  "bin": {
    "barchart-race": "./bin/barchart-race.js"
  }
}
```

After installation, the CLI is available as:
```bash
barchart-race --help
```

## Error Codes

The CLI uses standard exit codes:
- `0` - Success
- `1` - General error (validation failed, file not found, etc.)
- `2` - Configuration error
- `3` - Data processing error

## Future Enhancements

Potential future enhancements for the CLI:

1. **Watch mode**: Automatically re-render when files change
2. **Batch processing**: Process multiple configurations at once
3. **Preview mode**: Generate preview frames without full render
4. **Template management**: Custom template creation and sharing
5. **Cloud integration**: Upload rendered videos to cloud storage
6. **Progress callbacks**: WebSocket-based progress updates for web UIs

## Testing

The CLI can be tested using the npm scripts:

```bash
# Create test project
mkdir test-project && cd test-project
npm run cli-init

# Validate configuration
npm run cli-validate -- -c config.json -d sample-data.csv --verbose

# Dry run render
npm run cli-render -- -c config.json -d sample-data.csv --dry-run --verbose
```

This CLI interface provides a complete, production-ready command-line tool for the Bar Chart Race system, with proper error handling, validation, and integration points for other system components.