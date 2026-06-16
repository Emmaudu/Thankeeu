-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: occasion_hide_amounts column on companies table
-- Stores per-occasion hide_amounts preference set in Occasions Manager.
-- Run in Supabase SQL Editor → New Query → Run (safe, idempotent)
-- ════════════════════════════════════════════════════════════════════════

-- Add column to store hide_amounts setting per occasion type
-- Format: { "birthday": true, "work_anniversary": false, ... }
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS occasion_hide_amounts JSONB DEFAULT '{}';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'companies'
  AND column_name IN ('occasion_scopes', 'occasion_hide_amounts');
