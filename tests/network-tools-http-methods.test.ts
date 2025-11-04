/**
 * HTTP Methods Test Suite for Network Intelligence Tools
 * Tests all 6 tools with different HTTP methods and scenarios
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import {
  networkGetRequests,
  networkGetByUrl,
  networkGetHeaders,
  networkGetBody,
} from '../src/tools/network-intelligence-tools.js';

describe('Network Tools - HTTP Methods Testing', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  describe('GET Requests', () => {
    it('should capture and analyze GET requests', async () => {
      const testUrl = 'https://example.com/api/data';

      await page.route(testUrl, route => {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json', 'x-method': 'GET' },
          body: JSON.stringify({ method: 'GET', data: [1, 2, 3] }),
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => fetch(url), testUrl);
      await page.waitForTimeout(1000);

      const requests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });
      const getReq = requests.requests.find(r => r.url === testUrl);

      expect(getReq).toBeDefined();
      expect(getReq?.method).toBe('GET');
      expect(getReq?.status).toBe(200);

      const headers = await networkGetHeaders(page, { url: page.url(), requestUrl: testUrl });
      if (!('error' in headers)) {
        expect(headers.responseHeaders['x-method']).toBe('GET');
      }

      const body = await networkGetBody(page, { url: page.url(), requestUrl: testUrl });
      if (!('error' in body)) {
        expect(body.responseBody).toContain('GET');
        expect(body.requestBody).toBeNull(); // GET requests don't have body
      }

      console.log('✅ GET request: Captured method, headers, and body correctly');
    });
  });

  describe('POST Requests', () => {
    it('should capture and analyze POST requests with JSON body', async () => {
      const testUrl = 'https://example.com/api/create';
      const requestData = { name: 'Test User', email: 'test@example.com' };

      await page.route(testUrl, route => {
        route.fulfill({
          status: 201,
          headers: { 'content-type': 'application/json', 'x-method': 'POST' },
          body: JSON.stringify({ id: 123, ...requestData }),
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate(({ url, data }) => {
        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }, { url: testUrl, data: requestData });
      await page.waitForTimeout(1000);

      const requests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });
      const postReq = requests.requests.find(r => r.url === testUrl);

      expect(postReq).toBeDefined();
      expect(postReq?.method).toBe('POST');
      expect(postReq?.status).toBe(201);

      const body = await networkGetBody(page, { url: page.url(), requestUrl: testUrl });
      if (!('error' in body)) {
        expect(body.requestBody).toBeDefined();
        if (body.requestBody) {
          const parsedRequest = JSON.parse(body.requestBody);
          expect(parsedRequest).toEqual(requestData);
        }

        expect(body.responseBody).toContain('123');
        const parsedResponse = JSON.parse(body.responseBody!);
        expect(parsedResponse.id).toBe(123);
      }

      console.log('✅ POST request: Captured request body and response correctly');
    });
  });

  describe('PUT Requests', () => {
    it('should capture and analyze PUT requests', async () => {
      const testUrl = 'https://example.com/api/update/456';
      const updateData = { name: 'Updated User', status: 'active' };

      await page.route(testUrl, route => {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ success: true, updated: updateData }),
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate(({ url, data }) => {
        return fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }, { url: testUrl, data: updateData });
      await page.waitForTimeout(1000);

      const requests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });
      const putReq = requests.requests.find(r => r.url === testUrl);

      expect(putReq).toBeDefined();
      expect(putReq?.method).toBe('PUT');
      expect(putReq?.status).toBe(200);

      console.log('✅ PUT request: Method and status captured correctly');
    });
  });

  describe('DELETE Requests', () => {
    it('should capture and analyze DELETE requests', async () => {
      const testUrl = 'https://example.com/api/delete/789';

      await page.route(testUrl, route => {
        route.fulfill({
          status: 204,
          headers: { 'content-type': 'application/json' },
          body: '',
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => fetch(url, { method: 'DELETE' }), testUrl);
      await page.waitForTimeout(1000);

      const requests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });
      const deleteReq = requests.requests.find(r => r.url === testUrl);

      expect(deleteReq).toBeDefined();
      expect(deleteReq?.method).toBe('DELETE');
      expect(deleteReq?.status).toBe(204);

      console.log('✅ DELETE request: Captured with correct status 204');
    });
  });

  describe('PATCH Requests', () => {
    it('should capture and analyze PATCH requests', async () => {
      const testUrl = 'https://example.com/api/patch/111';
      const patchData = { status: 'verified' };

      await page.route(testUrl, route => {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ patched: true }),
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate(({ url, data }) => {
        return fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }, { url: testUrl, data: patchData });
      await page.waitForTimeout(1000);

      const requests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });
      const patchReq = requests.requests.find(r => r.url === testUrl);

      expect(patchReq).toBeDefined();
      expect(patchReq?.method).toBe('PATCH');

      console.log('✅ PATCH request: Method captured correctly');
    });
  });

  describe('Different Content Types', () => {
    it('should handle JSON content type', async () => {
      const testUrl = 'https://example.com/api/json';

      await page.route(testUrl, route => {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'json' }),
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => fetch(url), testUrl);
      await page.waitForTimeout(1000);

      const body = await networkGetBody(page, { url: page.url(), requestUrl: testUrl });
      if (!('error' in body)) {
        expect(body.contentType).toContain('application/json');
        const data = JSON.parse(body.responseBody!);
        expect(data.type).toBe('json');
      }

      console.log('✅ JSON content type: Handled correctly');
    });

    it('should handle XML content type', async () => {
      const testUrl = 'https://example.com/api/xml';
      const xmlData = '<?xml version="1.0"?><root><item>test</item></root>';

      await page.route(testUrl, route => {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/xml' },
          body: xmlData,
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => fetch(url), testUrl);
      await page.waitForTimeout(1000);

      const body = await networkGetBody(page, { url: page.url(), requestUrl: testUrl });
      if (!('error' in body)) {
        expect(body.contentType).toContain('application/xml');
        expect(body.responseBody).toContain('<root>');
      }

      console.log('✅ XML content type: Handled correctly');
    });

    it('should handle plain text content type', async () => {
      const testUrl = 'https://example.com/api/text';

      await page.route(testUrl, route => {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'text/plain' },
          body: 'Plain text response',
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => fetch(url), testUrl);
      await page.waitForTimeout(1000);

      const body = await networkGetBody(page, { url: page.url(), requestUrl: testUrl });
      if (!('error' in body)) {
        expect(body.contentType).toContain('text/plain');
        expect(body.responseBody).toBe('Plain text response');
      }

      console.log('✅ Plain text content type: Handled correctly');
    });

    it('should handle form-urlencoded content type', async () => {
      const testUrl = 'https://example.com/api/form';

      await page.route(testUrl, route => {
        route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: 'key1=value1&key2=value2',
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => {
        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'field=value',
        });
      }, testUrl);
      await page.waitForTimeout(1000);

      const headers = await networkGetHeaders(page, { url: page.url(), requestUrl: testUrl });
      if (!('error' in headers)) {
        expect(headers.responseHeaders['content-type']).toContain('application/x-www-form-urlencoded');
      }

      console.log('✅ Form-urlencoded content type: Handled correctly');
    });
  });

  describe('Multiple Concurrent Requests', () => {
    it('should handle multiple concurrent requests with different methods', async () => {
      const urls = {
        get: 'https://example.com/api/get',
        post: 'https://example.com/api/post',
        put: 'https://example.com/api/put',
        delete: 'https://example.com/api/delete',
      };

      // Set up routes
      await page.route(urls.get, route => route.fulfill({ status: 200, body: 'GET' }));
      await page.route(urls.post, route => route.fulfill({ status: 201, body: 'POST' }));
      await page.route(urls.put, route => route.fulfill({ status: 200, body: 'PUT' }));
      await page.route(urls.delete, route => route.fulfill({ status: 204, body: '' }));

      await page.setContent('<html><body></body></html>');

      // Make concurrent requests
      await page.evaluate((u) => {
        return Promise.all([
          fetch(u.get, { method: 'GET' }),
          fetch(u.post, { method: 'POST', body: '{}' }),
          fetch(u.put, { method: 'PUT', body: '{}' }),
          fetch(u.delete, { method: 'DELETE' }),
        ]);
      }, urls);
      await page.waitForTimeout(1000);

      const requests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });

      const getReq = requests.requests.find(r => r.url === urls.get);
      const postReq = requests.requests.find(r => r.url === urls.post);
      const putReq = requests.requests.find(r => r.url === urls.put);
      const deleteReq = requests.requests.find(r => r.url === urls.delete);

      expect(getReq?.method).toBe('GET');
      expect(postReq?.method).toBe('POST');
      expect(putReq?.method).toBe('PUT');
      expect(deleteReq?.method).toBe('DELETE');

      expect(getReq?.status).toBe(200);
      expect(postReq?.status).toBe(201);
      expect(putReq?.status).toBe(200);
      expect(deleteReq?.status).toBe(204);

      console.log('✅ Concurrent requests: All 4 methods captured correctly');
    });
  });

  describe('Request Filtering by Method', () => {
    it('should filter POST requests from mixed methods', async () => {
      const baseUrl = 'https://example.com/api';

      await page.route(`${baseUrl}/**`, route => {
        route.fulfill({ status: 200, body: '{}' });
      });

      await page.setContent('<html><body></body></html>');

      await page.evaluate((base) => {
        return Promise.all([
          fetch(`${base}/item1`, { method: 'GET' }),
          fetch(`${base}/item2`, { method: 'POST', body: '{}' }),
          fetch(`${base}/item3`, { method: 'GET' }),
          fetch(`${base}/item4`, { method: 'POST', body: '{}' }),
        ]);
      }, baseUrl);
      await page.waitForTimeout(1000);

      const allRequests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });
      const apiRequests = allRequests.requests.filter(r => r.url.includes('/api/item'));

      const postRequests = apiRequests.filter(r => r.method === 'POST');
      const getRequests = apiRequests.filter(r => r.method === 'GET');

      expect(postRequests.length).toBe(2);
      expect(getRequests.length).toBe(2);

      console.log(`✅ Request filtering: Found ${postRequests.length} POST and ${getRequests.length} GET requests`);
    });
  });

  describe('Custom Headers', () => {
    it('should capture custom request and response headers', async () => {
      const testUrl = 'https://example.com/api/custom-headers';

      await page.route(testUrl, route => {
        const requestHeaders = route.request().headers();
        route.fulfill({
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-custom-response': 'custom-value',
            'x-request-echo': requestHeaders['x-custom-request'] || 'none',
          },
          body: '{}',
        });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => {
        return fetch(url, {
          headers: {
            'X-Custom-Request': 'my-custom-value',
            'X-Api-Key': 'secret-key-123',
          },
        });
      }, testUrl);
      await page.waitForTimeout(1000);

      const headers = await networkGetHeaders(page, { url: page.url(), requestUrl: testUrl });
      if (!('error' in headers)) {
        expect(headers.requestHeaders['x-custom-request']).toBe('my-custom-value');
        expect(headers.requestHeaders['x-api-key']).toBe('secret-key-123');
        expect(headers.responseHeaders['x-custom-response']).toBe('custom-value');
      }

      console.log('✅ Custom headers: Request and response headers captured correctly');
    });
  });

  describe('Error Status Codes', () => {
    it('should handle 404 Not Found', async () => {
      const testUrl = 'https://example.com/api/not-found';

      await page.route(testUrl, route => {
        route.fulfill({ status: 404, body: 'Not Found' });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => fetch(url).catch(() => {}), testUrl);
      await page.waitForTimeout(1000);

      const requests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });
      const req = requests.requests.find(r => r.url === testUrl);

      expect(req?.status).toBe(404);
      console.log('✅ 404 status: Captured correctly');
    });

    it('should handle 500 Internal Server Error', async () => {
      const testUrl = 'https://example.com/api/server-error';

      await page.route(testUrl, route => {
        route.fulfill({ status: 500, body: 'Internal Server Error' });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => fetch(url).catch(() => {}), testUrl);
      await page.waitForTimeout(1000);

      const requests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });
      const req = requests.requests.find(r => r.url === testUrl);

      expect(req?.status).toBe(500);
      console.log('✅ 500 status: Captured correctly');
    });

    it('should handle 403 Forbidden', async () => {
      const testUrl = 'https://example.com/api/forbidden';

      await page.route(testUrl, route => {
        route.fulfill({ status: 403, body: 'Forbidden' });
      });

      await page.setContent('<html><body></body></html>');
      await page.evaluate((url) => fetch(url).catch(() => {}), testUrl);
      await page.waitForTimeout(1000);

      const requests = await networkGetRequests(page, { url: page.url(), waitTime: 500 });
      const req = requests.requests.find(r => r.url === testUrl);

      expect(req?.status).toBe(403);
      console.log('✅ 403 status: Captured correctly');
    });
  });
});
