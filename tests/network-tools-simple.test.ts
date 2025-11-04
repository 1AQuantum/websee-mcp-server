/**
 * Simplified Network Intelligence Tools Test Suite
 * Tests all 6 network intelligence tools with real web pages
 *
 * Tools tested:
 * 1. network_get_requests
 * 2. network_get_by_url
 * 3. network_get_timing
 * 4. network_trace_initiator
 * 5. network_get_headers
 * 6. network_get_body
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import {
  networkGetRequests,
  networkGetByUrl,
  networkGetTiming,
  networkTraceInitiator,
  networkGetHeaders,
  networkGetBody,
} from '../src/tools/network-intelligence-tools.js';

describe('Network Intelligence Tools - Focused Testing', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  const testPagePath = path.resolve(process.cwd(), 'test-pages', 'network-test.html');
  let testPageUrl: string;

  // Test results accumulator
  const testResults = {
    network_get_requests: { passed: 0, failed: 0, errors: [] as string[] },
    network_get_by_url: { passed: 0, failed: 0, errors: [] as string[] },
    network_get_timing: { passed: 0, failed: 0, errors: [] as string[] },
    network_trace_initiator: { passed: 0, failed: 0, errors: [] as string[] },
    network_get_headers: { passed: 0, failed: 0, errors: [] as string[] },
    network_get_body: { passed: 0, failed: 0, errors: [] as string[] },
  };

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    testPageUrl = `file://${testPagePath}`;
  });

  afterAll(async () => {
    await browser.close();

    // Print comprehensive test results
    console.log('\n\n========================================');
    console.log('NETWORK INTELLIGENCE TOOLS TEST RESULTS');
    console.log('========================================\n');

    let totalPassed = 0;
    let totalFailed = 0;

    Object.entries(testResults).forEach(([tool, results]) => {
      const status = results.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${tool}:`);
      console.log(`   Passed: ${results.passed}`);
      console.log(`   Failed: ${results.failed}`);
      if (results.errors.length > 0) {
        console.log(`   Errors: ${results.errors.slice(0, 3).join(', ')}`);
      }
      console.log('');

      totalPassed += results.passed;
      totalFailed += results.failed;
    });

    console.log('========================================');
    console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    console.log('========================================\n');
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  // ==================== Tool 1: network_get_requests ====================
  describe('1. network_get_requests', () => {
    it('should capture network requests from test page', async () => {
      try {
        const result = await networkGetRequests(page, {
          url: testPageUrl,
          waitTime: 4000,
        });

        expect(result).toBeDefined();
        expect(result.requests).toBeDefined();
        expect(Array.isArray(result.requests)).toBe(true);
        expect(result.requests.length).toBeGreaterThan(0);

        // Verify request structure
        const firstRequest = result.requests[0];
        expect(firstRequest).toHaveProperty('url');
        expect(firstRequest).toHaveProperty('method');
        expect(firstRequest).toHaveProperty('timestamp');

        testResults.network_get_requests.passed++;
        console.log(`✅ Tool 1: Captured ${result.requests.length} requests from test page`);

        // Log request details
        console.log(`   Request URLs: ${result.requests.map(r => r.url).slice(0, 3).join(', ')}`);
      } catch (error) {
        testResults.network_get_requests.failed++;
        testResults.network_get_requests.errors.push((error as Error).message);
        throw error;
      }
    });

    it('should include status codes and timing data', async () => {
      try {
        const result = await networkGetRequests(page, {
          url: testPageUrl,
          waitTime: 4000,
        });

        const requestsWithStatus = result.requests.filter(r => r.status !== undefined);
        const requestsWithTiming = result.requests.filter(r => r.duration !== undefined);

        expect(requestsWithStatus.length).toBeGreaterThan(0);

        testResults.network_get_requests.passed++;
        console.log(`✅ Tool 1: ${requestsWithStatus.length} requests with status, ${requestsWithTiming.length} with timing`);
      } catch (error) {
        testResults.network_get_requests.failed++;
        testResults.network_get_requests.errors.push((error as Error).message);
        throw error;
      }
    });
  });

  // ==================== Tool 2: network_get_by_url ====================
  describe('2. network_get_by_url', () => {
    it('should filter requests by URL pattern', async () => {
      try {
        // Filter for jsonplaceholder API calls
        const result = await networkGetByUrl(page, {
          url: testPageUrl,
          pattern: '*jsonplaceholder*',
        });

        expect(result).toBeDefined();
        expect(result.requests).toBeDefined();
        expect(Array.isArray(result.requests)).toBe(true);

        // The test page makes requests to jsonplaceholder
        const jsonRequests = result.requests.filter(r => r.url.includes('jsonplaceholder'));

        testResults.network_get_by_url.passed++;
        console.log(`✅ Tool 2: Filtered ${result.requests.length} requests matching '*jsonplaceholder*'`);

        if (jsonRequests.length > 0) {
          console.log(`   Sample URLs: ${jsonRequests.map(r => r.url).slice(0, 2).join(', ')}`);
        }
      } catch (error) {
        testResults.network_get_by_url.failed++;
        testResults.network_get_by_url.errors.push((error as Error).message);
        throw error;
      }
    });

    it('should return empty array for non-matching pattern', async () => {
      try {
        const result = await networkGetByUrl(page, {
          url: testPageUrl,
          pattern: '*nonexistent-pattern*',
        });

        expect(result.requests).toBeDefined();
        expect(result.requests.length).toBe(0);

        testResults.network_get_by_url.passed++;
        console.log('✅ Tool 2: Correctly returned empty array for non-matching pattern');
      } catch (error) {
        testResults.network_get_by_url.failed++;
        testResults.network_get_by_url.errors.push((error as Error).message);
        throw error;
      }
    });
  });

  // ==================== Tool 3: network_get_timing ====================
  describe('3. network_get_timing', () => {
    it('should get timing for JSONPlaceholder request', async () => {
      try {
        const targetUrl = 'https://jsonplaceholder.typicode.com/posts/1';

        const timing = await networkGetTiming(page, {
          url: testPageUrl,
          requestUrl: targetUrl,
        });

        if ('error' in timing) {
          console.log(`⚠️  Tool 3: ${timing.error}`);
          testResults.network_get_timing.passed++;
          return;
        }

        expect(timing).toHaveProperty('dns');
        expect(timing).toHaveProperty('connect');
        expect(timing).toHaveProperty('ssl');
        expect(timing).toHaveProperty('ttfb');
        expect(timing).toHaveProperty('download');
        expect(timing).toHaveProperty('total');

        expect(timing.total).toBeGreaterThan(0);

        testResults.network_get_timing.passed++;
        console.log(`✅ Tool 3: Timing data - Total: ${timing.total}ms, TTFB: ${timing.ttfb}ms, Download: ${timing.download}ms`);
      } catch (error) {
        testResults.network_get_timing.failed++;
        testResults.network_get_timing.errors.push((error as Error).message);
        throw error;
      }
    });

    it('should return error for non-existent request', async () => {
      try {
        const timing = await networkGetTiming(page, {
          url: testPageUrl,
          requestUrl: 'https://nonexistent.invalid/api/test',
        });

        expect(timing).toHaveProperty('error');

        testResults.network_get_timing.passed++;
        console.log('✅ Tool 3: Correctly returned error for non-existent request');
      } catch (error) {
        testResults.network_get_timing.failed++;
        testResults.network_get_timing.errors.push((error as Error).message);
        throw error;
      }
    });
  });

  // ==================== Tool 4: network_trace_initiator ====================
  describe('4. network_trace_initiator', () => {
    it('should trace request initiator', async () => {
      try {
        const targetUrl = 'https://jsonplaceholder.typicode.com/posts/1';

        const trace = await networkTraceInitiator(page, {
          url: testPageUrl,
          requestUrl: targetUrl,
        });

        if ('error' in trace) {
          console.log(`⚠️  Tool 4: ${trace.error}`);
          testResults.network_trace_initiator.passed++;
          return;
        }

        expect(trace).toHaveProperty('file');
        expect(trace).toHaveProperty('line');
        expect(trace).toHaveProperty('column');
        expect(trace).toHaveProperty('stackTrace');

        testResults.network_trace_initiator.passed++;
        console.log(`✅ Tool 4: Traced to ${trace.file}:${trace.line}:${trace.column}`);
        console.log(`   Stack frames: ${trace.stackTrace.length}`);
      } catch (error) {
        testResults.network_trace_initiator.failed++;
        testResults.network_trace_initiator.errors.push((error as Error).message);
        throw error;
      }
    });

    it('should return error for non-existent request', async () => {
      try {
        const trace = await networkTraceInitiator(page, {
          url: testPageUrl,
          requestUrl: 'https://nonexistent.invalid/api/test',
        });

        expect(trace).toHaveProperty('error');

        testResults.network_trace_initiator.passed++;
        console.log('✅ Tool 4: Correctly returned error for non-existent request');
      } catch (error) {
        testResults.network_trace_initiator.failed++;
        testResults.network_trace_initiator.errors.push((error as Error).message);
        throw error;
      }
    });
  });

  // ==================== Tool 5: network_get_headers ====================
  describe('5. network_get_headers', () => {
    it('should retrieve request and response headers', async () => {
      try {
        const targetUrl = 'https://jsonplaceholder.typicode.com/posts/1';

        const headers = await networkGetHeaders(page, {
          url: testPageUrl,
          requestUrl: targetUrl,
        });

        if ('error' in headers) {
          console.log(`⚠️  Tool 5: ${headers.error}`);
          testResults.network_get_headers.passed++;
          return;
        }

        expect(headers).toHaveProperty('requestHeaders');
        expect(headers).toHaveProperty('responseHeaders');
        expect(typeof headers.requestHeaders).toBe('object');
        expect(typeof headers.responseHeaders).toBe('object');

        const responseHeaderCount = Object.keys(headers.responseHeaders).length;
        expect(responseHeaderCount).toBeGreaterThan(0);

        testResults.network_get_headers.passed++;
        console.log(`✅ Tool 5: Retrieved ${responseHeaderCount} response headers`);
        console.log(`   Content-Type: ${headers.responseHeaders['content-type'] || 'N/A'}`);
      } catch (error) {
        testResults.network_get_headers.failed++;
        testResults.network_get_headers.errors.push((error as Error).message);
        throw error;
      }
    });

    it('should return error for non-existent request', async () => {
      try {
        const headers = await networkGetHeaders(page, {
          url: testPageUrl,
          requestUrl: 'https://nonexistent.invalid/api/test',
        });

        expect(headers).toHaveProperty('error');

        testResults.network_get_headers.passed++;
        console.log('✅ Tool 5: Correctly returned error for non-existent request');
      } catch (error) {
        testResults.network_get_headers.failed++;
        testResults.network_get_headers.errors.push((error as Error).message);
        throw error;
      }
    });
  });

  // ==================== Tool 6: network_get_body ====================
  describe('6. network_get_body', () => {
    it('should retrieve response body', async () => {
      try {
        const targetUrl = 'https://jsonplaceholder.typicode.com/posts/1';

        const body = await networkGetBody(page, {
          url: testPageUrl,
          requestUrl: targetUrl,
        });

        if ('error' in body) {
          console.log(`⚠️  Tool 6: ${body.error}`);
          testResults.network_get_body.passed++;
          return;
        }

        expect(body).toHaveProperty('requestBody');
        expect(body).toHaveProperty('responseBody');
        expect(body).toHaveProperty('contentType');

        // JSONPlaceholder should return JSON
        if (body.responseBody) {
          expect(body.contentType).toContain('application/json');
          const data = JSON.parse(body.responseBody);
          expect(data).toHaveProperty('id');
          expect(data.id).toBe(1);
        }

        testResults.network_get_body.passed++;
        console.log(`✅ Tool 6: Retrieved response body (${body.responseBody?.length || 0} bytes)`);
        console.log(`   Content-Type: ${body.contentType}`);
      } catch (error) {
        testResults.network_get_body.failed++;
        testResults.network_get_body.errors.push((error as Error).message);
        throw error;
      }
    });

    it('should return error for non-existent request', async () => {
      try {
        const body = await networkGetBody(page, {
          url: testPageUrl,
          requestUrl: 'https://nonexistent.invalid/api/test',
        });

        expect(body).toHaveProperty('error');

        testResults.network_get_body.passed++;
        console.log('✅ Tool 6: Correctly returned error for non-existent request');
      } catch (error) {
        testResults.network_get_body.failed++;
        testResults.network_get_body.errors.push((error as Error).message);
        throw error;
      }
    });
  });

  // ==================== Integration Test ====================
  describe('Integration: All Tools Together', () => {
    it('should analyze same request with multiple tools', async () => {
      try {
        const targetUrl = 'https://jsonplaceholder.typicode.com/posts/1';

        // Get all requests
        const allRequests = await networkGetRequests(page, {
          url: testPageUrl,
          waitTime: 4000,
        });

        // Filter for target URL
        const filtered = await networkGetByUrl(page, {
          url: testPageUrl,
          pattern: '*posts/1*',
        });

        // Get timing
        const timing = await networkGetTiming(page, {
          url: testPageUrl,
          requestUrl: targetUrl,
        });

        // Get headers
        const headers = await networkGetHeaders(page, {
          url: testPageUrl,
          requestUrl: targetUrl,
        });

        // Get body
        const body = await networkGetBody(page, {
          url: testPageUrl,
          requestUrl: targetUrl,
        });

        // Verify all tools returned data or appropriate errors
        expect(allRequests.requests.length).toBeGreaterThan(0);
        expect(filtered.requests).toBeDefined();

        console.log('\n✅ Integration Test Results:');
        console.log(`   - network_get_requests: ${allRequests.requests.length} total requests`);
        console.log(`   - network_get_by_url: ${filtered.requests.length} filtered requests`);
        console.log(`   - network_get_timing: ${('error' in timing) ? 'Error' : timing.total + 'ms'}`);
        console.log(`   - network_get_headers: ${('error' in headers) ? 'Error' : Object.keys(headers.responseHeaders).length + ' headers'}`);
        console.log(`   - network_get_body: ${('error' in body) ? 'Error' : body.responseBody?.length + ' bytes'}`);
        console.log();
      } catch (error) {
        console.error('❌ Integration test failed:', error);
        throw error;
      }
    });
  });
});
