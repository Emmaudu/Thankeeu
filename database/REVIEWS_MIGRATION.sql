-- ═══════════════════════════════════════════════════════════════════════
-- TWO-WAY REVIEWS MIGRATION  (safe to run more than once)
--
-- Requester rates tasker AND tasker rates requester, 1–5 stars + comment,
-- compulsory for every task completed after this migration.
--
--   ratings.direction  'requester_to_tasker' | 'tasker_to_requester'
--   ratings.rater_id   who wrote the review
--   ratings.ratee_id   who the review is about
--   one review per person per task:  UNIQUE (task_id, rater_id)
--   requester_profiles.rating_average / total_ratings  (new, like taskers)
--   tasks.review_required  TRUE for tasks completed from now on — only
--                          these make a review compulsory (old tasks
--                          can still be reviewed, but never block anyone)
--
-- Existing ratings are kept and backfilled as requester → tasker.
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Columns
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS rater_id   UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS ratee_id   UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS direction  TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Backfill existing rows (they were all written by requesters about taskers)
UPDATE ratings
   SET direction = 'requester_to_tasker',
       rater_id  = COALESCE(rater_id, requester_id),
       ratee_id  = COALESCE(ratee_id, tasker_id)
 WHERE direction IS NULL;

-- Rows that cannot be attributed (no requester/tasker recorded) are unusable
-- for reviews; report them rather than deleting anything.
DO $$
DECLARE n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM ratings WHERE rater_id IS NULL OR ratee_id IS NULL;
  IF n > 0 THEN
    RAISE NOTICE '% old rating row(s) have no requester/tasker and are excluded from averages: SELECT * FROM ratings WHERE rater_id IS NULL OR ratee_id IS NULL;', n;
  END IF;
END $$;

-- 3. Direction check
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_direction_check') THEN
    ALTER TABLE ratings ADD CONSTRAINT ratings_direction_check
      CHECK (direction IN ('requester_to_tasker', 'tasker_to_requester'));
  END IF;
END $$;

-- New reviews must carry a real comment (10–1000 chars). NOT VALID = existing
-- rows (which may have empty comments) are left untouched; new rows are checked.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_comment_length_check') THEN
    ALTER TABLE ratings ADD CONSTRAINT ratings_comment_length_check
      CHECK (comment IS NOT NULL AND char_length(btrim(comment)) BETWEEN 10 AND 1000) NOT VALID;
  END IF;
END $$;

-- Stars 1–5 (already in schema.sql; repeated in case the live table lacks it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'ratings'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%rating >= 1%'
  ) THEN
    ALTER TABLE ratings ADD CONSTRAINT ratings_rating_range_check CHECK (rating BETWEEN 1 AND 5) NOT VALID;
  END IF;
END $$;

-- 4. Uniqueness: the old UNIQUE(task_id, requester_id) would stop the tasker
--    from reviewing (both rows share requester_id). Replace it with one review
--    per person per task.
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'ratings'::regclass AND contype = 'u'
      AND conname <> 'ratings_task_rater_unique'
  LOOP
    EXECUTE format('ALTER TABLE ratings DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_task_rater_unique') THEN
    ALTER TABLE ratings ADD CONSTRAINT ratings_task_rater_unique UNIQUE (task_id, rater_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ratings_ratee_direction ON ratings(ratee_id, direction, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_task ON ratings(task_id);

-- 5. Requester reputation columns
ALTER TABLE requester_profiles ADD COLUMN IF NOT EXISTS rating_average DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE requester_profiles ADD COLUMN IF NOT EXISTS total_ratings  INTEGER DEFAULT 0;

-- 6. Which completed tasks make a review compulsory
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_required BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 7. Recompute tasker averages from requester → tasker reviews only
UPDATE tasker_profiles tp
   SET rating_average = COALESCE(s.avg, 0),
       total_ratings  = COALESCE(s.cnt, 0)
  FROM (
    SELECT ratee_id, ROUND(AVG(rating)::numeric, 2) AS avg, COUNT(*) AS cnt
      FROM ratings WHERE direction = 'requester_to_tasker' AND ratee_id IS NOT NULL
     GROUP BY ratee_id
  ) s
 WHERE tp.user_id = s.ratee_id;

-- Verify (optional)
-- SELECT direction, COUNT(*) FROM ratings GROUP BY direction;
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'ratings'::regclass;
