#!/bin/bash
# stage-4-ralph.sh - Convert tasks to prd.json and run Ralph implementation loop
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/ui.sh"
source "$SCRIPT_DIR/lib/session.sh"

# Default settings
MAX_ITERATIONS="${MAX_ITERATIONS:-10}"
PAUSE_BETWEEN_ITERATIONS="${PAUSE_BETWEEN_ITERATIONS:-true}"

run_ralph_stage() {
  local tasks_file="$1"
  local feature_name="$2"
  local session_id="$3"
  local max_iterations="${4:-$MAX_ITERATIONS}"

  print_stage "4" "RALPH IMPLEMENTATION"

  # Validate tasks file
  if [ ! -f "$tasks_file" ]; then
    print_error "Tasks file not found: $tasks_file"
    return 1
  fi

  echo -e "Using tasks from: ${CYAN}$tasks_file${NC}"
  echo -e "Feature name: ${CYAN}$feature_name${NC}"
  echo -e "Max iterations: ${CYAN}$max_iterations${NC}"
  echo ""

  # Update stage status
  if [ -n "$session_id" ]; then
    update_stage "$session_id" "4_ralph" "in_progress" ""
  fi

  # Step 1: Convert tasks to prd.json format
  print_info "Step 1: Converting tasks to prd.json format..."
  echo ""

  local prd_json_file="$SCRIPT_DIR/prd.json"
  local tasks_content
  tasks_content=$(cat "$tasks_file")

  local conversion_prompt="Read the following task list and convert it to the prd.json format.

## Task List

$tasks_content

---

## prd.json Format

Create a JSON file with this structure:
{
  \"branchName\": \"ralph/$feature_name\",
  \"userStories\": [
    {
      \"id\": \"US-001\",
      \"title\": \"Task title from the task file\",
      \"acceptanceCriteria\": [\"criterion 1\", \"criterion 2\", \"typecheck passes\"],
      \"priority\": 1,
      \"passes\": false,
      \"notes\": \"\"
    }
  ]
}

## Conversion Rules:
1. Each parent task (1.0, 2.0, etc.) becomes a user story
2. Sub-tasks become acceptance criteria
3. Priority is based on task order (first task = priority 1)
4. All stories start with passes: false
5. Always include \"typecheck passes\" as a criterion
6. Skip task 0.0 (Create feature branch) - that's handled separately

Save the result to: $prd_json_file"

  # Run Claude to convert tasks (with write permission)
  if ! claude --dangerously-skip-permissions --print "$conversion_prompt"; then
    print_warning "Task conversion may have failed - please verify prd.json"
  fi

  echo ""

  # Verify prd.json exists
  if [ ! -f "$prd_json_file" ]; then
    print_error "prd.json was not created"
    if confirm "Would you like to create it manually?" "y"; then
      ${EDITOR:-vim} "$prd_json_file"
    else
      return 1
    fi
  fi

  # Show prd.json content for review
  print_info "Generated prd.json:"
  echo ""
  cat "$prd_json_file"
  echo ""

  if ! confirm "Proceed with prd.json?" "y"; then
    ${EDITOR:-vim} "$prd_json_file"
  fi

  # Step 2: Create/switch to feature branch
  print_info "Step 2: Setting up feature branch..."
  local branch_name="ralph/$feature_name"

  if git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
    print_info "Branch $branch_name exists, switching to it..."
    git checkout "$branch_name"
  else
    print_info "Creating new branch: $branch_name"
    git checkout -b "$branch_name"
  fi
  print_success "On branch: $(git branch --show-current)"
  echo ""

  # Step 3: Initialize progress.txt if needed
  local progress_file="$SCRIPT_DIR/progress.txt"
  if [ ! -f "$progress_file" ]; then
    print_info "Initializing progress.txt..."
    cat > "$progress_file" << EOF
Started: $(date +%Y-%m-%d)

## Codebase Patterns
- (patterns will be added as discovered)

## Key Files
- (key files will be documented here)

---

EOF
    print_success "Created progress.txt"
  fi

  # Step 4: Run Ralph implementation loop
  echo ""
  print_info "Step 3: Starting Ralph implementation loop..."
  echo ""

  if ! confirm "Ready to start implementation? (This will modify code)" "y"; then
    print_warning "Implementation cancelled"
    return 1
  fi

  local ralph_prompt
  ralph_prompt=$(cat "$SCRIPT_DIR/prompt.md")

  for i in $(seq 1 "$max_iterations"); do
    echo ""
    echo -e "${BOLD}═══════════════════════════════════════${NC}"
    echo -e "${BOLD}  Ralph Iteration $i of $max_iterations${NC}"
    echo -e "${BOLD}═══════════════════════════════════════${NC}"
    echo ""

    # Run Claude with full permissions for implementation
    local OUTPUT
    OUTPUT=$(claude --dangerously-skip-permissions \
      --print \
      "$ralph_prompt" 2>&1 | tee /dev/stderr) || true

    # Check for completion signal
    if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
      echo ""
      print_success "All stories completed successfully!"

      # Update session state
      if [ -n "$session_id" ]; then
        update_stage "$session_id" "4_ralph" "completed" "$prd_json_file"
      fi

      return 0
    fi

    # Check remaining stories
    local remaining
    remaining=$(jq '[.userStories[] | select(.passes == false)] | length' "$prd_json_file" 2>/dev/null || echo "?")
    print_info "Remaining stories: $remaining"

    # Pause between iterations if enabled
    if [ "$PAUSE_BETWEEN_ITERATIONS" = "true" ] && [ "$i" -lt "$max_iterations" ]; then
      echo ""
      read -p "Iteration $i complete. Press Enter to continue or Ctrl+C to stop..." _
    fi

    sleep 2
  done

  echo ""
  print_warning "Max iterations ($max_iterations) reached without completion"
  print_info "You can resume with: $0 $tasks_file $feature_name $session_id"
  return 1
}

# Standalone execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [ $# -lt 2 ]; then
    echo "Usage: $0 <tasks_file> <feature_name> [session_id] [max_iterations]"
    echo ""
    echo "Arguments:"
    echo "  tasks_file      Path to the tasks markdown file from Stage 3"
    echo "  feature_name    Kebab-case feature name (e.g., twitter-clone)"
    echo "  session_id      Optional session ID for state tracking"
    echo "  max_iterations  Maximum Ralph iterations (default: 10)"
    echo ""
    echo "Environment Variables:"
    echo "  MAX_ITERATIONS              Default max iterations (default: 10)"
    echo "  PAUSE_BETWEEN_ITERATIONS    Pause for review between iterations (default: true)"
    exit 1
  fi

  TASKS_FILE="$1"
  FEATURE_NAME="$2"
  SESSION_ID="${3:-}"
  ITERATIONS="${4:-$MAX_ITERATIONS}"

  run_ralph_stage "$TASKS_FILE" "$FEATURE_NAME" "$SESSION_ID" "$ITERATIONS"
fi
