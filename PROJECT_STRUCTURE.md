# WebSee Source Intelligence - Project Structure

This document provides a complete overview of the project structure after cleanup.

---

## 📁 Essential Files (Start Here)

| File | Purpose |
|------|---------|
| **[README.md](./README.md)** | Main documentation - Start here for overview and setup |
| **[CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md)** | Quick setup guide for Claude Code users |
| **[CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md)** | Quick setup guide for Claude Desktop users |
| **[MCP_TOOLS.md](./MCP_TOOLS.md)** | Complete reference for all 6 MCP tools |
| **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** | Guide for extending and contributing |

---

## 📦 Configuration Files

### Claude Code Configuration
| File | Purpose |
|------|---------|
| `claude_code_settings.json` | Sample Claude Code MCP settings (copy to your settings) |
| `.claude/project.json` | Claude Code project metadata |

### Claude Desktop Configuration
| File | Purpose |
|------|---------|
| `claude_desktop_config.json` | Sample Claude Desktop MCP config (copy to Claude settings) |

### Build Configuration
| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, and package metadata |
| `tsconfig.json` | TypeScript compiler configuration |

### IDE Configuration
| File | Purpose |
|------|---------|
| `.vscode/settings.json` | VS Code project settings |

---

## 📝 Documentation

### User Documentation
| File | Description |
|------|-------------|
| **README.md** | Main documentation with Playwright vs WebSee comparison |
| **CLAUDE_CODE_SETUP.md** | Claude Code setup (3 steps, user settings, workspace settings) |
| **CLAUDE_DESKTOP_SETUP.md** | Claude Desktop setup and troubleshooting |
| **MCP_TOOLS.md** | Detailed docs for all 6 tools with examples |

### Developer Documentation
| File | Description |
|------|-------------|
| **DEVELOPER_GUIDE.md** | Architecture, adding tools, testing, contributing |
| **FRONTEND_DEVELOPMENT_GUIDE.md** | Guide for frontend developers using WebSee |
| **MCP_AGENT_GUIDE.md** | Guide for AI agents using the MCP server |

### Testing Documentation
| File | Description |
|------|-------------|
| **tests/README.md** | Test suite overview and usage |
| **eval/README.md** | Evaluation framework documentation |
| **eval/GETTING_STARTED.md** | Quick start for evaluation |
| **eval/CI_CD_INTEGRATION.md** | CI/CD integration examples |

---

## 🗂️ Source Code Structure

```
src/
├── mcp-server.ts              # Main MCP server (stdio transport, 6 tools)
├── index.ts                   # SourceIntelligenceLayer coordination
├── source-map-resolver.ts     # Source map resolution
├── component-tracker.ts       # React/Vue/Angular tracking
├── network-tracer.ts          # Network request tracing
├── build-artifact-manager.ts  # Bundle analysis
├── browser-config.ts          # Browser configuration
├── cli.ts                     # CLI tool (optional usage)
└── evaluation.ts              # Evaluation framework
```

---

## 🧪 Testing Structure

```
tests/
├── mcp-server.test.ts         # MCP server unit/integration tests
├── performance-benchmarks.test.ts  # Performance benchmarks
├── fixtures/                   # Test HTML applications
│   ├── react-app-with-errors.html
│   ├── vue-app-performance.html
│   ├── angular-memory-leak.html
│   └── vanilla-bundle-problems.html
├── setup.ts                   # Global test setup
└── test-setup.ts              # Test environment
```

---

## 📊 Evaluation Framework

```
eval/
├── test-cases.json            # 10 evaluation scenarios
├── README.md                  # Evaluation documentation
├── GETTING_STARTED.md         # Quick start
└── CI_CD_INTEGRATION.md       # CI/CD setup examples
```

---

## 🛠️ Build Output

```
dist/                          # Generated files (after npm run build)
├── mcp-server.js              # Main MCP server executable
├── mcp-server.d.ts            # TypeScript declarations
├── index.js                   # Compiled source
└── [all other compiled files] # ~40 files total
```

---

## 🚀 Scripts (package.json)

| Script | Command | Purpose |
|--------|---------|---------|
| `setup` | `node scripts/setup.js` | One-click team setup |
| `build` | `tsc` | Compile TypeScript |
| `test` | `vitest run` | Run all tests |
| `test:watch` | `vitest` | Watch mode for tests |
| `lint` | `eslint src/**/*.ts` | Lint code |
| `format` | `prettier --write "src/**/*.ts"` | Format code |
| `mcp:build` | `tsc && chmod +x dist/mcp-server.js` | Build MCP server |
| `mcp:serve` | `node dist/mcp-server.js` | Run MCP server |
| `mcp:dev` | `tsx watch src/mcp-server.ts` | Dev mode with hot reload |
| `eval` | `npm run build && node dist/evaluation.js` | Run evaluation |
| `eval:dev` | `tsx src/evaluation.ts` | Evaluation dev mode |

---

## 📋 File Count Summary

| Category | Count | Notes |
|----------|-------|-------|
| **Documentation** | 12 files | Essential guides and references |
| **Source Code** | 9 files | Core MCP server implementation |
| **Tests** | 7+ files | Unit, integration, benchmarks |
| **Configuration** | 6 files | Package, TypeScript, IDE, MCP |
| **Evaluation** | 4 files | Test cases and CI/CD docs |

**Total**: ~40 essential files (excluding node_modules, dist)

---

## 🎯 Quick Navigation

### For New Users
1. Start with [README.md](./README.md)
2. Follow [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md) (if using Claude Code)
3. Or [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md) (if using Claude Desktop)
4. Reference [MCP_TOOLS.md](./MCP_TOOLS.md) for tool usage

### For Developers
1. Read [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
2. Check `src/` for implementation
3. Review `tests/` for testing patterns
4. See [FRONTEND_DEVELOPMENT_GUIDE.md](./FRONTEND_DEVELOPMENT_GUIDE.md) for use cases

### For Team Setup
1. Clone repository
2. Run `npm run setup`
3. Follow [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md) or [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md)
4. Share with team!

---

## 🧹 Removed Files

The following redundant files were removed during cleanup:
- `INSTALLATION_COMPLETE.md` - Temporary implementation file
- `MCP_IMPLEMENTATION_COMPLETE.md` - Temporary summary
- `CONFIGURATION_SUMMARY.md` - Merged into setup guides
- `TEST_SUITE_SUMMARY.md` - Merged into tests/README.md
- `TESTING_QUICKSTART.md` - Merged into tests/README.md
- `EVALUATION_FRAMEWORK.md` - Merged into eval/README.md
- `PRODUCTION_READY.md` - Merged into main README
- `src/README.md` - Not needed

All information from removed files is now in the essential documentation listed above.

---

## 💡 What Makes This Project Portable

1. **Single directory** - Everything in one place
2. **Standard npm** - No global dependencies (except Node.js)
3. **Self-contained** - All docs, configs, and code included
4. **Clear setup** - Follow CLAUDE_CODE_SETUP.md or CLAUDE_DESKTOP_SETUP.md
5. **Team-ready** - Setup script for easy onboarding

---

## 🔗 External Dependencies

- **Node.js 18+** - Runtime
- **Playwright** - Browser automation (installed via npm or globally)
- **Claude Code or Claude Desktop** - AI assistant with MCP support

---

**📦 Ready to share with your organization!**

The project structure is clean, documented, and ready for production use.