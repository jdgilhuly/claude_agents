#!/bin/bash
# stage-1-planning.sh - Run Claude Code in plan mode to refine initial idea
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/ui.sh"
source "$SCRIPT_DIR/lib/session.sh"

# Planning system prompt
PLANNING_SYSTEM_PROMPT='You are a technical planning assistant. Your task is to take the user'"'"'s initial idea and expand it into a comprehensive technical plan.

## IMPORTANT: Document Your Steps First

Before doing ANY work, you MUST use the TodoWrite tool to outline all the steps you plan to take. This includes:
- Clarifying questions you need to ask
- Research/exploration tasks
- Each section of the plan you will write

Update the todo list as you complete each step. This ensures the user can see your progress and approach.

## Process

1. First, use TodoWrite to create your task list
2. Ask clarifying questions as needed (use AskUserQuestion tool for multiple-choice)
3. Work through each section, marking todos complete as you go
4. Save the final plan

Structure your final plan as:

## Project Overview
[Expanded description of what will be built]

## Functional Requirements
[What the system must DO - features, behaviors, capabilities]
- User-facing features
- System behaviors
- Data operations
- Integrations

## Non-Functional Requirements
[How the system must PERFORM - quality attributes]
- Performance (response times, throughput)
- Security (authentication, authorization, data protection)
- Scalability (expected load, growth)
- Reliability (uptime, error handling)
- Usability (accessibility, UX standards)

## Technical Architecture
[High-level architecture decisions - stack, patterns, structure]

## User Flows
[Key user journeys through the application]

## Data Model
[Main entities and their relationships]

## API Design
[Key endpoints or interactions - REST/GraphQL/etc]

## Non-Goals / Out of Scope
[What this project will NOT include]

IMPORTANT: Do NOT include an "Open Questions" section. All questions must be resolved during this planning phase through clarifying questions. The final plan should have no ambiguity.

Be specific and actionable. This plan will feed into PRD and task generation.'

run_planning_stage() {
  local prompt="$1"
  local session_id="$2"
  local output_file="$3"
  local context_file="${4:-}"

  print_stage "1" "PLANNING MODE"

  echo -e "Initial prompt: ${CYAN}$prompt${NC}"
  if [ -n "$context_file" ] && [ -f "$context_file" ] && [ -s "$context_file" ]; then
    echo -e "Context file:   ${CYAN}$context_file${NC}"
  fi
  echo ""
  print_info "Starting interactive planning session with Claude..."
  print_info "Claude will ask clarifying questions, then generate a comprehensive plan."
  echo ""

  # Update stage status
  if [ -n "$session_id" ]; then
    update_stage "$session_id" "1_planning" "in_progress" ""
  fi

  # Build context section if context file exists
  local context_section=""
  if [ -n "$context_file" ] && [ -f "$context_file" ] && [ -s "$context_file" ]; then
    context_section="## Existing Codebase Context

The following context was gathered about the existing codebase. Use this to inform your planning:

$(cat "$context_file")

---

"
  fi

  # Create the combined prompt
  local full_prompt="${context_section}Please help me plan this project:

$prompt

Follow the planning structure to create a comprehensive technical plan. Start by asking as many clarifying questions as needed."

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
    echo "Usage: $0 <prompt> [output_file] [session_id] [context_file]"
    echo ""
    echo "Arguments:"
    echo "  prompt        The initial project idea/prompt"
    echo "  output_file   Where to save the plan (default: plan_<timestamp>.md)"
    echo "  session_id    Optional session ID for state tracking"
    echo "  context_file  Optional codebase context markdown file"
    exit 1
  fi

  PROMPT="$1"
  OUTPUT_FILE="${2:-plan_$(date +%s).md}"
  SESSION_ID="${3:-}"
  CONTEXT_FILE="${4:-}"

  run_planning_stage "$PROMPT" "$SESSION_ID" "$OUTPUT_FILE" "$CONTEXT_FILE"
fi
