#!/usr/bin/env bash
# Dream Labs Agent Server - macOS installer (local, no root).
#
#   curl -fsSL https://get.joindreamlabs.com/install.sh | bash      # auto-detects macOS
#   # or directly:
#   bash install-macos.sh            # install
#   bash install-macos.sh uninstall  # remove cleanly
#
# Installs the DASHBOARD (the platform) for a single user on localhost. You then
# create agents from the dashboard (add a repo, a schedule, connectors per agent).
# No agents are created at install time.
#
# Local model: binds 127.0.0.1, token auth, NO firewall/Tailscale needed. Runs as
# a launchd LaunchAgent (starts at login, restarts on crash). Self-updates via a
# launchd WatchPaths agent. Schedules use the user's crontab.
set -euo pipefail

DL_APP="$HOME/.dreamlabs"
DL_DATA="$DL_APP/data"
DL_SECRETS="$DL_APP/secrets.env"
DL_DASHENV="$DL_APP/dashboard.env"
BIN="$DL_APP/bin"
REPO_RAW="${DL_SOURCE:-https://raw.githubusercontent.com/RubiconTwilly/dreamlabs-agent-server/main}"
UPDATE_URL="${DL_UPDATE_URL:-https://raw.githubusercontent.com/RubiconTwilly/dreamlabs-agent-server/main}"
LABEL_DASH="com.dreamlabs.dashboard"
LABEL_UPD="com.dreamlabs.update"
LA="$HOME/Library/LaunchAgents"
PLIST_DASH="$LA/$LABEL_DASH.plist"
PLIST_UPD="$LA/$LABEL_UPD.plist"
SELFDIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo /tmp)"
DOMAIN="gui/$(id -u)"

say()  { printf "\n\033[1;38;5;173m> dreamlabs\033[0m %s\n" "$*"; }
ok()   { printf "  \033[32mok\033[0m %s\n" "$*"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$*"; }
ask()  { local p="$1" d="${2:-}" v; if [ -n "$d" ]; then read -rp "  $p [$d]: " v </dev/tty || true; echo "${v:-$d}"; else read -rp "  $p: " v </dev/tty || true; echo "$v"; fi; }
secret_in(){ local v; read -rsp "  $1: " v </dev/tty || true; echo >&2; echo "$v"; }
randhex(){ head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; }
randport(){ echo $(( (RANDOM % 16000) + 49152 )); }
have(){ command -v "$1" >/dev/null 2>&1; }

# ---------- uninstall ----------
if [ "${1:-}" = "uninstall" ]; then
  say "Uninstalling"
  launchctl bootout "$DOMAIN/$LABEL_DASH" 2>/dev/null || true
  launchctl bootout "$DOMAIN/$LABEL_UPD" 2>/dev/null || true
  rm -f "$PLIST_DASH" "$PLIST_UPD"
  # remove our managed crontab block
  if crontab -l 2>/dev/null | grep -q 'dreamlabs-agent-server'; then
    crontab -l 2>/dev/null | awk '/# BEGIN dreamlabs-agent-server/{s=1} !s{print} /# END dreamlabs-agent-server/{s=0}' | crontab - || true
  fi
  rm -f /usr/local/bin/dreamlabs 2>/dev/null || sudo rm -f /usr/local/bin/dreamlabs 2>/dev/null || true
  ok "services + crontab block + CLI removed"
  warn "Your data is kept at $DL_APP. Remove it with:  rm -rf $DL_APP"
  exit 0
fi

say "Dream Labs Agent Server - macOS (local) install"

# ---------- deps ----------
say "Checking dependencies"
have node || { warn "node not found."; have brew && { warn "installing via brew"; brew install node >/dev/null; } || { echo "  Install Node first: https://nodejs.org or 'brew install node'"; exit 1; }; }
have jq   || { have brew && brew install jq >/dev/null || { echo "  Install jq: 'brew install jq'"; exit 1; }; }
ok "node $(node -v), jq $(jq --version)"

# ---------- layout + code ----------
say "Installing to $DL_APP"
mkdir -p "$BIN" "$DL_DATA/runs" "$DL_DATA/locks" "$DL_DATA/workspaces" "$DL_APP/workspace" "$LA"
fetch(){ local rel="$1" dst="$2"; if [ -f "$SELFDIR/$rel" ]; then cp "$SELFDIR/$rel" "$dst"; else curl -fsSL "$REPO_RAW/$rel" -o "$dst"; fi; }
fetch server/run-agent.sh   "$BIN/run-agent.sh"
fetch server/agent-jail.sh  "$BIN/agent-jail.sh"
fetch server/api-call.mjs   "$BIN/api-call.mjs"
fetch server/dashboard.mjs  "$BIN/dashboard.mjs"
fetch server/update-self.sh "$BIN/update-self.sh"
fetch VERSION               "$DL_APP/VERSION"
fetch workspace-seed/SOUL.md  "$DL_APP/workspace/SOUL.md" 2>/dev/null || true
fetch workspace-seed/mcp.json "$DL_APP/workspace/mcp.json" 2>/dev/null || true
chmod +x "$BIN"/*.sh
ok "dashboard + runner + updater, v$(cat "$DL_APP/VERSION" 2>/dev/null)"

# ---------- provider + auth ----------
PROVIDER="${DL_PROVIDER:-}"
if [ -z "$PROVIDER" ]; then
  say "Which AI provider should agents use?"
  echo "    1) Claude Code   2) OpenAI Codex   3) xAI Grok   4) Google Gemini   5) DeepSeek   6) Any API"
  case "$(ask 'Provider 1-6' '1')" in 2) PROVIDER=codex;; 3) PROVIDER=grok;; 4) PROVIDER=gemini;; 5) PROVIDER=deepseek;; 6) PROVIDER=api;; *) PROVIDER=claude;; esac
fi
case "$PROVIDER" in
  claude) have claude || { warn "installing Claude Code CLI"; npm i -g @anthropic-ai/claude-code >/dev/null 2>&1 || warn "install manually"; } ;;
  codex)  have codex  || { warn "installing Codex CLI";       npm i -g @openai/codex >/dev/null 2>&1 || warn "install manually"; } ;;
  grok)   have grok   || { warn "installing Grok Build CLI";  curl -fsSL https://x.ai/cli/install.sh | bash >/dev/null 2>&1 || warn "install manually"; } ;;
  gemini) have gemini || { warn "installing Gemini CLI";      npm i -g @google/gemini-cli >/dev/null 2>&1 || warn "install manually"; } ;;
esac
AUTH="${DL_AUTH:-}"; case "$PROVIDER" in deepseek|api) AUTH=key;; esac
[ -z "$AUTH" ] && { AUTH="$(ask 'Auth: (o)auth subscription or (k)ey' 'o')"; case "$AUTH" in o*) AUTH=oauth;; *) AUTH=key;; esac; }

ANTHROPIC_API_KEY="" CLAUDE_CODE_OAUTH_TOKEN="" OPENAI_API_KEY="" XAI_API_KEY="" GEMINI_API_KEY="" API_BASE_URL=""
key_in(){ echo "${DL_KEY:-$(secret_in "$1")}"; }   # DL_KEY env override (for headless/testing)
oauth_now(){ # OAuth caches in THIS user's home; run the login as this user now
  warn "Sign in (a browser/device step), then press Enter:"; echo "      $*"
  [ -n "${DL_KEY:-}" ] || read -r </dev/tty || true
}
case "$PROVIDER" in
  claude) if [ "$AUTH" = oauth ]; then warn "Run, then paste the printed token:"; echo "      claude setup-token"; CLAUDE_CODE_OAUTH_TOKEN="$(key_in 'Paste Claude OAuth token')"; else ANTHROPIC_API_KEY="$(key_in 'Paste ANTHROPIC_API_KEY')"; fi ;;
  codex)  if [ "$AUTH" = oauth ]; then oauth_now "codex login --device-auth"; else OPENAI_API_KEY="$(key_in 'Paste OPENAI_API_KEY')"; fi ;;
  grok)   if [ "$AUTH" = oauth ]; then oauth_now "grok auth login"; else XAI_API_KEY="$(key_in 'Paste XAI_API_KEY')"; fi ;;
  gemini) if [ "$AUTH" = oauth ]; then oauth_now "gemini   # choose Sign in with Google"; else GEMINI_API_KEY="$(key_in 'Paste GEMINI_API_KEY')"; fi ;;
  deepseek) OPENAI_API_KEY="$(key_in 'Paste DeepSeek API key')"; API_BASE_URL="https://api.deepseek.com" ;;
  api)    API_BASE_URL="${DL_API_BASE:-$(ask 'OpenAI-compatible base URL' 'https://api.openai.com')}"; OPENAI_API_KEY="$(key_in 'Paste API key')" ;;
esac
MODEL="${DL_MODEL:-}"
ok "provider: $PROVIDER ($AUTH)"

# ---------- secrets ----------
DASH_PORT="${DASH_PORT:-$(randport)}"; DASH_TOKEN="$(randhex 24)"; WEBHOOK_SECRET="$(randhex 16)"
DASH_URL="http://localhost:$DASH_PORT"
# launchd + cron run with a minimal PATH (no Homebrew). Bake an explicit one so
# node / jq / git / the provider CLIs resolve in unattended contexts.
NODE_DIR="$(dirname "$(command -v node)")"
GOODPATH="$NODE_DIR:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
umask 077
cat > "$DL_SECRETS" <<EOF
# Dream Labs Agent Server secrets (macOS, local). chmod 600. Sourced by the runner.
PROVIDER=$PROVIDER
DEFAULT_MODEL=$MODEL
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
CLAUDE_CODE_OAUTH_TOKEN=$CLAUDE_CODE_OAUTH_TOKEN
OPENAI_API_KEY=$OPENAI_API_KEY
XAI_API_KEY=$XAI_API_KEY
GEMINI_API_KEY=$GEMINI_API_KEY
API_BASE_URL=$API_BASE_URL
GITHUB_TOKEN=${DL_GITHUB_TOKEN:-}
DASH_URL=$DASH_URL
DL_APP=$DL_APP
DL_DATA=$DL_DATA
DL_SECRETS=$DL_SECRETS
DL_UPDATE_URL=$UPDATE_URL
DL_NO_SUDO=1
PATH=$GOODPATH
ALERT_TG_TOKEN=
ALERT_TG_CHAT=
EOF
chmod 600 "$DL_SECRETS"
# dashboard.env: ONLY web vars (no provider keys) - the web process never holds keys
cat > "$DL_DASHENV" <<EOF
DASH_PORT=$DASH_PORT
DASH_TOKEN=$DASH_TOKEN
DASH_URL=$DASH_URL
WEBHOOK_SECRET=$WEBHOOK_SECRET
DL_DATA=$DL_DATA
DL_APP=$DL_APP
DL_UPDATE_URL=$UPDATE_URL
PATH=$GOODPATH
EOF
chmod 600 "$DL_DASHENV"
printf '{"%s":true,"updatedAt":"%s"}\n' "$PROVIDER" "$(date -u +%FT%TZ)" > "$DL_DATA/providers.json"
ok "secrets split (provider keys in secrets.env, web vars in dashboard.env), chmod 600"

# ---------- launch wrappers ----------
cat > "$BIN/dash-launch.sh" <<EOF
#!/usr/bin/env bash
set -a; . "$DL_DASHENV"; set +a   # sets PATH (incl. node), DASH_*, DL_* for the web process
exec node "$BIN/dashboard.mjs"
EOF
chmod +x "$BIN/dash-launch.sh"

# ---------- launchd: dashboard (RunAtLoad + KeepAlive) ----------
say "Installing launchd agents"
cat > "$PLIST_DASH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL_DASH</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$BIN/dash-launch.sh</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$DL_DATA/dashboard.out.log</string>
  <key>StandardErrorPath</key><string>$DL_DATA/dashboard.err.log</string>
</dict></plist>
EOF
# launchd: self-update watcher (WatchPaths = systemd path-unit equivalent)
cat > "$PLIST_UPD" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL_UPD</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$BIN/update-self.sh</string></array>
  <key>EnvironmentVariables</key><dict>
    <key>DL_SECRETS</key><string>$DL_SECRETS</string>
    <key>PATH</key><string>$GOODPATH</string>
  </dict>
  <key>WatchPaths</key><array><string>$DL_DATA/.update-requested</string></array>
  <key>StandardOutPath</key><string>$DL_DATA/update.log</string>
  <key>StandardErrorPath</key><string>$DL_DATA/update.log</string>
</dict></plist>
EOF
launchctl bootout "$DOMAIN/$LABEL_DASH" 2>/dev/null || true
launchctl bootout "$DOMAIN/$LABEL_UPD" 2>/dev/null || true
launchctl bootstrap "$DOMAIN" "$PLIST_DASH"
launchctl bootstrap "$DOMAIN" "$PLIST_UPD" 2>/dev/null || true
sleep 1
ok "dashboard running on 127.0.0.1:$DASH_PORT (starts at login, restarts on crash)"

# ---------- dreamlabs CLI ----------
CLI=/usr/local/bin/dreamlabs
write_cli(){ cat > "$1" <<EOF
#!/usr/bin/env bash
set -e
S=$DL_SECRETS; D=$DOMAIN
case "\${1:-}" in
  link)        echo "\$(grep ^DASH_URL= \$S|cut -d= -f2-)/?token=\$(grep ^DASH_TOKEN= $DL_DASHENV|cut -d= -f2-)" ;;
  url)         grep ^DASH_URL= \$S|cut -d= -f2- ;;
  restart)     launchctl kickstart -k "\$D/$LABEL_DASH"; echo restarted ;;
  logs)        tail -n 50 "$DL_DATA/dashboard.err.log" "$DL_DATA/dashboard.out.log" 2>/dev/null ;;
  update)      touch "$DL_DATA/.update-requested"; echo "update requested (watcher will apply); or: bash $BIN/update-self.sh" ;;
  run)         "$BIN/run-agent.sh" "\$2" manual ;;
  uninstall)   bash "$SELFDIR/install-macos.sh" uninstall 2>/dev/null || curl -fsSL "$REPO_RAW/install-macos.sh" | bash -s uninstall ;;
  *) echo "usage: dreamlabs {link|url|restart|logs|update|run <id>|uninstall}" ;;
esac
EOF
chmod +x "$1"; }
# sudo -n so a headless run never hangs on a password prompt; fall back to ~/.dreamlabs.
if write_cli "$CLI" 2>/dev/null; then ok "dreamlabs CLI -> $CLI"
elif sudo -n bash -c "$(declare -f write_cli); write_cli $CLI" 2>/dev/null; then ok "dreamlabs CLI -> $CLI (sudo)"
else write_cli "$DL_APP/dreamlabs"; warn "CLI at $DL_APP/dreamlabs (add to PATH, or run: $DL_APP/dreamlabs link)"; fi

# ---------- done ----------
LINK="$DASH_URL/?token=$DASH_TOKEN"
say "Done - v$(cat "$DL_APP/VERSION" 2>/dev/null)"
echo "  +-----------------------------------------------------------"
echo "  |  Your dashboard (this link is your password - keep it private):"
echo "  |    $LINK"
echo "  |  Now create agents in the dashboard: add a repo, a schedule, connectors."
echo "  |  Anytime:  dreamlabs link | logs | update | restart | uninstall"
echo "  +-----------------------------------------------------------"
[ "$AUTH" = oauth ] && [ "$PROVIDER" != claude ] && warn "If you skipped the OAuth step, run it now: see the command above for $PROVIDER."
