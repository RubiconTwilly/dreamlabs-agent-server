#!/usr/bin/env node
// Dream Labs Agent Server - dashboard service.
//
// Single file, Node builtins only. Hardened to the $6k rules:
//   - binds 127.0.0.1 only (reach it via Tailscale or a firewalled reverse proxy)
//   - EXPLICIT route table; any unknown path → 404. NO static-file fallback, ever.
//   - the dashboard process NEVER reads provider secrets. It shows connection
//     STATUS only (from providers.json, no secret values). Keys live in
//     /etc/dreamlabs/secrets.env, sourced by the runner, masked from the agent.
//   - token auth on every route except /health.
//
// Visual language matches the Claude routines UI: warm flat-dark, white primary
// buttons, docked pickers, big trigger rows, connector chips, amber callouts.
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, mkdirSync, openSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { timingSafeEqual, createHmac, randomUUID } from 'node:crypto';
import { join } from 'node:path';

const DATA = process.env.DL_DATA || '/var/dreamlabs';
const APP = process.env.DL_APP || '/opt/dreamlabs';
const PORT = parseInt(process.env.DASH_PORT || '49207', 10);
const HOST = '127.0.0.1';
const TOKEN = process.env.DASH_TOKEN || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const PUBLIC_URL = process.env.DASH_URL || '';
const ROUTINES_FILE = join(DATA, 'routines.json');
const RUNS_FILE = join(DATA, 'runs.jsonl');
const RUNS_DIR = join(DATA, 'runs');
const PROVIDERS_FILE = join(DATA, 'providers.json'); // {claude:bool,...} - STATUS only, no secrets
const VERSION_FILE = join(APP, 'VERSION');
const UPDATE_FLAG = join(DATA, '.update-requested');   // dashboard writes; root systemd path applies
const UPDATE_STATUS = join(DATA, 'update-status.json'); // root updater writes; dashboard reads
const UPDATE_URL = process.env.DL_UPDATE_URL || 'https://raw.githubusercontent.com/RubiconTwilly/dreamlabs-agent-server/main';
const GITHUB_TOKEN_FILE = join(DATA, 'github.token'); // 600, dreamlabs-owned. Read by dashboard (repo list) + runner (clone).
const GITHUB_JSON = join(DATA, 'github.json');        // {connected, login} - no token
const VERSION = (() => { try { return readFileSync(VERSION_FILE, 'utf8').trim(); } catch { return 'dev'; } })();
const RUNNER = join(APP, 'bin', 'run-agent.sh');
const CRON_TAG = 'dreamlabs-agent-server';
const PROVIDERS = ['claude', 'codex', 'grok', 'gemini', 'deepseek', 'api'];
const PROVIDER_LABEL = { claude: 'Claude Code', codex: 'OpenAI Codex', grok: 'xAI Grok', gemini: 'Google Gemini', deepseek: 'DeepSeek', api: 'Raw API (any model)' };
// Model IDs current as of June 2026 (see AUDIT.md / research notes).
const MODELS = {
  claude: ['', 'claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
  codex: ['', 'gpt-5.3-codex', 'gpt-5.4-mini'],
  grok: ['', 'grok-4.3'],
  gemini: ['', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'],
  deepseek: ['', 'deepseek-v4-flash', 'deepseek-v4-pro'],
  api: ['', 'deepseek-v4-flash', 'grok-4.3', 'gpt-5.4-mini', 'MiniMax-M3', 'kimi-k2.6'],
};
// Which providers are actually wired up on this box (from providers.json). Falls
// back to all when none recorded (preview/dev). Always includes `extra`.
function configuredProviders(extra) {
  const st = providerStatus();
  let list = PROVIDERS.filter(p => st[p]);
  if (!list.length) list = [...PROVIDERS];
  if (extra && !list.includes(extra)) list = [extra, ...list];
  return list;
}

// Dream Labs template agents. Public repos, so they clone even before GitHub is
// connected. Picking one fills the repo + a starting prompt. "Or use your own repo."
const TEMPLATES = [
  { id: 'starter', name: 'Agent Starter', repo: 'RubiconTwilly/dreamlabs-agent-starter',
    desc: 'A clean, well-structured agent brain: SOUL, brand voice, business context, drafts folder. The best blank canvas.',
    instructions: 'Read the SOUL and routine-prompt in this repo. Each run, do the task described there, write outputs to the drafts folder, and report a short summary of what you did.' },
  { id: 'blueprint', name: 'Business Blueprint', repo: 'RubiconTwilly/dreamlabsblueprint',
    desc: 'Generates and maintains a business blueprint from intake answers. Good base for a research / report agent.',
    instructions: 'Using the blueprint structure in this repo, refresh the report from the latest inputs. Flag anything that changed since the last run.' },
];

// Connector catalog - tutorials are baked in (the customer wires these on their end).
const CONNECTORS = [
  { id: 'gmail', name: 'Gmail', icon: '📧', steps: [
    'In Google Cloud Console, create OAuth credentials (Desktop app) and enable the Gmail API.',
    'Run the Gmail MCP server on this box: `npx @modelcontextprotocol/server-gmail` and complete the OAuth consent once.',
    'Add the server to the agent workspace `mcp.json`. The runner exposes it to the agent each run.',
  ]},
  { id: 'telegram', name: 'Telegram', icon: '✈️', steps: [
    'Create a bot with @BotFather and copy the bot token.',
    'Add `TELEGRAM_BOT_TOKEN` to /etc/dreamlabs/secrets.env (never the repo).',
    'Enable the Telegram MCP server in `mcp.json`; the agent can then send/read messages.',
  ]},
  { id: 'slack', name: 'Slack', icon: '💬', steps: [
    'Create a Slack app, add bot scopes (chat:write, channels:read), install to the workspace.',
    'Store the bot token in secrets.env as `SLACK_BOT_TOKEN`.',
    'Enable the Slack MCP server in `mcp.json`.',
  ]},
  { id: 'github', name: 'GitHub', icon: '🐙', steps: [
    'Create a fine-grained PAT scoped to the repos this agent should touch.',
    'The installer already stored a `GITHUB_TOKEN` to clone your repo; reuse or scope a second one.',
    'The GitHub MCP server lets the agent open PRs, read issues, and comment.',
  ]},
  { id: 'notion', name: 'Notion', icon: '📓', steps: [
    'Create a Notion internal integration and share the target pages/databases with it.',
    'Store the secret as `NOTION_TOKEN` in secrets.env.',
    'Enable the Notion MCP server in `mcp.json`.',
  ]},
];

if (!TOKEN || TOKEN.length < 16) {
  console.error('FATAL: DASH_TOKEN must be set (>=16 chars). Refusing to start without auth.');
  process.exit(1);
}

// ---------- data layer ----------

const validId = (s) => typeof s === 'string' && /^[a-z0-9][a-z0-9-]{0,39}$/.test(s);
const slugify = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || ('r-' + randomUUID().slice(0, 8));
const nowISO = () => new Date().toISOString();

function readJSON(p, fallback) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; } }
function readRoutines() { return existsSync(ROUTINES_FILE) ? readJSON(ROUTINES_FILE, { routines: [] }) : { routines: [] }; }
function writeRoutines(obj) {
  const tmp = ROUTINES_FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(obj, null, 2));
  renameSync(tmp, ROUTINES_FILE);
  syncCron(obj);
}
function getRoutine(id) { return readRoutines().routines.find(r => r.id === id); }
function providerStatus() { return readJSON(PROVIDERS_FILE, {}); }
function updateStatus() { return readJSON(UPDATE_STATUS, null); }
// ---- provider connect: all click, no terminal. OAuth via spawned device-flow ----
// login commands per provider. oauth caches in HOME (the jail reuses it on this
// local box); claude prints a token we capture into keys.env.
const PROVIDER_LOGIN = {
  codex: { cmd: ['codex', 'login', '--device-auth'], oauth: true },
  grok: { cmd: ['grok', 'auth', 'login'], oauth: true },
  claude: { cmd: ['claude', 'setup-token'], oauth: true, captureToken: 'CLAUDE_CODE_OAUTH_TOKEN' },
};
// key-paste: which env var (+ base) a pasted API key maps to.
const PROVIDER_KEY = {
  claude: { key: 'ANTHROPIC_API_KEY' }, codex: { key: 'OPENAI_API_KEY' },
  grok: { key: 'XAI_API_KEY' }, gemini: { key: 'GEMINI_API_KEY' },
  deepseek: { key: 'OPENAI_API_KEY', base: 'https://api.deepseek.com' },
  api: { key: 'OPENAI_API_KEY' },
};
const KEYS_ENV = join(DATA, 'keys.env'); // runner sources this (dashboard-writable, cross-platform)
const connectLog = p => join(DATA, `connect-${p}.log`);
const connectStatusFile = p => join(DATA, `connect-${p}.status.json`);
const connectStatus = p => readJSON(connectStatusFile(p), null);

function setProviderConnected(prov, on, makeDefault) {
  const ps = providerStatus(); ps[prov] = !!on; ps.updatedAt = nowISO();
  if (on && (makeDefault || !ps.default)) ps.default = prov;
  if (!on && ps.default === prov) ps.default = Object.keys(ps).find(k => k !== 'default' && k !== 'updatedAt' && ps[k]) || '';
  try { writeFileSync(PROVIDERS_FILE, JSON.stringify(ps, null, 2)); } catch {}
}
function writeKeyEnv(name, val, extra) {
  let cur = ''; try { cur = readFileSync(KEYS_ENV, 'utf8'); } catch {}
  const drop = new Set([name, ...(extra ? Object.keys(extra) : [])]);
  const lines = cur.split('\n').filter(l => l && !drop.has(l.split('=')[0]));
  lines.push(`${name}=${val}`);
  if (extra) for (const [k, v] of Object.entries(extra)) lines.push(`${k}=${v}`);
  writeFileSync(KEYS_ENV, lines.join('\n') + '\n', { mode: 0o600 });
}
// Spawn the provider's login flow; the dashboard captures its device code/URL and
// watches for completion. The user only approves in their browser.
function startProviderConnect(prov) {
  const spec = PROVIDER_LOGIN[prov]; if (!spec) return false;
  writeFileSync(connectLog(prov), '');
  writeFileSync(connectStatusFile(prov), JSON.stringify({ state: 'pending', at: nowISO() }));
  let child;
  try {
    const fd = openSync(connectLog(prov), 'a');
    child = spawn(spec.cmd[0], spec.cmd.slice(1), { stdio: ['ignore', fd, fd], detached: true });
  } catch { writeFileSync(connectStatusFile(prov), JSON.stringify({ state: 'failed', error: 'could not start (CLI installed?)' })); return false; }
  child.on('error', () => { try { writeFileSync(connectStatusFile(prov), JSON.stringify({ state: 'failed', error: 'CLI not found' })); } catch {} });
  child.on('exit', (code) => {
    if (code === 0) {
      if (spec.captureToken) {
        try { const out = readFileSync(connectLog(prov), 'utf8'); const m = out.match(/sk-ant-[A-Za-z0-9_-]{20,}|[A-Za-z0-9_-]{40,}/); if (m) writeKeyEnv(spec.captureToken, m[0]); } catch {}
      }
      setProviderConnected(prov, true);
      try { writeFileSync(connectStatusFile(prov), JSON.stringify({ state: 'connected', at: nowISO() })); } catch {}
    } else {
      try { writeFileSync(connectStatusFile(prov), JSON.stringify({ state: 'failed', code, at: nowISO() })); } catch {}
    }
  });
  child.unref();
  return true;
}

function githubStatus() { return readJSON(GITHUB_JSON, { connected: false }); }
function readGithubToken() { try { return readFileSync(GITHUB_TOKEN_FILE, 'utf8').trim(); } catch { return ''; } }
// Call the GitHub API with the stored token. Returns parsed JSON, {error} on HTTP error, or null if not connected.
async function gh(path) {
  const t = readGithubToken();
  if (!t) return null;
  try {
    const r = await fetch('https://api.github.com' + path, {
      headers: { authorization: 'Bearer ' + t, 'user-agent': 'dreamlabs-agent-server', accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return { error: r.status };
    return r.json();
  } catch { return { error: 'network' }; }
}
async function fetchRemoteVersion() {
  try {
    const res = await fetch(UPDATE_URL + '/VERSION', { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return (await res.text()).trim().slice(0, 32);
  } catch { return null; }
}
function requestUpdate() {
  try { writeFileSync(UPDATE_FLAG, new Date().toISOString()); return true; } catch { return false; }
}

function readRuns(id, limit = 50) {
  if (!existsSync(RUNS_FILE)) return [];
  const lines = readFileSync(RUNS_FILE, 'utf8').trim().split('\n').filter(Boolean);
  const out = [];
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
    try { const r = JSON.parse(lines[i]); if (r.id === id) out.push(r); } catch { /* skip */ }
  }
  return out;
}
function lastRun(id) { return readRuns(id, 1).find(x => x.event === 'run') || null; }
function listLogs(id) {
  const dir = join(RUNS_DIR, id);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.log')).sort().reverse();
}
function readLog(id, ts) {
  if (!validId(id) || !/^[0-9TZ]+\.log$/.test(ts)) return null;
  const p = join(RUNS_DIR, id, ts);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}
function appendRun(obj) {
  try { writeFileSync(RUNS_FILE, JSON.stringify(obj) + '\n', { flag: 'a' }); } catch (e) { console.error('appendRun:', e.message); }
}

// Rewrite OUR crontab (the dreamlabs user's own) from routines.json.
// DL_NO_CRON=1 disables this entirely (local preview / externally-managed cron).
function syncCron(obj) {
  if (process.env.DL_NO_CRON) return;
  let current = '';
  try { current = execFileSync('crontab', ['-l'], { encoding: 'utf8' }); } catch { current = ''; }
  const begin = `# BEGIN ${CRON_TAG}`, end = `# END ${CRON_TAG}`;
  const cleaned = stripBlock(current, begin, end);
  const lines = [begin];
  for (const r of obj.routines) {
    if (r.trigger?.type === 'schedule' && r.trigger.cron && !r.paused && validId(r.id)) {
      lines.push(`${r.trigger.cron} ${RUNNER} ${r.id} cron >/dev/null 2>&1`);
    }
  }
  lines.push(end);
  const next = (cleaned.trim() ? cleaned.trim() + '\n' : '') + lines.join('\n') + '\n';
  try { execFileSync('crontab', ['-'], { input: next }); }
  catch (e) { console.error('cron sync failed:', e.message); }
}
function stripBlock(text, begin, end) {
  const lines = text.split('\n'); const out = []; let inside = false;
  for (const l of lines) {
    if (l.trim() === begin) { inside = true; continue; }
    if (l.trim() === end) { inside = false; continue; }
    if (!inside) out.push(l);
  }
  return out.join('\n');
}

// ---------- security ----------

function safeEqual(a, b) {
  const ba = Buffer.from(a || ''), bb = Buffer.from(b || '');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}
function authed(req) {
  const cookies = parseCookies(req);
  if (cookies.dl_token && safeEqual(cookies.dl_token, TOKEN)) return true;
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ') && safeEqual(auth.slice(7), TOKEN)) return true;
  return false;
}

// ---------- http helpers ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', ...headers });
  res.end(body);
}
function json(res, code, obj) { send(res, code, JSON.stringify(obj), { 'content-type': 'application/json' }); }
function redirect(res, to, headers = {}) { res.writeHead(302, { location: to, ...headers }); res.end(); }
function readBody(req) {
  return new Promise((resolve) => {
    let data = ''; let size = 0;
    req.on('data', c => { size += c.length; if (size > 1e6) req.destroy(); else data += c; });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(''));
  });
}
const parseForm = (body) => { const o = {}; new URLSearchParams(body).forEach((v, k) => { o[k] = v; }); return o; };

// ---------- UI (Claude routines design language) ----------

const CSS = `
:root{
  --canvas:#1c1b19; --surface-1:#232220; --surface-2:#2b2926; --surface-3:#34322e;
  --field:#2b2926; --field-hover:#34322e;
  --border:rgba(255,255,255,.07); --border-strong:rgba(255,255,255,.13);
  --ink:#f5f4f2; --muted:#c6c2bb; --subtle:#928d84; --tertiary:#6c675f;
  --accent:#c96442; --accent-soft:rgba(201,100,66,.16);
  --white:#fafaf8; --green:#5cbb6e; --amber:#e0a948; --red:#e06b6b;
  --warn-bg:rgba(224,169,72,.10); --warn-border:rgba(224,169,72,.28); --warn-ink:#e6b863;
  --r-sm:7px; --r-md:10px; --r-lg:14px; --r-xl:18px;
  --font:"SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --mono:"SF Mono",ui-monospace,"JetBrains Mono",Menlo,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--canvas);color:var(--ink);font-family:var(--font);font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
code{font-family:var(--mono);font-size:.86em;background:rgba(255,255,255,.06);padding:1px 5px;border-radius:5px;color:var(--muted)}
.wrap{max-width:880px;margin:0 auto;padding:26px 24px 96px}
header.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px}
.brand{display:flex;align-items:center;gap:9px;font-weight:560;font-size:14px}
.brand .bolt{color:var(--accent);font-size:16px}
.brand .crumb{color:var(--tertiary);font-weight:450}
.navlinks{display:flex;gap:4px;align-items:center}
.navlink{font-size:13px;color:var(--subtle);padding:6px 11px;border-radius:8px}
.navlink:hover{color:var(--ink);background:var(--surface-2)}
h2.title{font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0;display:flex;align-items:center;gap:10px}
.lede{color:var(--subtle);font-size:13px;margin:5px 0 0}
.btn{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 15px;border-radius:var(--r-md);background:var(--white);color:#1c1b19;font-weight:560;font-size:13px;border:0;cursor:pointer;transition:filter .12s ease,transform .04s ease;font-family:inherit}
.btn:hover{filter:brightness(.93)}
.btn:active{transform:translateY(.5px)}
.btn.ghost{background:var(--surface-2);color:var(--muted);border:1px solid var(--border)}
.btn.ghost:hover{background:var(--surface-3);color:var(--ink)}
.btn.danger{background:transparent;color:var(--red);border:1px solid rgba(224,107,107,.3)}
.btn.danger:hover{background:rgba(224,107,107,.1)}
.btn.sm{height:30px;padding:0 11px;font-size:12.5px}
.row-actions{display:flex;gap:8px;align-items:center}
/* prompt box + chips (list page) */
.promptbox{background:var(--field);border:1px solid var(--border);border-radius:var(--r-lg);padding:15px 16px;color:var(--tertiary);font-size:14px;margin:18px 0 12px;min-height:64px}
.chips{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:18px}
.chip{font-size:12.5px;color:var(--muted);background:var(--surface-2);border:1px solid var(--border);border-radius:9px;padding:7px 12px;cursor:pointer;transition:all .1s ease}
.chip:hover{background:var(--surface-3);color:var(--ink)}
.tabbar{display:flex;align-items:center;justify-content:space-between;margin:14px 0 14px;border-bottom:1px solid var(--border);padding-bottom:0}
.tabs{display:flex;gap:2px}
.tab{font-size:13px;color:var(--subtle);padding:8px 12px;border-radius:8px 8px 0 0;cursor:pointer}
.tab.on{color:var(--ink);font-weight:540;box-shadow:inset 0 -2px 0 var(--accent)}
.toggle{display:flex;align-items:center;gap:8px;color:var(--subtle);font-size:12.5px}
/* routine rows */
.card{background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.r-item{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 18px;border-bottom:1px solid var(--border);transition:background .1s ease}
.r-item:last-child{border-bottom:0}
.r-item:hover{background:var(--surface-2)}
.r-name{font-weight:560;font-size:14.5px;display:flex;align-items:center;gap:9px}
.r-meta{color:var(--tertiary);font-size:12px;margin-top:3px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.r-meta b{color:var(--subtle);font-weight:500}
.pill{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:7px;font-size:11px;font-weight:540;border:1px solid var(--border-strong);color:var(--subtle);background:var(--surface-3)}
.pill.live{color:var(--green);border-color:rgba(92,187,110,.3);background:rgba(92,187,110,.08)}
.pill.paused{color:var(--amber);border-color:rgba(224,169,72,.3);background:rgba(224,169,72,.08)}
.pill.fail{color:var(--red);border-color:rgba(224,107,107,.3);background:rgba(224,107,107,.08)}
.dotmark{width:6px;height:6px;border-radius:50%;background:currentColor}
.empty{padding:54px 24px;text-align:center;color:var(--tertiary)}
.empty .big{font-size:15px;color:var(--subtle);margin-bottom:6px}
/* forms */
form.stack{display:flex;flex-direction:column;gap:20px;margin-top:18px}
label.field{display:flex;flex-direction:column;gap:7px}
.lab{font-size:13px;font-weight:540;color:var(--ink)}
.lab .req{color:var(--accent)}
.hint{font-size:11.5px;color:var(--tertiary);font-weight:450}
input,textarea,select{background:var(--field);border:1px solid var(--border);border-radius:var(--r-md);color:var(--ink);font-family:inherit;font-size:14px;padding:11px 13px;width:100%;transition:border-color .12s ease,box-shadow .12s ease}
input::placeholder,textarea::placeholder{color:var(--tertiary)}
input:focus,textarea:focus,select:focus{outline:0;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%23928d84' stroke-width='1.3' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
/* the instructions box with a docked picker bar, like Claude */
.instr-wrap{background:var(--field);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;transition:border-color .12s ease,box-shadow .12s ease}
.instr-wrap:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.instr-wrap textarea{background:transparent;border:0;border-radius:0;min-height:150px;resize:vertical}
.instr-wrap textarea:focus{box-shadow:none}
.dock{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border-top:1px solid var(--border);background:rgba(0,0,0,.12);flex-wrap:wrap}
.dock-l,.dock-r{display:flex;align-items:center;gap:8px}
.dock select{background:transparent;border:1px solid transparent;font-size:12.5px;color:var(--muted);padding:6px 28px 6px 10px;width:auto;border-radius:8px}
.dock select:hover{background:var(--surface-3)}
.dock select:focus{box-shadow:none;border-color:var(--border)}
.dock .dockicon{color:var(--tertiary);font-size:12.5px;display:inline-flex;align-items:center;gap:6px}
/* trigger rows */
.triglist{display:flex;flex-direction:column;gap:10px}
.trig{display:flex;align-items:center;gap:14px;padding:15px 16px;border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface-1);cursor:pointer;transition:all .1s ease}
.trig:hover{background:var(--surface-2);border-color:var(--border-strong)}
.trig.on{border-color:var(--accent);background:var(--accent-soft)}
.trig .tg-ic{font-size:18px;width:24px;text-align:center;color:var(--subtle)}
.trig .tg-t{font-weight:560;font-size:14px}
.trig .tg-s{font-size:12px;color:var(--subtle);margin-top:2px}
.trig input{display:none}
.trig-config{margin-top:12px}
/* config tabs (Connectors/Behavior/Permissions) */
.subtabs{display:flex;gap:4px;margin-bottom:14px}
.subtab{font-size:12.5px;color:var(--subtle);padding:7px 12px;border-radius:9px;cursor:pointer;border:1px solid transparent}
.subtab.on{background:var(--surface-2);color:var(--ink);border-color:var(--border);font-weight:540}
.subtab .badge{display:inline-block;min-width:16px;text-align:center;background:var(--surface-3);border-radius:6px;font-size:10.5px;padding:0 4px;margin-left:5px;color:var(--muted)}
.tpl-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
.tpl{border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface-1);padding:13px 14px;cursor:pointer;transition:all .1s ease}
.tpl:hover{background:var(--surface-2);border-color:var(--border-strong)}
.tpl.on{border-color:var(--accent);background:var(--accent-soft)}
.tpl-name{font-weight:560;font-size:13.5px}
.tpl-desc{font-size:12px;color:var(--subtle);margin-top:4px;line-height:1.45}
.tpl-repo{font-family:var(--mono);font-size:11px;color:var(--tertiary);margin-top:7px}
@media(max-width:640px){.tpl-grid{grid-template-columns:1fr}}
.conn-chips{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:14px}
.connchip{display:inline-flex;align-items:center;gap:7px;font-size:13px;background:var(--surface-2);border:1px solid var(--border);border-radius:9px;padding:8px 12px;cursor:pointer;transition:all .1s}
.connchip:hover{background:var(--surface-3)}
.connchip.on{border-color:var(--accent);background:var(--accent-soft);color:var(--ink)}
.connchip input{display:none}
details.tut{background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-md);padding:0;margin-bottom:8px;overflow:hidden}
details.tut>summary{padding:11px 14px;cursor:pointer;font-size:13px;color:var(--muted);list-style:none;display:flex;align-items:center;gap:8px}
details.tut>summary::-webkit-details-marker{display:none}
details.tut[open]>summary{border-bottom:1px solid var(--border);color:var(--ink)}
details.tut ol{margin:10px 16px 14px;padding-left:18px;color:var(--subtle);font-size:12.5px;line-height:1.7}
.warn{background:var(--warn-bg);border:1px solid var(--warn-border);border-radius:var(--r-md);padding:12px 14px;color:var(--warn-ink);font-size:12.5px;line-height:1.5;display:flex;gap:9px}
.contract-note{font-size:11.5px;color:var(--tertiary);background:var(--surface-1);border:1px solid var(--border);border-left:2px solid var(--accent);border-radius:var(--r-sm);padding:10px 13px;line-height:1.55}
fieldset{border:1px solid var(--border);border-radius:var(--r-lg);padding:18px;margin:0}
legend{font-size:12px;color:var(--subtle);font-weight:560;padding:0 8px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.back{color:var(--subtle);font-size:12.5px;margin-bottom:16px;display:inline-flex;gap:6px;align-items:center}
.back:hover{color:var(--ink)}
.formfoot{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}
/* detail */
.sectlabel{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--tertiary);font-weight:600;margin:26px 0 10px}
.log{background:#141311;border:1px solid var(--border);border-radius:var(--r-md);padding:14px 16px;font-family:var(--mono);font-size:12px;line-height:1.65;color:var(--muted);white-space:pre-wrap;word-break:break-word;max-height:520px;overflow:auto}
.runrow{display:flex;align-items:center;justify-content:space-between;padding:11px 15px;border-bottom:1px solid var(--border);font-size:12.5px}
.runrow:last-child{border-bottom:0}
.runrow .ts{font-family:var(--mono);color:var(--tertiary);font-size:11px}
.rc-ok{color:var(--green)} .rc-bad{color:var(--red)}
.flex-between{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.kv{display:flex;gap:24px;flex-wrap:wrap;font-size:12.5px;color:var(--subtle)} .kv b{color:var(--ink);font-weight:540}
.muted{color:var(--subtle)} .tert{color:var(--tertiary)}
.cred{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid var(--border)}
.cred:last-child{border-bottom:0}
.mono-sm{font-family:var(--mono);font-size:12px;color:var(--muted);word-break:break-all}
/* calendar (month grid) */
.cal-head{display:flex;align-items:center;justify-content:space-between;margin:6px 0 12px;flex-wrap:wrap;gap:10px}
.cal-month{font-size:15px;font-weight:600;color:var(--muted)}
.cal{background:var(--surface-1);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.cal-wd{display:grid;grid-template-columns:repeat(7,1fr);background:var(--surface-2);border-bottom:1px solid var(--border)}
.cal-wd div{padding:9px 11px;font-size:10px;font-weight:600;letter-spacing:.1em;color:var(--subtle)}
.cal-wd .cal-wend{color:var(--tertiary)}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:minmax(116px,1fr)}
.cal-cell{border-right:1px solid var(--border);border-bottom:1px solid var(--border);padding:6px 6px 8px;display:flex;flex-direction:column;gap:4px;min-height:0;overflow:hidden}
.cal-cell:nth-child(7n){border-right:0}
.cal-grid>.cal-cell:nth-last-child(-n+7){border-bottom:0}
.cal-out{background:rgba(0,0,0,.16)} .cal-out .cal-n{color:var(--tertiary)}
.cal-past{opacity:.4}
.cal-today{background:linear-gradient(180deg,var(--accent-soft),transparent 65%);box-shadow:inset 0 0 0 1.5px rgba(201,100,66,.5)}
.cal-dn{display:flex;align-items:center;justify-content:space-between;min-height:21px}
.cal-n{font-size:12px;font-weight:600;color:var(--muted);width:21px;height:21px;display:flex;align-items:center;justify-content:center;border-radius:50%}
.cal-today .cal-n{background:var(--accent);color:#fff}
.cal-now{font-size:8.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
.cal-runtag{font-size:9px;color:var(--tertiary);font-family:var(--mono)}
.cal-ev{display:flex;flex-direction:column;gap:3px;min-height:0}
.cal-chip{display:flex;align-items:center;gap:5px;text-decoration:none;background:var(--surface-2);border:1px solid var(--border);border-left:2px solid var(--subtle);border-radius:5px;padding:2px 6px;font-size:10.5px;color:var(--ink);overflow:hidden}
.cal-chip:hover{background:var(--surface-3);border-color:var(--border-strong)}
.cal-t{font-family:var(--mono);font-size:9px;color:var(--subtle);flex:0 0 auto}
.cal-x{font-family:var(--mono);font-size:9px;font-weight:700;color:var(--canvas);background:var(--muted);border-radius:4px;padding:0 4px;flex:0 0 auto}
.cal-nm{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cal-more{font-size:10px;color:var(--subtle);padding:1px 6px}
.cal-chip.p-claude{border-left-color:var(--accent)} .cal-chip.p-codex{border-left-color:var(--green)} .cal-chip.p-grok{border-left-color:var(--amber)} .cal-chip.p-gemini{border-left-color:#6ea8e0} .cal-chip.p-deepseek{border-left-color:#9b7fe0} .cal-chip.p-api{border-left-color:var(--subtle)}
@media(max-width:640px){.grid2,.grid3{grid-template-columns:1fr} .cal-grid{grid-auto-rows:minmax(76px,1fr)} .cal-nm{display:none}}
`;

function layout(title, inner, crumb) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<title>${esc(title)} · Dream Labs</title><style>${CSS}</style></head>
<body><div class="wrap">
<header class="top">
  <a class="brand" href="/"><span class="bolt">⚡</span>Routines${crumb ? ` <span class="crumb">/ ${esc(crumb)}</span>` : ''}</a>
  <nav class="navlinks">
    <a class="navlink" href="/access">Access &amp; keys</a>
    <a class="navlink" href="/new">+ New routine</a>
  </nav>
</header>
${inner}
</div></body></html>`;
}

function triggerLabel(t) {
  if (!t) return 'No trigger';
  if (t.type === 'schedule') return `Schedule · <b>${esc(t.cron || '')}</b>`;
  if (t.type === 'api') return 'Via API';
  if (t.type === 'webhook') return 'GitHub event';
  return esc(t.type);
}
function relTime(iso) {
  if (!iso) return 'never';
  const norm = iso.replace(/(\d{8})T(\d{2})(\d{2})(\d{2})Z/, '$1T$2:$3:$4Z');
  const d = (Date.now() - new Date(norm).getTime()) / 1000;
  if (isNaN(d)) return esc(iso);
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  return Math.floor(d / 86400) + 'd ago';
}

// ---- minimal cron evaluation for the Calendar tab (standard 5-field crons) ----
function cronFieldMatch(expr, val, min, max) {
  if (expr === '*' || expr === '?') return true;
  return expr.split(',').some(part => {
    let step = 1, range = part;
    if (part.includes('/')) { const [r, s] = part.split('/'); range = r; step = parseInt(s, 10) || 1; }
    let lo, hi;
    if (range === '*') { lo = min; hi = max; }
    else if (range.includes('-')) { const [a, b] = range.split('-'); lo = parseInt(a, 10); hi = parseInt(b, 10); }
    else { lo = hi = parseInt(range, 10); }
    if (isNaN(lo) || isNaN(hi)) return false;
    if (val < lo || val > hi) return false;
    return ((val - lo) % step) === 0;
  });
}
function cronMatches(cron, d) {
  const f = (cron || '').trim().split(/\s+/); if (f.length < 5) return false;
  const [mi, ho, dom, mo, dow] = f;
  const domStar = dom === '*' || dom === '?', dowStar = dow === '*' || dow === '?';
  const domM = cronFieldMatch(dom, d.getDate(), 1, 31), dowM = cronFieldMatch(dow, d.getDay(), 0, 6);
  const dayOk = (!domStar && !dowStar) ? (domM || dowM) : (domM && dowM);
  return cronFieldMatch(mi, d.getMinutes(), 0, 59) && cronFieldMatch(ho, d.getHours(), 0, 23)
    && cronFieldMatch(mo, d.getMonth() + 1, 1, 12) && dayOk;
}
// Month grid (Google-Calendar style). High-frequency routines collapse to "x N".
function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first); start.setDate(1 - first.getDay()); // back to the Sunday
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}
function dayRuns(routines, day) {
  const out = [];
  for (const r of routines) {
    if (r.paused || r.trigger?.type !== 'schedule' || !r.trigger.cron) continue;
    let count = 0, first = null;
    for (let m = 0; m < 1440; m++) { const d = new Date(day); d.setHours(0, m, 0, 0); if (cronMatches(r.trigger.cron, d)) { count++; if (!first) first = new Date(d); if (count >= 200) break; } }
    if (count) out.push({ id: r.id, name: r.name, provider: r.provider, count, first });
  }
  return out;
}
const PROV_DOT = { claude: 'p-claude', codex: 'p-codex', grok: 'p-grok', gemini: 'p-gemini', deepseek: 'p-deepseek', api: 'p-api' };
function calendarBody(mo = 0) {
  const { routines } = readRoutines();
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + mo, 1);
  const M = base.getMonth();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthName = base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const fmt = d => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const wd = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((w, i) => `<div class="${i === 0 || i === 6 ? 'cal-wend' : ''}">${w}</div>`).join('');
  const grid = monthGrid(base.getFullYear(), M).map(d => {
    const inMonth = d.getMonth() === M, isToday = d.getTime() === today.getTime(), isPast = d < today;
    let chips = '', tag = '';
    if (!isPast) {
      const runs = dayRuns(routines, d);
      if (runs.length) {
        const total = runs.reduce((a, r) => a + r.count, 0);
        tag = `<span class="cal-runtag">${total} run${total > 1 ? 's' : ''}</span>`;
        chips = runs.slice(0, 3).map(r => {
          const badge = r.count > 1 ? `<span class="cal-x">x${r.count}</span>` : `<span class="cal-t">${esc(fmt(r.first))}</span>`;
          return `<a class="cal-chip ${PROV_DOT[r.provider] || 'p-api'}" href="/routine/${esc(r.id)}">${badge}<span class="cal-nm">${esc(r.name)}</span></a>`;
        }).join('');
        if (runs.length > 3) chips += `<span class="cal-more">+${runs.length - 3} more</span>`;
      }
    }
    return `<div class="cal-cell${inMonth ? '' : ' cal-out'}${isToday ? ' cal-today' : ''}${isPast ? ' cal-past' : ''}">
      <div class="cal-dn"><span class="cal-n">${d.getDate()}</span>${isToday ? '<span class="cal-now">today</span>' : tag}</div>
      <div class="cal-ev">${chips}</div></div>`;
  }).join('');
  return `<div class="cal-head"><div class="cal-month">${esc(monthName)}</div>
      <div class="row-actions"><a class="btn ghost sm" href="/?view=calendar&mo=${mo - 1}">‹</a><a class="btn ghost sm" href="/?view=calendar">Today</a><a class="btn ghost sm" href="/?view=calendar&mo=${mo + 1}">›</a></div></div>
    <div class="cal"><div class="cal-wd">${wd}</div><div class="cal-grid">${grid}</div></div>
    <p class="hint" style="margin-top:10px">High-frequency routines collapse to <b>x N</b> per day. Each chip links to its routine.</p>`;
}

function pageList(view, mo) {
  const isCal = view === 'calendar';
  const { routines } = readRoutines();
  const rows = routines.map(r => {
    const lr = lastRun(r.id);
    const statusPill = r.paused
      ? `<span class="pill paused"><span class="dotmark"></span>paused</span>`
      : `<span class="pill live"><span class="dotmark"></span>active</span>`;
    const lastPill = lr
      ? (lr.rc === 0 ? `<span class="muted">ran ${relTime(lr.ts)}</span>` : `<span class="pill fail"><span class="dotmark"></span>last run failed</span>`)
      : `<span class="tert">never run</span>`;
    return `<div class="r-item">
      <a class="r-main" href="/routine/${esc(r.id)}" style="min-width:0">
        <div class="r-name">${esc(r.name)} ${statusPill}</div>
        <div class="r-meta"><span>${triggerLabel(r.trigger)}</span><span>·</span><span>${esc(PROVIDER_LABEL[r.provider] || r.provider)}</span><span>·</span>${lastPill}</div>
      </a>
      <div class="row-actions">
        <form method="post" action="/routine/${esc(r.id)}/run" onsubmit="this.querySelector('button').textContent='Running…'"><button class="btn ghost sm">Run now</button></form>
        <a class="btn ghost sm" href="/routine/${esc(r.id)}">Open</a>
      </div>
    </div>`;
  }).join('');

  const chips = ['Summarize my open PRs every weekday morning', 'Triage new issues and flag duplicates each morning', 'Draft release notes whenever a PR merges']
    .map(c => `<a class="chip" href="/new?prefill=${encodeURIComponent(c)}">${esc(c)}</a>`).join('');

  const body = `
  <div class="flex-between">
    <div><h2 class="title">Routines</h2><p class="lede">Templated agents that run on a schedule, by API, or on a GitHub event - on your box, your keys, any model.</p></div>
    <a class="btn" href="/new">+ New routine</a>
  </div>
  <form method="get" action="/new"><input class="promptbox" name="prefill" placeholder="What do you want automated?" autocomplete="off"></form>
  <div class="chips">${chips}</div>
  <div class="tabbar"><div class="tabs">
    <a class="tab ${isCal ? '' : 'on'}" href="/">All</a>
    <a class="tab ${isCal ? 'on' : ''}" href="/?view=calendar">Calendar</a>
  </div></div>
  ${isCal ? calendarBody(mo || 0) : `<div class="card">${rows || `<div class="empty"><div class="big">No routines yet</div><div>Create one and it runs on your own server, on your schedule.</div><div style="margin-top:16px"><a class="btn" href="/new">+ New routine</a></div></div>`}</div>`}`;
  return layout('Routines', body);
}

function connectorsTab(enabled) {
  const chips = CONNECTORS.map(c =>
    `<label class="connchip ${enabled.includes(c.id) ? 'on' : ''}"><input type="checkbox" name="connectors" value="${c.id}" ${enabled.includes(c.id) ? 'checked' : ''} onchange="this.closest('.connchip').classList.toggle('on',this.checked)">${c.icon} ${esc(c.name)}</label>`
  ).join('');
  const tuts = CONNECTORS.map(c =>
    `<details class="tut"><summary>${c.icon} How to connect ${esc(c.name)}</summary><ol>${c.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></details>`
  ).join('');
  return `<div class="conn-chips">${chips}</div>
    <div class="warn">⚠️ <div>Connected tools can be used by the agent during runs - including writes - without asking. Only enable what this routine needs. Setup happens on your box; the step-by-step is below.</div></div>
    <div style="margin-top:14px"><div class="hint" style="margin-bottom:8px">Setup guides (baked in)</div>${tuts}</div>`;
}

function formPage(r, prefill) {
  const isEdit = !!r;
  r = r || { provider: 'claude', model: '', trigger: { type: 'schedule', cron: '0 9 * * *' }, contract: {}, connectors: [], repo: '', permissions: '', behavior: '' };
  r.connectors = r.connectors || [];
  const c = r.contract || {};
  const t = r.trigger || { type: 'schedule' };
  const sel = (a, b) => a === b ? 'checked' : '';
  const opt = (v, cur, label) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(label ?? (v || 'default model'))}</option>`;
  const action = isEdit ? `/routine/${esc(r.id)}` : '/routine';
  const modelOpts = MODELS[r.provider] || MODELS.claude;
  const instr = isEdit ? r.instructions : (prefill || '');

  const body = `
  <a class="back" href="${isEdit ? '/routine/' + esc(r.id) : '/'}">← ${isEdit ? 'Back to routine' : 'All routines'}</a>
  <form class="stack" method="post" action="${action}">
    <label class="field"><span class="lab">Name <span class="req">*</span></span>
      <input name="name" required maxlength="60" value="${esc(r.name || '')}" placeholder="e.g., Daily code review" autofocus></label>

    ${isEdit ? '' : `<div class="field"><span class="lab">Start from a Dream Labs template <span class="hint">or use your own repo below</span></span>
      <div class="tpl-grid">
        ${TEMPLATES.map(t => `<div class="tpl" onclick='useTemplate(${JSON.stringify(t).replace(/'/g, "&#39;")})'>
          <div class="tpl-name">${esc(t.name)}</div>
          <div class="tpl-desc">${esc(t.desc)}</div>
          <div class="tpl-repo">${esc(t.repo)}</div></div>`).join('')}
      </div></div>`}

    <label class="field"><span class="lab">Instructions</span>
      <div class="instr-wrap">
        <textarea name="instructions" placeholder="Describe what the agent should do in each session">${esc(instr || '')}</textarea>
        <div class="dock">
          <div class="dock-l">
            <span class="dockicon">⎇ <input name="repo" id="repo" list="repolist" value="${esc(r.repo || '')}" placeholder="Select a repository" autocomplete="off" style="background:transparent;border:0;padding:4px 6px;width:230px;font-size:12.5px"><datalist id="repolist"></datalist></span>
          </div>
          <div class="dock-r">
            <select name="model" title="Model">${modelOpts.map(m => opt(m, r.model, m || 'Default model')).join('')}</select>
            <select name="provider" title="Environment / provider" onchange="syncModels(this.value)">${configuredProviders(r.provider).map(p => opt(p, r.provider, '☁ ' + PROVIDER_LABEL[p])).join('')}</select>
          </div>
        </div>
      </div>
      <span class="hint">The prompt the agent receives every run. Treat it like a SOUL: goal, constraints, and what “done” looks like.</span></label>

    <div>
      <div class="lab" style="margin-bottom:10px">Select a trigger</div>
      <div class="triglist">
        <label class="trig ${sel('schedule', t.type) ? 'on' : ''}" data-trig="schedule">
          <input type="radio" name="triggerType" value="schedule" ${sel('schedule', t.type)} onchange="pickTrig('schedule')">
          <span class="tg-ic">🕐</span><div><div class="tg-t">Schedule</div><div class="tg-s">Run on a recurring cron schedule or once at a future time</div></div></label>
        <label class="trig ${sel('webhook', t.type) ? 'on' : ''}" data-trig="webhook">
          <input type="radio" name="triggerType" value="webhook" ${sel('webhook', t.type)} onchange="pickTrig('webhook')">
          <span class="tg-ic">⑃</span><div><div class="tg-t">GitHub event</div><div class="tg-s">Run when a GitHub webhook event fires</div></div></label>
        <label class="trig ${sel('api', t.type) ? 'on' : ''}" data-trig="api">
          <input type="radio" name="triggerType" value="api" ${sel('api', t.type)} onchange="pickTrig('api')">
          <span class="tg-ic">&lt;/&gt;</span><div><div class="tg-t">API</div><div class="tg-s">Trigger from your own code by sending a POST request</div></div></label>
      </div>
      <div class="trig-config" id="tc-schedule" style="display:none">
        <label class="field" style="margin-top:12px"><span class="lab">Cron expression</span>
          <span class="hint">Any interval - sub-hourly is the whole point of self-hosting. <code>*/15 * * * *</code> = every 15 min.</span>
          <input name="cron" value="${esc(t.cron || '0 9 * * *')}" placeholder="0 9 * * *"></label>
      </div>
      <div class="trig-config" id="tc-api" style="display:none"><p class="contract-note" style="margin-top:12px">Trigger with <code>POST ${esc(PUBLIC_URL || '<dashboard-url>')}/api/trigger/&lt;id&gt;</code> and header <code>Authorization: Bearer &lt;token&gt;</code> (your access key).</p></div>
      <div class="trig-config" id="tc-webhook" style="display:none"><p class="contract-note" style="margin-top:12px">Point a GitHub webhook at <code>POST ${esc(PUBLIC_URL || '<dashboard-url>')}/webhook/&lt;id&gt;</code>. Set <code>WEBHOOK_SECRET</code> in secrets.env to verify signatures.</p></div>
    </div>

    <div>
      <div class="subtabs">
        <span class="subtab on" data-st="connectors" onclick="pickSub('connectors')">Connectors <span class="badge">${r.connectors.length}</span></span>
        <span class="subtab" data-st="behavior" onclick="pickSub('behavior')">Behavior</span>
        <span class="subtab" data-st="permissions" onclick="pickSub('permissions')">Permissions</span>
      </div>
      <div class="sub" id="sub-connectors">${connectorsTab(r.connectors)}</div>
      <div class="sub" id="sub-behavior" style="display:none">
        <label class="field"><span class="lab">Extra behavior notes</span><span class="hint">Optional. Tone, output format, escalation preferences - prepended to the agent each run.</span>
          <textarea name="behavior" placeholder="e.g., Always post the digest to Telegram. Keep summaries under 5 bullets.">${esc(r.behavior || '')}</textarea></label>
      </div>
      <div class="sub" id="sub-permissions" style="display:none">
        <label class="field"><span class="lab">Allowed actions</span><span class="hint">Optional allowlist of shell commands / tools the agent may use without prompting. Blank = provider default. The agent always runs jailed, so it can never read your secrets file regardless.</span>
          <textarea name="permissions" placeholder="e.g., bun run *, git, gh pr *">${esc(r.permissions || '')}</textarea></label>
      </div>
    </div>

    <fieldset>
      <legend>Contract</legend>
      <div class="grid3">
        <label class="field"><span class="lab">Timeout (min)</span><input name="timeoutMinutes" type="number" min="1" max="180" value="${esc(c.timeoutMinutes ?? 20)}"></label>
        <label class="field"><span class="lab">Max fails → pause</span><input name="maxConsecutiveFailures" type="number" min="1" max="20" value="${esc(c.maxConsecutiveFailures ?? 2)}"></label>
        <label class="field"><span class="lab">Max runs / day</span><input name="maxRunsPerDay" type="number" min="1" max="2000" value="${esc(c.maxRunsPerDay ?? 96)}"></label>
      </div>
      <p class="contract-note" style="margin-top:12px">The agent is stopped at the timeout, auto-paused after the failure limit (you get an alert), and skips once it hits the daily cap. Loop-contract discipline - no background chaos.</p>
    </fieldset>

    <div class="formfoot">
      <a class="btn ghost" href="${isEdit ? '/routine/' + esc(r.id) : '/'}">Cancel</a>
      <button class="btn" type="submit">${isEdit ? 'Save changes' : 'Create'}</button>
    </div>
  </form>
  <script>
    var MODELS=${JSON.stringify(MODELS)};
    function pickTrig(v){document.querySelectorAll('.trig').forEach(function(e){e.classList.toggle('on',e.dataset.trig===v)});
      ['schedule','api','webhook'].forEach(function(k){document.getElementById('tc-'+k).style.display=(k===v?'block':'none')});}
    function pickSub(v){document.querySelectorAll('.subtab').forEach(function(e){e.classList.toggle('on',e.dataset.st===v)});
      ['connectors','behavior','permissions'].forEach(function(k){document.getElementById('sub-'+k).style.display=(k===v?'block':'none')});}
    function syncModels(p){var s=document.querySelector('select[name=model]');var ms=MODELS[p]||MODELS.claude;
      s.innerHTML=ms.map(function(m){return '<option value="'+m+'">'+(m||'Default model')+'</option>'}).join('');}
    pickTrig('${esc(t.type)}');pickSub('connectors');
    // Apply a Dream Labs template: fill the repo + a starting prompt + name hint.
    function useTemplate(t){
      var repo=document.getElementById('repo'); if(repo) repo.value=t.repo;
      var ins=document.querySelector('textarea[name=instructions]'); if(ins && !ins.value.trim()) ins.value=t.instructions||'';
      var nm=document.querySelector('input[name=name]'); if(nm && !nm.value.trim()) nm.value=t.name;
      document.querySelectorAll('.tpl').forEach(function(e){e.classList.remove('on')});
      if(window.event&&window.event.currentTarget) window.event.currentTarget.classList.add('on');
      if(repo) repo.scrollIntoView({block:'center'});
    }
    // Populate the repo picker from the connected GitHub account.
    fetch('/api/github/repos').then(function(r){return r.json()}).then(function(d){
      var inp=document.getElementById('repo'), dl=document.getElementById('repolist');
      if(!d.connected){ inp.placeholder='Connect GitHub to pick a repo'; return; }
      dl.innerHTML=(d.repos||[]).map(function(x){return '<option value="'+x.full_name+'">'+(x.private?'private':'public')+'</option>'}).join('');
      inp.placeholder=(d.repos&&d.repos.length)?'Select a repository ('+d.repos.length+')':'No repos found';
    }).catch(function(){});
  </script>`;
  return layout(isEdit ? 'Edit routine' : 'New routine', body, isEdit ? 'Edit routine' : 'New routine');
}

function detailPage(r) {
  const runs = readRuns(r.id, 25);
  const logs = listLogs(r.id);
  const lr = lastRun(r.id);
  const statusPill = r.paused
    ? `<span class="pill paused"><span class="dotmark"></span>paused</span>`
    : `<span class="pill live"><span class="dotmark"></span>active</span>`;
  const c = r.contract || {};
  const runRows = runs.filter(x => ['run', 'autopause', 'skip'].includes(x.event)).map(x => {
    if (x.event === 'autopause') return `<div class="runrow"><span class="rc-bad">⏸ auto-paused after ${esc(x.afterFailures)} failures</span><span class="ts">${esc(x.ts)}</span></div>`;
    if (x.event === 'skip') return `<div class="runrow"><span class="tert">skipped (${esc(x.reason)})</span><span class="ts">${esc(x.ts)}</span></div>`;
    const ok = x.rc === 0;
    return `<div class="runrow"><span>${ok ? '<span class="rc-ok">✓ success</span>' : '<span class="rc-bad">✗ failed (rc ' + esc(x.rc) + ')</span>'} <span class="tert">· ${esc(x.trigger)} · ${esc(x.durationSec)}s</span></span><span class="ts">${esc(x.ts)}</span></div>`;
  }).join('');
  const latestLog = logs[0] ? readLog(r.id, logs[0]) : null;
  const conns = (r.connectors || []).map(id => { const c = CONNECTORS.find(x => x.id === id); return c ? c.icon + ' ' + c.name : id; }).join(' · ') || 'none';

  const body = `
  <a class="back" href="/">← All routines</a>
  <div class="flex-between">
    <div><h2 class="title">${esc(r.name)} ${statusPill}</h2>
      <div class="r-meta" style="font-size:12.5px;margin-top:7px"><span>${triggerLabel(r.trigger)}</span><span>·</span><span>${esc(PROVIDER_LABEL[r.provider] || r.provider)}${r.model ? ' (' + esc(r.model) + ')' : ''}</span><span>·</span><span>last run ${relTime(lr?.ts)}</span></div>
    </div>
    <div class="row-actions">
      <form method="post" action="/routine/${esc(r.id)}/run" onsubmit="this.querySelector('button').textContent='Running…'"><button class="btn">Run now</button></form>
      <a class="btn ghost" href="/edit/${esc(r.id)}">Edit</a>
    </div>
  </div>
  <div class="row-actions" style="margin-top:14px">
    ${r.paused
      ? `<form method="post" action="/routine/${esc(r.id)}/resume"><button class="btn ghost">▶ Resume</button></form>`
      : `<form method="post" action="/routine/${esc(r.id)}/pause"><button class="btn ghost">⏸ Pause</button></form>`}
    <form method="post" action="/routine/${esc(r.id)}/delete" onsubmit="return confirm('Delete this routine? Run history is kept.')"><button class="btn danger">Delete</button></form>
  </div>

  <div class="sectlabel">Contract</div>
  <div class="card" style="padding:15px 18px"><div class="kv">
    <span>Timeout <b>${esc(c.timeoutMinutes ?? 20)} min</b></span>
    <span>Auto-pause after <b>${esc(c.maxConsecutiveFailures ?? 2)} fails</b></span>
    <span>Daily cap <b>${esc(c.maxRunsPerDay ?? 96)} runs</b></span>
    <span>Connectors <b>${esc(conns)}</b></span>
  </div></div>

  <div class="sectlabel">Instructions</div>
  <div class="card"><div class="log" style="background:var(--surface-1);color:var(--muted);max-height:240px">${esc(r.instructions || '(none)')}</div></div>

  <div class="sectlabel">Recent runs</div>
  <div class="card">${runRows || '<div class="empty"><div>No runs yet.</div></div>'}</div>

  ${latestLog ? `<div class="sectlabel">Latest log <span class="tert" style="text-transform:none;letter-spacing:0">· ${esc(logs[0])}</span></div><div class="log">${esc(latestLog)}</div>` : ''}`;
  return layout(r.name, body, esc(r.name));
}

// Connect GitHub: paste a fine-grained PAT. Powers the repo picker + private clones.
function githubPage(opts) {
  const gs = githubStatus();
  const err = opts && opts.error;
  const newTokenUrl = 'https://github.com/settings/personal-access-tokens/new';
  const connected = gs.connected
    ? `<div class="card" style="padding:16px 18px"><div class="cred" style="border:0;padding:0">
         <span>Connected as <b>@${esc(gs.login)}</b></span>
         <form method="post" action="/github/disconnect"><button class="btn ghost sm">Disconnect</button></form></div></div>`
    : '';
  const form = `
    <div class="card" style="padding:18px">
      <form class="stack" method="post" action="/github/connect" style="margin-top:0;gap:14px">
        <label class="field"><span class="lab">Fine-grained access token</span>
          <span class="hint">Create one at <a href="${newTokenUrl}" target="_blank">github.com/settings/personal-access-tokens</a>. Repository access: the repos your agents will use. Permissions: <b>Contents: Read</b> (and <b>Read-only</b> Metadata, added automatically). Add <b>Webhooks: Read &amp; write</b> only if you want GitHub-event triggers.</span>
          <input name="token" type="password" placeholder="github_pat_..." autocomplete="off" required></label>
        ${err ? `<div class="warn">⚠️ <div>${esc(err)}</div></div>` : ''}
        <div class="row-actions"><button class="btn" type="submit">Connect GitHub</button></div>
      </form>
    </div>`;
  const tut = `
    <div class="sectlabel">How it works</div>
    <div class="card" style="padding:16px 18px"><ol style="margin:0 0 0 18px;color:var(--subtle);font-size:13px;line-height:1.8">
      <li>Connect once here. The token is stored in a 600 file the runner reads to clone your repos.</li>
      <li>When you create an agent, pick a repo from your GitHub list (the "Select a repository" field).</li>
      <li>Each run clones/pulls that repo into the agent's own workspace before the agent starts.</li>
      <li>Private repos work automatically once connected. The token is never shown again or committed.</li>
    </ol></div>`;
  const body = `
    <a class="back" href="/access">< Access &amp; keys</a>
    <h2 class="title">Connect GitHub</h2>
    <p class="lede">Let your agents pull code from your repositories, and pick repos from a list when you create an agent.</p>
    ${connected || form}
    ${tut}`;
  return layout('Connect GitHub', body, 'Connect GitHub');
}

// Providers: connect more, swap the default, all by click. (Bash connects the first.)
function providersPage() {
  const ps = providerStatus();
  const rows = PROVIDERS.map(p => {
    const on = !!ps[p];
    const isDefault = ps.default === p;
    return `<div class="cred">
      <span>${esc(PROVIDER_LABEL[p])} ${isDefault ? '<span class="pill live" style="margin-left:6px">default</span>' : ''}</span>
      <span class="row-actions">${on
        ? `${isDefault ? '' : `<form method="post" action="/provider/default/${p}"><button class="btn ghost sm">Make default</button></form>`}
           <a class="btn ghost sm" href="/provider/${p}">Manage</a>`
        : `<a class="btn sm" href="/provider/${p}">Connect</a>`}</span></div>`;
  }).join('');
  const body = `
    <a class="back" href="/access">< Access &amp; keys</a>
    <h2 class="title">AI providers</h2>
    <p class="lede">Connect as many as you like and switch the default. Each agent can use any connected provider. Your first one was set up during install.</p>
    <div class="card">${rows}</div>`;
  return layout('AI providers', body, 'AI providers');
}

// Connect one provider: OAuth (spawned device flow, you just approve) or paste a key.
function providerConnectPage(prov, opts) {
  const ps = providerStatus();
  const on = !!ps[prov];
  const st = connectStatus(prov);
  const canOauth = !!PROVIDER_LOGIN[prov];
  const canKey = !!PROVIDER_KEY[prov];
  const log = (() => { try { return readFileSync(connectLog(prov), 'utf8'); } catch { return ''; } })();
  const linkMatch = log.match(/https?:\/\/\S+/);
  let main;
  if (st && st.state === 'pending') {
    main = `<div class="card" style="padding:18px">
      <div class="r-name" style="margin-bottom:10px">Waiting for you to approve in your browser…</div>
      ${linkMatch ? `<a class="btn" href="${esc(linkMatch[0])}" target="_blank">Open the approval page</a>` : ''}
      <div class="log" style="margin-top:14px">${esc(log || 'Starting…')}</div>
      <p class="hint" style="margin-top:10px">This page checks every few seconds. Approve with your ${esc(PROVIDER_LABEL[prov])} account and it connects itself.</p>
    </div>`;
  } else if (on) {
    main = `<div class="card" style="padding:16px 18px"><div class="cred" style="border:0;padding:0">
      <span>Connected${ps.default === prov ? ' <span class="pill live">default</span>' : ''}</span>
      <span class="row-actions">
        ${ps.default === prov ? '' : `<form method="post" action="/provider/default/${prov}"><button class="btn ghost sm">Make default</button></form>`}
        <form method="post" action="/provider/disconnect/${prov}"><button class="btn ghost sm">Disconnect</button></form>
      </span></div></div>`;
  } else {
    const failed = st && st.state === 'failed' ? `<div class="warn">⚠️ <div>Last attempt failed${st.error ? ': ' + esc(st.error) : ''}. Make sure the ${esc(PROVIDER_LABEL[prov])} CLI is installed, then retry.</div></div>` : '';
    main = `${failed}<div class="card" style="padding:18px">
      ${canOauth ? `<form method="post" action="/provider/connect/${prov}"><button class="btn">Connect ${esc(PROVIDER_LABEL[prov])} (sign in)</button>
        <span class="hint" style="margin-left:10px">Opens an approval page. No terminal.</span></form>` : ''}
      ${canOauth && canKey ? '<div style="height:14px"></div>' : ''}
      ${canKey ? `<form class="stack" method="post" action="/provider/key/${prov}" style="gap:10px;margin-top:0">
        <label class="field"><span class="lab">…or paste an API key</span>
          <input name="key" type="password" placeholder="${esc(PROVIDER_KEY[prov].key)}" autocomplete="off" required></label>
        ${prov === 'api' ? '<label class="field"><span class="lab">Base URL</span><input name="base" placeholder="https://api.openai.com"></label>' : ''}
        <div class="row-actions"><button class="btn ghost" type="submit">Save key</button></div></form>` : ''}
    </div>`;
  }
  const refresh = (st && st.state === 'pending') ? '<meta http-equiv="refresh" content="3">' : '';
  const body = `${refresh}
    <a class="back" href="/providers">< AI providers</a>
    <h2 class="title">${esc(PROVIDER_LABEL[prov])}</h2>
    <p class="lede">Connect by signing in (we run the flow, you just approve) or paste a key. Connecting adds it; your other providers stay.</p>
    ${main}`;
  return layout('Connect ' + PROVIDER_LABEL[prov], body, esc(PROVIDER_LABEL[prov]));
}

// "See your keys" - STATUS + access link only. Never prints provider secrets.
async function accessPage() {
  const st = providerStatus();
  const remote = await fetchRemoteVersion();
  const us = updateStatus();
  const upToDate = remote && remote === VERSION;
  const updateAvail = remote && remote !== VERSION;
  let softwareBody;
  if (us && us.state === 'running') {
    softwareBody = `<div class="cred"><span>Updating…</span><span class="pill"><span class="dotmark"></span>in progress</span></div>
      <p class="hint" style="margin:12px 16px">${esc(us.message || 'Applying update…')} The dashboard will restart in a moment - refresh shortly.</p>`;
  } else {
    const statusLine = us && us.state === 'error'
      ? `<p class="hint" style="margin:10px 16px;color:var(--red)">Last update failed: ${esc(us.message || '')}</p>`
      : (us && us.state === 'done' ? `<p class="hint" style="margin:10px 16px;color:var(--green)">${esc(us.message || 'Updated.')}</p>` : '');
    softwareBody = `<div class="cred"><span>Installed version</span><span class="mono-sm">v${esc(VERSION)}</span></div>
      <div class="cred"><span>Latest available</span>${
        remote ? `<span class="mono-sm">v${esc(remote)} ${upToDate ? '· <span style="color:var(--green)">up to date</span>' : '· <span style="color:var(--amber)">update available</span>'}</span>`
               : '<span class="tert">could not check</span>'}</div>
      ${statusLine}
      <div style="padding:14px 16px">${updateAvail
        ? `<form method="post" action="/update" onsubmit="this.querySelector('button').textContent='Starting update…'"><button class="btn">Update to v${esc(remote)}</button></form>`
        : `<form method="post" action="/update" onsubmit="this.querySelector('button').textContent='Reinstalling…'"><button class="btn ghost">${upToDate ? 'Reinstall current version' : 'Pull latest &amp; restart'}</button></form>`}</div>`;
  }

  const provRows = PROVIDERS.map(p => {
    const on = !!st[p];
    return `<div class="cred"><span>${esc(PROVIDER_LABEL[p])}</span>${on
      ? '<span class="pill live"><span class="dotmark"></span>connected</span>'
      : '<span class="pill"><span class="dotmark"></span>not configured</span>'}</div>`;
  }).join('');
  const ghs = githubStatus();
  const ghRow = `<div class="cred"><span>GitHub${ghs.connected ? ' <span class="tert">(@' + esc(ghs.login) + ')</span>' : ''}</span>
    ${ghs.connected
      ? '<a class="btn ghost sm" href="/github">Manage</a>'
      : '<a class="btn sm" href="/github">Connect</a>'}</div>`;
  const link = (PUBLIC_URL || `http://${HOST}:${PORT}`) + '/?token=' + TOKEN;
  const body = `
  <a class="back" href="/">← All routines</a>
  <h2 class="title">Access &amp; keys</h2>
  <p class="lede">Everything you need to reach this dashboard and confirm your providers are wired up. Provider keys are never shown here - the web process never loads them into its environment; only the runner reads them.</p>

  <div class="sectlabel">Your dashboard access link</div>
  <div class="card" style="padding:16px 18px">
    <div class="mono-sm" id="lnk">${esc(link)}</div>
    <div class="row-actions" style="margin-top:12px">
      <button class="btn ghost sm" onclick="navigator.clipboard.writeText(document.getElementById('lnk').textContent);this.textContent='Copied'">Copy link</button>
    </div>
    <p class="hint" style="margin-top:10px">This link is your password - anyone with it controls your agents. Bookmark it, keep it private. To rotate: change <code>DASH_TOKEN</code> in <code>/etc/dreamlabs/secrets.env</code> and restart the service.</p>
  </div>

  <div class="sectlabel">AI providers</div>
  <div class="card">${provRows}</div>
  <p class="hint" style="margin-top:10px"><a href="/providers">Connect more providers or swap the default</a> - all by click, no terminal. Your first provider was set up during install.</p>

  <div class="sectlabel">Source control</div>
  <div class="card">${ghRow}</div>
  <p class="hint" style="margin-top:10px">Connect GitHub so agents can pull their repos and you can pick repos from a list when creating an agent.</p>

  <div class="sectlabel">Software</div>
  <div class="card">${softwareBody}</div>
  <p class="hint" style="margin-top:10px">Updates pull the official release and restart the dashboard. The web app can only <i>request</i> an update - a separate root task applies it after validating the download, so a stolen access link can never run arbitrary code here.</p>

  <div class="warn" style="margin-top:18px">⚠️ <div>Security model: this service binds to localhost and is reached over Tailscale or a firewalled proxy. It never loads or serves your provider keys (they're in a separate file only the runner reads), serves no files outside its routes, and runs the agent in a jail that masks the secrets file. These are the rules that keep a self-hosted agent box from leaking its own keys.</div></div>`;
  return layout('Access & keys', body, 'Access & keys');
}

// ---------- mutations ----------

function buildRoutineFromForm(f, existing) {
  const name = (f.name || '').trim().slice(0, 60);
  const triggerType = ['schedule', 'api', 'webhook'].includes(f.triggerType) ? f.triggerType : 'schedule';
  const trigger = { type: triggerType };
  if (triggerType === 'schedule') trigger.cron = (f.cron || '').trim().slice(0, 80);
  const num = (v, d, lo, hi) => { const n = parseInt(v, 10); return isNaN(n) ? d : Math.min(hi, Math.max(lo, n)); };
  let connectors = f.connectors ? (Array.isArray(f.connectors) ? f.connectors : [f.connectors]) : [];
  connectors = connectors.filter(c => CONNECTORS.some(x => x.id === c));
  return {
    id: existing?.id || slugify(name),
    name: name || 'Untitled routine',
    instructions: (f.instructions || '').slice(0, 20000),
    provider: PROVIDERS.includes(f.provider) ? f.provider : 'claude',
    model: (f.model || '').trim().slice(0, 60),
    repo: (f.repo || '').trim().slice(0, 120),
    connectors,
    behavior: (f.behavior || '').slice(0, 4000),
    permissions: (f.permissions || '').slice(0, 2000),
    paused: existing?.paused || false,
    trigger,
    contract: {
      timeoutMinutes: num(f.timeoutMinutes, 20, 1, 180),
      maxConsecutiveFailures: num(f.maxConsecutiveFailures, 2, 1, 20),
      maxRunsPerDay: num(f.maxRunsPerDay, 96, 1, 2000),
    },
    createdAt: existing?.createdAt || nowISO(),
    updatedAt: nowISO(),
  };
}

function fireRunner(id, trigger) {
  if (!validId(id)) return;
  const child = spawn(RUNNER, [id, trigger], { detached: true, stdio: 'ignore' });
  child.unref();
}

// ---------- router ----------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}`);
  const path = url.pathname;
  const method = req.method;

  if (path === '/health' && method === 'GET') return json(res, 200, { ok: true, service: 'dreamlabs-agent-server' });

  // First-visit token handoff: ?token=… sets an httponly cookie, then strips it.
  if (url.searchParams.has('token')) {
    if (safeEqual(url.searchParams.get('token'), TOKEN)) {
      url.searchParams.delete('token');
      return redirect(res, url.pathname + (url.search || ''), {
        'set-cookie': `dl_token=${encodeURIComponent(TOKEN)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`,
      });
    }
    return send(res, 401, layout('Unauthorized', '<div class="empty"><div class="big">Invalid token</div></div>'));
  }

  // API trigger - Bearer token.
  if (path.startsWith('/api/trigger/') && method === 'POST') {
    if (!authed(req)) return json(res, 401, { error: 'unauthorized' });
    const id = path.slice('/api/trigger/'.length);
    if (!getRoutine(id)) return json(res, 404, { error: 'unknown routine' });
    fireRunner(id, 'api');
    return json(res, 202, { ok: true, triggered: id });
  }

  // GitHub webhook - HMAC if WEBHOOK_SECRET set, else Bearer token.
  if (path.startsWith('/webhook/') && method === 'POST') {
    const id = path.slice('/webhook/'.length);
    if (!getRoutine(id)) return json(res, 404, { error: 'unknown routine' });
    const raw = await readBody(req);
    if (WEBHOOK_SECRET) {
      const sig = req.headers['x-hub-signature-256'] || '';
      const expect = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
      if (!safeEqual(sig, expect)) return json(res, 401, { error: 'bad signature' });
    } else if (!authed(req)) {
      return json(res, 401, { error: 'unauthorized' });
    }
    fireRunner(id, 'webhook');
    return json(res, 202, { ok: true, triggered: id });
  }

  // Everything below requires auth.
  if (!authed(req)) {
    return send(res, 401, layout('Unauthorized',
      '<div class="empty"><div class="big">Authentication required</div><div>Open the dashboard with your access link (it contains <code>?token=…</code>).</div></div>'));
  }

  if (method === 'GET') {
    if (path === '/') return send(res, 200, pageList(url.searchParams.get('view'), parseInt(url.searchParams.get('mo') || '0', 10) || 0));
    if (path === '/new') return send(res, 200, formPage(null, url.searchParams.get('prefill') || ''));
    if (path === '/access') return send(res, 200, await accessPage());
    if (path === '/providers') return send(res, 200, providersPage());
    if (path.startsWith('/provider/')) {
      const p = path.slice('/provider/'.length);
      return PROVIDERS.includes(p) ? send(res, 200, providerConnectPage(p)) : send(res, 404, layout('Not found', '<div class="empty">Unknown provider</div>'));
    }
    if (path === '/github') return send(res, 200, githubPage());
    // Repo list for the agent form's picker (reads the stored token).
    if (path === '/api/github/repos') {
      const repos = await gh('/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member');
      if (!repos) return json(res, 200, { connected: false, repos: [] });
      if (repos.error) return json(res, 200, { connected: true, error: repos.error, repos: [] });
      return json(res, 200, { connected: true, repos: repos.map(r => ({ full_name: r.full_name, clone_url: r.clone_url, private: r.private })) });
    }
    if (path.startsWith('/edit/')) {
      const r = getRoutine(path.slice('/edit/'.length));
      return r ? send(res, 200, formPage(r)) : send(res, 404, layout('Not found', '<div class="empty">Routine not found</div>'));
    }
    if (path.startsWith('/routine/')) {
      const r = getRoutine(path.slice('/routine/'.length));
      return r ? send(res, 200, detailPage(r)) : send(res, 404, layout('Not found', '<div class="empty">Routine not found</div>'));
    }
  }

  if (method === 'POST') {
    const f = parseForm(await readBody(req));
    // Request a self-update. The dashboard can only DROP A FLAG - a root systemd
    // path-unit validates and applies it. The web app never runs the update itself.
    if (path === '/update') {
      requestUpdate();
      return redirect(res, '/access');
    }
    // Provider connect (OAuth spawn / key paste / default / disconnect) - all click.
    if (path.startsWith('/provider/')) {
      const m = path.match(/^\/provider\/(connect|key|default|disconnect)\/([a-z]+)$/);
      if (m) {
        const [, act, prov] = m;
        if (!PROVIDERS.includes(prov)) return send(res, 404, layout('Not found', '<div class="empty">Unknown provider</div>'));
        if (act === 'connect') { startProviderConnect(prov); return redirect(res, '/provider/' + prov); }
        if (act === 'key') {
          const key = (f.key || '').trim(); const spec = PROVIDER_KEY[prov];
          if (key && spec) { const extra = (prov === 'api' && f.base) ? { API_BASE_URL: f.base.trim() } : (spec.base ? { API_BASE_URL: spec.base } : null); writeKeyEnv(spec.key, key, extra); setProviderConnected(prov, true); }
          return redirect(res, '/provider/' + prov);
        }
        if (act === 'default') { setProviderConnected(prov, true, true); return redirect(res, '/providers'); }
        if (act === 'disconnect') { setProviderConnected(prov, false); return redirect(res, '/providers'); }
      }
    }
    // Connect GitHub: validate the PAT, then store it (600) + the login (no token).
    if (path === '/github/connect') {
      const token = (f.token || '').trim();
      if (!token) return send(res, 200, githubPage({ error: 'Paste a token first.' }));
      try {
        const r = await fetch('https://api.github.com/user', {
          headers: { authorization: 'Bearer ' + token, 'user-agent': 'dreamlabs-agent-server', accept: 'application/vnd.github+json' },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) return send(res, 200, githubPage({ error: `GitHub rejected that token (HTTP ${r.status}). Check the token and its repository access.` }));
        const user = await r.json();
        writeFileSync(GITHUB_TOKEN_FILE, token, { mode: 0o600 });
        writeFileSync(GITHUB_JSON, JSON.stringify({ connected: true, login: user.login, connectedAt: nowISO() }, null, 2));
        return redirect(res, '/github');
      } catch { return send(res, 200, githubPage({ error: 'Could not reach GitHub. Check this box has network access.' })); }
    }
    if (path === '/github/disconnect') {
      try { if (existsSync(GITHUB_TOKEN_FILE)) writeFileSync(GITHUB_TOKEN_FILE, ''); } catch {}
      try { writeFileSync(GITHUB_JSON, JSON.stringify({ connected: false }, null, 2)); } catch {}
      return redirect(res, '/github');
    }
    if (path === '/routine') {
      const data = readRoutines();
      const r = buildRoutineFromForm(f, null);
      while (data.routines.some(x => x.id === r.id)) r.id = r.id + '-' + Math.floor(Math.random() * 1000);
      data.routines.push(r);
      writeRoutines(data);
      return redirect(res, '/routine/' + r.id);
    }
    const m = path.match(/^\/routine\/([a-z0-9-]+)(\/(run|pause|resume|delete))?$/);
    if (m) {
      const id = m[1], action = m[3];
      const data = readRoutines();
      const idx = data.routines.findIndex(x => x.id === id);
      if (idx < 0) return send(res, 404, layout('Not found', '<div class="empty">Routine not found</div>'));
      if (!action) { data.routines[idx] = buildRoutineFromForm(f, data.routines[idx]); writeRoutines(data); return redirect(res, '/routine/' + id); }
      if (action === 'run') { fireRunner(id, 'manual'); return redirect(res, '/routine/' + id); }
      if (action === 'pause') { data.routines[idx].paused = true; writeRoutines(data); return redirect(res, '/routine/' + id); }
      if (action === 'resume') {
        data.routines[idx].paused = false; writeRoutines(data);
        appendRun({ event: 'resume', id, ts: new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z' });
        return redirect(res, '/routine/' + id);
      }
      if (action === 'delete') { data.routines.splice(idx, 1); writeRoutines(data); return redirect(res, '/'); }
    }
  }

  return send(res, 404, layout('Not found', '<div class="empty"><div class="big">404</div><div>No such page.</div></div>'));
});

mkdirSync(RUNS_DIR, { recursive: true });
server.listen(PORT, HOST, () => {
  console.log(`Dream Labs Agent Server dashboard on http://${HOST}:${PORT}`);
  if (PUBLIC_URL) console.log(`Reachable at: ${PUBLIC_URL}/?token=<DASH_TOKEN>`);
  try { syncCron(readRoutines()); } catch (e) { console.error('initial cron sync:', e.message); }
});
