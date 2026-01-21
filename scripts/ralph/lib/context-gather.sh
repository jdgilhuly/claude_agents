#!/bin/bash
# context-gather.sh - Gather codebase context using Claude subagents
# Spawns Explore subagents to understand project structure, patterns, and relevant code

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/ui.sh"

# Gather codebase context by spawning Explore subagents
# Arguments:
#   $1 - User's prompt/feature request
#   $2 - Session ID
#   $3 - Output file path for context
run_context_gathering() {
  local prompt="$1"
  local session_id="$2"
  local output_file="$3"

  print_stage "0" "CONTEXT GATHERING"
  echo -e "Analyzing codebase for: ${CYAN}$prompt${NC}"
  echo ""

  # Run Claude to spawn Explore subagents and gather context
  # Using --dangerously-skip-permissions for autonomous execution
  # Using --print to capture output
  local context_prompt="You are gathering codebase context for a planning session.

The user wants to: $prompt

Use the Task tool to launch up to 3 Explore subagents IN PARALLEL to gather relevant context:

1. **Architecture Explorer**: Based on the user's request, identify and explore the project structure, relevant directories, frameworks, and technologies that will be involved in this change.

2. **Related Code Explorer**: Find existing code that is most relevant to the requested feature - similar implementations, modules that will be modified, APIs that will be used.

3. **Pattern Explorer**: Discover coding conventions, existing patterns, and style guidelines that should be followed when implementing this change.

After all subagents complete, synthesize their findings into a structured markdown document with these sections:

# Codebase Context

## Project Overview
[Tech stack, project structure, key directories]

## Relevant Code Areas
[Files and modules related to the requested feature]

## Existing Patterns
[Coding conventions and patterns to follow]

## Integration Points
[Where new code will connect with existing code]

## Potential Challenges
[Complexity, constraints, or considerations discovered]

Output ONLY the markdown document - no additional commentary."

  if claude --dangerously-skip-permissions --print "$context_prompt" > "$output_file" 2>/dev/null; then
    # Check if output file has meaningful content
    if [ -s "$output_file" ] && grep -q "^#" "$output_file"; then
      return 0
    else
      print_warning "Context gathering produced empty or invalid output"
      rm -f "$output_file"
      return 1
    fi
  else
    print_warning "Claude context gathering failed"
    rm -f "$output_file"
    return 1
  fi
}

# Standalone execution for testing
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [ $# -lt 2 ]; then
    echo "Usage: $0 <prompt> <output_file> [session_id]"
    echo ""
    echo "Arguments:"
    echo "  prompt       The feature request/prompt to gather context for"
    echo "  output_file  Where to save the context markdown"
    echo "  session_id   Optional session ID (for logging)"
    exit 1
  fi

  PROMPT="$1"
  OUTPUT_FILE="$2"
  SESSION_ID="${3:-}"

  run_context_gathering "$PROMPT" "$SESSION_ID" "$OUTPUT_FILE"
fi
