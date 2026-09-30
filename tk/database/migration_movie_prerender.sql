-- ============================================================================
-- migration_movie_prerender.sql
-- Supports Memory Movie auto-pre-render before card delivery.
-- Run once in Supabase SQL editor — fully idempotent.
-- ============================================================================

-- Track when the pre-render cron last kicked off a render attempt for this card.
-- Used to avoid hammering the renderer on repeated failed cards (the cron will
-- see movie_status='failed' and re-try; this timestamp gates the retry rate).
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS movie_pre_render_at timestamptz DEFAULT NULL;

-- Index so the pre-render cron query (status=active, send_date window) is fast.
-- send_date is almost certainly already indexed, but recipient_notified may not be.
CREATE INDEX IF NOT EXISTS idx_cards_prerender
  ON cards (status, recipient_notified, send_date)
  WHERE status = 'active' AND recipient_notified = false;

COMMENT ON COLUMN cards.movie_pre_render_at IS
  'Set by the pre-render cron when it dispatches a render job. Used to rate-limit retries on failed renders.';
