-- ════════════════════════════════════════════════════════════════════════════
-- Scheduled-delivery reliability (2026-09-30). Run once in the Supabase SQL
-- editor. Safe to run more than once.
--
-- 1. recipient_notified was nullable. The delivery sweep asked for
--    "recipient_notified = false", which never matches NULL, so any card whose
--    flag was NULL (imported, copied or inserted by older code) was never sent.
-- 2. delivery_issue_notified_at records that the creator was told a due card
--    can't be delivered (no recipient email), so they are emailed only once.
-- 3. Index for the per-minute "what is due now" query.
-- ════════════════════════════════════════════════════════════════════════════

UPDATE cards SET recipient_notified = false WHERE recipient_notified IS NULL;
ALTER TABLE cards ALTER COLUMN recipient_notified SET DEFAULT false;
ALTER TABLE cards ALTER COLUMN recipient_notified SET NOT NULL;

ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivery_issue_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cards_due_delivery
  ON cards (send_date)
  WHERE status = 'active' AND recipient_notified = false;

-- Check afterwards — cards that are due and still not delivered, with why:
-- SELECT slug, send_date, payment_pending, recipient_email IS NULL AS no_email
--   FROM cards WHERE status = 'active' AND recipient_notified = false
--    AND send_date <= now() ORDER BY send_date;
