# 🤖 MCP & AI Agent Configuration Guide

> How to use WebSee Source Intelligence with Claude Desktop and other AI agents

## 📋 Table of Contents
- [Quick Setup for AI Agents](#quick-setup-for-ai-agents)
- [Claude Desktop Configuration](#claude-desktop-configuration)
- [Available MCP Tools](#available-mcp-tools)
- [AI Agent Use Cases](#ai-agent-use-cases)
- [Prompt Templates](#prompt-templates)

---

## 🚀 Quick Setup for AI Agents

### Step 1: Install WebSee Intelligence
```bash
cd websee-source-intelligence-production
npm install
npm run build
```

### Step 2: Configure Claude Desktop

The MCP server is already built and ready to use. Just add the configuration to Claude Desktop!

---

## 🔷 Claude Desktop Configuration

### For Claude Desktop Users

Copy the configuration from `claude_desktop_config.json` to your Claude Desktop settings:

**Location**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration**:
```json
{
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/websee-source-intelligence-production/dist/mcp-server.js"
      ],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "true"
      }
    }
  }
}
```

**IMPORTANT**: Replace `/ABSOLUTE/PATH/TO/` with the actual absolute path to your installation.

For this installation, use:
```json
{
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": [
        "/Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production/dist/mcp-server.js"
      ],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "true"
      }
    }
  }
}
```

### Environment Variables

- **BROWSER**: Choose browser engine
  - `chromium` (default, recommended)
  - `firefox`
  - `webkit` (Safari engine)

- **HEADLESS**: Run browser without GUI
  - `true` (default, faster)
  - `false` (visible browser, useful for debugging)

### Restart Claude Desktop

After adding the configuration:
1. Save the `claude_desktop_config.json` file
2. Completely quit Claude Desktop
3. Restart Claude Desktop
4. The WebSee MCP tools will be available automatically

---

## 🛠️ Available MCP Tools

The WebSee MCP server provides 6 powerful tools for frontend debugging:

### 1. debug_frontend_issue

**Debug frontend issues by analyzing components, network, and errors**

```typescript
{
  url: string;              // The URL of the page experiencing issues
  selector?: string;        // CSS selector to focus on (optional)
  errorMessage?: string;    // Error message to investigate (optional)
  screenshot?: boolean;     // Capture screenshot of the issue (default: false)
}
```

**Use when**: You need to diagnose general frontend problems, console errors, or component issues.

**Example**:
```
Use debug_frontend_issue on https://example.com with selector "#checkout-button"
to see why the button is disabled
```

### 2. analyze_performance

**Analyze frontend performance including network, components, bundle size, and memory**

```typescript
{
  url: string;              // The URL to analyze for performance
  interactions?: Array<{    // User interactions to perform before analysis
    action: "click" | "type" | "scroll" | "navigate";
    selector?: string;
    value?: string;
  }>;
  metrics?: Array<"network" | "components" | "bundle" | "memory">;
                           // Metrics to analyze (default: ["network", "components"])
}
```

**Use when**: You need to identify performance bottlenecks, slow network requests, or memory issues.

**Example**:
```
Use analyze_performance on https://example.com/dashboard with metrics
["network", "memory"] after clicking "#load-data"
```

### 3. inspect_component_state

**Inspect the state, props, and structure of React/Vue/Angular components**

```typescript
{
  url: string;              // The page URL
  selector: string;         // CSS selector for the component
  waitForSelector?: boolean; // Wait for element to appear (default: true)
  includeChildren?: boolean; // Include child components (default: false)
}
```

**Use when**: You need to examine component state, props, or understand component hierarchy.

**Example**:
```
Use inspect_component_state on https://example.com with selector ".user-profile"
to see the component's current state and props
```

### 4. trace_network_requests

**Trace network requests and identify what code triggered them**

```typescript
{
  url: string;              // The page URL
  pattern?: string;         // URL pattern to filter (e.g., '/api/*')
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ALL";
                           // HTTP method to filter by (default: "ALL")
  waitTime?: number;        // Time to wait for requests in ms (default: 3000)
}
```

**Use when**: You need to find which code is making specific API calls or network requests.

**Example**:
```
Use trace_network_requests on https://example.com/dashboard with pattern "/api/users"
to see what's calling the users API
```

### 5. analyze_bundle_size

**Analyze JavaScript bundle size and identify large modules**

```typescript
{
  url: string;              // The application URL
  moduleName?: string;      // Specific module to search for
  threshold?: number;       // Size threshold in KB to flag modules (default: 50)
}
```

**Use when**: You need to understand bundle size, find large dependencies, or optimize loading.

**Example**:
```
Use analyze_bundle_size on https://example.com to find large modules,
specifically check if moment.js is included
```

### 6. resolve_minified_error

**Resolve minified error stack traces to original source code**

```typescript
{
  url: string;              // The page URL
  errorStack: string;       // The minified error stack trace
  triggerError?: boolean;   // Try to trigger the error (default: false)
}
```

**Use when**: You have a production error stack trace that needs to be mapped to source code.

**Example**:
```
Use resolve_minified_error on https://example.com with errorStack
"at e.render (main.abc123.js:45:2891)" to find the original source location
```

---

## 🎯 AI Agent Use Cases

### 1. Automated Bug Diagnosis

**Prompt Template**:
```
I'm getting an error "{error_message}" when clicking "{action}" on {url}.
Please use the WebSee tools to:
1. Find the exact source location
2. Check component state when error occurs
3. Identify related network calls
4. Suggest a fix
```

**Claude Response Flow**:
1. Uses `debug_frontend_issue` to capture the error and context
2. Uses `inspect_component_state` on the affected component
3. Uses `trace_network_requests` to check related API calls
4. Uses `resolve_minified_error` to map stack traces
5. Provides diagnosis and recommended fix

### 2. Performance Analysis

**Prompt Template**:
```
Our app at {url} is loading slowly. Use WebSee to:
1. Find slow network requests
2. Identify large bundle modules
3. Check component render times
4. Provide optimization recommendations
```

**Claude Response Flow**:
1. Uses `analyze_performance` with all metrics enabled
2. Uses `trace_network_requests` to find slow API calls
3. Uses `analyze_bundle_size` to identify large modules
4. Provides actionable optimization recommendations

### 3. Component State Debugging

**Prompt Template**:
```
The {component_name} component at {url} isn't displaying correctly.
Debug the component state and props to find the issue.
```

**Claude Response Flow**:
1. Uses `inspect_component_state` to examine current state
2. Uses `debug_frontend_issue` to check for errors
3. Compares expected vs actual state
4. Identifies the root cause

### 4. Network Request Investigation

**Prompt Template**:
```
Find all API calls to {api_pattern} on {url} and show me:
1. What triggered each request
2. Response times
3. Any failed requests
4. The source code making the calls
```

**Claude Response Flow**:
1. Uses `trace_network_requests` with pattern filter
2. Analyzes stack traces to find triggering code
3. Reports timing and success metrics
4. Provides source locations

---

## 📝 Prompt Templates for Claude Desktop

### Quick Debug
```
@websee debug the issue at https://example.com/checkout when I click the submit button
```

### Performance Check
```
@websee analyze performance of https://example.com/dashboard and tell me what's slow
```

### Component Inspection
```
@websee inspect the component at selector ".user-profile" on https://example.com
```

### API Tracing
```
@websee trace all API calls matching "/api/*" on https://example.com
```

### Bundle Analysis
```
@websee check the bundle size of https://example.com and find large modules
```

### Error Resolution
```
@websee resolve this minified error on https://example.com:
"TypeError: Cannot read property 'map' of undefined
    at e.render (main.abc123.js:45:2891)"
```

---

## 🔧 Testing Your Configuration

### Verify MCP Server Installation

1. Build the server:
```bash
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
npm run build
```

2. Test the server manually:
```bash
node dist/mcp-server.js
```

The server should start without errors and output: "WebSee MCP Server started"

3. Check Claude Desktop logs:
- macOS: `~/Library/Logs/Claude/mcp.log`
- Windows: `%APPDATA%\Claude\logs\mcp.log`
- Linux: `~/.config/Claude/logs/mcp.log`

### Troubleshooting

**Issue: MCP server not connecting**
- Verify the absolute path in your configuration is correct
- Check that Node.js is installed: `node --version`
- Ensure the project is built: `npm run build`
- Check logs for error messages

**Issue: Tools not appearing in Claude Desktop**
- Restart Claude Desktop completely (quit and reopen)
- Verify the JSON configuration has no syntax errors
- Check that the `mcpServers` key is at the root level

**Issue: Browser not launching**
```bash
# Install Playwright browsers
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
npx playwright install chromium
```

**Issue: Zod validation errors**
```bash
# Install missing dependency
npm install zod
npm run build
```

---

## 🎯 Real-World Usage Examples

### 1. Automated Bug Diagnosis

**Prompt Template:**
```
I'm getting an error "{error_message}" when clicking "{action}" on {url}.
Please use WebSee to:
1. Find the exact source location
2. Check component state when error occurs
3. Identify related network calls
4. Suggest a fix
```

**AI Response (with WebSee):**
```
I'll investigate this error using WebSee Source Intelligence.

[Calling debug_component tool...]
[Calling analyze_error tool...]
[Calling trace_network tool...]

Found the issue:
- Error location: UserProfile.tsx:45
- Component state: { user: null, loading: false }
- Failed API call: GET /api/user/123 returned 401
- Root cause: Authentication token expired

Fix: Add token refresh before API call:
\`\`\`typescript
if (isTokenExpired()) {
  await refreshToken();
}
const user = await fetchUser(userId);
\`\`\`
```

### 2. Performance Analysis

**Prompt Template:**
```
Our app at {url} is loading slowly. Use WebSee to:
1. Find slow network requests
2. Identify large bundle modules
3. Check component render times
4. Provide optimization recommendations
```

### 3. Memory Leak Detection

**Prompt Template:**
```
Check {url} for memory leaks by:
1. Opening and closing modals 10 times
2. Checking if components are properly cleaned up
3. Monitoring heap size changes
```

---

## 📝 Prompt Templates for AI Agents

### Debug Component State
```
@websee debug_component url:"https://example.com" selector:"#user-profile"
Show me the current state and props of the user profile component
```

### Analyze Production Error
```
@websee analyze_error url:"https://app.com" errorMessage:"Cannot read property 'map' of undefined"
Find the source of this error and show the component context
```

### Trace API Calls
```
@websee trace_network url:"https://app.com/dashboard" pattern:"/api/*"
Show me all API calls, their duration, and what triggered them
```

### Bundle Analysis
```
@websee inspect_bundle moduleName:"moment.js"
Check if moment.js is in our bundle and how much space it takes
```

---

## 🔌 GitHub Copilot Configuration

### copilot-instructions.md
```markdown
When working with frontend debugging:
- Use WebSee Source Intelligence for error analysis
- Always resolve minified code to source
- Check component state before suggesting fixes
- Trace network calls to find root causes

Import WebSee:
\`\`\`typescript
import { SourceIntelligenceLayer } from '@your-org/websee-source-intelligence';
\`\`\`
```

---

## 🎨 Custom AI Tools

### Create Your Own Tools
```typescript
// custom-tools.ts
export async function debugFormValidation(url: string, formSelector: string) {
  const intelligence = new SourceIntelligenceLayer();
  // ... your custom logic
}

export async function findUnusedComponents(url: string) {
  const intelligence = new SourceIntelligenceLayer();
  // ... find components not in viewport
}

export async function checkAccessibility(url: string) {
  const intelligence = new SourceIntelligenceLayer();
  // ... check ARIA and component accessibility
}
```

---

## 📊 MCP Performance Benefits

| Capability | Without WebSee | With WebSee MCP |
|-----------|----------------|-----------------|
| Error Source Location | Manual source map lookup | Automatic resolution |
| Component State | Console.log debugging | Direct state inspection |
| Network Call Origin | Network tab guessing | Exact stack trace |
| Bundle Analysis | Manual webpack analysis | Automated detection |
| Debug Time | 30-60 minutes | 1-5 minutes |
| Production Debugging | Nearly impossible | Full source resolution |

---

## 🚦 Best Practices

### For Effective Debugging
1. Provide full URLs (not relative paths)
2. Be specific with selectors (IDs are best)
3. Include error messages when available
4. Mention recent changes that might be related
5. Test in headless:false mode for visual issues

### For Performance
1. Use `pattern` parameter to filter network requests
2. Specify exact `metrics` needed for performance analysis
3. Close browser instances (done automatically per tool call)
4. Use `threshold` parameter for bundle analysis

### For Security
1. Don't debug production sites without permission
2. Be careful with authentication tokens
3. Use HEADLESS="true" for automated debugging
4. Don't commit screenshots with sensitive data

---

## 🔄 Keeping WebSee Updated

```bash
# Pull latest changes
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
git pull

# Reinstall dependencies
npm install

# Rebuild MCP server
npm run build

# No need to update Claude Desktop config - it points to the same location
```

---

## 📚 Additional Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)
- [Playwright Documentation](https://playwright.dev)
- [Source Maps Explained](https://developer.chrome.com/blog/sourcemaps)

---

## 🆘 Support

**Having issues?**
1. Check the [Testing Your Configuration](#testing-your-configuration) section
2. Review Claude Desktop logs
3. Test the MCP server manually
4. Ensure all dependencies are installed

**Feature requests or bugs?**
- Open an issue in the repository
- Include MCP server logs
- Provide example URLs (if public)
- Describe expected vs actual behavior

---

**Ready to debug like a pro?** Configure Claude Desktop with WebSee MCP and transform your frontend debugging experience!