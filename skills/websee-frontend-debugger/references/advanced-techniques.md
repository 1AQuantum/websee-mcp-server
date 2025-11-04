# WebSee Advanced Techniques

Advanced strategies for maximizing WebSee MCP effectiveness. These techniques combine multiple tools and exploit unique capabilities.

## Technique 1: Cross-Tool Correlation

**Concept**: Use output from one tool as input to another for deep investigation.

### Example: Error → Component → Network Chain

```
Step 1: Get error context
Tool: debug_frontend_issue
Output: {
  "issues": [{
    "type": "error_traced",
    "components": ["UserProfile"],
    "sourceLocation": { "file": "UserProfile.tsx", "line": 87 }
  }]
}

Step 2: Inspect failing component
Tool: inspect_component_state
Input: selector from components array
Output: {
  "props": { "userId": "123" },
  "state": { "user": null, "loading": false, "error": null }
}

Step 3: Find the API call
Tool: trace_network_requests
Input: pattern "/api/users/123"
Output: {
  "requests": [{
    "status": 404,
    "url": "/api/users/123",
    "triggeredBy": { "file": "UserProfile.tsx", "line": 45 }
  }]
}

Conclusion: Component tried to access user data that failed to load (404).
Root cause: User ID 123 doesn't exist.
```

### When to use

- Complex issues with multiple potential causes
- When single tool doesn't provide full picture
- Production errors with unclear context

---

## Technique 2: Temporal Analysis

**Concept**: Use interactions and waitTime to capture state changes over time.

### Example: Track State Evolution

```
Tool: analyze_performance
Parameters: {
  "url": "https://app.com",
  "interactions": [
    { "action": "click", "selector": "#start-process" },
    // WebSee captures state here
    { "action": "wait", "value": "2000" },
    // And here
    { "action": "click", "selector": "#next-step" },
    // And here
  ],
  "metrics": ["network", "components", "memory"]
}
```

**Captures**:
1. Initial state
2. After first interaction
3. After delay (async completion)
4. After second interaction

### Use cases

- Debugging race conditions
- Understanding async workflows
- Tracking memory leaks over time
- Analyzing multi-step processes

---

## Technique 3: Differential Debugging

**Concept**: Compare the same page in different states to find differences.

### Example: Working vs. Broken State

```
# Capture working state
Tool: inspect_component_state
Parameters: {
  "url": "https://app.com?user=working_id",
  "selector": "#checkout"
}
Output: { "state": { "valid": true, "items": 3, "total": 100 } }

# Capture broken state
Tool: inspect_component_state
Parameters: {
  "url": "https://app.com?user=broken_id",
  "selector": "#checkout"
}
Output: { "state": { "valid": false, "items": 0, "total": NaN } }

# Compare
Difference: total is NaN in broken state
Hypothesis: Division by zero when items = 0
```

### Applications

- A/B testing issues
- User-specific bugs
- Environment-specific problems (dev vs. prod)
- Feature flag issues

---

## Technique 4: Bundle Archaeology

**Concept**: Use bundle analysis to understand code organization and find optimizations.

### Example: Finding Duplicate Dependencies

```
Tool: analyze_bundle_size
Parameters: {
  "url": "https://app.com",
  "threshold": 30
}

Output analysis:
- lodash appears in main.js (72 KB)
- lodash appears in vendor.js (72 KB)
- moment appears in main.js (67 KB)

Recommendations:
1. Deduplicate lodash → Save 72 KB
2. Replace moment with date-fns → Save ~50 KB
3. Code split vendor.js → Improve initial load
```

### Advanced bundle patterns

**Pattern 1: Dependency Tree Analysis**
```
1. Run analyze_bundle_size
2. Note all modules > threshold
3. For each large module:
   - Search codebase for imports
   - Identify which components use it
   - Determine if it can be lazy-loaded
```

**Pattern 2: Unused Code Detection**
```
1. Run analyze_bundle_size
2. Cross-reference with trace_network_requests
3. Modules loaded but not triggering network = potentially unused
4. Verify with component inspection
```

---

## Technique 5: Component Hierarchy Mapping

**Concept**: Build complete component tree to understand architecture.

### Example: Map Entire Application

```
Tool: inspect_component_state
Parameters: {
  "url": "https://app.com",
  "selector": "#app",
  "includeChildren": true
}

Output: Complete component tree
{
  "component": { "name": "App" },
  "children": [
    { "name": "Header", "children": [...] },
    { "name": "Router", "children": [
      { "name": "Dashboard", "children": [...] },
      { "name": "UserProfile", "children": [...] }
    ]},
    { "name": "Footer" }
  ]
}

Analysis:
- Total component depth: 8 levels (too deep?)
- UserProfile has 23 children (too many?)
- Identify refactoring opportunities
```

### Use cases

- Architecture review
- Performance optimization (reduce nesting)
- Understanding component relationships
- Planning refactoring

---

## Technique 6: Network Attribution

**Concept**: Map every network request to the component/code that triggered it.

### Example: Build Request Attribution Map

```
Tool: trace_network_requests
Parameters: {
  "url": "https://app.com/dashboard",
  "pattern": "*",
  "waitTime": 10000
}

Output processing:
For each request:
- Group by triggeredBy.file
- Count requests per file
- Calculate total time per file

Result:
{
  "Dashboard.tsx": { requests: 15, totalTime: 3200ms },
  "UserWidget.tsx": { requests: 3, totalTime: 800ms },
  "DataService.ts": { requests: 8, totalTime: 12000ms } // ← Problem!
}
```

### Optimization strategy

1. Identify files making most requests
2. Check if requests can be batched
3. Implement caching where appropriate
4. Use inspect_component_state to verify component triggers

---

## Technique 7: Error Clustering

**Concept**: Group similar errors to find systemic issues.

### Example: Production Error Analysis

```
For each unique error in logs:

1. Tool: resolve_minified_error
   Extract: Original file and line

2. Group by file
   Pattern: Multiple errors in same file = systemic issue

3. Tool: inspect_component_state
   For component with most errors

4. Tool: trace_network_requests
   Check if errors correlate with API failures

Result:
- 80% of errors in ProductList.tsx:87
- All happen after /api/products returns empty array
- Solution: Add null check before .map()
```

### Scaling pattern

```
errors = collect_production_errors()
for error in errors:
    resolution = resolve_minified_error(error)
    cluster_by_file(resolution.sourceLocation.file)

top_files = get_top_5_files()
for file in top_files:
    investigate_with_full_toolset(file)
```

---

## Technique 8: Performance Profiling

**Concept**: Create performance profile using all metrics together.

### Example: Complete Performance Audit

```
# Step 1: Overall metrics
Tool: analyze_performance
Metrics: ALL
Output: Baseline for all metrics

# Step 2: Bundle analysis
Tool: analyze_bundle_size
Output: Code splitting opportunities

# Step 3: Network analysis
Tool: trace_network_requests
Pattern: "*"
Output: All requests with timing

# Step 4: Component analysis
Tool: inspect_component_state
Selector: "#root"
IncludeChildren: true
Output: Component tree depth

# Synthesize
Performance Report:
- Initial load: 4.2s
- Bundle size: 843 KB (recommendation: <500 KB)
- Slow requests: 3 (>1s each)
- Component depth: 12 levels (recommendation: <10)
- Memory: 87 MB (acceptable)

Priority fixes:
1. Split bundle → -400 KB → -1.5s load time
2. Optimize slow requests → -3s
3. Flatten component tree → Better re-render performance
```

---

## Technique 9: User Journey Tracking

**Concept**: Follow complete user workflows with tool combinations.

### Example: Checkout Flow Analysis

```
Journey: Product page → Add to cart → Checkout → Payment

# Stage 1: Product page
Tool: debug_frontend_issue
Url: "https://shop.com/product/123"
Selector: "#add-to-cart"

# Stage 2: Cart interaction
Tool: analyze_performance
Interactions: [
  { "action": "click", "selector": "#add-to-cart" },
  { "action": "navigate", "value": "https://shop.com/cart" }
]

# Stage 3: Cart state
Tool: inspect_component_state
Url: "https://shop.com/cart"
Selector: "#cart"

# Stage 4: Checkout network
Tool: trace_network_requests
Url: "https://shop.com/checkout"
Pattern: "/api/checkout/*"

Result: Complete picture of user journey
- Product page loads in 2.1s
- Add to cart triggers 3 API calls (0.8s total)
- Cart page loads in 1.5s
- Checkout has one slow API call (3.2s) ← Optimization target
```

### Journey patterns

**Authentication flow**: debug → trace → inspect (verify logged in state)
**Form submission**: inspect (validation) → trace (submit) → debug (confirmation)
**Search**: trace (query) → analyze (results rendering) → inspect (result components)

---

## Technique 10: Source Map Verification

**Concept**: Ensure source maps are working correctly before relying on them.

### Verification Process

```
# Test 1: Resolve a known error
Tool: resolve_minified_error
ErrorStack: <known production error>
Expected: Should resolve to exact source file and line

# Test 2: Check component source attribution
Tool: inspect_component_state
Selector: <any component>
Expected: component.source should have file and line

# Test 3: Verify network stack traces
Tool: trace_network_requests
Expected: triggeredBy should have file and line

If any fail:
1. Check source map availability (.map files accessible)
2. Verify source map format (webpack vs. vite)
3. Check CORS headers for source maps
4. Confirm source map paths are correct
```

---

## Technique 11: Comparing Frameworks

**Concept**: Use WebSee to compare framework behavior.

### Example: React vs. Vue Performance

```
# React app
Tool: analyze_performance
Url: "https://react-app.com"
Metrics: ["components", "memory"]
Output: {
  components: { total: 127, deepestNesting: 8 },
  memory: { usedJSHeapSize: "45 MB" }
}

# Vue app (same features)
Tool: analyze_performance
Url: "https://vue-app.com"
Metrics: ["components", "memory"]
Output: {
  components: { total: 93, deepestNesting: 6 },
  memory: { usedJSHeapSize: "38 MB" }
}

Analysis:
- Vue has fewer components for same features
- Vue has shallower nesting
- Vue uses less memory
- Both have similar bundle sizes
```

---

## Technique 12: Progressive Enhancement Testing

**Concept**: Test how app degrades without JavaScript/with slow network.

### Example: JavaScript Dependency Analysis

```
# Step 1: Full functionality
Tool: debug_frontend_issue
Url: "https://app.com"
Output: Baseline with all features working

# Step 2: Simulate slow network
Tool: analyze_performance
Url: "https://app.com"
Interactions: [
  { "action": "wait", "value": "10000" }  // Simulate slow load
]
Expected: Check if app shows loading states correctly

# Step 3: Check critical rendering path
Tool: trace_network_requests
Pattern: "*"
Output: Identify blocking requests

Optimization:
- Move non-critical scripts to async
- Inline critical CSS
- Add loading states
```

---

## Technique 13: Multi-Browser Consistency

**Concept**: Test same page across browsers using BROWSER env var.

### Example: Cross-Browser Bug Hunting

```
# Test in Chromium
BROWSER=chromium
Tool: debug_frontend_issue
Url: "https://app.com"
Result: Works fine

# Test in Firefox
BROWSER=firefox
Tool: debug_frontend_issue
Url: "https://app.com"
Result: Error with CSS Grid

# Test in WebKit
BROWSER=webkit
Tool: debug_frontend_issue
Url: "https://app.com"
Result: Error with Flexbox

Conclusion: CSS compatibility issues in Firefox and Safari
```

---

## Technique 14: API Contract Validation

**Concept**: Verify API responses match frontend expectations.

### Example: Type Safety Check

```
# Step 1: Capture API response
Tool: trace_network_requests
Url: "https://app.com"
Pattern: "/api/users/*"
Output: { "data": { "id": "123", "name": "John" } }

# Step 2: Check component expectations
Tool: inspect_component_state
Selector: "#user-profile"
Output: {
  "props": { "user": { "id": string, "name": string, "email": string } }
}

# Step 3: Identify mismatch
API returns: id, name
Component expects: id, name, email ← Missing field!

# Step 4: Debug the error
Tool: resolve_minified_error
ErrorStack: "Cannot read property 'email' of undefined"
Result: Confirms email is missing
```

---

## Tool Combination Matrix

Best tool combinations for common tasks:

| Task | Tool 1 | Tool 2 | Tool 3 |
|------|--------|--------|--------|
| Debug error | resolve_minified_error | inspect_component_state | trace_network_requests |
| Optimize performance | analyze_performance | analyze_bundle_size | trace_network_requests |
| Understand architecture | inspect_component_state | analyze_bundle_size | - |
| Fix user flow | debug_frontend_issue | trace_network_requests | inspect_component_state |
| Production debugging | resolve_minified_error | debug_frontend_issue | trace_network_requests |
| Memory leak | analyze_performance | inspect_component_state | debug_frontend_issue |
| Slow page load | analyze_performance | analyze_bundle_size | trace_network_requests |
| Wrong data display | inspect_component_state | trace_network_requests | - |

---

## Advanced Parameter Usage

### Using Interactions for Complex Scenarios

```typescript
// Simulate complete user workflow
{
  "interactions": [
    // Login
    { "action": "type", "selector": "#username", "value": "test@example.com" },
    { "action": "type", "selector": "#password", "value": "password123" },
    { "action": "click", "selector": "#login-button" },

    // Wait for auth
    { "action": "wait", "value": "2000" },

    // Navigate to feature
    { "action": "navigate", "value": "https://app.com/dashboard" },

    // Trigger action
    { "action": "click", "selector": "#load-data" },

    // Wait for data
    { "action": "wait", "value": "3000" },

    // Scroll to see all content
    { "action": "scroll" }
  ]
}
```

### Using Patterns for Precise Filtering

```typescript
// Match specific API versions
{ "pattern": "/api/v2/*" }

// Match file types
{ "pattern": "*.json" }

// Match GraphQL
{ "pattern": "*graphql*" }

// Match multiple patterns (run tool multiple times)
["/api/users/*", "/api/posts/*", "/api/comments/*"]
```

### Using Thresholds Strategically

```typescript
// Development: Flag anything >30 KB
{ "threshold": 30 }

// Production: Only flag >100 KB
{ "threshold": 100 }

// Aggressive optimization: Flag >10 KB
{ "threshold": 10 }
```

---

## Performance Optimization Workflow

Complete workflow using all techniques:

```
1. BASELINE
   → analyze_performance (all metrics)
   → Record: Load time, bundle size, memory, requests

2. IDENTIFY BOTTLENECKS
   → analyze_bundle_size (threshold: 50)
   → trace_network_requests (find >1s)
   → inspect_component_state (root, includeChildren)

3. PRIORITIZE
   → Largest impact first
   → Quick wins (lazy loading, code splitting)
   → Long-term (architecture changes)

4. IMPLEMENT FIXES
   → Code changes based on findings

5. VERIFY
   → analyze_performance (same params as baseline)
   → Compare: Before vs. After
   → Repeat for each fix

6. REGRESSION TESTING
   → debug_frontend_issue (verify no new errors)
   → inspect_component_state (verify components still work)
   → trace_network_requests (verify requests still fire)
```

---

## Edge Cases and Limitations

### What WebSee Can't Do

❌ Modify code automatically
❌ Fix bugs for you
❌ Test without accessible URL
❌ Debug server-side code
❌ Access authenticated pages without credentials

### Workarounds

**Authentication**: Use interactions to log in first
**Server-side**: Use trace_network_requests to see API behavior
**Local development**: Use localhost URLs
**Private networks**: Run WebSee on same network

---

## Expert Tips

1. **Always start broad, then narrow**: debug_frontend_issue → specific tool
2. **Use screenshots for visual bugs**: Seeing is understanding
3. **Wait for async**: Adjust waitTime for slow networks/APIs
4. **Check parent components**: Child issues often caused by parent
5. **Correlate timestamps**: Match network timing with component renders
6. **Test in production**: Source maps work in production too
7. **Use specific selectors**: ID > class > tag name
8. **Check all browsers**: Set BROWSER env var
9. **Monitor memory over time**: Use interactions with delays
10. **Batch investigations**: Run multiple tools in parallel

---

## grep_patterns

Search patterns for finding advanced techniques:

- All techniques: `^## Technique \d+:`
- Tool combinations: `^## Tool Combination Matrix`
- Performance workflows: `^## Performance Optimization Workflow`
- Expert tips: `^## Expert Tips`
