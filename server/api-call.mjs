#!/usr/bin/env node
// Dream Labs Agent Server - raw-API runner.
// The most portable provider: a single HTTP call with the routine's
// instructions. No agentic tools, no file edits - output goes to the run log.
//
// Usage: api-call.mjs <instructions-file> [model]
// Env (allowlisted by agent-jail.sh): ANTHROPIC_API_KEY | OPENAI_API_KEY, API_BASE_URL?
import { readFileSync } from 'node:fs';

const instrFile = process.argv[2];
const model = process.argv[3] || '';
if (!instrFile) { console.error('usage: api-call.mjs <instructions-file> [model]'); process.exit(2); }

const instructions = readFileSync(instrFile, 'utf8');
const RETRIES = 2;

async function post(url, headers, body) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180_000),
      });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
        await new Promise(r => setTimeout(r, (attempt + 1) * 5000));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 2000)}`);
      return res.json();
    } catch (e) {
      lastErr = e;
      if (e.name === 'TimeoutError' || /fetch failed/.test(String(e.message))) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 5000));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

async function main() {
  // This is the GENERIC OpenAI-compatible runner only (the `api` / deepseek path).
  // It must NEVER reach for ANTHROPIC_API_KEY - Claude runs via the `claude` CLI,
  // not here. Routing by env-var presence used to let an Anthropic key hijack every
  // generic routine; routing is now strictly OpenAI-compatible.
  if (!process.env.OPENAI_API_KEY) {
    console.error('no API key in environment (OPENAI_API_KEY). The generic runner is OpenAI-compatible only.');
    process.exit(2);
  }
  // Works for OpenAI and any OpenAI-compatible endpoint via API_BASE_URL
  // (xAI, DeepSeek, MiniMax, local gateways, ...).
  const data = await post(
    (process.env.API_BASE_URL || 'https://api.openai.com') + '/v1/chat/completions',
    { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    { model: model || 'gpt-4o-mini', messages: [{ role: 'user', content: instructions }] },
  );
  process.stdout.write((data.choices?.[0]?.message?.content || '') + '\n');
}

main().catch(e => { console.error('api-call failed:', e.message); process.exit(1); });
