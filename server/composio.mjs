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
  const matches = [...raw.matchAll(/data: (\{.*\})/g)];
  let data = null;
  if (matches.length) { try { data = JSON.parse(matches[matches.length - 1][1]); } catch {} }
  else if (raw.trim().startsWith('{')) { try { data = JSON.parse(raw); } catch {} }
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
  for (let i = 0; i < toolkits.length; i += 8) {
    const batch = toolkits.slice(i, i + 8);
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

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , cmd, apiKey, toolkitsCsv] = process.argv;
  if (cmd === 'connections' && apiKey) {
    const toolkits = (toolkitsCsv || 'gmail,googlesheets,googledocs,youtube,stripe,active_campaign,slack,notion,github,hubspot')
      .split(',').map(s => s.trim()).filter(Boolean);
    listConnections(apiKey, toolkits)
      .then(r => { console.log(JSON.stringify(r, null, 2)); })
      .catch(e => { console.error(String(e.message || e)); process.exit(1); });
  } else {
    console.error('usage: node composio.mjs connections <apiKey> <toolkit,toolkit,...>');
    process.exit(2);
  }
}
