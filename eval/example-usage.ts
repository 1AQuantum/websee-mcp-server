/**
 * Example Usage of WebSee MCP Server Evaluation Framework
 *
 * This file demonstrates various ways to use the evaluation framework
 * for testing and validating the WebSee MCP server.
 */

import {
  runEvaluation,
  EvaluationEngine,
  TEST_CASES,
  TestCase,
  TestResult,
  EvaluationReport
} from '../src/evaluation';
import * as path from 'path';

// ============================================================================
// Example 1: Run All Tests with Default Settings
// ============================================================================

async function example1_RunAllTests() {
  console.log("Example 1: Running all evaluation tests\n");

  await runEvaluation();

  // Report is automatically generated and saved to eval/evaluation-report-{timestamp}.json
}

// ============================================================================
// Example 2: Run Tests with Custom Output Path
// ============================================================================

async function example2_CustomOutputPath() {
  console.log("Example 2: Running tests with custom output path\n");

  const customPath = path.join(process.cwd(), 'custom-reports', 'my-evaluation.json');
  await runEvaluation(customPath);
}

// ============================================================================
// Example 3: Run Individual Test Case
// ============================================================================

async function example3_IndividualTest() {
  console.log("Example 3: Running individual test case\n");

  const engine = new EvaluationEngine();
  await engine.initialize();

  // Find and run the component debugging test
  const componentTest = TEST_CASES.find(tc => tc.id === 'eval-001');

  if (componentTest) {
    console.log(`Running: ${componentTest.description}\n`);
    const result = await engine.runTestCase(componentTest);

    console.log(`Result:`);
    console.log(`  Passed: ${result.passed ? 'YES' : 'NO'}`);
    console.log(`  Score: ${result.score}/${result.maxScore}`);
    console.log(`  Response Time: ${result.responseTime}ms`);

    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      result.errors.forEach(e => console.log(`    - ${e}`));
    }
  }

  await engine.destroy();
}

// ============================================================================
// Example 4: Run Tests for Specific Category
// ============================================================================

async function example4_CategoryTests() {
  console.log("Example 4: Running tests for specific category\n");

  const category = "Network Analysis";
  const categoryTests = TEST_CASES.filter(tc => tc.category === category);

  const engine = new EvaluationEngine(categoryTests);
  await engine.initialize();

  const report = await engine.runAllTests();

  console.log(`\nCategory: ${category}`);
  console.log(`Tests: ${report.totalTests}`);
  console.log(`Passed: ${report.passedTests}`);
  console.log(`Score: ${report.scorePercentage.toFixed(2)}%`);

  await engine.destroy();
}

// ============================================================================
// Example 5: Custom Test Case
// ============================================================================

async function example5_CustomTestCase() {
  console.log("Example 5: Running custom test case\n");

  const customTest: TestCase = {
    id: "custom-001",
    category: "Custom Testing",
    description: "Custom test for specific scenario",
    tool: "debug_frontend_issue",
    input: {
      url: "http://localhost:3000/dashboard",
      selector: "#dashboard-widget",
      screenshot: true,
    },
    expectedOutput: {
      fields: ["url", "components", "console"],
      conditions: [
        { field: "components", type: "arrayLength", value: 1 },
        { field: "console", type: "exists" },
      ],
    },
    scoring: {
      maxPoints: 100,
      criteria: [
        {
          description: "Dashboard widget is found",
          points: 50,
          validator: "output.components && output.components.length > 0",
        },
        {
          description: "No console errors",
          points: 50,
          validator: "output.console && output.console.filter(c => c.type === 'error').length === 0",
        },
      ],
    },
    performanceBenchmark: {
      maxResponseTime: 6000,
      expectedAccuracy: 85,
    },
  };

  const engine = new EvaluationEngine([customTest]);
  await engine.initialize();

  const result = await engine.runTestCase(customTest);

  console.log(`Custom Test Result:`);
  console.log(`  Score: ${result.score}/${result.maxScore}`);
  console.log(`  Passed: ${result.passed}`);

  await engine.destroy();
}

// ============================================================================
// Example 6: Detailed Report Analysis
// ============================================================================

async function example6_DetailedReportAnalysis() {
  console.log("Example 6: Generating detailed report analysis\n");

  const engine = new EvaluationEngine();
  await engine.initialize();

  const report = await engine.runAllTests();

  // Print the full report
  engine.printReport(report);

  // Additional custom analysis
  console.log("\n=== Custom Analysis ===\n");

  // Find slowest test
  const slowestTest = report.testResults.reduce((prev, current) =>
    current.responseTime > prev.responseTime ? current : prev
  );
  const slowestTestCase = TEST_CASES.find(tc => tc.id === slowestTest.testId);
  console.log(`Slowest Test: ${slowestTestCase?.description}`);
  console.log(`  Response Time: ${slowestTest.responseTime}ms\n`);

  // Find highest scoring test
  const highestScore = report.testResults.reduce((prev, current) =>
    current.score > prev.score ? current : prev
  );
  const highestTestCase = TEST_CASES.find(tc => tc.id === highestScore.testId);
  console.log(`Highest Scoring Test: ${highestTestCase?.description}`);
  console.log(`  Score: ${highestScore.score}/${highestScore.maxScore}\n`);

  // Category performance
  console.log("Category Performance:");
  for (const [category, stats] of Object.entries(report.categoryBreakdown)) {
    const percentage = (stats.score / stats.maxScore) * 100;
    const status = percentage >= 90 ? "✅ Excellent" :
                   percentage >= 80 ? "🟢 Good" :
                   percentage >= 70 ? "🟡 Acceptable" : "🔴 Needs Improvement";
    console.log(`  ${category}: ${percentage.toFixed(1)}% ${status}`);
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'eval', 'detailed-report.json');
  await engine.saveReport(report, reportPath);

  await engine.destroy();
}

// ============================================================================
// Example 7: Performance Comparison
// ============================================================================

async function example7_PerformanceComparison() {
  console.log("Example 7: Performance comparison across tools\n");

  const engine = new EvaluationEngine();
  await engine.initialize();

  const report = await engine.runAllTests();

  console.log("Tool Performance Comparison:\n");

  // Sort by success rate
  const sortedBySuccess = [...report.performanceMetrics].sort(
    (a, b) => b.successRate - a.successRate
  );

  console.log("By Success Rate:");
  sortedBySuccess.forEach((metric, index) => {
    console.log(`  ${index + 1}. ${metric.toolName}`);
    console.log(`     Success: ${metric.successRate.toFixed(1)}%`);
    console.log(`     Avg Time: ${metric.averageTime.toFixed(0)}ms\n`);
  });

  // Sort by speed
  const sortedBySpeed = [...report.performanceMetrics].sort(
    (a, b) => a.averageTime - b.averageTime
  );

  console.log("By Speed:");
  sortedBySpeed.forEach((metric, index) => {
    console.log(`  ${index + 1}. ${metric.toolName}`);
    console.log(`     Avg Time: ${metric.averageTime.toFixed(0)}ms`);
    console.log(`     Range: ${metric.minTime}ms - ${metric.maxTime}ms\n`);
  });

  await engine.destroy();
}

// ============================================================================
// Example 8: Continuous Integration Mode
// ============================================================================

async function example8_CIMode() {
  console.log("Example 8: CI Mode - Exit with status code\n");

  const engine = new EvaluationEngine();
  await engine.initialize();

  const report = await engine.runAllTests();

  // Save report for CI artifacts
  const ciReportPath = path.join(process.cwd(), 'eval', 'ci-report.json');
  await engine.saveReport(report, ciReportPath);

  await engine.destroy();

  // Determine pass/fail based on thresholds
  const MINIMUM_PASS_RATE = 80; // 80% of tests must pass
  const MINIMUM_SCORE_PERCENTAGE = 70; // Overall score must be >= 70%

  const passRate = (report.passedTests / report.totalTests) * 100;
  const passed = passRate >= MINIMUM_PASS_RATE &&
                 report.scorePercentage >= MINIMUM_SCORE_PERCENTAGE;

  if (passed) {
    console.log(`✅ CI PASSED - ${passRate.toFixed(1)}% pass rate, ${report.scorePercentage.toFixed(1)}% score`);
    process.exit(0);
  } else {
    console.log(`❌ CI FAILED - ${passRate.toFixed(1)}% pass rate, ${report.scorePercentage.toFixed(1)}% score`);
    process.exit(1);
  }
}

// ============================================================================
// Example 9: Watch Mode (for development)
// ============================================================================

async function example9_WatchMode() {
  console.log("Example 9: Watch mode for development\n");
  console.log("Note: This is a simplified example. In production, use a proper file watcher.\n");

  let iteration = 0;
  const MAX_ITERATIONS = 3; // For demo purposes

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    console.log(`\n=== Iteration ${iteration} ===`);

    const engine = new EvaluationEngine();
    await engine.initialize();

    const report = await engine.runAllTests();

    console.log(`\nQuick Summary:`);
    console.log(`  Passed: ${report.passedTests}/${report.totalTests}`);
    console.log(`  Score: ${report.scorePercentage.toFixed(1)}%`);
    console.log(`  Avg Time: ${report.averageResponseTime.toFixed(0)}ms`);

    await engine.destroy();

    if (iteration < MAX_ITERATIONS) {
      console.log(`\nWaiting 5 seconds before next run...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// ============================================================================
// Example 10: Export Results for Dashboard
// ============================================================================

async function example10_ExportForDashboard() {
  console.log("Example 10: Export results for dashboard visualization\n");

  const engine = new EvaluationEngine();
  await engine.initialize();

  const report = await engine.runAllTests();

  // Transform report into dashboard-friendly format
  const dashboardData = {
    timestamp: report.timestamp,
    summary: {
      totalTests: report.totalTests,
      passedTests: report.passedTests,
      failedTests: report.failedTests,
      scorePercentage: report.scorePercentage,
      averageResponseTime: report.averageResponseTime,
    },
    categories: Object.entries(report.categoryBreakdown).map(([name, stats]) => ({
      name,
      passRate: (stats.passed / (stats.passed + stats.failed)) * 100,
      scorePercentage: (stats.score / stats.maxScore) * 100,
    })),
    tools: report.performanceMetrics.map(metric => ({
      name: metric.toolName,
      avgTime: metric.averageTime,
      successRate: metric.successRate,
    })),
    testDetails: report.testResults.map(result => {
      const testCase = TEST_CASES.find(tc => tc.id === result.testId);
      return {
        id: result.testId,
        name: testCase?.description || result.testId,
        category: testCase?.category,
        passed: result.passed,
        score: result.score,
        maxScore: result.maxScore,
        responseTime: result.responseTime,
      };
    }),
  };

  // Save dashboard data
  const dashboardPath = path.join(process.cwd(), 'eval', 'dashboard-data.json');
  await import('fs/promises').then(fs =>
    fs.writeFile(dashboardPath, JSON.stringify(dashboardData, null, 2))
  );

  console.log(`Dashboard data exported to: ${dashboardPath}`);

  await engine.destroy();
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  const exampleNumber = process.argv[2] || '1';

  console.log("=".repeat(80));
  console.log("WebSee MCP Evaluation Framework - Example Usage");
  console.log("=".repeat(80));
  console.log("");

  switch (exampleNumber) {
    case '1':
      await example1_RunAllTests();
      break;
    case '2':
      await example2_CustomOutputPath();
      break;
    case '3':
      await example3_IndividualTest();
      break;
    case '4':
      await example4_CategoryTests();
      break;
    case '5':
      await example5_CustomTestCase();
      break;
    case '6':
      await example6_DetailedReportAnalysis();
      break;
    case '7':
      await example7_PerformanceComparison();
      break;
    case '8':
      await example8_CIMode();
      break;
    case '9':
      await example9_WatchMode();
      break;
    case '10':
      await example10_ExportForDashboard();
      break;
    default:
      console.log("Available examples:");
      console.log("  1 - Run all tests with default settings");
      console.log("  2 - Run tests with custom output path");
      console.log("  3 - Run individual test case");
      console.log("  4 - Run tests for specific category");
      console.log("  5 - Custom test case");
      console.log("  6 - Detailed report analysis");
      console.log("  7 - Performance comparison");
      console.log("  8 - Continuous Integration mode");
      console.log("  9 - Watch mode (development)");
      console.log("  10 - Export for dashboard");
      console.log("\nUsage: tsx eval/example-usage.ts [1-10]");
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error("Error running example:", error);
    process.exit(1);
  });
}
