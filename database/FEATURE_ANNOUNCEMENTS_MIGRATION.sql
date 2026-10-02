-- ============================================================
-- FEATURE ANNOUNCEMENTS HISTORY
-- Tracks every feature announcement email campaign sent,
-- including the subject, body, recipient count, and timestamp.
-- Run once in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_announcements_created ON feature_announcements(created_at DESC);
ALTER TABLE feature_announcements DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
