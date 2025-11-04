# WebSee MCP Server Evaluation Framework

This directory contains the comprehensive evaluation framework for the WebSee MCP server, following Anthropic's MCP builder standards for quality assurance and performance benchmarking.

## Overview

The evaluation framework provides:

- **10 Comprehensive Test Cases** covering all major tool capabilities
- **Automated Testing** with scoring and performance benchmarks
- **Detailed Reporting** with category breakdown and metrics
- **Performance Analysis** tracking response times and accuracy
- **Real-World Scenarios** for each test case

## Test Categories

### 1. Component Debugging (eval-001)
Tests the ability to inspect React/Vue/Angular component state, props, and hierarchy.

**Tool:** `inspect_component_state`

**What It Tests:**
- Component name identification
- Framework detection (React/Vue/Angular)
- Props extraction
- State capture
- Child component analysis

### 2. Network Analysis (eval-002)
Validates network request tracking and performance analysis.

**Tool:** `analyze_performance`

**What It Tests:**
- Request counting and filtering
- Slow request identification (>1000ms)
- Average duration calculation
- Stack trace attribution
- Performance metrics

### 3. Error Resolution (eval-003)
Evaluates source map resolution for minified errors.

**Tool:** `resolve_minified_error`

**What It Tests:**
- Stack trace resolution
- Original source file identification
- Line/column number mapping
- Error context preservation
- Clear messaging

### 4. Bundle Analysis (eval-004)
Tests JavaScript bundle size analysis and module identification.

**Tool:** `analyze_bundle_size`

**What It Tests:**
- Script enumeration
- Module search functionality
- Size threshold detection
- Optimization recommendations
- Stylesheet analysis

### 5. Interaction Tracing (eval-005)
Validates network request tracing triggered by user interactions.

**Tool:** `trace_network_requests`

**What It Tests:**
- URL pattern filtering
- HTTP method filtering
- Request details capture
- Timing information
- Stack trace origin tracking

### 6. Memory Analysis (eval-006)
Tests memory usage tracking and leak detection.

**Tool:** `analyze_performance`

**What It Tests:**
- Memory metrics capture
- Heap size tracking
- Component lifecycle monitoring
- Framework-based grouping
- Nesting depth analysis

### 7. Cross-Browser Testing (eval-007)
Validates functionality across different browsers.

**Tool:** `debug_frontend_issue`

**What It Tests:**
- Console error/warning capture
- Network tracking
- Component extraction
- Issue categorization
- Timeline tracking

### 8. Performance Optimization (eval-008)
Comprehensive performance bottleneck identification.

**Tool:** `analyze_performance`

**What It Tests:**
- Multi-metric analysis (network, bundle, components)
- Interaction simulation
- Bottleneck identification
- Optimization opportunities
- Comprehensive reporting

### 9. Component Architecture (eval-009)
Analyzes component hierarchy and relationships.

**Tool:** `analyze_performance`

**What It Tests:**
- Component counting
- Framework distribution
- Nesting depth calculation
- Architectural insights
- Tree structure analysis

### 10. Build Optimization (eval-010)
Generates actionable build optimization recommendations.

**Tool:** `analyze_bundle_size`

**What It Tests:**
- Recommendation generation
- Threshold-based warnings
- Code splitting suggestions
- Bundle size calculation
- Actionable insights

## Running Evaluations

### Quick Start

```bash
# Run all evaluation tests
npm run eval

# Run with custom output path
npm run eval -- --output ./custom-report.json
```

### Using the TypeScript API

```typescript
import { runEvaluation, EvaluationEngine } from './src/evaluation';

// Run all tests with default settings
await runEvaluation();

// Or use the engine directly for more control
const engine = new EvaluationEngine();
await engine.initialize();
const report = await engine.runAllTests();
engine.printReport(report);
await engine.destroy();
```

### Running Individual Test Cases

```typescript
import { EvaluationEngine, TEST_CASES } from './src/evaluation';

const engine = new EvaluationEngine();
await engine.initialize();

// Run a specific test
const testCase = TEST_CASES.find(tc => tc.id === 'eval-001');
const result = await engine.runTestCase(testCase);

await engine.destroy();
```

## Scoring System

Each test case is scored out of 100 points based on multiple criteria:

### Scoring Criteria Example (Component Debugging)

- **Component name identification** (20 points)
- **Framework detection** (20 points)
- **Props extraction** (20 points)
- **State capture** (20 points)
- **Child component analysis** (20 points)

### Passing Thresholds

- **Excellent:** ≥95% (95+ points)
- **Good:** ≥85% (85+ points)
- **Acceptable:** ≥70% (70+ points)
- **Needs Improvement:** <70%

## Performance Benchmarks

Each test includes performance benchmarks:

### Response Time Standards

- **Excellent:** <3000ms
- **Good:** <5000ms
- **Acceptable:** <8000ms
- **Poor:** >8000ms

### Accuracy Expectations

Tests have different accuracy requirements based on complexity:

- **Critical tools** (error resolution, component debugging): 90%+
- **Analysis tools** (network, performance): 85%+
- **Optimization tools** (bundle, build): 80%+

## Report Format

The evaluation generates a comprehensive JSON report:

```json
{
  "timestamp": "2025-10-26T...",
  "totalTests": 10,
  "passedTests": 9,
  "failedTests": 1,
  "totalScore": 875,
  "maxPossibleScore": 1000,
  "scorePercentage": 87.5,
  "averageResponseTime": 4523,
  "testResults": [...],
  "categoryBreakdown": {
    "Component Debugging": {
      "passed": 1,
      "failed": 0,
      "score": 95,
      "maxScore": 100
    },
    ...
  },
  "performanceMetrics": [
    {
      "toolName": "inspect_component_state",
      "averageTime": 3245,
      "minTime": 2890,
      "maxTime": 3600,
      "successRate": 100
    },
    ...
  ]
}
```

## Real-World Scenarios

Each test case includes a real-world scenario describing:

- **Problem:** What issue a developer is facing
- **Investigation:** How the tool helps investigate
- **Expected Findings:** What the tool should reveal

Example:

```json
{
  "problem": "User reports that profile page shows incorrect data after navigation",
  "investigation": "Inspect UserProfile component state to see if userId prop is being passed correctly",
  "expectedFindings": [
    "Component receives correct userId prop",
    "State shows loading/loaded status",
    "Child components are rendered with proper data"
  ]
}
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: MCP Evaluation

on: [push, pull_request]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run eval
      - uses: actions/upload-artifact@v3
        with:
          name: evaluation-report
          path: eval/evaluation-report-*.json
```

## Extending the Framework

### Adding New Test Cases

1. Add to `TEST_CASES` array in `src/evaluation.ts`:

```typescript
{
  id: "eval-011",
  category: "New Category",
  description: "Test description",
  tool: "tool_name",
  input: { /* test input */ },
  expectedOutput: {
    fields: ["field1", "field2"],
    conditions: [
      { field: "field1", type: "exists" }
    ]
  },
  scoring: {
    maxPoints: 100,
    criteria: [
      {
        description: "Criterion description",
        points: 50,
        validator: "output.field1 && output.field1.length > 0"
      }
    ]
  },
  performanceBenchmark: {
    maxResponseTime: 5000,
    expectedAccuracy: 90
  }
}
```

2. Add corresponding entry to `eval/test-cases.json`

3. Run the evaluation to verify

### Custom Validators

Validators are JavaScript expressions evaluated in context:

```typescript
// Simple existence check
"output.component !== undefined"

// Complex validation
"output.requests && output.requests.every(r => r.duration >= 0)"

// Array checks
"Array.isArray(output.items) && output.items.length > 5"

// Nested property validation
"output.metrics?.network?.totalRequests >= 10"
```

## Troubleshooting

### Tests Failing

1. **Check browser installation:**
   ```bash
   npx playwright install chromium
   ```

2. **Verify MCP server is built:**
   ```bash
   npm run build
   ```

3. **Review test output for specific errors:**
   ```bash
   npm run eval 2>&1 | tee eval-debug.log
   ```

### Performance Issues

If tests are timing out:

1. Increase timeout thresholds in test cases
2. Check system resources
3. Run headless browser mode
4. Reduce concurrent test execution

### Mock Data vs Real Server

The current implementation uses mock data. To test against real MCP server:

1. Update `simulateToolCall` method to call actual MCP server
2. Set up test environment with real application
3. Configure appropriate URLs in test inputs

## Best Practices

### Writing Test Cases

- **Be Specific:** Clear, measurable criteria
- **Be Realistic:** Test real-world scenarios
- **Be Comprehensive:** Cover edge cases
- **Be Performance-Conscious:** Set realistic benchmarks

### Maintaining the Framework

- **Keep Tests Updated:** Sync with tool changes
- **Review Benchmarks:** Adjust based on performance data
- **Document Changes:** Update README for modifications
- **Version Control:** Track test case versions

## Standards Compliance

This evaluation framework follows:

- **Anthropic MCP Builder Standards v1.0**
- **TypeScript 5.0+ best practices**
- **Playwright testing guidelines**
- **JSON Schema validation**

## Contributing

When contributing new test cases:

1. Follow existing test case structure
2. Include real-world scenario
3. Set appropriate benchmarks
4. Add validator expressions
5. Test thoroughly before submitting
6. Update this README

## License

MIT - Same as WebSee Source Intelligence Layer

## Support

For issues or questions:

- Open an issue on GitHub
- Contact the development team
- Review documentation in `/docs`

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
**Maintained By:** WebSee Development Team
