/**
 * Test Setup File
 * Runs before each test file
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.HEADLESS = 'true';

  // Suppress console output during tests (optional)
  if (process.env.SILENT_TESTS === 'true') {
    global.console = {
      ...console,
      log: () => {},
      debug: () => {},
      info: () => {},
      warn: () => {},
    };
  }

  // Set reasonable timeouts
  if (typeof jest !== 'undefined') {
    jest.setTimeout(30000);
  }
});

afterAll(() => {
  // Cleanup global resources if needed
});

beforeEach(() => {
  // Reset any global state before each test
});

afterEach(() => {
  // Cleanup after each test
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in test:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in test:', error);
});

// Extend timeout for CI environments
if (process.env.CI) {
  // CI environments may be slower
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = ((fn: any, delay: number, ...args: any[]) => {
    return originalSetTimeout(fn, delay * 1.5, ...args);
  }) as typeof setTimeout;
}

// Add custom matchers or utilities if needed
declare global {
  namespace Vi {
    interface Matchers<R = any> {
      // Custom matchers can be added here
    }
  }
}

export {};
