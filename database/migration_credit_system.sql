-- ═══════════════════════════════════════════════════════════════════════════
-- migration_credit_system.sql
-- Card Credits system for individual users
-- Run in Supabase SQL Editor — safe to re-run
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Extend card_credits table with proper columns
ALTER TABLE card_credits ADD COLUMN IF NOT EXISTS plan_type_v2 TEXT
  CHECK (plan_type_v2 IN ('classic','standard','pack5'));
ALTER TABLE card_credits ADD COLUMN IF NOT EXISTS flw_reference TEXT;
ALTER TABLE card_credits ADD COLUMN IF NOT EXISTS total_purchased INTEGER DEFAULT 0;
ALTER TABLE card_credits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update plan_type constraint to include new tiers
ALTER TABLE card_credits DROP CONSTRAINT IF EXISTS card_credits_plan_type_check;

-- 2. Add unique constraint so each user has one row (we upsert on it)
ALTER TABLE card_credits DROP CONSTRAINT IF EXISTS card_credits_user_id_unique;
ALTER TABLE card_credits ADD CONSTRAINT card_credits_user_id_unique UNIQUE (user_id);

-- 3. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_card_credits_user ON card_credits(user_id);

-- 4. Track individual credit purchases in a separate log table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type       TEXT NOT NULL,   -- classic | standard | pack5
  credits_bought  INTEGER NOT NULL,
  amount_paid     INTEGER NOT NULL, -- in NGN
  currency        TEXT DEFAULT 'NGN',
  flw_reference   TEXT,
  status          TEXT DEFAULT 'pending', -- pending | paid | failed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_ref  ON credit_purchases(flw_reference)
  WHERE flw_reference IS NOT NULL;

-- 5. Add deadline columns to cards for team leader card creation
ALTER TABLE cards ADD COLUMN IF NOT EXISTS signing_deadline   TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS delivery_scheduled TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS created_by_type    TEXT DEFAULT 'user';
  -- 'user' | 'member' | 'leader' | 'company'


-- Add occasion_scopes JSONB to companies table
-- Stores { birthday: 'department', fathers_day: 'company', ... } per company
ALTER TABLE companies ADD COLUMN IF NOT EXISTS occasion_scopes JSONB DEFAULT '{}';

-- Pending signups table (email code verification on signup)
CREATE TABLE IF NOT EXISTS pending_signups (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  username      TEXT NOT NULL,
  password      TEXT NOT NULL,  -- already bcrypt hashed
  date_of_birth DATE,
  code          TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON pending_signups(email);
-- Auto-clean expired records

-- ═══════════════════════════════════════════════════════════════════════════
-- Admin: per-company pricing multiplier and pilot period
-- ═══════════════════════════════════════════════════════════════════════════

-- pricing_multiplier: NULL = not set (show "get a quote"), 0 = free, >0 = rate per employee
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pricing_multiplier INTEGER DEFAULT NULL;

-- Pilot period columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pilot_starts_at   TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pilot_ends_at     TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pilot_days        INTEGER DEFAULT NULL;

-- Subscription status already exists; add pilot to allowed values
-- (pilot means free automation until pilot_ends_at, then stops)
CREATE INDEX IF NOT EXISTS idx_companies_pilot ON companies(pilot_ends_at) WHERE pilot_ends_at IS NOT NULL;

-- Vendor orders: allow awaiting_payment status + flw_reference column
ALTER TABLE vendor_orders DROP CONSTRAINT IF EXISTS vendor_orders_status_check;
ALTER TABLE vendor_orders ADD CONSTRAINT vendor_orders_status_check
  CHECK (status IN ('awaiting_payment','pending','confirmed','processing','shipped','delivered','cancelled'));
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS flw_reference TEXT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Vendor orders: add platform_fee and vendor_payout columns
-- Also fix status constraint to include awaiting_payment
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS platform_fee  NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vendor_orders ADD COLUMN IF NOT EXISTS vendor_payout NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vendors        ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE vendors        ADD COLUMN IF NOT EXISTS state   TEXT;

-- Blog subscribers: add index on confirm_token for faster confirmation lookups
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirm_token ON blog_subscribers(confirm_token)
  WHERE confirm_token IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════
-- Ensure company_members has all columns needed for Team Members page
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS resumption_date    DATE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS hris_employee_id   TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS is_core_team       BOOLEAN DEFAULT FALSE;
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS is_active         BOOLEAN DEFAULT TRUE;
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS hris_employee_id  TEXT;

-- ═══════════════════════════════════════════════════════════════════════════
-- SOURCE-OF-TRUTH MIGRATION: company_members (Team Members page) becomes the
-- single source of truth for occasion automation. Occasions Manager and HRIS
-- sync both write into these columns; the daily cron reads directly from here.
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS leaving_date    DATE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS promotion_date  DATE;

-- Tracking columns so the cron doesn't re-send the same notification/card
-- twice for the same occasion in the same year, per occasion type.
-- Stored as JSONB: { "birthday": {"year": 2026, "card_slug": "...", "celebrant_notified": true, "dept_notified": true}, ... }
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS occasion_tracking JSONB DEFAULT '{}'::jsonb;

-- Optional custom messages for Farewell/Promotion cards, settable via the
-- master template's Farewell Message / Congratulatory Message columns.
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS farewell_message   TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS promotion_message  TEXT;
