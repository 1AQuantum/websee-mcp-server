/**
 * Network Intelligence Tools for WebSee MCP Server
 *
 * Provides detailed network request analysis, timing, headers, and source tracing
 * for debugging and performance optimization.
 *
 * @module network-intelligence-tools
 */

import { z } from 'zod';
import { Page } from 'playwright';
import { SourceIntelligenceLayer } from '../index.js';

// ==================== Zod Schemas ====================

export const NetworkGetRequestsSchema = z.object({
  url: z.string().url().describe('The page URL to analyze'),
  waitTime: z
    .number()
    .optional()
    .default(3000)
    .describe('Time to wait for requests to complete (ms)'),
});

export const NetworkGetByUrlSchema = z.object({
  url: z.string().url().describe('The page URL'),
  pattern: z.string().describe("URL pattern to filter (e.g., '/api/*', '*.json')"),
});

export const NetworkGetTimingSchema = z.object({
  url: z.string().url().describe('The page URL'),
  requestUrl: z.string().describe('The specific request URL to get timing for'),
});

export const NetworkTraceInitiatorSchema = z.object({
  url: z.string().url().describe('The page URL'),
  requestUrl: z.string().describe('The specific request URL to trace'),
});

export const NetworkGetHeadersSchema = z.object({
  url: z.string().url().describe('The page URL'),
  requestUrl: z.string().describe('The specific request URL to get headers for'),
});

export const NetworkGetBodySchema = z.object({
  url: z.string().url().describe('The page URL'),
  requestUrl: z.string().describe('The specific request URL to get body for'),
});

// ==================== Type Definitions ====================

export interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  duration?: number;
  size?: number;
  timestamp: number;
  initiator?: {
    type: 'fetch' | 'xhr' | 'script' | 'parser' | 'other';
    lineNumber?: number;
    columnNumber?: number;
    url?: string;
  };
  stackTrace?: string[];
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

export interface NetworkTiming {
  dns: number;
  connect: number;
  ssl: number;
  ttfb: number;
  download: number;
  total: number;
}

export interface InitiatorTrace {
  file: string;
  line: number;
  column: number;
  function?: string;
  stackTrace: Array<{
    file: string;
    line: number;
    column: number;
    function?: string;
  }>;
}

export interface NetworkHeaders {
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
}

export interface NetworkBody {
  requestBody: string | null;
  responseBody: string | null;
  contentType: string;
}

// ==================== Helper Functions ====================

// Global storage for page-level network data
const pageNetworkData = new WeakMap<Page, {
  intelligence: SourceIntelligenceLayer;
  requestMap: Map<string, any>;
  responseMap: Map<string, any>;
  listenersInstalled: boolean;
}>();

/**
 * Get or create network tracking data for a page
 */
async function getOrCreateNetworkTracking(page: Page): Promise<{
  intelligence: SourceIntelligenceLayer;
  requestMap: Map<string, any>;
  responseMap: Map<string, any>;
}> {
  let data = pageNetworkData.get(page);

  if (!data) {
    // Create new tracking data for this page
    const intelligence = new SourceIntelligenceLayer();
    const requestMap = new Map<string, any>();
    const responseMap = new Map<string, any>();

    // Set up Playwright event listeners FIRST (these capture ALL requests)
    page.on('request', request => {
      requestMap.set(request.url(), {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        resourceType: request.resourceType(),
        timestamp: Date.now(),
      });
    });

    page.on('response', async response => {
      const request = response.request();
      const timing = request.timing();

      // Capture response body
      let body: string | null = null;
      try {
        const buffer = await response.body();
        body = buffer.toString('utf-8');
      } catch (error) {
        // Response body might not be available for some requests (redirects, etc.)
        body = null;
      }

      responseMap.set(response.url(), {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timing: timing,
        body: body,
      });
    });

    // Initialize intelligence layer (sets up network tracer)
    await intelligence.initialize(page);

    data = { intelligence, requestMap, responseMap, listenersInstalled: true };
    pageNetworkData.set(page, data);
  }

  return data;
}

/**
 * Enhanced page initialization with network tracking
 */
async function initializePageWithNetworkTracking(
  page: Page,
  url: string,
  waitTime: number = 3000
): Promise<{
  intelligence: SourceIntelligenceLayer;
  requestMap: Map<string, any>;
  responseMap: Map<string, any>;
}> {
  // Get or create tracking (this ensures we capture requests even if tool is called late)
  const { intelligence, requestMap, responseMap } = await getOrCreateNetworkTracking(page);

  // Only navigate if we're not already at the target URL
  // This prevents double-navigations and capturing unwanted requests
  const currentUrl = page.url();
  if (currentUrl !== url) {
    // Clear existing data before navigation to avoid pollution
    requestMap.clear();
    responseMap.clear();
    intelligence.clearNetworkTraces();

    await page.goto(url, { waitUntil: 'networkidle' });
  }

  await page.waitForTimeout(waitTime);

  return { intelligence, requestMap, responseMap };
}

/**
 * Clear network tracking data for a page (useful for tests)
 */
export function clearNetworkData(page: Page): void {
  const data = pageNetworkData.get(page);
  if (data) {
    data.requestMap.clear();
    data.responseMap.clear();
    data.intelligence.clearNetworkTraces();
  }
}

/**
 * Match request URL using pattern (supports wildcards)
 */
function matchesPattern(url: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(url);
}

/**
 * Calculate detailed timing metrics from Playwright timing object
 */
function calculateTiming(timing: any): NetworkTiming {
  return {
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    connect: timing.connectEnd - timing.connectStart,
    ssl: timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0,
    ttfb: timing.responseStart - timing.requestStart,
    download: timing.responseEnd - timing.responseStart,
    total: timing.responseEnd - timing.requestStart,
  };
}

/**
 * Parse stack trace to extract source locations
 */
function parseStackTrace(stackTrace: string[]): InitiatorTrace['stackTrace'] {
  return stackTrace
    .map(line => {
      const match = line.match(/at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):(\d+)\)?/);
      if (match) {
        const [, func, file, lineStr, colStr] = match;
        return {
          function: func?.trim() || 'anonymous',
          file: file.trim(),
          line: parseInt(lineStr),
          column: parseInt(colStr),
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

// ==================== Tool Implementations ====================

/**
 * Get all network requests for a page
 */
export async function networkGetRequests(
  page: Page,
  params: z.infer<typeof NetworkGetRequestsSchema>
): Promise<{ requests: NetworkRequest[] }> {
  const { intelligence, requestMap, responseMap } = await initializePageWithNetworkTracking(
    page,
    params.url,
    params.waitTime
  );

  const traces = intelligence.getNetworkTraces();
  const requests: NetworkRequest[] = [];
  const processedUrls = new Set<string>();

  // Helper to normalize URLs for comparison (resolve relative to absolute)
  const normalizeUrl = (url: string): string => {
    try {
      // If it's already absolute, return as-is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      // If it's relative, try to resolve it against page URL
      const pageUrl = page.url();
      if (pageUrl && pageUrl !== 'about:blank') {
        return new URL(url, pageUrl).href;
      }
      return url;
    } catch {
      return url;
    }
  };

  // First, add all traces from intelligence layer (these have stack traces)
  for (const trace of traces) {
    const normalizedTraceUrl = normalizeUrl(trace.url);

    // Try to find matching request/response data by both original and normalized URL
    const requestData = requestMap.get(trace.url) || requestMap.get(normalizedTraceUrl);
    const responseData = responseMap.get(trace.url) || responseMap.get(normalizedTraceUrl);

    requests.push({
      url: trace.url,  // Keep the original URL format from the trace
      method: trace.method,
      status: trace.status || responseData?.status,
      duration: trace.duration,
      size: responseData?.headers?.['content-length']
        ? parseInt(responseData.headers['content-length'])
        : undefined,
      timestamp: trace.timestamp,
      initiator: trace.initiator,
      stackTrace: trace.stackTrace,
      requestHeaders: requestData?.headers,
      responseHeaders: responseData?.headers,
    });

    // Mark both URLs as processed to avoid duplicates
    processedUrls.add(trace.url);
    processedUrls.add(normalizedTraceUrl);
  }

  // Then, add requests from Playwright that weren't captured by intelligence layer
  // This handles cases where the page was loaded before network tracing was initialized
  for (const [url, requestData] of requestMap.entries()) {
    if (!processedUrls.has(url)) {
      const responseData = responseMap.get(url);
      requests.push({
        url: url,
        method: requestData.method,
        status: responseData?.status,
        duration: responseData?.timing
          ? responseData.timing.responseEnd - responseData.timing.requestStart
          : undefined,
        size: responseData?.headers?.['content-length']
          ? parseInt(responseData.headers['content-length'])
          : undefined,
        timestamp: requestData.timestamp,
        requestHeaders: requestData.headers,
        responseHeaders: responseData?.headers,
      });
      processedUrls.add(url);
    }
  }

  return { requests };
}

/**
 * Filter network requests by URL pattern
 */
export async function networkGetByUrl(
  page: Page,
  params: z.infer<typeof NetworkGetByUrlSchema>
): Promise<{ requests: NetworkRequest[] }> {
  const { requests } = await networkGetRequests(page, {
    url: params.url,
    waitTime: 3000,
  });

  const filteredRequests = requests.filter(req => matchesPattern(req.url, params.pattern));

  return {
    requests: filteredRequests.map(req => ({
      url: req.url,
      method: req.method,
      status: req.status,
      duration: req.duration,
      timestamp: req.timestamp,
      initiator: req.initiator,
    })),
  };
}

/**
 * Get detailed timing information for a specific request
 */
export async function networkGetTiming(
  page: Page,
  params: z.infer<typeof NetworkGetTimingSchema>
): Promise<NetworkTiming | { error: string }> {
  // Use existing tracking data instead of creating new listeners
  const { responseMap } = await getOrCreateNetworkTracking(page);

  // Wait briefly for any pending responses
  await page.waitForTimeout(500);

  const responseData = responseMap.get(params.requestUrl);

  if (!responseData || !responseData.timing) {
    return {
      error: `Request not found: ${params.requestUrl}`,
    };
  }

  return calculateTiming(responseData.timing);
}

/**
 * Trace network request to its source code origin
 */
export async function networkTraceInitiator(
  page: Page,
  params: z.infer<typeof NetworkTraceInitiatorSchema>
): Promise<InitiatorTrace | { error: string }> {
  // Use existing intelligence layer
  const { intelligence } = await getOrCreateNetworkTracking(page);

  // Wait briefly for any pending traces
  await page.waitForTimeout(500);

  const traces = intelligence.getNetworkTraces();
  const targetTrace = traces.find(t => t.url === params.requestUrl);

  if (!targetTrace) {
    return {
      error: `Request not found: ${params.requestUrl}`,
    };
  }

  if (!targetTrace.stackTrace || targetTrace.stackTrace.length === 0) {
    return {
      error: 'No stack trace available for this request',
    };
  }

  // Parse the first stack frame as the immediate initiator
  const parsedStack = parseStackTrace(targetTrace.stackTrace);

  if (parsedStack.length === 0) {
    return {
      error: 'Unable to parse stack trace',
    };
  }

  const initiator = parsedStack[0];

  return {
    file: initiator.file,
    line: initiator.line,
    column: initiator.column,
    function: initiator.function,
    stackTrace: parsedStack,
  };
}

/**
 * Get request and response headers for a specific request
 */
export async function networkGetHeaders(
  page: Page,
  params: z.infer<typeof NetworkGetHeadersSchema>
): Promise<NetworkHeaders | { error: string }> {
  // Use existing tracking data
  const { requestMap, responseMap } = await getOrCreateNetworkTracking(page);

  // Wait briefly for any pending data
  await page.waitForTimeout(500);

  const requestData = requestMap.get(params.requestUrl);
  const responseData = responseMap.get(params.requestUrl);

  if (!requestData && !responseData) {
    return {
      error: `Request not found: ${params.requestUrl}`,
    };
  }

  return {
    requestHeaders: requestData?.headers || {},
    responseHeaders: responseData?.headers || {},
  };
}

/**
 * Get request and response body for a specific request
 */
export async function networkGetBody(
  page: Page,
  params: z.infer<typeof NetworkGetBodySchema>
): Promise<NetworkBody | { error: string }> {
  // Use existing tracking data
  const { requestMap, responseMap } = await getOrCreateNetworkTracking(page);

  // Wait briefly for any pending data
  await page.waitForTimeout(500);

  const requestData = requestMap.get(params.requestUrl);
  const responseData = responseMap.get(params.requestUrl);

  if (!requestData && !responseData) {
    return {
      error: `Request not found: ${params.requestUrl}`,
    };
  }

  const contentType = responseData?.headers?.['content-type'] || '';

  return {
    requestBody: requestData?.postData || null,
    responseBody: responseData?.body || null,
    contentType: contentType,
  };
}

// ==================== Tool Definitions for MCP ====================

/**
 * Tool definitions compatible with MCP server
 */
export const networkIntelligenceTools = [
  {
    name: 'network_get_requests',
    description: 'Get all network requests made by a page with detailed information',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL to analyze',
        },
        waitTime: {
          type: 'number',
          description: 'Time to wait for requests to complete (ms)',
          default: 3000,
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'network_get_by_url',
    description: 'Filter network requests by URL pattern (supports wildcards)',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL',
        },
        pattern: {
          type: 'string',
          description: "URL pattern to filter (e.g., '/api/*', '*.json')",
        },
      },
      required: ['url', 'pattern'],
    },
  },
  {
    name: 'network_get_timing',
    description: 'Get detailed timing metrics for a specific network request',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL',
        },
        requestUrl: {
          type: 'string',
          description: 'The specific request URL to get timing for',
        },
      },
      required: ['url', 'requestUrl'],
    },
  },
  {
    name: 'network_trace_initiator',
    description: 'Trace a network request to its source code origin',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL',
        },
        requestUrl: {
          type: 'string',
          description: 'The specific request URL to trace',
        },
      },
      required: ['url', 'requestUrl'],
    },
  },
  {
    name: 'network_get_headers',
    description: 'Get request and response headers for a specific network request',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL',
        },
        requestUrl: {
          type: 'string',
          description: 'The specific request URL to get headers for',
        },
      },
      required: ['url', 'requestUrl'],
    },
  },
  {
    name: 'network_get_body',
    description: 'Get request and response body for a specific network request',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL',
        },
        requestUrl: {
          type: 'string',
          description: 'The specific request URL to get body for',
        },
      },
      required: ['url', 'requestUrl'],
    },
  },
];

// ==================== Tool Handler Factory ====================

/**
 * Create a tool handler for the MCP server
 */
export function createNetworkToolHandler(page: Page) {
  return async (toolName: string, args: any): Promise<any> => {
    switch (toolName) {
      case 'network_get_requests': {
        const params = NetworkGetRequestsSchema.parse(args);
        return await networkGetRequests(page, params);
      }

      case 'network_get_by_url': {
        const params = NetworkGetByUrlSchema.parse(args);
        return await networkGetByUrl(page, params);
      }

      case 'network_get_timing': {
        const params = NetworkGetTimingSchema.parse(args);
        return await networkGetTiming(page, params);
      }

      case 'network_trace_initiator': {
        const params = NetworkTraceInitiatorSchema.parse(args);
        return await networkTraceInitiator(page, params);
      }

      case 'network_get_headers': {
        const params = NetworkGetHeadersSchema.parse(args);
        return await networkGetHeaders(page, params);
      }

      case 'network_get_body': {
        const params = NetworkGetBodySchema.parse(args);
        return await networkGetBody(page, params);
      }

      default:
        throw new Error(`Unknown network tool: ${toolName}`);
    }
  };
}

// ==================== Exports ====================
// All exports are already defined above with their declarations
