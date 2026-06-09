# Composio integration (dev handoff)

**Status:** built + verified on a live macOS box, **local install only** (NOT yet deployed to `get.joindreamlabs.com`). All changes are additive/reversible. Commits: `383d916`, `87b4ce9`, `c9ab9b9`.

## What it is
Composio (composio.dev) is managed tool-calling + managed OAuth for ~1000 apps. We use it as a **connection backend, not a replacement** for our native connectors: a customer pastes ONE Composio key and the apps they connected in Composio (Gmail, Stripe, Sheets, ...) light up in our own directory and become usable by agents. It runs **alongside** the 79 native connectors (native = max ownership/offline; Composio = zero-setup + multi-account).

Why bother: native connectors are bring-your-own-OAuth-app (the customer registers an app per provider) and one account per connector. Composio removes the OAuth-app setup entirely and supports **many accounts per app** (this test account: 3 Gmail, 2 YouTube, 2 Stripe).

## How Composio is accessed
- Endpoint: `https://connect.composio.dev/mcp` (MCP, Streamable HTTP). Header: `x-consumer-api-key: ck_...`. No REST key needed (the REST API rejects the `ck_` consumer key).
- The MCP exposes a **Tool Router**: 7 meta-tools (`COMPOSIO_SEARCH_TOOLS`, `COMPOSIO_MULTI_EXECUTE_TOOL`, `COMPOSIO_GET_TOOL_SCHEMAS`, `COMPOSIO_MANAGE_CONNECTIONS`, ...), not 1000 raw tools. The agent searches for a tool, then executes it (just-in-time loading).
- **To read connection status, use `COMPOSIO_SEARCH_TOOLS` with bare toolkit slugs** (e.g. `["gmail","stripe"]`) and read `data.toolkit_connection_statuses`. **Do NOT use `COMPOSIO_MANAGE_CONNECTIONS` to read** — it *initiates* new connections as a side effect.

## What was built (two layers)
**1. The connector toggle** (a routine can use Composio)
- `server/connectors/registry.mjs`: a `composio` `apikey` connector. Paste key → engine injects `COMPOSIO_API_KEY` (standard `inject` path, no new engine code).
- `server/run-agent.sh`: if a routine ticks `composio` and the key is present, writes a per-run `.dl-composio-mcp.json` into the workspace (`x-consumer-api-key: ${COMPOSIO_API_KEY}` — key referenced by name, never written to the file).
- `server/agent-jail.sh`: the `claude` command gets `--mcp-config "$WS/.dl-composio-mcp.json"` when that file exists. (Other providers: codex/grok/gemini use different MCP config formats — not wired yet.)

**2. The connection backend** (tiles light up)
- `server/composio.mjs`: the bridge.
  - `listConnections(apiKey, toolkits)` — MCP probe, returns `{ toolkit: {connected, accounts} }`.
  - `refresh(apiKey)` — probes `CANDIDATE_TOOLKITS`, caches connected ones to `data/composio-apps.json`.
  - `nativeBadges()` — reads cache, maps Composio toolkits → native connector ids (`toNativeId`: Google sub-apps → `google`, `active_campaign` → `activecampaign`, else slug variants), returns `{ nativeId: {accounts, toolkits[]} }`.
  - CLI: `node composio.mjs connections|refresh <ck_key> [slugs]`.
- `server/dashboard.mjs`: on `POST /connection/composio/creds`, fires `composio.refresh(key)` (fire-and-forget). On disconnect, `composio.clearCache()`.
- `server/connections.mjs`: the `/connections` directory calls `nativeBadges()` and badges matching tiles **"via Composio (N accts)"**, sorted connected-first.

## Data flow
Connect Composio → `refresh()` caches connected apps → directory badges tiles. Routine ticks an app + Composio → `run-agent.sh` wires the MCP → `claude` gets the tools → agent acts.

## SECURITY — read before shipping
The `ck_` key is a **master credential**: it unlocks every app the customer connected in Composio. It reaches the agent's env at run time (the MCP needs it in the header). That is a bigger exposure than the native connectors' per-app short-lived tokens.
- **Required before this handles untrusted input or ships to customers: egress-allowlist the agent jail to `connect.composio.dev` only.** A compromised agent then can't exfil the key. (Composio's own May-2026 breach: centralized credential store + unrestricted sandbox egress → ~10k tokens leaked. We must not repeat the egress half.)
- The manifest's `mcp.egress` already lists the hosts; the actual jail-level egress lock is **not built yet**.

## Not done yet (next pieces)
1. **Egress allowlist** in `agent-jail.sh` (the security gate above). Highest priority before GA.
2. **Per-app scoped MCP / least privilege:** today ticking Composio gives the agent *all* the customer's tools. Goal: ticking **Stripe** scopes the MCP to Stripe only. Composio supports scoped MCP servers / toolkit filters — confirm the exact mechanism (scoped URL vs filter param) and route per ticked tile.
3. **Tile → routine wiring:** let routines tick the **native tile** (Google, Stripe) and have the runner resolve "this tile is Composio-backed" → wire the scoped MCP. Right now the routine ticks the literal `composio` connector.
4. **Tell the agent its apps** at run time (prepend the connected-app list) so it doesn't discover blind.
5. **Deploy to `get.joindreamlabs.com`** (bump VERSION, `deploy.sh`) once tested.
6. Non-Claude providers' MCP config.

## Test it
1. Dashboard → Connected apps → **Composio** → paste key → Save. Within ~15s `/connections` badges Google/Stripe/etc. "via Composio".
2. New routine: provider Claude, tick **Composio**, instruction "Using your Composio tools, list my 3 latest Stripe charges, total revenue, read only." Run. The run log shows `composio: MCP server wired for this run`.

## Reversibility
Everything is gated on the connector being ticked / the cache existing. To remove: `git revert c9ab9b9 87b4ce9 383d916`, or just don't connect Composio.
