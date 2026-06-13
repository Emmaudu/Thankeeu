-- Add explicit recipient and signer fields to vendor gift orders.
-- Recipient data comes from the card creator's card details.
-- Signer data comes from the person who paid for the vendor gift.

ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS signer_name TEXT;
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS signer_email TEXT;

UPDATE vendor_orders
SET signer_name = COALESCE(signer_name, customer_name),
    signer_email = COALESCE(signer_email, customer_email)
WHERE signer_name IS NULL OR signer_email IS NULL;

UPDATE vendor_orders vo
SET recipient_name = COALESCE(vo.recipient_name, c.recipient_name),
    recipient_email = COALESCE(vo.recipient_email, c.recipient_email)
FROM cards c
WHERE vo.card_slug = c.slug
  AND (vo.recipient_name IS NULL OR vo.recipient_email IS NULL);

CREATE INDEX IF NOT EXISTS idx_vendor_orders_recipient_email ON vendor_orders(recipient_email);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_signer_email ON vendor_orders(signer_email);
