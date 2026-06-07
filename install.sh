#!/usr/bin/env bash
# Dream Labs Agent Server - one-command installer.
#
#   curl -fsSL https://get.joindreamlabs.com/install.sh | bash
#   # or, pre-filled by the setup wizard:
#   curl -fsSL https://get.joindreamlabs.com/install.sh | DL_PROVIDER=claude DL_AUTH=oauth ... bash
#
# Stands up the whole self-hosted track on a fresh Ubuntu box: provider runner +
# agent jail + dashboard + cron + self-update, hardened by default.
#
# Privilege separation:
#   dreamlabs        - service user: runs the dashboard + cron, owns routines/runs
#   dreamlabs-agent  - jailed user: runs the AI CLI, CANNOT read secrets.env
#   secrets.env      - root:dreamlabs 640, outside any web root, never served
#
# Wizard env vars (all optional - anything unset is prompted for):
#   DL_PROVIDER  claude|codex|grok|gemini|deepseek|api
#   DL_AUTH      oauth|key
#   DL_MODEL     a model id (or blank for default)
#   DL_REPO      git repo URL to clone
#   DL_ACCESS    tailscale|firewall
#   DL_CRON      cron expression for a first routine (blank = none)
#   DL_API_BASE  base URL when DL_PROVIDER=api
#   DL_SOURCE    install from a local checkout instead of GitHub
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "This installer needs root. Re-running with sudo..."; exec sudo -E bash "$0" "$@"; fi

DL_APP=/opt/dreamlabs
DL_DATA=/var/dreamlabs
DL_SECRETS_DIR=/etc/dreamlabs
DL_SECRETS="$DL_SECRETS_DIR/secrets.env"
SVC_USER=dreamlabs
AGENT_USER=dreamlabs-agent
AGENT_HOME=/home/$AGENT_USER
REPO_RAW="${DL_SOURCE:-https://raw.githubusercontent.com/RubiconTwilly/dreamlabs-agent-server/main}"
UPDATE_URL="${DL_UPDATE_URL:-https://raw.githubusercontent.com/RubiconTwilly/dreamlabs-agent-server/main}"
STARTER_DEFAULT="https://github.com/RubiconTwilly/dreamlabs-agent-starter"
SELFDIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo /tmp)"

say()  { printf "\n\033[1;38;5;173m▸ dreamlabs\033[0m %s\n" "$*"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$*"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$*"; }
ask()  { local p="$1" d="${2:-}" v; if [ -n "$d" ]; then read -rp "  $p [$d]: " v </dev/tty || true; echo "${v:-$d}"; else read -rp "  $p: " v </dev/tty || true; echo "$v"; fi; }
secret_in(){ local v; read -rsp "  $1: " v </dev/tty || true; echo >&2; echo "$v"; }
randhex(){ head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; }
randport(){ echo $(( (RANDOM % 16000) + 49152 )); }
have(){ command -v "$1" >/dev/null 2>&1; }

say "Dream Labs Agent Server installer"
echo "  Own your whole agent stack - any model, your keys, sub-hourly schedules."

# ----- 1. dependencies -----
say "Installing dependencies"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git jq cron ufw ca-certificates unattended-upgrades >/dev/null
systemctl enable --now cron >/dev/null 2>&1 || true
if ! have node; then curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1; apt-get install -y -qq nodejs >/dev/null; fi
ok "node $(node -v), git, jq, cron, ufw"

# ----- 2. users -----
say "Creating service + agent users"
id -u "$SVC_USER"   >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$SVC_USER"
id -u "$AGENT_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$AGENT_USER"
getent group dlws >/dev/null || groupadd dlws
usermod -aG dlws "$SVC_USER"; usermod -aG dlws "$AGENT_USER"
ok "$SVC_USER (dashboard/cron) + $AGENT_USER (jailed AI), shared group dlws"

# ----- 3. layout + code -----
say "Installing to $DL_APP"
mkdir -p "$DL_APP/bin" "$DL_APP/workspace" "$DL_DATA/runs" "$DL_DATA/locks" "$DL_SECRETS_DIR"
fetch(){ local rel="$1" dst="$2"; if [ -f "$SELFDIR/$rel" ]; then cp "$SELFDIR/$rel" "$dst"; else curl -fsSL "$REPO_RAW/$rel" -o "$dst"; fi; }
fetch server/run-agent.sh   "$DL_APP/bin/run-agent.sh"
fetch server/agent-jail.sh  "$DL_APP/bin/agent-jail.sh"
fetch server/api-call.mjs   "$DL_APP/bin/api-call.mjs"
fetch server/dashboard.mjs  "$DL_APP/bin/dashboard.mjs"
fetch server/update-self.sh "$DL_APP/bin/update-self.sh"
fetch VERSION               "$DL_APP/VERSION"
chmod +x "$DL_APP/bin/"*.sh
ok "runner, jail, dashboard, updater, v$(cat "$DL_APP/VERSION" 2>/dev/null||echo '?') installed"

# ----- 4. provider -----
PROVIDER="${DL_PROVIDER:-}"
if [ -z "$PROVIDER" ]; then
  say "Which AI provider should agents use?"
  echo "    1) Claude Code   2) OpenAI Codex   3) xAI Grok   4) Google Gemini   5) DeepSeek   6) Any API"
  case "$(ask 'Provider 1-6' '1')" in 2) PROVIDER=codex;; 3) PROVIDER=grok;; 4) PROVIDER=gemini;; 5) PROVIDER=deepseek;; 6) PROVIDER=api;; *) PROVIDER=claude;; esac
fi
say "Provider: $PROVIDER"

# install the right CLI
case "$PROVIDER" in
  claude) have claude || { warn "installing Claude Code CLI"; npm i -g @anthropic-ai/claude-code >/dev/null 2>&1 || warn "install manually: npm i -g @anthropic-ai/claude-code"; } ;;
  codex)  have codex  || { warn "installing Codex CLI";       npm i -g @openai/codex >/dev/null 2>&1 || warn "install manually: npm i -g @openai/codex"; } ;;
  grok)   have grok   || { warn "installing Grok Build CLI";  curl -fsSL https://x.ai/cli/install.sh | bash >/dev/null 2>&1 || warn "install manually: curl -fsSL https://x.ai/cli/install.sh | bash"; } ;;
  gemini) have gemini || { warn "installing Gemini CLI";      npm i -g @google/gemini-cli >/dev/null 2>&1 || warn "install manually: npm i -g @google/gemini-cli"; } ;;
esac

# auth: only claude/codex/grok/gemini support oauth; deepseek/api are key-only
AUTH="${DL_AUTH:-}"
case "$PROVIDER" in deepseek|api) AUTH=key;; esac
if [ -z "$AUTH" ]; then AUTH="$(ask 'Auth: (o)auth subscription or (k)ey' 'o')"; case "$AUTH" in o*) AUTH=oauth;; *) AUTH=key;; esac; fi

# collect the secret. OAuth for codex/grok/gemini caches in the AGENT user's HOME.
ANTHROPIC_API_KEY=""; CLAUDE_CODE_OAUTH_TOKEN=""; OPENAI_API_KEY=""; XAI_API_KEY=""; GEMINI_API_KEY=""; API_BASE_URL=""
prov_claude=false prov_codex=false prov_grok=false prov_gemini=false prov_deepseek=false prov_api=false
agent_oauth(){ # run an interactive login AS the agent user so creds cache in its HOME
  warn "Authorise as the agent user, then press Enter here:"; echo "      sudo -u $AGENT_USER $*"
  read -r </dev/tty || true
}
case "$PROVIDER" in
  claude) prov_claude=true
    if [ "$AUTH" = oauth ]; then
      warn "Run this (it prints a ~1-year token), paste it below:"; echo "      sudo -u $AGENT_USER claude setup-token"
      CLAUDE_CODE_OAUTH_TOKEN="$(secret_in 'Paste the Claude OAuth token')"
    else ANTHROPIC_API_KEY="$(secret_in 'Paste ANTHROPIC_API_KEY')"; fi ;;
  codex) prov_codex=true
    if [ "$AUTH" = oauth ]; then agent_oauth "codex login --device-auth"; else OPENAI_API_KEY="$(secret_in 'Paste OPENAI_API_KEY')"; fi ;;
  grok) prov_grok=true
    if [ "$AUTH" = oauth ]; then agent_oauth "grok auth login"; else XAI_API_KEY="$(secret_in 'Paste XAI_API_KEY')"; fi ;;
  gemini) prov_gemini=true
    if [ "$AUTH" = oauth ]; then agent_oauth "gemini   # then choose 'Sign in with Google'"; else GEMINI_API_KEY="$(secret_in 'Paste GEMINI_API_KEY')"; fi ;;
  deepseek) prov_deepseek=true
    OPENAI_API_KEY="$(secret_in 'Paste DeepSeek API key')"; API_BASE_URL="https://api.deepseek.com" ;;
  api) prov_api=true
    API_BASE_URL="${DL_API_BASE:-$(ask 'OpenAI-compatible base URL' 'https://api.openai.com')}"
    OPENAI_API_KEY="$(secret_in 'Paste API key')" ;;
esac
MODEL="${DL_MODEL:-}"
ok "provider configured ($AUTH)"

# ----- 5. repo + brain -----
say "Agent workspace"
REPO="${DL_REPO:-$(ask 'Git repo to clone' "$STARTER_DEFAULT")}"
GITHUB_TOKEN="$(secret_in 'GitHub token for private clone/pull (blank if public)')"
CLONE_URL="$REPO"; [ -n "$GITHUB_TOKEN" ] && CLONE_URL="$(echo "$REPO" | sed -E "s#https://#https://x-access-token:$GITHUB_TOKEN@#")"
rm -rf "$DL_APP/workspace"
if git clone --depth 1 "$CLONE_URL" "$DL_APP/workspace" >/dev/null 2>&1; then
  # F2: never persist the token in the group-readable workspace/.git/config.
  # Reset the remote to the clean URL, and stash the credential in the service
  # user's own 600 store so unattended pulls work but the jailed agent can't read it.
  git -C "$DL_APP/workspace" remote set-url origin "$REPO" >/dev/null 2>&1 || true
  if [ -n "$GITHUB_TOKEN" ]; then
    printf 'https://x-access-token:%s@github.com\n' "$GITHUB_TOKEN" > "/home/$SVC_USER/.git-credentials"
    chown "$SVC_USER":"$SVC_USER" "/home/$SVC_USER/.git-credentials"; chmod 600 "/home/$SVC_USER/.git-credentials"
    sudo -u "$SVC_USER" git config --global credential.helper store >/dev/null 2>&1 || true
  fi
  ok "cloned $REPO"
else
  warn "clone failed - seeding a workspace with a sample SOUL"; mkdir -p "$DL_APP/workspace"
  fetch workspace-seed/SOUL.md "$DL_APP/workspace/SOUL.md" 2>/dev/null || echo "# Agent brain" > "$DL_APP/workspace/SOUL.md"
  fetch workspace-seed/mcp.json "$DL_APP/workspace/mcp.json" 2>/dev/null || true
fi

# ----- 6. networking -----
NCHOICE="${DL_ACCESS:-}"
if [ -z "$NCHOICE" ]; then
  say "How will you reach the dashboard?"; echo "    1) Tailscale only (recommended)   2) Firewall to my IP"
  case "$(ask 'Access 1/2' '1')" in 2) NCHOICE=firewall;; *) NCHOICE=tailscale;; esac
fi
DASH_PORT="$(randport)"
if [ "$NCHOICE" = firewall ]; then
  MYIP="$(ask 'Your IP to allow' "$(echo "${SSH_CONNECTION:-}" | awk '{print $1}')")"
  ufw allow OpenSSH >/dev/null 2>&1 || true; [ -n "$MYIP" ] && ufw allow from "$MYIP" to any port "$DASH_PORT" proto tcp >/dev/null 2>&1; ufw --force enable >/dev/null 2>&1 || true
  HOST_FOR_URL="$(curl -fsS4 https://ifconfig.me 2>/dev/null || echo YOUR_SERVER_IP)"
  ok "firewall: port $DASH_PORT open to ${MYIP:-<set this>} only"
else
  have tailscale || { warn "installing Tailscale"; curl -fsSL https://tailscale.com/install.sh | sh >/dev/null 2>&1 || warn "install tailscale manually"; }
  ufw default deny incoming >/dev/null 2>&1 || true; ufw allow OpenSSH >/dev/null 2>&1 || true; ufw --force enable >/dev/null 2>&1 || true
  tailscale up >/dev/null 2>&1 || warn "run 'tailscale up' to authorise this box"
  HOST_FOR_URL="$(tailscale ip -4 2>/dev/null | head -1 || echo YOUR_TAILSCALE_IP)"
  ok "Tailscale-only; no public ports opened"
fi

# ----- 7. secrets (outside web root) -----
say "Writing secrets (640 root:$SVC_USER, never web-served)"
DASH_TOKEN="$(randhex 24)"; WEBHOOK_SECRET="$(randhex 16)"; DASH_URL="http://$HOST_FOR_URL:$DASH_PORT"
umask 077
cat > "$DL_SECRETS" <<EOF
# Dream Labs Agent Server secrets - chmod 640 root:$SVC_USER. NEVER commit / web-serve.
PROVIDER=$PROVIDER
DEFAULT_MODEL=$MODEL
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
CLAUDE_CODE_OAUTH_TOKEN=$CLAUDE_CODE_OAUTH_TOKEN
OPENAI_API_KEY=$OPENAI_API_KEY
XAI_API_KEY=$XAI_API_KEY
GEMINI_API_KEY=$GEMINI_API_KEY
API_BASE_URL=$API_BASE_URL
GITHUB_TOKEN=$GITHUB_TOKEN
DASH_PORT=$DASH_PORT
DASH_TOKEN=$DASH_TOKEN
DASH_URL=$DASH_URL
WEBHOOK_SECRET=$WEBHOOK_SECRET
DL_APP=$DL_APP
DL_DATA=$DL_DATA
DL_SECRETS=$DL_SECRETS
DL_UPDATE_URL=$UPDATE_URL
DL_AGENT_USER=$AGENT_USER
DL_AGENT_HOME=$AGENT_HOME
DL_SVC_USER=$SVC_USER
ALERT_TG_TOKEN=
ALERT_TG_CHAT=
EOF
chown root:"$SVC_USER" "$DL_SECRETS"; chmod 640 "$DL_SECRETS"
chown root:"$SVC_USER" "$DL_SECRETS_DIR"; chmod 750 "$DL_SECRETS_DIR"
# Dashboard env = ONLY what the web process needs. NO provider keys here, so the
# web process never holds them in its environment (audit finding F1).
cat > "$DL_SECRETS_DIR/dashboard.env" <<EOF
DASH_PORT=$DASH_PORT
DASH_TOKEN=$DASH_TOKEN
DASH_URL=$DASH_URL
WEBHOOK_SECRET=$WEBHOOK_SECRET
DL_DATA=$DL_DATA
DL_APP=$DL_APP
DL_UPDATE_URL=$UPDATE_URL
EOF
chown root:"$SVC_USER" "$DL_SECRETS_DIR/dashboard.env"; chmod 640 "$DL_SECRETS_DIR/dashboard.env"
printf '{"%s":true,"updatedAt":"%s"}\n' "$PROVIDER" "$(date -u +%FT%TZ)" > "$DL_DATA/providers.json"
ok "secrets split: provider keys in secrets.env (runner only), web vars in dashboard.env"

# ----- 8. first routine (from the wizard's schedule) -----
if [ -n "${DL_CRON:-}" ] && [ ! -s "$DL_DATA/routines.json" ]; then
  jq -n --arg p "$PROVIDER" --arg m "$MODEL" --arg c "$DL_CRON" '
    {routines:[{id:"starter",name:"My first routine",
      instructions:"Describe what this agent should do each run. Edit me in the dashboard.",
      provider:$p,model:$m,repo:"",connectors:[],behavior:"",permissions:"",paused:false,
      trigger:{type:"schedule",cron:$c},
      contract:{timeoutMinutes:20,maxConsecutiveFailures:2,maxRunsPerDay:96}}]}' \
    > "$DL_DATA/routines.json"
  ok "seeded a first routine on schedule: $DL_CRON"
fi

# ----- 9. permissions -----
cat > /etc/sudoers.d/dreamlabs <<EOF
$SVC_USER ALL=($AGENT_USER) NOPASSWD: /usr/bin/env
EOF
chmod 440 /etc/sudoers.d/dreamlabs
chown -R "$SVC_USER":dlws "$DL_DATA";            chmod -R 2770 "$DL_DATA"
chown -R "$SVC_USER":dlws "$DL_APP/workspace";   chmod -R 2770 "$DL_APP/workspace"
ok "least-privilege wiring done"

# ----- 10. services: dashboard + self-update path/service -----
say "Installing services"
cat > /etc/systemd/system/dreamlabs-dashboard.service <<EOF
[Unit]
Description=Dream Labs Agent Server dashboard
After=network.target
[Service]
User=$SVC_USER
EnvironmentFile=$DL_SECRETS_DIR/dashboard.env
ExecStart=/usr/bin/node $DL_APP/bin/dashboard.mjs
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=$DL_DATA
PrivateTmp=true
[Install]
WantedBy=multi-user.target
EOF
# self-updater: dashboard drops a flag → this path unit triggers the root oneshot.
cat > /etc/systemd/system/dreamlabs-update.service <<EOF
[Unit]
Description=Apply Dream Labs Agent Server update
[Service]
Type=oneshot
EnvironmentFile=$DL_SECRETS
ExecStart=$DL_APP/bin/update-self.sh
EOF
cat > /etc/systemd/system/dreamlabs-update.path <<EOF
[Unit]
Description=Watch for Dream Labs update requests
[Path]
PathExists=$DL_DATA/.update-requested
Unit=dreamlabs-update.service
[Install]
WantedBy=paths.target
EOF
systemctl daemon-reload
systemctl enable --now dreamlabs-update.path >/dev/null 2>&1 || true
systemctl enable --now dreamlabs-dashboard >/dev/null 2>&1
sleep 1
ok "dashboard live on 127.0.0.1:$DASH_PORT; self-update armed"

# ----- 11. dreamlabs CLI -----
cat > /usr/local/bin/dreamlabs <<EOF
#!/usr/bin/env bash
set -e
S=$DL_SECRETS
case "\${1:-}" in
  link)        echo "\$(grep ^DASH_URL= \$S|cut -d= -f2-)/?token=\$(grep ^DASH_TOKEN= \$S|cut -d= -f2-)" ;;
  url)         grep ^DASH_URL= \$S|cut -d= -f2- ;;
  restart)     systemctl restart dreamlabs-dashboard; echo restarted ;;
  logs)        journalctl -u dreamlabs-dashboard -n 50 --no-pager ;;
  update)      systemctl start dreamlabs-update.service; echo "update started - dreamlabs logs-update" ;;
  logs-update) journalctl -u dreamlabs-update.service -n 50 --no-pager ;;
  run)         sudo -u $SVC_USER $DL_APP/bin/run-agent.sh "\$2" manual ;;
  reconfigure) systemctl restart dreamlabs-dashboard; echo "reloaded secrets" ;;
  *) echo "usage: dreamlabs {link|url|restart|logs|update|logs-update|run <id>|reconfigure}" ;;
esac
EOF
chmod +x /usr/local/bin/dreamlabs

# ----- 12. test fire + finish -----
if [ -s "$DL_DATA/routines.json" ] && [ "$(jq '.routines|length' "$DL_DATA/routines.json" 2>/dev/null||echo 0)" -gt 0 ]; then
  say "Test fire"; FIRST="$(jq -r '.routines[0].id' "$DL_DATA/routines.json")"
  sudo -u "$SVC_USER" "$DL_APP/bin/run-agent.sh" "$FIRST" manual >/dev/null 2>&1 && ok "ran '$FIRST'" || warn "test run nonzero - check the dashboard"
fi

LINK="$DASH_URL/?token=$DASH_TOKEN"
say "Done - v$(cat "$DL_APP/VERSION" 2>/dev/null)"
echo "  ┌────────────────────────────────────────────────────────────"
echo "  │  Your dashboard (this link is your password - keep it private):"
echo "  │    $LINK"
echo "  │  Anytime:  dreamlabs link · logs · update · restart"
echo "  └────────────────────────────────────────────────────────────"
[ "$NCHOICE" = tailscale ] && echo "  (Reachable once 'tailscale up' is authorised and your device is on the tailnet.)"
[ "$AUTH" = oauth ] && [ "$PROVIDER" != claude ] && warn "Finish OAuth if you haven't: sudo -u $AGENT_USER ${PROVIDER/gemini/gemini  }… (see above)"
