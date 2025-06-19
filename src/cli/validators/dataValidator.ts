import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { BarChartRaceConfig } from '../types';

export interface DataValidationResult {
  totalRows: number;
  headers: string[];
  dateRange: {
    start: string;
    end: string;
  };
  valueColumnsFound: string[];
  missingValues: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export class DataValidator {
  async validate(dataPath: string, config: BarChartRaceConfig): Promise<DataValidationResult> {
    try {
      // Resolve path
      const resolvedPath = path.resolve(dataPath);
      
      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Data file not found: ${dataPath}`);
      }
      
      // Parse CSV and validate structure
      const data = await this.parseCSV(resolvedPath);
      
      // Validate headers
      this.validateHeaders(data.headers, config);
      
      // Validate data content
      const validationResult = this.validateDataContent(data.rows, config);
      
      // Validate date formats
      this.validateDateFormats(data.rows, config);
      
      // Calculate quality score
      const quality = this.calculateDataQuality(validationResult);
      
      return {
        totalRows: data.rows.length,
        headers: data.headers,
        dateRange: this.getDateRange(data.rows, config.data.dateColumn),
        valueColumnsFound: config.data.valueColumns.filter(col => 
          data.headers.includes(col)
        ),
        missingValues: validationResult.missingValues,
        quality
      };
      
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during data validation');
    }
  }
  
  private async parseCSV(filePath: string): Promise<{ headers: string[], rows: any[] }> {
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      let headers: string[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList: string[]) => {
          headers = headerList;
        })
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          resolve({ headers, rows });
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }
  
  private validateHeaders(headers: string[], config: BarChartRaceConfig): void {
    // Check if date column exists
    if (!headers.includes(config.data.dateColumn)) {
      throw new Error(`Date column "${config.data.dateColumn}" not found in CSV. Available columns: ${headers.join(', ')}`);
    }
    
    // Check if value columns exist
    const missingValueColumns = config.data.valueColumns.filter(
      col => !headers.includes(col)
    );
    
    if (missingValueColumns.length > 0) {
      throw new Error(`Value columns not found in CSV: ${missingValueColumns.join(', ')}. Available columns: ${headers.join(', ')}`);
    }
    
    // Check for duplicate headers
    const duplicateHeaders = headers.filter((header, index) => 
      headers.indexOf(header) !== index
    );
    
    if (duplicateHeaders.length > 0) {
      throw new Error(`Duplicate column headers found: ${duplicateHeaders.join(', ')}`);
    }
  }
  
  private validateDataContent(rows: any[], config: BarChartRaceConfig): { missingValues: number } {
    let missingValues = 0;
    const requiredColumns = [config.data.dateColumn, ...config.data.valueColumns];
    
    // Check minimum row count
    if (rows.length < 2) {
      throw new Error('CSV must contain at least 2 data rows for animation');
    }
    
    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Check for missing required values
      for (const column of requiredColumns) {
        const value = row[column];
        if (value === undefined || value === null || value === '') {
          missingValues++;
          console.warn(`Warning: Missing value in row ${i + 1}, column "${column}"`);
        }
      }
      
      // Validate numeric values
      for (const column of config.data.valueColumns) {
        const value = row[column];
        if (value !== undefined && value !== null && value !== '') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            throw new Error(`Invalid numeric value in row ${i + 1}, column "${column}": ${value}`);
          }
          if (numValue < 0) {
            console.warn(`Warning: Negative value in row ${i + 1}, column "${column}": ${value}`);
          }
        }
      }
    }
    
    return { missingValues };
  }
  
  private validateDateFormats(rows: any[], config: BarChartRaceConfig): void {
    const dateColumn = config.data.dateColumn;
    const dateFormat = config.data.dateFormat;
    
    // Basic date format validation
    for (let i = 0; i < Math.min(rows.length, 10); i++) { // Check first 10 rows
      const dateValue = rows[i][dateColumn];
      if (dateValue) {
        if (!this.isValidDateFormat(dateValue, dateFormat)) {
          throw new Error(`Invalid date format in row ${i + 1}: "${dateValue}". Expected format: ${dateFormat}`);
        }
      }
    }
    
    // Check for chronological order
    const dates = rows.map(row => row[dateColumn]).filter(Boolean);
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currentDate = new Date(dates[i]);
      
      if (currentDate < prevDate) {
        console.warn(`Warning: Dates are not in chronological order at row ${i + 1}: ${dates[i - 1]} -> ${dates[i]}`);
        break;
      }
    }
  }
  
  private isValidDateFormat(dateString: string, format: string): boolean {
    // Simple validation - could be enhanced with a proper date parsing library
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
  
  private getDateRange(rows: any[], dateColumn: string): { start: string, end: string } {
    const dates = rows.map(row => row[dateColumn]).filter(Boolean);
    
    if (dates.length === 0) {
      return { start: 'N/A', end: 'N/A' };
    }
    
    const sortedDates = dates.sort();
    return {
      start: sortedDates[0],
      end: sortedDates[sortedDates.length - 1]
    };
  }
  
  private calculateDataQuality(validationResult: { missingValues: number }): 'excellent' | 'good' | 'fair' | 'poor' {
    if (validationResult.missingValues === 0) {
      return 'excellent';
    } else if (validationResult.missingValues < 5) {
      return 'good';
    } else if (validationResult.missingValues < 20) {
      return 'fair';
    } else {
      return 'poor';
    }
  }
}