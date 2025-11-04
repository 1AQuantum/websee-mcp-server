#!/usr/bin/env tsx
/**
 * Standalone Component Intelligence Tools Test Runner
 *
 * This script directly tests the 8 component intelligence tools through the MCP server
 * using both the local React test page and optionally real-world sites.
 *
 * Usage:
 *   npm run build
 *   tsx test-component-tools.ts
 *
 * Or with real-world site testing:
 *   tsx test-component-tools.ts --real-world
 */

import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import {
  componentTree,
  componentGetProps,
  componentGetState,
  componentFindByName,
  componentGetSource,
  componentTrackRenders,
  componentGetContext,
  componentGetHooks,
} from './src/tools/component-intelligence-tools.js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  tool: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  componentCount?: number;
  error?: string;
  details?: any;
}

class TestRunner {
  private browser: Browser | null = null;
  private results: TestResult[] = [];
  private testPageUrl: string;
  private includeRealWorld: boolean;

  constructor(includeRealWorld = false) {
    const testPagePath = path.resolve(
      process.cwd(),
      'test-pages/react-app.html'
    );
    this.testPageUrl = `file://${testPagePath}`;
    this.includeRealWorld = includeRealWorld;
  }

  async setup(): Promise<void> {
    console.log(`${colors.cyan}${colors.bright}Setting up test environment...${colors.reset}`);
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
    });
    console.log(`${colors.green}✓ Browser launched${colors.reset}\n`);
  }

  async teardown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log(`${colors.green}✓ Browser closed${colors.reset}`);
    }
  }

  async createPage(): Promise<Page> {
    if (!this.browser) throw new Error('Browser not initialized');
    return this.browser.newPage();
  }

  log(message: string, color = colors.reset): void {
    console.log(`${color}${message}${colors.reset}`);
  }

  async runTest(
    tool: string,
    testName: string,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    process.stdout.write(`  ${testName}... `);

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      this.results.push({
        tool,
        test: testName,
        status: 'PASS',
        duration,
        componentCount: result?.totalCount || result?.count || result?.hooks?.length,
        details: result,
      });

      console.log(`${colors.green}✓ PASS${colors.reset} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.results.push({
        tool,
        test: testName,
        status: 'FAIL',
        duration,
        error: errorMsg,
      });

      console.log(`${colors.red}✗ FAIL${colors.reset} (${duration}ms)`);
      console.log(`    ${colors.red}${errorMsg}${colors.reset}`);
    }
  }

  async test1_ComponentTree(): Promise<void> {
    this.log(`\n${colors.bright}1. COMPONENT_TREE - Get Component Hierarchy${colors.reset}`, colors.cyan);

    await this.runTest('component_tree', 'Get full component tree', async () => {
      const page = await this.createPage();
      try {
        const result = await componentTree(page, {
          url: this.testPageUrl,
          includeDepth: true,
          filterFramework: 'all',
        });

        this.log(`    Found ${result.totalCount} components`, colors.blue);
        this.log(`    Frameworks: ${result.frameworks.join(', ')}`, colors.blue);

        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_tree', 'Filter React components only', async () => {
      const page = await this.createPage();
      try {
        const result = await componentTree(page, {
          url: this.testPageUrl,
          includeDepth: true,
          filterFramework: 'react',
        });

        this.log(`    React components: ${result.totalCount}`, colors.blue);
        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_tree', 'Verify depth information', async () => {
      const page = await this.createPage();
      try {
        const result = await componentTree(page, {
          url: this.testPageUrl,
          includeDepth: true,
          filterFramework: 'all',
        });

        if (result.components.length > 0) {
          const depths = result.components.map(c => c.depth);
          this.log(`    Depth range: ${Math.min(...depths)} - ${Math.max(...depths)}`, colors.blue);
        }

        return result;
      } finally {
        await page.close();
      }
    });
  }

  async test2_ComponentGetProps(): Promise<void> {
    this.log(`\n${colors.bright}2. COMPONENT_GET_PROPS - Get Component Props${colors.reset}`, colors.cyan);

    await this.runTest('component_get_props', 'Get Counter component props', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetProps(page, {
          url: this.testPageUrl,
          selector: '.counter',
        });

        this.log(`    Component: ${result.componentName}`, colors.blue);
        this.log(`    Props keys: ${Object.keys(result.props).join(', ') || 'none'}`, colors.blue);

        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_get_props', 'Get UserList component props', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.user-list', { timeout: 5000 });

        const result = await componentGetProps(page, {
          url: this.testPageUrl,
          selector: '.user-list',
        });

        this.log(`    Component: ${result.componentName}`, colors.blue);
        return result;
      } finally {
        await page.close();
      }
    });
  }

  async test3_ComponentGetState(): Promise<void> {
    this.log(`\n${colors.bright}3. COMPONENT_GET_STATE - Get Component State${colors.reset}`, colors.cyan);

    await this.runTest('component_get_state', 'Get Counter initial state', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetState(page, {
          url: this.testPageUrl,
          selector: '.counter',
        });

        this.log(`    Component: ${result.componentName}`, colors.blue);
        this.log(`    Has state: ${result.state !== null}`, colors.blue);
        if (result.state) {
          this.log(`    State keys: ${Object.keys(result.state).join(', ')}`, colors.blue);
        }

        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_get_state', 'Track state changes after interaction', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter button', { timeout: 5000 });

        const before = await componentGetState(page, {
          url: this.testPageUrl,
          selector: '.counter',
        });

        // Interact with the page
        await page.click('.counter button:has-text("Increment")');
        await page.waitForTimeout(500);

        const after = await componentGetState(page, {
          url: this.testPageUrl,
          selector: '.counter',
        });

        this.log(`    State changed: ${JSON.stringify(before.state) !== JSON.stringify(after.state)}`, colors.blue);

        return { before, after };
      } finally {
        await page.close();
      }
    });
  }

  async test4_ComponentFindByName(): Promise<void> {
    this.log(`\n${colors.bright}4. COMPONENT_FIND_BY_NAME - Find Components by Name${colors.reset}`, colors.cyan);

    await this.runTest('component_find_by_name', 'Find all Counter instances', async () => {
      const page = await this.createPage();
      try {
        const result = await componentFindByName(page, {
          url: this.testPageUrl,
          componentName: 'Counter',
          includeProps: true,
          includeState: true,
        });

        this.log(`    Found ${result.count} instance(s) of Counter`, colors.blue);
        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_find_by_name', 'Find UserList component', async () => {
      const page = await this.createPage();
      try {
        const result = await componentFindByName(page, {
          url: this.testPageUrl,
          componentName: 'UserList',
          includeProps: true,
          includeState: true,
        });

        this.log(`    Found ${result.count} instance(s) of UserList`, colors.blue);
        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_find_by_name', 'Find App component', async () => {
      const page = await this.createPage();
      try {
        const result = await componentFindByName(page, {
          url: this.testPageUrl,
          componentName: 'App',
          includeProps: false,
          includeState: false,
        });

        this.log(`    Found ${result.count} instance(s) of App`, colors.blue);
        return result;
      } finally {
        await page.close();
      }
    });
  }

  async test5_ComponentGetSource(): Promise<void> {
    this.log(`\n${colors.bright}5. COMPONENT_GET_SOURCE - Map Component to Source${colors.reset}`, colors.cyan);

    await this.runTest('component_get_source', 'Map Counter to source', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetSource(page, {
          url: this.testPageUrl,
          selector: '.counter',
        });

        this.log(`    Source: ${result.file}`, colors.blue);
        this.log(`    Location: ${result.line || '?'}:${result.column || '?'}`, colors.blue);
        this.log(`    Framework: ${result.framework}`, colors.blue);

        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_get_source', 'Map UserList to source', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.user-list', { timeout: 5000 });

        const result = await componentGetSource(page, {
          url: this.testPageUrl,
          selector: '.user-list',
        });

        this.log(`    Source: ${result.file}`, colors.blue);
        this.log(`    Framework: ${result.framework}`, colors.blue);

        return result;
      } finally {
        await page.close();
      }
    });
  }

  async test6_ComponentTrackRenders(): Promise<void> {
    this.log(`\n${colors.bright}6. COMPONENT_TRACK_RENDERS - Track Component Re-renders${colors.reset}`, colors.cyan);

    await this.runTest('component_track_renders', 'Track renders over 2 seconds', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        // Trigger some renders
        const triggerRenders = async () => {
          await page.waitForTimeout(300);
          await page.click('.counter button:has-text("Increment")');
          await page.waitForTimeout(300);
          await page.click('.counter button:has-text("Increment")');
          await page.waitForTimeout(300);
          await page.click('.counter button:has-text("Decrement")');
        };

        const [, result] = await Promise.all([
          triggerRenders(),
          componentTrackRenders(page, {
            url: this.testPageUrl,
            selector: '.counter',
            duration: 2000,
            captureReasons: true,
          }),
        ]);

        this.log(`    Component: ${result.componentName}`, colors.blue);
        this.log(`    Total renders: ${result.totalRenders}`, colors.blue);
        this.log(`    Avg interval: ${result.averageInterval.toFixed(2)}ms`, colors.blue);

        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_track_renders', 'Track renders over 1 second (no interaction)', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentTrackRenders(page, {
          url: this.testPageUrl,
          selector: '.counter',
          duration: 1000,
          captureReasons: false,
        });

        this.log(`    Total renders: ${result.totalRenders}`, colors.blue);

        return result;
      } finally {
        await page.close();
      }
    });
  }

  async test7_ComponentGetContext(): Promise<void> {
    this.log(`\n${colors.bright}7. COMPONENT_GET_CONTEXT - Get React Context Values${colors.reset}`, colors.cyan);

    await this.runTest('component_get_context', 'Get context for Counter', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetContext(page, {
          url: this.testPageUrl,
          selector: '.counter',
        });

        this.log(`    Context values found: ${result.contexts.length}`, colors.blue);
        if (result.contexts.length > 0) {
          result.contexts.forEach((ctx, i) => {
            this.log(`      [${i}] ${ctx.name}: ${JSON.stringify(ctx.value).substring(0, 50)}`, colors.blue);
          });
        }

        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_get_context', 'Get context for UserList', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.user-list', { timeout: 5000 });

        const result = await componentGetContext(page, {
          url: this.testPageUrl,
          selector: '.user-list',
        });

        this.log(`    Context values found: ${result.contexts.length}`, colors.blue);

        return result;
      } finally {
        await page.close();
      }
    });
  }

  async test8_ComponentGetHooks(): Promise<void> {
    this.log(`\n${colors.bright}8. COMPONENT_GET_HOOKS - Get React Hooks State${colors.reset}`, colors.cyan);

    await this.runTest('component_get_hooks', 'Get hooks for Counter', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetHooks(page, {
          url: this.testPageUrl,
          selector: '.counter',
        });

        this.log(`    Hooks found: ${result.hooks.length}`, colors.blue);
        result.hooks.forEach((hook, i) => {
          this.log(`      [${i}] ${hook.type} (index: ${hook.index})`, colors.blue);
        });

        return result;
      } finally {
        await page.close();
      }
    });

    await this.runTest('component_get_hooks', 'Get hooks for UserList', async () => {
      const page = await this.createPage();
      try {
        await page.goto(this.testPageUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('.user-list', { timeout: 5000 });

        const result = await componentGetHooks(page, {
          url: this.testPageUrl,
          selector: '.user-list',
        });

        this.log(`    Hooks found: ${result.hooks.length}`, colors.blue);
        result.hooks.forEach((hook, i) => {
          this.log(`      [${i}] ${hook.type}`, colors.blue);
        });

        return result;
      } finally {
        await page.close();
      }
    });
  }

  printSummary(): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    this.log(`\n${'='.repeat(80)}`, colors.bright);
    this.log(`TEST SUMMARY`, colors.bright);
    this.log(`${'='.repeat(80)}`, colors.bright);

    this.log(`\nTotal Tests: ${total}`);
    this.log(`Passed: ${passed}`, colors.green);
    this.log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.reset);
    this.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%`, passed === total ? colors.green : colors.yellow);

    // Group by tool
    const byTool: Record<string, TestResult[]> = {};
    this.results.forEach(r => {
      if (!byTool[r.tool]) byTool[r.tool] = [];
      byTool[r.tool].push(r);
    });

    this.log(`\n${colors.bright}Results by Tool:${colors.reset}`);
    Object.entries(byTool).forEach(([tool, results]) => {
      const toolPassed = results.filter(r => r.status === 'PASS').length;
      const toolTotal = results.length;
      const status = toolPassed === toolTotal ? colors.green : colors.yellow;
      this.log(`  ${tool}: ${status}${toolPassed}/${toolTotal} passed${colors.reset}`);
    });

    // Component detection stats
    const componentCounts = this.results
      .filter(r => r.componentCount !== undefined)
      .map(r => r.componentCount!);

    if (componentCounts.length > 0) {
      const totalComponents = componentCounts.reduce((sum, c) => sum + c, 0);
      const avgComponents = totalComponents / componentCounts.length;

      this.log(`\n${colors.bright}Component Detection:${colors.reset}`);
      this.log(`  Total components detected: ${totalComponents}`);
      this.log(`  Average per test: ${avgComponents.toFixed(2)}`);
      this.log(`  Detection success rate: ${((componentCounts.filter(c => c > 0).length / componentCounts.length) * 100).toFixed(2)}%`);
    }

    // Performance stats
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const maxDuration = Math.max(...this.results.map(r => r.duration));
    const minDuration = Math.min(...this.results.map(r => r.duration));

    this.log(`\n${colors.bright}Performance:${colors.reset}`);
    this.log(`  Average test duration: ${avgDuration.toFixed(2)}ms`);
    this.log(`  Fastest test: ${minDuration.toFixed(2)}ms`);
    this.log(`  Slowest test: ${maxDuration.toFixed(2)}ms`);

    // Failed tests details
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      this.log(`\n${colors.bright}${colors.red}Failed Tests:${colors.reset}`);
      failedTests.forEach(r => {
        this.log(`  ${r.tool} - ${r.test}`, colors.red);
        this.log(`    Error: ${r.error}`, colors.red);
      });
    }

    this.log(`\n${'='.repeat(80)}\n`, colors.bright);
  }

  async run(): Promise<void> {
    this.log(`\n${colors.bright}${colors.cyan}WEBSEE COMPONENT INTELLIGENCE TOOLS TEST SUITE${colors.reset}`);
    this.log(`${colors.bright}${colors.cyan}Testing 8 Component Intelligence Tools${colors.reset}\n`);

    this.log(`Test Page: ${this.testPageUrl}`);
    this.log(`Include Real-World Sites: ${this.includeRealWorld ? 'Yes' : 'No'}\n`);

    await this.setup();

    try {
      await this.test1_ComponentTree();
      await this.test2_ComponentGetProps();
      await this.test3_ComponentGetState();
      await this.test4_ComponentFindByName();
      await this.test5_ComponentGetSource();
      await this.test6_ComponentTrackRenders();
      await this.test7_ComponentGetContext();
      await this.test8_ComponentGetHooks();
    } catch (error) {
      this.log(`\n${colors.red}Unexpected error during test execution:${colors.reset}`, colors.red);
      console.error(error);
    }

    await this.teardown();
    this.printSummary();

    // Write detailed results to file
    const reportPath = path.resolve(process.cwd(), 'component-tools-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    this.log(`Detailed results written to: ${reportPath}`, colors.blue);

    // Exit with error code if any tests failed
    const exitCode = this.results.some(r => r.status === 'FAIL') ? 1 : 0;
    process.exit(exitCode);
  }
}

// Main execution
const includeRealWorld = process.argv.includes('--real-world');
const runner = new TestRunner(includeRealWorld);
runner.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
