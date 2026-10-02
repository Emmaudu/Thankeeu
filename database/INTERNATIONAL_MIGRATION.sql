-- ═══════════════════════════════════════════════════════════════════════
-- INTERNATIONAL MIGRATION  (safe to run more than once)
--
-- Taskeeu operates per country. Nigeria keeps the root routes (/tasks,
-- /requester ...); the other markets live under their own prefix
-- (/us, /uk, /ireland, /australia, /new-zealand, /canada, /singapore).
--
--   users.market            the Taskeeu site (market) the account belongs to
--   tasks.country/currency  the market and currency a task is posted in;
--                           only taskers of the same country can bid on it
--   tasks.is_remote         task can be done online, no address needed
--   payments.provider       'flutterwave' (Nigeria/Africa) or 'rapyd' (international)
--   payments.provider_ref   the provider's own id (Rapyd checkout id)
--   tasker_profiles.*       right to work / police check documents and
--                           international bank details (payout_details JSON)
--   payout_requests         international payouts are paid by the Taskeeu
--                           team from this queue (Admin -> Payouts)
--   platform_earnings.currency  income is reported per currency
--
-- Run AFTER TIPS_MIGRATION.sql and PLATFORM_EARNINGS_MIGRATION.sql.
-- Run in: Supabase Dashboard -> SQL Editor -> paste -> Run.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Markets ────────────────────────────────────────────────────────
-- users.market is the Taskeeu site an account belongs to. It is separate from
-- the older users.country column (a self-declared country picked at tasker
-- signup, which may hold African codes such as GH or KE). Every existing
-- account was created on the Nigerian site and transacts in Naira, so it
-- stays on market NG.
ALTER TABLE users ADD COLUMN IF NOT EXISTS market VARCHAR(2) NOT NULL DEFAULT 'NG';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_market_check;
ALTER TABLE users ADD CONSTRAINT users_market_check
  CHECK (market IN ('NG','US','GB','IE','AU','NZ','CA','SG'));
CREATE INDEX IF NOT EXISTS idx_users_market ON users(market);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS country VARCHAR(2) NOT NULL DEFAULT 'NG';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'NGN';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_remote BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_country_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_country_check
  CHECK (country IN ('NG','US','GB','IE','AU','NZ','CA','SG'));
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_currency_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_currency_check
  CHECK (currency IN ('NGN','USD','GBP','EUR','AUD','NZD','CAD','SGD'));
-- Remote tasks have no city; keep the old NOT NULL columns satisfied with ''.
CREATE INDEX IF NOT EXISTS idx_tasks_country_status ON tasks(country, status, created_at DESC);

-- ── Payments ───────────────────────────────────────────────────────
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider VARCHAR(20) NOT NULL DEFAULT 'flutterwave';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_ref TEXT;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE payments ADD CONSTRAINT payments_provider_check
  CHECK (provider IN ('flutterwave','rapyd','paystack'));
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_ref);

-- ── Tasker documents and international bank details ────────────────
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS right_to_work_url TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS police_check_url TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS payout_details JSONB;

-- ── International payout queue ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country VARCHAR(2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  kind TEXT NOT NULL CHECK (kind IN ('earnings','advance')),
  reference TEXT NOT NULL UNIQUE,
  payment_ids UUID[] NOT NULL DEFAULT '{}',
  advance_id UUID,
  bank_snapshot JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','rejected')),
  admin_note TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_requests_tasker ON payout_requests(tasker_id, created_at DESC);
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- ── Income per currency ────────────────────────────────────────────
ALTER TABLE platform_earnings ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'NGN';

NOTIFY pgrst, 'reload schema';
