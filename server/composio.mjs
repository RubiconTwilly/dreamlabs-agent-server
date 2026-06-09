// Dream Labs Agent Server - Composio bridge.
//
// Composio is a CONNECTION BACKEND, not a tile: the customer pastes one Composio
// API key, and the apps they connected in Composio (Gmail, Stripe, Sheets, ...)
// light up as connected tiles in our own directory. This module pulls that list
// from Composio's MCP gateway using the consumer key, so the dashboard can badge
// tiles "via Composio (N accounts)" and the runner can tell the agent what it has.
//
// No REST key needed: connect.composio.dev/mcp authenticates with x-consumer-api-key.
// CLI:  node composio.mjs connections <apiKey> <toolkit,toolkit,...>

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { byId } from './connectors/registry.mjs';

const DATA = process.env.DL_DATA || '/var/dreamlabs';
const CACHE = join(DATA, 'composio-apps.json');
const MCP_URL = process.env.COMPOSIO_MCP_URL || 'https://connect.composio.dev/mcp';
let _id = 0;

async function send(apiKey, body, session) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'x-consumer-api-key': apiKey,
  };
  if (session) headers['Mcp-Session-Id'] = session;
  const res = await fetch(MCP_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const sid = res.headers.get('mcp-session-id') || session;
  const raw = await res.text();
  const objs = [];
  for (const mm of raw.matchAll(/data: (\{.*\})/g)) { try { objs.push(JSON.parse(mm[1])); } catch {} }
  if (!objs.length && raw.trim().startsWith('{')) { try { objs.push(JSON.parse(raw)); } catch {} }
  // Pick the actual JSON-RPC response (has result/error), not a stray SSE event.
  const data = objs.find(o => o && (o.result || o.error)) || objs[objs.length - 1] || null;
  return { sid, data };
}

async function open(apiKey) {
  const init = await send(apiKey, { jsonrpc: '2.0', id: ++_id, method: 'initialize',
    params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'dreamlabs-agent-server', version: '1' } } });
  if (!init.data || init.data.error) throw new Error('composio: ' + JSON.stringify(init.data?.error || 'no init response'));
  await send(apiKey, { jsonrpc: '2.0', method: 'notifications/initialized' }, init.sid);
  return init.sid;
}

function toolText(rpc) {
  const c = (rpc?.data?.result?.content) || [];
  return c.map(x => x?.text || '').join('\n');
}

// Returns { toolkit: { connected: bool, accounts: number } } for the given toolkits.
export async function listConnections(apiKey, toolkits) {
  if (!apiKey) throw new Error('composio: no api key');
  const session = await open(apiKey);
  const out = {};
  for (let i = 0; i < toolkits.length; i += 6) {
    const batch = toolkits.slice(i, i + 6);
    // Bare toolkit slugs are the reliable, side-effect-free probe. (Do NOT use
    // COMPOSIO_MANAGE_CONNECTIONS to read status: it *initiates* new connections.)
    const rpc = await send(apiKey, { jsonrpc: '2.0', id: ++_id, method: 'tools/call',
      params: { name: 'COMPOSIO_SEARCH_TOOLS', arguments: { queries: batch } } }, session);
    let parsed; try { parsed = JSON.parse(toolText(rpc)); } catch { parsed = null; }
    for (const cs of (parsed?.data?.toolkit_connection_statuses || [])) {
      out[cs.toolkit] = { connected: !!cs.has_active_connection, accounts: (cs.accounts || []).length };
    }
  }
  return out;
}

// ---- connection-backend helpers: cache the customer's connected apps + map to tiles ----

// Common Composio toolkit slugs to probe; the connected ones light up matching tiles.
const CANDIDATE_TOOLKITS = [
  'gmail', 'googlesheets', 'googledocs', 'googledrive', 'googlecalendar', 'youtube', 'google_analytics',
  'stripe', 'shopify', 'paypal', 'quickbooks', 'xero',
  'slack', 'discord', 'telegram',
  'notion', 'airtable', 'clickup', 'asana', 'trello', 'linear', 'jira',
  'hubspot', 'salesforce', 'pipedrive', 'active_campaign', 'mailchimp', 'klaviyo', 'sendgrid', 'intercom',
  'github', 'gitlab', 'sentry',
  'calendly', 'zoom', 'typeform', 'webflow', 'wordpress',
];

const GOOGLE_SUB = new Set(['gmail', 'googlesheets', 'googledocs', 'googledrive', 'googlecalendar', 'youtube', 'google_analytics', 'googleanalytics']);
function toNativeId(toolkit) {
  if (GOOGLE_SUB.has(toolkit)) return byId('google') ? 'google' : null;
  for (const v of [toolkit, toolkit.replace(/_/g, ''), toolkit.replace(/_/g, '-')]) if (byId(v)) return v;
  return null; // not in the native directory (a catalog-expansion candidate)
}

// Fetch the customer's connected apps and cache them. Call on connect; async + slow-ish.
export async function refresh(apiKey) {
  const all = await listConnections(apiKey, CANDIDATE_TOOLKITS);
  const apps = {};
  for (const [tk, v] of Object.entries(all)) if (v.connected) apps[tk] = { accounts: v.accounts };
  try { mkdirSync(DATA, { recursive: true }); writeFileSync(CACHE, JSON.stringify({ at: Date.now(), apps }), { mode: 0o600 }); } catch {}
  return apps;
}
export function cached() { try { return JSON.parse(readFileSync(CACHE, 'utf8')).apps || {}; } catch { return {}; } }
export function clearCache() { try { writeFileSync(CACHE, JSON.stringify({ at: Date.now(), apps: {} }), { mode: 0o600 }); } catch {} }

// { nativeId: { accounts, toolkits[] } } so the directory can badge tiles "via Composio".
export function nativeBadges() {
  const apps = cached(); const out = {};
  for (const [tk, v] of Object.entries(apps)) {
    const nid = toNativeId(tk); if (!nid) continue;
    if (!out[nid]) out[nid] = { accounts: 0, toolkits: [] };
    out[nid].accounts += (v.accounts || 0); out[nid].toolkits.push(tk);
  }
  return out;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , cmd, apiKey, toolkitsCsv] = process.argv;
  if (cmd === 'connections' && apiKey) {
    const toolkits = (toolkitsCsv || CANDIDATE_TOOLKITS.join(','))
      .split(',').map(s => s.trim()).filter(Boolean);
    listConnections(apiKey, toolkits)
      .then(r => { console.log(JSON.stringify(r, null, 2)); })
      .catch(e => { console.error(String(e.message || e)); process.exit(1); });
  } else if (cmd === 'refresh' && apiKey) {
    refresh(apiKey)
      .then(r => console.log('cached ' + Object.keys(r).length + ' connected apps: ' + JSON.stringify(r)))
      .catch(e => { console.error(String(e.message || e)); process.exit(1); });
  } else {
    console.error('usage: node composio.mjs <connections|refresh> <apiKey> [toolkit,...]');
    process.exit(2);
  }
}
