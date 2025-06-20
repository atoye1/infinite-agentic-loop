/**
 * BrowserDataLoader - Browser-compatible CSV file loading and metadata analysis
 * Works in web environment without Node.js fs/path dependencies
 */

export interface CSVMetadata {
  filename: string;
  filepath: string;
  columns: string[];
  dateColumn?: string;
  valueColumns: string[];
  rowCount: number;
  dataPreview: string[][];
  estimatedDateFormat?: string;
  hasHeaders: boolean;
}

export interface DataLoadResult {
  csvFiles: CSVMetadata[];
  totalFiles: number;
  validFiles: number;
  errors: string[];
}

export interface CSVFileInfo {
  filename: string;
  url: string; // URL or path to fetch the file
}

export class BrowserDataLoader {
  
  /**
   * Load CSV files from a predefined list (browser-compatible)
   */
  async scanCSVFiles(csvFiles?: CSVFileInfo[]): Promise<DataLoadResult> {
    const result: DataLoadResult = {
      csvFiles: [],
      totalFiles: 0,
      validFiles: 0,
      errors: []
    };

    // Use default CSV files if none provided
    const filesToLoad = csvFiles || this.getDefaultCSVFiles();
    result.totalFiles = filesToLoad.length;

    // Analyze each CSV file
    for (const fileInfo of filesToLoad) {
      try {
        const metadata = await this.analyzeCSVFromURL(fileInfo.filename, fileInfo.url);
        result.csvFiles.push(metadata);
        result.validFiles++;
      } catch (error) {
        result.errors.push(`Failed to analyze ${fileInfo.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Sort files by name
    result.csvFiles.sort((a, b) => a.filename.localeCompare(b.filename));

    return result;
  }

  /**
   * Get default CSV files that are known to exist in the project
   */
  private getDefaultCSVFiles(): CSVFileInfo[] {
    return [
      { filename: 'sample-data.csv', url: '/data/sample-data.csv' },
      { filename: 'animation-trigger-data.csv', url: '/data/animation-trigger-data.csv' },
      { filename: 'animation-trigger-data-dramatic.csv', url: '/data/animation-trigger-data-dramatic.csv' },
      { filename: 'animation-trigger-data-extreme.csv', url: '/data/animation-trigger-data-extreme.csv' },
      { filename: 'test-data.csv', url: '/data/test-data.csv' }
    ];
  }

  /**
   * Analyze CSV file from URL
   */
  private async analyzeCSVFromURL(filename: string, url: string): Promise<CSVMetadata> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      return this.analyzeCSVContent(filename, url, content);
    } catch (error) {
      // If fetch fails, create a mock metadata for development
      console.warn(`Could not load ${filename}, creating mock metadata:`, error);
      return this.createMockMetadata(filename, url);
    }
  }

  /**
   * Analyze CSV content
   */
  private analyzeCSVContent(filename: string, filepath: string, content: string): CSVMetadata {
    // CSV parsing
    const lines = content.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    // Extract headers
    const headers = this.parseCSVLine(lines[0]);
    const hasHeaders = this.detectHeaders(headers, lines);
    
    // Extract sample data (first 5 rows)
    const dataPreview: string[][] = [];
    const startIndex = hasHeaders ? 1 : 0;
    const previewCount = Math.min(5, lines.length - startIndex);
    
    for (let i = 0; i < previewCount; i++) {
      const lineIndex = startIndex + i;
      if (lineIndex < lines.length) {
        dataPreview.push(this.parseCSVLine(lines[lineIndex]));
      }
    }

    // Analyze columns
    const columns = hasHeaders ? headers : this.generateColumnNames(headers.length);
    const { dateColumn, valueColumns } = this.analyzeColumns(columns, dataPreview);
    const estimatedDateFormat = dateColumn ? this.estimateDateFormat(dataPreview, columns.indexOf(dateColumn)) : undefined;

    return {
      filename,
      filepath,
      columns,
      dateColumn,
      valueColumns,
      rowCount: lines.length - (hasHeaders ? 1 : 0),
      dataPreview,
      estimatedDateFormat,
      hasHeaders
    };
  }

  /**
   * Create mock metadata when file cannot be loaded
   */
  private createMockMetadata(filename: string, filepath: string): CSVMetadata {
    // Create reasonable defaults based on filename
    const baseColumns = ['Date', 'YouTube', 'Netflix', 'Disney+', 'Amazon Prime', 'Hulu'];
    
    if (filename.includes('test')) {
      return {
        filename,
        filepath,
        columns: ['Date', 'A', 'B', 'C'],
        dateColumn: 'Date',
        valueColumns: ['A', 'B', 'C'],
        rowCount: 20,
        dataPreview: [['2023-01', '100', '80', '60']],
        estimatedDateFormat: 'YYYY-MM',
        hasHeaders: true
      };
    }

    return {
      filename,
      filepath,
      columns: baseColumns,
      dateColumn: 'Date',
      valueColumns: baseColumns.slice(1),
      rowCount: 50,
      dataPreview: [['2023-01', '1000', '800', '600', '400', '200']],
      estimatedDateFormat: 'YYYY-MM',
      hasHeaders: true
    };
  }

  /**
   * Parse CSV line (simple implementation)
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(cell => cell.replace(/^"|"$/g, ''));
  }

  /**
   * Detect if first row contains headers
   */
  private detectHeaders(firstRow: string[], lines: string[]): boolean {
    if (lines.length < 2) return true;
    
    // First row is text and second row has numbers = headers exist
    const secondRow = this.parseCSVLine(lines[1]);
    
    const firstRowHasNumbers = firstRow.some(cell => !isNaN(Number(cell)) && cell.trim() !== '');
    const secondRowHasNumbers = secondRow.some(cell => !isNaN(Number(cell)) && cell.trim() !== '');
    
    return !firstRowHasNumbers && secondRowHasNumbers;
  }

  /**
   * Generate column names when no headers
   */
  private generateColumnNames(count: number): string[] {
    const names = ['Date'];
    for (let i = 1; i < count; i++) {
      names.push(`Column${i}`);
    }
    return names;
  }

  /**
   * Analyze columns to distinguish date and value columns
   */
  private analyzeColumns(columns: string[], dataPreview: string[][]): { dateColumn?: string; valueColumns: string[] } {
    if (dataPreview.length === 0) {
      return { valueColumns: columns };
    }

    let dateColumn: string | undefined;
    const valueColumns: string[] = [];

    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const columnName = columns[colIndex];
      const sampleValues = dataPreview.map(row => row[colIndex]).filter(val => val);
      
      if (this.isDateColumn(columnName, sampleValues)) {
        dateColumn = columnName;
      } else if (this.isValueColumn(sampleValues)) {
        valueColumns.push(columnName);
      }
    }

    // If no date column found, assume first column is date
    if (!dateColumn && columns.length > 0) {
      dateColumn = columns[0];
      // Remove date column from value columns
      const dateIndex = valueColumns.indexOf(dateColumn);
      if (dateIndex !== -1) {
        valueColumns.splice(dateIndex, 1);
      }
    }

    return { dateColumn, valueColumns };
  }

  /**
   * Check if column is a date column
   */
  private isDateColumn(columnName: string, sampleValues: string[]): boolean {
    // Check column name
    const dateKeywords = ['date', 'time', 'year', 'month', 'day', '날짜', '시간'];
    const nameIndicatesDate = dateKeywords.some(keyword => 
      columnName.toLowerCase().includes(keyword)
    );

    if (nameIndicatesDate) return true;

    // Check sample values for date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{4}-\d{2}$/, // YYYY-MM
      /^\d{4}$/, // YYYY
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}\/\d{4}$/ // MM/YYYY
    ];

    return sampleValues.some(value => 
      datePatterns.some(pattern => pattern.test(value.trim()))
    );
  }

  /**
   * Check if column contains numeric values
   */
  private isValueColumn(sampleValues: string[]): boolean {
    // Most values should be numeric
    const numericCount = sampleValues.filter(value => 
      !isNaN(Number(value.replace(/,/g, ''))) && value.trim() !== ''
    ).length;
    
    return numericCount >= sampleValues.length * 0.8; // 80% or more are numbers
  }

  /**
   * Estimate date format from sample values
   */
  private estimateDateFormat(dataPreview: string[][], dateColumnIndex: number): string {
    const dateValues = dataPreview
      .map(row => row[dateColumnIndex])
      .filter(val => val);

    if (dateValues.length === 0) return 'YYYY-MM-DD';

    const sampleValue = dateValues[0].trim();
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(sampleValue)) return 'YYYY-MM-DD';
    if (/^\d{4}-\d{2}$/.test(sampleValue)) return 'YYYY-MM';
    if (/^\d{4}$/.test(sampleValue)) return 'YYYY';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(sampleValue)) return 'MM/DD/YYYY';
    if (/^\d{2}\/\d{4}$/.test(sampleValue)) return 'MM/YYYY';
    
    return 'YYYY-MM-DD'; // Default
  }

  /**
   * Load specific CSV content by URL
   */
  async loadCSVContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Infer template type from filename
   */
  getTemplateTypeFromFilename(filename: string): string {
    const name = filename.toLowerCase();
    
    if (name.includes('social') || name.includes('instagram') || name.includes('tiktok')) {
      return 'social';
    }
    if (name.includes('business') || name.includes('sales') || name.includes('revenue')) {
      return 'business';
    }
    if (name.includes('sports') || name.includes('game') || name.includes('competition')) {
      return 'sports';
    }
    if (name.includes('education') || name.includes('school') || name.includes('university')) {
      return 'educational';
    }
    if (name.includes('test') || name.includes('sample') || name.includes('demo')) {
      return 'demo';
    }
    if (name.includes('dramatic') || name.includes('extreme')) {
      return 'gaming';
    }
    
    return 'default';
  }
}