#!/bin/bash

# SessionStart Hook: Framework Version Scanner
#
# This hook runs at the start of each Claude Code session.
# It scans the project for all frameworks and updates the version registry.
#
# Behavior:
# - Performs a full scan if registry is missing or older than 24 hours
# - Uses cached data if registry is fresh (< 24 hours)
# - Generates/updates FRAMEWORK_VERSIONS.md documentation
# - Makes registry available to all agents via environment variables

# Get the script's directory to source the library
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HOOK_DIR/framework-registry.sh"

REGISTRY_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/framework-versions.json"
DOCS_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/FRAMEWORK_VERSIONS.md"

# Determine if a full scan is needed
needs_scan() {
  if [ ! -f "$REGISTRY_FILE" ]; then
    return 0  # true
  fi

  local LAST_UPDATED=$(jq -r '.last_updated // "never"' "$REGISTRY_FILE" 2>/dev/null)

  if [ "$LAST_UPDATED" = "never" ] || [ -z "$LAST_UPDATED" ]; then
    return 0  # true
  fi

  # Calculate age (platform-independent)
  local LAST_EPOCH=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$LAST_UPDATED" +%s 2>/dev/null || date -d "$LAST_UPDATED" +%s 2>/dev/null || echo 0)
  local NOW_EPOCH=$(date +%s)
  local AGE=$((NOW_EPOCH - LAST_EPOCH))

  if [ $AGE -gt 86400 ]; then
    return 0  # true - older than 24 hours
  fi

  return 1  # false - fresh cache
}

# Main execution
main() {
  echo "" >&2
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  echo "  Framework Version Management System" >&2
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  echo "" >&2

  if needs_scan; then
    echo "[Status: Performing full project scan...]" >&2
    scan_project
    generate_docs

    echo "" >&2
    echo "✓ Framework registry updated" >&2
    echo "✓ Documentation generated: .claude/FRAMEWORK_VERSIONS.md" >&2
    echo "" >&2
  else
    echo "[Status: Using cached data (< 24 hours old)]" >&2

    local FRAMEWORK_COUNT=$(jq -r '.frameworks | length' "$REGISTRY_FILE" 2>/dev/null || echo 0)
    echo "[Frameworks tracked: $FRAMEWORK_COUNT]" >&2
    echo "" >&2
  fi

  # Display the documentation to Claude
  if [ -f "$DOCS_FILE" ]; then
    cat "$DOCS_FILE" >&2
  fi

  # Make registry paths available to agents via environment
  if [ -n "$CLAUDE_ENV_FILE" ]; then
    echo "export FRAMEWORK_REGISTRY=\"$REGISTRY_FILE\"" >> "$CLAUDE_ENV_FILE"
    echo "export FRAMEWORK_DOCS=\"$DOCS_FILE\"" >> "$CLAUDE_ENV_FILE"
  fi

  echo "" >&2
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  echo "" >&2

  exit 2  # Send output to Claude
}

main
