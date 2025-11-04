# WebSee MCP Server - Tool Usage Examples

Complete guide with practical examples for all 16 tools.

---

## Table of Contents

1. [Source Intelligence Tools](#source-intelligence-tools)
2. [Build Intelligence Tools](#build-intelligence-tools)
3. [Error Intelligence Tools](#error-intelligence-tools)
4. [Integration Examples](#integration-examples)

---

## Source Intelligence Tools

### 1. source_map_resolve

**Resolve a minified location to its original source**

```typescript
// Example 1: Resolve a specific error location
const params = {
  url: "https://example.com/static/js/main.chunk.js",
  line: 1,
  column: 23456
};

// Response
{
  "success": true,
  "minified": {
    "url": "https://example.com/static/js/main.chunk.js",
    "line": 1,
    "column": 23456
  },
  "original": {
    "file": "src/components/ProductList.tsx",
    "line": 87,
    "column": 12,
    "name": "handleAddToCart",
    "content": "  const handleAddToCart = (product: Product) => {"
  }
}
```

**Use Cases:**
- Debugging production errors from minified bundles
- Mapping click events to source code
- Tracing performance bottlenecks
- Code review of minified applications

---

### 2. source_map_get_content

**Retrieve original source file content**

```typescript
// Example 1: Get full file content
const params = {
  file: "src/components/ProductList.tsx"
};

// Response
{
  "success": true,
  "file": "src/components/ProductList.tsx",
  "content": "import React, { useState } from 'react';\n...",
  "language": "typescript",
  "totalLines": 245
}

// Example 2: Get specific line range
const params = {
  file: "src/utils/api.ts",
  startLine: 42,
  endLine: 50
};

// Response
{
  "success": true,
  "file": "src/utils/api.ts",
  "content": "export async function fetchProducts() {\n  const response = await fetch(API_URL);\n  ...",
  "language": "typescript",
  "totalLines": 128,
  "range": { "start": 42, "end": 50 }
}
```

**Use Cases:**
- Viewing source code in debugging tools
- Code review without access to repository
- Displaying context around errors
- Extracting snippets for documentation

---

### 3. source_trace_stack

**Enhance error stack traces with source maps**

```typescript
// Example 1: Resolve a production error stack
const params = {
  stackTrace: `Error: Failed to fetch product data
    at t (main.chunk.js:1:23456)
    at r (main.chunk.js:1:34567)
    at n (vendors.chunk.js:2:45678)
    at Object.handleClick (main.chunk.js:1:56789)`
};

// Response
{
  "success": true,
  "original": [
    "Error: Failed to fetch product data",
    "at t (main.chunk.js:1:23456)",
    "at r (main.chunk.js:1:34567)",
    "at n (vendors.chunk.js:2:45678)",
    "at Object.handleClick (main.chunk.js:1:56789)"
  ],
  "resolved": [
    "Error: Failed to fetch product data",
    "at fetchProducts (src/utils/api.ts:42:15)",
    "    > const response = await fetch(API_URL);",
    "at useProducts (src/hooks/useProducts.ts:23:8)",
    "    > const data = await fetchProducts();",
    "at retry (node_modules/async-retry/index.js:67:22)",
    "at handleClick (src/components/ProductList.tsx:87:12)",
    "    > const handleAddToCart = (product: Product) => {"
  ],
  "summary": {
    "totalFrames": 5,
    "resolvedFrames": 4,
    "unresolvedFrames": 1
  }
}
```

**Use Cases:**
- Debugging production errors
- Error reporting with full context
- Automated error analysis
- Stack trace visualization

---

### 4. source_find_definition

**Find function or class definitions**

```typescript
// Example 1: Find component definition
const params = {
  functionName: "ProductList"
};

// Response
{
  "success": true,
  "functionName": "ProductList",
  "definition": {
    "file": "src/components/ProductList.tsx",
    "line": 15,
    "column": 0,
    "code": "export function ProductList({ category }: ProductListProps) {\n  const [products, setProducts] = useState<Product[]>([]);\n  const [loading, setLoading] = useState(true);\n  \n  useEffect(() => {\n    fetchProducts(category).then(setProducts);",
    "exports": ["ProductList"]
  }
}

// Example 2: Find in specific file
const params = {
  functionName: "handleSubmit",
  file: "src/components/CheckoutForm.tsx"
};

// Response
{
  "success": true,
  "functionName": "handleSubmit",
  "definition": {
    "file": "src/components/CheckoutForm.tsx",
    "line": 67,
    "column": 2,
    "code": "  const handleSubmit = async (event: FormEvent) => {\n    event.preventDefault();\n    setSubmitting(true);\n    \n    try {\n      await processCheckout(formData);",
    "exports": ["CheckoutForm", "default"]
  }
}
```

**Use Cases:**
- Jump to definition in debugging tools
- Code navigation in production apps
- Understanding code structure
- API documentation generation

---

### 5. source_get_symbols

**Extract exports, imports, and types**

```typescript
// Example: Analyze a source file
const params = {
  file: "src/components/ProductList.tsx"
};

// Response
{
  "success": true,
  "file": "src/components/ProductList.tsx",
  "exports": [
    { "name": "ProductList", "type": "function", "line": 15 },
    { "name": "ProductListProps", "type": "interface", "line": 8 },
    { "name": "default", "type": "default", "line": 89 }
  ],
  "imports": [
    { "name": "React", "from": "react", "line": 1 },
    { "name": "useState", "from": "react", "line": 1 },
    { "name": "useEffect", "from": "react", "line": 1 },
    { "name": "Product", "from": "../types/Product", "line": 2 },
    { "name": "fetchProducts", "from": "../utils/api", "line": 3 }
  ],
  "types": [
    { "name": "ProductListProps", "kind": "interface", "line": 8 },
    { "name": "FilterOptions", "kind": "type", "line": 12 }
  ],
  "summary": {
    "totalExports": 3,
    "totalImports": 5,
    "totalTypes": 2
  }
}
```

**Use Cases:**
- Dependency analysis
- Import/export validation
- Type checking visualization
- Module documentation

---

### 6. source_map_bundle

**Map bundle to all source files**

```typescript
// Example: Analyze main bundle
const params = {
  bundlePath: "https://example.com/static/js/main.chunk.js"
};

// Response
{
  "success": true,
  "bundle": "https://example.com/static/js/main.chunk.js",
  "sources": [
    "webpack://./src/index.tsx",
    "webpack://./src/App.tsx",
    "webpack://./src/components/ProductList.tsx",
    "webpack://./src/components/ProductCard.tsx",
    "webpack://./src/components/Cart.tsx",
    "webpack://./src/utils/api.ts",
    "webpack://./src/utils/formatters.ts",
    "webpack://./src/hooks/useProducts.ts",
    "webpack://./node_modules/react/index.js",
    "// ... 237 more files"
  ],
  "mappings": [
    {
      "source": "webpack://./src/App.tsx",
      "generatedLine": 1,
      "generatedColumn": 123,
      "originalLine": 15,
      "originalColumn": 8
    },
    {
      "source": "webpack://./src/components/ProductList.tsx",
      "generatedLine": 1,
      "generatedColumn": 5678,
      "originalLine": 23,
      "originalColumn": 12
    }
    // ... 18 more sample mappings
  ],
  "summary": {
    "totalSources": 245,
    "sampleMappings": 20
  }
}
```

**Use Cases:**
- Bundle composition analysis
- Source file discovery
- Build optimization
- Dead code identification

---

### 7. source_coverage_map

**Map code coverage to source files**

```typescript
// Example: Analyze test coverage
const params = {
  coverageData: {
    // V8 coverage data from Playwright or Chrome DevTools
    result: [
      {
        url: "https://example.com/static/js/main.chunk.js",
        ranges: [
          { startOffset: 0, endOffset: 1000, count: 5 },
          { startOffset: 1000, endOffset: 2000, count: 0 },
          { startOffset: 2000, endOffset: 3000, count: 3 }
        ]
      }
    ]
  }
};

// Response
{
  "success": true,
  "covered": [
    {
      "file": "src/App.tsx",
      "lines": [1, 2, 3, 4, 5, 15, 16, 17, 23, 24, 25],
      "percentage": 78.5
    },
    {
      "file": "src/components/ProductList.tsx",
      "lines": [1, 2, 15, 16, 17, 23, 24, 87, 88, 89],
      "percentage": 65.2
    }
  ],
  "uncovered": [
    {
      "file": "src/utils/errorHandling.ts",
      "lines": [12, 13, 14, 15, 42, 43, 44],
      "percentage": 34.8
    },
    {
      "file": "src/components/ErrorBoundary.tsx",
      "lines": [23, 24, 25, 26, 27],
      "percentage": 21.5
    }
  ],
  "summary": {
    "totalFiles": 45,
    "coveredFiles": 38,
    "uncoveredFiles": 7,
    "overallPercentage": "68.50%"
  }
}
```

**Use Cases:**
- Test coverage analysis
- Identifying untested code paths
- E2E test optimization
- Production usage monitoring

---

## Build Intelligence Tools

### 8. build_get_manifest

**Get webpack/vite build manifest**

```typescript
// Example: Analyze build configuration
const params = {
  url: "https://example.com"
};

// Response
{
  "type": "webpack",
  "version": "5.89.0",
  "chunks": [
    {
      "id": "main",
      "files": ["static/js/main.chunk.js", "static/css/main.chunk.css"],
      "size": 245678,
      "entry": true,
      "initial": true
    },
    {
      "id": "vendors",
      "files": ["static/js/vendors.chunk.js"],
      "size": 456789,
      "entry": false,
      "initial": true
    },
    {
      "id": "runtime",
      "files": ["static/js/runtime.chunk.js"],
      "size": 12345,
      "entry": false,
      "initial": true
    }
  ],
  "assets": [
    {
      "name": "static/js/main.chunk.js",
      "size": 234567,
      "chunks": ["main"]
    },
    {
      "name": "static/css/main.chunk.css",
      "size": 11111,
      "chunks": ["main"]
    }
  ],
  "modules": [
    {
      "id": "./src/App.tsx",
      "name": "./src/App.tsx",
      "size": 4567,
      "chunks": ["main"]
    }
    // ... more modules
  ]
}
```

**Use Cases:**
- Build analysis
- Performance auditing
- Bundle optimization
- Deployment validation

---

### 9. build_get_chunks

**Get all code chunks**

```typescript
// Example: Analyze chunk splitting
const params = {
  url: "https://example.com"
};

// Response
{
  "chunks": [
    {
      "id": "main",
      "files": ["static/js/main.chunk.js"],
      "modules": [
        "./src/App.tsx",
        "./src/index.tsx",
        "./src/components/ProductList.tsx"
      ],
      "size": 234567,
      "sizeKB": "229.07",
      "entry": true,
      "initial": true
    },
    {
      "id": "products-page",
      "files": ["static/js/products-page.chunk.js"],
      "modules": [
        "./src/pages/ProductsPage.tsx",
        "./src/components/ProductFilters.tsx"
      ],
      "size": 45678,
      "sizeKB": "44.61",
      "entry": false,
      "initial": false
    },
    {
      "id": "checkout-page",
      "files": ["static/js/checkout-page.chunk.js"],
      "modules": [
        "./src/pages/CheckoutPage.tsx",
        "./src/components/CheckoutForm.tsx"
      ],
      "size": 34567,
      "sizeKB": "33.76",
      "entry": false,
      "initial": false
    }
  ]
}
```

**Use Cases:**
- Code splitting verification
- Lazy loading analysis
- Cache optimization
- Initial load performance

---

### 10. build_find_module

**Find specific module**

```typescript
// Example 1: Find React module
const params = {
  url: "https://example.com",
  moduleName: "react"
};

// Response
{
  "name": "react",
  "id": "./node_modules/react/index.js",
  "size": 45678,
  "sizeKB": "44.61",
  "chunks": ["vendors"],
  "dependencies": [
    "object-assign",
    "prop-types",
    "scheduler"
  ],
  "source": "/** @license React v18.2.0\n * react.production.min.js..."
}

// Example 2: Find custom module
const params = {
  url: "https://example.com",
  moduleName: "ProductList"
};

// Response
{
  "name": "./src/components/ProductList.tsx",
  "id": "./src/components/ProductList.tsx",
  "size": 4567,
  "sizeKB": "4.46",
  "chunks": ["main"],
  "dependencies": [
    "react",
    "../utils/api",
    "../types/Product"
  ],
  "source": "import React from 'react';\nimport { Product } from '../types/Product'..."
}
```

**Use Cases:**
- Module size investigation
- Dependency tracking
- Version verification
- Dead code detection

---

### 11. build_get_dependencies

**Get dependency graph**

```typescript
// Example 1: Get all dependencies
const params = {
  url: "https://example.com"
};

// Response
{
  "dependencies": [
    {
      "name": "react",
      "size": 45678,
      "sizeKB": "44.61",
      "dependents": ["./src/App.tsx", "./src/components/ProductList.tsx", ...],
      "chunks": ["vendors"]
    },
    {
      "name": "./src/utils/api.ts",
      "size": 2345,
      "sizeKB": "2.29",
      "dependents": ["./src/hooks/useProducts.ts", "./src/pages/ProductsPage.tsx"],
      "chunks": ["main"]
    }
  ]
}

// Example 2: Get dependencies for specific module
const params = {
  url: "https://example.com",
  moduleName: "./src/App.tsx"
};

// Response
{
  "dependencies": [
    {
      "name": "react",
      "size": 45678,
      "sizeKB": "44.61",
      "dependents": ["./src/App.tsx"],
      "chunks": ["vendors"]
    },
    {
      "name": "./src/components/ProductList.tsx",
      "size": 4567,
      "sizeKB": "4.46",
      "dependents": ["./src/App.tsx"],
      "chunks": ["main"]
    }
  ]
}
```

**Use Cases:**
- Dependency analysis
- Circular dependency detection
- Module impact assessment
- Refactoring planning

---

### 12. build_analyze_size

**Analyze bundle sizes**

```typescript
// Example: Comprehensive size analysis
const params = {
  url: "https://example.com",
  threshold: 50 // KB
};

// Response
{
  "total": 789012,
  "totalKB": "770.52",
  "totalMB": "0.75",
  "byType": {
    "js": {
      "count": 8,
      "size": 678901,
      "sizeKB": "663.00"
    },
    "css": {
      "count": 3,
      "size": 110111,
      "sizeKB": "107.52"
    },
    "other": {
      "count": 0,
      "size": 0,
      "sizeKB": "0.00"
    }
  },
  "large": [
    {
      "name": "vendors.chunk.js",
      "size": 456789,
      "sizeKB": "446.08",
      "type": "js",
      "percentage": "57.89%"
    },
    {
      "name": "main.chunk.js",
      "size": 234567,
      "sizeKB": "229.07",
      "type": "js",
      "percentage": "29.73%"
    },
    {
      "name": "styles.css",
      "size": 67890,
      "sizeKB": "66.30",
      "type": "css",
      "percentage": "8.60%"
    }
  ],
  "recommendations": [
    "Found 3 asset(s) exceeding 50KB threshold. Consider code splitting.",
    "Total JavaScript size is 663.00KB. Consider lazy loading non-critical modules.",
    "Only 3 chunk(s) detected. Consider implementing more granular code splitting for better caching.",
    "12 modules appear in multiple chunks. Consider using commons chunks or tree shaking.",
    "CSS bundle size is 107.52KB. Consider critical CSS extraction and lazy loading."
  ]
}
```

**Use Cases:**
- Performance optimization
- Build size monitoring
- Lighthouse score improvement
- Bundle size budgeting

---

## Error Intelligence Tools

### 13. error_resolve_stack

**Resolve error stack traces**

```typescript
// Example: Real production error
const params = {
  url: "https://example.com",
  errorStack: `TypeError: Cannot read properties of null (reading 'price')
    at t (main.chunk.js:1:23456)
    at ProductCard (main.chunk.js:1:34567)
    at renderWithHooks (vendors.chunk.js:2:45678)
    at updateFunctionComponent (vendors.chunk.js:2:56789)`
};

// Response
{
  "original": [
    "TypeError: Cannot read properties of null (reading 'price')",
    "at t (main.chunk.js:1:23456)",
    "at ProductCard (main.chunk.js:1:34567)",
    "at renderWithHooks (vendors.chunk.js:2:45678)",
    "at updateFunctionComponent (vendors.chunk.js:2:56789)"
  ],
  "resolved": [
    {
      "original": "at t (main.chunk.js:1:23456)",
      "resolved": {
        "file": "src/components/ProductCard.tsx",
        "line": 42,
        "column": 18,
        "content": "  <span>${product.price}</span>"
      }
    },
    {
      "original": "at ProductCard (main.chunk.js:1:34567)",
      "resolved": {
        "file": "src/components/ProductCard.tsx",
        "line": 15,
        "column": 0,
        "content": "export function ProductCard({ product }: Props) {"
      }
    },
    {
      "original": "at renderWithHooks (vendors.chunk.js:2:45678)",
      "resolved": {
        "file": "node_modules/react-dom/cjs/react-dom.production.min.js",
        "line": 234,
        "column": 56
      }
    }
  ],
  "message": "Resolved 3 of 4 stack frames to original source"
}
```

**Use Cases:**
- Production error debugging
- Error monitoring integration
- Automated error reporting
- Developer tools integration

---

### 14. error_get_context

**Get comprehensive error context**

```typescript
// Example: Analyze error state
const params = {
  url: "https://example.com"
};

// Response (after page has errors)
{
  "errors": [
    {
      "type": "error",
      "message": "Cannot read properties of null (reading 'price')",
      "timestamp": 1698345678901,
      "location": "main.chunk.js:1:23456"
    },
    {
      "type": "pageerror",
      "message": "Uncaught ReferenceError: analytics is not defined",
      "timestamp": 1698345678950,
      "location": "main.chunk.js:1:78901"
    }
  ],
  "warnings": [
    {
      "type": "warning",
      "message": "componentWillMount has been renamed",
      "timestamp": 1698345678800,
      "location": "vendors.chunk.js:2:12345"
    }
  ],
  "components": [
    {
      "name": "App",
      "framework": "react",
      "state": {
        "user": null,
        "products": [],
        "loading": false,
        "error": "Failed to fetch products"
      },
      "props": {
        "theme": "dark",
        "locale": "en-US"
      }
    },
    {
      "name": "ProductList",
      "framework": "react",
      "state": {
        "selectedCategory": "electronics",
        "sortBy": "price"
      },
      "props": {
        "products": null  // <- This caused the error!
      }
    }
  ],
  "network": [
    {
      "url": "https://api.example.com/products",
      "method": "GET",
      "status": 500,  // <- API failure
      "duration": 3456,
      "timestamp": 1698345678500
    },
    {
      "url": "https://api.example.com/user",
      "method": "GET",
      "status": 200,
      "duration": 234,
      "timestamp": 1698345678200
    }
  ]
}
```

**Use Cases:**
- Comprehensive error debugging
- State inspection
- Network failure correlation
- Automated error reporting

---

### 15. error_trace_cause

**Trace error to root cause**

```typescript
// Example: Analyze production error
const params = {
  url: "https://example.com",
  errorMessage: "Cannot read properties of null"
};

// Response
{
  "rootCause": "Type error: Cannot read properties of null (reading 'price'). Likely caused by accessing a property on an undefined/null object. The API request to /products failed with status 500, which resulted in null data being passed to ProductList component. This is a cascading failure triggered by the backend error.",
  "confidence": "high",
  "stackTrace": [
    {
      "original": "at t (main.chunk.js:1:23456)",
      "resolved": {
        "file": "src/components/ProductCard.tsx",
        "line": 42,
        "column": 18
      }
    },
    {
      "original": "at ProductCard (main.chunk.js:1:34567)",
      "resolved": {
        "file": "src/components/ProductCard.tsx",
        "line": 15,
        "column": 0
      }
    }
  ],
  "relatedErrors": [
    {
      "message": "Cannot read properties of undefined (reading 'map')",
      "timestamp": 1698345678950,
      "correlation": 0.85
    },
    {
      "message": "Failed to fetch",
      "timestamp": 1698345678500,
      "correlation": 0.75
    }
  ],
  "recommendations": [
    "Review the resolved stack trace to identify the exact location",
    "Add null checks before accessing properties in ProductCard component",
    "Use optional chaining (?.) for safer property access: product?.price",
    "Verify data is loaded before component renders",
    "Check network tab - API request to /products failed",
    "Add error handling for network failures in data fetching logic",
    "Implement proper loading states to prevent rendering with null data"
  ]
}
```

**Use Cases:**
- Root cause analysis
- Production debugging
- Error pattern detection
- Automated error diagnosis

---

### 16. error_get_similar

**Find similar errors**

```typescript
// Example: Pattern analysis
const params = {
  url: "https://example.com",
  errorMessage: "TypeError: Cannot read"
};

// Response
{
  "similar": [
    {
      "message": "TypeError: Cannot read properties of null (reading 'price')",
      "count": 12,
      "firstSeen": 1698345678000,
      "lastSeen": 1698345888000,
      "pattern": "TypeError: Cannot read properties of null (reading 'STRING')",
      "stackTrace": "at t (main.chunk.js:1:23456)..."
    },
    {
      "message": "TypeError: Cannot read properties of undefined (reading 'map') (92% similar)",
      "count": 8,
      "firstSeen": 1698345679000,
      "lastSeen": 1698345889000,
      "pattern": "TypeError: Cannot read properties of undefined (reading 'STRING')",
      "stackTrace": "at ProductList (main.chunk.js:1:45678)..."
    },
    {
      "message": "TypeError: Cannot read properties of null (reading 'length') (85% similar)",
      "count": 5,
      "firstSeen": 1698345680000,
      "lastSeen": 1698345890000,
      "pattern": "TypeError: Cannot read properties of null (reading 'STRING')",
      "stackTrace": "at r (main.chunk.js:1:67890)..."
    }
  ]
}
```

**Use Cases:**
- Error pattern detection
- Recurring issue identification
- Error frequency analysis
- Prioritizing bug fixes

---

## Integration Examples

### Complete Debugging Workflow

```typescript
// 1. User reports an error
const errorStack = `TypeError: Cannot read properties of null
    at main.chunk.js:1:23456
    at main.chunk.js:1:34567`;

// 2. Resolve the stack trace
const resolved = await error_resolve_stack({
  url: "https://example.com",
  errorStack
});

// 3. Get error context
const context = await error_get_context({
  url: "https://example.com"
});

// 4. Trace root cause
const rootCause = await error_trace_cause({
  url: "https://example.com",
  errorMessage: "Cannot read properties of null"
});

// 5. Get source code
const sourceCode = await source_map_get_content({
  file: resolved.resolved[0].resolved.file,
  startLine: resolved.resolved[0].resolved.line - 5,
  endLine: resolved.resolved[0].resolved.line + 5
});

// 6. Find similar errors
const similar = await error_get_similar({
  url: "https://example.com",
  errorMessage: "Cannot read properties"
});

// Now you have:
// - Exact source location of the error
// - Full application context (state, props, network)
// - Root cause analysis with recommendations
// - Surrounding source code
// - Pattern of similar errors
```

### Bundle Optimization Workflow

```typescript
// 1. Get build manifest
const manifest = await build_get_manifest({
  url: "https://example.com"
});

// 2. Analyze sizes
const sizeAnalysis = await build_analyze_size({
  url: "https://example.com",
  threshold: 50
});

// 3. Find large modules
const reactModule = await build_find_module({
  url: "https://example.com",
  moduleName: "react"
});

// 4. Check dependencies
const deps = await build_get_dependencies({
  url: "https://example.com",
  moduleName: "react"
});

// 5. Get chunk details
const chunks = await build_get_chunks({
  url: "https://example.com"
});

// Now you have:
// - Complete build configuration
// - Size analysis with recommendations
// - Large module identification
// - Dependency graph
// - Chunk splitting strategy
```

---

## Testing

All tools have been tested with:
- Real production websites (React, Vite)
- Local test pages
- Multiple bundler configurations
- Various error scenarios

**Test Results:** 16/16 tools PASS (100%)

See [TOOLS_TEST_REPORT.md](./TOOLS_TEST_REPORT.md) for detailed test results.

---

**Last Updated:** October 26, 2025
**Version:** 1.0.0
