// Dream Labs Agent Server - account-level "Connected apps" UI.
//
// Kept in its own file (not dashboard.mjs) so the connector work doesn't collide
// with concurrent design edits to the dashboard. Render functions take a `ui`
// object ({ layout, esc }) so they reuse the dashboard's exact chrome + theme.
//
// Account-level connections (Google, ...) are distinct from the per-routine
// "Connectors" tab (MCP tutorials). Connecting Google here (your own OAuth app)
// lets ANY routine that ticks the Google connector receive a short-lived
// GOOGLE_ACCESS_TOKEN at run time. Secrets never leave the box.
import { googleStatus, GOOGLE_SCOPES, DEFAULT_SCOPE_KEYS } from './google.mjs';

export const APPS = [
  { id: 'google', name: 'Google', sub: 'Gmail · Calendar · Drive', icon: '📧', live: true,
    desc: 'Connect your own Google account. You create a Google app once (we walk you through it), then agents can read & send Gmail, manage your Calendar, and use Drive.' },
  { id: 'microsoft', name: 'Microsoft 365', sub: 'Outlook mail + calendar', icon: '📨', live: false,
    desc: 'Outlook mail + calendar via Microsoft OAuth. Guided setup is coming next.' },
  { id: 'square', name: 'Square', sub: 'Payments + catalog', icon: '⬛', live: false,
    desc: 'Payments, orders and catalog via Square OAuth. Guided setup is coming next.' },
  { id: 'activecampaign', name: 'ActiveCampaign', sub: 'Contacts + automations', icon: '📣', live: false,
    desc: 'Contacts, lists and automations via API key. Guided setup is coming next.' },
];

// Reusable copy-box for the dashboard access pattern (mono text + Copy button).
function copyBox(esc, text, id) {
  return `<div class="card" style="padding:12px 14px">
    <div class="mono-sm" id="${id}">${esc(text)}</div>
    <div class="row-actions" style="margin-top:9px">
      <button type="button" class="btn ghost sm" onclick="navigator.clipboard.writeText(document.getElementById('${id}').textContent);this.textContent='Copied'">Copy</button>
    </div></div>`;
}

export function connectionsPage(ui) {
  const { layout, esc } = ui;
  const g = googleStatus();
  const rows = APPS.map(a => {
    const connected = a.id === 'google' && g.connected;
    const right = a.live
      ? (connected
        ? `<span class="pill live"><span class="dotmark"></span>connected${g.email ? ' · ' + esc(g.email) : ''}</span> <a class="btn ghost sm" href="/connection/${a.id}">Manage</a>`
        : `<a class="btn sm" href="/connection/${a.id}">Connect</a>`)
      : `<span class="pill">soon</span>`;
    return `<div class="cred">
      <span style="min-width:0"><b>${esc(a.icon)} ${esc(a.name)}</b> <span class="tert">· ${esc(a.sub)}</span>
        <div class="hint" style="margin-top:3px;max-width:560px">${esc(a.desc)}</div></span>
      <span class="row-actions" style="flex:0 0 auto">${right}</span></div>`;
  }).join('');
  const body = `
    <a class="back" href="/access">< Access &amp; keys</a>
    <h2 class="title">Connected apps</h2>
    <p class="lede">Give your agents access to the tools you already use. You connect with your own account - the credentials stay on your box, and agents only ever receive a short-lived token at run time.</p>
    <div class="card">${rows}</div>
    <p class="hint" style="margin-top:10px">Each connector is a small adapter. Want one prioritised? Ask Dream Labs.</p>`;
  return layout('Connected apps', body, 'Connected apps');
}

export function googleConnectionPage(ui, opts = {}) {
  const { layout, esc } = ui;
  const g = googleStatus();
  const redirectUri = opts.redirect || g.redirect_uri || '';
  const err = opts.error;
  const selected = new Set(g.scopeKeys && g.scopeKeys.length ? g.scopeKeys : DEFAULT_SCOPE_KEYS);

  // status / connected card
  let statusCard;
  if (g.connected) {
    const scopeNames = [...selected].map(k => GOOGLE_SCOPES[k] ? GOOGLE_SCOPES[k].label.split(' - ')[0] : k).join(' · ');
    statusCard = `<div class="card" style="padding:16px 18px;border-left:2px solid var(--green)">
      <div class="flex-between">
        <span>Connected as <b>${esc(g.email || 'your Google account')}</b> <span class="pill live"><span class="dotmark"></span>active</span></span>
        <span class="row-actions">
          <a class="btn ghost sm" href="/connection/google/test">Test</a>
          <form method="post" action="/connection/google/disconnect" onsubmit="return confirm('Disconnect Google? Agents will lose access until you reconnect.')"><button class="btn ghost sm">Disconnect</button></form>
        </span></div>
      <div class="hint" style="margin-top:8px">Access: ${esc(scopeNames)}. ${opts.tested ? `<span style="color:var(--green)">${esc(opts.tested)}</span>` : 'Agents that tick the Google connector get a fresh access token each run.'}</div>
    </div>`;
  } else {
    statusCard = `<div class="card" style="padding:16px 18px"><div class="cred" style="border:0;padding:0">
      <span>${g.hasCreds ? 'Credentials saved. Ready to connect.' : 'Not connected yet. Follow the steps below.'}</span>
      ${g.hasCreds ? '<a class="btn" href="/connection/google/connect">Connect Google</a>' : '<span class="pill">needs setup</span>'}</div></div>`;
  }

  // which Google APIs to enable, from the saved selection
  const apisToEnable = [...selected].map(k => GOOGLE_SCOPES[k] && GOOGLE_SCOPES[k].api).filter(Boolean);
  const apiList = apisToEnable.length ? apisToEnable.join(', ') : 'the APIs for the access you pick below';

  const scopeBoxes = Object.entries(GOOGLE_SCOPES).filter(([, v]) => !v.always).map(([k, v]) =>
    `<label class="connchip ${selected.has(k) ? 'on' : ''}"><input type="checkbox" name="scopeKeys" value="${esc(k)}" ${selected.has(k) ? 'checked' : ''} onchange="this.closest('.connchip').classList.toggle('on',this.checked)">${esc(v.label)}</label>`
  ).join('');

  const walkthrough = `
    <div class="card" style="padding:18px">
      <ol style="margin:0 0 0 18px;padding:0;color:var(--subtle);font-size:13px;line-height:1.85">
        <li>Open the <a href="https://console.cloud.google.com/" target="_blank"><b>Google Cloud Console</b></a> and create a project (or pick an existing one).</li>
        <li>Enable the APIs you need: <b>APIs &amp; Services > Library</b>, then enable <b>${esc(apiList)}</b>.</li>
        <li>Configure the consent screen: <b>APIs &amp; Services > OAuth consent screen</b>. User type <b>External</b>; fill in an app name, your support email and developer email; Save.</li>
        <li><b>Publish it:</b> on the consent screen set <b>Publishing status</b> to <b>"In production"</b> (click <b>Publish app</b>). This stops Google expiring your connection every 7 days (the Testing default). Because it is your own app using your own data, the "unverified app" notice you may see when connecting is expected - click <b>Advanced > Go to (your app)</b>.</li>
        <li>Create the client: <b>Credentials > Create credentials > OAuth client ID</b>. Application type <b>Web application</b>. Under <b>Authorized redirect URIs</b> add this <b>exactly</b>:</li>
      </ol>
      <div style="margin:10px 0 4px">${redirectUri ? copyBox(esc, redirectUri, 'gredir') : '<div class="warn">Open this page from the address you actually use to reach the dashboard so the redirect URI is correct.</div>'}</div>
      <ol start="6" style="margin:8px 0 0 18px;padding:0;color:var(--subtle);font-size:13px;line-height:1.85">
        <li>Click <b>Create</b>. Copy the <b>Client ID</b> and <b>Client secret</b>, paste them below, and Save.</li>
        <li>Click <b>Connect Google</b>, approve in your browser, and you are done.</li>
      </ol>
    </div>`;

  const credsForm = `
    <form class="stack" method="post" action="/connection/google/creds" style="gap:16px;margin-top:6px">
      <label class="field"><span class="lab">Client ID</span>
        <input name="clientId" value="${esc(g.clientIdTail && !g.hasCreds ? '' : '')}" placeholder="${g.hasCreds ? 'saved - paste again only to change it' : 'xxxxx.apps.googleusercontent.com'}" autocomplete="off" ${g.hasCreds ? '' : 'required'}></label>
      <label class="field"><span class="lab">Client secret</span>
        <input name="clientSecret" type="password" placeholder="${g.hasCreds ? 'saved - paste again only to change it' : 'GOCSPX-...'}" autocomplete="off" ${g.hasCreds ? '' : 'required'}></label>
      <div class="field"><span class="lab">Access for your agents</span>
        <span class="hint">Identity is always included. Tick only what you need - each maps to one API you enable above.</span>
        <div class="conn-chips" style="margin-top:8px">${scopeBoxes}</div></div>
      <details class="tut"><summary>Advanced - redirect URI</summary>
        <div style="padding:14px 16px">
          <p class="hint" style="margin:0 0 8px">This must match what you paste into Google. It is derived from the address you use to reach the dashboard; change it only if you front the dashboard with a different domain.</p>
          <input name="redirectUri" value="${esc(redirectUri)}" placeholder="https://your-host/connection/google/callback"></div></details>
      ${err ? `<div class="warn">⚠️ <div>${esc(err)}</div></div>` : ''}
      <div class="row-actions"><button class="btn" type="submit">${g.hasCreds ? 'Update credentials' : 'Save credentials'}</button>
        ${g.hasCreds && !g.connected ? '<a class="btn ghost" href="/connection/google/connect">Connect Google</a>' : ''}</div>
    </form>`;

  const security = `<div class="warn" style="margin-top:18px">🔒 <div>Your Client secret and the resulting refresh token are stored in a 600 file only this box reads (<code>data/connectors/google.json</code>). The web dashboard uses them to run the sign-in and refresh tokens; <b>agents never see them</b> - each run gets only a short-lived access token, and only if that routine has the Google connector ticked.</div></div>`;

  const body = `
    <a class="back" href="/connections">< Connected apps</a>
    <h2 class="title">Google <span class="tert" style="font-weight:400;font-size:14px">Gmail · Calendar · Drive</span></h2>
    <p class="lede">Connect your own Google account with a Google app you own. No verification needed - it is your app, your data.</p>
    ${statusCard}
    <div class="sectlabel">Set up your Google app</div>
    ${g.connected ? `<details class="tut"><summary>Show the setup steps again</summary><div style="padding:6px">${walkthrough}</div></details>` : walkthrough}
    <div class="sectlabel">Your credentials</div>
    ${credsForm}
    ${security}`;
  return layout('Google connection', body, 'Google');
}

// Rendered straight onto Google's redirect (the dl_token cookie is withheld on the
// cross-site bounce, so this page is self-contained; the link back is a fresh
// same-site click that carries the cookie again).
export function googleCallbackResultPage(ui, result) {
  const { layout, esc } = ui;
  const ok = result && result.ok;
  const inner = ok
    ? `<div class="empty"><div class="big" style="color:var(--green)">✓ Google connected</div>
        <div>${result.email ? 'Connected as <b>' + esc(result.email) + '</b>.' : 'Your Google account is connected.'} Agents that tick the Google connector now get access at run time.</div>
        <div style="margin-top:18px"><a class="btn" href="/connection/google">Open Google connection</a> <a class="btn ghost" href="/">Back to routines</a></div></div>`
    : `<div class="empty"><div class="big" style="color:var(--red)">Could not connect</div>
        <div style="max-width:520px;margin:0 auto">${esc((result && result.error) || 'Unknown error.')}</div>
        <div style="margin-top:18px"><a class="btn" href="/connection/google">Back to setup</a></div></div>`;
  return layout(ok ? 'Google connected' : 'Connection failed', inner, 'Google');
}
