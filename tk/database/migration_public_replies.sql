-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: anyone viewing a card can reply to an individual signer
-- ("guest" replies), not only the creator and the recipient. Safe to re-run.
-- Run after migration_message_replies.sql.
-- ════════════════════════════════════════════════════════════════════════
ALTER TABLE message_replies DROP CONSTRAINT IF EXISTS message_replies_author_role_check;
ALTER TABLE message_replies ADD CONSTRAINT message_replies_author_role_check
  CHECK (author_role IN ('creator', 'recipient', 'guest'));

-- A guest's optional email (never shown publicly) and the hash of the token
-- their browser keeps so they can delete their own reply.
ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS author_email      TEXT;
ALTER TABLE message_replies ADD COLUMN IF NOT EXISTS delete_token_hash TEXT;

NOTIFY pgrst, 'reload schema';
