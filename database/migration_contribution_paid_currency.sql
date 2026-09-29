-- ════════════════════════════════════════════════════════════════════════════
-- Round 11 — record the currency a gift was actually paid in.
-- `amount` stays the NGN storage value (what the gift pot is credited).
-- `paid_currency` / `paid_amount` are what Flutterwave charged (e.g. USD 6.30).
-- Safe to run more than once. Run in Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE contributions ADD COLUMN IF NOT EXISTS paid_currency TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS paid_amount   NUMERIC(14,2);

-- Every gift before this change was charged in naira unless the
-- (unused) currency switcher was touched; backfill those as NGN.
UPDATE contributions
   SET paid_currency = 'NGN', paid_amount = amount
 WHERE paid_currency IS NULL;

ALTER TABLE contributions ALTER COLUMN paid_currency SET DEFAULT 'NGN';

CREATE INDEX IF NOT EXISTS idx_contributions_paid_currency ON contributions (paid_currency);

-- Let PostgREST see the new columns immediately.
NOTIFY pgrst, 'reload schema';
