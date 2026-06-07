# Audit — Dream Labs Agent Server (v0.1.0, 2026-06-07)

Self-audit of the install + dashboard + runner + jail + updater against the
"$6k rules" and general correctness. Two important findings were fixed in this
pass; the rest are documented limitations for the next hardening pass.

## Threat model
A customer's own VPS holding their AI provider keys + a web dashboard. The
realistic attack paths: (1) someone gets the dashboard access link/token;
(2) a prompt-injected or misbehaving agent tries to read secrets or escape its
workspace; (3) the dashboard process is compromised (RCE). Exposure is limited
up front: the dashboard binds 127.0.0.1 and is reached only via Tailscale or a
firewalled port.

## The $6k rules — verified
| Rule | Status | Where |
|---|---|---|
| Explicit routes only, unknown path → 404, no static fallback | ✅ | `dashboard.mjs` final `return send(res, 404, …)`; `/secrets.env` returns 404 (smoke-tested) |
| Secrets outside any web root, 640 root:dreamlabs | ✅ | `/etc/dreamlabs/secrets.env`; dashboard serves nothing from there |
| No common ports | ✅ | random port 49152–65535 (`randport`) |
| Not open to the world | ✅ | Tailscale-only default, or ufw to one IP |
| Token auth on every route except /health | ✅ | `authed()`; timing-safe compare; httponly cookie |
| Agent jailed, can't read secrets | ✅ | separate `dreamlabs-agent` user, `env -i` allowlist, not in `dreamlabs` group |
| Least privilege | ✅ | dashboard/cron as non-root `dreamlabs`; systemd `ProtectSystem=strict`, `NoNewPrivileges`, `PrivateTmp` |

## Findings fixed this pass
**F1 (important) — provider keys were in the web process environment.**
The dashboard systemd unit used `EnvironmentFile=secrets.env`, loading *all*
provider keys into the web process env (a dashboard RCE could read
`process.env.ANTHROPIC_API_KEY`). Fixed: installer now writes a separate
`dashboard.env` with ONLY web vars (DASH_TOKEN, port, URL, webhook secret,
paths); the unit loads that. Provider keys stay in `secrets.env`, sourced only
by the cron runner + the root updater. The web process no longer holds any
provider key.

**F2 (important) — GitHub token persisted in a group-readable location.**
Cloning a private repo with a tokenized URL left the token in
`workspace/.git/config`, which is group-readable by the jailed agent (dlws).
Fixed: after clone, reset the remote to the clean URL and store the credential
in the service user's `~/.git-credentials` (600, owner-only — the agent, though
in dlws, is not the owner so cannot read it).

## Known limitations (documented, for the next hardening pass)
- **L1 — dashboard and runner share the `dreamlabs` user.** Both run as the same
  user, so a dashboard RCE could `cat secrets.env` (same group/owner) even after
  F1. F1 removes the *passive* env exposure (the cheap exfil); a full fix is a
  three-user split (web user that can't read secrets; a distinct runner user that
  can). Recommended Phase-2 hardening. Realistic exposure is low given
  Tailscale-only access + no static file serving + jailed agent.
- **L2 — `secrets.env` is sourced by `run-agent.sh`.** Values are assumed
  token-like (no spaces/quotes/`$`). Real API keys and tokens are; a pasted
  value with shell metacharacters could misparse. Documented; quote if needed.
- **L3 — Grok/Gemini CLI install path.** `npm i -g` (claude/codex/gemini) lands
  in a system PATH the agent user can reach. The Grok Build CLI installer
  (`x.ai/cli/install.sh`) may install to the invoking user's home; if so the
  agent user won't find `grok` on its PATH (`/usr/local/bin:/usr/bin:/bin`).
  Verify post-install; symlink into `/usr/local/bin` if needed.
- **L4 — OAuth caching for codex/grok/gemini** lives in the agent user's HOME
  (`~/.codex/auth.json`, `~/.grok/auth`, `~/.gemini/`). The login step must be
  run as the agent user (`sudo -u dreamlabs-agent <cli> login`) — the installer
  prints exactly this. Claude OAuth uses a pasted `CLAUDE_CODE_OAUTH_TOKEN`
  instead (no HOME caching needed).
- **L5 — `set_paused` (runner) vs `writeRoutines` (dashboard) race.** Both edit
  `routines.json`; the runner locks with `flock`, the dashboard uses atomic
  rename. A simultaneous edit could lose one update (no corruption — rename is
  atomic). Low probability; acceptable for v0.1.

## Self-update safety
The dashboard can only *request* an update (drops `.update-requested`). A root
systemd path-unit triggers `update-self.sh`, which pulls ONLY from the pinned
`DL_UPDATE_URL`, **validates every downloaded file** (`node --check`, `bash -n`)
before swapping it in, then restarts. A stolen dashboard token can at most
trigger "fetch the official repo and restart" — not run arbitrary code. Trust
boundary is the official repo itself (same as any auto-updater).

## Correctness checks
- All shell parses (`bash -n`), all JS parses (`node --check`).
- Smoke-tested: auth (401 unauth / 200 authed), `/health`, unknown path → 404,
  `/secrets.env` → 404, form shows only configured providers, `/update` writes
  the flag, access page renders the async remote-version check + update button.
- Runner: strict id regex, non-blocking per-routine lock (no overlap), failure
  streak counter (resume clears it), daily cap with once-per-day alert, timeout
  with `--kill-after` and stdin closed (the documented codex-hang fix).

## Model/auth data provenance
Provider model IDs and OAuth capabilities were refreshed from official docs in
June 2026 (see commit notes). Notably: Grok's `grok-4-1-fast-*` were retired
2026-05-15 → current is `grok-4.3`; Grok OAuth is via the official Grok Build
CLI; DeepSeek IDs moved to `deepseek-v4-*`. Stale IDs were corrected before ship.
