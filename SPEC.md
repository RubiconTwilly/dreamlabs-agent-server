# Dream Labs Agent Server - Self-Hosted, Bring-Your-Own-AI Track

**Status: BUILT and working, v0.7.0 (updated 2026-06-07).** This was a build spec; it
is now a build + handoff doc. Hand it to a dev to tweak design and extend.

- **Repo (public, MIT):** https://github.com/RubiconTwilly/dreamlabs-agent-server
- **Local source:** `/Users/twilly/Desktop/dreamlabs-agent-server/`
- **Install (one line):** `curl -fsSL https://get.joindreamlabs.com/install.sh | bash`
  (auto-detects macOS vs Linux; works on a cloud VPS or a local Mac/Linux box)
- **See the UI with no install (Mac):** `bash preview.sh` then open the printed link.
- **Verified end-to-end on macOS:** install -> launchd dashboard on localhost ->
  connect provider by click -> connect GitHub -> pick repo -> create agent ->
  run (real model output) -> failure logging -> 2-strike auto-pause.

---

## 0. TL;DR

The default Dream Labs path deploys customer agents as Claude Code routines
(Anthropic cloud, zero setup). This is the **alternative track**: one bash command
stands up a **routines-style dashboard the customer owns** on their own box. Then
EVERYTHING else is done by click in that dashboard - connect AI providers, connect
GitHub, create agents. Any model, their keys, any schedule (sub-hourly), no
Anthropic dependency at runtime.

Core UX rule (load-bearing): **all click, no terminal.** The only terminal moment
is pasting the one install command; the installer connects the FIRST provider via
a prompter (you are in the terminal there anyway). After that, the dashboard does
everything - including OAuth, where the dashboard runs the device flow and the
user only approves in a browser.

---

## 1. Two tracks

| | Track A: Claude routines (default) | Track B: Self-hosted server (this) |
|---|---|---|
| Runs on | Anthropic cloud | Customer's own VPS or Mac |
| Setup | 1 click in claude.ai | One bash command, then all-click |
| Provider | Claude only | Claude, Codex, Grok, Gemini, DeepSeek, any API |
| Scheduling | 1 hour minimum | Any interval (sub-hourly) |
| Ownership | Anthropic hosts | Customer owns box + data + keys |

Funnel rule: push everyone to Track A first; Track B is the provider-agnostic /
ownership upgrade. Do not gate the core experience behind a server.

---

## 2. What is built (status)

| Area | Status | Notes |
|---|---|---|
| One-command installer (Linux) | DONE | `install.sh`, hardened, systemd |
| One-command installer (macOS, local, no root) | DONE | `install-macos.sh`, launchd |
| Dashboard (routines list, create, detail, runs) | DONE | single-file Node, Claude-routines look |
| Loop contracts (timeout, daily cap, auto-pause) | DONE | enforced in the runner, tested |
| Agent jail (env allowlist; separate user on Linux) | DONE | + DL_NO_SUDO same-user mode for local/Mac |
| Provider runner, cross-platform | DONE | no flock/GNU-timeout dependency |
| All-click provider connect (OAuth + key) | DONE | device flow spawned by dashboard, multiple, swap default |
| GitHub connect (PAT) + repo picker + per-agent clone | DONE | tested against a real account (16 repos) |
| Dream Labs template gallery in the create form | DONE | public templates clone with no token |
| Calendar tab (agenda from crons) | DONE (basic) | upgrade to a month-grid is queued |
| Self-update ("Update" button + CLI) | DONE | dashboard requests, root task validates + applies |
| Setup wizard (stepped, branded, sci-fi) | DONE | `wizard/index.html`, generates the install command |
| Audit | DONE | `AUDIT.md` (fixed F1, F2, B1-B4; known limits listed) |

Queue (not yet built): Calendar month-grid with x-N collapse; installer OAuth
run-inline; DL-hosted-templates + fork-and-upload skeleton; Daily Briefing
insights agent; wizard provisioning a Dream Labs backend key. See section 9.

---

## 3. Architecture (as built)

```
Customer box (Ubuntu VPS or macOS, localhost)
+--------------------------------------------------------------+
|  cron / launchd  --->  run-agent.sh <routine-id>             |
|        (loop contract: timeout, daily cap, auto-pause)        |
|                 |                                            |
|                 v                                            |
|        agent-jail.sh  (env -i allowlist; separate user on    |
|                        Linux, same-user on local/Mac)        |
|                 |                                            |
|        provider:  claude -p | codex exec | grok -p |         |
|                   gemini -p | node api-call.mjs              |
|                 |                                            |
|        per-routine workspace: git clone/pull the routine's   |
|        repo into /var(or ~/.dreamlabs)/.../workspaces/<id>   |
|                                                              |
|  dashboard.mjs  (single-file Node, binds 127.0.0.1)          |
|   - routines CRUD, runs/logs, calendar                        |
|   - connect providers (OAuth device flow / key) + GitHub      |
|   - self-update request, access/keys page                     |
|        ^                                                      |
+--------|-----------------------------------------------------+
         |  Local (default): localhost + token, no firewall
         |  or Tailscale-only / firewalled-to-one-IP
   Customer's browser
```

- **Scheduler:** Linux = the service user's crontab (managed block, rewritten by
  the dashboard). macOS = same crontab mechanism; launchd runs the dashboard.
- **Per-routine repos:** each routine names its own repo (or none). The runner
  clones/pulls it into a per-routine workspace before the agent runs. The picker
  stores `owner/name`; the runner normalizes to a full URL.
- **Secrets split:** provider keys live in `secrets.env` (runner-only). The web
  process loads only `dashboard.env` (no provider keys). Keys connected later by
  click land in `keys.env` (dashboard-writable, runner-sourced).

---

## 4. The all-click model

- **Bash installs the platform + connects the FIRST provider** via the installer's
  prompter (provider choice + auth; OAuth or paste key). That is the only terminal
  step.
- **Everything else is click in the dashboard:**
  - **AI providers** (`/providers`, `/provider/:id`): Connect any provider. OAuth =
    the dashboard spawns the CLI device flow, captures the approval URL + code,
    shows it, and auto-detects completion. The user only approves in a browser.
    Paste-key is also offered. Connect multiple; set/swap the default; pick per
    agent in the form.
  - **GitHub** (`/github`): paste a fine-grained PAT (validated, stored 600). Then
    the create form's "Select a repository" lists the user's real repos, and each
    agent clones only its own repo (token never enters the agent jail).
  - **Templates:** the create form leads with Dream Labs template cards (public
    repos) that fill the repo + a starting prompt + a name. Or use your own repo.
  - **Self-update** (`/access`): an Update button.

---

## 5. File map (for the dev)

```
dreamlabs-agent-server/
├── install.sh             one-command installer (Linux; hands off to macOS one on Darwin)
├── install-macos.sh       macOS installer (no root, launchd, local-first) + `uninstall`
├── preview.sh             local no-install preview with fake data (Mac-friendly)
├── VERSION                self-update compares this
├── AUDIT.md               security audit + known limits (read this)
├── README.md
├── wizard/index.html      the setup wizard (static; host at get.joindreamlabs.com)
├── workspace-seed/        sample SOUL.md + mcp.json for repo-less agents
├── server/
│   ├── dashboard.mjs      THE dashboard (UI + all routes). Single file. (~1100 lines)
│   ├── run-agent.sh       provider runner + loop contracts + per-routine git
│   ├── agent-jail.sh      env-allowlist jail; provider command per type
│   ├── api-call.mjs       generic OpenAI-compatible runner (deepseek/any)
│   └── update-self.sh     root self-updater (validates downloads, restarts)
└── screenshots/           list/new/access/detail/wizard/calendar
```

### Where the design lives (what your dev will tweak)
- **All dashboard UI is in `server/dashboard.mjs`** (HTML + CSS inline, one file):
  - **CSS tokens / theme:** the `const CSS` block near the top. Colors are the
    Claude warm-dark palette (`--canvas`, `--surface-*`, `--accent` = clay, etc.).
  - **List + Calendar:** `pageList()` and `calendarBody()`.
  - **Create/edit form:** `formPage()` (templates, repo dock, trigger rows,
    Connectors/Behavior/Permissions tabs, contract).
  - **Routine detail + run history:** `detailPage()`.
  - **Access/keys + update:** `accessPage()`. **Providers:** `providersPage()` +
    `providerConnectPage()`. **GitHub:** `githubPage()`.
  - **Catalogs to edit:** `TEMPLATES` (Dream Labs template repos), `CONNECTORS`
    (Gmail/Telegram/Slack/GitHub/Notion + tutorials), `MODELS` / `PROVIDER_LABEL`.
- **The wizard is `wizard/index.html`** (self-contained). Brand string, step
  labels, the glow orb, and the `PROVIDERS` array are all near the top of its
  `<style>`/`<script>`. Brand is a one-line swap (currently "DREAM LABS").
- **Live design loop:** edit `server/dashboard.mjs`, copy to
  `~/.dreamlabs/bin/dashboard.mjs`, run `~/.dreamlabs/dreamlabs restart`. Or use
  `preview.sh` against fake data.

---

## 6. Provider matrix (current as of June 2026)

| Provider | Headless run | OAuth (click-connect) | API key env | Notes |
|---|---|---|---|---|
| Claude Code | `claude -p` | `claude setup-token` (token captured) | `ANTHROPIC_API_KEY` | models: claude-opus-4-8, sonnet-4-6, haiku-4-5 |
| OpenAI Codex | `codex exec` | `codex login --device-auth` | `OPENAI_API_KEY` | models: gpt-5.3-codex, gpt-5.4-mini |
| xAI Grok | `grok -p` | `grok auth login` (official Grok Build CLI) | `XAI_API_KEY` | model: grok-4.3 (grok-4-1-fast retired May 2026) |
| Google Gemini | `gemini -p` | Google sign-in | `GEMINI_API_KEY` | gemini-3.5-flash, gemini-3.1-pro-preview |
| DeepSeek | api-call.mjs | (key only) | key -> OPENAI_API_KEY + base | deepseek-v4-flash/pro, base api.deepseek.com |
| Any API | api-call.mjs | (key only) | OPENAI_API_KEY + API_BASE_URL | any OpenAI-compatible endpoint |

OAuth from cron works because each CLI caches its session in the run user's HOME
(or, for Claude, a captured `CLAUDE_CODE_OAUTH_TOKEN`). The jail forwards only the
relevant credential, never the others.

---

## 7. Security model (the $6k rules, baked in)

1. **Explicit routes only; unknown path -> 404. No static-file fallback.** (`/secrets.env` is 404.)
2. **Secrets outside any web root**, 640 root:dreamlabs (Linux) / 600 (Mac). Provider
   keys NEVER load into the web process (split `dashboard.env`).
3. **Agent jailed:** `env -i` allowlist; separate `dreamlabs-agent` user on Linux
   that cannot read secrets; same-user `DL_NO_SUDO` on local/Mac (env allowlist still
   enforced, file isolation relaxed - acceptable on a single-user localhost box).
4. **No common ports** (random 49152-65535). **Local by default** (localhost + token,
   no firewall); or Tailscale-only; or firewalled to one IP.
5. **Token auth** on every route except `/health`; the access link is the password.
6. **Self-update can't run arbitrary code:** the web app only drops a flag; a root
   task validates the download (`node --check`, `bash -n`) before applying.
7. **GitHub token** stored 600, never persisted in the group-readable `.git/config`,
   never added to the agent jail.

Audit (full detail in `AUDIT.md`): fixed F1 (keys were in the web env), F2 (token
in .git/config), and live-test bugs B1 (set -e aborted the jail - broke every run),
B2 (secrets not exported), B3 (launchd/cron PATH), B4 (secrets path). Known limit
L1: dashboard + runner share one user on Linux; a 3-user split is the recommended
next hardening (low real exposure given localhost/Tailscale + jailed agent).

---

## 8. Decided architecture direction (templates + brand voice)

Confirmed with the owner 2026-06-07:

- **GitHub is the spine.** The box only needs GitHub at runtime; Dream Labs is the
  generation/editing surface; the box pulls. This keeps the no-dependency promise.
- **Dream Labs hosts the standard templates** (in the RubiconTwilly org today). The
  template gallery in the form points at these.
- **Users can fork a standard template and upload their relevant files** (brand
  voice, business context) to their fork; the box pulls the fork. Bring-your-own
  repo also stays supported.
- **The generated/personalized agent = the starter repo with their files filled in.**
  The starter (`dreamlabs-agent-starter`) already has `SOUL.md`, `brand-voice.md`,
  `business.md`, `routine-prompt.md`, `learnings.md`. Dream Labs' existing
  generation pipeline (blueprints/Forge) becomes the template generator: same
  output, written into a repo. Editing brand voice = committing to that repo; the
  box pulls next run. (Generated-repo-per-user via the GitHub App is the future
  power path.)

---

## 9. Queue / roadmap (the "design things to tweak" + next builds)

1. **Calendar -> Google-Calendar month grid.** Day cells with the agents scheduled;
   collapse high-frequency routines to "AgentName x48" instead of 48 rows. (Cron
   eval already exists in `dashboard.mjs`: `cronMatches` / `upcomingRuns`.)
2. **Installer OAuth run-inline.** The first-provider sign-in should run smoothly
   inside the bash prompter (device flow), not just print a command.
3. **DL-hosted templates + fork-and-upload skeleton.** One-click "Fork this template
   to my GitHub" (GitHub API) + a small brand-voice/business uploader to the fork.
4. **Daily Briefing insights.** A built-in "house" agent that runs via the jailed
   runner (which has the key) and writes a run-health summary the dashboard shows -
   so the dashboard is smart without putting keys in the web process.
5. **GitHub App tier** (power option): one-click manifest -> user's own App ->
   short-lived per-repo-per-run installation tokens + native webhook triggers.
6. **Wizard provisions a Dream Labs backend key** (eventual): the wizard URL becomes
   a logged-in portal that also mints the customer's Dream Labs key.
7. **Provider connect UI polish:** a real status (connected/verified) check; a
   "Connect provider" surface mirroring the GitHub one (mostly done).

---

## 10. Appendix

**Dashboard routes:** `GET /` (list, `?view=calendar`), `/new`, `/edit/:id`,
`/routine/:id`, `/access`, `/providers`, `/provider/:id`, `/github`,
`/api/github/repos`, `/health`. `POST /routine`, `/routine/:id[/run|pause|resume|delete]`,
`/update`, `/provider/{connect|key|default|disconnect}/:id`, `/github/{connect|disconnect}`,
`/api/trigger/:id` (Bearer), `/webhook/:id` (HMAC or Bearer).

**Box layout (Linux):** app `/opt/dreamlabs`, data `/var/dreamlabs`, secrets
`/etc/dreamlabs/{secrets.env,dashboard.env}`. **(macOS):** all under `~/.dreamlabs/`.

**CLI:** `dreamlabs {link|logs|update|restart|run <id>|uninstall}`.

**Env vars the wizard sets (no secrets):** `DL_PROVIDER`, `DL_AUTH`, `DL_MODEL`,
`DL_ACCESS`. Plus install-time: `DL_SOURCE`, `DL_UPDATE_URL`, `DL_KEY` (headless).

*End of doc. Pairs with `DREAMLABS-HANDOFF.md` (Track A, the cloud funnel).*
