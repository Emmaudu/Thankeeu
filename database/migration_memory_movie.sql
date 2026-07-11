-- ============================================================================
-- migration_memory_movie.sql
-- Adds Memory Movie support to Thankeeu
-- Run once in Supabase SQL editor — fully idempotent
-- ============================================================================

-- ── memory_movies table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memory_movies (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id         uuid        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','queued','rendering','completed','failed')),
  movie_url       text,                     -- Cloudinary URL of rendered MP4
  movie_public_id text,                     -- Cloudinary public_id for deletion
  thumbnail_url   text,                     -- First frame / cover still
  duration_secs   integer,                  -- Video length in seconds
  file_size_bytes bigint,                   -- Raw MP4 size
  error_message   text,                     -- Last error if failed
  render_started_at  timestamptz,
  render_completed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (card_id)                          -- one movie per card
);

-- ── Add movie_status to cards for quick status reads without JOIN ─────────────
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS movie_status text DEFAULT 'none'
  CHECK (movie_status IN ('none','pending','queued','rendering','completed','failed'));

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_memory_movies_card_id ON memory_movies(card_id);
CREATE INDEX IF NOT EXISTS idx_memory_movies_status  ON memory_movies(status);
CREATE INDEX IF NOT EXISTS idx_cards_movie_status    ON cards(movie_status);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE memory_movies ENABLE ROW LEVEL SECURITY;

-- Anyone who can view the card can view the movie
DROP POLICY IF EXISTS "memory_movies_select" ON memory_movies;
CREATE POLICY "memory_movies_select"
  ON memory_movies FOR SELECT
  USING (true);

-- Only backend service role can insert/update/delete
DROP POLICY IF EXISTS "memory_movies_service_write" ON memory_movies;
CREATE POLICY "memory_movies_service_write"
  ON memory_movies FOR ALL
  USING (auth.role() = 'service_role');
