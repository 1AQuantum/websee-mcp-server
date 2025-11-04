---
name: websee-component-intelligence
description: Inspect and analyze frontend framework components (React, Vue, Angular, Svelte) with deep state and props introspection using WebSee component intelligence tools.
---

# WebSee Component Intelligence Skill

Master component-level debugging with 8 specialized tools for inspecting React, Vue, Angular, and Svelte components in production and development environments.

## When to Use This Skill

Use this skill when:
- Component renders incorrectly or with wrong data
- Props aren't being passed correctly between components
- State management issues need diagnosis
- Need to understand component hierarchy
- Tracking down which component triggers a bug
- Analyzing hooks dependencies and effects
- Debugging context providers and consumers
- Finding component source code locations

## Prerequisites

**React DevTools Required**: 6 of 8 tools require React DevTools for full functionality:
- `component_get_props` ✅ Requires DevTools
- `component_get_state` ✅ Requires DevTools
- `component_get_source` ✅ Requires DevTools
- `component_track_renders` ✅ Requires DevTools
- `component_get_context` ✅ Requires DevTools
- `component_get_hooks` ✅ Requires DevTools

**No DevTools Required**:
- `component_tree` ❌ Works without DevTools
- `component_find_by_name` ❌ Works without DevTools

**Success Rates**:
- With React DevTools: 100% success rate
- Without DevTools (production sites): ~30% success rate

## Core Tool Reference

### 1. component_tree - Component Hierarchy

**Purpose**: Get the complete component tree structure for a page or selector.

**When to use**:
- Understanding overall component architecture
- Finding parent-child relationships
- Identifying component structure before deep inspection

**Input**:
```typescript
{
  url: string;           // Page URL
  selector?: string;     // Optional: target specific subtree
  includeProps?: boolean; // Include props in tree (requires DevTools)
  maxDepth?: number;     // Limit tree depth (default: 10)
}
```

**Output**:
```typescript
{
  framework: "react" | "vue" | "angular" | "svelte";
  rootComponents: Array<{
    name: string;
    type: string;
    depth: number;
    children: ComponentNode[];
    props?: Record<string, any>;
  }>;
  totalComponents: number;
}
```

**Example**:
```
Use component_tree on https://react.dev
Selector: main
Include props: false
Max depth: 5
```

**Best for**: Initial component structure analysis, finding component boundaries.

---

### 2. component_get_props - Props Inspection

**Purpose**: Extract all props passed to a specific component.

**Requires**: React DevTools

**When to use**:
- Component receives wrong prop values
- Props aren't updating as expected
- Need to verify prop drilling
- Debugging prop type mismatches

**Input**:
```typescript
{
  url: string;
  selector: string;      // CSS selector for component
  includeDefaults?: boolean; // Include default prop values
}
```

**Output**:
```typescript
{
  component: string;
  props: Record<string, any>;
  propTypes?: Record<string, string>;
  defaultProps?: Record<string, any>;
}
```

**Example**:
```
Use component_get_props on https://app.com/dashboard
Selector: [data-testid="user-profile"]
Include defaults: true
```

**Best for**: Verifying prop values, debugging data flow.

---

### 3. component_get_state - State Inspection

**Purpose**: Inspect internal component state (React useState, class state, Vue data, etc.).

**Requires**: React DevTools

**When to use**:
- State isn't updating correctly
- Component stuck in wrong state
- Debugging state management bugs
- Verifying state shape

**Input**:
```typescript
{
  url: string;
  selector: string;
  includeComputed?: boolean; // Include computed/derived state
}
```

**Output**:
```typescript
{
  component: string;
  state: Record<string, any>;
  computedState?: Record<string, any>;
  stateUpdaters?: string[]; // Available setState functions
}
```

**Example**:
```
Use component_get_state on https://app.com
Selector: #shopping-cart
Include computed: true
```

**Best for**: State debugging, understanding component data.

---

### 4. component_find_by_name - Component Search

**Purpose**: Find all instances of a component by name across the page.

**When to use**:
- Locating specific component instances
- Finding which components are rendered
- Debugging conditional rendering
- Counting component instances

**Input**:
```typescript
{
  url: string;
  componentName: string;  // e.g., "UserCard", "Button"
  exactMatch?: boolean;   // Default: false (fuzzy match)
}
```

**Output**:
```typescript
{
  matches: Array<{
    name: string;
    selector: string;
    location: { x: number; y: number };
    visible: boolean;
  }>;
  totalMatches: number;
}
```

**Example**:
```
Use component_find_by_name on https://app.com
Component name: ErrorBoundary
Exact match: true
```

**Best for**: Finding components, debugging rendering issues.

---

### 5. component_get_source - Source Location

**Purpose**: Get the source file and line number where a component is defined.

**Requires**: React DevTools + Source Maps

**When to use**:
- Need to modify component code
- Finding component implementation
- Navigating to source files
- Understanding component structure

**Input**:
```typescript
{
  url: string;
  selector: string;
  resolveSourceMaps?: boolean; // Default: true
}
```

**Output**:
```typescript
{
  component: string;
  source: {
    file: string;
    line: number;
    column: number;
    url?: string; // Source map URL
  };
  bundleLocation?: {
    file: string;
    line: number;
  };
}
```

**Example**:
```
Use component_get_source on https://app.com
Selector: .user-profile-card
Resolve source maps: true
```

**Best for**: Code navigation, finding implementations.

---

### 6. component_track_renders - Render Tracking

**Purpose**: Track component re-renders over time to identify performance issues.

**Requires**: React DevTools

**When to use**:
- Component renders too frequently
- Performance optimization needed
- Debugging infinite render loops
- Understanding render triggers

**Input**:
```typescript
{
  url: string;
  selector: string;
  duration?: number;      // Milliseconds to track (default: 5000)
  captureReasons?: boolean; // Why component re-rendered
}
```

**Output**:
```typescript
{
  component: string;
  renderCount: number;
  renders: Array<{
    timestamp: number;
    duration: number;
    reason?: string; // "props", "state", "parent", "context"
    changedProps?: string[];
    changedState?: string[];
  }>;
  averageRenderTime: number;
}
```

**Example**:
```
Use component_track_renders on https://app.com
Selector: #live-feed
Duration: 10000
Capture reasons: true
```

**Best for**: Performance optimization, render debugging.

---

### 7. component_get_context - Context Values

**Purpose**: Extract React Context values consumed by a component.

**Requires**: React DevTools

**When to use**:
- Context values incorrect
- Provider not wrapping component
- Debugging context updates
- Verifying context consumption

**Input**:
```typescript
{
  url: string;
  selector: string;
  includeProviders?: boolean; // Show provider chain
}
```

**Output**:
```typescript
{
  component: string;
  contexts: Array<{
    name: string;
    value: any;
    provider?: string; // Provider component name
  }>;
  providers?: Array<{
    name: string;
    selector: string;
    value: any;
  }>;
}
```

**Example**:
```
Use component_get_context on https://app.com
Selector: .theme-aware-button
Include providers: true
```

**Best for**: Context debugging, provider verification.

---

### 8. component_get_hooks - Hooks Inspection

**Purpose**: Inspect React hooks state (useState, useEffect, useContext, custom hooks).

**Requires**: React DevTools

**When to use**:
- Hook dependencies incorrect
- useEffect running unexpectedly
- Custom hook state issues
- Debugging hook-based components

**Input**:
```typescript
{
  url: string;
  selector: string;
  includeEffects?: boolean; // Include useEffect details
}
```

**Output**:
```typescript
{
  component: string;
  hooks: Array<{
    type: "state" | "effect" | "context" | "ref" | "memo" | "callback" | "custom";
    name?: string;
    value?: any;
    dependencies?: any[];
  }>;
  totalHooks: number;
}
```

**Example**:
```
Use component_get_hooks on https://app.com
Selector: [data-component="DataFetcher"]
Include effects: true
```

**Best for**: Hook debugging, dependency analysis.

---

## Common Workflows

### Workflow 1: Debug Wrong Render

**Problem**: Component shows wrong data

**Steps**:
1. Get component tree to find the component
2. Inspect props to verify inputs
3. Check state for internal data
4. Verify context if using providers

```
1. component_tree → Find component selector
2. component_get_props → Check prop values
3. component_get_state → Check internal state
4. component_get_context → Verify context values
```

---

### Workflow 2: Performance Investigation

**Problem**: Component re-renders too often

**Steps**:
1. Track renders to count re-renders
2. Get hooks to check dependencies
3. Inspect props to find changing values
4. Get source to modify code

```
1. component_track_renders → Count renders & reasons
2. component_get_hooks → Check effect dependencies
3. component_get_props → Find unstable props
4. component_get_source → Navigate to fix
```

---

### Workflow 3: Find Component Instance

**Problem**: Need to locate specific component

**Steps**:
1. Find by name to get all instances
2. Get tree to understand hierarchy
3. Inspect specific instance

```
1. component_find_by_name → Locate instances
2. component_tree → See hierarchy
3. component_get_props/state → Inspect specific instance
```

---

## Framework Support

### React ✅ Full Support
- All 8 tools supported
- Best support with React DevTools
- Hooks inspection available
- Source maps recommended

### Vue ✅ Good Support
- 6/8 tools supported
- Vue DevTools similar to React
- Composition API supported
- Options API supported

### Angular ✅ Moderate Support
- 5/8 tools supported
- Angular DevTools required
- Component hierarchy works well
- Limited hooks support

### Svelte ✅ Basic Support
- 4/8 tools supported
- Svelte DevTools recommended
- Store inspection works
- Limited state introspection

---

## Troubleshooting

### "Component not found"
- ✅ Verify selector matches actual DOM element
- ✅ Wait for component to mount (add delay)
- ✅ Check if framework component (not plain HTML)
- ✅ Try `component_find_by_name` instead

### "DevTools required"
- ✅ Install React/Vue/Angular DevTools extension
- ✅ Enable DevTools in production (if needed)
- ✅ Use `component_tree` first (no DevTools needed)

### "No props/state returned"
- ✅ Ensure DevTools is installed
- ✅ Check if component has props/state
- ✅ Verify component is active (not unmounted)

### "Source maps not available"
- ✅ Enable source maps in build
- ✅ Make source maps accessible via HTTP
- ✅ Use bundleLocation as fallback

---

## Performance Considerations

**Tool Response Times**:
- `component_tree`: ~0.8-2.1s
- `component_get_props`: ~1.0s
- `component_get_state`: ~1.0s
- `component_find_by_name`: ~1.2s
- `component_get_source`: ~1.5s
- `component_track_renders`: Variable (depends on duration)
- `component_get_context`: ~1.0s
- `component_get_hooks`: ~1.0s

**Best Practices**:
- Use specific selectors (faster than broad searches)
- Limit tree depth for large apps
- Track renders for minimum necessary duration
- Cache component locations for repeated access

---

## Integration with Other Skills

**Combine with**:
- `websee-network-intelligence` → Find which component made API call
- `websee-source-intelligence` → Navigate to component source
- `websee-error-intelligence` → Get component context from errors

**Example Multi-Skill Workflow**:
```
1. error_get_context → Find error in component
2. component_get_state → Check component state
3. network_get_requests → See if API failed
4. source_map_resolve → Navigate to source
```

---

## Reference Files

See `references/` directory for:
- `framework-support.md` - Detailed framework compatibility
- `devtools-setup.md` - DevTools installation guides
- `component-patterns.md` - Common component debugging patterns

---

**Skill Version**: 1.0.0
**Tools Count**: 8
**Average Response Time**: 1.25s
**Success Rate**: 100% (with DevTools), 30% (without DevTools)
