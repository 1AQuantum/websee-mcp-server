/**
 * Test Suite for Network Tracer Agent
 * Tests network request interception and stack trace capture
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import { NetworkTracer } from "../src/source-intelligence/network-tracer";

describe("NetworkTracer", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let tracer: NetworkTracer;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
    tracer = new NetworkTracer();

    // Set up a basic HTML page to avoid URL parsing errors
    await page.goto("data:text/html,<html><body><h1>Test Page</h1></body></html>");
  });

  afterEach(async () => {
    if (tracer) {
      await tracer.destroy();
    }
    await context.close();
  });

  describe("Initialization", () => {
    it("should initialize successfully", async () => {
      await tracer.initialize(page);
      expect(tracer).toBeDefined();
    });

    it("should inject interception scripts", async () => {
      await tracer.initialize(page);

      // Check if fetch is wrapped
      const hasFetchWrapper = await page.evaluate(() => {
        return window.fetch.toString().includes("__websee");
      });
      expect(hasFetchWrapper).toBe(true);
    });
  });

  describe("Fetch Interception", () => {
    it("should capture fetch requests", async () => {
      await tracer.initialize(page);

      // Create test server response
      await page.route("**/api/test", route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true })
        });
      });

      // Make fetch request
      await page.evaluate(() => {
        return fetch("/api/test");
      });

      // Wait for trace to be captured
      await page.waitForTimeout(100);

      const traces = tracer.getTraces();
      expect(traces.length).toBeGreaterThan(0);
      expect(traces[0].url).toContain("/api/test");
      expect(traces[0].method).toBe("GET");
    });

    it("should capture stack traces for fetch", async () => {
      await tracer.initialize(page);

      await page.route("**/api/stack", route => {
        route.fulfill({ status: 200 });
      });

      await page.evaluate(() => {
        function makeRequest() {
          return fetch("/api/stack");
        }
        return makeRequest();
      });

      await page.waitForTimeout(100);

      const traces = tracer.getTraces();
      const trace = traces.find(t => t.url.includes("/api/stack"));

      expect(trace).toBeDefined();
      expect(trace!.stackTrace).toBeDefined();
      expect(trace!.stackTrace.length).toBeGreaterThan(0);
      expect(trace!.initiator.type).toBe("fetch");
    });

    it("should track POST requests with correct method", async () => {
      await tracer.initialize(page);

      await page.route("**/api/post", route => {
        route.fulfill({ status: 201 });
      });

      await page.evaluate(() => {
        return fetch("/api/post", {
          method: "POST",
          body: JSON.stringify({ data: "test" }),
          headers: { "Content-Type": "application/json" }
        });
      });

      await page.waitForTimeout(100);

      const traces = tracer.getTraces();
      const trace = traces.find(t => t.url.includes("/api/post"));

      expect(trace).toBeDefined();
      expect(trace!.method).toBe("POST");
    });
  });

  describe("XHR Interception", () => {
    it("should capture XMLHttpRequest", async () => {
      await tracer.initialize(page);

      await page.route("**/api/xhr", route => {
        route.fulfill({ status: 200, body: "xhr response" });
      });

      await page.evaluate(() => {
        return new Promise(resolve => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", "/api/xhr");
          xhr.onload = resolve;
          xhr.send();
        });
      });

      await page.waitForTimeout(100);

      const traces = tracer.getTraces();
      const trace = traces.find(t => t.url.includes("/api/xhr"));

      expect(trace).toBeDefined();
      expect(trace!.initiator.type).toBe("xhr");
    });

    it("should capture XHR stack traces", async () => {
      await tracer.initialize(page);

      await page.route("**/api/xhr-stack", route => {
        route.fulfill({ status: 200 });
      });

      await page.evaluate(() => {
        function xhrRequest() {
          return new Promise(resolve => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "/api/xhr-stack");
            xhr.onload = resolve;
            xhr.send();
          });
        }
        return xhrRequest();
      });

      await page.waitForTimeout(100);

      const traces = tracer.getTraces();
      const trace = traces.find(t => t.url.includes("/api/xhr-stack"));

      expect(trace).toBeDefined();
      expect(trace!.stackTrace).toBeDefined();
      expect(trace!.stackTrace.length).toBeGreaterThan(0);
    });
  });

  describe("Trace Management", () => {
    it("should filter traces by URL pattern", async () => {
      await tracer.initialize(page);

      // Make multiple requests
      await page.route("**/*", route => route.fulfill({ status: 200 }));

      await page.evaluate(() => {
        return Promise.all([
          fetch("/api/users"),
          fetch("/api/posts"),
          fetch("/static/image.png")
        ]);
      });

      await page.waitForTimeout(100);

      const apiTraces = tracer.getTracesForUrl("/api/*");
      expect(apiTraces.length).toBe(2);
      expect(apiTraces.every(t => t.url.includes("/api/"))).toBe(true);
    });

    it("should clear traces", async () => {
      await tracer.initialize(page);

      await page.route("**/api/clear", route => {
        route.fulfill({ status: 200 });
      });

      await page.evaluate(() => fetch("/api/clear"));
      await page.waitForTimeout(100);

      expect(tracer.getTraces().length).toBeGreaterThan(0);

      tracer.clearTraces();
      expect(tracer.getTraces().length).toBe(0);
    });
  });

  describe("Summary Statistics", () => {
    it("should generate summary statistics", async () => {
      await tracer.initialize(page);

      await page.route("**/*", route => {
        route.fulfill({ status: 200 });
      });

      // Make various requests
      await page.evaluate(() => {
        return Promise.all([
          fetch("/api/get1"),
          fetch("/api/get2", { method: "GET" }),
          fetch("/api/post1", { method: "POST" }),
          fetch("/api/delete1", { method: "DELETE" })
        ]);
      });

      await page.waitForTimeout(200);

      const summary = tracer.getSummary();

      expect(summary.totalRequests).toBe(4);
      expect(summary.byMethod["GET"]).toBe(2);
      expect(summary.byMethod["POST"]).toBe(1);
      expect(summary.byMethod["DELETE"]).toBe(1);
    });

    it("should track response status codes", async () => {
      await tracer.initialize(page);

      await page.route("**/success", route => {
        route.fulfill({ status: 200 });
      });
      await page.route("**/notfound", route => {
        route.fulfill({ status: 404 });
      });
      await page.route("**/error", route => {
        route.fulfill({ status: 500 });
      });

      await page.evaluate(() => {
        return Promise.all([
          fetch("/success"),
          fetch("/notfound"),
          fetch("/error")
        ]);
      });

      await page.waitForTimeout(200);

      const summary = tracer.getSummary();
      expect(summary.byStatus[200]).toBe(1);
      expect(summary.byStatus[404]).toBe(1);
      expect(summary.byStatus[500]).toBe(1);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup properly on destroy", async () => {
      await tracer.initialize(page);

      await page.route("**/cleanup", route => {
        route.fulfill({ status: 200 });
      });

      await page.evaluate(() => fetch("/cleanup"));
      await page.waitForTimeout(100);

      expect(tracer.getTraces().length).toBeGreaterThan(0);

      await tracer.destroy();
      expect(tracer.getTraces().length).toBe(0);
    });
  });
});

describe("NetworkTracer Error Handling", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let tracer: NetworkTracer;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
    tracer = new NetworkTracer();

    // Set up a basic HTML page to avoid URL parsing errors
    await page.goto("data:text/html,<html><body><h1>Test Page</h1></body></html>");
  });

  afterEach(async () => {
    if (tracer) {
      await tracer.destroy();
    }
    await context.close();
  });

  it("should handle network errors gracefully", async () => {
    await tracer.initialize(page);

    // Simulate network error
    await page.route("**/error", route => {
      route.abort();
    });

    const result = await page.evaluate(() => {
      return fetch("/error").then(() => "success").catch(() => "error");
    });

    expect(result).toBe("error");

    // Tracer should still function
    expect(() => tracer.getTraces()).not.toThrow();
  });

  it("should parse malformed stack traces safely", async () => {
    await tracer.initialize(page);

    // This shouldn't throw
    expect(() => tracer.getTraces()).not.toThrow();
  });
});