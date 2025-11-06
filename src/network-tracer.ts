/**
 * Network Tracer Agent
 * Intercepts network requests and captures stack traces for source intelligence
 * Part of the WebSee Source Intelligence Layer
 */

import { Page } from 'playwright';

// Extend XMLHttpRequest interface to include custom tracking properties
declare global {
  interface XMLHttpRequest {
    __websee_url?: string;
    __websee_method?: string;
    __websee_stack?: string[];
  }
}

interface NetworkTrace {
  url: string;
  method: string;
  timestamp: number;
  stackTrace: string[];
  initiator: {
    type: 'fetch' | 'xhr' | 'script' | 'parser' | 'other';
    lineNumber?: number;
    columnNumber?: number;
    url?: string;
  };
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  status?: number;
  duration?: number;
}

export class NetworkTracer {
  private traces: Map<string, NetworkTrace> = new Map();

  /**
   * Initialize the network tracer with a Playwright page
   */
  async initialize(page: Page): Promise<void> {
    // Define the interception script as a function we can reuse
    const interceptionScript = () => {
      // Check if already installed to avoid double-wrapping
      if ((window as any).__websee_interceptors_installed) {
        return;
      }

      // Store original functions
      const originalFetch = window.fetch;
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;

      // Helper to capture stack trace
      const captureStackTrace = (): string[] => {
        const stack = new Error().stack || '';
        return stack
          .split('\n')
          .slice(2) // Remove Error line and captureStackTrace line
          .filter(line => !line.includes('NetworkTracer'))
          .map(line => line.trim())
          .slice(0, 10); // Limit to 10 frames
      };

      // Intercept fetch
      window.fetch = async function (...args) {
        const startTime = Date.now();
        const stackTrace = captureStackTrace();
        const url = args[0] instanceof Request ? args[0].url : String(args[0]);
        const method = (args[1]?.method || 'GET').toUpperCase();

        // Emit custom event for tracking
        window.dispatchEvent(
          new CustomEvent('__websee_network_start', {
            detail: {
              type: 'fetch',
              url,
              method,
              stackTrace,
              timestamp: startTime,
            },
          })
        );

        try {
          const response = await originalFetch.apply(this, args);
          const duration = Date.now() - startTime;

          const headers: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });

          window.dispatchEvent(
            new CustomEvent('__websee_network_complete', {
              detail: {
                url,
                status: response.status,
                duration,
                headers,
              },
            })
          );

          return response;
        } catch (error) {
          window.dispatchEvent(
            new CustomEvent('__websee_network_error', {
              detail: { url, error: String(error) },
            })
          );
          throw error;
        }
      };

      // Intercept XMLHttpRequest
      XMLHttpRequest.prototype.open = function (
        method: string,
        url: string,
        async?: boolean,
        username?: string | null,
        password?: string | null
      ) {
        this.__websee_url = url;
        this.__websee_method = method;
        this.__websee_stack = captureStackTrace();
        return originalXHROpen.call(
          this,
          method,
          url,
          async !== undefined ? async : true,
          username,
          password
        );
      };

      XMLHttpRequest.prototype.send = function (...args) {
        const startTime = Date.now();

        window.dispatchEvent(
          new CustomEvent('__websee_network_start', {
            detail: {
              type: 'xhr',
              url: this.__websee_url,
              method: this.__websee_method,
              stackTrace: this.__websee_stack,
              timestamp: startTime,
            },
          })
        );

        this.addEventListener('loadend', () => {
          const duration = Date.now() - startTime;
          window.dispatchEvent(
            new CustomEvent('__websee_network_complete', {
              detail: {
                url: this.__websee_url,
                status: this.status,
                duration,
              },
            })
          );
        });

        return originalXHRSend.apply(this, args);
      };

      // Mark as installed
      (window as any).__websee_interceptors_installed = true;
    };

    // Inject the interception script for future page loads
    await page.addInitScript(interceptionScript);

    // Also inject it into the current page if it's already loaded
    const isAlreadyInjected = await page.evaluate(() => {
      return (window as any).__websee_interceptors_installed === true;
    }).catch(() => false);

    if (!isAlreadyInjected) {
      await page.evaluate(interceptionScript);
    }

    // Listen for network events
    // Check if the function is already exposed to avoid duplicate registration
    const isHandlerExposed = await page.evaluate(() => {
      return typeof (window as any).__websee_network_handler === 'function';
    }).catch(() => false);

    if (!isHandlerExposed) {
      await page.exposeFunction('__websee_network_handler', (event: any) => {
        this.handleNetworkEvent(event);
      });
    }

    // Set up event listeners via addInitScript for future pages
    const listenerScript = () => {
      // Check if already installed
      if ((window as any).__websee_listeners_installed) {
        return;
      }

      ['__websee_network_start', '__websee_network_complete', '__websee_network_error'].forEach(
        eventName => {
          window.addEventListener(eventName, (e: any) => {
            (window as any).__websee_network_handler(e.detail);
          });
        }
      );

      // Mark as installed
      (window as any).__websee_listeners_installed = true;
    };

    await page.addInitScript(listenerScript);

    // Also set up event listeners for the current page if needed
    const listenersInstalled = await page.evaluate(() => {
      return (window as any).__websee_listeners_installed === true;
    }).catch(() => false);

    if (!listenersInstalled) {
      await page.evaluate(listenerScript);
    }
  }

  /**
   * Handle network events from the page
   */
  private handleNetworkEvent(event: any): void {
    if (!event.url) {
      return;
    }

    const key = `${event.method}_${event.url}_${event.timestamp}`;

    if (event.stackTrace) {
      // Start of request
      this.traces.set(key, {
        url: event.url,
        method: event.method,
        timestamp: event.timestamp,
        stackTrace: event.stackTrace,
        initiator: {
          type: event.type,
          // Parse stack trace for source location
          ...this.parseStackLocation(event.stackTrace[0]),
        },
      });
    } else if (event.status !== undefined) {
      // Completion of request
      const trace = Array.from(this.traces.values()).find(t => t.url === event.url && !t.status);

      if (trace) {
        trace.status = event.status;
        trace.duration = event.duration;
        if (event.headers) {
          trace.responseHeaders = event.headers;
        }
      }
    }
  }

  /**
   * Parse stack trace line to extract source location
   */
  private parseStackLocation(stackLine: string): {
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  } {
    const match = stackLine.match(/at .* \(?(.*):(\d+):(\d+)\)?$/);
    if (match) {
      return {
        url: match[1],
        lineNumber: parseInt(match[2]),
        columnNumber: parseInt(match[3]),
      };
    }
    return {};
  }

  /**
   * Get all network traces
   */
  getTraces(): NetworkTrace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Get traces for a specific URL pattern
   */
  getTracesForUrl(urlPattern: string | RegExp): NetworkTrace[] {
    const pattern =
      typeof urlPattern === 'string' ? new RegExp(urlPattern.replace(/\*/g, '.*')) : urlPattern;

    return this.getTraces().filter(trace => pattern.test(trace.url));
  }

  /**
   * Clear all traces
   */
  clearTraces(): void {
    this.traces.clear();
  }

  /**
   * Get a summary of network activity
   */
  getSummary(): {
    totalRequests: number;
    byMethod: Record<string, number>;
    byStatus: Record<number, number>;
    averageDuration: number;
  } {
    const traces = this.getTraces();
    const byMethod: Record<string, number> = {};
    const byStatus: Record<number, number> = {};
    let totalDuration = 0;
    let completedCount = 0;

    traces.forEach(trace => {
      byMethod[trace.method] = (byMethod[trace.method] || 0) + 1;
      if (trace.status) {
        byStatus[trace.status] = (byStatus[trace.status] || 0) + 1;
      }
      if (trace.duration) {
        totalDuration += trace.duration;
        completedCount++;
      }
    });

    return {
      totalRequests: traces.length,
      byMethod,
      byStatus,
      averageDuration: completedCount > 0 ? totalDuration / completedCount : 0,
    };
  }

  /**
   * Cleanup and destroy the tracer
   */
  async destroy(): Promise<void> {
    this.traces.clear();
  }
}
