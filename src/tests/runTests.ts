#!/usr/bin/env node

/**
 * Test runner script that provides a summary of all tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

class TestRunner {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Bar Chart Race Animation System - Test Suite\n');
    console.log('Running all tests...\n');

    try {
      // Run Jest tests
      await this.runJestTests();
      
      // Run integration tests
      await this.runIntegrationTests();
      
      // Generate report
      this.generateReport();
      
      // Check if all tests passed
      const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
      if (totalFailed > 0) {
        console.error(`\n❌ ${totalFailed} tests failed!`);
        process.exit(1);
      } else {
        console.log('\n✅ All tests passed!');
      }
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  private async runJestTests(): Promise<void> {
    console.log('📦 Running Jest unit tests...');
    
    try {
      const { stdout } = await execAsync('npm test -- --json --outputFile=test-results.json');
      
      // Parse Jest results
      if (existsSync('test-results.json')) {
        const results = JSON.parse(readFileSync('test-results.json', 'utf-8'));
        
        this.results.push({
          suite: 'Jest Unit Tests',
          passed: results.numPassedTests || 0,
          failed: results.numFailedTests || 0,
          skipped: results.numPendingTests || 0,
          duration: (results.testResults || []).reduce((sum: number, r: any) => 
            sum + (r.perfStats?.runtime || 0), 0) / 1000
        });
      }
    } catch (error: any) {
      // Jest exits with non-zero code on test failure
      if (existsSync('test-results.json')) {
        const results = JSON.parse(readFileSync('test-results.json', 'utf-8'));
        
        this.results.push({
          suite: 'Jest Unit Tests',
          passed: results.numPassedTests || 0,
          failed: results.numFailedTests || 0,
          skipped: results.numPendingTests || 0,
          duration: (results.testResults || []).reduce((sum: number, r: any) => 
            sum + (r.perfStats?.runtime || 0), 0) / 1000
        });
      } else {
        throw error;
      }
    }
  }

  private async runIntegrationTests(): Promise<void> {
    console.log('\n🔗 Running integration tests...');
    
    const startTime = Date.now();
    let passed = 0;
    let failed = 0;
    
    try {
      const { stdout } = await execAsync('npm run test:integration');
      
      // Parse integration test output
      const lines = stdout.split('\n');
      lines.forEach(line => {
        if (line.includes('✅')) passed++;
        if (line.includes('❌')) failed++;
      });
      
      this.results.push({
        suite: 'Integration Tests',
        passed,
        failed,
        skipped: 0,
        duration: (Date.now() - startTime) / 1000
      });
    } catch (error: any) {
      // Try to parse output even on failure
      const output = error.stdout || '';
      const lines = output.split('\n');
      lines.forEach((line: string) => {
        if (line.includes('✅')) passed++;
        if (line.includes('❌')) failed++;
      });
      
      this.results.push({
        suite: 'Integration Tests',
        passed,
        failed: failed || 1,
        skipped: 0,
        duration: (Date.now() - startTime) / 1000
      });
    }
  }

  private generateReport(): void {
    console.log('\n📊 Test Results Summary\n');
    console.log('┌─────────────────────────┬─────────┬─────────┬─────────┬───────────┐');
    console.log('│ Test Suite              │ Passed  │ Failed  │ Skipped │ Duration  │');
    console.log('├─────────────────────────┼─────────┼─────────┼─────────┼───────────┤');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;
    
    this.results.forEach(result => {
      const suite = result.suite.padEnd(23);
      const passed = result.passed.toString().padStart(7);
      const failed = result.failed.toString().padStart(7);
      const skipped = result.skipped.toString().padStart(7);
      const duration = `${result.duration.toFixed(2)}s`.padStart(9);
      
      console.log(`│ ${suite} │ ${passed} │ ${failed} │ ${skipped} │ ${duration} │`);
      
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalSkipped += result.skipped;
      totalDuration += result.duration;
    });
    
    console.log('├─────────────────────────┼─────────┼─────────┼─────────┼───────────┤');
    
    const totalSuite = 'TOTAL'.padEnd(23);
    const totalPassedStr = totalPassed.toString().padStart(7);
    const totalFailedStr = totalFailed.toString().padStart(7);
    const totalSkippedStr = totalSkipped.toString().padStart(7);
    const totalDurationStr = `${totalDuration.toFixed(2)}s`.padStart(9);
    
    console.log(`│ ${totalSuite} │ ${totalPassedStr} │ ${totalFailedStr} │ ${totalSkippedStr} │ ${totalDurationStr} │`);
    console.log('└─────────────────────────┴─────────┴─────────┴─────────┴───────────┘');
    
    // Generate coverage report if available
    if (existsSync('coverage/lcov.info')) {
      console.log('\n📈 Code Coverage Summary\n');
      this.generateCoverageReport();
    }
    
    // Save report to file
    this.saveReportToFile();
  }

  private generateCoverageReport(): void {
    try {
      const coverageSummary = join('coverage', 'coverage-summary.json');
      if (existsSync(coverageSummary)) {
        const coverage = JSON.parse(readFileSync(coverageSummary, 'utf-8'));
        const total = coverage.total;
        
        console.log('┌──────────────┬───────────┬───────────┬───────────┬───────────┐');
        console.log('│ Metric       │ Covered   │ Total     │ Coverage  │ Status    │');
        console.log('├──────────────┼───────────┼───────────┼───────────┼───────────┤');
        
        const metrics = ['lines', 'statements', 'functions', 'branches'];
        metrics.forEach(metric => {
          const data = total[metric];
          const percentage = data.pct;
          const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️ ' : '❌';
          
          console.log(
            `│ ${metric.padEnd(12)} │ ${data.covered.toString().padStart(9)} │ ${data.total.toString().padStart(9)} │ ${percentage.toFixed(1).padStart(8)}% │ ${status.padStart(9)} │`
          );
        });
        
        console.log('└──────────────┴───────────┴───────────┴───────────┴───────────┘');
      }
    } catch (error) {
      console.log('Coverage data not available');
    }
  }

  private saveReportToFile(): void {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalPassed: this.results.reduce((sum, r) => sum + r.passed, 0),
        totalFailed: this.results.reduce((sum, r) => sum + r.failed, 0),
        totalSkipped: this.results.reduce((sum, r) => sum + r.skipped, 0),
        totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0)
      }
    };
    
    writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to test-report.json');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };