/**
 * Error Intelligence Tools
 * Advanced error analysis and debugging tools for WebSee MCP Server
 *
 * @module error-intelligence-tools
 */

import { z } from 'zod';
import { Page } from 'playwright';
import { SourceIntelligenceLayer } from '../index.js';

// ============================================================================
// Tool Schemas
// ============================================================================

export const ErrorResolveStackSchema = z.object({
  url: z.string().url().describe('The page URL where the error occurred'),
  errorStack: z.string().describe('The minified error stack trace to resolve'),
});

export const ErrorGetContextSchema = z.object({
  url: z.string().url().describe('The page URL to analyze'),
});

export const ErrorTraceCauseSchema = z.object({
  url: z.string().url().describe('The page URL where the error occurred'),
  errorMessage: z.string().describe('The error message to trace'),
});

export const ErrorGetSimilarSchema = z.object({
  url: z.string().url().describe('The page URL to analyze'),
  errorMessage: z.string().describe('The error message to find similar errors for'),
});

// ============================================================================
// Type Definitions
// ============================================================================

export interface ResolvedStackFrame {
  original: string;
  resolved?: {
    file: string;
    line: number;
    column: number;
    content?: string;
  };
}

export interface ErrorContext {
  errors: Array<{
    type: string;
    message: string;
    timestamp: number;
    location?: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    timestamp: number;
    location?: string;
  }>;
  components: Array<{
    name: string;
    framework: string;
    state?: Record<string, any>;
    props?: Record<string, any>;
  }>;
  network: Array<{
    url: string;
    method: string;
    status?: number;
    duration?: number;
    timestamp: number;
  }>;
}

export interface RootCauseAnalysis {
  rootCause: string;
  confidence: 'high' | 'medium' | 'low';
  stackTrace: ResolvedStackFrame[];
  relatedErrors: Array<{
    message: string;
    timestamp: number;
    correlation: number;
  }>;
  recommendations: string[];
}

export interface SimilarError {
  message: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  stackTrace?: string;
  pattern: string;
}

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Resolve minified error stack traces to original source locations
 */
export async function errorResolveStack(
  page: Page,
  params: z.infer<typeof ErrorResolveStackSchema>
): Promise<{
  original: string[];
  resolved: ResolvedStackFrame[];
  message: string;
}> {
  const intelligence = new SourceIntelligenceLayer();

  try {
    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    const stackLines = params.errorStack.split('\n').filter(line => line.trim());
    const resolved: ResolvedStackFrame[] = [];

    for (const line of stackLines) {
      const frame: ResolvedStackFrame = {
        original: line,
      };

      // Try to parse location from stack trace line
      // Supports formats:
      // - at functionName (file.js:line:column)
      // - at file.js:line:column
      // - functionName@file.js:line:column
      const match = line.match(/(?:at\s+(?:.*?\s+)?\(?|@)(.*?):(\d+):(\d+)\)?$/);

      if (match) {
        const [, fileUrl, lineStr, colStr] = match;
        const lineNum = parseInt(lineStr, 10);
        const colNum = parseInt(colStr, 10);

        try {
          const sourceLocation = await intelligence.resolveSourceLocation(fileUrl, lineNum, colNum);

          if (sourceLocation) {
            frame.resolved = {
              file: sourceLocation.file,
              line: sourceLocation.line,
              column: sourceLocation.column,
              content: sourceLocation.content,
            };
          }
        } catch (error) {
          // Failed to resolve this frame, keep original
          console.warn(`Failed to resolve stack frame: ${line}`, error);
        }
      }

      resolved.push(frame);
    }

    const resolvedCount = resolved.filter(f => f.resolved).length;
    const message = `Resolved ${resolvedCount} of ${stackLines.length} stack frames to original source`;

    return {
      original: stackLines,
      resolved,
      message,
    };
  } finally {
    await intelligence.destroy();
  }
}

/**
 * Get comprehensive error context including console, network, and component state
 */
export async function errorGetContext(
  page: Page,
  params: z.infer<typeof ErrorGetContextSchema>
): Promise<ErrorContext> {
  const intelligence = new SourceIntelligenceLayer();
  const context: ErrorContext = {
    errors: [],
    warnings: [],
    components: [],
    network: [],
  };

  try {
    // Capture console messages
    const consoleMessages: Array<{
      type: string;
      text: string;
      location: any;
      timestamp: number;
    }> = [];

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: Date.now(),
      });
    });

    // Capture page errors
    const pageErrors: Array<{
      message: string;
      stack?: string;
      timestamp: number;
    }> = [];

    page.on('pageerror', error => {
      pageErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      });
    });

    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    // Wait a bit to capture any async errors
    await page.waitForTimeout(2000);

    // Process console messages
    consoleMessages.forEach(msg => {
      const entry = {
        type: msg.type,
        message: msg.text,
        timestamp: msg.timestamp,
        location: msg.location?.url
          ? `${msg.location.url}:${msg.location.lineNumber}:${msg.location.columnNumber}`
          : undefined,
      };

      if (msg.type === 'error') {
        context.errors.push(entry);
      } else if (msg.type === 'warning') {
        context.warnings.push(entry);
      }
    });

    // Process page errors
    pageErrors.forEach(error => {
      context.errors.push({
        type: 'pageerror',
        message: error.message,
        timestamp: error.timestamp,
        location: error.stack ? error.stack.split('\n')[1]?.trim() : undefined,
      });
    });

    // Get component tree
    const components = await intelligence.getComponentTree();
    context.components = components.map(comp => ({
      name: comp.name,
      framework: comp.type,
      state: comp.state,
      props: comp.props,
    }));

    // Get network activity
    const networkTraces = intelligence.getNetworkTraces();
    context.network = networkTraces.map(trace => ({
      url: trace.url,
      method: trace.method,
      status: trace.status,
      duration: trace.duration,
      timestamp: trace.timestamp,
    }));

    return context;
  } finally {
    await intelligence.destroy();
  }
}

/**
 * Trace an error to its root cause with AI-powered analysis
 */
export async function errorTraceCause(
  page: Page,
  params: z.infer<typeof ErrorTraceCauseSchema>
): Promise<RootCauseAnalysis> {
  const intelligence = new SourceIntelligenceLayer();

  try {
    const errors: Error[] = [];
    const errorTimeline: Array<{
      error: Error;
      timestamp: number;
    }> = [];

    // Capture all errors with timestamps
    page.on('pageerror', error => {
      errors.push(error);
      errorTimeline.push({
        error,
        timestamp: Date.now(),
      });
    });

    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    // Wait for errors to occur
    await page.waitForTimeout(2000);

    // Find the matching error
    const targetError = errors.find(
      e => e.message.includes(params.errorMessage) || params.errorMessage.includes(e.message)
    );

    if (!targetError) {
      return {
        rootCause: `No error matching "${params.errorMessage}" was found on the page`,
        confidence: 'low',
        stackTrace: [],
        relatedErrors: [],
        recommendations: [
          'Verify the error message is correct',
          'Try interacting with the page to trigger the error',
          'Check if the error occurs during page load or user interaction',
        ],
      };
    }

    // Get error intelligence
    const errorIntel = await intelligence.getErrorIntelligence(targetError);

    // Parse stack trace
    const stackTrace: ResolvedStackFrame[] = [];
    if (errorIntel.originalStack) {
      for (const stackLine of errorIntel.originalStack) {
        stackTrace.push({
          original: stackLine,
          resolved: stackLine.includes(':')
            ? {
                file: stackLine.split(':')[0].replace(/^at\s+/, ''),
                line: parseInt(stackLine.split(':')[1] || '0'),
                column: parseInt(stackLine.split(':')[2] || '0'),
              }
            : undefined,
        });
      }
    }

    // Analyze related errors
    const relatedErrors = errorTimeline
      .filter(e => e.error !== targetError)
      .map(e => ({
        message: e.error.message,
        timestamp: e.timestamp,
        correlation: calculateCorrelation(targetError, e.error),
      }))
      .filter(e => e.correlation > 0.3)
      .sort((a, b) => b.correlation - a.correlation)
      .slice(0, 5);

    // Determine root cause
    const rootCause = analyzeRootCause(targetError, errorIntel, relatedErrors);

    // Generate recommendations
    const recommendations = generateRecommendations(targetError, errorIntel);

    return {
      rootCause: rootCause.description,
      confidence: rootCause.confidence,
      stackTrace,
      relatedErrors,
      recommendations,
    };
  } finally {
    await intelligence.destroy();
  }
}

/**
 * Find similar errors in the error timeline
 */
export async function errorGetSimilar(
  page: Page,
  params: z.infer<typeof ErrorGetSimilarSchema>
): Promise<{
  similar: SimilarError[];
}> {
  const intelligence = new SourceIntelligenceLayer();

  try {
    const errorMap = new Map<string, SimilarError>();

    // Capture all errors
    page.on('pageerror', error => {
      const pattern = extractErrorPattern(error.message);
      const existing = errorMap.get(pattern);

      if (existing) {
        existing.count++;
        existing.lastSeen = Date.now();
      } else {
        errorMap.set(pattern, {
          message: error.message,
          count: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          stackTrace: error.stack,
          pattern,
        });
      }
    });

    await intelligence.initialize(page);
    await page.goto(params.url, { waitUntil: 'networkidle' });

    // Wait to collect errors
    await page.waitForTimeout(3000);

    // Find similar errors
    const targetPattern = extractErrorPattern(params.errorMessage);
    const similar: SimilarError[] = [];

    for (const [pattern, error] of errorMap.entries()) {
      if (pattern === targetPattern) {
        similar.push(error);
      } else {
        const similarity = calculateSimilarity(targetPattern, pattern);
        if (similarity > 0.5) {
          similar.push({
            ...error,
            message: error.message + ` (${Math.round(similarity * 100)}% similar)`,
          });
        }
      }
    }

    // Sort by count (most frequent first)
    similar.sort((a, b) => b.count - a.count);

    return { similar };
  } finally {
    await intelligence.destroy();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate correlation between two errors
 */
function calculateCorrelation(error1: Error, error2: Error): number {
  let score = 0;

  // Same error type
  if (error1.name === error2.name) {
    score += 0.3;
  }

  // Similar messages
  const similarity = calculateSimilarity(error1.message, error2.message);
  score += similarity * 0.5;

  // Similar stack traces
  if (error1.stack && error2.stack) {
    const stack1Lines = error1.stack.split('\n').slice(0, 3);
    const stack2Lines = error2.stack.split('\n').slice(0, 3);
    const commonLines = stack1Lines.filter(line =>
      stack2Lines.some(l => l.includes(line.split(':')[0]))
    );
    score += (commonLines.length / Math.max(stack1Lines.length, 1)) * 0.2;
  }

  return Math.min(score, 1);
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Extract error pattern for grouping similar errors
 */
function extractErrorPattern(message: string): string {
  // Remove dynamic parts like numbers, IDs, timestamps
  return message
    .replace(/\d+/g, 'N')
    .replace(/0x[0-9a-fA-F]+/g, '0xHEX')
    .replace(/'[^']*'/g, "'STRING'")
    .replace(/"[^"]*"/g, '"STRING"')
    .replace(/\bat\s+.*$/gm, '')
    .trim();
}

/**
 * Analyze root cause of an error
 */
function analyzeRootCause(
  error: Error,
  intelligence: any,
  relatedErrors: Array<{ message: string; correlation: number }>
): {
  description: string;
  confidence: 'high' | 'medium' | 'low';
} {
  const message = error.message.toLowerCase();

  // Network-related errors
  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('ajax') ||
    message.includes('xhr')
  ) {
    return {
      description: `Network request failure: ${error.message}. Check network connectivity, API endpoints, and CORS configuration.`,
      confidence: 'high',
    };
  }

  // Type errors
  if (message.includes('is not a function') || message.includes('undefined')) {
    return {
      description: `Type error: ${error.message}. Likely caused by accessing a property or method on an undefined/null object. Check initialization order and data flow.`,
      confidence: 'high',
    };
  }

  // Reference errors
  if (message.includes('is not defined') || message.includes('not found')) {
    return {
      description: `Reference error: ${error.message}. Variable or function not in scope. Check imports, declarations, and scope.`,
      confidence: 'high',
    };
  }

  // Component-related errors
  if (
    intelligence.components &&
    intelligence.components.length > 0 &&
    (message.includes('render') || message.includes('component'))
  ) {
    return {
      description: `Component rendering error: ${error.message}. Check component props, state, and lifecycle methods.`,
      confidence: 'medium',
    };
  }

  // Multiple related errors suggest cascading failure
  if (relatedErrors.length > 2) {
    return {
      description: `Cascading failure detected. Root error: ${error.message}. This triggered ${relatedErrors.length} related errors. Fix the root cause first.`,
      confidence: 'medium',
    };
  }

  // Default
  return {
    description: `Error occurred: ${error.message}. Review the stack trace and surrounding code for more context.`,
    confidence: 'low',
  };
}

/**
 * Generate recommendations based on error analysis
 */
function generateRecommendations(error: Error, intelligence: any): string[] {
  const recommendations: string[] = [];
  const message = error.message.toLowerCase();

  // General recommendations
  recommendations.push('Review the resolved stack trace to identify the exact location');

  // Network-specific
  if (message.includes('fetch') || message.includes('network')) {
    recommendations.push('Check network tab in browser DevTools');
    recommendations.push('Verify API endpoint URLs and request format');
    recommendations.push('Check CORS headers if cross-origin request');
    recommendations.push('Add error handling for network failures');
  }

  // Type error specific
  if (message.includes('undefined') || message.includes('null')) {
    recommendations.push('Add null checks before accessing properties');
    recommendations.push('Use optional chaining (?.) for safer property access');
    recommendations.push('Verify data is loaded before component renders');
  }

  // Component-specific
  if (intelligence.components && intelligence.components.length > 0) {
    recommendations.push('Inspect component state and props in the error context');
    recommendations.push('Check if component is properly mounted');
  }

  // Build-specific
  if (intelligence.buildInfo) {
    recommendations.push(`Review module '${intelligence.buildInfo.name}' in your bundle`);
  }

  // Add source maps recommendation if not available
  if (!intelligence.originalStack || intelligence.originalStack.length === 0) {
    recommendations.push('Enable source maps in your build configuration for better debugging');
  }

  return recommendations;
}

// ============================================================================
// Tool Exports
// ============================================================================

export const errorIntelligenceTools = {
  error_resolve_stack: {
    name: 'error_resolve_stack',
    description:
      'Resolve minified error stack traces to original source code locations using source maps',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL where the error occurred',
        },
        errorStack: {
          type: 'string',
          description: 'The minified error stack trace to resolve',
        },
      },
      required: ['url', 'errorStack'],
    },
    handler: errorResolveStack,
    schema: ErrorResolveStackSchema,
  },

  error_get_context: {
    name: 'error_get_context',
    description:
      'Get comprehensive error context including console errors, warnings, component state, and network activity',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL to analyze',
        },
      },
      required: ['url'],
    },
    handler: errorGetContext,
    schema: ErrorGetContextSchema,
  },

  error_trace_cause: {
    name: 'error_trace_cause',
    description:
      'Trace an error to its root cause with AI-powered analysis, including related errors and recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL where the error occurred',
        },
        errorMessage: {
          type: 'string',
          description: 'The error message to trace',
        },
      },
      required: ['url', 'errorMessage'],
    },
    handler: errorTraceCause,
    schema: ErrorTraceCauseSchema,
  },

  error_get_similar: {
    name: 'error_get_similar',
    description:
      'Find similar errors in the error timeline to identify patterns and recurring issues',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The page URL to analyze',
        },
        errorMessage: {
          type: 'string',
          description: 'The error message to find similar errors for',
        },
      },
      required: ['url', 'errorMessage'],
    },
    handler: errorGetSimilar,
    schema: ErrorGetSimilarSchema,
  },
};
