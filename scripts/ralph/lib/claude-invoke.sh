#!/bin/bash
# claude-invoke.sh - Standardized Claude invocation with full permissions
# This ensures Claude runs without permission prompts in the Ralph workflow

# Tools allowed for Ralph implementation workflow
RALPH_ALLOWED_TOOLS="Bash Edit Write Read Glob Grep Task NotebookEdit WebFetch WebSearch"

# Tools allowed for read-only operations (planning, analysis)
RALPH_READONLY_TOOLS="Read Glob Grep Task WebFetch WebSearch"

# Invoke Claude with full permissions for Ralph workflow
# Usage: ralph_claude "prompt" [additional_args...]
ralph_claude() {
  local prompt="$1"
  shift  # Remove prompt from args, rest are passed through

  claude --dangerously-skip-permissions \
    --allowedTools "$RALPH_ALLOWED_TOOLS" \
    "$@" \
    "$prompt"
}

# Invoke Claude for read-only operations (planning, analysis)
# Usage: ralph_claude_readonly "prompt" [additional_args...]
ralph_claude_readonly() {
  local prompt="$1"
  shift

  claude --dangerously-skip-permissions \
    --allowedTools "$RALPH_READONLY_TOOLS" \
    "$@" \
    "$prompt"
}

# Invoke Claude with streaming output (for verbose mode)
# Usage: ralph_claude_stream "prompt" output_file
ralph_claude_stream() {
  local prompt="$1"
  local output_file="$2"

  claude --dangerously-skip-permissions \
    --allowedTools "$RALPH_ALLOWED_TOOLS" \
    "$prompt" 2>&1 | tee "$output_file"
}
