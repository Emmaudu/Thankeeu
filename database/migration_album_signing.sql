-- Migration: Album signing layout support
-- Run in Supabase SQL editor

-- 1. card_layout on cards (default 'form' so all existing cards keep form view)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_layout text NOT NULL DEFAULT 'form'
  CHECK (card_layout IN ('form', 'album'));

-- 2. Free-placement fields on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS position_x  numeric(6,2) DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS position_y  numeric(6,2) DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS rotation    numeric(6,2) DEFAULT 0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS font_color  text         DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS font_size   integer      DEFAULT 16;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS page_number integer      DEFAULT 1;

CREATE INDEX IF NOT EXISTS messages_page_number_idx ON messages(page_number);
CREATE INDEX IF NOT EXISTS cards_card_layout_idx    ON cards(card_layout);
