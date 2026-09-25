-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: "Create Now, Pay Later" cards + admin-editable homepage hero
-- Run in Supabase SQL Editor → New Query → Run.
-- Safe to run multiple times (idempotent). Run BEFORE deploying the backend
-- that ships with it: the pay-later activation refuses to publish an unpaid
-- card until these columns exist (it fails closed, never free).
-- ════════════════════════════════════════════════════════════════════════

-- 1. Pay-later state on cards ------------------------------------------------
-- payment_pending = TRUE  → the card is live (people can sign and chip in to
--                            the gift pot) but the one-time card fee has not
--                            been paid, so it is NEVER delivered to the
--                            recipient until it is.
-- payment_pending = FALSE → paid, free (company / team cards), or a card that
--                            existed before this feature. Default FALSE means
--                            every existing card keeps working exactly as before.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS payment_pending BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS fee_paid_at TIMESTAMPTZ;
-- Creator payment reminders ("pay so it can be delivered on the date").
ALTER TABLE cards ADD COLUMN IF NOT EXISTS payment_reminder_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMPTZ;

-- The reminder sweep and the dashboards only ever look for unpaid live cards.
CREATE INDEX IF NOT EXISTS idx_cards_payment_pending
  ON cards(status, recipient_notified)
  WHERE payment_pending = TRUE;

-- Card-fee transaction reference (also created by migration_all_fixes.sql —
-- repeated here so this file works on its own).
ALTER TABLE cards ADD COLUMN IF NOT EXISTS payment_ref TEXT;

-- 2. Homepage hero text, editable from Admin → Header ------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- NULL = use the built-in default text on the homepage.
INSERT INTO site_settings (key, value) VALUES
  ('hero_title',    NULL),
  ('hero_subtitle', NULL),
  ('hero_tagline',  NULL)
ON CONFLICT (key) DO NOTHING;

-- 3. Recipient country / time zone for delivery ------------------------------
-- send_date is still stored in UTC (the delivery engine is unchanged); these
-- record WHICH time zone the creator picked the wall-clock time in, so the
-- card arrives at e.g. 09:00 in the recipient's country, and so editing shows
-- the same time back.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS recipient_country TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivery_timezone TEXT;

-- 4. Abandoned-draft reminders (day 1, day 3, final on day 8) ------------------
ALTER TABLE cards ADD COLUMN IF NOT EXISTS abandoned_reminder_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS abandoned_reminder_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_cards_abandoned_drafts
  ON cards(created_at) WHERE status = 'draft';

-- Tell PostgREST about the new columns immediately (otherwise the API can
-- report "column not found in schema cache" for a few minutes).
NOTIFY pgrst, 'reload schema';
