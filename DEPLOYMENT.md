# TASKEEU — Deployment Guide
## Railway (Backend) + Vercel (Frontend)

---

## Architecture Overview

```
Browser
  └── Vercel (Frontend — React/Vite)
        └── calls ──► Railway (Backend — Node/Express)
                          └── connects to ──► Supabase (Database)
                          └── calls ──────► Paystack (Payments)
                          └── calls ──────► Cloudinary (File Storage)
                          └── calls ──────► Resend (Emails)
```

---

## STEP 1 — Set Up External Services First

Before deploying, create accounts and get your credentials:

### 1a. Supabase (Database)
1. Go to https://supabase.com → New Project
2. Choose a region close to Nigeria (EU West is closest)
3. Go to **Settings → API** — copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (not anon) → `SUPABASE_SERVICE_KEY`
4. Go to **SQL Editor** and run these files in order:
   - `database/schema.sql`
   - `database/teams-schema.sql`
   - `database/teams-schema-v2.sql`

### 1b. Cloudinary (File Storage)
1. Go to https://cloudinary.com → Dashboard
2. Copy **Cloud Name**, **API Key**, **API Secret**
3. Go to **Settings → Upload** → create upload presets named:
   - `taskeeu_kyc` (for KYC documents — unsigned, moderate)
   - `taskeeu_proofs` (for task proof photos)
   - `taskeeu_avatars` (for profile photos)

### 1c. Paystack (Payments)
1. Go to https://dashboard.paystack.com
2. **Settings → API Keys** → copy Secret Key and Public Key
3. Use `sk_test_` / `pk_test_` for testing, switch to live keys for production
4. **Settings → Webhooks** → Add webhook URL (after deploying backend):
   - URL: `https://YOUR-RAILWAY-URL.up.railway.app/api/payments/webhook`
   - Events: `charge.success`, `transfer.success`, `transfer.failed`
   - Copy the **Webhook Secret** → `PAYSTACK_WEBHOOK_SECRET`

### 1d. Resend (Transactional Email)
1. Go to https://resend.com → API Keys → Create Key
2. Add your domain under **Domains** and add the DNS records it gives you
3. Copy your API key → `RESEND_API_KEY`

---

## STEP 2 — Deploy Backend to Railway

### 2a. Create Railway project
1. Go to https://railway.app → New Project → Deploy from GitHub repo
2. Select your repo, point to the `backend/` folder (or root if monorepo)
3. Railway auto-detects Node.js from `package.json`

### 2b. Set environment variables in Railway
Go to your backend service → **Variables** tab → add each one:

```
NODE_ENV                = production
PORT                    (leave blank — Railway sets this automatically)
FRONTEND_URL            = https://your-taskeeu.vercel.app  ← add after Vercel deploy

JWT_SECRET              = (generate: openssl rand -hex 32)
JWT_EXPIRES_IN          = 7d

SUPABASE_URL            = https://your-ref.supabase.co
SUPABASE_SERVICE_KEY    = eyJhbGc...your_service_role_key

CLOUDINARY_CLOUD_NAME   = your_cloud_name
CLOUDINARY_API_KEY      = your_api_key
CLOUDINARY_API_SECRET   = your_api_secret

PAYSTACK_SECRET_KEY     = sk_live_your_key
PAYSTACK_PUBLIC_KEY     = pk_live_your_key
PAYSTACK_WEBHOOK_SECRET = your_webhook_secret

RESEND_API_KEY          = re_your_key
EMAIL_FROM              = noreply@taskeeu.com
EMAIL_FROM_NAME         = Taskeeu Platform
ADMIN_EMAIL             = admin@taskeeu.com
```

> ⚠️ **Do NOT add PORT** — Railway injects this automatically. Adding it manually can cause conflicts.

### 2c. Verify backend is live
After deploy, visit:
```
https://YOUR-BACKEND.up.railway.app/api/health
```
You should see: `{"success":true,"service":"Taskeeu API",...}`

---

## STEP 3 — Deploy Frontend to Vercel

### 3a. Create Vercel project
1. Go to https://vercel.com → New Project → Import from GitHub
2. Select your repo → set **Root Directory** to `frontend/`
3. Framework: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`

### 3b. Set environment variables in Vercel
Go to **Settings → Environment Variables** → add:

```
VITE_API_URL            = https://YOUR-BACKEND.up.railway.app/api
VITE_SOCKET_URL         = https://YOUR-BACKEND.up.railway.app
VITE_PAYSTACK_PUBLIC_KEY = pk_live_your_public_key
```

> ⚠️ After adding env vars, **redeploy** the frontend — Vercel bakes env vars
> into the build. They are NOT read at runtime like Node.js.

### 3c. Update FRONTEND_URL on Railway
Now that you have the Vercel URL, go back to Railway → Variables and update:
```
FRONTEND_URL = https://your-taskeeu.vercel.app
```
Then redeploy the backend.

---

## STEP 4 — Local Development

Copy both example files:
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and fill in your real values

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env — point VITE_API_URL to http://localhost:5000/api
```

Start both servers:
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000
Health: http://localhost:5000/api/health

---

## Environment Variables Quick Reference

### Backend (Railway) — ALL required in production

| Variable | Where to get it | Notes |
|---|---|---|
| `NODE_ENV` | Set manually | `production` on Railway |
| `FRONTEND_URL` | Your Vercel URL | Used in CORS + email links |
| `JWT_SECRET` | Generate randomly | Min 32 chars, never change in prod |
| `JWT_EXPIRES_IN` | Set manually | `7d` recommended |
| `SUPABASE_URL` | Supabase Dashboard → API | Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → API | service_role key (not anon) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard | |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard | |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard | |
| `PAYSTACK_SECRET_KEY` | Paystack → Settings → API Keys | `sk_live_` in production |
| `PAYSTACK_PUBLIC_KEY` | Paystack → Settings → API Keys | `pk_live_` in production |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack → Settings → Webhooks | Must match webhook config |
| `RESEND_API_KEY` | Resend Dashboard → API Keys | |
| `EMAIL_FROM` | Your verified domain | e.g. noreply@taskeeu.com |
| `EMAIL_FROM_NAME` | Set manually | `Taskeeu Platform` |
| `ADMIN_EMAIL` | Your admin email | Gets demo request notifications |

### Frontend (Vercel) — ALL required in production

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_URL` | `https://your-backend.up.railway.app/api` | Must include `/api` |
| `VITE_SOCKET_URL` | `https://your-backend.up.railway.app` | No `/api` suffix |
| `VITE_PAYSTACK_PUBLIC_KEY` | `pk_live_...` | Public key only — safe in browser |

---

## Common Mistakes to Avoid

| Mistake | What breaks | Fix |
|---|---|---|
| Using `SUPABASE_ANON_KEY` instead of `SERVICE_KEY` | RLS blocks all queries | Use service_role key in backend |
| Not updating `FRONTEND_URL` on Railway | Broken email links, CORS errors | Always update after Vercel deploy |
| Adding `PORT` to Railway variables | App won't start | Remove it — Railway sets PORT |
| Using `sk_test_` in production | Payments fail silently | Switch to `sk_live_` |
| Changing `JWT_SECRET` in production | All users logged out instantly | Generate once, never change |
| Forgetting to redeploy Vercel after env var change | Old VITE_ values still baked in | Always trigger redeploy |
| Wrong Paystack webhook URL | Payments never confirmed | Use full Railway URL + `/api/payments/webhook` |

---

## Testing Your Deployment

```bash
# 1. Health check
curl https://YOUR-BACKEND.up.railway.app/api/health

# 2. Public task types (should return 44 types)
curl https://YOUR-BACKEND.up.railway.app/api/teams/task-types

# 3. Frontend loads
open https://your-taskeeu.vercel.app

# 4. Registration flow
# Visit /auth → create account → check Supabase users table

# 5. Payment test
# Use Paystack test card: 4084 0840 8408 4081, CVV 408, Expiry 01/25
```
