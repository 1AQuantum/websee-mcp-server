# Claude Code Setup Guide for WebSee MCP Server

This guide shows you how to set up the WebSee Source Intelligence MCP server for use with **Claude Code** (latest version).

---

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Claude Code installed
- ✅ Playwright installed (globally or locally)

---

## Quick Setup (3 Methods)

### Method 1: CLI Command (Easiest) ⭐

The fastest way to add WebSee to Claude Code:

```bash
# Step 1: Build WebSee
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
npm install
npm run mcp:build

# Step 2: Add to Claude Code using CLI
claude mcp add-json websee '{
  "command": "node",
  "args": ["'$(pwd)'/dist/mcp-server.js"],
  "env": {
    "BROWSER": "chromium",
    "HEADLESS": "true"
  }
}'
```

**Done!** WebSee is now available in Claude Code.

### Method 2: Project Configuration (.mcp.json) ⭐

For team sharing via git:

1. **Build WebSee**:
```bash
cd /Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production
npm install
npm run mcp:build
```

2. **Create `.mcp.json` in your project root**:
```json
{
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": [
        "${WEBSEE_PATH:-/Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production/dist/mcp-server.js}"
      ],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "true"
      }
    }
  }
}
```

3. **Set environment variable** (optional, for flexibility):
```bash
# Add to your ~/.zshrc or ~/.bashrc
export WEBSEE_PATH="/Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production/dist/mcp-server.js"
```

4. **Reload Claude Code**

**Benefits**: Team members can share the same `.mcp.json` and each set their own `WEBSEE_PATH`.

### Method 3: User-Level Configuration

For personal use across all projects:

```bash
# Add with user scope
claude mcp add-json websee '{
  "command": "node",
  "args": ["/Users/laptopname/Documents/Coding/MCPs/websee-source-intelligence-production/dist/mcp-server.js"],
  "env": {
    "BROWSER": "chromium",
    "HEADLESS": "true"
  }
}' --scope user
```

---

## Configuration Scopes

Claude Code supports three configuration scopes:

| Scope | Location | Use Case |
|-------|----------|----------|
| **Local** | Current project only | Testing/development |
| **Project** | `.mcp.json` in git | Team sharing (recommended) |
| **User** | User settings | Personal use across projects |

---

## Verify Installation

After setup, verify WebSee is available:

1. Open Claude Code
2. Start a new conversation
3. Ask: "What MCP tools do you have?"

You should see:
- ✅ `debug_frontend_issue`
- ✅ `analyze_performance`
- ✅ `inspect_component_state`
- ✅ `trace_network_requests`
- ✅ `analyze_bundle_size`
- ✅ `resolve_minified_error`

---

## Using WebSee with Claude Code

Simply ask Claude natural language questions:

### Example 1: Debug an Error
```
Debug the login page at https://example.com
Check for JavaScript errors and component issues
```

### Example 2: Performance Analysis
```
Analyze performance of https://myapp.com/dashboard
Focus on slow network requests and bundle size
```

### Example 3: Component Inspection
```
Inspect the #user-profile component on https://app.com
Show me its state and props
```

### Example 4: Network Tracing
```
Trace all API calls on https://myapp.com
Filter for /api/* requests
```

### Example 5: Bundle Analysis
```
Check bundle size on https://myapp.com
Find if moment.js is included
```

---

## Environment Variables

Customize browser behavior:

```json
{
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": ["..."],
      "env": {
        "BROWSER": "${WEBSEE_BROWSER:-chromium}",
        "HEADLESS": "${WEBSEE_HEADLESS:-true}"
      }
    }
  }
}
```

Then set in your shell:
```bash
export WEBSEE_BROWSER="firefox"
export WEBSEE_HEADLESS="false"
```

### Browser Options

- **chromium** - Chrome, Edge, Brave (default)
- **firefox** - Mozilla Firefox
- **webkit** - Safari (macOS only)

### Headless Mode

- **true** - Browser runs in background (faster, default)
- **false** - Browser window visible (helpful for debugging)

---

## Team Setup (Recommended)

### For Your Organization

**1. Create setup script** (`setup-websee.sh`):
```bash
#!/bin/bash

echo "🚀 Setting up WebSee MCP Server for Claude Code..."

# Build WebSee
cd "$(dirname "$0")"
npm install
npm run mcp:build

WEBSEE_PATH="$(pwd)/dist/mcp-server.js"

echo ""
echo "✅ WebSee built successfully!"
echo ""
echo "📋 Choose your setup method:"
echo ""
echo "Method 1: CLI (Quick)"
echo "claude mcp add-json websee '{\"command\":\"node\",\"args\":[\"$WEBSEE_PATH\"],\"env\":{\"BROWSER\":\"chromium\",\"HEADLESS\":\"true\"}}'"
echo ""
echo "Method 2: Project (.mcp.json in your project)"
echo "Copy .mcp.json to your project root and update WEBSEE_PATH"
echo ""
echo "Method 3: Environment Variable"
echo "export WEBSEE_PATH=\"$WEBSEE_PATH\""
echo "Then use .mcp.json with \${WEBSEE_PATH}"
```

**2. Make executable**:
```bash
chmod +x setup-websee.sh
```

**3. Share with team**:
- Commit to your org repo
- Team members run `./setup-websee.sh`
- Choose their preferred setup method

---

## Advanced: Multiple Environments

Support dev/staging/production:

```json
{
  "mcpServers": {
    "websee-dev": {
      "command": "node",
      "args": ["${WEBSEE_PATH}"],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "false"
      }
    },
    "websee-prod": {
      "command": "node",
      "args": ["${WEBSEE_PATH}"],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "true"
      }
    }
  }
}
```

---

## Troubleshooting

### WebSee tools not appearing

**1. Check build output**:
```bash
ls -la dist/mcp-server.js
# Should show: -rwxr-xr-x ... dist/mcp-server.js
```

**2. Verify MCP server list**:
```bash
claude mcp list
# Should show "websee" in the list
```

**3. Check logs**:
```bash
# View Claude Code MCP logs
claude mcp logs websee
```

### "Module not found" errors

Rebuild WebSee:
```bash
npm run mcp:build
```

### Browser launch failures

Since Playwright is installed, verify browsers:
```bash
npx playwright install --dry-run

# If needed, install browsers:
npx playwright install chromium
```

### Remove and re-add WebSee

```bash
# Remove
claude mcp remove websee

# Re-add
claude mcp add-json websee '{...config...}'
```

---

## CLI Reference

### Common Commands

```bash
# List all MCP servers
claude mcp list

# View WebSee configuration
claude mcp show websee

# View WebSee logs
claude mcp logs websee

# Remove WebSee
claude mcp remove websee

# Update WebSee
claude mcp remove websee
claude mcp add-json websee '{...new-config...}'
```

---

## Configuration Files Reference

### Project Configuration (`.mcp.json`)

**Location**: Your project root (committed to git)

```json
{
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": ["${WEBSEE_PATH}"],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "true"
      }
    }
  }
}
```

**Benefits**:
- ✅ Shareable with team via git
- ✅ Supports environment variables
- ✅ Project-specific configuration

---

## Next Steps

Once configured:

1. ✅ Test with: "What MCP tools do you have?"
2. ✅ Try debugging a real application
3. ✅ Share `.mcp.json` with your team
4. ✅ Read [MCP_TOOLS.md](./MCP_TOOLS.md) for detailed tool docs
5. ✅ Check [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) to extend WebSee

---

## Getting Help

- **Tool Documentation**: [MCP_TOOLS.md](./MCP_TOOLS.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **Main README**: [README.md](./README.md)
- **Project Structure**: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

**🎉 You're ready to use WebSee with Claude Code!**

Start debugging your frontend applications with source-level intelligence.