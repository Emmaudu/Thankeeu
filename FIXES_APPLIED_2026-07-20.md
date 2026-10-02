# Fixes applied — 2026-07-20

This document lists every bug fixed in this pass, what changed, and any manual
steps needed after deploying. All changes have been verified with:
- `node --check` on every backend file (syntax + require-resolution with dummy env vars)
- A real `npm install && vite build` on the frontend (production build succeeded)
- A real backend server boot (`node server.js`) with dummy Supabase credentials

---

## 1. Requester dashboard: "Failed to post task"

**Cause:** In `RequesterDashboard.jsx` → `PostTaskPanel`, Pickup & Delivery
tasks never set `task_city`/`task_state` (only `from_city`/`to_city` etc.),
but the backend requires those fields on every task (`NOT NULL` in Postgres).
Also, the form sent a single `budget` field while the backend only reads
`budget_min`/`budget_max`.

**Fix:** `frontend/src/pages/RequesterDashboard.jsx` — `handleSubmit` now
falls back `task_city`/`task_state` to the pickup location for
`pickup_delivery` tasks, and maps `budget` → `budget_min`/`budget_max`. Error
toast now also surfaces the real backend validation message instead of
always showing a generic one.

**Manual steps:** none — just deploy.

---

## 2. Requester email verification never worked

**Cause:** The verification email linked to
`${FRONTEND_URL}/auth/verify-email` — a frontend route that doesn't exist
(only `/auth/verified` exists). The actual verification logic lives in the
**backend** route `GET /api/auth/verify-email`, which was never being hit.

**Fix:** `backend/utils/email.js` — added a `BACKEND` URL constant, the
verification link now points at `${BACKEND_URL}/api/auth/verify-email`.

**Manual steps:**
- Set `BACKEND_URL` in your Railway backend environment to your backend's
  public URL (no trailing slash, no `/api`). See `backend/.env.example`.
- Without this env var it silently falls back to `FRONTEND_URL` and the bug
  returns.

---

## 2b. Correction: verification email exposed the raw Railway URL

After deploying fix #2, the email link correctly pointed at the backend
(`taskeeu-production.up.railway.app/api/auth/verify-email?...`) and
verification worked — but it looked broken/unprofessional to show a raw
Railway infrastructure URL to end users in a customer-facing email, and
there was no custom `api.taskeeu.com` domain to hide it behind.

**Fix:** Rather than requiring a custom API domain, moved the "must hit
the backend directly" requirement behind a real frontend page instead:

- `backend/routes/auth.js` — split verification into a shared
  `performEmailVerification()` helper. Added
  `GET /api/auth/verify-email/check` (JSON API, called via `fetch`).
  The old `GET /api/auth/verify-email` (redirect-based) is kept working
  for any already-sent emails still using the old link.
- `backend/utils/email.js` — verification link now points at
  `${FRONTEND_URL}/auth/verify-email?token=...&role=requester` again
  (branded domain). Removed the now-unused `BACKEND_URL` constant.
- `backend/.env.example` — removed `BACKEND_URL`, no longer needed.
- `frontend/src/pages/VerifyEmail.jsx` (new) — the actual page users land
  on. Calls the new JSON endpoint in the background, stores the session,
  redirects to the dashboard. Same pattern as `TaskerApproved.jsx` /
  `VerifiedLanding.jsx`.
- `frontend/src/App.jsx` — registered the `/auth/verify-email` route.

**Manual steps:**
- If you already set `BACKEND_URL` in Railway for fix #2, you can remove
  it — it's no longer used.
- Verified with a full `vite build` — `VerifyEmail` compiles as its own
  chunk, and both backend endpoints (`/verify-email` and
  `/verify-email/check`) respond correctly on a live server boot.

---

## 3. Admin: manually verify stuck requesters

Added a way to unblock requesters who signed up before fix #2 was deployed
and are stuck unverified.

**Backend:** `backend/routes/admin.js` — new route
`PUT /admin/users/:userId/verify-email` (admin-only). Marks the account
verified, clears any leftover token, logs to `admin_audit_log`.
`GET /admin/users` now also returns `email_verified`.

**Frontend:** `frontend/src/pages/AdminDashboard.jsx` — Users tab shows an
amber "Unverified" tag and a "Verify Email" button for affected requesters.

**Manual steps:** none — just deploy.

---

## 4. Admin: phone number not visible

**Cause:** Backend already returned `phone` in `GET /admin/users`, but the
Users table in the admin UI never rendered it.

**Fix:** `frontend/src/pages/AdminDashboard.jsx` — added a Phone column,
and phone is now included in the quick-search filter.

**Manual steps:** none — just deploy.

---

## 5. Admin: "delete user" failing on foreign key violations

**Cause:** `DELETE /admin/users/:userId` cleaned up most related tables but
missed several tables that reference `users(id)` with no `ON DELETE` rule:
`wallet_transactions.initiated_by` (the one you hit), plus
`custom_payments`, `company_members.approved_by`,
`enterprise_task_proofs.tasker_id`/`approved_by`,
`company_tasker_blacklist.blacklisted_by`, `enterprise_broadcasts.sent_by`,
`enterprise_meetings.created_by`, `company_permission_grants.granted_by`.

**Fix:** `backend/routes/admin.js` — `custom_payments` rows are deleted
(same treatment as `payments`). The Enterprise/Teams columns are nullified
rather than deleted, since they're financial/audit records that shouldn't
be destroyed just because the referenced user is gone. Wrapped in a
try/catch since those tables come from the optional `teams-schema.sql`
migration.

**Manual steps:** none — just deploy. Retry deleting the user that failed
before; it should go through now.

---

## 6. Admin: toggle "Browse Taskers" nav link visibility

New generic site-settings mechanism (built so more toggles can be added
later without more backend work).

**Database:** new table `site_settings` (key/value). See
`database/SITE_SETTINGS_MIGRATION.sql` — **run this in Supabase before
deploying**, seeds `nav_show_browse_taskers = true`.

**Backend:**
- `backend/routes/settings.js` (new) — public `GET /api/settings`, returns
  only an explicit allowlist of keys, fails open (defaults to visible) if
  the DB call errors.
- `backend/routes/admin.js` — `GET /admin/settings` (list all),
  `PUT /admin/settings/:key` (upsert one), admin-only.
- `backend/server.js` — mounted the new route at `/api/settings`.

**Frontend:**
- `frontend/src/utils/api.js` — `settingsApi.getPublic()`,
  `adminApi.getSettings()` / `updateSetting()`.
- `frontend/src/components/layout/Navbar.jsx` — fetches the setting once
  on mount, filters "Browse Taskers" out of both desktop and mobile nav
  when off. Caches last-known value in `sessionStorage` to avoid flicker.
- `frontend/src/pages/AdminDashboard.jsx` — new **Settings** tab with a
  toggle switch (optimistic UI, reverts on error).

**Note:** "Browse Taskers" also appears separately in `Footer.jsx` — left
untouched since only the nav menu link was requested. Say the word if you
want the footer link tied to the same setting.

**Manual steps:**
- Run `database/SITE_SETTINGS_MIGRATION.sql` in Supabase.
- Deploy backend + frontend.

---

## 7. Misc: stale env var name in `.env.example`

**Found while re-verifying this package:** `backend/.env.example` documented
`SUPABASE_SERVICE_ROLE_KEY`, but `backend/utils/supabase.js` actually reads
`SUPABASE_SERVICE_KEY`. Since your app already works in production, your
real Railway env var must already be named correctly — this was just a
misleading example file, not a live bug. Fixed the example file to match
the code so it doesn't trip up a future setup.

**Manual steps:** none — this only affects the documentation file, not your
live environment.
