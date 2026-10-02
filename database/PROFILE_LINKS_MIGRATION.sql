-- ═══════════════════════════════════════════════════════════════════════
-- TASKER PROFILE LINKS  (safe to run more than once)
--
-- Every tasker gets ONE permanent, readable profile link:
--     https://taskeeu.com/tasker/<profile_slug>      e.g. /tasker/emmanuel-uduebholo
-- Built from the tasker's name; if two taskers share a name, later ones get
-- -2, -3 … (emmanuel-uduebholo-2). The slug never changes afterwards, so
-- shared links keep working even if the name is edited.
-- Old links (/taskers/<id>, /tasker/<username>) keep working too.
--
-- Run in: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_slug TEXT;

-- Backfill every tasker that has no slug yet (oldest accounts first get the plain name).
-- Reserved words (real pages under /tasker/…) are never used as a slug.
DO $$
DECLARE
  r RECORD;
  base TEXT;
  candidate TEXT;
  n INT;
  reserved TEXT[] := ARRAY['login','signup','dashboard','register','profile','settings','new','me'];
BEGIN
  FOR r IN
    SELECT id, full_name, username FROM users
     WHERE role = 'tasker' AND profile_slug IS NULL
     ORDER BY created_at, id
  LOOP
    base := COALESCE(
      NULLIF(trim(both '-' from regexp_replace(lower(regexp_replace(normalize(coalesce(r.full_name, ''), NFD), '[\u0300-\u036f]', '', 'g')), '[^a-z0-9]+', '-', 'g')), ''),
      NULLIF(trim(both '-' from regexp_replace(lower(regexp_replace(normalize(coalesce(r.username, ''), NFD), '[\u0300-\u036f]', '', 'g')), '[^a-z0-9]+', '-', 'g')), ''),
      'tasker');
    base := COALESCE(NULLIF(trim(both '-' from left(base, 60)), ''), 'tasker');
    IF base = ANY(reserved) THEN base := base || '-tasker'; END IF;
    candidate := base;
    n := 1;
    WHILE EXISTS (SELECT 1 FROM users WHERE role = 'tasker' AND profile_slug = candidate) LOOP
      n := n + 1;
      candidate := base || '-' || n;
    END LOOP;
    UPDATE users SET profile_slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- One tasker per slug (enforced by the database).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tasker_profile_slug
  ON users (profile_slug)
  WHERE role = 'tasker' AND profile_slug IS NOT NULL;

-- Repair the cached "tasks completed" count (it was stuck at 0 for tasks completed
-- before the completion-code fix). The app now also counts live on every view.
UPDATE tasker_profiles tp
   SET total_tasks_completed = COALESCE((
         SELECT COUNT(*) FROM tasks t
          WHERE t.accepted_tasker_id = tp.user_id AND t.status = 'completed'), 0)
 WHERE tp.total_tasks_completed IS DISTINCT FROM COALESCE((
         SELECT COUNT(*) FROM tasks t
          WHERE t.accepted_tasker_id = tp.user_id AND t.status = 'completed'), 0);

-- Make the API see the new column immediately.
NOTIFY pgrst, 'reload schema';

-- Verify (optional):
-- SELECT full_name, username, profile_slug FROM users WHERE role = 'tasker' ORDER BY created_at;
