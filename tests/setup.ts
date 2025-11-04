/**
 * Global Test Setup
 * Runs once before all tests
 */

export async function setup() {
  console.log('Setting up test environment...');

  // Install playwright browsers if needed
  try {
    const { execSync } = await import('child_process');

    // Check if browsers are installed
    const browsersInstalled = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD !== '1';

    if (!browsersInstalled && !process.env.CI) {
      console.log('Installing Playwright browsers...');
      execSync('npx playwright install chromium firefox webkit', {
        stdio: 'inherit',
      });
    }
  } catch (error) {
    console.warn('Could not install Playwright browsers:', error);
  }

  // Set up test database or external dependencies if needed
  // Example: await startTestServer();

  console.log('Test environment ready!');
}

export async function teardown() {
  console.log('Cleaning up test environment...');

  // Clean up any resources
  // Example: await stopTestServer();

  console.log('Test environment cleaned up!');
}
