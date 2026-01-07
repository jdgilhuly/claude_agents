#!/bin/bash
# ui.sh - UI utilities for Ralph workflow
# Note: This file is sourced, uses _UI_DIR to avoid overwriting parent's SCRIPT_DIR

# Colors
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export RED='\033[0;31m'
export CYAN='\033[0;36m'
export BOLD='\033[1m'
export NC='\033[0m' # No Color

# Print functions
print_header() {
  local title="$1"
  echo ""
  echo -e "${BOLD}${BLUE}════════════════════════════════════════${NC}"
  echo -e "${BOLD}${BLUE}  $title${NC}"
  echo -e "${BOLD}${BLUE}════════════════════════════════════════${NC}"
  echo ""
}

print_stage() {
  local stage_num="$1"
  local stage_name="$2"
  echo ""
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${CYAN}  STAGE $stage_num: $stage_name${NC}"
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Stage completion prompt
prompt_stage_complete() {
  local stage_name="$1"
  local output_file="$2"
  local next_stage="$3"

  echo ""
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Stage Complete: $stage_name${NC}"
  if [ -n "$output_file" ]; then
    echo -e "Output: ${CYAN}$output_file${NC}"
  fi
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Options:"
  echo -e "  ${BOLD}[Enter]${NC}  Continue to $next_stage"
  echo -e "  ${BOLD}[r]${NC}      Review output file"
  echo -e "  ${BOLD}[e]${NC}      Edit output file before continuing"
  echo -e "  ${BOLD}[s]${NC}      Save and exit (resume later)"
  echo -e "  ${BOLD}[q]${NC}      Quit"
  echo ""
  read -p "Choice: " choice

  case "$choice" in
    r|R)
      if [ -n "$output_file" ] && [ -f "$output_file" ]; then
        less "$output_file"
      else
        print_warning "No output file to review"
      fi
      prompt_stage_complete "$@"
      ;;
    e|E)
      if [ -n "$output_file" ] && [ -f "$output_file" ]; then
        ${EDITOR:-vim} "$output_file"
      else
        print_warning "No output file to edit"
      fi
      prompt_stage_complete "$@"
      ;;
    s|S)
      echo "SAVE_AND_EXIT"
      ;;
    q|Q)
      echo "QUIT"
      ;;
    *)
      echo "CONTINUE"
      ;;
  esac
}

# Confirmation prompt
confirm() {
  local message="$1"
  local default="${2:-n}"

  if [ "$default" = "y" ]; then
    read -p "$message [Y/n]: " response
    case "$response" in
      [nN]*) return 1 ;;
      *) return 0 ;;
    esac
  else
    read -p "$message [y/N]: " response
    case "$response" in
      [yY]*) return 0 ;;
      *) return 1 ;;
    esac
  fi
}

# Progress indicator
show_progress() {
  local current="$1"
  local total="$2"
  local label="$3"

  local percent=$((current * 100 / total))
  local filled=$((percent / 5))
  local empty=$((20 - filled))

  printf "\r${BLUE}[${NC}"
  printf "%${filled}s" | tr ' ' '█'
  printf "%${empty}s" | tr ' ' '░'
  printf "${BLUE}]${NC} %3d%% - %s" "$percent" "$label"
}
