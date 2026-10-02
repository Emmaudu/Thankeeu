-- ============================================================
-- TASK EXPIRY + REFERRAL CODE MIGRATION
-- Run once in Supabase SQL Editor.
-- ============================================================

-- Track when we sent the overdue warning so we do not spam.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS expiry_warned_at TIMESTAMPTZ;

-- 4-pin referral code for requesters (used on marketing posters).
-- Codes are uppercase alphanumeric e.g. AB3X, generated on signup.
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_pin VARCHAR(6) UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_pin ON users(referral_pin) WHERE referral_pin IS NOT NULL;

NOTIFY pgrst, 'reload schema';
