/**
 * Test Fixtures Index
 * Provides easy access to all test fixtures
 */

import * as path from 'path';
import * as fs from 'fs';

export interface Fixture {
  name: string;
  description: string;
  path: string;
  url: string;
  framework: 'react' | 'vue' | 'angular' | 'vanilla';
  issues: string[];
}

export const fixtures: Record<string, Fixture> = {
  reactErrors: {
    name: 'React App with Errors',
    description: 'React application demonstrating various error scenarios',
    path: path.join(__dirname, 'react-app-with-errors.html'),
    url: '', // Will be set dynamically
    framework: 'react',
    issues: [
      'Undefined property access errors',
      'Async errors',
      'State update bugs',
      'Infinite loop risks',
      'Memory leaks',
    ],
  },

  vuePerformance: {
    name: 'Vue App with Performance Issues',
    description: 'Vue 3 application with various performance problems',
    path: path.join(__dirname, 'vue-app-performance.html'),
    url: '',
    framework: 'vue',
    issues: [
      'Expensive computed properties',
      'Too many watchers',
      'Synchronous network requests',
      'Memory leak simulation',
      'Layout thrashing',
      'Rapid DOM updates',
    ],
  },

  angularMemoryLeak: {
    name: 'Angular-style App with Memory Leaks',
    description: 'Application demonstrating common Angular memory leak patterns',
    path: path.join(__dirname, 'angular-memory-leak.html'),
    url: '',
    framework: 'angular',
    issues: [
      'Unsubscribed event listeners',
      'Uncleaned intervals/timeouts',
      'Detached DOM elements',
      'Observable subscriptions',
      'Global references',
      'Closure memory leaks',
    ],
  },

  vanillaBundle: {
    name: 'Vanilla JS App with Bundle Problems',
    description: 'Vanilla JavaScript app with bundle size issues',
    path: path.join(__dirname, 'vanilla-bundle-problems.html'),
    url: '',
    framework: 'vanilla',
    issues: [
      'Large vendor bundles',
      'No code splitting',
      'Tree shaking not applied',
      'Large inline data',
      'Duplicate dependencies',
    ],
  },
};

/**
 * Get fixture by name
 */
export function getFixture(name: keyof typeof fixtures): Fixture {
  const fixture = fixtures[name];
  if (!fixture) {
    throw new Error(`Fixture not found: ${name}`);
  }

  // Set URL as file:// URL
  fixture.url = `file://${fixture.path}`;

  return fixture;
}

/**
 * Validate all fixtures exist
 */
export function validateFixtures(): boolean {
  const results: Array<{ name: string; exists: boolean; path: string }> = [];

  Object.entries(fixtures).forEach(([key, fixture]) => {
    const exists = fs.existsSync(fixture.path);
    results.push({
      name: fixture.name,
      exists,
      path: fixture.path,
    });

    if (!exists) {
      console.error(`❌ Missing fixture: ${fixture.name} at ${fixture.path}`);
    } else {
      console.log(`✅ Found fixture: ${fixture.name}`);
    }
  });

  return results.every(r => r.exists);
}

/**
 * Get all fixtures
 */
export function getAllFixtures(): Fixture[] {
  return Object.values(fixtures).map(fixture => ({
    ...fixture,
    url: `file://${fixture.path}`,
  }));
}

/**
 * Get fixtures by framework
 */
export function getFixturesByFramework(framework: Fixture['framework']): Fixture[] {
  return getAllFixtures().filter(f => f.framework === framework);
}

// Export individual fixtures for convenience
export const reactErrorsFixture = () => getFixture('reactErrors');
export const vuePerformanceFixture = () => getFixture('vuePerformance');
export const angularMemoryLeakFixture = () => getFixture('angularMemoryLeak');
export const vanillaBundleFixture = () => getFixture('vanillaBundle');
