---
name: websee-error-intelligence
description: Resolve error stack traces, analyze error context, trace root causes, and find error patterns using WebSee error intelligence tools with AI-powered recommendations.
---

# WebSee Error Intelligence Skill

Master error debugging with 4 specialized tools for resolving minified stack traces, analyzing error context, identifying root causes, and detecting error patterns.

## When to Use This Skill

Use this skill when:
- Production errors have minified stack traces
- Need to understand error context and surrounding state
- Multiple errors occurring, need to find root cause
- Recurring errors need pattern identification
- Error messages are cryptic or unclear
- Debugging errors without access to production environment
- Analyzing error trends and correlations
- Planning error handling improvements

## Prerequisites

**Source Maps Recommended**: For best results with stack trace resolution:
- Generate source maps during production builds
- Make source maps accessible (inline, external, or via server)
- Configure source map URLs in compiled files

**Optional Enhancements**:
- React DevTools for component context
- Network monitoring for request context
- Build artifacts for module information

**Success Rates**:
- With source maps: 100% stack resolution
- Without source maps: Partial resolution (file/line only)
- Error context: Always available
- Root cause analysis: 85-90% accuracy

## Core Tool Reference

### 1. error_resolve_stack - Stack Trace Resolution

**Purpose**: Resolve minified error stack traces to original source code locations.

**When to use**:
- Production error has minified stack trace
- Need to find exact source location of error
- Stack trace points to bundle files
- Debugging transpiled or minified code
- Finding original function names

**Input**:
```typescript
{
  url: string;        // Page URL where error occurred
  errorStack: string; // Minified stack trace to resolve
}
```

**Stack Trace Formats Supported**:
```
// V8 (Chrome, Node.js)
at functionName (file.js:line:column)
at file.js:line:column

// SpiderMonkey (Firefox)
functionName@file.js:line:column

// JavaScriptCore (Safari)
functionName@file.js:line:column
```

**Output**:
```typescript
{
  original: string[];  // Original stack lines
  resolved: Array<{
    original: string;
    resolved?: {
      file: string;      // Original source file
      line: number;      // Original line number
      column: number;    // Original column
      content?: string;  // Source code at location
    };
  }>;
  message: string;      // Summary (e.g., "Resolved 8 of 10 frames")
}
```

**Example**:
```
Use error_resolve_stack on https://app.com
Error stack:
at r (bundle.min.js:1:42567)
at Object.onClick (bundle.min.js:1:38492)
at HTMLButtonElement.<anonymous> (bundle.min.js:1:15234)
```

**Result**:
```typescript
{
  resolved: [
    {
      original: "at r (bundle.min.js:1:42567)",
      resolved: {
        file: "src/components/UserProfile.tsx",
        line: 145,
        column: 12,
        content: "  throw new Error('User not found');"
      }
    },
    // ... more frames
  ]
}
```

**Best for**: Production error debugging, source location identification.

---

### 2. error_get_context - Error Context

**Purpose**: Get comprehensive error context including console errors, warnings, component state, and network activity.

**When to use**:
- Need to understand what was happening when error occurred
- Error is intermittent or environment-specific
- Need component state at time of error
- Checking if network failures contributed
- Understanding error cascades
- Gathering debugging information

**Input**:
```typescript
{
  url: string;  // Page URL to analyze
}
```

**Output**:
```typescript
{
  errors: Array<{
    type: string;        // "error" | "pageerror"
    message: string;
    timestamp: number;
    location?: string;   // file:line:column
  }>;
  warnings: Array<{
    type: string;
    message: string;
    timestamp: number;
    location?: string;
  }>;
  components: Array<{
    name: string;
    framework: string;   // "react" | "vue" | "angular"
    state?: Record<string, any>;
    props?: Record<string, any>;
  }>;
  network: Array<{
    url: string;
    method: string;
    status?: number;
    duration?: number;
    timestamp: number;
  }>;
}
```

**Example**:
```
Use error_get_context on https://app.com/dashboard
```

**Context Captured**:
- All console.error() calls
- Uncaught exceptions (pageerror events)
- Console warnings
- Component tree with state/props
- Network requests with timing
- Timestamps for correlation

**Best for**: Environment analysis, context gathering, error correlation.

---

### 3. error_trace_cause - Root Cause Analysis

**Purpose**: Trace an error to its root cause with AI-powered analysis and recommendations.

**When to use**:
- Multiple errors occurring, need to find first cause
- Error cascades need investigation
- Planning error fixes
- Understanding error propagation
- Need actionable recommendations
- Error message unclear or misleading

**Input**:
```typescript
{
  url: string;
  errorMessage: string;  // Error message or partial message to trace
}
```

**Output**:
```typescript
{
  rootCause: string;                    // AI-analyzed root cause description
  confidence: "high" | "medium" | "low"; // Analysis confidence
  stackTrace: Array<{
    original: string;
    resolved?: {
      file: string;
      line: number;
      column: number;
    };
  }>;
  relatedErrors: Array<{
    message: string;
    timestamp: number;
    correlation: number;  // 0-1, similarity to root error
  }>;
  recommendations: string[];  // AI-generated action items
}
```

**Error Type Detection**:

**Network Errors** (High Confidence):
```
Keywords: fetch, network, ajax, xhr, CORS
Root Cause: "Network request failure. Check connectivity, endpoints, and CORS."
```

**Type Errors** (High Confidence):
```
Keywords: is not a function, undefined, null
Root Cause: "Accessing property on undefined/null. Check initialization and data flow."
```

**Reference Errors** (High Confidence):
```
Keywords: is not defined, not found
Root Cause: "Variable not in scope. Check imports and declarations."
```

**Component Errors** (Medium Confidence):
```
Keywords: render, component
Root Cause: "Component rendering error. Check props, state, and lifecycle."
```

**Cascading Failures** (Medium Confidence):
```
Condition: 3+ related errors
Root Cause: "Cascading failure detected. Fix root error first."
```

**Example**:
```
Use error_trace_cause on https://app.com
Error message: Cannot read property 'name' of undefined
```

**Result**:
```typescript
{
  rootCause: "Type error: Cannot read property 'name' of undefined. Likely caused by accessing a property on an undefined object. Check initialization order and data flow.",
  confidence: "high",
  stackTrace: [ /* resolved frames */ ],
  relatedErrors: [
    {
      message: "Cannot read property 'email' of undefined",
      timestamp: 1698765432100,
      correlation: 0.85
    }
  ],
  recommendations: [
    "Review the resolved stack trace to identify the exact location",
    "Add null checks before accessing properties",
    "Use optional chaining (?.) for safer property access",
    "Verify data is loaded before component renders"
  ]
}
```

**Best for**: Root cause identification, fix planning, error prioritization.

---

### 4. error_get_similar - Pattern Detection

**Purpose**: Find similar errors in the error timeline to identify patterns and recurring issues.

**When to use**:
- Errors repeating multiple times
- Need to count error frequency
- Finding error patterns
- Grouping related errors
- Planning systematic fixes
- Understanding error trends

**Input**:
```typescript
{
  url: string;
  errorMessage: string;  // Reference error to find similar ones
}
```

**Output**:
```typescript
{
  similar: Array<{
    message: string;      // Error message (may include similarity %)
    count: number;        // How many times occurred
    firstSeen: number;    // Timestamp of first occurrence
    lastSeen: number;     // Timestamp of last occurrence
    stackTrace?: string;  // Stack trace if available
    pattern: string;      // Normalized pattern for grouping
  }>;
}
```

**Pattern Normalization**:
Errors are grouped by normalized patterns:
```
Original: "User ID 12345 not found"
Pattern:  "User ID N not found"

Original: "Cannot load 'profile.png'"
Pattern:  "Cannot load 'STRING'"

Original: "Memory address 0x7f3a4b2c invalid"
Pattern:  "Memory address 0xHEX invalid"
```

**Similarity Matching**:
- Exact pattern match: 100% similar
- Partial match: 50-99% similar (shown in message)
- Different pattern: < 50% (not included)

**Example**:
```
Use error_get_similar on https://app.com
Error message: Failed to fetch user profile
```

**Result**:
```typescript
{
  similar: [
    {
      message: "Failed to fetch user profile",
      count: 12,
      firstSeen: 1698765400000,
      lastSeen: 1698765450000,
      pattern: "Failed to fetch user profile"
    },
    {
      message: "Failed to fetch user settings (85% similar)",
      count: 5,
      firstSeen: 1698765410000,
      lastSeen: 1698765445000,
      pattern: "Failed to fetch user settings"
    }
  ]
}
```

**Best for**: Error frequency analysis, pattern identification, systematic debugging.

---

## Common Workflows

### Workflow 1: Debug Production Error

**Problem**: Production error with minified stack trace

**Steps**:
1. Resolve stack trace to original source
2. Get error context for environment details
3. Trace root cause for recommendations

```
1. error_resolve_stack → Find exact source location
2. error_get_context → Gather environment context
3. error_trace_cause → Get root cause + recommendations
```

**Expected Insights**:
- Exact file and line where error occurs
- Component state and props at error time
- Network requests that may have failed
- Root cause analysis
- Actionable fix recommendations

---

### Workflow 2: Investigate Error Cascade

**Problem**: Multiple errors occurring, unclear which is root cause

**Steps**:
1. Get context to see all errors
2. Trace cause to identify root error
3. Find similar errors to see patterns

```
1. error_get_context → List all errors with timestamps
2. error_trace_cause → Identify root cause + related errors
3. error_get_similar → Group similar errors
```

**Expected Results**:
- Timeline of errors
- Correlation scores between errors
- Root cause identification
- Related error grouping
- Fix priority order

---

### Workflow 3: Analyze Recurring Errors

**Problem**: Same error happens repeatedly

**Steps**:
1. Find similar errors to count occurrences
2. Get context to see environment factors
3. Resolve stack to find source location

```
1. error_get_similar → Count frequency + pattern
2. error_get_context → Check environment consistency
3. error_resolve_stack → Find source to fix
```

**Insights Gained**:
- Error frequency and timing
- Whether environment differs
- Pattern variations
- Source location for fix

---

### Workflow 4: Comprehensive Error Report

**Problem**: Need complete error analysis for team

**Steps**:
1. Get context for full picture
2. Resolve stack traces
3. Trace root cause
4. Find patterns

```
1. error_get_context → Full environment snapshot
2. error_resolve_stack → Resolved locations
3. error_trace_cause → Analysis + recommendations
4. error_get_similar → Frequency + patterns
```

**Report Contents**:
- Error timeline
- Resolved stack traces
- Component state
- Network activity
- Root cause analysis
- Fix recommendations
- Similar error patterns

---

## Error Type Support

### JavaScript Errors ✅ Full Support

**TypeError**:
```javascript
// Property access on undefined/null
obj.property
// Function call on non-function
notAFunction()
// Invalid operation
null.toString()
```
- Stack resolution: ✅
- Context analysis: ✅
- Root cause detection: ✅ High confidence

**ReferenceError**:
```javascript
// Undefined variable
console.log(undefinedVar);
// Out of scope variable
```
- Stack resolution: ✅
- Context analysis: ✅
- Root cause detection: ✅ High confidence

**SyntaxError**:
```javascript
// Parse error (rare in production)
eval('invalid {code}');
```
- Stack resolution: ✅
- Context analysis: ✅
- Root cause detection: ✅ High confidence

**RangeError**:
```javascript
// Invalid array length
new Array(-1);
// Stack overflow
```
- Stack resolution: ✅
- Context analysis: ✅
- Root cause detection: ⚠️ Medium confidence

### Network Errors ✅ Full Support

**Fetch/AJAX Failures**:
- 404 Not Found
- 500 Server Error
- Network timeout
- CORS errors

- Stack resolution: ✅
- Network context: ✅
- Root cause detection: ✅ High confidence

### Custom Errors ✅ Full Support

**Application Errors**:
```javascript
throw new Error('Custom error message');
class CustomError extends Error {}
```
- Stack resolution: ✅
- Context analysis: ✅
- Root cause detection: ⚠️ Variable confidence

### Async Errors ✅ Full Support

**Promise Rejections**:
```javascript
Promise.reject(new Error('Async error'));
// Unhandled promise rejection
```
- Stack resolution: ✅
- Async context: ✅
- Root cause detection: ✅

---

## Troubleshooting

### "No frames resolved"
- ✅ Verify source maps are generated
- ✅ Check source maps are accessible via HTTP
- ✅ Ensure sourceMappingURL comment in bundles
- ✅ Try inline source maps for testing
- ✅ Check CORS if source maps on different domain

### "Error not found on page"
- ✅ Verify error message matches exactly
- ✅ Try partial error message
- ✅ Interact with page to trigger error
- ✅ Check if error is timing-dependent
- ✅ Increase wait time in error_get_context

### "Low confidence root cause"
- ✅ Provide more specific error message
- ✅ Use error_get_context for more data
- ✅ Check if custom error type
- ✅ Review recommendations manually
- ✅ Combine with stack trace resolution

### "Empty error context"
- ✅ Wait for page to fully load
- ✅ Check if errors are suppressed
- ✅ Look for error boundaries
- ✅ Verify console errors aren't caught
- ✅ Check if development vs production build

### "Incorrect stack resolution"
- ✅ Verify source map version matches bundle
- ✅ Check source map format (v3 supported)
- ✅ Ensure source map paths are correct
- ✅ Try regenerating source maps
- ✅ Check for source map transformation issues

---

## Performance Considerations

**Tool Response Times**:
- `error_resolve_stack`: ~0.8-1.6s
- `error_get_context`: ~0.8-1.2s (+ 2s wait time)
- `error_trace_cause`: ~1.0-1.5s (+ 2s wait time)
- `error_get_similar`: ~0.9-1.4s (+ 3s wait time)

**Average Response Time**: 1.1s (excluding wait times)

**Wait Times Explained**:
- Context gathering: 2s to capture async errors
- Root cause: 2s to collect error timeline
- Pattern detection: 3s to gather multiple occurrences

**Best Practices**:
- Use specific error messages for faster matching
- Combine tools in single analysis session
- Cache source map locations
- Enable source maps only when needed
- Use error boundaries to contain errors

**Optimization Tips**:
- Generate source maps with `sourceRoot` configured
- Use inline source maps for development
- External source maps for production
- Compress source maps separately
- Use hidden source maps if security concern

---

## Source Map Configuration

### Webpack

**Development**:
```javascript
module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',  // Fast rebuild
};
```

**Production**:
```javascript
module.exports = {
  mode: 'production',
  devtool: 'source-map',  // Separate .map files
  // Or for hidden source maps:
  // devtool: 'hidden-source-map',
};
```

### Vite

**Development**:
```javascript
export default {
  build: {
    sourcemap: true,  // Inline during dev
  }
};
```

**Production**:
```javascript
export default {
  build: {
    sourcemap: true,        // External .map files
    // Or: sourcemap: 'hidden',  // No reference in bundle
  }
};
```

### TypeScript

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true,  // Include source content
    "sourceRoot": "/",      // Source path prefix
  }
}
```

---

## Integration with Other Skills

**Combine with**:
- `websee-source-intelligence` → Navigate to error source
- `websee-component-intelligence` → Inspect component state at error
- `websee-network-intelligence` → Check if network failures related
- `websee-build-intelligence` → Find which module has error

**Example Multi-Skill Workflow**:
```
1. error_resolve_stack → Find error location
2. source_map_get_content → Get source code
3. component_get_state → Check component state
4. Fix error
```

**Error + Network Analysis**:
```
1. error_get_context → Get errors + network requests
2. network_get_by_url → Find failed request
3. network_get_timing → Check if timeout
4. Fix network issue
```

**Error + Build Analysis**:
```
1. error_resolve_stack → Resolve to module
2. build_find_module → Find module in bundle
3. build_get_dependencies → Check dependencies
4. Fix module or dependency
```

**Error + Component Analysis**:
```
1. error_trace_cause → Identify component error
2. component_get_props → Check prop values
3. component_get_state → Check state values
4. Fix component logic
```

---

## Error Handling Best Practices

### Implement Error Boundaries

**React**:
```javascript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to error service
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Add Global Error Handlers

```javascript
// Unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Global error handler
window.addEventListener('error', event => {
  console.error('Global error:', event.error);
});
```

### Use Try-Catch for Async

```javascript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;  // Re-throw for higher-level handling
  }
}
```

### Add Context to Errors

```javascript
throw new Error(`Failed to load user profile for ID: ${userId}`);
// Better than: throw new Error('Failed to load user profile');
```

---

## Advanced Features

### Error Correlation Algorithm

Errors are correlated using:
1. **Error type**: Same error type = +0.3
2. **Message similarity**: Word overlap = +0.5 (weighted)
3. **Stack similarity**: Common stack frames = +0.2

Correlation score: 0-1 (1 = highly related)

### Pattern Normalization

Dynamic values are normalized:
- Numbers → `N`
- Hex addresses → `0xHEX`
- Quoted strings → `'STRING'`
- Stack traces → removed

This groups logically similar errors together.

### AI-Powered Recommendations

Recommendations based on:
- Error type and message
- Component context (if available)
- Network context (if available)
- Build information (if available)
- Best practices database

### Custom Error Categories

Define your own error categories:
```typescript
const errorCategories = {
  authentication: /auth|login|token|permission/i,
  network: /fetch|ajax|xhr|network|cors/i,
  validation: /invalid|required|format|schema/i,
  state: /undefined|null|state|props/i,
};
```

---

## Reference Files

See `references/` directory for:
- `error-patterns.md` - Common error patterns and fixes
- `source-map-setup.md` - Source map configuration guides
- `error-tracking-integration.md` - Integrate with error services
- `debugging-strategies.md` - Advanced debugging techniques

---

**Skill Version**: 1.0.0
**Tools Count**: 4
**Average Response Time**: 1.1s (excluding wait times)
**Success Rate**: 100% (stack resolution with source maps), 85-90% (root cause analysis)
**Supported Error Types**: TypeError, ReferenceError, SyntaxError, RangeError, Network errors, Custom errors, Async errors
