-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: Extend sub_plan enum + fix company_subscriptions for admin
-- Run in Supabase SQL Editor → New Query → Run
-- Safe to run multiple times (IF NOT EXISTS guards)
-- ════════════════════════════════════════════════════════════════════════

-- 1. Add 'pilot' to sub_plan enum (used by grantPilot)
DO $$ BEGIN
  ALTER TYPE sub_plan ADD VALUE IF NOT EXISTS 'pilot';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add 'admin' to sub_plan enum (used by setCompanyMultiplier)
DO $$ BEGIN
  ALTER TYPE sub_plan ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Ensure company_subscriptions has a unique constraint on company_id
--    so our upsert onConflict:'company_id' works correctly.
--    If multiple rows exist per company (e.g. payment history), this
--    upsert will target the most recent active row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'company_subscriptions'
      AND indexdef LIKE '%UNIQUE%company_id%'
      AND indexdef NOT LIKE '%company_id%flw%'
      AND indexdef NOT LIKE '%company_id%paystack%'
  ) THEN
    -- Only add unique constraint if there are no duplicate company_id rows
    IF (SELECT COUNT(*) FROM (
      SELECT company_id FROM company_subscriptions
      GROUP BY company_id HAVING COUNT(*) > 1
    ) dups) = 0 THEN
      ALTER TABLE company_subscriptions
        ADD CONSTRAINT company_subscriptions_company_id_unique UNIQUE (company_id);
    ELSE
      RAISE NOTICE 'Skipping unique constraint — duplicate company_id rows exist. Run cleanup first.';
    END IF;
  END IF;
END $$;

-- 4. For companies that have a pricing_multiplier set but no active
--    subscription row, backfill an active subscription so the cron
--    starts processing them immediately.
INSERT INTO company_subscriptions (company_id, plan, status, amount, starts_at, expires_at, auto_renew)
SELECT
  id AS company_id,
  'admin'::sub_plan AS plan,
  'active'::sub_status AS status,
  0 AS amount,
  NOW() AS starts_at,
  NOW() + INTERVAL '10 years' AS expires_at,
  FALSE AS auto_renew
FROM companies
WHERE
  pricing_multiplier IS NOT NULL
  AND id NOT IN (
    SELECT company_id FROM company_subscriptions WHERE status = 'active'
  )
ON CONFLICT (company_id) DO UPDATE
  SET status = 'active', expires_at = NOW() + INTERVAL '10 years';

-- Verify
SELECT c.name, cs.plan, cs.status, cs.expires_at
FROM company_subscriptions cs
JOIN companies c ON c.id = cs.company_id
WHERE cs.status = 'active'
ORDER BY cs.created_at DESC
LIMIT 20;
