#!/bin/zsh

set -u

PACKAGE_DIR="${0:A:h:h}"
PATCHER_PATH="$PACKAGE_DIR/scripts/asar-patcher.mjs"
APP_PATH=""
NODE_BIN=""

print_title() {
  print ""
  print "========================================"
  print "  机器猫 Codex 主题 - macOS"
  print "========================================"
  print ""
}

find_app() {
  if [[ -n "${CODEX_APP_PATH:-}" && -f "$CODEX_APP_PATH/Contents/Resources/app.asar" ]]; then
    APP_PATH="$CODEX_APP_PATH"
    return 0
  fi

  local candidate
  for candidate in "/Applications/ChatGPT.app" "/Applications/Codex.app"; do
    if [[ -f "$candidate/Contents/Resources/app.asar" ]]; then
      APP_PATH="$candidate"
      return 0
    fi
  done

  print "未找到 Codex/ChatGPT 客户端。"
  print "请把应用放在 /Applications，或设置 CODEX_APP_PATH 后重试。"
  return 1
}

find_node() {
  local candidate
  for candidate in \
    "$APP_PATH/Contents/Resources/cua_node/bin/node" \
    "$APP_PATH/Contents/Resources/node"; do
    if [[ -x "$candidate" ]]; then
      NODE_BIN="$candidate"
      return 0
    fi
  done

  if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
    return 0
  fi

  print "未找到可用的 Node 运行时。"
  print "请安装 Node.js 后重试。"
  return 1
}

prepare_theme_command() {
  if [[ ! -f "$PATCHER_PATH" ]]; then
    print "安装包不完整：缺少 scripts/asar-patcher.mjs"
    return 1
  fi
  find_app || return 1
  find_node || return 1

  print "客户端：$APP_PATH"
  print "运行时：$NODE_BIN"
  if pgrep -f "$APP_PATH/Contents/MacOS/" >/dev/null 2>&1; then
    print "提示：客户端当前正在运行，安装完成后必须使用 Cmd + Q 完整退出并重新打开。"
  fi
  print ""
}

run_theme_command() {
  local action="$1"
  local asar_path="$APP_PATH/Contents/Resources/app.asar"

  if [[ "$action" == "install" || "$action" == "uninstall" ]]; then
    if [[ -w "$asar_path" && -w "${asar_path:h}" ]]; then
      "$NODE_BIN" "$PATCHER_PATH" "$action" --app "$APP_PATH"
    else
      print "需要管理员权限来修改 /Applications 中的客户端。"
      sudo "$NODE_BIN" "$PATCHER_PATH" "$action" --app "$APP_PATH"
    fi
  else
    "$NODE_BIN" "$PATCHER_PATH" "$action" --app "$APP_PATH"
  fi
}

finish_command() {
  local exit_code="$1"
  print ""
  if [[ "$exit_code" -eq 0 ]]; then
    print "操作完成。"
  else
    print "操作失败，请查看上面的错误信息。"
  fi
  print ""
  if [[ -t 0 ]]; then
    read -r "?按回车键关闭窗口..."
  fi
  exit "$exit_code"
}
