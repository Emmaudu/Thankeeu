-- Live Memory Wall carousel cards, separate message/caption, and voice notes.
-- Safe to run repeatedly after migration_live_memory_wall.sql.

ALTER TABLE wall_posts ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE wall_posts ADD COLUMN IF NOT EXISTS media_gallery jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE wall_posts DROP CONSTRAINT IF EXISTS wall_posts_media_type_check;
ALTER TABLE wall_posts
  ADD CONSTRAINT wall_posts_media_type_check
  CHECK (media_type IS NULL OR media_type IN ('image','video','gif','voice'));

CREATE INDEX IF NOT EXISTS idx_wall_posts_card_created
  ON wall_posts(card_id, created_at DESC)
  WHERE is_moderated = false;

COMMENT ON COLUMN wall_posts.message IS 'Main message displayed inside one Live Wall carousel card.';
COMMENT ON COLUMN wall_posts.caption IS 'Short caption describing the uploaded media carousel.';
COMMENT ON COLUMN wall_posts.media_gallery IS 'Additional media items as [{url,type}], up to four after the primary item.';
