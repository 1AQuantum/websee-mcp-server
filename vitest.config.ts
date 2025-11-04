import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global setup/teardown
    globalSetup: './tests/setup.ts',

    // Test file patterns
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'build'],

    // Timeout settings
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/example-usage.ts',
        'src/cli.ts',
        'node_modules',
        'dist',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
      all: true,
    },

    // Reporter configuration
    reporters: process.env.CI
      ? ['verbose', 'json', 'junit']
      : ['verbose'],

    // Output configuration for CI
    outputFile: {
      json: './test-results/results.json',
      junit: './test-results/junit.xml',
    },

    // Parallel execution
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Retry failed tests in CI
    retry: process.env.CI ? 2 : 0,

    // Isolate tests
    isolate: true,

    // Sequence options
    sequence: {
      shuffle: false, // Keep tests in order for consistency
    },

    // Setup files
    setupFiles: ['./tests/test-setup.ts'],

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Watch options (for development)
    watch: false,

    // Benchmark configuration
    benchmark: {
      include: ['tests/**/*.bench.ts'],
      exclude: ['node_modules', 'dist'],
    },

    // Pool options for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
      },
    },

    // Silent console output during tests
    silent: false,

    // Enable type checking
    typecheck: {
      enabled: false, // Can be enabled for stricter type checking
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
