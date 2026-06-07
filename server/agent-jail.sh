#!/usr/bin/env bash
# Dream Labs Agent Server - agent jail.
#
# Runs the AI provider CLI as the unprivileged `dreamlabs-agent` user with an
# env allowlist. The agent gets ONLY PATH/HOME/TERM/LANG + the one provider's
# credentials. It can NOT read /etc/dreamlabs/secrets.env (640 root:dreamlabs;
# the agent user is not in that group), so it cannot reach the dashboard token,
# the GitHub token, or any other provider's key.
#
# OAuth note: each provider caches its OAuth session under the agent user's HOME
# (~/.claude, ~/.codex/auth.json, ~/.grok/auth, ~/.gemini). HOME is preserved in
# the allowlist, so a one-time `sudo -u dreamlabs-agent <cli> login` keeps
# working unattended - without exposing the server's secrets file.
#
# Usage: agent-jail.sh <provider> <workspace> <instructions-file> [model]
set -euo pipefail

PROV="${1:?provider}"
WS="${2:?workspace}"
INSTRFILE="${3:?instructions file}"
MODEL="${4:-}"

AGENT_USER="${DL_AGENT_USER:-dreamlabs-agent}"
AGENT_HOME="${DL_AGENT_HOME:-/home/dreamlabs-agent}"
DL_APP="${DL_APP:-/opt/dreamlabs}"

INSTR="$(cat "$INSTRFILE")"
[ -n "$INSTR" ] || { echo "empty instructions" >&2; exit 2; }

# Base allowlist. `env -i` later wipes everything else from the caller's env.
ENVV=(
  "PATH=/usr/local/bin:/usr/bin:/bin"
  "HOME=$AGENT_HOME"
  "TERM=dumb"
  "LANG=C.UTF-8"
)
add(){ [ -n "${2:-}" ] && ENVV+=("$1=$2"); }

case "$PROV" in
  claude)
    add ANTHROPIC_API_KEY "${ANTHROPIC_API_KEY:-}"
    add CLAUDE_CODE_OAUTH_TOKEN "${CLAUDE_CODE_OAUTH_TOKEN:-}"
    CMD=(claude -p "$INSTR" --output-format text --dangerously-skip-permissions)
    [ -n "$MODEL" ] && CMD+=(--model "$MODEL")
    ;;
  codex)
    add OPENAI_API_KEY "${OPENAI_API_KEY:-}"
    add CODEX_HOME "${CODEX_HOME:-}"
    CMD=(codex exec "$INSTR" --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check)
    [ -n "$MODEL" ] && CMD+=(-m "$MODEL")
    ;;
  grok)
    # Official Grok Build CLI. OAuth session in ~/.grok/auth, or XAI_API_KEY.
    add XAI_API_KEY "${XAI_API_KEY:-}"
    CMD=(grok -p "$INSTR" --always-approve)
    ;;
  gemini)
    add GEMINI_API_KEY "${GEMINI_API_KEY:-}"
    add GOOGLE_API_KEY "${GOOGLE_API_KEY:-}"
    add GOOGLE_APPLICATION_CREDENTIALS "${GOOGLE_APPLICATION_CREDENTIALS:-}"
    add GOOGLE_CLOUD_PROJECT "${GOOGLE_CLOUD_PROJECT:-}"
    add GOOGLE_CLOUD_LOCATION "${GOOGLE_CLOUD_LOCATION:-}"
    CMD=(gemini -p "$INSTR" --yolo)
    [ -n "$MODEL" ] && CMD+=(-m "$MODEL")
    ;;
  *)
    # Generic OpenAI-compatible runner: deepseek, minimax, kimi, xAI-as-API, or
    # any base URL. The installer stores the chosen key as OPENAI_API_KEY +
    # API_BASE_URL so this one path covers them all.
    add ANTHROPIC_API_KEY "${ANTHROPIC_API_KEY:-}"
    add OPENAI_API_KEY "${OPENAI_API_KEY:-}"
    add API_BASE_URL "${API_BASE_URL:-}"
    CMD=(node "$DL_APP/bin/api-call.mjs" "$INSTRFILE" "$MODEL")
    ;;
esac

cd "$WS"
# sudo -n: never prompt. env -i: hard reset, then apply only the allowlist.
exec sudo -n -u "$AGENT_USER" env -i "${ENVV[@]}" "${CMD[@]}"
