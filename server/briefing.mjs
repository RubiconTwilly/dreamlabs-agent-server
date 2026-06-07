#!/usr/bin/env node
// Dream Labs Agent Server - Daily Briefing.
//
// Computes run-health insights from the box's own data (no provider key needed,
// nothing secret in the web process) and DELIVERS them. Delivery order:
//   1. Dream Labs relay (DL_BRIEFING_URL set) -> goes out on the DREAM LABS
//      Telegram bot (run by us). The box never holds a Telegram token; it just
//      POSTs the briefing + its box id/key, and our backend relays to the
//      owner's chat. This is the "run by us, control the channel" model.
//   2. Local Telegram fallback (ALERT_TG_TOKEN/CHAT) - for self-hosters who
//      want their own bot instead.
//   3. Otherwise just stored; the dashboard shows it.
//
// Always writes data/briefing.json for the dashboard "Daily Briefing" card.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

function parseEnvFile(p) {
  const out = {};
  try { for (const line of readFileSync(p, 'utf8').split('\n')) { const i = line.indexOf('='); if (i > 0 && !line.startsWith('#')) out[line.slice(0, i).trim()] = line.slice(i + 1).trim(); } } catch {}
  return out;
}
// Resolve config from secrets.env (macOS ~/.dreamlabs or Linux /etc/dreamlabs), env wins.
const secretsPath = process.env.DL_SECRETS
  || [join(homedir(), '.dreamlabs/secrets.env'), '/etc/dreamlabs/secrets.env'].find(existsSync) || '';
const cfg = { ...parseEnvFile(secretsPath), ...process.env };
const DATA = cfg.DL_DATA || join(homedir(), '.dreamlabs/data');
const ROUTINES = join(DATA, 'routines.json');
const RUNS = join(DATA, 'runs.jsonl');

const readJSON = (p, d) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return d; } };
const routines = (readJSON(ROUTINES, { routines: [] }).routines) || [];
const runLines = existsSync(RUNS) ? readFileSync(RUNS, 'utf8').trim().split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];

const todayStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '') + 'T'; // YYYYMMDDT
const runsToday = runLines.filter(r => r.event === 'run' && (r.ts || '').startsWith(todayStamp));
const failsToday = runsToday.filter(r => r.rc !== 0);

// trailing consecutive failures per routine (reset by success or resume)
function streak(id) {
  const ev = runLines.filter(r => r.id === id && (r.event === 'run' || r.event === 'resume')).slice(-50).reverse();
  let n = 0; for (const e of ev) { if (e.event === 'resume' || e.rc === 0) break; n++; } return n;
}
const lastRun = id => [...runLines].reverse().find(r => r.id === id && r.event === 'run');

const details = routines.map(r => {
  const lr = lastRun(r.id);
  const s = streak(r.id);
  let state = 'healthy';
  if (r.paused) state = 'paused';
  else if (s >= (r.contract?.maxConsecutiveFailures ?? 2)) state = 'auto-paused-soon';
  else if (s > 0) state = 'failing';
  else if (!lr) state = 'never-run';
  return { id: r.id, name: r.name, provider: r.provider, state, lastRc: lr ? lr.rc : null, failStreak: s };
});

const healthy = details.filter(d => d.state === 'healthy').length;
const needAttention = details.filter(d => ['failing', 'auto-paused-soon', 'paused'].includes(d.state));
const lines = [];
lines.push(`Dream Labs - Daily Briefing`);
lines.push(`${routines.length} agents - ${runsToday.length} runs today${failsToday.length ? `, ${failsToday.length} failed` : ''} - ${healthy} healthy`);
if (needAttention.length) {
  lines.push('');
  lines.push('Needs attention:');
  for (const d of needAttention) lines.push(`- ${d.name}: ${d.state}${d.failStreak ? ` (${d.failStreak} fails in a row)` : ''}`);
} else {
  lines.push('All agents healthy.');
}
const text = lines.join('\n');
const briefing = { generatedAt: new Date().toISOString(), agents: routines.length, runsToday: runsToday.length, failsToday: failsToday.length, healthy, needAttention, text };

writeFileSync(join(DATA, 'briefing.json'), JSON.stringify(briefing, null, 2));

async function deliver() {
  if (cfg.DL_BRIEFING_URL) {
    try {
      const res = await fetch(cfg.DL_BRIEFING_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (cfg.DL_BRIEFING_KEY || '') },
        body: JSON.stringify({ boxId: cfg.DL_BOX_ID || '', generatedAt: briefing.generatedAt, summary: text, details }),
        signal: AbortSignal.timeout(10000),
      });
      console.log(res.ok ? 'delivered via Dream Labs relay' : 'DL relay HTTP ' + res.status);
      if (res.ok) return;
    } catch (e) { console.log('DL relay failed:', e.message); }
  }
  if (cfg.ALERT_TG_TOKEN && cfg.ALERT_TG_CHAT) {
    try {
      await fetch(`https://api.telegram.org/bot${cfg.ALERT_TG_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: cfg.ALERT_TG_CHAT, text }), signal: AbortSignal.timeout(10000),
      });
      console.log('delivered via local Telegram fallback');
      return;
    } catch (e) { console.log('telegram fallback failed:', e.message); }
  }
  console.log('stored only (no delivery channel configured); dashboard will show it');
}
deliver().then(() => console.log(text));
