-- ════════════════════════════════════════════════════════════════════════════
-- Lemon Squeezy payments (international cards, charged in USD).
-- One row per checkout, written BEFORE the customer is sent to Lemon Squeezy,
-- so the signed webhook can be matched to what was bought and the price we
-- expected. Only the backend (service key) reads or writes this table.
-- Safe to run more than once. Run in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lemon_payments (
  reference             TEXT PRIMARY KEY,           -- our ref: TK-FEE-…, TK-CR-…, TK-SUB-…
  status_token          TEXT NOT NULL,              -- random; the return page must present it to read status
  type                  TEXT NOT NULL CHECK (type IN ('card_fee', 'card_credits', 'company_subscription')),
  amount_usd_cents      INTEGER NOT NULL CHECK (amount_usd_cents > 0),
  expected_ngn          NUMERIC(14,2) NOT NULL,     -- NGN value of what was bought
  customer_email        TEXT,
  meta                  JSONB NOT NULL DEFAULT '{}'::jsonb, -- card_slug / user_id / company_id / plan / discount
  status                TEXT NOT NULL DEFAULT 'pending',
  checkout_id           TEXT,
  order_id              TEXT,
  order_identifier      TEXT,
  paid_total_usd_cents  INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrades for a table created by an earlier draft of this file.
ALTER TABLE lemon_payments ADD COLUMN IF NOT EXISTS status_token TEXT;
ALTER TABLE lemon_payments DROP CONSTRAINT IF EXISTS lemon_payments_status_check;
ALTER TABLE lemon_payments ADD CONSTRAINT lemon_payments_status_check
  CHECK (status IN ('pending', 'init_failed', 'processing', 'paid', 'amount_mismatch', 'refunded', 'partial_refund', 'failed'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_lemon_payments_order_id ON lemon_payments (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lemon_payments_status_created ON lemon_payments (status, created_at DESC);

-- No public access: RLS on, no policies. The backend's service key bypasses RLS.
ALTER TABLE lemon_payments ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
