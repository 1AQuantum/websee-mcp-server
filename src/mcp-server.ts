#!/usr/bin/env node
/**
 * WebSee MCP Server - Frontend Debugging Intelligence
 *
 * This MCP server provides powerful debugging and analysis tools for frontend applications,
 * including source map resolution, component inspection, network tracing, and bundle analysis.
 *
 * @module websee-mcp-server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { chromium, firefox, webkit, Browser, Page } from 'playwright';
import { SourceIntelligenceLayer } from './index.js';

// Import granular intelligence tools
import {
  COMPONENT_INTELLIGENCE_TOOLS,
  componentTree,
  componentGetProps,
  componentGetState,
  componentFindByName,
  componentGetSource,
  componentTrackRenders,
  componentGetContext,
  componentGetHooks,
} from './tools/component-intelligence-tools.js';

import {
  BUILD_INTELLIGENCE_TOOLS,
  buildGetManifest,
  buildGetChunks,
  buildFindModule,
  buildGetDependencies,
  buildAnalyzeSize,
} from './tools/build-intelligence-tools.js';
// Note: Performance intelligence tools removed - see FUTURE_DEVELOPMENT.md for implementation plan
import {
  default as SourceIntelligenceTools,
  sourceMapResolve,
  sourceMapGetContent,
  sourceTraceStack,
  sourceFindDefinition,
  sourceGetSymbols,
  sourceMapBundle,
  sourceCoverageMap
} from './tools/source-intelligence-tools.js';

import {
  errorIntelligenceTools,
  errorResolveStack,
  errorGetContext,
  errorTraceCause,
  errorGetSimilar,
} from './tools/error-intelligence-tools.js';

import {
  networkIntelligenceTools,
  networkGetRequests,
  networkGetByUrl,
  networkGetTiming,
  networkTraceInitiator,
  networkGetHeaders,
  networkGetBody,
} from './tools/network-intelligence-tools.js';

// Tool schemas using Zod for validation
const DebugFrontendIssueSchema = z.object({
  url: z.string().url().describe('The URL of the page experiencing issues'),
  selector: z.string().optional().describe('CSS selector to focus on (optional)'),
  errorMessage: z.string().optional().describe('Error message to investigate (optional)'),
  screenshot: z.boolean().optional().default(false).describe('Capture screenshot of the issue'),
});

const AnalyzePerformanceSchema = z.object({
  url: z.string().url().describe('The URL to analyze for performance'),
  interactions: z
    .array(
      z.object({
        action: z.enum(['click', 'type', 'scroll', 'navigate']),
        selector: z.string().optional(),
        value: z.string().optional(),
      })
    )
    .optional()
    .describe('User interactions to perform before analysis'),
  metrics: z
    .array(z.enum(['network', 'components', 'bundle', 'memory']))
    .optional()
    .default(['network', 'components'])
    .describe('Metrics to analyze'),
});

const InspectComponentStateSchema = z.object({
  url: z.string().url().describe('The page URL'),
  selector: z.string().describe('CSS selector for the component'),
  waitForSelector: z.boolean().optional().default(true).describe('Wait for element to appear'),
  includeChildren: z.boolean().optional().default(false).describe('Include child components'),
});

const TraceNetworkRequestsSchema = z.object({
  url: z.string().url().describe('The page URL'),
  pattern: z.string().optional().describe("URL pattern to filter (e.g., '/api/*')"),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL']).optional().default('ALL'),
  waitTime: z.number().optional().default(3000).describe('Time to wait for requests (ms)'),
});

const AnalyzeBundleSchema = z.object({
  url: z.string().url().describe('The application URL'),
  moduleName: z.string().optional().describe('Specific module to search for'),
  threshold: z.number().optional().default(50).describe('Size threshold in KB to flag modules'),
});

const ResolveMinifiedErrorSchema = z.object({
  url: z.string().url().describe('The page URL'),
  errorStack: z.string().describe('The minified error stack trace'),
  triggerError: z.boolean().optional().default(false).describe('Try to trigger the error'),
});

// Server configuration
const SERVER_INFO = {
  name: 'websee-mcp',
  version: '1.0.0',
  description: 'Frontend debugging intelligence for browser automation',
};

// Browser management
class BrowserManager {
  private browser: Browser | null = null;

  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    const browserEnv = process.env.BROWSER?.toLowerCase();

    switch (browserEnv) {
      case 'firefox':
        this.browser = await firefox.launch({ headless: process.env.HEADLESS !== 'false' });
        break;
      case 'webkit':
      case 'safari':
        this.browser = await webkit.launch({ headless: process.env.HEADLESS !== 'false' });
        break;
      default:
        this.browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
    }

    return this.browser;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async newPage(): Promise<Page> {
    const browser = await this.launch();
    return browser.newPage();
  }
}

// Create server instance
const server = new Server(SERVER_INFO, {
  capabilities: {
    tools: {},
  },
});

// Browser manager instance
const browserManager = new BrowserManager();

// Tool implementations
async function debugFrontendIssue(params: z.infer<typeof DebugFrontendIssueSchema>) {
  const page = await browserManager.newPage();
  const intelligence = new SourceIntelligenceLayer();

  try {
    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const result: any = {
      url: params.url,
      timestamp: new Date().toISOString(),
      issues: [],
      components: [],
      network: [],
      console: [],
    };

    // Capture console messages
    const consoleLogs: any[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location(),
        });
      }
    });

    // Capture page errors
    const pageErrors: Error[] = [];
    page.on('pageerror', error => pageErrors.push(error));

    // Wait a bit for any initial errors
    await page.waitForTimeout(2000);

    // Analyze specific selector if provided
    if (params.selector) {
      try {
        const component = await intelligence.getComponentAtElement(params.selector);
        result.components.push({
          selector: params.selector,
          name: component.name,
          framework: component.framework,
          props: component.props,
          state: component.state,
          parents: component.parents,
        });
      } catch (error) {
        result.issues.push({
          type: 'selector_not_found',
          message: `Could not find element with selector: ${params.selector}`,
        });
      }
    }

    // Analyze specific error if provided
    if (params.errorMessage) {
      const errorMsg = params.errorMessage;
      const matchingError = pageErrors.find(e => e.message.includes(errorMsg));
      if (matchingError) {
        const context = await intelligence.getErrorIntelligence(matchingError);
        result.issues.push({
          type: 'error_traced',
          originalError: matchingError.message,
          sourceLocation: context.originalStack?.[0],
          components: context.components,
          networkContext: context.networkActivity?.slice(-5),
        });
      }
    }

    // Get recent network activity
    const networkTraces = intelligence.getNetworkTraces().slice(-10);
    result.network = networkTraces.map(trace => ({
      url: trace.url,
      method: trace.method,
      status: trace.status,
      duration: trace.duration,
      triggeredBy: trace.stackTrace?.[0],
    }));

    // Console logs
    result.console = consoleLogs;

    // Capture screenshot if requested
    if (params.screenshot) {
      const screenshotPath = `debug-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshot = screenshotPath;
    }

    return result;
  } finally {
    await page.close();
  }
}

async function analyzePerformance(params: z.infer<typeof AnalyzePerformanceSchema>) {
  const page = await browserManager.newPage();
  const intelligence = new SourceIntelligenceLayer();

  try {
    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    // Perform interactions if specified
    if (params.interactions) {
      for (const interaction of params.interactions) {
        switch (interaction.action) {
          case 'click':
            if (interaction.selector) {
              await page.click(interaction.selector);
            }
            break;
          case 'type':
            if (interaction.selector && interaction.value) {
              await page.type(interaction.selector, interaction.value);
            }
            break;
          case 'scroll':
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            break;
          case 'navigate':
            if (interaction.value) {
              await page.goto(interaction.value);
            }
            break;
        }
        await page.waitForTimeout(500);
      }
    }

    const analysis: any = {
      url: params.url,
      timestamp: new Date().toISOString(),
      metrics: {},
    };

    // Network analysis
    if (params.metrics.includes('network')) {
      const traces = intelligence.getNetworkTraces();
      const slowRequests = traces.filter(t => t.duration > 1000);

      analysis.metrics.network = {
        totalRequests: traces.length,
        slowRequests: slowRequests.length,
        averageDuration: traces.reduce((sum, t) => sum + t.duration, 0) / traces.length,
        slowestRequests: slowRequests.slice(0, 5).map(t => ({
          url: t.url,
          duration: t.duration,
          triggeredBy: t.stackTrace?.[0],
        })),
      };
    }

    // Component analysis
    if (params.metrics.includes('components')) {
      const components = await intelligence.getComponentTree();

      analysis.metrics.components = {
        totalComponents: components.length,
        byFramework: components.reduce((acc: any, c) => {
          acc[c.framework] = (acc[c.framework] || 0) + 1;
          return acc;
        }, {}),
        deepestNesting: Math.max(...components.map(c => c.depth || 0)),
      };
    }

    // Bundle analysis
    if (params.metrics.includes('bundle')) {
      const scripts = await page.$$eval('script[src]', scripts =>
        scripts.map((s: any) => ({ src: s.src, size: s.text?.length || 0 }))
      );

      analysis.metrics.bundle = {
        totalScripts: scripts.length,
        totalSize: scripts.reduce((sum: number, s: any) => sum + s.size, 0),
        largestScripts: scripts.sort((a: any, b: any) => b.size - a.size).slice(0, 5),
      };
    }

    // Memory analysis
    if (params.metrics.includes('memory')) {
      const memoryInfo = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });

      if (memoryInfo) {
        analysis.metrics.memory = {
          usedJSHeapSize: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + ' MB',
          totalJSHeapSize: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + ' MB',
          limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024) + ' MB',
        };
      }
    }

    return analysis;
  } finally {
    await page.close();
  }
}

async function inspectComponentState(params: z.infer<typeof InspectComponentStateSchema>) {
  const page = await browserManager.newPage();
  const intelligence = new SourceIntelligenceLayer();

  try {
    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    if (params.waitForSelector) {
      await page.waitForSelector(params.selector, { timeout: 10000 });
    }

    const component = await intelligence.getComponentAtElement(params.selector);

    // Handle case where component is not found
    if (!component) {
      return {
        selector: params.selector,
        found: false,
        error: 'Component not found',
        message: `No component detected at selector: ${params.selector}. The element may not be a framework component, or it may not have loaded yet.`,
      };
    }

    const inspection: any = {
      selector: params.selector,
      found: true,
      component: {
        name: component.name,
        framework: component.framework,
        props: component.props,
        state: component.state,
        source: component.source,
        parents: component.parents,
      },
    };

    if (params.includeChildren && component.children) {
      inspection.children = component.children.map((child: any) => ({
        name: child.name,
        props: child.props,
        state: child.state,
      }));
    }

    return inspection;
  } finally {
    await page.close();
  }
}

async function traceNetworkRequests(params: z.infer<typeof TraceNetworkRequestsSchema>) {
  const page = await browserManager.newPage();
  const intelligence = new SourceIntelligenceLayer();

  try {
    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    // Wait for additional requests
    await page.waitForTimeout(params.waitTime);

    let traces = params.pattern
      ? intelligence.getNetworkTracesForUrl(params.pattern)
      : intelligence.getNetworkTraces();

    // Filter by method if specified
    if (params.method !== 'ALL') {
      traces = traces.filter(t => t.method === params.method);
    }

    return {
      url: params.url,
      pattern: params.pattern,
      method: params.method,
      totalRequests: traces.length,
      requests: traces.map(trace => ({
        url: trace.url,
        method: trace.method,
        status: trace.status,
        duration: trace.duration,
        size: trace.responseSize,
        triggeredBy: trace.stackTrace?.[0],
        timestamp: trace.timestamp,
      })),
    };
  } finally {
    await page.close();
  }
}

async function analyzeBundleSize(params: z.infer<typeof AnalyzeBundleSchema>) {
  const page = await browserManager.newPage();
  const intelligence = new SourceIntelligenceLayer();

  try {
    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const scripts = await page.$$eval('script[src]', scripts =>
      scripts.map((s: any) => ({
        src: s.src,
        size: s.innerHTML?.length || 0,
        async: s.async,
        defer: s.defer,
      }))
    );

    const stylesheets = await page.$$eval("link[rel='stylesheet']", links =>
      links.map((l: any) => ({
        href: l.href,
        media: l.media || 'all',
      }))
    );

    const analysis: any = {
      url: params.url,
      scripts: {
        total: scripts.length,
        totalSize: scripts.reduce((sum: number, s: any) => sum + s.size, 0),
        files: scripts,
      },
      stylesheets: {
        total: stylesheets.length,
        files: stylesheets,
      },
      modules: [],
      recommendations: [],
    };

    // Check for specific module if requested
    if (params.moduleName) {
      const module = intelligence.findBuildModule(params.moduleName);
      if (module) {
        analysis.modules.push({
          name: module.name,
          size: module.size,
          sizeKB: (module.size / 1024).toFixed(2) + ' KB',
          chunks: module.chunks,
          dependencies: module.dependencies,
        });

        if (module.size > params.threshold * 1024) {
          analysis.recommendations.push(
            `Module '${module.name}' is ${(module.size / 1024).toFixed(2)} KB, ` +
              `exceeding threshold of ${params.threshold} KB. Consider code splitting or lazy loading.`
          );
        }
      } else {
        analysis.modules.push({
          name: params.moduleName,
          found: false,
          message: `Module '${params.moduleName}' not found in bundle`,
        });
      }
    }

    // General recommendations
    const largeScripts = scripts.filter((s: any) => s.size > params.threshold * 1024);
    if (largeScripts.length > 0) {
      analysis.recommendations.push(
        `Found ${largeScripts.length} script(s) larger than ${params.threshold} KB. ` +
          `Consider code splitting for better performance.`
      );
    }

    return analysis;
  } finally {
    await page.close();
  }
}

async function resolveMinifiedError(params: z.infer<typeof ResolveMinifiedErrorSchema>) {
  const page = await browserManager.newPage();
  const intelligence = new SourceIntelligenceLayer();

  try {
    await intelligence.initialize(page);

    // Capture any errors that occur
    const errors: Error[] = [];
    page.on('pageerror', error => errors.push(error));

    await page.goto(params.url, { waitUntil: 'networkidle' });

    // Try to trigger the error if requested
    if (params.triggerError) {
      await page.waitForTimeout(2000);

      // Check if we captured any matching errors
      const matchingError = errors.find(e => e.stack?.includes(params.errorStack.split('\n')[0]));

      if (matchingError) {
        const context = await intelligence.getErrorIntelligence(matchingError);
        return {
          resolved: true,
          original: params.errorStack,
          sourceMap: context.originalStack,
          components: context.components,
          networkContext: context.networkActivity?.slice(-5),
          buildInfo: context.buildInfo,
        };
      }
    }

    // Try to resolve the stack trace directly
    const stackLines = params.errorStack.split('\n');
    const resolved: string[] = [];

    for (const line of stackLines) {
      // Extract file, line, column from minified stack
      const match = line.match(/at\s+.*?\s+\((.*?):(\d+):(\d+)\)/);
      if (match) {
        const [, file, line, column] = match;
        const sourceLocation = await intelligence.resolveSourceLocation(
          file,
          parseInt(line),
          parseInt(column)
        );

        if (sourceLocation) {
          resolved.push(
            `at ${sourceLocation.file}:${sourceLocation.line}:${sourceLocation.column}`
          );
        } else {
          resolved.push(line);
        }
      } else {
        resolved.push(line);
      }
    }

    return {
      resolved: resolved.length > 0,
      original: params.errorStack,
      sourceMap: resolved,
      message: 'Stack trace resolved using source maps',
    };
  } finally {
    await page.close();
  }
}

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Workflow layer tools (6 high-level tools)
  const workflowTools = [
    {
      name: 'debug_frontend_issue',
      description: 'Debug frontend issues by analyzing components, network, and errors',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL of the page experiencing issues' },
          selector: { type: 'string', description: 'CSS selector to focus on (optional)' },
          errorMessage: { type: 'string', description: 'Error message to investigate (optional)' },
          screenshot: { type: 'boolean', description: 'Capture screenshot of the issue' },
        },
        required: ['url'],
      },
    },
    {
      name: 'analyze_performance',
      description:
        'Analyze frontend performance including network, components, bundle size, and memory',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to analyze for performance' },
          interactions: {
            type: 'array',
            description: 'User interactions to perform before analysis',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string', enum: ['click', 'type', 'scroll', 'navigate'] },
                selector: { type: 'string' },
                value: { type: 'string' },
              },
            },
          },
          metrics: {
            type: 'array',
            description: 'Metrics to analyze',
            items: { type: 'string', enum: ['network', 'components', 'bundle', 'memory'] },
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'inspect_component_state',
      description: 'Inspect the state, props, and structure of a specific component',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The page URL' },
          selector: { type: 'string', description: 'CSS selector for the component' },
          waitForSelector: { type: 'boolean', description: 'Wait for element to appear' },
          includeChildren: { type: 'boolean', description: 'Include child components' },
        },
        required: ['url', 'selector'],
      },
    },
    {
      name: 'trace_network_requests',
      description: 'Trace network requests and identify what triggered them',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The page URL' },
          pattern: { type: 'string', description: "URL pattern to filter (e.g., '/api/*')" },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL'],
            description: 'HTTP method to filter by',
          },
          waitTime: { type: 'number', description: 'Time to wait for requests (ms)' },
        },
        required: ['url'],
      },
    },
    {
      name: 'analyze_bundle_size',
      description: 'Analyze JavaScript bundle size and identify large modules',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The application URL' },
          moduleName: { type: 'string', description: 'Specific module to search for' },
          threshold: { type: 'number', description: 'Size threshold in KB to flag modules' },
        },
        required: ['url'],
      },
    },
    {
      name: 'resolve_minified_error',
      description: 'Resolve minified error stack traces to original source code',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The page URL' },
          errorStack: { type: 'string', description: 'The minified error stack trace' },
          triggerError: { type: 'boolean', description: 'Try to trigger the error' },
        },
        required: ['url', 'errorStack'],
      },
    },
  ];

  // Granular layer tools (30 specialized tools)
  const granularTools = [
    // Source Intelligence Tools (7 tools)
    ...(Array.isArray(SourceIntelligenceTools) ? SourceIntelligenceTools : []),

    // Component Intelligence Tools (8 tools)
    ...COMPONENT_INTELLIGENCE_TOOLS,

    // Network Intelligence Tools (6 tools)
    ...Object.values(networkIntelligenceTools),

    // Build Intelligence Tools (5 tools)
    ...BUILD_INTELLIGENCE_TOOLS,

    // Performance Intelligence Tools - REMOVED
    // See FUTURE_DEVELOPMENT.md for implementation plan

    // Error Intelligence Tools (4 tools)
    ...Object.values(errorIntelligenceTools),
  ];

  // Return all 36 tools organized by layer (6 workflow + 30 granular)
  return {
    tools: [...workflowTools, ...granularTools],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    let result: any;
    const page = await browserManager.newPage();
    const intelligence = new SourceIntelligenceLayer();

    try {
      // Initialize intelligence layer for granular tools
      await intelligence.initialize(page);

      switch (name) {
        // ============================================================
        // WORKFLOW LAYER (6 tools)
        // ============================================================
        case 'debug_frontend_issue': {
          const params = DebugFrontendIssueSchema.parse(args);
          result = await debugFrontendIssue(params);
          break;
        }

        case 'analyze_performance': {
          const params = AnalyzePerformanceSchema.parse(args);
          result = await analyzePerformance(params);
          break;
        }

        case 'inspect_component_state': {
          const params = InspectComponentStateSchema.parse(args);
          result = await inspectComponentState(params);
          break;
        }

        case 'trace_network_requests': {
          const params = TraceNetworkRequestsSchema.parse(args);
          result = await traceNetworkRequests(params);
          break;
        }

        case 'analyze_bundle_size': {
          const params = AnalyzeBundleSchema.parse(args);
          result = await analyzeBundleSize(params);
          break;
        }

        case 'resolve_minified_error': {
          const params = ResolveMinifiedErrorSchema.parse(args);
          result = await resolveMinifiedError(params);
          break;
        }

        // ============================================================
        // COMPONENT INTELLIGENCE TOOLS (8 tools)
        // ============================================================
        case 'component_tree': {
          result = await componentTree(page, args as any);
          break;
        }

        case 'component_get_props': {
          result = await componentGetProps(page, args as any);
          break;
        }

        case 'component_get_state': {
          result = await componentGetState(page, args as any);
          break;
        }

        case 'component_find_by_name': {
          result = await componentFindByName(page, args as any);
          break;
        }

        case 'component_get_source': {
          result = await componentGetSource(page, args as any);
          break;
        }

        case 'component_track_renders': {
          result = await componentTrackRenders(page, args as any);
          break;
        }

        case 'component_get_context': {
          result = await componentGetContext(page, args as any);
          break;
        }

        case 'component_get_hooks': {
          result = await componentGetHooks(page, args as any);
          break;
        }

        // ============================================================
        // NETWORK INTELLIGENCE TOOLS (6 tools)
        // ============================================================
        case 'network_get_requests': {
          result = await networkGetRequests(page, args as any);
          break;
        }

        case 'network_get_by_url': {
          result = await networkGetByUrl(page, args as any);
          break;
        }

        case 'network_get_timing': {
          result = await networkGetTiming(page, args as any);
          break;
        }

        case 'network_trace_initiator': {
          result = await networkTraceInitiator(page, args as any);
          break;
        }

        case 'network_get_headers': {
          result = await networkGetHeaders(page, args as any);
          break;
        }

        case 'network_get_body': {
          result = await networkGetBody(page, args as any);
          break;
        }

        // ============================================================
        // ERROR INTELLIGENCE TOOLS (4 tools)
        // ============================================================
        case 'error_resolve_stack': {
          result = await errorResolveStack(page, args as any);
          break;
        }

        case 'error_get_context': {
          result = await errorGetContext(page, args as any);
          break;
        }

        case 'error_trace_cause': {
          result = await errorTraceCause(page, args as any);
          break;
        }

        case 'error_get_similar': {
          result = await errorGetSimilar(page, args as any);
          break;
        }

        // ============================================================
        // BUILD INTELLIGENCE TOOLS (5 tools)
        // ============================================================
        case 'build_get_manifest': {
          result = await buildGetManifest(page, args as any);
          break;
        }

        case 'build_get_chunks': {
          result = await buildGetChunks(page, args as any);
          break;
        }

        case 'build_find_module': {
          result = await buildFindModule(page, args as any);
          break;
        }

        case 'build_get_dependencies': {
          result = await buildGetDependencies(page, args as any);
          break;
        }

        case 'build_analyze_size': {
          result = await buildAnalyzeSize(page, args as any);
          break;
        }

        // ============================================================
        // SOURCE INTELLIGENCE TOOLS (7 tools)
        // ============================================================
        case 'source_map_resolve': {
          result = await sourceMapResolve(page, args as any);
          break;
        }

        case 'source_map_get_content': {
          result = await sourceMapGetContent(page, args as any);
          break;
        }

        case 'source_trace_stack': {
          result = await sourceTraceStack(page, args as any);
          break;
        }

        case 'source_find_definition': {
          result = await sourceFindDefinition(page, args as any);
          break;
        }

        case 'source_get_symbols': {
          result = await sourceGetSymbols(page, args as any);
          break;
        }

        case 'source_map_bundle': {
          result = await sourceMapBundle(page, args as any);
          break;
        }

        case 'source_coverage_map': {
          result = await sourceCoverageMap(page, args as any);
          break;
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } finally {
      // Always close the page when done
      await page.close().catch(() => {
        // Ignore errors during cleanup
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }

    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
});

// Cleanup on exit
process.on('SIGINT', async () => {
  await browserManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await browserManager.close();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Note: No logging here to avoid interfering with stdio-based MCP protocol
}

main().catch(error => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
