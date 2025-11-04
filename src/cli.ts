#!/usr/bin/env node

/**
 * WebSee Source Intelligence CLI
 * Command-line interface for quick debugging and testing
 */

import { program } from 'commander';
import { SourceIntelligenceLayer } from './index.js';
import { launchBrowser, BrowserName } from './browser-config.js';

program
  .name('websee')
  .description('WebSee Source Intelligence - Browser automation with source tracking')
  .version('1.0.0');

program
  .command('debug <url>')
  .description('Debug a webpage with source intelligence')
  .option('-b, --browser <type>', 'Browser to use (chrome, firefox, safari)', 'chromium')
  .option('-H, --headed', 'Run browser in headed mode')
  .option('-s, --screenshot <path>', 'Take screenshot on error')
  .action(async (url, options) => {
    const browser = await launchBrowser(options.browser as BrowserName);
    const context = await browser.newContext();
    const page = await context.newPage();

    const intelligence = new SourceIntelligenceLayer();
    await intelligence.initialize(page);

    try {
      console.log(`🔍 Navigating to ${url}...`);
      await page.goto(url);

      // Example: Log all network requests
      const traces = intelligence.getNetworkTraces();
      console.log(`\n📡 Network Requests (${traces.length} total):`);
      traces.forEach(trace => {
        console.log(`  ${trace.method} ${trace.url} (${trace.duration}ms)`);
      });

      // Example: Get component tree if available
      const components = await intelligence.getComponentTree();
      if (components.length > 0) {
        console.log(`\n🧩 Components Found (${components.length} total)`);
      }

      console.log('\n✅ Page loaded successfully');
    } catch (error: any) {
      console.error('\n❌ Error occurred:');

      const context = await intelligence.getErrorIntelligence(error);

      if (context.originalStack) {
        console.log('\n📍 Original Stack Trace:');
        context.originalStack.forEach(line => console.log('  ', line));
      }

      if (context.networkActivity?.length) {
        console.log('\n🌐 Recent Network Activity:');
        context.networkActivity.forEach(trace => {
          console.log(`  ${trace.method} ${trace.url} (${trace.status})`);
        });
      }

      if (options.screenshot) {
        await page.screenshot({ path: options.screenshot });
        console.log(`📸 Screenshot saved to ${options.screenshot}`);
      }
    } finally {
      await intelligence.destroy();
      await browser.close();
    }
  });

program
  .command('analyze <url>')
  .description('Analyze a webpage for source maps and components')
  .option('-b, --browser <type>', 'Browser to use', 'chromium')
  .action(async (url, options) => {
    const browser = await launchBrowser(options.browser as BrowserName);
    const page = await browser.newPage();

    const intelligence = new SourceIntelligenceLayer();
    await intelligence.initialize(page);

    await page.goto(url);

    const summary = intelligence.getSummary();
    console.log('\n📊 Source Intelligence Summary:');
    console.log('  Source Maps:', summary.sourceMaps.loaded ? '✅ Loaded' : '❌ Not Loaded');
    console.log('  Components:', summary.components.enabled ? '✅ Enabled' : '❌ Disabled');
    console.log('  Network:', summary.network.enabled ? '✅ Enabled' : '❌ Disabled');
    console.log('  Build:', summary.build.enabled ? '✅ Enabled' : '❌ Disabled');

    if (summary.network.traces) {
      console.log(`\n  Network Traces: ${summary.network.traces}`);
    }

    await intelligence.destroy();
    await browser.close();
  });

program.parse(process.argv);
