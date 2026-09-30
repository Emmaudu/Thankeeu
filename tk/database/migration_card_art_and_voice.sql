-- Run once on existing Thankeeu databases.
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'elegant';

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'handwritten';

ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_font_style_check;
ALTER TABLE cards ADD CONSTRAINT cards_font_style_check
  CHECK (font_style IN ('elegant', 'calligraphy', 'handwritten', 'classic', 'modern'));

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_font_style_check;
ALTER TABLE messages ADD CONSTRAINT messages_font_style_check
  CHECK (font_style IN ('elegant', 'calligraphy', 'handwritten', 'classic', 'modern'));

-- Backfill contribution badges on old messages.
UPDATE messages AS message
SET
  contributed_amount = contribution.amount,
  payment_reference = contribution.paystack_reference,
  payment_verified = TRUE
FROM contributions AS contribution
WHERE contribution.message_id = message.id
  AND contribution.status = 'success'
  AND COALESCE(message.payment_verified, FALSE) = FALSE;
