# Getting Started with WebSee MCP Evaluation Framework

This guide will help you quickly get started with evaluating your WebSee MCP server using the comprehensive evaluation framework.

## Quick Start (3 Steps)

### Step 1: Ensure Prerequisites

```bash
# Make sure you're in the project root
cd /path/to/websee-source-intelligence-production

# Install dependencies (if not already done)
npm install

# Build the project
npm run build
```

### Step 2: Run the Evaluation

```bash
# Run all 10 evaluation tests
npm run eval
```

That's it! The evaluation will run and generate a detailed report.

### Step 3: Review Results

The evaluation will:
1. Print results to the console
2. Save a JSON report to `eval/evaluation-report-{timestamp}.json`

Look for this summary at the end:

```
================================================================================
WEBSEE MCP SERVER - EVALUATION REPORT
================================================================================

Overall Results:
  Total Tests: 10
  Passed: 9 ✅
  Failed: 1 ❌
  Score: 875/1000 (87.50%)
  Average Response Time: 4523.45ms
```

## Understanding Your Results

### Score Interpretation

- **≥95%** - Excellent! Production ready
- **85-94%** - Good, minor improvements recommended
- **70-84%** - Acceptable, some work needed
- **<70%** - Needs improvement before production use

### Categories Tested

Your evaluation covers 10 critical areas:

1. **Component Debugging** - Can it inspect React/Vue/Angular components?
2. **Network Analysis** - Does it identify slow requests?
3. **Error Resolution** - Can it resolve minified stack traces?
4. **Bundle Analysis** - Does it find large modules?
5. **Interaction Tracing** - Can it trace user interactions?
6. **Memory Analysis** - Does it detect memory issues?
7. **Cross-Browser Testing** - Does it work across browsers?
8. **Performance Optimization** - Can it identify bottlenecks?
9. **Component Architecture** - Does it analyze component trees?
10. **Build Optimization** - Does it provide actionable recommendations?

## Common Scenarios

### Scenario 1: Running Specific Tests

Want to test just one area? Use the example usage script:

```bash
# Run only Network Analysis tests
tsx eval/example-usage.ts 4
```

### Scenario 2: CI/CD Integration

Add to your GitHub Actions:

```yaml
- name: Run MCP Evaluation
  run: npm run eval

- name: Upload Report
  uses: actions/upload-artifact@v4
  with:
    name: evaluation-report
    path: eval/evaluation-report-*.json
```

See [CI_CD_INTEGRATION.md](./CI_CD_INTEGRATION.md) for more details.

### Scenario 3: Development Mode

While developing, run in watch mode:

```bash
# Run evaluation in development mode
npm run eval:dev
```

### Scenario 4: Custom Test Cases

Create your own test cases:

```typescript
import { EvaluationEngine, TestCase } from './src/evaluation';

const myTest: TestCase = {
  id: "custom-001",
  category: "My Category",
  description: "My custom test",
  tool: "debug_frontend_issue",
  input: { url: "http://localhost:3000", selector: "#my-element" },
  expectedOutput: {
    fields: ["components"],
    conditions: [{ field: "components", type: "exists" }]
  },
  scoring: {
    maxPoints: 100,
    criteria: [{
      description: "Component found",
      points: 100,
      validator: "output.components && output.components.length > 0"
    }]
  },
  performanceBenchmark: {
    maxResponseTime: 5000,
    expectedAccuracy: 90
  }
};

const engine = new EvaluationEngine([myTest]);
await engine.initialize();
await engine.runAllTests();
await engine.destroy();
```

## Reading the Report

### JSON Report Structure

```json
{
  "timestamp": "2025-10-26T12:00:00.000Z",
  "totalTests": 10,
  "passedTests": 9,
  "failedTests": 1,
  "totalScore": 875,
  "maxPossibleScore": 1000,
  "scorePercentage": 87.5,
  "averageResponseTime": 4523,
  "testResults": [...],
  "categoryBreakdown": {...},
  "performanceMetrics": [...]
}
```

### Key Fields to Review

1. **scorePercentage** - Overall health score
2. **testResults** - Details on each test
3. **categoryBreakdown** - Performance by category
4. **performanceMetrics** - Speed and reliability by tool

### Test Result Details

Each test result includes:

```json
{
  "testId": "eval-001",
  "passed": true,
  "score": 95,
  "maxScore": 100,
  "responseTime": 3245,
  "errors": [],
  "warnings": ["Minor issue..."],
  "validationResults": [
    {
      "criterion": "Component name is correctly identified",
      "passed": true,
      "points": 20
    }
  ]
}
```

## Troubleshooting

### Problem: Tests Timing Out

**Solution:**
```typescript
// Edit test case performance benchmarks
performanceBenchmark: {
  maxResponseTime: 10000,  // Increase from 5000
  expectedAccuracy: 85
}
```

### Problem: Browser Not Found

**Solution:**
```bash
# Install Playwright browsers
npx playwright install chromium
```

### Problem: Build Errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

### Problem: Missing Dependencies

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules/
npm install
```

## Performance Tips

### Tip 1: Run in Parallel

For faster results, run categories in parallel:

```typescript
// In your custom script
const categories = ['Network Analysis', 'Component Debugging'];
const results = await Promise.all(
  categories.map(cat => {
    const tests = TEST_CASES.filter(tc => tc.category === cat);
    const engine = new EvaluationEngine(tests);
    return engine.runAllTests();
  })
);
```

### Tip 2: Cache Builds

In CI/CD, cache the build artifacts:

```yaml
cache:
  paths:
    - node_modules/
    - dist/
```

### Tip 3: Headless Mode

Ensure browser runs in headless mode for CI:

```bash
export HEADLESS=true
npm run eval
```

## Next Steps

### Level 1: Basic Usage ✅
- [x] Run evaluation
- [x] Review results
- [x] Understand scoring

### Level 2: Customization
- [ ] Create custom test cases
- [ ] Adjust performance benchmarks
- [ ] Filter by category

### Level 3: Integration
- [ ] Set up CI/CD pipeline
- [ ] Configure notifications
- [ ] Create dashboards

### Level 4: Advanced
- [ ] Write custom validators
- [ ] Export metrics to monitoring
- [ ] Implement regression testing

## Resources

### Documentation
- [README.md](./README.md) - Full framework documentation
- [test-cases.json](./test-cases.json) - All test case definitions
- [CI_CD_INTEGRATION.md](./CI_CD_INTEGRATION.md) - CI/CD setup guides

### Examples
- [example-usage.ts](./example-usage.ts) - 10 usage examples
- Run with: `tsx eval/example-usage.ts [1-10]`

### Code
- [src/evaluation.ts](/src/evaluation.ts) - Main evaluation engine
- Extend or customize as needed

## Getting Help

### Self-Service
1. Check the README for detailed documentation
2. Review example usage scripts
3. Read the test case definitions

### Issues
1. Open a GitHub issue with:
   - Evaluation report JSON
   - Console output
   - Environment details (OS, Node version)

### Community
1. Discussion forums
2. Slack/Discord channels
3. Stack Overflow with tag `websee-mcp`

## FAQ

**Q: How long does evaluation take?**
A: Typically 30-60 seconds for all 10 tests.

**Q: Can I run evaluation against a live site?**
A: Yes! Just change the URLs in test inputs.

**Q: What if all tests fail?**
A: Check that the MCP server is built and browsers are installed.

**Q: Can I add more test cases?**
A: Absolutely! See the customization section above.

**Q: Is this production-ready?**
A: If you score ≥85%, yes! Below that, review warnings and errors.

**Q: How often should I run evaluation?**
A: Run on every commit (CI/CD) or at least daily.

## Quick Reference

### Commands
```bash
npm run eval           # Run all tests
npm run eval:dev       # Development mode
tsx eval/example-usage.ts [1-10]  # Run example
```

### Files
```
eval/
├── README.md                    # Full documentation
├── GETTING_STARTED.md          # This file
├── CI_CD_INTEGRATION.md        # CI/CD guides
├── test-cases.json             # Test definitions
├── example-usage.ts            # Usage examples
└── evaluation-report-*.json    # Generated reports
```

### Thresholds
- **Passing Score:** 70%
- **Recommended:** 85%+
- **Excellent:** 95%+

---

**Ready to start?** Run `npm run eval` now!

**Need help?** Review the [full README](./README.md) or check [examples](./example-usage.ts).

**Last Updated:** 2025-10-26
