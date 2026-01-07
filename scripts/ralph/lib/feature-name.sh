#!/bin/bash
# feature-name.sh - Extract feature name from prompt

# Dependencies - use unique var name to avoid overwriting parent's SCRIPT_DIR
_FEATURE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$_FEATURE_DIR/ui.sh"

# Extract a kebab-case feature name from a prompt
# Uses simple heuristics - can be overridden by user
extract_feature_name() {
  local prompt="$1"

  # Convert to lowercase
  local name
  name=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')

  # Remove common prefixes
  name=$(echo "$name" | sed -E 's/^(generate|create|build|make|implement|add|develop)[[:space:]]+a?n?[[:space:]]*//')

  # Remove articles
  name=$(echo "$name" | sed -E 's/\b(the|a|an)\b//g')

  # Extract key nouns (take first 3-4 significant words)
  name=$(echo "$name" | tr -cs '[:alnum:]' ' ' | awk '{
    count=0
    result=""
    for(i=1; i<=NF && count<4; i++) {
      if(length($i) > 2) {
        if(result != "") result = result "-"
        result = result $i
        count++
      }
    }
    print result
  }')

  # Clean up
  name=$(echo "$name" | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')

  # Fallback if empty
  if [ -z "$name" ]; then
    name="feature-$(date +%s)"
  fi

  echo "$name"
}

# Prompt user to confirm or change feature name
confirm_feature_name() {
  local prompt="$1"
  local suggested
  suggested=$(extract_feature_name "$prompt")

  # Output prompts to stderr so they don't get captured
  echo "" >&2
  print_info "Suggested feature name: $suggested" >&2
  read -p "Feature name (Enter to accept, or type new name): " user_input 2>&1 >&2

  if [ -n "$user_input" ]; then
    # Sanitize user input - only this goes to stdout
    echo "$user_input" | tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]' '-' | sed 's/^-//' | sed 's/-$//'
  else
    echo "$suggested"
  fi
}
