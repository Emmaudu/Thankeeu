-- ═══════════════════════════════════════════════════════════════════════
-- Taskeeu: site_analytics table migration
-- Run in Supabase SQL Editor once, then deploy updated backend
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_analytics (
  id           BIGSERIAL PRIMARY KEY,
  page         TEXT NOT NULL,
  referrer     TEXT,
  session_id   TEXT,
  ip_address   TEXT,
  country      TEXT,
  city         TEXT,
  visited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast date-range queries (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_site_analytics_visited_at ON site_analytics (visited_at DESC);
-- Index for country grouping
CREATE INDEX IF NOT EXISTS idx_site_analytics_country    ON site_analytics (country);
-- Index for page grouping
CREATE INDEX IF NOT EXISTS idx_site_analytics_page       ON site_analytics (page);

-- Auto-purge rows older than 90 days to keep the table lean.
-- Run this via pg_cron if available, or manually on a schedule.
-- DELETE FROM site_analytics WHERE visited_at < NOW() - INTERVAL '90 days';

-- Disable RLS for service-role writes from backend
ALTER TABLE site_analytics DISABLE ROW LEVEL SECURITY;
