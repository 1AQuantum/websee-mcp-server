---
name: websee-source-intelligence
description: Resolve minified code to original sources, enhance stack traces, and navigate production bundles using source maps with WebSee source intelligence tools.
---

# WebSee Source Intelligence Skill

Master source map-based debugging with 7 specialized tools for resolving minified code, tracing errors, and navigating production JavaScript bundles back to original source files.

## When to Use This Skill

Use this skill when:
- Production errors show minified stack traces
- Need to find original source from minified code
- Debugging production builds without access to source
- Mapping code coverage to original source files
- Finding function definitions in bundled code
- Understanding bundle composition and source mapping
- Analyzing which source files contribute to a bundle
- Navigating from production errors to source code

## Prerequisites

**Source Maps Required**: All 7 tools require source maps to function properly.

**Source Map Types Supported**:
- Inline source maps (embedded in bundle)
- External source maps (.js.map files)
- Hidden source maps (via SourceMappingURL comment)

**Build Tool Support**:
- Webpack (all versions)
- Vite
- Rollup
- esbuild
- Parcel
- Any tool that generates source maps

**Source Map Availability**:
- Production: Source maps must be deployed (can be restricted to internal IPs)
- Development: Source maps typically available by default
- Graceful degradation when source maps unavailable

## Core Tool Reference

### 1. source_map_resolve - Location Resolution

**Purpose**: Resolve a minified JavaScript location to its original source file, line, and column.

**When to use**:
- Error occurred at specific line/column in minified file
- Need to find original code from bundle location
- Debugging production stack traces
- Mapping breakpoints to source

**Input**:
```typescript
{
  url: string;    // URL of minified JavaScript file
  line: number;   // Line number in minified file (1-indexed)
  column: number; // Column number in minified file (0-indexed)
}
```

**Output**:
```typescript
{
  success: boolean;
  minified: {
    url: string;
    line: number;
    column: number;
  };
  original?: {
    file: string;      // Original source file path
    line: number;      // Line in original source
    column: number;    // Column in original source
    name?: string;     // Original variable/function name
    content?: string;  // Source code line
  };
}
```

**Example**:
```
Use source_map_resolve
URL: https://app.com/static/js/main.abc123.js
Line: 1
Column: 3425
```

**Best for**: Pinpointing exact original source locations from minified code.

---

### 2. source_map_get_content - Source Content Retrieval

**Purpose**: Get the complete content of an original source file from source maps, with optional line range filtering.

**When to use**:
- Need to read original source code
- Viewing context around an error location
- Extracting specific function implementations
- Reading source files from production builds

**Input**:
```typescript
{
  file: string;         // Original source file path from source map
  startLine?: number;   // Optional start line (1-indexed)
  endLine?: number;     // Optional end line (1-indexed)
}
```

**Output**:
```typescript
{
  success: boolean;
  file: string;
  content: string;        // Source file content
  language: string;       // Detected language (typescript, javascript, etc.)
  totalLines: number;
  range?: {
    start: number;
    end: number;
  };
}
```

**Example**:
```
Use source_map_get_content
File: src/components/UserProfile.tsx
Start line: 45
End line: 60
```

**Best for**: Reading original source code, getting context around errors.

---

### 3. source_trace_stack - Stack Trace Enhancement

**Purpose**: Enhance a complete error stack trace by resolving all frames to their original source locations.

**When to use**:
- Production error with minified stack trace
- Need to understand full error context
- Debugging multi-file errors
- Converting production traces to readable format

**Input**:
```typescript
{
  stackTrace: string;   // Full stack trace string to resolve
}
```

**Output**:
```typescript
{
  success: boolean;
  original: string[];   // Original stack trace lines
  resolved: string[];   // Resolved stack trace lines
  frames: Array<{
    functionName?: string;
    fileName: string;
    lineNumber: number;
    columnNumber: number;
    source?: string;     // Source code line
    original: StackFrame;
    resolved: boolean;
  }>;
  summary: {
    totalFrames: number;
    resolvedFrames: number;
    unresolvedFrames: number;
  };
}
```

**Example**:
```
Use source_trace_stack
Stack trace:
Error: Cannot read property 'name' of undefined
  at e.render (main.js:1:3425)
  at o (main.js:1:8934)
  at a (main.js:1:12045)
```

**Best for**: Full error debugging, understanding complete call chains.

---

### 4. source_find_definition - Symbol Search

**Purpose**: Find the definition of a function or class in the original source code.

**When to use**:
- Need to locate function implementation
- Finding where class is defined
- Navigating to source from error
- Understanding code structure

**Input**:
```typescript
{
  functionName: string;  // Name of function or class to find
  file?: string;        // Optional: specific source file to search
}
```

**Output**:
```typescript
{
  success: boolean;
  functionName: string;
  definition?: {
    file: string;        // Source file containing definition
    line: number;        // Line where defined
    column: number;
    code: string;        // Code snippet (6 lines)
    exports?: string[];  // Other exports from same file
  };
}
```

**Example**:
```
Use source_find_definition
Function name: handleUserLogin
File filter: src/auth/
```

**Best for**: Code navigation, finding implementations.

---

### 5. source_get_symbols - Symbol Extraction

**Purpose**: List all exports, imports, and type definitions from an original source file.

**When to use**:
- Understanding file's API surface
- Finding what a module exports
- Analyzing dependencies
- Documenting module interfaces

**Input**:
```typescript
{
  file: string;   // Source file path to analyze
}
```

**Output**:
```typescript
{
  success: boolean;
  file: string;
  exports: Array<{
    name: string;    // Export name
    type: string;    // "function", "class", "const", "default"
    line: number;
  }>;
  imports: Array<{
    name: string;    // Import name
    from: string;    // Source module
    line: number;
  }>;
  types: Array<{
    name: string;    // Type name
    kind: string;    // "type", "interface", "enum"
    line: number;
  }>;
  summary: {
    totalExports: number;
    totalImports: number;
    totalTypes: number;
  };
}
```

**Example**:
```
Use source_get_symbols
File: src/utils/api.ts
```

**Best for**: Module analysis, understanding exports and dependencies.

---

### 6. source_map_bundle - Bundle Mapping

**Purpose**: Map a JavaScript bundle file to all of its original source files and show the relationship.

**When to use**:
- Understanding bundle composition
- Finding which sources are in a bundle
- Analyzing bundle structure
- Debugging bundle splitting issues

**Input**:
```typescript
{
  bundlePath: string;   // Path or URL to the bundle file
}
```

**Output**:
```typescript
{
  success: boolean;
  bundle: string;
  sources: string[];    // All original source files
  mappings: Array<{    // Sample mappings (first 20)
    source: string;
    generatedLine: number;
    generatedColumn: number;
    originalLine: number;
    originalColumn: number;
  }>;
  size?: number;        // Number of source files
  summary: {
    totalSources: number;
    sampleMappings: number;
  };
}
```

**Example**:
```
Use source_map_bundle
Bundle path: https://app.com/static/js/main.abc123.js
```

**Best for**: Bundle analysis, understanding code splitting.

---

### 7. source_coverage_map - Coverage Mapping

**Purpose**: Map V8 code coverage data from minified bundles back to original source files for accurate coverage reporting.

**When to use**:
- Analyzing production code coverage
- Understanding which source files are used
- Testing coverage of specific features
- Optimizing bundle size based on usage

**Input**:
```typescript
{
  coverageData: Record<string, any>;   // V8 coverage data object
}
```

**Output**:
```typescript
{
  success: boolean;
  covered: Array<{
    file: string;
    lines: number[];      // Covered line numbers
    percentage: number;
  }>;
  uncovered: Array<{
    file: string;
    lines: number[];      // Uncovered line numbers
    percentage: number;
  }>;
  percentage: number;     // Overall coverage percentage
  summary: {
    totalFiles: number;
    coveredFiles: number;
    uncoveredFiles: number;
    overallPercentage: string;
  };
}
```

**Example**:
```
Use source_coverage_map
Coverage data: { /* V8 coverage object */ }
```

**Best for**: Code coverage analysis, dead code detection.

---

## Common Workflows

### Workflow 1: Resolve Production Error

**Problem**: Error in production with minified stack trace

**Steps**:
1. Enhance full stack trace with source maps
2. Get original source content around error
3. Find function definition if needed
4. Get symbols to understand module context

```
1. source_trace_stack → Resolve all frames
2. source_map_get_content → Read source around error
3. source_find_definition → Locate function implementation
4. source_get_symbols → See module exports/imports
```

**Example**:
```
Production error: TypeError at main.js:1:3425

Step 1: source_trace_stack
→ Resolves to UserProfile.tsx:45:12 in handleClick()

Step 2: source_map_get_content
→ Get UserProfile.tsx lines 40-55 for context

Step 3: source_find_definition
→ Find handleClick definition and implementation

Step 4: source_get_symbols
→ See what UserProfile exports and imports
```

---

### Workflow 2: Navigate Minified Code

**Problem**: Need to understand minified bundle code

**Steps**:
1. Map bundle to see all source files
2. Resolve specific locations to source
3. Get content from interesting files
4. Find definitions of key functions

```
1. source_map_bundle → See bundle composition
2. source_map_resolve → Find specific locations
3. source_map_get_content → Read source files
4. source_find_definition → Navigate to implementations
```

**Example**:
```
Investigating main.abc123.js bundle

Step 1: source_map_bundle
→ Shows 147 source files in bundle

Step 2: source_map_resolve on error location
→ Points to src/components/DataGrid.tsx

Step 3: source_map_get_content for DataGrid.tsx
→ Read full component source

Step 4: source_find_definition for renderCell
→ Find renderCell method implementation
```

---

### Workflow 3: Analyze Code Coverage

**Problem**: Need to understand which code is actually used

**Steps**:
1. Capture V8 coverage data during usage
2. Map coverage to original sources
3. Get content of uncovered files
4. Find definitions in low-coverage areas

```
1. Capture coverage with Chrome DevTools Protocol
2. source_coverage_map → Map to source files
3. source_map_get_content → Read uncovered files
4. source_find_definition → Find unused functions
```

**Example**:
```
Analyzing production usage coverage

Step 1: Collect V8 coverage during user session

Step 2: source_coverage_map
→ Shows UserSettings.tsx: 23% covered
→ Shows HomePage.tsx: 87% covered

Step 3: source_map_get_content for UserSettings.tsx
→ Read file to see what's unused

Step 4: source_find_definition for unused functions
→ Identify dead code candidates
```

---

## Source Map Types and Formats

### Inline Source Maps
**Format**: Embedded directly in bundle as base64
```javascript
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJ...
```
**Pros**: Single file, no HTTP request
**Cons**: Larger bundle size

### External Source Maps
**Format**: Separate .js.map files
```javascript
//# sourceMappingURL=main.js.map
```
**Pros**: Smaller bundle, can restrict access
**Cons**: Additional HTTP request

### Hidden Source Maps
**Format**: Generated but not referenced in bundle
**Pros**: No production exposure, available for error tracking
**Cons**: Must be uploaded to error tracking service

---

## Build Tool Configuration

### Webpack Configuration
```javascript
// webpack.config.js
module.exports = {
  devtool: 'source-map',  // Production
  // OR
  devtool: 'eval-source-map',  // Development
};
```

### Vite Configuration
```javascript
// vite.config.js
export default {
  build: {
    sourcemap: true,  // External source maps
    // OR
    sourcemap: 'inline',  // Inline source maps
    // OR
    sourcemap: 'hidden',  // Hidden source maps
  },
};
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSourceMap": false,
    "inlineSources": false
  }
}
```

---

## Troubleshooting

### "No source map found"

**Causes**:
- Source maps not generated during build
- Source maps not deployed to production
- Source map URL incorrect or inaccessible
- CORS blocking source map access

**Solutions**:
- Verify build tool generates source maps
- Check source map files are deployed
- Verify sourceMappingURL comment in bundle
- Configure CORS headers for .map files
- Use inline source maps for development

---

### "Source map found but content unavailable"

**Causes**:
- Source content not embedded in source map
- Source files not accessible via HTTP
- Relative paths incorrect

**Solutions**:
- Enable `sourcesContent` in build config
- Set correct `sourceRoot` in source map
- Use absolute paths in source maps
- Embed sources inline: `"inlineSources": true`

---

### "Partial stack trace resolution"

**Causes**:
- Some files have source maps, others don't
- Source maps from different builds
- Minifier removed source map comments

**Solutions**:
- Ensure all bundles have source maps
- Use consistent build configuration
- Verify source map comments not stripped
- Check bundler doesn't remove mappings

---

### "Source map version mismatch"

**Causes**:
- Source map from different build than bundle
- Cache serving old source maps
- Deployment race condition

**Solutions**:
- Deploy bundles and source maps atomically
- Use content hashes in filenames
- Clear CDN cache after deployment
- Verify source map matches bundle version

---

## Performance Considerations

**Tool Response Times**:
- `source_map_resolve`: ~0.9s
- `source_map_get_content`: ~1.2s
- `source_trace_stack`: ~1.5s (depends on stack depth)
- `source_find_definition`: ~1.8s (depends on file count)
- `source_get_symbols`: ~1.3s
- `source_map_bundle`: ~2.0s (depends on bundle size)
- `source_coverage_map`: ~2.4s (depends on coverage data)

**Average Response Time**: 1.5s

**Best Practices**:
- Cache source maps for repeated access
- Use specific file filters when searching
- Limit line ranges when reading content
- Batch multiple resolutions together
- Use hidden source maps in production for security

**Source Map Caching**:
- Source maps cached after first access (default: 50 maps)
- Subsequent resolutions use cached data
- Cache cleared when page navigates
- Manual cache management available

---

## Security Considerations

### Production Source Maps

**Risks**:
- Exposes original source code
- Reveals file structure and organization
- Shows comments and internal logic
- May contain sensitive information

**Mitigation Strategies**:
1. **Hidden Source Maps**: Generate but don't deploy
2. **IP Restriction**: Only serve to internal IPs
3. **Authentication**: Require auth for .map files
4. **Upload to Error Tracking**: Use services like Sentry
5. **Strip Comments**: Remove sensitive comments before building

### Recommended Production Setup

```javascript
// Secure production source maps
module.exports = {
  devtool: 'hidden-source-map',  // Don't expose in bundle
  plugins: [
    new SentryWebpackPlugin({      // Upload to error tracking
      include: './dist',
      ignore: ['node_modules'],
    }),
  ],
};
```

---

## Integration with Other Skills

**Combine with**:
- `websee-component-intelligence` → Navigate from component to source
- `websee-error-intelligence` → Resolve error stacks automatically
- `websee-network-intelligence` → Find which source made network call
- `websee-build-intelligence` → Analyze bundle composition

**Example Multi-Skill Workflow**:
```
1. error_get_context → Get error details
2. source_trace_stack → Resolve stack trace
3. component_get_source → Find component that errored
4. source_map_get_content → Read source code
5. source_find_definition → Navigate to function
```

---

## Advanced Usage Patterns

### Pattern 1: Error Context Enrichment

Enhance error reports with full source context:

```
1. source_trace_stack → Resolve all frames
2. For each frame:
   - source_map_get_content → Get 5 lines before/after
   - source_get_symbols → Get module context
3. Create rich error report with source context
```

### Pattern 2: Dead Code Detection

Find unused code in production:

```
1. Enable coverage in Chrome DevTools
2. Exercise application features
3. source_coverage_map → Map to sources
4. source_map_get_content → Read uncovered files
5. Identify candidates for removal
```

### Pattern 3: Bundle Optimization

Analyze what's in your bundles:

```
1. source_map_bundle → List all sources in bundle
2. For each unexpected source:
   - source_get_symbols → See what it exports
   - source_find_definition → Find who imports it
3. Identify optimization opportunities
```

### Pattern 4: Production Debugging

Debug production without source access:

```
1. User reports error at main.js:1:3425
2. source_map_resolve → Find original location
3. source_map_get_content → Read source context
4. source_get_symbols → Understand module
5. source_find_definition → Find related functions
6. Fix issue in source code
```

---

## Language Support

**Full Support**:
- JavaScript (.js)
- TypeScript (.ts, .tsx)
- JSX (.jsx)

**Partial Support**:
- Vue SFC (.vue) - requires vue-loader source maps
- Svelte (.svelte) - requires svelte source maps
- CSS/SCSS - if source maps enabled

**Symbol Detection**:
- ES6 exports/imports
- CommonJS module.exports/require
- TypeScript types, interfaces, enums
- Class and function declarations

---

## Common Error Messages

### "Source map resolver not initialized"
**Cause**: Tool called before initialization
**Solution**: Wait for page load and initialization

### "Invalid source map format"
**Cause**: Malformed source map JSON
**Solution**: Verify build tool generates valid source maps

### "Source file not found in source map"
**Cause**: File path doesn't match source map entries
**Solution**: Check sourceRoot and sources paths in source map

### "Column mapping not found"
**Cause**: Source map doesn't have fine-grained mappings
**Solution**: Use better source map quality (not 'cheap')

---

## Testing Source Maps Locally

### Quick Test
```bash
# 1. Build with source maps
npm run build

# 2. Serve locally
npx serve dist

# 3. Open in browser
open http://localhost:3000

# 4. Test with WebSee MCP
Use source_map_bundle on http://localhost:3000/main.js
```

### Verify Source Maps
```bash
# Check source map exists
curl http://localhost:3000/main.js.map

# Verify sourceMappingURL in bundle
tail -n 5 dist/main.js
# Should see: //# sourceMappingURL=main.js.map
```

---

## Reference Files

See `test-pages/` directory for:
- `minified-error.html` - Example minified errors with stack traces
- `react-app.html` - React application with source maps
- Examples of different source map configurations

See test reports:
- `MASTER_TEST_REPORT.md` - Comprehensive testing results
- `TOOLS_TEST_REPORT.md` - Source tools detailed testing

---

## Key Performance Features

- **Caching**: Source maps cached after first load (50 map limit)
- **Parallel Resolution**: Multiple frames resolved concurrently
- **Lazy Loading**: Source maps loaded only when needed
- **Graceful Degradation**: Continues with available source maps
- **Memory Efficient**: LRU cache prevents memory leaks

**Performance Metrics from Testing**:
- 100% success rate with valid source maps
- Average 1.5s response time
- Handles bundles with 100+ source files
- Processes stack traces with 20+ frames
- Supports source maps up to 10MB

---

**Skill Version**: 1.0.0
**Tools Count**: 7
**Average Response Time**: 1.5s
**Success Rate**: 100% (with source maps), 0% (without source maps)
**Production Ready**: Yes
