#!/usr/bin/env bash
# Redeploy the get.joindreamlabs.com docroot to the EC2 box after code changes.
# Serves: the wizard (/), install.sh, install-macos.sh, server/*, VERSION, workspace-seed/*.
# Does NOT touch Apache config or existing vhosts - just refreshes the files.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
HOST="${DL_DEPLOY_HOST:-ubuntu@13.236.39.21}"
KEY="${DL_DEPLOY_KEY:-$HOME/.ssh/id_ed25519}"
DOCROOT="/var/www/get-dreamlabs"

STAGE="$(mktemp -d)"
mkdir -p "$STAGE/server" "$STAGE/workspace-seed"
cp "$HERE"/install.sh "$HERE"/install-macos.sh "$HERE"/VERSION "$STAGE/"
cp "$HERE"/wizard/index.html "$STAGE/index.html"
cp "$HERE"/wizard/icon.png "$HERE"/wizard/favicon.ico "$HERE"/wizard/favicon-32.png "$HERE"/wizard/apple-touch-icon.png "$STAGE/"
cp "$HERE"/server/run-agent.sh "$HERE"/server/agent-jail.sh "$HERE"/server/api-call.mjs \
   "$HERE"/server/dashboard.mjs "$HERE"/server/google.mjs "$HERE"/server/connections.mjs \
   "$HERE"/server/briefing.mjs "$HERE"/server/update-self.sh "$STAGE/server/"
cp "$HERE"/workspace-seed/SOUL.md "$HERE"/workspace-seed/mcp.json "$STAGE/workspace-seed/"
tar czf "$STAGE.tgz" -C "$STAGE" .

scp -i "$KEY" -o StrictHostKeyChecking=no "$STAGE.tgz" "$HOST:/tmp/get-dreamlabs.tgz"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" \
  "sudo mkdir -p $DOCROOT && sudo tar xzf /tmp/get-dreamlabs.tgz -C $DOCROOT && sudo chown -R www-data:www-data $DOCROOT && sudo find $DOCROOT -type f -exec chmod 644 {} \; && rm -f /tmp/get-dreamlabs.tgz && echo deployed"
rm -rf "$STAGE" "$STAGE.tgz"
echo "live: https://get.joindreamlabs.com  (v$(cat "$HERE/VERSION"))"
