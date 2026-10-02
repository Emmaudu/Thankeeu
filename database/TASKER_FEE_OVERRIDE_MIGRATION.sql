-- ═══════════════════════════════════════════════════════════════════════
-- TASKER FEE OVERRIDE MIGRATION  (safe to run more than once)
--
-- Taskeeu keeps a 20% platform fee from each tasker's final task payout.
-- An admin can lower it for a specific tasker — down to 0% so the tasker
-- keeps 100%. NULL = the normal 20% (every tasker not specially set).
--
--   platform_fee_rate       0.0000 – 0.2000   (0% – 20%), NULL = standard
--   platform_fee_note       why the admin changed it (shown to admins only)
--   platform_fee_updated_at / platform_fee_updated_by   who changed it, when
--
-- The rate in force at the moment the tasker withdraws is the one applied,
-- and the fee actually charged is recorded in the task activity log.
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS platform_fee_rate NUMERIC(5,4);
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS platform_fee_note TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS platform_fee_updated_at TIMESTAMPTZ;
-- Plain UUID on purpose (NO foreign key): a second link from tasker_profiles to
-- users would make the API's users ⇄ tasker_profiles joins ambiguous and break them.
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS platform_fee_updated_by UUID;
ALTER TABLE tasker_profiles DROP CONSTRAINT IF EXISTS tasker_profiles_platform_fee_updated_by_fkey;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasker_profiles_platform_fee_rate_range') THEN
    ALTER TABLE tasker_profiles ADD CONSTRAINT tasker_profiles_platform_fee_rate_range
      CHECK (platform_fee_rate IS NULL OR (platform_fee_rate >= 0 AND platform_fee_rate <= 0.2));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
