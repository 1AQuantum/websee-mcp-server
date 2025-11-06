#!/bin/bash

# Claude Code Framework Version Management - Core Library
# Portable framework discovery and version tracking system
#
# This library provides functions to:
# - Discover frameworks from package managers (npm, pip, go, cargo)
# - Fetch latest versions from registries
# - Maintain a JSON registry of framework versions
# - Generate markdown documentation

# Configuration
REGISTRY_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/framework-versions.json"
DOCS_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/FRAMEWORK_VERSIONS.md"
CACHE_TTL=86400  # 24 hours in seconds

# Initialize registry if it doesn't exist
init_registry() {
  local REGISTRY_DIR=$(dirname "$REGISTRY_FILE")
  mkdir -p "$REGISTRY_DIR"

  if [ ! -f "$REGISTRY_FILE" ]; then
    cat > "$REGISTRY_FILE" <<'EOF'
{
  "last_updated": "",
  "frameworks": {},
  "models": {
    "claude-sonnet-4-5": {
      "id": "claude-sonnet-4-5-20250929",
      "name": "Claude Sonnet 4.5",
      "description": "Smartest model for complex agents and coding",
      "context": "200K tokens",
      "docs": "https://docs.claude.com/en/docs/about-claude/models"
    },
    "claude-haiku-4-5": {
      "id": "claude-haiku-4-5-20251001",
      "name": "Claude Haiku 4.5",
      "description": "Fastest model with near-frontier intelligence",
      "context": "200K tokens",
      "docs": "https://docs.claude.com/en/docs/about-claude/models"
    },
    "claude-opus-4-1": {
      "id": "claude-opus-4-1-20250805",
      "name": "Claude Opus 4.1",
      "description": "Exceptional model for specialized reasoning",
      "context": "200K tokens",
      "docs": "https://docs.claude.com/en/docs/about-claude/models"
    }
  }
}
EOF
  fi
}

# Discover npm/yarn packages from package.json
discover_npm_frameworks() {
  local PACKAGE_JSON="${CLAUDE_PROJECT_DIR:-.}/package.json"

  if [ ! -f "$PACKAGE_JSON" ]; then
    return
  fi

  # Extract all dependencies (dependencies, devDependencies, peerDependencies)
  jq -r '
    (.dependencies // {}) + (.devDependencies // {}) + (.peerDependencies // {})
    | to_entries[]
    | .key
  ' "$PACKAGE_JSON" 2>/dev/null | sort -u
}

# Discover Python packages from requirements.txt or pyproject.toml
discover_python_frameworks() {
  local REQ_FILE="${CLAUDE_PROJECT_DIR:-.}/requirements.txt"
  local PYPROJECT="${CLAUDE_PROJECT_DIR:-.}/pyproject.toml"

  # Try requirements.txt first
  if [ -f "$REQ_FILE" ]; then
    grep -v '^#' "$REQ_FILE" | grep -v '^$' | sed 's/[>=<~!].*//' | sed 's/ //g' | sort -u
  fi

  # Try pyproject.toml
  if [ -f "$PYPROJECT" ] && command -v toml &> /dev/null; then
    toml get "$PYPROJECT" tool.poetry.dependencies 2>/dev/null | jq -r 'keys[]' | sort -u
  fi
}

# Discover Go modules from go.mod
discover_go_frameworks() {
  local GO_MOD="${CLAUDE_PROJECT_DIR:-.}/go.mod"

  if [ ! -f "$GO_MOD" ]; then
    return
  fi

  grep -E '^\s+[a-z]' "$GO_MOD" | awk '{print $1}' | sort -u
}

# Discover Rust crates from Cargo.toml
discover_rust_frameworks() {
  local CARGO_TOML="${CLAUDE_PROJECT_DIR:-.}/Cargo.toml"

  if [ ! -f "$CARGO_TOML" ]; then
    return
  fi

  # Extract dependencies section
  sed -n '/^\[dependencies\]/,/^\[/p' "$CARGO_TOML" | grep -v '^\[' | awk '{print $1}' | grep -v '^$' | sort -u
}

# Get latest version for a framework
get_latest_version() {
  local FRAMEWORK="$1"
  local VERSION=""

  # Try npm registry
  if [ -z "$VERSION" ]; then
    VERSION=$(npm view "$FRAMEWORK" version 2>/dev/null || echo "")
  fi

  # Try PyPI
  if [ -z "$VERSION" ]; then
    VERSION=$(curl -s "https://pypi.org/pypi/$FRAMEWORK/json" 2>/dev/null | jq -r '.info.version // empty' 2>/dev/null || echo "")
  fi

  # Try crates.io for Rust
  if [ -z "$VERSION" ]; then
    VERSION=$(curl -s "https://crates.io/api/v1/crates/$FRAMEWORK" 2>/dev/null | jq -r '.crate.max_version // empty' 2>/dev/null || echo "")
  fi

  # Try GitHub releases as fallback
  if [ -z "$VERSION" ]; then
    # Handle GitHub URLs or org/repo patterns
    local REPO=$(echo "$FRAMEWORK" | sed 's/@//' | sed 's/\//\//')
    VERSION=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null | jq -r '.tag_name // empty' 2>/dev/null | sed 's/^v//' || echo "")
  fi

  echo "$VERSION"
}

# Get documentation URL for framework
get_docs_url() {
  local FRAMEWORK="$1"
  local DOCS_URL=""

  # Check known frameworks first
  case "$FRAMEWORK" in
    *"react"*|"react") DOCS_URL="https://react.dev" ;;
    *"next"*|"next") DOCS_URL="https://nextjs.org/docs" ;;
    *"modelcontextprotocol"*) DOCS_URL="https://modelcontextprotocol.io" ;;
    *"typescript"*|"typescript") DOCS_URL="https://www.typescriptlang.org/docs" ;;
    *"express"*|"express") DOCS_URL="https://expressjs.com" ;;
    *"fastapi"*|"fastapi") DOCS_URL="https://fastapi.tiangolo.com" ;;
    *"flask"*|"flask") DOCS_URL="https://flask.palletsprojects.com" ;;
    *"django"*|"django") DOCS_URL="https://docs.djangoproject.com" ;;
    *"vue"*|"vue") DOCS_URL="https://vuejs.org/guide/" ;;
    *"svelte"*|"svelte") DOCS_URL="https://svelte.dev/docs" ;;
    *"angular"*|"@angular/core") DOCS_URL="https://angular.io/docs" ;;
    *"tailwind"*|"tailwindcss") DOCS_URL="https://tailwindcss.com/docs" ;;
    *"playwright"*|"playwright") DOCS_URL="https://playwright.dev" ;;
    *"vitest"*|"vitest") DOCS_URL="https://vitest.dev" ;;
    *"jest"*|"jest") DOCS_URL="https://jestjs.io" ;;
    *"vite"*|"vite") DOCS_URL="https://vitejs.dev" ;;
    *"webpack"*|"webpack") DOCS_URL="https://webpack.js.org" ;;
    *"eslint"*|"eslint") DOCS_URL="https://eslint.org/docs" ;;
    *"prettier"*|"prettier") DOCS_URL="https://prettier.io/docs" ;;
    *"axios"*|"axios") DOCS_URL="https://axios-http.com/docs/intro" ;;
    *"lodash"*|"lodash") DOCS_URL="https://lodash.com/docs" ;;
    *"zustand"*|"zustand") DOCS_URL="https://docs.pmnd.rs/zustand" ;;
    *"tanstack"*|"@tanstack/react-query") DOCS_URL="https://tanstack.com/query/latest" ;;
    *"zod"*|"zod") DOCS_URL="https://zod.dev" ;;
    *"prisma"*|"@prisma/client") DOCS_URL="https://www.prisma.io/docs" ;;
    *"drizzle"*|"drizzle-orm") DOCS_URL="https://orm.drizzle.team" ;;
    *"trpc"*|"@trpc/server") DOCS_URL="https://trpc.io" ;;
    *)
      # Try to get from npm
      DOCS_URL=$(npm view "$FRAMEWORK" homepage 2>/dev/null || echo "")
      ;;
  esac

  echo "$DOCS_URL"
}

# Update registry with framework info
update_framework() {
  local FRAMEWORK="$1"
  local VERSION="$2"
  local DOCS_URL="$3"
  local TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

  # Get existing first_detected or use current timestamp
  local FIRST_DETECTED=$(jq -r --arg fw "$FRAMEWORK" '.frameworks[$fw].first_detected // ""' "$REGISTRY_FILE" 2>/dev/null || echo "")
  [ -z "$FIRST_DETECTED" ] && FIRST_DETECTED="$TIMESTAMP"

  # Update registry
  jq --arg fw "$FRAMEWORK" \
     --arg ver "$VERSION" \
     --arg docs "$DOCS_URL" \
     --arg ts "$TIMESTAMP" \
     --arg fd "$FIRST_DETECTED" '
    .frameworks[$fw] = {
      "version": $ver,
      "docs_url": $docs,
      "last_checked": $ts,
      "first_detected": $fd
    }
  ' "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"
}

# Scan entire project for frameworks
scan_project() {
  echo "[Scanning project for frameworks...]" >&2

  init_registry

  local FRAMEWORKS=()

  # Discover from all package managers
  while IFS= read -r fw; do
    [ -n "$fw" ] && FRAMEWORKS+=("$fw")
  done < <(discover_npm_frameworks)

  while IFS= read -r fw; do
    [ -n "$fw" ] && FRAMEWORKS+=("$fw")
  done < <(discover_python_frameworks)

  while IFS= read -r fw; do
    [ -n "$fw" ] && FRAMEWORKS+=("$fw")
  done < <(discover_go_frameworks)

  while IFS= read -r fw; do
    [ -n "$fw" ] && FRAMEWORKS+=("$fw")
  done < <(discover_rust_frameworks)

  # Remove duplicates and sort
  FRAMEWORKS=($(printf '%s\n' "${FRAMEWORKS[@]}" | sort -u))

  echo "[Found ${#FRAMEWORKS[@]} frameworks]" >&2

  # Update registry for each framework
  local COUNT=0
  local CACHED=0
  for fw in "${FRAMEWORKS[@]}"; do
    # Check if needs update (cache)
    local LAST_CHECK=$(jq -r --arg fw "$fw" '.frameworks[$fw].last_checked // "never"' "$REGISTRY_FILE" 2>/dev/null)
    local NEEDS_UPDATE=true

    if [ "$LAST_CHECK" != "never" ]; then
      # Calculate age (platform-independent)
      local LAST_CHECK_EPOCH=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$LAST_CHECK" +%s 2>/dev/null || date -d "$LAST_CHECK" +%s 2>/dev/null || echo 0)
      local NOW_EPOCH=$(date +%s)
      local CHECK_AGE=$((NOW_EPOCH - LAST_CHECK_EPOCH))

      if [ $CHECK_AGE -lt $CACHE_TTL ]; then
        NEEDS_UPDATE=false
        ((CACHED++))
      fi
    fi

    if [ "$NEEDS_UPDATE" = true ]; then
      echo "  Checking $fw..." >&2
      local VERSION=$(get_latest_version "$fw")
      local DOCS=$(get_docs_url "$fw")

      if [ -n "$VERSION" ]; then
        update_framework "$fw" "$VERSION" "$DOCS"
        ((COUNT++))
      else
        echo "    → Could not determine version" >&2
      fi
    fi
  done

  echo "[Updated $COUNT frameworks, $CACHED from cache]" >&2

  # Update last scan timestamp
  local TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
  jq --arg ts "$TIMESTAMP" '.last_updated = $ts' "$REGISTRY_FILE" > "$REGISTRY_FILE.tmp" && mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"
}

# Generate markdown documentation
generate_docs() {
  local TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z' 2>/dev/null || date)

  cat > "$DOCS_FILE" <<EOF
# Framework & Model Versions Registry

**Last Updated:** $TIMESTAMP

> This document is automatically maintained by Claude Code hooks.
> It tracks all frameworks, libraries, and models used in this project.

## Latest Model IDs

### Anthropic Claude (November 2025)
- \`claude-sonnet-4-5-20250929\` - **Sonnet 4.5** (Smartest, 200K context)
- \`claude-haiku-4-5-20251001\` - **Haiku 4.5** (Fastest, near-frontier)
- \`claude-opus-4-1-20250805\` - **Opus 4.1** (Specialized reasoning)

**Documentation:** https://docs.claude.com/en/docs/about-claude/models

### Deprecated Claude Models (DO NOT USE)
- claude-3-7-sonnet-20250219 → Use \`claude-sonnet-4-5-20250929\`
- claude-3-5-sonnet-20241022 → Use \`claude-sonnet-4-5-20250929\`
- claude-3-5-haiku-20241022 → Use \`claude-haiku-4-5-20251001\`
- claude-3-opus-20240229 → Use \`claude-opus-4-1-20250805\`
- claude-2.x (all versions) → Fully deprecated

## Project Frameworks & Libraries

EOF

  # Add frameworks from registry
  local FRAMEWORK_COUNT=$(jq -r '.frameworks | length' "$REGISTRY_FILE" 2>/dev/null || echo 0)

  if [ "$FRAMEWORK_COUNT" -gt 0 ]; then
    jq -r '
      .frameworks
      | to_entries
      | sort_by(.key)
      | .[]
      | "### \(.key)\n- **Version:** \(.value.version)\n- **Documentation:** \(.value.docs_url)\n- **Last Checked:** \(.value.last_checked)\n- **First Detected:** \(.value.first_detected)\n"
    ' "$REGISTRY_FILE" >> "$DOCS_FILE"
  else
    echo "_No frameworks detected yet. They will be added automatically as you use them._" >> "$DOCS_FILE"
    echo "" >> "$DOCS_FILE"
  fi

  cat >> "$DOCS_FILE" <<'EOF'

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

EOF
}

# Export functions for use by other scripts
export -f init_registry
export -f discover_npm_frameworks
export -f discover_python_frameworks
export -f discover_go_frameworks
export -f discover_rust_frameworks
export -f get_latest_version
export -f get_docs_url
export -f update_framework
export -f scan_project
export -f generate_docs
