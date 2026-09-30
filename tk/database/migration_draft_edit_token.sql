-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: draft_edit_token for anonymous (pre-signup) card creation
-- Run in Supabase SQL Editor → New Query → Run
-- Safe to run multiple times (IF NOT EXISTS guards).
--
-- WHY THIS IS NEEDED:
-- The new no-login card creation flow lets a visitor start and edit a card
-- before signing up (creator_id is null at that point). The existing
-- updateCard ownership check only recognizes req.user / req.member /
-- req.company — none of which exist for an anonymous visitor — so there
-- was no way to prove "this is my draft" without requiring login.
-- access_token already exists but is the RECIPIENT's private view-link
-- credential; reusing it for edit rights would let anyone holding that
-- link edit the card too, which is a real privilege escalation. This is a
-- separate, edit-only credential.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE cards ADD COLUMN IF NOT EXISTS draft_edit_token TEXT UNIQUE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cards_draft_edit_token ON cards(draft_edit_token);

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'cards' AND column_name IN ('draft_edit_token', 'is_draft', 'claimed_at');
