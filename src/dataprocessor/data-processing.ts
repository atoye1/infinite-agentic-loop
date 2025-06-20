/**
 * Data Processing Pipeline Index
 * Exports all components for the Bar Chart Race data processing system
 */

// Main processing components
export { DataProcessor } from "./DataProcessor";
export { DataUtils } from "./DataUtils";
export { DataProcessorTest } from "./DataProcessorTest";
export { DataProcessorDemo } from "./DataProcessorDemo";

// Export types for TypeScript users
export type { 
  DataPoint, 
  FrameData, 
  ProcessingConfig, 
  RawDataRow 
} from "./DataProcessor";

// Re-export key functions for convenience
export { DataProcessor as BarChartDataProcessor } from "./DataProcessor";

/**
 * Quick start helper function
 */
export function createDataProcessor(config: {
  dateColumn: string;
  valueColumns: string[];
  dateFormat?: 'YYYY-MM-DD' | 'YYYY-MM' | 'YYYY' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  interpolationMethod?: 'linear' | 'smooth' | 'step';
  fps?: number;
  topN?: number;
}) {
  return new DataProcessor({
    dateFormat: 'YYYY-MM-DD',
    interpolationMethod: 'smooth',
    fps: 30,
    topN: 10,
    ...config
  });
}

/**
 * Quick test runner
 */
export function runTests() {
  return DataProcessorTest.runAllTests();
}

/**
 * Quick demo runner
 */
export function runDemo() {
  return DataProcessorDemo.runDemo();
}