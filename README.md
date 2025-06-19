# Bar Chart Race CLI

A simple, unified CLI for rendering Bar Chart Race videos from CSV data using Remotion.

## Quick Start

The simplest way to render a video:

```bash
npm run render -- sample-data.csv
```

## Files

- `config.json` - Optional configuration file (uses smart defaults if not provided)
- `sample-data.csv` - Sample CSV data file with time series data
- `src/unified-cli.ts` - Unified CLI implementation

## Usage

### 1. Simple rendering (recommended)
```bash
# Render with default settings
npm run render -- sample-data.csv

# Render with custom quality
npm run render -- sample-data.csv --quality high

# Render with custom output name
npm run render -- sample-data.csv --output my-video.mp4
```

### 2. Validate your data first
```bash
npm run validate -- sample-data.csv
npm run validate -- sample-data.csv --verbose
```

### 3. Advanced usage
```bash
# Use custom configuration file
npm run render -- sample-data.csv --config config.json

# Dry run (validation only)
npm run render -- sample-data.csv --dry-run

# High quality render with verbose output
npm run render -- sample-data.csv --quality max --verbose
```

## Configuration

Edit `config.json` to customize:
- Video dimensions, duration, and quality
- Data column mapping and interpolation
- Visual styling (colors, fonts, positioning)
- Animation settings

## Data Format

Your CSV file should have:
- A date column (format specified in config)
- One or more value columns for the entities to visualize
- Consistent data structure across all rows

## Need Help?

Run any command with `--help` for detailed options:
```bash
barchart-race --help
barchart-race render --help
barchart-race validate --help
```
