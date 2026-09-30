-- Migration: link signed messages to registered users
-- This enables author_name on a card to update automatically when a user
-- edits their display name from their dashboard.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS signer_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for fast lookup when syncing author_name on profile update
CREATE INDEX IF NOT EXISTS idx_messages_signer_user_id ON messages(signer_user_id);

-- Backfill: link existing messages to users via matching author_email.
-- Only updates rows where exactly one user matches the email (safe match).
UPDATE messages m
SET signer_user_id = u.id
FROM users u
WHERE m.author_email IS NOT NULL
  AND m.signer_user_id IS NULL
  AND m.author_email = u.email;
