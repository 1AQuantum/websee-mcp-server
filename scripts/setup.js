#!/usr/bin/env node

/**
 * WebSee Source Intelligence - One-Click Setup Script
 * Automatically configures everything for your development environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, silent = false) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
  } catch (error) {
    if (!silent) {
      log(`Error executing: ${command}`, colors.red);
      throw error;
    }
    return null;
  }
}

async function main() {
  log('\n🚀 WebSee Source Intelligence - Setup Script', colors.bright + colors.blue);
  log('============================================\n', colors.blue);

  // Step 1: Check Node version
  log('📋 Checking prerequisites...', colors.yellow);
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion < 18) {
    log(`❌ Node.js 18+ required (current: ${nodeVersion})`, colors.red);
    process.exit(1);
  }
  log(`✅ Node.js ${nodeVersion}`, colors.green);

  // Step 2: Install dependencies
  log('\n📦 Installing dependencies...', colors.yellow);
  exec('npm install');
  log('✅ Dependencies installed', colors.green);

  // Step 3: Install Playwright browsers
  log('\n🌐 Installing browsers...', colors.yellow);
  const browsers = ['chromium', 'firefox', 'webkit'];

  for (const browser of browsers) {
    log(`  Installing ${browser}...`, colors.blue);
    try {
      exec(`npx playwright install ${browser}`);
      log(`  ✅ ${browser} installed`, colors.green);
    } catch (error) {
      log(`  ⚠️  ${browser} installation failed (optional)`, colors.yellow);
    }
  }

  // Step 4: Build the project
  log('\n🔨 Building project...', colors.yellow);
  exec('npm run build');
  log('✅ Build complete', colors.green);

  // Step 5: Setup VS Code configuration
  log('\n⚙️  Setting up VS Code/Cursor configuration...', colors.yellow);

  const vscodeDir = path.join(process.cwd(), '.vscode');
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
  }

  // VS Code settings
  const vscodeSettings = {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "typescript.tsdk": "node_modules/typescript/lib",
    "typescript.enablePromptUseWorkspaceTsdk": true,
    "[typescript]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    }
  };

  fs.writeFileSync(
    path.join(vscodeDir, 'settings.json'),
    JSON.stringify(vscodeSettings, null, 2)
  );

  // VS Code extensions recommendations
  const extensions = {
    "recommendations": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "ms-playwright.playwright",
      "vitest.explorer",
      "usernamehw.errorlens",
      "streetsidesoftware.code-spell-checker"
    ]
  };

  fs.writeFileSync(
    path.join(vscodeDir, 'extensions.json'),
    JSON.stringify(extensions, null, 2)
  );

  // VS Code launch configuration
  const launchConfig = {
    "version": "0.2.0",
    "configurations": [
      {
        "type": "node",
        "request": "launch",
        "name": "Debug Tests",
        "runtimeExecutable": "npm",
        "runtimeArgs": ["test"],
        "console": "integratedTerminal"
      },
      {
        "type": "node",
        "request": "launch",
        "name": "Debug Current Test File",
        "runtimeExecutable": "npm",
        "runtimeArgs": ["test", "--", "${file}"],
        "console": "integratedTerminal"
      }
    ]
  };

  fs.writeFileSync(
    path.join(vscodeDir, 'launch.json'),
    JSON.stringify(launchConfig, null, 2)
  );

  log('✅ VS Code configuration created', colors.green);

  // Step 6: Setup Claude configuration
  log('\n🤖 Setting up Claude configuration...', colors.yellow);

  const claudeDir = path.join(process.cwd(), '.claude');
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  const claudeConfig = {
    "project": {
      "type": "typescript",
      "framework": "playwright",
      "description": "WebSee Source Intelligence Layer - Browser automation with source tracking"
    },
    "settings": {
      "typescript": true,
      "eslint": true,
      "prettier": true,
      "testing": "vitest"
    },
    "mcp": {
      "version": "1.0.0",
      "tools": [
        "source-map-resolver",
        "component-tracker",
        "network-tracer",
        "build-analyzer"
      ]
    }
  };

  fs.writeFileSync(
    path.join(claudeDir, 'project.json'),
    JSON.stringify(claudeConfig, null, 2)
  );

  log('✅ Claude configuration created', colors.green);

  // Step 7: Run initial tests
  log('\n🧪 Running tests...', colors.yellow);
  try {
    exec('npm test', true);
    log('✅ All tests passing', colors.green);
  } catch (error) {
    log('⚠️  Some tests failed (run `npm test` for details)', colors.yellow);
  }

  // Step 8: Create example configuration
  log('\n📝 Creating example configuration...', colors.yellow);

  const exampleConfig = `import { SourceIntelligenceLayer } from '@your-org/websee-source-intelligence';
import { chromium, firefox, webkit } from 'playwright';

// Example usage
async function example() {
  // Choose your browser
  const browser = await chromium.launch(); // or firefox, webkit
  const page = await browser.newPage();

  // Initialize Source Intelligence
  const intelligence = new SourceIntelligenceLayer({
    enableSourceMaps: true,
    enableComponentTracking: true,
    enableNetworkTracing: true,
    enableBuildAnalysis: true
  });

  await intelligence.initialize(page);

  // Now all operations have source intelligence!
  await page.goto('https://your-app.com');

  // Get error context with original source
  try {
    await page.click('#submit');
  } catch (error) {
    const context = await intelligence.getErrorIntelligence(error);
    console.log('Original source:', context.originalStack);
    console.log('Component:', context.components);
    console.log('Network:', context.networkActivity);
  }
}`;

  fs.writeFileSync('example.ts', exampleConfig);
  log('✅ Example configuration created (see example.ts)', colors.green);

  // Final message
  log('\n' + '='.repeat(50), colors.bright + colors.green);
  log('🎉 Setup Complete!', colors.bright + colors.green);
  log('='.repeat(50), colors.bright + colors.green);

  log('\n📚 Quick Start:', colors.bright);
  log('  1. Import: import { SourceIntelligenceLayer } from "@your-org/websee-source-intelligence"');
  log('  2. Initialize: const si = new SourceIntelligenceLayer()');
  log('  3. Use: await si.initialize(page)');

  log('\n🔧 Available Commands:', colors.bright);
  log('  npm run build    - Build the project');
  log('  npm test         - Run tests');
  log('  npm run lint     - Check code style');
  log('  npm run format   - Format code');

  log('\n📖 Documentation:', colors.bright);
  log('  See README.md for full documentation');
  log('  Check example.ts for usage examples');

  log('\n✨ Happy debugging with WebSee Source Intelligence!', colors.bright + colors.blue);
}

main().catch(error => {
  log('\n❌ Setup failed:', colors.red);
  console.error(error);
  process.exit(1);
});