-- ══════════════════════════════════════════════════════════════════
-- Thankeeu — Member Features Migration
-- Run in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Add missing columns to company_members
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS username     TEXT UNIQUE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS job_title    TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS bio          TEXT;
CREATE INDEX IF NOT EXISTS idx_company_members_username ON company_members(username);

-- 2. Fix support_tickets sender_type to allow 'member'
ALTER TABLE support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_sender_type_check;
ALTER TABLE support_tickets
  ADD CONSTRAINT support_tickets_sender_type_check
  CHECK (sender_type IN ('user', 'company', 'member'));

-- 3. Member received cards (cards transferred/shared to a member)
CREATE TABLE IF NOT EXISTS member_received_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id         UUID REFERENCES cards(id) ON DELETE CASCADE,
  recipient_member_id UUID REFERENCES company_members(id) ON DELETE CASCADE,
  transferred_by  UUID,         -- user_id or member_id of sender
  transferred_at  TIMESTAMPTZ DEFAULT NOW(),
  opened_at       TIMESTAMPTZ,
  note            TEXT,
  UNIQUE(card_id, recipient_member_id)
);
CREATE INDEX IF NOT EXISTS idx_member_received_cards ON member_received_cards(recipient_member_id);

-- 4. Member reminders (personal birthday/occasion reminders)
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
  last_reminded_at TIMESTAMPTZ,
  next_remind_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_member_reminders ON member_reminders(member_id);

-- 5. Member financial history (contributions made/received)
CREATE TABLE IF NOT EXISTS member_financial_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id       UUID REFERENCES company_members(id) ON DELETE CASCADE,
  card_id         UUID REFERENCES cards(id) ON DELETE SET NULL,
  card_slug       TEXT,
  type            TEXT CHECK (type IN ('contribution_made','gift_received','gift_transferred')),
  amount          NUMERIC NOT NULL DEFAULT 0,
  description     TEXT,
  paystack_reference TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_member_financial_history ON member_financial_history(member_id);

-- 6. Card signing drafts — incomplete messages saved as draft
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMPTZ;

-- 7. Track which members have been invited to sign a card
CREATE TABLE IF NOT EXISTS card_member_invites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id    UUID REFERENCES cards(id) ON DELETE CASCADE,
  member_id  UUID REFERENCES company_members(id) ON DELETE CASCADE,
  signed     BOOLEAN DEFAULT FALSE,
  signed_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_card_member_invites_member ON card_member_invites(member_id);
CREATE INDEX IF NOT EXISTS idx_card_member_invites_card   ON card_member_invites(card_id);

-- 8. Add company_id to received_cards if it exists (for member isolation)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS recipient_member_id UUID REFERENCES company_members(id) ON DELETE SET NULL;

COMMENT ON TABLE member_received_cards IS 'Cards that have been transferred/shared to a specific team member';
COMMENT ON TABLE member_reminders IS 'Personal birthday and occasion reminders set by team members';
COMMENT ON TABLE member_financial_history IS 'Naira gift contributions made or received by team members';
COMMENT ON TABLE card_member_invites IS 'Which team members have been invited to sign a specific card';

-- 9. Add subscription status columns to companies for fast lookups
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- 10. Back-fill from company_subscriptions if any exist
UPDATE companies c
SET subscription_status = 'active',
    subscription_plan   = cs.plan,
    subscription_expires_at = cs.expires_at
FROM company_subscriptions cs
WHERE cs.company_id = c.id
  AND cs.status = 'active'
  AND cs.expires_at > NOW();
