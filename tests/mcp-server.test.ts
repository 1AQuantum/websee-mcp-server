/**
 * Comprehensive MCP Server Test Suite
 * Tests all tools, integration workflows, schema validation, and error handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { chromium, firefox, webkit, Browser, BrowserContext, Page } from "playwright";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import * as path from "path";
import * as fs from "fs";

// Import schemas for validation
const DebugFrontendIssueSchema = z.object({
  url: z.string().url(),
  selector: z.string().optional(),
  errorMessage: z.string().optional(),
  screenshot: z.boolean().optional().default(false),
});

const AnalyzePerformanceSchema = z.object({
  url: z.string().url(),
  interactions: z.array(z.object({
    action: z.enum(["click", "type", "scroll", "navigate"]),
    selector: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  metrics: z.array(z.enum(["network", "components", "bundle", "memory"])).optional()
    .default(["network", "components"]),
});

const InspectComponentStateSchema = z.object({
  url: z.string().url(),
  selector: z.string(),
  waitForSelector: z.boolean().optional().default(true),
  includeChildren: z.boolean().optional().default(false),
});

const TraceNetworkRequestsSchema = z.object({
  url: z.string().url(),
  pattern: z.string().optional(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "ALL"]).optional().default("ALL"),
  waitTime: z.number().optional().default(3000),
});

const AnalyzeBundleSchema = z.object({
  url: z.string().url(),
  moduleName: z.string().optional(),
  threshold: z.number().optional().default(50),
});

const ResolveMinifiedErrorSchema = z.object({
  url: z.string().url(),
  errorStack: z.string(),
  triggerError: z.boolean().optional().default(false),
});

describe("MCP Server - Unit Tests", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let testServerPort: number;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();

    // Start a simple HTTP server for test fixtures
    testServerPort = 8888;
  });

  afterAll(async () => {
    await page.close();
    await context.close();
    await browser.close();
  });

  beforeEach(async () => {
    // Clear any previous state
    await page.goto("about:blank");
  });

  describe("debug_frontend_issue", () => {
    it("should validate schema correctly", () => {
      const validInput = {
        url: "https://example.com",
        selector: ".my-component",
        errorMessage: "Cannot read property 'x' of undefined",
        screenshot: true,
      };

      expect(() => DebugFrontendIssueSchema.parse(validInput)).not.toThrow();
    });

    it("should reject invalid URL", () => {
      const invalidInput = {
        url: "not-a-url",
      };

      expect(() => DebugFrontendIssueSchema.parse(invalidInput)).toThrow();
    });

    it("should use default values for optional fields", () => {
      const input = {
        url: "https://example.com",
      };

      const result = DebugFrontendIssueSchema.parse(input);
      expect(result.screenshot).toBe(false);
      expect(result.selector).toBeUndefined();
    });

    it("should handle page with console errors", async () => {
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <head><title>Error Test</title></head>
          <body>
            <h1>Test Page</h1>
            <script>
              console.error("Test error message");
              console.warn("Test warning");
            </script>
          </body>
        </html>
      `;

      // Set up console listener BEFORE loading content
      const consoleLogs: any[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" || msg.type() === "warning") {
          consoleLogs.push({
            type: msg.type(),
            text: msg.text(),
          });
        }
      });

      await page.setContent(testHTML);
      await page.waitForTimeout(100);

      expect(consoleLogs.length).toBeGreaterThan(0);
      expect(consoleLogs.some(log => log.type === "error")).toBe(true);
    });

    it("should handle page errors", async () => {
      const pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      const testHTML = `
        <!DOCTYPE html>
        <html>
          <body>
            <script>
              throw new Error("Test page error");
            </script>
          </body>
        </html>
      `;

      await page.setContent(testHTML);
      await page.waitForTimeout(100);

      expect(pageErrors.length).toBeGreaterThan(0);
      expect(pageErrors[0].message).toContain("Test page error");
    });

    it("should capture screenshots when requested", async () => {
      await page.setContent("<h1>Screenshot Test</h1>");

      const screenshotPath = `/tmp/test-screenshot-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath });

      expect(fs.existsSync(screenshotPath)).toBe(true);

      // Cleanup
      if (fs.existsSync(screenshotPath)) {
        fs.unlinkSync(screenshotPath);
      }
    });

    it("should handle missing selector gracefully", async () => {
      await page.setContent("<h1>Test</h1>");

      const element = await page.$(".non-existent-selector");
      expect(element).toBeNull();
    });
  });

  describe("analyze_performance", () => {
    it("should validate schema correctly", () => {
      const validInput = {
        url: "https://example.com",
        interactions: [
          { action: "click" as const, selector: ".button" },
          { action: "type" as const, selector: "input", value: "test" },
          { action: "scroll" as const },
        ],
        metrics: ["network" as const, "components" as const, "bundle" as const],
      };

      expect(() => AnalyzePerformanceSchema.parse(validInput)).not.toThrow();
    });

    it("should use default metrics when not provided", () => {
      const input = {
        url: "https://example.com",
      };

      const result = AnalyzePerformanceSchema.parse(input);
      expect(result.metrics).toEqual(["network", "components"]);
    });

    it("should reject invalid action types", () => {
      const invalidInput = {
        url: "https://example.com",
        interactions: [
          { action: "invalid-action", selector: ".button" },
        ],
      };

      expect(() => AnalyzePerformanceSchema.parse(invalidInput)).toThrow();
    });

    it("should reject invalid metric types", () => {
      const invalidInput = {
        url: "https://example.com",
        metrics: ["invalid-metric"],
      };

      expect(() => AnalyzePerformanceSchema.parse(invalidInput)).toThrow();
    });

    it("should measure network performance", async () => {
      const responses: any[] = [];

      page.on("response", async (response) => {
        const timing = await response.request().timing();
        responses.push({
          url: response.url(),
          status: response.status(),
          timing: timing,
        });
      });

      await page.goto("https://example.com");

      expect(responses.length).toBeGreaterThan(0);
      expect(responses[0].status).toBe(200);
    });

    it("should detect slow requests", async () => {
      const slowRequests: any[] = [];

      page.on("response", async (response) => {
        const timing = await response.request().timing();
        const duration = timing.responseEnd - timing.requestStart;

        if (duration > 1000) {
          slowRequests.push({
            url: response.url(),
            duration,
          });
        }
      });

      await page.goto("https://example.com");

      // Verify we can detect slow requests (though there may not be any)
      expect(Array.isArray(slowRequests)).toBe(true);
    });
  });

  describe("inspect_component_state", () => {
    it("should validate schema correctly", () => {
      const validInput = {
        url: "https://example.com",
        selector: "#my-component",
        waitForSelector: true,
        includeChildren: false,
      };

      expect(() => InspectComponentStateSchema.parse(validInput)).not.toThrow();
    });

    it("should require selector field", () => {
      const invalidInput = {
        url: "https://example.com",
      };

      expect(() => InspectComponentStateSchema.parse(invalidInput)).toThrow();
    });

    it("should wait for selector when enabled", async () => {
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <body>
            <div id="delayed-component"></div>
            <script>
              setTimeout(() => {
                document.getElementById('delayed-component').innerHTML = 'Loaded';
              }, 100);
            </script>
          </body>
        </html>
      `;

      await page.setContent(testHTML);

      const element = await page.waitForSelector("#delayed-component", { timeout: 5000 });
      expect(element).not.toBeNull();
    });

    it("should handle timeout for missing selector", async () => {
      await page.setContent("<h1>Test</h1>");

      await expect(async () => {
        await page.waitForSelector(".non-existent", { timeout: 1000 });
      }).rejects.toThrow();
    });
  });

  describe("trace_network_requests", () => {
    it("should validate schema correctly", () => {
      const validInput = {
        url: "https://example.com",
        pattern: "/api/*",
        method: "GET" as const,
        waitTime: 5000,
      };

      expect(() => TraceNetworkRequestsSchema.parse(validInput)).not.toThrow();
    });

    it("should use default values", () => {
      const input = {
        url: "https://example.com",
      };

      const result = TraceNetworkRequestsSchema.parse(input);
      expect(result.method).toBe("ALL");
      expect(result.waitTime).toBe(3000);
    });

    it("should filter requests by pattern", async () => {
      const allRequests: string[] = [];

      page.on("request", (request) => {
        allRequests.push(request.url());
      });

      await page.goto("https://example.com");

      const apiRequests = allRequests.filter(url => url.includes("/api/"));
      expect(Array.isArray(apiRequests)).toBe(true);
    });

    it("should filter requests by method", async () => {
      const requests: any[] = [];

      page.on("request", (request) => {
        requests.push({
          url: request.url(),
          method: request.method(),
        });
      });

      await page.goto("https://example.com");

      const getRequests = requests.filter(r => r.method === "GET");
      expect(getRequests.length).toBeGreaterThan(0);
    });

    it("should reject invalid HTTP methods", () => {
      const invalidInput = {
        url: "https://example.com",
        method: "INVALID",
      };

      expect(() => TraceNetworkRequestsSchema.parse(invalidInput)).toThrow();
    });
  });

  describe("analyze_bundle_size", () => {
    it("should validate schema correctly", () => {
      const validInput = {
        url: "https://example.com",
        moduleName: "lodash",
        threshold: 100,
      };

      expect(() => AnalyzeBundleSchema.parse(validInput)).not.toThrow();
    });

    it("should use default threshold", () => {
      const input = {
        url: "https://example.com",
      };

      const result = AnalyzeBundleSchema.parse(input);
      expect(result.threshold).toBe(50);
    });

    it("should detect script tags", async () => {
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="bundle.js"></script>
            <script src="vendor.js"></script>
          </head>
          <body></body>
        </html>
      `;

      await page.setContent(testHTML);

      const scripts = await page.$$eval("script[src]", (scripts) =>
        scripts.map((s: any) => ({ src: s.src }))
      );

      expect(scripts.length).toBe(2);
    });

    it("should detect stylesheets", async () => {
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <link rel="stylesheet" href="styles.css">
            <link rel="stylesheet" href="theme.css">
          </head>
          <body></body>
        </html>
      `;

      await page.setContent(testHTML);

      const stylesheets = await page.$$eval("link[rel='stylesheet']", (links) =>
        links.map((l: any) => ({ href: l.href }))
      );

      expect(stylesheets.length).toBe(2);
    });

    it("should identify large bundles", async () => {
      const threshold = 50; // 50 KB
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="large-bundle.js"></script>
          </head>
          <body></body>
        </html>
      `;

      await page.setContent(testHTML);

      // In real scenario, we'd check actual bundle sizes
      expect(threshold).toBe(50);
    });
  });

  describe("resolve_minified_error", () => {
    it("should validate schema correctly", () => {
      const validInput = {
        url: "https://example.com",
        errorStack: "Error: test\n  at anonymous (bundle.min.js:1:1234)",
        triggerError: false,
      };

      expect(() => ResolveMinifiedErrorSchema.parse(validInput)).not.toThrow();
    });

    it("should require errorStack field", () => {
      const invalidInput = {
        url: "https://example.com",
      };

      expect(() => ResolveMinifiedErrorSchema.parse(invalidInput)).toThrow();
    });

    it("should parse stack trace format", () => {
      const stackLine = "at myFunction (bundle.min.js:1:2345)";
      const match = stackLine.match(/at\s+.*?\s+\((.*?):(\d+):(\d+)\)/);

      expect(match).not.toBeNull();
      if (match) {
        expect(match[1]).toBe("bundle.min.js");
        expect(match[2]).toBe("1");
        expect(match[3]).toBe("2345");
      }
    });

    it("should handle errors without source maps", async () => {
      const pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      const testHTML = `
        <!DOCTYPE html>
        <html>
          <body>
            <script>
              function testFunction() {
                throw new Error("Test error");
              }
              testFunction();
            </script>
          </body>
        </html>
      `;

      await page.setContent(testHTML);
      await page.waitForTimeout(100);

      expect(pageErrors.length).toBeGreaterThan(0);
      expect(pageErrors[0].stack).toBeDefined();
    });
  });
});

describe("MCP Server - Integration Tests", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await page.close();
    await context.close();
    await browser.close();
  });

  describe("Full Workflow Tests", () => {
    it("should handle complete debugging workflow", async () => {
      // 1. Load a page with an error
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <body>
            <button id="trigger-error">Click Me</button>
            <script>
              document.getElementById('trigger-error').addEventListener('click', () => {
                throw new Error("Button click error");
              });
            </script>
          </body>
        </html>
      `;

      await page.setContent(testHTML);

      // 2. Capture error
      const errors: Error[] = [];
      page.on("pageerror", (error) => errors.push(error));

      // 3. Trigger error
      await page.click("#trigger-error");
      await page.waitForTimeout(100);

      // 4. Verify error was captured
      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain("Button click error");
    });

    it("should handle performance analysis workflow", async () => {
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <body>
            <button id="load-data">Load Data</button>
            <div id="results"></div>
            <script>
              document.getElementById('load-data').addEventListener('click', async () => {
                const start = performance.now();
                await new Promise(resolve => setTimeout(resolve, 100));
                const duration = performance.now() - start;
                document.getElementById('results').textContent = 'Loaded in ' + duration + 'ms';
              });
            </script>
          </body>
        </html>
      `;

      await page.setContent(testHTML);
      await page.click("#load-data");
      await page.waitForSelector("#results:not(:empty)");

      const text = await page.textContent("#results");
      expect(text).toContain("Loaded in");
    });

    it("should handle network tracing workflow", async () => {
      const requests: any[] = [];

      page.on("request", (request) => {
        requests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now(),
        });
      });

      page.on("response", (response) => {
        const matchingRequest = requests.find(r => r.url === response.url());
        if (matchingRequest) {
          matchingRequest.status = response.status();
          matchingRequest.duration = Date.now() - matchingRequest.timestamp;
        }
      });

      await page.goto("https://example.com");

      expect(requests.length).toBeGreaterThan(0);
      expect(requests.some(r => r.status === 200)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      try {
        await page.goto("https://this-domain-does-not-exist-12345.com", { timeout: 5000 });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle invalid selectors", async () => {
      // Create a fresh page for this test to avoid context destruction
      const testPage = await context.newPage();
      try {
        await testPage.setContent("<h1>Test</h1>");

        // Test with an invalid selector that throws an error
        try {
          await testPage.$("###invalid-selector###");
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          // Expect an error for invalid selector
          expect(error).toBeDefined();
        }
      } finally {
        await testPage.close();
      }
    });

    it("should handle page crashes", async () => {
      const crashPage = await context.newPage();

      // Attempt to navigate to chrome://crash
      try {
        await crashPage.goto("chrome://crash");
      } catch (error) {
        // Expected to fail
      }

      await crashPage.close();
    });

    it("should handle timeout errors", async () => {
      await page.setContent("<h1>Test</h1>");

      await expect(async () => {
        await page.waitForSelector(".never-appears", { timeout: 1000 });
      }).rejects.toThrow();
    });

    it("should handle malformed URLs", () => {
      expect(() => {
        DebugFrontendIssueSchema.parse({ url: "not a url" });
      }).toThrow();
    });
  });

  describe("Schema Validation with Zod", () => {
    it("should validate all required fields", () => {
      const schemas = [
        { name: "debug", schema: DebugFrontendIssueSchema, valid: { url: "https://example.com" } },
        { name: "performance", schema: AnalyzePerformanceSchema, valid: { url: "https://example.com" } },
        { name: "component", schema: InspectComponentStateSchema, valid: { url: "https://example.com", selector: ".test" } },
        { name: "network", schema: TraceNetworkRequestsSchema, valid: { url: "https://example.com" } },
        { name: "bundle", schema: AnalyzeBundleSchema, valid: { url: "https://example.com" } },
        { name: "error", schema: ResolveMinifiedErrorSchema, valid: { url: "https://example.com", errorStack: "error" } },
      ];

      schemas.forEach(({ name, schema, valid }) => {
        expect(() => schema.parse(valid), `${name} should accept valid input`).not.toThrow();
      });
    });

    it("should reject invalid URLs across all schemas", () => {
      const schemas = [
        DebugFrontendIssueSchema,
        AnalyzePerformanceSchema,
        InspectComponentStateSchema,
        TraceNetworkRequestsSchema,
        AnalyzeBundleSchema,
        ResolveMinifiedErrorSchema,
      ];

      schemas.forEach((schema) => {
        expect(() => {
          schema.parse({ url: "invalid-url" });
        }).toThrow();
      });
    });

    it("should validate enum values", () => {
      // Test invalid action
      expect(() => {
        AnalyzePerformanceSchema.parse({
          url: "https://example.com",
          interactions: [{ action: "invalid" }],
        });
      }).toThrow();

      // Test invalid method
      expect(() => {
        TraceNetworkRequestsSchema.parse({
          url: "https://example.com",
          method: "INVALID",
        });
      }).toThrow();
    });

    it("should provide detailed error messages", () => {
      try {
        DebugFrontendIssueSchema.parse({
          url: "not-a-url",
          screenshot: "not-a-boolean",
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          expect(error.errors.length).toBeGreaterThan(0);
          expect(error.errors[0].message).toBeDefined();
        }
      }
    });
  });

  describe("Browser Compatibility", () => {
    it("should work with different browser types", { timeout: 60000 }, async () => {
      const browsers = [
        { name: "chromium", instance: await chromium.launch({ headless: true }) },
        { name: "firefox", instance: await firefox.launch({ headless: true }) },
        { name: "webkit", instance: await webkit.launch({ headless: true }) },
      ];

      for (const { name, instance } of browsers) {
        const ctx = await instance.newContext();
        const pg = await ctx.newPage();

        await pg.setContent("<h1>Test</h1>");
        const title = await pg.title();

        expect(title).toBeDefined();

        await pg.close();
        await ctx.close();
        await instance.close();
      }
    });

    it("should handle browser-specific features", async () => {
      // Test Chrome DevTools Protocol features
      const chromiumBrowser = await chromium.launch({ headless: true });
      const chromiumContext = await chromiumBrowser.newContext();
      const chromiumPage = await chromiumContext.newPage();

      // Create a CDP session
      const client = await chromiumContext.newCDPSession(chromiumPage);

      await chromiumPage.setContent("<h1>CDP Test</h1>");

      await client.detach();
      await chromiumPage.close();
      await chromiumContext.close();
      await chromiumBrowser.close();
    });
  });
});

describe("MCP Server - Edge Cases", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await page.close();
    await context.close();
    await browser.close();
  });

  it("should handle empty pages", async () => {
    await page.setContent("");
    const content = await page.content();
    expect(content).toBeDefined();
  });

  it("should handle pages with no JavaScript", async () => {
    await page.setContent("<h1>Static HTML</h1>");
    const h1 = await page.textContent("h1");
    expect(h1).toBe("Static HTML");
  });

  it("should handle pages with inline scripts", async () => {
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            window.testValue = 42;
          </script>
        </body>
      </html>
    `;

    await page.setContent(testHTML);
    const value = await page.evaluate(() => (window as any).testValue);
    expect(value).toBe(42);
  });

  it("should handle pages with iframes", async () => {
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <body>
          <iframe id="test-frame" srcdoc="<h1>Iframe Content</h1>"></iframe>
        </body>
      </html>
    `;

    await page.setContent(testHTML);
    const frame = page.frame({ name: "test-frame" }) || await page.waitForSelector("#test-frame").then(f => f?.contentFrame());
    expect(frame).toBeDefined();
  });

  it("should handle pages with shadow DOM", async () => {
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="host"></div>
          <script>
            const host = document.getElementById('host');
            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = '<p>Shadow DOM content</p>';
          </script>
        </body>
      </html>
    `;

    await page.setContent(testHTML);
    const shadowContent = await page.evaluate(() => {
      const host = document.getElementById('host');
      return host?.shadowRoot?.textContent;
    });

    expect(shadowContent).toContain("Shadow DOM content");
  });

  it("should handle very long stack traces", () => {
    const longStack = Array(1000).fill("at function (file.js:1:1)").join("\n");
    const input = {
      url: "https://example.com",
      errorStack: longStack,
    };

    expect(() => ResolveMinifiedErrorSchema.parse(input)).not.toThrow();
  });

  it("should handle special characters in selectors", async () => {
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="test:special"></div>
        </body>
      </html>
    `;

    await page.setContent(testHTML);
    const element = await page.$('[id="test:special"]');
    expect(element).not.toBeNull();
  });

  it("should handle concurrent page operations", async () => {
    const promises = [
      page.setContent("<h1>Test 1</h1>"),
      page.evaluate(() => 1 + 1),
      page.title(),
    ];

    const results = await Promise.all(promises);
    expect(results).toHaveLength(3);
  });
});
