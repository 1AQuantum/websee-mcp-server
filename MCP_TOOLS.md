# WebSee MCP Tools Reference

> Comprehensive documentation for all WebSee MCP tools

This document provides detailed information about each MCP tool provided by WebSee Source Intelligence, including parameters, examples, and best practices.

## Table of Contents

- [Overview](#overview)
- [Tool List](#tool-list)
  - [debug_frontend_issue](#debug_frontend_issue)
  - [analyze_performance](#analyze_performance)
  - [inspect_component_state](#inspect_component_state)
  - [trace_network_requests](#trace_network_requests)
  - [analyze_bundle_size](#analyze_bundle_size)
  - [resolve_minified_error](#resolve_minified_error)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)
- [Error Handling](#error-handling)

---

## Overview

WebSee provides six MCP tools that enable Claude Desktop and other AI assistants to debug and analyze frontend applications. Each tool is designed to address specific debugging scenarios while providing comprehensive context.

### Tool Philosophy

- **Comprehensive Context** - Tools provide full context including source code, components, and network activity
- **Source Map Resolution** - All JavaScript errors are automatically resolved to original source code
- **Component Awareness** - Tools understand React, Vue, and Angular component structures
- **Network Intelligence** - Network requests are traced to the code that triggered them

---

## Tool List

## debug_frontend_issue

Debug frontend issues by analyzing components, network activity, console errors, and page errors. This is the most comprehensive diagnostic tool, ideal for investigating general issues.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The URL of the page experiencing issues |
| `selector` | string | No | CSS selector to focus on a specific component |
| `errorMessage` | string | No | Specific error message to investigate |
| `screenshot` | boolean | No | Capture screenshot of the issue (default: false) |

### Returns

```typescript
{
  url: string;
  timestamp: string;
  issues: Array<{
    type: string;
    message: string;
    sourceLocation?: SourceLocation;
    components?: ComponentInfo[];
    networkContext?: NetworkTrace[];
  }>;
  components: ComponentInfo[];
  network: NetworkTrace[];
  console: ConsoleMessage[];
  screenshot?: string;  // Path to screenshot if requested
}
```

### Example Usage

**Basic debugging:**
```
Use debug_frontend_issue to investigate https://example.com/checkout
```

**Focus on specific component:**
```
Debug the login form at https://example.com/login using selector "#login-form"
```

**Investigate specific error:**
```
Debug https://myapp.com with error message "Cannot read property 'map' of undefined"
and capture a screenshot
```

### Use Cases

1. **General Issue Investigation** - When you don't know what's wrong, this tool provides a comprehensive overview
2. **Component Debugging** - Focus on a specific component to see its state and any errors
3. **Error Context** - Understand the full context around a specific error message
4. **Visual Documentation** - Capture screenshots alongside technical analysis

### Example Output

```json
{
  "url": "https://example.com/dashboard",
  "timestamp": "2025-10-26T10:30:00.000Z",
  "issues": [
    {
      "type": "error_traced",
      "originalError": "Cannot read property 'name' of undefined",
      "sourceLocation": {
        "file": "src/components/UserProfile.tsx",
        "line": 45,
        "column": 12
      },
      "components": [
        { "name": "UserProfile", "framework": "react" }
      ],
      "networkContext": [
        { "url": "/api/user/123", "status": 404 }
      ]
    }
  ],
  "components": [...],
  "network": [...],
  "console": [
    {
      "type": "error",
      "text": "Failed to load user data",
      "location": { "url": "app.js", "line": 234 }
    }
  ]
}
```

---

## analyze_performance

Analyze frontend performance including network timing, component rendering, bundle size, and memory usage. Use this tool to identify performance bottlenecks.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The URL to analyze for performance |
| `interactions` | array | No | User interactions to perform before analysis |
| `metrics` | array | No | Metrics to analyze (default: ["network", "components"]) |

**Interactions Schema:**
```typescript
{
  action: "click" | "type" | "scroll" | "navigate";
  selector?: string;  // Required for click and type
  value?: string;     // Required for type and navigate
}
```

**Available Metrics:**
- `network` - Network request timing and performance
- `components` - Component count and nesting analysis
- `bundle` - JavaScript bundle size analysis
- `memory` - Memory usage (Chrome/Edge only)

### Returns

```typescript
{
  url: string;
  timestamp: string;
  metrics: {
    network?: {
      totalRequests: number;
      slowRequests: number;
      averageDuration: number;
      slowestRequests: NetworkTrace[];
    };
    components?: {
      totalComponents: number;
      byFramework: Record<string, number>;
      deepestNesting: number;
    };
    bundle?: {
      totalScripts: number;
      totalSize: number;
      largestScripts: Array<{ src: string; size: number }>;
    };
    memory?: {
      usedJSHeapSize: string;
      totalJSHeapSize: string;
      limit: string;
    };
  };
}
```

### Example Usage

**Basic performance analysis:**
```
Analyze performance of https://myapp.com/dashboard
```

**With user interactions:**
```
Analyze performance of https://example.com after:
1. Click on #load-more-button
2. Scroll to bottom
3. Click on #filter-dropdown
```

**Specific metrics:**
```
Analyze https://myapp.com focusing on network and memory metrics only
```

### Use Cases

1. **Slow Page Load** - Identify slow network requests and large bundles
2. **Interaction Performance** - Measure performance after specific user actions
3. **Memory Leaks** - Monitor memory usage during interactions
4. **Bundle Optimization** - Find opportunities to reduce JavaScript size

### Example Output

```json
{
  "url": "https://myapp.com/dashboard",
  "timestamp": "2025-10-26T10:30:00.000Z",
  "metrics": {
    "network": {
      "totalRequests": 45,
      "slowRequests": 3,
      "averageDuration": 234,
      "slowestRequests": [
        {
          "url": "/api/analytics/data",
          "duration": 3400,
          "triggeredBy": {
            "file": "src/hooks/useAnalytics.ts",
            "line": 23
          }
        }
      ]
    },
    "components": {
      "totalComponents": 28,
      "byFramework": { "react": 28 },
      "deepestNesting": 7
    },
    "bundle": {
      "totalScripts": 5,
      "totalSize": 1245678,
      "largestScripts": [
        { "src": "vendor.js", "size": 856000 }
      ]
    },
    "memory": {
      "usedJSHeapSize": "45 MB",
      "totalJSHeapSize": "67 MB",
      "limit": "4096 MB"
    }
  }
}
```

---

## inspect_component_state

Inspect the state, props, and structure of a specific React, Vue, or Angular component. Perfect for understanding component behavior and debugging state issues.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The page URL |
| `selector` | string | Yes | CSS selector for the component |
| `waitForSelector` | boolean | No | Wait for element to appear (default: true) |
| `includeChildren` | boolean | No | Include child components (default: false) |

### Returns

```typescript
{
  selector: string;
  component: {
    name: string;
    framework: "react" | "vue" | "angular";
    props: Record<string, any>;
    state: Record<string, any>;
    source?: {
      file: string;
      line: number;
    };
    parents: string[];
  };
  children?: Array<{
    name: string;
    props: Record<string, any>;
    state: Record<string, any>;
  }>;
}
```

### Example Usage

**Basic component inspection:**
```
Inspect component state at https://example.com using selector "#user-profile"
```

**With children:**
```
Inspect the dashboard component at https://myapp.com/dashboard
selector: ".dashboard-container"
Include all child components
```

**Wait for dynamic component:**
```
Inspect the modal component at https://app.com
Wait for selector "#confirmation-modal" to appear
```

### Use Cases

1. **State Debugging** - See current state and props of a component
2. **Component Hierarchy** - Understand parent-child relationships
3. **Props Validation** - Verify correct props are being passed
4. **Dynamic Components** - Inspect components that appear conditionally

### Example Output

```json
{
  "selector": "#user-profile",
  "component": {
    "name": "UserProfile",
    "framework": "react",
    "props": {
      "userId": "123",
      "showAvatar": true,
      "onEdit": "[Function]"
    },
    "state": {
      "loading": false,
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "editMode": false
    },
    "source": {
      "file": "src/components/UserProfile.tsx",
      "line": 12
    },
    "parents": ["App", "Dashboard", "ProfileSection"]
  },
  "children": [
    {
      "name": "Avatar",
      "props": { "src": "/avatars/123.jpg", "size": "large" },
      "state": {}
    },
    {
      "name": "UserDetails",
      "props": { "user": {...} },
      "state": { "expanded": true }
    }
  ]
}
```

---

## trace_network_requests

Trace network requests and identify the source code that triggered them. Essential for understanding API call patterns and debugging network issues.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The page URL |
| `pattern` | string | No | URL pattern to filter (e.g., '/api/*') |
| `method` | string | No | HTTP method to filter by (default: "ALL") |
| `waitTime` | number | No | Time to wait for requests in ms (default: 3000) |

**Available Methods:**
- `GET`
- `POST`
- `PUT`
- `DELETE`
- `PATCH`
- `ALL` (default)

### Returns

```typescript
{
  url: string;
  pattern?: string;
  method: string;
  totalRequests: number;
  requests: Array<{
    url: string;
    method: string;
    status: number;
    duration: number;
    size: number;
    triggeredBy?: {
      file: string;
      line: number;
      column: number;
    };
    timestamp: string;
  }>;
}
```

### Example Usage

**Trace all requests:**
```
Trace all network requests on https://example.com/dashboard
```

**Filter by pattern:**
```
Trace API calls on https://myapp.com matching pattern "/api/users/*"
```

**Filter by method:**
```
Trace all POST requests on https://example.com
Wait 5 seconds to capture all requests
```

### Use Cases

1. **API Debugging** - Find which component is making API calls
2. **Performance Analysis** - Identify slow network requests
3. **Request Patterns** - Understand the sequence of network calls
4. **Failed Requests** - Trace the source of 404 or 500 errors

### Example Output

```json
{
  "url": "https://myapp.com/dashboard",
  "pattern": "/api/*",
  "method": "ALL",
  "totalRequests": 12,
  "requests": [
    {
      "url": "/api/users/current",
      "method": "GET",
      "status": 200,
      "duration": 245,
      "size": 1024,
      "triggeredBy": {
        "file": "src/hooks/useCurrentUser.ts",
        "line": 15,
        "column": 8
      },
      "timestamp": "2025-10-26T10:30:01.234Z"
    },
    {
      "url": "/api/dashboard/stats",
      "method": "GET",
      "status": 200,
      "duration": 1234,
      "size": 5678,
      "triggeredBy": {
        "file": "src/components/Dashboard.tsx",
        "line": 42,
        "column": 12
      },
      "timestamp": "2025-10-26T10:30:01.456Z"
    }
  ]
}
```

---

## analyze_bundle_size

Analyze JavaScript bundle size, identify large modules, and get optimization recommendations.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The application URL |
| `moduleName` | string | No | Specific module to search for |
| `threshold` | number | No | Size threshold in KB to flag modules (default: 50) |

### Returns

```typescript
{
  url: string;
  scripts: {
    total: number;
    totalSize: number;
    files: Array<{
      src: string;
      size: number;
      async: boolean;
      defer: boolean;
    }>;
  };
  stylesheets: {
    total: number;
    files: Array<{
      href: string;
      media: string;
    }>;
  };
  modules: Array<{
    name: string;
    size: number;
    sizeKB: string;
    chunks: string[];
    dependencies: string[];
  }>;
  recommendations: string[];
}
```

### Example Usage

**Basic bundle analysis:**
```
Analyze bundle size for https://myapp.com
```

**Find specific module:**
```
Check if moment.js is in the bundle at https://example.com
```

**Custom threshold:**
```
Analyze https://myapp.com and flag any modules larger than 100 KB
```

### Use Cases

1. **Bundle Optimization** - Find opportunities to reduce bundle size
2. **Module Detection** - Check if specific libraries are included
3. **Code Splitting** - Identify modules that should be lazy loaded
4. **Dependency Audit** - See what dependencies are in the bundle

### Example Output

```json
{
  "url": "https://myapp.com",
  "scripts": {
    "total": 5,
    "totalSize": 1245678,
    "files": [
      {
        "src": "https://myapp.com/static/vendor.js",
        "size": 856000,
        "async": false,
        "defer": true
      },
      {
        "src": "https://myapp.com/static/app.js",
        "size": 389678,
        "async": false,
        "defer": true
      }
    ]
  },
  "stylesheets": {
    "total": 2,
    "files": [
      { "href": "/static/main.css", "media": "all" }
    ]
  },
  "modules": [
    {
      "name": "moment",
      "size": 71680,
      "sizeKB": "70.00 KB",
      "chunks": ["vendor"],
      "dependencies": []
    }
  ],
  "recommendations": [
    "Module 'moment' is 70.00 KB, exceeding threshold of 50 KB. Consider code splitting or lazy loading.",
    "Found 2 script(s) larger than 50 KB. Consider code splitting for better performance."
  ]
}
```

---

## resolve_minified_error

Resolve minified error stack traces to original source code using source maps. Perfect for debugging production errors.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The page URL |
| `errorStack` | string | Yes | The minified error stack trace |
| `triggerError` | boolean | No | Try to trigger the error on the page (default: false) |

### Returns

```typescript
{
  resolved: boolean;
  original: string;
  sourceMap: string[];
  components?: ComponentInfo[];
  networkContext?: NetworkTrace[];
  buildInfo?: ModuleInfo;
  message?: string;
}
```

### Example Usage

**Resolve production error:**
```
Resolve this error from https://myapp.com:
Error: Cannot read property 'map' of undefined
  at t.render (app.min.js:1:28473)
  at r.update (app.min.js:1:34567)
```

**With error triggering:**
```
Resolve error on https://example.com and try to trigger it:
TypeError: Cannot read property 'name' of undefined
  at Object.a (bundle.js:2:1234)
```

### Use Cases

1. **Production Error Debugging** - Resolve errors from production environments
2. **Error Reports** - Make sense of error reports from users
3. **Stack Trace Analysis** - Understand the full error context
4. **Minified Code Debugging** - Work with minified production code

### Example Output

```json
{
  "resolved": true,
  "original": "Error: Cannot read property 'map' of undefined\n  at t.render (app.min.js:1:28473)",
  "sourceMap": [
    "Error: Cannot read property 'map' of undefined",
    "  at UserList.render (src/components/UserList.tsx:34:12)",
    "  > const userNames = users.map(u => u.name);",
    "  at ComponentRenderer.update (src/lib/renderer.ts:45:8)"
  ],
  "components": [
    {
      "name": "UserList",
      "framework": "react",
      "props": { "users": null }
    }
  ],
  "networkContext": [
    {
      "url": "/api/users",
      "status": 404,
      "duration": 123
    }
  ],
  "buildInfo": {
    "name": "UserList.tsx",
    "size": 2345,
    "chunks": ["app"]
  }
}
```

---

## Common Patterns

### Progressive Investigation

Start with broad tools and narrow down:

1. **Initial Investigation** - Use `debug_frontend_issue` to get overall picture
2. **Component Focus** - Use `inspect_component_state` on suspicious components
3. **Network Analysis** - Use `trace_network_requests` to find API issues
4. **Error Resolution** - Use `resolve_minified_error` for specific errors

### Performance Workflow

1. Use `analyze_performance` with all metrics to get baseline
2. Use `trace_network_requests` to find slow API calls
3. Use `analyze_bundle_size` to identify optimization opportunities
4. Use `inspect_component_state` to check for unnecessary re-renders

### Production Debugging

1. Copy error stack from production logs
2. Use `resolve_minified_error` to get source locations
3. Use `debug_frontend_issue` on production URL to reproduce
4. Use `inspect_component_state` to verify component state

---

## Best Practices

### URL Requirements

- **Always use full URLs** including protocol (https://)
- **Ensure URLs are accessible** from the machine running the MCP server
- **Use production URLs sparingly** - prefer staging/development environments
- **Authentication** - For authenticated pages, ensure the app handles auth gracefully or use public pages

### Selector Best Practices

- **Use specific selectors** - Prefer IDs and data attributes over classes
- **Avoid generic selectors** - Don't use `div`, `span`, etc.
- **Test selectors first** - Verify selectors work in browser DevTools
- **Use component roots** - Target the root element of components
- **Handle dynamic content** - Set `waitForSelector: true` for dynamic content

### Performance Considerations

- **Headless mode** - Set `HEADLESS=true` for better performance
- **Browser choice** - Chromium is fastest, WebKit is most lightweight
- **Wait times** - Use minimal wait times for network tracing (2-3 seconds usually sufficient)
- **Selective metrics** - Only request metrics you need

### Error Handling

- **Invalid URLs** - Tool will return error with clear message
- **Missing elements** - Use `waitForSelector` or check console output
- **Network timeouts** - Increase `waitTime` for slow applications
- **Source maps missing** - Ensure application generates source maps

---

## Error Handling

### Common Errors and Solutions

**"Browser failed to launch"**
```bash
# Solution: Install browsers
npx playwright install chromium
```

**"Element not found"**
- Verify selector using browser DevTools
- Enable `waitForSelector: true`
- Check if element is in iframe (not currently supported)

**"Source maps not available"**
- Ensure application generates source maps
- Check that source maps are served with correct CORS headers
- Verify source map URLs in browser DevTools

**"Network timeout"**
- Increase `waitTime` parameter
- Check if application is accessible
- Verify network connectivity

**"Component not detected"**
- Ensure application is in development mode (for React/Vue/Angular)
- Verify selector targets a component root element
- Check that framework-specific detection is working

---

## Additional Resources

- **[WebSee README](./README.md)** - Getting started and installation
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Extending WebSee with custom tools
- **[MCP Documentation](https://modelcontextprotocol.io)** - Model Context Protocol specification
- **[Anthropic MCP Guide](https://docs.anthropic.com/en/docs/build-with-claude/mcp)** - Building with MCP

---

**Need help?** Open an issue on GitHub or check the troubleshooting section in the README.
