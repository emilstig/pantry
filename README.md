# Pantry

A Next.js pantry tracker with Supabase storage and weekly expiry reminders.

## Features

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Supabase** for persistence
- **Resend** weekly expiry emails
- **Vercel Cron** keep-alive (prevents free-tier Supabase pause)

## Getting Started

### Prerequisites

Node.js 22.20.0+ (see `.nvmrc`). With `nvm`:

```bash
nvm use
npm install
cp .env.example .env.local
```

Fill in `.env.local`, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

- `npm run dev` – development (Turbopack)
- `npm run build` – production build
- `npm run start` – run production server
- `npm run lint` / `npm run format` – lint & format

## Deploy on Vercel

1. Push the repo and import the project in [Vercel](https://vercel.com/new).
2. Set these **Environment Variables** (Production):

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon/public key |
| `CRON_SECRET` | Yes | `openssl rand -hex 32` – secures cron routes |
| `RESEND_API_KEY` | For emails | From [Resend](https://resend.com) |
| `REMINDER_EMAIL` | For emails | Where reminders are sent |
| `REMINDER_FROM_EMAIL` | Optional | Verified sender; defaults to Resend onboarding address |

3. Deploy. Cron jobs are defined in `vercel.json`:
   - **`/api/keepalive`** – daily at 04:00 UTC (keeps Supabase awake)
   - **`/api/reminder`** – Mondays at 09:00 UTC (expiry emails)

4. After deploy, confirm under **Project → Settings → Cron Jobs** that both jobs appear.

### Manual cron test

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/keepalive
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/reminder
```

## More docs

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) – schema & Supabase setup
- [CRON_SETUP.md](./CRON_SETUP.md) – reminder email details
