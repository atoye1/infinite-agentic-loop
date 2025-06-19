# Error Handling System Guide

## Overview

The Bar Chart Race system implements comprehensive error handling and stability measures to ensure 100% reliability for valid inputs and graceful failure for invalid ones. This guide covers the error handling architecture, features, and usage patterns.

## Key Features

### 🛡️ Comprehensive Error Boundaries
- **React Error Boundaries**: Prevent component crashes from propagating
- **Data Error Boundaries**: Specialized handling for data processing errors
- **Layer-specific Boundaries**: Individual error handling for each layer

### 📊 Robust Data Processing
- **Input Validation**: Comprehensive CSV and configuration validation
- **Graceful Degradation**: Continue processing where possible
- **Error Recovery**: Automatic data cleaning and repair
- **Progress Tracking**: Detailed statistics on processing success/failure

### 🔍 Clear Error Messages
- **Actionable Feedback**: Specific guidance on how to fix issues
- **Error Codes**: Structured error identification
- **Context Information**: Additional details for debugging
- **Warnings vs Errors**: Distinguish between fatal and non-fatal issues

## Error Types

### Configuration Errors
```typescript
// Example: Invalid configuration
try {
  const processor = new DataProcessor(invalidConfig);
} catch (error) {
  if (error instanceof DataProcessingError) {
    console.log(error.code); // 'INVALID_CONFIG'
    console.log(error.message); // Detailed explanation
    console.log(error.context); // Configuration details
  }
}
```

**Common Configuration Error Codes:**
- `INVALID_CONFIG`: General configuration validation failure
- `MISSING_REQUIRED_FIELD`: Required configuration field missing
- `INVALID_DATE_FORMAT`: Unsupported date format specified
- `INVALID_INTERPOLATION_METHOD`: Unsupported interpolation method
- `INVALID_RANGE`: Numeric values outside valid ranges

### Data Processing Errors
```typescript
// Example: CSV parsing with validation
try {
  processor.parseCSV(csvContent);
} catch (error) {
  if (error instanceof DataProcessingError) {
    switch (error.code) {
      case 'EMPTY_CSV':
        console.log('CSV file is empty');
        break;
      case 'MISSING_COLUMNS':
        console.log('Required columns not found');
        break;
      case 'NO_VALID_DATA':
        console.log('No usable data rows found');
        break;
    }
  }
}
```

**Common Data Processing Error Codes:**
- `EMPTY_CSV`: CSV content is empty or whitespace only
- `INSUFFICIENT_DATA`: Less than minimum required rows
- `MISSING_COLUMNS`: Required columns not found in headers
- `NO_VALID_DATA`: No parseable data rows found
- `INVALID_DATE_RANGE`: Start date is after end date
- `HIGH_INTERPOLATION_ERROR_RATE`: Too many frame generation errors

### Runtime Errors
```typescript
// Example: Safe frame data access
const frameData = safeGetFrameData(processedData, frameNumber);
if (!frameData) {
  console.warn('Frame data not available, using fallback');
  // Handle gracefully with default values
}
```

## Usage Patterns

### 1. Basic Error Handling
```typescript
import { DataProcessor, DataProcessingError } from './DataProcessor';

try {
  const processor = new DataProcessor(config);
  processor.parseCSV(csvContent);
  processor.transformData();
  const frames = processor.generateFrameData(duration);
} catch (error) {
  if (error instanceof DataProcessingError) {
    // Handle specific data processing errors
    console.error(`Processing failed: ${error.message} (${error.code})`);
    
    // Access additional context if available
    if (error.context) {
      console.log('Error context:', error.context);
    }
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

### 2. Validation Before Processing
```typescript
import { ValidationUtils } from './utils/ValidationUtils';

// Validate CSV content before processing
const csvValidation = ValidationUtils.validateCSVContent(
  csvContent, 
  ['Date', 'Revenue', 'Users']
);

if (!csvValidation.isValid) {
  console.error('CSV validation failed:');
  csvValidation.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message}`);
  });
  return;
}

// Show warnings but continue processing
if (csvValidation.warnings.length > 0) {
  console.warn('CSV validation warnings:');
  csvValidation.warnings.forEach(warning => {
    console.warn(`- ${warning.field}: ${warning.message}`);
  });
}

// Proceed with processing...
```

### 3. React Error Boundaries
```typescript
import { ErrorBoundary, DataErrorBoundary } from './components/ErrorBoundary';

// Wrap components with error boundaries
function MyChart({ config, data }) {
  return (
    <ErrorBoundary>
      <DataErrorBoundary dataSource={config.data.csvPath}>
        <BarChartRaceComposition config={config} processedData={data} />
      </DataErrorBoundary>
    </ErrorBoundary>
  );
}
```

### 4. Progressive Error Handling
```typescript
// Handle errors at multiple levels
try {
  const processor = new DataProcessor(config);
  
  // Level 1: Parse with error tolerance
  try {
    processor.parseCSV(csvContent);
  } catch (parseError) {
    if (parseError.code === 'INSUFFICIENT_DATA') {
      console.warn('Limited data available, continuing with reduced dataset');
      // Try with relaxed validation
      processor.parseCSV(csvContent, { strict: false });
    } else {
      throw parseError;
    }
  }
  
  // Level 2: Transform with monitoring
  processor.transformData();
  const stats = processor.getProcessingStats();
  
  if (stats.skippedRows / stats.totalRows > 0.5) {
    console.warn('High skip rate detected, data quality may be poor');
  }
  
  // Level 3: Generate frames with fallbacks
  const frames = processor.generateFrameData(duration);
  
} catch (error) {
  // Final error handling
  console.error('Processing completely failed:', error);
  // Provide fallback data or user guidance
}
```

### 5. Monitoring and Statistics
```typescript
// Get detailed processing statistics
const processor = new DataProcessor(config);
processor.parseCSV(csvContent);
processor.transformData();

const stats = processor.getProcessingStats();
console.log('Processing Statistics:');
console.log(`- Total rows: ${stats.totalRows}`);
console.log(`- Valid rows: ${stats.validRows}`);
console.log(`- Skipped rows: ${stats.skippedRows}`);
console.log(`- Errors: ${stats.errors.length}`);
console.log(`- Data points: ${stats.processedDataPoints}`);
console.log(`- Generated frames: ${stats.generatedFrames}`);

// Get data quality metrics
const dataStats = processor.getDataStats();
console.log('Data Quality:');
console.log(`- Categories: ${dataStats.categories.length}`);
console.log(`- Date range: ${dataStats.dateRange.start} to ${dataStats.dateRange.end}`);
console.log(`- Value range: ${dataStats.valueRange.min} to ${dataStats.valueRange.max}`);
```

## Error Recovery Strategies

### 1. Data Cleaning
The system automatically handles common data issues:
- **Missing values**: Replaced with 0 or interpolated
- **Invalid numbers**: Converted to 0 with warnings
- **Malformed dates**: Skipped with error logging
- **Extra columns**: Ignored gracefully
- **Empty rows**: Skipped automatically

### 2. Graceful Degradation
When errors occur, the system:
- Continues processing valid data
- Provides fallback values for missing data
- Generates partial results when possible
- Maintains system stability

### 3. User Guidance
Error messages include:
- Clear description of the problem
- Specific field or location of the issue
- Suggested fixes or workarounds
- Expected data format examples

## Best Practices

### 1. Always Validate Input
```typescript
// Validate before processing
const validation = ValidationUtils.validateCSVContent(csvContent, requiredColumns);
if (!validation.isValid) {
  // Handle validation errors before proceeding
  return;
}
```

### 2. Use Safe Access Functions
```typescript
// Use safe accessors for optional data
const frameData = safeGetFrameData(processedData, frame);
if (frameData) {
  // Process frame data
} else {
  // Handle missing data
}
```

### 3. Monitor Processing Statistics
```typescript
// Check processing quality
const stats = processor.getProcessingStats();
const errorRate = stats.skippedRows / stats.totalRows;

if (errorRate > 0.1) {
  console.warn(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
  // Consider data quality improvements
}
```

### 4. Implement Error Boundaries
```typescript
// Wrap components to prevent crashes
<ErrorBoundary fallback={<ErrorMessage />}>
  <MyComponent />
</ErrorBoundary>
```

### 5. Provide User Feedback
```typescript
// Give users actionable feedback
if (error instanceof DataProcessingError) {
  const userMessage = formatErrorForUser(error);
  showUserNotification(userMessage, 'error');
}
```

## Testing Error Scenarios

The system includes comprehensive error handling tests:

```typescript
import { ErrorHandlingTest } from './tests/ErrorHandlingTest';

// Run all error handling tests
await ErrorHandlingTest.runAllTests();
```

Test coverage includes:
- Invalid configurations
- Malformed CSV data
- Missing files
- Edge cases (empty data, extreme values)
- Network errors
- Memory constraints

## Debugging Tools

### 1. Error Context
Errors include contextual information:
```typescript
if (error.context) {
  console.log('Error context:', error.context);
  // Contains: original data, processing state, validation results
}
```

### 2. Processing Statistics
Monitor processing quality:
```typescript
const stats = processor.getProcessingStats();
// Detailed breakdown of processing success/failure
```

### 3. Validation Results
Detailed validation reporting:
```typescript
const result = ValidationUtils.validateCSVContent(csv);
console.log(ValidationUtils.formatValidationResult(result));
```

## Performance Considerations

The error handling system is designed to be:
- **Efficient**: Minimal performance overhead
- **Non-blocking**: Errors don't halt entire processing
- **Memory-safe**: Proper cleanup on errors
- **Scalable**: Handles large datasets gracefully

## Conclusion

This comprehensive error handling system ensures the Bar Chart Race application:
- ✅ **Never crashes unexpectedly**
- ✅ **Provides clear, actionable error messages**
- ✅ **Handles edge cases gracefully**
- ✅ **Continues processing where possible**
- ✅ **Maintains data integrity**
- ✅ **Offers debugging and monitoring tools**

The system transforms potential failures into learning opportunities and ensures a robust, user-friendly experience even when things go wrong.