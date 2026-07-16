-- Migration: movable / resizable / recolourable cover texts
-- Stores the per-field layout for the card cover's title, recipient name and
-- sender line (position %, font size, colour, show/hide). Run in Supabase.
--
--   {
--     "title":     { "x": 50, "y": 60, "size": 15, "color": "auto",    "show": true },
--     "recipient": { "x": 50, "y": 44, "size": 30, "color": "#ffffff", "show": true },
--     "sender":    { "x": 50, "y": 84, "size": 11, "color": "auto",    "show": false }
--   }

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS cover_layout jsonb DEFAULT NULL;

COMMENT ON COLUMN public.cards.cover_layout IS
  'Per-field cover text layout (title/recipient/sender): position %, size, colour, show flag. NULL = default centred layout.';
