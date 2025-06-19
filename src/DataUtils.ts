/**
 * DataUtils - Utility functions for data processing and validation
 */

import { DataPoint, FrameData, ProcessingConfig } from './DataProcessor';
import { random } from 'remotion';

export class DataUtils {
  /**
   * Load CSV content from file or URL
   */
  public static async loadCSV(source: string | File): Promise<string> {
    try {
      if (typeof source === 'string') {
        // Handle URL or file path
        if (source.startsWith('http')) {
          const response = await fetch(source);
          if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
          }
          return await response.text();
        } else {
          // File path - would need file system access in Node.js environment
          throw new Error('File path loading not supported in browser environment');
        }
      } else {
        // Handle File object
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              reject(new Error('Failed to read file as text'));
            }
          };
          reader.onerror = () => reject(new Error('File reading failed'));
          reader.readAsText(source);
        });
      }
    } catch (error) {
      throw new Error(`Failed to load CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect CSV structure and suggest configuration
   */
  public static analyzeCSV(csvContent: string): {
    headers: string[];
    sampleRows: string[][];
    suggestedDateColumn: string | null;
    suggestedValueColumns: string[];
    suggestedDateFormat: string | null;
    rowCount: number;
  } {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain at least header and one data row');
    }

    const headers = DataUtils.parseCSVLine(lines[0]);
    const sampleRows: string[][] = [];
    
    // Get up to 5 sample rows for analysis
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      try {
        sampleRows.push(DataUtils.parseCSVLine(lines[i]));
      } catch {
        // Skip malformed rows in analysis
      }
    }

    const analysis = {
      headers,
      sampleRows,
      suggestedDateColumn: DataUtils.detectDateColumn(headers, sampleRows),
      suggestedValueColumns: DataUtils.detectValueColumns(headers, sampleRows),
      suggestedDateFormat: DataUtils.detectDateFormat(headers, sampleRows),
      rowCount: lines.length - 1
    };

    return analysis;
  }

  /**
   * Parse CSV line with proper quote and comma handling
   */
  public static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Detect likely date column from headers and sample data
   */
  private static detectDateColumn(headers: string[], sampleRows: string[][]): string | null {
    // Check headers for date-like names
    const dateKeywords = ['date', 'time', 'year', 'month', 'day', 'when', 'period'];
    
    for (const header of headers) {
      const lowerHeader = header.toLowerCase();
      if (dateKeywords.some(keyword => lowerHeader.includes(keyword))) {
        return header;
      }
    }

    // Check sample data for date-like patterns
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const header = headers[colIndex];
      let dateCount = 0;
      
      for (const row of sampleRows) {
        if (row[colIndex] && DataUtils.looksLikeDate(row[colIndex])) {
          dateCount++;
        }
      }
      
      // If most values look like dates, suggest this column
      if (dateCount >= sampleRows.length * 0.8) {
        return header;
      }
    }

    return null;
  }

  /**
   * Detect likely value columns (numeric data)
   */
  private static detectValueColumns(headers: string[], sampleRows: string[][]): string[] {
    const valueColumns: string[] = [];

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const header = headers[colIndex];
      let numericCount = 0;
      
      for (const row of sampleRows) {
        if (row[colIndex] && !isNaN(parseFloat(row[colIndex]))) {
          numericCount++;
        }
      }
      
      // If most values are numeric, suggest as value column
      if (numericCount >= sampleRows.length * 0.8) {
        valueColumns.push(header);
      }
    }

    return valueColumns;
  }

  /**
   * Detect date format from sample data
   */
  private static detectDateFormat(headers: string[], sampleRows: string[][]): string | null {
    const datePatterns = [
      { format: 'YYYY-MM-DD', regex: /^\d{4}-\d{1,2}-\d{1,2}$/ },
      { format: 'YYYY-MM', regex: /^\d{4}-\d{1,2}$/ },
      { format: 'YYYY', regex: /^\d{4}$/ },
      { format: 'MM/DD/YYYY', regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/ },
      { format: 'DD/MM/YYYY', regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/ }
    ];

    for (const row of sampleRows) {
      for (const value of row) {
        if (!value) continue;
        
        for (const pattern of datePatterns) {
          if (pattern.regex.test(value.trim())) {
            return pattern.format;
          }
        }
      }
    }

    return null;
  }

  /**
   * Check if a string looks like a date
   */
  private static looksLikeDate(value: string): boolean {
    const datePatterns = [
      /^\d{4}-\d{1,2}-\d{1,2}$/,    // YYYY-MM-DD
      /^\d{4}-\d{1,2}$/,            // YYYY-MM
      /^\d{4}$/,                    // YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // MM/DD/YYYY or DD/MM/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/     // MM-DD-YYYY or DD-MM-YYYY
    ];

    return datePatterns.some(pattern => pattern.test(value.trim()));
  }

  /**
   * Validate processed data quality
   */
  public static validateDataQuality(data: DataPoint[]): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    stats: {
      totalPoints: number;
      categoriesCount: number;
      dateRange: { start: Date; end: Date } | null;
      hasNegativeValues: boolean;
      hasZeroValues: boolean;
      hasMissingValues: boolean;
    };
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (data.length === 0) {
      errors.push('No data points provided');
      return {
        isValid: false,
        warnings,
        errors,
        stats: {
          totalPoints: 0,
          categoriesCount: 0,
          dateRange: null,
          hasNegativeValues: false,
          hasZeroValues: false,
          hasMissingValues: false
        }
      };
    }

    // Calculate statistics
    const categories = new Set(data.map(d => d.category));
    const values = data.map(d => d.value);
    const dates = data.map(d => d.date.getTime());
    
    const stats = {
      totalPoints: data.length,
      categoriesCount: categories.size,
      dateRange: {
        start: new Date(Math.min(...dates)),
        end: new Date(Math.max(...dates))
      },
      hasNegativeValues: values.some(v => v < 0),
      hasZeroValues: values.some(v => v === 0),
      hasMissingValues: data.some(d => d.value === null || d.value === undefined || isNaN(d.value))
    };

    // Validation checks
    if (stats.categoriesCount < 2) {
      warnings.push('Only one category found - chart race needs multiple categories');
    }

    if (stats.hasNegativeValues) {
      warnings.push('Negative values found - may cause display issues in bar charts');
    }

    if (stats.hasMissingValues) {
      errors.push('Missing or invalid values found in data');
    }

    // Check for sufficient data points per category
    const pointsPerCategory = stats.totalPoints / stats.categoriesCount;
    if (pointsPerCategory < 2) {
      warnings.push('Very few data points per category - interpolation may not be smooth');
    }

    // Check date distribution
    const uniqueDates = new Set(dates);
    if (uniqueDates.size < 2) {
      errors.push('Need at least 2 different dates for animation');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      warnings,
      errors,
      stats
    };
  }

  /**
   * Export frame data to various formats
   */
  public static exportFrameData(frameData: FrameData[], format: 'json' | 'csv'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(frameData, null, 2);
      
      case 'csv': {
        if (frameData.length === 0) return '';
        
        // Create CSV with frame, timestamp, category, value, rank columns
        const headers = ['frame', 'timestamp', 'date', 'category', 'value', 'rank'];
        const rows = [headers.join(',')];
        
        for (const frame of frameData) {
          for (const dataPoint of frame.data) {
            const row = [
              frame.frame,
              frame.timestamp,
              frame.date.toISOString(),
              `"${dataPoint.category}"`,
              dataPoint.value,
              dataPoint.rank || ''
            ];
            rows.push(row.join(','));
          }
        }
        
        return rows.join('\n');
      }
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate sample CSV data for testing
   */
  public static generateSampleCSV(): string {
    const categories = ['Company A', 'Company B', 'Company C', 'Company D', 'Company E'];
    const dates = ['2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06'];
    
    const rows = ['Date,Company A,Company B,Company C,Company D,Company E'];
    
    for (let i = 0; i < dates.length; i++) {
      const values = categories.map((_, index) => Math.floor(random(`${i}-${index}`) * 1000) + 100);
      rows.push(`${dates[i]},${values.join(',')}`);
    }
    
    return rows.join('\n');
  }

  /**
   * Create optimal configuration from CSV analysis
   */
  public static createOptimalConfig(analysis: ReturnType<typeof DataUtils.analyzeCSV>): Partial<ProcessingConfig> {
    const config: Partial<ProcessingConfig> = {
      fps: 30,
      topN: Math.min(10, analysis.suggestedValueColumns.length),
      interpolationMethod: 'smooth'
    };

    if (analysis.suggestedDateColumn) {
      config.dateColumn = analysis.suggestedDateColumn;
    }

    if (analysis.suggestedValueColumns.length > 0) {
      config.valueColumns = analysis.suggestedValueColumns;
    }

    if (analysis.suggestedDateFormat) {
      config.dateFormat = analysis.suggestedDateFormat as ProcessingConfig['dateFormat'];
    }

    return config;
  }

  /**
   * Format large numbers for display
   */
  public static formatValue(value: number): string {
    if (value >= 1e9) {
      return (value / 1e9).toFixed(1) + 'B';
    } else if (value >= 1e6) {
      return (value / 1e6).toFixed(1) + 'M';
    } else if (value >= 1e3) {
      return (value / 1e3).toFixed(1) + 'K';
    } else {
      return value.toFixed(0);
    }
  }

  /**
   * Calculate animation duration based on data density
   */
  public static calculateOptimalDuration(dataPointCount: number, categoriesCount: number): number {
    // Base duration of 10 seconds, with adjustments for data complexity
    const baseDuration = 10;
    const complexityFactor = Math.log(dataPointCount / categoriesCount) / Math.log(10);
    
    return Math.max(5, Math.min(30, baseDuration + complexityFactor * 5));
  }

  /**
   * Generate color palette for categories
   */
  public static generateColorPalette(categoryCount: number): string[] {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F4D03F'
    ];

    if (categoryCount <= colors.length) {
      return colors.slice(0, categoryCount);
    }

    // Generate additional colors if needed
    const additionalColors: string[] = [];
    for (let i = colors.length; i < categoryCount; i++) {
      const hue = (i * 137.508) % 360; // Golden angle approximation
      additionalColors.push(`hsl(${hue}, 70%, 60%)`);
    }

    return [...colors, ...additionalColors];
  }
}