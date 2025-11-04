# WebSee Debugging Playbook

Real-world debugging scenarios with step-by-step solutions using WebSee MCP tools.

## Scenario 1: "The Button Doesn't Work"

**Symptoms**: User clicks button, nothing happens, no visible errors.

### Investigation Steps

**Step 1: Check for JavaScript errors**
```
Tool: debug_frontend_issue
Parameters:
  url: "https://app.com"
  selector: "#submit-button"
  screenshot: true
```

**Expected outcomes**:
- **If errors found**: Proceed to Step 2 (Error Resolution)
- **If no errors**: Proceed to Step 3 (Component Analysis)

**Step 2: Resolve any JavaScript errors**
```
Tool: resolve_minified_error
Parameters:
  url: "https://app.com"
  errorStack: "<error from Step 1>"
  triggerError: true
```

**Action**: Fix the error in source code, then re-test.

**Step 3: Inspect button's parent component**
```
Tool: inspect_component_state
Parameters:
  url: "https://app.com"
  selector: "#submit-button"
  includeChildren: false
```

**Check for**:
- `props.onClick`: Should be defined
- `props.disabled`: Should be false
- `state.isSubmitting`: Should be false

**Step 4: Check network activity**
```
Tool: trace_network_requests
Parameters:
  url: "https://app.com"
  pattern: "*"
  waitTime: 5000
```

**Then**: Click the button and check if request fires.

### Common Root Causes

| Finding | Root Cause | Solution |
|---------|-----------|----------|
| `props.onClick` is undefined | Event handler not attached | Add onClick prop to button |
| `props.disabled` is true | Button intentionally disabled | Check why validation is failing |
| Request not firing | Event handler not calling API | Debug handler function |
| Request fires but fails | API error | Check network tab for error details |

---

## Scenario 2: "Page Loads Too Slowly"

**Symptoms**: Page takes >5 seconds to load, users complaining about performance.

### Investigation Steps

**Step 1: Get performance baseline**
```
Tool: analyze_performance
Parameters:
  url: "https://app.com/dashboard"
  metrics: ["network", "components", "bundle", "memory"]
```

**Expected outcomes**:
- `network.slowRequests`: >0 indicates slow API calls
- `bundle.totalSize`: >500KB indicates large bundle
- `memory.usedJSHeapSize`: >200MB indicates memory issue

**Step 2: Analyze bundle size**
```
Tool: analyze_bundle_size
Parameters:
  url: "https://app.com/dashboard"
  threshold: 50
```

**Check for**:
- Duplicate dependencies (e.g., multiple versions of React)
- Large libraries (e.g., moment.js, lodash)
- Unused code that could be code-split

**Step 3: Trace slow network requests**
```
Tool: trace_network_requests
Parameters:
  url: "https://app.com/dashboard"
  pattern: "/api/*"
  waitTime: 10000
```

**Action**: Identify requests >1000ms, find triggering component.

**Step 4: Check component rendering**
```
Tool: inspect_component_state
Parameters:
  url: "https://app.com/dashboard"
  selector: "#main-content"
  includeChildren: true
```

**Check for**:
- Too many child components (>50)
- Deep nesting (>10 levels)
- Unnecessary re-renders

### Optimization Recommendations

| Issue | Threshold | Solution |
|-------|-----------|----------|
| Slow network request | >1s | Optimize API, add caching, use pagination |
| Large bundle | >500KB | Code splitting, lazy loading, tree shaking |
| Many components | >100 | Virtualization, pagination, lazy loading |
| Deep nesting | >10 levels | Flatten component structure |
| Memory usage | >200MB | Fix memory leaks, clean up listeners |

---

## Scenario 3: "Production Error: 'undefined is not a function'"

**Symptoms**: Error in production logs, minified stack trace, can't reproduce locally.

### Investigation Steps

**Step 1: Resolve minified error**
```
Tool: resolve_minified_error
Parameters:
  url: "https://app.com"
  errorStack: "TypeError: undefined is not a function\n  at t.render (main.7a8f9c2.js:1:48392)\n  at r (vendors.2e3f4d1.js:8:1042)"
  triggerError: true
```

**Expected outcome**:
```json
{
  "sourceMap": [
    "at ProductList.render (src/components/ProductList.tsx:87:23)",
    "at React.createElement (react-dom.production.min.js:...)"
  ],
  "components": ["ProductList", "Dashboard"],
  "networkContext": [...]
}
```

**Step 2: Inspect component state**
```
Tool: inspect_component_state
Parameters:
  url: "https://app.com"
  selector: ".product-list"
  waitForSelector: true
```

**Check for**:
- Missing props that should be functions
- Undefined data that code assumes exists
- Version mismatch in dependencies

**Step 3: Check network context**
```
Tool: trace_network_requests
Parameters:
  url: "https://app.com"
  pattern: "/api/products*"
```

**Action**: Verify API returns expected data shape.

### Common Causes

| Error Pattern | Likely Cause | Investigation |
|--------------|-------------|---------------|
| "undefined is not a function" | Missing function prop or wrong version | Check component props, dependency versions |
| "Cannot read property X of undefined" | Data not loaded yet | Check async loading, add null checks |
| "Cannot access X before initialization" | Race condition | Check initialization order |

---

## Scenario 4: "Form Validation Fails Silently"

**Symptoms**: User fills form, clicks submit, nothing happens, no error shown.

### Investigation Steps

**Step 1: Debug the form**
```
Tool: debug_frontend_issue
Parameters:
  url: "https://app.com/register"
  selector: "#registration-form"
  errorMessage: "validation"
```

**Check console** for validation messages.

**Step 2: Inspect form component state**
```
Tool: inspect_component_state
Parameters:
  url: "https://app.com/register"
  selector: "#registration-form"
  includeChildren: true
```

**Check for**:
- `state.errors`: Should contain validation errors
- `state.isValid`: Should indicate validation status
- `state.touched`: Should show which fields were touched

**Step 3: Trace validation API calls**
```
Tool: trace_network_requests
Parameters:
  url: "https://app.com/register"
  pattern: "/api/validate*"
  waitTime: 3000
```

**Action**: Check if validation endpoint is called and its response.

### Debugging Matrix

| Finding | Interpretation | Action |
|---------|---------------|--------|
| No errors in state | Validation not running | Check validation trigger |
| Errors but not displayed | UI not reading error state | Fix error display component |
| Validation API returns 400 | Server validation failing | Check request payload |
| No API call made | Client validation blocking | Check client validation logic |

---

## Scenario 5: "Data Displayed is Stale"

**Symptoms**: Page shows old data even after refresh, suspect caching issue.

### Investigation Steps

**Step 1: Trace API requests**
```
Tool: trace_network_requests
Parameters:
  url: "https://app.com/dashboard"
  pattern: "/api/data*"
  method: "GET"
```

**Check for**:
- Cache headers: `Cache-Control`, `ETag`
- Request timing: When is data fetched?
- Request frequency: Is it being re-fetched?

**Step 2: Inspect component receiving data**
```
Tool: inspect_component_state
Parameters:
  url: "https://app.com/dashboard"
  selector: "#data-view"
```

**Check**:
- `props.data`: Current data in component
- `state.lastUpdated`: When was data last refreshed

**Step 3: Debug the data flow**
```
Tool: debug_frontend_issue
Parameters:
  url: "https://app.com/dashboard"
  selector: "#data-view"
```

**Action**: Compare data in network response vs. component state.

### Common Issues

| Issue | Detection | Fix |
|-------|-----------|-----|
| Browser caching | Response has `Cache-Control` | Update cache headers |
| Component state not updating | State unchanged after fetch | Fix state update logic |
| API returning stale data | API timestamp is old | Fix API caching |
| Redux/Vuex state stale | Store not updated | Fix state management |

---

## Scenario 6: "Memory Leak in SPA"

**Symptoms**: Page gets slower over time, browser tab uses increasing memory.

### Investigation Steps

**Step 1: Baseline memory usage**
```
Tool: analyze_performance
Parameters:
  url: "https://app.com"
  metrics: ["memory"]
```

**Record**: Initial memory usage.

**Step 2: Simulate user activity**
```
Tool: analyze_performance
Parameters:
  url: "https://app.com"
  interactions: [
    { "action": "click", "selector": "#load-data" },
    { "action": "navigate", "value": "https://app.com/other-page" },
    { "action": "navigate", "value": "https://app.com" }
  ]
  metrics: ["memory", "components"]
```

**Check**: Memory after interactions. Should not increase significantly.

**Step 3: Inspect component cleanup**
```
Tool: inspect_component_state
Parameters:
  url: "https://app.com"
  selector: "#main-app"
  includeChildren: true
```

**Look for**:
- Event listeners not being removed
- Timers not being cleared
- Subscriptions not being unsubscribed

### Memory Leak Checklist

| Potential Leak | How to Check | Fix |
|---------------|-------------|-----|
| Event listeners | Count increases on nav | Use cleanup in useEffect/beforeDestroy |
| Timers | setInterval not cleared | Clear in cleanup |
| Global references | Variables in window | Remove references on unmount |
| Closures | Functions holding refs | Use WeakMap, null references |
| API subscriptions | WebSocket/polling active | Unsubscribe in cleanup |

---

## Scenario 7: "Component Renders Wrong Data"

**Symptoms**: Component displays incorrect or unexpected information.

### Investigation Steps

**Step 1: Inspect component**
```
Tool: inspect_component_state
Parameters:
  url: "https://app.com"
  selector: "#user-profile"
  includeChildren: false
```

**Check**:
- `props`: Are they what you expect?
- `state`: Is state correct?
- `parents`: Is parent passing wrong data?

**Step 2: Check data source**
```
Tool: trace_network_requests
Parameters:
  url: "https://app.com"
  pattern: "/api/users/*"
```

**Action**: Verify API response matches expected format.

**Step 3: Debug data transformation**
```
Tool: debug_frontend_issue
Parameters:
  url: "https://app.com"
  selector: "#user-profile"
```

**Check console** for warnings about data transformations.

### Data Flow Analysis

| Layer | Check | Tool |
|-------|-------|------|
| API response | Correct format? | trace_network_requests |
| Redux/State | Stored correctly? | inspect_component_state (parent) |
| Props | Passed correctly? | inspect_component_state |
| Render | Displayed correctly? | debug_frontend_issue + screenshot |

---

## Scenario 8: "Infinite Render Loop"

**Symptoms**: Page freezes, browser becomes unresponsive, console floods with logs.

### Investigation Steps

**Step 1: Capture the issue**
```
Tool: debug_frontend_issue
Parameters:
  url: "https://app.com"
  selector: "#problem-component"
  screenshot: false
```

**Check console** for repeating messages.

**Step 2: Inspect component**
```
Tool: inspect_component_state
Parameters:
  url: "https://app.com"
  selector: "#problem-component"
  includeChildren: true
```

**Look for**:
- State that changes on every render
- Props that are new objects/arrays each time
- useEffect/watch with missing dependencies

**Step 3: Check performance impact**
```
Tool: analyze_performance
Parameters:
  url: "https://app.com"
  metrics: ["components", "memory"]
```

**Action**: Verify component count and memory grow infinitely.

### Infinite Loop Causes

| Cause | Detection | Fix |
|-------|-----------|-----|
| useEffect without deps | Component in tree | Add dependency array |
| setState in render | State changes constantly | Move to event handler |
| New object in props | Props change each render | Memoize object |
| Parent re-renders child | Child in tree | Use React.memo/shouldComponentUpdate |

---

## Quick Decision Tree

```
Issue type?
├─ Error visible
│  ├─ Minified? → resolve_minified_error
│  └─ Clear? → debug_frontend_issue
├─ Performance
│  ├─ Slow load? → analyze_performance + analyze_bundle_size
│  ├─ Slow network? → trace_network_requests
│  └─ Memory? → analyze_performance (memory)
├─ Wrong data
│  ├─ Component? → inspect_component_state
│  ├─ API? → trace_network_requests
│  └─ Both? → debug_frontend_issue
└─ No interaction
   ├─ Button? → inspect_component_state (check props.onClick)
   ├─ Form? → inspect_component_state (check validation)
   └─ General? → debug_frontend_issue
```

## grep_patterns

Search patterns for finding scenarios:

- All scenarios: `^## Scenario \d+:`
- Investigation steps: `^### Investigation Steps`
- Common causes: `^### Common`
- Quick reference: `^## Quick Decision Tree`
