#!/bin/bash
# context-manager.sh - Manage context freshness for Ralph iterations
# Handles progress file rotation and dynamic iteration briefings

_CONTEXT_MGR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$_CONTEXT_MGR_DIR/ui.sh"

# Configuration
MAX_PROGRESS_STORIES="${MAX_PROGRESS_STORIES:-3}"
DISABLE_PROGRESS_ROTATION="${DISABLE_PROGRESS_ROTATION:-false}"
DISABLE_DYNAMIC_BRIEFING="${DISABLE_DYNAMIC_BRIEFING:-false}"

# Rotate progress file to keep it bounded
# Keeps the Codebase Patterns section and last N story summaries
# Moves older summaries to progress-archive.txt
#
# Arguments:
#   $1 - Path to progress.txt
rotate_progress_file() {
  local progress_file="$1"
  local archive_file="${progress_file%.txt}-archive.txt"

  if [ "$DISABLE_PROGRESS_ROTATION" = "true" ]; then
    return 0
  fi

  if [ ! -f "$progress_file" ]; then
    return 0
  fi

  # Count story sections (lines starting with ## followed by date pattern or story ID)
  local story_sections
  story_sections=$(grep -c '^\s*##\s*\[[0-9-]*\]\|^\s*##\s*[0-9-]*\s*-\s*US-' "$progress_file" 2>/dev/null || echo 0)

  if [ "$story_sections" -le "$MAX_PROGRESS_STORIES" ]; then
    # Nothing to rotate
    return 0
  fi

  print_info "Rotating progress file (keeping last $MAX_PROGRESS_STORIES stories)..."

  # Create temporary files for processing
  local tmp_header=$(mktemp)
  local tmp_stories=$(mktemp)
  local tmp_archive=$(mktemp)

  # Extract header (everything before first story section)
  # Header ends at first ## [date] or ## date - US- pattern
  awk '
    /^## *\[[0-9-]+\]/ || /^## *[0-9]+-[0-9]+-[0-9]+ *- *US-/ { found=1 }
    !found { print }
  ' "$progress_file" > "$tmp_header"

  # Extract all story sections
  awk '
    /^## *\[[0-9-]+\]/ || /^## *[0-9]+-[0-9]+-[0-9]+ *- *US-/ { found=1 }
    found { print }
  ' "$progress_file" > "$tmp_stories"

  # Count stories to archive
  local stories_to_archive=$((story_sections - MAX_PROGRESS_STORIES))

  # Split stories: first N go to archive, rest stay in progress
  # Stories are separated by --- or next ## header
  local current_story=0
  local in_archive=true

  while IFS= read -r line; do
    # Check if this is a new story section
    if echo "$line" | grep -qE '^## *\[[0-9-]+\]|^## *[0-9]+-[0-9]+-[0-9]+ *- *US-'; then
      current_story=$((current_story + 1))
      if [ "$current_story" -gt "$stories_to_archive" ]; then
        in_archive=false
      fi
    fi

    if [ "$in_archive" = "true" ]; then
      echo "$line" >> "$tmp_archive"
    else
      echo "$line" >> "${tmp_stories}.keep"
    fi
  done < "$tmp_stories"

  # Prepend archived stories to archive file (with timestamp)
  if [ -s "$tmp_archive" ]; then
    local archive_header="# Archived Progress - $(date +%Y-%m-%d\ %H:%M)"
    if [ -f "$archive_file" ]; then
      # Prepend new archive content to existing archive
      {
        echo "$archive_header"
        echo ""
        cat "$tmp_archive"
        echo ""
        echo "---"
        echo ""
        cat "$archive_file"
      } > "${archive_file}.tmp"
      mv "${archive_file}.tmp" "$archive_file"
    else
      {
        echo "$archive_header"
        echo ""
        cat "$tmp_archive"
      } > "$archive_file"
    fi
    print_success "Archived $stories_to_archive old story sections to $(basename "$archive_file")"
  fi

  # Rebuild progress file: header + remaining stories
  {
    cat "$tmp_header"
    if [ -f "${tmp_stories}.keep" ]; then
      cat "${tmp_stories}.keep"
    fi
  } > "$progress_file"

  # Cleanup
  rm -f "$tmp_header" "$tmp_stories" "$tmp_archive" "${tmp_stories}.keep"

  return 0
}

# Build a dynamic iteration briefing to inject focused context
# Returns the briefing text via stdout
#
# Arguments:
#   $1 - Path to prd.json
#   $2 - Current iteration number
#   $3 - Max iterations
build_iteration_briefing() {
  local prd_file="$1"
  local iteration="$2"
  local max_iterations="$3"

  if [ "$DISABLE_DYNAMIC_BRIEFING" = "true" ]; then
    return 0
  fi

  if [ ! -f "$prd_file" ]; then
    return 1
  fi

  # Get story stats from prd.json
  local total_stories completed_stories remaining_stories
  total_stories=$(jq '.userStories | length' "$prd_file" 2>/dev/null || echo 0)
  completed_stories=$(jq '[.userStories[] | select(.passes == true)] | length' "$prd_file" 2>/dev/null || echo 0)
  remaining_stories=$((total_stories - completed_stories))

  # Get the next incomplete story
  local next_story_id next_story_title next_story_criteria
  next_story_id=$(jq -r '[.userStories[] | select(.passes == false)][0].id // "None"' "$prd_file" 2>/dev/null)
  next_story_title=$(jq -r '[.userStories[] | select(.passes == false)][0].title // "All stories complete"' "$prd_file" 2>/dev/null)

  # Get acceptance criteria for the next story (as bullet list)
  next_story_criteria=$(jq -r '
    ([.userStories[] | select(.passes == false)][0].acceptanceCriteria // [])
    | map("- " + .) | join("\n")
  ' "$prd_file" 2>/dev/null)

  # Build the briefing
  cat << EOF
## Iteration Briefing

### Current Status
- **Iteration**: $iteration of $max_iterations
- **Progress**: $completed_stories/$total_stories stories completed
- **Remaining**: $remaining_stories stories

### Current Story
- **ID**: $next_story_id
- **Title**: $next_story_title

### Focus for This Iteration
$next_story_criteria

---

EOF
}

# Create a combined prompt with iteration briefing prepended
# Saves to a temporary file and returns the path via stdout
#
# Arguments:
#   $1 - Path to base prompt.md
#   $2 - Path to prd.json
#   $3 - Current iteration number
#   $4 - Max iterations
create_iteration_prompt() {
  local base_prompt="$1"
  local prd_file="$2"
  local iteration="$3"
  local max_iterations="$4"

  local tmp_prompt=$(mktemp)

  # Start with iteration briefing if enabled
  if [ "$DISABLE_DYNAMIC_BRIEFING" != "true" ]; then
    build_iteration_briefing "$prd_file" "$iteration" "$max_iterations" > "$tmp_prompt"
  fi

  # Append base prompt
  cat "$base_prompt" >> "$tmp_prompt"

  echo "$tmp_prompt"
}

# Standalone execution for testing
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "context-manager.sh - Test Mode"
  echo ""

  case "${1:-}" in
    rotate)
      if [ -z "$2" ]; then
        echo "Usage: $0 rotate <progress_file>"
        exit 1
      fi
      rotate_progress_file "$2"
      ;;
    briefing)
      if [ -z "$2" ]; then
        echo "Usage: $0 briefing <prd.json> [iteration] [max_iterations]"
        exit 1
      fi
      build_iteration_briefing "$2" "${3:-1}" "${4:-10}"
      ;;
    *)
      echo "Commands:"
      echo "  rotate <progress_file>                    - Test progress rotation"
      echo "  briefing <prd.json> [iter] [max]          - Test iteration briefing"
      echo ""
      echo "Environment Variables:"
      echo "  MAX_PROGRESS_STORIES=$MAX_PROGRESS_STORIES"
      echo "  DISABLE_PROGRESS_ROTATION=$DISABLE_PROGRESS_ROTATION"
      echo "  DISABLE_DYNAMIC_BRIEFING=$DISABLE_DYNAMIC_BRIEFING"
      ;;
  esac
fi
