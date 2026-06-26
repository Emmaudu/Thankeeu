-- migration_custom_occasion.sql
-- Adds the custom_occasion column to the cards table.
-- This stores the user-supplied occasion name when occasion = 'other',
-- e.g. "Housewarming", "Work Anniversary", "Congratulations".
-- Run once in Supabase SQL Editor.

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS custom_occasion TEXT;

-- Optional: add an index if you ever query/filter by this field
-- CREATE INDEX IF NOT EXISTS idx_cards_custom_occasion ON cards(custom_occasion);
