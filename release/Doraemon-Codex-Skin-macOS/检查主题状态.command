#!/bin/zsh

SCRIPT_DIR="${0:A:h}"
source "$SCRIPT_DIR/scripts/launcher-common.zsh"

print_title
prepare_theme_command || finish_command 1

if run_theme_command status; then
  finish_command 0
else
  finish_command 1
fi
