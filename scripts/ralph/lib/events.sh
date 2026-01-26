#!/bin/bash
# events.sh - Event emission for Ralph Assembly Line visualization
# Writes JSON events to .ralph/events/<session>/events.jsonl for real-time UI consumption

_EVENTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
RALPH_EVENTS_ENABLED="${RALPH_EVENTS_ENABLED:-true}"
RALPH_DIR="${RALPH_DIR:-.ralph}"
EVENTS_BASE_DIR="$RALPH_DIR/events"

# Initialize events directory for a session
# Arguments:
#   $1 - session_id
init_events_dir() {
  local session_id="$1"

  if [ "$RALPH_EVENTS_ENABLED" != "true" ]; then
    return 0
  fi

  local events_dir="$EVENTS_BASE_DIR/$session_id"
  mkdir -p "$events_dir"

  # Create metadata file
  local metadata_file="$events_dir/metadata.json"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  jq -n \
    --arg sid "$session_id" \
    --arg ts "$timestamp" \
    '{
      session_id: $sid,
      created_at: $ts,
      event_count: 0
    }' > "$metadata_file"

  echo "$events_dir"
}

# Emit an event to the session's event file
# Arguments:
#   $1 - session_id
#   $2 - event_type (e.g., "session_start", "iteration_start", "story_complete")
#   $3 - payload (JSON object as string, or empty for no payload)
emit_event() {
  local session_id="$1"
  local event_type="$2"
  local payload="${3:-{}}"

  if [ "$RALPH_EVENTS_ENABLED" != "true" ]; then
    return 0
  fi

  if [ -z "$session_id" ]; then
    return 0
  fi

  local events_dir="$EVENTS_BASE_DIR/$session_id"
  local events_file="$events_dir/events.jsonl"

  # Ensure directory exists
  if [ ! -d "$events_dir" ]; then
    mkdir -p "$events_dir"
  fi

  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  local event_id
  event_id=$(date +%s%N 2>/dev/null || date +%s)

  # Build and append event (using jq for proper JSON escaping)
  jq -n -c \
    --arg id "$event_id" \
    --arg type "$event_type" \
    --arg ts "$timestamp" \
    --arg sid "$session_id" \
    --argjson payload "$payload" \
    '{
      id: $id,
      type: $type,
      timestamp: $ts,
      session_id: $sid,
      payload: $payload
    }' >> "$events_file"
}

# ============================================
# Convenience functions for specific event types
# ============================================

# Session lifecycle events
emit_session_start() {
  local session_id="$1"
  local feature_name="$2"
  local max_iterations="$3"

  emit_event "$session_id" "session_start" "$(jq -n -c \
    --arg feature "$feature_name" \
    --arg max "$max_iterations" \
    '{feature_name: $feature, max_iterations: ($max | tonumber)}')"
}

emit_session_end() {
  local session_id="$1"
  local status="$2"  # "completed" or "incomplete"
  local reason="${3:-}"

  emit_event "$session_id" "session_end" "$(jq -n -c \
    --arg status "$status" \
    --arg reason "$reason" \
    '{status: $status, reason: $reason}')"
}

# Iteration lifecycle events
emit_iteration_start() {
  local session_id="$1"
  local iteration="$2"
  local max_iterations="$3"
  local current_story_id="${4:-}"
  local current_story_title="${5:-}"

  emit_event "$session_id" "iteration_start" "$(jq -n -c \
    --arg iter "$iteration" \
    --arg max "$max_iterations" \
    --arg story_id "$current_story_id" \
    --arg story_title "$current_story_title" \
    '{
      iteration: ($iter | tonumber),
      max_iterations: ($max | tonumber),
      current_story: {id: $story_id, title: $story_title}
    }')"
}

emit_iteration_end() {
  local session_id="$1"
  local iteration="$2"
  local remaining_stories="$3"

  emit_event "$session_id" "iteration_end" "$(jq -n -c \
    --arg iter "$iteration" \
    --arg remaining "$remaining_stories" \
    '{
      iteration: ($iter | tonumber),
      remaining_stories: ($remaining | tonumber)
    }')"
}

# Story lifecycle events
emit_story_start() {
  local session_id="$1"
  local story_id="$2"
  local story_title="$3"
  local acceptance_criteria="$4"  # JSON array as string

  emit_event "$session_id" "story_start" "$(jq -n -c \
    --arg id "$story_id" \
    --arg title "$story_title" \
    --argjson criteria "$acceptance_criteria" \
    '{id: $id, title: $title, acceptance_criteria: $criteria}')"
}

emit_story_complete() {
  local session_id="$1"
  local story_id="$2"

  emit_event "$session_id" "story_complete" "$(jq -n -c \
    --arg id "$story_id" \
    '{id: $id}')"
}

emit_story_failed() {
  local session_id="$1"
  local story_id="$2"
  local reason="${3:-}"

  emit_event "$session_id" "story_failed" "$(jq -n -c \
    --arg id "$story_id" \
    --arg reason "$reason" \
    '{id: $id, reason: $reason}')"
}

# Agent activity events
emit_agent_spawn() {
  local session_id="$1"
  local agent_type="$2"  # e.g., "code-reviewer", "pr-test-analyzer"
  local agent_id="$3"
  local context="${4:-}"  # Brief context or prompt snippet

  emit_event "$session_id" "agent_spawn" "$(jq -n -c \
    --arg type "$agent_type" \
    --arg id "$agent_id" \
    --arg ctx "$context" \
    '{agent_type: $type, agent_id: $id, context: $ctx}')"
}

emit_agent_output() {
  local session_id="$1"
  local agent_id="$2"
  local output="$3"
  local output_type="${4:-text}"  # "text", "tool_call", "error"

  emit_event "$session_id" "agent_output" "$(jq -n -c \
    --arg id "$agent_id" \
    --arg out "$output" \
    --arg type "$output_type" \
    '{agent_id: $id, output: $out, output_type: $type}')"
}

emit_agent_complete() {
  local session_id="$1"
  local agent_id="$2"
  local status="$3"  # "success", "failure", "timeout"

  emit_event "$session_id" "agent_complete" "$(jq -n -c \
    --arg id "$agent_id" \
    --arg status "$status" \
    '{agent_id: $id, status: $status}')"
}

# Quality gate events
emit_quality_gate_start() {
  local session_id="$1"
  local gate_type="$2"  # "code-review", "test-analysis", "typecheck"
  local story_id="${3:-}"

  emit_event "$session_id" "quality_gate_start" "$(jq -n -c \
    --arg type "$gate_type" \
    --arg story "$story_id" \
    '{gate_type: $type, story_id: $story}')"
}

emit_quality_gate_pass() {
  local session_id="$1"
  local gate_type="$2"
  local details="${3:-}"

  emit_event "$session_id" "quality_gate_pass" "$(jq -n -c \
    --arg type "$gate_type" \
    --arg details "$details" \
    '{gate_type: $type, details: $details}')"
}

emit_quality_gate_fail() {
  local session_id="$1"
  local gate_type="$2"
  local issues="$3"  # JSON array of issues

  emit_event "$session_id" "quality_gate_fail" "$(jq -n -c \
    --arg type "$gate_type" \
    --argjson issues "$issues" \
    '{gate_type: $type, issues: $issues}')"
}

# PRD/Task events
emit_prd_loaded() {
  local session_id="$1"
  local total_stories="$2"
  local branch_name="$3"

  emit_event "$session_id" "prd_loaded" "$(jq -n -c \
    --arg total "$total_stories" \
    --arg branch "$branch_name" \
    '{total_stories: ($total | tonumber), branch_name: $branch}')"
}

emit_prd_updated() {
  local session_id="$1"
  local completed_stories="$2"
  local total_stories="$3"

  emit_event "$session_id" "prd_updated" "$(jq -n -c \
    --arg completed "$completed_stories" \
    --arg total "$total_stories" \
    '{
      completed_stories: ($completed | tonumber),
      total_stories: ($total | tonumber)
    }')"
}

# Prompt/briefing events (for context display)
emit_briefing_generated() {
  local session_id="$1"
  local iteration="$2"
  local briefing_content="$3"

  emit_event "$session_id" "briefing_generated" "$(jq -n -c \
    --arg iter "$iteration" \
    --arg content "$briefing_content" \
    '{iteration: ($iter | tonumber), content: $content}')"
}

# Get events directory for a session
get_events_dir() {
  local session_id="$1"
  echo "$EVENTS_BASE_DIR/$session_id"
}

# Get path to events file
get_events_file() {
  local session_id="$1"
  echo "$EVENTS_BASE_DIR/$session_id/events.jsonl"
}

# Standalone execution for testing
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "events.sh - Test Mode"
  echo ""

  case "${1:-}" in
    test)
      # Run a test sequence
      test_session="test-$(date +%s)"
      echo "Creating test session: $test_session"

      init_events_dir "$test_session"
      emit_session_start "$test_session" "test-feature" "5"
      emit_prd_loaded "$test_session" "3" "ralph/test-feature"
      emit_iteration_start "$test_session" "1" "5" "US-001" "Test Story"
      emit_story_start "$test_session" "US-001" "Test Story" '["criterion 1", "criterion 2"]'
      emit_agent_spawn "$test_session" "code-reviewer" "agent-123" "Reviewing changes"
      emit_quality_gate_start "$test_session" "code-review" "US-001"
      emit_quality_gate_pass "$test_session" "code-review" "All checks passed"
      emit_agent_complete "$test_session" "agent-123" "success"
      emit_story_complete "$test_session" "US-001"
      emit_iteration_end "$test_session" "1" "2"
      emit_session_end "$test_session" "completed"

      echo ""
      echo "Events written to: $(get_events_file "$test_session")"
      echo ""
      echo "Contents:"
      cat "$(get_events_file "$test_session")"
      ;;
    *)
      echo "Commands:"
      echo "  test    - Run a test sequence and display events"
      echo ""
      echo "Environment Variables:"
      echo "  RALPH_EVENTS_ENABLED=$RALPH_EVENTS_ENABLED"
      echo "  RALPH_DIR=$RALPH_DIR"
      echo "  EVENTS_BASE_DIR=$EVENTS_BASE_DIR"
      ;;
  esac
fi
