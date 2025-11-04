#!/usr/bin/env npx tsx
/**
 * Enhanced Component Intelligence Tools Test Runner
 * Uses the react-app-devtools.html page with React DevTools hooks pre-installed
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

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function main() {
  console.log(`${colors.cyan}${colors.bright}ENHANCED COMPONENT INTELLIGENCE TEST${colors.reset}\n`);

  const testPagePath = path.resolve(process.cwd(), 'test-pages/react-app-devtools.html');
  const testPageUrl = `file://${testPagePath}`;

  console.log(`Test Page: ${testPageUrl}\n`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Test 1: Component Tree
    console.log(`${colors.bright}1. Testing component_tree${colors.reset}`);
    const tree = await componentTree(page, {
      url: testPageUrl,
      includeDepth: true,
      filterFramework: 'react',
    });
    console.log(`${colors.green}✓ Found ${tree.totalCount} components${colors.reset}`);
    console.log(`  Frameworks: ${tree.frameworks.join(', ')}`);
    if (tree.components.length > 0) {
      console.log(`  Sample component: ${tree.components[0].name} (depth: ${tree.components[0].depth})`);
    }
    console.log();

    // Test 2: Component Props
    console.log(`${colors.bright}2. Testing component_get_props${colors.reset}`);
    try {
      await page.goto(testPageUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-testid="counter"]', { timeout: 5000 });

      const props = await componentGetProps(page, {
        url: testPageUrl,
        selector: '[data-testid="counter"]',
      });
      console.log(`${colors.green}✓ Component: ${props.componentName}${colors.reset}`);
      console.log(`  Props keys: ${Object.keys(props.props).join(', ') || 'none'}`);
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error instanceof Error ? error.message : error}${colors.reset}`);
    }
    console.log();

    // Test 3: Component State
    console.log(`${colors.bright}3. Testing component_get_state${colors.reset}`);
    try {
      const state = await componentGetState(page, {
        url: testPageUrl,
        selector: '[data-testid="counter"]',
      });
      console.log(`${colors.green}✓ Component: ${state.componentName}${colors.reset}`);
      console.log(`  Has state: ${state.state !== null}`);
      if (state.state) {
        console.log(`  State: ${JSON.stringify(state.state).substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error instanceof Error ? error.message : error}${colors.reset}`);
    }
    console.log();

    // Test 4: Find by Name
    console.log(`${colors.bright}4. Testing component_find_by_name${colors.reset}`);
    const found = await componentFindByName(page, {
      url: testPageUrl,
      componentName: 'Counter',
      includeProps: true,
      includeState: true,
    });
    console.log(`${colors.green}✓ Found ${found.count} instances of Counter${colors.reset}`);
    console.log();

    // Test 5: Get Source
    console.log(`${colors.bright}5. Testing component_get_source${colors.reset}`);
    try {
      const source = await componentGetSource(page, {
        url: testPageUrl,
        selector: '[data-testid="counter"]',
      });
      console.log(`${colors.green}✓ Source: ${source.file}${colors.reset}`);
      console.log(`  Location: ${source.line || '?'}:${source.column || '?'}`);
      console.log(`  Framework: ${source.framework}`);
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error instanceof Error ? error.message : error}${colors.reset}`);
    }
    console.log();

    // Test 6: Track Renders
    console.log(`${colors.bright}6. Testing component_track_renders${colors.reset}`);
    try {
      // Click buttons to trigger renders
      const triggerRenders = async () => {
        await page.waitForTimeout(300);
        await page.click('button:has-text("Increment")');
        await page.waitForTimeout(300);
        await page.click('button:has-text("Increment")');
        await page.waitForTimeout(300);
        await page.click('button:has-text("Reset")');
      };

      const [, renders] = await Promise.all([
        triggerRenders(),
        componentTrackRenders(page, {
          url: testPageUrl,
          selector: '[data-testid="counter"]',
          duration: 2000,
          captureReasons: true,
        }),
      ]);

      console.log(`${colors.green}✓ Component: ${renders.componentName}${colors.reset}`);
      console.log(`  Total renders: ${renders.totalRenders}`);
      console.log(`  Average interval: ${renders.averageInterval.toFixed(2)}ms`);
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error instanceof Error ? error.message : error}${colors.reset}`);
    }
    console.log();

    // Test 7: Get Context
    console.log(`${colors.bright}7. Testing component_get_context${colors.reset}`);
    try {
      const context = await componentGetContext(page, {
        url: testPageUrl,
        selector: '[data-testid="counter"]',
      });
      console.log(`${colors.green}✓ Context values found: ${context.contexts.length}${colors.reset}`);
      context.contexts.forEach((ctx, i) => {
        console.log(`  [${i}] ${ctx.name}`);
      });
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error instanceof Error ? error.message : error}${colors.reset}`);
    }
    console.log();

    // Test 8: Get Hooks
    console.log(`${colors.bright}8. Testing component_get_hooks${colors.reset}`);
    try {
      const hooks = await componentGetHooks(page, {
        url: testPageUrl,
        selector: '[data-testid="counter"]',
      });
      console.log(`${colors.green}✓ Hooks found: ${hooks.hooks.length}${colors.reset}`);
      hooks.hooks.slice(0, 5).forEach((hook, i) => {
        console.log(`  [${i}] ${hook.type} (index: ${hook.index})`);
      });
      if (hooks.hooks.length > 5) {
        console.log(`  ... and ${hooks.hooks.length - 5} more`);
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error instanceof Error ? error.message : error}${colors.reset}`);
    }
    console.log();

    console.log(`${colors.green}${colors.bright}All tests completed!${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
