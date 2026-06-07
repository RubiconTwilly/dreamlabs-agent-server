#!/usr/bin/env bash
# Local preview of the dashboard — no install, no cron, no root, fake data.
# Run on your Mac:   bash preview.sh   then open the printed URL.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="${TMPDIR:-/tmp}/dl-preview"
mkdir -p "$TMP/runs/inbox-concierge" "$TMP/locks"

cat > "$TMP/routines.json" <<'JSON'
{ "routines": [
  { "id":"inbox-concierge","name":"Inbox Concierge",
    "instructions":"Each run: read new items in the shared inbox, summarize the 3 most important, and post a digest to Telegram. Skip anything already digested.",
    "provider":"claude","model":"claude-sonnet-4-6","repo":"RubiconTwilly/dreamlabs-agent-starter",
    "connectors":["gmail","telegram"],"behavior":"","permissions":"",
    "paused":false,"trigger":{"type":"schedule","cron":"*/15 * * * *"},
    "contract":{"timeoutMinutes":20,"maxConsecutiveFailures":2,"maxRunsPerDay":96},
    "createdAt":"2026-06-07T00:00:00Z","updatedAt":"2026-06-07T00:00:00Z" },
  { "id":"pr-summary","name":"Summarize open PRs",
    "instructions":"Every weekday morning, list all open PRs, group by author, flag any with failing CI or merge conflicts.",
    "provider":"codex","model":"gpt-5.3-codex","repo":"RubiconTwilly/rubicon",
    "connectors":["github"],"behavior":"","permissions":"gh pr *, git",
    "paused":true,"trigger":{"type":"api"},
    "contract":{"timeoutMinutes":15,"maxConsecutiveFailures":3,"maxRunsPerDay":50},
    "createdAt":"2026-06-07T00:00:00Z","updatedAt":"2026-06-07T00:00:00Z" }
] }
JSON
echo '{ "claude": true, "codex": true, "api": false }' > "$TMP/providers.json"
printf '%s\n' \
  '{"event":"run","id":"inbox-concierge","ts":"20260607T081500Z","trigger":"cron","provider":"claude","rc":0,"durationSec":42}' \
  '{"event":"run","id":"inbox-concierge","ts":"20260607T083000Z","trigger":"cron","provider":"claude","rc":0,"durationSec":38}' \
  > "$TMP/runs.jsonl"
printf '=== run ===\nRead 4 new items, digested 3, posted to Telegram.\n=== finished rc=0 duration=38s ===\n' \
  > "$TMP/runs/inbox-concierge/20260607T083000Z.log"

PORT="${DASH_PORT:-49207}"
TOKEN="preview-token-1234567890"
echo
echo "  Preview at:  http://localhost:$PORT/?token=$TOKEN"
echo "  (Ctrl-C to stop)"
echo
DL_NO_CRON=1 DL_DATA="$TMP" DL_APP="$HERE/server" DASH_PORT="$PORT" \
  DASH_TOKEN="$TOKEN" DASH_URL="http://localhost:$PORT" \
  exec node "$HERE/server/dashboard.mjs"
