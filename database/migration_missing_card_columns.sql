-- migration_missing_card_columns.sql
--
-- Two columns the app writes but that no migration ever created.
--
-- `custom_occasion` is written by the card wizard whenever occasion = 'other'.
-- createCard only included the key when it was non-empty (so inserts happened to
-- succeed), while updateCard forwarded the whole form body — including
-- custom_occasion: '' — which made Postgres raise 42703 and the API return
-- 500 "Failed to update card".
--   Symptom: stepping Back to "Card details" and pressing Next again always
--   failed for signed-in creators.
--
-- `board_background_theme` is written from the Board style picker in the live
-- preview. Same story: guarded on insert, so the setting silently never
-- persisted rather than erroring.
--
-- updateCard now degrades gracefully if either column is absent, but the values
-- are only actually SAVED once this migration has run.
--
-- Safe to run more than once.

ALTER TABLE cards ADD COLUMN IF NOT EXISTS custom_occasion VARCHAR(80);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS board_background_theme VARCHAR(32);

COMMENT ON COLUMN cards.custom_occasion IS
  'Free-text occasion label, used only when occasion = ''other''.';
COMMENT ON COLUMN cards.board_background_theme IS
  'Board-layout background theme id; falls back to album_background_theme when NULL.';
