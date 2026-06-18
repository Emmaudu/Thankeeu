-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Recipient Card Claim Flow
-- Adds claim_token to cards so the recipient email link is self-contained
-- and does not expose the internal access_token in email URLs.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add claim_token column to cards (separate from access_token)
--    claim_token: in the delivery email URL → /card/slug?claim=TOKEN
--    access_token: used internally by getRecipientCard after auth
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE;

-- Generate claim tokens for all existing sent cards that don't have one
UPDATE cards
SET claim_token = encode(gen_random_bytes(24), 'hex')
WHERE status IN ('sent', 'active')
  AND claim_token IS NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_cards_claim_token ON cards(claim_token)
  WHERE claim_token IS NOT NULL;

-- 2. Track whether the recipient has claimed (logged in / signed up)
--    so we know which gate to show on the /card/:slug?claim=... URL
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS recipient_claimed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recipient_claimed_at TIMESTAMPTZ;

-- 3. member_received_cards: links HR team member to their received card
--    (mirrors received_cards but for company_members instead of users)
CREATE TABLE IF NOT EXISTS member_received_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  recipient_member_id UUID REFERENCES company_members(id) ON DELETE CASCADE,
  transferred_by UUID,
  transferred_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  UNIQUE(card_id, recipient_member_id)
);
CREATE INDEX IF NOT EXISTS idx_member_received_cards_member
  ON member_received_cards(recipient_member_id);
