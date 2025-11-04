# WebSee MCP Tools - Quick Reference

One-page quick reference for all 6 WebSee MCP tools.

---

## 🛠️ All 6 Tools

### 1. debug_frontend_issue
**One-liner**: Comprehensive debugging snapshot with errors, components, network, and console.

**Required**: `url`
**Optional**: `selector`, `errorMessage`, `screenshot`

**Use when**: You don't know what's wrong yet.

```json
{"url": "https://app.com", "screenshot": true}
```

---

### 2. analyze_performance
**One-liner**: Performance analysis across network, components, bundle, and memory.

**Required**: `url`
**Optional**: `interactions`, `metrics`

**Use when**: Page is slow or you're optimizing.

```json
{
  "url": "https://app.com",
  "metrics": ["network", "components", "bundle", "memory"]
}
```

---

### 3. inspect_component_state
**One-liner**: Inspect React/Vue/Angular component props, state, and hierarchy.

**Required**: `url`, `selector`
**Optional**: `waitForSelector`, `includeChildren`

**Use when**: Component shows wrong data or behaves incorrectly.

```json
{
  "url": "https://app.com",
  "selector": "#user-profile",
  "includeChildren": true
}
```

---

### 4. trace_network_requests
**One-liner**: Trace API calls to their source code with timing and status.

**Required**: `url`
**Optional**: `pattern`, `method`, `waitTime`

**Use when**: Debugging API issues or finding slow requests.

```json
{
  "url": "https://app.com",
  "pattern": "/api/*",
  "method": "GET"
}
```

---

### 5. analyze_bundle_size
**One-liner**: Analyze JavaScript bundle size and get optimization recommendations.

**Required**: `url`
**Optional**: `moduleName`, `threshold`

**Use when**: Bundle too large or looking for specific dependency.

```json
{
  "url": "https://app.com",
  "moduleName": "lodash",
  "threshold": 50
}
```

---

### 6. resolve_minified_error
**One-liner**: Resolve production error stacks to original source code.

**Required**: `url`, `errorStack`
**Optional**: `triggerError`

**Use when**: You have a minified error from production.

```json
{
  "url": "https://app.com",
  "errorStack": "TypeError at t.render (main.js:1:48392)"
}
```

---

## 🎯 Tool Selection Flowchart

```
What's the problem?

├─ Don't know yet → debug_frontend_issue
│
├─ Slow/performance → analyze_performance
│  └─ Large bundle? → analyze_bundle_size
│
├─ Component issue → inspect_component_state
│  └─ Wrong data? → trace_network_requests
│
├─ API/network → trace_network_requests
│
└─ Production error → resolve_minified_error
```

---

## 📊 Comparison Matrix

| Tool | Speed | Complexity | Scope | Best For |
|------|-------|------------|-------|----------|
| debug_frontend_issue | Medium | Low | Broad | Initial investigation |
| analyze_performance | Slow | Medium | Broad | Optimization |
| inspect_component_state | Fast | Low | Narrow | Component debugging |
| trace_network_requests | Medium | Low | Narrow | API debugging |
| analyze_bundle_size | Fast | Low | Narrow | Bundle optimization |
| resolve_minified_error | Fast | Medium | Narrow | Production errors |

---

## 🔄 Common Tool Combinations

### Complete Error Investigation
```
1. resolve_minified_error (get source location)
2. inspect_component_state (check component)
3. trace_network_requests (check API)
```

### Performance Audit
```
1. analyze_performance (baseline metrics)
2. analyze_bundle_size (find large files)
3. trace_network_requests (find slow APIs)
```

### Feature Debugging
```
1. debug_frontend_issue (overall snapshot)
2. inspect_component_state (specific component)
3. trace_network_requests (related APIs)
```

---

## ⚙️ Environment Variables

```bash
BROWSER=chromium    # chromium, firefox, webkit
HEADLESS=true       # true, false
```

---

## 📋 Parameter Cheat Sheet

### URL Patterns (trace_network_requests)
- `/api/*` - All API calls
- `*.json` - JSON files
- `*graphql*` - GraphQL requests
- `/users/*` - User endpoints

### Selectors (all tools)
- `#id` - By ID (best)
- `.class` - By class
- `[data-testid="name"]` - By attribute
- `#app > .main` - Complex selector

### Metrics (analyze_performance)
- `["network"]` - Network only
- `["components"]` - Components only
- `["bundle"]` - Bundle only
- `["memory"]` - Memory only
- `["network", "components", "bundle", "memory"]` - All

### HTTP Methods (trace_network_requests)
- `"GET"` - GET only
- `"POST"` - POST only
- `"ALL"` - All methods (default)

---

## ⏱️ Performance Thresholds

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Network request | <500ms | 500-1000ms | >1000ms |
| Bundle size | <500KB | 500KB-1MB | >1MB |
| Memory usage | <50MB | 50-200MB | >200MB |
| Component depth | <6 levels | 6-10 levels | >10 levels |

---

## 🚀 Quick Start Examples

### Debug a Broken Button
```json
{
  "tool": "inspect_component_state",
  "params": {
    "url": "https://app.com",
    "selector": "#submit-button"
  }
}
```

### Find Slow API Calls
```json
{
  "tool": "trace_network_requests",
  "params": {
    "url": "https://app.com",
    "waitTime": 5000
  }
}
```

### Check Bundle Size
```json
{
  "tool": "analyze_bundle_size",
  "params": {
    "url": "https://app.com",
    "threshold": 50
  }
}
```

### Resolve Production Error
```json
{
  "tool": "resolve_minified_error",
  "params": {
    "url": "https://app.com",
    "errorStack": "<your-error-stack>"
  }
}
```

---

## ✅ Checklist for Effective Debugging

- [ ] Start broad with `debug_frontend_issue`
- [ ] Use specific selectors (ID > class > tag)
- [ ] Check multiple tools for complete picture
- [ ] Filter network by pattern when possible
- [ ] Wait appropriate time for async operations
- [ ] Check component props AND state
- [ ] Verify source maps are available
- [ ] Use headless=false for visual debugging
- [ ] Check all browsers if issue is browser-specific
- [ ] Review complete error context (component + network)

---

## 🔗 Full Documentation

- **Complete tool docs**: [MCP_TOOLS.md](./MCP_TOOLS.md)
- **Full tools list**: [MCP_TOOLS_LIST.md](./MCP_TOOLS_LIST.md)
- **AI Agent skill**: [skills/websee-frontend-debugger/](./skills/websee-frontend-debugger/)

---

**Keep this handy!** Print or bookmark for quick reference during debugging sessions.
