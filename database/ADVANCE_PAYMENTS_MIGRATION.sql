-- ═══════════════════════════════════════════════════════════════════════
-- ADVANCE PAYMENTS MIGRATION  (safe to run more than once)
--
-- The advance_requests table was created directly in Supabase and was never
-- saved to this repo, so its constraints could not be checked. This script
-- brings it to exactly what the backend code needs, without touching any
-- existing rows:
--   1. table + every column the code reads/writes
--   2. status CHECK allows all four states: pending, approved, rejected, withdrawn
--      (if an older CHECK did not allow 'withdrawn', every withdrawal failed)
--   3. at most ONE active (pending/approved) advance per task, enforced by the
--      database itself — the final guard against double submission
--   4. helpful indexes
--
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Table (no-op if it already exists)
CREATE TABLE IF NOT EXISTS advance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_amount DECIMAL(12,2) NOT NULL,
  approved_amount DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  response_note TEXT,
  responded_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  flw_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Columns (no-op for any that already exist)
ALTER TABLE advance_requests ADD COLUMN IF NOT EXISTS approved_amount DECIMAL(12,2);
ALTER TABLE advance_requests ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE advance_requests ADD COLUMN IF NOT EXISTS response_note TEXT;
ALTER TABLE advance_requests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
ALTER TABLE advance_requests ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;
ALTER TABLE advance_requests ADD COLUMN IF NOT EXISTS flw_reference TEXT;
ALTER TABLE advance_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE advance_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Payout reference for earnings withdrawals. Kept separate from payments.flw_reference,
-- which is UNIQUE and holds the original Flutterwave charge reference.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payout_reference TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_payout_reference ON payments(payout_reference);

-- Escrow columns on tasks (already added by MIGRATION_RUN_NOW.sql; repeated for safety)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_funded BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funded_amount DECIMAL(12,2);

-- 2. Status CHECK: drop whatever status check exists, then add the correct one.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'advance_requests'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE advance_requests DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE advance_requests
  ADD CONSTRAINT advance_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'));

-- 3. One active advance per task. Created only if current data has no
--    duplicates; otherwise a NOTICE lists what to clean up (nothing is changed).
DO $$
DECLARE dup_count INT;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT task_id FROM advance_requests
    WHERE status IN ('pending', 'approved')
    GROUP BY task_id HAVING COUNT(*) > 1
  ) d;

  IF dup_count = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_advance_active_per_task
      ON advance_requests(task_id)
      WHERE status IN ('pending', 'approved');
  ELSE
    RAISE NOTICE '% task(s) have more than one pending/approved advance. Resolve them (reject the extra ones), then run this script again to add the unique index. Find them with: SELECT task_id, id, status, created_at FROM advance_requests WHERE status IN (''pending'',''approved'') AND task_id IN (SELECT task_id FROM advance_requests WHERE status IN (''pending'',''approved'') GROUP BY task_id HAVING COUNT(*) > 1) ORDER BY task_id, created_at;', dup_count;
  END IF;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_advance_requests_task      ON advance_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_advance_requests_tasker    ON advance_requests(tasker_id);
CREATE INDEX IF NOT EXISTS idx_advance_requests_requester ON advance_requests(requester_id, status);

-- Verify (optional): should list the 4 allowed statuses and the unique index
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'advance_requests_status_check';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'advance_requests';
