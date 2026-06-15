-- ═══════════════════════════════════════════════════════════════════════════
-- THANKEEU — Activity Logs Migration
-- Run this in Supabase SQL Editor → New Query → Run
-- This creates the activity_logs table used by the Activity Log page
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_id     TEXT NOT NULL,
  actor_type   TEXT NOT NULL CHECK (actor_type IN ('hr','core_team','member')),
  actor_name   TEXT NOT NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  entity_name  TEXT,
  details      JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_company
  ON activity_logs(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_actor
  ON activity_logs(actor_type, created_at DESC);

-- Verify
SELECT 'activity_logs table ready ✓' AS status,
  (SELECT COUNT(*) FROM activity_logs) AS total_rows;
