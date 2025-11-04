/**
 * Example usage of SourceMapResolver
 *
 * This file demonstrates how to integrate the source map resolver
 * with Playwright to debug minified JavaScript in production.
 */

import { chromium } from 'playwright';
import { SourceMapResolver } from './source-map-resolver.js';

/**
 * Example 1: Basic usage - resolve a single location
 */
async function basicUsage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create and initialize resolver
  const resolver = new SourceMapResolver();
  await resolver.initialize(page);

  // Navigate to a page with minified JavaScript
  await page.goto('https://example.com');

  // Resolve a location in minified code
  const original = await resolver.resolveLocation(
    'https://example.com/bundle.min.js',
    10, // line
    150 // column
  );

  if (original) {
    console.log('✓ Found original source:');
    console.log(`  File: ${original.file}`);
    console.log(`  Line: ${original.line}, Column: ${original.column}`);
    console.log(`  Symbol: ${original.name || '(anonymous)'}`);
    console.log(`\n  Source context:\n${original.content}`);
  } else {
    console.log('✗ No source map found');
  }

  await resolver.destroy();
  await browser.close();
}

/**
 * Example 2: Map console errors back to original source
 */
async function mapConsoleErrors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const resolver = new SourceMapResolver();
  await resolver.initialize(page);

  // Listen for console messages
  page.on('console', async msg => {
    if (msg.type() === 'error') {
      const location = msg.location();

      const original = await resolver.resolveLocation(
        location.url,
        location.lineNumber || 1,
        location.columnNumber || 0
      );

      if (original) {
        console.error(`\n[ERROR] ${msg.text()}`);
        console.error(`  at ${original.file}:${original.line}:${original.column}`);
        if (original.name) {
          console.error(`  in function: ${original.name}`);
        }
        if (original.content) {
          console.error(`\n  Source:\n${original.content}\n`);
        }
      } else {
        console.error(`\n[ERROR] ${msg.text()}`);
        console.error(`  at ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
    }
  });

  // Navigate to a page that might have errors
  await page.goto('https://example.com');

  // Wait for potential errors
  await page.waitForTimeout(5000);

  await resolver.destroy();
  await browser.close();
}

/**
 * Example 3: Handle page navigation and cache management
 */
async function multiPageNavigation() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const resolver = new SourceMapResolver(100); // Larger cache for multi-page
  await resolver.initialize(page);

  const sites = ['https://site1.com', 'https://site2.com', 'https://site3.com'];

  for (const site of sites) {
    console.log(`\nNavigating to: ${site}`);
    await page.goto(site);

    // Simulate resolving some locations
    // In real usage, these would come from error stacks or profiling data
    const testLocation = await resolver.resolveLocation(`${site}/bundle.js`, 1, 0);

    if (testLocation) {
      console.log(`✓ Source map found for ${site}`);
    }

    // Clear cache between major navigation if memory is a concern
    if (sites.indexOf(site) % 10 === 0) {
      resolver.clearCache();
      console.log('  Cache cleared to free memory');
    }
  }

  await resolver.destroy();
  await browser.close();
}

/**
 * Example 4: Integration with error tracking
 */
async function errorTracking() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const resolver = new SourceMapResolver();
  await resolver.initialize(page);

  // Track all JavaScript errors
  const errors: Array<{
    message: string;
    original?: {
      file: string;
      line: number;
      column: number;
      context?: string;
    };
  }> = [];

  // Listen for page errors
  page.on('pageerror', async error => {
    console.error(`\nPage error: ${error.message}`);

    // Parse stack trace to extract location
    const stackMatch = error.stack?.match(/at .+ \((.+):(\d+):(\d+)\)/);

    if (stackMatch) {
      const [, url, line, column] = stackMatch;
      const original = await resolver.resolveLocation(url, parseInt(line), parseInt(column));

      errors.push({
        message: error.message,
        original: original
          ? {
              file: original.file,
              line: original.line,
              column: original.column,
              context: original.content,
            }
          : undefined,
      });

      if (original) {
        console.log(`  Mapped to: ${original.file}:${original.line}:${original.column}`);
      }
    }
  });

  await page.goto('https://example.com');
  await page.waitForTimeout(5000);

  // Generate error report
  console.log('\n=== Error Report ===');
  console.log(`Total errors: ${errors.length}`);
  errors.forEach((err, i) => {
    console.log(`\n${i + 1}. ${err.message}`);
    if (err.original) {
      console.log(`   Location: ${err.original.file}:${err.original.line}:${err.original.column}`);
    }
  });

  await resolver.destroy();
  await browser.close();
}

/**
 * Example 5: Performance monitoring with source maps
 */
async function performanceMonitoring() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const resolver = new SourceMapResolver();
  await resolver.initialize(page);

  await page.goto('https://example.com');

  // Collect performance metrics
  const metrics = await page.evaluate(() => {
    const entries = performance.getEntriesByType('measure');
    return entries.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      // In a real scenario, you'd capture stack traces here
    }));
  });

  console.log('\n=== Performance Report ===');
  for (const metric of metrics) {
    console.log(`${metric.name}: ${metric.duration.toFixed(2)}ms`);
    // In production, you'd resolve the stack traces to original sources
  }

  await resolver.destroy();
  await browser.close();
}

/**
 * Example 6: Testing with custom cache size
 */
async function customCacheSize() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Small cache for memory-constrained environments
  const resolver = new SourceMapResolver(10);
  await resolver.initialize(page);

  await page.goto('https://example.com');

  console.log('Resolver initialized with cache size: 10');
  console.log('Oldest entries will be evicted when cache is full');

  await resolver.destroy();
  await browser.close();
}

// Run examples (uncomment to test)
// basicUsage();
// mapConsoleErrors();
// multiPageNavigation();
// errorTracking();
// performanceMonitoring();
// customCacheSize();

export {
  basicUsage,
  mapConsoleErrors,
  multiPageNavigation,
  errorTracking,
  performanceMonitoring,
  customCacheSize,
};
