# Admin Full Task Monitoring — 2026-07-20 (session 5)

Extends the existing admin task-detail view (Admin → Tasks → click a task)
into a complete monitoring console covering the entire task lifecycle:
chat, negotiation, payments, custom/equipment payments, completion codes,
refunds/disputes, and a single timestamped activity log.

## Backend (`backend/routes/admin.js`, `GET /admin/tasks/:id`)

The endpoint the modal already calls now also returns:
- `chat_room` — the task's chat room (or null if none started).
- `messages` — every message in that room, in order, INCLUDING
  soft-deleted ones (`is_deleted` messages are surfaced to admin with a
  note; regular users no longer see them but admin monitoring should).
  Each message carries sender name/role and any media URL.
- `completion_codes` — task completion codes, issued and used, with
  `used_at`.
- `refunds` — refund/dispute requests with reason, tasker response, admin
  notes, and status.
- `activity` — a merged, chronologically sorted log built server-side from
  all of the above plus task creation/completion, so an admin can see the
  exact sequence and timestamps (e.g. a failed payment right after a
  particular chat message). Each entry has `ts`, `type`, `label`, `detail`.

All reads are additive `SELECT`s against existing tables
(`chat_rooms`, `chat_messages`, `task_completion_codes`, `refund_requests`)
— no schema changes.

## Frontend (`frontend/src/pages/AdminDashboard.jsx`, `TaskDetailModal`)

The task detail modal is now tabbed:
- **Overview** — the existing bids + payment/escrow view, now with a
  Refunds & Disputes section added.
- **Chat** — the full conversation between requester and tasker, styled
  as a transcript (tasker vs requester tinted differently), with
  timestamps, media links, and deleted-message markers.
- **Activity Log** — the unified timeline: task posted, each bid, every
  message, each payment and its status, custom-payment state changes,
  completion-code issue/use, and refund events — each with a precise
  `MMM d, yyyy · HH:mm:ss` timestamp.

## Privacy note

This gives admins full visibility into private user-to-user chats. That's
a normal capability for dispute resolution on a marketplace, but it's
worth ensuring the platform's privacy policy discloses that admins may
review chats for safety/dispute purposes.

## Verification

- `node --check` + require-resolution on `admin.js`.
- `esbuild` parse + tag-balance on `AdminDashboard.jsx` (table/tr/td/
  button all balanced).
- Full `vite build` succeeded.
- Booted backend; `GET /admin/tasks/:id` mounted and auth-protected (401
  without token).

## Manual steps

None — application code only, no migration.
