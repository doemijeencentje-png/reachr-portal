# n8n Setup Handleiding voor Reachr

## Overzicht

Deze handleiding legt stap voor stap uit hoe je de n8n workflows koppelt aan het Reachr portal.

---

## Stap 1: Workflows Importeren

1. Open n8n
2. Ga naar **Workflows** → **Import from File**
3. Importeer beide bestanden:
   - `01-daily-content-creation.json`
   - `02-performance-monitor.json`

---

## Stap 2: Environment Variables in n8n

Ga naar **Settings** → **Variables** en voeg toe:

| Variable | Waarde | Uitleg |
|----------|--------|--------|
| `REACHR_PORTAL_URL` | `https://jouw-reachr.vercel.app` | URL van je gedeployde portal |
| `SLACK_CHANNEL_ID` | `C0123456789` | ID van je Slack channel |

---

## Stap 3: Credentials Aanmaken

### 3.1 Reachr Portal Auth (HTTP Header Auth)

1. Ga naar **Credentials** → **Add Credential**
2. Kies **HTTP Header Auth**
3. Vul in:
   - **Name**: `Reachr Portal Auth`
   - **Header Name**: `x-portal-key`
   - **Header Value**: (zelfde als `PORTAL_API_KEY` in je portal .env.local)

### 3.2 Slack OAuth

1. Ga naar **Credentials** → **Add Credential**
2. Kies **Slack OAuth2 API**
3. Verbind met je Slack workspace
4. Geef toestemming voor:
   - `chat:write`
   - `channels:read`

### 3.3 Google OAuth (voor GA4)

*Alleen nodig als je GA4 gebruikt voor stats*

1. Ga naar **Credentials** → **Add Credential**
2. Kies **Google OAuth2 API**
3. Verbind met je Google account
4. Geef toestemming voor Analytics API

---

## Stap 4: Portal .env.local Checken

Zorg dat je portal deze variabelen heeft:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-xxx

# Portal Security - MOET MATCHEN MET N8N!
PORTAL_API_KEY=jouw-geheime-key-hier

# n8n (optioneel, voor webhooks)
N8N_WEBHOOK_URL=https://jouw-n8n.com/webhook/xxx
```

---

## Stap 5: Workflow Flow Uitleg

### Workflow 1: Daily Content Creation

```
09:00 Trigger
    ↓
Haal actieve klanten op van Portal
    ↓
Voor elke klant:
    ↓
[Portal] POST /api/ai/research
    → Claude kiest topic
    ↓
[Portal] POST /api/ai/generate
    → Claude schrijft artikel
    ↓
[Portal] GET /api/tenants/{id}/config
    → Haal WordPress credentials
    ↓
[WordPress] POST /wp-json/wp/v2/posts
    → Publiceer artikel
    ↓
[Portal] POST /api/content/published
    → Markeer als "monitoring"
    ↓
[Slack] Notificatie
```

### Workflow 2: Performance Monitor

```
Elk uur Trigger
    ↓
[Portal] GET /api/ai/evaluate
    → Haal posts die 72 uur oud zijn
    ↓
Voor elke post:
    ↓
[GA4/Jetpack] Haal views op
    ↓
[Portal] POST /api/ai/evaluate
    → Beslissing: optimize of takedown
    ↓
┌─────────────────────┬─────────────────────┐
│ views >= threshold  │ views < threshold   │
│                     │                     │
│ [Portal] /optimize  │ [WordPress] draft   │
│ [WordPress] update  │ [Portal] /offline   │
│ [Slack] ✨          │ [Slack] 🔴          │
└─────────────────────┴─────────────────────┘
```

---

## Stap 6: Testen

### Test 1: API Connectie

Run dit in terminal:

```bash
curl -X GET "https://jouw-reachr.vercel.app/api/tenants/active" \
  -H "x-portal-key: jouw-portal-api-key"
```

Je zou moeten zien:
```json
{
  "tenants": [...],
  "count": 1
}
```

### Test 2: Handmatige Workflow Run

1. Open de "Daily Content Creation" workflow
2. Klik op **Execute Workflow**
3. Bekijk de output van elke node

---

## Troubleshooting

### "Unauthorized" Error

- Check of `PORTAL_API_KEY` in portal .env.local EXACT overeenkomt met de header value in n8n

### "Content item not found"

- Zorg dat de database migratie is uitgevoerd in Supabase
- Check of `content_items` tabel bestaat

### Geen posts worden gecreëerd

- Check of er een actieve tenant is met:
  - `workflow_enabled = true`
  - `onboarding_completed = true`
  - WordPress credentials ingevuld

### Slack notificaties werken niet

- Check of `SLACK_CHANNEL_ID` correct is (gebruik het ID, niet de naam)
- Verify Slack OAuth permissions

---

## WordPress Authenticatie

De workflows gebruiken Basic Auth naar WordPress. Elke klant heeft:

- `wordpress_base_url`: bijv. `https://mijnsite.nl`
- `wordpress_username`: WordPress username
- `wordpress_app_password`: Application Password (niet het normale wachtwoord!)

### Application Password aanmaken:

1. WordPress Admin → Users → Profile
2. Scroll naar "Application Passwords"
3. Voer naam in (bijv. "Reachr")
4. Klik "Add New"
5. Kopieer het gegenereerde wachtwoord

---

## Vragen?

Als iets niet werkt, check:

1. n8n execution logs (klik op een gefaalde node)
2. Portal logs (Vercel dashboard → Logs)
3. Supabase logs (Supabase dashboard → Logs)
