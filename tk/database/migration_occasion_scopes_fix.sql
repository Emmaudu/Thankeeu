-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix occasion scopes toggle persistence
-- Run in Supabase SQL Editor → New Query → Run
-- Safe to run multiple times (idempotent)
-- ════════════════════════════════════════════════════════════════════════

-- 1. occasion_scopes JSONB column on companies (stores scope per occasion type)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS occasion_scopes JSONB DEFAULT '{}';

-- 2. default_scope column on occasion_types (synced from the JSONB above)
ALTER TABLE occasion_types ADD COLUMN IF NOT EXISTS default_scope TEXT DEFAULT 'department';

-- 3. Unique constraint on (company_id, name) — required for upsert onConflict
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'occasion_types'
      AND indexdef LIKE '%company_id%name%'
      AND indexdef LIKE '%UNIQUE%'
  ) THEN
    ALTER TABLE occasion_types
      ADD CONSTRAINT occasion_types_company_name_unique UNIQUE (company_id, name);
  END IF;
END $$;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'companies' AND column_name = 'occasion_scopes';
