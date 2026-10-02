-- ============================================================
-- REFERRAL SYSTEM ("Refer & Earn")
-- Run once in Supabase SQL Editor.
--
-- Model:
--  - Every user can have ONE custom referral slug (taskeeu.com/refer/<slug>).
--  - When a new user signs up via a referral link, we record who referred
--    them in `referrals`.
--  - When a referred user's task is completed successfully, the referrer
--    earns 10% of that task's workmanship value as commission, logged in
--    `referral_commissions`.
--  - Commission is 'pending' until the task is complete, then 'available',
--    then 'withdrawn' once paid out.
-- ============================================================

-- 1. Referral slug + referred-by on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_slug TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_referral_slug ON users(referral_slug);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- 2. Referrals: one row per successfully-referred signup
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (referred_user_id)  -- a user can only be referred once
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- 3. Referral commissions: one row per commission-earning event (task completed)
CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  base_amount DECIMAL(12,2) NOT NULL DEFAULT 0,   -- the task workmanship value
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- 10% of base
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('pending','available','withdrawn')),
  withdrawn_at TIMESTAMPTZ,
  flw_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ref_comm_referrer ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_ref_comm_task ON referral_commissions(task_id);
-- Prevent double-crediting the same task for the same referrer
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ref_comm_task_referrer
  ON referral_commissions(task_id, referrer_id);

NOTIFY pgrst, 'reload schema';
