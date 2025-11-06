#!/bin/bash

# PostToolUse Hook: Framework Usage Verifier
#
# This hook runs after Write operations complete.
# It verifies that frameworks used in code match the registry.
#
# Input: JSON via stdin containing tool_input with file_path, etc.
# Output: Exit 2 with stderr to send info to Claude, Exit 0 for silent success
#
# Behavior:
# - Reads the written file
# - Extracts imports/requires
# - Checks against registry for version info
# - Reports framework versions and documentation URLs
# - Warns about outdated model IDs

REGISTRY_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/framework-versions.json"

# Read JSON from stdin
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file
if [ -z "$FILE" ]; then
  exit 0
fi

# Only check code files
if [[ ! "$FILE" =~ \.(ts|tsx|js|jsx|py|go|rs)$ ]]; then
  exit 0
fi

# Skip if registry doesn't exist
if [ ! -f "$REGISTRY_FILE" ]; then
  exit 0
fi

# Read the written file
if [ ! -f "$FILE" ]; then
  exit 0
fi

CONTENT=$(cat "$FILE" 2>/dev/null || echo "")

# Extract imports
FRAMEWORKS_USED=()

# JavaScript/TypeScript
while IFS= read -r line; do
  if [[ "$line" =~ from[[:space:]]+[\'\"]([^\'\"]+) ]]; then
    local PKG="${BASH_REMATCH[1]}"

    if [[ "$PKG" =~ ^@[^/]+/[^/]+ ]]; then
      PKG=$(echo "$PKG" | cut -d'/' -f1-2)
    elif [[ "$PKG" =~ ^[^/]+ ]]; then
      PKG=$(echo "$PKG" | cut -d'/' -f1)
    fi

    [[ -n "$PKG" && ! "$PKG" =~ ^\. ]] && FRAMEWORKS_USED+=("$PKG")
  fi
done < <(echo "$CONTENT" | grep -E "^import.*from|^const.*=.*require\(")

# Python
while IFS= read -r line; do
  if [[ "$line" =~ ^import[[:space:]]+([a-zA-Z0-9_]+) ]] || [[ "$line" =~ ^from[[:space:]]+([a-zA-Z0-9_]+) ]]; then
    local PKG="${BASH_REMATCH[1]}"
    [[ -n "$PKG" ]] && FRAMEWORKS_USED+=("$PKG")
  fi
done < <(echo "$CONTENT" | grep -E "^import |^from ")

# Remove duplicates
FRAMEWORKS_USED=($(printf '%s\n' "${FRAMEWORKS_USED[@]}" | sort -u))

# Check for outdated Claude models
OUTDATED_MODELS=(
  "claude-3-7-sonnet-20250219:claude-sonnet-4-5-20250929"
  "claude-3-5-sonnet-20241022:claude-sonnet-4-5-20250929"
  "claude-3-5-haiku-20241022:claude-haiku-4-5-20251001"
  "claude-3-opus-20240229:claude-opus-4-1-20250805"
  "claude-2:claude-sonnet-4-5-20250929 or claude-haiku-4-5-20251001"
)

FOUND_OUTDATED=false
for entry in "${OUTDATED_MODELS[@]}"; do
  OLD_MODEL="${entry%%:*}"
  NEW_MODEL="${entry#*:}"

  if echo "$CONTENT" | grep -qF "$OLD_MODEL"; then
    if [ "$FOUND_OUTDATED" = false ]; then
      echo "" >&2
      echo "⚠️  OUTDATED MODEL DETECTED" >&2
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
      FOUND_OUTDATED=true
    fi
    echo "  Found: $OLD_MODEL" >&2
    echo "  → Use: $NEW_MODEL" >&2
  fi
done

if [ "$FOUND_OUTDATED" = true ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  echo "" >&2
fi

# Report framework usage
if [ ${#FRAMEWORKS_USED[@]} -gt 0 ]; then
  FOUND_FRAMEWORKS=false

  for fw in "${FRAMEWORKS_USED[@]}"; do
    VERSION=$(jq -r --arg fw "$fw" '.frameworks[$fw].version // empty' "$REGISTRY_FILE" 2>/dev/null)
    DOCS=$(jq -r --arg fw "$fw" '.frameworks[$fw].docs_url // empty' "$REGISTRY_FILE" 2>/dev/null)

    if [ -n "$VERSION" ]; then
      if [ "$FOUND_FRAMEWORKS" = false ]; then
        echo "" >&2
        echo "FRAMEWORK USAGE VERIFIED" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        FOUND_FRAMEWORKS=true
      fi

      echo "  ✓ $fw: v$VERSION" >&2
      [ -n "$DOCS" ] && echo "    Docs: $DOCS" >&2
    fi
  done

  if [ "$FOUND_FRAMEWORKS" = true ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "" >&2
    exit 2  # Send to Claude
  fi
fi

exit 0
