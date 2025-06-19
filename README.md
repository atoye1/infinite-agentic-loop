# Bar Chart Race Project

This project was generated using the barchart-race CLI tool.

## Files

- `config.json` - Configuration file defining video output settings, data mapping, and visual styling
- `sample-data.csv` - Sample CSV data file with time series data
- `README.md` - This file

## Usage

### 1. Validate your configuration and data
```bash
barchart-race validate --config config.json --data sample-data.csv --verbose
```

### 2. Render your video
```bash
barchart-race render --config config.json --data sample-data.csv --verbose
```

### 3. Advanced options
```bash
# High quality render with multiple workers
barchart-race render --config config.json --data sample-data.csv --quality max --parallel 4

# Dry run (validation only)
barchart-race render --config config.json --data sample-data.csv --dry-run

# Custom output file
barchart-race render --config config.json --data sample-data.csv --output my-video.mp4
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
