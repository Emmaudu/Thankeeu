-- ════════════════════════════════════════════════════════════════════════
-- Fix birthday notification window + ensure occasion_types are seeded
-- Run in Supabase SQL Editor → New Query → Run
-- Safe to run multiple times (idempotent)
-- ════════════════════════════════════════════════════════════════════════

-- 1. Fix notify_days_before for birthday (was 2, should be 7)
UPDATE occasion_types
SET notify_days_before = 7
WHERE name = 'birthday' AND notify_days_before < 7;

-- 2. Set sensible defaults for any other occasion types with low values
UPDATE occasion_types
SET notify_days_before = 7
WHERE notify_days_before < 7 AND name NOT IN ('new_hire');
-- new_hire stays at 0 (fires on the day)

-- 3. Ensure unique constraint on (company_id, name) for upsert to work
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

-- 4. Seed occasion_types for any companies that are missing them
DO $$
DECLARE
  co RECORD;
BEGIN
  FOR co IN
    SELECT id FROM companies
    WHERE id NOT IN (SELECT DISTINCT company_id FROM occasion_types WHERE company_id IS NOT NULL)
  LOOP
    PERFORM seed_occasion_types(co.id);
  END LOOP;
END $$;

-- 5. Verify — should show birthday with notify_days_before = 7
SELECT company_id, name, notify_days_before, default_scope, is_active
FROM occasion_types
WHERE name = 'birthday'
ORDER BY company_id;
