#!/bin/bash
# stage-3-tasks.sh - Generate task list from PRD using generate-tasks.md guidelines
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/ui.sh"
source "$SCRIPT_DIR/lib/session.sh"

TASKS_DIR="${TASKS_DIR:-tasks}"

run_tasks_stage() {
  local prd_file="$1"
  local feature_name="$2"
  local session_id="$3"

  print_stage "3" "TASK GENERATION"

  # Validate PRD file
  if [ ! -f "$prd_file" ]; then
    print_error "PRD file not found: $prd_file"
    return 1
  fi

  echo -e "Using PRD from: ${CYAN}$prd_file${NC}"
  echo -e "Feature name: ${CYAN}$feature_name${NC}"
  echo ""

  # Update stage status
  if [ -n "$session_id" ]; then
    update_stage "$session_id" "3_tasks" "in_progress" ""
  fi

  # Read PRD content
  local prd_content
  prd_content=$(cat "$prd_file")

  # Read generate-tasks instructions
  local task_instructions=""
  if [ -f "$SCRIPT_DIR/generate-tasks.md" ]; then
    task_instructions=$(cat "$SCRIPT_DIR/generate-tasks.md")
  fi

  # Ensure tasks directory exists
  mkdir -p "$TASKS_DIR"

  local output_file="$TASKS_DIR/tasks-${feature_name}.md"

  # Construct the combined prompt
  local combined_prompt="Based on the following PRD, generate a detailed task list for implementation.

## Product Requirements Document

$prd_content

---

## Task Generation Instructions

$task_instructions

---

IMPORTANT:
1. First generate the high-level parent tasks (~5 tasks)
2. Present them to me and wait for my 'Go' confirmation
3. Then break down into detailed sub-tasks
4. Save the final task list to: $output_file

The feature branch should be: ralph/${feature_name}"

  print_info "Starting task generation session with Claude..."
  print_info "Claude will generate parent tasks first, then wait for 'Go' to create sub-tasks."
  echo ""

  # Run Claude autonomously for task generation
  if ! claude --dangerously-skip-permissions "$combined_prompt"; then
    print_error "Claude session ended with error"
    return 1
  fi

  echo ""
  print_success "Task generation session complete"
  echo ""

  # Check if output file was created
  if [ -f "$output_file" ] && [ -s "$output_file" ]; then
    print_success "Tasks saved to: $output_file"

    # Update session state
    if [ -n "$session_id" ]; then
      update_stage "$session_id" "3_tasks" "completed" "$output_file"
      set_current_stage "$session_id" 4
    fi

    return 0
  else
    print_warning "Tasks file not found or empty: $output_file"
    echo ""
    if confirm "Would you like to manually create/edit the tasks file?" "y"; then
      ${EDITOR:-vim} "$output_file"

      if [ -f "$output_file" ] && [ -s "$output_file" ]; then
        print_success "Tasks saved to: $output_file"

        if [ -n "$session_id" ]; then
          update_stage "$session_id" "3_tasks" "completed" "$output_file"
          set_current_stage "$session_id" 4
        fi

        return 0
      fi
    fi

    return 1
  fi
}

# Standalone execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [ $# -lt 2 ]; then
    echo "Usage: $0 <prd_file> <feature_name> [session_id]"
    echo ""
    echo "Arguments:"
    echo "  prd_file      Path to the PRD markdown file from Stage 2"
    echo "  feature_name  Kebab-case feature name (e.g., twitter-clone)"
    echo "  session_id    Optional session ID for state tracking"
    exit 1
  fi

  PRD_FILE="$1"
  FEATURE_NAME="$2"
  SESSION_ID="${3:-}"

  run_tasks_stage "$PRD_FILE" "$FEATURE_NAME" "$SESSION_ID"
fi
