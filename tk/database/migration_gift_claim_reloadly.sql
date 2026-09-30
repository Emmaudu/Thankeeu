-- ═══════════════════════════════════════════════════════════════════════════
-- migration_gift_claim_reloadly.sql
-- Run in Supabase SQL Editor — safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add giftcard claim type to gift_claims table
ALTER TABLE gift_claims
  DROP CONSTRAINT IF EXISTS gift_claims_claim_type_check;

ALTER TABLE gift_claims
  ADD CONSTRAINT gift_claims_claim_type_check
  CHECK (claim_type IN ('transfer','giftcard','airtime','shopping','spa','flowers','food'));

-- 2. Add columns for Reloadly gift card tracking
ALTER TABLE gift_claims ADD COLUMN IF NOT EXISTS product_id       TEXT;
ALTER TABLE gift_claims ADD COLUMN IF NOT EXISTS reloadly_ref     TEXT;
ALTER TABLE gift_claims ADD COLUMN IF NOT EXISTS redemption_code  TEXT;
ALTER TABLE gift_claims ADD COLUMN IF NOT EXISTS product_name     TEXT;

-- 3. Ensure cards table has gift withdrawal columns
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_withdrawn        BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_withdrawn_at     TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_payout_reference TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_payout_amount    INTEGER;

-- 4. Index for fast gift claim lookups
CREATE INDEX IF NOT EXISTS idx_gift_claims_card     ON gift_claims(card_id);
CREATE INDEX IF NOT EXISTS idx_gift_claims_reloadly ON gift_claims(reloadly_ref) WHERE reloadly_ref IS NOT NULL;

-- 5. bank_accounts: allow callerId as owner (user OR member)
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'user';
CREATE INDEX IF NOT EXISTS idx_bank_accounts_owner ON bank_accounts(owner_id, owner_type);

