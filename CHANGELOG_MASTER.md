# Taskeeu — Master Changelog (all sessions)

This is the complete, consolidated codebase. Every fix and feature below is
included and build-verified. Individual per-session detail docs are also in
this folder (FIXES_APPLIED, SEO_EXPANSION, TASK_MARKETPLACE_FIXES,
ADMIN_LOCATION_BROADCAST, ADMIN_TASK_MONITORING, PAYMENTS_FIXIE).

## Bug fixes
- Task posting "Failed to post task" — pickup_delivery tasks now set
  task_city/task_state; budget maps to budget_min/max.
- Email verification — link now uses the branded taskeeu.com domain (via a
  frontend /auth/verify-email page that calls the backend), and the
  get_user_by_verification_token RPC varchar/text mismatch was fixed
  (see database/ for the SQL if the RPC needs recreating).
- Admin delete-user — nullifies/clears all foreign-key references
  (wallet_transactions, custom_payments, and 7 enterprise tables) so
  deletion no longer throws FK violations.
- Withdrawal double-payout risk — earnings are now reserved before the
  transfer and rolled back on failure; invalid 'withdrawn' status removed.
- Bid on ongoing task no longer downgrades its status to 'bidding'.
- .env.example SUPABASE key name corrected to match the code.

## Features added
- Admin: phone column, tasker location (city/state) column in Users tab.
- Admin: manual "Verify Email" button for stuck requesters.
- Admin: "Browse Taskers" nav visibility toggle (Settings tab + site_settings).
- Admin: full task monitoring modal — Overview / Chat transcript / Activity
  log (bids, messages, payments, custom payments, completion codes, refunds).
- Admin: targeted broadcast — send to all / by role / specific hand-picked
  people, now also filterable by state and city.
- 15 SEO/GEO landing pages (10 cities, 3 diaspora countries, /vs/jiji,
  /errand-runner-near-me) + llms.txt + robots/sitemap updates.
- Browse Tasks keeps open, bidding, AND ongoing tasks visible; ongoing tasks
  still accept new bids; requester notified on every bid.
- Chat: off-platform contact detection (warns when phone/bank numbers are
  shared) + persistent on-platform safety banner.
- Chat: voice notes (record/send/playback), plus reactions and timestamps
  (which already existed). Mobile + desktop responsive.
- Flutterwave transfers route through a static-IP proxy (Fixie) when
  FIXIE_URL is set — see PAYMENTS_FIXIE_2026-07-20.md for setup.
- tawk.to live chat widget on PUBLIC pages only (hidden on dashboards via
  TawkController).

## Manual steps still required on your side
1. Run database/SITE_SETTINGS_MIGRATION.sql in Supabase (nav toggle table).
2. If email verification still fails, recreate the verification RPCs (SQL
   in the email-verification detail doc / MIGRATION_RUN_NOW.sql).
3. Set FIXIE_URL in Railway + whitelist the Fixie IPs in Flutterwave for
   reliable payouts (steps in PAYMENTS_FIXIE_2026-07-20.md).
4. Run `npm install` on the backend after deploy (adds https-proxy-agent).
5. Deploy backend + frontend.

## How this was verified
Full production `vite build` (43 routes prerendered), backend syntax +
require-resolution on all routes, unit tests for the money-critical
withdrawal guard and the off-platform detection, and backend boot checks.
Runtime behaviour against your live DB / Flutterwave / mic hardware can't be
tested from the build environment — test payments in Flutterwave test mode
and voice notes on a real phone before relying on them in production.
