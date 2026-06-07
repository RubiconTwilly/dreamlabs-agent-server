# Dream Labs Agent Server

Self-hosted, bring-your-own-AI agent routines. One bash command stands up a
routines-style dashboard on the customer's own VPS — their repo, their brain,
their API key (Claude / Codex / any model), any schedule including sub-hourly.

This is **Track B** from `DREAMLABS-AGENT-SERVER-SPEC.md`: the provider-agnostic
ownership track. Track A (Claude cloud routines) stays the default for everyone.

## Install (on a fresh Ubuntu VPS)

```bash
curl -fsSL https://get.joindreamlabs.com/install.sh | bash
```

The installer asks four things — provider, auth, repo, how you'll reach it — then:
installs deps, creates two locked-down users, clones your repo, writes secrets
**outside any web root**, hardens the box, starts the dashboard, wires cron, does a
test fire, and prints your private dashboard link.

Run it from a local checkout instead:
```bash
sudo DL_SOURCE="$(pwd)" bash install.sh
```

## See it now (no install)

```bash
bash preview.sh
# open the printed http://localhost:49207/?token=… link
```

Screenshots in `screenshots/` (`list`, `new`, `access`, `detail`, `wizard`).

## Setup wizard (no backend)

`wizard/index.html` is a static page where a customer picks provider / auth /
model / access and it generates the exact install command (no secrets in it).
Host it at e.g. `get.joindreamlabs.com` or open it locally.

## What you get

- **Routines dashboard** matching the Claude routines UX: create an agent, give it
  instructions, pick a model + trigger (Schedule / GitHub event / API), add
  connectors. Run now, pause, see every run's logs.
- **Loop contracts** on every routine — timeout, daily cap, and auto-pause after N
  consecutive failures (with an alert). This is what keeps unattended agents from
  becoming background chaos.
- **Connectors with baked-in tutorials** — Gmail, Telegram, Slack, GitHub, Notion.
  The dashboard shows the step-by-step; the wiring happens on the customer's box.
- **Access & keys page** — your bookmarkable dashboard link (your password) and a
  read-only view of which providers are connected. Key *values* are never shown.

## Components

| File | Role |
|---|---|
| `install.sh` | one-command installer + hardening |
| `server/dashboard.mjs` | single-file dashboard (Node builtins only, binds 127.0.0.1) |
| `server/run-agent.sh` | provider runner — enforces the loop contract |
| `server/agent-jail.sh` | runs the AI CLI as a jailed user with an env allowlist |
| `server/api-call.mjs` | raw-API runner (any OpenAI-compatible / Anthropic key) |
| `workspace-seed/` | sample SOUL + mcp.json for the agent workspace |
| `preview.sh` | local, no-install preview with fake data |

## Security model (the $6k rules, baked in)

1. **Explicit routes only — unknown path → 404. No static-file fallback, ever.**
   (`/secrets.env` returns 404. This is the exact rule the original loss broke.)
2. **Secrets live in `/etc/dreamlabs/secrets.env`** (`640 root:dreamlabs`), outside any
   served directory. The dashboard process never reads them.
3. **The agent runs jailed** — a separate `dreamlabs-agent` user with an env
   allowlist, not in the `dreamlabs` group, so it cannot read the secrets file it
   runs under. A prompt-injected agent still can't exfiltrate keys.
4. **No common ports** (49152–65535, random) and **not open to the world** —
   Tailscale-only by default, or firewalled to one IP.
5. **Token auth** on every route except `/health`; the access link is the password.
6. **Least privilege** — dashboard/cron run as `dreamlabs` (non-root); systemd
   `ProtectSystem=strict`, `NoNewPrivileges`, `PrivateTmp`.

## CLI

```bash
dreamlabs link        # print the dashboard link (with token)
dreamlabs logs        # dashboard service logs
dreamlabs run <id>    # run a routine now
dreamlabs restart     # restart after editing secrets.env
```

## Status

Phase 0–1 of the spec: install → schedule/API/webhook → run → logs, with
contracts, connectors-with-tutorials, and the access page. Phase 2 (live connector
MCP wiring, multi-environment, done-with-you provisioning) is the next pass.
