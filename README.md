# SEO OP Client Portal

A SaaS multi-tenant client portal for automated SEO content generation.

## Features

- User authentication with Supabase Auth
- Multi-tenant architecture
- 9-step onboarding wizard
- WordPress integration with encrypted credentials
- n8n webhook integration for automated workflows
- Job monitoring dashboard

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Name it `seo-op-portal`
3. Choose a region close to you (e.g., `eu-west` for Netherlands)
4. Save the database password

### 3. Get Supabase Keys

1. Go to Project Settings → API in Supabase dashboard
2. Copy the following values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORTAL_API_KEY=generate_a_random_32_char_string
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/xxx
ENCRYPTION_KEY=generate_a_random_32_char_string
```

Generate random keys:

```bash
# Generate PORTAL_API_KEY
openssl rand -hex 16

# Generate ENCRYPTION_KEY
openssl rand -hex 16
```

### 5. Run Database Migrations

1. Go to SQL Editor in Supabase dashboard
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy and paste the contents into the SQL Editor
4. Click "Run"

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup, forgot-password
│   ├── (dashboard)/     # Dashboard, onboarding, jobs, settings
│   └── api/             # API routes for n8n integration
├── components/
│   ├── ui/              # Reusable UI components
│   ├── onboarding/      # Onboarding wizard steps
│   └── layout/          # Sidebar, Navbar
├── lib/
│   ├── supabase/        # Supabase clients
│   ├── encryption.ts    # Password encryption
│   ├── n8n.ts           # Webhook helpers
│   └── validation.ts    # Zod schemas
└── types/
    └── database.ts      # TypeScript types
```

## API Endpoints

### For n8n Integration

All endpoints require `X-PORTAL-KEY` header for authentication.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tenants/active` | GET | List active tenant IDs |
| `/api/tenants/[id]/config` | GET | Get full tenant configuration |
| `/api/jobs/status` | POST | Receive job status updates |
| `/api/webhook/trigger` | POST | Manual workflow trigger |

### Example Usage

```bash
# Get active tenants
curl -H "X-PORTAL-KEY: your_api_key" http://localhost:3000/api/tenants/active

# Get tenant config
curl -H "X-PORTAL-KEY: your_api_key" http://localhost:3000/api/tenants/uuid/config

# Post job status
curl -X POST \
  -H "X-PORTAL-KEY: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"uuid","job_type":"create_post","status":"completed","blog_post_url":"https://example.com/post"}' \
  http://localhost:3000/api/jobs/status
```

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## License

Private - All rights reserved
