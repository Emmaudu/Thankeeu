-- ══════════════════════════════════════════════════════════════════
-- Thankeeu: Bank Accounts, Dashboard Notifications, Withdrawal Flow
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Bank accounts (used by users, members, and recipients)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL,                  -- user.id or company_members.id
  owner_type      TEXT CHECK (owner_type IN ('user','member')) NOT NULL,
  bank_code       TEXT NOT NULL,                  -- Paystack bank code e.g. '058'
  bank_name       TEXT NOT NULL,                  -- Human label e.g. 'GTBank'
  account_number  TEXT NOT NULL,
  account_name    TEXT NOT NULL,                  -- Name on account (verified)
  is_default      BOOLEAN DEFAULT TRUE,
  paystack_recipient_code TEXT,                   -- Paystack Transfer Recipient code
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, account_number)
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_owner ON bank_accounts(owner_id, owner_type);

-- 2. Dashboard notifications (in-app bell notifications)
CREATE TABLE IF NOT EXISTS dashboard_notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id    UUID NOT NULL,                  -- user.id or company_members.id
  recipient_type  TEXT CHECK (recipient_type IN ('user','member','company')) NOT NULL,
  type            TEXT NOT NULL,                  -- 'sign_card','card_approved','deduction_approved','gift_ready','reminder','welcome'
  title           TEXT NOT NULL,
  body            TEXT,
  data            JSONB,                          -- {card_slug, card_title, amount, etc.}
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_recipient  ON dashboard_notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_notif_unread     ON dashboard_notifications(recipient_id) WHERE is_read = FALSE;

-- 3. Withdrawals (tracks payout requests → Paystack transfers)
CREATE TABLE IF NOT EXISTS withdrawals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id      UUID NOT NULL,
  requester_type    TEXT CHECK (requester_type IN ('user','member')) NOT NULL,
  amount            NUMERIC NOT NULL,
  source_type       TEXT CHECK (source_type IN ('gift_pot','deduction')) NOT NULL,
  source_id         UUID,                         -- card.id or deduction_request.id
  bank_account_id   UUID REFERENCES bank_accounts(id),
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','success','failed')),
  paystack_transfer_code TEXT,
  paystack_reference    TEXT,
  failure_reason    TEXT,
  processed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requester ON withdrawals(requester_id);

-- 4. Add pending_approval status to cards notification_scope
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scope_approved_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scope_approved_by UUID; -- company.id

-- 5. Deduction approved withdrawal requested flag
ALTER TABLE deduction_requests ADD COLUMN IF NOT EXISTS withdrawal_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE deduction_requests ADD COLUMN IF NOT EXISTS withdrawal_id UUID REFERENCES withdrawals(id);
