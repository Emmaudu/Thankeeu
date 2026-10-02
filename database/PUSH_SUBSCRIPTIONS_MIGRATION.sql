-- ============================================================
-- WEB PUSH SUBSCRIPTIONS
-- Run once in Supabase SQL Editor.
--
-- Stores each browser/device push subscription so the backend can send
-- notifications. One user can have several (phone, laptop, etc.). The
-- endpoint is unique — re-subscribing the same browser updates its keys.
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

NOTIFY pgrst, 'reload schema';
