# WebSee Component Intelligence

Deep component inspection for React, Vue, Angular, and Svelte applications.

## Quick Info

- **Tools**: 8 component analysis tools
- **Category**: Component debugging
- **Framework Support**: React (full), Vue (good), Angular (moderate), Svelte (basic)
- **DevTools Required**: 6/8 tools (100% success with DevTools, 30% without)
- **Average Response Time**: 1.25s
- **Test Pass Rate**: 100%

## When to Use

- Component renders incorrectly or with wrong data
- Props aren't being passed correctly
- State management issues
- Need to understand component hierarchy
- Tracking down which component triggers a bug
- Analyzing hooks dependencies
- Debugging context providers
- Finding component source code

## Tools Provided

1. **component_tree** - Get component hierarchy
2. **component_get_props** - Inspect component props
3. **component_get_state** - Inspect component state
4. **component_find_by_name** - Find components by name
5. **component_get_source** - Get component source location
6. **component_track_renders** - Track re-renders over time
7. **component_get_context** - Get React Context values
8. **component_get_hooks** - Inspect React hooks

## Prerequisites

### Recommended
- **React DevTools** (for React apps) - 6/8 tools require it
- **Vue DevTools** (for Vue apps)
- **Angular DevTools** (for Angular apps)
- **Svelte DevTools** (for Svelte apps)

### Optional
- Source maps (for `component_get_source`)

## Quick Start

```
# 1. Find component
component_find_by_name → Locate component instances

# 2. Get hierarchy
component_tree → Understand structure

# 3. Inspect state
component_get_props → Check inputs
component_get_state → Check internal state

# 4. Debug issues
component_track_renders → Performance
component_get_hooks → Dependencies
```

## Documentation

- **[SKILL.md](./SKILL.md)** - Complete skill documentation
- **[references/framework-support.md](./references/framework-support.md)** - Detailed framework compatibility
- **[references/devtools-setup.md](./references/devtools-setup.md)** - DevTools installation guide

## Framework Support

| Framework | Support Level | Tools Supported | DevTools Required |
|-----------|---------------|-----------------|-------------------|
| React | ✅ Full | 8/8 | Yes (6/8 tools) |
| Vue | ✅ Good | 6/8 | Yes |
| Angular | ⚠️ Moderate | 5/8 | Yes |
| Svelte | ⚠️ Basic | 4/8 | Optional |

## Common Use Cases

### Debug Wrong Render
```
1. component_tree → Find component
2. component_get_props → Verify inputs
3. component_get_state → Check internal state
4. component_get_context → Check context values
```

### Performance Issues
```
1. component_track_renders → Count re-renders
2. component_get_hooks → Check dependencies
3. component_get_props → Find unstable props
```

### Find Component
```
1. component_find_by_name → Locate instances
2. component_get_source → Navigate to code
```

## Performance

- **Average response time**: 1.25s
- **Range**: 0.8s - 2.1s
- **Success rate**: 100% (with DevTools)

## Integration

Works seamlessly with:
- **websee-network-intelligence** - Find which component made API call
- **websee-source-intelligence** - Navigate to component source
- **websee-error-intelligence** - Get component context from errors

## Version

- **Skill Version**: 1.0.0
- **Last Updated**: 2025-10-26
- **Status**: ✅ Production Ready
