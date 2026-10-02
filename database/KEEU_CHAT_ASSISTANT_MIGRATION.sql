-- ═══════════════════════════════════════════════════════════════════════
-- KEEU CHAT ASSISTANT MIGRATION  (safe to run more than once)
--
-- Keeu is Taskeeu's friendly chat assistant. Her reminders are stored as
-- normal chat messages with no sender (sender_id NULL) and is_bot = true,
-- so both people see the same messages and admins see them in the task log.
--
--   bot_slot — "keeu:0", "keeu:1", … one per reminder in a room. The unique
--              index makes it impossible for two requests arriving at the
--              same moment to post the same reminder twice.
--
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════
-- Keeu's messages have no sender. Make sure sender_id allows NULL.
ALTER TABLE chat_messages ALTER COLUMN sender_id DROP NOT NULL;

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS bot_name TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS bot_kind TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS bot_slot TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS chat_messages_bot_slot_unique
  ON chat_messages(room_id, bot_slot) WHERE bot_slot IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_bot
  ON chat_messages(room_id, created_at) WHERE is_bot;

NOTIFY pgrst, 'reload schema';
