// Transform research output -> engine manifests (registry-generated.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
const OUT = process.argv[2];
const REPO = process.argv[3];
const d = JSON.parse(readFileSync(OUT, 'utf8'));
const cs = d.result.connectors;

// Folded into the curated `google` connector's scope catalog (registry.mjs).
const FOLD = new Set(['google-sheets', 'google-docs', 'google-analytics', 'youtube']);

// Clean per-id category overrides (the research used the broad group label).
const CAT = {
  'google-business-profile': 'Reviews & local listings', 'google-maps-places': 'Research / SEO / data',
  'outlook-mail': 'Email & Calendar', 'outlook-calendar': 'Calendar & scheduling',
  'microsoft-onedrive': 'Docs & storage', 'microsoft-teams': 'Team chat / ops alerts', 'microsoft-bookings': 'Calendar & scheduling',
  'instagram': 'Social & content publishing', 'facebook': 'Social & content publishing',
  'messenger': 'Messaging / inbox', 'whatsapp': 'Messaging / inbox',
  'zoho-mail': 'Email & Calendar', 'yahoo-mail': 'Email & Calendar',
};
const ICON = {
  'Email & Calendar': '📧', 'Team chat / ops alerts': '💬', 'Messaging / inbox': '📨', 'CRM & sales': '📇',
  'Accounting': '📒', 'Payments': '💳', 'E-commerce': '🛒', 'Email & SMS marketing': '📣', 'Telephony / SMS': '📱',
  'Calendar & scheduling': '📅', 'Social & content publishing': '📢', 'Docs & storage': '📁', 'Forms & PM boards': '📋',
  'Reviews & local listings': '⭐', 'Research / SEO / data': '🔎', 'Transcription / meetings': '🎙️',
  'Docs generation': '📄', 'Image / design gen': '🎨', 'Rostering / HR': '🗓️', 'Site & dev / infra': '🛠️', 'Email': '📧',
};
const COLOR = {
  'Email & Calendar': '#4285F4', 'Team chat / ops alerts': '#4A154B', 'Messaging / inbox': '#00A4EF', 'CRM & sales': '#FF7A59',
  'Accounting': '#13B5EA', 'Payments': '#635BFF', 'E-commerce': '#96BF48', 'Email & SMS marketing': '#FFE01B', 'Telephony / SMS': '#F22F46',
  'Calendar & scheduling': '#0069FF', 'Social & content publishing': '#E1306C', 'Docs & storage': '#0061FF', 'Forms & PM boards': '#0079BF',
  'Reviews & local listings': '#FBBC04', 'Research / SEO / data': '#34A853', 'Transcription / meetings': '#6B5B95',
  'Docs generation': '#E94F37', 'Image / design gen': '#7B2FF7', 'Rostering / HR': '#00B289', 'Site & dev / infra': '#3DDC84', 'Email': '#4285F4',
};

// Simple Icons slugs for brand logos. Wrong/missing -> graceful emoji fallback.
const SLUG = {
  'google-business-profile': 'google', 'google-maps-places': 'googlemaps',
  'outlook-mail': 'microsoftoutlook', 'outlook-calendar': 'microsoftoutlook', 'microsoft-onedrive': 'microsoftonedrive', 'microsoft-teams': 'microsoftteams', 'microsoft-bookings': 'microsoft',
  'instagram': 'instagram', 'facebook': 'facebook', 'messenger': 'messenger', 'whatsapp': 'whatsapp',
  'slack': 'slack', 'telegram': 'telegram', 'discord': 'discord',
  'hubspot': 'hubspot', 'pipedrive': 'pipedrive', 'salesforce': 'salesforce', 'activecampaign': 'activecampaign',
  'xero': 'xero', 'quickbooks': 'quickbooks', 'freshbooks': 'freshbooks',
  'stripe': 'stripe', 'square': 'square', 'paypal': 'paypal',
  'shopify': 'shopify', 'woocommerce': 'woocommerce',
  'calendly': 'calendly', 'cal-com': 'caldotcom', 'zoom': 'zoom',
  'mailchimp': 'mailchimp', 'klaviyo': 'klaviyo', 'convertkit': 'convertkit',
  'zendesk': 'zendesk', 'intercom': 'intercom', 'help-scout': 'helpscout', 'front': 'front',
  'typeform': 'typeform', 'jotform': 'jotform', 'asana': 'asana', 'trello': 'trello', 'monday': 'mondaydotcom',
  'dropbox': 'dropbox', 'notion': 'notion', 'airtable': 'airtable',
  'tiktok': 'tiktok', 'linkedin': 'linkedin', 'twitter-x': 'x', 'reddit': 'reddit', 'pinterest': 'pinterest', 'buffer': 'buffer', 'hootsuite': 'hootsuite',
  'twilio': 'twilio', 'messagebird': 'messagebird',
  'pandadoc': 'pandadoc', 'canva': 'canva',
  'ahrefs': 'ahrefs', 'semrush': 'semrush', 'similarweb': 'similarweb', 'crunchbase': 'crunchbase',
  'yelp': 'yelp', 'trustpilot': 'trustpilot',
  'wordpress': 'wordpress', 'apify': 'apify', 'supabase': 'supabase',
  'zoho-mail': 'zoho', 'yahoo-mail': 'yahoo',
};
const scrub = (s) => typeof s === 'string' ? s.replace(/[\u2014\u2013]/g, '-').replace(/\u2019/g, "'") : s;
const up = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
// Env var name for an apikey field, avoiding a doubled connector prefix when the
// research already named the field in env-var style (e.g. Stripe's 'STRIPE_API_KEY').
function envName(id, fieldName) {
  const f = up(fieldName), prefix = up(id);
  if (f === prefix || f.startsWith(prefix + '_')) return f;
  if (/^[A-Za-z0-9_]+$/.test(fieldName) && /[A-Z]/.test(fieldName) && fieldName.includes('_')) return f;
  return prefix + '_' + f;
}
const GEN = [];

for (const c of cs) {
  if (FOLD.has(c.id)) continue;
  const category = CAT[c.id] || c.category;
  const base = {
    id: c.id, name: scrub(c.name), category, icon: ICON[category] || '🔌', color: COLOR[category] || '#6b7280', brandSlug: SLUG[c.id] || '',
    provider: c.provider || 'self', confidence: c.confidence, sources: c.sources || [],
    guide: (c.guide || []).map(scrub), agentUsage: scrub(c.agentUsage || ''),
    docsUrl: (c.oauth && c.oauth.docsUrl) || (c.apikey && c.apikey.docsUrl) || '',
  };
  if (c.authKind === 'oauth-byo' && c.oauth) {
    const scopes = [...(c.oauth.scopes || [])];
    let extraParams = {}, userinfoEp = '';
    if (c.provider === 'google') { extraParams = { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' }; userinfoEp = 'https://openidconnect.googleapis.com/v1/userinfo'; }
    else if (c.provider === 'microsoft') { for (const s of ['offline_access', 'openid', 'email', 'profile']) if (!scopes.includes(s)) scopes.push(s); extraParams = { prompt: 'consent' }; userinfoEp = 'https://graph.microsoft.com/oidc/userinfo'; }
    GEN.push({
      ...base, auth: 'oauth', byo: true,
      oauth: { authEp: c.oauth.authEp, tokenEp: c.oauth.tokenEp, revokeEp: c.oauth.revokeEp || '', scopes, ...(userinfoEp ? { userinfoEp } : {}), extraParams },
      appSetupNotes: scrub(c.oauth.appSetupNotes || ''),
      // SECURITY: inject ONLY a short-lived access token, never client id/secret/refresh.
      inject: [{ env: up(c.id) + '_ACCESS_TOKEN', source: 'oauth.access_token' }],
    });
  } else if (['apikey', 'bot-token', 'imap'].includes(c.authKind)) {
    let fields = (c.apikey && Array.isArray(c.apikey.fields) ? c.apikey.fields : []).map(f => ({ name: f.name, label: scrub(f.label), secret: !!f.secret }));
    if (!fields.length) fields = [{ name: 'api_key', label: 'API key', secret: true }];
    GEN.push({
      ...base, auth: 'apikey', kind: c.authKind,
      fields, apiBase: (c.apikey && c.apikey.baseUrl) || '', authHeader: scrub((c.apikey && c.apikey.authHeader) || ''), whereToGetKey: scrub((c.apikey && c.apikey.whereToGetKey) || ''),
      inject: fields.map(f => ({ env: envName(c.id, f.name), source: 'field.' + f.name })),
    });
  } else {
    // 'none' / 'infra' with no usable public API: list it, guide-only, not connectable.
    GEN.push({ ...base, auth: 'none' });
  }
}

const header = '// AUTO-GENERATED from the connector-research workflow. Do not hand-edit;\n// re-run the transform. Curated overrides live in registry.mjs.\n';
writeFileSync(REPO + '/server/connectors/registry-generated.mjs', header + 'export const GENERATED = ' + JSON.stringify(GEN, null, 2) + ';\n');
const kinds = {}; for (const g of GEN) kinds[g.auth] = (kinds[g.auth] || 0) + 1;
console.log('wrote', GEN.length, 'connectors:', JSON.stringify(kinds));
console.log('oauth:', GEN.filter(g => g.auth === 'oauth').map(g => g.id).join(', '));
console.log('none:', GEN.filter(g => g.auth === 'none').map(g => g.id).join(', '));
