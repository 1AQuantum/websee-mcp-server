---
name: websee-frontend-debugger
description: Debug frontend applications with source-level intelligence using WebSee MCP tools (36 tools). Resolve minified errors, inspect component state, trace network requests, and analyze bundle size with workflow and granular debugging tools.
---

# WebSee Frontend Debugger Skill

Use the WebSee MCP server to debug frontend applications with source-level intelligence, transforming cryptic minified errors into actionable insights. This skill provides access to 36 specialized tools organized in two layers for comprehensive frontend debugging.

## When to Use This Skill

Use this skill when:
- Debugging production errors in minified JavaScript
- Investigating why a React/Vue/Angular component is failing
- Finding which code triggered slow API requests
- Analyzing JavaScript bundle size and identifying bloat
- Understanding the full context of a frontend error
- Tracing user interactions through component state changes

## Core Debugging Workflow

### 1. Start with Comprehensive Debugging

For general frontend issues, begin with `debug_frontend_issue`:

```
Use debug_frontend_issue to investigate https://example.com
Focus on the login form, selector: #login-form
Capture a screenshot to see the current state
```

This tool provides:
- Console errors and warnings
- Component state at the problem location
- Recent network activity
- Full error context with source maps

**When to use**: Initial investigation, unclear symptoms, or multiple potential issues.

### 2. Deep-Dive Tools for Specific Issues

Once you identify the problem type, use specialized tools:

#### For Component State Issues

Use `inspect_component_state` when you need detailed component analysis:

```
Use inspect_component_state on https://app.com
Target selector: #user-dashboard
Include child components to see the full tree
```

**Returns**: Component name, framework, props, state, source location, parent hierarchy.

**Best for**: Understanding why component renders incorrectly, debugging prop passing, analyzing state management.

#### For Network Problems

Use `trace_network_requests` when investigating API issues:

```
Use trace_network_requests on https://app.com
Filter pattern: /api/users/*
Method: GET
Wait 5 seconds to capture all requests
```

**Returns**: All matching requests with:
- Source code that triggered the request
- Response status and timing
- Request/response size
- Full stack trace

**Best for**: Finding which component made slow requests, debugging failed API calls, understanding request timing.

#### For Performance Issues

Use `analyze_performance` for comprehensive performance analysis:

```
Use analyze_performance on https://app.com/dashboard
Include metrics: network, components, bundle
Simulate user interactions:
  - Click on #load-data button
  - Wait for results
  - Scroll to bottom
```

**Returns**: Performance metrics across all dimensions:
- Slow network requests (>1s)
- Component rendering performance
- Bundle size breakdown
- Page load timing

**Best for**: Optimizing page load time, finding performance bottlenecks, reducing bundle size.

**Note**: Granular performance profiling tools (CPU profiling, memory snapshots, Core Web Vitals, long task tracking, frame rate analysis) are planned for future releases. See `FUTURE_DEVELOPMENT.md` for details.

#### For Bundle Size Problems

Use `analyze_bundle_size` when investigating large JavaScript files:

```
Use analyze_bundle_size on https://app.com
Look for module: lodash
Flag modules larger than 50 KB
```

**Returns**:
- All JavaScript files and sizes
- Specific module locations
- Optimization recommendations
- Unused code detection

**Best for**: Reducing bundle size, finding duplicate dependencies, identifying code splitting opportunities.

#### For Production Errors

Use `resolve_minified_error` when you have a minified stack trace:

```
Use resolve_minified_error on https://app.com
Error stack: "TypeError: Cannot read property 'map' of undefined
  at t.render (main.7a8f9c2.js:1:48392)"
Try to trigger the error automatically
```

**Returns**:
- Original source file and line number
- Exact code that caused the error
- Component context
- Related network activity

**Best for**: Debugging production errors, understanding minified stack traces, finding root cause in source code.

## Tool Selection Strategy

### Two-Layer Architecture

WebSee provides 36 tools organized in two layers for optimal flexibility and efficiency:

**Layer 1: Workflow Tools (6 tools)** - High-level investigation tools that combine multiple data sources:

Use workflow tools when:
- Starting initial investigation (don't know what's wrong yet)
- Want comprehensive snapshot of application state
- Learning a new codebase or unfamiliar application
- Need complete context quickly
- Debugging complex issues with multiple potential causes

**Layer 2: Granular Tools (30 tools)** - Precise, single-purpose tools for specific queries:

Use granular tools when:
- Know exactly what to check or investigate
- Minimizing token usage is important
- Building custom investigation workflows
- Chaining multiple targeted queries
- Deep-diving into specific subsystems

### Progressive Learning Path

**Beginner (Week 1):**
- Use workflow tools exclusively for all debugging tasks
- Learn what data each workflow tool returns
- Understand the purpose and output of each workflow tool
- Build mental model of common debugging patterns
- Focus on understanding tool outputs before optimization

**Intermediate (Week 2-4):**
- Start investigations with workflow tools for overview
- Switch to granular tools for detailed follow-up
- Compare token usage between approaches
- Begin identifying when granular tools are more efficient
- Experiment with combining tools in sequences

**Expert (Month 2+):**
- Use granular tools as primary investigation method
- Reserve workflow tools only for broad scans or unfamiliar apps
- Develop custom investigation strategies for common scenarios
- Optimize token usage through precise tool selection
- Chain granular tools for maximum efficiency

### When to Use Each Layer

**Use Workflow Tools When:**
- "Something's broken, but I'm not sure what"
- "Give me a complete picture of what's happening"
- First time debugging this page or application
- Multiple symptoms pointing to different root causes
- Need to understand relationships between systems
- Documenting application state for reports

**Use Granular Tools When:**
- "What are the current props of the UserProfile component?"
- "Show me all network requests to /api/users"
- "Get the Redux state tree"
- "What event listeners are on this button?"
- Know the specific subsystem to investigate
- Conducting performance-optimized investigations

### Complete Tool Reference

#### Layer 1: Workflow Tools (6 tools)

| Tool | Purpose | Use Case | Returns |
|------|---------|----------|---------|
| `debug_frontend_issue` | Comprehensive debugging snapshot | General investigation, unclear symptoms | Console errors, component state, network activity, screenshots |
| `analyze_performance` | Complete performance analysis | Performance optimization, slow page loads | Network metrics, component counts, bundle sizes, memory usage |
| `inspect_component_state` | Deep component analysis | Component rendering issues, state problems | Component name, framework, props, state, source location, hierarchy |
| `trace_network_requests` | Network activity tracing | API debugging, request timing | Requests with source locations, timing, status, size |
| `analyze_bundle_size` | Bundle size breakdown | Large bundle investigation, code splitting | Script sizes, module locations, optimization recommendations |
| `resolve_minified_error` | Production error resolution | Minified stack trace debugging | Source-mapped errors, component context, related network |

#### Layer 2: Granular Tools (30 tools)

**Component Intelligence (8 tools)**
| Tool | Purpose | Returns |
|------|---------|---------|
| `component_tree` | Get component hierarchy | Component tree structure |
| `component_get_props` | Get component properties | Component props object |
| `component_get_state` | Get component state | Component state object |
| `component_find_by_name` | Find components by name | Component instances |
| `component_get_source` | Get source file location | File path, line number |
| `component_track_renders` | Track component re-renders | Render statistics |
| `component_get_context` | Get React Context values | Context values |
| `component_get_hooks` | Get React hooks state | Hooks array |

**Network Intelligence (6 tools)**
| Tool | Purpose | Returns |
|------|---------|---------|
| `network_get_requests` | Get all network requests | All requests |
| `network_get_by_url` | Filter requests by URL pattern | Matching requests |
| `network_get_timing` | Get detailed timing breakdown | Timing metrics |
| `network_trace_initiator` | Get source code that triggered request | Source location |
| `network_get_headers` | Get request/response headers | Header objects |
| `network_get_body` | Get request/response body | Body content |

**Source Intelligence (7 tools)**
| Tool | Purpose | Returns |
|------|---------|---------|
| `source_map_resolve` | Resolve minified location | Original location |
| `source_map_get_content` | Get original source content | Source code |
| `source_trace_stack` | Enhance stack trace with source maps | Resolved stack |
| `source_find_definition` | Find symbol definition | Definition location |
| `source_get_symbols` | Get exported/imported symbols | Symbol list |
| `source_map_bundle` | Map bundle to source files | Bundle mapping |
| `source_coverage_map` | Map coverage to source | Coverage data |

**Build Intelligence (5 tools)**
| Tool | Purpose | Returns |
|------|---------|---------|
| `build_get_manifest` | Get build manifest | Manifest data |
| `build_get_chunks` | Get chunk information | Chunk list |
| `build_find_module` | Find module in build | Module location |
| `build_get_dependencies` | Get module dependencies | Dependency graph |
| `build_analyze_size` | Analyze bundle sizes | Size analysis |

**Error Intelligence (4 tools)**
| Tool | Purpose | Returns |
|------|---------|---------|
| `error_resolve_stack` | Resolve error stack trace | Resolved stack |
| `error_get_context` | Get error context | Component/network context |
| `error_trace_cause` | Trace root cause | Cause chain |
| `error_get_similar` | Find similar errors | Pattern matches |

### Decision Trees for Tool Selection

#### Decision Tree 1: Initial Investigation

```
Start: Something is wrong with the application
│
├─ Do you know which subsystem is affected?
│  │
│  ├─ YES → Go to Decision Tree 2 (Targeted Investigation)
│  │
│  └─ NO → Use workflow tool: debug_frontend_issue
│           │
│           └─ Analyze results to identify subsystem
│              └─ Go to Decision Tree 2
│
└─ Is this a performance issue?
   │
   ├─ YES → Use workflow tool: analyze_performance
   │        │
   │        └─ Identify specific bottleneck
   │           └─ Go to Decision Tree 3 (Performance Deep-Dive)
   │
   └─ NO → Use debug_frontend_issue
```

#### Decision Tree 2: Targeted Investigation

```
Start: Know which subsystem has the problem
│
├─ Component Issue?
│  │
│  ├─ Need full component analysis?
│  │  └─ YES → Use inspect_component_state (workflow)
│  │  └─ NO → Use granular tools:
│  │         ├─ Just props? → component_get_props
│  │         ├─ Just state? → component_get_state
│  │         ├─ Just source? → component_get_source
│  │         ├─ Component tree? → component_tree
│  │         └─ Hooks state? → component_get_hooks
│
├─ Network Issue?
│  │
│  ├─ Need comprehensive trace?
│  │  └─ YES → Use trace_network_requests (workflow)
│  │  └─ NO → Use granular tools:
│  │         ├─ Filter by URL? → network_get_by_url
│  │         ├─ Get all requests? → network_get_requests
│  │         ├─ Need timing only? → network_get_timing
│  │         ├─ Need headers? → network_get_headers
│  │         └─ Need body? → network_get_body
│  │
│  └─ Find which code triggered request?
│     └─ Use granular: network_trace_initiator
│
├─ Console Errors?
│  │
│  ├─ Production minified error?
│  │  └─ Use workflow: resolve_minified_error
│  │
│  └─ Development error?
│     └─ Use granular: error_resolve_stack or source_trace_stack
│
└─ Bundle Size Issue?
   │
   ├─ Need full analysis with recommendations?
   │  └─ YES → Use analyze_bundle_size (workflow)
   │
   └─ NO → Use granular tools:
          ├─ Get manifest? → build_get_manifest
          ├─ Get chunks? → build_get_chunks
          ├─ Analyze sizes? → build_analyze_size
          └─ Find module? → build_find_module
```

#### Decision Tree 3: Performance Deep-Dive

```
Start: Performance issue identified
│
├─ Slow network requests?
│  │
│  └─ Use granular tools in sequence:
│     1. network_get_requests
│     2. network_get_timing (for slow ones)
│     3. network_trace_initiator (to find code)
│
├─ Large bundle size?
│  │
│  └─ Use granular tools in sequence:
│     1. build_get_manifest
│     2. build_get_chunks (identify large chunks)
│     3. build_analyze_size (get size breakdown)
│     4. build_find_module (for specific libs)
│
├─ Component rendering issues?
│  │
│  └─ Use granular tools in sequence:
│     1. component_track_renders (identify frequent re-renders)
│     2. component_tree (identify deep nesting)
│     3. component_get_hooks (check dependencies)
│     4. component_get_state (check for unnecessary updates)
│
└─ Source map issues?
   │
   └─ Use granular tools in sequence:
      1. source_map_resolve (test resolution)
      2. source_map_get_content (verify source maps)
      3. source_trace_stack (enhance stack traces)
```

### Token Cost Comparisons

Understanding token efficiency helps optimize your investigation workflows:

#### Scenario 1: "Get Component State"

**Using Workflow Tool: inspect_component_state**
- Returns: Component name, framework, props, state, source, hierarchy
- Token cost: ~4,000 tokens
- Efficiency: Medium (includes extra context)

**Using Granular Tool: component_get_state**
- Returns: Component state only
- Token cost: ~300 tokens
- Efficiency: High (100% relevant data)

**Savings: 13x more efficient with granular tool**

#### Scenario 2: "Check if API request was made"

**Using Workflow Tool: trace_network_requests**
- Returns: All requests with source maps, timing, headers, size
- Token cost: ~12,000 tokens
- Efficiency: Medium (includes some irrelevant requests)

**Using Granular Tool: network_get_by_url**
- Returns: Only matching URL requests
- Token cost: ~600 tokens
- Efficiency: High (only relevant requests)

**Savings: 20x more efficient with granular tool**

#### Scenario 3: "Find largest JavaScript file"

**Using Workflow Tool: analyze_bundle_size**
- Returns: All scripts, modules, recommendations, optimization tips
- Token cost: ~6,000 tokens
- Efficiency: Medium (includes recommendations you may not need)

**Using Granular Tool: build_analyze_size**
- Returns: Size breakdown with chunk information
- Token cost: ~800 tokens
- Efficiency: High (focused size analysis)

**Savings: 7-8x more efficient with granular tool**

#### Scenario 4: "Component props investigation"

**Using Workflow Tool: inspect_component_state**
- Returns: Name, framework, props, state, source, parents, children
- Token cost: ~4,000 tokens
- Efficiency: Medium (if you only need props)

**Using Granular Tool: component_get_props**
- Returns: Props object only
- Token cost: ~300 tokens
- Efficiency: High (exact data needed)

**Savings: 13x more efficient with granular tool**

#### Scenario 5: "Complete unknown issue investigation"

**Using Workflow Tool: debug_frontend_issue**
- Returns: Console, components, network, screenshots
- Token cost: ~8,000 tokens
- Efficiency: High (all data needed for diagnosis)

**Using Multiple Granular Tools:**
- error_get_context + component_tree + network_get_requests
- Token cost: ~1,500 tokens total
- Efficiency: Very High (only relevant data)

**Savings: 5x more efficient with granular tools**

#### Real-World Investigation Comparison

**Task**: Debug why checkout button is disabled

**Approach 1: Workflow Tools**
```
1. debug_frontend_issue (8,000 tokens)
2. inspect_component_state (4,000 tokens)
3. trace_network_requests (12,000 tokens)

Total: 24,000 tokens
Time to solution: Fast (comprehensive data)
```

**Approach 2: Granular Tools (Expert)**
```
1. component_get_state on button (300 tokens)
2. component_get_props on form (300 tokens)
3. network_get_by_url /api/validate (600 tokens)
4. error_get_context (400 tokens)

Total: 1,600 tokens
Time to solution: Fast (targeted queries)
```

**Savings: 15x more efficient with granular approach**

### Efficiency Guidelines

**When Granular Tools Save 10-100x Tokens:**
- You know exactly which data point to check
- Investigating single component or request
- Checking specific state management store
- Finding particular module in bundle
- Getting specific console message type

**When Workflow Tools Are More Efficient:**
- First time seeing the application
- Multiple unknown variables
- Need relationships between subsystems
- Building comprehensive report
- Teaching or demonstrating debugging

**Optimal Strategy:**
1. **First investigation**: Use workflow tool to understand landscape (acceptable token cost)
2. **Follow-up investigations**: Use granular tools (10-100x more efficient)
3. **Production debugging**: Use granular tools with known patterns (maximum efficiency)
4. **Documentation**: Use workflow tools for complete snapshots (clarity over efficiency)

**Token Budget Planning:**
- **Unlimited budget**: Use workflow tools for convenience
- **Moderate budget**: Mix workflow (initial) + granular (follow-up)
- **Limited budget**: Use granular tools exclusively with decision trees
- **Production/Scale**: Always use granular tools with optimized sequences

## Advanced Debugging Patterns

### Pattern 1: Complete User Flow Analysis

For debugging an entire user flow:

1. Start with `trace_network_requests` to understand API interactions
2. Use `inspect_component_state` on key components in the flow
3. Use `analyze_performance` to identify bottlenecks
4. If errors occur, use `resolve_minified_error` for specifics

### Pattern 2: Performance Optimization

For improving page performance:

1. Use `analyze_performance` to get baseline metrics
2. Use `analyze_bundle_size` to identify large modules
3. Use `trace_network_requests` to find slow APIs
4. Use `inspect_component_state` to check for re-render issues

### Pattern 3: Production Error Investigation

For urgent production errors:

1. Use `resolve_minified_error` with the error stack
2. Use `debug_frontend_issue` on the failing page
3. Use `inspect_component_state` on the component that failed
4. Use `trace_network_requests` to check for related API failures

## Key Principles

### 1. Choose the Right Tool

- **Unclear problem?** → Start with `debug_frontend_issue`
- **Component issue?** → Use `inspect_component_state`
- **Network issue?** → Use `trace_network_requests`
- **Performance problem?** → Use `analyze_performance`
- **Large bundle?** → Use `analyze_bundle_size`
- **Minified error?** → Use `resolve_minified_error`

### 2. Use Source Maps Effectively

All tools rely on source maps for accuracy:
- Ensure source maps are accessible (same origin or CORS enabled)
- Development builds have more component information
- Production builds still work but may have less detail

### 3. Provide Specific Selectors

When targeting components:
- Use specific CSS selectors: `#user-profile` > `.profile`
- Wait for dynamic content with `waitForSelector: true`
- Include children for full component tree analysis

### 4. Filter Network Requests Intelligently

For network tracing:
- Use URL patterns: `/api/*`, `/graphql`, `*.json`
- Filter by HTTP method: `GET`, `POST`, `PUT`, etc.
- Adjust wait time based on app behavior (default 3s)

### 5. Interpret Results in Context

When analyzing results:
- **Network timing >1s** → Potential optimization target
- **Bundle >100KB** → Consider code splitting
- **Memory growth** → Potential memory leak
- **Component re-renders** → Check React.memo or Vue computed

## Common Scenarios

### Scenario 1: "Button Click Does Nothing"

```
1. Use debug_frontend_issue on the page
   - Specify button selector
   - Check for JavaScript errors

2. Use inspect_component_state on the button's parent component
   - Check if click handler is defined
   - Verify component state

3. Use trace_network_requests
   - See if click should trigger API call
   - Check if call is being made
```

### Scenario 2: "Page Loads Slowly"

```
1. Use analyze_performance
   - Check all metrics
   - Identify slow network requests

2. Use analyze_bundle_size
   - Find large JavaScript files
   - Get optimization recommendations

3. Use trace_network_requests
   - See which components trigger slow requests
   - Check for waterfall loading
```

### Scenario 3: "Production Error in Console"

```
1. Copy the minified error stack trace

2. Use resolve_minified_error
   - Paste the error stack
   - Let it map to source code

3. Use inspect_component_state on the component that failed
   - Check its props and state
   - Understand why it received bad data

4. Use trace_network_requests
   - Check if API returned unexpected data
   - Verify request/response format
```

### Scenario 4: "Component Shows Wrong Data"

```
1. Use inspect_component_state
   - Check current props and state
   - Verify data shape

2. Use trace_network_requests
   - Find API call that provides the data
   - Check response format

3. Use debug_frontend_issue
   - Look for data transformation errors
   - Check console for warnings
```

## Best Practices

### DO:

✅ Start with broad tools (`debug_frontend_issue`) then narrow down
✅ Use specific CSS selectors for accurate targeting
✅ Include context in your analysis (network + component + errors)
✅ Filter network requests to focus on relevant APIs
✅ Wait appropriate time for async operations
✅ Check both props and state when debugging components
✅ Use headless mode for production, visible for debugging

### DON'T:

❌ Use wrong tool for the problem (e.g., bundle analysis for network issues)
❌ Ignore source map warnings (fix source map configuration)
❌ Use vague selectors like `div` or `.button`
❌ Forget to wait for dynamic content to load
❌ Analyze localhost if production issue (use actual URLs)
❌ Skip error stack resolution (source maps make it easy)
❌ Overlook component hierarchy (parents affect children)

## Understanding Tool Output

### debug_frontend_issue

Returns comprehensive snapshot:
- `issues[]`: Problems detected (errors, missing selectors)
- `components[]`: Components at target selector
- `network[]`: Recent API calls
- `console[]`: Error and warning messages
- `screenshot`: Visual proof of current state

**Action**: Review issues first, then drill into specifics.

### analyze_performance

Returns metrics organized by category:
- `network`: Request counts, slow requests, average timing
- `components`: Total count, framework breakdown, nesting depth
- `bundle`: Script sizes, largest files
- `memory`: Heap usage, limits

**Action**: Focus on metrics >threshold (1s requests, 100KB+ bundles).

### inspect_component_state

Returns component details:
- `name`: Component name (e.g., `UserProfile`)
- `framework`: React, Vue, or Angular
- `props`: Current properties passed to component
- `state`: Internal component state
- `source`: Original file location
- `parents[]`: Component hierarchy

**Action**: Check if props/state match expectations.

### trace_network_requests

Returns request details:
- `url`: Full request URL
- `method`: HTTP method
- `status`: Response status code
- `duration`: Request timing in ms
- `triggeredBy`: Source code location that made the request
- `size`: Response size

**Action**: Find slow requests (>1s) and trace to source.

### analyze_bundle_size

Returns bundle breakdown:
- `scripts[]`: All JavaScript files with sizes
- `stylesheets[]`: All CSS files
- `modules[]`: Specific modules if searched
- `recommendations[]`: Actionable optimization advice

**Action**: Follow recommendations for files >threshold.

### resolve_minified_error

Returns error resolution:
- `original`: Minified error stack
- `sourceMap[]`: Resolved source locations
- `components[]`: Components involved
- `networkContext[]`: Related API calls

**Action**: Go to source file and fix the root cause.

## Environment Considerations

### Browser Selection

WebSee supports multiple browsers via `BROWSER` env var:
- **chromium**: Chrome, Edge, Brave (default, best compatibility)
- **firefox**: Mozilla Firefox (good for Firefox-specific issues)
- **webkit**: Safari (macOS only, for Safari debugging)

Choose browser that matches production environment.

### Headless Mode

Via `HEADLESS` env var:
- **true**: Runs in background, faster, no UI (default)
- **false**: Shows browser window, helpful for visual debugging

Use `false` when you need to see what's happening.

### Source Maps

For best results:
- Ensure source maps are generated (webpack: `devtool: 'source-map'`)
- Make sure they're accessible (same origin or CORS enabled)
- Check browser DevTools to verify source maps load

## Troubleshooting

### "Source maps not found"

**Cause**: Application doesn't generate or serve source maps.

**Fix**:
- Check webpack/vite config for source map generation
- Verify `.map` files are served with the bundle
- Check CORS headers if maps are on different origin

### "Component not found"

**Cause**: Selector doesn't match or component not mounted.

**Fix**:
- Use browser DevTools to verify selector
- Set `waitForSelector: true`
- Check if component renders conditionally

### "No network requests captured"

**Cause**: Requests happened before tool started or after it stopped.

**Fix**:
- Increase `waitTime` parameter
- Trigger actions after tool starts (use `interactions`)
- Check if app uses fetch/XHR (both are supported)

### "Empty component state"

**Cause**: Production build or component doesn't use framework state.

**Fix**:
- Test on development build for more detail
- Verify component actually uses React/Vue/Angular state
- Check if it's a pure/functional component

## Quick Reference

| Problem | Tool | Key Parameters |
|---------|------|----------------|
| General debugging | `debug_frontend_issue` | url, selector, screenshot |
| Component state | `inspect_component_state` | url, selector, includeChildren |
| Network issues | `trace_network_requests` | url, pattern, method |
| Performance | `analyze_performance` | url, metrics, interactions |
| Bundle size | `analyze_bundle_size` | url, moduleName, threshold |
| Production errors | `resolve_minified_error` | url, errorStack |

## Example Complete Debugging Session

```
User: "Our checkout button is disabled and we don't know why"

Agent approach:

1. Use debug_frontend_issue on https://store.com/checkout
   - Target selector: #checkout-button
   - Capture screenshot

   Result: Button exists, no JavaScript errors, but CheckoutForm component has error state

2. Use inspect_component_state
   - Target: #checkout-form
   - Include children

   Result: CheckoutForm state shows { validationError: "Invalid shipping address" }

3. Use trace_network_requests
   - Pattern: /api/validate/*

   Result: POST /api/validate/address returned 400 with validation error

Solution identified: Address validation API is rejecting the input.
Root cause: Component state correctly reflects API response.
Fix needed: Either fix address input or API validation logic.
```

---

## Tool Count and Compatibility

**Current Status**: WebSee provides **36 tools** (6 workflow + 30 granular)

**Compatibility**:
- ✅ Claude Code: Full support (no tool limit)
- ✅ VS Code: Full support (no tool limit)
- ✅ Cursor: Full support (36 < 40 tool limit)

**Removed Tools**: 5 performance profiling tools were removed in v1.0 to stay within Cursor's 40-tool limit and prioritize fully-implemented features. These tools are planned for future releases when there is user demand:
- `performance_profile` - CPU profiling
- `performance_memory` - Memory snapshots
- `performance_metrics` - Core Web Vitals
- `performance_long_tasks` - Long task tracking
- `performance_frame_rate` - Frame rate analysis

See `FUTURE_DEVELOPMENT.md` for implementation details and timeline.

**Current Performance Analysis**: The `analyze_performance` workflow tool still provides comprehensive performance insights using network timing, component rendering analysis, and bundle size metrics.

---

**Remember**: WebSee reveals source-level truth. Use it to move from "something's broken" to "here's exactly what's wrong and where."

---

**Skill Version**: 1.0.0
**Tools Count**: 36 (6 workflow + 30 granular)
**Last Updated**: 2025-10-26
**Anthropic Guidelines**: Compliant with latest skill-creator patterns
