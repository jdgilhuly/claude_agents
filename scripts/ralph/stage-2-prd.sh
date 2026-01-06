#!/bin/bash
# stage-2-prd.sh - Generate PRD from plan using create-prd.md guidelines
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/ui.sh"
source "$SCRIPT_DIR/lib/session.sh"

TASKS_DIR="${TASKS_DIR:-tasks}"

run_prd_stage() {
  local plan_file="$1"
  local feature_name="$2"
  local session_id="$3"

  print_stage "2" "PRD GENERATION"

  # Validate plan file
  if [ ! -f "$plan_file" ]; then
    print_error "Plan file not found: $plan_file"
    return 1
  fi

  echo -e "Using plan from: ${CYAN}$plan_file${NC}"
  echo -e "Feature name: ${CYAN}$feature_name${NC}"
  echo ""

  # Update stage status
  if [ -n "$session_id" ]; then
    update_stage "$session_id" "2_prd" "in_progress" ""
  fi

  # Read plan content
  local plan_content
  plan_content=$(cat "$plan_file")

  # Read create-prd instructions
  local prd_instructions=""
  if [ -f "$SCRIPT_DIR/create-prd.md" ]; then
    prd_instructions=$(cat "$SCRIPT_DIR/create-prd.md")
  fi

  # Ensure tasks directory exists
  mkdir -p "$TASKS_DIR"

  local output_file="$TASKS_DIR/prd-${feature_name}.md"

  # Construct the combined prompt
  local combined_prompt="Based on the following technical plan, generate a Product Requirements Document (PRD).

## Technical Plan

$plan_content

---

## PRD Generation Instructions

$prd_instructions

---

IMPORTANT:
1. Ask 3-5 clarifying questions first if anything is ambiguous (format as 1A, 1B, 2A, 2B, etc.)
2. After I answer, generate the complete PRD
3. Save the PRD to: $output_file"

  print_info "Starting PRD generation session with Claude..."
  print_info "Claude will ask clarifying questions based on the plan."
  echo ""

  # Run Claude interactively
  if ! claude "$combined_prompt"; then
    print_error "Claude session ended with error"
    return 1
  fi

  echo ""
  print_success "PRD generation session complete"
  echo ""

  # Check if output file was created
  if [ -f "$output_file" ] && [ -s "$output_file" ]; then
    print_success "PRD saved to: $output_file"

    # Update session state
    if [ -n "$session_id" ]; then
      update_stage "$session_id" "2_prd" "completed" "$output_file"
      set_current_stage "$session_id" 3
    fi

    return 0
  else
    print_warning "PRD file not found or empty: $output_file"
    echo ""
    if confirm "Would you like to manually create/edit the PRD file?" "y"; then
      ${EDITOR:-vim} "$output_file"

      if [ -f "$output_file" ] && [ -s "$output_file" ]; then
        print_success "PRD saved to: $output_file"

        if [ -n "$session_id" ]; then
          update_stage "$session_id" "2_prd" "completed" "$output_file"
          set_current_stage "$session_id" 3
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
    echo "Usage: $0 <plan_file> <feature_name> [session_id]"
    echo ""
    echo "Arguments:"
    echo "  plan_file     Path to the plan markdown file from Stage 1"
    echo "  feature_name  Kebab-case feature name (e.g., twitter-clone)"
    echo "  session_id    Optional session ID for state tracking"
    exit 1
  fi

  PLAN_FILE="$1"
  FEATURE_NAME="$2"
  SESSION_ID="${3:-}"

  run_prd_stage "$PLAN_FILE" "$FEATURE_NAME" "$SESSION_ID"
fi
