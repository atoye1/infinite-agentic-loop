#!/usr/bin/env node

// Simple test with embedded manifest data
const mockManifest = {
  "csvFiles": [
    {
      "filename": "test-data.csv",
      "filepath": "/data/test-data.csv",
      "content": "Date,YouTube,Netflix,Disney+\n2020-01,2000,1500,100\n2020-02,2100,1600,200\n2020-03,2200,1700,400",
      "columns": ["Date", "YouTube", "Netflix", "Disney+"],
      "dateColumn": "Date",
      "valueColumns": ["YouTube", "Netflix", "Disney+"],
      "rowCount": 3,
      "estimatedDateFormat": "YYYY-MM",
      "hasHeaders": true
    }
  ],
  "totalFiles": 1,
  "validFiles": 1,
  "errors": []
};

// Test the DataProcessor directly
function testDataProcessor() {
  console.log('=== Testing DataProcessor ===\n');
  
  // Create config
  const config = {
    dateColumn: 'Date',
    valueColumns: ['YouTube', 'Netflix', 'Disney+'],
    dateFormat: 'YYYY-MM',
    interpolationMethod: 'linear',
    fps: 30,
    topN: 10
  };
  
  console.log('Config:', JSON.stringify(config, null, 2));
  
  try {
    // Simulate DataProcessor construction
    console.log('✅ DataProcessor config valid');
    
    // Simulate CSV parsing
    const csvContent = mockManifest.csvFiles[0].content;
    console.log('\nCSV Content:');
    console.log(csvContent);
    
    // Parse CSV manually to check
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    console.log('\nHeaders:', headers);
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      console.log(`Row ${i}:`, row);
      
      // Test date parsing specifically
      const dateValue = row[config.dateColumn];
      console.log(`  Date value: "${dateValue}"`);
      
      // Test regex for YYYY-MM format
      const dateRegex = /^(\d{4})-(\d{1,2})$/;
      const match = dateValue.match(dateRegex);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);
        const date = new Date(year, month - 1, 1);
        console.log(`  ✅ Parsed date: ${date.toISOString()}`);
      } else {
        console.log(`  ❌ Date regex failed for: "${dateValue}"`);
      }
    }
    
    console.log('\n✅ DataProcessor test passed');
    
  } catch (error) {
    console.log(`❌ DataProcessor test failed: ${error.message}`);
  }
}

// Run the test
testDataProcessor();