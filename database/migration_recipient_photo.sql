-- Add recipient_photo_url column to cards table
-- This stores the URL of an optional photo of the recipient, uploaded by the card creator.
-- The photo is displayed as a soft, low-opacity background on the card view page hero.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS recipient_photo_url TEXT;
