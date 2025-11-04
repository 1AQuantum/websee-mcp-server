# WebSee Frontend Debugger Skill

This skill teaches AI agents how to effectively use the WebSee MCP server for frontend debugging with source-level intelligence.

## Skill Structure

```
websee-frontend-debugger/
├── SKILL.md                          # Main skill instructions
├── README.md                         # This file
└── references/
    ├── tool-schemas.md              # Complete parameter documentation
    ├── debugging-playbook.md        # Real-world scenarios
    └── advanced-techniques.md       # Expert strategies
```

## What This Skill Teaches

### Core Capabilities

1. **Choosing the Right Tool** - When to use each of the 6 WebSee MCP tools
2. **Debugging Workflows** - Complete investigation patterns from symptom to solution
3. **Tool Combinations** - How to chain tools for deep analysis
4. **Advanced Techniques** - Expert strategies for maximum effectiveness

### The 6 WebSee MCP Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `debug_frontend_issue` | Comprehensive debugging | Initial investigation, unclear symptoms |
| `analyze_performance` | Performance analysis | Slow page loads, optimization |
| `inspect_component_state` | Component inspection | Component state/props issues |
| `trace_network_requests` | Network tracing | API issues, slow requests |
| `analyze_bundle_size` | Bundle analysis | Large bundle, optimization |
| `resolve_minified_error` | Error resolution | Production errors, minified stacks |

## How Agents Learn

The skill uses **progressive disclosure**:

1. **SKILL.md**: Core concepts, when to use, basic workflows (always loaded)
2. **tool-schemas.md**: Detailed parameters and return types (loaded when needed)
3. **debugging-playbook.md**: Real-world scenarios with solutions (loaded for complex issues)
4. **advanced-techniques.md**: Expert strategies and tool combinations (loaded for optimization)

This structure minimizes token usage while maximizing capability.

## Key Learning Outcomes

After learning this skill, agents can:

### ✅ Diagnostic Skills

- Identify issue types from symptoms
- Choose appropriate tool for investigation
- Interpret tool output correctly
- Correlate findings across multiple tools

### ✅ Investigation Patterns

- Follow complete debugging workflows
- Chain tools for deep analysis
- Use temporal analysis for async issues
- Build comprehensive error context

### ✅ Optimization Strategies

- Profile complete application performance
- Identify bundle optimization opportunities
- Map network requests to source code
- Find memory leaks and performance bottlenecks

### ✅ Production Debugging

- Resolve minified error stacks
- Debug without access to source code
- Understand error context (component + network + source)
- Find root causes in production builds

## Usage Example

When a user asks: **"The checkout button doesn't work"**

**Without this skill**, agent might:
- Ask vague questions
- Not know which tool to use
- Miss important context
- Provide incomplete analysis

**With this skill**, agent will:
1. Use `debug_frontend_issue` to check for errors
2. Use `inspect_component_state` to verify button state
3. Use `trace_network_requests` to check if API fires
4. Provide complete root cause analysis with exact source location

## Advanced Capabilities

The skill teaches advanced techniques:

### Cross-Tool Correlation
Combine output from multiple tools for comprehensive analysis:
```
Error stack → Component state → Network trace → Root cause
```

### Temporal Analysis
Track state changes over time using interactions:
```
Initial state → User action → Async completion → Final state
```

### Performance Profiling
Complete performance audit using all tools:
```
analyze_performance + analyze_bundle_size + trace_network_requests = Complete profile
```

### User Journey Tracking
Follow complete user workflows:
```
Product page → Add to cart → Checkout → Payment
(with full context at each step)
```

## Real-World Scenarios

The skill includes 8 complete debugging scenarios:

1. **"The Button Doesn't Work"** - Event handler debugging
2. **"Page Loads Too Slowly"** - Performance optimization
3. **"Production Error"** - Minified error resolution
4. **"Form Validation Fails Silently"** - Validation debugging
5. **"Data Displayed is Stale"** - Caching issues
6. **"Memory Leak in SPA"** - Memory leak detection
7. **"Component Renders Wrong Data"** - Data flow analysis
8. **"Infinite Render Loop"** - Render loop diagnosis

Each scenario includes:
- Symptoms
- Investigation steps (which tools to use)
- Expected outcomes
- Common root causes
- Solutions

## Integration with Your Organization

This skill is designed to be:

### Shareable
- Package with your WebSee MCP deployment
- Version control friendly (markdown files)
- Team can contribute improvements

### Extensible
- Add organization-specific scenarios to debugging-playbook.md
- Include your app's architecture in references
- Document common issues your team faces

### Trainable
- New team members learn from the skill
- Agents become more effective over time
- Consistent debugging approach across team

## For Skill Creators

If you're extending this skill:

### Adding New Scenarios

Add to `references/debugging-playbook.md`:
```markdown
## Scenario X: "Your Issue"

**Symptoms**: What the user sees

### Investigation Steps
1. Tool: tool_name with parameters
2. Check for: specific things
3. Action: what to do next

### Common Root Causes
| Finding | Root Cause | Solution |
|---------|-----------|----------|
```

### Adding Advanced Techniques

Add to `references/advanced-techniques.md`:
```markdown
## Technique X: Concept Name

**Concept**: Brief explanation

### Example: Specific Use Case
[Complete example with tool calls and output]

### Use cases
- When to apply this technique
```

### Updating Tool Schemas

When WebSee adds new tools or parameters, update `references/tool-schemas.md` with:
- Parameter documentation
- Return schema
- Example usage

## grep_patterns for References

Agents can search reference files using these patterns:

### tool-schemas.md
- Find tool: `^## [a-z_]+$`
- Find parameters: `^### Parameters`
- Find schema: `^### Return Schema`
- Find examples: `^### Example Usage`

### debugging-playbook.md
- Find scenario: `^## Scenario \d+:`
- Find steps: `^### Investigation Steps`
- Find causes: `^### Common`

### advanced-techniques.md
- Find technique: `^## Technique \d+:`
- Find combinations: `^## Tool Combination Matrix`
- Find workflows: `^## Performance Optimization Workflow`

## Skill Metadata

```yaml
name: websee-frontend-debugger
description: Debug frontend applications with source-level intelligence using WebSee MCP tools
version: 1.0.0
author: Your Organization
license: MIT
mcp_server: websee
tools_count: 6
scenarios_count: 8
techniques_count: 14
```

## Version History

- **1.0.0** (2025-10-26): Initial release
  - 6 tools documented
  - 8 real-world scenarios
  - 14 advanced techniques
  - Complete tool schemas
  - Performance optimization workflows

---

**For agents**: Start with SKILL.md, reference tool-schemas.md for parameters, use debugging-playbook.md for scenarios, and advanced-techniques.md for optimization.

**For humans**: This skill makes AI agents expert frontend debuggers using WebSee.