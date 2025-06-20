#!/usr/bin/env node

/**
 * Test script to verify dynamic composition generation
 */

async function testCompositions() {
  console.log('Testing dynamic composition generation...\n');
  
  try {
    // Import modules dynamically since this is a CommonJS environment
    const { BuildTimeDataLoader } = await import('./src/dataprocessor/BuildTimeDataLoader.js');
    const { CompositionFactory } = await import('./src/pipeline/CompositionFactory.js');
    
    // Test 1: Check if CSV manifest is loaded
    console.log('Test 1: Loading CSV manifest...');
    const dataLoader = new BuildTimeDataLoader();
    const scanResult = await dataLoader.scanCSVFiles();
    console.log(`✅ Found ${scanResult.validFiles} CSV files in manifest`);
    
    // Test 2: Check if compositions can be generated
    console.log('\nTest 2: Generating compositions...');
    const factory = new CompositionFactory();
    const result = await factory.generateCompositions();
    
    console.log(`✅ Generated ${result.successCount}/${result.totalCompositions} compositions`);
    
    // Test 3: List all generated compositions
    console.log('\nTest 3: Listing generated compositions:');
    result.compositions.forEach((comp, index) => {
      console.log(`  ${index + 1}. ${comp.id} - ${comp.displayName}`);
      console.log(`     CSV: ${comp.csvFile}`);
      console.log(`     Size: ${comp.width}x${comp.height} @ ${comp.fps}fps`);
      console.log(`     Duration: ${comp.durationInFrames} frames (${comp.durationInFrames / comp.fps}s)`);
    });
    
    // Test 4: Check for errors
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n✨ Test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCompositions();