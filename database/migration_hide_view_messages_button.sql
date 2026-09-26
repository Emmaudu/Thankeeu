-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: hide_view_messages_button column on cards table
-- Lets a card creator hide the "View X messages from others" button on
-- the signing page, so people signing can't peek at other signers'
-- messages before adding their own — regardless of whether individual
-- messages are marked private (allow_private_messages / is_private).
-- Run in Supabase SQL Editor → New Query → Run (safe, idempotent)
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS hide_view_messages_button BOOLEAN DEFAULT FALSE;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'cards'
  AND column_name = 'hide_view_messages_button';
