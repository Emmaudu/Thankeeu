-- ============================================
-- THANKEEU FOR TEAMS — Occasions & Members
-- Run this AFTER schema.sql and schema_teams.sql
-- ============================================

-- OCCASION TYPES (system + custom per company)
CREATE TYPE occasion_scope AS ENUM ('department', 'company_wide', 'pending_approval');

CREATE TABLE occasion_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,          -- e.g. 'birthday', 'leaving', 'womens_day'
  label TEXT NOT NULL,         -- e.g. 'Birthday', 'Women\'s Day'
  icon TEXT DEFAULT '🎉',
  notify_days_before INTEGER DEFAULT 7,
  gender_filter TEXT,          -- 'female', 'male', NULL = all
  default_scope occasion_scope DEFAULT 'department',
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OCCASION MEMBERS (uploaded via Excel per occasion type)
CREATE TABLE occasion_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  occasion_type_id UUID REFERENCES occasion_types(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
  occasion_date DATE NOT NULL,   -- The specific date for this person
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  card_slug TEXT,
  last_dept_notified_at TIMESTAMPTZ,
  celebrant_notified_at TIMESTAMPTZ,
  year_processed INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, occasion_type_id, email)
);

-- COMPANY MEMBER ACCOUNTS (team leaders + members joining company)
CREATE TYPE member_role AS ENUM ('team_leader', 'team_member');
CREATE TYPE member_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role member_role NOT NULL,
  department TEXT NOT NULL,
  profile_picture_url TEXT,
  status member_status DEFAULT 'pending',
  approved_by UUID,             -- HR company.id or team_leader company_member.id
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CARD SCOPE (department vs company-wide, with approval flow)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS
  notification_scope occasion_scope DEFAULT 'department';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS
  created_by_member_id UUID REFERENCES company_members(id) ON DELETE SET NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS
  occasion_type_id UUID REFERENCES occasion_types(id) ON DELETE SET NULL;

-- CROSS-DEPARTMENT NOTIFICATION APPROVAL REQUESTS
CREATE TABLE notification_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  requested_by_id UUID NOT NULL,
  requested_by_type TEXT CHECK (requested_by_type IN ('hr', 'team_leader', 'team_member')),
  requested_by_name TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by_id UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTRIBUTION WALLETS (per card — tracks financials)
CREATE TABLE contribution_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  total_contributed INTEGER DEFAULT 0,    -- gross total from all contributors
  platform_fee INTEGER DEFAULT 0,          -- 20% of total_contributed
  net_after_fee INTEGER DEFAULT 0,         -- total_contributed - platform_fee
  total_deducted INTEGER DEFAULT 0,        -- approved deductions by team leader
  amount_to_celebrant INTEGER DEFAULT 0,  -- net_after_fee - total_deducted
  disbursed BOOLEAN DEFAULT FALSE,
  disbursed_at TIMESTAMPTZ,
  disbursement_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEDUCTION REQUESTS (team leader asks to take some money for physical celebration)
CREATE TABLE deduction_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES contribution_wallets(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  requested_by_id UUID REFERENCES company_members(id) ON DELETE SET NULL,
  requested_by_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by_id UUID,          -- HR company.id
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_occasion_members_company ON occasion_members(company_id);
CREATE INDEX idx_occasion_members_date ON occasion_members(occasion_date);
CREATE INDEX idx_occasion_members_type ON occasion_members(occasion_type_id);
CREATE INDEX idx_company_members_company ON company_members(company_id);
CREATE INDEX idx_company_members_dept ON company_members(company_id, department);
CREATE INDEX idx_company_members_email ON company_members(email);
CREATE INDEX idx_contribution_wallets_card ON contribution_wallets(card_id);
CREATE INDEX idx_deduction_requests_card ON deduction_requests(card_id);
CREATE INDEX idx_deduction_requests_status ON deduction_requests(status);
CREATE INDEX idx_notification_approvals_card ON notification_approvals(card_id);
CREATE INDEX idx_notification_approvals_company ON notification_approvals(company_id);

-- TRIGGER: update occasion_members.updated_at
CREATE TRIGGER occasion_members_updated_at BEFORE UPDATE ON occasion_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER company_members_updated_at BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON contribution_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- FUNCTION: recalculate wallet totals whenever contributions change
CREATE OR REPLACE FUNCTION recalculate_wallet()
RETURNS TRIGGER AS $$
DECLARE
  v_card_id UUID;
  v_total INTEGER;
  v_fee INTEGER;
BEGIN
  -- Get card_id from the contributions table change
  IF TG_OP = 'DELETE' THEN
    v_card_id := OLD.card_id;
  ELSE
    v_card_id := NEW.card_id;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM contributions WHERE card_id = v_card_id AND status = 'success';

  v_fee := ROUND(v_total * 0.20);

  UPDATE contribution_wallets SET
    total_contributed = v_total,
    platform_fee = v_fee,
    net_after_fee = v_total - v_fee,
    amount_to_celebrant = (v_total - v_fee) - COALESCE(total_deducted, 0),
    updated_at = NOW()
  WHERE card_id = v_card_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_on_contribution
  AFTER INSERT OR UPDATE OR DELETE ON contributions
  FOR EACH ROW EXECUTE FUNCTION recalculate_wallet();

-- INSERT DEFAULT SYSTEM OCCASION TYPES FOR EACH COMPANY (via function)
-- Call this after creating a company: SELECT seed_occasion_types('company-uuid');
CREATE OR REPLACE FUNCTION seed_occasion_types(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO occasion_types (company_id, name, label, icon, notify_days_before, gender_filter, default_scope, is_system)
  VALUES
    (p_company_id, 'birthday',        'Birthday',            '🎂', 2,  NULL,     'department',   TRUE),
    (p_company_id, 'leaving',         'Leaving Company',     '👋', 7,  NULL,     'department',   TRUE),
    (p_company_id, 'work_anniversary','Work Anniversary',    '🏆', 7,  NULL,     'department',   TRUE),
    (p_company_id, 'promotion',       'Promotion',           '🌟', 7,  NULL,     'department',   TRUE),
    (p_company_id, 'wedding',         'Wedding Celebration', '💍', 7,  NULL,     'department',   TRUE),
    (p_company_id, 'valentines_day',  'Valentine\'s Day',    '💝', 7,  NULL,     'company_wide', TRUE),
    (p_company_id, 'womens_day',      'Women''s Day',        '👩', 7,  'female', 'company_wide', TRUE),
    (p_company_id, 'mens_day',        'Men''s Day',          '👨', 7,  'male',   'company_wide', TRUE),
    (p_company_id, 'workers_day',     'Workers'' Day',       '✊', 7,  NULL,     'company_wide', TRUE),
    (p_company_id, 'graduation',      'Graduation',          '🎓', 7,  NULL,     'department',   TRUE),
    (p_company_id, 'new_baby',        'New Baby',            '👶', 7,  NULL,     'department',   TRUE),
    (p_company_id, 'retirement',      'Retirement',          '🏖️', 14, NULL,     'company_wide', TRUE)
    ,(p_company_id, 'new_hire',      'New Employee Welcome', '🌟', 0,  NULL,     'department',   TRUE)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
