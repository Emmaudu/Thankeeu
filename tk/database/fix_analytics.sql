-- ══════════════════════════════════════════════════════
-- fix_analytics.sql  — run in Supabase SQL Editor
-- Fixes the analytics tab showing zero counts
-- ══════════════════════════════════════════════════════

-- 1. Create the table (safe if already exists)
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

-- 2. Disable RLS — this table is written server-side only
--    (service key), never from the browser directly.
--    RLS would silently block inserts from the backend.
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;

-- 3. Grant service role full access (in case it was restricted)
GRANT ALL ON page_views TO service_role;
GRANT ALL ON page_views TO postgres;

-- 4. Indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_page_views_date    ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path    ON page_views(path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);

-- 5. Verify — should return a count (may be 0 if just created)
SELECT COUNT(*) AS total_rows, 'page_views table is ready ✓' AS status FROM page_views;
