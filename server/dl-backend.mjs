// Dream Labs personalization bridge (consumer side).
//
// Talks to the Dream Labs backend (app.joindreamlabs.com/api/v1) to pull THIS
// customer's world - the apps they ticked in the quiz, the Dream agents their
// report recommended, and their brand voice - and turn an agent into a ready-to-run
// routine on this box.
//
// Node builtins + global fetch only. Safe by default: every call returns null /
// {ok:false} when there is no Dream Labs account configured or the backend is
// unreachable, so the dashboard stays exactly the standalone product without one.
// All logic lives here; dashboard.mjs only calls these (surgical edits).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA = process.env.DL_DATA || '/var/dreamlabs';
const DL_FILE = join(DATA, 'dl.json'); // { url, email, key, onboarding, syncedAt }
const BACKEND = (process.env.DL_BACKEND_URL || 'https://app.joindreamlabs.com').replace(/\/+$/, '');

export function dlConfig() { try { return JSON.parse(readFileSync(DL_FILE, 'utf8')); } catch { return {}; } }
export function dlConfigured() { const c = dlConfig(); return !!(c.key || c.email); }
function save(obj) { try { mkdirSync(DATA, { recursive: true }); } catch {} writeFileSync(DL_FILE, JSON.stringify({ ...dlConfig(), ...obj }, null, 2), { mode: 0o600 }); }
export function dlClear() { try { writeFileSync(DL_FILE, '{}', { mode: 0o600 }); } catch {} }

function authed(path, c) {
  const base = (c.url || BACKEND).replace(/\/+$/, '');
  if (c.key) return { url: base + path, headers: { authorization: 'Bearer ' + c.key } };
  const sep = path.includes('?') ? '&' : '?';
  return { url: base + path + sep + 'email=' + encodeURIComponent(c.email || ''), headers: {} };
}
async function getJSON(path, c) {
  try {
    const { url, headers } = authed(path, c);
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// Connect by the email the customer paid with: pull their world + their key, store both.
export async function dlConnect(email) {
  email = String(email || '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'Enter the email you paid with.' };
  const data = await getJSON('/api/v1/onboarding', { url: BACKEND, email });
  if (!data) return { ok: false, error: 'No Dream Labs account found for that email (or the backend is unreachable). Use the email you paid with.' };
  save({ url: BACKEND, email, key: data.key || '', onboarding: data, syncedAt: new Date().toISOString() });
  return { ok: true, data };
}
export async function dlSync() {
  const c = dlConfig(); if (!c.key && !c.email) return null;
  const data = await getJSON('/api/v1/onboarding', c);
  if (data) save({ onboarding: data, syncedAt: new Date().toISOString() });
  return data;
}
export async function dlFetchAgent(id) {
  const c = dlConfig(); if (!c.key && !c.email) return null;
  return getJSON('/api/v1/agents/' + encodeURIComponent(id), c);
}

// best-effort app-name -> connector-id (NOT the full mapping pass; loose name/id match).
function resolveConnector(app, connById, all) {
  const norm = String(app || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!norm) return '';
  if (connById(norm)) return norm;
  for (const m of all || []) {
    const idn = String(m.id).toLowerCase().replace(/[^a-z0-9]/g, '');
    const nmn = String(m.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (idn === norm || nmn === norm || (nmn && norm.length >= 4 && (nmn.includes(norm) || norm.includes(idn)))) return m.id;
  }
  return '';
}

// Turn a backend agent definition into a dashboard routine (mirrors buildRoutineFromForm's shape).
// helpers: { connById, slugify, PROVIDERS, nowISO, allConnectors }
export function dlBuildRoutine(def, helpers) {
  const { connById, slugify, PROVIDERS, nowISO, allConnectors } = helpers;
  const ids = [];
  for (const app of (def.apps || [])) { const id = resolveConnector(app, connById, allConnectors); if (id && !ids.includes(id)) ids.push(id); }
  const provider = (PROVIDERS && PROVIDERS.includes(def.provider)) ? def.provider : 'claude';
  const trig = (def.trigger && def.trigger.type) ? def.trigger : { type: 'schedule', cron: '0 9 * * *' };
  return {
    id: slugify(def.name || 'dream-agent'),
    name: String(def.name || 'Dream agent').slice(0, 60),
    instructions: String(def.instructions || '').slice(0, 20000),
    provider, model: String(def.model || '').slice(0, 60), repo: String(def.repo || '').slice(0, 120),
    connectors: ids, behavior: '', permissions: '', paused: false,
    trigger: trig,
    contract: { timeoutMinutes: 20, maxConsecutiveFailures: 2, maxRunsPerDay: 96 },
    createdAt: nowISO(), updatedAt: nowISO(), dreamLabs: true,
  };
}

// The onboarding panel, rendered from the cached onboarding in dl.json (no network here).
// helpers: { esc, connById, isConnected, allConnectors }
export function dlOnboardingPanel(helpers) {
  const { esc, connById, isConnected, allConnectors } = helpers;
  const c = dlConfig();
  if (!c.key && !c.email) {
    return `<div class="card" style="padding:15px 18px;margin-bottom:16px">
      <div class="r-name" style="margin-bottom:5px">Connect your Dream Labs account</div>
      <p class="hint" style="margin:0 0 11px">Enter the email you paid with and we will pull in your apps, your Dream agents, and your brand voice.</p>
      <form method="post" action="/dl/connect" class="row-actions" style="gap:8px">
        <input name="email" type="email" placeholder="you@business.com" autocomplete="email" required style="max-width:300px;flex:1">
        <button class="btn" type="submit">Connect</button></form></div>`;
  }
  const ob = c.onboarding || {}; const brand = ob.brand || {};
  const apps = (ob.selectedApps || []).map(app => {
    const id = resolveConnector(app, connById, allConnectors);
    const on = id && isConnected(id);
    return id ? `<a class="connchip ${on ? 'on' : ''}" href="/connection/${esc(id)}">${esc(app)}${on ? ' ✓' : ''}</a>`
              : `<span class="connchip" style="opacity:.55">${esc(app)}</span>`;
  }).join('');
  const agents = (ob.agents || []).map(a => `<div class="tpl">
      <div class="tpl-name">${esc(a.name || a.id)}</div>
      ${(a.apps && a.apps.length) ? `<div class="tpl-desc">${esc(a.apps.join(', '))}</div>` : ''}
      <form method="post" action="/dl/install/${esc(a.id)}" style="margin-top:9px"><button class="btn sm" type="submit">Install</button></form>
    </div>`).join('');
  return `<div class="card" style="padding:16px 18px;margin-bottom:16px">
    <div class="flex-between"><div class="r-name">${esc(brand.name || 'Your Dream Labs')} <span class="pill live"><span class="dotmark"></span>connected</span></div>
      <div class="row-actions"><form method="post" action="/dl/sync"><button class="btn ghost sm">Sync from Dream Labs</button></form>
      <form method="post" action="/dl/disconnect"><button class="btn ghost sm">Disconnect</button></form></div></div>
    ${apps ? `<p class="sectlabel" style="margin:15px 0 8px">Connect these apps to get started</p><div class="conn-chips">${apps}</div>` : ''}
    ${agents ? `<p class="sectlabel" style="margin:17px 0 8px">Your Dream agents</p><div class="tpl-grid">${agents}</div>` : ''}</div>`;
}
