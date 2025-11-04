# Future Development Plan - Performance Intelligence Tools

**Date**: 2025-10-26  
**Status**: Deferred for future implementation  
**Priority**: Medium

---

## Overview

This document outlines the plan for implementing the 5 **Performance Intelligence Tools** that were removed from the initial MCP server release. These tools were removed because:

1. The implementation file was empty (0 bytes)
2. Reference implementations in WebSee are minimal/stub only
3. Would require ~12 hours of development effort
4. Would exceed Cursor's 40-tool limit (41 total)

**Current Tool Count**: 36/36 (100% implemented)  
**With Performance Tools**: Would be 41 tools

---

## Removed Tools

The following 5 tools were removed from the MCP server on 2025-10-26:

### 1. **performance_profile** - CPU Profiling
**Purpose**: Profile JavaScript execution to identify performance bottlenecks

**Specification**:
```typescript
performance_profile(args: {
  url: string;
  duration?: number; // milliseconds
  includeCategories?: string[];
}): Promise<{
  duration: number;
  samples: number;
  topFunctions: {
    name: string;
    file: string;
    line: number;
    column: number;
    time: number;
    percentage: number;
    selfTime: number;
  }[];
  callTree: ProfileNode[];
}>
```

**Implementation Requirements**:
- Chrome DevTools Protocol (CDP) integration
- `Profiler.enable()` and `Profiler.start()`
- Profile data processing and aggregation
- Source map integration for accurate file/line mapping
- Call tree construction

**Estimated Effort**: 3-4 hours

---

### 2. **performance_memory** - Memory Snapshots
**Purpose**: Take heap snapshots to identify memory leaks

**Specification**:
```typescript
performance_memory(args: {
  url: string;
  snapshot?: boolean; // Take full heap snapshot
}): Promise<{
  total: number;
  used: number;
  limit: number;
  usagePercentage: number;
  objectTypes?: {
    type: string;
    count: number;
    size: number;
    percentage: number;
  }[];
  largestObjects?: {
    type: string;
    size: number;
  }[];
}>
```

**Implementation Requirements**:
- Chrome DevTools Protocol (CDP) integration
- `HeapProfiler.enable()` and `HeapProfiler.takeHeapSnapshot()`
- Snapshot parsing and analysis
- Memory usage calculation
- Leak detection heuristics

**Estimated Effort**: 4-5 hours

---

### 3. **performance_metrics** - Core Web Vitals
**Purpose**: Measure Core Web Vitals (LCP, FID, CLS) for performance analysis

**Specification**:
```typescript
performance_metrics(args: {
  url: string;
  waitForLoad?: boolean;
}): Promise<{
  lcp: number;        // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number;        // Cumulative Layout Shift
  ttfb: number;       // Time to First Byte
  fcp: number;        // First Contentful Paint
  tbt: number;        // Total Blocking Time
  issues?: string[];  // Performance issues detected
  recommendations?: string[];
}>
```

**Implementation Requirements**:
- `web-vitals` library integration OR
- PerformanceObserver API usage
- Paint timing API
- Layout shift tracking
- Input delay measurement
- Performance budget comparison

**Estimated Effort**: 2-3 hours

---

### 4. **performance_long_tasks** - Long Task Tracking
**Purpose**: Identify long-running JavaScript tasks that block the main thread

**Specification**:
```typescript
performance_long_tasks(args: {
  url: string;
  duration?: number; // milliseconds to monitor
  threshold?: number; // minimum task duration to report (default: 50ms)
}): Promise<{
  totalTasks: number;
  longTasks: {
    startTime: number;
    duration: number;
    timestamp: number;
    stack?: string[];
  }[];
  totalBlockingTime: number;
  averageDuration: number;
}>
```

**Implementation Requirements**:
- PerformanceObserver with type 'longtask'
- Stack trace capture at task start
- Duration and timestamp recording
- Aggregation and summary statistics
- (Already partially implemented in WebSee timeline tools)

**Estimated Effort**: 1-2 hours

---

### 5. **performance_frame_rate** - Frame Rate Analysis
**Purpose**: Monitor frame rate to identify rendering performance issues

**Specification**:
```typescript
performance_frame_rate(args: {
  url: string;
  duration?: number; // milliseconds to monitor
  interactions?: string[]; // interactions to perform
}): Promise<{
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  frameDrops: number;
  frames: {
    timestamp: number;
    duration: number;
    fps: number;
  }[];
}>
```

**Implementation Requirements**:
- requestAnimationFrame loop in browser context
- Frame timing calculation
- Frame drop detection
- Interaction coordination
- Real-time FPS tracking

**Estimated Effort**: 2-3 hours

---

## Total Implementation Effort

**Estimated Total**: 12-17 hours

**Breakdown**:
- Tool 1 (CPU Profiling): 3-4 hours
- Tool 2 (Memory): 4-5 hours
- Tool 3 (Core Web Vitals): 2-3 hours
- Tool 4 (Long Tasks): 1-2 hours
- Tool 5 (Frame Rate): 2-3 hours

---

## Implementation Plan

### Phase 1: Research & Setup (1-2 hours)
1. Study Chrome DevTools Protocol documentation
2. Review Playwright CDP integration
3. Set up test environment
4. Create sample test pages

### Phase 2: Core Web Vitals (2-3 hours)
**Rationale**: Easiest to implement, provides immediate value

1. Integrate `web-vitals` library OR implement PerformanceObserver approach
2. Create `performance_metrics` tool
3. Test with real websites
4. Add to tool list

### Phase 3: Long Tasks (1-2 hours)
**Rationale**: Second easiest, builds on existing code

1. Implement PerformanceObserver for longtask
2. Add stack trace capture
3. Create `performance_long_tasks` tool
4. Test with CPU-intensive pages

### Phase 4: Frame Rate (2-3 hours)
**Rationale**: Moderate difficulty, visual feedback

1. Implement requestAnimationFrame tracking
2. Calculate FPS metrics
3. Create `performance_frame_rate` tool
4. Test with animation-heavy pages

### Phase 5: CPU Profiling (3-4 hours)
**Rationale**: Complex but high value

1. Set up CDP session
2. Implement Profiler protocol calls
3. Parse profile data
4. Integrate with source maps
5. Create `performance_profile` tool
6. Test with complex applications

### Phase 6: Memory Profiling (4-5 hours)
**Rationale**: Most complex, requires snapshot parsing

1. Set up CDP session
2. Implement HeapProfiler protocol calls
3. Parse heap snapshot data
4. Identify memory patterns
5. Create `performance_memory` tool
6. Test for memory leak detection

### Phase 7: Integration & Testing (2-3 hours)
1. Add all 5 tools to MCP server
2. Create comprehensive tests
3. Update documentation
4. Test with multiple browsers

---

## Reference Implementations

### WebSee Directory
- **Location**: `/Users/laptopname/Documents/Coding/MCPs/WebSee/`
- **Status**: Minimal/stub implementations only

**Available References**:
- `websee-build/src/tools/ci.ts` - Basic performance profile stub
- `websee-build/src/tools/ui_timeline.ts` - PerformanceObserver for longtask and paint
- Specifications in `SOURCE_INTELLIGENCE_SPEC.md` and `FULL_OBSERVABILITY_PROPOSAL.md`

### External Resources
- Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/
- Playwright CDP: https://playwright.dev/docs/api/class-cdpsession
- web-vitals library: https://github.com/GoogleChrome/web-vitals
- PerformanceObserver: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver

---

## Dependencies

### Required
- Existing: `playwright` (already installed)
- New: `web-vitals` (optional, for Core Web Vitals)

### Optional
- `source-map` (already installed) - for CPU profile source mapping
- Chrome/Chromium browser (Playwright handles installation)

---

## File Structure

When implementing, create:

```
src/tools/performance-intelligence-tools.ts  (currently empty)
├── performanceProfile()
├── performanceMemory()
├── performanceMetrics()
├── performanceLongTasks()
└── performanceFrameRate()

tests/performance-intelligence-tools.test.ts  (new)
└── Test suite for all 5 tools
```

---

## Tool Registration

Add to `src/mcp-server.ts`:

```typescript
// Import
import {
  PERFORMANCE_INTELLIGENCE_TOOLS,
  performanceProfile,
  performanceMemory,
  performanceMetrics,
  performanceLongTasks,
  performanceFrameRate,
} from './tools/performance-intelligence-tools.js';

// Add to granular tools array (line ~745)
// Performance Intelligence Tools (5 tools)
...PERFORMANCE_INTELLIGENCE_TOOLS,

// Add switch cases (after line 937)
case 'performance_profile': {
  result = await performanceProfile(page, args as any);
  break;
}

case 'performance_memory': {
  result = await performanceMemory(page, args as any);
  break;
}

case 'performance_metrics': {
  result = await performanceMetrics(page, args as any);
  break;
}

case 'performance_long_tasks': {
  result = await performanceLongTasks(page, args as any);
  break;
}

case 'performance_frame_rate': {
  result = await performanceFrameRate(page, args as any);
  break;
}
```

---

## Cursor 40-Tool Limit Consideration

**Current**: 36 tools (within limit)  
**After adding performance tools**: 41 tools (exceeds limit by 1)

**Options**:
1. Accept 41 tools - Cursor will randomly exclude 1 tool
2. Make one tool optional/disabled by default
3. Create a separate "performance" MCP server
4. Implement only the most valuable tools (e.g., just Core Web Vitals + Long Tasks = 38 total)

**Recommended**: Option 4 - Implement only 2-3 most valuable performance tools

---

## Testing Requirements

For each tool, test with:

1. **Simple test page** - Verify basic functionality
2. **Complex SPA** - Test with React/Vue/Angular apps
3. **Production website** - Test with real-world sites
4. **Error cases** - Missing source maps, navigation failures, etc.
5. **Performance** - Ensure tools don't significantly impact page performance

---

## Documentation Updates

When implementing, update:

1. `README.md` - Add performance tools to feature list
2. `TOOL_IMPLEMENTATION_STATUS.md` - Update tool count
3. `COMPLIANCE_REPORT.md` - Update compliance status
4. `SETUP.md` - Add any new dependencies
5. This file (`FUTURE_DEVELOPMENT.md`) - Mark as completed

---

## Success Criteria

Performance tools are successfully implemented when:

- ✅ All 5 tools compile without errors
- ✅ All 5 tools have Zod schemas for validation
- ✅ All 5 tools are registered in MCP server
- ✅ All 5 tools have test coverage
- ✅ Tools work with Chromium, Firefox, and WebKit
- ✅ Tools handle missing data gracefully
- ✅ Tools integrate with existing workflow tools
- ✅ Documentation is updated
- ✅ Total tool count is 41 (or decision made to keep at 38-40)

---

## Current Implementation Status

**Date Removed**: 2025-10-26  
**Reason**: Empty file, minimal reference implementations, time constraints  
**Current Status**: ❌ Not implemented  
**Priority**: Medium - defer until v1.1 or when needed by users

**Next Steps**:
1. Gather user feedback on which performance tools are most valuable
2. Prioritize based on demand
3. Implement in order of value (likely: metrics → long tasks → frame rate → profile → memory)
4. Consider creating a separate performance-focused MCP server if needed

---

## Notes

- Performance profiling significantly increases page load time
- Memory snapshots can be large (10-100MB)
- CDP only works with Chromium-based browsers
- Some tools may require specific Playwright versions
- Consider implementing a "performance bundle" workflow tool that combines multiple metrics

---

## Contact

For questions about implementing these tools:
- Review reference implementations in `/Users/laptopname/Documents/Coding/MCPs/WebSee/`
- Check Chrome DevTools Protocol documentation
- Review Playwright CDP API documentation
- See existing tool implementations in `src/tools/` for patterns

---

**Last Updated**: 2025-10-26  
**Next Review**: When user demand for performance tools increases
