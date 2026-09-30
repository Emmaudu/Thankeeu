-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: Ensure card_visitors has a UNIQUE(card_id, author_email)
-- constraint. Two incompatible CREATE TABLE definitions exist across
-- migrations — RUN_THIS_IN_SUPABASE.sql has the constraint, but
-- migration_all_fixes.sql does not. Without it, every
-- `.upsert(..., { onConflict: 'card_id,author_email' })` call in
-- messageController.js's guest-visitor tracking fails silently
-- (caught + console.warn'd), so re-engagement emails never get triggered.
-- ════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'card_visitors'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%card_id%author_email%'
  ) THEN
    -- Remove any duplicate (card_id, author_email) rows first, keeping the newest
    DELETE FROM card_visitors a USING card_visitors b
    WHERE a.card_id = b.card_id
      AND a.author_email = b.author_email
      AND a.author_email IS NOT NULL
      AND a.created_at < b.created_at;

    ALTER TABLE card_visitors ADD CONSTRAINT card_visitors_card_email_unique
      UNIQUE (card_id, author_email);
  END IF;
END $$;
