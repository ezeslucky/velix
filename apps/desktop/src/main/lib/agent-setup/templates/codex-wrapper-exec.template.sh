# Codex's native notify callback only reports completion, so the wrapper uses
# Codex's process-scoped TUI session log for Start/permission events. Avoid
# tailing global rollout files: concurrent Codex sessions share that directory.
_velix_debug_enabled="0"
case "$VELIX_DEBUG_HOOKS" in
  1|true|TRUE|True|yes|YES|on|ON) _velix_debug_enabled="1" ;;
esac
if [ "$_velix_debug_enabled" != "1" ] && { [ "$VELIX_ENV" = "development" ] || [ "$NODE_ENV" = "development" ]; }; then
  _velix_debug_enabled="1"
fi

_velix_notify_path="{{NOTIFY_PATH}}"
_velix_debug_log="${VELIX_HOOK_DEBUG_LOG:-/tmp/velix-codex-hooks.log}"
_velix_has_velix_context="0"
[ -n "$VELIX_TERMINAL_ID$VELIX_TAB_ID$VELIX_PANE_ID" ] && _velix_has_velix_context="1"
VELIX_CODEX_SESSION_WATCHER_PID=""
_velix_codex_args=()

_velix_debug() {
  [ "$_velix_debug_enabled" = "1" ] || return 0
  printf '%s [codex-wrapper] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date)" "$*" >> "$_velix_debug_log" 2>/dev/null || true
}

_velix_toml_escape() {
  local _velix_value="$1"
  _velix_value="${_velix_value//\\/\\\\}"
  _velix_value="${_velix_value//\"/\\\"}"
  printf '%s' "$_velix_value"
}

_velix_configure_project_trust() {
  [ -n "${VELIX_WORKSPACE_PATH:-}" ] || return 0

  local _velix_workspace_codex_home="$VELIX_WORKSPACE_PATH/.codex"
  [ -f "$_velix_workspace_codex_home/config.toml" ] || return 0

  local _velix_workspace_path_toml
  _velix_workspace_path_toml="$(_velix_toml_escape "$VELIX_WORKSPACE_PATH")"
  _velix_codex_args+=("-c" "projects={\"$_velix_workspace_path_toml\"={trust_level=\"trusted\"}}")
  _velix_debug "using trusted workspace Codex project config path=$VELIX_WORKSPACE_PATH"
}

_velix_configure_project_trust

_velix_child_pids_for() {
  if command -v pgrep >/dev/null 2>&1; then
    pgrep -P "$1" 2>/dev/null || true
    return 0
  fi
  ps -axo pid=,ppid= 2>/dev/null | awk -v ppid="$1" '$2 == ppid { print $1 }' 2>/dev/null || true
}

_velix_cleanup_session_watcher() {
  if [ -n "$VELIX_CODEX_SESSION_WATCHER_PID" ]; then
    _velix_watcher_pid="$VELIX_CODEX_SESSION_WATCHER_PID"
    _velix_child_pids="$(_velix_child_pids_for "$_velix_watcher_pid" | tr '\n' ' ')"
    for _velix_child_pid in $_velix_child_pids; do
      kill -TERM "$_velix_child_pid" >/dev/null 2>&1 || true
    done
    kill -TERM "$_velix_watcher_pid" >/dev/null 2>&1 || true
    sleep 0.2
    _velix_child_pids="$_velix_child_pids $(_velix_child_pids_for "$_velix_watcher_pid" | tr '\n' ' ')"
    for _velix_child_pid in $_velix_child_pids; do
      kill -KILL "$_velix_child_pid" >/dev/null 2>&1 || true
    done
    kill -KILL "$_velix_watcher_pid" >/dev/null 2>&1 || true
    _velix_debug "session watcher cleanup signaled pid=$_velix_watcher_pid"
    VELIX_CODEX_SESSION_WATCHER_PID=""
  fi
}

_velix_exit_trap() {
  _velix_status=$?
  trap - EXIT HUP INT TERM
  _velix_cleanup_session_watcher
  exit "$_velix_status"
}

trap _velix_exit_trap EXIT HUP INT TERM

if [ "$_velix_has_velix_context" = "1" ] && [ -f "$_velix_notify_path" ]; then
  export CODEX_TUI_RECORD_SESSION="${CODEX_TUI_RECORD_SESSION:-1}"
  export CODEX_TUI_SESSION_LOG_PATH="${TMPDIR:-/tmp}/velix-codex-session-$$_$(date +%s).jsonl"
  _velix_debug "session watcher starting terminalId=$VELIX_TERMINAL_ID tabId=$VELIX_TAB_ID paneId=$VELIX_PANE_ID log=$CODEX_TUI_SESSION_LOG_PATH notify=$_velix_notify_path"

  (
    _velix_notify="$_velix_notify_path"
    _velix_session_log="$CODEX_TUI_SESSION_LOG_PATH"

    _velix_emit_event() {
      _velix_payload=$(printf '{"hook_event_name":"%s"}' "$1")
      _velix_debug "emitting $1 via $_velix_notify"
      bash "$_velix_notify" "$_velix_payload" >/dev/null 2>&1 || true
    }

    _velix_i=0
    while [ ! -f "$_velix_session_log" ] && [ "$_velix_i" -lt 200 ]; do
      _velix_i=$((_velix_i + 1))
      sleep 0.1
    done
    if [ ! -f "$_velix_session_log" ]; then
      _velix_debug "session log not found path=$_velix_session_log"
      exit 0
    fi
    _velix_debug "watching session=$_velix_session_log"

    tail -n +1 -F "$_velix_session_log" 2>/dev/null | while IFS= read -r _velix_line; do
      case "$_velix_line" in
        *'"dir":"from_tui"'*'"kind":"op"'*'"UserTurn"'*) _velix_emit_event "Start" ;;
        *'_approval_request"'*) _velix_emit_event "PermissionRequest" ;;
      esac
    done
  ) 2>/dev/null &
  VELIX_CODEX_SESSION_WATCHER_PID=$!
  _velix_debug "session watcher pid=$VELIX_CODEX_SESSION_WATCHER_PID"
else
  _velix_notify_exists="0"
  [ -f "$_velix_notify_path" ] && _velix_notify_exists="1"
  _velix_debug "session watcher disabled hasVelixContext=$_velix_has_velix_context terminalId=$VELIX_TERMINAL_ID tabId=$VELIX_TAB_ID paneId=$VELIX_PANE_ID notifyExists=$_velix_notify_exists notify=$_velix_notify_path"
fi

# `hooks` (formerly `codex_hooks`) is stable and default-enabled in codex
# >=0.129; the legacy `notify=...` callback remains the completion source.
"$REAL_BIN" "${_velix_codex_args[@]}" --enable hooks -c 'notify=["bash","{{NOTIFY_PATH}}"]' "$@"
VELIX_CODEX_STATUS=$?
_velix_debug "codex exited status=$VELIX_CODEX_STATUS"

_velix_cleanup_session_watcher

trap - EXIT HUP INT TERM
exit "$VELIX_CODEX_STATUS"
