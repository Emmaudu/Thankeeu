-- ══════════════════════════════════════════════════════════════════════════
-- Thankeeu — Comprehensive Fix Migration
-- Run this ENTIRE file in Supabase SQL Editor once
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Fix support_tickets sender_type constraint ────────────────────────
ALTER TABLE support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_sender_type_check;

ALTER TABLE support_tickets
  ADD CONSTRAINT support_tickets_sender_type_check
  CHECK (sender_type IN ('user', 'company', 'member'));

-- ── 2. Add missing columns to company_members ────────────────────────────
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS username     TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS job_title    TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS bio          TEXT;

-- Safe unique index on username
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_company_members_username') THEN
    CREATE UNIQUE INDEX idx_company_members_username ON company_members(username) WHERE username IS NOT NULL;
  END IF;
END $$;

-- ── 3. Add username to users table if missing ────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_username') THEN
    CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
  END IF;
END $$;

-- ── 4. Dashboard notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard_notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id    UUID NOT NULL,
  recipient_type  TEXT CHECK (recipient_type IN ('user','member','company')) NOT NULL,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  data            JSONB,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON dashboard_notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_notif_unread    ON dashboard_notifications(recipient_id) WHERE is_read = FALSE;

-- ── 5. Bank accounts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id               UUID NOT NULL,
  owner_type             TEXT CHECK (owner_type IN ('user','member')) NOT NULL,
  bank_code              TEXT NOT NULL,
  bank_name              TEXT NOT NULL,
  account_number         TEXT NOT NULL,
  account_name           TEXT NOT NULL,
  is_default             BOOLEAN DEFAULT TRUE,
  paystack_recipient_code TEXT,
  verified               BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bank_accounts_owner') THEN
    CREATE INDEX idx_bank_accounts_owner ON bank_accounts(owner_id, owner_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_bank_accounts_owner_acct') THEN
    CREATE UNIQUE INDEX uq_bank_accounts_owner_acct ON bank_accounts(owner_id, account_number);
  END IF;
END $$;

-- ── 6. Withdrawals ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id          UUID NOT NULL,
  requester_type        TEXT CHECK (requester_type IN ('user','member')) NOT NULL,
  amount                NUMERIC NOT NULL,
  source_type           TEXT CHECK (source_type IN ('gift_pot','deduction')) NOT NULL,
  source_id             UUID,
  bank_account_id       UUID REFERENCES bank_accounts(id),
  status                TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','success','failed')),
  paystack_transfer_code TEXT,
  paystack_reference    TEXT,
  failure_reason        TEXT,
  processed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requester ON withdrawals(requester_id);

-- ── 7. Member received cards ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_received_cards (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id             UUID REFERENCES cards(id) ON DELETE CASCADE,
  recipient_member_id UUID REFERENCES company_members(id) ON DELETE CASCADE,
  transferred_by      UUID,
  transferred_at      TIMESTAMPTZ DEFAULT NOW(),
  opened_at           TIMESTAMPTZ,
  note                TEXT
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_member_received_cards') THEN
    CREATE UNIQUE INDEX uq_member_received_cards ON member_received_cards(card_id, recipient_member_id);
  END IF;
END $$;

-- ── 8. Member reminders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_reminders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id       UUID REFERENCES company_members(id) ON DELETE CASCADE,
  recipient_name  TEXT NOT NULL,
  recipient_email TEXT,
  occasion        TEXT NOT NULL,
  occasion_date   DATE NOT NULL,
  frequency       TEXT DEFAULT 'yearly',
  notes           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_member_reminders ON member_reminders(member_id);

-- ── 9. Received cards for individual users ───────────────────────────────
CREATE TABLE IF NOT EXISTS received_cards (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id            UUID REFERENCES cards(id) ON DELETE CASCADE,
  recipient_user_id  UUID NOT NULL,
  transferred_by     UUID,
  transferred_at     TIMESTAMPTZ DEFAULT NOW()
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'uq_received_cards') THEN
    CREATE UNIQUE INDEX uq_received_cards ON received_cards(card_id, recipient_user_id);
  END IF;
END $$;

-- ── 10. Subscription columns on companies ───────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status    TEXT DEFAULT 'inactive';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_plan      TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ── 11. Email verified column on users ──────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified       BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at  TIMESTAMPTZ;

-- ── 12. Card scope columns ───────────────────────────────────────────────
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scope_approved_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scope_approved_by UUID;

-- ── 13. Deduction withdrawal columns ────────────────────────────────────
ALTER TABLE deduction_requests ADD COLUMN IF NOT EXISTS withdrawal_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE deduction_requests ADD COLUMN IF NOT EXISTS withdrawal_id        UUID;

-- Done
SELECT 'Migration complete' AS result;


-- ── company_subscriptions table (required for HR subscription payments) ──
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id           UUID NOT NULL,
  plan                 TEXT NOT NULL CHECK (plan IN ('monthly','yearly')),
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  amount               NUMERIC DEFAULT 0,
  paystack_reference   TEXT,
  auto_renew           BOOLEAN DEFAULT TRUE,
  starts_at            TIMESTAMPTZ DEFAULT NOW(),
  expires_at           TIMESTAMPTZ,
  cancelled_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_company_subs_company ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subs_status  ON company_subscriptions(company_id, status);

-- Subscription columns on companies table

SELECT 'Migration complete ✅' AS result;

-- ── Visitor tracking table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS card_visitors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id         UUID REFERENCES cards(id) ON DELETE CASCADE,
  card_slug       TEXT,
  occasion        TEXT,
  author_name     TEXT,
  author_email    TEXT,
  converted       BOOLEAN DEFAULT FALSE,
  converted_user_id UUID,
  converted_at    TIMESTAMPTZ,
  emails_sent     INTEGER DEFAULT 0,
  last_email_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_card_visitors_email  ON card_visitors(author_email) WHERE author_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_card_visitors_converted ON card_visitors(converted);

-- ── Birthday on users table ────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- ── Terms accepted timestamp ───────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- ── Session tracking (optional) ───────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- ── occasion_members extra columns ────────────────────────────────────
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS notification_scope TEXT DEFAULT 'department';
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS farewell            BOOLEAN DEFAULT FALSE;
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS meta               JSONB;
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS gender             TEXT;

-- ── HR core team table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_core_team (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL,
  email           TEXT NOT NULL,
  full_name       TEXT,
  title           TEXT,                    -- CEO, CFO, COO, HR Assistant, etc.
  permission_level TEXT DEFAULT 'medium' CHECK (permission_level IN ('full','medium','limited')),
  include_in_celebrations BOOLEAN DEFAULT TRUE,
  member_id       UUID REFERENCES company_members(id) ON DELETE SET NULL,
  invite_token    TEXT,
  invite_accepted BOOLEAN DEFAULT FALSE,
  invited_at      TIMESTAMPTZ DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_core_team_company ON company_core_team(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_core_team_email ON company_core_team(company_id, email);

-- ── invite_token column for company_members ───────────────────────────
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS invite_token TEXT;

-- ── REQUIRED FOR ALL 21 FEATURES ────────────────────────────────────────────

-- Demo requests table
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  team_size TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','scheduled','converted','declined')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_email  ON demo_requests(email);

-- Visitors table (guest card signers — for nurture emails)
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  full_name TEXT,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  card_slug TEXT,
  occasion TEXT,
  creator_name TEXT,
  nudge_count INTEGER DEFAULT 0,
  last_nudged_at TIMESTAMPTZ,
  converted_to_user UUID REFERENCES users(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visitors_email     ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_converted ON visitors(converted_to_user);

-- Core team invites
CREATE TABLE IF NOT EXISTS core_team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role_label TEXT DEFAULT 'Team Member',
  privilege TEXT DEFAULT 'limited' CHECK (privilege IN ('full','medium','limited')),
  invited_by UUID,
  accepted_at TIMESTAMPTZ,
  birthday_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, email)
);

-- Media gallery column for messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_gallery JSONB;

-- Birthday field for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday_reminded_7d BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday_reminded_2d BOOLEAN DEFAULT FALSE;

-- Occasion type default_scope
ALTER TABLE occasion_types ADD COLUMN IF NOT EXISTS default_scope TEXT DEFAULT 'department';

-- Team member extra columns
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS promotion_level INTEGER DEFAULT 0;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS promotion_message TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS promotion_scope TEXT DEFAULT 'all';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS farewell_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS farewell_scope TEXT DEFAULT 'department';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS phone TEXT;

-- Company members extra columns
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Occasion members extra columns
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS notification_scope TEXT DEFAULT 'department';
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS farewell BOOLEAN DEFAULT FALSE;
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS farewell_scope TEXT DEFAULT 'department';
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS promotion_level INTEGER DEFAULT 0;
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS promotion_message TEXT;
ALTER TABLE occasion_members ADD COLUMN IF NOT EXISTS promotion_scope TEXT DEFAULT 'all';

-- Subscription columns on companies

-- ── Flutterwave migration (replacing Paystack) ──────────────────────────────
ALTER TABLE contributions    ADD COLUMN IF NOT EXISTS flw_reference TEXT;
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS flw_reference TEXT;
ALTER TABLE withdrawals      ADD COLUMN IF NOT EXISTS flw_reference TEXT;
ALTER TABLE withdrawals      ADD COLUMN IF NOT EXISTS flw_transfer_id TEXT;
ALTER TABLE bank_accounts    ADD COLUMN IF NOT EXISTS flw_beneficiary_id TEXT;
ALTER TABLE bank_accounts    ADD COLUMN IF NOT EXISTS bank_code TEXT;

-- Index for fast webhook lookup
CREATE INDEX IF NOT EXISTS idx_contributions_flw_ref    ON contributions(flw_reference);
CREATE INDEX IF NOT EXISTS idx_subscriptions_flw_ref    ON company_subscriptions(flw_reference);

-- Deduction transfer tracking
ALTER TABLE deduction_requests ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ;
ALTER TABLE deduction_requests ADD COLUMN IF NOT EXISTS withdrawal_id  TEXT;

-- Add message_id to contributions so verified payments can update the message record
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contributions_message_id ON contributions(message_id);

-- payment_ref on cards for tx_ref fallback activation
ALTER TABLE cards ADD COLUMN IF NOT EXISTS payment_ref TEXT;
CREATE INDEX IF NOT EXISTS idx_cards_payment_ref ON cards(payment_ref);

-- Blog subscribers (newsletter)
CREATE TABLE IF NOT EXISTS blog_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name  TEXT,
  confirmed BOOLEAN DEFAULT FALSE,
  confirm_token TEXT,
  unsubscribe_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  last_emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email ON blog_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_token ON blog_subscribers(unsubscribe_token);
