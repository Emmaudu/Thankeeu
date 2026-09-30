-- Run this on existing databases before deploying the immediate card-payment flow.
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_payment_reference
  ON cards(payment_reference)
  WHERE payment_reference IS NOT NULL;

-- Existing live individual cards predate payment tracking and must not be charged again.
UPDATE cards
SET payment_verified = TRUE
WHERE creator_id IS NOT NULL
  AND status IN ('active', 'sent')
  AND payment_verified = FALSE;
