-- migration_card_redelivery.sql
-- Adds tracking needed for the admin "re-deliver" action:
--   - delivered_at: when the card was FIRST delivered to the recipient (set by sendCard)
--   - last_redelivered_at: when the card was MOST RECENTLY re-delivered by an admin
--   - redelivery_count: how many times an admin has re-delivered this card
--
-- These let us compute "what's new since the recipient last got an email"
-- (new messages in `messages`, new successful gifts in `contributions`)
-- without touching any existing column or behavior.

ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS last_redelivered_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS redelivery_count INTEGER DEFAULT 0;

-- Backfill: for cards already sent before this migration existed, approximate
-- their first-delivery time with updated_at (set by sendCard at send time)
-- so re-delivery's "what's new" comparison has a sane starting point.
UPDATE cards
SET delivered_at = updated_at
WHERE status = 'sent' AND delivered_at IS NULL;
