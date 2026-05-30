#!/bin/bash
{{MARKER}}
# cursor-agent lifecycle hook. Event name comes via argv from hooks.json.

INPUT=$(cat)
HOOK_SESSION_ID=$(printf '%s' "$INPUT" | grep -oE '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -oE '"[^"]*"$' | tr -d '"')

EVENT_TYPE="$1"

NEEDS_RESPONSE=false
case "$EVENT_TYPE" in
  Start|Stop|SessionStart|SessionEnd) ;;
  PermissionRequest) NEEDS_RESPONSE=true ;;
  *) exit 0 ;;
esac

# Permission hooks auto-approve via JSON on stdout. Must print before any
# exit path so cursor-agent isn't left blocked.
if [ "$NEEDS_RESPONSE" = "true" ]; then
  printf '{"continue":true}\n'
fi

V1_EVENT_TYPE="$EVENT_TYPE"
case "$V1_EVENT_TYPE" in
  SessionStart) V1_EVENT_TYPE="Start" ;;
  SessionEnd)   V1_EVENT_TYPE="Stop" ;;
esac

json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

if [ -n "$VELIX_HOST_AGENT_HOOK_URL" ] && [ -n "$VELIX_TERMINAL_ID" ]; then
  PAYLOAD="{\"json\":{\"terminalId\":\"$(json_escape "$VELIX_TERMINAL_ID")\",\"eventType\":\"$(json_escape "$EVENT_TYPE")\",\"agent\":{\"agentId\":\"$(json_escape "$VELIX_AGENT_ID")\",\"sessionId\":\"$(json_escape "$HOOK_SESSION_ID")\"}}}"

  STATUS_CODE=$(curl -sX POST "$VELIX_HOST_AGENT_HOOK_URL" \
    --connect-timeout 2 --max-time 5 \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    -o /dev/null -w "%{http_code}" 2>/dev/null)

  case "$STATUS_CODE" in
    2*) exit 0 ;;
  esac
fi

[ -z "$VELIX_TAB_ID" ] && [ -z "$VELIX_TERMINAL_ID" ] && exit 0

curl -sG "http://127.0.0.1:${VELIX_PORT:-{{DEFAULT_PORT}}}/hook/complete" \
  --connect-timeout 1 --max-time 2 \
  --data-urlencode "paneId=$VELIX_PANE_ID" \
  --data-urlencode "tabId=$VELIX_TAB_ID" \
  --data-urlencode "workspaceId=$VELIX_WORKSPACE_ID" \
  --data-urlencode "terminalId=$VELIX_TERMINAL_ID" \
  --data-urlencode "sessionId=$HOOK_SESSION_ID" \
  --data-urlencode "hookSessionId=$HOOK_SESSION_ID" \
  --data-urlencode "eventType=$V1_EVENT_TYPE" \
  --data-urlencode "env=$VELIX_ENV" \
  --data-urlencode "version=$VELIX_HOOK_VERSION" \
  > /dev/null 2>&1

exit 0
