-- ══════════════════════════════════════════════════════════════════════════
-- migration_reminder_and_activity_fixes.sql
-- Run this in Supabase SQL Editor → New Query → Run
-- Safe to run multiple times (all use IF NOT EXISTS / IF NOT EXISTS).
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Tracks whether the 48hr-before-deadline reminder has already been sent
--    for this card, so the 8am cron doesn't re-email people every day.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS deadline_reminded BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_cards_deadline_reminded
  ON cards(deadline_reminded) WHERE status = 'active';

-- 2. Marks when the mid-period reminder was sent for a card.
--    Used as a company-level dedup flag for shared cards (e.g. Valentine's Day)
--    where per-member occasion_tracking can't deduplicate across all members.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS mid_reminded_at TIMESTAMPTZ;

-- 3. Activity log table — stores all HR and core team actions for the
--    Activity Log page (/company/activity-log).
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

-- 4. occasion_tracking JSONB column on company_members — stores per-member
--    cron tracking state (which occasions have been notified this year).
ALTER TABLE company_members
  ADD COLUMN IF NOT EXISTS occasion_tracking JSONB DEFAULT '{}'::jsonb;

-- Verify everything
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name='cards' AND column_name='deadline_reminded') AS deadline_reminded_col,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name='cards' AND column_name='mid_reminded_at') AS mid_reminded_at_col,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_name='activity_logs') AS activity_logs_table,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name='company_members' AND column_name='occasion_tracking') AS occasion_tracking_col;

-- 5. Extend member_status enum to include 'deactivated' (for HRIS-terminated
--    employees). Uses IF NOT EXISTS so it is safe to run multiple times.
--
--    IMPORTANT: PostgreSQL requires ALTER TYPE ... ADD VALUE to run OUTSIDE
--    a transaction block and be committed before the new value can be used.
--    Supabase SQL Editor runs each statement individually, so this is safe.
--    DO NOT wrap these in BEGIN/END or a DO $$ block — that causes the
--    "unsafe use of new value" error.
ALTER TYPE member_status ADD VALUE IF NOT EXISTS 'deactivated';
ALTER TYPE member_status ADD VALUE IF NOT EXISTS 'suspended';

-- Verify the enum now has all required values
SELECT unnest(enum_range(NULL::member_status)) AS member_status_values;
