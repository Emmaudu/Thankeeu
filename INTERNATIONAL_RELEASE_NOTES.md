# Taskeeu v12: international expansion

## Deploy order
1. Database: run `database/INTERNATIONAL_MIGRATION.sql` in the Supabase SQL editor (after TIPS and PLATFORM_EARNINGS). Safe to run twice.
2. Backend env (Railway):
   - `RAPYD_ACCESS_KEY`, `RAPYD_SECRET_KEY` from the Rapyd Client Portal
   - `RAPYD_BASE_URL` = `https://sandboxapi.rapyd.net` while testing, `https://api.rapyd.net` for live
   - `RAPYD_WEBHOOK_URL` = `https://<your-api-domain>/api/payments/rapyd-webhook` (also set it as the webhook URL in Rapyd)
   - Enable the card payment methods for US, GB, IE, AU, NZ, CA and SG in Rapyd.
3. Deploy the backend, then the frontend (`npm run build` builds the country index, the app, 274 prerendered pages and the country sitemaps).
4. Submit `https://taskeeu.com/sitemap-countries.xml` in Google Search Console. Add each country folder (/uk/, /us/ ...) as its own property if you want per-country reports.

## Countries
/us (USD), /uk (GBP), /ireland (EUR), /australia (AUD), /new-zealand (NZD), /canada (CAD), /singapore (SGD). Nigeria keeps the root URLs and Flutterwave.

Each country: home, 8 service pages, 14 or 15 city pages, 4 competitor comparisons, a remote tasks page, /tasks, /post-task, /requester, /tasker, sign up and log in.

## How accounts and countries work
- Every account belongs to one country (users.market). Existing accounts are all Nigeria.
- Sign up and log in pages show the country first, with a switcher. Logging in on the wrong country site takes you to your own.
- Signing up with an email that already has an account in another country is refused and points to that country.
- Dashboard, post-task and old notification links open on the account's own country site.
- Taskers can bid only on tasks in their own country.
- A country dropdown sits at the top right of every public page. Visitors whose time zone points to another country see one suggestion bar. Nobody is redirected automatically, and bots never see it.

## Payments and payouts
- International tasks and tips are paid by card through Rapyd hosted checkout. The server re-reads every checkout from Rapyd and checks the amount and currency before marking anything paid (browser return and webhook).
- International withdrawals (earnings and advances) go to Admin > Intl Payouts. Pay each one by bank transfer in that currency, then mark it paid. Rejecting returns the money to the tasker's balance.
- Refunds on international tasks: refund the card in the Rapyd dashboard. The refund stays "processing" in Admin until you do.
- Platform fee (20%) and the 50% advance rule are the same everywhere. Earnings are reported per currency and never added to Naira totals.

## Tests run
- Backend: 13 suites, 378 checks, including the new international suite (66 checks with a signed fake Rapyd API).
- Browser: international suite (54 checks) and all earlier UI suites.
- 223 frontend unit tests, migration applied twice, production build and prerender.
