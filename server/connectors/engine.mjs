#!/usr/bin/env node
// Dream Labs Agent Server - generic connector engine.
//
// One engine drives every connector from its registry manifest:
//   - auth:'oauth'  -> bring-your-own-app authorization-code flow (like Google).
//                      Customer pastes their own client id/secret; we run the flow.
//   - auth:'apikey' -> the customer pastes a key/token (+ any account/region/url
//                      fields). Bot tokens and IMAP app passwords are this too.
//
// SECURITY (the $6k rules): every connector's secrets live in
// data/connectors/<id>.json (600, dreamlabs-owned). The dashboard reads them to
// run OAuth + refresh; the agent jail NEVER sees them. At run time the runner
// asks this engine (`node engine.mjs env <id>`) for ONLY the env vars the manifest
// says to inject - a short-lived OAuth access token, or the API key - and forwards
// just those into the jail when a routine ticks that connector.
//
// Node builtins + global fetch only. Importable by the dashboard; also a CLI.
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual, randomBytes } from 'node:crypto';
import { byId } from './registry.mjs';

const DATA = process.env.DL_DATA || '/var/dreamlabs';
const DIR = join(DATA, 'connectors');
const fileFor = (id) => join(DIR, `${id}.json`);
const STATE_TTL_MS = 10 * 60 * 1000;

// ---------- storage ----------
function readConn(id) { try { return JSON.parse(readFileSync(fileFor(id), 'utf8')); } catch { return null; } }
function writeConn(id, obj) {
  mkdirSync(DIR, { recursive: true });
  const tmp = fileFor(id) + '.tmp';
  writeFileSync(tmp, JSON.stringify(obj, null, 2), { mode: 0o600 });
  renameSync(tmp, fileFor(id));
}

// ---------- scopes (oauth) ----------
export function defaultScopeKeys(m) {
  const cat = m.oauth && m.oauth.scopeCatalog;
  if (!cat) return [];
  return Object.keys(cat).filter(k => cat[k].default && !cat[k].always);
}
export function selectedScopes(m, stored) {
  const o = m.oauth || {};
  if (o.scopeCatalog) {
    const chosen = (stored && stored.scopeKeys && stored.scopeKeys.length) ? stored.scopeKeys : defaultScopeKeys(m);
    const keys = ['__always__', ...chosen];
    const set = new Set();
    for (const [k, v] of Object.entries(o.scopeCatalog)) {
      if (v.always || keys.includes(k)) v.scopes.forEach(s => set.add(s));
    }
    return [...set];
  }
  return Array.isArray(o.scopes) ? [...o.scopes] : [];
}

// ---------- status (no secrets) ----------
export function status(m) {
  const c = readConn(m.id);
  if (m.auth === 'oauth') {
    if (!c) return { id: m.id, auth: 'oauth', connected: false, hasCreds: false, scopeKeys: defaultScopeKeys(m), email: '', redirect_uri: '' };
    return {
      id: m.id, auth: 'oauth', connected: !!c.connected, hasCreds: !!(c.client_id && c.client_secret),
      clientIdTail: c.client_id ? c.client_id.slice(0, 16) + '…' : '',
      email: c.identity || '', scopeKeys: (c.scopeKeys && c.scopeKeys.length) ? c.scopeKeys : defaultScopeKeys(m),
      redirect_uri: c.redirect_uri || '', connectedAt: c.connectedAt || '',
    };
  }
  // apikey
  const set = (c && c.fields) ? Object.keys(c.fields).filter(k => c.fields[k]) : [];
  return { id: m.id, auth: 'apikey', connected: !!(c && c.connected), fieldsSet: set, connectedAt: (c && c.connectedAt) || '' };
}

// ---------- save creds ----------
export function saveCreds(m, input) {
  if (m.auth === 'oauth') {
    const c = readConn(m.id) || {};
    const next = { ...c };
    const newId = (input.clientId || '').trim();
    if (newId && newId !== c.client_id) { delete next.refresh_token; delete next.access_token; delete next.expiry; delete next.identity; next.connected = false; }
    if (newId) next.client_id = newId;
    if (input.clientSecret && input.clientSecret.trim()) next.client_secret = input.clientSecret.trim();
    if (Array.isArray(input.scopeKeys)) {
      const cat = m.oauth.scopeCatalog || {};
      next.scopeKeys = input.scopeKeys.filter(k => cat[k] && !cat[k].always);
    }
    if (input.redirectUri && input.redirectUri.trim()) next.redirect_uri = input.redirectUri.trim();
    writeConn(m.id, next);
    return status(m);
  }
  // apikey: store field values; saving a key == connected
  const c = readConn(m.id) || {};
  const fields = { ...(c.fields || {}) };
  for (const f of (m.fields || [])) {
    const v = input[f.name];
    if (v !== undefined && String(v).trim() !== '') fields[f.name] = String(v).trim();
  }
  const required = (m.fields || []).filter(f => f.secret).map(f => f.name);
  const connected = required.every(n => fields[n]);
  writeConn(m.id, { ...c, fields, connected, connectedAt: connected ? new Date().toISOString() : '' });
  return status(m);
}

// ---------- oauth flow ----------
function stateOk(got, want) { if (!got || !want) return false; const a = Buffer.from(got), b = Buffer.from(want); return a.length === b.length && timingSafeEqual(a, b); }
async function tokenRequest(m, params) {
  const r = await fetch(m.oauth.tokenEp, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params).toString(), signal: AbortSignal.timeout(15000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error_description || d.error || ('HTTP ' + r.status));
  return d;
}
export function buildAuthUrl(m, redirectUri) {
  const c = readConn(m.id);
  if (!c || !c.client_id) return null;
  const redirect = (redirectUri || c.redirect_uri || '').trim();
  if (!redirect) return null;
  const state = randomBytes(32).toString('hex');
  writeConn(m.id, { ...c, redirect_uri: redirect, oauthState: state, oauthStateAt: Date.now() });
  const p = new URLSearchParams({ client_id: c.client_id, redirect_uri: redirect, response_type: 'code', scope: selectedScopes(m, c).join(' '), state, ...(m.oauth.extraParams || {}) });
  if (c.identity) p.set('login_hint', c.identity);
  return m.oauth.authEp + (m.oauth.authEp.includes('?') ? '&' : '?') + p.toString();
}
export async function handleCallback(m, sp) {
  const c = readConn(m.id);
  if (!c || !c.client_id || !c.client_secret) return { ok: false, error: 'No credentials saved yet. Add your client id and secret first.' };
  if (sp.get('error')) return { ok: false, error: 'The provider declined: ' + sp.get('error') + (sp.get('error_description') ? ' (' + sp.get('error_description') + ')' : '') };
  const code = sp.get('code'), state = sp.get('state');
  if (!code || !state) return { ok: false, error: 'The callback was missing its code or state.' };
  if (!stateOk(state, c.oauthState)) return { ok: false, error: 'Sign-in state did not match (it may have expired). Start again.' };
  if (Date.now() - (c.oauthStateAt || 0) > STATE_TTL_MS) { writeConn(m.id, { ...c, oauthState: undefined, oauthStateAt: undefined }); return { ok: false, error: 'This sign-in attempt expired. Click Connect again.' }; }
  let tok;
  try { tok = await tokenRequest(m, { code, client_id: c.client_id, client_secret: c.client_secret, redirect_uri: c.redirect_uri, grant_type: 'authorization_code' }); }
  catch (e) { writeConn(m.id, { ...c, oauthState: undefined, oauthStateAt: undefined }); return { ok: false, error: 'Token exchange failed: ' + e.message + '. Check the redirect URI matches exactly and the secret is correct.' }; }
  const refresh = tok.refresh_token || c.refresh_token;
  if (!refresh) return { ok: false, error: 'No refresh token returned. For Google/Microsoft set the app to production (not testing); if you connected before, remove the app in your account and retry.' };
  let identity = c.identity || '';
  if (m.oauth.userinfoEp) {
    try { const ui = await fetch(m.oauth.userinfoEp, { headers: { authorization: 'Bearer ' + tok.access_token }, signal: AbortSignal.timeout(10000) }); if (ui.ok) { const u = await ui.json(); identity = u.email || u.name || u.login || identity; } } catch { /* best effort */ }
  }
  writeConn(m.id, { ...c, connected: true, refresh_token: refresh, access_token: tok.access_token, expiry: Date.now() + (Number(tok.expires_in) || 3600) * 1000, identity, connectedAt: new Date().toISOString(), oauthState: undefined, oauthStateAt: undefined });
  return { ok: true, identity };
}
async function refreshToken(m) {
  const c = readConn(m.id);
  if (!c || !c.refresh_token || !c.client_id || !c.client_secret) return null;
  let tok; try { tok = await tokenRequest(m, { client_id: c.client_id, client_secret: c.client_secret, refresh_token: c.refresh_token, grant_type: 'refresh_token' }); } catch { return null; }
  if (!tok.access_token) return null;
  writeConn(m.id, { ...c, access_token: tok.access_token, expiry: Date.now() + (Number(tok.expires_in) || 3600) * 1000 });
  return tok.access_token;
}
export async function validToken(m) {
  const c = readConn(m.id);
  if (!c || !c.connected || !c.refresh_token) return null;
  if (c.access_token && c.expiry && Date.now() < c.expiry - 60000) return c.access_token;
  return refreshToken(m);
}
export async function disconnect(m, opts = {}) {
  const c = readConn(m.id);
  if (!c) return;
  if (m.auth === 'oauth' && c.refresh_token && m.oauth.revokeEp) {
    try { await fetch(m.oauth.revokeEp, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: c.refresh_token }).toString(), signal: AbortSignal.timeout(8000) }); } catch { /* best effort */ }
  }
  if (opts.forget) { writeConn(m.id, m.auth === 'oauth' ? { scopeKeys: c.scopeKeys || defaultScopeKeys(m) } : {}); return; }
  if (m.auth === 'oauth') {
    const next = { ...c, connected: false };
    delete next.refresh_token; delete next.access_token; delete next.expiry; delete next.identity; delete next.oauthState; delete next.oauthStateAt;
    writeConn(m.id, next);
  } else {
    writeConn(m.id, { ...c, connected: false, fields: {} });
  }
}

// ---------- env injection (for the runner) ----------
// Resolve the manifest's inject spec to { ENV_VAR: value }. Refreshes OAuth tokens
// as needed. Returns only vars that resolve to a non-empty value.
export async function connectorEnv(m) {
  const c = readConn(m.id);
  if (!c || !c.connected) return {};
  const out = {};
  for (const inj of (m.inject || [])) {
    let val = null;
    if (inj.source === 'oauth.access_token') val = await validToken(m);
    else if (inj.source && inj.source.startsWith('field.')) val = (c.fields || {})[inj.source.slice(6)] || null;
    if (val) out[inj.env] = val;
  }
  return out;
}

// ---------- CLI (used by run-agent.sh) ----------
const shq = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
// Symlink-safe main check: process.argv[1] may be under a symlinked dir (e.g. macOS
// /tmp -> /private/tmp), so compare resolved real paths, not raw strings.
const isMain = (() => {
  try { return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
})();
if (isMain) {
  const cmd = process.argv[2], id = process.argv[3];
  const m = id ? byId(id) : null;
  if (cmd === 'env' && m) {
    // print shell `export` lines for the runner to `source`
    connectorEnv(m).then(env => { for (const [k, v] of Object.entries(env)) process.stdout.write(`export ${k}=${shq(v)}\n`); process.exit(0); }).catch(() => process.exit(1));
  } else if (cmd === 'envjson' && m) {
    connectorEnv(m).then(env => { process.stdout.write(JSON.stringify(env) + '\n'); process.exit(0); }).catch(() => process.exit(1));
  } else if (cmd === 'status' && m) {
    process.stdout.write(JSON.stringify(status(m)) + '\n'); process.exit(0);
  } else {
    process.stderr.write('usage: engine.mjs env|envjson|status <connector-id>\n'); process.exit(2);
  }
}
