// Dream Labs Agent Server - "Connected apps" UI (manifest-driven).
//
// Renders the connector directory + per-connector page straight from the registry,
// so all 79+ apps share one consistent look and the baked tutorial. Kept out of
// dashboard.mjs so connector work doesn't collide with concurrent design edits.
// Render functions take a `ui` object ({ layout, esc }) so they reuse the
// dashboard's exact chrome + theme.
import { CONNECTORS, byId } from './connectors/registry.mjs';
import { status as connStatus, defaultScopeKeys, selectedScopes } from './connectors/engine.mjs';

// Brand-logo tile (Claude-connectors look): real logo on a dark tinted square,
// graceful emoji fallback if the logo fails to load (or there is no slug).
function logoTile(esc, m, size) {
  const px = size || 40;
  const inner = m.brandSlug
    ? `<img src="https://cdn.simpleicons.org/${esc(m.brandSlug)}/${esc((m.color || '#888').replace('#', ''))}" alt="" loading="lazy" onerror="this.style.display='none';var e=this.parentNode.querySelector('.conn-emoji');if(e)e.style.display='inline'"><span class="conn-emoji" style="display:none">${esc(m.icon)}</span>`
    : `<span class="conn-emoji">${esc(m.icon)}</span>`;
  return `<span class="conn-ic" style="width:${px}px;height:${px}px;background:${esc(m.color)}1a;border-color:${esc(m.color)}44">${inner}</span>`;
}

const authBadge = (m) => {
  if (m.auth === 'oauth') return '<span class="pill">OAuth - your own app</span>';
  if (m.auth === 'apikey') return `<span class="pill">${m.kind === 'bot-token' ? 'Bot token' : m.kind === 'imap' ? 'IMAP' : 'API key'}</span>`;
  return '<span class="pill">No API yet</span>';
};

function copyBox(esc, text, id) {
  return `<div class="card" style="padding:12px 14px">
    <div class="mono-sm" id="${id}">${esc(text)}</div>
    <div class="row-actions" style="margin-top:9px">
      <button type="button" class="btn ghost sm" onclick="navigator.clipboard.writeText(document.getElementById('${id}').textContent);this.textContent='Copied'">Copy</button>
    </div></div>`;
}

// ---------- directory ----------
export function connectionsPage(ui) {
  const { layout, esc } = ui;
  // group by category, connected first within each
  const cats = [];
  for (const m of CONNECTORS) { if (!cats.includes(m.category)) cats.push(m.category); }
  const st = {}; let connectedCount = 0;
  for (const m of CONNECTORS) { const s = connStatus(m); st[m.id] = s; if (s.connected) connectedCount++; }

  const sections = cats.map(cat => {
    const items = CONNECTORS.filter(m => m.category === cat).sort((a, b) => (st[b.id].connected - st[a.id].connected) || a.name.localeCompare(b.name));
    const cards = items.map(m => {
      const s = st[m.id];
      const right = m.auth === 'none'
        ? '<span class="pill">soon</span>'
        : (s.connected
          ? `<span class="pill live"><span class="dotmark"></span>connected</span>`
          : authBadge(m));
      return `<a class="conn-card" href="/connection/${esc(m.id)}" data-name="${esc(m.name.toLowerCase())}" data-cat="${esc(cat.toLowerCase())}">
        ${logoTile(esc, m)}
        <span class="conn-meta"><span class="conn-name">${esc(m.name)}</span><span class="conn-sub">${right}</span></span></a>`;
    }).join('');
    return `<div class="conn-sect" data-cat="${esc(cat.toLowerCase())}"><div class="sectlabel" style="margin:22px 0 10px">${esc(cat)} <span class="tert" style="text-transform:none;letter-spacing:0;font-weight:400">· ${items.length}</span></div>
      <div class="conn-grid">${cards}</div></div>`;
  }).join('');

  const body = `
    <a class="back" href="/access">< Access &amp; keys</a>
    <div class="flex-between"><div><h2 class="title">Connected apps</h2>
      <p class="lede">Just like the connectors you have used in Claude Code - connect an app once and your agents can use it - only here it is on your own server, your keys, any of these apps. Credentials stay on your box; agents get a short-lived token at run time, only when a routine ticks the app. <b>${connectedCount}</b> connected.</p></div></div>
    <input class="promptbox" id="connsearch" placeholder="Search ${CONNECTORS.length} connectors..." autocomplete="off" style="min-height:auto;padding:12px 16px;margin:8px 0 4px">
    <div id="connsections">${sections}</div>
    <script>(function(){var q=document.getElementById('connsearch');q&&q.addEventListener('input',function(){var v=this.value.trim().toLowerCase();
      document.querySelectorAll('.conn-card').forEach(function(c){var hit=!v||c.dataset.name.indexOf(v)>=0||c.dataset.cat.indexOf(v)>=0;c.style.display=hit?'':'none';});
      document.querySelectorAll('.conn-sect').forEach(function(s){var any=Array.prototype.some.call(s.querySelectorAll('.conn-card'),function(c){return c.style.display!=='none';});s.style.display=any?'':'none';});});})();</script>`;
  return layout('Connected apps', body, 'Connected apps');
}

// ---------- per-connector page ----------
export function connectorPage(ui, m, opts = {}) {
  const { layout, esc } = ui;
  const s = connStatus(m);
  const redirectUri = opts.redirect || s.redirect_uri || '';
  const err = opts.error;
  const injected = (m.inject || []).map(i => i.env);

  // status card
  let statusCard;
  if (m.auth === 'none') {
    statusCard = `<div class="card" style="padding:16px 18px"><div class="cred" style="border:0;padding:0">
      <span>No public API to connect yet. The steps below are the manual workaround.</span><span class="pill">soon</span></div></div>`;
  } else if (s.connected) {
    statusCard = `<div class="card" style="padding:16px 18px;border-left:2px solid var(--green)">
      <div class="flex-between">
        <span>Connected${s.email ? ' as <b>' + esc(s.email) + '</b>' : ''} <span class="pill live"><span class="dotmark"></span>active</span></span>
        <span class="row-actions">
          ${m.auth === 'oauth' ? `<a class="btn ghost sm" href="/connection/${esc(m.id)}/test">Test</a>` : ''}
          <form method="post" action="/connection/${esc(m.id)}/disconnect" onsubmit="return confirm('Disconnect ${esc(m.name)}? Agents lose access until you reconnect.')"><button class="btn ghost sm">Disconnect</button></form>
        </span></div>
      <div class="hint" style="margin-top:8px">${opts.tested ? `<span style="color:var(--green)">${esc(opts.tested)}</span>` : 'Agents that tick this connector get access each run.'}</div></div>`;
  } else {
    const ready = m.auth === 'oauth' ? s.hasCreds : false;
    statusCard = `<div class="card" style="padding:16px 18px"><div class="cred" style="border:0;padding:0">
      <span>${m.auth === 'oauth' ? (ready ? 'Credentials saved. Ready to connect.' : 'Not connected. Follow the steps below.') : 'Not connected. Add your key below.'}</span>
      ${ready ? `<a class="btn" href="/connection/${esc(m.id)}/connect">Connect ${esc(m.name)}</a>` : '<span class="pill">needs setup</span>'}</div></div>`;
  }

  // walkthrough (baked tutorial)
  const guideHtml = (m.guide || []).length ? `<div class="card" style="padding:18px"><ol style="margin:0 0 0 18px;padding:0;color:var(--subtle);font-size:13px;line-height:1.8">${m.guide.map(g => `<li>${esc(g)}</li>`).join('')}</ol>
    ${m.auth === 'oauth' && redirectUri ? `<div style="margin-top:12px"><div class="hint" style="margin-bottom:6px">Redirect URI to paste into your app (must match exactly):</div>${copyBox(esc, redirectUri, 'credir')}</div>` : ''}</div>` : '';

  // credentials form
  let credsForm = '';
  if (m.auth === 'oauth') {
    const cat = m.oauth.scopeCatalog;
    let scopeUi = '';
    if (cat) {
      const selSet = new Set(s.scopeKeys && s.scopeKeys.length ? s.scopeKeys : defaultScopeKeys(m));
      const boxes = Object.entries(cat).filter(([, v]) => !v.always).map(([k, v]) =>
        `<label class="connchip ${selSet.has(k) ? 'on' : ''}"><input type="checkbox" name="scopeKeys" value="${esc(k)}" ${selSet.has(k) ? 'checked' : ''} onchange="this.closest('.connchip').classList.toggle('on',this.checked)">${esc(v.label)}</label>`).join('');
      scopeUi = `<div class="field"><span class="lab">Access for your agents</span><span class="hint">Tick only what you need; each maps to an API you enable in step 2.</span><div class="conn-chips" style="margin-top:8px">${boxes}</div></div>`;
    } else if (m.oauth.scopes && m.oauth.scopes.length) {
      scopeUi = `<div class="field"><span class="lab">Scopes requested</span><div class="hint mono-sm" style="margin-top:6px">${m.oauth.scopes.map(esc).join(' · ')}</div></div>`;
    }
    credsForm = `<form class="stack" method="post" action="/connection/${esc(m.id)}/creds" style="gap:16px;margin-top:6px">
      <label class="field"><span class="lab">Client ID</span><input name="clientId" placeholder="${s.hasCreds ? 'saved - paste again only to change it' : 'your OAuth client ID'}" autocomplete="off" ${s.hasCreds ? '' : 'required'}></label>
      <label class="field"><span class="lab">Client secret</span><input name="clientSecret" type="password" placeholder="${s.hasCreds ? 'saved - paste again only to change it' : 'your OAuth client secret'}" autocomplete="off" ${s.hasCreds ? '' : 'required'}></label>
      ${scopeUi}
      <details class="tut"><summary>Advanced - redirect URI</summary><div style="padding:14px 16px"><p class="hint" style="margin:0 0 8px">Must match what you paste into your app. Derived from how you reach this dashboard; change only if you front it with another domain.</p><input name="redirectUri" value="${esc(redirectUri)}" placeholder="https://your-host/connection/${esc(m.id)}/callback"></div></details>
      ${err ? `<div class="warn">⚠️ <div>${esc(err)}</div></div>` : ''}
      <div class="row-actions"><button class="btn" type="submit">${s.hasCreds ? 'Update credentials' : 'Save credentials'}</button>${s.hasCreds && !s.connected ? `<a class="btn ghost" href="/connection/${esc(m.id)}/connect">Connect ${esc(m.name)}</a>` : ''}</div></form>`;
  } else if (m.auth === 'apikey') {
    const inputs = (m.fields || []).map(f => `<label class="field"><span class="lab">${esc(f.label)}</span><input name="${esc(f.name)}" ${f.secret ? 'type="password"' : ''} placeholder="${f.secret ? (s.connected ? 'saved - paste again to change' : '') : esc(f.label)}" autocomplete="off" ${f.secret && !s.connected ? 'required' : ''}></label>`).join('');
    credsForm = `<form class="stack" method="post" action="/connection/${esc(m.id)}/creds" style="gap:16px;margin-top:6px">
      ${inputs}
      ${m.whereToGetKey ? `<p class="hint">Where to get it: ${esc(m.whereToGetKey)}</p>` : ''}
      ${err ? `<div class="warn">⚠️ <div>${esc(err)}</div></div>` : ''}
      <div class="row-actions"><button class="btn" type="submit">${s.connected ? 'Update' : 'Connect ' + esc(m.name)}</button></div></form>`;
  }

  // how agents use it
  const usage = (injected.length || m.agentUsage) ? `<div class="sectlabel">How your agents use it</div>
    <div class="card" style="padding:16px 18px">
      ${injected.length ? `<div class="hint" style="margin-bottom:8px">Injected into the agent each run (only when this connector is ticked on the routine): ${injected.map(e => '<code>' + esc(e) + '</code>').join(' ')}</div>` : ''}
      ${m.agentUsage ? `<div class="log" style="background:var(--log-bg);max-height:none">${esc(m.agentUsage)}</div>` : ''}</div>` : '';

  const security = m.auth !== 'none' ? `<div class="warn" style="margin-top:18px">🔒 <div>Your ${m.auth === 'oauth' ? 'client secret and the resulting refresh token' : 'key'} live in a 600 file only this box reads (<code>data/connectors/${esc(m.id)}.json</code>). <b>Agents never see ${m.auth === 'oauth' ? 'them' : 'the raw key directly unless this connector is ticked'}</b> - each run gets only ${m.auth === 'oauth' ? 'a short-lived access token' : 'the injected value'}, and only when the routine ticks this connector.</div></div>` : '';

  const guideTitle = m.auth === 'none' ? 'Manual workaround' : (m.auth === 'oauth' ? 'Set up your app' : 'Get your key');
  const body = `
    <a class="back" href="/connections">< Connected apps</a>
    <h2 class="title">${logoTile(esc, m, 30)} ${esc(m.name)} <span class="tert" style="font-weight:400;font-size:14px">${esc(m.category)}</span></h2>
    <p class="lede">${m.auth === 'oauth' ? 'Connect with a ' + esc(m.provider === 'self' ? m.name : m.provider) + ' app you own - no verification needed, it is your app and your data.' : m.auth === 'apikey' ? 'Paste your key. It stays on your server.' : 'No public API yet.'}</p>
    ${statusCard}
    ${guideHtml ? `<div class="sectlabel">${guideTitle}</div>${s.connected ? `<details class="tut"><summary>Show the steps again</summary><div style="padding:6px">${guideHtml}</div></details>` : guideHtml}` : ''}
    ${credsForm ? `<div class="sectlabel">Your credentials</div>${credsForm}` : ''}
    ${usage}
    ${m.docsUrl ? `<p class="hint" style="margin-top:12px"><a href="${esc(m.docsUrl)}" target="_blank">Official docs</a>${m.confidence && m.confidence !== 'high' ? ` · <span style="color:var(--amber)">setup details are ${esc(m.confidence)}-confidence; double-check against the docs</span>` : ''}</p>` : ''}
    ${security}`;
  return layout(m.name + ' connection', body, m.name);
}

// Rendered straight onto the provider's redirect (the dl_token cookie is withheld
// on the cross-site bounce, so this page is self-contained; the link back is a
// fresh same-site click that carries the cookie again).
export function connectorCallbackResultPage(ui, m, result) {
  const { layout, esc } = ui;
  const ok = result && result.ok;
  const inner = ok
    ? `<div class="empty"><div class="big" style="color:var(--green)">✓ ${esc(m.name)} connected</div>
        <div>${result.identity ? 'Connected as <b>' + esc(result.identity) + '</b>.' : 'Your account is connected.'} Agents that tick this connector now get access at run time.</div>
        <div style="margin-top:18px"><a class="btn" href="/connection/${esc(m.id)}">Open ${esc(m.name)}</a> <a class="btn ghost" href="/connections">All apps</a></div></div>`
    : `<div class="empty"><div class="big" style="color:var(--red)">Could not connect ${esc(m.name)}</div>
        <div style="max-width:520px;margin:0 auto">${esc((result && result.error) || 'Unknown error.')}</div>
        <div style="margin-top:18px"><a class="btn" href="/connection/${esc(m.id)}">Back to setup</a></div></div>`;
  return layout(ok ? m.name + ' connected' : 'Connection failed', inner, m.name);
}
