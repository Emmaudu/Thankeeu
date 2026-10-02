# Admin Location Column + Targeted Broadcast — 2026-07-20 (session 4)

## 1. Tasker location (task_city/task_state) in the Users tab

`task_city` and `task_state` live on the `tasker_profiles` table, not
`users`, so the admin users list had to join them in.

**Backend** (`backend/routes/admin.js`, `GET /admin/users`):
- The select now includes `tasker_profiles(task_city, task_state)` as a
  left join via Supabase's foreign-table select.
- The result is flattened so each user object carries `task_city` /
  `task_state` directly. Requesters (no tasker_profile) and taskers who
  haven't set a location come back as `null`. Verified the flatten logic
  handles all shapes: profile-as-array, empty array, null, and
  single-object.

**Frontend** (`frontend/src/pages/AdminDashboard.jsx`):
- New "Location" column in the Users table, between Phone and Role. Shows
  `City, State` for taskers, `—` for requesters/unset.

## 2. Targeted broadcast — all / by role / specific individuals

Previously the Broadcast tab could only send to all users, all
requesters, or all taskers. Added the ability to hand-pick specific
recipients (including a single person for one-on-one email).

**Backend** (`backend/routes/contact.js`, `POST /contact/broadcast`):
- `audience` now also accepts `'specific'`, with a new optional
  `user_ids` array in the body.
- When `audience === 'specific'`, the route requires a non-empty
  `user_ids` array and queries `.in('id', user_ids)`. All existing
  audiences (`all`, `requesters`, `taskers`) are unchanged.
- The active + email-verified filter still applies to specific sends too,
  so you can't accidentally email a deactivated or unverified account.
- No DB migration needed: the `broadcast_emails.audience` column is plain
  TEXT with no CHECK constraint, so `'specific'` logs fine.

**Frontend** (`frontend/src/pages/AdminDashboard.jsx`, `BroadcastPanel`):
- New "Specific people…" audience option. Choosing it lazy-loads the user
  list (reusing `adminApi.getUsers`, limit 1000) and reveals a recipient
  picker with:
  - search by name/email,
  - role filter (all / requesters / taskers),
  - individual checkboxes, "Select all shown", and "Clear",
  - a running selected-count.
- The send button is disabled and the confirm dialog/preview reflect the
  exact recipient count for a specific send.
- Switched the panel's `alert()` calls to the app's `toast` for
  consistency with the rest of the dashboard.

## Verification

- `node --check` on both edited backend files.
- `esbuild` parse + tag-balance check on `AdminDashboard.jsx` (table/tr/
  td/label/select all balanced; td went 20→21 for the new Location cell).
- Full `vite build` — succeeded; `page-admin` chunk grew ~107→112kB
  consistent with the picker + column added.
- Booted the backend and confirmed both `GET /admin/users` and
  `POST /contact/broadcast` are mounted and auth-protected (401 without a
  token).
- Isolated unit test of the tasker_profiles flatten logic across all
  return shapes.

## Manual steps

None — application code only, no database migration.
