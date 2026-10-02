-- ═══════════════════════════════════════════════════════════════════════
-- TIPS MIGRATION  (safe to run more than once)
--
-- Requesters can send the tasker extra money on a task:
--   a tip  (during or after the task), or
--   extra money for a sudden unforeseen cost (while the task is in progress).
-- Stored as payments with payment_type = 'tip' (metadata.kind = 'tip'|'extra').
-- Tips have NO platform fee and are withdrawable as soon as they are paid.
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN ('workmanship','equipment','shipment','refund','full','vooom','tip'));

NOTIFY pgrst, 'reload schema';
