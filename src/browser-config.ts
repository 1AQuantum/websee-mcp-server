/**
 * Browser Configuration for WebSee Source Intelligence
 * Supports Chrome, Firefox, Safari across different environments
 */

import { chromium, firefox, webkit, BrowserType, LaunchOptions } from 'playwright';

export type BrowserName = 'chrome' | 'firefox' | 'safari' | 'chromium' | 'webkit';

export interface BrowserConfig {
  name: BrowserName;
  type: BrowserType;
  options: LaunchOptions;
}

/**
 * Pre-configured browser setups for different browsers
 */
export const BROWSER_CONFIGS: Record<BrowserName, BrowserConfig> = {
  chrome: {
    name: 'chrome',
    type: chromium,
    options: {
      channel: 'chrome',
      headless: process.env.HEADLESS !== 'false',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
    },
  },

  chromium: {
    name: 'chromium',
    type: chromium,
    options: {
      headless: process.env.HEADLESS !== 'false',
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    },
  },

  firefox: {
    name: 'firefox',
    type: firefox,
    options: {
      headless: process.env.HEADLESS !== 'false',
      firefoxUserPrefs: {
        'dom.webnotifications.enabled': false,
        'dom.push.enabled': false,
      },
    },
  },

  safari: {
    name: 'safari',
    type: webkit,
    options: {
      headless: process.env.HEADLESS !== 'false',
    },
  },

  webkit: {
    name: 'webkit',
    type: webkit,
    options: {
      headless: process.env.HEADLESS !== 'false',
    },
  },
};

/**
 * Get browser configuration by name
 */
export function getBrowserConfig(browserName: BrowserName = 'chromium'): BrowserConfig {
  const config = BROWSER_CONFIGS[browserName];
  if (!config) {
    throw new Error(
      `Unknown browser: ${browserName}. Supported: ${Object.keys(BROWSER_CONFIGS).join(', ')}`
    );
  }
  return config;
}

/**
 * Launch a browser with the specified configuration
 */
export async function launchBrowser(browserName: BrowserName = 'chromium') {
  const config = getBrowserConfig(browserName);
  return await config.type.launch(config.options);
}

/**
 * Get browser from environment variable or default
 */
export function getBrowserFromEnv(): BrowserName {
  const browser = process.env.BROWSER?.toLowerCase();
  if (browser && browser in BROWSER_CONFIGS) {
    return browser as BrowserName;
  }
  return 'chromium';
}

/**
 * Example usage function
 */
export async function createBrowserWithIntelligence(browserName?: BrowserName) {
  const name = browserName || getBrowserFromEnv();
  const browser = await launchBrowser(name);
  console.log(`✅ Launched ${name} browser`);
  return browser;
}
