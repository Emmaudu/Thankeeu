-- ============================================
-- THANKEEU FOR TEAMS — Additional Schema
-- Run this AFTER the main schema.sql
-- ============================================

-- COMPANIES TABLE
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT,
  industry TEXT,
  logo_url TEXT,
  website TEXT,
  role TEXT DEFAULT 'company' CHECK (role IN ('company', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  -- Theme preference
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM MEMBERS TABLE
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  birthday DATE NOT NULL, -- stored as full date for querying, DD-MM-YY display
  is_active BOOLEAN DEFAULT TRUE,
  -- Card tracking
  card_slug TEXT, -- auto-created card slug for their birthday
  card_signed_count INTEGER DEFAULT 0,
  last_birthday_card_sent TIMESTAMPTZ,
  last_birthday_notified TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, email)
);

-- COMPANY SUBSCRIPTIONS TABLE
CREATE TYPE sub_plan AS ENUM ('monthly', 'yearly');
CREATE TYPE sub_status AS ENUM ('active', 'expired', 'cancelled', 'trial');

CREATE TABLE company_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan sub_plan NOT NULL,
  status sub_status DEFAULT 'trial',
  amount INTEGER NOT NULL, -- in naira
  paystack_reference TEXT,
  paystack_subscription_code TEXT,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUPPORT TICKETS TABLE
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Can be from regular user or company
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'company', 'member')),
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  admin_reply TEXT,
  admin_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BIRTHDAY CARD TRACKING TABLE
CREATE TABLE birthday_automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  card_slug TEXT REFERENCES cards(slug) ON DELETE SET NULL,
  year INTEGER NOT NULL, -- which year's birthday
  department_notified_at TIMESTAMPTZ, -- when dept was emailed to sign
  celebrant_notified_at TIMESTAMPTZ,  -- when celebrant was emailed
  total_signed INTEGER DEFAULT 0,
  total_gift_collected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, year)
);

-- INDEXES
CREATE INDEX idx_team_members_company ON team_members(company_id);
CREATE INDEX idx_team_members_birthday ON team_members(birthday);
CREATE INDEX idx_team_members_dept ON team_members(company_id, department);
CREATE INDEX idx_company_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX idx_support_tickets_sender ON support_tickets(sender_id);
CREATE INDEX idx_birthday_automations_member ON birthday_automations(member_id);

-- TRIGGER: update companies.updated_at
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- VIEW: upcoming birthdays (next 30 days)
CREATE VIEW upcoming_birthdays AS
SELECT
  tm.*,
  c.name as company_name,
  c.email as company_email,
  DATE_PART('day', AGE(
    DATE(DATE_PART('year', NOW()) || '-' || DATE_PART('month', tm.birthday) || '-' || DATE_PART('day', tm.birthday)),
    NOW()::DATE
  )) as days_until_birthday
FROM team_members tm
JOIN companies c ON c.id = tm.company_id
JOIN company_subscriptions cs ON cs.company_id = c.id
WHERE tm.is_active = TRUE
  AND cs.status = 'active'
  AND cs.expires_at > NOW();
