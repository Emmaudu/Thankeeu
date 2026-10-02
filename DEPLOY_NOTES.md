# Taskeeu — deploy notes

## Order
1. **Database** (Supabase → SQL Editor). All are safe to run more than once:
   1. `database/ADVANCE_PAYMENTS_MIGRATION.sql`
   2. `database/REVIEWS_MIGRATION.sql`
   3. `database/PROFILE_LINKS_MIGRATION.sql`
   4. `database/TASK_WORKSPACE_MIGRATION.sql`   (activity log, proof files, Taskeeu ratings)
   5. `database/KEEU_CHAT_ASSISTANT_MIGRATION.sql`   (Keeu chat assistant)
   6. `database/TASKER_FEE_OVERRIDE_MIGRATION.sql`   ← new in v10: per-tasker fee
   7. `database/PLATFORM_EARNINGS_MIGRATION.sql`   (Taskeeu earnings ledger + backfill)
   8. `database/TASK_COSTS_MIGRATION.sql`   ← new in v11: cost breakdown on tasks
   9. `database/TIPS_MIGRATION.sql`   ← new in v11: tips / extra money (run after VOOOM_MIGRATION)
2. **Backend**: replace files under `backend/`, redeploy (no new packages).
3. **Frontend**: replace files under `frontend/src/`, rebuild, deploy.

## What's included
### New in v11
- **Requester must rate before the code:** the completion code is only released after the
  requester rates and reviews the tasker AND rates Taskeeu (both compulsory). If a task was
  completed first (older codes), the requester still owes both ratings and is blocked from
  posting until done. The Taskeeu rating is now compulsory with every review.
- **Cost breakdown when posting** (public /post-task and dashboard): Workmanship (required),
  Transportation, Waybill, Items or equipment (if applicable), each with a short
  explanation. One total is shown everywhere (/tasks, task page, dashboards, admin, SEO).
  Older range tasks show their higher figure. Costs cannot change once the task is paid.
- **Tips and extra money:** "Add money for tasker" on the task list and task page while the
  task is in progress ("Sudden unforeseen cost? Add money so your tasker can withdraw it"),
  plus optional "Tips to the tasker?" in the code step, the review form and after completion.
  Paid through Flutterwave; no platform fee; withdrawable immediately (even mid-task);
  shown in the admin activity log; never counted as Taskeeu income.
- Dashboards use the Taskeeu brand colour (no purple gradients).
- Public pages: em/en dashes and decorative emojis removed from all visible copy and SEO
  text; ranges read "1 to 3 days"; titles use "Page | Taskeeu".

### New in v10 — platform fee and Taskeeu's own earnings
- **Fee on the full task payment.** Taskeeu's fee is 20% of the whole amount the requester
  paid, not of the balance left after advances. Example: ₦5,000 paid, ₦800 advance →
  fee ₦1,000, final payout ₦3,200 (tasker total ₦4,000 = 80%). Charged once, at the final
  withdrawal; cancelled tasks are never charged.
- **Per-tasker fee (Admin → Tasker KYC → open a tasker → "Platform fee").** Remove the fee
  (tasker keeps 100%), set any rate from 0–20% (e.g. 12.5), or reset to the standard 20%.
  Every other tasker stays on 20%. It applies to the tasker's next withdrawal, including
  balances already waiting. Each change is audit-logged, the tasker is notified, and a
  "Fee x%" badge shows in the tasker list.
- **Taskeeu earnings ledger** (`platform_earnings`): one row per task payout (task payment,
  rate, fee, advance, payout, bank reference). Nothing is recorded if the bank rejects the
  transfer; an unclear bank reply is recorded as "awaiting bank". Past payouts are
  backfilled with the fee that was actually charged then (marked "before ledger").
- **Admin → Revenue & Earnings**: all-time, today, this month, fees due (completed tasks not
  yet withdrawn), upcoming (funded tasks in progress), awaiting bank, month-by-month, and
  every fee record. **Overview** gets a "Taskeeu earnings (fees)" card (click → details).
  The old "Revenue" figure is renamed "Payments received" (it is money in, not profit).
- Taskers now see "Taskeeu fee … of the full task payment" and "You get ₦…" per task.
- Audit fixes: proof videos/PDFs are now also deleted from Cloudinary; admin force-cancel is
  logged, notifies bidders once, is double-click safe and refuses completed tasks;
  agreed cancellations no longer appear twice in the admin log; Keeu migration makes sure
  chat_messages.sender_id allows NULL.

### New in v9 — Keeu 👩🏾, the friendly chat assistant
- Posts in every requester ⇄ tasker task chat (not Vooom). Both people see the same message.
- **Welcome** when the chat is first opened: agree on distance, transport, equipment/items,
  courier and workmanship; the requester pays ONE total into escrow; the tasker can request
  an advance for transport/items/courier on the task page; workmanship is paid at the end.
  If the chat opens after payment, a short "paid" welcome is used instead.
- **Reminders** (rotating): price breakdown (only before payment), photo proofs in chat or
  WhatsApp + proof upload is compulsory before payout, stay respectful and use the Support tab.
- **Not spammy**: only right after someone sends a message, at least 25 min apart, at least
  6 messages since her last one, max 4 per chat per day, silent once the task is completed
  or cancelled. Tune with env `KEEU_GAP_MS` / `KEEU_MIN_HUMAN_MESSAGES` if you like.
- Keeu messages never count as unread, never trigger emails, can't be deleted, and appear
  in the admin chat tab and activity log.

### New in v8 — everything about a task lives inside that task
- **Tasker 3-step completion flow** on the task page: 1) upload proof of work (any file
  type, many at once, preview, remove) → Save; 2) rate the requester (stars + comment) and
  rate Taskeeu → Save; 3) enter the completion code. Steps unlock in order, the server
  enforces the order, and the page switches to "Task completed" instantly (no refresh).
- **Advance inside the task** for both sides: tasker requests / tracks / withdraws;
  requester approves (or lowers) / rejects and sees the balance. Earnings → Advances and
  Payments → Advance Requests are now simple lists with "Open task →".
  Notification links open the task directly.
- Requester sees the tasker's live progress (x/3) and can open every proof file.
- **Cancelled task → every bidder is notified** (in-app + email), once.
- **Admin task activity log**: advance requested/approved/rejected/withdrawn, proofs (with
  file links), completion, every rating with stars and comments (incl. Taskeeu rating),
  tasker chosen/switched/removed, chats opened, cancellations, deadline changes,
  earnings withdrawn — colour-coded by who did it, with filters. Chat tab shows which chat
  (bidder) each message belongs to.
- Needs Cloudinary env vars (already used for avatars/KYC). Tasks already in progress will
  need steps 1–2 before the code is accepted. Removing a non-image proof hides it but
  does not delete the file from Cloudinary.

### Earlier
- Advance payments & escrow balance fixes.
- Two-way compulsory star + comment reviews.
- /tasks cards redesigned.
- Requester can chat with several bidders and switch tasker until paid.
- Tasker profile links: every tasker has one permanent readable link
  (/tasker/emmanuel-uduebholo; same names get -2, -3; accents handled).
  Links use the site you're on (no hard-coded www.taskeeu.com). Old id/username
  links still work and redirect to the clean link. Unapproved profiles say so clearly.
  Requesters can open each bidder's profile from their bid list.
- "Tasks Done" is counted live from completed tasks everywhere (profile, Browse Taskers,
  dashboard, bid list); stale stored counts are repaired automatically and by the migration.
- When a requester chooses a tasker, every other open bidder gets an encouraging email +
  in-app notice (your bid stays open, pitch well, update your profile photo). Once per task.
- SECURITY: the public tasker listing no longer exposes ID documents, bank details,
  home/office addresses, admin notes or phone numbers; public task pages no longer
  show the requester's phone number.
- Fixed: Flutterwave webhooks were silently ignored; payment confirmation is race-safe.
- Fixed: "Withdraw" failed for taskers with 2+ completed tasks.
- Clearer advance wording (approved-but-not-withdrawn advance is included in final payout).

## Verified (real PostgreSQL 16 + PostgREST, full server, real Chromium)
v11 backend: costs + review gate + tips 31/31, workspace 47/47, reviews 55/55, fee +
earnings 28/28, advance 33/33, payout 9/9, Keeu 25/25, admin cancel 6/6, bidding 31/31,
live 13/13, not-selected 14/14, profile links 20/20. Browser: posting + tips 12/12, task
workspace (incl. requester rate → code) 35/35, Keeu 4/4, fee card 6/6. Frontend unit tests
217/217. Build clean; lint 0 errors. All 9 migrations applied twice on a fresh database.
