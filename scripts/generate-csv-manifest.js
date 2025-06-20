#!/usr/bin/env node

/**
 * Build-time script to scan CSV files and generate a manifest
 * This runs during build and creates a JSON file with all CSV metadata
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(__dirname, '../src/generated/csv-manifest.json');
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse CSV line (simple implementation)
 */
function parseCSVLine(line) {
  const result = [];
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
function detectHeaders(firstRow, lines) {
  if (lines.length < 2) return true;
  
  const secondRow = parseCSVLine(lines[1]);
  
  const firstRowHasNumbers = firstRow.some(cell => !isNaN(Number(cell)) && cell.trim() !== '');
  const secondRowHasNumbers = secondRow.some(cell => !isNaN(Number(cell)) && cell.trim() !== '');
  
  return !firstRowHasNumbers && secondRowHasNumbers;
}

/**
 * Generate column names when no headers
 */
function generateColumnNames(count) {
  const names = ['Date'];
  for (let i = 1; i < count; i++) {
    names.push(`Column${i}`);
  }
  return names;
}

/**
 * Check if column is a date column
 */
function isDateColumn(columnName, sampleValues) {
  const dateKeywords = ['date', 'time', 'year', 'month', 'day', '날짜', '시간'];
  const nameIndicatesDate = dateKeywords.some(keyword => 
    columnName.toLowerCase().includes(keyword)
  );

  if (nameIndicatesDate) return true;

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
function isValueColumn(sampleValues) {
  const numericCount = sampleValues.filter(value => 
    !isNaN(Number(value.replace(/,/g, ''))) && value.trim() !== ''
  ).length;
  
  return numericCount >= sampleValues.length * 0.8;
}

/**
 * Analyze columns to distinguish date and value columns
 */
function analyzeColumns(columns, dataPreview) {
  if (dataPreview.length === 0) {
    return { valueColumns: columns };
  }

  let dateColumn;
  const valueColumns = [];

  // First, check if first column is likely a date column
  if (columns.length > 0) {
    const firstColumnName = columns[0];
    const firstColumnValues = dataPreview.map(row => row[0]).filter(val => val);
    
    if (isDateColumn(firstColumnName, firstColumnValues)) {
      dateColumn = firstColumnName;
    }
  }

  // If still no date column, check all columns
  if (!dateColumn) {
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const columnName = columns[colIndex];
      const sampleValues = dataPreview.map(row => row[colIndex]).filter(val => val);
      
      if (isDateColumn(columnName, sampleValues)) {
        dateColumn = columnName;
        break; // Take the first date column found
      }
    }
  }

  // If still no date column found, assume first column is date
  if (!dateColumn && columns.length > 0) {
    dateColumn = columns[0];
  }

  // All other columns are value columns
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const columnName = columns[colIndex];
    
    if (columnName !== dateColumn) {
      const sampleValues = dataPreview.map(row => row[colIndex]).filter(val => val);
      if (isValueColumn(sampleValues)) {
        valueColumns.push(columnName);
      }
    }
  }

  return { dateColumn, valueColumns };
}

/**
 * Estimate date format from sample values
 */
function estimateDateFormat(dataPreview, dateColumnIndex) {
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
  
  return 'YYYY-MM-DD';
}

/**
 * Analyze a single CSV file
 */
function analyzeCSVFile(filepath) {
  const filename = path.basename(filepath);
  const content = fs.readFileSync(filepath, 'utf-8');
  
  const lines = content.trim().split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }

  const headers = parseCSVLine(lines[0]);
  const hasHeaders = detectHeaders(headers, lines);
  
  // Extract sample data (first 5 rows)
  const dataPreview = [];
  const startIndex = hasHeaders ? 1 : 0;
  const previewCount = Math.min(5, lines.length - startIndex);
  
  for (let i = 0; i < previewCount; i++) {
    const lineIndex = startIndex + i;
    if (lineIndex < lines.length) {
      dataPreview.push(parseCSVLine(lines[lineIndex]));
    }
  }

  const columns = hasHeaders ? headers : generateColumnNames(headers.length);
  const { dateColumn, valueColumns } = analyzeColumns(columns, dataPreview);
  const estimatedDateFormat = dateColumn ? estimateDateFormat(dataPreview, columns.indexOf(dateColumn)) : undefined;

  return {
    filename,
    filepath: `/data/${filename}`, // Browser-accessible path
    content: content, // Embed full CSV content
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
 * Main function to scan all CSV files and generate manifest
 */
function generateCSVManifest() {
  console.log('🔍 Scanning CSV files...');
  
  const manifest = {
    generated: new Date().toISOString(),
    csvFiles: [],
    totalFiles: 0,
    validFiles: 0,
    errors: []
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      manifest.errors.push(`Data directory not found: ${DATA_DIR}`);
      return manifest;
    }

    const files = fs.readdirSync(DATA_DIR);
    const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));
    manifest.totalFiles = csvFiles.length;

    console.log(`📁 Found ${csvFiles.length} CSV files`);

    for (const file of csvFiles) {
      try {
        const filepath = path.join(DATA_DIR, file);
        const metadata = analyzeCSVFile(filepath);
        manifest.csvFiles.push(metadata);
        manifest.validFiles++;
        console.log(`✅ Analyzed: ${file}`);
      } catch (error) {
        const errorMsg = `Failed to analyze ${file}: ${error.message}`;
        manifest.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Sort files by name
    manifest.csvFiles.sort((a, b) => a.filename.localeCompare(b.filename));

  } catch (error) {
    manifest.errors.push(`Failed to scan directory: ${error.message}`);
    console.error(`❌ ${error.message}`);
  }

  return manifest;
}

// Generate manifest and write to file
const manifest = generateCSVManifest();

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

console.log(`📝 Generated manifest: ${OUTPUT_FILE}`);
console.log(`📊 Summary: ${manifest.validFiles}/${manifest.totalFiles} files processed`);

if (manifest.errors.length > 0) {
  console.log(`⚠️  Errors: ${manifest.errors.length}`);
  manifest.errors.forEach(error => console.log(`   ${error}`));
}

console.log('✨ CSV manifest generation complete!');