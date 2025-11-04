# WebSee MCP Server Test Suite

Comprehensive test suite for the WebSee MCP Server, covering all tools, integration workflows, performance benchmarks, and browser compatibility.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Test Fixtures](#test-fixtures)
- [Performance Benchmarks](#performance-benchmarks)
- [CI/CD Integration](#cicd-integration)
- [Writing New Tests](#writing-new-tests)
- [Troubleshooting](#troubleshooting)

## Overview

This test suite ensures the MCP server works correctly across different:

- **Tools**: All 6 MCP tools (debug_frontend_issue, analyze_performance, etc.)
- **Browsers**: Chromium, Firefox, WebKit
- **Platforms**: Linux, macOS, Windows
- **Frameworks**: React, Vue, Angular, Vanilla JS

## Test Structure

```
tests/
├── mcp-server.test.ts              # Main MCP server tests
├── performance-benchmarks.test.ts   # Performance tests
├── test-setup.ts                    # Test environment setup
├── setup.ts                         # Global setup/teardown
├── fixtures/                        # Test applications
│   ├── react-app-with-errors.html
│   ├── vue-app-performance.html
│   ├── angular-memory-leak.html
│   └── vanilla-bundle-problems.html
└── README.md                        # This file
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Files

```bash
# MCP Server tests
npm test tests/mcp-server.test.ts

# Performance benchmarks
npm test tests/performance-benchmarks.test.ts
```

### Watch Mode

```bash
npm run test:watch
```

### With Coverage

```bash
npm test -- --coverage
```

### Specific Browser

```bash
BROWSER=firefox npm test
BROWSER=webkit npm test
```

### Debug Mode

```bash
# Run with visible browser
HEADLESS=false npm test

# Run specific test with debugging
npm test -- --grep "debug_frontend_issue"
```

## Test Categories

### 1. Unit Tests

Tests individual tool functionality in isolation.

**Location**: `tests/mcp-server.test.ts` - "Unit Tests" section

**Coverage**:
- Schema validation with Zod
- Input validation and error handling
- Default parameter values
- Edge cases and boundary conditions

**Example**:
```typescript
it("should validate schema correctly", () => {
  const validInput = {
    url: "https://example.com",
    selector: ".my-component",
  };
  expect(() => DebugFrontendIssueSchema.parse(validInput)).not.toThrow();
});
```

### 2. Integration Tests

Tests complete workflows and tool interactions.

**Location**: `tests/mcp-server.test.ts` - "Integration Tests" section

**Coverage**:
- Full debugging workflows
- Error handling across tools
- Schema validation
- Browser compatibility

**Example**:
```typescript
it("should handle complete debugging workflow", async () => {
  // 1. Load page with error
  // 2. Capture error
  // 3. Trigger error
  // 4. Verify error was captured
});
```

### 3. Performance Benchmarks

Tests performance characteristics and ensures tools meet SLAs.

**Location**: `tests/performance-benchmarks.test.ts`

**Coverage**:
- Tool execution time
- Memory usage
- Concurrent operations
- Large dataset handling
- Browser compatibility performance

**Thresholds**:
- Source map resolution: < 50ms
- Component tree extraction: < 100ms
- Network trace retrieval: < 10ms
- Screenshot capture: < 200ms
- Memory growth: < 50 MB per 100 operations

**Example**:
```typescript
const result = await benchmark(
  "Source map resolution",
  async () => {
    await intelligence.resolveSourceLocation(url, line, column);
  },
  { iterations: 20, threshold: 50 }
);
```

### 4. Edge Cases

Tests unusual scenarios and error conditions.

**Location**: `tests/mcp-server.test.ts` - "Edge Cases" section

**Coverage**:
- Empty pages
- Pages without JavaScript
- Shadow DOM
- iframes
- Special characters
- Concurrent operations

## Test Fixtures

Realistic test applications for different frameworks and scenarios.

### React App with Errors

**File**: `tests/fixtures/react-app-with-errors.html`

**Features**:
- Error Boundary component
- Undefined property access errors
- Async errors
- State update bugs
- Infinite loop risks
- Memory leaks

**Usage**:
```typescript
const reactFixture = path.join(__dirname, "fixtures", "react-app-with-errors.html");
await page.goto(`file://${reactFixture}`);
```

### Vue App with Performance Issues

**File**: `tests/fixtures/vue-app-performance.html`

**Features**:
- Expensive computed properties
- Too many watchers
- Synchronous network requests
- Memory leak simulation
- Layout thrashing
- Rapid DOM updates

**Performance Metrics**:
- Render count
- Compute count
- Watch count
- Network requests
- Memory usage
- FPS tracking

### Angular-style App with Memory Leaks

**File**: `tests/fixtures/angular-memory-leak.html`

**Features**:
- Unsubscribed event listeners
- Uncleaned intervals/timeouts
- Detached DOM elements
- Observable/RxJS subscriptions
- Global references
- Closure memory leaks

**Memory Monitor**:
- Heap used/total
- Active timers
- Active listeners
- DOM node count
- Memory growth tracking

### Vanilla JS App with Bundle Problems

**File**: `tests/fixtures/vanilla-bundle-problems.html`

**Features**:
- Large vendor bundles (Lodash, Moment, Axios, Chart.js)
- No code splitting
- Tree shaking not applied
- Large inline data
- Duplicate dependencies

**Bundle Analysis**:
- Total size estimation
- Unused code detection
- Dependency tree visualization
- Optimization recommendations

## Performance Benchmarks

### Running Benchmarks

```bash
npm test tests/performance-benchmarks.test.ts
```

### Benchmark Output

```
================================================================================
PERFORMANCE BENCHMARK RESULTS
================================================================================

✓ PASS SourceIntelligenceLayer initialization
  Average: 234.56ms (threshold: 500ms)
  Min: 210.34ms | Max: 267.89ms
  Iterations: 5

✓ PASS Source map resolution
  Average: 23.45ms (threshold: 50ms)
  Min: 18.90ms | Max: 32.10ms
  Iterations: 20

================================================================================
Passed: 15/15
✓ All benchmarks passed!
```

### Performance Metrics

All tools are benchmarked against these criteria:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Initialization | 500ms | Time to initialize intelligence layer |
| Source map resolution | 50ms | Time to resolve minified location |
| Component extraction | 100ms | Time to extract component tree |
| Network trace retrieval | 10ms | Time to get network traces |
| Screenshot capture | 200ms | Time to capture screenshot |
| Memory growth | 50 MB | Memory increase per 100 operations |

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Daily schedule (2 AM UTC)

**Workflow**: `.github/workflows/test.yml`

**Jobs**:
1. **Test Matrix**: Runs on Ubuntu, macOS, Windows with Node 18.x and 20.x
2. **Test Fixtures**: Validates all test fixtures
3. **Lint**: Runs ESLint and Prettier
4. **Build**: Compiles TypeScript
5. **Browser Compatibility**: Tests on Chromium, Firefox, WebKit
6. **Report**: Generates test report and posts to PR

### Running Locally Like CI

```bash
# Install dependencies
npm ci

# Install browsers
npx playwright install --with-deps

# Run linter
npm run lint

# Run tests with CI settings
CI=true npm test -- --run --coverage

# Build
npm run build
```

### Coverage Reports

Coverage is uploaded to Codecov and must maintain:
- Lines: 70%
- Functions: 70%
- Branches: 60%
- Statements: 70%

## Writing New Tests

### Basic Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, Browser, Page } from "playwright";

describe("My New Test Suite", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  it("should do something", async () => {
    await page.setContent("<h1>Test</h1>");
    const text = await page.textContent("h1");
    expect(text).toBe("Test");
  });
});
```

### Testing MCP Tools

```typescript
import { z } from "zod";

const MyToolSchema = z.object({
  url: z.string().url(),
  option: z.boolean().optional(),
});

it("should validate tool input", () => {
  const validInput = { url: "https://example.com" };
  expect(() => MyToolSchema.parse(validInput)).not.toThrow();
});

it("should reject invalid input", () => {
  const invalidInput = { url: "not-a-url" };
  expect(() => MyToolSchema.parse(invalidInput)).toThrow();
});
```

### Performance Test Template

```typescript
async function benchmark(name: string, fn: () => Promise<void>, threshold: number) {
  const durations: number[] = [];

  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    await fn();
    durations.push(performance.now() - start);
  }

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  expect(avg).toBeLessThan(threshold);
}
```

## Troubleshooting

### Common Issues

#### Playwright Browsers Not Installed

```bash
npx playwright install --with-deps
```

#### Tests Timeout

Increase timeout in `vitest.config.ts`:
```typescript
testTimeout: 60000, // 60 seconds
```

Or for specific test:
```typescript
it("slow test", async () => {
  // test code
}, 60000); // 60 second timeout
```

#### Memory Leaks in Tests

```typescript
afterEach(async () => {
  await page.close();
  await intelligence.destroy();
});
```

#### Flaky Tests

Add retry in CI:
```typescript
// vitest.config.ts
retry: process.env.CI ? 2 : 0,
```

Or for specific test:
```typescript
it.retry(2)("flaky test", async () => {
  // test code
});
```

#### Screenshot Debugging

```typescript
if (process.env.DEBUG) {
  await page.screenshot({ path: `debug-${Date.now()}.png` });
}
```

### Debug Mode

```bash
# Show browser
HEADLESS=false npm test

# Verbose output
DEBUG=* npm test

# Keep browser open on failure
PWDEBUG=1 npm test
```

### Test Isolation

If tests interfere with each other:
```typescript
// vitest.config.ts
isolate: true, // Run each test file in isolation
```

## Best Practices

1. **Always clean up resources**
   ```typescript
   afterEach(async () => {
     await page.close();
     await browser.close();
   });
   ```

2. **Use meaningful test names**
   ```typescript
   it("should reject invalid URL in debug_frontend_issue", () => {
     // Better than: it("should fail", () => {
   });
   ```

3. **Test edge cases**
   ```typescript
   it("should handle empty string", () => { });
   it("should handle null", () => { });
   it("should handle very long input", () => { });
   ```

4. **Use fixtures for complex scenarios**
   ```typescript
   const fixture = path.join(__dirname, "fixtures", "my-fixture.html");
   await page.goto(`file://${fixture}`);
   ```

5. **Benchmark critical paths**
   ```typescript
   const result = await benchmark("critical operation", fn, 100);
   expect(result.avgDuration).toBeLessThan(100);
   ```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [MCP SDK Documentation](https://modelcontextprotocol.io/)
- [Zod Documentation](https://zod.dev/)

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure all tests pass
3. Add performance benchmarks for critical paths
4. Update this README if needed
5. Check coverage meets thresholds

## License

MIT
