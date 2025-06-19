/**
 * Comprehensive validation utilities for the Bar Chart Race system
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
  context?: Record<string, unknown>;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: unknown;
  context?: Record<string, unknown>;
}

export class ValidationUtils {
  /**
   * Validate that a file exists and is readable
   */
  static async validateFileExists(filePath: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      if (!filePath || typeof filePath !== 'string') {
        errors.push({
          field: 'filePath',
          message: 'File path must be a non-empty string',
          code: 'INVALID_FILE_PATH',
          value: filePath
        });
        return { isValid: false, errors, warnings };
      }

      // In browser environment, we can't directly check file existence
      // This would need to be implemented differently for Node.js vs browser
      if (typeof window !== 'undefined') {
        // Browser environment - assume file exists if path is provided
        if (filePath.trim() === '') {
          errors.push({
            field: 'filePath',
            message: 'File path cannot be empty',
            code: 'EMPTY_FILE_PATH'
          });
        }
      } else {
        // Node.js environment
        const fs = await import('fs').catch(() => null);
        if (fs) {
          try {
            await fs.promises.access(filePath, fs.constants.R_OK);
          } catch {
            errors.push({
              field: 'filePath',
              message: `File not found or not readable: ${filePath}`,
              code: 'FILE_NOT_FOUND',
              value: filePath
            });
          }
        }
      }

    } catch (error) {
      errors.push({
        field: 'filePath',
        message: `File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'FILE_VALIDATION_ERROR',
        value: filePath,
        context: { originalError: error }
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate CSV structure and content
   */
  static validateCSVContent(csvContent: string, requiredColumns: string[] = []): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      if (!csvContent || typeof csvContent !== 'string') {
        errors.push({
          field: 'csvContent',
          message: 'CSV content must be a non-empty string',
          code: 'INVALID_CSV_CONTENT',
          value: typeof csvContent
        });
        return { isValid: false, errors, warnings };
      }

      const trimmedContent = csvContent.trim();
      if (trimmedContent.length === 0) {
        errors.push({
          field: 'csvContent',
          message: 'CSV content is empty',
          code: 'EMPTY_CSV_CONTENT'
        });
        return { isValid: false, errors, warnings };
      }

      const lines = trimmedContent.split('\n');
      
      if (lines.length < 2) {
        errors.push({
          field: 'csvContent',
          message: 'CSV must contain at least a header row and one data row',
          code: 'INSUFFICIENT_CSV_ROWS',
          value: lines.length
        });
        return { isValid: false, errors, warnings };
      }

      // Parse header
      const headerLine = lines[0].trim();
      if (headerLine.length === 0) {
        errors.push({
          field: 'csvContent.header',
          message: 'CSV header row is empty',
          code: 'EMPTY_CSV_HEADER'
        });
        return { isValid: false, errors, warnings };
      }

      const headers = this.parseCSVLine(headerLine);
      
      // Check for empty headers
      const emptyHeaderIndices = headers
        .map((header, index) => ({ header: header.trim(), index }))
        .filter(({ header }) => header === '')
        .map(({ index }) => index);

      if (emptyHeaderIndices.length > 0) {
        errors.push({
          field: 'csvContent.headers',
          message: `Empty header columns found at positions: ${emptyHeaderIndices.join(', ')}`,
          code: 'EMPTY_CSV_HEADERS',
          value: emptyHeaderIndices
        });
      }

      // Check for duplicate headers
      const headerCounts = new Map<string, number>();
      headers.forEach(header => {
        const trimmedHeader = header.trim();
        headerCounts.set(trimmedHeader, (headerCounts.get(trimmedHeader) || 0) + 1);
      });

      const duplicateHeaders = Array.from(headerCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([header]) => header);

      if (duplicateHeaders.length > 0) {
        errors.push({
          field: 'csvContent.headers',
          message: `Duplicate header columns found: ${duplicateHeaders.join(', ')}`,
          code: 'DUPLICATE_CSV_HEADERS',
          value: duplicateHeaders
        });
      }

      // Check required columns
      if (requiredColumns.length > 0) {
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          errors.push({
            field: 'csvContent.requiredColumns',
            message: `Required columns missing: ${missingColumns.join(', ')}`,
            code: 'MISSING_REQUIRED_COLUMNS',
            value: missingColumns,
            context: { availableColumns: headers }
          });
        }
      }

      // Validate data rows
      let validDataRows = 0;
      let emptyDataRows = 0;
      const rowErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.length === 0) {
          emptyDataRows++;
          continue;
        }

        try {
          const values = this.parseCSVLine(line);
          
          if (values.length !== headers.length) {
            rowErrors.push(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
            continue;
          }

          // Check if row has any non-empty values
          const hasData = values.some(value => value.trim() !== '');
          if (hasData) {
            validDataRows++;
          } else {
            emptyDataRows++;
          }

        } catch (error) {
          rowErrors.push(`Row ${i + 1}: Parse error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (validDataRows === 0) {
        errors.push({
          field: 'csvContent.dataRows',
          message: 'No valid data rows found in CSV',
          code: 'NO_VALID_DATA_ROWS',
          context: { totalRows: lines.length - 1, emptyRows: emptyDataRows, parseErrors: rowErrors.length }
        });
      }

      // Report warnings for data quality issues
      if (emptyDataRows > 0) {
        const emptyRowRate = emptyDataRows / (lines.length - 1);
        if (emptyRowRate > 0.1) {
          warnings.push({
            field: 'csvContent.dataQuality',
            message: `High rate of empty rows: ${(emptyRowRate * 100).toFixed(1)}% (${emptyDataRows} out of ${lines.length - 1})`,
            code: 'HIGH_EMPTY_ROW_RATE',
            value: emptyRowRate
          });
        }
      }

      if (rowErrors.length > 0) {
        const errorRate = rowErrors.length / (lines.length - 1);
        if (errorRate > 0.05) {
          warnings.push({
            field: 'csvContent.dataQuality',
            message: `High row parsing error rate: ${(errorRate * 100).toFixed(1)}% (${rowErrors.length} errors)`,
            code: 'HIGH_ROW_ERROR_RATE',
            value: errorRate,
            context: { sampleErrors: rowErrors.slice(0, 3) }
          });
        }
      }

    } catch (error) {
      errors.push({
        field: 'csvContent',
        message: `CSV validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'CSV_VALIDATION_ERROR',
        context: { originalError: error }
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate numeric data in CSV columns
   */
  static validateNumericColumns(csvContent: string, numericColumns: string[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        return { isValid: true, errors, warnings }; // Skip validation if no data
      }

      const headers = this.parseCSVLine(lines[0]);
      const columnIndices = new Map<string, number>();
      
      headers.forEach((header, index) => {
        columnIndices.set(header, index);
      });

      // Check if all numeric columns exist
      const missingColumns = numericColumns.filter(col => !columnIndices.has(col));
      if (missingColumns.length > 0) {
        errors.push({
          field: 'numericColumns',
          message: `Numeric columns not found: ${missingColumns.join(', ')}`,
          code: 'MISSING_NUMERIC_COLUMNS',
          value: missingColumns
        });
        return { isValid: false, errors, warnings };
      }

      // Validate numeric values in each column
      for (const column of numericColumns) {
        const columnIndex = columnIndices.get(column)!;
        const invalidValues: Array<{ row: number; value: string }> = [];
        const extremeValues: Array<{ row: number; value: number }> = [];
        let validValues = 0;
        let negativeValues = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.length === 0) continue;

          try {
            const values = this.parseCSVLine(line);
            if (values.length <= columnIndex) continue;

            const rawValue = values[columnIndex].trim();
            if (rawValue === '') continue; // Skip empty values

            const numericValue = this.parseNumericValue(rawValue);
            
            if (numericValue === null) {
              invalidValues.push({ row: i + 1, value: rawValue });
            } else {
              validValues++;
              
              if (numericValue < 0) {
                negativeValues++;
              }

              if (Math.abs(numericValue) > 1e12) {
                extremeValues.push({ row: i + 1, value: numericValue });
              }
            }

          } catch {
            invalidValues.push({ row: i + 1, value: 'parse error' });
          }
        }

        // Report errors for invalid numeric values
        if (invalidValues.length > 0) {
          const sampleErrors = invalidValues.slice(0, 5);
          errors.push({
            field: `numericColumns.${column}`,
            message: `Invalid numeric values in column '${column}': ${sampleErrors.map(e => `row ${e.row} (${e.value})`).join(', ')}${invalidValues.length > 5 ? ` and ${invalidValues.length - 5} more` : ''}`,
            code: 'INVALID_NUMERIC_VALUES',
            value: invalidValues.length,
            context: { column, sampleErrors: sampleErrors.slice(0, 3) }
          });
        }

        // Report warnings for data quality issues
        if (negativeValues > 0 && negativeValues / validValues > 0.1) {
          warnings.push({
            field: `numericColumns.${column}`,
            message: `Column '${column}' has many negative values (${negativeValues} out of ${validValues}). This might be intentional or could indicate data issues.`,
            code: 'HIGH_NEGATIVE_VALUE_RATE',
            value: negativeValues / validValues
          });
        }

        if (extremeValues.length > 0) {
          warnings.push({
            field: `numericColumns.${column}`,
            message: `Column '${column}' has extremely large values that might be data errors: ${extremeValues.slice(0, 3).map(e => `row ${e.row} (${e.value})`).join(', ')}`,
            code: 'EXTREME_NUMERIC_VALUES',
            value: extremeValues.length,
            context: { sampleValues: extremeValues.slice(0, 3) }
          });
        }
      }

    } catch (error) {
      errors.push({
        field: 'numericColumns',
        message: `Numeric column validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'NUMERIC_VALIDATION_ERROR',
        context: { originalError: error }
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Parse CSV line handling quotes and escapes
   */
  private static parseCSVLine(line: string): string[] {
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
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current);
    return result;
  }

  /**
   * Parse numeric value with common formatting
   */
  private static parseNumericValue(value: string): number | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    // Clean the value
    const cleanValue = value
      .trim()
      .replace(/,/g, '') // Remove thousands separators
      .replace(/[$€£¥₩]/g, '') // Remove currency symbols
      .replace(/%/g, ''); // Remove percentage signs

    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) || !isFinite(parsed) ? null : parsed;
  }

  /**
   * Combine multiple validation results
   */
  static combineValidationResults(...results: ValidationResult[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    for (const result of results) {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Format validation result for display
   */
  static formatValidationResult(result: ValidationResult): string {
    const messages: string[] = [];

    if (result.errors.length > 0) {
      messages.push('ERRORS:');
      result.errors.forEach(error => {
        messages.push(`  - ${error.field}: ${error.message} (${error.code})`);
      });
    }

    if (result.warnings.length > 0) {
      if (messages.length > 0) messages.push('');
      messages.push('WARNINGS:');
      result.warnings.forEach(warning => {
        messages.push(`  - ${warning.field}: ${warning.message} (${warning.code})`);
      });
    }

    if (messages.length === 0) {
      messages.push('Validation passed successfully.');
    }

    return messages.join('\n');
  }
}