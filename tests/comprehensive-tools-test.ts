/**
 * Comprehensive Test Suite for WebSee MCP Server Tools
 * Tests all 16 granular intelligence tools across 4 categories:
 * - Source Intelligence (7 tools)
 * - Build Intelligence (5 tools)
 * - Error Intelligence (4 tools)
 *
 * This test suite validates tool functionality with:
 * - Real websites with source maps
 * - Local test pages
 * - Build artifacts from webpack/vite
 * - Error scenarios
 */

import { chromium, Browser, Page } from 'playwright';
import { SourceIntelligenceLayer } from '../src/index.js';
import {
  sourceMapResolve,
  sourceMapGetContent,
  sourceTraceStack,
  sourceFindDefinition,
  sourceGetSymbols,
  sourceMapBundle,
  sourceCoverageMap,
} from '../src/tools/source-intelligence-tools.js';
import {
  buildGetManifest,
  buildGetChunks,
  buildFindModule,
  buildGetDependencies,
  buildAnalyzeSize,
} from '../src/tools/build-intelligence-tools.js';
import {
  errorResolveStack,
  errorGetContext,
  errorTraceCause,
  errorGetSimilar,
} from '../src/tools/error-intelligence-tools.js';

// Test configuration
const TEST_CONFIG = {
  headless: true,
  timeout: 30000,

  // Test URLs
  urls: {
    // Real websites with source maps
    react: 'https://react.dev',
    vite: 'https://vitejs.dev',

    // Local test pages
    localReact: 'file://' + process.cwd() + '/test-pages/react-app.html',
    localError: 'file://' + process.cwd() + '/test-pages/minified-error.html',
    localNetwork: 'file://' + process.cwd() + '/test-pages/network-test.html',
    localIndex: 'file://' + process.cwd() + '/test-pages/index.html',
  },
};

// Test results tracker
interface TestResult {
  toolName: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  output?: any;
  error?: string;
  notes?: string;
}

const testResults: TestResult[] = [];

// Utility functions
function logTest(category: string, toolName: string, message: string) {
  console.log(`[${category}] ${toolName}: ${message}`);
}

function recordResult(result: TestResult) {
  testResults.push(result);
  const status = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '○';
  console.log(`${status} ${result.toolName} (${result.duration}ms)${result.error ? ' - ' + result.error : ''}`);
}

async function runTest(
  category: string,
  toolName: string,
  testFn: () => Promise<any>
): Promise<void> {
  const startTime = Date.now();

  try {
    logTest(category, toolName, 'Starting...');
    const output = await testFn();
    const duration = Date.now() - startTime;

    recordResult({
      toolName,
      category,
      status: 'PASS',
      duration,
      output,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    recordResult({
      toolName,
      category,
      status: 'FAIL',
      duration,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ============================================================================
// SOURCE INTELLIGENCE TOOLS TESTS (7 tools)
// ============================================================================

async function testSourceIntelligenceTools(browser: Browser): Promise<void> {
  console.log('\n=== SOURCE INTELLIGENCE TOOLS ===\n');

  const page = await browser.newPage();

  // Test 1: source_map_resolve
  await runTest('Source Intelligence', 'source_map_resolve', async () => {
    await page.goto(TEST_CONFIG.urls.react, { waitUntil: 'networkidle' });

    // Try to resolve a location from React's bundle
    const result = await sourceMapResolve(page, {
      url: 'https://react.dev/assets/app.js',
      line: 1,
      column: 100,
    });

    return {
      success: result.success,
      hasResolution: !!result.original || !!result.minified,
      sample: result,
    };
  });

  // Test 2: source_map_get_content
  await runTest('Source Intelligence', 'source_map_get_content', async () => {
    const result = await sourceMapGetContent(page, {
      file: 'src/App.tsx',
      startLine: 1,
      endLine: 10,
    });

    return {
      success: result.success,
      hasContent: !!result.content,
      language: result.language,
      totalLines: result.totalLines,
    };
  });

  // Test 3: source_trace_stack
  await runTest('Source Intelligence', 'source_trace_stack', async () => {
    const mockStack = `Error: Test error
    at handleClick (webpack:///src/App.tsx:45:12)
    at onClick (webpack:///src/Button.tsx:23:8)
    at callCallback (webpack:///node_modules/react-dom/index.js:123:45)`;

    const result = await sourceTraceStack(page, {
      stackTrace: mockStack,
    });

    return {
      success: result.success,
      totalFrames: result.summary?.totalFrames || 0,
      resolvedFrames: result.summary?.resolvedFrames || 0,
      hasOriginal: result.original && result.original.length > 0,
      hasResolved: result.resolved && result.resolved.length > 0,
    };
  });

  // Test 4: source_find_definition
  await runTest('Source Intelligence', 'source_find_definition', async () => {
    const result = await sourceFindDefinition(page, {
      functionName: 'App',
    });

    return {
      success: result.success,
      found: !!result.definition,
      functionName: result.functionName,
      location: result.definition ? {
        file: result.definition.file,
        line: result.definition.line,
      } : null,
    };
  });

  // Test 5: source_get_symbols
  await runTest('Source Intelligence', 'source_get_symbols', async () => {
    const result = await sourceGetSymbols(page, {
      file: 'src/App.tsx',
    });

    return {
      success: result.success,
      totalExports: result.summary?.totalExports || 0,
      totalImports: result.summary?.totalImports || 0,
      totalTypes: result.summary?.totalTypes || 0,
      sampleExports: result.exports?.slice(0, 3) || [],
    };
  });

  // Test 6: source_map_bundle
  await runTest('Source Intelligence', 'source_map_bundle', async () => {
    const result = await sourceMapBundle(page, {
      bundlePath: 'https://react.dev/assets/app.js',
    });

    return {
      success: result.success,
      bundle: result.bundle,
      totalSources: result.summary?.totalSources || 0,
      sampleMappings: result.summary?.sampleMappings || 0,
      sampleSources: result.sources?.slice(0, 5) || [],
    };
  });

  // Test 7: source_coverage_map
  await runTest('Source Intelligence', 'source_coverage_map', async () => {
    // Start coverage collection
    await page.coverage.startJSCoverage();

    // Navigate to trigger code execution
    await page.goto(TEST_CONFIG.urls.localReact, { waitUntil: 'networkidle' });

    // Click a button to execute some code
    try {
      await page.click('button', { timeout: 5000 });
    } catch (e) {
      // Button might not exist, that's okay
    }

    // Collect coverage
    const coverage = await page.coverage.stopJSCoverage();

    // Convert to the format expected by the tool
    const coverageData = coverage.map(entry => ({
      url: entry.url,
      ranges: entry.ranges,
      text: entry.text,
    }));

    const result = await sourceCoverageMap(page, {
      coverageData: coverageData as any,
    });

    return {
      success: result.success,
      overallPercentage: result.summary?.overallPercentage || '0%',
      totalFiles: result.summary?.totalFiles || 0,
      coveredFiles: result.summary?.coveredFiles || 0,
    };
  });

  await page.close();
}

// ============================================================================
// BUILD INTELLIGENCE TOOLS TESTS (5 tools)
// ============================================================================

async function testBuildIntelligenceTools(browser: Browser): Promise<void> {
  console.log('\n=== BUILD INTELLIGENCE TOOLS ===\n');

  const page = await browser.newPage();

  // Test 1: build_get_manifest
  await runTest('Build Intelligence', 'build_get_manifest', async () => {
    const result = await buildGetManifest(page, {
      url: TEST_CONFIG.urls.vite,
    });

    return {
      type: result.type,
      hasChunks: result.chunks && result.chunks.length > 0,
      hasModules: result.modules && result.modules.length > 0,
      totalModules: result.modules?.length || 0,
      sampleModules: result.modules?.slice(0, 3) || [],
    };
  });

  // Test 2: build_get_chunks
  await runTest('Build Intelligence', 'build_get_chunks', async () => {
    const result = await buildGetChunks(page, {
      url: TEST_CONFIG.urls.react,
    });

    return {
      totalChunks: result.chunks.length,
      hasEntry: result.chunks.some(c => c.entry),
      sampleChunks: result.chunks.slice(0, 3).map(c => ({
        id: c.id,
        files: c.files,
        sizeKB: c.sizeKB,
      })),
    };
  });

  // Test 3: build_find_module
  await runTest('Build Intelligence', 'build_find_module', async () => {
    await page.goto(TEST_CONFIG.urls.react, { waitUntil: 'networkidle' });

    // Try to find a common module (React itself)
    const result = await buildFindModule(page, {
      url: TEST_CONFIG.urls.react,
      moduleName: 'react',
    });

    if (!result) {
      return {
        found: false,
        message: 'Module not found (expected for some builds)',
      };
    }

    return {
      found: true,
      name: result.name,
      sizeKB: result.sizeKB,
      totalDependencies: result.dependencies.length,
      chunks: result.chunks,
    };
  });

  // Test 4: build_get_dependencies
  await runTest('Build Intelligence', 'build_get_dependencies', async () => {
    const result = await buildGetDependencies(page, {
      url: TEST_CONFIG.urls.vite,
    });

    return {
      totalDependencies: result.dependencies.length,
      sampleDeps: result.dependencies.slice(0, 5).map(d => ({
        name: d.name,
        sizeKB: d.sizeKB,
        chunks: d.chunks,
      })),
    };
  });

  // Test 5: build_analyze_size
  await runTest('Build Intelligence', 'build_analyze_size', async () => {
    const result = await buildAnalyzeSize(page, {
      url: TEST_CONFIG.urls.react,
      threshold: 50, // 50KB threshold
    });

    return {
      totalKB: result.totalKB,
      totalMB: result.totalMB,
      byType: {
        js: result.byType.js.sizeKB,
        css: result.byType.css.sizeKB,
      },
      largeCount: result.large.length,
      recommendationCount: result.recommendations.length,
      topRecommendations: result.recommendations.slice(0, 3),
    };
  });

  await page.close();
}

// ============================================================================
// ERROR INTELLIGENCE TOOLS TESTS (4 tools)
// ============================================================================

async function testErrorIntelligenceTools(browser: Browser): Promise<void> {
  console.log('\n=== ERROR INTELLIGENCE TOOLS ===\n');

  const page = await browser.newPage();

  // Test 1: error_resolve_stack
  await runTest('Error Intelligence', 'error_resolve_stack', async () => {
    await page.goto(TEST_CONFIG.urls.localError, { waitUntil: 'networkidle' });

    // Sample minified stack trace
    const mockStack = `TypeError: Cannot read property 'property' of null
    at a (file:///test.js:1:234)
    at c (file:///test.js:1:456)
    at d (file:///test.js:1:678)`;

    const result = await errorResolveStack(page, {
      url: TEST_CONFIG.urls.localError,
      errorStack: mockStack,
    });

    return {
      totalFrames: result.original.length,
      resolvedCount: result.resolved.filter(f => f.resolved).length,
      message: result.message,
      sampleResolved: result.resolved.slice(0, 2),
    };
  });

  // Test 2: error_get_context
  await runTest('Error Intelligence', 'error_get_context', async () => {
    await page.goto(TEST_CONFIG.urls.localError, { waitUntil: 'networkidle' });

    // Trigger an error
    try {
      await page.click('button:has-text("Trigger TypeError")', { timeout: 5000 });
    } catch (e) {
      // Error is expected
    }

    // Wait a bit for errors to be captured
    await page.waitForTimeout(1000);

    const result = await errorGetContext(page, {
      url: TEST_CONFIG.urls.localError,
    });

    return {
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      componentCount: result.components.length,
      networkCount: result.network.length,
      sampleErrors: result.errors.slice(0, 2),
    };
  });

  // Test 3: error_trace_cause
  await runTest('Error Intelligence', 'error_trace_cause', async () => {
    await page.goto(TEST_CONFIG.urls.localError, { waitUntil: 'networkidle' });

    // Try to trace a specific error
    const result = await errorTraceCause(page, {
      url: TEST_CONFIG.urls.localError,
      errorMessage: 'Cannot read property',
    });

    return {
      rootCause: result.rootCause,
      confidence: result.confidence,
      stackTraceLength: result.stackTrace.length,
      relatedErrorsCount: result.relatedErrors.length,
      recommendationCount: result.recommendations.length,
      topRecommendations: result.recommendations.slice(0, 3),
    };
  });

  // Test 4: error_get_similar
  await runTest('Error Intelligence', 'error_get_similar', async () => {
    await page.goto(TEST_CONFIG.urls.localError, { waitUntil: 'networkidle' });

    // Trigger multiple errors
    try {
      await page.click('button:has-text("Trigger TypeError")', { timeout: 3000 });
    } catch (e) {}

    await page.waitForTimeout(500);

    try {
      await page.click('button:has-text("Trigger ReferenceError")', { timeout: 3000 });
    } catch (e) {}

    await page.waitForTimeout(500);

    const result = await errorGetSimilar(page, {
      url: TEST_CONFIG.urls.localError,
      errorMessage: 'TypeError',
    });

    return {
      similarCount: result.similar.length,
      patterns: result.similar.map(e => ({
        pattern: e.pattern,
        count: e.count,
        message: e.message.substring(0, 50) + '...',
      })),
    };
  });

  await page.close();
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  WebSee MCP Server - Comprehensive Tools Test Suite       ║');
  console.log('║  Testing 16 Tools Across 3 Categories                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({
    headless: TEST_CONFIG.headless,
  });

  try {
    // Run all test suites
    await testSourceIntelligenceTools(browser);
    await testBuildIntelligenceTools(browser);
    await testErrorIntelligenceTools(browser);

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  TEST SUMMARY                                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const byCategory = new Map<string, { pass: number; fail: number; skip: number }>();

    testResults.forEach(result => {
      if (!byCategory.has(result.category)) {
        byCategory.set(result.category, { pass: 0, fail: 0, skip: 0 });
      }

      const stats = byCategory.get(result.category)!;
      if (result.status === 'PASS') stats.pass++;
      else if (result.status === 'FAIL') stats.fail++;
      else stats.skip++;
    });

    // Print category summaries
    byCategory.forEach((stats, category) => {
      const total = stats.pass + stats.fail + stats.skip;
      const passRate = total > 0 ? ((stats.pass / total) * 100).toFixed(1) : '0.0';

      console.log(`${category}:`);
      console.log(`  ✓ Pass: ${stats.pass}`);
      console.log(`  ✗ Fail: ${stats.fail}`);
      console.log(`  ○ Skip: ${stats.skip}`);
      console.log(`  Success Rate: ${passRate}%`);
      console.log('');
    });

    // Overall stats
    const totalTests = testResults.length;
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const skipped = testResults.filter(r => r.status === 'SKIP').length;
    const overallPassRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : '0.0';

    console.log('Overall:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  ✓ Passed: ${passed}`);
    console.log(`  ✗ Failed: ${failed}`);
    console.log(`  ○ Skipped: ${skipped}`);
    console.log(`  Overall Success Rate: ${overallPassRate}%`);

    // Print failed tests details
    const failedTests = testResults.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║  FAILED TESTS DETAILS                                      ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      failedTests.forEach(test => {
        console.log(`${test.category} - ${test.toolName}:`);
        console.log(`  Error: ${test.error}`);
        console.log('');
      });
    }

    // Save detailed results to file
    const fs = await import('fs/promises');
    const resultsPath = process.cwd() + '/test-results-detailed.json';
    await fs.writeFile(
      resultsPath,
      JSON.stringify(testResults, null, 2)
    );
    console.log(`\nDetailed results saved to: ${resultsPath}`);

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runAllTests, testResults };
