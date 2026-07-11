-- ============================================================================
-- migration_live_memory_wall.sql
-- Adds Live Memory Wall™ to Thankeeu
-- Run AFTER migration_memory_movie.sql — fully idempotent
-- ============================================================================

-- ── card_experience column on cards ──────────────────────────────────────────
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS card_experience text NOT NULL DEFAULT 'card_only'
  CHECK (card_experience IN ('card_only','wall_only','card_and_wall'));

-- ── wall_posts table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wall_posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id       uuid        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  author_name   text        NOT NULL,
  author_email  text,
  caption       text,
  media_url     text,
  media_type    text        CHECK (media_type IN ('image','video','gif')),
  is_moderated  boolean     NOT NULL DEFAULT false,  -- hidden pending approval
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wall_posts_card_id    ON wall_posts(card_id);
CREATE INDEX IF NOT EXISTS idx_wall_posts_created_at ON wall_posts(created_at);

ALTER TABLE wall_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wall_posts_select" ON wall_posts;
CREATE POLICY "wall_posts_select"
  ON wall_posts FOR SELECT USING (NOT is_moderated);

DROP POLICY IF EXISTS "wall_posts_insert" ON wall_posts;
CREATE POLICY "wall_posts_insert"
  ON wall_posts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "wall_posts_service" ON wall_posts;
CREATE POLICY "wall_posts_service"
  ON wall_posts FOR ALL USING (auth.role() = 'service_role');
