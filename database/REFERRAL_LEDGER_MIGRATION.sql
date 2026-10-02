-- ============================================================
-- REFERRAL COMMISSION LEDGER
-- Run once in Supabase SQL Editor (after REFERRAL_MIGRATION.sql).
--
-- An append-only audit trail of every commission event. Rows are never
-- updated or deleted — each state change (credited, made available,
-- withdrawn) appends a new ledger entry. This gives you a fully traceable
-- accounting history independent of the mutable referral_commissions row.
-- ============================================================

CREATE TABLE IF NOT EXISTS referral_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commission_id UUID REFERENCES referral_commissions(id) ON DELETE SET NULL,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  event TEXT NOT NULL CHECK (event IN ('credited','available','withdrawn','reversed')),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ref_ledger_referrer ON referral_ledger(referrer_id);
CREATE INDEX IF NOT EXISTS idx_ref_ledger_task ON referral_ledger(task_id);
CREATE INDEX IF NOT EXISTS idx_ref_ledger_commission ON referral_ledger(commission_id);

NOTIFY pgrst, 'reload schema';
