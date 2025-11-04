# Component Intelligence Tools

A comprehensive suite of 8 specialized tools for deep component inspection and analysis in React, Vue, and Angular applications.

## Overview

The Component Intelligence Tools provide granular, framework-agnostic component analysis capabilities for the WebSee MCP server. These tools integrate seamlessly with the existing ComponentTracker to provide detailed insights into component state, props, hierarchy, and rendering behavior.

## Tools

### 1. `component_tree`

Get the full component hierarchy as a tree structure with depth information.

**Parameters:**
- `url` (string, required): The URL of the page to analyze
- `includeDepth` (boolean, optional): Include depth information for each component (default: true)
- `filterFramework` (enum, optional): Filter by framework - "react", "vue", "angular", "svelte", or "all" (default: "all")

**Returns:**
```typescript
{
  components: ComponentTreeNode[],
  totalCount: number,
  frameworks: string[]
}
```

**Example:**
```json
{
  "url": "https://example.com",
  "filterFramework": "react",
  "includeDepth": true
}
```

### 2. `component_get_props`

Get component props only for a specific component.

**Parameters:**
- `url` (string, required): The page URL
- `selector` (string, required): CSS selector for the component

**Returns:**
```typescript
{
  componentName: string,
  props: Record<string, any>
}
```

**Example:**
```json
{
  "url": "https://example.com",
  "selector": "#my-component"
}
```

### 3. `component_get_state`

Get component state only for a specific component.

**Parameters:**
- `url` (string, required): The page URL
- `selector` (string, required): CSS selector for the component

**Returns:**
```typescript
{
  componentName: string,
  state: Record<string, any> | null
}
```

**Example:**
```json
{
  "url": "https://example.com",
  "selector": ".user-profile"
}
```

### 4. `component_find_by_name`

Find all instances of a component by name across the entire page.

**Parameters:**
- `url` (string, required): The page URL
- `componentName` (string, required): Name of the component to find (case-sensitive)
- `includeProps` (boolean, optional): Include props in results (default: true)
- `includeState` (boolean, optional): Include state in results (default: true)

**Returns:**
```typescript
{
  instances: ComponentInstance[],
  count: number
}
```

**Example:**
```json
{
  "url": "https://example.com",
  "componentName": "UserCard",
  "includeProps": true,
  "includeState": true
}
```

### 5. `component_get_source`

Map a component to its source file, line, and column information.

**Parameters:**
- `url` (string, required): The page URL
- `selector` (string, required): CSS selector for the component

**Returns:**
```typescript
{
  file: string,
  line?: number,
  column?: number,
  framework: string
}
```

**Example:**
```json
{
  "url": "https://example.com",
  "selector": "#header"
}
```

### 6. `component_track_renders`

Track component re-renders over a specified duration to identify performance issues.

**Parameters:**
- `url` (string, required): The page URL
- `selector` (string, required): CSS selector for the component to track
- `duration` (number, optional): Duration to track renders in milliseconds (1000-60000, default: 5000)
- `captureReasons` (boolean, optional): Attempt to capture re-render reasons (default: true)

**Returns:**
```typescript
{
  componentName: string,
  renders: RenderEvent[],
  totalRenders: number,
  averageInterval: number
}
```

**Example:**
```json
{
  "url": "https://example.com",
  "selector": "#data-table",
  "duration": 10000,
  "captureReasons": true
}
```

### 7. `component_get_context`

Get React context values available to a component.

**Parameters:**
- `url` (string, required): The page URL
- `selector` (string, required): CSS selector for the component

**Returns:**
```typescript
{
  contexts: ContextValue[]
}
```

**Note:** This tool is React-specific and works by accessing the React Fiber tree.

**Example:**
```json
{
  "url": "https://example.com",
  "selector": "#app-content"
}
```

### 8. `component_get_hooks`

Get React hooks state and information for a component.

**Parameters:**
- `url` (string, required): The page URL
- `selector` (string, required): CSS selector for the React component

**Returns:**
```typescript
{
  hooks: HookInfo[]
}
```

**Note:** This tool is React-specific and only works with React components. It will throw an error if used on non-React components.

**Example:**
```json
{
  "url": "https://example.com",
  "selector": "#counter-component"
}
```

## Type Definitions

### ComponentTreeNode
```typescript
interface ComponentTreeNode {
  name: string;
  type: string;
  depth: number;
  children: ComponentTreeNode[];
  props?: Record<string, any>;
  state?: Record<string, any>;
  source?: {
    file: string;
    line?: number;
    column?: number;
  };
}
```

### ComponentInstance
```typescript
interface ComponentInstance {
  selector: string;
  props: Record<string, any>;
  state?: Record<string, any>;
  domId?: string;
}
```

### RenderEvent
```typescript
interface RenderEvent {
  timestamp: number;
  reason?: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
  duration?: number;
}
```

### ContextValue
```typescript
interface ContextValue {
  name: string;
  value: any;
  provider?: string;
}
```

### HookInfo
```typescript
interface HookInfo {
  type: string;
  value: any;
  dependencies?: any[];
  index: number;
}
```

## Integration with MCP Server

These tools are designed to integrate with the WebSee MCP server. They are exported from the main tools index:

```typescript
import {
  componentTree,
  componentGetProps,
  componentGetState,
  componentFindByName,
  componentGetSource,
  componentTrackRenders,
  componentGetContext,
  componentGetHooks,
  COMPONENT_INTELLIGENCE_TOOLS,
} from "./tools/component-intelligence-tools";
```

## Framework Support

| Framework | component_tree | get_props | get_state | find_by_name | get_source | track_renders | get_context | get_hooks |
|-----------|----------------|-----------|-----------|--------------|------------|---------------|-------------|-----------|
| React     | ✅             | ✅        | ✅        | ✅           | ✅         | ✅            | ✅          | ✅        |
| Vue 3     | ✅             | ✅        | ✅        | ✅           | ✅         | ⚠️            | ❌          | ❌        |
| Angular   | ✅             | ✅        | ✅        | ✅           | ✅         | ⚠️            | ❌          | ❌        |

Legend:
- ✅ Fully supported
- ⚠️ Limited support
- ❌ Not supported

## Error Handling

All tools include comprehensive error handling:

- **Component not found**: Throws descriptive error when selector doesn't match any component
- **Framework mismatch**: React-specific tools (get_context, get_hooks) throw errors when used on non-React components
- **Invalid selectors**: Clear error messages for invalid CSS selectors
- **Network issues**: Graceful handling of navigation failures

## Performance Considerations

1. **component_tree**: May take longer on pages with many components (100ms+ for 1000+ components)
2. **component_track_renders**: Uses browser resources during tracking period
3. **component_get_hooks**: Deep introspection into React internals, may be slower

## Best Practices

1. **Use specific selectors**: More specific CSS selectors lead to faster component lookup
2. **Filter by framework**: When analyzing a known framework, use `filterFramework` to reduce overhead
3. **Limit tracking duration**: For `component_track_renders`, use the minimum duration needed
4. **Component naming**: Tools work best with components that have meaningful names (not Anonymous)

## Examples

### Debugging Re-render Issues
```typescript
// Find a component that might be re-rendering too often
const result = await componentTrackRenders(page, {
  url: "https://example.com",
  selector: "#data-table",
  duration: 10000,
  captureReasons: true
});

console.log(`Component rendered ${result.totalRenders} times`);
console.log(`Average interval: ${result.averageInterval}ms`);
```

### Inspecting Component Hierarchy
```typescript
// Get the full component tree for React components
const tree = await componentTree(page, {
  url: "https://example.com",
  filterFramework: "react",
  includeDepth: true
});

console.log(`Found ${tree.totalCount} React components`);
console.log(`Max depth: ${Math.max(...tree.components.map(c => c.depth))}`);
```

### Finding All Instances of a Component
```typescript
// Find all UserCard components
const result = await componentFindByName(page, {
  url: "https://example.com",
  componentName: "UserCard",
  includeProps: true,
  includeState: true
});

console.log(`Found ${result.count} instances of UserCard`);
result.instances.forEach(instance => {
  console.log(`Instance at ${instance.selector}:`, instance.props);
});
```

## License

MIT

## Contributing

Contributions are welcome! Please ensure all tools maintain compatibility with the existing ComponentTracker interface.
