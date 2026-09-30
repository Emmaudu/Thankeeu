-- ═══════════════════════════════════════════════════════════════════════════
-- fix_company_members_hris_columns.sql
--
-- Adds the company_members columns required by HRIS sync and the
-- occasion-automation source-of-truth model. Without these, HRIS sync
-- fails per-employee with:
--   "Could not find the 'leaving_date' column of 'company_members'
--    in the schema cache"
--
-- Run in Supabase SQL Editor → New Query → Run.
-- Safe to re-run: every statement is IF NOT EXISTS / no-op if already applied.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE company_members ADD COLUMN IF NOT EXISTS resumption_date    DATE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS hris_employee_id   TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS is_core_team       BOOLEAN DEFAULT FALSE;

ALTER TABLE company_members ADD COLUMN IF NOT EXISTS leaving_date    DATE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS promotion_date  DATE;

-- Tracking columns so the cron doesn't re-send the same notification/card
-- twice for the same occasion in the same year, per occasion type.
-- Stored as JSONB: { "birthday": {"year": 2026, "card_slug": "...", "celebrant_notified": true, "dept_notified": true}, ... }
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS occasion_tracking JSONB DEFAULT '{}'::jsonb;

-- Optional custom messages for Farewell/Promotion cards, settable via the
-- master template's Farewell Message / Congratulatory Message columns.
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS farewell_message   TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS promotion_message  TEXT;

-- occasion_members companion columns (used by legacy/bulk-import fallback paths)
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS is_active         BOOLEAN DEFAULT TRUE;
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS hris_employee_id  TEXT;

-- ─── Done — verify columns now exist ─────────────────────────────────────────
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'company_members'
  AND column_name IN (
    'resumption_date','hris_employee_id','is_core_team',
    'leaving_date','promotion_date','occasion_tracking',
    'farewell_message','promotion_message'
  )
ORDER BY column_name;
