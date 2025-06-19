# Bar Chart Race Animation System - Test Suite

This directory contains comprehensive tests for the Bar Chart Race Animation System.

## Test Structure

```
src/tests/
├── AnimationUtils.test.ts    # Tests for animation utilities
├── Components.test.tsx       # React component tests
├── ConfigValidation.test.ts  # Configuration validation tests
├── DataProcessor.test.ts     # Data processing pipeline tests
├── ErrorHandling.test.ts     # Error handling and recovery tests
├── RenderPipeline.test.ts    # Rendering pipeline integration tests
├── Utils.test.ts            # General utility function tests
├── setup.ts                 # Jest setup and configuration
└── runTests.ts              # Test runner with reporting
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### With Coverage Report
```bash
npm run test:coverage
```

### Integration Tests Only
```bash
npm run test:integration
```

## Test Coverage Requirements

The project maintains >80% test coverage for critical components:

- **Data Processing Pipeline**: Full coverage of CSV parsing, data transformation, and frame generation
- **Configuration Validation**: Comprehensive validation of all configuration options
- **Animation Utilities**: Tests for interpolation, easing, and animation calculations
- **Error Handling**: Tests for error recovery and meaningful error messages
- **React Components**: Component rendering and prop validation tests

## Writing New Tests

### Unit Test Example
```typescript
describe('MyComponent', () => {
  test('should handle edge case', () => {
    const result = myFunction(edgeCaseInput);
    expect(result).toBe(expectedOutput);
  });
});
```

### Integration Test Example
```typescript
test('should process data end-to-end', async () => {
  const processor = new DataProcessor(config);
  processor.parseCSV(csvData);
  processor.transformData();
  const frames = processor.generateFrameData(5);
  
  expect(frames.totalFrames).toBe(150); // 5 seconds at 30fps
});
```

## Test Categories

### 1. Unit Tests
- Test individual functions and methods in isolation
- Mock external dependencies
- Focus on edge cases and error conditions

### 2. Integration Tests
- Test multiple components working together
- Verify data flow through the system
- Test rendering pipeline coordination

### 3. Component Tests
- Test React component rendering
- Verify prop handling
- Test user interactions (if applicable)

### 4. Performance Tests
- Verify processing speed for large datasets
- Test memory usage
- Ensure animations run smoothly

## CI/CD Integration

Tests run automatically on:
- Every push to main/develop branches
- All pull requests
- Can be triggered manually

GitHub Actions workflow includes:
- Running all tests on multiple Node.js versions
- Generating coverage reports
- Uploading results to Codecov
- Archiving test artifacts

## Debugging Failed Tests

### Common Issues

1. **TypeScript Errors**
   - Run `npm run lint` to check for type issues
   - Ensure tsconfig.json is properly configured

2. **Module Import Errors**
   - Check that all dependencies are installed
   - Verify import paths are correct

3. **Async Test Failures**
   - Use proper async/await syntax
   - Set appropriate timeouts for long-running tests

### Debug Commands

```bash
# Run specific test file
npm test -- DataProcessor.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should parse CSV"

# Run with verbose output
npm test -- --verbose

# Debug in VS Code
# Add breakpoint and use "Debug Jest Tests" launch configuration
```

## Test Reports

After running tests, reports are available in:
- `coverage/` - Coverage reports (HTML, LCOV)
- `test-report.json` - Detailed test results
- `test-results.json` - Jest output

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain >80% coverage
4. Add integration tests for complex features
5. Document any special test requirements