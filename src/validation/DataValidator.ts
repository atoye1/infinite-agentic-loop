import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { resolve } from 'path'
import {
  BarChartRaceConfig,
  RawData,
  ValidationError,
  ValidationResult
} from '../types/config'

export class DataValidator {
  validate(csvPath: string, config: BarChartRaceConfig): ValidationResult {
    const errors: ValidationError[] = []

    try {
      // Load and parse CSV
      const rawData = this.loadCSV(csvPath)
      
      // Validate CSV structure
      this.validateCSVStructure(rawData, config, errors)
      
      // Validate date column
      this.validateDateColumn(rawData, config, errors)
      
      // Validate value columns
      this.validateValueColumns(rawData, config, errors)
      
      // Validate data integrity
      this.validateDataIntegrity(rawData, config, errors)
      
      // Validate data sufficiency
      this.validateDataSufficiency(rawData, config, errors)

    } catch (error) {
      errors.push({
        field: 'csvPath',
        message: `Failed to load CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        value: csvPath
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private loadCSV(csvPath: string): RawData {
    const fullPath = resolve(csvPath)
    const fileContent = readFileSync(fullPath, 'utf-8')
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    if (!records || records.length === 0) {
      throw new Error('CSV file is empty or has no data rows')
    }

    const headers = Object.keys(records[0])
    
    return {
      headers,
      rows: records
    }
  }

  private validateCSVStructure(rawData: RawData, config: BarChartRaceConfig, errors: ValidationError[]): void {
    // Check if CSV has headers
    if (!rawData.headers || rawData.headers.length === 0) {
      errors.push({
        field: 'csv.headers',
        message: 'CSV file must have header row'
      })
      return
    }

    // Check if CSV has data rows
    if (!rawData.rows || rawData.rows.length === 0) {
      errors.push({
        field: 'csv.rows',
        message: 'CSV file must have at least one data row'
      })
      return
    }

    // Check for duplicate headers
    const uniqueHeaders = new Set(rawData.headers)
    if (uniqueHeaders.size !== rawData.headers.length) {
      errors.push({
        field: 'csv.headers',
        message: 'CSV file contains duplicate column headers'
      })
    }

    // Check for empty headers
    const emptyHeaders = rawData.headers.filter(header => !header || header.trim() === '')
    if (emptyHeaders.length > 0) {
      errors.push({
        field: 'csv.headers',
        message: 'CSV file contains empty column headers'
      })
    }
  }

  private validateDateColumn(rawData: RawData, config: BarChartRaceConfig, errors: ValidationError[]): void {
    const dateColumn = config.data.dateColumn
    
    // Check if date column exists
    if (!rawData.headers.includes(dateColumn)) {
      errors.push({
        field: 'data.dateColumn',
        message: `Date column '${dateColumn}' not found in CSV headers`,
        value: dateColumn
      })
      return
    }

    // Validate date values
    const dateFormat = config.data.dateFormat
    const invalidDates: Array<{ row: number, value: any }> = []
    const duplicateDates: Array<{ row: number, value: any }> = []
    const seenDates = new Set<string>()

    rawData.rows.forEach((row, index) => {
      const dateValue = row[dateColumn]
      
      if (dateValue === undefined || dateValue === null || dateValue === '') {
        errors.push({
          field: `csv.row[${index}].${dateColumn}`,
          message: `Date value is missing in row ${index + 1}`,
          value: dateValue
        })
        return
      }

      const dateString = String(dateValue)
      
      // Check for duplicate dates
      if (seenDates.has(dateString)) {
        duplicateDates.push({ row: index + 1, value: dateString })
      } else {
        seenDates.add(dateString)
      }

      // Validate date format
      if (!this.isValidDate(dateString, dateFormat)) {
        invalidDates.push({ row: index + 1, value: dateString })
      }
    })

    // Report invalid dates
    if (invalidDates.length > 0) {
      const sampleErrors = invalidDates.slice(0, 5) // Show first 5 errors
      errors.push({
        field: 'data.dateColumn',
        message: `Invalid date format in rows: ${sampleErrors.map(e => `${e.row} (${e.value})`).join(', ')}${invalidDates.length > 5 ? ` and ${invalidDates.length - 5} more` : ''}. Expected format: ${dateFormat}`
      })
    }

    // Report duplicate dates
    if (duplicateDates.length > 0) {
      const sampleDuplicates = duplicateDates.slice(0, 5)
      errors.push({
        field: 'data.dateColumn',
        message: `Duplicate dates found in rows: ${sampleDuplicates.map(d => `${d.row} (${d.value})`).join(', ')}${duplicateDates.length > 5 ? ` and ${duplicateDates.length - 5} more` : ''}`
      })
    }
  }

  private validateValueColumns(rawData: RawData, config: BarChartRaceConfig, errors: ValidationError[]): void {
    const valueColumns = config.data.valueColumns
    
    // Check if all value columns exist
    const missingColumns = valueColumns.filter(col => !rawData.headers.includes(col))
    if (missingColumns.length > 0) {
      errors.push({
        field: 'data.valueColumns',
        message: `Value columns not found in CSV: ${missingColumns.join(', ')}`,
        value: missingColumns
      })
      return
    }

    // Validate numeric values
    valueColumns.forEach(column => {
      const invalidValues: Array<{ row: number, value: any }> = []
      
      rawData.rows.forEach((row, index) => {
        const value = row[column]
        
        if (value !== undefined && value !== null && value !== '') {
          const numericValue = this.parseNumericValue(value)
          if (numericValue === null) {
            invalidValues.push({ row: index + 1, value })
          }
        }
      })

      if (invalidValues.length > 0) {
        const sampleErrors = invalidValues.slice(0, 5)
        errors.push({
          field: `data.valueColumns.${column}`,
          message: `Non-numeric values found in column '${column}' at rows: ${sampleErrors.map(e => `${e.row} (${e.value})`).join(', ')}${invalidValues.length > 5 ? ` and ${invalidValues.length - 5} more` : ''}`
        })
      }
    })
  }

  private validateDataIntegrity(rawData: RawData, config: BarChartRaceConfig, errors: ValidationError[]): void {
    const valueColumns = config.data.valueColumns
    const dateColumn = config.data.dateColumn
    
    // Check for rows with all empty values
    const emptyRows: number[] = []
    rawData.rows.forEach((row, index) => {
      const hasAnyValue = valueColumns.some(col => {
        const value = row[col]
        return value !== undefined && value !== null && value !== ''
      })
      
      if (!hasAnyValue) {
        emptyRows.push(index + 1)
      }
    })

    if (emptyRows.length > 0) {
      const sampleRows = emptyRows.slice(0, 10)
      errors.push({
        field: 'data.integrity',
        message: `Rows with no data in value columns: ${sampleRows.join(', ')}${emptyRows.length > 10 ? ` and ${emptyRows.length - 10} more` : ''}`
      })
    }

    // Check data consistency across columns
    const inconsistentRows: Array<{ row: number, details: string }> = []
    rawData.rows.forEach((row, index) => {
      const issues: string[] = []
      
      // Check for extremely large values that might be data errors
      valueColumns.forEach(col => {
        const value = this.parseNumericValue(row[col])
        if (value !== null && (value > 1e12 || value < -1e12)) {
          issues.push(`${col}: ${value} (extremely large)`)
        }
      })

      if (issues.length > 0) {
        inconsistentRows.push({
          row: index + 1,
          details: issues.join(', ')
        })
      }
    })

    if (inconsistentRows.length > 0) {
      const sampleRows = inconsistentRows.slice(0, 5)
      errors.push({
        field: 'data.integrity',
        message: `Potentially inconsistent data in rows: ${sampleRows.map(r => `${r.row} (${r.details})`).join('; ')}${inconsistentRows.length > 5 ? ` and ${inconsistentRows.length - 5} more` : ''}`
      })
    }
  }

  private validateDataSufficiency(rawData: RawData, config: BarChartRaceConfig, errors: ValidationError[]): void {
    const minRequiredRows = 2
    const recommendedMinRows = 10
    
    // Check minimum data requirements
    if (rawData.rows.length < minRequiredRows) {
      errors.push({
        field: 'data.sufficiency',
        message: `Insufficient data: CSV must have at least ${minRequiredRows} rows for animation. Found: ${rawData.rows.length}`,
        value: rawData.rows.length
      })
    } else if (rawData.rows.length < recommendedMinRows) {
      // This is a warning, not an error
      console.warn(`Warning: CSV has only ${rawData.rows.length} rows. Recommended minimum: ${recommendedMinRows} rows for smooth animation.`)
    }

    // Check if there's enough variation in data
    const valueColumns = config.data.valueColumns
    const hasVariation = valueColumns.some(column => {
      const values = rawData.rows
        .map(row => this.parseNumericValue(row[column]))
        .filter(val => val !== null) as number[]
      
      if (values.length < 2) return false
      
      const min = Math.min(...values)
      const max = Math.max(...values)
      return max > min // Has some variation
    })

    if (!hasVariation) {
      errors.push({
        field: 'data.sufficiency',
        message: 'Data appears to have no variation - all values are the same or missing'
      })
    }

    // Validate time range coverage
    const dateColumn = config.data.dateColumn
    const dates = rawData.rows
      .map(row => this.parseDate(String(row[dateColumn]), config.data.dateFormat))
      .filter(date => date !== null) as Date[]
    
    if (dates.length > 1) {
      dates.sort((a, b) => a.getTime() - b.getTime())
      const timeSpan = dates[dates.length - 1].getTime() - dates[0].getTime()
      const daySpan = timeSpan / (1000 * 60 * 60 * 24)
      
      if (daySpan < 1) {
        console.warn('Warning: Data spans less than one day. Consider using a longer time period for better visualization.')
      }
    }
  }

  // Helper methods
  private isValidDate(dateString: string, format: string): boolean {
    const parsedDate = this.parseDate(dateString, format)
    return parsedDate !== null && !isNaN(parsedDate.getTime())
  }

  private parseDate(dateString: string, format: string): Date | null {
    try {
      // This is a simplified date parser. In a real implementation,
      // you might want to use a library like moment.js or date-fns
      
      // Handle common formats
      if (format === 'YYYY-MM-DD') {
        const match = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
        if (match) {
          const [, year, month, day] = match
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        }
      } else if (format === 'YYYY-MM') {
        const match = dateString.match(/^(\d{4})-(\d{1,2})$/)
        if (match) {
          const [, year, month] = match
          return new Date(parseInt(year), parseInt(month) - 1, 1)
        }
      } else if (format === 'MM/DD/YYYY') {
        const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (match) {
          const [, month, day, year] = match
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        }
      } else if (format === 'DD/MM/YYYY') {
        const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (match) {
          const [, day, month, year] = match
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        }
      } else if (format === 'YYYY') {
        const match = dateString.match(/^(\d{4})$/)
        if (match) {
          const [, year] = match
          return new Date(parseInt(year), 0, 1)
        }
      }
      
      // Fallback to JavaScript's Date parsing
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? null : date
      
    } catch (error) {
      return null
    }
  }

  private parseNumericValue(value: any): number | null {
    if (value === undefined || value === null || value === '') {
      return null
    }

    // Convert to string and clean up
    const stringValue = String(value).trim()
    
    // Remove common formatting characters
    const cleanValue = stringValue
      .replace(/,/g, '') // Remove commas
      .replace(/[$€£¥₩]/g, '') // Remove currency symbols
      .replace(/%/g, '') // Remove percentage signs
      .trim()

    // Try to parse as number
    const parsed = parseFloat(cleanValue)
    return isNaN(parsed) ? null : parsed
  }

  // Public method to get processed data for validation
  public getProcessedData(csvPath: string, config: BarChartRaceConfig): RawData | null {
    try {
      return this.loadCSV(csvPath)
    } catch (error) {
      return null
    }
  }

  // Method to validate specific data transformations
  public validateDataTransformation(
    rawData: RawData, 
    config: BarChartRaceConfig,
    targetFps: number,
    targetDuration: number
  ): ValidationResult {
    const errors: ValidationError[] = []
    
    // Calculate expected frame count
    const expectedFrames = Math.ceil(targetFps * targetDuration)
    const actualDataPoints = rawData.rows.length
    
    // Check if interpolation is feasible
    if (actualDataPoints < 2 && config.data.interpolation !== 'step') {
      errors.push({
        field: 'data.interpolation',
        message: `Cannot use '${config.data.interpolation}' interpolation with less than 2 data points. Use 'step' interpolation instead.`,
        value: config.data.interpolation
      })
    }

    // Check for reasonable data density
    const dataPointsPerSecond = actualDataPoints / targetDuration
    if (dataPointsPerSecond > targetFps * 2) {
      console.warn(`Warning: High data density (${dataPointsPerSecond.toFixed(1)} points/second). Consider reducing data resolution or increasing duration.`)
    } else if (dataPointsPerSecond < 0.1) {
      console.warn(`Warning: Low data density (${dataPointsPerSecond.toFixed(1)} points/second). Consider adding more data points or reducing duration.`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}