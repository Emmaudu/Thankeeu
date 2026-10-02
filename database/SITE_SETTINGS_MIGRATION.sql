-- ============================================================
-- MIGRATION: Site Settings (nav visibility toggles etc.)
-- Run this once in your Supabase SQL Editor.
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the Browse Taskers toggle as visible by default
INSERT INTO site_settings (key, value) VALUES ('nav_show_browse_taskers', 'true')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
