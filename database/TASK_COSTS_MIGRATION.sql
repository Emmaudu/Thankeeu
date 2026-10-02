-- ═══════════════════════════════════════════════════════════════════════
-- TASK COSTS MIGRATION  (safe to run more than once)
--
-- A task's price is now a breakdown chosen by the requester when posting:
--   cost_workmanship  the tasker's pay for the work            (required)
--   cost_transport    getting to and from the task location    (optional)
--   cost_waybill      sending / delivering items               (optional)
--   cost_items        items or equipment to be bought for it   (optional)
-- The single total (sum of the four) is stored in budget_min AND budget_max,
-- so every existing screen, email and query keeps working and shows one sum.
-- Tasks posted before this change keep their old values.
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cost_workmanship NUMERIC(12,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cost_transport NUMERIC(12,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cost_waybill NUMERIC(12,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cost_items NUMERIC(12,2);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_costs_non_negative') THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_costs_non_negative CHECK (
      COALESCE(cost_workmanship, 0) >= 0 AND COALESCE(cost_transport, 0) >= 0 AND
      COALESCE(cost_waybill, 0) >= 0 AND COALESCE(cost_items, 0) >= 0);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
