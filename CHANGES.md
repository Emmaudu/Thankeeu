
## Round 13 — Scheduled delivery reliability (2026-09-30)
Root causes found and fixed:
1. Backend could die permanently (Railway restart limit 3, no unhandledRejection handler) → restart ALWAYS + crash handlers.
2. `recipient_notified` NULL rows never matched the sweep → NULL-tolerant queries + migration making it NOT NULL.
3. Scheduled cards with no recipient email were skipped silently forever → email now required when a date is set; creator alerted within a minute.
4. Unpaid (pay-later) cards held with late/no notice → "on hold" email within a minute, even past the reminder cap.
5. Failed schedule save still launched the card → now blocks launch.
6. Date picker min used UTC date (US evenings couldn't pick today) → recipient/browser zone.
7. Member occasions page sent local time as UTC → converted.
8. Partial updates lost the time (ISO instant / time-only edit) → `utils/schedule.js`.
9. Two instances could both email the recipient → claim checks rows changed.
10. Sweep query depended on an unused users join → removed.
New: `GET /api/internal/delivery-status` (x-admin-secret), `/health` shows last sweep.
Deploy: run `database/migration_delivery_reliability.sql`; optional `database/optional_delivery_heartbeat.sql`.
