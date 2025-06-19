/**
 * DataProcessor - Complete data processing pipeline for Bar Chart Race
 * Handles CSV parsing, date formatting, interpolation, and frame generation
 */

export interface DataPoint {
  category: string;
  value: number;
  date: Date;
  rank?: number;
}

export interface FrameData {
  frame: number;
  timestamp: number;
  date: Date;
  data: DataPoint[];
}

export interface ProcessingConfig {
  dateColumn: string;
  valueColumns: string[];
  dateFormat: 'YYYY-MM-DD' | 'YYYY-MM' | 'YYYY' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  interpolationMethod: 'linear' | 'smooth' | 'step';
  fps: number;
  startDate?: Date;
  endDate?: Date;
  topN?: number;
}

export interface RawDataRow {
  [key: string]: string | number;
}

export class DataProcessor {
  private config: ProcessingConfig;
  private rawData: RawDataRow[] = [];
  private processedData: DataPoint[] = [];
  private frameData: FrameData[] = [];

  constructor(config: ProcessingConfig) {
    this.config = {
      fps: 30,
      topN: 10,
      ...config
    };
  }

  /**
   * Parse CSV data with robust error handling
   */
  public parseCSV(csvContent: string): void {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must contain at least header and one data row');
      }

      const headers = this.parseCSVLine(lines[0]);
      this.validateHeaders(headers);

      this.rawData = [];
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          if (values.length !== headers.length) {
            console.warn(`Row ${i + 1}: Column count mismatch, skipping`);
            continue;
          }

          const row: RawDataRow = {};
          headers.forEach((header, index) => {
            const value = values[index];
            // Try to parse as number, fallback to string
            const numValue = parseFloat(value);
            row[header] = isNaN(numValue) ? value : numValue;
          });

          this.rawData.push(row);
        } catch (error) {
          console.warn(`Row ${i + 1}: Parse error, skipping - ${error}`);
        }
      }

      if (this.rawData.length === 0) {
        throw new Error('No valid data rows found in CSV');
      }

      console.log(`Successfully parsed ${this.rawData.length} rows`);
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse a single CSV line handling quoted values and commas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  }

  /**
   * Validate that required columns exist in headers
   */
  private validateHeaders(headers: string[]): void {
    if (!headers.includes(this.config.dateColumn)) {
      throw new Error(`Date column '${this.config.dateColumn}' not found in CSV headers`);
    }

    const missingColumns = this.config.valueColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Value columns not found: ${missingColumns.join(', ')}`);
    }
  }

  /**
   * Parse date string according to configured format
   */
  public parseDate(dateString: string): Date {
    const cleanDate = dateString.toString().trim();
    
    try {
      switch (this.config.dateFormat) {
        case 'YYYY-MM-DD':
          return this.parseDateFormat(cleanDate, /^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        
        case 'YYYY-MM':
          return this.parseDateFormat(cleanDate, /^(\d{4})-(\d{1,2})$/, true);
        
        case 'YYYY':
          return this.parseDateFormat(cleanDate, /^(\d{4})$/, true, true);
        
        case 'MM/DD/YYYY':
          return this.parseDateFormat(cleanDate, /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, false, false, true);
        
        case 'DD/MM/YYYY':
          return this.parseDateFormat(cleanDate, /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, false, false, false, true);
        
        default:
          throw new Error(`Unsupported date format: ${this.config.dateFormat}`);
      }
    } catch (error) {
      throw new Error(`Invalid date '${dateString}' for format ${this.config.dateFormat}`);
    }
  }

  /**
   * Helper method to parse date with regex and format variations
   */
  private parseDateFormat(
    dateString: string, 
    regex: RegExp, 
    monthOnly = false, 
    yearOnly = false,
    usMDY = false,
    euDMY = false
  ): Date {
    const match = dateString.match(regex);
    if (!match) {
      throw new Error(`Date format mismatch: ${dateString}`);
    }

    let year: number, month: number, day: number;

    if (yearOnly) {
      year = parseInt(match[1]);
      month = 1;
      day = 1;
    } else if (monthOnly) {
      year = parseInt(match[1]);
      month = parseInt(match[2]);
      day = 1;
    } else if (usMDY) {
      month = parseInt(match[1]);
      day = parseInt(match[2]);
      year = parseInt(match[3]);
    } else if (euDMY) {
      day = parseInt(match[1]);
      month = parseInt(match[2]);
      year = parseInt(match[3]);
    } else {
      year = parseInt(match[1]);
      month = parseInt(match[2]);
      day = parseInt(match[3]);
    }

    // Validate date components
    if (year < 1900 || year > 2100) {
      throw new Error(`Invalid year: ${year}`);
    }
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month}`);
    }
    if (day < 1 || day > 31) {
      throw new Error(`Invalid day: ${day}`);
    }

    const date = new Date(year, month - 1, day);
    
    // Check if date is valid (handles invalid dates like Feb 30)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new Error(`Invalid date: ${dateString}`);
    }

    return date;
  }

  /**
   * Transform raw CSV data into structured DataPoints
   */
  public transformData(): void {
    this.processedData = [];

    for (const row of this.rawData) {
      try {
        const date = this.parseDate(row[this.config.dateColumn] as string);

        for (const valueColumn of this.config.valueColumns) {
          const value = parseFloat(row[valueColumn] as string);
          
          if (isNaN(value)) {
            console.warn(`Invalid value for ${valueColumn} in row with date ${row[this.config.dateColumn]}`);
            continue;
          }

          this.processedData.push({
            category: valueColumn,
            value: value,
            date: date
          });
        }
      } catch (error) {
        console.warn(`Failed to process row: ${error}`);
      }
    }

    if (this.processedData.length === 0) {
      throw new Error('No valid data points generated from CSV');
    }

    // Sort by date for consistent processing
    this.processedData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    console.log(`Transformed ${this.processedData.length} data points`);
  }

  /**
   * Generate frame-by-frame data for video rendering
   */
  public generateFrameData(durationSeconds: number): FrameData[] {
    if (this.processedData.length === 0) {
      throw new Error('No processed data available. Call transformData() first.');
    }

    const totalFrames = Math.ceil(durationSeconds * this.config.fps);
    const startDate = this.config.startDate || this.getMinDate();
    const endDate = this.config.endDate || this.getMaxDate();
    const timeSpan = endDate.getTime() - startDate.getTime();

    this.frameData = [];

    for (let frame = 0; frame < totalFrames; frame++) {
      const progress = frame / (totalFrames - 1);
      const currentTime = startDate.getTime() + (progress * timeSpan);
      const currentDate = new Date(currentTime);

      const frameDataPoints = this.interpolateDataAtTime(currentDate);
      const rankedData = this.calculateRankings(frameDataPoints);

      this.frameData.push({
        frame,
        timestamp: currentTime,
        date: currentDate,
        data: rankedData.slice(0, this.config.topN)
      });
    }

    return this.frameData;
  }

  /**
   * Interpolate data values at a specific time point
   */
  private interpolateDataAtTime(targetDate: Date): DataPoint[] {
    const targetTime = targetDate.getTime();
    const categories = this.getUniqueCategories();
    const result: DataPoint[] = [];

    for (const category of categories) {
      const categoryData = this.processedData
        .filter(d => d.category === category)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (categoryData.length === 0) continue;

      const interpolatedValue = this.interpolateValue(categoryData, targetTime);
      
      result.push({
        category,
        value: interpolatedValue,
        date: targetDate
      });
    }

    return result;
  }

  /**
   * Interpolate a single value using the configured method
   */
  private interpolateValue(data: DataPoint[], targetTime: number): number {
    if (data.length === 0) return 0;
    if (data.length === 1) return data[0].value;

    // Find surrounding data points
    let beforeIndex = -1;
    let afterIndex = -1;

    for (let i = 0; i < data.length; i++) {
      const dataTime = data[i].date.getTime();
      
      if (dataTime <= targetTime) {
        beforeIndex = i;
      }
      if (dataTime >= targetTime && afterIndex === -1) {
        afterIndex = i;
        break;
      }
    }

    // Handle edge cases
    if (beforeIndex === -1) return data[0].value;
    if (afterIndex === -1) return data[data.length - 1].value;
    if (beforeIndex === afterIndex) return data[beforeIndex].value;

    const beforePoint = data[beforeIndex];
    const afterPoint = data[afterIndex];

    switch (this.config.interpolationMethod) {
      case 'step':
        return beforePoint.value;

      case 'linear':
        return this.linearInterpolation(beforePoint, afterPoint, targetTime);

      case 'smooth':
        return this.smoothInterpolation(data, beforeIndex, afterIndex, targetTime);

      default:
        return this.linearInterpolation(beforePoint, afterPoint, targetTime);
    }
  }

  /**
   * Linear interpolation between two points
   */
  private linearInterpolation(before: DataPoint, after: DataPoint, targetTime: number): number {
    const beforeTime = before.date.getTime();
    const afterTime = after.date.getTime();
    
    if (beforeTime === afterTime) return before.value;
    
    const ratio = (targetTime - beforeTime) / (afterTime - beforeTime);
    return before.value + (after.value - before.value) * ratio;
  }

  /**
   * Smooth interpolation using cubic spline-like approach
   */
  private smoothInterpolation(data: DataPoint[], beforeIndex: number, afterIndex: number, targetTime: number): number {
    // For smooth interpolation, consider additional surrounding points for better curves
    const p0Index = Math.max(0, beforeIndex - 1);
    const p1Index = beforeIndex;
    const p2Index = afterIndex;
    const p3Index = Math.min(data.length - 1, afterIndex + 1);

    const p0 = data[p0Index];
    const p1 = data[p1Index];
    const p2 = data[p2Index];
    const p3 = data[p3Index];

    const t1 = p1.date.getTime();
    const t2 = p2.date.getTime();
    
    if (t1 === t2) return p1.value;
    
    const t = (targetTime - t1) / (t2 - t1);
    
    // Catmull-Rom spline interpolation
    const v0 = p0.value;
    const v1 = p1.value;
    const v2 = p2.value;
    const v3 = p3.value;

    const a = -0.5 * v0 + 1.5 * v1 - 1.5 * v2 + 0.5 * v3;
    const b = v0 - 2.5 * v1 + 2 * v2 - 0.5 * v3;
    const c = -0.5 * v0 + 0.5 * v2;
    const d = v1;

    return a * t * t * t + b * t * t + c * t + d;
  }

  /**
   * Calculate rankings for data points
   */
  private calculateRankings(data: DataPoint[]): DataPoint[] {
    // Sort by value (descending) then by category name for consistent tie-breaking
    const sorted = [...data].sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value;
      }
      return a.category.localeCompare(b.category);
    });

    // Assign ranks with proper tie handling
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].value !== sorted[i - 1].value) {
        currentRank = i + 1;
      }
      sorted[i].rank = currentRank;
    }

    return sorted;
  }

  /**
   * Get unique categories from processed data
   */
  private getUniqueCategories(): string[] {
    const categories = new Set(this.processedData.map(d => d.category));
    return Array.from(categories).sort();
  }

  /**
   * Get minimum date from processed data
   */
  private getMinDate(): Date {
    if (this.processedData.length === 0) {
      throw new Error('No processed data available');
    }
    return new Date(Math.min(...this.processedData.map(d => d.date.getTime())));
  }

  /**
   * Get maximum date from processed data
   */
  private getMaxDate(): Date {
    if (this.processedData.length === 0) {
      throw new Error('No processed data available');
    }
    return new Date(Math.max(...this.processedData.map(d => d.date.getTime())));
  }

  /**
   * Get processed data for inspection
   */
  public getProcessedData(): DataPoint[] {
    return [...this.processedData];
  }

  /**
   * Get frame data for inspection
   */
  public getFrameData(): FrameData[] {
    return [...this.frameData];
  }

  /**
   * Get data statistics
   */
  public getDataStats(): {
    totalDataPoints: number;
    categories: string[];
    dateRange: { start: Date; end: Date };
    valueRange: { min: number; max: number };
  } {
    if (this.processedData.length === 0) {
      throw new Error('No processed data available');
    }

    const values = this.processedData.map(d => d.value);
    
    return {
      totalDataPoints: this.processedData.length,
      categories: this.getUniqueCategories(),
      dateRange: {
        start: this.getMinDate(),
        end: this.getMaxDate()
      },
      valueRange: {
        min: Math.min(...values),
        max: Math.max(...values)
      }
    };
  }

  /**
   * Validate configuration
   */
  public static validateConfig(config: ProcessingConfig): string[] {
    const errors: string[] = [];

    if (!config.dateColumn) {
      errors.push('dateColumn is required');
    }

    if (!config.valueColumns || config.valueColumns.length === 0) {
      errors.push('valueColumns must contain at least one column');
    }

    if (!['YYYY-MM-DD', 'YYYY-MM', 'YYYY', 'MM/DD/YYYY', 'DD/MM/YYYY'].includes(config.dateFormat)) {
      errors.push('dateFormat must be one of: YYYY-MM-DD, YYYY-MM, YYYY, MM/DD/YYYY, DD/MM/YYYY');
    }

    if (!['linear', 'smooth', 'step'].includes(config.interpolationMethod)) {
      errors.push('interpolationMethod must be one of: linear, smooth, step');
    }

    if (config.fps && (config.fps < 1 || config.fps > 120)) {
      errors.push('fps must be between 1 and 120');
    }

    if (config.topN && config.topN < 1) {
      errors.push('topN must be greater than 0');
    }

    return errors;
  }
}