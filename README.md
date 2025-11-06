# WebSee Source Intelligence - MCP Server

> Production-ready frontend debugging intelligence for Claude Code, Claude Desktop, and AI assistants

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.49+-green.svg)](https://playwright.dev/)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0+-purple.svg)](https://modelcontextprotocol.io)

## Overview

WebSee Source Intelligence is a Model Context Protocol (MCP) server that provides powerful frontend debugging capabilities to Claude Desktop and other AI assistants. It transforms browser automation debugging from cryptic minified errors to crystal-clear source code insights.

### Key Features

- **Source Map Resolution** - Resolve minified errors to original TypeScript/JavaScript source code
- **Component Inspection** - Inspect React/Vue/Angular component state, props, and hierarchy
- **Network Tracing** - Trace network requests to the components that triggered them
- **Bundle Analysis** - Analyze JavaScript bundle size and identify optimization opportunities
- **Performance Metrics** - Measure frontend performance and identify bottlenecks
- **Error Intelligence** - Get comprehensive error context with source code, components, and network activity

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/websee-source-intelligence.git
cd websee-source-intelligence-production

# Install dependencies and browsers
npm run setup
```

### MCP Server Setup

Choose your preferred AI development environment:

#### Option A: Claude Code (2025 Method)

1. **Build the MCP server**:
```bash
npm run build
```

2. **Add to Claude Code** using the CLI (recommended for STDIO transport):
```bash
cd /path/to/websee-source-intelligence-production
claude mcp add --transport stdio websee --env BROWSER=chromium --env HEADLESS=true -- node dist/mcp-server.js
```

**Alternative: Project-Level Configuration** (for team sharing):
Create `.mcp.json` in your project root:
```json
{
  "$schema": "https://anthropic.com/schemas/mcp-config.json",
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": ["dist/mcp-server.js"],
      "env": {
        "BROWSER": "${BROWSER:-chromium}",
        "HEADLESS": "${HEADLESS:-true}",
        "PROJECT_ROOT": "${PROJECT_ROOT:-.}"
      }
    }
  }
}
```

3. **Verify**:
```bash
claude mcp list
# or ask Claude: "What MCP tools do you have?"
```

**Configuration Scopes:**
- `--scope local` (default): Private to you
- `--scope project`: Team sharing via `.mcp.json`
- `--scope user`: Available across all projects

#### Option B: Cursor IDE (2025 Method)

1. **Build the MCP server**:
```bash
npm run build
```

2. **Configure Cursor**:

Create `.cursor/mcp.json` in your project root:
```json
{
  "$schema": "https://anthropic.com/schemas/mcp-config.json",
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": ["dist/mcp-server.js"],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "true",
        "PROJECT_ROOT": "."
      }
    }
  }
}
```

3. **Access Settings**: Open Cursor settings (`Ctrl+Shift+P` → "Cursor Settings") and check the MCP section

**Note**: Cursor supports up to 40 tools simultaneously. WebSee provides 36 tools optimized for frontend debugging.

#### Option C: Claude Desktop (Traditional)

1. **Build the MCP server**:
```bash
npm run build
```

2. **Configure Claude Desktop**:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": [
        "/absolute/path/to/websee-source-intelligence-production/dist/mcp-server.js"
      ],
      "env": {
        "BROWSER": "chromium",
        "HEADLESS": "true"
      }
    }
  }
}
```

3. **Restart Claude Desktop** and verify with the hammer icon

### Example Usage with Claude

Once configured, you can ask Claude:

```
"Debug the login form at https://example.com - check if there are any JavaScript errors"

"Analyze the performance of https://myapp.com/dashboard and identify slow API calls"

"Inspect the UserProfile component at https://app.com using selector #user-profile"

"Check why the bundle size is so large on https://myapp.com"
```

Claude will automatically use the WebSee MCP tools to investigate and provide detailed insights!

## What is WebSee Source Intelligence?

WebSee transforms browser automation debugging from cryptic minified errors to crystal-clear source code insights.

### Before WebSee:
```
Error: Cannot read property 'name' of undefined
  at t.render (app.min.js:1:28473)
```

### With WebSee:
```
Error: Cannot read property 'name' of undefined
  at UserProfile.render (src/components/UserProfile.tsx:87:15)
    > const displayName = user.profile.name; // user.profile is undefined

  Component: <UserProfile userId="123" />
  Network: GET /api/users/123 (404 Not Found)
  Source: Resolved via app.min.js.map
```

## 📊 Playwright vs WebSee: Capability Comparison

WebSee builds on top of Playwright to add source-level debugging intelligence. Here's how they compare:

| Capability | Playwright | WebSee Source Intelligence |
|------------|-----------|---------------------------|
| **Browser Automation** | ✅ Full support for Chrome, Firefox, Safari | ✅ Same browser support via Playwright |
| **Page Navigation** | ✅ Navigate, click, type, screenshot | ✅ All Playwright capabilities included |
| **Network Monitoring** | ✅ Capture requests/responses | ✅ **+ Trace requests to source code** |
| **Console Logs** | ✅ Capture console messages | ✅ **+ Link errors to original source files** |
| **Error Detection** | ✅ Detect page errors | ✅ **+ Resolve minified stack traces** |
| **Source Maps** | ❌ Not supported | ✅ **Automatic source map resolution** |
| **Component Inspection** | ❌ Only DOM elements | ✅ **React/Vue/Angular state & props** |
| **Bundle Analysis** | ❌ Not available | ✅ **Webpack/Vite bundle analysis** |
| **Request Attribution** | ❌ No source tracking | ✅ **See which component triggered each request** |
| **Error Context** | ❌ Basic stack trace | ✅ **Component state + network + source location** |
| **Performance Insights** | ⚠️ Basic metrics only | ✅ **Component-level performance tracking** |
| **Production Debugging** | ⚠️ Minified code only | ✅ **Full source code visibility** |
| **MCP Integration** | ❌ Not available | ✅ **Native Claude Desktop integration** |
| **AI Assistant Ready** | ❌ Requires manual scripting | ✅ **Natural language debugging with Claude** |

### Real-World Example Comparison

#### Debugging a Production Error

**With Playwright only:**
```javascript
// You can detect the error occurred
page.on('pageerror', error => {
  console.log(error.message);
  // "Cannot read property 'map' of undefined"
  console.log(error.stack);
  // "at t.render (main.7a8f9c2.js:1:48392)" ❌ Minified, unhelpful
});
```

**With WebSee:**
```javascript
// You get the full story
const context = await intelligence.getErrorIntelligence(error);
// {
//   originalStack: [
//     "at ProductList.render (src/components/ProductList.tsx:45:23)",
//     "  > {products.map(p => <ProductCard key={p.id} {...p} />)}"
//   ],
//   components: [
//     { name: "ProductList", props: { products: undefined, loading: false } },
//     { name: "Dashboard", props: { user: "john@example.com" } }
//   ],
//   networkActivity: [
//     { url: "/api/products", status: 500, timestamp: "2s ago" }
//   ],
//   buildInfo: { module: "ProductList", chunk: "main", size: 15234 }
// } ✅ Complete debugging context
```

### When to Use Each

**Use Playwright when:**
- Writing basic browser automation tests
- Taking screenshots or generating PDFs
- Testing visual regression
- Scraping web content
- Basic E2E testing

**Use WebSee when:**
- Debugging production errors in minified code
- Need to understand component state during errors
- Tracing which code triggered network requests
- Analyzing bundle size and performance
- Working with React/Vue/Angular applications
- Using Claude or AI assistants for debugging
- Need source-level insights in production

**Use Both together:**
WebSee extends Playwright, so you get **all of Playwright's capabilities** plus **source intelligence** on top. Perfect for comprehensive frontend debugging and AI-assisted development.

## Installation

### Prerequisites
- Node.js 18+
- Claude Desktop (for MCP server usage)
- Git

### Setup Steps

```bash
# Install dependencies
npm install

# Install browsers
npx playwright install chromium firefox webkit

# Build the project
npm run build

# Run tests to verify installation
npm test
```

## Available MCP Tools

WebSee provides six powerful MCP tools for frontend debugging:

1. **debug_frontend_issue** - Debug frontend issues by analyzing components, network, and errors
2. **analyze_performance** - Analyze frontend performance metrics (network, components, bundle, memory)
3. **inspect_component_state** - Inspect component state, props, and structure
4. **trace_network_requests** - Trace network requests and identify what triggered them
5. **analyze_bundle_size** - Analyze JavaScript bundle size and identify large modules
6. **resolve_minified_error** - Resolve minified error stack traces to original source code

For detailed parameter documentation, use `/mcp` in Claude Code or ask Claude to describe each tool

## Configuration

### Environment Variables

The MCP server supports the following environment variables:

- `BROWSER` - Browser to use (chromium, firefox, webkit). Default: chromium
- `HEADLESS` - Run browser in headless mode (true/false). Default: true

Example configuration:
```json
{
  "mcpServers": {
    "websee": {
      "command": "node",
      "args": ["/path/to/dist/mcp-server.js"],
      "env": {
        "BROWSER": "firefox",
        "HEADLESS": "false"
      }
    }
  }
}
```

### Browser Support

WebSee supports all Playwright browsers:
- **Chromium** - Chrome, Edge, Brave
- **Firefox** - Firefox stable and nightly
- **WebKit** - Safari on macOS

## Usage Examples

### Using as MCP Server with Claude Desktop

Simply ask Claude natural language questions:

**Example 1: Debug an Error**
```
Claude, can you debug why the login button is not working on https://example.com/login?
Check for any JavaScript errors and inspect the login form component.
```

**Example 2: Performance Analysis**
```
Analyze the performance of https://myapp.com/dashboard.
I want to know about slow network requests and large bundle sizes.
```

**Example 3: Component Inspection**
```
Inspect the component state for the user profile at https://app.com.
The component selector is #user-profile-card
```

### Programmatic Usage

You can also use WebSee as a library in your own code:

```typescript
import { SourceIntelligenceLayer } from '@your-org/websee-source-intelligence';
import { chromium } from 'playwright';

async function debugMyApp() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Initialize Source Intelligence
  const intelligence = new SourceIntelligenceLayer({
    enableSourceMaps: true,
    enableComponentTracking: true,
    enableNetworkTracing: true,
    enableBuildAnalysis: true
  });

  await intelligence.initialize(page);
  await page.goto('https://your-app.com');

  // Get component information
  const component = await intelligence.getComponentAtElement('#user-profile');
  console.log('Component:', component.name);
  console.log('Props:', component.props);
  console.log('State:', component.state);

  // Analyze network activity
  const traces = intelligence.getNetworkTraces();
  console.log('Network requests:', traces.length);

  await browser.close();
}
```

## 🐳 Docker Support

For complete portability, use our Docker image:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "test"]
```

Build and run:
```bash
docker build -t websee-intelligence .
docker run -it websee-intelligence
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/source-map-resolver.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📁 Project Structure

```
websee-source-intelligence/
├── src/                      # Source code
│   ├── index.ts             # Main entry point
│   ├── source-map-resolver.ts
│   ├── component-tracker.ts
│   ├── network-tracer.ts
│   └── build-artifact-manager.ts
├── tests/                    # Test files
├── docs/                     # Documentation
├── scripts/                  # Setup and utility scripts
│   └── setup.js             # One-click setup script
├── .vscode/                  # VS Code configuration
├── .claude/                  # Claude configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ API Reference

### SourceIntelligenceLayer

Main class that coordinates all intelligence agents.

#### Constructor Options

```typescript
interface SourceIntelligenceOptions {
  enableSourceMaps?: boolean;      // Default: true
  enableComponentTracking?: boolean; // Default: true
  enableNetworkTracing?: boolean;   // Default: true
  enableBuildAnalysis?: boolean;    // Default: true
  sourceMapCacheSize?: number;      // Default: 50
  projectRoot?: string;            // Default: process.cwd()
}
```

#### Methods

- `initialize(page: Page): Promise<void>` - Initialize with Playwright page
- `resolveSourceLocation(url, line, column): Promise<SourceLocation>` - Resolve minified location
- `getComponentAtElement(selector): Promise<ComponentInfo>` - Get component at element
- `getComponentTree(): Promise<ComponentTree[]>` - Get all components
- `getNetworkTraces(): NetworkTrace[]` - Get all network traces
- `getNetworkTracesForUrl(pattern): NetworkTrace[]` - Filter network traces
- `findBuildModule(filePath): BuildModule` - Find module in build
- `getErrorIntelligence(error): Promise<ErrorContext>` - Get comprehensive error context
- `destroy(): Promise<void>` - Cleanup resources

## 🤝 Integration Examples

### With Jest/Vitest

```typescript
import { test, expect } from 'vitest';
import { SourceIntelligenceLayer } from '@your-org/websee-source-intelligence';

test('user login flow', async () => {
  const intelligence = new SourceIntelligenceLayer();
  await intelligence.initialize(page);

  // Your test with source intelligence
});
```

### With Playwright Test

```typescript
import { test } from '@playwright/test';
import { SourceIntelligenceLayer } from '@your-org/websee-source-intelligence';

test.beforeEach(async ({ page }) => {
  const intelligence = new SourceIntelligenceLayer();
  await intelligence.initialize(page);
  page.intelligence = intelligence;
});
```

### With CI/CD

```yaml
# GitHub Actions example
- name: Run tests with Source Intelligence
  run: |
    npm run setup
    npm test
  env:
    CI: true
```

## 📊 Performance

WebSee is designed for minimal overhead:

- Source map resolution: <100ms per lookup
- Component tracking: <50ms per update
- Network tracing: <10ms per request
- Memory usage: <50MB typical
- Build analysis: One-time cost at startup

## Troubleshooting

### MCP Server Issues

**MCP server not appearing in Claude Desktop**
1. Verify the path in `claude_desktop_config.json` is absolute
2. Make sure you ran `npm run build` to compile TypeScript
3. Restart Claude Desktop completely
4. Check the MCP logs in Claude Desktop settings

**MCP tools not working**
```bash
# Test the MCP server directly
node dist/mcp-server.js

# You should see: "WebSee MCP Server started"
```

**Browser fails to launch**
```bash
# Install browsers with dependencies
npx playwright install --with-deps chromium firefox webkit

# Or specific browser
npx playwright install chromium
```

**Source maps not found**
- Ensure your application generates source maps (check webpack/vite config)
- Source maps must be accessible from the same origin or via CORS
- Check browser DevTools to verify source maps are loading

**Component tracking not working**
- React: Application must be in development mode for component inspection
- Vue: Requires Vue DevTools extension concepts
- Angular: Requires Angular development mode
- Ensure the selector targets an actual component root element

### Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your configuration with `claude mcp list` or `claude mcp get websee`
3. Open an issue on GitHub with:
   - Your MCP configuration
   - MCP server logs
   - Browser console errors
   - Steps to reproduce

## Documentation

### What You Can Do with WebSee
- **Debug production errors** - See original source code instead of minified JavaScript
- **Track components** - Inspect React/Vue/Angular component state and props in real-time
- **Trace network requests** - Identify which component triggered each API call
- **Analyze bundle sizes** - Find what's bloating your JavaScript bundle
- **Measure performance** - Identify slow network requests and rendering issues
- **Resolve errors** - Transform cryptic minified errors into readable stack traces

### External Resources
- **[Model Context Protocol Documentation](https://modelcontextprotocol.io)** - Official MCP specification
- **[Anthropic MCP Guide](https://docs.anthropic.com/en/docs/build-with-claude/mcp)** - Building MCP servers for Claude
- **[Playwright Documentation](https://playwright.dev)** - Browser automation framework
- **[Source Maps Specification](https://sourcemaps.info/spec.html)** - Understanding source maps

## Contributing

We welcome contributions! To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `npm test` to verify
5. Submit a pull request

Please ensure:
- All tests pass
- Code follows TypeScript best practices
- New tools include comprehensive tests
- Documentation is updated

## License

MIT - See [LICENSE](LICENSE) for details.

## Acknowledgments

Built with:
- **[Model Context Protocol](https://modelcontextprotocol.io)** - Anthropic's protocol for AI tool integration
- **[Playwright](https://playwright.dev)** - Browser automation framework
- **[Source Map](https://github.com/mozilla/source-map)** - Source map parsing library
- **[TypeScript](https://www.typescriptlang.org)** - Type-safe development

---

**Questions?** Open an issue or check our documentation.

**Ready to enhance your frontend debugging?** Install WebSee and connect it to Claude Desktop!