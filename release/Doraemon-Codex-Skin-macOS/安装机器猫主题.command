#!/bin/zsh

SCRIPT_DIR="${0:A:h}"
source "$SCRIPT_DIR/scripts/launcher-common.zsh"

print_title
prepare_theme_command || finish_command 1

print "正在安装机器猫主题..."
if run_theme_command install; then
  print ""
  run_theme_command status
  print ""
  print "请使用 Cmd + Q 完整退出 Codex/ChatGPT，然后重新打开。"
  finish_command 0
else
  finish_command 1
fi
