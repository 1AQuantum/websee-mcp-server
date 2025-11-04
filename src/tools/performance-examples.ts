/**
 * Performance Intelligence Tools - Usage Examples
 *
 * NOTE: These examples are for reference only. Performance tools are not yet implemented.
 * See FUTURE_DEVELOPMENT.md for implementation plan.
 *
 * @module performance-examples
 */

import { chromium } from 'playwright';
// Performance tools not yet implemented - see FUTURE_DEVELOPMENT.md
// import {
//   perfGetMetrics,
//   perfProfileCPU,
//   perfSnapshotMemory,
//   perfTraceEvents,
//   perfLighthouse,
// } from './performance-intelligence-tools.js';

/**
 * Example 1: Get Core Web Vitals for a website
 */
export async function example1_getCoreWebVitals() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('\n=== Example 1: Core Web Vitals ===\n');

    const metrics = await perfGetMetrics(page, {
      url: 'https://web.dev',
      waitUntil: 'networkidle',
    });

    console.log('Core Web Vitals:');
    console.log(`  LCP (Largest Contentful Paint): ${metrics.lcp}ms`);
    console.log(`  FID (First Input Delay): ${metrics.fid ?? 'N/A'}ms`);
    console.log(`  CLS (Cumulative Layout Shift): ${metrics.cls}`);
    console.log(`  TTFB (Time to First Byte): ${metrics.ttfb}ms`);
    console.log(`  FCP (First Contentful Paint): ${metrics.fcp}ms`);
    console.log(`  TBT (Total Blocking Time): ${metrics.tbt}ms`);

    // Check if metrics are within acceptable ranges
    const issues: string[] = [];
    if (metrics.lcp && metrics.lcp > 2500) {
      issues.push(`LCP is too high (${metrics.lcp}ms > 2500ms)`);
    }
    if (metrics.cls && metrics.cls > 0.1) {
      issues.push(`CLS is too high (${metrics.cls} > 0.1)`);
    }
    if (metrics.ttfb && metrics.ttfb > 800) {
      issues.push(`TTFB is too high (${metrics.ttfb}ms > 800ms)`);
    }

    if (issues.length > 0) {
      console.log('\n⚠️  Performance Issues:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ All Core Web Vitals are within acceptable ranges!');
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

/**
 * Example 2: Profile CPU usage and find performance bottlenecks
 */
export async function example2_profileCPU() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('\n=== Example 2: CPU Profiling ===\n');

    const profile = await perfProfileCPU(page, {
      url: 'https://example.com',
      duration: 5000,
      samplingInterval: 100,
    });

    console.log(`CPU Profile Results:`);
    console.log(`  Duration: ${profile.duration}ms`);
    console.log(`  Total Samples: ${profile.samples}`);

    console.log(`\n🔥 Top 10 Hot Functions:`);
    profile.hotFunctions.slice(0, 10).forEach((func, i) => {
      console.log(`\n${i + 1}. ${func.name}`);
      console.log(`   File: ${func.file}:${func.line}:${func.column}`);
      console.log(`   Time: ${(func.time / 1000).toFixed(2)}ms (${func.percentage.toFixed(1)}%)`);
      console.log(`   Self Time: ${(func.selfTime / 1000).toFixed(2)}ms`);
    });

    console.log(`\n📊 Top-Level Calls:`);
    profile.topLevelCalls.slice(0, 5).forEach((call, i) => {
      console.log(
        `  ${i + 1}. ${call.name}: ${(call.time / 1000).toFixed(2)}ms (${call.percentage.toFixed(1)}%)`
      );
    });

    // Identify expensive functions
    const expensiveFunctions = profile.hotFunctions.filter(f => f.percentage > 5);
    if (expensiveFunctions.length > 0) {
      console.log(`\n⚠️  Functions consuming >5% CPU time:`);
      expensiveFunctions.forEach(func => {
        console.log(`  - ${func.name} (${func.percentage.toFixed(1)}%)`);
      });
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

/**
 * Example 3: Take memory snapshot and analyze heap usage
 */
export async function example3_snapshotMemory() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('\n=== Example 3: Memory Snapshot ===\n');

    const snapshot = await perfSnapshotMemory(page, {
      url: 'https://example.com',
      waitTime: 3000,
      includeObjectStats: true,
    });

    console.log('Memory Usage:');
    console.log(`  Total: ${(snapshot.total / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Used: ${(snapshot.used / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Limit: ${(snapshot.limit / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Usage: ${snapshot.usagePercentage.toFixed(1)}%`);

    console.log(`\n📦 Top Object Types by Size:`);
    snapshot.objects.slice(0, 10).forEach((obj, i) => {
      console.log(`  ${i + 1}. ${obj.type}`);
      console.log(`     Count: ${obj.count.toLocaleString()}`);
      console.log(`     Size: ${(obj.size / 1024).toFixed(2)} KB (${obj.percentage.toFixed(1)}%)`);
    });

    console.log(`\n🔍 Largest Objects:`);
    snapshot.largestObjects.slice(0, 5).forEach((obj, i) => {
      console.log(`  ${i + 1}. ${obj.type}: ${(obj.size / 1024).toFixed(2)} KB`);
    });

    // Check for memory issues
    if (snapshot.usagePercentage > 80) {
      console.log('\n⚠️  Warning: Memory usage is above 80%!');
    }

    // Identify potential memory leaks
    const suspiciousObjects = snapshot.objects.filter(
      obj => obj.type.includes('Array') && obj.count > 10000
    );
    if (suspiciousObjects.length > 0) {
      console.log('\n⚠️  Potential memory issues detected:');
      suspiciousObjects.forEach(obj => {
        console.log(`  - ${obj.type}: ${obj.count.toLocaleString()} instances`);
      });
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

/**
 * Example 4: Trace performance events and identify long tasks
 */
export async function example4_traceEvents() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('\n=== Example 4: Performance Trace ===\n');

    const trace = await perfTraceEvents(page, {
      url: 'https://example.com',
      duration: 5000,
      categories: ['devtools.timeline', 'blink.user_timing', 'loading'],
    });

    console.log('Trace Summary:');
    console.log(`  Duration: ${trace.duration}ms`);
    console.log(`  Total Events: ${trace.summary.totalEvents}`);

    console.log(`\n📊 Events by Category:`);
    Object.entries(trace.summary.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    console.log(`\n⏱️  Long Tasks (>50ms):`);
    trace.summary.longTasks.forEach((task, i) => {
      console.log(`  ${i + 1}. ${task.duration.toFixed(2)}ms @ ${task.timestamp.toFixed(2)}ms`);
    });

    // Analyze event distribution
    const eventTypes = new Map<string, number>();
    trace.events.forEach(event => {
      eventTypes.set(event.type, (eventTypes.get(event.type) || 0) + 1);
    });

    console.log(`\n🔝 Top Event Types:`);
    Array.from(eventTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([type, count], i) => {
        console.log(`  ${i + 1}. ${type}: ${count} occurrences`);
      });

    // Check for performance issues
    if (trace.summary.longTasks.length > 5) {
      console.log(`\n⚠️  Warning: ${trace.summary.longTasks.length} long tasks detected!`);
      console.log('   Consider breaking up long-running JavaScript operations.');
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

/**
 * Example 5: Run Lighthouse-style audit
 */
export async function example5_lighthouseAudit() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('\n=== Example 5: Lighthouse Audit ===\n');

    const result = await perfLighthouse(page, {
      url: 'https://web.dev',
      categories: ['performance', 'accessibility', 'best-practices', 'seo'],
      device: 'mobile',
    });

    console.log('Lighthouse Scores:');
    console.log(`  📊 Performance: ${result.performance}/100`);
    console.log(`  ♿ Accessibility: ${result.accessibility}/100`);
    console.log(`  ✅ Best Practices: ${result.bestPractices}/100`);
    console.log(`  🔍 SEO: ${result.seo}/100`);

    console.log(`\n⚡ Performance Metrics:`);
    console.log(`  LCP: ${result.scores.performance.metrics.lcp}ms`);
    console.log(`  FCP: ${result.scores.performance.metrics.fcp}ms`);
    console.log(`  CLS: ${result.scores.performance.metrics.cls}`);
    console.log(`  TTFB: ${result.scores.performance.metrics.ttfb}ms`);

    if (result.scores.accessibility.issues.length > 0) {
      console.log(`\n♿ Accessibility Issues:`);
      result.scores.accessibility.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.impact}] ${issue.title}`);
        console.log(`     ${issue.description}`);
      });
    }

    console.log(`\n✅ Best Practices Audits:`);
    Object.entries(result.scores.bestPractices.audits).forEach(([key, value]) => {
      const icon = value ? '✓' : '✗';
      console.log(`  ${icon} ${key}`);
    });

    console.log(`\n🔍 SEO Audits:`);
    Object.entries(result.scores.seo.audits).forEach(([key, value]) => {
      const icon = value ? '✓' : '✗';
      console.log(`  ${icon} ${key}`);
    });

    // Overall assessment
    const avgScore =
      (result.performance + result.accessibility + result.bestPractices + result.seo) / 4;

    console.log(`\n📈 Overall Score: ${avgScore.toFixed(1)}/100`);
    if (avgScore >= 90) {
      console.log('   ✅ Excellent! Your site follows best practices.');
    } else if (avgScore >= 70) {
      console.log("   ⚠️  Good, but there's room for improvement.");
    } else {
      console.log('   ❌ Needs improvement. Please address the issues above.');
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

/**
 * Example 6: Comprehensive performance analysis
 */
export async function example6_comprehensiveAnalysis() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('\n=== Example 6: Comprehensive Performance Analysis ===\n');

    const url = 'https://example.com';

    // Run all analyses
    console.log('Running comprehensive analysis...\n');

    const [metrics, profile, snapshot, lighthouse] = await Promise.all([
      perfGetMetrics(page, { url }),
      perfProfileCPU(page, { url, duration: 3000 }),
      perfSnapshotMemory(page, { url, includeObjectStats: true }),
      perfLighthouse(page, { url, device: 'mobile' }),
    ]);

    // Generate comprehensive report
    console.log('='.repeat(60));
    console.log('COMPREHENSIVE PERFORMANCE REPORT');
    console.log('='.repeat(60));
    console.log(`URL: ${url}`);
    console.log(`Generated: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    console.log('\n1️⃣  CORE WEB VITALS');
    console.log('-'.repeat(60));
    console.log(`   LCP: ${metrics.lcp}ms ${metrics.lcp && metrics.lcp > 2500 ? '❌' : '✅'}`);
    console.log(`   FCP: ${metrics.fcp}ms ${metrics.fcp && metrics.fcp > 1800 ? '❌' : '✅'}`);
    console.log(`   CLS: ${metrics.cls} ${metrics.cls && metrics.cls > 0.1 ? '❌' : '✅'}`);
    console.log(`   TTFB: ${metrics.ttfb}ms ${metrics.ttfb && metrics.ttfb > 800 ? '❌' : '✅'}`);

    console.log('\n2️⃣  CPU PERFORMANCE');
    console.log('-'.repeat(60));
    console.log(`   Total Samples: ${profile.samples}`);
    console.log(`   Hot Functions: ${profile.hotFunctions.length}`);
    if (profile.hotFunctions.length > 0) {
      console.log(
        `   Top Function: ${profile.hotFunctions[0].name} (${profile.hotFunctions[0].percentage.toFixed(1)}%)`
      );
    }

    console.log('\n3️⃣  MEMORY USAGE');
    console.log('-'.repeat(60));
    console.log(`   Used: ${(snapshot.used / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total: ${(snapshot.total / 1024 / 1024).toFixed(2)} MB`);
    console.log(
      `   Usage: ${snapshot.usagePercentage.toFixed(1)}% ${snapshot.usagePercentage > 80 ? '❌' : '✅'}`
    );

    console.log('\n4️⃣  LIGHTHOUSE SCORES');
    console.log('-'.repeat(60));
    console.log(`   Performance: ${lighthouse.performance}/100`);
    console.log(`   Accessibility: ${lighthouse.accessibility}/100`);
    console.log(`   Best Practices: ${lighthouse.bestPractices}/100`);
    console.log(`   SEO: ${lighthouse.seo}/100`);

    console.log('\n5️⃣  RECOMMENDATIONS');
    console.log('-'.repeat(60));
    const recommendations: string[] = [];

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint (LCP)');
    }
    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift (CLS)');
    }
    if (profile.hotFunctions.length > 0 && profile.hotFunctions[0].percentage > 10) {
      recommendations.push(`Optimize hot function: ${profile.hotFunctions[0].name}`);
    }
    if (snapshot.usagePercentage > 80) {
      recommendations.push(
        'Reduce memory usage (currently at ' + snapshot.usagePercentage.toFixed(1) + '%)'
      );
    }
    if (lighthouse.accessibility < 90) {
      recommendations.push('Address accessibility issues');
    }

    if (recommendations.length > 0) {
      recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    } else {
      console.log('   ✅ No critical issues found!');
    }

    console.log('\n' + '='.repeat(60));
  } finally {
    await page.close();
    await browser.close();
  }
}

// Export all examples
export const examples = {
  example1_getCoreWebVitals,
  example2_profileCPU,
  example3_snapshotMemory,
  example4_traceEvents,
  example5_lighthouseAudit,
  example6_comprehensiveAnalysis,
};

// Run examples (uncomment to test)
// example1_getCoreWebVitals();
// example2_profileCPU();
// example3_snapshotMemory();
// example4_traceEvents();
// example5_lighthouseAudit();
// example6_comprehensiveAnalysis();
