-- ══════════════════════════════════════════════════════════════════════════
-- migration_analytics.sql
-- Run in Supabase SQL Editor → New Query → Run
-- Creates the page_views table for website analytics dashboard
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS page_views (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path        TEXT NOT NULL,
  referrer    TEXT,
  user_agent  TEXT,
  country     TEXT,
  city        TEXT,
  session_id  TEXT,
  user_type   TEXT DEFAULT 'anonymous',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast daily/weekly queries
CREATE INDEX IF NOT EXISTS idx_page_views_date   ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path   ON page_views(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);

-- Daily summary view — pre-aggregated for fast dashboard queries
CREATE OR REPLACE VIEW page_views_daily AS
SELECT
  DATE(created_at AT TIME ZONE 'Africa/Lagos') AS day,
  COUNT(*)                                      AS total_views,
  COUNT(DISTINCT session_id)                    AS unique_visitors,
  COUNT(DISTINCT path)                          AS pages_visited,
  path                                          AS top_path
FROM page_views
GROUP BY DATE(created_at AT TIME ZONE 'Africa/Lagos'), path
ORDER BY day DESC, total_views DESC;

-- Verify
SELECT 'page_views table ready ✓' AS status;
