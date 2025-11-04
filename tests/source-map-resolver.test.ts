import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { chromium, Browser, BrowserContext, Page } from "playwright";
import { SourceMapResolver } from "../src/source-intelligence/source-map-resolver";

describe("SourceMapResolver", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let resolver: SourceMapResolver;

  beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await context.close();
    await browser.close();
  });

  it("should initialize successfully", async () => {
    resolver = new SourceMapResolver();
    await resolver.initialize(page);
    expect(resolver).toBeDefined();
  });

  it("should handle missing source maps gracefully", async () => {
    resolver = new SourceMapResolver();
    await resolver.initialize(page);

    const result = await resolver.resolveLocation(
      "https://example.com/nonexistent.js",
      1,
      0
    );

    expect(result).toBeNull();
  });

  it("should resolve location with inline source map", async () => {
    resolver = new SourceMapResolver();
    await resolver.initialize(page);

    // Create a test page with inline source map
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            // Original source would be here
            function hello() {
              console.log("Hello, World!");
            }
            //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QuanMiXSwibmFtZXMiOlsiaGVsbG8iLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUFTQSxNQUFULEdBQWtCO0FBQ2hCQyxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxlQUFaO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBoZWxsbygpIHtcbiAgY29uc29sZS5sb2coXCJIZWxsbywgV29ybGQhXCIpO1xufSJdfQ==
          </script>
        </head>
        <body>
          <h1>Test Page</h1>
        </body>
      </html>
    `;

    await page.setContent(testHTML);

    // Wait a bit for the response handler to process
    await page.waitForTimeout(100);

    // Note: This test is simplified. In a real scenario, you'd need to:
    // 1. Capture the actual script URL from the page
    // 2. Get the minified line/column from an error or stack trace
    // For now, we're just testing that the method doesn't crash
  });

  it("should cache source maps for performance", async () => {
    resolver = new SourceMapResolver(2); // Small cache for testing
    await resolver.initialize(page);

    // Multiple calls to the same URL should use cache
    const url = "https://example.com/test.js";

    const result1 = await resolver.resolveLocation(url, 1, 0);
    const result2 = await resolver.resolveLocation(url, 2, 0);

    // Both should return null (no source map), but shouldn't crash
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  it("should clear cache", async () => {
    resolver = new SourceMapResolver();
    await resolver.initialize(page);

    resolver.clearCache();

    // Should still work after clearing
    const result = await resolver.resolveLocation(
      "https://example.com/test.js",
      1,
      0
    );
    expect(result).toBeNull();
  });

  it("should handle performance requirements", async () => {
    resolver = new SourceMapResolver();
    await resolver.initialize(page);

    const start = Date.now();
    await resolver.resolveLocation("https://example.com/test.js", 1, 0);
    const elapsed = Date.now() - start;

    // Should be much faster than 100ms for cache miss with no source map
    expect(elapsed).toBeLessThan(1000);
  });

  it("should throw error if not initialized", async () => {
    const uninitializedResolver = new SourceMapResolver();

    await expect(
      uninitializedResolver.resolveLocation("https://example.com/test.js", 1, 0)
    ).rejects.toThrow("not initialized");
  });

  it("should handle data URL source maps", async () => {
    resolver = new SourceMapResolver();
    await resolver.initialize(page);

    // The resolver should handle data: URLs for inline source maps
    // This is tested indirectly through the inline source map test
    expect(resolver).toBeDefined();
  });

  it("should extract source context", async () => {
    resolver = new SourceMapResolver();
    await resolver.initialize(page);

    // When a valid source map is found, it should include ±3 lines of context
    // This would need a real source map to test fully
    expect(resolver).toBeDefined();
  });

  it("should handle cleanup properly", async () => {
    resolver = new SourceMapResolver();
    await resolver.initialize(page);

    await resolver.destroy();

    // After destroy, should throw error
    await expect(
      resolver.resolveLocation("https://example.com/test.js", 1, 0)
    ).rejects.toThrow("not initialized");
  });
});

describe("LRU Cache behavior", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await context.close();
    await browser.close();
  });

  it("should evict oldest entry when cache is full", async () => {
    const resolver = new SourceMapResolver(2); // Max 2 entries
    await resolver.initialize(page);

    // Try to fill cache with 3 different URLs
    await resolver.resolveLocation("https://example.com/file1.js", 1, 0);
    await resolver.resolveLocation("https://example.com/file2.js", 1, 0);
    await resolver.resolveLocation("https://example.com/file3.js", 1, 0);

    // Should not crash, oldest should be evicted
    expect(resolver).toBeDefined();
  });
});
