#!/bin/bash

# UserPromptSubmit Hook: Framework Context Injector
#
# This hook runs when the user submits a prompt.
# It detects framework/implementation mentions and injects version context.
#
# Input: JSON via stdin containing the user prompt and session info
# Output: Modified prompt via stdout (exit 0)
#
# Behavior:
# - Scans prompt for keywords (implement, create, code, framework names, etc.)
# - Injects reminder to check FRAMEWORK_VERSIONS.md
# - Adds context about using WebFetch for latest documentation
# - Passes through unmodified if not relevant

DOCS_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/FRAMEWORK_VERSIONS.md"

# Read JSON from stdin
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')

# If no prompt extracted, pass through
if [ -z "$PROMPT" ]; then
  echo "$INPUT"
  exit 0
fi

# Keywords that indicate code/implementation work
IMPLEMENTATION_KEYWORDS=(
  "implement"
  "create"
  "add"
  "build"
  "write"
  "code"
  "develop"
  "framework"
  "library"
  "package"
  "install"
  "version"
  "agent"
  "subagent"
  "model"
)

# Check if prompt contains implementation keywords
RELEVANT=false
for keyword in "${IMPLEMENTATION_KEYWORDS[@]}"; do
  if echo "$PROMPT" | grep -iq "$keyword"; then
    RELEVANT=true
    break
  fi
done

# If relevant and docs exist, inject context
if [ "$RELEVANT" = true ] && [ -f "$DOCS_FILE" ]; then
  ADDITIONS="\n\n[SYSTEM CONTEXT: Project framework registry available at .claude/FRAMEWORK_VERSIONS.md]"
  ADDITIONS+="\n[IMPORTANT: Check this document for current framework versions before implementing]"
  ADDITIONS+="\n[TIP: Use WebFetch to verify latest API documentation when uncertain]"

  echo -e "${PROMPT}${ADDITIONS}"
  exit 0
fi

# Pass through unmodified
echo "$PROMPT"
exit 0
