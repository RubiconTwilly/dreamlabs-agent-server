export const meta = {
  name: 'connector-research',
  description: 'Research BYO-app / API-key connect details + setup tutorials for Dream Labs connectors, grouped by category',
  phases: [
    { title: 'Research', detail: 'one Sonnet agent per category group: per-app auth kind, OAuth endpoints/scopes or API-key fields, env vars, agent usage, a 5-9 step setup guide, official sources' },
  ],
}

// Embedded (not via args, which arrived undefined). Self-contained = resumable.
const GROUPS = [
  { group: 'Google APIs', cat: 'Docs, reviews, analytics, social', apps: [
    { id: 'google-sheets', name: 'Google Sheets', hint: 'spreadsheets scope; provider google; byo app like Gmail' },
    { id: 'google-docs', name: 'Google Docs', hint: 'documents scope' },
    { id: 'google-business-profile', name: 'Google Business Profile', hint: 'business.manage; API access request' },
    { id: 'google-analytics', name: 'Google Analytics GA4', hint: 'analytics.readonly; GA4 Data API' },
    { id: 'youtube', name: 'YouTube', hint: 'Data API v3; upload/readonly' },
    { id: 'google-maps-places', name: 'Google Maps / Places', hint: 'Maps Platform API key; Places API' } ] },
  { group: 'Microsoft 365 / Graph', cat: 'Email, calendar, files', apps: [
    { id: 'outlook-mail', name: 'Outlook Mail', hint: 'Graph Mail.ReadWrite/Send; provider microsoft' },
    { id: 'outlook-calendar', name: 'Outlook Calendar', hint: 'Graph Calendars.ReadWrite' },
    { id: 'microsoft-onedrive', name: 'OneDrive / Word / Excel', hint: 'Graph Files.ReadWrite' },
    { id: 'microsoft-teams', name: 'Microsoft Teams', hint: 'Graph chat/channel or incoming webhook' },
    { id: 'microsoft-bookings', name: 'Microsoft Bookings', hint: 'Graph Bookings.ReadWrite' } ] },
  { group: 'Meta', cat: 'Social & messaging', apps: [
    { id: 'instagram', name: 'Instagram', hint: 'Instagram Graph API; business account; provider meta' },
    { id: 'facebook', name: 'Facebook Pages', hint: 'pages_manage_posts' },
    { id: 'messenger', name: 'Messenger', hint: 'pages_messaging' },
    { id: 'whatsapp', name: 'WhatsApp Business', hint: 'WhatsApp Cloud API token; or Twilio/360dialog' } ] },
  { group: 'Team chat & alerts', cat: 'Team chat / ops alerts', apps: [
    { id: 'slack', name: 'Slack', hint: 'bot token chat:write; or OAuth app' },
    { id: 'telegram', name: 'Telegram', hint: 'BotFather bot token' },
    { id: 'discord', name: 'Discord', hint: 'bot token + channel webhook' } ] },
  { group: 'CRM & sales', cat: 'CRM & sales', apps: [
    { id: 'hubspot', name: 'HubSpot', hint: 'private app token or OAuth' },
    { id: 'pipedrive', name: 'Pipedrive', hint: 'API token' },
    { id: 'salesforce', name: 'Salesforce', hint: 'connected app OAuth2; instance URL' },
    { id: 'apollo', name: 'Apollo.io', hint: 'API key' },
    { id: 'activecampaign', name: 'ActiveCampaign', hint: 'API URL + key' } ] },
  { group: 'Accounting', cat: 'Accounting', apps: [
    { id: 'xero', name: 'Xero', hint: 'OAuth2; accounting scopes' },
    { id: 'quickbooks', name: 'QuickBooks Online', hint: 'Intuit OAuth2' },
    { id: 'wave', name: 'Wave', hint: 'GraphQL full-access token' },
    { id: 'freshbooks', name: 'FreshBooks', hint: 'OAuth2' } ] },
  { group: 'Payments', cat: 'Payments', apps: [
    { id: 'stripe', name: 'Stripe', hint: 'restricted API key' },
    { id: 'square', name: 'Square', hint: 'access token or OAuth' },
    { id: 'paypal', name: 'PayPal', hint: 'REST client id/secret' } ] },
  { group: 'E-commerce', cat: 'E-commerce', apps: [
    { id: 'shopify', name: 'Shopify', hint: 'Admin API access token (custom app); shop domain' },
    { id: 'woocommerce', name: 'WooCommerce', hint: 'REST consumer key/secret; site URL' } ] },
  { group: 'Calendar & booking', cat: 'Calendar & scheduling', apps: [
    { id: 'calendly', name: 'Calendly', hint: 'personal access token or OAuth' },
    { id: 'cal-com', name: 'Cal.com', hint: 'API key' },
    { id: 'acuity', name: 'Acuity Scheduling', hint: 'user id + API key basic auth' },
    { id: 'simplybook', name: 'SimplyBook.me', hint: 'JSON-RPC API key' },
    { id: 'setmore', name: 'Setmore', hint: 'API key or OAuth' },
    { id: 'zoom', name: 'Zoom', hint: 'OAuth or server-to-server; meeting:write' } ] },
  { group: 'Email & SMS marketing', cat: 'Email & SMS marketing', apps: [
    { id: 'mailchimp', name: 'Mailchimp', hint: 'API key (dc suffix) or OAuth' },
    { id: 'klaviyo', name: 'Klaviyo', hint: 'private API key' },
    { id: 'convertkit', name: 'Kit (ConvertKit)', hint: 'API key/secret' } ] },
  { group: 'Helpdesk & inbox', cat: 'Messaging / inbox', apps: [
    { id: 'zendesk', name: 'Zendesk', hint: 'API token + subdomain' },
    { id: 'intercom', name: 'Intercom', hint: 'access token or OAuth' },
    { id: 'help-scout', name: 'Help Scout', hint: 'OAuth2 client credentials' },
    { id: 'front', name: 'Front', hint: 'API token' } ] },
  { group: 'Forms & PM boards', cat: 'Forms & PM boards', apps: [
    { id: 'typeform', name: 'Typeform', hint: 'personal access token' },
    { id: 'jotform', name: 'Jotform', hint: 'API key' },
    { id: 'asana', name: 'Asana', hint: 'personal access token' },
    { id: 'trello', name: 'Trello', hint: 'API key + token' },
    { id: 'monday', name: 'Monday.com', hint: 'API token GraphQL v2' } ] },
  { group: 'Docs & storage', cat: 'Docs & storage', apps: [
    { id: 'dropbox', name: 'Dropbox', hint: 'OAuth2 files scopes' },
    { id: 'notion', name: 'Notion', hint: 'internal integration token' },
    { id: 'airtable', name: 'Airtable', hint: 'personal access token' } ] },
  { group: 'Social publishing & schedulers', cat: 'Social & content publishing', apps: [
    { id: 'tiktok', name: 'TikTok', hint: 'Content Posting API OAuth' },
    { id: 'linkedin', name: 'LinkedIn', hint: 'OAuth w_member_social' },
    { id: 'twitter-x', name: 'X (Twitter)', hint: 'API v2 OAuth2 PKCE; tweet.write' },
    { id: 'reddit', name: 'Reddit', hint: 'OAuth submit' },
    { id: 'pinterest', name: 'Pinterest', hint: 'OAuth pins:write' },
    { id: 'buffer', name: 'Buffer', hint: 'check current API availability' },
    { id: 'hootsuite', name: 'Hootsuite', hint: 'OAuth2' },
    { id: 'later', name: 'Later', hint: 'check public vs partner-only' } ] },
  { group: 'Telephony / SMS', cat: 'Telephony / SMS', apps: [
    { id: 'twilio', name: 'Twilio', hint: 'Account SID + Auth Token basic auth' },
    { id: 'messagebird', name: 'MessageBird (Bird)', hint: 'AccessKey header' } ] },
  { group: 'Transcription / meetings', cat: 'Transcription / meetings', apps: [
    { id: 'fireflies', name: 'Fireflies.ai', hint: 'GraphQL API key' },
    { id: 'otter', name: 'Otter.ai', hint: 'check for public API; may be none' } ] },
  { group: 'Docs generation', cat: 'Docs generation', apps: [
    { id: 'pdfmonkey', name: 'PDFMonkey', hint: 'Bearer API key' },
    { id: 'pandadoc', name: 'PandaDoc', hint: 'API key or OAuth' } ] },
  { group: 'Image / design', cat: 'Image / design gen', apps: [
    { id: 'ideogram', name: 'Ideogram', hint: 'API key' },
    { id: 'canva', name: 'Canva', hint: 'Connect OAuth' } ] },
  { group: 'Rostering / HR', cat: 'Rostering / HR', apps: [
    { id: 'deputy', name: 'Deputy', hint: 'OAuth2 or permanent token; install domain' },
    { id: 'when-i-work', name: 'When I Work', hint: 'API token; developer access' } ] },
  { group: 'Research / SEO / data', cat: 'Research / SEO / data', apps: [
    { id: 'ahrefs', name: 'Ahrefs', hint: 'Bearer API token' },
    { id: 'semrush', name: 'SEMrush', hint: 'API key' },
    { id: 'similarweb', name: 'SimilarWeb', hint: 'API key' },
    { id: 'crunchbase', name: 'Crunchbase', hint: 'user_key' } ] },
  { group: 'Reviews & listings', cat: 'Reviews & local listings', apps: [
    { id: 'yelp', name: 'Yelp', hint: 'Fusion API key (read); responding may be partner-only' },
    { id: 'trustpilot', name: 'Trustpilot', hint: 'Business API key or OAuth' } ] },
  { group: 'Site & infra', cat: 'Site & dev / infra', apps: [
    { id: 'wordpress', name: 'WordPress', hint: 'Application Passwords REST basic auth; site URL' },
    { id: 'apify', name: 'Apify', hint: 'Bearer API token' },
    { id: 'supabase', name: 'Supabase', hint: 'project URL + service role key; agent memory' } ] },
  { group: 'Other email (IMAP/OAuth)', cat: 'Email', apps: [
    { id: 'zoho-mail', name: 'Zoho Mail', hint: 'Zoho OAuth mail scopes' },
    { id: 'yahoo-mail', name: 'Yahoo Mail', hint: 'OAuth or app-password IMAP' } ] },
];

const ITEM = {
  type: 'object', additionalProperties: false,
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    category: { type: 'string' },
    provider: { type: 'string', description: 'google | microsoft | meta | self' },
    authKind: { type: 'string', enum: ['oauth-byo', 'apikey', 'bot-token', 'imap', 'infra', 'none'] },
    oauth: {
      type: 'object', additionalProperties: false,
      properties: {
        authEp: { type: 'string' }, tokenEp: { type: 'string' }, revokeEp: { type: 'string' },
        scopes: { type: 'array', items: { type: 'string' } },
        docsUrl: { type: 'string' },
        appSetupNotes: { type: 'string', description: 'what the user does in the provider console to create THEIR own app + the redirect URI' },
      },
    },
    apikey: {
      type: 'object', additionalProperties: false,
      properties: {
        baseUrl: { type: 'string' },
        authHeader: { type: 'string', description: 'exact header, e.g. "Authorization: Bearer <key>" or "Api-Token: <key>"' },
        fields: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { name: { type: 'string' }, label: { type: 'string' }, secret: { type: 'boolean' } }, required: ['name', 'label', 'secret'] } },
        whereToGetKey: { type: 'string' },
        docsUrl: { type: 'string' },
      },
    },
    envVars: { type: 'array', items: { type: 'string' } },
    agentUsage: { type: 'string', description: 'one concrete example request (method + full URL + auth header)' },
    guide: { type: 'array', items: { type: 'string' }, description: '5-9 plain steps a non-technical owner follows. No em dashes.' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    sources: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'name', 'category', 'authKind', 'envVars', 'agentUsage', 'guide', 'confidence', 'sources'],
};
const SCHEMA = { type: 'object', additionalProperties: false, properties: { connectors: { type: 'array', items: ITEM } }, required: ['connectors'] };

function buildPrompt(g) {
  const apps = g.apps.map(a => `- ${a.name} (id: ${a.id})${a.hint ? ` - hint: ${a.hint}` : ''}`).join('\n');
  return `We are building "Dream Labs Agent Server": a polished dashboard SKIN that runs on the CUSTOMER'S OWN server and lets their AI agents read and write the apps they use.

KEY MODEL: Dream Labs does NOT host shared OAuth apps and is not chasing provider verification. For OAuth, the CUSTOMER registers their OWN app in the provider console on their own server - our job is CLEAR setup instructions. PREFER an API key / token whenever the product offers one (much simpler for the user than OAuth). Only choose OAuth when there is no usable API-key path.

Research this group: ${g.group} (category: ${g.cat})
${apps}

Use web search and the OFFICIAL developer docs. CITE them. Do not invent endpoints, scopes, or headers - wrong values break the connector.

For EACH app return a manifest:
- authKind: apikey (paste a key/token), bot-token (e.g. Slack/Telegram/Discord bot token), oauth-byo (user registers their own OAuth app), imap (mailbox via app password), infra (backend infra), or none (no usable public API - explain in a guide step).
- provider: google | microsoft | meta if it shares that OAuth, else self.
- If apikey/bot-token: API base URL, the EXACT auth header, the fields the user pastes (key + any account/region/subdomain/datacenter/site URL the API requires), where in the product UI to get it, docsUrl.
- If oauth-byo: authorization endpoint, token endpoint, revoke endpoint (if any), the MINIMAL scopes for typical small-business actions in this category (read + the main write action), docsUrl, and appSetupNotes (what to do in the provider console to make the app + the redirect URI to register).
- envVars: the env var name(s) we inject to the agent at run time.
- agentUsage: ONE concrete example request (method + full URL + auth header) for the main action.
- guide: 5 to 9 short, plain steps a NON-TECHNICAL owner follows to connect it (where to click, what to copy, what to paste). NO EM DASHES - use hyphens.
- confidence (high/medium/low) + sources (official doc URLs you actually used).

Return ONLY the structured object {connectors: [...]}.`;
}

phase('Research');
const out = await parallel(GROUPS.map(g => () =>
  agent(buildPrompt(g), { label: `research:${g.group}`, phase: 'Research', schema: SCHEMA, model: 'sonnet', agentType: 'general-purpose' })
    .then(r => (r && Array.isArray(r.connectors)) ? r.connectors : [])
    .catch(() => [])
));
const all = out.flat().filter(Boolean);
log(`researched ${all.length} connectors across ${GROUPS.length} groups`);
return { count: all.length, groups: GROUPS.length, connectors: all };
