-- ============================================================
-- ANALYTICS: PWA installs, push events, email events
-- Run once in Supabase SQL Editor.
-- ============================================================

-- 1. PWA install events — one row each time the app is installed
CREATE TABLE IF NOT EXISTS pwa_installs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform TEXT,          -- 'android' | 'ios' | 'windows' | 'mac' | 'other'
  device_type TEXT,       -- 'mobile' | 'desktop'
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pwa_installs_created ON pwa_installs(created_at DESC);
ALTER TABLE pwa_installs DISABLE ROW LEVEL SECURITY;

-- 2. Push events — sent / delivered-shown / opened, per notification
CREATE TABLE IF NOT EXISTS push_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID,       -- groups a single admin send together
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event TEXT NOT NULL CHECK (event IN ('sent','shown','opened')),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_events_campaign ON push_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_push_events_created ON push_events(created_at DESC);
ALTER TABLE push_events DISABLE ROW LEVEL SECURITY;

-- 3. Email events — from Resend webhooks (delivered / opened / clicked / bounced)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID REFERENCES broadcast_emails(id) ON DELETE CASCADE,
  email TEXT,
  event TEXT NOT NULL,    -- 'sent','delivered','opened','clicked','bounced','complained'
  resend_email_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_events_broadcast ON email_events(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_email_events_resend ON email_events(resend_email_id);
ALTER TABLE email_events DISABLE ROW LEVEL SECURITY;

-- Link broadcast_emails rows to Resend so webhooks can be matched back.
ALTER TABLE broadcast_emails ADD COLUMN IF NOT EXISTS resend_batch_ids TEXT[];

NOTIFY pgrst, 'reload schema';

-- 4. Poster events — track downloads, link copies per user
CREATE TABLE IF NOT EXISTS poster_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN ('download','copy_link')),
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_poster_events_user ON poster_events(user_id);
CREATE INDEX IF NOT EXISTS idx_poster_events_created ON poster_events(created_at DESC);
ALTER TABLE poster_events DISABLE ROW LEVEL SECURITY;
