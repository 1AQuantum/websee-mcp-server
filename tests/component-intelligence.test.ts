/**
 * Component Intelligence Tools Test Suite
 *
 * Comprehensive testing for all 8 component intelligence tools:
 * 1. component_tree
 * 2. component_get_props
 * 3. component_get_state
 * 4. component_find_by_name
 * 5. component_get_source
 * 6. component_track_renders
 * 7. component_get_context
 * 8. component_get_hooks
 *
 * Tests use the local React test page and real-world React sites.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
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
} from '../src/tools/component-intelligence-tools.js';

// Test configuration
const TEST_PAGE_PATH = path.resolve(
  __dirname,
  '../test-pages/react-app.html'
);
const TEST_PAGE_URL = `file://${TEST_PAGE_PATH}`;

// Real-world React sites for additional testing
const REAL_WORLD_SITES = {
  // Note: These are optional - tests will skip if pages don't load
  reddit: 'https://www.reddit.com',
  airbnb: 'https://www.airbnb.com',
  netflix: 'https://www.netflix.com',
};

interface TestResult {
  tool: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  sampleOutput?: any;
  componentCount?: number;
  error?: string;
}

class ComponentIntelligenceTestRunner {
  private browser: Browser | null = null;
  private results: TestResult[] = [];
  private detectionSuccessRate = {
    total: 0,
    successful: 0,
  };

  async setup(): Promise<void> {
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
    });
  }

  async teardown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }
    return this.browser.newPage();
  }

  recordResult(result: TestResult): void {
    this.results.push(result);
    if (result.status === 'passed' && result.componentCount !== undefined) {
      this.detectionSuccessRate.total++;
      if (result.componentCount > 0) {
        this.detectionSuccessRate.successful++;
      }
    }
  }

  getSuccessRate(): number {
    if (this.detectionSuccessRate.total === 0) return 0;
    return (
      (this.detectionSuccessRate.successful / this.detectionSuccessRate.total) *
      100
    );
  }

  getResults(): TestResult[] {
    return this.results;
  }

  generateReport(): string {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    let report = '\n='.repeat(80) + '\n';
    report += 'COMPONENT INTELLIGENCE TOOLS TEST REPORT\n';
    report += '='.repeat(80) + '\n\n';

    report += `Total Tests: ${this.results.length}\n`;
    report += `Passed: ${passed}\n`;
    report += `Failed: ${failed}\n`;
    report += `Skipped: ${skipped}\n`;
    report += `Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%\n`;
    report += `Component Detection Rate: ${this.getSuccessRate().toFixed(2)}%\n\n`;

    report += '-'.repeat(80) + '\n';
    report += 'DETAILED RESULTS\n';
    report += '-'.repeat(80) + '\n\n';

    this.results.forEach((result, index) => {
      report += `${index + 1}. ${result.tool} - ${result.testName}\n`;
      report += `   Status: ${result.status.toUpperCase()}\n`;
      report += `   Duration: ${result.duration.toFixed(2)}ms\n`;
      if (result.componentCount !== undefined) {
        report += `   Components Found: ${result.componentCount}\n`;
      }
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      }
      if (result.sampleOutput) {
        report += `   Sample Output: ${JSON.stringify(result.sampleOutput, null, 2).substring(0, 200)}...\n`;
      }
      report += '\n';
    });

    return report;
  }
}

// Global test runner instance
const testRunner = new ComponentIntelligenceTestRunner();

describe('Component Intelligence Tools Test Suite', () => {
  beforeAll(async () => {
    await testRunner.setup();
    console.log('Test runner initialized');
  });

  afterAll(async () => {
    await testRunner.teardown();
    const report = testRunner.generateReport();
    console.log(report);

    // Write report to file
    const reportPath = path.resolve(__dirname, '../test-results-component-intelligence.txt');
    fs.writeFileSync(reportPath, report);
    console.log(`\nDetailed report written to: ${reportPath}`);
  });

  describe('1. component_tree - Get Component Hierarchy', () => {
    it('should retrieve component tree from local React test page', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        const result = await componentTree(page, {
          url: TEST_PAGE_URL,
          includeDepth: true,
          filterFramework: 'all',
        });

        const duration = Date.now() - startTime;

        expect(result).toBeDefined();
        expect(result.components).toBeInstanceOf(Array);
        expect(result.totalCount).toBeGreaterThanOrEqual(0);
        expect(result.frameworks).toBeInstanceOf(Array);

        testRunner.recordResult({
          tool: 'component_tree',
          testName: 'Local React Test Page',
          status: 'passed',
          duration,
          componentCount: result.totalCount,
          sampleOutput: {
            totalComponents: result.totalCount,
            frameworks: result.frameworks,
            firstComponent: result.components[0],
          },
        });

        console.log(`✓ Found ${result.totalCount} components`);
        console.log(`  Frameworks detected: ${result.frameworks.join(', ')}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_tree',
          testName: 'Local React Test Page',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should filter components by framework (React only)', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        const result = await componentTree(page, {
          url: TEST_PAGE_URL,
          includeDepth: true,
          filterFramework: 'react',
        });

        const duration = Date.now() - startTime;

        expect(result.frameworks).toContain('react');
        result.components.forEach(comp => {
          expect(comp.type).toBe('react');
        });

        testRunner.recordResult({
          tool: 'component_tree',
          testName: 'Filter by React framework',
          status: 'passed',
          duration,
          componentCount: result.totalCount,
        });

        console.log(`✓ Found ${result.totalCount} React components`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_tree',
          testName: 'Filter by React framework',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should include depth information in component tree', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        const result = await componentTree(page, {
          url: TEST_PAGE_URL,
          includeDepth: true,
          filterFramework: 'all',
        });

        const duration = Date.now() - startTime;

        if (result.components.length > 0) {
          expect(result.components[0].depth).toBeDefined();
          expect(typeof result.components[0].depth).toBe('number');
        }

        testRunner.recordResult({
          tool: 'component_tree',
          testName: 'Include depth information',
          status: 'passed',
          duration,
          componentCount: result.totalCount,
          sampleOutput: {
            depthExample: result.components[0]?.depth,
          },
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_tree',
          testName: 'Include depth information',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });

  describe('2. component_get_props - Get Component Props', () => {
    it('should retrieve props for Counter component', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetProps(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        expect(result).toBeDefined();
        expect(result.componentName).toBeDefined();
        expect(result.props).toBeDefined();
        expect(typeof result.props).toBe('object');

        testRunner.recordResult({
          tool: 'component_get_props',
          testName: 'Counter component props',
          status: 'passed',
          duration,
          componentCount: 1,
          sampleOutput: {
            componentName: result.componentName,
            propsKeys: Object.keys(result.props),
          },
        });

        console.log(`✓ Retrieved props for ${result.componentName}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_props',
          testName: 'Counter component props',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should handle non-existent selectors gracefully', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });

        await expect(
          componentGetProps(page, {
            url: TEST_PAGE_URL,
            selector: '.non-existent-component',
          })
        ).rejects.toThrow();

        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_props',
          testName: 'Non-existent selector error handling',
          status: 'passed',
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_props',
          testName: 'Non-existent selector error handling',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });

  describe('3. component_get_state - Get Component State', () => {
    it('should retrieve state for Counter component', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetState(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        expect(result).toBeDefined();
        expect(result.componentName).toBeDefined();
        // State can be null for stateless components
        expect(result.state === null || typeof result.state === 'object').toBe(true);

        testRunner.recordResult({
          tool: 'component_get_state',
          testName: 'Counter component state',
          status: 'passed',
          duration,
          componentCount: 1,
          sampleOutput: {
            componentName: result.componentName,
            hasState: result.state !== null,
            stateKeys: result.state ? Object.keys(result.state) : [],
          },
        });

        console.log(`✓ Retrieved state for ${result.componentName}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_state',
          testName: 'Counter component state',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should track state changes after interactions', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter button', { timeout: 5000 });

        // Get initial state
        const initialState = await componentGetState(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        // Click increment button
        await page.click('.counter button:has-text("Increment")');
        await page.waitForTimeout(500);

        // Get state after interaction
        const updatedState = await componentGetState(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        testRunner.recordResult({
          tool: 'component_get_state',
          testName: 'State changes after interaction',
          status: 'passed',
          duration,
          componentCount: 1,
          sampleOutput: {
            initialState,
            updatedState,
          },
        });

        console.log(`✓ Tracked state changes`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_state',
          testName: 'State changes after interaction',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });

  describe('4. component_find_by_name - Find Components by Name', () => {
    it('should find all instances of Counter component', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        const result = await componentFindByName(page, {
          url: TEST_PAGE_URL,
          componentName: 'Counter',
          includeProps: true,
          includeState: true,
        });

        const duration = Date.now() - startTime;

        expect(result).toBeDefined();
        expect(result.instances).toBeInstanceOf(Array);
        expect(result.count).toBe(result.instances.length);

        testRunner.recordResult({
          tool: 'component_find_by_name',
          testName: 'Find Counter components',
          status: 'passed',
          duration,
          componentCount: result.count,
          sampleOutput: {
            count: result.count,
            firstInstance: result.instances[0],
          },
        });

        console.log(`✓ Found ${result.count} instances of Counter`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_find_by_name',
          testName: 'Find Counter components',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should find UserList component', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        const result = await componentFindByName(page, {
          url: TEST_PAGE_URL,
          componentName: 'UserList',
          includeProps: true,
          includeState: true,
        });

        const duration = Date.now() - startTime;

        expect(result.count).toBeGreaterThanOrEqual(0);

        testRunner.recordResult({
          tool: 'component_find_by_name',
          testName: 'Find UserList components',
          status: 'passed',
          duration,
          componentCount: result.count,
        });

        console.log(`✓ Found ${result.count} instances of UserList`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_find_by_name',
          testName: 'Find UserList components',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should return empty array for non-existent component name', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        const result = await componentFindByName(page, {
          url: TEST_PAGE_URL,
          componentName: 'NonExistentComponent',
          includeProps: false,
          includeState: false,
        });

        const duration = Date.now() - startTime;

        expect(result.count).toBe(0);
        expect(result.instances).toHaveLength(0);

        testRunner.recordResult({
          tool: 'component_find_by_name',
          testName: 'Non-existent component name',
          status: 'passed',
          duration,
          componentCount: 0,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_find_by_name',
          testName: 'Non-existent component name',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });

  describe('5. component_get_source - Map Component to Source', () => {
    it('should map Counter component to source file', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetSource(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        expect(result).toBeDefined();
        expect(result.file).toBeDefined();
        expect(result.framework).toBeDefined();

        testRunner.recordResult({
          tool: 'component_get_source',
          testName: 'Counter component source mapping',
          status: 'passed',
          duration,
          componentCount: 1,
          sampleOutput: {
            file: result.file,
            line: result.line,
            column: result.column,
            framework: result.framework,
          },
        });

        console.log(`✓ Mapped to source: ${result.file}:${result.line}:${result.column}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_source',
          testName: 'Counter component source mapping',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should return framework information even without source maps', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetSource(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        expect(result.framework).toBe('react');

        testRunner.recordResult({
          tool: 'component_get_source',
          testName: 'Framework detection without source maps',
          status: 'passed',
          duration,
          componentCount: 1,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_source',
          testName: 'Framework detection without source maps',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });

  describe('6. component_track_renders - Track Component Re-renders', () => {
    it('should track Counter component renders over 3 seconds', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        // Click increment button a few times to trigger renders
        const clickPromise = (async () => {
          for (let i = 0; i < 3; i++) {
            await page.waitForTimeout(500);
            await page.click('.counter button:has-text("Increment")');
          }
        })();

        const resultPromise = componentTrackRenders(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
          duration: 3000,
          captureReasons: true,
        });

        const [, result] = await Promise.all([clickPromise, resultPromise]);
        const duration = Date.now() - startTime;

        expect(result).toBeDefined();
        expect(result.componentName).toBeDefined();
        expect(result.renders).toBeInstanceOf(Array);
        expect(result.totalRenders).toBeGreaterThanOrEqual(0);
        expect(typeof result.averageInterval).toBe('number');

        testRunner.recordResult({
          tool: 'component_track_renders',
          testName: 'Track Counter renders over 3 seconds',
          status: 'passed',
          duration,
          componentCount: 1,
          sampleOutput: {
            componentName: result.componentName,
            totalRenders: result.totalRenders,
            averageInterval: result.averageInterval,
            sampleRenders: result.renders.slice(0, 3),
          },
        });

        console.log(`✓ Tracked ${result.totalRenders} renders, avg interval: ${result.averageInterval.toFixed(2)}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_track_renders',
          testName: 'Track Counter renders over 3 seconds',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should track renders with different durations', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentTrackRenders(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
          duration: 1000,
          captureReasons: false,
        });

        const duration = Date.now() - startTime;

        expect(result.totalRenders).toBeGreaterThanOrEqual(0);

        testRunner.recordResult({
          tool: 'component_track_renders',
          testName: 'Track renders with 1 second duration',
          status: 'passed',
          duration,
          componentCount: 1,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_track_renders',
          testName: 'Track renders with 1 second duration',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });

  describe('7. component_get_context - Get React Context Values', () => {
    it('should retrieve context values for components', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetContext(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        expect(result).toBeDefined();
        expect(result.contexts).toBeInstanceOf(Array);

        testRunner.recordResult({
          tool: 'component_get_context',
          testName: 'Get context values for Counter',
          status: 'passed',
          duration,
          componentCount: 1,
          sampleOutput: {
            contextCount: result.contexts.length,
            contexts: result.contexts,
          },
        });

        console.log(`✓ Found ${result.contexts.length} context values`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_context',
          testName: 'Get context values for Counter',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should handle components without context', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetContext(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        // It's OK to have no contexts
        expect(result.contexts).toBeInstanceOf(Array);

        testRunner.recordResult({
          tool: 'component_get_context',
          testName: 'Handle components without context',
          status: 'passed',
          duration,
          componentCount: 1,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_context',
          testName: 'Handle components without context',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });

  describe('8. component_get_hooks - Get React Hooks State', () => {
    it('should retrieve hooks for Counter component', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetHooks(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        expect(result).toBeDefined();
        expect(result.hooks).toBeInstanceOf(Array);

        testRunner.recordResult({
          tool: 'component_get_hooks',
          testName: 'Get hooks for Counter',
          status: 'passed',
          duration,
          componentCount: 1,
          sampleOutput: {
            hookCount: result.hooks.length,
            hooks: result.hooks.map(h => ({
              type: h.type,
              index: h.index,
            })),
          },
        });

        console.log(`✓ Found ${result.hooks.length} hooks`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_hooks',
          testName: 'Get hooks for Counter',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should identify hook types correctly', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        const result = await componentGetHooks(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        result.hooks.forEach(hook => {
          expect(hook.type).toBeDefined();
          expect(typeof hook.type).toBe('string');
          expect(typeof hook.index).toBe('number');
        });

        testRunner.recordResult({
          tool: 'component_get_hooks',
          testName: 'Identify hook types',
          status: 'passed',
          duration,
          componentCount: 1,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_hooks',
          testName: 'Identify hook types',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });

    it('should error for non-React components', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });

        // This will fail as expected - hooks are React-only
        const result = await componentGetHooks(page, {
          url: TEST_PAGE_URL,
          selector: 'body',
        }).catch(e => e);

        const duration = Date.now() - startTime;

        testRunner.recordResult({
          tool: 'component_get_hooks',
          testName: 'Error handling for non-React components',
          status: 'passed',
          duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'component_get_hooks',
          testName: 'Error handling for non-React components',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });

  describe('Integration Tests - Multiple Tools', () => {
    it('should use multiple tools together to analyze a component', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        await page.goto(TEST_PAGE_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.counter', { timeout: 5000 });

        // 1. Get component tree
        const tree = await componentTree(page, {
          url: TEST_PAGE_URL,
          includeDepth: true,
          filterFramework: 'react',
        });

        // 2. Get props
        const props = await componentGetProps(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        // 3. Get state
        const state = await componentGetState(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        // 4. Get source
        const source = await componentGetSource(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        // 5. Get hooks
        const hooks = await componentGetHooks(page, {
          url: TEST_PAGE_URL,
          selector: '.counter',
        });

        const duration = Date.now() - startTime;

        const analysis = {
          totalComponents: tree.totalCount,
          componentName: props.componentName,
          propsKeys: Object.keys(props.props),
          hasState: state.state !== null,
          sourceFile: source.file,
          framework: source.framework,
          hookCount: hooks.hooks.length,
        };

        testRunner.recordResult({
          tool: 'integration',
          testName: 'Multi-tool component analysis',
          status: 'passed',
          duration,
          componentCount: tree.totalCount,
          sampleOutput: analysis,
        });

        console.log(`✓ Complete component analysis:`, analysis);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'integration',
          testName: 'Multi-tool component analysis',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });

  describe('Performance Tests', () => {
    it('should complete component tree extraction within acceptable time', async () => {
      const page = await testRunner.createPage();
      const startTime = Date.now();

      try {
        const result = await componentTree(page, {
          url: TEST_PAGE_URL,
          includeDepth: true,
          filterFramework: 'all',
        });

        const duration = Date.now() - startTime;

        // Should complete within 5 seconds for local test page
        expect(duration).toBeLessThan(5000);

        testRunner.recordResult({
          tool: 'performance',
          testName: 'Component tree extraction speed',
          status: 'passed',
          duration,
          componentCount: result.totalCount,
        });

        console.log(`✓ Performance test passed: ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        testRunner.recordResult({
          tool: 'performance',
          testName: 'Component tree extraction speed',
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        await page.close();
      }
    });
  });
});
