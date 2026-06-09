// Dream Labs Agent Server - connector registry.
import { GENERATED } from './registry-generated.mjs';

//
// One manifest per connector. The engine (engine.mjs), the UI (connections.mjs),
// the routes (dashboard.mjs) and the runner all read FROM here, so adding an app
// is a single manifest entry. The research workflow fills this out; Google is the
// hand-verified reference entry that proves the shape.
//
// Model (per product owner): it is the CUSTOMER'S own server and we are the skin.
// We do NOT host shared OAuth apps. OAuth connectors are bring-your-own-app
// (auth:'oauth', byo:true) with a clear baked guide; everything else is an API key
// or token (auth:'apikey'). Bot tokens and IMAP app-passwords are just apikey
// connectors with the right fields.
//
// Manifest shape:
//   id, name, tagline, category, icon, color, provider ('google'|'microsoft'|'meta'|'self')
//   auth: 'oauth' | 'apikey'
//   oauth: { authEp, tokenEp, revokeEp, userinfoEp?, extraParams?, scopes?[], scopeCatalog? }
//   fields: [{ name, label, secret, placeholder? }]   // apikey inputs (oauth always needs clientId+clientSecret)
//   inject: [{ env, source }]   // source: 'oauth.access_token' | 'field.<name>'
//   apiBase, authHeader         // documentation strings shown on the page
//   agentUsage                  // one concrete example request
//   appSetupNotes, docsUrl
//   guide: [ steps ]            // the baked tutorial
//   confidence, sources         // provenance from the research

export const CATEGORIES = [
  'Email & Calendar', 'Team chat / ops alerts', 'Messaging / inbox', 'CRM & sales',
  'Accounting', 'Payments', 'E-commerce', 'Email & SMS marketing', 'Telephony / SMS',
  'Calendar & scheduling', 'Social & content publishing', 'Docs & storage',
  'Forms & PM boards', 'Reviews & local listings', 'Research / SEO / data',
  'Transcription / meetings', 'Docs generation', 'Image / design gen',
  'Rostering / HR', 'Site & dev / infra',
];

// Google identity is always requested so we can show who connected.
const GOOGLE_IDENTITY = ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];

// Hand-verified connectors (curated). Google covers all same-OAuth services via a
// scope catalog, so the customer connects Google ONCE and ticks what they need.
const CURATED = [
  {
    id: 'google', name: 'Google', tagline: 'Gmail, Calendar, Drive, Sheets, Docs, Analytics, YouTube', category: 'Email & Calendar',
    icon: '📧', color: '#4285F4', brandSlug: 'google', provider: 'google', auth: 'oauth', byo: true,
    oauth: {
      authEp: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEp: 'https://oauth2.googleapis.com/token',
      revokeEp: 'https://oauth2.googleapis.com/revoke',
      userinfoEp: 'https://openidconnect.googleapis.com/v1/userinfo',
      extraParams: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' },
      // selectable access; identity is always on
      scopeCatalog: {
        identity: { label: 'Identity', always: true, scopes: GOOGLE_IDENTITY },
        gmail: { label: 'Gmail - read, send, label, draft', default: true, api: 'Gmail API', scopes: ['https://www.googleapis.com/auth/gmail.modify'] },
        calendar: { label: 'Calendar - read/write events', default: true, api: 'Google Calendar API', scopes: ['https://www.googleapis.com/auth/calendar'] },
        drive: { label: 'Drive - read/write files (broad)', default: false, api: 'Google Drive API', scopes: ['https://www.googleapis.com/auth/drive'] },
        sheets: { label: 'Sheets - read/write spreadsheets', default: false, api: 'Google Sheets API', scopes: ['https://www.googleapis.com/auth/spreadsheets'] },
        docs: { label: 'Docs - read/write documents', default: false, api: 'Google Docs API', scopes: ['https://www.googleapis.com/auth/documents'] },
        analytics: { label: 'Analytics (GA4) - read reports', default: false, api: 'Google Analytics Data API', scopes: ['https://www.googleapis.com/auth/analytics.readonly'] },
        youtube: { label: 'YouTube - read + upload', default: false, api: 'YouTube Data API v3', scopes: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.upload'] },
      },
    },
    inject: [{ env: 'GOOGLE_ACCESS_TOKEN', source: 'oauth.access_token' }],
    apiBase: 'https://www.googleapis.com', authHeader: 'Authorization: Bearer <access_token>',
    agentUsage: 'curl -H "Authorization: Bearer $GOOGLE_ACCESS_TOKEN" https://gmail.googleapis.com/gmail/v1/users/me/profile',
    appSetupNotes: 'Create a Google Cloud project, enable the APIs you ticked, configure the OAuth consent screen (External) and set it to In production, then make a Web application OAuth client with the redirect URI shown.',
    docsUrl: 'https://developers.google.com/identity/protocols/oauth2',
    guide: [
      'Open the Google Cloud Console (console.cloud.google.com) and create a project, or pick an existing one.',
      'Enable the APIs you need: APIs & Services > Library, then enable the ones for the access you tick below (Gmail API, Google Calendar API, etc).',
      'Configure the consent screen: APIs & Services > OAuth consent screen. User type External; fill in app name, your support email and developer email; Save.',
      'Publish it: set Publishing status to "In production" (click Publish app). This stops Google expiring your connection every 7 days. The "unverified app" notice when you connect is expected for your own app - click Advanced, then Go to (your app).',
      'Create the client: Credentials > Create credentials > OAuth client ID. Application type Web application. Under Authorized redirect URIs add the exact URI shown on this page. Click Create.',
      'Copy the Client ID and Client secret, paste them below, and Save.',
      'Click Connect, approve in your browser, and you are done.',
    ],
    confidence: 'high', sources: ['https://developers.google.com/identity/protocols/oauth2'],
  },
  {
    id: 'composio', name: 'Composio', tagline: 'One key, 1000+ app tools via your own Composio account (managed auth, multi-account)', category: 'Site & dev / infra',
    icon: '🧩', color: '#5B5BD6', brandSlug: 'composio', provider: 'self', auth: 'apikey',
    fields: [{ name: 'api_key', label: 'Composio API key', secret: true, placeholder: 'ck_...' }],
    inject: [{ env: 'COMPOSIO_API_KEY', source: 'field.api_key' }],
    // Composio is special: besides injecting the key, the runner wires an MCP server
    // into the agent at run time (it reads this `mcp` block). The key is a MASTER
    // credential for EVERY app the customer connected in Composio, so a routine that
    // ticks Composio must run egress-locked to the MCP host (see AUDIT.md / $6k rules).
    mcp: { url: 'https://connect.composio.dev/mcp', header: 'x-consumer-api-key', keyEnv: 'COMPOSIO_API_KEY', egress: ['connect.composio.dev', 'backend.composio.dev'] },
    apiBase: 'https://connect.composio.dev/mcp', authHeader: 'x-consumer-api-key: <api_key>',
    agentUsage: 'MCP server https://connect.composio.dev/mcp (header x-consumer-api-key: $COMPOSIO_API_KEY). Meta-tools COMPOSIO_SEARCH_TOOLS + COMPOSIO_MULTI_EXECUTE_TOOL reach every app and account you connected in Composio.',
    appSetupNotes: 'Create a free Composio account, connect your apps once with managed OAuth (no per-app OAuth app to register; multiple accounts per app supported), then paste your API key. This runs ALONGSIDE your native connectors, it does not replace them.',
    docsUrl: 'https://docs.composio.dev',
    guide: [
      'Sign up at composio.dev (free tier: 20,000 tool calls/month).',
      'In Composio, connect the apps your agents should use (Gmail, Stripe, Google Sheets, ActiveCampaign, ...). Each is one click; Composio runs the OAuth and you register nothing. Connect as many accounts per app as you like.',
      'Open Settings / Developers, then API Keys, and copy your key (starts with ck_).',
      'Paste it below and Save. Any routine that ticks Composio can now use every app and account you connected.',
    ],
    confidence: 'high', sources: ['https://docs.composio.dev'],
  },
];

// Curated entries win over any generated one with the same id.
const genFiltered = GENERATED.filter(g => !CURATED.some(c => c.id === g.id));
export const CONNECTORS = [...CURATED, ...genFiltered];
export const byId = (id) => CONNECTORS.find(c => c.id === id) || null;
