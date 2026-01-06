#!/bin/bash
# session.sh - Session management for Ralph workflow

# Dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/ui.sh"

# Default paths (can be overridden)
RALPH_DIR="${RALPH_DIR:-.ralph}"
SESSIONS_DIR="$RALPH_DIR/sessions"

# Generate a short session ID
generate_session_id() {
  # Generate 8-char hex ID
  if command -v uuidgen &> /dev/null; then
    uuidgen | tr '[:upper:]' '[:lower:]' | cut -c1-8
  else
    head -c 4 /dev/urandom | xxd -p
  fi
}

# Initialize a new session
init_session() {
  local prompt="$1"
  local feature_name="$2"

  local session_id
  session_id=$(generate_session_id)
  local session_dir="$SESSIONS_DIR/$session_id"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Create session directory
  mkdir -p "$session_dir"

  # Save original prompt
  echo "$prompt" > "$session_dir/prompt_original.txt"

  # Create state file
  cat > "$session_dir/state.json" << EOF
{
  "session_id": "$session_id",
  "created_at": "$timestamp",
  "updated_at": "$timestamp",
  "original_prompt": $(echo "$prompt" | jq -Rs .),
  "feature_name": "$feature_name",
  "current_stage": 1,
  "stages": {
    "1_planning": { "status": "pending", "output_file": null, "started_at": null, "completed_at": null },
    "2_prd": { "status": "pending", "output_file": null, "started_at": null, "completed_at": null },
    "3_tasks": { "status": "pending", "output_file": null, "started_at": null, "completed_at": null },
    "4_ralph": { "status": "pending", "output_file": null, "started_at": null, "completed_at": null }
  }
}
EOF

  echo "$session_id"
}

# Load an existing session
load_session() {
  local session_id="$1"
  local session_dir="$SESSIONS_DIR/$session_id"

  if [ ! -d "$session_dir" ]; then
    print_error "Session not found: $session_id"
    return 1
  fi

  if [ ! -f "$session_dir/state.json" ]; then
    print_error "Session state file not found"
    return 1
  fi

  cat "$session_dir/state.json"
}

# Update session state
update_session() {
  local session_id="$1"
  local updates="$2"  # JSON object with updates

  local session_dir="$SESSIONS_DIR/$session_id"
  local state_file="$session_dir/state.json"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  if [ ! -f "$state_file" ]; then
    print_error "Session state file not found"
    return 1
  fi

  # Merge updates into state
  local new_state
  new_state=$(jq --argjson updates "$updates" --arg ts "$timestamp" \
    '. * $updates | .updated_at = $ts' "$state_file")

  echo "$new_state" > "$state_file"
}

# Update a specific stage
update_stage() {
  local session_id="$1"
  local stage_key="$2"  # e.g., "1_planning"
  local status="$3"     # pending, in_progress, completed
  local output_file="$4"

  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  local updates
  if [ "$status" = "in_progress" ]; then
    updates=$(cat << EOF
{
  "stages": {
    "$stage_key": {
      "status": "$status",
      "started_at": "$timestamp"
    }
  }
}
EOF
)
  elif [ "$status" = "completed" ]; then
    updates=$(cat << EOF
{
  "stages": {
    "$stage_key": {
      "status": "$status",
      "output_file": "$output_file",
      "completed_at": "$timestamp"
    }
  }
}
EOF
)
  else
    updates=$(cat << EOF
{
  "stages": {
    "$stage_key": {
      "status": "$status"
    }
  }
}
EOF
)
  fi

  update_session "$session_id" "$updates"
}

# Set current stage
set_current_stage() {
  local session_id="$1"
  local stage_num="$2"

  update_session "$session_id" "{\"current_stage\": $stage_num}"
}

# Get session property
get_session_prop() {
  local session_id="$1"
  local prop="$2"

  local session_dir="$SESSIONS_DIR/$session_id"
  jq -r ".$prop" "$session_dir/state.json"
}

# Get most recent session
get_latest_session() {
  if [ ! -d "$SESSIONS_DIR" ]; then
    return 1
  fi

  # Find most recently modified state.json
  local latest
  latest=$(find "$SESSIONS_DIR" -name "state.json" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | \
           sort -rn | head -1 | awk '{print $2}')

  if [ -z "$latest" ]; then
    # Try Linux stat format
    latest=$(find "$SESSIONS_DIR" -name "state.json" -type f -printf "%T@ %p\n" 2>/dev/null | \
             sort -rn | head -1 | awk '{print $2}')
  fi

  if [ -n "$latest" ]; then
    basename "$(dirname "$latest")"
  else
    return 1
  fi
}

# List all sessions
list_sessions() {
  if [ ! -d "$SESSIONS_DIR" ]; then
    print_info "No sessions found"
    return
  fi

  echo ""
  echo -e "${BOLD}Sessions:${NC}"
  echo ""
  printf "  %-10s %-25s %-12s %s\n" "ID" "Feature" "Stage" "Created"
  printf "  %-10s %-25s %-12s %s\n" "──────────" "─────────────────────────" "────────────" "──────────────────"

  for session_dir in "$SESSIONS_DIR"/*/; do
    if [ -f "$session_dir/state.json" ]; then
      local id feature stage created
      id=$(basename "$session_dir")
      feature=$(jq -r '.feature_name // "unknown"' "$session_dir/state.json")
      stage=$(jq -r '.current_stage' "$session_dir/state.json")
      created=$(jq -r '.created_at' "$session_dir/state.json" | cut -c1-10)

      printf "  %-10s %-25s Stage %s/4    %s\n" "$id" "$feature" "$stage" "$created"
    fi
  done
  echo ""
}

# Get session directory
get_session_dir() {
  local session_id="$1"
  echo "$SESSIONS_DIR/$session_id"
}
