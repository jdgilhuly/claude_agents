#!/bin/bash
# context-gather.sh - Gather codebase context using Claude subagents
# Spawns Explore subagents to understand project structure, patterns, and relevant code

_CONTEXT_GATHER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$_CONTEXT_GATHER_DIR/ui.sh"
source "$_CONTEXT_GATHER_DIR/claude-invoke.sh"

# Configuration
CONTEXT_GATHER_VERBOSE="${CONTEXT_GATHER_VERBOSE:-true}"

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

  # Create a log file for the full Claude session
  local log_file="${output_file%.md}.log"

  if [ "$CONTEXT_GATHER_VERBOSE" = "true" ]; then
    echo ""
    print_info "Claude activity (streaming):"
    echo -e "${CYAN}────────────────────────────────────────${NC}"

    # Stream Claude output to terminal AND capture to log file
    # Use tee to show real-time activity
    if ralph_claude "$context_prompt" 2>&1 | tee "$log_file"; then
      echo -e "${CYAN}────────────────────────────────────────${NC}"
      echo ""

      # Extract just the markdown output (everything from first # heading)
      if grep -q "^#" "$log_file"; then
        # Extract from first markdown heading to end
        sed -n '/^# /,$p' "$log_file" > "$output_file"
        print_success "Context saved to: $output_file"
        print_info "Full log saved to: $log_file"
        return 0
      else
        print_warning "Context gathering produced no markdown output"
        print_info "Check log file: $log_file"
        return 1
      fi
    else
      echo -e "${CYAN}────────────────────────────────────────${NC}"
      print_warning "Claude context gathering failed"
      print_info "Check log file: $log_file"
      return 1
    fi
  else
    # Quiet mode - original behavior
    if ralph_claude "$context_prompt" --print > "$output_file" 2>/dev/null; then
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
    echo ""
    echo "Environment Variables:"
    echo "  CONTEXT_GATHER_VERBOSE=true   Show Claude's activity in real-time (default: true)"
    echo "  CONTEXT_GATHER_VERBOSE=false  Quiet mode, no streaming output"
    exit 1
  fi

  PROMPT="$1"
  OUTPUT_FILE="$2"
  SESSION_ID="${3:-}"

  run_context_gathering "$PROMPT" "$SESSION_ID" "$OUTPUT_FILE"
fi
