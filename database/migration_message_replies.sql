-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: replies from the card creator / recipient to each signer
-- (one thread under every board card and album page). Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS message_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  card_id         UUID NOT NULL REFERENCES cards(id)    ON DELETE CASCADE,
  author_role     TEXT NOT NULL CHECK (author_role IN ('creator', 'recipient')),
  author_name     TEXT NOT NULL,
  author_user_id  UUID,
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_replies_card    ON message_replies(card_id, created_at);
CREATE INDEX IF NOT EXISTS idx_message_replies_message ON message_replies(message_id);

-- The API uses the service role; nothing else should read this table directly.
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
