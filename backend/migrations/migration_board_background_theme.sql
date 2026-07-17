-- Lets the creator pick a background theme for the Message Board layout
-- independently of the Album flipbook's album_background_theme. Frontend
-- falls back to album_background_theme when this is null, so this is safe
-- to run at any time (and the app degrades gracefully if it hasn't run yet).

ALTER TABLE cards ADD COLUMN IF NOT EXISTS board_background_theme TEXT;
