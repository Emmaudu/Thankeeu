-- ═══════════════════════════════════════════════════════════════════════════
-- THANKEEU PALS — group accounts (best friends / family / small unit groups)
-- Safe to re-run: all statements use IF NOT EXISTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- 1. PAL_GROUPS — the group "account" itself
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pal_groups (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name        TEXT NOT NULL,
  group_username    TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  group_size        INTEGER NOT NULL DEFAULT 15 CHECK (group_size BETWEEN 2 AND 15),
  description       TEXT,
  logo_url          TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason  TEXT,
  is_verified       BOOLEAN DEFAULT FALSE,
  verify_token      TEXT,
  pricing_commission_pct NUMERIC(5,2) DEFAULT 3.5,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pal_groups_username ON pal_groups(group_username);
CREATE INDEX IF NOT EXISTS idx_pal_groups_status   ON pal_groups(status);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. PAL_MEMBERS — invited people; each has their own password but shares
--    the group's dashboard/session
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pal_members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pal_group_id      UUID NOT NULL REFERENCES pal_groups(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  department        TEXT,
  role              TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','joined')),
  invite_token      TEXT,
  password_hash     TEXT,

  -- Event dates (used to auto-create cards + reminders)
  birth_date        DATE,
  resignation_date  DATE,
  resignation_note  TEXT,
  graduation_date   DATE,
  graduation_note   TEXT,
  milestone_date    DATE,
  milestone_note    TEXT,
  promotion_date    DATE,
  promotion_note    TEXT,

  -- Profile (for settlement + crediting on celebration day)
  bio               TEXT,
  profile_pic_url   TEXT,
  bank_details      JSONB,
  profile_reminder_count INTEGER DEFAULT 0,
  last_reminded_at  TIMESTAMPTZ,

  -- Reminder dedupe flags — JSON map of "<occasion>_<stage>" => true
  -- e.g. {"birthday_2026_14d": true, "birthday_2026_7d": true}
  reminders_sent    JSONB DEFAULT '{}',

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pal_members_group  ON pal_members(pal_group_id);
CREATE INDEX IF NOT EXISTS idx_pal_members_email  ON pal_members(email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pal_member_group_email ON pal_members(pal_group_id, email);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. PAL_SUPPORT_TICKETS — mirrors vendor_support_tickets
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pal_support_tickets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pal_group_id  UUID NOT NULL REFERENCES pal_groups(id) ON DELETE CASCADE,
  group_name    TEXT,
  subject       TEXT NOT NULL,
  message       TEXT NOT NULL,
  admin_reply   TEXT,
  status        TEXT DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  replied_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pal_tickets_group  ON pal_support_tickets(pal_group_id);
CREATE INDEX IF NOT EXISTS idx_pal_tickets_status ON pal_support_tickets(status);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. CARDS — link auto-created Pal cards back to the group + recipient member
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE cards ADD COLUMN IF NOT EXISTS pal_group_id  UUID REFERENCES pal_groups(id) ON DELETE SET NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS pal_member_id UUID REFERENCES pal_members(id) ON DELETE SET NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS pal_occasion_key TEXT; -- e.g. "birthday_2026" — for dedupe
CREATE INDEX IF NOT EXISTS idx_cards_pal_group ON cards(pal_group_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. MESSAGES — track which pal member signed (for "signers can't exceed
--    group size" + "only group members can sign" enforcement)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE messages ADD COLUMN IF NOT EXISTS pal_member_id UUID REFERENCES pal_members(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. CARDS — settlement tracking (6pm gift-pot payout to recipient's bank)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE cards ADD COLUMN IF NOT EXISTS settled_at            TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS settlement_amount     NUMERIC(12,2);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS settlement_commission NUMERIC(12,2);

SELECT 'Thankeeu Pals migration complete ✅' AS result;
