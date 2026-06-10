-- ═══════════════════════════════════════════════════════════════════════════
-- THANKEEU — MASTER MIGRATION
-- Run this ONCE in your Supabase SQL Editor.
-- Every statement uses IF NOT EXISTS / IF EXISTS so it is safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 0. Extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Core column additions ──────────────────────────────────────────────

-- cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'elegant';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS created_by_member_id UUID;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS notification_scope TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS send_time TIME;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS deadline_time TIME;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS opened_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS schedule_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS send_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS never_expire BOOLEAN DEFAULT TRUE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_withdrawn BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_withdrawn_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_payout_reference TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_payout_amount INTEGER;
-- RC2 FIX: add activated_at so the activation UPDATE does not fail
ALTER TABLE cards ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'handwritten';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_gallery JSONB;

-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ── 2. Contributions: Flutterwave columns + RC3 unique constraint ─────────
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS flw_reference TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- RC3 FIX: unique constraint prevents duplicate contribution rows for same FLW transaction
-- This also enables the onConflict upsert in the backend
CREATE UNIQUE INDEX IF NOT EXISTS idx_contributions_flw_ref_unique ON contributions(flw_reference)
  WHERE flw_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contributions_flw_ref    ON contributions(flw_reference);
CREATE INDEX IF NOT EXISTS idx_contributions_message_id ON contributions(message_id);

-- ── 3. DB trigger fix — prevent double-counting total_collected ───────────
-- RC1 FIX: The trigger already handles total_collected. Make it idempotent.
-- We also add a guard so it only fires once even if called multiple times.
CREATE OR REPLACE FUNCTION update_card_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    UPDATE cards SET total_collected = COALESCE(total_collected, 0) + NEW.amount
    WHERE id = NEW.card_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS contribution_verified ON contributions;
CREATE TRIGGER contribution_verified
  AFTER UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION update_card_total();

-- Also fire on INSERT for new pending→direct-success rows
DROP TRIGGER IF EXISTS contribution_inserted ON contributions;
CREATE OR REPLACE FUNCTION update_card_total_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE cards SET total_collected = COALESCE(total_collected, 0) + NEW.amount
    WHERE id = NEW.card_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER contribution_inserted
  AFTER INSERT ON contributions
  FOR EACH ROW EXECUTE FUNCTION update_card_total_on_insert();

-- ── 4. Tables that may be missing ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS received_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transferred_by UUID,
  transferred_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  UNIQUE(card_id, recipient_user_id)
);
CREATE INDEX IF NOT EXISTS idx_received_cards_user ON received_cards(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_received_cards_card ON received_cards(card_id);

CREATE TABLE IF NOT EXISTS card_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, email)
);
CREATE INDEX IF NOT EXISTS idx_card_invites_email ON card_invites(email);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  occasion TEXT NOT NULL,
  occasion_date DATE NOT NULL,
  frequency TEXT DEFAULT 'yearly',
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_reminded_at TIMESTAMPTZ,
  next_remind_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_next ON reminders(next_remind_at) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_type TEXT NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  admin_reply TEXT,
  admin_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sender ON support_tickets(sender_id);

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_sender_type_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_sender_type_check
  CHECK (sender_type IN ('user', 'company', 'member'));

CREATE TABLE IF NOT EXISTS card_visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  card_slug TEXT,
  occasion TEXT,
  author_name TEXT,
  author_email TEXT,
  converted BOOLEAN DEFAULT FALSE,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, author_email)
);
CREATE INDEX IF NOT EXISTS idx_card_visitors_email ON card_visitors(author_email) WHERE author_email IS NOT NULL;

-- ── 5. Company / teams tables (if not yet created) ───────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  contact_person TEXT,
  logo_url TEXT,
  theme TEXT DEFAULT 'purple',
  role TEXT DEFAULT 'company',
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT 'member',
  department TEXT,
  status TEXT DEFAULT 'pending',
  profile_picture_url TEXT,
  invite_token TEXT,
  invite_accepted BOOLEAN DEFAULT FALSE,
  job_title TEXT,
  phone TEXT,
  bio TEXT,
  date_of_birth DATE,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, email)
);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_email ON company_members(email);

-- Add missing columns to company_members
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS invite_token TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS invite_accepted BOOLEAN DEFAULT FALSE;

-- ── 6. Bank accounts, notifications + withdrawals ──────────────────────────

-- bank_accounts: owner_id / owner_type
CREATE TABLE IF NOT EXISTS bank_accounts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id                UUID NOT NULL,
  owner_type              TEXT CHECK (owner_type IN ('user','member')) NOT NULL,
  bank_code               TEXT NOT NULL,
  bank_name               TEXT NOT NULL,
  account_number          TEXT NOT NULL,
  account_name            TEXT NOT NULL,
  is_default              BOOLEAN DEFAULT TRUE,
  paystack_recipient_code TEXT,
  flw_beneficiary_id      TEXT,
  verified                BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, account_number)
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_owner ON bank_accounts(owner_id, owner_type);
-- Add FLW columns to existing bank_accounts if upgrading
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS flw_beneficiary_id TEXT;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS bank_code TEXT;

CREATE TABLE IF NOT EXISTS dashboard_notifications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id   UUID NOT NULL,
  recipient_type TEXT CHECK (recipient_type IN ('user','member','company')) NOT NULL,
  type           TEXT NOT NULL,
  title          TEXT NOT NULL,
  body           TEXT,
  data           JSONB,
  is_read        BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dash_notifications_recipient ON dashboard_notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_dash_notifications_unread ON dashboard_notifications(recipient_id) WHERE is_read = FALSE;

-- withdrawals uses requester_id / requester_type (NOT owner_id — that caused the error)
CREATE TABLE IF NOT EXISTS withdrawals (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id           UUID NOT NULL,
  requester_type         TEXT CHECK (requester_type IN ('user','member')) NOT NULL,
  amount                 NUMERIC NOT NULL,
  source_type            TEXT DEFAULT 'gift_pot',
  source_id              UUID,
  bank_account_id        UUID REFERENCES bank_accounts(id),
  status                 TEXT DEFAULT 'pending',
  paystack_transfer_code TEXT,
  paystack_reference     TEXT,
  flw_reference          TEXT,
  flw_transfer_id        TEXT,
  failure_reason         TEXT,
  processed_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requester ON withdrawals(requester_id);
-- Add FLW columns to existing withdrawals if upgrading
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS flw_reference TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS flw_transfer_id TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS card_id UUID;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS requester_type TEXT;

-- Cards extra scope columns
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scope_approved_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scope_approved_by UUID;

-- Deduction extra columns
ALTER TABLE deduction_requests ADD COLUMN IF NOT EXISTS withdrawal_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE deduction_requests ADD COLUMN IF NOT EXISTS withdrawal_id UUID;

-- ── 7. Backfill: mark existing active/sent cards as payment_verified ──────
UPDATE cards
SET payment_verified = TRUE
WHERE creator_id IS NOT NULL
  AND status IN ('active', 'sent')
  AND (payment_verified = FALSE OR payment_verified IS NULL);

-- Backfill contributed_amount on messages from successful contributions
UPDATE messages AS m
SET contributed_amount = c.amount,
    payment_verified   = TRUE
FROM contributions AS c
WHERE c.message_id = m.id
  AND c.status = 'success'
  AND COALESCE(m.payment_verified, FALSE) = FALSE;

-- ── 8. Additional indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cards_company ON cards(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_member  ON cards(created_by_member_id) WHERE created_by_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_status  ON cards(status);
CREATE INDEX IF NOT EXISTS idx_messages_card ON messages(card_id);

-- ══════════════════════════════════════════════════════════════════════════
-- Done. This migration is safe to run multiple times.
-- ══════════════════════════════════════════════════════════════════════════
