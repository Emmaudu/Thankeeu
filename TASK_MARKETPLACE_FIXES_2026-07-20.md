# Task Marketplace Fixes — 2026-07-20 (session 3)

## 1. Tasks disappearing from Browse Tasks after the first bid

**Cause:** When a tasker places the first bid, the backend flips the
task's `status` from `open` to `bidding` (`backend/routes/tasks.js`,
bid-submission route — this itself is correct and intentional, and the
route already allowed further bids on `bidding`-status tasks). The bug
was on the read side: every page that lists biddable tasks hardcoded
`status: 'open'` when calling the API, so the moment status flipped, the
task vanished from those lists even though it was still fully open for
more bids.

**Fix:**
- `backend/routes/tasks.js` — `GET /tasks` now accepts a comma-separated
  list of statuses (`status=open,bidding`) and uses `.in()` instead of
  `.eq()` when more than one is given. Single-status requests (used
  elsewhere, e.g. admin filters) are unaffected.
- `frontend/src/pages/Tasks.jsx`, `TaskerDashboard.jsx`, `Home.jsx` — all
  three places that fetch "open" tasks for browsing now request
  `status: 'open,bidding'` instead of `status: 'open'`.

## 2. City + state tasker notifications — verified already correct

Checked `notifyNearbyTaskers()` in `tasks.js`: it already notifies
city-matching taskers (priority, in-app + email) and same-state
taskers in other cities (in-app + email, distinct messaging) on every
task creation. Verified there's no state-name mismatch bug between the
tasker signup form and the task posting forms — both use the identical
`NIGERIAN_STATES` list with matching spelling/casing. No code change
made here; this requirement was already met.

## 3. Bid-price sanity advisory

`frontend/src/pages/TaskDetail.jsx` — the bid form now shows a blue
advisory box (with the requester's budget restated) asking taskers to
bid within/around the budget rather than far above it, before the price
input field.

## 4. Budget visibility on task detail page

`frontend/src/pages/TaskDetail.jsx` — added a large, prominent budget
banner (rose gradient background, large bold text) directly under the
task title. Previously the budget was only shown as a small line in the
sidebar "Task Summary" card (kept in place too, for the sidebar
overview).

## 5. Admin: view all bids on a task + monitor progress

**Backend:**
- `backend/routes/admin.js` — new `GET /admin/tasks/:id` returning the
  full task, every bid (all statuses — pending/accepted/rejected, not
  just the winner) with tasker contact info, standard payment records,
  and the equipment/shipment escrow flow (`custom_payments`) including
  proof-of-purchase URLs where applicable.
- `backend/routes/admin.js` — `GET /admin/tasks` (the list route) now
  also selects `budget_min`/`budget_max` and bid counts, which it
  previously omitted.

**Frontend:**
- `frontend/src/pages/AdminDashboard.jsx` — Tasks table rows are now
  clickable, opening a detail modal (`TaskDetailModal`) showing the
  overview, every bid with status badges, and payment/escrow progress.
  A "Bids" column was added to the table itself.
- **Bug fixed while here:** the admin Tasks table's "Budget" column was
  reading `t.budget`, a field that has never existed on the `tasks`
  table (the real columns are `budget_min`/`budget_max`) — it always
  displayed "—" regardless of the task's actual budget. Now reads the
  correct fields.

## Verification performed

- `node --check` on both edited backend files.
- `esbuild` parse on all edited frontend files.
- Tag-balance check on `AdminDashboard.jsx` (table/tr/td all balanced
  after the new modal was added).
- Full `vite build` — succeeded; `TaskDetail` and `page-admin` chunk
  sizes grew as expected for the amount of code added, no build errors.
- Booted the backend for real (`node server.js`) and hit both the
  modified `GET /tasks?status=open,bidding` and the new
  `GET /admin/tasks/:id` — both routes execute correctly (the multi-status
  query reached the database call before failing on this sandbox's fake
  DNS host — not a code error; the admin route correctly returned 401 for
  an unauthenticated request, proving it's mounted and protected).
- Isolated unit-test of the status-splitting logic covering
  `'open,bidding'`, `'open'`, `undefined`, and `'open, bidding'` (with
  stray whitespace) — all parsed correctly.

## Manual steps

None — all changes are application code, no database migration needed.
