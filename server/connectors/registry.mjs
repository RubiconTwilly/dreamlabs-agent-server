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
];

// Curated entries win over any generated one with the same id.
const genFiltered = GENERATED.filter(g => !CURATED.some(c => c.id === g.id));
export const CONNECTORS = [...CURATED, ...genFiltered];
export const byId = (id) => CONNECTORS.find(c => c.id === id) || null;
