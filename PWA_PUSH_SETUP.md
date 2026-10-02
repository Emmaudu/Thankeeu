# PWA Updates + Push Notifications — Setup

## 1. Fresh, non-stale PWA (already active, no config needed)

The service worker (`frontend/public/sw.js`) is deliberately built so users
never get stuck on an old copy after you deploy:

- HTML pages are always fetched network-first, so the app shell is always
  the newest one (which points at the newest hashed JS/CSS).
- Only content-hashed `/assets/*` files are cached (safe — a new deploy
  creates new filenames).
- When a new version is detected, the app shows a small "A new version is
  available — Refresh" bar. Tapping it activates the new version and reloads.

If you ever want to force every cache cleared on a release, bump
`CACHE_VERSION` in `sw.js` (e.g. `taskeeu-v2` -> `taskeeu-v3`).

## 2. Desktop install (Windows / Mac)

Works automatically with the manifest already in place. In Chrome or Edge on
Windows/Mac, an install icon appears in the address bar, and our in-app
"Install" banner also appears. Installs as a standalone desktop app.

## 3. Push notifications — REQUIRES setup

Push needs VAPID keys (they identify your server to the browser push
services). Without them, push is safely disabled and the admin Push tab will
say so.

### Generate keys (once)
On your machine or a Railway shell:

    npx web-push generate-vapid-keys

You'll get a public key and a private key.

### Set backend environment variables (Railway)
    VAPID_PUBLIC_KEY   = <the public key>
    VAPID_PRIVATE_KEY  = <the private key>
    VAPID_SUBJECT      = mailto:support@taskeeu.com   (or your email)

Redeploy the backend, then `npm install` (adds the `web-push` package).

### How users enable it
Logged-in users see a small "Get notified" banner and tap Enable, which
asks the browser's permission and subscribes them. Works on:
- Android (Chrome) — in browser or installed.
- Windows / Mac (Chrome, Edge) — in browser or installed.
- iOS — ONLY if they first installed the PWA to their home screen (Apple's
  rule). iOS Safari tabs cannot receive web push.

### Sending (admin)
Admin dashboard -> Push Alerts. Write a title + message, optional link,
pick the audience (everyone / requesters / taskers), and send. Dead
subscriptions are pruned automatically.

## Migrations to run in Supabase
- `database/PUSH_SUBSCRIPTIONS_MIGRATION.sql`

## Verification done
- Backend syntax + boot: `/push/vapid-public-key` returns `enabled:false`
  gracefully when keys are unset; admin push route is auth-protected.
- `web-push` installs from package.json.
- Service worker syntax valid; push + notificationclick handlers present in
  the built `dist/sw.js`.
- Full production build succeeded (44 routes).

## What can't be tested from the build environment
Actual push delivery needs the VAPID keys, a real subscription from a real
browser, and HTTPS. After setting the keys and deploying, do one real test:
enable notifications on a phone/laptop, then send yourself a push from the
admin Push tab.
