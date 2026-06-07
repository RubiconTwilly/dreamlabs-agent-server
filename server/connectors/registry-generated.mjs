// AUTO-GENERATED from the connector-research workflow. Do not hand-edit;
// re-run the transform. Curated overrides live in registry.mjs.
export const GENERATED = [
  {
    "id": "google-business-profile",
    "name": "Google Business Profile",
    "category": "Reviews & local listings",
    "icon": "⭐",
    "color": "#FBBC04",
    "brandSlug": "google",
    "provider": "google",
    "confidence": "high",
    "sources": [
      "https://developers.google.com/my-business/content/basic-setup",
      "https://developers.google.com/my-business/content/implement-oauth",
      "https://developers.google.com/my-business/content/oauth-setup"
    ],
    "guide": [
      "Submit an API access request at https://developers.google.com/my-business/content/prereqs - Google must approve your project before you can enable these APIs.",
      "Once approved (usually a few days), go to console.cloud.google.com and create or select a project.",
      "Click APIs and Services > Library and enable: My Business Account Management API and My Business Business Information API (plus others listed in your approval).",
      "Click APIs and Services > Credentials > Create Credentials > OAuth client ID, choose Web application.",
      "Add your callback URL (e.g. https://your-server.com/oauth/callback/google-business) under Authorized Redirect URIs and click Create.",
      "Copy the Client ID and Client Secret shown.",
      "Configure the OAuth consent screen with scope: https://www.googleapis.com/auth/business.manage.",
      "Paste credentials into the Dream Labs dashboard and complete the OAuth flow by clicking Connect.",
      "Your agents can now read and update your Google Business Profile listings and reviews."
    ],
    "agentUsage": "GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts Authorization: Bearer {access_token}",
    "docsUrl": "https://developers.google.com/my-business/content/implement-oauth",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://accounts.google.com/o/oauth2/v2/auth",
      "tokenEp": "https://oauth2.googleapis.com/token",
      "revokeEp": "https://oauth2.googleapis.com/revoke",
      "scopes": [
        "https://www.googleapis.com/auth/business.manage"
      ],
      "userinfoEp": "https://openidconnect.googleapis.com/v1/userinfo",
      "extraParams": {
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true"
      }
    },
    "appSetupNotes": "Google Business Profile API requires a special access request before the APIs are visible in the Cloud Console. Submit the access request form at https://developers.google.com/my-business/content/prereqs and wait for approval (typically a few days). Once approved, go to console.cloud.google.com, create a project, and enable all required Business Profile APIs: My Business Account Management API, My Business Business Information API, and others listed in your approval email. Create an OAuth client ID under Credentials (Web application type), add your callback URL as an Authorized Redirect URI, and copy the Client ID and Client Secret.",
    "inject": [
      {
        "env": "GOOGLE_BUSINESS_PROFILE_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "google-maps-places",
    "name": "Google Maps / Places",
    "category": "Research / SEO / data",
    "icon": "🔎",
    "color": "#34A853",
    "brandSlug": "googlemaps",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.google.com/maps/documentation/places/web-service/get-api-key",
      "https://developers.google.com/maps/documentation/places/web-service/overview",
      "https://developers.google.com/maps/documentation/places/web-service/nearby-search"
    ],
    "guide": [
      "Go to console.cloud.google.com and create a new project (or select an existing one).",
      "Click APIs and Services > Library, search for Places API (New), and click Enable. Also enable Maps JavaScript API if you need map embeds.",
      "Click APIs and Services > Credentials > Create Credentials > API key.",
      "Copy the API key shown.",
      "Click on the new key, set Application Restrictions to IP addresses and enter your server's IP, then set API Restrictions to Places API only. Click Save.",
      "Paste the API key into the Dream Labs dashboard under Google Maps / Places.",
      "Your agents can now search for places, look up business details, and retrieve reviews using the Places API."
    ],
    "agentUsage": "POST https://places.googleapis.com/v1/places:searchNearby X-Goog-Api-Key: YOUR_API_KEY X-Goog-FieldMask: places.displayName,places.formattedAddress",
    "docsUrl": "https://developers.google.com/maps/documentation/places/web-service/get-api-key",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "Maps API Key",
        "secret": true
      }
    ],
    "apiBase": "https://places.googleapis.com/v1",
    "authHeader": "X-Goog-Api-Key: YOUR_API_KEY",
    "whereToGetKey": "Go to console.cloud.google.com, create or select a project, enable the Places API (New) under APIs and Services > Library. Then go to APIs and Services > Credentials, click Create Credentials > API key. Copy the key. For security, click on the key and restrict it to the Places API and to your server IP address.",
    "inject": [
      {
        "env": "GOOGLE_MAPS_PLACES_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "outlook-mail",
    "name": "Outlook Mail",
    "category": "Email & Calendar",
    "icon": "📧",
    "color": "#4285F4",
    "brandSlug": "microsoftoutlook",
    "provider": "microsoft",
    "confidence": "high",
    "sources": [
      "https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview?view=graph-rest-1.0",
      "https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0",
      "https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow",
      "https://learn.microsoft.com/en-us/graph/auth-register-app-v2"
    ],
    "guide": [
      "Go to https://entra.microsoft.com and sign in with your Microsoft 365 admin account.",
      "In the left menu, navigate to Identity > Applications > App registrations, then click 'New registration'.",
      "Give the app a name (e.g. 'Dream Labs Mail'), select 'Accounts in any organizational directory and personal Microsoft accounts', enter your redirect URI (provided by Dream Labs), and click Register.",
      "On the app Overview page, copy the Application (client) ID and paste it into Dream Labs as 'Client ID'.",
      "Go to Certificates & secrets > Client secrets > New client secret, set an expiry, click Add, and immediately copy the secret Value - paste it into Dream Labs as 'Client Secret'.",
      "Go to API permissions > Add a permission > Microsoft Graph > Delegated permissions, search for and add Mail.ReadWrite and Mail.Send, then click 'Grant admin consent'.",
      "Back in Dream Labs, click Connect and sign in with your Microsoft account to complete authorization."
    ],
    "agentUsage": "POST https://graph.microsoft.com/v1.0/me/sendMail  Authorization: Bearer <access_token>",
    "docsUrl": "https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview?view=graph-rest-1.0",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      "tokenEp": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      "revokeEp": "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
      "scopes": [
        "offline_access",
        "Mail.ReadWrite",
        "Mail.Send",
        "openid",
        "email",
        "profile"
      ],
      "userinfoEp": "https://graph.microsoft.com/oidc/userinfo",
      "extraParams": {
        "prompt": "consent"
      }
    },
    "appSetupNotes": "Go to https://entra.microsoft.com > Identity > App registrations > New registration. Give the app a name, choose 'Accounts in any organizational directory and personal Microsoft accounts' for supported account types, and add your server's redirect URI (e.g. https://yourdomain.com/oauth/callback/outlook-mail) under 'Web' platform. After registering, go to Certificates & secrets > New client secret - copy the value immediately. Then go to API permissions > Add a permission > Microsoft Graph > Delegated permissions and add Mail.ReadWrite and Mail.Send. Copy the Application (client) ID from the Overview page.",
    "inject": [
      {
        "env": "OUTLOOK_MAIL_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "outlook-calendar",
    "name": "Outlook Calendar",
    "category": "Calendar & scheduling",
    "icon": "📅",
    "color": "#0069FF",
    "brandSlug": "microsoftoutlook",
    "provider": "microsoft",
    "confidence": "high",
    "sources": [
      "https://learn.microsoft.com/en-us/graph/outlook-calendar-concept-overview",
      "https://learn.microsoft.com/en-us/graph/api/resources/calendar-overview?view=graph-rest-1.0",
      "https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow",
      "https://learn.microsoft.com/en-us/graph/auth-register-app-v2"
    ],
    "guide": [
      "Go to https://entra.microsoft.com and sign in with your Microsoft 365 admin account.",
      "In the left menu, navigate to Identity > Applications > App registrations, then click 'New registration'.",
      "Give the app a name (e.g. 'Dream Labs Calendar'), select 'Accounts in any organizational directory and personal Microsoft accounts', enter your redirect URI (provided by Dream Labs), and click Register.",
      "On the app Overview page, copy the Application (client) ID and paste it into Dream Labs as 'Client ID'.",
      "Go to Certificates & secrets > Client secrets > New client secret, set an expiry, click Add, and immediately copy the secret Value - paste it into Dream Labs as 'Client Secret'.",
      "Go to API permissions > Add a permission > Microsoft Graph > Delegated permissions, search for and add Calendars.ReadWrite, then click 'Grant admin consent'.",
      "Back in Dream Labs, click Connect and sign in with your Microsoft account to complete authorization."
    ],
    "agentUsage": "GET https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=2026-06-07T00:00:00Z&endDateTime=2026-06-14T00:00:00Z  Authorization: Bearer <access_token>",
    "docsUrl": "https://learn.microsoft.com/en-us/graph/outlook-calendar-concept-overview",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      "tokenEp": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      "revokeEp": "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
      "scopes": [
        "offline_access",
        "Calendars.ReadWrite",
        "openid",
        "email",
        "profile"
      ],
      "userinfoEp": "https://graph.microsoft.com/oidc/userinfo",
      "extraParams": {
        "prompt": "consent"
      }
    },
    "appSetupNotes": "Go to https://entra.microsoft.com > Identity > App registrations > New registration. Give the app a name, choose 'Accounts in any organizational directory and personal Microsoft accounts', and add your server's redirect URI (e.g. https://yourdomain.com/oauth/callback/outlook-calendar) under 'Web' platform. After registering, go to Certificates & secrets > New client secret - copy the value immediately. Then go to API permissions > Add a permission > Microsoft Graph > Delegated permissions and add Calendars.ReadWrite. If users are in an org tenant, grant admin consent. Copy the Application (client) ID from the Overview page.",
    "inject": [
      {
        "env": "OUTLOOK_CALENDAR_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "microsoft-onedrive",
    "name": "OneDrive / Word / Excel",
    "category": "Docs & storage",
    "icon": "📁",
    "color": "#0061FF",
    "brandSlug": "microsoftonedrive",
    "provider": "microsoft",
    "confidence": "high",
    "sources": [
      "https://learn.microsoft.com/en-us/graph/onedrive-concept-overview",
      "https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/permissions_reference?view=odsp-graph-online",
      "https://learn.microsoft.com/en-us/onedrive/developer/rest-api/getting-started/graph-oauth?view=odsp-graph-online",
      "https://learn.microsoft.com/en-us/graph/auth-register-app-v2"
    ],
    "guide": [
      "Go to https://entra.microsoft.com and sign in with your Microsoft 365 admin account.",
      "In the left menu, navigate to Identity > Applications > App registrations, then click 'New registration'.",
      "Give the app a name (e.g. 'Dream Labs Files'), select 'Accounts in any organizational directory and personal Microsoft accounts', enter your redirect URI (provided by Dream Labs), and click Register.",
      "On the app Overview page, copy the Application (client) ID and paste it into Dream Labs as 'Client ID'.",
      "Go to Certificates & secrets > Client secrets > New client secret, set an expiry, click Add, and immediately copy the secret Value - paste it into Dream Labs as 'Client Secret'.",
      "Go to API permissions > Add a permission > Microsoft Graph > Delegated permissions, search for and add Files.ReadWrite, then click 'Grant admin consent'.",
      "Back in Dream Labs, click Connect and sign in with your Microsoft account to complete authorization."
    ],
    "agentUsage": "GET https://graph.microsoft.com/v1.0/me/drive/root/children  Authorization: Bearer <access_token>",
    "docsUrl": "https://learn.microsoft.com/en-us/graph/onedrive-concept-overview",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      "tokenEp": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      "revokeEp": "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
      "scopes": [
        "offline_access",
        "Files.ReadWrite",
        "openid",
        "email",
        "profile"
      ],
      "userinfoEp": "https://graph.microsoft.com/oidc/userinfo",
      "extraParams": {
        "prompt": "consent"
      }
    },
    "appSetupNotes": "Go to https://entra.microsoft.com > Identity > App registrations > New registration. Give the app a name, choose 'Accounts in any organizational directory and personal Microsoft accounts', and add your server's redirect URI (e.g. https://yourdomain.com/oauth/callback/microsoft-onedrive) under 'Web' platform. After registering, go to Certificates & secrets > New client secret - copy the value immediately. Then go to API permissions > Add a permission > Microsoft Graph > Delegated permissions and add Files.ReadWrite (this covers OneDrive files; for SharePoint-hosted Office files across the org, also add Files.ReadWrite.All). Copy the Application (client) ID from the Overview page.",
    "inject": [
      {
        "env": "MICROSOFT_ONEDRIVE_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "microsoft-teams",
    "name": "Microsoft Teams",
    "category": "Team chat / ops alerts",
    "icon": "💬",
    "color": "#4A154B",
    "brandSlug": "microsoftteams",
    "provider": "microsoft",
    "confidence": "high",
    "sources": [
      "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook",
      "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/what-are-webhooks-and-connectors"
    ],
    "guide": [
      "Open Microsoft Teams and navigate to the channel where you want agents to post messages.",
      "Click the three-dot menu (...) next to the channel name and select 'Workflows'.",
      "In the Workflows panel, search for 'Post to a channel when a webhook request is received' and select it.",
      "Give the workflow a name (e.g. 'Dream Labs Notifications') and click Next, then Add workflow.",
      "After the workflow is created, copy the webhook URL that appears - this is your unique endpoint.",
      "Paste that webhook URL into Dream Labs as the 'Teams Webhook URL'.",
      "Test the connection by having Dream Labs send a test message to confirm it appears in the channel."
    ],
    "agentUsage": "POST <MICROSOFT_TEAMS_WEBHOOK_URL>  Content-Type: application/json  Body: {\"type\":\"message\",\"attachments\":[{\"contentType\":\"application/vnd.microsoft.card.adaptive\",\"content\":{\"type\":\"AdaptiveCard\",\"version\":\"1.4\",\"body\":[{\"type\":\"TextBlock\",\"text\":\"Hello from Dream Labs!\"}]}}]}",
    "docsUrl": "",
    "auth": "none"
  },
  {
    "id": "microsoft-bookings",
    "name": "Microsoft Bookings",
    "category": "Calendar & scheduling",
    "icon": "📅",
    "color": "#0069FF",
    "brandSlug": "microsoft",
    "provider": "microsoft",
    "confidence": "high",
    "sources": [
      "https://learn.microsoft.com/en-us/graph/booking-concept-overview",
      "https://learn.microsoft.com/en-us/graph/api/resources/booking-api-overview?view=graph-rest-1.0",
      "https://learn.microsoft.com/en-us/graph/api/bookingbusiness-post-appointments?view=graph-rest-1.0",
      "https://learn.microsoft.com/en-us/answers/questions/2283013/why-is-my-web-api-with-application-permissions-to"
    ],
    "guide": [
      "Confirm your Microsoft 365 subscription includes Microsoft Bookings - this requires Microsoft 365 Business Premium or equivalent.",
      "Go to https://entra.microsoft.com and sign in with your Microsoft 365 admin account.",
      "In the left menu, navigate to Identity > Applications > App registrations, then click 'New registration'.",
      "Give the app a name (e.g. 'Dream Labs Bookings'), select 'Accounts in this organizational directory only', enter your redirect URI (provided by Dream Labs), and click Register.",
      "On the app Overview page, copy the Application (client) ID and paste it into Dream Labs as 'Client ID'.",
      "Go to Certificates & secrets > Client secrets > New client secret, set an expiry, click Add, and immediately copy the secret Value - paste it into Dream Labs as 'Client Secret'.",
      "Go to API permissions > Add a permission > Microsoft Graph > Delegated permissions, add BookingsAppointment.ReadWrite.All, then click 'Grant admin consent' - admin approval is required.",
      "Back in Dream Labs, click Connect and sign in with your Microsoft work account to complete authorization."
    ],
    "agentUsage": "GET https://graph.microsoft.com/v1.0/solutions/bookingBusinesses  Authorization: Bearer <access_token>",
    "docsUrl": "https://learn.microsoft.com/en-us/graph/api/resources/booking-api-overview?view=graph-rest-1.0",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      "tokenEp": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      "revokeEp": "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
      "scopes": [
        "offline_access",
        "BookingsAppointment.ReadWrite.All",
        "openid",
        "email",
        "profile"
      ],
      "userinfoEp": "https://graph.microsoft.com/oidc/userinfo",
      "extraParams": {
        "prompt": "consent"
      }
    },
    "appSetupNotes": "Go to https://entra.microsoft.com > Identity > App registrations > New registration. Give the app a name, choose 'Accounts in this organizational directory only' (Bookings requires a work/school account with Microsoft 365 Business Premium), and add your server's redirect URI (e.g. https://yourdomain.com/oauth/callback/microsoft-bookings) under 'Web' platform. After registering, go to Certificates & secrets > New client secret - copy the value immediately. Then go to API permissions > Add a permission > Microsoft Graph > Delegated permissions and add BookingsAppointment.ReadWrite.All. Click 'Grant admin consent' - admin consent is required for this scope. Copy the Application (client) ID from the Overview page. Note: Bookings.ReadWrite.All is NOT sufficient alone for appointment endpoints - BookingsAppointment.ReadWrite.All is required.",
    "inject": [
      {
        "env": "MICROSOFT_BOOKINGS_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "instagram",
    "name": "Instagram",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "instagram",
    "provider": "meta",
    "confidence": "high",
    "sources": [
      "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/",
      "https://developers.facebook.com/docs/instagram-platform/overview/",
      "https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/"
    ],
    "guide": [
      "Go to developers.facebook.com and sign in with your Facebook account.",
      "Click 'My Apps', then 'Create App'. Choose 'Business' as the app type, give it a name, and click 'Create'.",
      "On the App Dashboard, click 'Add Product', find 'Instagram', and click 'Set Up'.",
      "Under Instagram > API Setup, click 'Add Instagram Account' and connect your professional (business or creator) Instagram account.",
      "Under App Settings > Basic, copy your App ID and App Secret - paste these into the Dream Labs setup fields.",
      "Under Instagram > Business Login Settings, add the redirect URL shown in Dream Labs to 'Valid OAuth Redirect URIs', then save.",
      "Click 'Connect' in Dream Labs and approve the permission request in the Instagram login window that appears.",
      "Dream Labs will automatically exchange the short-lived token for a 60-day token and store it securely."
    ],
    "agentUsage": "POST https://graph.facebook.com/v22.0/{ig-user-id}/media_publish?access_token={INSTAGRAM_ACCESS_TOKEN} with body {\"creation_id\": \"<container_id>\"}",
    "docsUrl": "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://www.instagram.com/oauth/authorize",
      "tokenEp": "https://api.instagram.com/oauth/access_token",
      "revokeEp": "",
      "scopes": [
        "instagram_business_basic",
        "instagram_business_content_publish",
        "instagram_business_manage_comments"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to developers.facebook.com and create a new app (type: Business). Add the 'Instagram' product to the app. Under Instagram > API Setup, add your Instagram professional (business or creator) account as a test user. Under App Settings > Basic, note your App ID and App Secret. Under Instagram > Business Login Settings, add your redirect URI (e.g. https://your-server.com/oauth/callback/instagram) to 'Valid OAuth Redirect URIs'. Request the scopes instagram_business_basic, instagram_business_content_publish, and instagram_business_manage_comments. Short-lived tokens (1 hour) must be exchanged for long-lived tokens (60 days) via GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=APP_SECRET&access_token=SHORT_TOKEN.",
    "inject": [
      {
        "env": "INSTAGRAM_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "facebook",
    "name": "Facebook Pages",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "facebook",
    "provider": "meta",
    "confidence": "high",
    "sources": [
      "https://developers.facebook.com/docs/pages-api/",
      "https://developers.facebook.com/docs/pages-api/posts/",
      "https://developers.facebook.com/docs/pages-api/overview/",
      "https://developers.facebook.com/docs/facebook-login/guides/access-tokens/"
    ],
    "guide": [
      "Go to developers.facebook.com and sign in with the Facebook account that manages your Page.",
      "Click 'My Apps', then 'Create App'. Choose 'Business' as the app type, give it a name, and click 'Create'.",
      "On the App Dashboard, click 'Add Product', find 'Facebook Login for Business', and click 'Set Up'.",
      "Under Facebook Login > Settings, add the redirect URL shown in Dream Labs to 'Valid OAuth Redirect URIs', then save.",
      "Under App Settings > Basic, copy your App ID and App Secret - paste these into the Dream Labs setup fields.",
      "Click 'Connect' in Dream Labs. A Facebook window will open - approve the permissions and select which Page to connect.",
      "Dream Labs will automatically retrieve your Page access token from /me/accounts and store it securely.",
      "Test the connection by posting a draft message from the Dream Labs dashboard."
    ],
    "agentUsage": "POST https://graph.facebook.com/v22.0/{FACEBOOK_PAGE_ID}/feed with header Authorization: Bearer {FACEBOOK_PAGE_ACCESS_TOKEN} and body {\"message\": \"Hello from Dream Labs!\"}",
    "docsUrl": "https://developers.facebook.com/docs/pages-api/",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://www.facebook.com/v22.0/dialog/oauth",
      "tokenEp": "https://graph.facebook.com/v22.0/oauth/access_token",
      "revokeEp": "",
      "scopes": [
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_manage_metadata",
        "pages_show_list"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to developers.facebook.com and create a new app (type: Business). Add 'Facebook Login for Business' as a product. Under Facebook Login > Settings, add your redirect URI (e.g. https://your-server.com/oauth/callback/facebook) to 'Valid OAuth Redirect URIs'. Request the scopes pages_manage_posts, pages_read_engagement, pages_manage_metadata, and pages_show_list. After the user authorises, exchange the code for a user access token, then call GET https://graph.facebook.com/v22.0/me/accounts?access_token={USER_TOKEN} to retrieve the Page access token and Page ID for each page the user manages. Store the Page access token - it does not expire if the user keeps the app authorised.",
    "inject": [
      {
        "env": "FACEBOOK_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "messenger",
    "name": "Messenger",
    "category": "Messaging / inbox",
    "icon": "📨",
    "color": "#00A4EF",
    "brandSlug": "messenger",
    "provider": "meta",
    "confidence": "high",
    "sources": [
      "https://developers.facebook.com/docs/messenger-platform/",
      "https://developers.facebook.com/documentation/business-messaging/messenger-platform/send-messages",
      "https://developers.facebook.com/documentation/business-messaging/messenger-platform/overview"
    ],
    "guide": [
      "Go to developers.facebook.com and sign in with the Facebook account that manages your Page.",
      "Click 'My Apps', then 'Create App'. Choose 'Business' as the app type, give it a name, and click 'Create'.",
      "On the App Dashboard, click 'Add Product', find 'Messenger', and click 'Set Up'.",
      "Under Messenger > Settings, in the 'Access Tokens' section, select your Facebook Page from the dropdown and click 'Generate Token'. Copy this token.",
      "Also add 'Facebook Login for Business' as a product. Under its settings, add the redirect URL shown in Dream Labs to 'Valid OAuth Redirect URIs'.",
      "Under App Settings > Basic, copy your App ID and App Secret - paste all values into the Dream Labs setup fields.",
      "Click 'Connect' in Dream Labs. Approve the permissions in the Facebook window that appears.",
      "Test by sending a message through the Dream Labs dashboard to a Page visitor who has already messaged your Page."
    ],
    "agentUsage": "POST https://graph.facebook.com/v22.0/{MESSENGER_PAGE_ID}/messages with header Authorization: Bearer {MESSENGER_PAGE_ACCESS_TOKEN} and body {\"recipient\":{\"id\":\"<PSID>\"},\"messaging_type\":\"RESPONSE\",\"message\":{\"text\":\"Hello!\"}}",
    "docsUrl": "https://developers.facebook.com/docs/messenger-platform/",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://www.facebook.com/v22.0/dialog/oauth",
      "tokenEp": "https://graph.facebook.com/v22.0/oauth/access_token",
      "revokeEp": "",
      "scopes": [
        "pages_messaging",
        "pages_manage_metadata",
        "pages_read_engagement",
        "pages_show_list"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to developers.facebook.com and create a new app (type: Business). Add the 'Messenger' product. Under Messenger > Settings, select the Facebook Page you want to connect and generate a Page access token - copy it. Also add your webhook callback URL if you need to receive incoming messages. To use OAuth for end-user authorisation, add 'Facebook Login for Business' as well and add your redirect URI under its settings. Request the scopes pages_messaging, pages_manage_metadata, pages_read_engagement, and pages_show_list. After authorisation, retrieve the Page access token via /me/accounts and use it to call POST /{PAGE-ID}/messages. Note: The Messenger Send API requires the recipient to have first messaged your Page (within the 24-hour window) unless you are sending message templates.",
    "inject": [
      {
        "env": "MESSENGER_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "whatsapp",
    "name": "WhatsApp Business",
    "category": "Messaging / inbox",
    "icon": "📨",
    "color": "#00A4EF",
    "brandSlug": "whatsapp",
    "provider": "meta",
    "confidence": "high",
    "sources": [
      "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/",
      "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages/",
      "https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens/",
      "https://developers.facebook.com/docs/business-management-apis/system-users/install-apps-and-generate-tokens/"
    ],
    "guide": [
      "Go to developers.facebook.com, create a new app (type: Business), and add the 'WhatsApp' product to it.",
      "Under WhatsApp > API Setup, you will see a test phone number and a WhatsApp Business Account ID - copy the Business Account ID.",
      "Click 'Add a phone number' to register your real business phone number, or continue with the free test number for testing.",
      "Once your phone number is listed, copy the Phone Number ID shown next to it in the API Setup panel.",
      "Go to business.facebook.com > Business Settings > System Users. Click '+ Add' to create a system user with Admin role.",
      "Click the system user's name, then 'Generate Token'. Select your app, set expiration, and enable 'whatsapp_business_messaging' and 'whatsapp_business_management' permissions. Click 'Generate Token' and copy it.",
      "Paste the System User Access Token, Phone Number ID, and Business Account ID into the Dream Labs WhatsApp setup fields.",
      "Send a test message from the Dream Labs dashboard to verify the connection."
    ],
    "agentUsage": "POST https://graph.facebook.com/v22.0/{WHATSAPP_PHONE_NUMBER_ID}/messages with header Authorization: Bearer {WHATSAPP_ACCESS_TOKEN} and body {\"messaging_product\":\"whatsapp\",\"to\":\"15551234567\",\"type\":\"text\",\"text\":{\"body\":\"Hello from Dream Labs!\"}}",
    "docsUrl": "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "WHATSAPP_ACCESS_TOKEN",
        "label": "System User Access Token",
        "secret": true
      },
      {
        "name": "WHATSAPP_PHONE_NUMBER_ID",
        "label": "Business Phone Number ID",
        "secret": false
      },
      {
        "name": "WHATSAPP_BUSINESS_ACCOUNT_ID",
        "label": "WhatsApp Business Account ID",
        "secret": false
      }
    ],
    "apiBase": "https://graph.facebook.com/v22.0",
    "authHeader": "Authorization: Bearer <WHATSAPP_ACCESS_TOKEN>",
    "whereToGetKey": "In Meta Business Suite (business.facebook.com), go to Business Settings > System Users. Create a system user (Admin role), click 'Generate Token', select your WhatsApp app, set expiration to 'Never' or 60 days, and grant the 'whatsapp_business_messaging' and 'whatsapp_business_management' permissions. Your Phone Number ID and Business Account ID are found in the Meta App Dashboard under WhatsApp > API Setup.",
    "inject": [
      {
        "env": "WHATSAPP_ACCESS_TOKEN",
        "source": "field.WHATSAPP_ACCESS_TOKEN"
      },
      {
        "env": "WHATSAPP_PHONE_NUMBER_ID",
        "source": "field.WHATSAPP_PHONE_NUMBER_ID"
      },
      {
        "env": "WHATSAPP_BUSINESS_ACCOUNT_ID",
        "source": "field.WHATSAPP_BUSINESS_ACCOUNT_ID"
      }
    ]
  },
  {
    "id": "slack",
    "name": "Slack",
    "category": "Team chat / ops alerts",
    "icon": "💬",
    "color": "#4A154B",
    "brandSlug": "slack",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://docs.slack.dev/reference/methods/chat.postMessage",
      "https://api.slack.com/methods/chat.postMessage",
      "https://api.slack.com/bot-users",
      "https://api.slack.com/authentication/token-types"
    ],
    "guide": [
      "Open api.slack.com/apps in your browser and sign in to your Slack account.",
      "Click 'Create New App', choose 'From scratch', give it a name (e.g. 'Dream Labs'), and select your workspace.",
      "In the left sidebar, click 'OAuth & Permissions', scroll down to 'Bot Token Scopes', and click 'Add an OAuth Scope'.",
      "Add the scope 'chat:write' (this lets the bot post messages to channels it is invited to).",
      "Scroll back to the top of the 'OAuth & Permissions' page and click 'Install to Workspace', then click 'Allow'.",
      "After installation, copy the 'Bot User OAuth Token' - it starts with xoxb- and is shown on the same page.",
      "Paste that token into the Dream Labs Agent Server settings field labelled 'Bot Token (xoxb-...)'.",
      "In Slack, invite the bot to any channel you want it to post in by typing '/invite @YourBotName' in that channel."
    ],
    "agentUsage": "POST https://slack.com/api/chat.postMessage -H 'Authorization: Bearer xoxb-your-bot-token' -H 'Content-Type: application/json' -d '{\"channel\":\"C0123456789\",\"text\":\"Hello from Dream Labs Agent Server\"}'",
    "docsUrl": "https://docs.slack.dev/reference/methods/chat.postMessage",
    "auth": "apikey",
    "kind": "bot-token",
    "fields": [
      {
        "name": "bot_token",
        "label": "Bot Token (xoxb-...)",
        "secret": true
      }
    ],
    "apiBase": "https://slack.com/api",
    "authHeader": "Authorization: Bearer xoxb-your-bot-token",
    "whereToGetKey": "Go to api.slack.com/apps, select your app (or create one), click 'OAuth & Permissions' in the left sidebar, scroll to 'Bot Token Scopes' and add the 'chat:write' scope, then click 'Install to Workspace'. After installing, copy the 'Bot User OAuth Token' that starts with xoxb-.",
    "inject": [
      {
        "env": "SLACK_BOT_TOKEN",
        "source": "field.bot_token"
      }
    ]
  },
  {
    "id": "telegram",
    "name": "Telegram",
    "category": "Team chat / ops alerts",
    "icon": "💬",
    "color": "#4A154B",
    "brandSlug": "telegram",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://core.telegram.org/bots/api",
      "https://core.telegram.org/bots/tutorial",
      "https://core.telegram.org/bots"
    ],
    "guide": [
      "Open Telegram on any device and search for '@BotFather' in the search bar.",
      "Tap on BotFather (the verified one with a blue tick) and tap 'Start' or send /start.",
      "Send the command /newbot to BotFather.",
      "When prompted, enter a display name for your bot (e.g. 'Dream Labs Alerts'), then a username that ends in 'bot' (e.g. 'dreamlabs_alerts_bot').",
      "BotFather will reply with your bot token - it looks like '110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw'. Copy it.",
      "Paste the bot token into the Dream Labs Agent Server settings field labelled 'Bot Token'.",
      "Send a message to your bot in Telegram (just say 'hi'), then open https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates in a browser and copy the 'id' number inside the 'chat' object - this is your Chat ID.",
      "Paste the Chat ID into the 'Default Chat ID' field in Dream Labs Agent Server."
    ],
    "agentUsage": "POST https://api.telegram.org/bot123456:ABC-DEF1234/sendMessage -H 'Content-Type: application/json' -d '{\"chat_id\":\"987654321\",\"text\":\"Hello from Dream Labs Agent Server\"}'",
    "docsUrl": "https://core.telegram.org/bots/api",
    "auth": "apikey",
    "kind": "bot-token",
    "fields": [
      {
        "name": "bot_token",
        "label": "Bot Token",
        "secret": true
      },
      {
        "name": "chat_id",
        "label": "Default Chat ID (your user ID or group ID to send alerts to)",
        "secret": false
      }
    ],
    "apiBase": "https://api.telegram.org/bot{token}",
    "authHeader": "Token embedded in URL path: https://api.telegram.org/bot<YOUR_TOKEN>/METHOD",
    "whereToGetKey": "Open Telegram and search for @BotFather. Send /newbot, follow the prompts (provide a display name and username ending in 'bot'), and BotFather will reply with your bot token (format: 123456789:ABCdef...). To get your Chat ID, send any message to your bot, then open https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates in a browser - the 'id' field inside 'chat' is your Chat ID.",
    "inject": [
      {
        "env": "TELEGRAM_BOT_TOKEN",
        "source": "field.bot_token"
      },
      {
        "env": "TELEGRAM_CHAT_ID",
        "source": "field.chat_id"
      }
    ]
  },
  {
    "id": "discord",
    "name": "Discord",
    "category": "Team chat / ops alerts",
    "icon": "💬",
    "color": "#4A154B",
    "brandSlug": "discord",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://docs.discord.com/developers/reference",
      "https://docs.discord.com/developers/resources/channel",
      "https://docs.discord.com/developers/quick-start/getting-started",
      "https://docs.discord.com/developers/topics/oauth2",
      "https://docs.discord.com/developers/bots/overview"
    ],
    "guide": [
      "Open discord.com/developers/applications in your browser and sign in with your Discord account.",
      "Click 'New Application', give it a name (e.g. 'Dream Labs'), and click 'Create'.",
      "In the left sidebar, click 'Bot'. Then click 'Reset Token', confirm the prompt, and immediately copy the token shown - it will not be displayed again.",
      "Paste the bot token into the Dream Labs Agent Server settings field labelled 'Bot Token'.",
      "Still in the Developer Portal, click 'OAuth2' in the sidebar, then 'URL Generator'. Check the 'bot' scope, then check the 'Send Messages' permission that appears below.",
      "Copy the generated URL at the bottom, open it in your browser, select your server from the dropdown, and click 'Authorise'.",
      "In Discord, right-click the channel you want the agent to post in, click 'Copy Channel ID' (you may need to enable Developer Mode in Settings - Advanced first), and paste it into the 'Default Channel ID' field in Dream Labs Agent Server."
    ],
    "agentUsage": "POST https://discord.com/api/v10/channels/1234567890123456789/messages -H 'Authorization: Bot your-bot-token' -H 'Content-Type: application/json' -d '{\"content\":\"Hello from Dream Labs Agent Server\"}'",
    "docsUrl": "https://docs.discord.com/developers/resources/channel",
    "auth": "apikey",
    "kind": "bot-token",
    "fields": [
      {
        "name": "bot_token",
        "label": "Bot Token",
        "secret": true
      },
      {
        "name": "channel_id",
        "label": "Default Channel ID (right-click a channel and copy ID)",
        "secret": false
      }
    ],
    "apiBase": "https://discord.com/api/v10",
    "authHeader": "Authorization: Bot your-bot-token",
    "whereToGetKey": "Go to discord.com/developers/applications, click 'New Application', give it a name, then click 'Bot' in the left sidebar. Click 'Reset Token' to generate a bot token and copy it immediately (it is only shown once). Enable 'Send Messages' under Bot Permissions. Use the OAuth2 URL Generator (Bot scope + Send Messages permission) to invite the bot to your server.",
    "inject": [
      {
        "env": "DISCORD_BOT_TOKEN",
        "source": "field.bot_token"
      },
      {
        "env": "DISCORD_CHANNEL_ID",
        "source": "field.channel_id"
      }
    ]
  },
  {
    "id": "hubspot",
    "name": "HubSpot",
    "category": "CRM & sales",
    "icon": "📇",
    "color": "#FF7A59",
    "brandSlug": "hubspot",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.hubspot.com/docs/apps/legacy-apps/private-apps/overview",
      "https://unified.to/blog/how_to_set_up_your_scopes_in_hubspot",
      "https://www.getknit.dev/blog/hubspot-api-directory-oD0RSt"
    ],
    "guide": [
      "Log in to your HubSpot account and click the gear icon (Settings) in the top navigation bar.",
      "In the left sidebar, scroll to Integrations and click Private Apps.",
      "Click Create a private app, enter a name (e.g. Dream Labs Agent), and click the Scopes tab.",
      "Search for and enable these scopes: crm.objects.contacts.read, crm.objects.contacts.write, crm.objects.deals.read, crm.objects.deals.write.",
      "Click Create app and confirm. HubSpot will display your access token once.",
      "Click Show token, then Copy to copy the long token string.",
      "Paste the token into the Dream Labs dashboard under HubSpot > Private App Access Token and click Save."
    ],
    "agentUsage": "POST https://api.hubapi.com/crm/v3/objects/contacts  Authorization: Bearer $HUBSPOT_ACCESS_TOKEN",
    "docsUrl": "https://developers.hubspot.com/docs/apps/legacy-apps/private-apps/overview",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "access_token",
        "label": "Private App Access Token",
        "secret": true
      }
    ],
    "apiBase": "https://api.hubapi.com",
    "authHeader": "Authorization: Bearer <token>",
    "whereToGetKey": "HubSpot account > Settings > Integrations > Private Apps > Create a private app > Auth tab > Show token. You must be a super admin. Grant at minimum the scopes: crm.objects.contacts.read, crm.objects.contacts.write, crm.objects.deals.read, crm.objects.deals.write.",
    "inject": [
      {
        "env": "HUBSPOT_ACCESS_TOKEN",
        "source": "field.access_token"
      }
    ]
  },
  {
    "id": "pipedrive",
    "name": "Pipedrive",
    "category": "CRM & sales",
    "icon": "📇",
    "color": "#FF7A59",
    "brandSlug": "pipedrive",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://pipedrive.readme.io/docs/core-api-concepts-authentication",
      "https://pipedrive.readme.io/docs/how-to-find-the-api-token",
      "https://support.pipedrive.com/en/article/how-can-i-find-my-personal-api-key",
      "https://www.innovaty.co/guide/pipedrive-api-v2-migration"
    ],
    "guide": [
      "Log in to Pipedrive and click your company name or avatar in the top-right corner.",
      "Select Company settings from the dropdown menu.",
      "Go to Personal preferences in the left sidebar.",
      "Click the API tab - your API token is shown here.",
      "Click the copy icon to copy the token.",
      "Paste the token into the Dream Labs dashboard under Pipedrive > API Token.",
      "Also enter your Pipedrive company domain (the part before .pipedrive.com in your browser URL) and click Save."
    ],
    "agentUsage": "GET https://api.pipedrive.com/api/v2/deals  x-api-token: $PIPEDRIVE_API_TOKEN",
    "docsUrl": "https://pipedrive.readme.io/docs/core-api-concepts-authentication",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_token",
        "label": "API Token",
        "secret": true
      },
      {
        "name": "company_domain",
        "label": "Company Domain (e.g. mycompany)",
        "secret": false
      }
    ],
    "apiBase": "https://api.pipedrive.com/api/v2",
    "authHeader": "x-api-token: <token>",
    "whereToGetKey": "Pipedrive app > click your account name (top right) > Company settings > Personal preferences > API tab. Copy the token shown. Note: one active token exists per user per company.",
    "inject": [
      {
        "env": "PIPEDRIVE_API_TOKEN",
        "source": "field.api_token"
      },
      {
        "env": "PIPEDRIVE_COMPANY_DOMAIN",
        "source": "field.company_domain"
      }
    ]
  },
  {
    "id": "salesforce",
    "name": "Salesforce",
    "category": "CRM & sales",
    "icon": "📇",
    "color": "#FF7A59",
    "brandSlug": "salesforce",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_oauth_and_connected_apps.htm",
      "https://developer.salesforce.com/docs/platform/mobile-sdk/guide/oauth-scope-parameter-values.html",
      "https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_api_integration.htm&language=en_US&type=5",
      "https://developer.salesforce.com/blogs/2024/02/invoke-rest-apis-with-the-salesforce-integration-user-and-oauth-client-credentials"
    ],
    "guide": [
      "Log in to Salesforce and click the gear icon (Setup) in the top-right corner.",
      "In the Quick Find search box type App Manager and click the result.",
      "Click New Connected App in the top right.",
      "Enter a Connected App Name (e.g. Dream Labs Agent), an API Name, and your Contact Email.",
      "Check the box Enable OAuth Settings. Set Callback URL to the redirect URI provided by Dream Labs (e.g. https://yourdomain.com/oauth/salesforce/callback).",
      "Under Selected OAuth Scopes, add Access and manage your data (api) and Perform requests on your behalf at any time (refresh_token, offline_access). Click Save.",
      "Wait 2-10 minutes for Salesforce to activate the app, then open the app and click Manage Consumer Details.",
      "Copy the Consumer Key and Consumer Secret and paste them into the Dream Labs dashboard under Salesforce. Also copy your instance URL (e.g. https://mycompany.my.salesforce.com) and paste it as the Instance URL. Click Save."
    ],
    "agentUsage": "GET https://<instance>.my.salesforce.com/services/data/v59.0/sobjects/Contact  Authorization: Bearer $SALESFORCE_ACCESS_TOKEN",
    "docsUrl": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_oauth_and_connected_apps.htm",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://login.salesforce.com/services/oauth2/authorize",
      "tokenEp": "https://login.salesforce.com/services/oauth2/token",
      "revokeEp": "https://login.salesforce.com/services/oauth2/revoke",
      "scopes": [
        "api",
        "refresh_token",
        "offline_access"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "In Salesforce Setup, search App Manager in Quick Find and click it. Click New Connected App. Fill in the Connected App Name, API Name, and Contact Email. Check Enable OAuth Settings. Set the Callback URL to your agent server redirect URI (e.g. https://yourdomain.com/oauth/salesforce/callback). Under Selected OAuth Scopes add: Access and manage your data (api), Perform requests on your behalf at any time (refresh_token, offline_access). Click Save. After a few minutes, copy the Consumer Key (client_id) and Consumer Secret (client_secret) from the app detail page. Note: sandbox orgs use test.salesforce.com instead of login.salesforce.com.",
    "inject": [
      {
        "env": "SALESFORCE_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "apollo",
    "name": "Apollo.io",
    "category": "CRM & sales",
    "icon": "📇",
    "color": "#FF7A59",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://docs.apollo.io/docs/create-api-key",
      "https://docs.apollo.io/reference/authentication",
      "https://docs.apollo.io/docs/api-overview",
      "https://docs.apollo.io/reference/people-api-search"
    ],
    "guide": [
      "Log in to Apollo.io and click Settings in the left sidebar.",
      "Click Integrations, then select API Keys.",
      "Click Create new key.",
      "Enter a name for the key (e.g. Dream Labs Agent) and optionally a description.",
      "Toggle Set as master key to grant access to all endpoints, or manually check each endpoint you need.",
      "Click Create API key. Copy the key immediately - it is shown only once.",
      "Paste the key into the Dream Labs dashboard under Apollo.io > API Key and click Save."
    ],
    "agentUsage": "POST https://api.apollo.io/api/v1/mixed_people/api_search  x-api-key: $APOLLO_API_KEY  Content-Type: application/json",
    "docsUrl": "https://docs.apollo.io/docs/create-api-key",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.apollo.io/api/v1",
    "authHeader": "x-api-key: <key>",
    "whereToGetKey": "Apollo app > Settings > Integrations > API Keys > Create new key. Give it a name, select the endpoints it can access (or toggle Set as master key for full access). Copy the key immediately after creation - it is only shown once. Note: as of September 2024, keys must be passed in the x-api-key header only; query/body parameter auth is no longer supported.",
    "inject": [
      {
        "env": "APOLLO_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "activecampaign",
    "name": "ActiveCampaign",
    "category": "CRM & sales",
    "icon": "📇",
    "color": "#FF7A59",
    "brandSlug": "activecampaign",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.activecampaign.com/reference/authentication",
      "https://developers.activecampaign.com/reference/url",
      "https://help.activecampaign.com/hc/en-us/articles/207317590-Getting-started-with-the-API",
      "https://developers.activecampaign.com/reference/list-all-contacts"
    ],
    "guide": [
      "Log in to ActiveCampaign and click the gear icon (Settings) in the bottom-left corner.",
      "Select Developer from the settings menu.",
      "On the Developer page you will see your API URL (e.g. https://myaccount.api-us1.com) and your API Key.",
      "Copy the full API URL including https:// and paste it into the Dream Labs dashboard under ActiveCampaign > API URL.",
      "Copy the API Key and paste it under ActiveCampaign > API Key.",
      "Click Save. Dream Labs will use the header Api-Token: <your-key> on every request to your account URL."
    ],
    "agentUsage": "GET https://<your-account>.api-us1.com/api/3/contacts  Api-Token: $ACTIVECAMPAIGN_API_KEY",
    "docsUrl": "https://developers.activecampaign.com/reference/authentication",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_url",
        "label": "API URL (e.g. https://myaccount.api-us1.com)",
        "secret": false
      },
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://<your-account>.api-us1.com/api/3",
    "authHeader": "Api-Token: <key>",
    "whereToGetKey": "ActiveCampaign account > Settings (gear icon) > Developer tab. Both your API URL and API Key are displayed on this page. The API URL is account-specific and looks like https://youraccountname.api-us1.com.",
    "inject": [
      {
        "env": "ACTIVECAMPAIGN_API_URL",
        "source": "field.api_url"
      },
      {
        "env": "ACTIVECAMPAIGN_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "xero",
    "name": "Xero",
    "category": "Accounting",
    "icon": "📒",
    "color": "#13B5EA",
    "brandSlug": "xero",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.xero.com/documentation/guides/oauth2/overview/",
      "https://developer.xero.com/documentation/guides/oauth2/auth-flow/",
      "https://developer.xero.com/documentation/guides/oauth2/scopes/",
      "https://developer.xero.com/faq/granular-scopes",
      "https://www.apideck.com/blog/xero-scopes",
      "https://docs.codat.io/integrations/accounting/xero/partner-certification/scopes"
    ],
    "guide": [
      "Go to https://developer.xero.com and sign in or create a free account.",
      "Click 'My Apps' in the top navigation, then click 'New app'.",
      "Choose 'Web app', enter your app name, and set the redirect URI to https://YOUR_SERVER/oauth/callback/xero.",
      "Save the app - copy the Client ID and Client Secret from the app detail page.",
      "Paste the Client ID, Client Secret, and redirect URI into the Dream Labs dashboard.",
      "Click 'Connect Xero' - you will be sent to Xero's login page.",
      "Sign in to Xero and click 'Allow access' to approve the requested permissions.",
      "Select which Xero organisation to connect, then you will be redirected back - the connection is active."
    ],
    "agentUsage": "GET https://api.xero.com/api.xro/2.0/Invoices Authorization: Bearer <access_token> Xero-tenant-id: <tenant_id>",
    "docsUrl": "https://developer.xero.com/documentation/guides/oauth2/overview/",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://login.xero.com/identity/connect/authorize",
      "tokenEp": "https://identity.xero.com/connect/token",
      "revokeEp": "https://identity.xero.com/connect/revocation",
      "scopes": [
        "offline_access",
        "accounting.settings",
        "accounting.invoices",
        "accounting.invoices.read",
        "accounting.contacts",
        "accounting.contacts.read",
        "accounting.payments"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://developer.xero.com and sign in. Click 'My Apps' then 'New app'. Choose 'Web app'. Enter your app name and company URL. Set the redirect URI to https://YOUR_SERVER/oauth/callback/xero (must match exactly). Copy the Client ID and Client Secret shown on the app detail page. IMPORTANT: Apps created on or after March 2, 2026 must use granular scopes only (e.g. accounting.invoices.read, accounting.invoices, accounting.contacts) - the broad accounting.transactions scope is not available to new apps.",
    "inject": [
      {
        "env": "XERO_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "quickbooks",
    "name": "QuickBooks Online",
    "category": "Accounting",
    "icon": "📒",
    "color": "#13B5EA",
    "brandSlug": "quickbooks",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0",
      "https://satvasolutions.com/blog/quickbooks-online-api-guide",
      "https://satvasolutions.com/blog/quickbooks-online-app-using-intuit-developer-portal",
      "https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/set-redirect-uri",
      "https://zuplo.com/learning-center/quickbooks-api"
    ],
    "guide": [
      "Go to https://developer.intuit.com and create a free Intuit developer account.",
      "Click 'My Apps' then 'Create an app', and select 'QuickBooks Online and Payments'.",
      "Enter a name for your app and save - you will see your Client ID and Client Secret.",
      "Under 'Redirect URIs', click 'Add URI' and enter https://YOUR_SERVER/oauth/callback/quickbooks.",
      "Copy the Client ID and Client Secret into the Dream Labs dashboard.",
      "Click 'Connect QuickBooks' - you will be sent to Intuit's sign-in page.",
      "Sign in with your QuickBooks account and click 'Connect' to grant access.",
      "You will be redirected back - your Company ID (realmId) is captured automatically and all API calls are now active."
    ],
    "agentUsage": "GET https://quickbooks.api.intuit.com/v3/company/{realmId}/invoice/1 Authorization: Bearer <access_token> Accept: application/json",
    "docsUrl": "https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://appcenter.intuit.com/connect/oauth2",
      "tokenEp": "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      "revokeEp": "https://developer.api.intuit.com/v2/oauth2/tokens/revoke",
      "scopes": [
        "com.intuit.quickbooks.accounting",
        "openid",
        "profile",
        "email"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://developer.intuit.com and sign in or create a free account. Click 'My Apps' then 'Create an app'. Select 'QuickBooks Online and Payments'. Enter your app name, then under 'Keys and credentials' find your Client ID and Client Secret. Under 'Redirect URIs' click 'Add URI' and enter https://YOUR_SERVER/oauth/callback/quickbooks. Save. Use the same credentials for both sandbox (testing) and production - switch via the environment toggle in the dashboard. The realmId (company ID) is returned in the OAuth callback and must be stored - it is required in every API request URL.",
    "inject": [
      {
        "env": "QUICKBOOKS_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "wave",
    "name": "Wave",
    "category": "Accounting",
    "icon": "📒",
    "color": "#13B5EA",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.waveapps.com/hc/en-us/articles/360018856751-Authentication",
      "https://developer.waveapps.com/hc/en-us/articles/360019968212-API-Reference",
      "https://developer.waveapps.com/hc/en-us/articles/360019762711-Manage-Applications",
      "https://www.getknit.dev/blog/wave-financial-api-integration-guide-in-depth",
      "https://developer.waveapps.com/hc/en-us/articles/360019493652-OAuth-Guide"
    ],
    "guide": [
      "Make sure your Wave account has an active Pro or Wave Advisor subscription - free accounts cannot use the API.",
      "Go to https://developer.waveapps.com and sign in with your Wave account.",
      "Click 'Manage Applications' in the left navigation.",
      "Click 'Get started' (if first time) or select an existing app, then click 'Create token'.",
      "Copy the full access token that appears - store it securely, as it will not be shown again.",
      "Paste the token into the Dream Labs dashboard under Wave - Full Access Token.",
      "Save - all GraphQL requests will now be authenticated as your Wave user."
    ],
    "agentUsage": "POST https://gql.waveapps.com/graphql/public Authorization: Bearer <token> Content-Type: application/json body: {\"query\": \"query { user { businesses(first: 10) { edges { node { id name } } } } }\"}",
    "docsUrl": "https://developer.waveapps.com/hc/en-us/articles/360018856751-Authentication",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "access_token",
        "label": "Full Access Token",
        "secret": true
      }
    ],
    "apiBase": "https://gql.waveapps.com/graphql/public",
    "authHeader": "Authorization: Bearer <token>",
    "whereToGetKey": "Log in to Wave, go to https://developer.waveapps.com, navigate to 'Manage Applications', create or select an app, then click 'Create token' to generate a full access token. Note: Wave requires an active Pro or Wave Advisor subscription on your business to use the API. Full access tokens are for personal/single-account use - for multi-user apps Wave requires OAuth.",
    "inject": [
      {
        "env": "WAVE_ACCESS_TOKEN",
        "source": "field.access_token"
      }
    ]
  },
  {
    "id": "freshbooks",
    "name": "FreshBooks",
    "category": "Accounting",
    "icon": "📒",
    "color": "#13B5EA",
    "brandSlug": "freshbooks",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://www.freshbooks.com/api/authentication",
      "https://www.freshbooks.com/api/scopes",
      "https://www.freshbooks.com/api/invoices",
      "https://www.freshbooks.com/api/authenticating-with-oauth-2-0-on-the-new-freshbooks-api",
      "https://truto.one/blog/how-to-integrate-with-the-freshbooks-api-2026-engineering-guide/"
    ],
    "guide": [
      "Go to https://my.freshbooks.com/#/developer and sign in to your FreshBooks account.",
      "Click 'Create New App' and enter a name for your application.",
      "In the Redirect URI field, enter https://YOUR_SERVER/oauth/callback/freshbooks (must be HTTPS, no query parameters).",
      "Save the app - scroll to the bottom under App Settings to find your Client ID and Client Secret.",
      "Copy both credentials into the Dream Labs dashboard.",
      "Click 'Connect FreshBooks' - you will be sent to FreshBooks to sign in and approve permissions.",
      "After approving, you are redirected back - your Account ID is captured automatically from the /me endpoint.",
      "The connection is live - invoices, clients, expenses, and bills are all accessible."
    ],
    "agentUsage": "GET https://api.freshbooks.com/accounting/account/{accountId}/invoices/invoices Authorization: Bearer <access_token>",
    "docsUrl": "https://www.freshbooks.com/api/authentication",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://auth.freshbooks.com/oauth/authorize",
      "tokenEp": "https://api.freshbooks.com/auth/oauth/token",
      "revokeEp": "https://api.freshbooks.com/auth/oauth/revoke",
      "scopes": [
        "user:profile:read",
        "user:invoices:read",
        "user:invoices:write",
        "user:clients:read",
        "user:clients:write",
        "user:expenses:read",
        "user:bills:read",
        "user:bills:write",
        "user:payments:read"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://my.freshbooks.com/#/developer and sign in. Click 'Create New App'. Enter your app name. In the 'Redirect URI' field enter https://YOUR_SERVER/oauth/callback/freshbooks (HTTPS required, no query string parameters allowed; you can add multiple URIs on separate lines). Save the app - your Client ID and Client Secret appear at the bottom under App Settings. Copy both immediately. Note: user:profile:read is automatically added to all new apps and is required for basic API calls. Scopes cannot be removed from an existing token - plan your scope list carefully before the first authorization.",
    "inject": [
      {
        "env": "FRESHBOOKS_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "stripe",
    "name": "Stripe",
    "category": "Payments",
    "icon": "💳",
    "color": "#635BFF",
    "brandSlug": "stripe",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://docs.stripe.com/keys/restricted-api-keys",
      "https://docs.stripe.com/api/authentication"
    ],
    "guide": [
      "Log in to your Stripe Dashboard at dashboard.stripe.com.",
      "Click 'Developers' in the left sidebar, then select 'API keys'.",
      "Click 'Create restricted key' and give it a descriptive name (e.g. 'Dream Labs Agent').",
      "For each resource your agent needs, choose Read (for looking things up) or Write (for creating/updating). A good starting set for payment management is: Charges - Read, PaymentIntents - Write, Customers - Write, Invoices - Write.",
      "Click 'Create key' and complete the two-factor verification prompt.",
      "Copy the key immediately - Stripe will not show it again. It starts with rk_live_.",
      "Paste the key into the Dream Labs dashboard under Stripe > Restricted API Key."
    ],
    "agentUsage": "GET https://api.stripe.com/v1/charges Authorization: Bearer rk_live_xxxxxxxxxxxx",
    "docsUrl": "https://docs.stripe.com/keys/restricted-api-keys",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "STRIPE_API_KEY",
        "label": "Restricted API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.stripe.com/v1",
    "authHeader": "Authorization: Bearer rk_live_...",
    "whereToGetKey": "Log in to the Stripe Dashboard, go to Developers > API keys, click 'Create restricted key', give it a name, set the permissions your agent needs (Read for GET operations, Write for POST/DELETE), click 'Create key', verify with 2FA, then copy the key immediately - it is shown only once. Keys start with rk_live_ (production) or rk_test_ (test).",
    "inject": [
      {
        "env": "STRIPE_API_KEY",
        "source": "field.STRIPE_API_KEY"
      }
    ]
  },
  {
    "id": "square",
    "name": "Square",
    "category": "Payments",
    "icon": "💳",
    "color": "#635BFF",
    "brandSlug": "square",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.squareup.com/docs/build-basics/access-tokens",
      "https://developer.squareup.com/docs/oauth-api/overview",
      "https://developer.squareup.com/docs/oauth-api/square-permissions",
      "https://developer.squareup.com/reference/square/o-auth-api/obtain-token",
      "https://developer.squareup.com/reference/square/o-auth-api/revoke-token"
    ],
    "guide": [
      "Go to https://developer.squareup.com and log in with your Square account.",
      "Click 'Applications' and then 'Create Your First Application' (or open an existing one).",
      "Give the app a name (e.g. 'Dream Labs Agent') and click 'Save'.",
      "In the left menu of your app, click 'OAuth'. Set the Redirect URL to the callback URL shown in your Dream Labs dashboard.",
      "Copy the 'Application ID' and reveal and copy the 'Application Secret'.",
      "Paste both values into the Dream Labs dashboard under Square > Client ID and Client Secret.",
      "Back in Dream Labs, click 'Connect Square Account' and log in to your Square seller account to grant permissions.",
      "Dream Labs will store the resulting access token - your agent is ready to use."
    ],
    "agentUsage": "GET https://connect.squareup.com/v2/payments Authorization: Bearer EAAAExxxxxxxxxxxxxxxxxx",
    "docsUrl": "https://developer.squareup.com/docs/oauth-api/overview",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://connect.squareup.com/oauth2/authorize",
      "tokenEp": "https://connect.squareup.com/oauth2/token",
      "revokeEp": "https://connect.squareup.com/oauth2/revoke",
      "scopes": [
        "MERCHANT_PROFILE_READ",
        "PAYMENTS_READ",
        "PAYMENTS_WRITE",
        "ORDERS_READ",
        "ORDERS_WRITE",
        "INVOICES_READ",
        "INVOICES_WRITE"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://developer.squareup.com, click 'Open' on an existing app or 'Create Your First Application'. In the app settings, click the 'OAuth' section in the left menu. Add your redirect URI (e.g. https://YOUR-SERVER-DOMAIN/oauth/square/callback) to the 'Redirect URL' field. Copy the Application ID and Application Secret from the OAuth page - these are your client_id and client_secret. Ensure 'Production' mode is selected when you are ready to go live.",
    "inject": [
      {
        "env": "SQUARE_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "paypal",
    "name": "PayPal",
    "category": "Payments",
    "icon": "💳",
    "color": "#635BFF",
    "brandSlug": "paypal",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.paypal.com/api/rest/authentication/",
      "https://developer.paypal.com/reference/get-an-access-token/",
      "https://developer.paypal.com/api/rest/production/"
    ],
    "guide": [
      "Log in to https://developer.paypal.com with your PayPal Business or Premier account.",
      "Click 'Apps & Credentials' in the top navigation.",
      "Switch to the 'Live' tab (not Sandbox).",
      "Click 'Create App', enter a name like 'Dream Labs Agent', and click 'Create App'.",
      "On the app detail page, copy the 'Client ID' shown at the top.",
      "Click 'Show' next to 'Secret' and copy the Client Secret.",
      "Paste both values into the Dream Labs dashboard under PayPal > Client ID and Client Secret.",
      "Dream Labs will automatically exchange these for a Bearer token before each API call - no extra steps needed."
    ],
    "agentUsage": "POST https://api-m.paypal.com/v2/payments/captures/{capture_id}/refund Authorization: Bearer <access_token_obtained_via_client_credentials_flow>",
    "docsUrl": "https://developer.paypal.com/api/rest/authentication/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "PAYPAL_CLIENT_ID",
        "label": "Client ID",
        "secret": false
      },
      {
        "name": "PAYPAL_CLIENT_SECRET",
        "label": "Client Secret",
        "secret": true
      }
    ],
    "apiBase": "https://api-m.paypal.com",
    "authHeader": "Authorization: Bearer <access_token>",
    "whereToGetKey": "Log in at https://developer.paypal.com, click 'Log in to Dashboard', then go to 'Apps & Credentials'. Switch to the 'Live' tab. Click 'Create App', give it a name, and click 'Create App'. Your Client ID is shown immediately; click 'Show' next to Secret to reveal and copy it. The agent exchanges these credentials for a short-lived Bearer token via POST https://api-m.paypal.com/v1/oauth2/token using HTTP Basic Auth (client_id:client_secret) and body grant_type=client_credentials.",
    "inject": [
      {
        "env": "PAYPAL_CLIENT_ID",
        "source": "field.PAYPAL_CLIENT_ID"
      },
      {
        "env": "PAYPAL_CLIENT_SECRET",
        "source": "field.PAYPAL_CLIENT_SECRET"
      }
    ]
  },
  {
    "id": "shopify",
    "name": "Shopify",
    "category": "E-commerce",
    "icon": "🛒",
    "color": "#96BF48",
    "brandSlug": "shopify",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin",
      "https://shopify.dev/docs/api/admin-rest",
      "https://shopify.dev/docs/api/usage/authentication"
    ],
    "guide": [
      "Log in to your Shopify admin at https://{your-store}.myshopify.com/admin.",
      "Go to Settings (bottom-left) then click Apps and sales channels.",
      "Click Develop apps at the top-right, then Create an app and give it a name like 'Agent Server'.",
      "Click Configure Admin API scopes and tick the permissions you need - for typical use tick read_orders, write_orders, read_products, write_products, read_customers, write_customers.",
      "Click Save, then click Install app and confirm.",
      "Under API credentials, click Reveal token once - copy it immediately as it is shown only once.",
      "Paste the token into the Admin API Access Token field and enter your shop domain (e.g. my-store.myshopify.com) into the Shop Domain field.",
      "Click Save - your agents can now read and write orders, products, and customers."
    ],
    "agentUsage": "GET https://{shop}.myshopify.com/admin/api/2026-01/orders.json X-Shopify-Access-Token: <token>",
    "docsUrl": "https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "shopify_access_token",
        "label": "Admin API Access Token",
        "secret": true
      },
      {
        "name": "shopify_shop_domain",
        "label": "Shop Domain (e.g. my-store.myshopify.com)",
        "secret": false
      }
    ],
    "apiBase": "https://{shop}.myshopify.com/admin/api/2026-01",
    "authHeader": "X-Shopify-Access-Token: <token>",
    "whereToGetKey": "Shopify Admin > Settings > Apps and sales channels > Develop apps > Create an app > Configure Admin API scopes > Install app > Reveal token once.",
    "inject": [
      {
        "env": "SHOPIFY_ACCESS_TOKEN",
        "source": "field.shopify_access_token"
      },
      {
        "env": "SHOPIFY_SHOP_DOMAIN",
        "source": "field.shopify_shop_domain"
      }
    ]
  },
  {
    "id": "woocommerce",
    "name": "WooCommerce",
    "category": "E-commerce",
    "icon": "🛒",
    "color": "#96BF48",
    "brandSlug": "woocommerce",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.woocommerce.com/docs/apis/rest-api/authentication/",
      "https://developer.woocommerce.com/docs/apis/rest-api/",
      "https://woocommerce.com/document/woocommerce-rest-api/"
    ],
    "guide": [
      "Log in to your WordPress admin dashboard.",
      "In the left menu go to WooCommerce then Settings.",
      "Click the Advanced tab at the top of the Settings page.",
      "Click REST API in the sub-menu, then click Add Key.",
      "Enter a description (e.g. 'Agent Server'), select your WordPress user, and set Permissions to Read/Write.",
      "Click Generate API Key - a Consumer Key (starting with ck_) and a Consumer Secret (starting with cs_) will appear.",
      "Copy both values immediately - the Consumer Secret is shown only once.",
      "Paste the Consumer Key, Consumer Secret, and your store URL (e.g. https://my-store.com) into the connection fields and click Save."
    ],
    "agentUsage": "GET https://{your-site}/wp-json/wc/v3/orders Authorization: Basic base64(ck_xxxx:cs_xxxx)",
    "docsUrl": "https://developer.woocommerce.com/docs/apis/rest-api/authentication/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "woocommerce_consumer_key",
        "label": "Consumer Key (ck_...)",
        "secret": false
      },
      {
        "name": "woocommerce_consumer_secret",
        "label": "Consumer Secret (cs_...)",
        "secret": true
      },
      {
        "name": "woocommerce_site_url",
        "label": "Site URL (e.g. https://my-store.com)",
        "secret": false
      }
    ],
    "apiBase": "https://{your-site}/wp-json/wc/v3",
    "authHeader": "Authorization: Basic base64(<consumer_key>:<consumer_secret>)",
    "whereToGetKey": "WordPress admin > WooCommerce > Settings > Advanced > REST API > Add Key. Set permissions to Read/Write, click Generate API Key, then copy the Consumer Key and Consumer Secret shown once.",
    "inject": [
      {
        "env": "WOOCOMMERCE_CONSUMER_KEY",
        "source": "field.woocommerce_consumer_key"
      },
      {
        "env": "WOOCOMMERCE_CONSUMER_SECRET",
        "source": "field.woocommerce_consumer_secret"
      },
      {
        "env": "WOOCOMMERCE_SITE_URL",
        "source": "field.woocommerce_site_url"
      }
    ]
  },
  {
    "id": "calendly",
    "name": "Calendly",
    "category": "Calendar & scheduling",
    "icon": "📅",
    "color": "#0069FF",
    "brandSlug": "calendly",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.calendly.com/how-to-authenticate-with-personal-access-tokens",
      "https://developer.calendly.com/personal-access-tokens",
      "https://developer.calendly.com/getting-started"
    ],
    "guide": [
      "Log in to your Calendly account at calendly.com.",
      "Click your avatar in the top-right corner and choose 'Integrations'.",
      "Find the 'API & Webhooks' tile and click it.",
      "Under 'Personal Access Tokens', click 'Get a token now' (or 'Generate new token' if you already have one).",
      "Give the token a name (e.g. 'Dream Labs Agent'), then click 'Create Token'.",
      "Copy the token immediately - Calendly will not show it again.",
      "Paste the token into the Dream Labs dashboard under the Calendly connector."
    ],
    "agentUsage": "GET https://api.calendly.com/users/me  Authorization: Bearer $CALENDLY_API_TOKEN",
    "docsUrl": "https://developer.calendly.com/how-to-authenticate-with-personal-access-tokens",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "personal_access_token",
        "label": "Personal Access Token",
        "secret": true
      }
    ],
    "apiBase": "https://api.calendly.com",
    "authHeader": "Authorization: Bearer <personal_access_token>",
    "whereToGetKey": "Calendly account -> Integrations -> API & Webhooks tile -> Personal Access Tokens section. Click 'Get a token now' or 'Generate new token', name it, click 'Create Token', then copy it immediately - Calendly does not show it again.",
    "inject": [
      {
        "env": "CALENDLY_PERSONAL_ACCESS_TOKEN",
        "source": "field.personal_access_token"
      }
    ]
  },
  {
    "id": "cal-com",
    "name": "Cal.com",
    "category": "Calendar & scheduling",
    "icon": "📅",
    "color": "#0069FF",
    "brandSlug": "caldotcom",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://cal.com/docs/api-reference/v2/introduction",
      "https://cal.com/blog/where-is-my-api-key-and-what-can-it-do",
      "https://cal.com/docs/llms.txt"
    ],
    "guide": [
      "Log in to your Cal.com account.",
      "Click your avatar or initials in the top-right and go to 'Settings'.",
      "Select the 'Security' tab from the left sidebar.",
      "Scroll to the 'API Keys' section and click 'Add'.",
      "Name the key (e.g. 'Dream Labs'), set an optional expiry, and click 'Save'.",
      "Copy the key shown - it starts with 'cal_live_' for production.",
      "Paste the key into the Dream Labs dashboard under the Cal.com connector."
    ],
    "agentUsage": "POST https://api.cal.com/v2/bookings  Authorization: Bearer $CALCOM_API_KEY  Content-Type: application/json",
    "docsUrl": "https://cal.com/docs/api-reference/v2/introduction",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.cal.com/v2",
    "authHeader": "Authorization: Bearer <api_key>",
    "whereToGetKey": "Cal.com account -> Settings -> Security tab. Keys are prefixed 'cal_test_' for test mode and 'cal_live_' for live mode.",
    "inject": [
      {
        "env": "CAL_COM_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "acuity",
    "name": "Acuity Scheduling",
    "category": "Calendar & scheduling",
    "icon": "📅",
    "color": "#0069FF",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.acuityscheduling.com/reference/quick-start",
      "https://rollout.com/integration-guides/acuity-scheduling/api-essentials"
    ],
    "guide": [
      "Log in to your Acuity Scheduling account.",
      "In the left navigation panel, scroll down to 'Business Settings' and click 'Integrations'.",
      "Find the 'API' section and click 'View credentials'.",
      "Copy your numeric User ID (e.g. 1234567).",
      "Copy your API Key from the same page.",
      "Paste both values into the Dream Labs dashboard under the Acuity connector.",
      "The connector will combine them automatically using Basic authentication."
    ],
    "agentUsage": "GET https://acuityscheduling.com/api/v1/appointments  Authorization: Basic <base64($ACUITY_USER_ID:$ACUITY_API_KEY)>",
    "docsUrl": "https://developers.acuityscheduling.com/reference/quick-start",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "user_id",
        "label": "User ID (numeric)",
        "secret": false
      },
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://acuityscheduling.com/api/v1",
    "authHeader": "Authorization: Basic <base64(USER_ID:API_KEY)>",
    "whereToGetKey": "Acuity Scheduling account -> left sidebar -> Business Settings -> Integrations -> API section -> click 'View credentials'. Your numeric User ID and API Key are displayed there.",
    "inject": [
      {
        "env": "ACUITY_USER_ID",
        "source": "field.user_id"
      },
      {
        "env": "ACUITY_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "simplybook",
    "name": "SimplyBook.me",
    "category": "Calendar & scheduling",
    "icon": "📅",
    "color": "#0069FF",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://help.simplybook.me/index.php/User_API_guide",
      "https://simplybook.me/en/api/developer-api",
      "https://help.simplybook.me/index.php/API_custom_feature"
    ],
    "guide": [
      "Log in to your SimplyBook.me admin panel.",
      "Click 'Plugins' in the left sidebar.",
      "Find the 'API' plugin in the list and toggle it on.",
      "Click 'Settings' on the API plugin row.",
      "Copy your Company Login (your SimplyBook subdomain) and your API Key from this page.",
      "Paste both values into the Dream Labs dashboard under the SimplyBook.me connector.",
      "The connector will automatically exchange these for a session token before each call - tokens expire after 1 hour and are refreshed automatically."
    ],
    "agentUsage": "POST https://user-api.simplybook.me/login  Body: {\"jsonrpc\":\"2.0\",\"method\":\"getToken\",\"params\":[\"$SIMPLYBOOK_COMPANY_LOGIN\",\"$SIMPLYBOOK_API_KEY\"],\"id\":1}  -- then use the returned token in X-Token header for subsequent calls",
    "docsUrl": "https://help.simplybook.me/index.php/User_API_guide",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "company_login",
        "label": "Company Login",
        "secret": false
      },
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://user-api.simplybook.me",
    "authHeader": "X-Company-Login: <company_login>  X-Token: <session_token_from_getToken>",
    "whereToGetKey": "SimplyBook.me admin panel -> Plugins -> find 'API' plugin and enable it -> click Settings on the API plugin. Your Company Login and API Key are shown there.",
    "inject": [
      {
        "env": "SIMPLYBOOK_COMPANY_LOGIN",
        "source": "field.company_login"
      },
      {
        "env": "SIMPLYBOOK_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "setmore",
    "name": "Setmore",
    "category": "Calendar & scheduling",
    "icon": "📅",
    "color": "#0069FF",
    "brandSlug": "",
    "provider": "self",
    "confidence": "medium",
    "sources": [
      "https://support.setmore.com/en/articles/579360-request-access-to-the-setmore-api",
      "https://setmore.docs.apiary.io/",
      "https://rollout.com/integration-guides/setmore-appointments/how-to-build-a-public-setmore-appointments-integration-building-the-auth-flow"
    ],
    "guide": [
      "Make sure you have a Setmore Pro account (required for API access).",
      "Email api@setmore.com with your full name, Setmore account email, and what you plan to use the API for.",
      "Wait for the Setmore team to approve your request and send you a client ID and client secret.",
      "Follow the OAuth flow: your server redirects users to https://developer.setmore.com/oauth/authorize with your client_id and redirect_uri.",
      "After the user approves, Setmore sends an authorization code to your redirect URI.",
      "Exchange the code at https://developer.setmore.com/oauth/token to receive an access token and refresh token.",
      "Paste the client ID, client secret, and refresh token into the Dream Labs dashboard under the Setmore connector.",
      "The connector will use the refresh token to obtain fresh access tokens automatically."
    ],
    "agentUsage": "GET https://developer.setmore.com/api/v1/bookingapi/appointments  Authorization: Bearer <access_token>",
    "docsUrl": "https://setmore.docs.apiary.io/",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://developer.setmore.com/oauth/authorize",
      "tokenEp": "https://developer.setmore.com/oauth/token",
      "revokeEp": "",
      "scopes": [],
      "extraParams": {}
    },
    "appSetupNotes": "Email api@setmore.com with your full name, Setmore-registered email, and intended use case to request a Pro account with API access. Setmore will provide a client_id and client_secret. Register your redirect URI (e.g. https://your-server.com/oauth/setmore/callback) when prompted by the Setmore team. The authorization URL is https://developer.setmore.com/oauth/authorize with params client_id, redirect_uri, and response_type=code. Exchange the code at the token endpoint to receive access_token and refresh_token. Refresh tokens are long-lived; exchange them at GET https://developer.setmore.com/api/v1/o/oauth2/token?refreshToken=<refresh_token> to get a new access token.",
    "inject": [
      {
        "env": "SETMORE_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "zoom",
    "name": "Zoom",
    "category": "Calendar & scheduling",
    "icon": "📅",
    "color": "#0069FF",
    "brandSlug": "zoom",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.zoom.us/docs/internal-apps/s2s-oauth/",
      "https://developers.zoom.us/docs/internal-apps/create/",
      "https://developers.zoom.us/docs/api/authentication/",
      "https://devforum.zoom.us/t/server-to-server-oauth-app-permissions-and-scopes/92331"
    ],
    "guide": [
      "Go to https://marketplace.zoom.us/ and sign in with your Zoom account.",
      "Click 'Develop' in the top-right menu, then choose 'Build App'.",
      "Select 'Server-to-Server OAuth' as the app type and click 'Create'.",
      "Copy your Account ID, Client ID, and Client Secret shown on the app credentials screen.",
      "Navigate to the 'Scopes' tab and click 'Add Scopes'. Search for and add 'meeting:write:admin' and 'meeting:read:admin'.",
      "Click 'Continue' to activate the app (required before tokens can be generated).",
      "Paste your Account ID, Client ID, and Client Secret into the Dream Labs dashboard under the Zoom connector.",
      "The connector will exchange these for a short-lived access token automatically each hour."
    ],
    "agentUsage": "POST https://api.zoom.us/v2/users/me/meetings  Authorization: Bearer <access_token>  Content-Type: application/json  Body: {\"topic\":\"Team Sync\",\"type\":1}",
    "docsUrl": "https://developers.zoom.us/docs/internal-apps/s2s-oauth/",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://zoom.us/oauth/authorize",
      "tokenEp": "https://zoom.us/oauth/token",
      "revokeEp": "https://zoom.us/oauth/revoke",
      "scopes": [
        "meeting:write:admin",
        "meeting:read:admin"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://marketplace.zoom.us/, click 'Develop' then 'Build App'. Choose 'Server-to-Server OAuth' (not the user-facing OAuth type - Server-to-Server does not require user login and suits internal/agent use). Name your app and click 'Create'. Zoom immediately shows your Account ID, Client ID, and Client Secret - copy all three. In the 'Scopes' tab click 'Add Scopes' and add at minimum: meeting:write:admin and meeting:read:admin. Activate the app. To get an access token, POST to https://zoom.us/oauth/token?grant_type=account_credentials&account_id=<ACCOUNT_ID> with Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET). Tokens expire after 1 hour - the connector refreshes them automatically. No redirect URI is needed for Server-to-Server OAuth.",
    "inject": [
      {
        "env": "ZOOM_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "mailchimp",
    "name": "Mailchimp",
    "category": "Email & SMS marketing",
    "icon": "📣",
    "color": "#FFE01B",
    "brandSlug": "mailchimp",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://mailchimp.com/developer/marketing/docs/fundamentals/",
      "https://mailchimp.com/help/about-api-keys/",
      "https://mailchimp.com/developer/marketing/api/list-members/add-member-to-list/"
    ],
    "guide": [
      "Log in to your Mailchimp account at mailchimp.com.",
      "Click your profile icon in the top right and choose Profile.",
      "Click the Extras drop-down menu, then select API keys.",
      "Click Create A Key, type a descriptive name (e.g. Dream Labs Agent), then click Generate Key.",
      "Copy the full API key immediately and store it somewhere safe - Mailchimp will never show it again.",
      "Find your data center: look at the last part of your key after the final hyphen (e.g. the key abc123-us6 means your data center is us6). You can also check the URL when logged in - the subdomain like us6.admin.mailchimp.com tells you the data center.",
      "Paste the API key and data center into the Dream Labs dashboard connector form and save."
    ],
    "agentUsage": "POST https://us6.api.mailchimp.com/3.0/lists/{list_id}/members  -H 'Authorization: Bearer <api_key>'  -H 'Content-Type: application/json'  -d '{\"email_address\":\"user@example.com\",\"status\":\"subscribed\"}'",
    "docsUrl": "https://mailchimp.com/developer/marketing/docs/fundamentals/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      },
      {
        "name": "dc",
        "label": "Data Center (e.g. us6)",
        "secret": false
      }
    ],
    "apiBase": "https://<dc>.api.mailchimp.com/3.0",
    "authHeader": "Authorization: Bearer <api_key>",
    "whereToGetKey": "Log in to Mailchimp, click your profile icon, choose Profile, click the Extras drop-down, select API keys. In the Your API Keys section click Create A Key, give it a name, click Generate Key, then copy the full key immediately - it is only shown once. Your data center is the prefix before the dash in your key (e.g. if your key ends in -us6, enter us6) or look at the subdomain in the URL when you are in your Mailchimp account.",
    "inject": [
      {
        "env": "MAILCHIMP_API_KEY",
        "source": "field.api_key"
      },
      {
        "env": "MAILCHIMP_DC",
        "source": "field.dc"
      }
    ]
  },
  {
    "id": "klaviyo",
    "name": "Klaviyo",
    "category": "Email & SMS marketing",
    "icon": "📣",
    "color": "#FFE01B",
    "brandSlug": "klaviyo",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.klaviyo.com/en/docs/authenticate_",
      "https://developers.klaviyo.com/en/reference/api_overview",
      "https://help.klaviyo.com/hc/en-us/articles/7423954176283"
    ],
    "guide": [
      "Log in to your Klaviyo account at app.klaviyo.com.",
      "Click your organization name in the bottom-left corner of the screen.",
      "Select Settings from the menu, then click API keys.",
      "Click Create Private API Key and enter a descriptive name for the key.",
      "Select Custom scope. Enable at least these scopes: lists:read, lists:write, profiles:read, profiles:write, campaigns:read, campaigns:write, subscriptions:write.",
      "Click Create and immediately copy the full key - Klaviyo will never show it again.",
      "Paste the private API key into the Dream Labs dashboard connector form and save.",
      "Note: every API request also requires a revision header (e.g. revision: 2026-04-15) - the agent handles this automatically."
    ],
    "agentUsage": "POST https://a.klaviyo.com/api/profiles  -H 'Authorization: Klaviyo-API-Key <private_api_key>'  -H 'revision: 2026-04-15'  -H 'Content-Type: application/json'  -d '{\"data\":{\"type\":\"profile\",\"attributes\":{\"email\":\"user@example.com\"}}}'",
    "docsUrl": "https://developers.klaviyo.com/en/docs/authenticate_",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "private_api_key",
        "label": "Private API Key",
        "secret": true
      }
    ],
    "apiBase": "https://a.klaviyo.com/api",
    "authHeader": "Authorization: Klaviyo-API-Key <private_api_key>",
    "whereToGetKey": "In Klaviyo, click your organization name in the bottom-left corner, go to Settings, then click API keys. Under Private API Keys click Create Private API Key. Name the key, then choose Custom scope and enable at minimum: lists:read, lists:write, profiles:read, profiles:write, campaigns:read, campaigns:write, subscriptions:write. Click Create and copy the key immediately - it cannot be viewed again after you leave the page.",
    "inject": [
      {
        "env": "KLAVIYO_PRIVATE_API_KEY",
        "source": "field.private_api_key"
      }
    ]
  },
  {
    "id": "convertkit",
    "name": "Kit (ConvertKit)",
    "category": "Email & SMS marketing",
    "icon": "📣",
    "color": "#FFE01B",
    "brandSlug": "convertkit",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.kit.com/api-reference/authentication",
      "https://developers.kit.com/api-reference/subscribers/create-a-subscriber",
      "https://help.kit.com/en/articles/9427725-configuring-api-access"
    ],
    "guide": [
      "Log in to your Kit account at app.kit.com.",
      "Click your account name or avatar in the top-right corner and go to Settings.",
      "Click the Developer tab in the settings menu (or go directly to app.kit.com/account_settings/developer_settings).",
      "Under API Keys click Add a new key and give it a descriptive name.",
      "Copy the generated V4 API key and store it securely.",
      "Paste the API key into the Dream Labs dashboard connector form and save.",
      "Note: use V4 API keys only - older V3 keys use a different format and different base URL (api.convertkit.com/v3)."
    ],
    "agentUsage": "POST https://api.kit.com/v4/subscribers  -H 'X-Kit-Api-Key: <api_key>'  -H 'Content-Type: application/json'  -d '{\"email_address\":\"user@example.com\",\"first_name\":\"Jane\",\"state\":\"active\"}'",
    "docsUrl": "https://developers.kit.com/api-reference/authentication",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.kit.com/v4",
    "authHeader": "X-Kit-Api-Key: <api_key>",
    "whereToGetKey": "Log in to Kit (app.kit.com), click your account name or avatar, go to Settings, then click the Developer tab (or navigate directly to app.kit.com/account_settings/developer_settings). Under API Keys click Add a new key, give it a name, and copy the generated V4 API key.",
    "inject": [
      {
        "env": "CONVERTKIT_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "zendesk",
    "name": "Zendesk",
    "category": "Helpdesk & inbox",
    "icon": "🔌",
    "color": "#6b7280",
    "brandSlug": "zendesk",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.zendesk.com/api-reference/introduction/security-and-auth/",
      "https://support.zendesk.com/hc/en-us/articles/4408889192858-Managing-API-token-access-to-the-Zendesk-API",
      "https://developer.zendesk.com/api-reference/ticketing/tickets/tickets/"
    ],
    "guide": [
      "Log in to your Zendesk account and go to the Admin Center (the gear icon).",
      "In the left sidebar click 'Apps and integrations', then 'APIs', then 'Zendesk API'.",
      "Make sure 'Token Access' is toggled ON at the top of that page.",
      "Click 'Add API token', give it a label (e.g. Dream Labs Agent), then click 'Save'.",
      "Copy the full token that appears - this is the only time it is shown.",
      "Note your subdomain: the part before .zendesk.com in your browser address bar.",
      "Paste your subdomain, your admin email address, and the API token into the Dream Labs connector form.",
      "Click 'Connect' to verify the credentials work."
    ],
    "agentUsage": "POST https://acme.zendesk.com/api/v2/tickets  -H 'Authorization: Basic <base64(user@example.com/token:YOUR_API_TOKEN)>'  -H 'Content-Type: application/json'  -d '{\"ticket\":{\"subject\":\"Help needed\",\"comment\":{\"body\":\"Details here\"}}}'",
    "docsUrl": "https://developer.zendesk.com/api-reference/introduction/security-and-auth/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "subdomain",
        "label": "Zendesk Subdomain (e.g. acme from acme.zendesk.com)",
        "secret": false
      },
      {
        "name": "email",
        "label": "Admin Email Address",
        "secret": false
      },
      {
        "name": "api_token",
        "label": "API Token",
        "secret": true
      }
    ],
    "apiBase": "https://{subdomain}.zendesk.com/api/v2",
    "authHeader": "Authorization: Basic {base64(email/token:api_token)}",
    "whereToGetKey": "Zendesk Admin Center > Apps and integrations > APIs > Zendesk API > Add API token. Copy the token immediately - it is never shown again after you click Save.",
    "inject": [
      {
        "env": "ZENDESK_SUBDOMAIN",
        "source": "field.subdomain"
      },
      {
        "env": "ZENDESK_EMAIL",
        "source": "field.email"
      },
      {
        "env": "ZENDESK_API_TOKEN",
        "source": "field.api_token"
      }
    ]
  },
  {
    "id": "intercom",
    "name": "Intercom",
    "category": "Helpdesk & inbox",
    "icon": "🔌",
    "color": "#6b7280",
    "brandSlug": "intercom",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.intercom.com/docs/build-an-integration/learn-more/authentication",
      "https://developers.intercom.com/docs/build-an-integration/learn-more/rest-apis/make-an-api-call",
      "https://developers.intercom.com/docs/references/rest-api/api.intercom.io"
    ],
    "guide": [
      "Go to developers.intercom.com and sign in with your Intercom account.",
      "Click 'New app' (or open an existing internal app) in the Developer Hub.",
      "Give the app a name (e.g. Dream Labs Agent) and select your workspace.",
      "In the app settings, click 'Configure', then 'Authentication'.",
      "Copy the Access Token shown on that page.",
      "If your workspace is in the EU region use api.eu.intercom.io; for Australia use api.au.intercom.io; otherwise leave the region blank.",
      "Paste the Access Token (and region if needed) into the Dream Labs connector form and click 'Connect'."
    ],
    "agentUsage": "GET https://api.intercom.io/conversations  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'  -H 'Accept: application/json'",
    "docsUrl": "https://developers.intercom.com/docs/build-an-integration/learn-more/authentication",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "access_token",
        "label": "Intercom Access Token",
        "secret": true
      },
      {
        "name": "api_region",
        "label": "API Region (leave blank for US, enter 'eu' for Europe or 'au' for Australia)",
        "secret": false
      }
    ],
    "apiBase": "https://api.intercom.io",
    "authHeader": "Authorization: Bearer {access_token}",
    "whereToGetKey": "Go to app.intercom.com > Settings > Developer Hub (or create an app at developers.intercom.com). Open your app, go to Configure > Authentication, and copy the Access Token shown there.",
    "inject": [
      {
        "env": "INTERCOM_ACCESS_TOKEN",
        "source": "field.access_token"
      },
      {
        "env": "INTERCOM_API_REGION",
        "source": "field.api_region"
      }
    ]
  },
  {
    "id": "help-scout",
    "name": "Help Scout",
    "category": "Helpdesk & inbox",
    "icon": "🔌",
    "color": "#6b7280",
    "brandSlug": "helpscout",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.helpscout.com/mailbox-api/overview/authentication/",
      "https://developer.helpscout.com/help-desk-api/api-clients/"
    ],
    "guide": [
      "Log in to Help Scout and click your avatar in the top-right corner, then choose 'Your Profile'.",
      "Scroll down to 'My Apps' and click 'Create My App'.",
      "Give the app a name (e.g. Dream Labs Agent) and enter your redirect URL if using browser-based login (e.g. https://your-server.com/oauth/helpscout/callback).",
      "Click 'Create' and copy the App ID and App Secret that appear.",
      "For automated server-side use (recommended): send a POST request to https://api.helpscout.net/v2/oauth2/token with grant_type=client_credentials, client_id (your App ID), and client_secret. The response contains your access token.",
      "Access tokens are valid for 2 days - your agent should refresh them automatically using the same client credentials call.",
      "Paste your App ID and App Secret into the Dream Labs connector form and click 'Connect'."
    ],
    "agentUsage": "GET https://api.helpscout.net/v2/conversations  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'",
    "docsUrl": "https://developer.helpscout.com/mailbox-api/overview/authentication/",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://secure.helpscout.net/authentication/authorizeClientApplication?client_id={application_id}&state={state}",
      "tokenEp": "https://api.helpscout.net/v2/oauth2/token",
      "revokeEp": "",
      "scopes": [],
      "extraParams": {}
    },
    "appSetupNotes": "Log in to Help Scout and go to Your Profile (top-right avatar) > My Apps > Create My App. Give the app a name and enter your server's redirect URI (e.g. https://your-agent-server.example.com/oauth/helpscout/callback). After saving, copy the App ID and App Secret shown. Help Scout does not use named scopes - token access inherits the permissions of the Help Scout user who authorizes. For fully automated server-side use without a browser redirect, use the Client Credentials flow instead: POST to https://api.helpscout.net/v2/oauth2/token with grant_type=client_credentials, client_id, and client_secret to get a bearer token directly.",
    "inject": [
      {
        "env": "HELP_SCOUT_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "front",
    "name": "Front",
    "category": "Helpdesk & inbox",
    "icon": "🔌",
    "color": "#6b7280",
    "brandSlug": "front",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://dev.frontapp.com/docs/authentication",
      "https://dev.frontapp.com/docs/create-and-revoke-api-tokens",
      "https://dev.frontapp.com/docs/base-url"
    ],
    "guide": [
      "Log in to Front and click the gear icon to open Settings.",
      "In the left sidebar, click 'Developers', then select the 'API Tokens' tab.",
      "Click 'Create API token' and give it a descriptive name (e.g. Dream Labs Agent).",
      "Under 'Features', enable 'Access resources' to allow managing conversations, contacts, and inboxes.",
      "Under 'Namespaces', select the resource scope - choose 'Global resources' and the shared workspaces your agent needs access to.",
      "Set permissions to at least 'Read' and 'Send' (add 'Write' if the agent needs to create or update conversations).",
      "Click 'Create', then click 'Reveal' or 'Copy' to get the token value.",
      "Paste the token into the Dream Labs connector form and click 'Connect'."
    ],
    "agentUsage": "GET https://api2.frontapp.com/conversations  -H 'Authorization: Bearer YOUR_API_TOKEN'",
    "docsUrl": "https://dev.frontapp.com/docs/create-and-revoke-api-tokens",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_token",
        "label": "Front API Token",
        "secret": true
      }
    ],
    "apiBase": "https://api2.frontapp.com",
    "authHeader": "Authorization: Bearer {api_token}",
    "whereToGetKey": "In Front, go to Settings > Developers > API Tokens tab > Create API token. Name the token, choose the resource scopes (Global, Shared workspaces, and/or Private), and grant at minimum Read + Send permissions. After clicking Create, reveal and copy the token.",
    "inject": [
      {
        "env": "FRONT_API_TOKEN",
        "source": "field.api_token"
      }
    ]
  },
  {
    "id": "typeform",
    "name": "Typeform",
    "category": "Forms & PM boards",
    "icon": "📋",
    "color": "#0079BF",
    "brandSlug": "typeform",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://www.typeform.com/developers/get-started/personal-access-token/",
      "https://www.typeform.com/developers/get-started/scopes/",
      "https://www.typeform.com/developers/get-started/hands-on/"
    ],
    "guide": [
      "Go to typeform.com and log in to your account.",
      "Click your account name in the upper-left corner and choose Account from the dropdown.",
      "In the left sidebar, click Personal tokens.",
      "Click Generate a new token, give it a descriptive name (e.g. Dream Labs Agent), and select these scopes: forms:read, forms:write, responses:read, webhooks:read, webhooks:write.",
      "Click Generate token and copy the value shown - it starts with tfp_ and will not be shown again.",
      "Paste the token into the Personal Access Token field in the Dream Labs dashboard.",
      "Click Save and test the connection."
    ],
    "agentUsage": "GET https://api.typeform.com/forms  Authorization: Bearer tfp_xxxxxxxxxxxx",
    "docsUrl": "https://www.typeform.com/developers/get-started/personal-access-token/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "TYPEFORM_TOKEN",
        "label": "Personal Access Token",
        "secret": true
      }
    ],
    "apiBase": "https://api.typeform.com",
    "authHeader": "Authorization: Bearer <token>",
    "whereToGetKey": "Log in to Typeform → click your account name (upper-left) → Account → Personal tokens → Generate a new token. Give it a name, select the scopes you need (at minimum: forms:read, responses:read, forms:write), and copy the token immediately - it is shown only once.",
    "inject": [
      {
        "env": "TYPEFORM_TOKEN",
        "source": "field.TYPEFORM_TOKEN"
      }
    ]
  },
  {
    "id": "jotform",
    "name": "Jotform",
    "category": "Forms & PM boards",
    "icon": "📋",
    "color": "#0079BF",
    "brandSlug": "jotform",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://api.jotform.com/docs/",
      "https://www.jotform.com/help/253-how-to-create-a-jotform-api-key/"
    ],
    "guide": [
      "Log in to Jotform and go to jotform.com/myaccount/api.",
      "Click Create New Key on the right side of the page.",
      "Select your new key, give it a label (e.g. Dream Labs Agent), and set Permissions to Full Access in the dropdown.",
      "Copy the API key shown on screen.",
      "In the Dream Labs dashboard, paste the key into the API Key field.",
      "If your Jotform account is based in the EU, type eu in the Region field. For HIPAA accounts type hipaa. Otherwise leave it as standard.",
      "Click Save and test the connection."
    ],
    "agentUsage": "GET https://api.jotform.com/user/forms  APIKEY: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "docsUrl": "https://api.jotform.com/docs/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "JOTFORM_API_KEY",
        "label": "API Key",
        "secret": true
      },
      {
        "name": "JOTFORM_REGION",
        "label": "Region (standard / eu / hipaa)",
        "secret": false
      }
    ],
    "apiBase": "https://api.jotform.com",
    "authHeader": "APIKEY: <key>",
    "whereToGetKey": "Log in to Jotform → go to jotform.com/myaccount/api → click Create New Key → label it, set permissions to Full Access, and copy the key. If your account is on the EU data center, use eu-api.jotform.com as the base URL. HIPAA accounts use hipaa-api.jotform.com.",
    "inject": [
      {
        "env": "JOTFORM_API_KEY",
        "source": "field.JOTFORM_API_KEY"
      },
      {
        "env": "JOTFORM_REGION",
        "source": "field.JOTFORM_REGION"
      }
    ]
  },
  {
    "id": "asana",
    "name": "Asana",
    "category": "Forms & PM boards",
    "icon": "📋",
    "color": "#0079BF",
    "brandSlug": "asana",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.asana.com/docs/personal-access-token",
      "https://developers.asana.com/docs/authentication"
    ],
    "guide": [
      "Open asana.com and log in to your account.",
      "Go to app.asana.com/0/my-apps - this is the Asana developer console.",
      "Click Create new token.",
      "Type a description so you remember what this token is for (e.g. Dream Labs Agent).",
      "Click Create token, then copy the value shown - it will not be displayed again.",
      "Paste the token into the Personal Access Token field in the Dream Labs dashboard.",
      "Click Save and test the connection."
    ],
    "agentUsage": "GET https://app.asana.com/api/1.0/tasks/<task_gid>  Authorization: Bearer 1/123456789:abcdefghij",
    "docsUrl": "https://developers.asana.com/docs/personal-access-token",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "ASANA_PAT",
        "label": "Personal Access Token",
        "secret": true
      }
    ],
    "apiBase": "https://app.asana.com/api/1.0",
    "authHeader": "Authorization: Bearer <token>",
    "whereToGetKey": "Go to app.asana.com/0/my-apps (the Asana developer console) → click Create new token → add a description → copy the token. The token is shown only once.",
    "inject": [
      {
        "env": "ASANA_PAT",
        "source": "field.ASANA_PAT"
      }
    ]
  },
  {
    "id": "trello",
    "name": "Trello",
    "category": "Forms & PM boards",
    "icon": "📋",
    "color": "#0079BF",
    "brandSlug": "trello",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/",
      "https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/",
      "https://support.atlassian.com/trello/docs/getting-started-with-trello-rest-api/"
    ],
    "guide": [
      "Go to trello.com and log in.",
      "Navigate to trello.com/power-ups/admin.",
      "If you see no Power-Up listed, click New to create one - give it any name (e.g. Dream Labs).",
      "Click your Power-Up, then click the API Key tab. Your API Key is displayed here - copy it.",
      "On the same page, click the Token link (in the text next to your API key). You will be taken to an authorization page.",
      "Review the requested permissions and click Allow to generate your token. Copy the long token string shown.",
      "Paste both values into the Dream Labs dashboard: API Key and API Token, then click Save."
    ],
    "agentUsage": "POST https://api.trello.com/1/cards?key=xxxxxxxx&token=yyyyyyyy  Body: {\"idList\":\"<list_id>\",\"name\":\"New card\"}",
    "docsUrl": "https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "TRELLO_API_KEY",
        "label": "API Key",
        "secret": false
      },
      {
        "name": "TRELLO_TOKEN",
        "label": "API Token",
        "secret": true
      }
    ],
    "apiBase": "https://api.trello.com/1",
    "authHeader": "Query params: ?key=<apiKey>&token=<apiToken>",
    "whereToGetKey": "Go to trello.com/power-ups/admin → create a Power-Up if you have not already → click the API Key tab to view your API key. Then click the Token link next to your API key, review permissions, and click Allow to generate your token. Copy both values.",
    "inject": [
      {
        "env": "TRELLO_API_KEY",
        "source": "field.TRELLO_API_KEY"
      },
      {
        "env": "TRELLO_TOKEN",
        "source": "field.TRELLO_TOKEN"
      }
    ]
  },
  {
    "id": "monday",
    "name": "Monday.com",
    "category": "Forms & PM boards",
    "icon": "📋",
    "color": "#0079BF",
    "brandSlug": "mondaydotcom",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.monday.com/api-reference/docs/authentication",
      "https://developer.monday.com/api-reference/docs/basics",
      "https://developer.monday.com/api-reference/docs/getting-started"
    ],
    "guide": [
      "Log in to monday.com.",
      "Click your profile picture in the bottom-left corner of the screen.",
      "Click Developers in the menu.",
      "On the developer page, click My Access Tokens, then click Show next to your personal API token.",
      "Copy the token displayed.",
      "If you do not see the Developers option, go to profile picture → Administration → Connections → Personal API token instead.",
      "Paste the token into the API Token field in the Dream Labs dashboard and click Save."
    ],
    "agentUsage": "POST https://api.monday.com/v2  Authorization: eyJhbGc...  Content-Type: application/json  Body: {\"query\":\"mutation { create_item (board_id: 1234567890, group_id: \\\"topics\\\", item_name: \\\"New task\\\") { id } }\"}",
    "docsUrl": "https://developer.monday.com/api-reference/docs/authentication",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "MONDAY_API_TOKEN",
        "label": "API Token",
        "secret": true
      }
    ],
    "apiBase": "https://api.monday.com/v2",
    "authHeader": "Authorization: <token>",
    "whereToGetKey": "In monday.com, click your profile picture (bottom-left) → Developers → My Access Tokens → Show. Copy the token. Alternatively, admins can go to profile picture → Administration → Connections → Personal API token. Regenerating the token immediately invalidates the previous one.",
    "inject": [
      {
        "env": "MONDAY_API_TOKEN",
        "source": "field.MONDAY_API_TOKEN"
      }
    ]
  },
  {
    "id": "dropbox",
    "name": "Dropbox",
    "category": "Docs & storage",
    "icon": "📁",
    "color": "#0061FF",
    "brandSlug": "dropbox",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.dropbox.com/oauth-guide",
      "https://www.dropbox.com/developers/reference/auth-types",
      "https://community.dropbox.com/en/discussion/830020/autherror-files-content-read-does-not-match-scopes-of-token"
    ],
    "guide": [
      "Go to https://www.dropbox.com/developers/apps and sign in with your Dropbox account.",
      "Click 'Create app', choose 'Scoped access', then choose 'Full Dropbox' for full file access (or 'App folder' to limit it). Enter any name for the app and click 'Create app'.",
      "On the app page, click the 'Permissions' tab. Check the boxes for 'files.metadata.read', 'files.content.read', 'files.content.write', and 'account_info.read'. Click 'Submit' to save.",
      "Go back to the 'Settings' tab. Under 'Redirect URIs', add the callback URL for your agent server (e.g. https://your-server.com/oauth/dropbox/callback) and click 'Add'.",
      "Copy your 'App key' (this is your client ID) and click 'Show' next to 'App secret' to reveal and copy your client secret.",
      "Paste both values into your agent server settings as DROPBOX_CLIENT_ID and DROPBOX_CLIENT_SECRET.",
      "Run the OAuth connect flow from your dashboard - you will be sent to Dropbox to approve access. After approving, your server will store a refresh token automatically."
    ],
    "agentUsage": "POST https://api.dropboxapi.com/2/files/list_folder | Authorization: Bearer <access_token> | body: {\"path\": \"\", \"recursive\": false}",
    "docsUrl": "https://developers.dropbox.com/oauth-guide",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://www.dropbox.com/oauth2/authorize",
      "tokenEp": "https://www.dropbox.com/oauth2/token",
      "revokeEp": "https://api.dropboxapi.com/2/auth/token/revoke",
      "scopes": [
        "account_info.read",
        "files.metadata.read",
        "files.content.read",
        "files.content.write"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://www.dropbox.com/developers/apps and click 'Create app'. Choose 'Scoped access' and then 'Full Dropbox' (or 'App folder' for narrower access). Give it a name. On the app settings page, open the 'Permissions' tab and enable: files.metadata.read, files.content.read, files.content.write, account_info.read. Under the 'Settings' tab, add your redirect URI (e.g. https://your-server.com/oauth/dropbox/callback) to the 'Redirect URIs' field. Copy the App key (client_id) and App secret (client_secret) from the Settings tab.",
    "inject": [
      {
        "env": "DROPBOX_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "notion",
    "name": "Notion",
    "category": "Docs & storage",
    "icon": "📁",
    "color": "#0061FF",
    "brandSlug": "notion",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.notion.com/reference/authentication",
      "https://developers.notion.com/guides/get-started/internal-connections",
      "https://developers.notion.com/reference/intro"
    ],
    "guide": [
      "Go to https://www.notion.so/developers/connections in your browser (you must be signed into Notion).",
      "Under 'Internal connections', click 'Create a new connection'.",
      "Give your connection a name (e.g. 'My Agent Server'), select the Notion workspace it should access, and click 'Create'.",
      "You will be taken to the connection settings. Click the 'Configuration' tab and copy the 'Installation access token' - this is your secret token.",
      "Paste the token into your agent server settings as NOTION_TOKEN.",
      "Back in Notion, open any page or database you want the agent to access. Click the '...' menu in the top right, go to 'Connections', and select the connection you just created to grant it access."
    ],
    "agentUsage": "GET https://api.notion.com/v1/search | Authorization: Bearer <integration_token> | Notion-Version: 2026-03-11 | Content-Type: application/json",
    "docsUrl": "https://developers.notion.com/reference/authentication",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "integration_token",
        "label": "Internal Integration Token",
        "secret": true
      }
    ],
    "apiBase": "https://api.notion.com/v1",
    "authHeader": "Authorization: Bearer <integration_token>",
    "whereToGetKey": "Go to https://www.notion.so/developers/connections, click 'Create a new connection' under Internal connections, give it a name, select the workspace, then open the Configuration tab and copy the 'Installation access token'.",
    "inject": [
      {
        "env": "NOTION_INTEGRATION_TOKEN",
        "source": "field.integration_token"
      }
    ]
  },
  {
    "id": "airtable",
    "name": "Airtable",
    "category": "Docs & storage",
    "icon": "📁",
    "color": "#0061FF",
    "brandSlug": "airtable",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://airtable.com/developers/web/guides/personal-access-tokens",
      "https://airtable.com/developers/web/api/authentication",
      "https://airtable.com/developers/web/api/scopes"
    ],
    "guide": [
      "Go to https://airtable.com/create/tokens in your browser while signed into Airtable.",
      "Click 'Create new token' and give it a descriptive name (e.g. 'Agent Server').",
      "Under 'Scopes', add: 'data.records:read', 'data.records:write', and 'schema.bases:read'. Add any others you need (e.g. 'data.recordComments:read').",
      "Under 'Access', click 'Add a base' and select each Airtable base the agent should be allowed to access.",
      "Click 'Create token'. Copy the token shown on screen - it will only be shown once.",
      "Paste the token into your agent server settings as AIRTABLE_TOKEN.",
      "To find your base ID and table name for API calls, open the base in Airtable, click 'Help' then 'API documentation' - your base ID (starts with 'app') is shown in the URL and examples there."
    ],
    "agentUsage": "GET https://api.airtable.com/v0/{baseId}/{tableIdOrName} | Authorization: Bearer <personal_access_token>",
    "docsUrl": "https://airtable.com/developers/web/guides/personal-access-tokens",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "personal_access_token",
        "label": "Personal Access Token",
        "secret": true
      }
    ],
    "apiBase": "https://api.airtable.com/v0",
    "authHeader": "Authorization: Bearer <personal_access_token>",
    "whereToGetKey": "Go to https://airtable.com/create/tokens, click 'Create new token', give it a name, add scopes (data.records:read, data.records:write, schema.bases:read), select which bases it can access, then click 'Create token' and copy the token shown.",
    "inject": [
      {
        "env": "AIRTABLE_PERSONAL_ACCESS_TOKEN",
        "source": "field.personal_access_token"
      }
    ]
  },
  {
    "id": "tiktok",
    "name": "TikTok",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "tiktok",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.tiktok.com/doc/content-posting-api-get-started",
      "https://developers.tiktok.com/doc/oauth-user-access-token-management",
      "https://developers.tiktok.com/doc/content-posting-api-reference-direct-post"
    ],
    "guide": [
      "Go to https://developers.tiktok.com and sign in with a TikTok account.",
      "Click 'Manage Apps', then 'Create an app'. Fill in your app name, description, and platform (Web).",
      "Under 'Products', click 'Add product' and select 'Content Posting API', then enable 'Direct Post'.",
      "Under 'App settings', add your redirect URI - this is the callback URL on your agent server (e.g. https://your-server.com/oauth/tiktok/callback).",
      "Copy your Client Key and Client Secret from the app dashboard.",
      "Paste both values into your agent server settings.",
      "Click 'Connect TikTok Account' in your dashboard. You will be sent to TikTok to log in and approve access.",
      "Note: until you submit your app for TikTok review, all posted videos will be set to private. Submit for review once your integration is working."
    ],
    "agentUsage": "POST https://open.tiktokapis.com/v2/post/publish/video/init/ -H 'Authorization: Bearer <access_token>' -H 'Content-Type: application/json; charset=UTF-8'",
    "docsUrl": "https://developers.tiktok.com/doc/content-posting-api-get-started",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://www.tiktok.com/v2/auth/authorize/",
      "tokenEp": "https://open.tiktokapis.com/v2/oauth/token/",
      "revokeEp": "https://open.tiktokapis.com/v2/oauth/revoke/",
      "scopes": [
        "video.publish",
        "user.info.basic"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://developers.tiktok.com, sign in, and create an app. Under 'Products', add 'Content Posting API' and enable the 'Direct Post' configuration. In your app settings, add your server's redirect URI (e.g. https://your-server.com/oauth/tiktok/callback). Copy Client Key and Client Secret. Note: all posts from unaudited apps are private - you must submit the app for TikTok audit to allow public posting.",
    "inject": [
      {
        "env": "TIKTOK_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "linkedin",
    "name": "LinkedIn",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "linkedin",
    "provider": "microsoft",
    "confidence": "high",
    "sources": [
      "https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow",
      "https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/ugc-post-api"
    ],
    "guide": [
      "Go to https://www.linkedin.com/developers/apps and click 'Create app'.",
      "Enter an app name, associate it with a LinkedIn Page you manage, and upload a logo. Click 'Create app'.",
      "On the 'Auth' tab, add your redirect URI in the 'Authorized redirect URLs for your app' section (e.g. https://your-server.com/oauth/linkedin/callback).",
      "Copy the Client ID and Client Secret from the Auth tab.",
      "On the 'Products' tab, click 'Request access' for 'Share on LinkedIn' and also for 'Sign In with LinkedIn using OpenID Connect'. Both must be approved to unlock posting.",
      "Approval for 'Share on LinkedIn' is typically instant for new apps.",
      "Paste Client ID and Client Secret into your agent server settings.",
      "Click 'Connect LinkedIn' in your dashboard. You will be taken to LinkedIn to approve posting access."
    ],
    "agentUsage": "POST https://api.linkedin.com/v2/ugcPosts -H 'Authorization: Bearer <access_token>' -H 'X-Restli-Protocol-Version: 2.0.0' -H 'Content-Type: application/json'",
    "docsUrl": "https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://www.linkedin.com/oauth/v2/authorization",
      "tokenEp": "https://www.linkedin.com/oauth/v2/accessToken",
      "revokeEp": "",
      "scopes": [
        "openid",
        "profile",
        "email",
        "w_member_social",
        "offline_access"
      ],
      "userinfoEp": "https://graph.microsoft.com/oidc/userinfo",
      "extraParams": {
        "prompt": "consent"
      }
    },
    "appSetupNotes": "Go to https://www.linkedin.com/developers/apps and click 'Create app'. Fill in the app name, LinkedIn Page, and logo. On the Auth tab, add your redirect URI (e.g. https://your-server.com/oauth/linkedin/callback) - it must be an absolute HTTPS URL with no fragment (#). Copy Client ID and Client Secret. On the Products tab, request access to 'Share on LinkedIn' and 'Sign In with LinkedIn using OpenID Connect' - both are needed to unlock the w_member_social scope. Approval is typically instant.",
    "inject": [
      {
        "env": "LINKEDIN_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "twitter-x",
    "name": "X (Twitter)",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "x",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code",
      "https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code"
    ],
    "guide": [
      "Go to https://developer.x.com and sign up for a developer account if you do not already have one.",
      "Click 'Create Project', give it a name and use case, then create an App inside the project.",
      "In your App settings, scroll to 'User authentication settings' and click 'Set up'.",
      "Enable OAuth 2.0. Set app type to 'Web App, Automated App or Bot'. Add your redirect URI (e.g. https://your-server.com/oauth/twitter/callback) and a website URL.",
      "Save the settings. Copy the Client ID and Client Secret that appear. The secret is only shown once, so copy it immediately.",
      "Paste both values into your agent server settings.",
      "Click 'Connect X Account' in your dashboard. You will be taken to X to approve posting access.",
      "The free Basic tier supports posting. If you need higher volume, check the current pricing tiers at https://developer.x.com/en/portal/products."
    ],
    "agentUsage": "POST https://api.twitter.com/2/tweets -H 'Authorization: Bearer <access_token>' -H 'Content-Type: application/json'",
    "docsUrl": "https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://twitter.com/i/oauth2/authorize",
      "tokenEp": "https://api.twitter.com/2/oauth2/token",
      "revokeEp": "https://api.twitter.com/2/oauth2/revoke",
      "scopes": [
        "tweet.write",
        "tweet.read",
        "users.read",
        "offline.access"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://developer.x.com/en/portal/dashboard and create a Project, then create an App inside it. In the App settings, under 'User authentication settings', click 'Set up' and enable OAuth 2.0. Set 'Type of App' to 'Web App'. Add your redirect URI (e.g. https://your-server.com/oauth/twitter/callback) and a website URL. Copy the Client ID and Client Secret shown. PKCE is required - use code_challenge_method=S256. The free Basic tier supports posting but has rate limits.",
    "inject": [
      {
        "env": "TWITTER_X_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "reddit",
    "name": "Reddit",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "reddit",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://github.com/reddit-archive/reddit/wiki/oauth2",
      "https://replydaddy.com/blog/reddit-api-pre-approval-2025-personal-projects-crackdown",
      "https://www.wappkit.com/blog/reddit-api-credentials-guide-2025"
    ],
    "guide": [
      "Go to https://support.reddithelp.com/hc/en-us/requests/new and submit an API access request. Describe your app, the subreddits you will post to, and your expected volume. Pre-approval is now required before any API use (as of November 2025).",
      "Wait for Reddit to approve your request. You will receive an email confirmation.",
      "Once approved, go to https://www.reddit.com/prefs/apps and click 'create an app' at the bottom of the page.",
      "Select 'web app', give it a name, and enter your redirect URI (e.g. https://your-server.com/oauth/reddit/callback).",
      "Click 'create app'. The client ID is shown just below the app name; copy it. The secret is labeled 'secret'; copy that too.",
      "Paste both the client ID and secret into your agent server settings.",
      "Click 'Connect Reddit Account' in your dashboard. You will be taken to Reddit to approve posting access."
    ],
    "agentUsage": "POST https://oauth.reddit.com/api/submit -H 'Authorization: bearer <access_token>' -H 'User-Agent: YourApp/1.0 by YourRedditUsername'",
    "docsUrl": "https://github.com/reddit-archive/reddit/wiki/oauth2",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://www.reddit.com/api/v1/authorize",
      "tokenEp": "https://www.reddit.com/api/v1/access_token",
      "revokeEp": "https://www.reddit.com/api/v1/revoke_token",
      "scopes": [
        "submit",
        "identity",
        "read"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "IMPORTANT: As of November 2025, Reddit requires pre-approval before any API access. Apply at https://support.reddithelp.com/hc/en-us/requests/new - describe your use case, target subreddits, and expected request volume. After approval, go to https://www.reddit.com/prefs/apps, click 'create an app', choose type 'web app', and add your redirect URI (e.g. https://your-server.com/oauth/reddit/callback). The client ID appears under the app name; the secret is labeled 'secret'. All API calls must use https://oauth.reddit.com as the base and include a descriptive User-Agent header.",
    "inject": [
      {
        "env": "REDDIT_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "pinterest",
    "name": "Pinterest",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "pinterest",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/",
      "https://developers.pinterest.com/docs/api/v5/pins-create/",
      "https://logto.io/oauth-providers-explorer/pinterest"
    ],
    "guide": [
      "Go to https://developers.pinterest.com, click 'My Apps', then 'Create app'.",
      "Enter an app name and description, then click 'Create'.",
      "In the app settings, find 'Redirect URIs' and add your callback URL (e.g. https://your-server.com/oauth/pinterest/callback). The URL must match exactly.",
      "Copy the App ID and App secret key from the app dashboard.",
      "Paste both into your agent server settings.",
      "Click 'Connect Pinterest' in your dashboard to authorize access.",
      "To enable pin creation in production, go back to the developer portal and submit your app for review. You will need to record a short video showing the OAuth flow and a pin being created. Read actions (viewing pins and boards) work without review."
    ],
    "agentUsage": "POST https://api.pinterest.com/v5/pins -H 'Authorization: Bearer <access_token>' -H 'Content-Type: application/json'",
    "docsUrl": "https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://www.pinterest.com/oauth/",
      "tokenEp": "https://api.pinterest.com/v5/oauth/token",
      "revokeEp": "",
      "scopes": [
        "pins:read",
        "pins:write",
        "boards:read",
        "user_accounts:read"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://developers.pinterest.com, click 'My Apps', then 'Create app'. Fill in app name and description. Under 'Redirect URIs', add your callback URL (e.g. https://your-server.com/oauth/pinterest/callback) - it must exactly match what you use in OAuth requests. Copy the App ID (client_id) and App secret key (client_secret). Trial access allows read but write operations require submitting a demo video showing your OAuth flow and a sample pin creation. Submit the app review form in the developer portal to unlock pins:write for production use.",
    "inject": [
      {
        "env": "PINTEREST_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "buffer",
    "name": "Buffer",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "buffer",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.buffer.com/guides/authentication.html",
      "https://developers.buffer.com/guides/your-first-post.html",
      "https://support.buffer.com/article/859-does-buffer-have-an-api"
    ],
    "guide": [
      "Log in to your Buffer account at https://buffer.com.",
      "Go to Settings (bottom-left) and click 'API', or go directly to https://publish.buffer.com/settings/api.",
      "Click 'Create API Key'. Give it a label so you can identify it later.",
      "Copy the API key that appears. You will not be able to see it again after closing the dialog, so copy it now.",
      "Paste the API key into your agent server settings.",
      "In Buffer, make sure the social channels you want to post to are already connected (Instagram, X, LinkedIn, TikTok, etc.). Your agent will see all connected channels.",
      "Your agent uses Buffer's GraphQL API at https://api.buffer.com to queue and schedule posts."
    ],
    "agentUsage": "POST https://api.buffer.com -H 'Authorization: Bearer <api_key>' -H 'Content-Type: application/json' -d '{\"query\": \"mutation { createPost(input: { text: \\\"Hello!\\\", channelId: \\\"CHANNEL_ID\\\", schedulingType: automatic, mode: addToQueue }) { ... on PostActionSuccess { post { id text dueAt } } } }\"}'",
    "docsUrl": "https://developers.buffer.com/guides/authentication.html",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "Buffer API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.buffer.com",
    "authHeader": "Authorization: Bearer <api_key>",
    "whereToGetKey": "Log in to Buffer, go to https://publish.buffer.com/settings/api, and click 'Create API Key'. Copy the key shown - it acts on behalf of your account and gives access to all connected channels.",
    "inject": [
      {
        "env": "BUFFER_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "hootsuite",
    "name": "Hootsuite",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "hootsuite",
    "provider": "self",
    "confidence": "medium",
    "sources": [
      "https://developer.hootsuite.com/docs/api-authentication",
      "https://developer.hootsuite.com/docs/enabling-oauth-20",
      "https://developer.hootsuite.com/docs/message-scheduling"
    ],
    "guide": [
      "Go to https://developer.hootsuite.com and sign in with your Hootsuite account.",
      "Click 'My Apps' in the top-right corner, then create a new app.",
      "Inside your app, add a new app extension and set its type to 'Media'.",
      "In the extension's Security settings, add your redirect URI (e.g. https://your-server.com/oauth/hootsuite/callback).",
      "Copy the Client ID and Client Secret from your app settings.",
      "Paste both into your agent server settings.",
      "Click 'Connect Hootsuite' in your dashboard. You will be taken to Hootsuite to approve access.",
      "Your agent will be able to schedule posts to any social profile linked to your Hootsuite account via POST https://platform.hootsuite.com/v1/messages."
    ],
    "agentUsage": "POST https://platform.hootsuite.com/v1/messages -H 'Authorization: Bearer <access_token>' -H 'Content-Type: application/json'",
    "docsUrl": "https://developer.hootsuite.com/docs/api-authentication",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://platform.hootsuite.com/oauth2/auth",
      "tokenEp": "https://platform.hootsuite.com/oauth2/token",
      "revokeEp": "",
      "scopes": [
        "offline"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://developer.hootsuite.com, sign in, and click 'My Apps' in the top-right. Create a new app and add a 'Media' app extension. In the extension's Security tab, add your redirect URI (e.g. https://your-server.com/oauth/hootsuite/callback). Copy the Client ID and Client Secret. Use scope 'offline' to receive a refresh token for long-lived access. Authenticated API calls go to https://platform.hootsuite.com/v1/ with an Authorization: Bearer header.",
    "inject": [
      {
        "env": "HOOTSUITE_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "later",
    "name": "Later",
    "category": "Social & content publishing",
    "icon": "📢",
    "color": "#E1306C",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://help-influence.later.com/hc/en-us/articles/20462313325207-Later-Influence-API-Integrations",
      "https://later.com/partners/"
    ],
    "guide": [
      "Later does not currently offer a self-service public API for independent developers or third-party integrations.",
      "API access is available only to Later Agency plan customers, provided through direct contact with a Later Customer Success Manager - contact success@later.com or reach out via your account dashboard.",
      "If you are on an Agency plan, ask your CSM to provision API credentials (clientId and clientSecret).",
      "For most self-hosted agent use cases, Buffer is a practical alternative: it has a fully public API, covers the same social platforms (Instagram, TikTok, X, LinkedIn, Pinterest, etc.), and is free to start.",
      "Alternatively, post directly to each social platform's native API - TikTok, LinkedIn, X, Pinterest, and Reddit are all supported individually in this dashboard."
    ],
    "agentUsage": "N/A - Later does not offer a publicly available API for independent developers. API access is restricted to approved agency plan customers via their Customer Success Manager.",
    "docsUrl": "",
    "auth": "none"
  },
  {
    "id": "twilio",
    "name": "Twilio",
    "category": "Telephony / SMS",
    "icon": "📱",
    "color": "#F22F46",
    "brandSlug": "twilio",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://www.twilio.com/docs/messaging/api",
      "https://www.twilio.com/docs/usage/requests-to-twilio",
      "https://www.twilio.com/docs/iam/api-keys",
      "https://www.twilio.com/docs/iam/api-keys/keys-in-console"
    ],
    "guide": [
      "Go to console.twilio.com and sign in (or sign up for a free trial account).",
      "On the Console home page, copy your Account SID - you will need this later.",
      "In the left sidebar, navigate to Settings > Account Settings > API Keys and Auth Tokens.",
      "Click 'Create API key', enter a name like 'Dream Labs Agent', leave the type as Standard, then click Next.",
      "Copy the Key SID and the Secret shown on screen - the Secret is only shown once, so save it somewhere safe now.",
      "In your Twilio phone numbers list (Phone Numbers > Manage > Active Numbers), copy the phone number you want to send from.",
      "Paste your Account SID, API Key SID, API Key Secret, and From Number into the Dream Labs connector form.",
      "Save the connector - your agent can now send and receive SMS via Twilio."
    ],
    "agentUsage": "POST https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json  Authorization: Basic base64(TWILIO_API_KEY_SID:TWILIO_API_KEY_SECRET)  Body: To=%2B15005550006&From=%2B14155550100&Body=Hello+from+Dream+Labs",
    "docsUrl": "https://www.twilio.com/docs/iam/api-keys",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "TWILIO_ACCOUNT_SID",
        "label": "Account SID",
        "secret": false
      },
      {
        "name": "TWILIO_API_KEY_SID",
        "label": "API Key SID",
        "secret": false
      },
      {
        "name": "TWILIO_API_KEY_SECRET",
        "label": "API Key Secret",
        "secret": true
      },
      {
        "name": "TWILIO_FROM_NUMBER",
        "label": "From Phone Number (e.g. +14155550100)",
        "secret": false
      }
    ],
    "apiBase": "https://api.twilio.com/2010-04-01",
    "authHeader": "Authorization: Basic base64({API_KEY_SID}:{API_KEY_SECRET})",
    "whereToGetKey": "Log in to the Twilio Console at console.twilio.com. Your Account SID is shown on the Console home page. To create an API key: go to Settings > Account Settings > API Keys & Auth Tokens, click 'Create API key', give it a name, choose Standard type, click Next, then copy the Key SID and Secret immediately (the secret is shown only once).",
    "inject": [
      {
        "env": "TWILIO_ACCOUNT_SID",
        "source": "field.TWILIO_ACCOUNT_SID"
      },
      {
        "env": "TWILIO_API_KEY_SID",
        "source": "field.TWILIO_API_KEY_SID"
      },
      {
        "env": "TWILIO_API_KEY_SECRET",
        "source": "field.TWILIO_API_KEY_SECRET"
      },
      {
        "env": "TWILIO_FROM_NUMBER",
        "source": "field.TWILIO_FROM_NUMBER"
      }
    ]
  },
  {
    "id": "messagebird",
    "name": "MessageBird (Bird)",
    "category": "Telephony / SMS",
    "icon": "📱",
    "color": "#F22F46",
    "brandSlug": "messagebird",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.messagebird.com/api/sms-messaging/",
      "https://developers.messagebird.com/docs/authentication",
      "https://dashboard.messagebird.com/en/developers/access"
    ],
    "guide": [
      "Go to dashboard.messagebird.com and sign in (or create a free MessageBird account).",
      "In the left sidebar, click 'Developers', then click 'API access'.",
      "Click 'Add access key', give it a name like 'Dream Labs Agent', and choose Live (for production) or Test (for testing).",
      "Copy the access key value shown - save it somewhere safe as it may not be shown again in full.",
      "Note your sender identity: this is either an alphanumeric name (up to 11 characters, e.g. your brand name) or a purchased phone number from your MessageBird account.",
      "Paste your Access Key and Sender identity into the Dream Labs connector form.",
      "Save the connector - your agent can now send SMS messages via MessageBird.",
      "To verify the connection, ask the agent to send a test message to your own phone number."
    ],
    "agentUsage": "POST https://rest.messagebird.com/messages  Authorization: AccessKey live_your_key_here  Body: originator=YourBrand&recipients=31612345678&body=Hello+from+Dream+Labs",
    "docsUrl": "https://developers.messagebird.com/docs/authentication",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "MESSAGEBIRD_API_KEY",
        "label": "Access Key",
        "secret": true
      },
      {
        "name": "MESSAGEBIRD_ORIGINATOR",
        "label": "Sender Name or Number (e.g. YourBrand or +14155550100)",
        "secret": false
      }
    ],
    "apiBase": "https://rest.messagebird.com",
    "authHeader": "Authorization: AccessKey {MESSAGEBIRD_API_KEY}",
    "whereToGetKey": "Log in to the MessageBird Dashboard at dashboard.messagebird.com, then navigate to Developers > API access (or go directly to dashboard.messagebird.com/en/developers/access). Click 'Add access key' to create a new live key (no prefix) or test key (prefix test_). Copy the key value immediately.",
    "inject": [
      {
        "env": "MESSAGEBIRD_API_KEY",
        "source": "field.MESSAGEBIRD_API_KEY"
      },
      {
        "env": "MESSAGEBIRD_ORIGINATOR",
        "source": "field.MESSAGEBIRD_ORIGINATOR"
      }
    ]
  },
  {
    "id": "fireflies",
    "name": "Fireflies.ai",
    "category": "Transcription / meetings",
    "icon": "🎙️",
    "color": "#6B5B95",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://docs.fireflies.ai/getting-started/quickstart",
      "https://docs.fireflies.ai/graphql-api/query/transcript",
      "https://docs.fireflies.ai/graphql-api/query/transcripts",
      "https://guide.fireflies.ai/articles/3737786777-fireflies-api-overview-get-api-key"
    ],
    "guide": [
      "Go to app.fireflies.ai and sign in to your account.",
      "Click 'Integrations' in the left sidebar, then search for 'Fireflies API' and open it.",
      "Click 'Get API Key' - you will land on the Developer Settings page under your Personal tab.",
      "Copy the API key shown on that page and keep it somewhere safe.",
      "In the Dream Labs Agent Server dashboard, open the Fireflies connector and paste the key into the 'API Key' field.",
      "Click Save - your agent can now list meeting transcripts, fetch summaries, action items, and upload audio for transcription."
    ],
    "agentUsage": "POST https://api.fireflies.ai/graphql  -H 'Authorization: Bearer $FIREFLIES_API_KEY'  -H 'Content-Type: application/json'  -d '{\"query\": \"{ transcripts(limit: 10) { id title date } }\"}'",
    "docsUrl": "https://docs.fireflies.ai/getting-started/quickstart",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.fireflies.ai/graphql",
    "authHeader": "Authorization: Bearer <api_key>",
    "whereToGetKey": "Log in to app.fireflies.ai, go to Integrations in the left sidebar, search for 'Fireflies API', click it, then click 'Get API Key'. You can also go directly to Settings > Developer Settings (Personal tab) and copy the key shown there.",
    "inject": [
      {
        "env": "FIREFLIES_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "otter",
    "name": "Otter.ai",
    "category": "Transcription / meetings",
    "icon": "🎙️",
    "color": "#6B5B95",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://help.otter.ai/hc/en-us/articles/4412365535895-Does-Otter-offer-an-open-API",
      "https://www.recall.ai/blog/how-to-integrate-with-otter-ai",
      "https://help.otter.ai/hc/en-us/articles/35287607569687-Otter-MCP-Server",
      "https://help.otter.ai/hc/en-us/articles/27616131311127-Zapier-Otter-ai-Integration"
    ],
    "guide": [
      "Otter.ai does not offer a self-service public API for free, Pro, or Business plan users.",
      "An API (Otter Connect API) exists only for Enterprise plan customers and must be enabled by contacting your Otter account manager.",
      "If you are on an Enterprise plan, contact Otter support or your account manager and ask them to enable API access for your workspace.",
      "Once enabled, Otter will provide credentials or instructions specific to your enterprise account.",
      "Until then, you can export transcripts manually from otter.ai by opening a conversation, clicking the three-dot menu, and choosing 'Export' (TXT, PDF, or SRT).",
      "For automation without an Enterprise plan, consider using Zapier's native Otter.ai integration (available in-product under Integrations > Zapier), which covers basic trigger and action workflows without needing direct API access."
    ],
    "agentUsage": "No public API available - Otter.ai does not expose a self-service API key or OAuth flow for standard or business plans. Enterprise plans can request API access by contacting their account manager, but no public endpoint is documented.",
    "docsUrl": "",
    "auth": "none"
  },
  {
    "id": "pdfmonkey",
    "name": "PDFMonkey",
    "category": "Docs generation",
    "icon": "📄",
    "color": "#E94F37",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://pdfmonkey.io/docs/api/authentication/",
      "https://pdfmonkey.io/docs/api/documents/",
      "https://docs.pdfmonkey.io/guides/first-api-call"
    ],
    "guide": [
      "Sign in to your PDFMonkey account at dashboard.pdfmonkey.io.",
      "Click the top-left account menu and select My Account.",
      "Scroll to the API Key section and copy your API Secret Key.",
      "In the Dream Labs Agent Server dashboard, open the PDFMonkey connector settings.",
      "Paste the key into the 'API Secret Key' field and click Save.",
      "In PDFMonkey, open the Templates section and copy the UUID of the template you want to use.",
      "Your agent can now generate PDFs by posting to the documents endpoint with that template UUID."
    ],
    "agentUsage": "POST https://api.pdfmonkey.io/api/v1/documents -H 'Authorization: Bearer $PDFMONKEY_API_KEY' -H 'Content-Type: application/json' -d '{\"document\":{\"document_template_id\":\"<template-uuid>\",\"status\":\"pending\",\"payload\":{\"clientName\":\"Acme Corp\"}}}'",
    "docsUrl": "https://pdfmonkey.io/docs/api/authentication/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Secret Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.pdfmonkey.io/api/v1",
    "authHeader": "Authorization: Bearer <key>",
    "whereToGetKey": "Log in to PDFMonkey, open the top-left account menu, go to My Account (https://dashboard.pdfmonkey.io/account), and copy your API Secret Key from the API Key section.",
    "inject": [
      {
        "env": "PDFMONKEY_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "pandadoc",
    "name": "PandaDoc",
    "category": "Docs generation",
    "icon": "📄",
    "color": "#E94F37",
    "brandSlug": "pandadoc",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.pandadoc.com/reference/api-key-authentication-process",
      "https://developers.pandadoc.com/reference/authentication-process",
      "https://developers.pandadoc.com/reference/access-token.md",
      "https://developers.pandadoc.com/reference/create-document.md",
      "https://developers.pandadoc.com/reference/production-api-key.md"
    ],
    "guide": [
      "Log in to PandaDoc and navigate to the Developer Dashboard at app.pandadoc.com/a/#/api-dashboard/configuration.",
      "If you are on the Enterprise plan, click Generate to create a Production API key - if not, use the Sandbox key for testing or contact your PandaDoc CSM to enable Production API access.",
      "Copy the API key shown on the Configuration page.",
      "In the Dream Labs Agent Server dashboard, open the PandaDoc connector settings.",
      "Paste the key into the 'API Key' field and click Save.",
      "In PandaDoc, open a template and copy its UUID from the template settings or URL.",
      "Your agent can now create documents by posting to the documents endpoint with the template UUID and recipient details."
    ],
    "agentUsage": "POST https://api.pandadoc.com/public/v1/documents -H 'Authorization: API-Key $PANDADOC_API_KEY' -H 'Content-Type: application/json' -d '{\"name\":\"Client Agreement\",\"template_uuid\":\"<template-uuid>\",\"recipients\":[{\"email\":\"client@example.com\",\"first_name\":\"Jane\",\"last_name\":\"Smith\",\"role\":\"Signer\"}]}'",
    "docsUrl": "https://developers.pandadoc.com/reference/authentication-process",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.pandadoc.com/public/v1",
    "authHeader": "Authorization: API-Key <key>",
    "whereToGetKey": "In PandaDoc, go to the Developer Dashboard at app.pandadoc.com/a/#/api-dashboard/configuration. Generate a Sandbox key (free for testing) or request Production API access from your CSM or sales team (requires Enterprise plan approval). Copy the key from the Configuration page.",
    "inject": [
      {
        "env": "PANDADOC_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "ideogram",
    "name": "Ideogram",
    "category": "Image / design gen",
    "icon": "🎨",
    "color": "#7B2FF7",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.ideogram.ai/ideogram-api/api-setup",
      "https://developer.ideogram.ai/api-reference/api-reference/generate",
      "https://developer.ideogram.ai/ideogram-api/api-overview"
    ],
    "guide": [
      "Go to ideogram.ai and sign in or create a free account.",
      "Navigate to ideogram.ai/manage-api (the API dashboard).",
      "Accept the Developer API Agreement and Policy.",
      "Click 'Manage Payment' and add a credit card - the API is pay-per-use.",
      "Click 'Create API key', give it a name, and confirm.",
      "Copy the key immediately - it is shown only once and cannot be retrieved again.",
      "Paste the key into the 'Ideogram API Key' field in the Dream Labs dashboard.",
      "Click Save. Your agents can now generate images via Ideogram."
    ],
    "agentUsage": "POST https://api.ideogram.ai/generate  Api-Key: $IDEOGRAM_API_KEY  Content-Type: application/json  Body: {\"image_request\":{\"prompt\":\"A minimalist logo on white background\"}}",
    "docsUrl": "https://developer.ideogram.ai/ideogram-api/api-setup",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "Ideogram API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.ideogram.ai",
    "authHeader": "Api-Key: <key>",
    "whereToGetKey": "Go to ideogram.ai/manage-api, accept the Developer API Agreement, add a payment method, then click 'Create API key'. The full key is shown only once - copy it immediately.",
    "inject": [
      {
        "env": "IDEOGRAM_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "canva",
    "name": "Canva",
    "category": "Image / design gen",
    "icon": "🎨",
    "color": "#7B2FF7",
    "brandSlug": "canva",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://www.canva.dev/docs/connect/authentication/",
      "https://www.canva.dev/docs/connect/creating-integrations/",
      "https://www.canva.dev/docs/connect/api-reference/authentication/generate-access-token/",
      "https://www.canva.dev/docs/connect/api-reference/authentication/revoke-token/",
      "https://www.canva.dev/docs/connect/appendix/scopes/",
      "https://www.canva.dev/docs/connect/api-reference/designs/create-design/"
    ],
    "guide": [
      "Enable Multi-Factor Authentication (MFA) on your Canva account - this is required before you can create an integration.",
      "Go to canva.com/developers and click 'Your integrations', then 'Create an integration'.",
      "Choose 'Private' integration (no Canva review needed for your own server), accept the terms, and enter an integration name.",
      "Copy your Client ID from the Credentials section.",
      "Click 'Generate secret', copy the Client Secret immediately, and store it safely - it will not be shown again.",
      "Go to Scopes and enable: design:meta:read, design:content:read, design:content:write, asset:read, asset:write, folder:read.",
      "Go to Authentication - Authorized redirects and add your server's callback URL, e.g. https://your-server.com/oauth/canva/callback.",
      "Paste the Client ID and Client Secret into the Canva fields in the Dream Labs dashboard.",
      "Click Save, then click 'Connect' to go through the Canva login flow and grant your agent access to your Canva account."
    ],
    "agentUsage": "POST https://api.canva.com/rest/v1/designs  Authorization: Bearer <access_token>  Content-Type: application/json  Body: {\"type\":\"type_and_asset\",\"design_type\":{\"type\":\"preset\",\"name\":\"presentation\"},\"title\":\"My Agent Design\"}",
    "docsUrl": "https://www.canva.dev/docs/connect/authentication/",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://www.canva.com/api/oauth/authorize",
      "tokenEp": "https://api.canva.com/rest/v1/oauth/token",
      "revokeEp": "https://api.canva.com/rest/v1/oauth/revoke",
      "scopes": [
        "design:meta:read",
        "design:content:read",
        "design:content:write",
        "asset:read",
        "asset:write",
        "folder:read"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to canva.com/developers and open 'Your integrations'. Click 'Create an integration' and choose Private (for your own team/server) or Public (requires Canva review). Enable Multi-Factor Authentication on your Canva account first - it is required. Give the integration a name, then copy the Client ID. Click 'Generate secret' and copy the Client Secret immediately (shown once only). Under Scopes, enable: design:meta:read, design:content:read, design:content:write, asset:read, asset:write, folder:read. Under Authentication - Authorized redirects, add your server's redirect URI, e.g. https://your-server.com/oauth/canva/callback. The flow uses Authorization Code + PKCE (SHA-256) - your server must generate a code_verifier and code_challenge for each auth request.",
    "inject": [
      {
        "env": "CANVA_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "deputy",
    "name": "Deputy",
    "category": "Rostering / HR",
    "icon": "🗓️",
    "color": "#00B289",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.deputy.com/docs/the-hello-world-of-deputy",
      "https://developer.deputy.com/docs/authenticating-with-deputy",
      "https://developer.deputy.com/docs/getting-started-with-the-deputy-api"
    ],
    "guide": [
      "Log in to your Deputy account at your business URL (e.g. https://mybusiness.au.deputy.com).",
      "In your browser address bar, replace the end of your URL with /exec/devapp/oauth_clients and press Enter.",
      "Click 'New OAuth Client' and fill in a name (e.g. Dream Labs Agent) and a short description.",
      "Set the Redirect URI to http://localhost and click 'Save this OAuth Client'.",
      "On the client summary page, click 'Get an Access Token'.",
      "Copy the token from the pop-up immediately - it is only displayed once and cannot be retrieved again.",
      "Paste your full Deputy URL (e.g. https://mybusiness.au.deputy.com) and your token into the Dream Labs connector fields.",
      "Click 'Test Connection' to confirm the agent can reach your account."
    ],
    "agentUsage": "GET https://{installname}.{geo}.deputy.com/api/v1/resource/Employee Authorization: Bearer <permanent_token>",
    "docsUrl": "https://developer.deputy.com/docs/the-hello-world-of-deputy",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "install_url",
        "label": "Deputy Install URL (e.g. https://mybusiness.au.deputy.com)",
        "secret": false
      },
      {
        "name": "permanent_token",
        "label": "Permanent API Token",
        "secret": true
      }
    ],
    "apiBase": "https://{installname}.{geo}.deputy.com/api/v1",
    "authHeader": "Authorization: Bearer <permanent_token>",
    "whereToGetKey": "Log into your Deputy install, then go to https://{installname}.{geo}.deputy.com/exec/devapp/oauth_clients. Click 'New OAuth Client', fill in a name and description, set the Redirect URI to http://localhost, and save. On the summary page click 'Get an Access Token' - copy the token immediately as it is only shown once.",
    "inject": [
      {
        "env": "DEPUTY_INSTALL_URL",
        "source": "field.install_url"
      },
      {
        "env": "DEPUTY_PERMANENT_TOKEN",
        "source": "field.permanent_token"
      }
    ]
  },
  {
    "id": "when-i-work",
    "name": "When I Work",
    "category": "Rostering / HR",
    "icon": "🗓️",
    "color": "#00B289",
    "brandSlug": "",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://help.wheniwork.com/articles/getting-access-to-the-when-i-work-api-computer/",
      "https://apidocs.wheniwork.com/external/index.html",
      "https://help.wheniwork.com/articles/api-services-reference-guide/"
    ],
    "guide": [
      "Make sure you are an admin on your When I Work account.",
      "Go to the When I Work Partners Page (wheniwork.com/partners) and submit an API access request with your company name, your name, email, phone number, and a short description of what you want to automate.",
      "When I Work will email you a developer API key (the W-Key) - this may take a few business days.",
      "Once you have the key, paste it along with your admin email and password into the Dream Labs connector fields.",
      "The agent will use these credentials to obtain a session token automatically on each run - tokens expire after 7 days and are refreshed automatically.",
      "Click 'Test Connection' to verify the agent can log in and list your shifts."
    ],
    "agentUsage": "POST https://api.login.wheniwork.com/login W-Key: <developer_key> Content-Type: application/json body: {\"email\":\"admin@example.com\",\"password\":\"yourpassword\"} -- then use the returned token as: Authorization: Bearer <token> for subsequent requests e.g. GET https://api.wheniwork.com/2/shifts",
    "docsUrl": "https://help.wheniwork.com/articles/getting-access-to-the-when-i-work-api-computer/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "developer_key",
        "label": "Developer API Key (W-Key)",
        "secret": true
      },
      {
        "name": "login_email",
        "label": "Admin Account Email",
        "secret": false
      },
      {
        "name": "login_password",
        "label": "Admin Account Password",
        "secret": true
      }
    ],
    "apiBase": "https://api.wheniwork.com/2",
    "authHeader": "W-Key: <developer_key>",
    "whereToGetKey": "When I Work does not issue developer keys via a self-serve UI. You must email their access team (via the Partners Page at wheniwork.com) with your company name, admin contact details, and intended use. You must have admin-level access on the account. Once approved, you receive a developer key (W-Key) used alongside your account credentials to obtain a session token.",
    "inject": [
      {
        "env": "WHEN_I_WORK_DEVELOPER_KEY",
        "source": "field.developer_key"
      },
      {
        "env": "WHEN_I_WORK_LOGIN_EMAIL",
        "source": "field.login_email"
      },
      {
        "env": "WHEN_I_WORK_LOGIN_PASSWORD",
        "source": "field.login_password"
      }
    ]
  },
  {
    "id": "ahrefs",
    "name": "Ahrefs",
    "category": "Research / SEO / data",
    "icon": "🔎",
    "color": "#34A853",
    "brandSlug": "ahrefs",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://docs.ahrefs.com/docs/api/reference/api-keys-creation-and-management",
      "https://docs.ahrefs.com/en/api/reference/site-explorer/get-all-backlinks"
    ],
    "guide": [
      "Log in to your Ahrefs account at app.ahrefs.com.",
      "Click your account avatar (top right) and choose Account Settings.",
      "Select 'API keys' from the left sidebar - you need to be a workspace owner or admin.",
      "Click 'Create API key', give it a name (e.g. 'Dream Labs Agent'), and save.",
      "Copy the key that appears - it is only shown once in full, so copy it now.",
      "Paste the key into the API Key field in the Dream Labs connector setup.",
      "Save the connector - your agent can now query backlinks, keywords, and domain metrics."
    ],
    "agentUsage": "GET https://api.ahrefs.com/v3/site-explorer/all-backlinks?target=example.com&mode=subdomains&limit=10 -H 'Authorization: Bearer $AHREFS_API_KEY' -H 'Accept: application/json'",
    "docsUrl": "https://docs.ahrefs.com/docs/api/reference/api-keys-creation-and-management",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.ahrefs.com/v3",
    "authHeader": "Authorization: Bearer <key>",
    "whereToGetKey": "Log in to Ahrefs, go to Account Settings > API keys, and click 'Create API key'. Only workspace owners and admins can access this section. Keys expire after 1 year.",
    "inject": [
      {
        "env": "AHREFS_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "semrush",
    "name": "SEMrush",
    "category": "Research / SEO / data",
    "icon": "🔎",
    "color": "#34A853",
    "brandSlug": "semrush",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.semrush.com/api/get-started/authorization/",
      "https://www.semrush.com/kb/92-api-key",
      "https://developer.semrush.com/api/seo/overview/"
    ],
    "guide": [
      "Log in to your SEMrush account at semrush.com.",
      "Click the account icon in the top-right corner of any page.",
      "Choose 'Subscription info' from the dropdown menu.",
      "Click the 'API units' tab - your API key is shown at the top of this page.",
      "Click to copy the key.",
      "Paste it into the API Key field in the Dream Labs connector setup.",
      "Save the connector - your agent can now query domain overviews, keyword rankings, and backlink data."
    ],
    "agentUsage": "GET https://api.semrush.com/?key=$SEMRUSH_API_KEY&type=domain_overview&domain=example.com&database=us",
    "docsUrl": "https://developer.semrush.com/api/get-started/authorization/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.semrush.com",
    "authHeader": "Authorization: Apikey <key>",
    "whereToGetKey": "Log in to SEMrush, click your account icon (top right), select 'Subscription info', then open the 'API units' tab. Your API key is displayed there.",
    "inject": [
      {
        "env": "SEMRUSH_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "similarweb",
    "name": "SimilarWeb",
    "category": "Research / SEO / data",
    "icon": "🔎",
    "color": "#34A853",
    "brandSlug": "similarweb",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developers.similarweb.com/docs/authentication",
      "https://support.similarweb.com/hc/en-us/articles/22469174026397-API-Keys-Creation-and-Management",
      "https://developers.similarweb.com/docs/set-up-your-batch-api",
      "https://developers.similarweb.com/docs/rank-tracking-api-get-your-api-key"
    ],
    "guide": [
      "Log in to your SimilarWeb account.",
      "Click the Settings icon (gear) in the top navigation and select 'Account'.",
      "Go directly to https://account.similarweb.com/standard-api.",
      "Click 'Generate A New API Key' and give it a descriptive name (e.g. 'Dream Labs Agent').",
      "Toggle the key to 'Active' in the Generated Keys table - inactive keys return errors.",
      "Copy the API key from the table.",
      "Paste it into the API Key field in the Dream Labs connector setup and save."
    ],
    "agentUsage": "GET https://api.similarweb.com/v4/website/example.com/traffic-and-engagement/visits?start_date=2024-01&end_date=2024-03&country=us&granularity=monthly&main_domain_only=false -H 'api-key: $SIMILARWEB_API_KEY'",
    "docsUrl": "https://developers.similarweb.com/docs/authentication",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.similarweb.com/v4",
    "authHeader": "api-key: <key>",
    "whereToGetKey": "Log in to SimilarWeb, click the Settings icon and select 'Account', then navigate to https://account.similarweb.com/standard-api. Click 'Generate A New API Key', name it, and it appears in the Generated Keys table. Only account admins can create keys.",
    "inject": [
      {
        "env": "SIMILARWEB_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "crunchbase",
    "name": "Crunchbase",
    "category": "Research / SEO / data",
    "icon": "🔎",
    "color": "#34A853",
    "brandSlug": "crunchbase",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://data.crunchbase.com/docs/using-the-api",
      "https://data.crunchbase.com/docs/calling-api-endpoints",
      "https://support.crunchbase.com/hc/en-us/articles/32159485516691-API-User-Key-Access"
    ],
    "guide": [
      "Log in to your Crunchbase account at crunchbase.com.",
      "Click your profile icon and choose 'Account Settings'.",
      "Select 'Integrations' from the left sidebar.",
      "Click 'Crunchbase API' - you must have an API-enabled plan (Basic, Applications, or Enterprise).",
      "Click 'Show Key' to reveal your API user key.",
      "Copy the key.",
      "Paste it into the API User Key field in the Dream Labs connector setup and save.",
      "Note: all API requests must use HTTPS - HTTP calls will be rejected with a 426 error."
    ],
    "agentUsage": "GET https://api.crunchbase.com/v4/data/entities/organizations/example-company?field_ids=short_description,num_employees_enum,revenue_range -H 'X-cb-user-key: $CRUNCHBASE_USER_KEY' -H 'Content-Type: application/json'",
    "docsUrl": "https://data.crunchbase.com/docs/using-the-api",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "user_key",
        "label": "API User Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.crunchbase.com/v4/data",
    "authHeader": "X-cb-user-key: <key>",
    "whereToGetKey": "Log in to Crunchbase, go to Account Settings > Integrations > Crunchbase API, and click 'Show Key' to reveal your API key. Requires an Enterprise, Applications, or Crunchbase Basic API plan.",
    "inject": [
      {
        "env": "CRUNCHBASE_USER_KEY",
        "source": "field.user_key"
      }
    ]
  },
  {
    "id": "yelp",
    "name": "Yelp",
    "category": "Reviews & local listings",
    "icon": "⭐",
    "color": "#FBBC04",
    "brandSlug": "yelp",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://docs.developer.yelp.com/docs/places-intro",
      "https://docs.developer.yelp.com/docs/respond-to-reviews-api-v2",
      "https://docs.developer.yelp.com/reference/create_review_response"
    ],
    "guide": [
      "Go to yelp.com/developers and sign in with your Yelp account (create one if needed - this is separate from a Business Owner account).",
      "Click 'Manage App' in the top navigation, then click 'Create New App'.",
      "Fill in the app name, industry, and contact email, then agree to the terms and click Create.",
      "Your API key is shown immediately on the app page - copy it now.",
      "In the Dream Labs dashboard, paste the API key into the Yelp connector field and save.",
      "NOTE - responding to reviews via API requires a separate Yelp Partner agreement (enterprise plan with 10+ locations or a Yelp Listing Management purchase). Standard API keys are read-only for reviews. Contact a Yelp sales rep if you need the Respond to Reviews API."
    ],
    "agentUsage": "GET https://api.yelp.com/v3/businesses/{business_id}/reviews  Authorization: Bearer $YELP_API_KEY",
    "docsUrl": "https://docs.developer.yelp.com/docs/places-intro",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_key",
        "label": "Yelp API Key",
        "secret": true
      }
    ],
    "apiBase": "https://api.yelp.com/v3",
    "authHeader": "Authorization: Bearer <api_key>",
    "whereToGetKey": "Go to yelp.com/developers, sign in with your Yelp account, click 'Manage App', then create or view your app to find the auto-generated private API key.",
    "inject": [
      {
        "env": "YELP_API_KEY",
        "source": "field.api_key"
      }
    ]
  },
  {
    "id": "trustpilot",
    "name": "Trustpilot",
    "category": "Reviews & local listings",
    "icon": "⭐",
    "color": "#FBBC04",
    "brandSlug": "trustpilot",
    "provider": "self",
    "confidence": "medium",
    "sources": [
      "https://developers.trustpilot.com/authentication",
      "https://developers.trustpilot.com/service-reviews-api/",
      "https://developers.trustpilot.com/grant-type-auth-code/",
      "https://developers.trustpilot.com/business-units-api"
    ],
    "guide": [
      "Go to developers.trustpilot.com and sign in with your Trustpilot business account.",
      "Click 'Create Application', fill in the app name and description, and submit.",
      "Copy the Client ID and Client Secret from the application detail page.",
      "To enable replying to reviews, run the OAuth Authorization Code flow once: visit https://authenticate.trustpilot.com?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code in a browser.",
      "Log in as your business user when prompted, then copy the authorization code from the redirect URL.",
      "Exchange the code for tokens by POST-ing to https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken with your Client ID and Secret as Basic auth and the code in the body.",
      "Save the access token and refresh token in the Dream Labs dashboard - the agent will use these to read reviews (public API key) and post replies (Bearer token).",
      "Tokens expire - set up a refresh job using the refresh endpoint (POST /revoke then /accesstoken) every 90 hours to stay connected.",
      "NOTE - replying to reviews via the private API (POST /private/reviews/{reviewId}/reply) requires your Trustpilot account to have the API module enabled, which is typically part of a paid or partner plan. Contact Trustpilot support if the endpoint returns 403."
    ],
    "agentUsage": "GET https://api.trustpilot.com/v1/business-units/{businessUnitId}/reviews  apikey: $TRUSTPILOT_CLIENT_ID",
    "docsUrl": "https://developers.trustpilot.com/authentication",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://authenticate.trustpilot.com",
      "tokenEp": "https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken",
      "revokeEp": "https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/revoke",
      "scopes": [],
      "extraParams": {}
    },
    "appSetupNotes": "Log in to developers.trustpilot.com and create an application to receive a Client ID (API key) and Client Secret. Provide your redirect URI (must be HTTPS) to your Trustpilot Partner Manager or enter it in the developer portal app settings - the redirect URI must match exactly when you exchange the authorization code for a token. Use the Authorization Code grant for user-delegated access (needed to reply to reviews as a business user). Public read endpoints only need the API key header; private write endpoints (replying, tagging) require a Bearer OAuth token. Access tokens expire after 100 hours; refresh tokens expire after 30 days.",
    "inject": [
      {
        "env": "TRUSTPILOT_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "wordpress",
    "name": "WordPress",
    "category": "Site & dev / infra",
    "icon": "🛠️",
    "color": "#3DDC84",
    "brandSlug": "wordpress",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/",
      "https://developer.wordpress.org/advanced-administration/security/application-passwords/"
    ],
    "guide": [
      "Log in to your WordPress admin dashboard (e.g. https://yoursite.com/wp-admin).",
      "Go to Users → Profile (or Users → All Users and click your name).",
      "Scroll down to the 'Application Passwords' section near the bottom of the page.",
      "Type a label such as 'Dream Labs Agent' in the 'New Application Password Name' field.",
      "Click 'Add New Application Password' and immediately copy the password shown - it will not be shown again.",
      "Note your WordPress username shown at the top of the same profile page.",
      "In Dream Labs, paste your Site URL (e.g. https://yoursite.com), your WordPress username, and the application password you just copied.",
      "Note: your site must be running on HTTPS for Application Passwords to work."
    ],
    "agentUsage": "GET https://<WP_SITE_URL>/wp-json/wp/v2/posts?status=draft   Authorization: Basic BASE64(WP_USERNAME:WP_APP_PASSWORD)",
    "docsUrl": "https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "site_url",
        "label": "Site URL (e.g. https://example.com)",
        "secret": false
      },
      {
        "name": "username",
        "label": "WordPress Username",
        "secret": false
      },
      {
        "name": "app_password",
        "label": "Application Password",
        "secret": true
      }
    ],
    "apiBase": "https://<your-site>/wp-json/wp/v2",
    "authHeader": "Authorization: Basic BASE64(username:app-password)",
    "whereToGetKey": "WordPress Admin → Users → Edit your user → scroll to 'Application Passwords' → enter a name → click 'Add New Application Password' → copy the password shown (it is only shown once).",
    "inject": [
      {
        "env": "WORDPRESS_SITE_URL",
        "source": "field.site_url"
      },
      {
        "env": "WORDPRESS_USERNAME",
        "source": "field.username"
      },
      {
        "env": "WORDPRESS_APP_PASSWORD",
        "source": "field.app_password"
      }
    ]
  },
  {
    "id": "apify",
    "name": "Apify",
    "category": "Site & dev / infra",
    "icon": "🛠️",
    "color": "#3DDC84",
    "brandSlug": "apify",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://docs.apify.com/api/v2/getting-started",
      "https://docs.apify.com/platform/integrations/api",
      "https://docs.apify.com/api/v2"
    ],
    "guide": [
      "Sign in to your Apify account at https://console.apify.com.",
      "Click your avatar or name in the top-right corner and choose 'Settings'.",
      "In Settings, click the 'API & Integrations' tab in the left sidebar.",
      "Find 'Personal API token' and click the copy icon next to it.",
      "In Dream Labs, paste the token into the 'Apify API Token' field.",
      "The agent can now run Actors, read datasets, and manage storage on your behalf."
    ],
    "agentUsage": "POST https://api.apify.com/v2/actors/apify~web-scraper/runs   Authorization: Bearer <APIFY_API_TOKEN>   Content-Type: application/json",
    "docsUrl": "https://docs.apify.com/api/v2/getting-started",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "api_token",
        "label": "Apify API Token",
        "secret": true
      }
    ],
    "apiBase": "https://api.apify.com/v2",
    "authHeader": "Authorization: Bearer <token>",
    "whereToGetKey": "Apify Console → Settings → API & Integrations (https://console.apify.com/settings/integrations) → copy the token shown under 'Personal API token'.",
    "inject": [
      {
        "env": "APIFY_API_TOKEN",
        "source": "field.api_token"
      }
    ]
  },
  {
    "id": "supabase",
    "name": "Supabase",
    "category": "Site & dev / infra",
    "icon": "🛠️",
    "color": "#3DDC84",
    "brandSlug": "supabase",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://supabase.com/docs/guides/getting-started/api-keys",
      "https://supabase.com/docs/guides/api",
      "https://supabase.com/docs/guides/api/creating-routes"
    ],
    "guide": [
      "Sign in to your Supabase dashboard at https://supabase.com/dashboard.",
      "Click on the project you want to connect (or create a new one).",
      "In the left sidebar, click 'Settings', then 'API Keys'.",
      "Under 'Secret keys', find the row labelled 'service_role' and click 'Reveal' then copy the key.",
      "Also copy your Project URL shown at the top of the same page - it looks like https://abcdef.supabase.co.",
      "In Dream Labs, paste the Project URL and the service role key.",
      "Warning: the service role key bypasses all row-level security - keep it server-side only and never expose it in a browser or public repo."
    ],
    "agentUsage": "GET https://<SUPABASE_URL>/rest/v1/your_table?select=*   apikey: <SUPABASE_SERVICE_ROLE_KEY>   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>",
    "docsUrl": "https://supabase.com/docs/guides/getting-started/api-keys",
    "auth": "apikey",
    "kind": "apikey",
    "fields": [
      {
        "name": "project_url",
        "label": "Project URL (e.g. https://abcdef.supabase.co)",
        "secret": false
      },
      {
        "name": "service_role_key",
        "label": "Service Role Key (secret key)",
        "secret": true
      }
    ],
    "apiBase": "https://<project-ref>.supabase.co/rest/v1",
    "authHeader": "apikey: <service-role-key>   Authorization: Bearer <service-role-key>",
    "whereToGetKey": "Supabase Dashboard → select your project → Settings → API Keys → copy the 'service_role' key from the Secret Keys section. The Project URL is shown at the top of the same page.",
    "inject": [
      {
        "env": "SUPABASE_PROJECT_URL",
        "source": "field.project_url"
      },
      {
        "env": "SUPABASE_SERVICE_ROLE_KEY",
        "source": "field.service_role_key"
      }
    ]
  },
  {
    "id": "zoho-mail",
    "name": "Zoho Mail",
    "category": "Email & Calendar",
    "icon": "📧",
    "color": "#4285F4",
    "brandSlug": "zoho",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://www.zoho.com/mail/help/api/using-oauth-2.html",
      "https://www.zoho.com/mail/help/api/post-send-an-email.html",
      "https://www.zoho.com/mail/help/api/",
      "https://www.zoho.com/mail/help/api/getting-started-with-api.html",
      "https://www.zoho.com/accounts/protocol/oauth/multi-dc.html"
    ],
    "guide": [
      "Go to https://accounts.zoho.com/developerconsole and sign in with your Zoho account.",
      "Click 'ADD CLIENT', then choose 'Server-based Applications'.",
      "Enter a Client Name (e.g. 'Dream Labs Agent'), your site URL, and set the Redirect URI to https://<your-server>/oauth/callback/zoho-mail. Click CREATE.",
      "Copy the Client ID and Client Secret that appear - paste them into Dream Labs under Zoho Mail settings.",
      "Click 'Connect Zoho Mail' in the Dream Labs dashboard. You will be redirected to Zoho to approve the permissions - click Accept.",
      "After approval you are sent back to Dream Labs. Note the 'location' value in the redirect URL - if it says 'eu', 'in', or 'au', select that region in the Dream Labs Zoho Mail settings so API calls go to the right data center.",
      "Dream Labs will call the Zoho accounts API to fetch your Account ID automatically and store it. Your mailbox is now connected."
    ],
    "agentUsage": "POST https://mail.zoho.com/api/accounts/{accountId}/messages  Authorization: Zoho-oauthtoken <access_token>  Content-Type: application/json  Body: {\"fromAddress\":\"you@example.com\",\"toAddress\":\"them@example.com\",\"subject\":\"Hello\",\"content\":\"Body text\"}",
    "docsUrl": "https://www.zoho.com/mail/help/api/using-oauth-2.html",
    "auth": "oauth",
    "byo": true,
    "oauth": {
      "authEp": "https://accounts.zoho.com/oauth/v2/auth",
      "tokenEp": "https://accounts.zoho.com/oauth/v2/token",
      "revokeEp": "https://accounts.zoho.com/oauth/v2/token/revoke",
      "scopes": [
        "ZohoMail.accounts.READ",
        "ZohoMail.messages.READ",
        "ZohoMail.messages.CREATE",
        "ZohoMail.folders.READ"
      ],
      "extraParams": {}
    },
    "appSetupNotes": "Go to https://accounts.zoho.com/developerconsole and click 'ADD CLIENT'. Choose 'Server-based Applications'. Fill in Client Name, Homepage URL, and set the Authorized Redirect URI to https://<your-server>/oauth/callback/zoho-mail. Click CREATE to receive your Client ID and Client Secret. Note: Zoho is multi-DC - if your users are on the EU, India, AU, or other DCs, the OAuth base domain changes (e.g. accounts.zoho.eu for EU, accounts.zoho.in for India). The authorization callback will return a 'location' param - use the matching regional accounts server and API domain for all subsequent calls. US accounts use accounts.zoho.com and mail.zoho.com/api.",
    "inject": [
      {
        "env": "ZOHO_MAIL_ACCESS_TOKEN",
        "source": "oauth.access_token"
      }
    ]
  },
  {
    "id": "yahoo-mail",
    "name": "Yahoo Mail",
    "category": "Email & Calendar",
    "icon": "📧",
    "color": "#4285F4",
    "brandSlug": "yahoo",
    "provider": "self",
    "confidence": "high",
    "sources": [
      "https://help.yahoo.com/kb/account/generate-manage-third-party-passwords-sln15241.html",
      "https://help.yahoo.com/kb/SLN4075.html",
      "https://help.yahoo.com/kb/SLN36636.html",
      "https://senders.yahooinc.com/developer/developer-access/"
    ],
    "guide": [
      "Sign in to your Yahoo account at https://login.yahoo.com.",
      "Go to Account Security at https://myaccount.yahoo.com/security.",
      "Scroll to 'External connections' (or 'How you sign in') and click 'Create app password' or 'Manage app passwords'.",
      "Type a name for the app password (e.g. 'Dream Labs') and click Generate password.",
      "Copy the generated password immediately - Yahoo only shows it once.",
      "In Dream Labs, enter your Yahoo email address in the Email field and paste the app password into the App Password field.",
      "Click Save. Dream Labs will verify the connection over IMAP (imap.mail.yahoo.com port 993, SSL)."
    ],
    "agentUsage": "IMAP AUTHENTICATE via imap.mail.yahoo.com:993 (SSL) - username: user@yahoo.com, password: <app-password>. SMTP send via smtp.mail.yahoo.com:465 (SSL) with the same credentials.",
    "docsUrl": "https://help.yahoo.com/kb/account/generate-manage-third-party-passwords-sln15241.html",
    "auth": "apikey",
    "kind": "imap",
    "fields": [
      {
        "name": "yahoo_email",
        "label": "Yahoo Email Address",
        "secret": false
      },
      {
        "name": "yahoo_app_password",
        "label": "Yahoo App Password",
        "secret": true
      }
    ],
    "apiBase": "imaps://imap.mail.yahoo.com:993",
    "authHeader": "IMAP login: username = your Yahoo email address, password = generated app password",
    "whereToGetKey": "Sign in at https://login.yahoo.com, then go to Account Security (myaccount.yahoo.com/security). Under 'External connections', click 'Create app password', give it a name (e.g. Dream Labs), and click Generate. Copy the password shown - it will not be displayed again.",
    "inject": [
      {
        "env": "YAHOO_MAIL_YAHOO_EMAIL",
        "source": "field.yahoo_email"
      },
      {
        "env": "YAHOO_MAIL_YAHOO_APP_PASSWORD",
        "source": "field.yahoo_app_password"
      }
    ]
  }
];
