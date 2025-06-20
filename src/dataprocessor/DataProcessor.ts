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

export class DataProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DataProcessingError';
  }
}

export class DataProcessor {
  private config: ProcessingConfig;
  private rawData: RawDataRow[] = [];
  private processedData: DataPoint[] = [];
  private frameData: FrameData[] = [];
  private isInitialized = false;
  private processingStats = {
    totalRows: 0,
    validRows: 0,
    skippedRows: 0,
    errors: [] as string[]
  };

  constructor(config: ProcessingConfig) {
    // Validate config on construction
    const configErrors = DataProcessor.validateConfig(config);
    if (configErrors.length > 0) {
      throw new DataProcessingError(
        `Invalid configuration: ${configErrors.join(', ')}`,
        'INVALID_CONFIG',
        { errors: configErrors }
      );
    }

    this.config = {
      fps: 30,
      topN: 10,
      ...config
    };
    this.isInitialized = true;
  }

  /**
   * Parse CSV data with robust error handling
   */
  public parseCSV(csvContent: string): void {
    if (!this.isInitialized) {
      throw new DataProcessingError(
        'DataProcessor not properly initialized',
        'NOT_INITIALIZED'
      );
    }

    // Reset processing stats
    this.processingStats = {
      totalRows: 0,
      validRows: 0,
      skippedRows: 0,
      errors: []
    };

    try {
      // Validate input
      if (!csvContent || typeof csvContent !== 'string') {
        throw new DataProcessingError(
          'CSV content must be a non-empty string',
          'INVALID_INPUT',
          { type: typeof csvContent, length: csvContent?.length }
        );
      }

      const trimmedContent = csvContent.trim();
      if (trimmedContent.length === 0) {
        throw new DataProcessingError(
          'CSV content is empty after trimming',
          'EMPTY_CSV'
        );
      }

      const lines = trimmedContent.split('\n');
      this.processingStats.totalRows = lines.length - 1; // Excluding header

      if (lines.length < 2) {
        throw new DataProcessingError(
          'CSV must contain at least header and one data row',
          'INSUFFICIENT_DATA',
          { lineCount: lines.length }
        );
      }

      // Parse and validate headers
      const headers = this.parseCSVLine(lines[0]);
      this.validateHeaders(headers);

      this.rawData = [];
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const lineContent = lines[i].trim();
          
          // Skip empty lines
          if (lineContent.length === 0) {
            this.processingStats.skippedRows++;
            continue;
          }

          const values = this.parseCSVLine(lineContent);
          
          if (values.length !== headers.length) {
            const error = `Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`;
            this.processingStats.errors.push(error);
            this.processingStats.skippedRows++;
            console.warn(error);
            continue;
          }

          const row: RawDataRow = {};
          let hasValidData = false;

          headers.forEach((header, index) => {
            const value = values[index];
            if (value !== undefined && value !== null && value.trim() !== '') {
              // Try to parse as number, fallback to string
              const numValue = parseFloat(value);
              row[header] = isNaN(numValue) ? value.trim() : numValue;
              hasValidData = true;
            } else {
              row[header] = '';
            }
          });

          // Only add rows that have at least some valid data
          if (hasValidData) {
            this.rawData.push(row);
            this.processingStats.validRows++;
          } else {
            this.processingStats.skippedRows++;
            this.processingStats.errors.push(`Row ${i + 1}: All columns are empty`);
          }

        } catch (error) {
          const errorMsg = `Row ${i + 1}: Parse error - ${error instanceof Error ? error.message : 'Unknown error'}`;
          this.processingStats.errors.push(errorMsg);
          this.processingStats.skippedRows++;
          console.warn(errorMsg);
        }
      }

      if (this.rawData.length === 0) {
        throw new DataProcessingError(
          'No valid data rows found in CSV',
          'NO_VALID_DATA',
          {
            totalRows: this.processingStats.totalRows,
            skippedRows: this.processingStats.skippedRows,
            errors: this.processingStats.errors.slice(0, 10) // First 10 errors
          }
        );
      }

      // Warn if too many rows were skipped
      const skipRate = this.processingStats.skippedRows / this.processingStats.totalRows;
      if (skipRate > 0.5) {
        console.warn(`Warning: High skip rate (${(skipRate * 100).toFixed(1)}%). ${this.processingStats.skippedRows} of ${this.processingStats.totalRows} rows were skipped.`);
      }

      console.log(`Successfully parsed ${this.rawData.length} rows (${this.processingStats.skippedRows} skipped)`);
      
    } catch (error) {
      if (error instanceof DataProcessingError) {
        throw error;
      }
      throw new DataProcessingError(
        `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSING_ERROR',
        { originalError: error }
      );
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
    } catch {
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
    if (!this.isInitialized) {
      throw new DataProcessingError(
        'DataProcessor not properly initialized',
        'NOT_INITIALIZED'
      );
    }

    if (this.rawData.length === 0) {
      throw new DataProcessingError(
        'No raw data available. Call parseCSV() first.',
        'NO_RAW_DATA'
      );
    }

    this.processedData = [];
    let transformErrors = 0;
    const dateParseErrors: string[] = [];
    const valueParseErrors: string[] = [];

    try {
      for (let rowIndex = 0; rowIndex < this.rawData.length; rowIndex++) {
        const row = this.rawData[rowIndex];
        
        try {
          // Parse date with detailed error handling
          const dateValue = row[this.config.dateColumn];
          if (!dateValue || dateValue === '') {
            dateParseErrors.push(`Row ${rowIndex + 2}: Empty date value`);
            transformErrors++;
            continue;
          }

          const date = this.parseDate(dateValue as string);

          // Process each value column
          for (const valueColumn of this.config.valueColumns) {
            try {
              const rawValue = row[valueColumn];
              
              // Handle missing or empty values
              if (rawValue === undefined || rawValue === null || rawValue === '') {
                // For missing values, we can either skip or use 0
                // For most bar chart races, 0 is appropriate for missing data
                this.processedData.push({
                  category: valueColumn,
                  value: 0,
                  date: date
                });
                continue;
              }

              const value = parseFloat(rawValue as string);
              
              if (isNaN(value)) {
                valueParseErrors.push(`Row ${rowIndex + 2}, Column '${valueColumn}': Invalid numeric value '${rawValue}'`);
                // Use 0 for invalid numeric values to prevent gaps in animation
                this.processedData.push({
                  category: valueColumn,
                  value: 0,
                  date: date
                });
                continue;
              }

              // Validate numeric ranges
              if (!isFinite(value)) {
                valueParseErrors.push(`Row ${rowIndex + 2}, Column '${valueColumn}': Non-finite value ${value}`);
                this.processedData.push({
                  category: valueColumn,
                  value: 0,
                  date: date
                });
                continue;
              }

              // Check for extremely large values that might be errors
              if (Math.abs(value) > 1e15) {
                console.warn(`Row ${rowIndex + 2}, Column '${valueColumn}': Extremely large value ${value} - this might be a data error`);
              }

              this.processedData.push({
                category: valueColumn,
                value: value,
                date: date
              });

            } catch (error) {
              valueParseErrors.push(`Row ${rowIndex + 2}, Column '${valueColumn}': ${error instanceof Error ? error.message : 'Unknown error'}`);
              transformErrors++;
            }
          }

        } catch (error) {
          if (error.message.includes('Invalid date')) {
            dateParseErrors.push(`Row ${rowIndex + 2}: ${error.message}`);
          } else {
            dateParseErrors.push(`Row ${rowIndex + 2}: Failed to process - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          transformErrors++;
        }
      }

      // Report parsing errors
      if (dateParseErrors.length > 0) {
        const sampleErrors = dateParseErrors.slice(0, 5);
        console.warn(`Date parsing errors (${dateParseErrors.length} total):`, sampleErrors);
        if (dateParseErrors.length > 5) {
          console.warn(`... and ${dateParseErrors.length - 5} more date errors`);
        }
      }

      if (valueParseErrors.length > 0) {
        const sampleErrors = valueParseErrors.slice(0, 5);
        console.warn(`Value parsing errors (${valueParseErrors.length} total):`, sampleErrors);
        if (valueParseErrors.length > 5) {
          console.warn(`... and ${valueParseErrors.length - 5} more value errors`);
        }
      }

      if (this.processedData.length === 0) {
        throw new DataProcessingError(
          'No valid data points generated from CSV',
          'NO_PROCESSED_DATA',
          {
            rawDataRows: this.rawData.length,
            dateParseErrors: dateParseErrors.length,
            valueParseErrors: valueParseErrors.length,
            sampleDateErrors: dateParseErrors.slice(0, 3),
            sampleValueErrors: valueParseErrors.slice(0, 3)
          }
        );
      }

      // Sort by date for consistent processing
      this.processedData.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Validate data consistency
      this.validateTransformedData();
      
      const errorRate = transformErrors / (this.rawData.length * this.config.valueColumns.length);
      if (errorRate > 0.1) {
        console.warn(`High transformation error rate: ${(errorRate * 100).toFixed(1)}% of data points had errors`);
      }
      
      console.log(`Successfully transformed ${this.processedData.length} data points (${transformErrors} errors)`);
      
    } catch (error) {
      if (error instanceof DataProcessingError) {
        throw error;
      }
      throw new DataProcessingError(
        `Data transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TRANSFORMATION_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Validate transformed data for consistency and quality
   */
  private validateTransformedData(): void {
    if (this.processedData.length === 0) {
      return;
    }

    // Check for temporal consistency
    const categories = this.getUniqueCategories();
    const dates = Array.from(new Set(this.processedData.map(d => d.date.getTime()))).sort();
    
    // Warn if data is sparse
    let missingDataPoints = 0;
    for (const category of categories) {
      const categoryData = this.processedData.filter(d => d.category === category);
      const categoryDates = new Set(categoryData.map(d => d.date.getTime()));
      
      for (const dateTime of dates) {
        if (!categoryDates.has(dateTime)) {
          missingDataPoints++;
        }
      }
    }

    if (missingDataPoints > 0) {
      const totalExpected = categories.length * dates.length;
      const coverage = ((totalExpected - missingDataPoints) / totalExpected) * 100;
      console.warn(`Data coverage: ${coverage.toFixed(1)}% (${missingDataPoints} missing data points)`);
    }

    // Check for negative values that might be unexpected
    const negativeValues = this.processedData.filter(d => d.value < 0);
    if (negativeValues.length > 0) {
      console.warn(`Found ${negativeValues.length} negative values. This might be intentional or could indicate data issues.`);
    }

    // Check date range
    const timeSpan = this.getMaxDate().getTime() - this.getMinDate().getTime();
    const daySpan = timeSpan / (1000 * 60 * 60 * 24);
    
    if (daySpan < 1) {
      console.warn('Data spans less than one day. Animation may appear static.');
    } else if (daySpan > 36500) { // 100 years
      console.warn('Data spans more than 100 years. Consider filtering to a more specific time range.');
    }
  }

  /**
   * Generate frame-by-frame data for video rendering
   */
  public generateFrameData(durationSeconds: number): FrameData[] {
    if (!this.isInitialized) {
      throw new DataProcessingError(
        'DataProcessor not properly initialized',
        'NOT_INITIALIZED'
      );
    }

    if (this.processedData.length === 0) {
      throw new DataProcessingError(
        'No processed data available. Call transformData() first.',
        'NO_PROCESSED_DATA'
      );
    }

    // Validate inputs
    if (!durationSeconds || durationSeconds <= 0) {
      throw new DataProcessingError(
        'Duration must be a positive number',
        'INVALID_DURATION',
        { duration: durationSeconds }
      );
    }

    if (durationSeconds > 3600) {
      console.warn('Duration exceeds 1 hour. This may result in very large files and long processing times.');
    }

    try {
      const totalFrames = Math.ceil(durationSeconds * this.config.fps);
      const startDate = this.config.startDate || this.getMinDate();
      const endDate = this.config.endDate || this.getMaxDate();
      const timeSpan = endDate.getTime() - startDate.getTime();

      if (timeSpan <= 0) {
        throw new DataProcessingError(
          'Invalid date range: start date must be before end date',
          'INVALID_DATE_RANGE',
          { 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString() 
          }
        );
      }

      this.frameData = [];
      let interpolationErrors = 0;

      for (let frame = 0; frame < totalFrames; frame++) {
        try {
          const progress = totalFrames > 1 ? frame / (totalFrames - 1) : 0;
          const currentTime = startDate.getTime() + (progress * timeSpan);
          const currentDate = new Date(currentTime);

          const frameDataPoints = this.interpolateDataAtTime(currentDate);
          
          if (frameDataPoints.length === 0) {
            console.warn(`No data available for frame ${frame} (${currentDate.toISOString()})`);
            // Create empty frame data
            this.frameData.push({
              frame,
              timestamp: currentTime,
              date: currentDate,
              data: []
            });
            continue;
          }

          const rankedData = this.calculateRankings(frameDataPoints);
          const topData = rankedData.slice(0, this.config.topN || 10);

          this.frameData.push({
            frame,
            timestamp: currentTime,
            date: currentDate,
            data: topData
          });

        } catch (error) {
          interpolationErrors++;
          console.warn(`Frame ${frame} interpolation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // Create a fallback frame
          this.frameData.push({
            frame,
            timestamp: startDate.getTime() + ((frame / (totalFrames - 1)) * timeSpan),
            date: new Date(startDate.getTime() + ((frame / (totalFrames - 1)) * timeSpan)),
            data: []
          });
        }
      }

      if (interpolationErrors > 0) {
        const errorRate = interpolationErrors / totalFrames;
        if (errorRate > 0.1) {
          throw new DataProcessingError(
            `High frame interpolation error rate: ${(errorRate * 100).toFixed(1)}%`,
            'HIGH_INTERPOLATION_ERROR_RATE',
            { 
              errors: interpolationErrors, 
              totalFrames,
              errorRate 
            }
          );
        } else {
          console.warn(`Frame generation completed with ${interpolationErrors} interpolation errors`);
        }
      }

      console.log(`Generated ${this.frameData.length} frames for ${durationSeconds}s duration`);
      return this.frameData;

    } catch (error) {
      if (error instanceof DataProcessingError) {
        throw error;
      }
      throw new DataProcessingError(
        `Frame data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FRAME_GENERATION_ERROR',
        { originalError: error }
      );
    }
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
   * Get processing statistics
   */
  public getProcessingStats() {
    return {
      ...this.processingStats,
      processedDataPoints: this.processedData.length,
      generatedFrames: this.frameData.length,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Reset the processor state
   */
  public reset(): void {
    this.rawData = [];
    this.processedData = [];
    this.frameData = [];
    this.processingStats = {
      totalRows: 0,
      validRows: 0,
      skippedRows: 0,
      errors: []
    };
  }

  /**
   * Validate configuration
   */
  public static validateConfig(config: ProcessingConfig): string[] {
    const errors: string[] = [];

    if (!config) {
      errors.push('Configuration is required');
      return errors;
    }

    if (!config.dateColumn || typeof config.dateColumn !== 'string') {
      errors.push('dateColumn is required and must be a string');
    }

    if (!config.valueColumns || !Array.isArray(config.valueColumns) || config.valueColumns.length === 0) {
      errors.push('valueColumns must be a non-empty array');
    } else {
      // Check that all value columns are strings
      const invalidColumns = config.valueColumns.filter(col => typeof col !== 'string' || col.trim() === '');
      if (invalidColumns.length > 0) {
        errors.push('All valueColumns must be non-empty strings');
      }

      // Check for duplicate columns
      const uniqueColumns = new Set(config.valueColumns);
      if (uniqueColumns.size !== config.valueColumns.length) {
        errors.push('valueColumns cannot contain duplicates');
      }
    }

    if (!config.dateFormat || !['YYYY-MM-DD', 'YYYY-MM', 'YYYY', 'MM/DD/YYYY', 'DD/MM/YYYY'].includes(config.dateFormat)) {
      errors.push('dateFormat must be one of: YYYY-MM-DD, YYYY-MM, YYYY, MM/DD/YYYY, DD/MM/YYYY');
    }

    if (!config.interpolationMethod || !['linear', 'smooth', 'step'].includes(config.interpolationMethod)) {
      errors.push('interpolationMethod must be one of: linear, smooth, step');
    }

    if (config.fps !== undefined) {
      if (typeof config.fps !== 'number' || config.fps < 1 || config.fps > 120) {
        errors.push('fps must be a number between 1 and 120');
      }
    }

    if (config.topN !== undefined) {
      if (typeof config.topN !== 'number' || config.topN < 1 || config.topN > 100) {
        errors.push('topN must be a number between 1 and 100');
      }
    }

    if (config.startDate !== undefined) {
      if (!(config.startDate instanceof Date) || isNaN(config.startDate.getTime())) {
        errors.push('startDate must be a valid Date object');
      }
    }

    if (config.endDate !== undefined) {
      if (!(config.endDate instanceof Date) || isNaN(config.endDate.getTime())) {
        errors.push('endDate must be a valid Date object');
      }
    }

    if (config.startDate && config.endDate && config.startDate >= config.endDate) {
      errors.push('startDate must be before endDate');
    }

    return errors;
  }

  /**
   * Create a safe DataProcessor instance with validation
   */
  public static createSafe(config: ProcessingConfig): DataProcessor {
    try {
      return new DataProcessor(config);
    } catch (error) {
      console.error('Failed to create DataProcessor:', error);
      throw error;
    }
  }
}