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
  const intelligence = new SourceIntelligenceLayer();
  await intelligence.initialize(page);

  const requestMap = new Map<string, any>();
  const responseMap = new Map<string, any>();

  // Track all network requests with enhanced data
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
    responseMap.set(response.url(), {
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      timing: timing,
    });
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(waitTime);

  return { intelligence, requestMap, responseMap };
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

  // Combine data from intelligence layer and Playwright
  for (const trace of traces) {
    const requestData = requestMap.get(trace.url);
    const responseData = responseMap.get(trace.url);

    requests.push({
      url: trace.url,
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
  const timingMap = new Map<string, any>();

  page.on('response', async response => {
    if (response.url() === params.requestUrl) {
      const request = response.request();
      timingMap.set(response.url(), request.timing());
    }
  });

  await page.goto(params.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const timing = timingMap.get(params.requestUrl);

  if (!timing) {
    return {
      error: `Request not found: ${params.requestUrl}`,
    };
  }

  return calculateTiming(timing);
}

/**
 * Trace network request to its source code origin
 */
export async function networkTraceInitiator(
  page: Page,
  params: z.infer<typeof NetworkTraceInitiatorSchema>
): Promise<InitiatorTrace | { error: string }> {
  const intelligence = new SourceIntelligenceLayer();
  await intelligence.initialize(page);

  await page.goto(params.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

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
  let requestHeaders: Record<string, string> = {};
  let responseHeaders: Record<string, string> = {};
  let found = false;

  page.on('request', request => {
    if (request.url() === params.requestUrl) {
      requestHeaders = request.headers();
      found = true;
    }
  });

  page.on('response', response => {
    if (response.url() === params.requestUrl) {
      responseHeaders = response.headers();
      found = true;
    }
  });

  await page.goto(params.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  if (!found) {
    return {
      error: `Request not found: ${params.requestUrl}`,
    };
  }

  return {
    requestHeaders,
    responseHeaders,
  };
}

/**
 * Get request and response body for a specific request
 */
export async function networkGetBody(
  page: Page,
  params: z.infer<typeof NetworkGetBodySchema>
): Promise<NetworkBody | { error: string }> {
  let requestBody: string | null = null;
  let responseBody: string | null = null;
  let contentType = '';
  let found = false;

  page.on('request', request => {
    if (request.url() === params.requestUrl) {
      requestBody = request.postData() || null;
      found = true;
    }
  });

  page.on('response', async response => {
    if (response.url() === params.requestUrl) {
      try {
        const buffer = await response.body();
        responseBody = buffer.toString('utf-8');
        contentType = response.headers()['content-type'] || '';
        found = true;
      } catch (error) {
        // Response body might not be available for some requests
        responseBody = null;
      }
    }
  });

  await page.goto(params.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  if (!found) {
    return {
      error: `Request not found: ${params.requestUrl}`,
    };
  }

  return {
    requestBody,
    responseBody,
    contentType,
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
