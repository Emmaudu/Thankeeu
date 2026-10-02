-- ═══════════════════════════════════════════════════════════════════════
-- TASK WORKSPACE MIGRATION  (safe to run more than once)
--
--  1. task_activity      — log of task events that leave no other record
--                          (tasker chosen / switched / declined, chat opened,
--                          task cancelled, deadline extended, earnings withdrawn).
--                          The admin timeline merges this with bids, messages,
--                          payments, advances, proofs, reviews and cancellations.
--  2. task_proofs        — files the tasker uploads as proof of work
--                          (step 1 of the tasker's 3-step completion flow).
--  3. platform_feedback  — the tasker's rating of Taskeeu itself
--                          (step 2, together with the review of the requester).
--
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Activity log
CREATE TABLE IF NOT EXISTS task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT,                      -- requester | tasker | admin | system
  event TEXT NOT NULL,                  -- machine name, e.g. 'tasker_chosen'
  summary TEXT NOT NULL,                -- human sentence shown to admins
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_activity_task ON task_activity(task_id, created_at);

-- 2. Proof-of-work files
CREATE TABLE IF NOT EXISTS task_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  public_id TEXT,
  resource_type TEXT,                   -- image | video | raw
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_proofs_task ON task_proofs(task_id, created_at);

-- 3. Rating of the platform
CREATE TABLE IF NOT EXISTS platform_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT,                            -- requester | tasker
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_feedback_task_user_unique UNIQUE (task_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_platform_feedback_created ON platform_feedback(created_at DESC);

-- Make the API see the new tables immediately.

-- Private tables: only the Taskeeu server (service role, which bypasses RLS)
-- can read them. Supabase's public anon key gets nothing.
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_feedback ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
