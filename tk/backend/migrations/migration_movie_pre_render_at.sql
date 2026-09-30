-- Fixes: "[pre-render] Query error: column cards.movie_pre_render_at does not exist"
-- server.js's pre-render cron (checks cards needing their Memory Movie
-- pre-rendered ahead of delivery) reads/writes this column but it was never
-- migrated in. The cron catches the error and keeps running every 5 minutes,
-- silently skipping pre-rendering entirely until this is run.

ALTER TABLE cards ADD COLUMN IF NOT EXISTS movie_pre_render_at TIMESTAMPTZ;
