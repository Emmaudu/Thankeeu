-- ══════════════════════════════════════════════════════════════════
--  FIX: "value too long for type character varying(20)" on signup
--
--  users.phone is VARCHAR(20). Real numbers pasted with country code,
--  spaces, brackets and dashes ("+234 (0) 803 123 4567 ext 22") exceed
--  20 characters, so Postgres rejects the INSERT and tasker signup
--  fails at step 3.
--
--  This version is DEFENSIVE:
--    * explicitly targets the `public` schema, so it can never hit
--      Supabase's built-in `auth.users` table by mistake
--    * checks each column exists before altering it, so a missing
--      table or column is skipped instead of aborting the whole script
--    * reports what it changed via NOTICE messages
--
--  Safe to run more than once.
-- ══════════════════════════════════════════════════════════════════

-- ── STEP 1: Diagnostic — show where a `phone` column actually lives ──
DO $$
DECLARE
  r RECORD;
  found BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '--- Columns named "phone" visible in this database ---';
  FOR r IN
    SELECT table_schema, table_name, data_type,
           COALESCE(character_maximum_length::text, 'n/a') AS max_len
    FROM information_schema.columns
    WHERE column_name = 'phone'
    ORDER BY table_schema, table_name
  LOOP
    RAISE NOTICE '  %.% -> % (max length %)',
      r.table_schema, r.table_name, r.data_type, r.max_len;
    found := TRUE;
  END LOOP;

  IF NOT found THEN
    RAISE NOTICE '  (none found — the phone column may have a different name)';
  END IF;
END $$;


-- ── STEP 2: Widen every matching column, but only where it exists ──
DO $$
DECLARE
  target RECORD;
  changed INT := 0;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('public', 'users',              'phone'),
      ('public', 'tasker_profiles',    'bank_account_number'),
      ('public', 'requester_profiles', 'bank_account_number'),
      ('public', 'team_members',       'phone'),
      ('public', 'companies',          'phone')
    ) AS t(sch, tbl, col)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = target.sch
        AND table_name   = target.tbl
        AND column_name  = target.col
        AND data_type    = 'character varying'
        AND COALESCE(character_maximum_length, 999) < 32
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.%I ALTER COLUMN %I TYPE VARCHAR(32)',
        target.sch, target.tbl, target.col
      );
      RAISE NOTICE 'Widened %.%.% to VARCHAR(32)', target.sch, target.tbl, target.col;
      changed := changed + 1;

    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = target.sch
        AND table_name   = target.tbl
        AND column_name  = target.col
    ) THEN
      RAISE NOTICE 'Skipped %.%.% - already wide enough or not a varchar',
        target.sch, target.tbl, target.col;

    ELSE
      RAISE NOTICE 'Skipped %.%.% - table or column not present',
        target.sch, target.tbl, target.col;
    END IF;
  END LOOP;

  RAISE NOTICE '--- Done. % column(s) widened. ---', changed;
END $$;


-- ── STEP 3: Document the column, only if it exists ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
  ) THEN
    COMMENT ON COLUMN public.users.phone IS
      'E.164-ish phone. App normalises to digits plus a leading + and caps at 20 chars before insert. Widened from VARCHAR(20) to 32.';
  END IF;
END $$;
