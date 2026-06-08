# Dream Labs Agent Server - Self-Hosted, Bring-Your-Own-AI Track

**Status: LIVE, v0.12.1 (updated 2026-06-07).** Build + handoff doc - hand it to a dev to extend.

- **NEW in v0.12.x - Personalization bridge (Dream Labs onboarding):** a paying member connects by the email they paid with and the box pulls THEIR quiz apps + recommended Dream agents + brand voice from `app.joindreamlabs.com`; Install builds a ready-to-run routine on the box. Consumer side built + **VERIFIED LIVE on a real account** (apps resolve, brand voice merges, install works, the panel is native to the dashboard). The ONE open piece is the BACKEND populating each agent's `apps` (the 49-agent tools -> connector-id mapping). See section 4.2.
- **NEW in v0.11.0 - Connector directory (79 apps):** a manifest-driven "Connected apps" directory (`/connections`) styled like the Claude Code connectors (dark tiles, real brand logos, search, categories). Built from a connector-research workflow (23 grouped agents, official docs cited). One generic engine drives two auth styles: **bring-your-own OAuth app** (no Dream Labs-hosted apps, no verification chase - the customer makes their own app on their own server, we give clear baked tutorials) and **API key / token / bot token**. Connect an app once at the account level; any routine that ticks it gets ONLY a short-lived token/key injected at run time. Secrets live in 600 files the agent never sees. Apps: Slack, Stripe, HubSpot, Notion, Shopify, Xero, QuickBooks, Mailchimp, Klaviyo, Airtable, Calendly, Twilio, Dropbox, Salesforce, Microsoft 365, Meta (IG/FB/WhatsApp), and ~60 more. Google stays the curated reference (one OAuth app, scope catalog: Gmail/Calendar/Drive/Sheets/Docs/Analytics/YouTube). See section 4.1.
- **Distribution (LIVE):** **https://get.joindreamlabs.com** - the setup wizard at `/`, the installer at `/install.sh`, and all server files, served by an Apache vhost on the EC2 box (`13.236.39.21`) with Let's Encrypt SSL. **Installs and self-updates pull from here, NOT GitHub.** Redeploy after code changes with `bash deploy.sh` (rsyncs the docroot; does not touch Apache).
- **Install (one line):** `curl -fsSL https://get.joindreamlabs.com/install.sh | bash` (auto-detects macOS vs Linux; cloud VPS or local Mac/Linux). It auto-opens the dashboard at the end.
- **Repo (dev source, public, MIT):** https://github.com/RubiconTwilly/dreamlabs-agent-server - this is just version control; at launch move the product repos to a `dreamlabs` GitHub org (do NOT rename the personal account - other things are tied to it). See section 12.
- **Local source:** `/Users/twilly/Desktop/dreamlabs-agent-server/`. **Preview the UI (Mac, no install):** `bash preview.sh`.
- **Verified end-to-end on macOS:** install -> launchd dashboard on localhost -> one-click connect a provider (OAuth device flow) -> one-click connect GitHub (OAuth device flow, read+write) -> pick a repo -> create an agent (explicitly choose its AI) -> run (real output) -> auto-pause on repeated failure.

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
a prompter (you are in the terminal there anyway) - OR pick "Skip" (in the wizard
or installer) to stand up just the dashboard and connect every provider later by
click. After that, the dashboard does everything - including OAuth, where the
dashboard runs the device flow and the user only approves in a browser.

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
| One-click provider connect (OAuth device flow + key paste) | DONE | each provider has a Connect button (Access page + /providers); multiple providers; swap default; per-agent pick |
| GitHub connect - ONE-CLICK OAuth (device flow), read+write | DONE | `repo` scope (push for fork/brand-voice). Dream Labs OAuth App client id baked in. Token paste is a fallback. Poll respects GitHub's interval (slow_down fix). |
| Per-routine AI picker | DONE | explicit "Which AI runs this agent?" field on the create form (Claude/Codex/Grok/Gemini/DeepSeek/API) |
| Repo picker + per-agent clone | DONE | lists your real repos once GitHub is connected; each routine clones its own repo |
| Dream Labs template gallery in the create form | DONE | public templates clone with no token |
| Connector directory (79 apps) | DONE | manifest-driven `/connections`, Claude-connectors look (logos, search, categories); generic engine (BYO OAuth + API key); per-routine token injection. See 4.1 |
| Connector tutorials | DONE | every connector has a baked step-by-step guide + agent-usage example, from the research workflow (sources cited; 3 flagged medium-confidence in-UI) |
| Calendar tab (Google-Calendar month grid) | DONE | day cells, TODAY highlight, high-freq collapse to "x N", month nav |
| Daily Briefing (run-health insights) | DONE (box side) | computed; dashboard card; delivers via Dream Labs relay (section 11); DL backend relay = the dev's piece |
| Self-update ("Update" button + CLI) | DONE | dashboard requests, root task validates + applies |
| Setup wizard | DONE | `wizard/index.html` - paper-clay-blue (matches app.joindreamlabs.com), real logo + favicons, Skip-provider option, generates the install command |
| Live hosting on get.joindreamlabs.com | DONE | Apache vhost + SSL on the EC2 box; `deploy.sh` redeploys the docroot |
| Dashboard themes | DONE | Classic (warm-dark) + Dream Labs (navy) switcher in the header |
| Audit | DONE | `AUDIT.md` (fixed F1, F2, B1-B4; known limits listed) |
| Runtime verified end-to-end (2026-06-07, macOS) | DONE | Live-tested: cron is written by syncCron + the OS daemon FIRES it on schedule (server-local tz); loop contracts all enforce (overlap-skip, timeout-kill at the budget, auto-pause after N fails, daily-cap skip); run records + per-run logs + list/detail/calendar/briefing render; failure/auto-pause/cap alerts fire; connector token injected into the jailed agent with NO server-secret leak. Fixes from the audit: engine `isMain` made symlink-safe (injection would silently no-op under a symlinked path), run-timestamp parser fixed (history showed raw stamps), alerts now also route via the DL relay (members need no own bot), server timezone surfaced in the UI. Re-verify on Linux/systemd before GA. |
| Personalization bridge (Dream Labs onboarding) | DONE (consumer); backend agent-apps PENDING | Connect-by-email pulls the member's quiz apps + Dream agents + brand voice; Install builds a routine. VERIFIED LIVE on a real account. `server/dl-backend.mjs` + a panel on the routines list. OPEN (backend): `/api/v1/agents/:id` returns empty `apps`, so installs arrive unwired - needs the 49-agent tools->connector mapping (Part A of the backend prompt). The dashboard auto-ticks once populated. See 4.2 |

Queue (not yet built): more connectors (Microsoft 365 / Outlook, Square,
ActiveCampaign - same pattern as Google, section 4.1); the DL backend relay
endpoint + bot for the Daily Briefing (section 11); the DL-hosted-templates "fork +
upload my files" skeleton; the GitHub App per-repo-per-run tier (optional upgrade
beyond the OAuth device flow); the wizard provisioning a Dream Labs backend key;
AI-narrative enrichment for the briefing. See section 9.

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
  the dashboard). macOS = per-routine launchd LaunchAgents (`com.dreamlabs.routine.*`),
  because the user crontab is Full-Disk-Access-gated under launchd; the dashboard
  translates each routine's cron to a launchd `StartCalendarInterval`. launchd also runs the dashboard.
- **Per-routine repos:** each routine names its own repo (or none). The runner
  clones/pulls it into a per-routine workspace before the agent runs. The picker
  stores `owner/name`; the runner normalizes to a full URL.
- **Secrets split:** provider keys live in `secrets.env` (runner-only). The web
  process loads only `dashboard.env` (no provider keys). Keys connected later by
  click land in `keys.env` (dashboard-writable, runner-sourced).

---

## 4. The all-click model

- **Bash installs the platform + (optionally) the FIRST provider** via the installer's
  prompter, OR pick **Skip** to stand up just the dashboard and connect everything by
  click. That bash line is the only terminal step.
- **Everything else is click in the dashboard. Access & keys has a Connect button per provider + GitHub:**
  - **AI providers** (`/providers`, `/provider/:id`, and a Connect button on every row of `/access`):
    Connect any provider. **OAuth = one click**: the dashboard spawns the CLI device flow,
    captures the approval URL + code, shows it, polls (respecting the interval), and
    connects itself once you approve in a browser. **Paste-key** is offered for providers
    without OAuth (DeepSeek, Raw API, or any). Connect multiple; set/swap the default;
    each routine picks its own provider in the create form ("Which AI runs this agent?").
  - **GitHub** (`/github`): **ONE-CLICK OAuth device flow** - click Connect GitHub, enter the
    shown code at github.com/login/device, approve. Grants `repo` scope = **read + write**
    (so agents can push for the fork / brand-voice flow). Uses the Dream Labs OAuth App
    (public client id `Ov23lix1uyXcoGe6MsFi`, baked as the default; override with
    `DL_GITHUB_CLIENT_ID`). The token is stored 600, never enters the agent jail, never shown.
    A pre-filled `repo`-scope token paste is the fallback. Then the create form's repo
    picker lists your real repos and each agent clones only its own.
  - **Templates:** the create form leads with Dream Labs template cards (public repos)
    that fill the repo + a starting prompt + a name. Or use your own repo.
  - **Self-update** (`/access`): an Update button. **Theme switcher** (Classic / Dream Labs) in the header.
  - **Connected apps** (`/connections`): account-level third-party connectors (see 4.1).

---

## 4.1 Connector directory (account-level, manifest-driven)

The customer connects an app ONCE at the account level (`/connections`), then any
routine that ticks it gets access at run time. The directory looks like the Claude
Code connectors (dark tiles, real brand logos, search, categories) - the framing is
"you know this from Claude Code; here it is on your own server, your keys."

**Files (all kept OUT of `dashboard.mjs` so they don't collide with design edits):**
- `server/connectors/registry.mjs` - one manifest per app. Curated Google entry +
  `GENERATED` (78 from research). Adding an app = one manifest entry.
- `server/connectors/registry-generated.mjs` - AUTO-GENERATED from the research
  workflow (re-run `tools/connector-transform.mjs` against the workflow output to refresh).
- `server/connectors/engine.mjs` - ONE generic engine for both auth styles + a
  runner CLI (`node engine.mjs env <id>` prints shell `export` lines).
- `server/connections.mjs` - the directory + per-connector page (manifest-driven).

**Model (per owner): it is the customer's own server, we are the skin.** Dream Labs
hosts NO shared OAuth apps and chases NO verification. Two auth styles:
- `auth:'oauth'` (bring-your-own-app) - the customer registers their own app in the
  provider console; the baked guide walks them through it and shows the exact
  redirect URI. Authorization-code flow with refresh.
- `auth:'apikey'` - paste a key/token (+ any account/region/subdomain/site-URL
  field). Bot tokens (Slack/Telegram/Discord) and IMAP app-passwords are this too.

**Generic routes:** `/connection/:id` (page), `POST /connection/:id/creds`,
`GET /connection/:id/connect` (oauth -> 302 to provider), `GET /connection/:id/callback`,
`GET /connection/:id/test`, `POST /connection/:id/disconnect`.

**The SameSite gotcha (important):** the `dl_token` cookie is `SameSite=Strict`, so
it is WITHHELD on the provider's cross-site redirect back to the callback. The
callback is therefore exempt from cookie auth and authenticated by the one-time
`state` issued at Connect - the standard OAuth CSRF binding.

**Google specifics (the curated reference):** one OAuth app, scope catalog
(Gmail/Calendar/Drive/Sheets/Docs/Analytics/YouTube). The guide makes the
"In production" step loud (Testing mode expires refresh tokens after 7 days).

**Security (the $6k rules hold):** every connector's secrets live in
`data/connectors/<id>.json` (600). The dashboard reads them to run OAuth + refresh;
**the agent jail never sees them.** At run time, for each ticked connector the runner
calls `engine.mjs env <id>` (refreshes OAuth tokens; returns the API key) and exports
ONLY those vars, listing their names in `DL_CONNECTOR_VARS`; `agent-jail.sh` forwards
exactly those by name (indirect expansion) into the `env -i` allowlist. So agents get
a short-lived access token or the API key - never the client secret or refresh token.

**To add/refresh connectors:** edit the manifest in `registry.mjs` (curated) or re-run
the research workflow + `tools/connector-transform.mjs` to regenerate `registry-generated.mjs`.
No engine/UI/route changes needed - it is all manifest-driven.

---

## 4.2 Personalization bridge - Dream Labs onboarding (consumer DONE; backend agent-apps PENDING)

A paying member connects their Dream Labs account by the email they paid with, and the
box pulls THEIR world: the apps they ticked in the quiz, their recommended Dream agents,
and their brand voice. Built and VERIFIED LIVE (2026-06-07) against the real backend on a
real account.

Files / wiring:
- `server/dl-backend.mjs` - the client. Config in `data/dl.json` (600): {url, email, key,
  onboarding, syncedAt}. Backend defaults to `https://app.joindreamlabs.com` (override
  `DL_BACKEND_URL`). Connect-by-email GETs `/api/v1/onboarding?email=...`, which returns the
  member's `key` + their world; Install GETs `/api/v1/agents/:id`.
- Dashboard (surgical edits only): the onboarding panel renders on the routines list
  (`dlOnboardingPanel`); routes `POST /dl/connect | /dl/sync | /dl/disconnect |
  /dl/install/:id`. `dlBuildRoutine` turns a backend agent definition into a routine
  (instructions with brand voice merged, connectors resolved from the agent's apps,
  schedule, provider). With no account configured the dashboard stays the standalone product.
- App-name -> connector-id resolution: an alias map (Gmail/Calendar/Drive/Sheets/Docs ->
  google; Outlook -> outlook-mail; WhatsApp; etc.) plus a loose name match, so the member's
  quiz-app names link to real connectors. The backend SHOULD return canonical connector ids;
  this resolver is the robust fallback.

Verified live (a real account): brand pulled, all 8 quiz apps resolved (zero dimmed), 4 Dream
agents listed, Install created a routine with the brand voice merged (~7k-char instructions),
and the panel matches the dashboard vibe.

OPEN ITEM (backend - the Dream Labs dev's piece): `/api/v1/agents/:id` (and the onboarding
agent entries) currently return EMPTY `apps`/`connectors`, so an installed agent arrives with
NO integrations ticked (it has the brand voice + schedule, but nothing wired to act). Fix:
populate each agent's `apps` with connector ids - the 49-agent `tools` -> connector-id mapping
in Part A of `DREAMLABS-BACKEND-PROMPT.md`. Once populated, the dashboard auto-ticks them
(proven against a mock); NO further dashboard changes needed. `provider` also returns empty
(the box defaults to `claude`).

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
│   ├── dashboard.mjs      THE dashboard (UI + all routes). Single file. (~1350 lines)
│   ├── connections.mjs    "Connected apps" directory + per-connector page (manifest-driven)
│   ├── dl-backend.mjs     Dream Labs onboarding bridge: connect-by-email, pull apps+agents+brand voice, Install -> routine
│   ├── connectors/
│   │   ├── engine.mjs            generic OAuth + API-key engine + runner CLI (`env <id>`)
│   │   ├── registry.mjs          connector manifests (curated Google + GENERATED)
│   │   └── registry-generated.mjs AUTO-GENERATED from the research workflow (78 apps)
│   ├── run-agent.sh       provider runner + loop contracts + per-routine git + connector tokens
│   ├── agent-jail.sh      env-allowlist jail; provider command per type; forwards GOOGLE_ACCESS_TOKEN
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

## 9. Queue / roadmap (what's left)

Done since the first cut (no longer queue): Calendar month grid (v0.8.0), Daily
Briefing box-side (v0.9.0), get.joindreamlabs.com hosting + SSL (v0.9.2), wizard
paper-clay-blue theme + logo + Skip-provider, one-click GitHub OAuth (read+write),
per-provider Connect buttons, clearer per-routine AI picker, **Google connector
(v0.10.0)**, **the 79-app connector directory: research workflow + manifest engine +
Claude-style directory with logos + tutorials (v0.11.0)**.

Remaining:
- **[ACTIVE NEXT - backend] Populate Dream agent `apps`** - `/api/v1/agents/:id` (and the
  onboarding agent entries) return empty `apps`, so installed Dream agents arrive with no
  integrations ticked. Map each of the 49 agents' `tools` -> connector ids (Part A of
  `DREAMLABS-BACKEND-PROMPT.md`) and return them; the dashboard auto-ticks once populated.
  This is the one thing between the onboarding bridge and fully-wired installs (section 4.2).
0. **Verify the breakable connectors** (optional, recommended): the research was
   79/82 high-confidence with cited sources, but a targeted second workflow pass
   could adversarially re-check the 26 BYO-OAuth endpoints/scopes + the 3
   medium-confidence ones against the docs (the 3 are already flagged in-UI). Also:
   self-host the brand logos (currently from cdn.simpleicons.org) for full offline /
   no-third-party rendering; and weave the Claude-Code-first onboarding into the wizard.
1. **DL backend relay for the Daily Briefing** (the dev's piece): the endpoint + the
   Dream Labs Telegram bot + the box-to-owner chat mapping. Box side is done; contract in section 11.
2. **DL-hosted templates + "fork + upload my files" skeleton.** One-click "Fork this
   template to my GitHub" (now possible - GitHub write is connected) + a small
   brand-voice/business uploader to the fork. (Owner's model: DL hosts standard
   templates, users fork + upload their files; box pulls.)
3. **GitHub App tier** (optional upgrade beyond the OAuth device flow): per-repo-per-run
   short-lived installation tokens + native webhook triggers.
4. **Wizard provisions a Dream Labs backend key** (eventual): the wizard URL becomes a
   logged-in portal that also mints the customer's DL key (feeds DL_BRIEFING_KEY etc.).
5. **Installer first-provider OAuth run-inline** (minor): run the device login inside the
   bash prompter rather than printing the command. (Post-install, the dashboard one-click covers it.)
6. **AI-narrative enrichment** for the briefing (use the box's provider via the jailed runner).
7. **Move repos to a `dreamlabs` GitHub org** at launch (section 12).

---

## 11. Daily Briefing + Dream Labs relay (for the backend dev)

Goal (owner's call): the daily insights go out on a **Dream Labs-controlled
Telegram bot, run by us** - the customer does NOT set up their own bot. We keep
the channel and the visibility.

How it works:
- On the box, `server/briefing.mjs` runs daily (launchd on Mac / cron.d on Linux,
  8am). It computes run-health from the box's own data (no provider key needed,
  nothing secret in the web process): agents, runs today, failures, per-agent
  state (healthy / failing / paused / never-run), and which need attention.
- It writes `data/briefing.json` (the dashboard shows a "Daily Briefing" card),
  then delivers in this order:
  1. **Dream Labs relay** if `DL_BRIEFING_URL` is set (the intended path).
  2. Local Telegram fallback (`ALERT_TG_TOKEN`/`CHAT`) for pure self-hosters.
  3. Otherwise stored only (dashboard still shows it).

Real-time alerts use the SAME relay: `server/run-agent.sh` POSTs `{type:"alert", boxId, text}`
to `DL_BRIEFING_URL` on a routine failure / auto-pause / daily-cap (then falls back to the
self-host Telegram). So the daily digest is `type:"briefing"` and alerts are `type:"alert"` -
the backend relays both to the member's chat, which is why a member needs no bot of their own.

**The relay contract the Dream Labs backend implements** (this is the dev's piece):
```
POST  {DL_BRIEFING_URL}            e.g. https://api.joindreamlabs.com/v1/briefing
Authorization: Bearer {DL_BRIEFING_KEY}   # per-box key DL issues (ties to the
                                          # "wizard provisions a DL key" idea)
body: { boxId, generatedAt, summary, details:[{id,name,provider,state,failStreak}] }
```
DL backend: look up `boxId` -> the owner's linked Telegram chat (the owner DM'd
the DL bot `/start` once at signup, DL stored the mapping) -> relay `summary` via
DL's bot. The box never holds a Telegram token; DL owns the bot and the mapping.

To enable on a box: set `DL_BRIEFING_URL`, `DL_BRIEFING_KEY`, `DL_BOX_ID` in
secrets.env (installer leaves them blank; the wizard-provisioned key fills them).
Test now: `dreamlabs briefing` (generates + shows the card; delivers if configured).

Future: optionally enrich the summary with an AI-written narrative via the jailed
runner (uses the customer's key, stays out of the web process).

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

---

## 12. Hosting, deploy, and GitHub ownership

**Live host - get.joindreamlabs.com (on the EC2 box `13.236.39.21`, Apache):**
- Apache vhost `get-joindreamlabs.conf` (+ `-le-ssl.conf`), docroot `/var/www/get-dreamlabs/`.
  Serves the wizard (`/` = index.html), `install.sh`, `install-macos.sh`, `server/*`,
  `VERSION`, `workspace-seed/*`, and the logo/favicons. SSL via `certbot --apache`
  (NEVER nginx - same box runs app.joindreamlabs.com / hub / rubiconbot; the Apache-only
  rule from DREAMLABS-HANDOFF applies).
- **Installs + self-updates fetch from here** (the installers' `REPO_RAW` / `DL_UPDATE_URL`
  default to `https://get.joindreamlabs.com`), not GitHub.
- **Redeploy after code changes:** `bash deploy.sh` from the local repo - rsyncs the docroot,
  chowns www-data, does NOT touch Apache config. (`DL_DEPLOY_HOST` / `DL_DEPLOY_KEY` override
  the box/key; defaults are the EC2 box + `~/.ssh/id_ed25519`.)

**GitHub (dev source + the one-click OAuth App):**
- Dev source repo: `github.com/RubiconTwilly/dreamlabs-agent-server` (version control only).
- One-click GitHub connect uses a Dream Labs **OAuth App** (Device Flow enabled, public client
  id `Ov23lix1uyXcoGe6MsFi`, baked as the default in `dashboard.mjs`). It is public/safe to
  embed; rotate or override per box with `DL_GITHUB_CLIENT_ID`.
- **At launch:** create a `dreamlabs` GitHub **org** and transfer the product repos
  (`dreamlabs-agent-server`, `dreamlabs-agent-starter`, `dreamlabsblueprint`) into it.
  **Do NOT rename the personal `RubiconTwilly` account** - other services are tied to it.
  Move the OAuth App to the org too (same client id -> one-click keeps working). Then sweep
  the ~6 `RubiconTwilly` references (install.sh `STARTER_DEFAULT`, dashboard.mjs `TEMPLATES`,
  preview.sh samples, SPEC.md) + the git remote, and `bash deploy.sh`.

*End of doc. Pairs with `DREAMLABS-HANDOFF.md` (Track A, the cloud funnel).*
