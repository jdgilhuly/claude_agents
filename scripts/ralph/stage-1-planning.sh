#!/bin/bash
# stage-1-planning.sh - Run Claude Code in plan mode to refine initial idea
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/ui.sh"
source "$SCRIPT_DIR/lib/session.sh"

# Planning system prompt
PLANNING_SYSTEM_PROMPT='You are a technical planning assistant. Your task is to take the user'"'"'s initial idea and expand it into a comprehensive technical plan.

Ask 3-5 clarifying questions first if the prompt is ambiguous. Format questions with A/B/C/D options for easy response.

Then structure your final plan as:

## Project Overview
[Expanded description of what will be built]

## Core Features
[Bulleted list of main features with brief descriptions]

## Technical Architecture
[High-level architecture decisions - stack, patterns, structure]

## User Flows
[Key user journeys through the application]

## Data Model
[Main entities and their relationships]

## API Design
[Key endpoints or interactions - REST/GraphQL/etc]

## Non-Goals / Out of Scope
[What this project will NOT include in v1]

## Open Questions
[Any remaining questions or decisions to be made]

Be specific and actionable. This plan will feed into PRD and task generation.'

run_planning_stage() {
  local prompt="$1"
  local session_id="$2"
  local output_file="$3"

  print_stage "1" "PLANNING MODE"

  echo -e "Initial prompt: ${CYAN}$prompt${NC}"
  echo ""
  print_info "Starting interactive planning session with Claude..."
  print_info "Claude will ask clarifying questions, then generate a comprehensive plan."
  echo ""

  # Update stage status
  if [ -n "$session_id" ]; then
    update_stage "$session_id" "1_planning" "in_progress" ""
  fi

  # Create the combined prompt
  local full_prompt="Please help me plan this project:

$prompt

Follow the planning structure to create a comprehensive technical plan. Start by asking 3-5 clarifying questions if needed."

  # Run Claude in plan mode (interactive)
  # Using --append-system-prompt to add planning instructions
  if ! claude --append-system-prompt "$PLANNING_SYSTEM_PROMPT" "$full_prompt"; then
    print_error "Claude session ended with error"
    return 1
  fi

  echo ""
  print_success "Planning session complete"
  echo ""

  # Prompt user to save the plan
  print_info "Please copy the final plan from Claude's output."
  echo ""
  echo "The plan should be saved to: $output_file"
  echo ""

  if confirm "Did Claude generate a satisfactory plan?" "y"; then
    # Create the output file with a template if it doesn't exist
    if [ ! -f "$output_file" ]; then
      read -p "Press Enter to open editor to paste/create the plan..."
      ${EDITOR:-vim} "$output_file"
    fi

    if [ -f "$output_file" ] && [ -s "$output_file" ]; then
      print_success "Plan saved to: $output_file"

      # Update session state
      if [ -n "$session_id" ]; then
        update_stage "$session_id" "1_planning" "completed" "$output_file"
        set_current_stage "$session_id" 2
      fi

      return 0
    else
      print_warning "Plan file is empty or missing"
      return 1
    fi
  else
    print_warning "Planning not completed"
    return 1
  fi
}

# Standalone execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [ $# -lt 1 ]; then
    echo "Usage: $0 <prompt> [output_file] [session_id]"
    echo ""
    echo "Arguments:"
    echo "  prompt       The initial project idea/prompt"
    echo "  output_file  Where to save the plan (default: plan_<timestamp>.md)"
    echo "  session_id   Optional session ID for state tracking"
    exit 1
  fi

  PROMPT="$1"
  OUTPUT_FILE="${2:-plan_$(date +%s).md}"
  SESSION_ID="${3:-}"

  run_planning_stage "$PROMPT" "$SESSION_ID" "$OUTPUT_FILE"
fi
