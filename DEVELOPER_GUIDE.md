# WebSee Developer Guide

> How to extend, customize, and contribute to WebSee Source Intelligence

This guide is for developers who want to extend WebSee with new tools, customize existing functionality, or contribute to the project.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setting Up Development Environment](#setting-up-development-environment)
- [Adding New MCP Tools](#adding-new-mcp-tools)
- [Extending Core Components](#extending-core-components)
- [Testing](#testing)
- [Contributing Guidelines](#contributing-guidelines)
- [Publishing](#publishing)

---

## Architecture Overview

### Project Structure

```
websee-source-intelligence-production/
├── src/
│   ├── index.ts                    # Main SourceIntelligenceLayer class
│   ├── mcp-server.ts               # MCP server implementation
│   ├── source-map-resolver.ts      # Source map resolution
│   ├── component-tracker.ts        # Component inspection
│   ├── network-tracer.ts           # Network request tracing
│   ├── build-artifact-manager.ts   # Bundle analysis
│   ├── browser-config.ts           # Browser configuration
│   └── cli.ts                      # Command-line interface
├── tests/                          # Test files
├── dist/                           # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

### Core Components

**SourceIntelligenceLayer** (`src/index.ts`)
- Main orchestrator that coordinates all intelligence agents
- Provides unified API for frontend debugging capabilities
- Manages lifecycle of browser automation and intelligence gathering

**MCP Server** (`src/mcp-server.ts`)
- Implements Model Context Protocol server
- Exposes tools to Claude Desktop and other AI assistants
- Handles tool requests and manages browser instances

**Source Map Resolver** (`src/source-map-resolver.ts`)
- Fetches and caches source maps
- Resolves minified locations to original source code
- Extracts source code snippets

**Component Tracker** (`src/component-tracker.ts`)
- Detects React/Vue/Angular components
- Inspects component state, props, and hierarchy
- Tracks component tree structure

**Network Tracer** (`src/network-tracer.ts`)
- Captures network requests with timing information
- Traces requests to source code using stack traces
- Filters and analyzes network patterns

**Build Artifact Manager** (`src/build-artifact-manager.ts`)
- Analyzes webpack/vite build outputs
- Tracks module sizes and dependencies
- Provides bundle optimization recommendations

### Data Flow

```
Claude Desktop
    ↓
MCP Server (stdio transport)
    ↓
Tool Handler (validates parameters)
    ↓
Browser Manager (creates Playwright page)
    ↓
SourceIntelligenceLayer (initializes agents)
    ↓
Intelligence Agents (collect data)
    ↓
Tool Response (JSON results)
    ↓
Claude Desktop
```

---

## Setting Up Development Environment

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/websee-source-intelligence.git
cd websee-source-intelligence-production
```

2. **Install dependencies**
```bash
npm install
```

3. **Install browsers**
```bash
npx playwright install chromium firefox webkit
```

4. **Build the project**
```bash
npm run build
```

5. **Run tests**
```bash
npm test
```

### Development Workflow

**Watch mode for TypeScript compilation:**
```bash
npm run build -- --watch
```

**Run MCP server in development:**
```bash
npm run mcp:dev
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Lint code:**
```bash
npm run lint
```

**Format code:**
```bash
npm run format
```

---

## Adding New MCP Tools

### Step 1: Define Tool Schema

First, define the input schema using Zod in `src/mcp-server.ts`:

```typescript
import { z } from "zod";

const MyNewToolSchema = z.object({
  url: z.string().url().describe("The URL to analyze"),
  customParam: z.string().optional().describe("Custom parameter description"),
  threshold: z.number().optional().default(100).describe("Threshold value"),
});
```

### Step 2: Implement Tool Function

Create the tool implementation function:

```typescript
async function myNewTool(params: z.infer<typeof MyNewToolSchema>) {
  const page = await browserManager.newPage();
  const intelligence = new SourceIntelligenceLayer();

  try {
    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: "networkidle" });

    // Your tool logic here
    const result = {
      url: params.url,
      timestamp: new Date().toISOString(),
      data: {
        // Your data here
      },
    };

    return result;
  } finally {
    await page.close();
  }
}
```

### Step 3: Register Tool in MCP Server

Add the tool to the tools list in the `ListToolsRequestSchema` handler:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing tools ...
    {
      name: "my_new_tool",
      description: "Clear, concise description of what your tool does",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to analyze"
          },
          customParam: {
            type: "string",
            description: "Custom parameter description"
          },
          threshold: {
            type: "number",
            description: "Threshold value"
          },
        },
        required: ["url"],
      },
    },
  ],
}));
```

### Step 4: Add Tool Handler

Add the handler in the `CallToolRequestSchema` handler:

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: any;

    switch (name) {
      // ... existing cases ...

      case "my_new_tool": {
        const params = MyNewToolSchema.parse(args);
        result = await myNewTool(params);
        break;
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    // Error handling...
  }
});
```

### Step 5: Add Tests

Create tests for your new tool in `tests/`:

```typescript
import { test, expect } from 'vitest';
import { myNewTool } from '../src/mcp-server';

test('myNewTool - basic functionality', async () => {
  const result = await myNewTool({
    url: 'https://example.com',
    customParam: 'test',
  });

  expect(result).toBeDefined();
  expect(result.url).toBe('https://example.com');
  expect(result.data).toBeDefined();
});

test('myNewTool - error handling', async () => {
  await expect(
    myNewTool({ url: 'invalid-url' })
  ).rejects.toThrow();
});
```

### Step 6: Document Your Tool

Add documentation to `MCP_TOOLS.md`:

```markdown
## my_new_tool

Brief description of what the tool does.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The URL to analyze |
| `customParam` | string | No | Custom parameter description |

### Returns

Description of return value structure.

### Example Usage

Examples of how to use the tool.
```

### Example: Adding an Accessibility Checker Tool

Here's a complete example of adding a new tool to check accessibility:

```typescript
// 1. Schema
const CheckAccessibilitySchema = z.object({
  url: z.string().url().describe("The URL to check for accessibility issues"),
  wcagLevel: z.enum(["A", "AA", "AAA"]).optional().default("AA")
    .describe("WCAG compliance level"),
});

// 2. Implementation
async function checkAccessibility(params: z.infer<typeof CheckAccessibilitySchema>) {
  const page = await browserManager.newPage();
  const intelligence = new SourceIntelligenceLayer();

  try {
    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: "networkidle" });

    // Check for common accessibility issues
    const issues = await page.evaluate(() => {
      const problems: any[] = [];

      // Check for images without alt text
      document.querySelectorAll('img:not([alt])').forEach(img => {
        problems.push({
          type: 'missing_alt',
          element: img.tagName,
          selector: img.id ? `#${img.id}` : 'img',
        });
      });

      // Check for form inputs without labels
      document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`);
        if (!hasLabel) {
          problems.push({
            type: 'missing_label',
            element: input.tagName,
            selector: input.id ? `#${input.id}` : 'input',
          });
        }
      });

      return problems;
    });

    return {
      url: params.url,
      wcagLevel: params.wcagLevel,
      timestamp: new Date().toISOString(),
      issues: issues,
      issueCount: issues.length,
      passed: issues.length === 0,
    };
  } finally {
    await page.close();
  }
}

// 3. Register in tools list
{
  name: "check_accessibility",
  description: "Check webpage for common accessibility issues",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The URL to check" },
      wcagLevel: {
        type: "string",
        enum: ["A", "AA", "AAA"],
        description: "WCAG compliance level"
      },
    },
    required: ["url"],
  },
}

// 4. Add handler
case "check_accessibility": {
  const params = CheckAccessibilitySchema.parse(args);
  result = await checkAccessibility(params);
  break;
}
```

---

## Extending Core Components

### Adding New Intelligence Agents

To add a new intelligence agent (e.g., SEO analyzer, security checker):

1. **Create new file** in `src/` (e.g., `src/seo-analyzer.ts`)

```typescript
import { Page } from 'playwright';

export class SEOAnalyzer {
  private page: Page | null = null;

  async initialize(page: Page): Promise<void> {
    this.page = page;
    // Initialization logic
  }

  async analyzeSEO(): Promise<SEOReport> {
    if (!this.page) throw new Error('SEOAnalyzer not initialized');

    // Analysis logic
    const title = await this.page.title();
    const metaDescription = await this.page.$eval(
      'meta[name="description"]',
      (el) => el.getAttribute('content')
    ).catch(() => null);

    return {
      title: {
        value: title,
        length: title.length,
        optimal: title.length >= 30 && title.length <= 60,
      },
      metaDescription: {
        value: metaDescription,
        length: metaDescription?.length || 0,
        optimal: metaDescription ?
          metaDescription.length >= 120 && metaDescription.length <= 160 :
          false,
      },
    };
  }

  async destroy(): Promise<void> {
    this.page = null;
  }
}

interface SEOReport {
  title: {
    value: string;
    length: number;
    optimal: boolean;
  };
  metaDescription: {
    value: string | null;
    length: number;
    optimal: boolean;
  };
}
```

2. **Integrate with SourceIntelligenceLayer** in `src/index.ts`

```typescript
import { SEOAnalyzer } from './seo-analyzer';

export class SourceIntelligenceLayer {
  private seoAnalyzer: SEOAnalyzer | null = null;

  constructor(options: SourceIntelligenceOptions = {}) {
    // ... existing code ...
    this.options = {
      // ... existing options ...
      enableSEOAnalysis: options.enableSEOAnalysis ?? true,
    };
  }

  async initialize(page: Page): Promise<void> {
    // ... existing initialization ...

    if (this.options.enableSEOAnalysis) {
      this.seoAnalyzer = new SEOAnalyzer();
      await this.seoAnalyzer.initialize(page);
      console.log("✅ SEO Analyzer initialized");
    }
  }

  async analyzeSEO(): Promise<SEOReport> {
    if (!this.seoAnalyzer) throw new Error('SEO analysis not enabled');
    return this.seoAnalyzer.analyzeSEO();
  }

  async destroy(): Promise<void> {
    // ... existing cleanup ...
    if (this.seoAnalyzer) {
      await this.seoAnalyzer.destroy();
    }
  }
}
```

### Customizing Existing Components

**Example: Extending Network Tracer**

```typescript
// In src/network-tracer.ts

export class NetworkTracer {
  // ... existing code ...

  /**
   * Get requests by status code
   */
  getRequestsByStatus(statusCode: number): NetworkTrace[] {
    return this.traces.filter(t => t.status === statusCode);
  }

  /**
   * Get failed requests (4xx and 5xx)
   */
  getFailedRequests(): NetworkTrace[] {
    return this.traces.filter(t => t.status >= 400);
  }

  /**
   * Get slowest requests
   */
  getSlowestRequests(limit: number = 10): NetworkTrace[] {
    return [...this.traces]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }
}
```

---

## Testing

### Testing Philosophy

- **Unit tests** - Test individual functions and classes
- **Integration tests** - Test tools end-to-end with real browsers
- **Mock sparingly** - Use real browsers when possible for accuracy

### Writing Tests

WebSee uses Vitest for testing. Tests are in the `tests/` directory.

**Example unit test:**

```typescript
import { test, expect } from 'vitest';
import { SourceMapResolver } from '../src/source-map-resolver';

test('SourceMapResolver - basic resolution', async () => {
  const resolver = new SourceMapResolver();

  // Mock page or use actual test page
  const location = await resolver.resolveLocation(
    'https://example.com/app.js',
    1,
    2847
  );

  expect(location).toBeDefined();
  expect(location?.file).toContain('src/');
});
```

**Example integration test:**

```typescript
import { test, expect } from 'vitest';
import { chromium } from 'playwright';
import { SourceIntelligenceLayer } from '../src/index';

test('Full debugging workflow', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const intelligence = new SourceIntelligenceLayer();
  await intelligence.initialize(page);

  await page.goto('https://example.com');

  // Test component tracking
  const component = await intelligence.getComponentAtElement('#app');
  expect(component).toBeDefined();

  // Test network tracing
  const traces = intelligence.getNetworkTraces();
  expect(traces.length).toBeGreaterThan(0);

  await browser.close();
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- source-map-resolver.test.ts

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Best Practices

1. **Use test fixtures** - Create reusable test HTML pages
2. **Clean up resources** - Always close browsers in `finally` blocks
3. **Test error cases** - Don't just test happy paths
4. **Mock external dependencies** - Mock external APIs when appropriate
5. **Use descriptive names** - Test names should describe what they test

---

## Contributing Guidelines

### Code Style

WebSee follows standard TypeScript best practices:

- **Use TypeScript** - No plain JavaScript in `src/`
- **Strict typing** - Avoid `any` when possible
- **ESLint** - Follow ESLint rules (`npm run lint`)
- **Prettier** - Format code with Prettier (`npm run format`)
- **Comments** - Add JSDoc comments for public APIs

**Example of good code style:**

```typescript
/**
 * Resolves a minified location to original source code
 *
 * @param url - URL of the minified file
 * @param line - Line number in minified file
 * @param column - Column number in minified file
 * @returns Resolved source location or null if not found
 */
async resolveLocation(
  url: string,
  line: number,
  column: number
): Promise<SourceLocation | null> {
  // Implementation...
}
```

### Git Workflow

1. **Fork the repository**
2. **Create a feature branch** - `git checkout -b feature/my-feature`
3. **Make your changes** - Follow code style guidelines
4. **Add tests** - All new code should have tests
5. **Run tests** - Ensure all tests pass (`npm test`)
6. **Commit with clear messages** - Use conventional commits
7. **Push to your fork** - `git push origin feature/my-feature`
8. **Open a Pull Request** - Describe your changes clearly

### Commit Message Format

Use conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `test` - Adding tests
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `chore` - Maintenance tasks

**Examples:**
```
feat(mcp): add accessibility checker tool

Add new MCP tool to check WCAG compliance and identify
common accessibility issues on web pages.

Closes #123
```

```
fix(network-tracer): handle CORS errors gracefully

Network tracer was crashing when encountering CORS errors.
Now it catches these errors and logs them appropriately.
```

### Pull Request Guidelines

**Before submitting:**
- [ ] All tests pass (`npm test`)
- [ ] Code is formatted (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] CHANGELOG is updated (for significant changes)

**PR Description should include:**
- What does this PR do?
- Why is this change needed?
- How was it tested?
- Any breaking changes?
- Screenshots (if UI changes)

### Code Review Process

1. **Automated checks** - CI/CD runs tests and linting
2. **Peer review** - At least one maintainer reviews
3. **Address feedback** - Make requested changes
4. **Approval** - Maintainer approves PR
5. **Merge** - Maintainer merges to main

---

## Publishing

### Version Management

WebSee uses semantic versioning (semver):

- **Major** (1.0.0) - Breaking changes
- **Minor** (0.1.0) - New features, backward compatible
- **Patch** (0.0.1) - Bug fixes

### Release Process

1. **Update version** in `package.json`
```bash
npm version patch  # or minor, or major
```

2. **Update CHANGELOG.md**
```markdown
## [1.0.1] - 2025-10-26

### Added
- New accessibility checker tool

### Fixed
- Network tracer CORS error handling

### Changed
- Improved performance of source map resolution
```

3. **Build the project**
```bash
npm run build
```

4. **Run tests**
```bash
npm test
```

5. **Commit and tag**
```bash
git add .
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

6. **Publish to npm** (if public package)
```bash
npm publish
```

### Documentation Updates

When releasing, ensure:
- [ ] README.md is up to date
- [ ] MCP_TOOLS.md reflects all tools
- [ ] DEVELOPER_GUIDE.md is current
- [ ] API documentation is accurate
- [ ] Examples work with new version

---

## Advanced Topics

### Custom Browser Configurations

Create custom browser configs in `src/browser-config.ts`:

```typescript
export const CUSTOM_BROWSER_CONFIG = {
  chromium: {
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
    ],
    headless: process.env.HEADLESS !== 'false',
  },
  firefox: {
    args: [],
    headless: process.env.HEADLESS !== 'false',
  },
};
```

### Performance Optimization

**Caching strategies:**

```typescript
class PerformantSourceMapResolver {
  private cache = new Map<string, SourceMap>();
  private maxCacheSize = 100;

  async resolveLocation(url: string, line: number, column: number) {
    // Check cache first
    if (this.cache.has(url)) {
      return this.resolveFromCache(url, line, column);
    }

    // Fetch and cache
    const sourceMap = await this.fetchSourceMap(url);

    // Implement LRU cache eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(url, sourceMap);
    return this.resolveFromCache(url, line, column);
  }
}
```

### Error Handling Patterns

```typescript
class RobustNetworkTracer {
  async initialize(page: Page): Promise<void> {
    try {
      await this.setupListeners(page);
    } catch (error) {
      console.error('Failed to initialize network tracer:', error);
      // Gracefully degrade - don't crash the whole system
      this.enabled = false;
    }
  }

  private async handleRequest(request: Request): Promise<void> {
    try {
      // Handle request
    } catch (error) {
      // Log but don't throw - we don't want one bad request to break everything
      console.warn('Error handling request:', error);
    }
  }
}
```

---

## Resources

### Internal Documentation
- [README.md](./README.md) - Getting started
- [MCP_TOOLS.md](./MCP_TOOLS.md) - Tool reference
- [FRONTEND_DEVELOPMENT_GUIDE.md](./FRONTEND_DEVELOPMENT_GUIDE.md) - Frontend usage

### External Resources
- **[Model Context Protocol](https://modelcontextprotocol.io)** - MCP specification
- **[Anthropic MCP SDK](https://github.com/anthropics/mcp)** - SDK documentation
- **[Playwright API](https://playwright.dev/docs/api/class-playwright)** - Playwright reference
- **[Source Map Specification](https://sourcemaps.info/spec.html)** - Source map format
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript guide

### Community
- GitHub Discussions - Ask questions and share ideas
- GitHub Issues - Report bugs and request features
- Discord/Slack - Real-time chat with maintainers

---

## FAQ

**Q: How do I debug the MCP server?**
```bash
# Run server directly with debug logging
DEBUG=* node dist/mcp-server.js
```

**Q: Can I use WebSee in a CI/CD pipeline?**

Yes! Set `HEADLESS=true` and ensure browsers are installed in your CI environment.

**Q: How do I add support for a new framework (e.g., Svelte)?**

Extend `ComponentTracker` to detect and inspect Svelte components. Look at existing React/Vue detection code as examples.

**Q: Can I use WebSee without Claude Desktop?**

Yes! You can use WebSee as a library directly in your code. See the programmatic usage examples in the README.

**Q: How do I contribute a new tool?**

Follow the "Adding New MCP Tools" section, write tests, update documentation, and open a PR!

---

**Ready to contribute?** Fork the repo, make your changes, and open a pull request. We welcome all contributions!
