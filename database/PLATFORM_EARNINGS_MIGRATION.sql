-- ═══════════════════════════════════════════════════════════════════════
-- PLATFORM EARNINGS MIGRATION  (safe to run more than once)
--
-- Taskeeu's own income ledger: one row per task payout, recording the fee
-- Taskeeu kept. Written by the server at the moment a tasker's final balance
-- is paid out (POST /payments/withdraw). Read by Admin → Revenue and Overview.
--
--   gross_amount     the full amount the requester paid for the task
--   fee_rate         the rate applied (0.20 = 20%; lower if an admin reduced it)
--   fee_amount       Taskeeu's income = fee_rate × gross_amount
--   advance_deducted advances already paid to the tasker from this task
--   tasker_payout    what the final transfer sent to the tasker for this task
--   status           'earned'   — bank confirmed the transfer
--                    'pending'  — bank has not confirmed yet (ambiguous reply)
--   source           'payout' (live) | 'backfill' (payouts made before this ledger)
--
-- Run AFTER ADVANCE_PAYMENTS_MIGRATION.sql (uses advance_requests).
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS platform_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  -- plain UUIDs (no foreign keys) so existing API joins between tasks,
  -- payments and users can never become ambiguous
  task_id UUID,
  tasker_id UUID,
  requester_id UUID,
  gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
  fee_rate NUMERIC(5,4) NOT NULL CHECK (fee_rate >= 0 AND fee_rate <= 1),
  fee_amount NUMERIC(12,2) NOT NULL CHECK (fee_amount >= 0),
  advance_deducted NUMERIC(12,2) NOT NULL DEFAULT 0,
  tasker_payout NUMERIC(12,2) NOT NULL DEFAULT 0,
  payout_reference TEXT,
  status TEXT NOT NULL DEFAULT 'earned' CHECK (status IN ('earned', 'pending')),
  source TEXT NOT NULL DEFAULT 'payout' CHECK (source IN ('payout', 'backfill')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_earnings_payment_unique UNIQUE (payment_id)
);
ALTER TABLE platform_earnings DROP CONSTRAINT IF EXISTS platform_earnings_task_id_fkey;
CREATE INDEX IF NOT EXISTS idx_platform_earnings_created ON platform_earnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_tasker ON platform_earnings(tasker_id);

-- Backfill payouts that happened before this ledger existed. Those payouts
-- charged 20% of the balance left after advances (the old rule), so that is
-- what is recorded — the ledger shows what Taskeeu actually kept.
INSERT INTO platform_earnings (payment_id, task_id, tasker_id, requester_id, gross_amount, fee_rate, fee_amount,
                               advance_deducted, tasker_payout, payout_reference, status, source, created_at)
SELECT p.id, p.task_id, p.tasker_id, p.requester_id, p.amount, 0.20,
       ROUND((p.amount - COALESCE(adv.withdrawn, 0)) * 0.20, 2),
       COALESCE(adv.withdrawn, 0),
       ROUND((p.amount - COALESCE(adv.withdrawn, 0)) * 0.80, 2),
       p.payout_reference, 'earned', 'backfill', p.withdrawn_at
FROM payments p
JOIN tasks t ON t.id = p.task_id AND t.status = 'completed'
LEFT JOIN (
  SELECT task_id, SUM(approved_amount) AS withdrawn
  FROM advance_requests WHERE status = 'withdrawn' GROUP BY task_id
) adv ON adv.task_id = p.task_id
WHERE p.payment_type = 'workmanship'
  AND p.withdrawn_at IS NOT NULL
  AND p.amount - COALESCE(adv.withdrawn, 0) >= 0
ON CONFLICT (payment_id) DO NOTHING;


-- Private tables: only the Taskeeu server (service role, which bypasses RLS)
-- can read them. Supabase's public anon key gets nothing.
ALTER TABLE platform_earnings ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
