#!/usr/bin/env bash
# Dream Labs Agent Server - self-updater. Runs as ROOT via the dreamlabs-update
# systemd service (triggered either by the .update-requested flag from the
# dashboard, or by `dreamlabs update` on the CLI).
#
# Trust model: this script only ever pulls from the PINNED update URL baked into
# secrets.env at install time (DL_UPDATE_URL). The web dashboard can REQUEST an
# update (drop a flag file) but cannot change what gets pulled or run arbitrary
# code - it has no sudo (NoNewPrivileges). So a stolen dashboard token can at
# most trigger "fetch the official repo and restart", not RCE.
set -euo pipefail

DL_SECRETS="${DL_SECRETS:-/etc/dreamlabs/secrets.env}"
# shellcheck disable=SC1090
source "$DL_SECRETS"
DL_APP="${DL_APP:-/opt/dreamlabs}"
DL_DATA="${DL_DATA:-/var/dreamlabs}"
URL="${DL_UPDATE_URL:-https://raw.githubusercontent.com/RubiconTwilly/dreamlabs-agent-server/main}"
FLAG="$DL_DATA/.update-requested"
STATUS="$DL_DATA/update-status.json"
SVC_USER="${DL_SVC_USER:-dreamlabs}"

log(){ printf '[update %s] %s\n' "$(date -u +%FT%TZ)" "$*"; }
status(){ # status.json the dashboard can read (no secrets)
  printf '{"state":"%s","message":%s,"version":"%s","at":"%s"}\n' \
    "$1" "$(printf '%s' "$2" | jq -Rsa . 2>/dev/null || echo "\"$2\"")" "${3:-}" "$(date -u +%FT%TZ)" > "$STATUS"
  chown "$SVC_USER":dlws "$STATUS" 2>/dev/null || true
}

rm -f "$FLAG" 2>/dev/null || true
status "running" "Fetching the latest version…" "$(cat "$DL_APP/VERSION" 2>/dev/null || echo '')"
log "updating from $URL"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

FILES="server/run-agent.sh server/agent-jail.sh server/api-call.mjs server/dashboard.mjs server/update-self.sh VERSION"
for rel in $FILES; do
  if ! curl -fsSL "$URL/$rel" -o "$TMP/$(basename "$rel")"; then
    log "fetch failed: $rel"; status "error" "Failed to fetch $rel - kept current version." "$(cat "$DL_APP/VERSION" 2>/dev/null||echo '')"
    exit 1
  fi
done

# Sanity-gate before swapping anything in: JS must parse, shell must parse.
node --check "$TMP/dashboard.mjs" || { log "dashboard.mjs failed parse"; status "error" "Downloaded dashboard failed validation - no changes applied." ""; exit 1; }
node --check "$TMP/api-call.mjs"  || { log "api-call.mjs failed parse"; status "error" "Downloaded api-call failed validation - no changes applied." ""; exit 1; }
for s in run-agent.sh agent-jail.sh update-self.sh; do
  bash -n "$TMP/$s" || { log "$s failed parse"; status "error" "Downloaded $s failed validation - no changes applied." ""; exit 1; }
done

NEWVER="$(cat "$TMP/VERSION" 2>/dev/null | tr -d ' \n' || echo '')"
install -m 0755 "$TMP/run-agent.sh"  "$DL_APP/bin/run-agent.sh"
install -m 0755 "$TMP/agent-jail.sh" "$DL_APP/bin/agent-jail.sh"
install -m 0644 "$TMP/api-call.mjs"  "$DL_APP/bin/api-call.mjs"
install -m 0644 "$TMP/dashboard.mjs" "$DL_APP/bin/dashboard.mjs"
install -m 0755 "$TMP/update-self.sh" "$DL_APP/bin/update-self.sh"
install -m 0644 "$TMP/VERSION" "$DL_APP/VERSION"
log "installed version $NEWVER, restarting dashboard"

# Restart the dashboard, OS-aware: systemd on Linux, launchd on macOS.
restarted=0
if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files dreamlabs-dashboard.service >/dev/null 2>&1; then
  systemctl restart dreamlabs-dashboard && restarted=1
elif command -v launchctl >/dev/null 2>&1; then
  launchctl kickstart -k "gui/$(id -u)/com.dreamlabs.dashboard" >/dev/null 2>&1 && restarted=1
fi
if [ "$restarted" -ne 1 ]; then
  status "error" "Updated files but could not restart the dashboard automatically. Restart it manually." "$NEWVER"; exit 1
fi
status "done" "Updated to $NEWVER." "$NEWVER"
log "update complete: $NEWVER"
