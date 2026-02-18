# CLAUDE.md — Reachr Portal

## Projectoverzicht

Reachr is een multi-tenant SEO/GEO content engine die volledig autonoom werkt na onboarding. Elke klant heeft een eigen `tenant_id`; alle data en workflows zijn strikt per tenant gescheiden. Het systeem werkt deterministisch via een state-machine per blogpost — geen losse AI-scripts of impliciete overgangen.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Taal**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL) met Row Level Security
- **Auth**: Supabase Auth
- **AI**: Anthropic Claude via `@anthropic-ai/sdk`
- **Orchestratie**: n8n (webhooks)
- **CMS**: WordPress (via abstracte Publisher-laag)
- **Validatie**: Zod

## Architectuurprincipes

### Multi-tenancy
- Elke query, mutation en API-call MOET gefilterd zijn op `tenant_id`.
- Geen cross-tenant data leakage. RLS policies in Supabase afdwingen.
- Thresholds en configuratie zijn per tenant instelbaar.

### State Machine per Blogpost
Elke blogpost doorloopt expliciete statussen:

```
published → monitoring → [views >= threshold] → optimize_pending → optimized
                       → [views < threshold]  → underperforming → offline
```

- Statusovergangen ALLEEN via expliciete workflowlogica.
- Geen impliciete state changes of side-effects.
- Standaard monitoring window: 72 uur (configureerbaar per tenant).
- Standaard views threshold: 6 (configureerbaar per tenant).

### Dagelijkse Orchestrator — Prioriteitsvolgorde
1. **Monitoring eerst**: check bestaande posts in hun monitoring window.
2. **Optimalisatie**: posts die de threshold halen gaan naar optimalisatie.
3. **Nieuwe content**: pas als monitoring en optimalisatie klaar zijn.
4. Execution gespreid om piekbelasting te voorkomen.

### Content & Topic Regels
- Onderwerpen moeten passen bij producten/diensten van de klant en SEO-relevant zijn.
- **TopicLog per tenant**: topics + resultaten (success/fail) worden opgeslagen.
- Geen hergebruik van eerder gebruikte topics (ook niet bij falen).
- Elk artikel gebaseerd op echte bronnen — geen verzonnen feiten, statistieken of quotes.
- Als bronvalidatie faalt → generatie stopt (fail-fast).

### SEO/GEO Content Structuur
- Duidelijke titel, beschrijvende slug, correcte heading-hierarchie (H1 → H2 → H3).
- Interne links naar klant-eigen pagina's.
- Expliciete bronverwijzingen.
- GEO-principes: heldere definities, uitlegblokken, FAQ-structuur, semantisch begrijpelijke content voor AI-systemen.

### Publisher Abstractie
- CMS-logica zit uitsluitend achter de `Publisher`-interface.
- Minimale interface: `publish`, `update`, `unpublish`.
- WordPress is de eerste implementatie; CMS-logica mag nergens buiten de Publisher lekken.
- Voorbereid op uitbreiding naar andere CMS-systemen zonder architectuurwijziging.

## Onboarding Flow

Klanten vullen hun WebsiteProfile in met:
- Domein en bedrijfsgegevens
- Producten/diensten
- Doelgroep
- Tone of voice
- Seed keywords
- Interne links
- Do/don't regels
- Integraties (WordPress credentials, analytics, Slack)

Na onboarding draait alles automatisch zonder handmatige tussenkomst.

## Logging & Error Handling

- Elke run logt: `tenant_id`, workflow-type, status, errors, duur.
- Externe API-calls altijd valideren.
- Fail-fast bij mislukte integraties of ongeldige data.
- Geen silent failures.

## Coderichtlijnen

- Geen hardcoded thresholds — altijd uit tenant config.
- Geen cross-tenant queries zonder expliciete `tenant_id` filter.
- Geen CMS-specifieke code buiten de Publisher-laag.
- Geen commentaar dat alleen herhaalt wat de code doet.
- Zod schemas voor alle externe input.
- TypeScript strict mode, geen `any` types.

## Projectstructuur

```
src/
├── app/
│   ├── (auth)/          # Login, signup, forgot-password
│   ├── (dashboard)/     # Dashboard, onboarding, jobs, settings
│   └── api/
│       ├── ai/          # research, generate, evaluate, optimize
│       ├── content/     # published, offline status hooks
│       ├── tenants/     # config (public), credentials (HMAC-only)
│       ├── jobs/        # Job status webhook
│       ├── webhook/     # n8n trigger
│       └── wordpress/   # verify, save
├── components/
│   ├── ui/              # Herbruikbare UI-componenten
│   ├── onboarding/      # Onboarding wizard stappen
│   ├── jobs/            # TriggerWorkflowButton (client)
│   └── layout/          # Sidebar, Navbar
├── lib/
│   ├── supabase/        # Supabase clients (server/client)
│   ├── content-state-machine.ts  # Transitie-guards per blogpost
│   ├── source-validator.ts       # HEAD/GET bronvalidatie
│   ├── rate-limit.ts             # Upstash Redis rate limiter
│   ├── anthropic.ts              # Claude client met retry/backoff
│   ├── api-security.ts           # Security middleware (rate limit + HMAC + IP)
│   ├── security.ts               # Crypto utils, timestamp anti-replay
│   ├── encryption.ts             # AES-256-GCM voor WP passwords
│   ├── n8n.ts                    # Webhook helpers
│   └── validation.ts             # Zod schemas
└── types/
    └── database.ts      # TypeScript types
```

## Credentials endpoint

WordPress credentials worden NOOIT via het generieke config endpoint geretourneerd.
n8n haalt credentials op via `POST /api/tenants/[id]/credentials` met:
- `X-Portal-Key` header (API key)
- `X-Signature` header (HMAC-SHA256 van body)
- `X-Timestamp` header (ISO timestamp, max 60s drift)

## Lokaal draaien

```bash
npm install
npm run dev
# → http://localhost:3000
```

Vereist in `.env.local`:
- Supabase keys (URL, anon key, service role key)
- `ANTHROPIC_API_KEY`
- `ENCRYPTION_KEY` (min 32 chars)
- `HMAC_SECRET` (genereer met `openssl rand -hex 32`)
- `PORTAL_API_KEY`
- Optioneel: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` voor rate limiting
