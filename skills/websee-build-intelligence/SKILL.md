---
name: websee-build-intelligence
description: Analyze webpack and vite build artifacts with deep bundle inspection, module dependency tracking, and size optimization recommendations using WebSee build intelligence tools.
---

# WebSee Build Intelligence Skill

Master bundle optimization with 5 specialized tools for analyzing Webpack and Vite build artifacts, tracking dependencies, and identifying optimization opportunities.

## When to Use This Skill

Use this skill when:
- Bundle size is too large or growing unexpectedly
- Need to understand what's included in production bundles
- Investigating slow load times or code splitting issues
- Finding duplicate modules across chunks
- Optimizing code splitting and lazy loading
- Debugging missing or incorrectly bundled modules
- Analyzing dependency graphs and module relationships
- Planning bundle size reduction strategies

## Prerequisites

**Build Artifacts Required**: All tools require build manifest files to be available:

**Webpack Projects**:
- Generate `stats.json` during build:
  ```bash
  webpack --profile --json > stats.json
  ```
- Or configure in `webpack.config.js`:
  ```javascript
  module.exports = {
    // ... other config
    stats: {
      all: true,
      json: true
    }
  };
  ```

**Vite Projects**:
- Generate `manifest.json` during build:
  ```bash
  vite build --manifest
  ```
- Or configure in `vite.config.js`:
  ```javascript
  export default {
    build: {
      manifest: true,
      rollupOptions: {
        output: {
          manualChunks: // your chunking strategy
        }
      }
    }
  };
  ```

**Artifact Location**:
- Place `stats.json` or `manifest.json` in your project root
- Or configure via `PROJECT_ROOT` environment variable
- Tools will auto-detect artifact type (Webpack/Vite)

**Success Rates**:
- With build artifacts: 100% success rate
- Without artifacts: Tools will attempt runtime detection (limited functionality)

## Core Tool Reference

### 1. build_get_manifest - Build Manifest

**Purpose**: Get complete build manifest including all chunks, assets, and modules.

**When to use**:
- Initial build analysis to understand overall structure
- Verifying build output matches expectations
- Getting comprehensive build metadata
- Understanding available chunks and assets

**Input**:
```typescript
{
  url: string;  // Application URL to analyze
}
```

**Output**:
```typescript
{
  type: "webpack" | "vite";
  version: string;
  chunks: Array<{
    id: string | number;
    files: string[];
    size: number;
    entry?: boolean;    // Entry chunk
    initial?: boolean;  // Initially loaded
  }>;
  assets: Array<{
    name: string;
    size: number;
    chunks: (string | number)[];
  }>;
  modules: Array<{
    id: string | number;
    name: string;
    size: number;
    chunks: (string | number)[];
  }>;
}
```

**Example**:
```
Use build_get_manifest on https://app.com/dashboard
```

**Best for**: Build overview, artifact verification, initial analysis.

---

### 2. build_get_chunks - Chunk Analysis

**Purpose**: Get detailed information about all code chunks including files, modules, and sizes.

**When to use**:
- Analyzing code splitting effectiveness
- Finding which chunks are loaded initially vs lazy
- Understanding chunk relationships
- Debugging chunk loading issues
- Planning chunk optimization strategies

**Input**:
```typescript
{
  url: string;  // Application URL to analyze
}
```

**Output**:
```typescript
{
  chunks: Array<{
    id: string | number;
    files: string[];       // Output files (.js, .css)
    modules: string[];     // Modules in chunk
    size: number;          // Bytes
    sizeKB: string;        // Formatted KB
    entry?: boolean;       // Entry point chunk
    initial?: boolean;     // Initially loaded
  }>;
}
```

**Example**:
```
Use build_get_chunks on https://app.com
```

**Best for**: Code splitting analysis, chunk optimization, loading strategy planning.

---

### 3. build_find_module - Module Search

**Purpose**: Find a specific module in the bundle by name or path with fuzzy matching.

**When to use**:
- Locating specific library or module
- Checking if module is included in bundle
- Finding module dependencies
- Debugging module resolution issues
- Verifying tree shaking results

**Input**:
```typescript
{
  url: string;
  moduleName: string;  // Name or path (supports fuzzy matching)
                       // e.g., "react", "lodash/debounce", "src/utils"
}
```

**Output**:
```typescript
{
  name: string;
  id: string | number;
  size: number;
  sizeKB: string;
  chunks: (string | number)[];  // Which chunks contain this module
  dependencies: string[];        // Modules this depends on
  source?: string;              // First 500 chars of source code
} | null  // null if not found
```

**Example**:
```
Use build_find_module on https://app.com
Module name: lodash
```

**Best for**: Module location, dependency verification, tree shaking validation.

---

### 4. build_get_dependencies - Dependency Graph

**Purpose**: Get dependency graph for all modules or trace dependencies of a specific module.

**When to use**:
- Understanding module relationships
- Finding circular dependencies
- Analyzing dependency chains
- Planning module refactoring
- Identifying shared dependencies
- Understanding why modules are bundled together

**Input**:
```typescript
{
  url: string;
  moduleName?: string;  // Optional: specific module to analyze
                        // Omit to get all dependencies
}
```

**Output**:
```typescript
{
  dependencies: Array<{
    name: string;
    version?: string;
    size: number;
    sizeKB: string;
    dependents: string[];          // Modules that depend on this
    chunks: (string | number)[];   // Chunks containing this
  }>;
}
```

**Example**:
```
Use build_get_dependencies on https://app.com
Module name: src/components/UserProfile.tsx
```

**Best for**: Dependency analysis, circular dependency detection, refactoring planning.

---

### 5. build_analyze_size - Size Analysis

**Purpose**: Comprehensive bundle size analysis with optimization recommendations.

**When to use**:
- Bundle size exceeds targets
- Identifying optimization opportunities
- Planning size reduction strategies
- Finding large or duplicate modules
- Understanding size distribution
- Preparing bundle size reports

**Input**:
```typescript
{
  url: string;
  threshold?: number;  // Size threshold in KB (default: 100)
                       // Modules above this are flagged
}
```

**Output**:
```typescript
{
  total: number;        // Total bytes
  totalKB: string;      // Formatted KB
  totalMB: string;      // Formatted MB
  byType: {
    js: {
      count: number;
      size: number;
      sizeKB: string;
    };
    css: {
      count: number;
      size: number;
      sizeKB: string;
    };
    other: {
      count: number;
      size: number;
      sizeKB: string;
    };
  };
  large: Array<{        // Assets exceeding threshold
    name: string;
    size: number;
    sizeKB: string;
    type: "js" | "css" | "other";
    percentage: string; // % of total bundle
  }>;
  recommendations: string[];  // AI-generated optimization tips
}
```

**Example**:
```
Use build_analyze_size on https://app.com
Threshold: 150
```

**Recommendations include**:
- Code splitting suggestions
- Lazy loading opportunities
- Duplicate module detection
- Large dependency identification
- CSS optimization tips

**Best for**: Size optimization, performance planning, bundle audits.

---

## Common Workflows

### Workflow 1: Initial Bundle Analysis

**Problem**: Need to understand current bundle composition

**Steps**:
1. Get manifest to understand overall structure
2. Analyze chunks to see code splitting
3. Analyze size to identify optimization opportunities

```
1. build_get_manifest → Overview of build
2. build_get_chunks → Chunk breakdown
3. build_analyze_size → Size analysis + recommendations
```

**Expected Insights**:
- Total bundle size and distribution
- Number and size of chunks
- Large modules requiring attention
- Immediate optimization opportunities

---

### Workflow 2: Optimize Large Bundle

**Problem**: Bundle size too large, need to reduce

**Steps**:
1. Analyze size to find large modules
2. Find specific large modules
3. Get dependencies to understand why they're included
4. Plan optimization strategy

```
1. build_analyze_size (threshold: 100) → Find large modules
2. build_find_module → Inspect specific modules
3. build_get_dependencies → Understand relationships
4. Plan: code split, lazy load, or replace
```

**Optimization Strategies**:
- Code split large modules
- Lazy load non-critical code
- Replace heavy dependencies
- Enable tree shaking
- Remove unused code

---

### Workflow 3: Debug Module Issues

**Problem**: Module missing or included incorrectly

**Steps**:
1. Find module to verify inclusion
2. Get dependencies to check relationships
3. Get chunks to see where it's bundled

```
1. build_find_module → Locate module
2. build_get_dependencies → Check dependencies
3. build_get_chunks → See chunk placement
```

**Common Issues**:
- Module not found: Check imports and paths
- Module duplicated: Check dependency versions
- Module in wrong chunk: Review code splitting config

---

### Workflow 4: Dependency Analysis

**Problem**: Need to understand module relationships

**Steps**:
1. Get dependencies for specific module
2. Find each dependency module
3. Analyze sizes of dependency chain

```
1. build_get_dependencies → Get dependency tree
2. build_find_module (for each dep) → Get details
3. build_analyze_size → Total impact
```

**Use Cases**:
- Refactoring planning
- Circular dependency detection
- Understanding module coupling
- Planning module extraction

---

## Build Tool Support

### Webpack ✅ Full Support
- Webpack 4, 5 supported
- Requires `stats.json` file
- Full module tree available
- Dependency graph complete
- Source maps recommended

**Generate stats.json**:
```bash
webpack --profile --json > stats.json
```

### Vite ✅ Full Support
- Vite 2, 3, 4 supported
- Requires `manifest.json` file
- Rollup-based module info
- ES module support
- Built-in optimization insights

**Generate manifest.json**:
```bash
vite build --manifest
```

### Other Bundlers ⚠️ Limited Support
- **Rollup**: Partial support (similar to Vite)
- **Parcel**: Limited (no standard manifest)
- **esbuild**: Limited (minimal metadata)
- **Turbopack**: Coming soon

---

## Troubleshooting

### "Failed to load build manifest"
- ✅ Verify `stats.json` or `manifest.json` exists
- ✅ Check file is in project root or `PROJECT_ROOT` path
- ✅ Ensure build artifacts are generated during build
- ✅ Verify file permissions allow reading
- ✅ Check JSON format is valid

### "Module not found"
- ✅ Try partial name (fuzzy matching enabled)
- ✅ Check module is actually in bundle
- ✅ Verify module path uses correct separators
- ✅ Try using `build_get_manifest` to list all modules

### "Empty chunks array"
- ✅ Ensure build completed successfully
- ✅ Check code splitting is configured
- ✅ Verify stats.json includes chunk data
- ✅ For Vite: ensure manifest includes chunk info

### "Inaccurate sizes"
- ✅ Sizes are pre-compression (before gzip/brotli)
- ✅ Enable detailed stats in build config
- ✅ Verify source maps aren't inflating sizes
- ✅ Check if development vs production build

### "No recommendations generated"
- ✅ Bundle may already be optimized
- ✅ Try lowering threshold parameter
- ✅ Check if bundle size is very small
- ✅ Verify build artifacts have complete data

---

## Performance Considerations

**Tool Response Times**:
- `build_get_manifest`: ~1.0-1.5s
- `build_get_chunks`: ~1.0-1.3s
- `build_find_module`: ~1.0-1.5s
- `build_get_dependencies`: ~1.2-1.8s
- `build_analyze_size`: ~1.0-1.5s

**Average Response Time**: 1.3s

**Best Practices**:
- Generate build artifacts during CI/CD
- Cache manifest files for repeated analysis
- Use specific module names for faster searches
- Limit dependency depth for large projects
- Run analysis on production builds

**Optimization Tips**:
- Place manifest files in project root
- Use `.json` extension for auto-detection
- Minify and compress build artifacts
- Use dedicated analysis environment

---

## Size Optimization Guidelines

### Target Bundle Sizes
- **Initial Bundle**: < 200KB (gzipped)
- **Total JS**: < 500KB (gzipped)
- **Individual Chunk**: < 100KB (gzipped)
- **CSS**: < 50KB (gzipped)

### Common Issues

**Issue**: Single large entry chunk
**Solution**: Implement code splitting
```javascript
// Webpack
optimization: {
  splitChunks: {
    chunks: 'all',
    maxSize: 200000
  }
}

// Vite
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        utils: ['lodash', 'date-fns']
      }
    }
  }
}
```

**Issue**: Large third-party dependencies
**Solution**: Replace with smaller alternatives
- `moment` → `date-fns` or `dayjs`
- `lodash` → `lodash-es` + tree shaking
- Full `react-icons` → Individual icon imports

**Issue**: Duplicate modules in multiple chunks
**Solution**: Configure shared chunks
```javascript
// Webpack
optimization: {
  splitChunks: {
    cacheGroups: {
      commons: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all'
      }
    }
  }
}
```

**Issue**: CSS bloat
**Solution**: Purge unused CSS, enable critical CSS
```javascript
// PostCSS with PurgeCSS
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: ['./src/**/*.{js,jsx,ts,tsx}']
    })
  ]
}
```

---

## Integration with Other Skills

**Combine with**:
- `websee-source-intelligence` → Map modules to original source
- `websee-error-intelligence` → Find which modules cause errors
- `websee-network-intelligence` → See which chunks are loaded

**Example Multi-Skill Workflow**:
```
1. build_analyze_size → Find large module
2. source_map_resolve → Find original source location
3. Edit code to reduce size
4. Rebuild and verify
```

**Build + Network Analysis**:
```
1. build_get_chunks → List all chunks
2. network_get_requests → See which chunks loaded
3. Optimize chunk splitting based on actual usage
```

**Build + Error Analysis**:
```
1. error_get_context → Find error module
2. build_find_module → Check module details
3. build_get_dependencies → Understand module relationships
4. Fix dependency or module issue
```

---

## Advanced Features

### Dependency Graph Visualization

Use dependency data to create visualizations:
```
1. build_get_dependencies → Get all dependencies
2. Parse into graph structure
3. Visualize with tools like D3.js or vis.js
4. Identify bottlenecks and cycles
```

### Bundle Trend Analysis

Track bundle size over time:
```
1. Run build_analyze_size on each commit
2. Store results in database
3. Chart size trends
4. Alert on significant increases
```

### Automated Optimization

Integrate into CI/CD:
```
1. Generate build artifacts in CI
2. Run build_analyze_size
3. Fail build if size exceeds threshold
4. Generate optimization report
```

### Custom Thresholds

Define project-specific limits:
```typescript
const thresholds = {
  totalBundle: 500 * 1024,    // 500KB
  singleChunk: 100 * 1024,    // 100KB
  vendorBundle: 200 * 1024,   // 200KB
  css: 50 * 1024              // 50KB
};
```

---

## Reference Files

See `references/` directory for:
- `build-config-examples.md` - Sample webpack/vite configs
- `size-optimization-guide.md` - Detailed optimization strategies
- `dependency-management.md` - Best practices for dependencies
- `bundle-analysis-patterns.md` - Common analysis workflows

---

**Skill Version**: 1.0.0
**Tools Count**: 5
**Average Response Time**: 1.3s
**Success Rate**: 100% (with build artifacts)
**Supported Bundlers**: Webpack 4/5, Vite 2/3/4, Rollup (partial)
