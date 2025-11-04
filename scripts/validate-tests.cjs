#!/usr/bin/env node

/**
 * Test Suite Validation Script
 * Validates that all test files and fixtures are in place
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function success(message) {
  log(colors.green, '✓', message);
}

function error(message) {
  log(colors.red, '✗', message);
}

function warning(message) {
  log(colors.yellow, '⚠', message);
}

function info(message) {
  log(colors.blue, 'ℹ', message);
}

const requiredFiles = [
  // Test files
  'tests/mcp-server.test.ts',
  'tests/performance-benchmarks.test.ts',
  'tests/test-setup.ts',
  'tests/setup.ts',
  'tests/README.md',

  // Fixtures
  'tests/fixtures/index.ts',
  'tests/fixtures/react-app-with-errors.html',
  'tests/fixtures/vue-app-performance.html',
  'tests/fixtures/angular-memory-leak.html',
  'tests/fixtures/vanilla-bundle-problems.html',

  // Configuration
  'vitest.config.ts',
  '.github/workflows/test.yml',

  // Documentation
  'TEST_SUITE_SUMMARY.md',
];

const requiredDependencies = [
  'vitest',
  '@vitest/coverage-v8',
  'playwright',
  'zod',
  '@modelcontextprotocol/sdk',
];

console.log('\n' + '='.repeat(80));
console.log('TEST SUITE VALIDATION');
console.log('='.repeat(80) + '\n');

// Check files
let filesOk = true;
info('Checking required files...\n');

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    success(`${file} (${sizeKB} KB)`);
  } else {
    error(`Missing: ${file}`);
    filesOk = false;
  }
});

console.log();

// Check package.json dependencies
info('Checking dependencies...\n');

let depsOk = true;
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  requiredDependencies.forEach(dep => {
    if (allDeps[dep]) {
      success(`${dep}@${allDeps[dep]}`);
    } else {
      error(`Missing dependency: ${dep}`);
      depsOk = false;
    }
  });
} catch (err) {
  error('Could not read package.json');
  depsOk = false;
}

console.log();

// Check test file content
info('Checking test file content...\n');

let contentOk = true;
const testFile = path.join(__dirname, '..', 'tests/mcp-server.test.ts');
if (fs.existsSync(testFile)) {
  const content = fs.readFileSync(testFile, 'utf-8');

  const requiredTests = [
    'debug_frontend_issue',
    'analyze_performance',
    'inspect_component_state',
    'trace_network_requests',
    'analyze_bundle_size',
    'resolve_minified_error',
  ];

  requiredTests.forEach(test => {
    if (content.includes(test)) {
      success(`Test section: ${test}`);
    } else {
      warning(`Test section not found: ${test}`);
      contentOk = false;
    }
  });
}

console.log();

// Check fixtures
info('Checking test fixtures...\n');

let fixturesOk = true;
const fixtures = [
  'react-app-with-errors.html',
  'vue-app-performance.html',
  'angular-memory-leak.html',
  'vanilla-bundle-problems.html',
];

fixtures.forEach(fixture => {
  const fixturePath = path.join(__dirname, '..', 'tests/fixtures', fixture);
  if (fs.existsSync(fixturePath)) {
    const content = fs.readFileSync(fixturePath, 'utf-8');

    // Check for essential elements
    const hasHtml = content.includes('<!DOCTYPE html>');
    const hasTitle = content.includes('<title>');
    const hasScript = content.includes('<script');

    if (hasHtml && hasTitle && hasScript) {
      success(`${fixture} - Valid HTML structure`);
    } else {
      warning(`${fixture} - Missing essential elements`);
      fixturesOk = false;
    }
  } else {
    error(`Fixture not found: ${fixture}`);
    fixturesOk = false;
  }
});

console.log();

// Summary
console.log('='.repeat(80));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(80) + '\n');

const results = [
  { name: 'Required Files', ok: filesOk },
  { name: 'Dependencies', ok: depsOk },
  { name: 'Test Content', ok: contentOk },
  { name: 'Fixtures', ok: fixturesOk },
];

results.forEach(({ name, ok }) => {
  if (ok) {
    success(`${name}: OK`);
  } else {
    error(`${name}: FAILED`);
  }
});

console.log();

const allOk = results.every(r => r.ok);

if (allOk) {
  console.log(colors.green + '✓ All validation checks passed!' + colors.reset);
  console.log('\nYou can now run the tests:');
  console.log('  npm test');
  console.log('  npm test -- --coverage');
  console.log('  npm test tests/mcp-server.test.ts');
  process.exit(0);
} else {
  console.log(colors.red + '✗ Some validation checks failed!' + colors.reset);
  console.log('\nPlease fix the issues above before running tests.');
  process.exit(1);
}
