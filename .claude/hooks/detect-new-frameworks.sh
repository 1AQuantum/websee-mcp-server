#!/bin/bash

# PreToolUse Hook: New Framework Detector
#
# This hook runs before Write and Edit operations.
# It detects new frameworks being used and automatically adds them to the registry.
#
# Input: JSON via stdin containing tool_input with file_path, new_string, etc.
# Output: Exit 2 with stderr to send info to Claude, Exit 0 to continue
#
# Behavior:
# - Scans imports/requires in code being written
# - Detects package manager file changes (package.json, requirements.txt, etc.)
# - Checks if framework is already in registry
# - Fetches version and docs for new frameworks
# - Updates registry and documentation immediately

# Get the script's directory to source the library
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HOOK_DIR/framework-registry.sh"

REGISTRY_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/framework-versions.json"

# Read and parse JSON from stdin
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')

# Skip if no file or content
if [ -z "$FILE" ] || [ -z "$CONTENT" ]; then
  exit 0
fi

# Only process code files and package manager files
if [[ ! "$FILE" =~ \.(js|jsx|ts|tsx|py)$ ]] && [[ ! "$FILE" =~ (package\.json|requirements\.txt|pyproject\.toml|go\.mod|Cargo\.toml)$ ]]; then
  exit 0
fi

# Initialize registry if needed
init_registry

# Array to collect new frameworks
NEW_FRAMEWORKS=()

# Extract framework names from JavaScript/TypeScript imports
extract_js_imports() {
  echo "$CONTENT" | grep -E "^import.*from|^const.*=.*require\(|^import\(" | while IFS= read -r line; do
    # Match: from 'package' or from "package"
    if [[ "$line" =~ from[[:space:]]+[\'\"]([^\'\"]+) ]]; then
      local PKG="${BASH_REMATCH[1]}"

      # Extract root package name
      if [[ "$PKG" =~ ^@[^/]+/[^/]+ ]]; then
        # Scoped package: @org/pkg
        echo "$PKG" | cut -d'/' -f1-2
      elif [[ "$PKG" =~ ^[^/]+ ]]; then
        # Regular package: pkg
        echo "$PKG" | cut -d'/' -f1
      fi
    fi

    # Match: require('package') or require("package")
    if [[ "$line" =~ require\([\'\"]([^\'\"]+) ]]; then
      local PKG="${BASH_REMATCH[1]}"

      if [[ "$PKG" =~ ^@[^/]+/[^/]+ ]]; then
        echo "$PKG" | cut -d'/' -f1-2
      elif [[ "$PKG" =~ ^[^/]+ ]]; then
        echo "$PKG" | cut -d'/' -f1
      fi
    fi
  done
}

# Extract framework names from Python imports
extract_python_imports() {
  echo "$CONTENT" | grep -E "^import |^from " | while IFS= read -r line; do
    if [[ "$line" =~ ^import[[:space:]]+([a-zA-Z0-9_]+) ]]; then
      echo "${BASH_REMATCH[1]}"
    elif [[ "$line" =~ ^from[[:space:]]+([a-zA-Z0-9_]+) ]]; then
      echo "${BASH_REMATCH[1]}"
    fi
  done
}

# Extract from package.json changes
extract_from_package_json() {
  if [[ "$FILE" =~ package\.json$ ]]; then
    echo "$CONTENT" | jq -r '(.dependencies // {}) + (.devDependencies // {}) + (.peerDependencies // {}) | keys[]' 2>/dev/null
  fi
}

# Extract from requirements.txt
extract_from_requirements() {
  if [[ "$FILE" =~ requirements\.txt$ ]]; then
    echo "$CONTENT" | grep -v '^#' | grep -v '^$' | sed 's/[>=<~!].*//' | sed 's/ //g'
  fi
}

# Collect all potential frameworks
if [[ "$FILE" =~ \.(js|jsx|ts|tsx)$ ]]; then
  while IFS= read -r fw; do
    [ -n "$fw" ] && NEW_FRAMEWORKS+=("$fw")
  done < <(extract_js_imports)
elif [[ "$FILE" =~ \.py$ ]]; then
  while IFS= read -r fw; do
    [ -n "$fw" ] && NEW_FRAMEWORKS+=("$fw")
  done < <(extract_python_imports)
elif [[ "$FILE" =~ package\.json$ ]]; then
  while IFS= read -r fw; do
    [ -n "$fw" ] && NEW_FRAMEWORKS+=("$fw")
  done < <(extract_from_package_json)
elif [[ "$FILE" =~ requirements\.txt$ ]]; then
  while IFS= read -r fw; do
    [ -n "$fw" ] && NEW_FRAMEWORKS+=("$fw")
  done < <(extract_from_requirements)
fi

# Remove duplicates
NEW_FRAMEWORKS=($(printf '%s\n' "${NEW_FRAMEWORKS[@]}" | sort -u))

# Filter to only truly new frameworks
TRULY_NEW=()
for fw in "${NEW_FRAMEWORKS[@]}"; do
  # Skip if empty or starts with .
  [[ -z "$fw" || "$fw" =~ ^\. ]] && continue

  # Check if exists in registry
  local EXISTS=$(jq -r --arg fw "$fw" '.frameworks[$fw] // empty' "$REGISTRY_FILE" 2>/dev/null)
  if [ -z "$EXISTS" ]; then
    TRULY_NEW+=("$fw")
  fi
done

# If new frameworks detected, process them
if [ ${#TRULY_NEW[@]} -gt 0 ]; then
  echo "" >&2
  echo "🆕 NEW FRAMEWORKS DETECTED" >&2
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  echo "" >&2

  for fw in "${TRULY_NEW[@]}"; do
    echo "  Checking: $fw" >&2

    VERSION=$(get_latest_version "$fw")
    DOCS=$(get_docs_url "$fw")

    if [ -n "$VERSION" ]; then
      echo "    → Version: $VERSION" >&2
      [ -n "$DOCS" ] && echo "    → Docs: $DOCS" >&2

      update_framework "$fw" "$VERSION" "$DOCS"
    else
      echo "    → Could not determine version (may be internal module)" >&2
    fi
    echo "" >&2
  done

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  echo "✓ Registry updated with ${#TRULY_NEW[@]} new framework(s)" >&2
  echo "✓ Updating documentation..." >&2
  generate_docs
  echo "✓ .claude/FRAMEWORK_VERSIONS.md updated" >&2
  echo "" >&2

  exit 2  # Send to Claude
fi

exit 0  # No new frameworks, continue normally
