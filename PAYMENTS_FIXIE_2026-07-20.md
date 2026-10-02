# Payments, Withdrawal & Fixie Static IP — 2026-07-20 (session 6)

## What I audited (and found already working)

The tasker/requester money flow was largely already built and sound in
design:
- Requester funds a task → webhook records the payment → tasker gets a
  "Payment Received — Start Your Task" notification and sees it in the
  Earnings tab.
- Tasker uploads equipment/shipment proof (photos/files, up to 5, via
  Cloudinary) → requester confirms → equipment + shipment funds
  auto-release to the tasker's bank DURING the task, so they can waybill.
  (You chose to keep this auto-release behaviour.)
- After completion, workmanship earnings are withdrawable from the
  Earnings tab (with a bank-details guard).
- Email notifications fire on proof upload, confirmation, and payout.

## Critical bug fixed (this was a real deploy-blocker)

**Double-payout risk in workmanship withdrawal.** The withdraw endpoint
set `status: 'withdrawn'` on payment rows, but the `payments.status` CHECK
constraint only allows `pending/processing/completed/failed/refunded`. So
the flow was: initiate Flutterwave transfer → THEN write the DB update →
DB write throws (invalid status) → the earnings stay marked available.
Money leaves, but the system still thinks it's withdrawable = it could be
withdrawn again.

**Fix** (`backend/routes/payments.js`, `/withdraw`):
1. Reserve the earnings rows FIRST, guarded by `.is('withdrawn_at', null)`,
   using the valid `'processing'` status (not the invalid `'withdrawn'`).
   `withdrawn_at IS NULL` is the single source of truth for "available",
   so once stamped they can't be picked up again.
2. If a concurrent request already grabbed the rows, abort with 409 (and
   release any partial reservation) — no payout against a partial set.
3. Only THEN initiate the Flutterwave transfer. If the transfer fails,
   roll the reservation back so the tasker can retry — money never left.

Proven with an isolated concurrency simulation: two simultaneous
withdrawals of the same earnings result in exactly one payout, never two.

## Fixie static-IP proxy for Flutterwave transfers

Flutterwave requires payouts/transfers to originate from a whitelisted
static IP. Railway has no fixed outbound IP, so the code now routes
Flutterwave API calls through a static-IP proxy (Fixie) when configured.

**Code** (`backend/utils/flutterwave.js`):
- Reads `FIXIE_URL` (falls back to `HTTPS_PROXY`/`HTTP_PROXY`).
- When set, all Flutterwave calls go through the proxy via
  `https-proxy-agent` (added as an explicit dependency, v5.0.1).
- When not set, calls go out directly (fine for local dev and for payment
  COLLECTION, which is not IP-restricted — only transfers are).
- Credentials in the proxy URL are never logged (only the host).

### YOUR SETUP STEPS (required for reliable payouts)

1. **Add Fixie on Railway**: In your Railway project, add the Fixie
   add-on (or sign up at usefixie.com and get your proxy URL). You'll get
   a URL like:
   `http://fixie:PASSWORD@olympic.usefixie.com:80`
   and two static outbound IP addresses.
2. **Set the env var**: In Railway backend variables, set
   `FIXIE_URL` = that proxy URL. (If Railway's Fixie add-on sets its own
   var name, either rename it to `FIXIE_URL` or also set `HTTPS_PROXY` to
   the same value — the code reads both.)
3. **Whitelist the IPs in Flutterwave**: Flutterwave Dashboard →
   Settings → API → IP Whitelisting → add BOTH static IPs Fixie gave you.
   (Flutterwave also requires you to enable Transfers and may require a
   compliance/KYC step on your account before live payouts work.)
4. **Redeploy** the backend. On the first Flutterwave call after deploy,
   the logs will show:
   `[flutterwave] Routing API calls through static-IP proxy (olympic.usefixie.com) ...`
   confirming it's active.

Until these steps are done, transfers will use Railway's dynamic IP and
Flutterwave may reject them — collection (requesters paying in) still
works regardless.

## Verification performed

- `node --check` + require-resolution on `payments.js` and
  `flutterwave.js`.
- Proxy loads cleanly both WITH and WITHOUT `FIXIE_URL`; credentials not
  leaked in logs; `HttpsProxyAgent` constructs against a Fixie-style URL.
- Concurrency simulation proving no double-payout.
- Booted backend with `FIXIE_URL` set — withdraw route mounted and
  auth-protected (401 without token).
- Full `vite build` succeeded.

## Manual steps

- Do the four Fixie setup steps above.
- No database migration needed — the fix uses the existing
  `withdrawn_at` column and valid statuses.
- `npm install` on the backend after deploy so `https-proxy-agent` is
  installed from package.json (it was previously only transitive).
