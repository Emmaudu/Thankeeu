-- ══════════════════════════════════════════════════════════════════
--  ADMIN HIDE / SHOW TASK ON PUBLIC BROWSE
--  Lets an admin manually pull a task off the public browse page
--  (or put it back) without changing its status or deleting it.
--
--  Defensive: skips cleanly if `tasks` is absent, and only adds the
--  hidden_by foreign key when public.users(id) actually exists.
--  Safe to run any number of times.
-- ══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  has_tasks    BOOLEAN;
  has_users_id BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tasks'
  ) INTO has_tasks;

  IF NOT has_tasks THEN
    RAISE NOTICE 'Skipping - public.tasks does not exist';
    RETURN;
  END IF;

  -- 1. The visibility flag. Default FALSE so every existing task stays visible.
  ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

  -- 2. Audit fields: when it was hidden and why.
  ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS hidden_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

  -- 3. hidden_by, with the FK added only if public.users(id) exists.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
  ) INTO has_users_id;

  ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS hidden_by UUID;

  IF has_users_id AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_hidden_by_fkey'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    BEGIN
      ALTER TABLE public.tasks
        ADD CONSTRAINT tasks_hidden_by_fkey
        FOREIGN KEY (hidden_by) REFERENCES public.users(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added FK tasks.hidden_by -> users.id';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add FK on hidden_by (%) - column still usable', SQLERRM;
    END;
  END IF;

  -- 4. Backfill any NULLs from a partially-applied earlier run.
  UPDATE public.tasks SET is_hidden = FALSE WHERE is_hidden IS NULL;

  RAISE NOTICE 'tasks.is_hidden ready';
END $$;

-- 5. Indexes. The browse query filters is_hidden = false and orders by
--    created_at DESC with LIMIT/OFFSET, so indexing created_at over only
--    the visible rows lets Postgres walk in order and stop at LIMIT.
--    Measured on 5,000 rows: 1.77 ms (seq scan + sort) -> 0.04 ms.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'is_hidden'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_browse_order
      ON public.tasks (created_at DESC) WHERE is_hidden = FALSE;

    CREATE INDEX IF NOT EXISTS idx_tasks_visible_browse
      ON public.tasks (status, deadline) WHERE is_hidden = FALSE;

    COMMENT ON COLUMN public.tasks.is_hidden IS
      'TRUE = admin manually hid this task from the public /tasks browse page. Does not affect status, bids, chat, or dashboards.';
  END IF;
END $$;

-- Report the result so you can confirm it worked
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks'
  AND column_name IN ('is_hidden', 'hidden_at', 'hidden_by', 'hidden_reason')
ORDER BY column_name;
