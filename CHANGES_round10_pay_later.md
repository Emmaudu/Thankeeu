# Round 10 — Create Now, Pay Later · recipient time zones · reminders · hero

## Deploy order (important)
1. **Supabase → SQL editor → run `database/migration_pay_later_and_hero.sql`**
   (the same block is appended to `RUN_THIS_IN_SUPABASE.sql`). Safe to re-run.
2. Deploy the backend (Railway), then the frontend (Vercel).

If the backend goes out before the migration, existing cards keep delivering
normally; publishing an *unpaid* card is refused with a clear message (it fails
closed — an unpaid card can never be delivered for free).

## 1. Create Now, Pay Later
- Final step button is now **Create Now, Pay Later**, with the note "pay when you're
  happy with the signatures…". "Prefer to pay now instead?" keeps credits / card / discount codes.
- The card goes live straight away (`status=active`, `payment_pending=true`): people can sign,
  add photos/videos/voice notes and chip in to the gift pot.
- **It is never delivered while unpaid**: scheduler, minute sweep, movie pre-render and
  "Send now" (HTTP 402) all check it. Paying (Flutterwave redirect, webhook, credit, 100% code)
  unlocks it; if the delivery time already passed it is delivered immediately, Memory Movie
  and gifts included.
- Emails to the creator: "Congratulations — ready to receive signatures" + Pay link on publish;
  payment reminders (every 3 days, daily in the last 72h, immediately when the date passes —
  max 6); "Payment received" once paid.
- New page **/pay/:slug** (from emails, dashboard and card page).
- Company / team cards stay free. Anonymous drafts must sign in to publish.

## 2. Payment & delivery fixes (existing bugs found)
- `sendEmail` reported success even when Resend rejected the email (Resend v4 returns
  `{ error }` instead of throwing) — a card could be marked delivered with nothing sent.
  Now checked; delivery retries 3× and puts the card back to undelivered (retry in 15 min).
  "Send now" shows an error instead of false success.
- Foreign-currency card fees (USD/GBP/EUR…) were rejected as "underpayment" (USD amount
  compared with ₦5,000). Now compared in the charged currency. Webhook got the same check.
- Movie pre-render never started (`.catch` on a Supabase builder threw and was swallowed).
- Credits could be burned twice on one card (double click) — now refunded.
- Cover text shadows were dropped on save.
- Clients could create a card already `active` (unpaid) by sending `status` — now drafts only
  (company/team members keep their existing behaviour).

## 3. Recipient country / time zone
Both creation flows ask for the recipient's country (and zone for US, Canada, Australia,
Indonesia, Brazil, Mexico). The delivery time is read in *their* local time, with a
preview ("Arrives Tue 20 Oct 09:00 GMT+3 — 07:00 your time"). Stored as UTC as before.

## 4. Abandoned drafts
Unpublished drafts get reminders 1 day after the creator stopped, 2 days later, then a
polite final one 5 days after that (suggesting deleting it, but inviting them to continue).
Editing the draft restarts the sequence. Hourly cron at :37.

## 5. Cover texts
"On cover / Hidden" switches next to Card title, Sender name and Recipient name remove each
completely from the cover (builder, signing page, delivered card). Sender name field added to
the dashboard wizard. An empty sender no longer prints "From Your name".

## 6. Dashboard
Overview refreshes every 15 s (and on returning to the tab) with a Live badge; unpaid cards
show "Awaiting payment" + **Pay Now**; drafts show Continue. My Cards: same, every 20 s.

## 7. Admin → Header
Edit hero title (optional `{word}` = rotating word), subtitle and tagline, with live preview
and reset. Public read: `GET /api/site/hero`.

## 8. Homepage
Hero demo card replaced by a large album flipbook (cover, signer pages with photos, GIF,
video, playable voice note, gift pot page). Transparent floating flags behind the hero and a
labelled flag strip for Finland, China, Canada, USA, UK, Germany, Kenya, France, Malaysia,
Mauritius, Netherlands, Philippines, Saudi Arabia, Rwanda, Bangladesh, Nigeria.

## Tests
`backend/tests/pay-later.test.js` (35), `frontend/src/tests/timezones.test.js` (8).
Backend unit: 371 pass, 2 pre-existing HRIS time-zone failures (fail on the original too).
