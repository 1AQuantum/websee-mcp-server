# Performance Intelligence Tools

Advanced performance monitoring and profiling tools for the WebSee MCP Server. These tools leverage Playwright and Chrome DevTools Protocol (CDP) to provide comprehensive performance analysis capabilities.

## Tools Overview

### 1. `perf_get_metrics` - Core Web Vitals

Measures Core Web Vitals and essential performance metrics for any URL.

**Metrics Captured:**
- **LCP** (Largest Contentful Paint) - Time to render the largest content element
- **FID** (First Input Delay) - Time from user interaction to browser response
- **CLS** (Cumulative Layout Shift) - Visual stability score
- **TTFB** (Time to First Byte) - Server response time
- **FCP** (First Contentful Paint) - Time to first content render
- **TBT** (Total Blocking Time) - Time the main thread is blocked

**Parameters:**
```typescript
{
  url: string;              // URL to analyze
  waitUntil?: "load" | "domcontentloaded" | "networkidle"; // Default: "load"
  timeout?: number;         // Navigation timeout (ms), default: 30000
}
```

**Returns:**
```typescript
{
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  fcp: number | null;
  tbt: number | null;
  timestamp: string;
  url: string;
}
```

**Usage Example:**
```typescript
const metrics = await perfGetMetrics(page, {
  url: "https://example.com",
  waitUntil: "networkidle"
});

console.log(`LCP: ${metrics.lcp}ms`);
console.log(`CLS: ${metrics.cls}`);
```

**Performance Thresholds (Google Recommendations):**
- LCP: Good < 2.5s, Needs Improvement 2.5-4s, Poor > 4s
- FID: Good < 100ms, Needs Improvement 100-300ms, Poor > 300ms
- CLS: Good < 0.1, Needs Improvement 0.1-0.25, Poor > 0.25
- TTFB: Good < 800ms, Needs Improvement 800-1800ms, Poor > 1800ms
- FCP: Good < 1.8s, Needs Improvement 1.8-3s, Poor > 3s

---

### 2. `perf_profile_cpu` - CPU Profiling

Profiles CPU usage and identifies performance bottlenecks with source-level attribution.

**Features:**
- CPU sampling with configurable interval
- Hot function identification
- Source map resolution for minified code
- Self-time calculation (excluding child calls)
- Top-level call analysis

**Parameters:**
```typescript
{
  url: string;              // URL to profile
  duration: number;         // Profiling duration (ms), range: 1000-60000
  samplingInterval?: number; // Sample interval (μs), default: 100
}
```

**Returns:**
```typescript
{
  startTime: number;
  endTime: number;
  duration: number;
  samples: number;
  hotFunctions: Array<{
    name: string;           // Function name
    file: string;           // Source file
    line: number;           // Line number
    column: number;         // Column number
    time: number;           // Total time (μs)
    percentage: number;     // % of CPU time
    selfTime: number;       // Time excluding children
  }>;
  topLevelCalls: Array<{
    name: string;
    time: number;
    percentage: number;
  }>;
}
```

**Usage Example:**
```typescript
const profile = await perfProfileCPU(page, {
  url: "https://example.com",
  duration: 5000,
  samplingInterval: 100
});

// Find functions consuming > 5% CPU
const expensive = profile.hotFunctions.filter(f => f.percentage > 5);
expensive.forEach(func => {
  console.log(`${func.name}: ${func.percentage.toFixed(1)}%`);
  console.log(`  Location: ${func.file}:${func.line}:${func.column}`);
});
```

**Best Practices:**
- Use longer durations (10-30s) for accurate profiling
- Lower sampling intervals (50-100μs) for higher precision
- Focus on functions with high self-time (excluding children)
- Profile during typical user interactions

---

### 3. `perf_snapshot_memory` - Heap Snapshot

Takes a heap snapshot and analyzes memory usage with detailed object statistics.

**Features:**
- Total heap usage measurement
- Object type distribution
- Largest object identification
- Memory leak detection indicators
- Object count and size analysis

**Parameters:**
```typescript
{
  url: string;              // URL to analyze
  waitTime?: number;        // Wait before snapshot (ms), default: 3000
  includeObjectStats?: boolean; // Include detailed stats, default: true
}
```

**Returns:**
```typescript
{
  total: number;            // Total heap size (bytes)
  used: number;             // Used heap size (bytes)
  limit: number;            // Heap limit (bytes)
  usagePercentage: number;  // Usage percentage
  timestamp: string;
  objects: Array<{
    type: string;           // Object type
    count: number;          // Instance count
    size: number;           // Total size (bytes)
    percentage: number;     // % of heap
  }>;
  largestObjects: Array<{
    type: string;
    size: number;
    retainedSize: number;
  }>;
}
```

**Usage Example:**
```typescript
const snapshot = await perfSnapshotMemory(page, {
  url: "https://example.com",
  waitTime: 5000,
  includeObjectStats: true
});

console.log(`Memory Usage: ${snapshot.usagePercentage.toFixed(1)}%`);
console.log(`Used: ${(snapshot.used / 1024 / 1024).toFixed(2)} MB`);

// Check for potential leaks
const suspiciousArrays = snapshot.objects.filter(obj =>
  obj.type.includes("Array") && obj.count > 10000
);
if (suspiciousArrays.length > 0) {
  console.warn("Potential memory leak detected!");
}
```

**Memory Analysis Tips:**
- Take snapshots at different points in the user journey
- Compare snapshots to identify memory growth
- Watch for unusually high object counts
- Memory usage > 80% indicates potential issues
- Look for detached DOM nodes (memory leaks)

---

### 4. `perf_trace_events` - Performance Timeline

Traces performance timeline events and identifies long tasks that block the main thread.

**Features:**
- Configurable event categories
- Long task detection (>50ms)
- Event categorization and filtering
- Timeline event metadata
- Performance bottleneck identification

**Parameters:**
```typescript
{
  url: string;              // URL to trace
  duration: number;         // Trace duration (ms), range: 1000-60000
  categories?: string[];    // Event categories, default:
                            // ["devtools.timeline", "blink.user_timing", "loading"]
}
```

**Returns:**
```typescript
{
  startTime: number;
  endTime: number;
  duration: number;
  events: Array<{
    type: string;
    timestamp: number;
    duration: number;
    details: Record<string, any>;
    category: string;
  }>;
  categories: string[];
  summary: {
    totalEvents: number;
    byCategory: Record<string, number>;
    longTasks: Array<{
      timestamp: number;
      duration: number;
    }>;
  };
}
```

**Available Categories:**
- `devtools.timeline` - Browser rendering events
- `blink.user_timing` - User timing marks and measures
- `loading` - Resource loading events
- `v8` - JavaScript execution
- `disabled-by-default-devtools.timeline` - Detailed timeline
- `disabled-by-default-v8.cpu_profiler` - V8 profiling

**Usage Example:**
```typescript
const trace = await perfTraceEvents(page, {
  url: "https://example.com",
  duration: 5000,
  categories: ["devtools.timeline", "loading"]
});

// Identify long tasks
console.log(`Long Tasks: ${trace.summary.longTasks.length}`);
trace.summary.longTasks.slice(0, 5).forEach(task => {
  console.log(`  ${task.duration.toFixed(2)}ms @ ${task.timestamp}ms`);
});

// Analyze event distribution
Object.entries(trace.summary.byCategory).forEach(([cat, count]) => {
  console.log(`${cat}: ${count} events`);
});
```

**Long Task Analysis:**
- Tasks > 50ms block user interactions
- Aim for < 5 long tasks during page load
- Break up long tasks into smaller chunks
- Use requestIdleCallback for non-critical work

---

### 5. `perf_lighthouse` - Lighthouse Audit

Runs a comprehensive Lighthouse-style audit covering performance, accessibility, best practices, and SEO.

**Features:**
- Performance scoring based on Core Web Vitals
- Accessibility issue detection
- Best practices validation
- SEO audit
- Mobile and desktop device emulation

**Parameters:**
```typescript
{
  url: string;              // URL to audit
  categories?: Array<       // Categories to audit, default: all
    "performance" | "accessibility" | "best-practices" | "seo" | "pwa"
  >;
  device?: "mobile" | "desktop"; // Device mode, default: "mobile"
}
```

**Returns:**
```typescript
{
  performance: number;      // Score 0-100
  accessibility: number;    // Score 0-100
  bestPractices: number;    // Score 0-100
  seo: number;              // Score 0-100
  pwa?: number;             // Score 0-100 (if included)
  scores: {
    performance: {
      score: number;
      metrics: {
        lcp: number | null;
        fcp: number | null;
        cls: number | null;
        ttfb: number | null;
        tbt: number | null;
      };
    };
    accessibility: {
      score: number;
      issues: Array<{
        id: string;
        title: string;
        description: string;
        impact: "critical" | "serious" | "moderate" | "minor";
      }>;
    };
    bestPractices: {
      score: number;
      audits: Record<string, boolean>;
    };
    seo: {
      score: number;
      audits: Record<string, boolean>;
    };
  };
  timestamp: string;
  url: string;
}
```

**Usage Example:**
```typescript
const audit = await perfLighthouse(page, {
  url: "https://example.com",
  categories: ["performance", "accessibility", "seo"],
  device: "mobile"
});

console.log(`Performance: ${audit.performance}/100`);
console.log(`Accessibility: ${audit.accessibility}/100`);
console.log(`SEO: ${audit.seo}/100`);

// Review accessibility issues
if (audit.scores.accessibility.issues.length > 0) {
  console.log("\nAccessibility Issues:");
  audit.scores.accessibility.issues.forEach(issue => {
    console.log(`  [${issue.impact}] ${issue.title}`);
  });
}

// Check best practices
Object.entries(audit.scores.bestPractices.audits).forEach(([key, passed]) => {
  console.log(`  ${passed ? '✓' : '✗'} ${key}`);
});
```

**Scoring Guidelines:**
- 90-100: Excellent
- 70-89: Good
- 50-69: Needs Improvement
- 0-49: Poor

**Accessibility Checks:**
- Images with missing alt text
- Form inputs without labels
- Proper heading hierarchy
- Color contrast
- ARIA attributes

**Best Practices Checks:**
- HTTPS usage
- Viewport meta tag
- Doctype declaration
- No console errors
- No deprecated APIs

**SEO Checks:**
- Title tag present
- Meta description
- H1 heading
- Robots meta tag
- Canonical link

---

## Integration with MCP Server

To integrate these tools with your MCP server:

```typescript
import { performanceIntelligenceTools } from "./tools/performance-intelligence-tools";

// Register tools with MCP server
for (const tool of performanceIntelligenceTools.metadata) {
  server.addTool({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.schema),
    handler: async (params) => {
      const page = await browserManager.newPage();
      try {
        const validatedParams = tool.schema.parse(params);
        return await tool.handler(page, validatedParams);
      } finally {
        await page.close();
      }
    },
  });
}
```

## Common Use Cases

### 1. Continuous Performance Monitoring
```typescript
// Monitor performance over time
setInterval(async () => {
  const metrics = await perfGetMetrics(page, { url: targetUrl });
  const lighthouse = await perfLighthouse(page, { url: targetUrl });

  // Log or store results
  saveMetrics({ metrics, lighthouse, timestamp: new Date() });
}, 300000); // Every 5 minutes
```

### 2. Performance Regression Detection
```typescript
// Before deployment
const baselineMetrics = await perfGetMetrics(page, { url: stagingUrl });

// After deployment
const currentMetrics = await perfGetMetrics(page, { url: productionUrl });

// Compare
if (currentMetrics.lcp > baselineMetrics.lcp * 1.1) {
  console.warn("LCP regression detected!");
}
```

### 3. Memory Leak Detection
```typescript
// Take initial snapshot
const snapshot1 = await perfSnapshotMemory(page, { url });

// Perform actions
await page.click("#some-button");
await page.waitForTimeout(5000);

// Take second snapshot
const snapshot2 = await perfSnapshotMemory(page, { url });

// Compare memory usage
const memoryGrowth = snapshot2.used - snapshot1.used;
if (memoryGrowth > 10 * 1024 * 1024) { // 10MB
  console.warn("Potential memory leak detected!");
}
```

### 4. Performance Budget Enforcement
```typescript
const budget = {
  lcp: 2500,    // ms
  fcp: 1800,    // ms
  cls: 0.1,
  ttfb: 800,    // ms
};

const metrics = await perfGetMetrics(page, { url });

const violations = [];
if (metrics.lcp && metrics.lcp > budget.lcp) {
  violations.push(`LCP: ${metrics.lcp}ms > ${budget.lcp}ms`);
}
if (metrics.cls && metrics.cls > budget.cls) {
  violations.push(`CLS: ${metrics.cls} > ${budget.cls}`);
}

if (violations.length > 0) {
  throw new Error(`Performance budget violated:\n${violations.join('\n')}`);
}
```

## Troubleshooting

### CDP Connection Issues
If you encounter CDP connection errors:
```typescript
// Ensure browser is launched with CDP enabled
const browser = await chromium.launch({
  args: ['--remote-debugging-port=9222']
});
```

### Memory Snapshot Timeout
For large applications, increase timeout:
```typescript
const snapshot = await perfSnapshotMemory(page, {
  url,
  waitTime: 10000, // Wait longer for app to stabilize
});
```

### CPU Profile Missing Data
Increase sampling rate for better accuracy:
```typescript
const profile = await perfProfileCPU(page, {
  url,
  duration: 10000,        // Longer duration
  samplingInterval: 50,   // Higher frequency
});
```

## Performance Tips

1. **Reuse Browser Instances**: Create one browser instance and reuse pages
2. **Parallel Analysis**: Run independent tools in parallel using Promise.all()
3. **Selective Analysis**: Only run tools you need for your use case
4. **Proper Cleanup**: Always close pages and browsers when done
5. **Resource Limits**: Set appropriate timeouts and durations

## License

MIT License - See main project LICENSE file.

## Contributing

Contributions are welcome! Please see the main project CONTRIBUTING.md for guidelines.
