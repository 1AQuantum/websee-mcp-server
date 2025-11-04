# WebSee MCP Server - Setup Guide

This guide provides detailed setup instructions for using the WebSee Source Intelligence MCP Server with Claude Code, VS Code, and Cursor.

---

## Prerequisites

Before installing the MCP server, ensure you have the following installed:

- **Node.js** v18.0.0 or later (v20+ recommended)
- **npm** (comes with Node.js)
- **One of the following browsers** (Playwright will install automatically):
  - Chromium (default)
  - Firefox
  - WebKit (Safari)

Verify your Node.js installation:
```bash
node --version  # Should be v18.0.0 or higher
npm --version
```

---

## Installation

### 1. Clone or Navigate to the Repository

```bash
cd /path/to/websee-source-intelligence-production
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 4. Verify Build Success

```bash
ls dist/mcp-server.js
```

You should see the compiled MCP server file.

---

## Configuration

### Environment Variables

Copy the example environment file and customize as needed:

```bash
cp .env.example .env
```

Edit `.env` to configure your preferences:

```bash
# Browser Selection
BROWSER=chromium    # Options: chromium, firefox, webkit

# Headless Mode
HEADLESS=true       # Options: true, false

# Project Root
PROJECT_ROOT=.      # Path to your project
```

---

## Setup for Claude Code

### Option 1: Automatic Setup (Recommended)

Use the Claude CLI to add the MCP server:

```bash
# From the project directory
claude mcp add --scope project --transport stdio websee -- node dist/mcp-server.js
```

### Option 2: Manual Setup

The project includes a pre-configured `.mcp.json` file. To use it:

1. **For Project Scope** (shared with team):
   - The `.mcp.json` file is already in the project root
   - Commit it to version control to share with your team
   - Claude Code will automatically detect it

2. **For User Scope** (personal, all projects):
   ```bash
   # Copy configuration to user scope
   claude mcp add --scope user websee -- node /absolute/path/to/dist/mcp-server.js
   ```

### Verification

```bash
# List all configured MCP servers
claude mcp list

# Verify websee is listed and enabled
claude mcp get websee
```

### Using in Claude Code

1. Open Claude Code
2. Start a conversation
3. Type `/mcp` to see available MCP servers
4. The WebSee tools will be available automatically based on your task

### Environment Variable Expansion

Claude Code supports environment variable expansion:

```json
{
  "mcpServers": {
    "websee": {
      "env": {
        "BROWSER": "${BROWSER:-chromium}",
        "PROJECT_ROOT": "${PROJECT_ROOT:-.}"
      }
    }
  }
}
```

Set variables in your shell:
```bash
export BROWSER=firefox
export PROJECT_ROOT=/path/to/your/project
```

---

## Setup for VS Code

### Prerequisites

- **VS Code** version 1.99 or later
- **GitHub Copilot Extension** installed and enabled
- **Agent Mode** enabled: `chat.agent.enabled: true`

### Installation

#### Method 1: Command Palette (Recommended)

1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type: `MCP: Add Server`
4. Select the WebSee server or add manually

#### Method 2: Manual Configuration

The project includes `.vscode/mcp.json`. To use it:

1. Open your project in VS Code
2. The configuration is already in `.vscode/mcp.json`
3. VS Code will prompt you to trust the MCP server on first use
4. Click "Trust" to enable the server

### Configuration File

Located at `.vscode/mcp.json`:

```json
{
  "$schema": "https://anthropic.com/schemas/mcp-config.json",
  "servers": {
    "websee": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcp-server.js"],
      "env": {
        "BROWSER": "${env:BROWSER}",
        "HEADLESS": "${env:HEADLESS}",
        "PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

### Environment Variables

VS Code uses these variable syntaxes:
- `${env:VARIABLE}` - Environment variables from your system
- `${workspaceFolder}` - Current workspace path
- `${userHome}` - User's home directory

Set system environment variables:
```bash
# In your shell profile (.bashrc, .zshrc, etc.)
export BROWSER=chromium
export HEADLESS=true
```

### Verification

1. Open Command Palette: `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Run: `MCP: List Servers`
3. Verify "websee" appears in the list
4. Check status and configuration

### Troubleshooting VS Code

If the server doesn't start:

1. **Check Output Panel**:
   - Command Palette → `MCP: List Servers`
   - Select "websee" → "Show Output"
   - Review error messages

2. **Verify Build**:
   ```bash
   npm run build
   ls -la dist/mcp-server.js
   ```

3. **Test Server Manually**:
   ```bash
   node dist/mcp-server.js
   # Should start without errors (press Ctrl+C to stop)
   ```

---

## Setup for Cursor

### Installation

#### Method 1: Settings UI (Recommended)

1. Open Cursor
2. Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux) for Settings
3. Navigate to: **Developer** → **Edit Config**
4. Select **MCP Tools** → **Add Custom MCP**
5. Enter the configuration from `.cursor/mcp.json`

#### Method 2: Manual Configuration

The project includes `.cursor/mcp.json`:

1. Copy `.cursor/mcp.json` to your project
2. Cursor will automatically detect it
3. Restart Cursor if needed

### Configuration File

Located at `.cursor/mcp.json`:

```json
{
  "$schema": "https://anthropic.com/schemas/mcp-config.json",
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": ["./dist/mcp-server.js"],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "true",
        "PROJECT_ROOT": "."
      }
    }
  }
}
```

### Global vs Project Configuration

**Project-Specific** (recommended for teams):
- File: `.cursor/mcp.json` in project root
- Shared via version control
- Only available in this project

**Global** (personal use):
- File: `~/.cursor/mcp.json`
- Available in all Cursor projects
- Not shared with team

### Important: Tool Limit

Cursor has a **40-tool limit** across all MCP servers. If you exceed this:
- Not all tools will be available
- Disable unused MCP servers to free slots
- Prioritize essential servers

WebSee has 41 tools total (6 workflow + 35 granular), which slightly exceeds the limit. Consider:
- Using workflow tools primarily (6 tools)
- Enabling only needed granular tools

### Verification

1. Open Cursor
2. Start a new chat
3. Type `/mcp` to see available servers
4. Verify "websee" is listed
5. Tools should be automatically available

### Troubleshooting Cursor

If MCP servers aren't working:

1. **Check MCP Logs**:
   - Cursor may show MCP-related errors in the output panel
   - Look for initialization or connection errors

2. **Verify Path**:
   - Ensure `dist/mcp-server.js` exists
   - Use absolute paths if relative paths fail

3. **Restart Cursor**:
   - Sometimes required after configuration changes

---

## Common Issues and Solutions

### Issue: "Module not found" errors

**Solution**:
```bash
# Rebuild the project
rm -rf dist/
npm run build
```

### Issue: "Browser not found" errors

**Solution**:
```bash
# Install Playwright browsers
npx playwright install chromium
# Or for other browsers:
npx playwright install firefox
npx playwright install webkit
```

### Issue: Environment variables not working

**Solution**:
- Set variables at system level, not just in config
- Restart your editor after setting variables
- Use absolute values in config files if variables fail

### Issue: MCP server fails silently

**Solutions**:
1. Check for console errors in server logs
2. Verify Node.js version: `node --version`
3. Test server manually: `node dist/mcp-server.js`
4. Review MCP logs in your editor

### Issue: Tools not appearing

**Solutions**:
1. Verify server is enabled and trusted
2. Check that build succeeded
3. Restart your editor
4. For Cursor: Check if 40-tool limit exceeded

---

## Testing the Installation

### Quick Test

Create a test script to verify the MCP server works:

```bash
# Test that the server starts
node dist/mcp-server.js &
SERVER_PID=$!

# Wait a moment
sleep 2

# Kill the test server
kill $SERVER_PID

echo "✅ Server started successfully"
```

### Functional Test

Use the MCP server in your editor:

1. **Claude Code**:
   ```
   Ask Claude: "Use the websee MCP to analyze https://example.com"
   ```

2. **VS Code with Copilot**:
   - Open chat and ask about debugging a webpage
   - Copilot should automatically suggest WebSee tools

3. **Cursor**:
   - Start a chat
   - Ask: "Debug the frontend at https://example.com"
   - Verify WebSee tools are invoked

---

## Updating the Server

To update to the latest version:

```bash
# Pull latest changes (if using git)
git pull

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Restart your editor
```

---

## Uninstalling

### Claude Code

```bash
claude mcp remove websee
```

### VS Code

1. Delete `.vscode/mcp.json`
2. Restart VS Code

### Cursor

1. Delete `.cursor/mcp.json` (or global `~/.cursor/mcp.json`)
2. Restart Cursor

---

## Advanced Configuration

### Custom Browser Path

Set a custom browser executable:

```bash
# In .env
BROWSER=chromium
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome
```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# In .env
DEBUG=true
```

### Custom Timeouts

Adjust timeouts for slow networks:

```bash
# In .env
PAGE_TIMEOUT=30000  # 30 seconds
```

---

## Getting Help

- **Documentation**: See main README.md
- **Issues**: Report bugs at your repository's issue tracker
- **Logs**: Check MCP server logs in your editor's output panel
- **Community**: Join the MCP community discussions

---

## Security Considerations

1. **Trusted Code**: Only use this MCP server on projects you trust
2. **Environment Variables**: Never commit API keys in `.env` files
3. **Network Access**: The server navigates to URLs you provide - ensure they're safe
4. **Browser Automation**: Be aware that the server controls a browser instance

---

## Next Steps

After successful installation:

1. Read the main README.md for feature documentation
2. Explore the 41 available tools
3. Try debugging a real frontend application
4. Share the configuration with your team (commit `.mcp.json`, `.vscode/mcp.json`, `.cursor/mcp.json`)

Happy debugging with WebSee! 🚀
