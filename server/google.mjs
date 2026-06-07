#!/usr/bin/env node
// Dream Labs Agent Server - Google / Gmail connector (bring-your-own OAuth app).
//
// WHY bring-your-own-app: Dream Labs is not a Google-verified publisher, so we
// cannot ship one shared OAuth client for Gmail/Calendar/Drive (those are
// "sensitive/restricted" scopes that require verification). Instead each customer
// creates their OWN Google Cloud OAuth app - their consent screen, their data -
// and pastes the client id + secret. The dashboard runs the standard
// authorization-code flow against it; the dashboard walkthrough guides the setup.
//
// SECURITY: the client secret + refresh token live in data/connectors/google.json
// (600, dreamlabs-owned). The dashboard reads them to run the OAuth flow + refresh.
// The agent jail NEVER sees them - only a short-lived access token
// (GOOGLE_ACCESS_TOKEN) is injected per run by the runner via `node google.mjs token`.
//
// No external deps: Node builtins + global fetch (Node 18+). Importable by the
// dashboard; also a CLI (`node google.mjs token|status`) for the runner.
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual, randomBytes } from 'node:crypto';

const DATA = process.env.DL_DATA || '/var/dreamlabs';
const DIR = join(DATA, 'connectors');
const FILE = join(DIR, 'google.json');

const AUTH_EP = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_EP = 'https://oauth2.googleapis.com/token';
const REVOKE_EP = 'https://oauth2.googleapis.com/revoke';
const USERINFO_EP = 'https://openidconnect.googleapis.com/v1/userinfo';
const STATE_TTL_MS = 10 * 60 * 1000; // a sign-in attempt is valid for 10 minutes

// Scope catalog. Identity is always requested (so we can show who connected).
// Gmail + Calendar default on; Drive (broad) defaults off. Each maps to one API
// the customer enables in their Google project (the walkthrough lists these).
export const GOOGLE_SCOPES = {
  identity: {
    label: 'Identity', always: true, api: null,
    scopes: ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
  },
  gmail: {
    label: 'Gmail - read, send, label, draft', default: true, api: 'Gmail API',
    scopes: ['https://www.googleapis.com/auth/gmail.modify'],
  },
  calendar: {
    label: 'Google Calendar - read/write events', default: true, api: 'Google Calendar API',
    scopes: ['https://www.googleapis.com/auth/calendar'],
  },
  drive: {
    label: 'Google Drive - read/write your files (broad)', default: false, api: 'Google Drive API',
    scopes: ['https://www.googleapis.com/auth/drive'],
  },
};
export const DEFAULT_SCOPE_KEYS = Object.keys(GOOGLE_SCOPES).filter(k => GOOGLE_SCOPES[k].default);

// ---------- storage ----------
export function readGoogle() { try { return JSON.parse(readFileSync(FILE, 'utf8')); } catch { return null; } }
function writeGoogle(obj) {
  mkdirSync(DIR, { recursive: true });
  const tmp = FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(obj, null, 2), { mode: 0o600 });
  renameSync(tmp, FILE);
}

// Status only - NEVER returns the client secret, refresh token, or access token.
export function googleStatus() {
  const g = readGoogle();
  if (!g) return { connected: false, hasCreds: false, scopeKeys: DEFAULT_SCOPE_KEYS, email: '', redirect_uri: '' };
  return {
    connected: !!g.connected,
    hasCreds: !!(g.client_id && g.client_secret),
    clientIdTail: g.client_id ? g.client_id.slice(0, 14) + '…' : '',
    email: g.email || '',
    scopeKeys: g.scopeKeys && g.scopeKeys.length ? g.scopeKeys : DEFAULT_SCOPE_KEYS,
    redirect_uri: g.redirect_uri || '',
    connectedAt: g.connectedAt || '',
  };
}

// Save the customer's OAuth app credentials + scope selection + redirect URI.
// If the client id changed, any old tokens are for a different app - drop them.
export function saveGoogleCreds({ clientId, clientSecret, scopeKeys, redirectUri }) {
  const g = readGoogle() || {};
  const next = { ...g };
  const newId = (clientId || '').trim();
  if (newId && newId !== g.client_id) { delete next.refresh_token; delete next.access_token; delete next.expiry; delete next.email; next.connected = false; }
  if (newId) next.client_id = newId;
  if (clientSecret && clientSecret.trim()) next.client_secret = clientSecret.trim();
  if (Array.isArray(scopeKeys)) next.scopeKeys = scopeKeys.filter(k => GOOGLE_SCOPES[k] && !GOOGLE_SCOPES[k].always);
  if (redirectUri && redirectUri.trim()) next.redirect_uri = redirectUri.trim();
  writeGoogle(next);
  return googleStatus();
}

// Flatten selected scope keys (+ always-on identity) to the space-joined scope set.
export function googleSelectedScopes(scopeKeys) {
  const keys = ['identity', ...((scopeKeys && scopeKeys.length ? scopeKeys : DEFAULT_SCOPE_KEYS))];
  const set = new Set();
  for (const k of keys) { const s = GOOGLE_SCOPES[k]; if (s) s.scopes.forEach(x => set.add(x)); }
  return [...set];
}

// Build the Google consent URL and stash a one-time state (CSRF + the capability
// the callback is authenticated by, since the dl_token cookie is withheld on the
// cross-site redirect back from Google). access_type=offline + prompt=consent
// force a refresh_token even on re-auth.
export function buildGoogleAuthUrl(redirectUri) {
  const g = readGoogle();
  if (!g || !g.client_id) return null;
  const redirect = (redirectUri || g.redirect_uri || '').trim();
  if (!redirect) return null;
  const state = randomBytes(32).toString('hex');
  writeGoogle({ ...g, redirect_uri: redirect, oauthState: state, oauthStateAt: Date.now() });
  const p = new URLSearchParams({
    client_id: g.client_id,
    redirect_uri: redirect,
    response_type: 'code',
    scope: googleSelectedScopes(g.scopeKeys).join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  if (g.email) p.set('login_hint', g.email);
  return AUTH_EP + '?' + p.toString();
}

function stateOk(got, want) {
  if (!got || !want) return false;
  const a = Buffer.from(got), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function tokenRequest(params) {
  const r = await fetch(TOKEN_EP, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error_description || d.error || ('HTTP ' + r.status));
  return d;
}

// Handle Google's redirect: validate state, exchange the code, capture identity,
// persist tokens. `sp` is a URLSearchParams. Returns {ok, email} or {ok:false, error}.
export async function googleHandleCallback(sp) {
  const g = readGoogle();
  if (!g || !g.client_id || !g.client_secret) return { ok: false, error: 'No Google credentials saved yet. Add your client id + secret first.' };
  if (sp.get('error')) return { ok: false, error: 'Google declined: ' + sp.get('error') + (sp.get('error_description') ? ' (' + sp.get('error_description') + ')' : '') };
  const code = sp.get('code'), state = sp.get('state');
  if (!code || !state) return { ok: false, error: 'The callback was missing its code or state.' };
  if (!stateOk(state, g.oauthState)) return { ok: false, error: 'Sign-in state did not match (it may have expired, or the flow was tampered with). Start again.' };
  if (Date.now() - (g.oauthStateAt || 0) > STATE_TTL_MS) { writeGoogle({ ...g, oauthState: undefined, oauthStateAt: undefined }); return { ok: false, error: 'This sign-in attempt expired. Click Connect again.' }; }

  let tok;
  try {
    tok = await tokenRequest({ code, client_id: g.client_id, client_secret: g.client_secret, redirect_uri: g.redirect_uri, grant_type: 'authorization_code' });
  } catch (e) {
    writeGoogle({ ...g, oauthState: undefined, oauthStateAt: undefined });
    return { ok: false, error: 'Token exchange failed: ' + e.message + '. Check the redirect URI matches exactly and the secret is correct.' };
  }
  const refresh = tok.refresh_token || g.refresh_token;
  if (!refresh) return { ok: false, error: 'Google did not return a refresh token. Set the app to "In production" (not Testing), and if you connected before, remove this app at myaccount.google.com/permissions, then retry.' };

  let email = g.email || '';
  try {
    const ui = await fetch(USERINFO_EP, { headers: { authorization: 'Bearer ' + tok.access_token }, signal: AbortSignal.timeout(10000) });
    if (ui.ok) { const u = await ui.json(); email = u.email || email; }
  } catch { /* identity is best-effort */ }

  writeGoogle({
    ...g, connected: true, refresh_token: refresh, access_token: tok.access_token,
    expiry: Date.now() + (Number(tok.expires_in) || 3600) * 1000, email,
    connectedAt: new Date().toISOString(), oauthState: undefined, oauthStateAt: undefined,
  });
  return { ok: true, email };
}

async function refreshGoogle() {
  const g = readGoogle();
  if (!g || !g.refresh_token || !g.client_id || !g.client_secret) return null;
  let tok;
  try {
    tok = await tokenRequest({ client_id: g.client_id, client_secret: g.client_secret, refresh_token: g.refresh_token, grant_type: 'refresh_token' });
  } catch { return null; }
  const access = tok.access_token;
  if (!access) return null;
  writeGoogle({ ...g, access_token: access, expiry: Date.now() + (Number(tok.expires_in) || 3600) * 1000 });
  return access;
}

// Return a valid access token, refreshing if the cached one is within 60s of expiry.
export async function validGoogleToken() {
  const g = readGoogle();
  if (!g || !g.connected || !g.refresh_token) return null;
  if (g.access_token && g.expiry && Date.now() < g.expiry - 60000) return g.access_token;
  return refreshGoogle();
}

// Disconnect: revoke the refresh token at Google, then drop the tokens locally.
// Credentials (client id/secret/scopes/redirect) are KEPT so reconnecting is one
// click; pass {forget:true} to wipe them too.
export async function disconnectGoogle(opts = {}) {
  const g = readGoogle();
  if (!g) return;
  if (g.refresh_token) {
    try { await fetch(REVOKE_EP, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: g.refresh_token }).toString(), signal: AbortSignal.timeout(8000) }); } catch { /* best-effort */ }
  }
  if (opts.forget) { writeGoogle({ scopeKeys: g.scopeKeys || DEFAULT_SCOPE_KEYS }); return; }
  const next = { ...g, connected: false };
  delete next.refresh_token; delete next.access_token; delete next.expiry; delete next.email;
  delete next.oauthState; delete next.oauthStateAt;
  writeGoogle(next);
}

// ---------- CLI (used by run-agent.sh) ----------
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const cmd = process.argv[2];
  if (cmd === 'token') {
    validGoogleToken().then(t => { if (t) { process.stdout.write(t); process.exit(0); } process.exit(1); }).catch(() => process.exit(1));
  } else if (cmd === 'status') {
    process.stdout.write(JSON.stringify(googleStatus()) + '\n'); process.exit(0);
  } else {
    process.stderr.write('usage: google.mjs token|status\n'); process.exit(2);
  }
}
