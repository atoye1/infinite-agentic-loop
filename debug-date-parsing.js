#!/usr/bin/env node

// Simple test to debug date parsing issues
const sampleCSV = `Date,YouTube,Netflix,Disney+,HBO Max,Amazon Prime
2020-01,2000,1500,100,200,800
2020-02,2100,1600,200,250,850
2020-03,2200,1700,400,300,900`;

// Simulate the parseDate function logic
function parseDate(dateString, dateFormat) {
  const cleanDate = dateString.toString().trim();
  console.log(`Parsing date: "${cleanDate}" with format: ${dateFormat}`);
  
  try {
    switch (dateFormat) {
      case 'YYYY-MM':
        return parseDateFormat(cleanDate, /^(\d{4})-(\d{1,2})$/, true);
      default:
        throw new Error(`Unsupported date format: ${dateFormat}`);
    }
  } catch (error) {
    console.error(`Date parsing error: ${error.message}`);
    throw new Error(`Invalid date '${dateString}' for format ${dateFormat}`);
  }
}

function parseDateFormat(dateString, regex, monthOnly = false) {
  console.log(`Checking regex match for: "${dateString}" against pattern: ${regex}`);
  const match = dateString.match(regex);
  console.log(`Regex match result:`, match);
  
  if (!match) {
    throw new Error(`Date format mismatch: ${dateString}`);
  }

  let year, month, day;

  if (monthOnly) {
    year = parseInt(match[1]);
    month = parseInt(match[2]);
    day = 1;
  } else {
    year = parseInt(match[1]);
    month = parseInt(match[2]);
    day = parseInt(match[3]);
  }

  console.log(`Parsed components: year=${year}, month=${month}, day=${day}`);

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
  console.log(`Created Date object: ${date.toISOString()}`);
  
  // Check if date is valid
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
}

// Test the parsing
console.log('=== Date Parsing Debug ===\n');

// Parse the CSV manually
const lines = sampleCSV.split('\n');
const headers = lines[0].split(',');
console.log('Headers:', headers);

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',');
  const dateValue = values[0];
  
  console.log(`\nTesting row ${i}: ${lines[i]}`);
  console.log(`Date value extracted: "${dateValue}"`);
  
  try {
    const parsedDate = parseDate(dateValue, 'YYYY-MM');
    console.log(`✅ Successfully parsed: ${parsedDate.toISOString()}`);
  } catch (error) {
    console.log(`❌ Failed to parse: ${error.message}`);
  }
}