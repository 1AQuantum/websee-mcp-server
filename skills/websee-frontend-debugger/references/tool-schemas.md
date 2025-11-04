# WebSee MCP Tool Schemas

Complete parameter documentation and schemas for all WebSee MCP tools.

## debug_frontend_issue

**Purpose**: Comprehensive frontend debugging with component, network, and error analysis.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The URL of the page experiencing issues |
| `selector` | string | No | CSS selector to focus analysis on specific element |
| `errorMessage` | string | No | Specific error message to investigate |
| `screenshot` | boolean | No | Capture screenshot of the issue (default: false) |

### Return Schema

```typescript
{
  url: string;
  timestamp: string;
  issues: Array<{
    type: "selector_not_found" | "error_traced" | string;
    message: string;
    originalError?: string;
    sourceLocation?: {
      file: string;
      line: number;
      column: number;
    };
    components?: ComponentInfo[];
    networkContext?: NetworkTrace[];
  }>;
  components: Array<{
    selector: string;
    name: string;
    framework: "react" | "vue" | "angular";
    props: Record<string, any>;
    state: Record<string, any>;
    parents: string[];
  }>;
  network: Array<{
    url: string;
    method: string;
    status: number;
    duration: number;
    triggeredBy?: {
      file: string;
      line: number;
      function: string;
    };
  }>;
  console: Array<{
    type: "error" | "warning";
    text: string;
    location: {
      url: string;
      lineNumber: number;
      columnNumber: number;
    };
  }>;
  screenshot?: string; // File path if captured
}
```

### Example Usage

```json
{
  "url": "https://example.com/login",
  "selector": "#login-form",
  "errorMessage": "Cannot read property",
  "screenshot": true
}
```

---

## analyze_performance

**Purpose**: Analyze frontend performance across network, components, bundle size, and memory.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The URL to analyze |
| `interactions` | Array<Interaction> | No | User interactions to perform before analysis |
| `metrics` | Array<string> | No | Metrics to analyze: "network", "components", "bundle", "memory" (default: ["network", "components"]) |

#### Interaction Schema

```typescript
{
  action: "click" | "type" | "scroll" | "navigate";
  selector?: string;  // Required for click/type
  value?: string;     // Required for type/navigate
}
```

### Return Schema

```typescript
{
  url: string;
  timestamp: string;
  metrics: {
    network?: {
      totalRequests: number;
      slowRequests: number;
      averageDuration: number;
      slowestRequests: Array<{
        url: string;
        duration: number;
        triggeredBy?: {
          file: string;
          line: number;
        };
      }>;
    };
    components?: {
      totalComponents: number;
      byFramework: Record<string, number>;
      deepestNesting: number;
    };
    bundle?: {
      totalScripts: number;
      totalSize: number;
      largestScripts: Array<{
        src: string;
        size: number;
      }>;
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

---

## inspect_component_state

**Purpose**: Inspect React/Vue/Angular component state, props, and hierarchy.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The page URL |
| `selector` | string | Yes | CSS selector for the component |
| `waitForSelector` | boolean | No | Wait for element to appear (default: true) |
| `includeChildren` | boolean | No | Include child components (default: false) |

### Return Schema

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

```json
{
  "url": "https://app.com",
  "selector": "#user-profile",
  "waitForSelector": true,
  "includeChildren": true
}
```

---

## trace_network_requests

**Purpose**: Trace network requests and identify what code triggered them.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The page URL |
| `pattern` | string | No | URL pattern to filter (e.g., '/api/*') |
| `method` | enum | No | HTTP method: "GET", "POST", "PUT", "DELETE", "PATCH", "ALL" (default: "ALL") |
| `waitTime` | number | No | Time to wait for requests in ms (default: 3000) |

### Return Schema

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
      function: string;
    };
    timestamp: string;
  }>;
}
```

### Example Usage

```json
{
  "url": "https://app.com",
  "pattern": "/api/users/*",
  "method": "GET",
  "waitTime": 5000
}
```

---

## analyze_bundle_size

**Purpose**: Analyze JavaScript bundle size and identify large modules.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The application URL |
| `moduleName` | string | No | Specific module to search for |
| `threshold` | number | No | Size threshold in KB to flag modules (default: 50) |

### Return Schema

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
    size?: number;
    sizeKB?: string;
    chunks?: string[];
    dependencies?: string[];
    found?: boolean;
    message?: string;
  }>;
  recommendations: string[];
}
```

### Example Usage

```json
{
  "url": "https://app.com",
  "moduleName": "lodash",
  "threshold": 50
}
```

---

## resolve_minified_error

**Purpose**: Resolve minified error stack traces to original source code using source maps.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The page URL |
| `errorStack` | string | Yes | The minified error stack trace |
| `triggerError` | boolean | No | Try to trigger the error automatically (default: false) |

### Return Schema

```typescript
{
  resolved: boolean;
  original: string;
  sourceMap: string[];
  components?: ComponentInfo[];
  networkContext?: NetworkTrace[];
  buildInfo?: {
    module: string;
    chunk: string;
    size: number;
  };
  message?: string;
}
```

### Example Usage

```json
{
  "url": "https://app.com",
  "errorStack": "TypeError: Cannot read property 'map' of undefined\n  at t.render (main.7a8f9c2.js:1:48392)",
  "triggerError": true
}
```

---

## Common Patterns

### Pattern: URL Matching

All tools accept full URLs:
- ✅ `https://example.com`
- ✅ `https://app.com/dashboard?user=123`
- ✅ `http://localhost:3000`

### Pattern: CSS Selectors

For `selector` parameters:
- ✅ ID: `#user-profile`
- ✅ Class: `.user-card`
- ✅ Attribute: `[data-testid="login-form"]`
- ✅ Complex: `#app > .main-content .user-list`

### Pattern: Network Filtering

For `pattern` parameter in trace_network_requests:
- ✅ Prefix: `/api/*`
- ✅ Exact: `/api/users`
- ✅ Contains: `*graphql*`
- ✅ Extension: `*.json`

### Pattern: Error Handling

All tools return errors in this format:
```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

## Performance Thresholds

Use these thresholds to identify issues:

| Metric | Threshold | Interpretation |
|--------|-----------|----------------|
| Network request | >1000ms | Slow, investigate |
| Network request | >3000ms | Very slow, critical |
| Bundle size | >100KB | Consider splitting |
| Bundle size | >500KB | Too large, must split |
| Memory usage | >50MB | Monitor for leaks |
| Memory usage | >200MB | Likely memory leak |
| Component nesting | >10 levels | Too deep, refactor |

## Framework-Specific Notes

### React

- Component state includes hooks state
- Props include all passed properties
- Development mode provides more detail
- Production requires React DevTools integration

### Vue

- Component state includes reactive data
- Props are Vue component props
- Computed properties shown in state
- Watchers affect state tracking

### Angular

- Component state includes class properties
- Props are @Input decorators
- Services not included in component state
- Zone.js affects timing

## grep_patterns

Search patterns for finding information in this file:

- Tool schemas: `^## [a-z_]+$`
- Parameters: `^### Parameters`
- Return schemas: `^### Return Schema`
- Examples: `^### Example Usage`
- Patterns: `^### Pattern:`
