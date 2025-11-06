/**
 * Performance Benchmarks for MCP Server
 * Tests performance characteristics and ensures tools meet performance requirements
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, firefox, webkit, Browser, BrowserContext, Page } from "playwright";
import { SourceIntelligenceLayer } from "../src/index.js";
import * as path from "path";
import * as fs from "fs";

interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  passed: boolean;
  threshold: number;
}

describe("MCP Server - Performance Benchmarks", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  const benchmarkResults: BenchmarkResult[] = [];

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await page.close();
    await context.close();
    await browser.close();

    // Print benchmark summary
    console.log("\n" + "=".repeat(80));
    console.log("PERFORMANCE BENCHMARK RESULTS");
    console.log("=".repeat(80));

    benchmarkResults.forEach((result) => {
      const status = result.passed ? "✓ PASS" : "✗ FAIL";
      console.log(`\n${status} ${result.name}`);
      console.log(`  Average: ${result.avgDuration.toFixed(2)}ms (threshold: ${result.threshold}ms)`);
      console.log(`  Min: ${result.minDuration.toFixed(2)}ms | Max: ${result.maxDuration.toFixed(2)}ms`);
      console.log(`  Iterations: ${result.iterations}`);
    });

    console.log("\n" + "=".repeat(80));

    const passedCount = benchmarkResults.filter(r => r.passed).length;
    const totalCount = benchmarkResults.length;
    console.log(`\nPassed: ${passedCount}/${totalCount}`);

    if (passedCount < totalCount) {
      console.log("\n⚠️  Some benchmarks failed to meet performance thresholds");
    } else {
      console.log("\n✓ All benchmarks passed!");
    }
  });

  async function benchmark(
    name: string,
    fn: () => Promise<void>,
    options: { iterations?: number; threshold?: number } = {}
  ): Promise<BenchmarkResult> {
    const iterations = options.iterations || 10;
    const threshold = options.threshold || 1000; // Default 1 second
    const durations: number[] = [];

    // Warmup
    await fn();

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const duration = performance.now() - start;
      durations.push(duration);
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const passed = avgDuration <= threshold;

    const result: BenchmarkResult = {
      name,
      duration: avgDuration,
      iterations,
      avgDuration,
      minDuration,
      maxDuration,
      passed,
      threshold,
    };

    benchmarkResults.push(result);
    return result;
  }

  describe("Tool Performance", () => {
    it("should initialize SourceIntelligenceLayer quickly", async () => {
      const result = await benchmark(
        "SourceIntelligenceLayer initialization",
        async () => {
          const intelligence = new SourceIntelligenceLayer();
          await intelligence.initialize(page);
          await intelligence.destroy();
        },
        { iterations: 5, threshold: 500 }
      );

      expect(result.avgDuration).toBeLessThan(500);
    });

    it("should resolve source maps within performance budget", async () => {
      const intelligence = new SourceIntelligenceLayer();
      await intelligence.initialize(page);

      const testHTML = `
        <!DOCTYPE html>
        <html>
          <body>
            <script>
              function test() { console.log('test'); }
              test();
            </script>
          </body>
        </html>
      `;

      await page.setContent(testHTML);

      const result = await benchmark(
        "Source map resolution",
        async () => {
          await intelligence.resolveSourceLocation(
            "https://example.com/bundle.js",
            1,
            100
          );
        },
        { iterations: 20, threshold: 50 }
      );

      await intelligence.destroy();
      expect(result.avgDuration).toBeLessThan(50);
    });

    it("should extract component tree efficiently", async () => {
      const intelligence = new SourceIntelligenceLayer();
      await intelligence.initialize(page);

      // Load React test fixture
      const reactFixture = path.join(__dirname, "fixtures", "react-app-with-errors.html");
      if (fs.existsSync(reactFixture)) {
        await page.goto(`file://${reactFixture}`);
        await page.waitForTimeout(1000); // Wait for React to render

        const result = await benchmark(
          "Component tree extraction",
          async () => {
            await intelligence.getComponentTree();
          },
          { iterations: 10, threshold: 200 }
        );

        expect(result.avgDuration).toBeLessThan(200);
      }

      await intelligence.destroy();
    });

    it("should trace network requests with minimal overhead", async () => {
      const intelligence = new SourceIntelligenceLayer();
      await intelligence.initialize(page);

      await page.goto("https://example.com");

      const result = await benchmark(
        "Network trace retrieval",
        async () => {
          intelligence.getNetworkTraces();
        },
        { iterations: 50, threshold: 10 }
      );

      await intelligence.destroy();
      expect(result.avgDuration).toBeLessThan(10);
    });

    it("should handle page navigation efficiently", async () => {
      const result = await benchmark(
        "Page navigation",
        async () => {
          await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
        },
        { iterations: 3, threshold: 3000 }
      );

      expect(result.avgDuration).toBeLessThan(3000);
    });

    it("should capture screenshots quickly", async () => {
      await page.setContent("<h1>Screenshot Test</h1>");

      const result = await benchmark(
        "Screenshot capture",
        async () => {
          const screenshotPath = `/tmp/bench-${Date.now()}.png`;
          await page.screenshot({ path: screenshotPath });
          if (fs.existsSync(screenshotPath)) {
            fs.unlinkSync(screenshotPath);
          }
        },
        { iterations: 5, threshold: 200 }
      );

      expect(result.avgDuration).toBeLessThan(200);
    });
  });

  describe("Memory Performance", () => {
    it("should not leak memory during repeated operations", async () => {
      const intelligence = new SourceIntelligenceLayer();
      await intelligence.initialize(page);

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const measurements: number[] = [];

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await page.setContent(`<div id="test-${i}">Test ${i}</div>`);
        intelligence.getNetworkTraces();

        if (i % 10 === 0 && (performance as any).memory) {
          measurements.push((performance as any).memory.usedJSHeapSize);
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;
      const memoryGrowthMB = memoryGrowth / 1024 / 1024;

      // Memory growth should be reasonable (< 50 MB for 100 operations)
      expect(memoryGrowthMB).toBeLessThan(50);

      await intelligence.destroy();
    });

    it("should cleanup resources properly", async () => {
      const intelligence = new SourceIntelligenceLayer();
      await intelligence.initialize(page);

      await page.setContent("<h1>Test</h1>");
      intelligence.getNetworkTraces();

      const beforeDestroy = (performance as any).memory?.usedJSHeapSize || 0;
      await intelligence.destroy();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const afterDestroy = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory should not increase significantly after destroy
      // (allowing some variance for browser overhead)
      const increase = afterDestroy - beforeDestroy;
      const increaseMB = increase / 1024 / 1024;

      expect(increaseMB).toBeLessThan(10);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent page operations", async () => {
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage(),
      ]);

      const result = await benchmark(
        "Concurrent page operations",
        async () => {
          await Promise.all(
            pages.map((p, i) =>
              p.setContent(`<h1>Page ${i}</h1>`)
            )
          );
        },
        { iterations: 5, threshold: 300 }
      );

      await Promise.all(pages.map(p => p.close()));
      expect(result.avgDuration).toBeLessThan(300);
    });

    it("should handle multiple intelligence layers", async () => {
      const layers = [
        new SourceIntelligenceLayer(),
        new SourceIntelligenceLayer(),
        new SourceIntelligenceLayer(),
      ];

      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage(),
      ]);

      const result = await benchmark(
        "Multiple intelligence layers",
        async () => {
          await Promise.all(
            layers.map((layer, i) => layer.initialize(pages[i]))
          );
          await Promise.all(layers.map(layer => layer.destroy()));
        },
        { iterations: 3, threshold: 1000 }
      );

      await Promise.all(pages.map(p => p.close()));
      expect(result.avgDuration).toBeLessThan(1000);
    });
  });

  describe("Large Dataset Performance", () => {
    it("should handle pages with many elements", async () => {
      const largeHTML = `
        <!DOCTYPE html>
        <html>
          <body>
            ${Array(1000).fill(0).map((_, i) =>
              `<div id="element-${i}">Element ${i}</div>`
            ).join('')}
          </body>
        </html>
      `;

      const result = await benchmark(
        "Large page rendering",
        async () => {
          await page.setContent(largeHTML);
        },
        { iterations: 3, threshold: 500 }
      );

      expect(result.avgDuration).toBeLessThan(500);
    });

    it("should handle many network traces", async () => {
      const intelligence = new SourceIntelligenceLayer();
      await intelligence.initialize(page);

      // Simulate many network requests
      await page.goto("https://example.com");
      await page.waitForTimeout(1000);

      const result = await benchmark(
        "Large network trace retrieval",
        async () => {
          const traces = intelligence.getNetworkTraces();
          // Process traces
          traces.forEach(trace => {
            const duration = trace.duration || 0;
            const status = trace.status || 0;
          });
        },
        { iterations: 50, threshold: 20 }
      );

      await intelligence.destroy();
      expect(result.avgDuration).toBeLessThan(20);
    });
  });

  describe("Browser Compatibility Performance", () => {
    it("should perform similarly across browsers", { timeout: 60000 }, async () => {
      const browsers = [
        { name: "chromium", instance: await chromium.launch({ headless: true }) },
        { name: "firefox", instance: await firefox.launch({ headless: true }) },
        { name: "webkit", instance: await webkit.launch({ headless: true }) },
      ];

      const results: Record<string, number> = {};

      for (const { name, instance } of browsers) {
        const ctx = await instance.newContext();
        const pg = await ctx.newPage();

        const start = performance.now();
        await pg.goto("https://example.com", { waitUntil: "domcontentloaded" });
        await pg.waitForLoadState("networkidle");
        const intelligence = new SourceIntelligenceLayer();
        await intelligence.initialize(pg);
        await intelligence.destroy();
        const duration = performance.now() - start;

        results[name] = duration;

        await pg.close();
        await ctx.close();
        await instance.close();
      }

      // All browsers should complete within reasonable time
      Object.entries(results).forEach(([name, duration]) => {
        expect(duration, `${name} initialization`).toBeLessThan(2000);
      });

      // Performance variance should not be too large
      const durations = Object.values(results);
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const variance = ((maxDuration - minDuration) / minDuration) * 100;

      // Variance should be less than 200%
      expect(variance).toBeLessThan(200);
    });
  });

  describe("Error Handling Performance", () => {
    it("should handle errors without performance degradation", async () => {
      const intelligence = new SourceIntelligenceLayer();
      await intelligence.initialize(page);

      const result = await benchmark(
        "Error handling",
        async () => {
          try {
            await page.goto("https://invalid-domain-12345.com", { timeout: 100 });
          } catch (error) {
            // Expected to fail
          }
        },
        { iterations: 5, threshold: 200 }
      );

      await intelligence.destroy();
      expect(result.avgDuration).toBeLessThan(200);
    });

    it("should recover from page errors quickly", async () => {
      const pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      const result = await benchmark(
        "Page error recovery",
        async () => {
          const errorHTML = `
            <!DOCTYPE html>
            <html>
              <body>
                <script>throw new Error('Test error');</script>
              </body>
            </html>
          `;
          // Use data URL with waitUntil domcontentloaded to avoid navigation interruption
          try {
            await page.goto('data:text/html,' + encodeURIComponent(errorHTML), { waitUntil: 'domcontentloaded' });
          } catch (e) {
            // Navigation may fail due to error, which is expected
          }
          await page.waitForTimeout(50);
        },
        { iterations: 10, threshold: 100 }
      );

      page.removeAllListeners("pageerror");
      expect(result.avgDuration).toBeLessThan(100);
    });
  });

  describe("Real-World Scenario Performance", () => {
    it("should handle typical debugging workflow efficiently", async () => {
      const intelligence = new SourceIntelligenceLayer();
      await intelligence.initialize(page);

      const result = await benchmark(
        "Complete debugging workflow",
        async () => {
          // 1. Navigate to page
          await page.goto("https://example.com");

          // 2. Wait for content
          await page.waitForTimeout(500);

          // 3. Get network traces
          intelligence.getNetworkTraces();

          // 4. Try to get component tree
          try {
            await intelligence.getComponentTree();
          } catch (e) {
            // May not have components
          }

          // 5. Get summary
          intelligence.getSummary();
        },
        { iterations: 3, threshold: 2000 }
      );

      await intelligence.destroy();
      expect(result.avgDuration).toBeLessThan(2000);
    });

    it("should handle performance analysis workflow", { timeout: 60000 }, async () => {
      const intelligence = new SourceIntelligenceLayer();
      await intelligence.initialize(page);

      const vueFixture = path.join(__dirname, "fixtures", "vue-app-performance.html");

      if (fs.existsSync(vueFixture)) {
        const result = await benchmark(
          "Performance analysis workflow",
          async () => {
            // Load page
            await page.goto(`file://${vueFixture}`);
            await page.waitForTimeout(1000);

            // Simulate interactions
            const button = await page.$("button");
            if (button) {
              await button.click();
              await page.waitForTimeout(100);
            }

            // Get metrics
            intelligence.getNetworkTraces();
            const summary = intelligence.getSummary();
          },
          { iterations: 3, threshold: 10000 }
        );

        expect(result.avgDuration).toBeLessThan(10000);
      }

      await intelligence.destroy();
    });
  });
});

describe("Stress Tests", () => {
  let browser: Browser;
  let context: BrowserContext;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
  });

  afterAll(async () => {
    await context.close();
    await browser.close();
  });

  it("should handle rapid page creations and closures", async () => {
    const start = performance.now();

    for (let i = 0; i < 20; i++) {
      const page = await context.newPage();
      await page.setContent(`<h1>Page ${i}</h1>`);
      await page.close();
    }

    const duration = performance.now() - start;

    // Should complete in reasonable time
    expect(duration).toBeLessThan(10000);
  });

  it("should handle many concurrent operations", async () => {
    const operations = [];

    for (let i = 0; i < 10; i++) {
      operations.push(
        (async () => {
          const page = await context.newPage();
          const intelligence = new SourceIntelligenceLayer();

          try {
            // Check if page is closed before operations
            if (!page.isClosed()) {
              await intelligence.initialize(page);
              await page.setContent(`<div>Test ${i}</div>`);
              intelligence.getNetworkTraces();
              await intelligence.destroy();
            }
          } catch (error) {
            // Handle errors gracefully
            console.error(`Error in operation ${i}:`, error);
          } finally {
            // Ensure page is closed
            if (!page.isClosed()) {
              await page.close();
            }
          }
        })()
      );
    }

    const start = performance.now();
    await Promise.all(operations);
    const duration = performance.now() - start;

    // Should handle concurrent operations efficiently
    expect(duration).toBeLessThan(5000);
  });
});
