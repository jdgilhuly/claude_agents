#!/bin/bash
# ralph-workflow.sh - Master orchestrator for Ralph workflow
# Chains: Planning -> PRD -> Tasks -> Implementation
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/ui.sh"
source "$SCRIPT_DIR/lib/session.sh"
source "$SCRIPT_DIR/lib/feature-name.sh"

# Configuration
TASKS_DIR="${TASKS_DIR:-tasks}"
MAX_ITERATIONS="${MAX_ITERATIONS:-10}"

# Show usage
show_usage() {
  cat << EOF
Ralph Workflow Orchestrator

Usage:
  $(basename "$0") "<prompt>"                    Start new workflow
  $(basename "$0") --greenfield "<prompt>"       Start new project (skip codebase context)
  $(basename "$0") --resume <session_id>         Resume existing session
  $(basename "$0") --continue                    Resume most recent session
  $(basename "$0") --list-sessions               List all sessions
  $(basename "$0") --resume <id> --from-stage N  Resume from specific stage

Options:
  --greenfield       Skip codebase context gathering (for new projects)
  --resume <id>      Resume a specific session by ID
  --continue         Resume the most recent session
  --from-stage <N>   Start from stage N (1-4) when resuming
  --list-sessions    List all workflow sessions
  --max-iterations   Max Ralph iterations (default: 10)
  -h, --help         Show this help

Stages:
  1. Planning    - Refine idea with Claude in plan mode
  2. PRD         - Generate Product Requirements Document
  3. Tasks       - Generate implementation task list
  4. Ralph       - Implement tasks iteratively

Examples:
  $(basename "$0") "add user authentication"     # Gathers codebase context first
  $(basename "$0") --greenfield "twitter clone"  # Skips context for new project
  $(basename "$0") --resume abc12345
  $(basename "$0") --continue --from-stage 3

EOF
}

# Parse command line arguments
parse_args() {
  PROMPT=""
  RESUME_SESSION=""
  FROM_STAGE=""
  LIST_SESSIONS=false
  GREENFIELD=false

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --greenfield)
        GREENFIELD=true
        shift
        ;;
      --resume)
        RESUME_SESSION="$2"
        shift 2
        ;;
      --continue)
        RESUME_SESSION="__latest__"
        shift
        ;;
      --from-stage)
        FROM_STAGE="$2"
        shift 2
        ;;
      --list-sessions)
        LIST_SESSIONS=true
        shift
        ;;
      --max-iterations)
        MAX_ITERATIONS="$2"
        shift 2
        ;;
      -h|--help)
        show_usage
        exit 0
        ;;
      -*)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
      *)
        PROMPT="$1"
        shift
        ;;
    esac
  done
}

# Run the workflow
run_workflow() {
  local session_id="$1"
  local start_stage="${2:-1}"
  local session_dir
  session_dir=$(get_session_dir "$session_id")

  # Load session state
  local state
  state=$(load_session "$session_id")

  local feature_name
  feature_name=$(echo "$state" | jq -r '.feature_name')

  local original_prompt
  original_prompt=$(echo "$state" | jq -r '.original_prompt')

  print_header "RALPH WORKFLOW ORCHESTRATOR"
  echo -e "Session ID:    ${CYAN}$session_id${NC}"
  echo -e "Feature:       ${CYAN}$feature_name${NC}"
  echo -e "Starting from: ${CYAN}Stage $start_stage${NC}"
  echo ""

  # Stage 1: Planning
  if [ "$start_stage" -le 1 ]; then
    local plan_file="$session_dir/plan_$(date +%s).md"
    local context_file=""

    # Gather codebase context unless --greenfield flag was used
    if [ "$GREENFIELD" = false ]; then
      source "$SCRIPT_DIR/lib/context-gather.sh"
      context_file="$session_dir/codebase_context.md"
      print_info "Gathering codebase context..."
      if run_context_gathering "$original_prompt" "$session_id" "$context_file"; then
        print_success "Context gathered: $context_file"
      else
        print_warning "Context gathering failed, continuing without context"
        context_file=""
      fi
    else
      print_info "Greenfield mode: skipping codebase context gathering"
    fi

    source "$SCRIPT_DIR/stage-1-planning.sh"
    if ! run_planning_stage "$original_prompt" "$session_id" "$plan_file" "$context_file"; then
      print_error "Planning stage failed"
      return 1
    fi

    # Handle stage boundary
    local choice
    choice=$(prompt_stage_complete "Planning" "$plan_file" "PRD Generation")
    case "$choice" in
      SAVE_AND_EXIT)
        print_info "Session saved. Resume with: $0 --resume $session_id"
        exit 0
        ;;
      QUIT)
        exit 1
        ;;
    esac
  fi

  # Get plan file from state
  local plan_file
  plan_file=$(echo "$state" | jq -r '.stages."1_planning".output_file // empty')
  if [ -z "$plan_file" ] || [ ! -f "$plan_file" ]; then
    # Try to find it in session dir
    plan_file=$(find "$session_dir" -name "plan_*.md" -type f | head -1)
  fi

  # Stage 2: PRD Generation
  if [ "$start_stage" -le 2 ]; then
    if [ -z "$plan_file" ] || [ ! -f "$plan_file" ]; then
      print_error "No plan file found. Run Stage 1 first."
      return 1
    fi

    source "$SCRIPT_DIR/stage-2-prd.sh"
    if ! run_prd_stage "$plan_file" "$feature_name" "$session_id"; then
      print_error "PRD generation stage failed"
      return 1
    fi

    # Reload state
    state=$(load_session "$session_id")

    local prd_file="$TASKS_DIR/prd-${feature_name}.md"
    local choice
    choice=$(prompt_stage_complete "PRD Generation" "$prd_file" "Task Generation")
    case "$choice" in
      SAVE_AND_EXIT)
        print_info "Session saved. Resume with: $0 --resume $session_id"
        exit 0
        ;;
      QUIT)
        exit 1
        ;;
    esac
  fi

  # Stage 3: Task Generation
  if [ "$start_stage" -le 3 ]; then
    local prd_file="$TASKS_DIR/prd-${feature_name}.md"
    if [ ! -f "$prd_file" ]; then
      print_error "No PRD file found: $prd_file. Run Stage 2 first."
      return 1
    fi

    source "$SCRIPT_DIR/stage-3-tasks.sh"
    if ! run_tasks_stage "$prd_file" "$feature_name" "$session_id"; then
      print_error "Task generation stage failed"
      return 1
    fi

    # Reload state
    state=$(load_session "$session_id")

    local tasks_file="$TASKS_DIR/tasks-${feature_name}.md"
    local choice
    choice=$(prompt_stage_complete "Task Generation" "$tasks_file" "Ralph Implementation")
    case "$choice" in
      SAVE_AND_EXIT)
        print_info "Session saved. Resume with: $0 --resume $session_id"
        exit 0
        ;;
      QUIT)
        exit 1
        ;;
    esac
  fi

  # Stage 4: Ralph Implementation
  if [ "$start_stage" -le 4 ]; then
    local tasks_file="$TASKS_DIR/tasks-${feature_name}.md"
    if [ ! -f "$tasks_file" ]; then
      print_error "No tasks file found: $tasks_file. Run Stage 3 first."
      return 1
    fi

    source "$SCRIPT_DIR/stage-4-ralph.sh"
    if ! run_ralph_stage "$tasks_file" "$feature_name" "$session_id" "$MAX_ITERATIONS"; then
      print_warning "Ralph implementation did not complete all stories"
      print_info "Resume with: $0 --resume $session_id --from-stage 4"
      return 1
    fi
  fi

  # Workflow complete!
  echo ""
  print_header "WORKFLOW COMPLETE"
  print_success "All stages completed successfully!"
  echo ""
  echo "Output files:"
  echo "  - Plan: $session_dir/plan_*.md"
  echo "  - PRD:  $TASKS_DIR/prd-${feature_name}.md"
  echo "  - Tasks: $TASKS_DIR/tasks-${feature_name}.md"
  echo "  - Stories: $SCRIPT_DIR/prd.json"
  echo ""
}

# Main entry point
main() {
  parse_args "$@"

  # Handle --list-sessions
  if [ "$LIST_SESSIONS" = true ]; then
    list_sessions
    exit 0
  fi

  local session_id=""
  local start_stage=1

  # Handle resume
  if [ -n "$RESUME_SESSION" ]; then
    if [ "$RESUME_SESSION" = "__latest__" ]; then
      session_id=$(get_latest_session)
      if [ -z "$session_id" ]; then
        print_error "No sessions found to resume"
        exit 1
      fi
      print_info "Resuming latest session: $session_id"
    else
      session_id="$RESUME_SESSION"
    fi

    # Validate session exists
    if ! load_session "$session_id" >/dev/null 2>&1; then
      print_error "Session not found: $session_id"
      exit 1
    fi

    # Determine start stage
    if [ -n "$FROM_STAGE" ]; then
      start_stage="$FROM_STAGE"
    else
      # Start from current stage
      start_stage=$(get_session_prop "$session_id" "current_stage")
    fi
  else
    # New session
    if [ -z "$PROMPT" ]; then
      print_error "No prompt provided"
      show_usage
      exit 1
    fi

    # Get feature name
    local feature_name
    feature_name=$(confirm_feature_name "$PROMPT")

    # Initialize session
    print_info "Initializing new session..."
    mkdir -p "$RALPH_DIR/sessions"
    session_id=$(init_session "$PROMPT" "$feature_name")
    print_success "Session created: $session_id"
  fi

  # Ensure tasks directory exists
  mkdir -p "$TASKS_DIR"

  # Run the workflow
  run_workflow "$session_id" "$start_stage"
}

main "$@"
