# Framework & Model Versions Registry

**Last Updated:** 2025-11-05 11:47:23 CST

> This document is automatically maintained by Claude Code hooks.
> It tracks all frameworks, libraries, and models used in this project.

## Latest Model IDs

### Anthropic Claude (November 2025)
- `claude-sonnet-4-5-20250929` - **Sonnet 4.5** (Smartest, 200K context)
- `claude-haiku-4-5-20251001` - **Haiku 4.5** (Fastest, near-frontier)
- `claude-opus-4-1-20250805` - **Opus 4.1** (Specialized reasoning)

**Documentation:** https://docs.claude.com/en/docs/about-claude/models

### Deprecated Claude Models (DO NOT USE)
- claude-3-7-sonnet-20250219 → Use `claude-sonnet-4-5-20250929`
- claude-3-5-sonnet-20241022 → Use `claude-sonnet-4-5-20250929`
- claude-3-5-haiku-20241022 → Use `claude-haiku-4-5-20251001`
- claude-3-opus-20240229 → Use `claude-opus-4-1-20250805`
- claude-2.x (all versions) → Fully deprecated

## Project Frameworks & Libraries

### @modelcontextprotocol/sdk
- **Version:** 1.21.0
- **Documentation:** https://modelcontextprotocol.io
- **Last Checked:** 2025-11-05T17:47:23Z
- **First Detected:** 2025-11-05T15:42:25Z

### @types/node
- **Version:** 24.10.0
- **Documentation:** https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node
- **Last Checked:** 2025-11-05T15:42:26Z
- **First Detected:** 2025-11-05T15:42:26Z

### @typescript-eslint/eslint-plugin
- **Version:** 8.46.3
- **Documentation:** https://www.typescriptlang.org/docs
- **Last Checked:** 2025-11-05T15:42:27Z
- **First Detected:** 2025-11-05T15:42:27Z

### @typescript-eslint/parser
- **Version:** 8.46.3
- **Documentation:** https://www.typescriptlang.org/docs
- **Last Checked:** 2025-11-05T15:42:28Z
- **First Detected:** 2025-11-05T15:42:28Z

### @vitest/coverage-v8
- **Version:** 4.0.7
- **Documentation:** https://vitest.dev
- **Last Checked:** 2025-11-05T15:42:28Z
- **First Detected:** 2025-11-05T15:42:28Z

### commander
- **Version:** 14.0.2
- **Documentation:** https://github.com/tj/commander.js#readme
- **Last Checked:** 2025-11-05T15:42:29Z
- **First Detected:** 2025-11-05T15:42:29Z

### eslint
- **Version:** 9.39.1
- **Documentation:** https://eslint.org/docs
- **Last Checked:** 2025-11-05T15:42:29Z
- **First Detected:** 2025-11-05T15:42:29Z

### playwright
- **Version:** 1.56.1
- **Documentation:** https://playwright.dev
- **Last Checked:** 2025-11-05T17:47:23Z
- **First Detected:** 2025-11-05T15:42:30Z

### prettier
- **Version:** 3.6.2
- **Documentation:** https://prettier.io/docs
- **Last Checked:** 2025-11-05T15:42:31Z
- **First Detected:** 2025-11-05T15:42:31Z

### source-map
- **Version:** 0.7.6
- **Documentation:** https://github.com/mozilla/source-map
- **Last Checked:** 2025-11-05T15:42:31Z
- **First Detected:** 2025-11-05T15:42:31Z

### stacktrace-js
- **Version:** 2.0.2
- **Documentation:** https://www.stacktracejs.com
- **Last Checked:** 2025-11-05T15:42:32Z
- **First Detected:** 2025-11-05T15:42:32Z

### tsx
- **Version:** 4.20.6
- **Documentation:** https://tsx.is
- **Last Checked:** 2025-11-05T15:42:33Z
- **First Detected:** 2025-11-05T15:42:33Z

### typescript
- **Version:** 5.9.3
- **Documentation:** https://www.typescriptlang.org/docs
- **Last Checked:** 2025-11-05T15:42:33Z
- **First Detected:** 2025-11-05T15:42:33Z

### vitest
- **Version:** 4.0.7
- **Documentation:** https://vitest.dev
- **Last Checked:** 2025-11-05T17:47:23Z
- **First Detected:** 2025-11-05T15:42:33Z

### zod
- **Version:** 4.1.12
- **Documentation:** https://zod.dev
- **Last Checked:** 2025-11-05T15:42:34Z
- **First Detected:** 2025-11-05T15:42:34Z


## How to Use This Registry

**For All Agents:**
1. Always reference this document before writing code
2. Use the latest versions listed here
3. Use WebFetch to verify APIs when unsure about syntax

**Version Updates:**
- Run `/refresh-versions` to update all framework versions
- New frameworks are automatically detected and added on first use
- Versions are cached for 24 hours to improve performance

**Best Practices:**
- Always specify exact model IDs (not aliases like "claude-sonnet-4-5")
- Check documentation URLs for latest API changes
- Verify deprecated versions are not used in code

## Available Commands

- `/refresh-versions` - Force refresh all framework versions
- `/show-frameworks` - Display this registry

