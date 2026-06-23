-- ═══════════════════════════════════════════════════════════════════════════
-- migration_gift_credits_fix.sql
-- Fixes the plan_type_v2 constraint to allow admin_gift credits
-- Run in Supabase SQL Editor — safe to re-run
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the old constraint that only allowed classic|standard|pack5
ALTER TABLE card_credits DROP CONSTRAINT IF EXISTS card_credits_plan_type_v2_check;

-- Re-add with admin_gift included
ALTER TABLE card_credits ADD CONSTRAINT card_credits_plan_type_v2_check
  CHECK (plan_type_v2 IN ('classic', 'standard', 'pack5', 'admin_gift'));

-- Also ensure total_purchased and updated_at columns exist (added by migration_credit_system.sql)
ALTER TABLE card_credits ADD COLUMN IF NOT EXISTS total_purchased INTEGER DEFAULT 0;
ALTER TABLE card_credits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure the plan_type_v2 column itself exists
ALTER TABLE card_credits ADD COLUMN IF NOT EXISTS plan_type_v2 TEXT;

-- Apply the new constraint (will no-op if already done above)
ALTER TABLE card_credits DROP CONSTRAINT IF EXISTS card_credits_plan_type_v2_check;
ALTER TABLE card_credits ADD CONSTRAINT card_credits_plan_type_v2_check
  CHECK (plan_type_v2 IN ('classic', 'standard', 'pack5', 'admin_gift'));
