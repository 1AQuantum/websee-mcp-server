# WebSee MCP Tools - Complete List

This is the complete list of all tools available in the WebSee MCP server.

---

## Overview

**Total Tools**: 6
**Server Name**: `websee`
**Version**: 1.0.0
**Protocol**: Model Context Protocol (MCP) 1.0

---

## Tool 1: debug_frontend_issue

**Purpose**: Comprehensive frontend debugging by analyzing components, network, and errors

### Description
Debug frontend issues by capturing a complete snapshot of the page state including console errors, component information, network activity, and optional screenshots. This is the best starting point for investigating unclear issues.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | ✅ Yes | - | The URL of the page experiencing issues |
| `selector` | string | No | - | CSS selector to focus on (optional) |
| `errorMessage` | string | No | - | Error message to investigate (optional) |
| `screenshot` | boolean | No | false | Capture screenshot of the issue |

### Example Usage

```json
{
  "url": "https://example.com/login",
  "selector": "#login-form",
  "errorMessage": "Cannot read property",
  "screenshot": true
}
```

### Returns
- Issues found (errors, missing selectors)
- Component state at target selector
- Recent network activity
- Console errors and warnings
- Optional screenshot

### When to Use
- Initial investigation of unknown issues
- Multiple potential causes
- Need comprehensive context
- Visual confirmation required

---

## Tool 2: analyze_performance

**Purpose**: Analyze frontend performance including network, components, bundle size, and memory

### Description
Comprehensive performance analysis across multiple dimensions. Can simulate user interactions and measure performance before/after. Returns detailed metrics for network requests, component rendering, bundle size, and memory usage.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | ✅ Yes | - | The URL to analyze for performance |
| `interactions` | array | No | [] | User interactions to perform before analysis |
| `metrics` | array | No | ["network", "components"] | Metrics to analyze: "network", "components", "bundle", "memory" |

#### Interaction Schema
```typescript
{
  action: "click" | "type" | "scroll" | "navigate";
  selector?: string;  // Required for click/type
  value?: string;     // Required for type/navigate
}
```

### Example Usage

```json
{
  "url": "https://app.com/dashboard",
  "interactions": [
    {
      "action": "click",
      "selector": "#load-data"
    },
    {
      "action": "scroll"
    }
  ],
  "metrics": ["network", "components", "bundle", "memory"]
}
```

### Returns
- Network: Total requests, slow requests (>1s), average timing
- Components: Total count, framework breakdown, nesting depth
- Bundle: Script sizes, largest files
- Memory: Heap usage, limits

### When to Use
- Page loads slowly
- Performance optimization
- Before/after comparison
- Memory leak detection

---

## Tool 3: inspect_component_state

**Purpose**: Inspect the state, props, and structure of React/Vue/Angular components

### Description
Deep inspection of component internals including current state, props, source code location, and parent/child relationships. Works with React, Vue, and Angular applications.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | ✅ Yes | - | The page URL |
| `selector` | string | ✅ Yes | - | CSS selector for the component |
| `waitForSelector` | boolean | No | true | Wait for element to appear |
| `includeChildren` | boolean | No | false | Include child components |

### Example Usage

```json
{
  "url": "https://app.com",
  "selector": "#user-profile",
  "waitForSelector": true,
  "includeChildren": true
}
```

### Returns
- Component name and framework (React/Vue/Angular)
- Current props
- Current state
- Source code location
- Parent hierarchy
- Children (if requested)

### When to Use
- Component shows wrong data
- Props/state debugging
- Understanding component hierarchy
- State management issues

---

## Tool 4: trace_network_requests

**Purpose**: Trace network requests and identify what code triggered them

### Description
Captures all network requests with full details including which source code triggered each request. Supports filtering by URL pattern and HTTP method. Essential for debugging API issues.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | ✅ Yes | - | The page URL |
| `pattern` | string | No | - | URL pattern to filter (e.g., '/api/*') |
| `method` | enum | No | "ALL" | HTTP method: "GET", "POST", "PUT", "DELETE", "PATCH", "ALL" |
| `waitTime` | number | No | 3000 | Time to wait for requests in milliseconds |

### Example Usage

```json
{
  "url": "https://app.com",
  "pattern": "/api/users/*",
  "method": "GET",
  "waitTime": 5000
}
```

### Returns
- Total request count
- Each request with:
  - URL and HTTP method
  - Status code
  - Duration (ms)
  - Response size
  - Source code that triggered it (file, line, function)
  - Timestamp

### When to Use
- Finding slow API calls
- Debugging failed requests
- Understanding which component makes requests
- API integration issues

---

## Tool 5: analyze_bundle_size

**Purpose**: Analyze JavaScript bundle size and identify large modules

### Description
Analyzes all JavaScript files loaded by the application, identifies large modules, and provides optimization recommendations. Can search for specific dependencies in the bundle.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | ✅ Yes | - | The application URL |
| `moduleName` | string | No | - | Specific module to search for |
| `threshold` | number | No | 50 | Size threshold in KB to flag modules |

### Example Usage

```json
{
  "url": "https://app.com",
  "moduleName": "lodash",
  "threshold": 50
}
```

### Returns
- All JavaScript files with sizes
- All CSS files
- Specific modules (if searched)
- Optimization recommendations
- Files exceeding threshold

### When to Use
- Bundle size too large
- Finding duplicate dependencies
- Code splitting opportunities
- Identifying unused libraries

---

## Tool 6: resolve_minified_error

**Purpose**: Resolve minified error stack traces to original source code using source maps

### Description
Takes a minified production error stack trace and resolves it to the original source code locations using source maps. Provides full error context including component state and network activity.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | ✅ Yes | - | The page URL |
| `errorStack` | string | ✅ Yes | - | The minified error stack trace |
| `triggerError` | boolean | No | false | Try to trigger the error automatically |

### Example Usage

```json
{
  "url": "https://app.com",
  "errorStack": "TypeError: Cannot read property 'map' of undefined\n  at t.render (main.7a8f9c2.js:1:48392)",
  "triggerError": true
}
```

### Returns
- Original source locations (file, line, column)
- Resolved stack trace
- Component context
- Related network activity
- Build information

### When to Use
- Production errors with minified stacks
- Debugging deployed applications
- Error monitoring integration
- When source maps are available

---

## Quick Reference Table

| Tool Name | Primary Use Case | Key Feature | Complexity |
|-----------|-----------------|-------------|------------|
| `debug_frontend_issue` | General debugging | Comprehensive snapshot | Low |
| `analyze_performance` | Performance optimization | Multi-metric analysis | Medium |
| `inspect_component_state` | Component debugging | Framework-aware inspection | Low |
| `trace_network_requests` | API debugging | Source attribution | Low |
| `analyze_bundle_size` | Bundle optimization | Size analysis + recommendations | Low |
| `resolve_minified_error` | Production debugging | Source map resolution | Medium |

---

## Tool Selection Guide

### By Problem Type

| Problem | Recommended Tool | Alternative |
|---------|-----------------|-------------|
| **General issue** | debug_frontend_issue | - |
| **Slow page load** | analyze_performance | analyze_bundle_size |
| **Component shows wrong data** | inspect_component_state | trace_network_requests |
| **API failure** | trace_network_requests | debug_frontend_issue |
| **Large bundle** | analyze_bundle_size | analyze_performance |
| **Production error** | resolve_minified_error | debug_frontend_issue |
| **Memory leak** | analyze_performance | debug_frontend_issue |
| **Button not working** | inspect_component_state | debug_frontend_issue |

### By Investigation Phase

1. **Initial Investigation**: `debug_frontend_issue`
2. **Deep Dive**: Specific tool based on findings
3. **Optimization**: `analyze_performance` + `analyze_bundle_size`
4. **Verification**: Re-run the specific tool

---

## Common Patterns

### Pattern 1: Error Investigation
```
1. resolve_minified_error (if error stack available)
2. inspect_component_state (component that failed)
3. trace_network_requests (related API calls)
```

### Pattern 2: Performance Optimization
```
1. analyze_performance (baseline)
2. analyze_bundle_size (find large modules)
3. trace_network_requests (find slow APIs)
4. analyze_performance (verify improvements)
```

### Pattern 3: Feature Debugging
```
1. debug_frontend_issue (overall snapshot)
2. inspect_component_state (feature components)
3. trace_network_requests (feature APIs)
```

---

## Environment Variables

All tools respect these environment variables:

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `BROWSER` | chromium, firefox, webkit | chromium | Browser to use |
| `HEADLESS` | true, false | true | Run browser in headless mode |

### Example Configuration

```json
{
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": ["/path/to/dist/mcp-server.js"],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "true"
      }
    }
  }
}
```

---

## Tool Output Format

All tools return JSON responses with this structure:

```typescript
// Success
{
  content: [{
    type: "text",
    text: "JSON string with tool-specific data"
  }]
}

// Error
{
  error: {
    code: "InvalidParams" | "MethodNotFound" | "InternalError",
    message: "Human-readable error message"
  }
}
```

---

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chromium | ✅ Full support | Default, best compatibility |
| Chrome | ✅ Full support | Via Chromium |
| Edge | ✅ Full support | Via Chromium |
| Firefox | ✅ Full support | Set BROWSER=firefox |
| Safari | ✅ Full support | macOS only, set BROWSER=webkit |

---

## Limitations

### What Tools Cannot Do

❌ Modify application code
❌ Fix bugs automatically
❌ Access pages requiring authentication (without setup)
❌ Debug server-side code
❌ Work without accessible URLs

### Workarounds

| Limitation | Workaround |
|------------|-----------|
| Authentication required | Use interactions to log in first |
| Private network | Run WebSee on same network |
| Missing source maps | Tools still work, less detail |
| Dynamic content | Use waitForSelector or waitTime |

---

## Performance Considerations

| Tool | Average Time | Resource Usage |
|------|-------------|----------------|
| debug_frontend_issue | 2-5s | Medium |
| analyze_performance | 3-10s | High |
| inspect_component_state | 1-2s | Low |
| trace_network_requests | 3-15s | Medium |
| analyze_bundle_size | 2-4s | Low |
| resolve_minified_error | 1-3s | Low |

**Note**: Times vary based on page complexity and network speed.

---

## Version Information

- **MCP Protocol Version**: 1.0
- **WebSee Server Version**: 1.0.0
- **Tool Count**: 6
- **Supported Frameworks**: React, Vue, Angular
- **Browser Support**: Chromium, Firefox, WebKit

---

## Additional Resources

- **Detailed Tool Docs**: [MCP_TOOLS.md](./MCP_TOOLS.md)
- **AI Agent Skill**: [skills/websee-frontend-debugger/](./skills/websee-frontend-debugger/)
- **Setup Guide (Claude Code)**: [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md)
- **Setup Guide (Claude Desktop)**: [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

---

**Last Updated**: 2025-10-26
**Maintainer**: Your Organization
**License**: MIT
