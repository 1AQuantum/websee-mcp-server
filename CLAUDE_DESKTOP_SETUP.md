# Claude Desktop Setup Guide for WebSee MCP

Quick setup guide for integrating WebSee Source Intelligence with Claude Desktop.

## Prerequisites

- Node.js 18 or higher
- Claude Desktop installed
- Terminal access

## Installation Steps

### 1. Build the MCP Server

```bash
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
npm install
npm run build
```

### 2. Configure Claude Desktop

**Find your Claude Desktop configuration file:**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Add this configuration:**

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

**IMPORTANT**: If you have existing MCP servers, merge this into your existing configuration:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
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

### 3. Install Playwright Browsers

```bash
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
npx playwright install chromium
```

### 4. Restart Claude Desktop

1. Completely quit Claude Desktop (don't just close the window)
2. Restart Claude Desktop
3. The WebSee tools should now be available

## Verify Installation

In Claude Desktop, try asking:

```
Can you see the WebSee MCP tools?
```

Claude should list the available tools:
- debug_frontend_issue
- analyze_performance
- inspect_component_state
- trace_network_requests
- analyze_bundle_size
- resolve_minified_error

## Quick Test

Try this simple test:

```
Use the WebSee tools to analyze the performance of https://example.com
```

Claude should use the `analyze_performance` tool to check the website.

## Environment Options

You can customize the browser behavior by changing the `env` section:

### Browser Selection

```json
"env": {
  "BROWSER": "chromium"  // Options: "chromium", "firefox", "webkit"
}
```

### Headless Mode

```json
"env": {
  "HEADLESS": "true"  // "true" for background, "false" to see browser
}
```

### Example: Debug Mode Configuration

```json
"env": {
  "BROWSER": "chromium",
  "HEADLESS": "false"  // See the browser while debugging
}
```

## Troubleshooting

### Tools Not Appearing

1. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/mcp.log`
   - Windows: `%APPDATA%\Claude\logs\mcp.log`
   - Linux: `~/.config/Claude/logs/mcp.log`

2. Verify the configuration file syntax:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool
   ```

3. Ensure the server is built:
   ```bash
   ls -la /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production/dist/mcp-server.js
   ```

### Server Fails to Start

Test the server manually:

```bash
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
node dist/mcp-server.js
```

You should see: "WebSee MCP Server started"

If you see errors, check:
1. All dependencies are installed: `npm install`
2. TypeScript is compiled: `npm run build`
3. Zod is installed: `npm list zod`

### Browser Not Launching

Install Playwright browsers:

```bash
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
npx playwright install chromium firefox webkit
```

## Available Tools

### 1. debug_frontend_issue
Debug frontend issues by analyzing components, network, and errors.

### 2. analyze_performance
Analyze frontend performance including network, components, bundle size, and memory.

### 3. inspect_component_state
Inspect the state, props, and structure of React/Vue/Angular components.

### 4. trace_network_requests
Trace network requests and identify what code triggered them.

### 5. analyze_bundle_size
Analyze JavaScript bundle size and identify large modules.

### 6. resolve_minified_error
Resolve minified error stack traces to original source code.

## Example Usage

### Debug a Checkout Flow

```
I'm having issues with the checkout button on https://mystore.com/checkout.
Use WebSee to debug it.
```

### Analyze Performance

```
The dashboard at https://myapp.com/dashboard is slow.
Use WebSee to find performance bottlenecks.
```

### Inspect Component

```
Check the state of the UserProfile component at selector "#user-profile"
on https://myapp.com using WebSee.
```

### Trace API Calls

```
Find all API calls matching "/api/users/*" on https://myapp.com
and show me what's triggering them.
```

## Next Steps

- Read the [MCP Agent Guide](./MCP_AGENT_GUIDE.md) for detailed usage
- Check [Frontend Development Guide](./FRONTEND_DEVELOPMENT_GUIDE.md) for development
- See [Production Ready Guide](./PRODUCTION_READY.md) for deployment

## Updates

To update WebSee to the latest version:

```bash
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
git pull
npm install
npm run build
# Restart Claude Desktop - no config changes needed!
```

---

**Ready to start?** Follow the steps above and start debugging with AI-powered source intelligence!
