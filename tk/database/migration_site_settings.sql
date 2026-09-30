-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: site_settings table for platform-wide config
-- Run in Supabase SQL Editor → New Query → Run
-- Safe to run multiple times (idempotent)
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed default (null = use ffmpeg-generated ambient)
INSERT INTO site_settings (key, value) VALUES ('movie_bg_music_url', null)
  ON CONFLICT (key) DO NOTHING;
