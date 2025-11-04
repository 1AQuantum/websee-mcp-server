# Option 2: Dual-Layer MCP Architecture
## Workflow Tools + Granular Tools for Complete Frontend Visibility

---

## 🎯 The Vision

**Option 2** provides the best of both worlds:
- **6 High-Level Workflow Tools** (what we have now) - for quick, guided debugging
- **30+ Granular Tools** (what was missing) - for precise, fullstack visibility

This gives AI agents **flexibility**: use workflows for common tasks, use granular tools for precise investigation.

---

## 📊 Two-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Agent (Claude)                          │
│                                                                 │
│  "Debug this button" → Uses workflow tool                      │
│  "What are the props of UserProfile?" → Uses granular tool     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ MCP Protocol
┌──────────────────────────▼──────────────────────────────────────┐
│                    WebSee MCP Server                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │        LAYER 1: Workflow Tools (6 tools)               │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • debug_frontend_issue      (orchestrates 5+ tools)   │    │
│  │  • analyze_performance       (orchestrates 8+ tools)   │    │
│  │  • inspect_component_state   (orchestrates 3+ tools)   │    │
│  │  • trace_network_requests    (orchestrates 4+ tools)   │    │
│  │  • analyze_bundle_size       (orchestrates 3+ tools)   │    │
│  │  • resolve_minified_error    (orchestrates 4+ tools)   │    │
│  └────────────────────────────────────────────────────────┘    │
│                             ↕                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │      LAYER 2: Granular Tools (30+ tools)               │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │                                                         │    │
│  │  SOURCE INTELLIGENCE (7 tools)                         │    │
│  │  • source_map_resolve           Get original location  │    │
│  │  • source_map_get_content       Get source file        │    │
│  │  • source_trace_stack           Enhance stack trace    │    │
│  │  • source_find_definition       Find function def      │    │
│  │  • source_get_symbols           List exports/imports   │    │
│  │  • source_map_bundle            Map bundle to source   │    │
│  │  • source_coverage_map          Code coverage overlay  │    │
│  │                                                         │    │
│  │  COMPONENT INTELLIGENCE (8 tools)                      │    │
│  │  • component_tree               Full component tree    │    │
│  │  • component_get_props          Get component props    │    │
│  │  • component_get_state          Get component state    │    │
│  │  • component_find_by_name       Find component         │    │
│  │  • component_get_source         Map to source file     │    │
│  │  • component_track_renders      Track re-renders       │    │
│  │  • component_get_context        Get React context      │    │
│  │  • component_get_hooks          Get hooks state        │    │
│  │                                                         │    │
│  │  NETWORK INTELLIGENCE (6 tools)                        │    │
│  │  • network_get_requests         All requests           │    │
│  │  • network_get_by_url           Filter by URL          │    │
│  │  • network_get_timing           Request timing         │    │
│  │  • network_trace_initiator      Trace to source        │    │
│  │  • network_get_headers          Request/response       │    │
│  │  • network_get_body             Request/response body  │    │
│  │                                                         │    │
│  │  BUILD INTELLIGENCE (5 tools)                          │    │
│  │  • build_get_manifest           Webpack manifest       │    │
│  │  • build_get_chunks             All chunks info        │    │
│  │  • build_find_module            Find module in bundle  │    │
│  │  • build_get_dependencies       Dependency graph       │    │
│  │  • build_analyze_size           Size breakdown         │    │
│  │                                                         │    │
│  │  PERFORMANCE INTELLIGENCE (5 tools)                    │    │
│  │  • perf_get_metrics             Core Web Vitals        │    │
│  │  • perf_profile_cpu             CPU profiling          │    │
│  │  • perf_snapshot_memory         Memory snapshot        │    │
│  │  • perf_trace_events            Performance timeline   │    │
│  │  • perf_lighthouse              Lighthouse audit       │    │
│  │                                                         │    │
│  │  ERROR INTELLIGENCE (4 tools)                          │    │
│  │  • error_resolve_stack          Resolve minified stack │    │
│  │  • error_get_context            Full error context     │    │
│  │  • error_trace_cause            Find root cause        │    │
│  │  • error_get_similar            Find similar errors    │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                             ↕                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │            Source Intelligence Layer                    │    │
│  │  (Shared by both layers)                               │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💡 Why This is Better for AI Agents

### 1. **Flexibility in Problem-Solving**

#### Scenario: "The submit button is disabled"

**With Only Workflow Tools (Current - Limited):**
```
Agent: Uses debug_frontend_issue
Gets: Everything (errors, components, network, console)
Problem: Too much data, hard to parse what matters
```

**With Option 2 (Flexible):**
```
Agent: "Let me check this systematically..."

Step 1: component_get_props("#submit-button")
→ Gets: { disabled: true, onClick: handleSubmit }

Step 2: component_get_state("Form")
→ Gets: { isValid: false, errors: { email: "invalid" } }

Step 3: Done! Found the cause in 2 targeted queries.
```

**Result**: Agent finds the answer faster with less noise.

---

### 2. **Precise Investigation**

#### Scenario: "Why is this network request slow?"

**With Only Workflow Tools:**
```
Agent: trace_network_requests
Gets: All 50 requests with full details
Agent: Must manually filter through all data
```

**With Option 2:**
```
Agent: network_get_by_url("/api/users/123")
→ Gets: Just that one request

Agent: network_get_timing("/api/users/123")
→ Gets: { dns: 5ms, connect: 10ms, ttfb: 2400ms, download: 50ms }

Agent: "Ah! TTFB is 2.4s - backend is slow"

Agent: network_trace_initiator("/api/users/123")
→ Gets: { file: "UserProfile.tsx", line: 45, function: "loadUser" }

Agent: "Called from UserProfile.tsx:45"
```

**Result**: Precise queries, precise answers, no wasted tokens.

---

### 3. **Compositional Reasoning**

Granular tools let agents build their own investigation strategies:

#### Scenario: "Find all components that fetch user data"

**With Only Workflow Tools:**
```
Agent: Can't do this - no tool for it
Would need: debug_frontend_issue on every page? Inefficient.
```

**With Option 2:**
```
Agent builds a strategy:

1. network_get_by_url("/api/users*")
   → Gets: All user API calls

2. For each call:
   network_trace_initiator(url)
   → Gets: Source location

3. For each source:
   component_find_by_source(file, line)
   → Gets: Component that made the call

4. component_get_props(componentName)
   → Gets: Props to understand usage

Result: Complete map of user-data-fetching components
```

**Result**: Agent can answer questions the tool designer never anticipated.

---

### 4. **Reduced Token Usage**

#### Example: Checking if a component has a specific prop

**Workflow Tool (Current):**
```json
// inspect_component_state returns EVERYTHING:
{
  "component": {
    "name": "UserProfile",
    "framework": "react",
    "props": { /* 50 props */ },
    "state": { /* 30 state vars */ },
    "source": { /* source info */ },
    "parents": [ /* hierarchy */ ],
    "children": [ /* 20 children with their props/state */ ]
  }
}

Tokens used: ~2000
```

**Granular Tool (Option 2):**
```json
// component_get_props("UserProfile", "userId")
{
  "userId": "123"
}

Tokens used: ~20
```

**Result**: 100x more efficient for simple queries.

---

### 5. **Better Error Recovery**

#### Scenario: Workflow tool fails midway

**With Only Workflow Tools:**
```
Agent: analyze_performance
Tool: Collects network... ✓
Tool: Collects components... ✓
Tool: Collects bundle... ✗ ERROR
Result: Agent gets nothing (all-or-nothing)
```

**With Option 2:**
```
Agent: Let me analyze performance...

Agent: network_get_requests() → Success ✓
Agent: component_tree() → Success ✓
Agent: build_get_manifest() → Failed ✗

Agent: "I got network and component data,
        but build analysis failed.
        Let me work with what I have..."

Result: Partial success is still useful
```

---

## 🔬 Real-World Comparison

### Task: "Why did the cart total calculation fail?"

#### **With Current 6 Workflow Tools:**

```
Agent thought process:
1. debug_frontend_issue → 3000 tokens of data
2. Parse through console logs, network, components
3. inspect_component_state on Cart → 2000 tokens
4. trace_network_requests → 1500 tokens
5. Still not sure, try analyze_performance → 2500 tokens

Total: 9000 tokens, 4 tool calls, still investigating
```

#### **With Option 2 (30+ Granular Tools):**

```
Agent thought process:
1. "Cart total is wrong, let me check the state"
   component_get_state("Cart") → 200 tokens
   Gets: { items: [...], total: NaN }

2. "Total is NaN, that's a calculation error"
   source_trace_stack("Cart.calculateTotal") → 150 tokens
   Gets: { file: "Cart.tsx", line: 87, function: "calculateTotal" }

3. "Let me see that function"
   source_get_content("Cart.tsx", 80, 95) → 300 tokens
   Gets: Code showing division by zero when cart is empty

Total: 650 tokens, 3 tool calls, root cause found
```

**Result**: Option 2 is **14x more efficient** and gets to the answer faster.

---

## 🎨 How Agents Would Use Both Layers

### Layer 1 (Workflows): Starting Point
```
User: "Something's wrong with the checkout page"
Agent: debug_frontend_issue → Quick overview
Agent: "I see an error in CheckoutForm, let me investigate..."
```

### Layer 2 (Granular): Deep Dive
```
Agent: component_get_state("CheckoutForm")
Agent: network_trace_initiator("/api/checkout")
Agent: source_map_resolve(errorLine)
Agent: "Found it! Payment validation is missing"
```

---

## 📋 Complete Tool List (35 Total)

### Workflow Layer (6 tools)
1. debug_frontend_issue
2. analyze_performance
3. inspect_component_state
4. trace_network_requests
5. analyze_bundle_size
6. resolve_minified_error

### Granular Layer (29 tools)

#### Source Intelligence (7)
7. source_map_resolve
8. source_map_get_content
9. source_trace_stack
10. source_find_definition
11. source_get_symbols
12. source_map_bundle
13. source_coverage_map

#### Component Intelligence (8)
14. component_tree
15. component_get_props
16. component_get_state
17. component_find_by_name
18. component_get_source
19. component_track_renders
20. component_get_context
21. component_get_hooks

#### Network Intelligence (6)
22. network_get_requests
23. network_get_by_url
24. network_get_timing
25. network_trace_initiator
26. network_get_headers
27. network_get_body

#### Build Intelligence (5)
28. build_get_manifest
29. build_get_chunks
30. build_find_module
31. build_get_dependencies
32. build_analyze_size

#### Performance Intelligence (5)
33. perf_get_metrics
34. perf_profile_cpu
35. perf_snapshot_memory
36. perf_trace_events
37. perf_lighthouse

#### Error Intelligence (4)
38. error_resolve_stack
39. error_get_context
40. error_trace_cause
41. error_get_similar

**Total: 41 tools** (6 workflow + 35 granular)

---

## 🏗️ Implementation Strategy

### Phase 1: Add Granular Tools (Keep Workflows)
```typescript
// Workflow tools stay as-is
async function debug_frontend_issue(params) {
  // Internally uses granular tools:
  const errors = await error_get_context();
  const components = await component_tree();
  const network = await network_get_requests();
  // ... etc
}

// NEW: Expose granular tools
async function component_get_state(componentName: string) {
  // Precise, single-purpose tool
}
```

### Phase 2: Update Skill to Teach Both
```markdown
# Skill Update

## When to Use Workflow Tools
- Initial investigation
- Don't know what's wrong
- Want comprehensive snapshot

## When to Use Granular Tools
- Know exactly what to check
- Building custom investigation
- Minimizing token usage
- Chaining multiple queries
```

---

## 💪 Benefits Summary

| Aspect | Workflows Only | Option 2 (Both) |
|--------|---------------|-----------------|
| **Quick debugging** | ✅ Excellent | ✅ Excellent |
| **Precise queries** | ❌ Can't do | ✅ Excellent |
| **Token efficiency** | ⚠️ High usage | ✅ Optimized |
| **Custom investigations** | ❌ Limited | ✅ Unlimited |
| **Error recovery** | ❌ All-or-nothing | ✅ Graceful |
| **Agent flexibility** | ❌ Constrained | ✅ Maximum |
| **Learning curve** | ✅ Simple | ⚠️ More tools |
| **Fullstack visibility** | ⚠️ Through workflows | ✅ Direct access |

---

## 🎯 Why Option 2 is Ideal for Frontend Development

### 1. **Matches Developer Mental Model**

Developers think in granular terms:
- "What are the props?"
- "Where is this function defined?"
- "Which bundle is this in?"
- "What's calling this API?"

Option 2 provides tools that match these mental queries.

### 2. **Supports Iterative Investigation**

Real debugging is iterative:
```
1. Check component state
2. Hmm, state looks fine
3. Check where state comes from
4. Ah, API response is wrong
5. Check who's calling the API
6. Found it - wrong parameters
```

Granular tools support this natural flow.

### 3. **Enables Code Understanding**

Not just debugging - understanding:
- "Show me all components that use UserContext"
- "Find all places that call this API"
- "Map this bundle chunk to source files"

These are learning tasks, not just debugging.

### 4. **Scales with Complexity**

Simple apps: Use workflows
Complex apps: Use granular tools to navigate complexity

The agent can adapt its strategy.

---

## 📊 Token Usage Comparison

### Typical Debugging Session

**Workflows Only:**
```
debug_frontend_issue: 3000 tokens
inspect_component_state: 2000 tokens
trace_network_requests: 1500 tokens
Total: 6500 tokens
```

**Option 2 (Strategic Use):**
```
component_get_state: 200 tokens
network_trace_initiator: 150 tokens
source_map_resolve: 100 tokens
Total: 450 tokens
```

**Savings: 93% fewer tokens** for targeted investigation.

---

## 🚀 Migration Path

### Step 1: Add Granular Tools (Non-Breaking)
```typescript
// Existing workflows keep working
// Add new granular tools alongside
```

### Step 2: Update Skill
```markdown
# Add section: "Choosing Between Workflow and Granular Tools"
```

### Step 3: Document Patterns
```markdown
# "Common investigation patterns using granular tools"
```

### Step 4: Optimize Workflows
```typescript
// Workflows can use granular tools internally
// More efficient, more flexible
```

---

## 🎓 Learning Curve

### For Agents:
- **Workflows**: Learn 6 tools, get started fast
- **Granular**: Learn 35 tools, unlimited power
- **Option 2**: Start with workflows, graduate to granular

### For Users:
- Workflows: Simple natural language requests
- Granular: Precise technical queries
- Both: Best of both worlds

---

## ✨ Conclusion

**Option 2 is the sweet spot:**

1. **Workflows** provide guided debugging for common cases
2. **Granular tools** provide precision and flexibility
3. **Together** they give AI agents true fullstack visibility

This architecture:
- ✅ Matches how developers think
- ✅ Supports iterative investigation
- ✅ Minimizes token usage
- ✅ Enables compositional reasoning
- ✅ Scales from simple to complex
- ✅ Provides complete frontend observability

**The result: AI agents become expert frontend developers.**

---

## 📖 Next Steps

1. Implement all 35 granular tools
2. Update existing workflows to use them
3. Extend AI agent skill with granular tool guidance
4. Document common patterns for both layers
5. Create examples showing when to use each

**Ready to build the complete vision?**
