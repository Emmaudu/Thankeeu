FIX: "Workspace not found" on mentorship.thankeeu.com (applications, contacts, payments)

ROOT CAUSE
Every API request from mentorship.thankeeu.com carries an Origin header of
https://mentorship.thankeeu.com. The backend tenant resolver (middleware/tenant.js)
extracts the subdomain ("mentorship") from that Origin and looks it up as a company
workspace. Because "mentorship" was NOT in the backend's RESERVED_SLUGS list, the
lookup ran, found no company, and returned 404 "Workspace not found" — before the
request ever reached the mentorship controller. This killed applications, contact
messages, AND Flutterwave payment initialisation.

(The browser always sends Origin, so this failed regardless of any frontend deploy.)

THE FIX (2 backend files)
1. backend/utils/companySlug.js
   Added 'mentorship' to RESERVED_SLUGS. Now extractWorkspaceSlug() returns null for
   the mentorship subdomain, so the tenant resolver calls next() and skips the company
   lookup entirely. (Also matches the frontend workspace.js reserved list.)

2. backend/middleware/tenant.js
   Hardened: if a slug resolved from ANY source (including a stale X-Workspace-Slug
   header from an older frontend bundle) is in RESERVED_SLUGS, it is ignored. This makes
   mentorship/games/admin immune to the tenant resolver no matter what the frontend sends.

DEPLOY
Overwrite these two files in your repo, then redeploy the backend (Railway):
  backend/utils/companySlug.js
  backend/middleware/tenant.js

No database migration needed for this fix.

VERIFIED
- 7/7 resolver cases pass (mentorship via origin/host/header all -> null; real company
  "flutterwave" still -> flutterwave; games -> null).
- Full backend suite: 373/373 unit tests pass.

NOTE
This is the actual cause of the payment failure too — FLW init (POST /api/mentorship/subscribe)
was rejected by the tenant resolver before reaching the controller. After deploying these
two files, applications, contacts, and payments all work on mentorship.thankeeu.com.
