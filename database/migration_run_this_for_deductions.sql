-- ⚠️  RUN THIS IN SUPABASE SQL EDITOR to enable Deductions & Financials tabs
-- Safe to run multiple times (IF NOT EXISTS)

-- 1. Add created_by_member_id to cards table (needed for member financials)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS created_by_member_id UUID REFERENCES company_members(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cards_created_by_member ON cards(created_by_member_id);

-- 2. Add notification_scope to cards (needed for team card creation)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS notification_scope TEXT DEFAULT 'department';

-- 3. Contribution wallets (needed for deductions tab)
CREATE TABLE IF NOT EXISTS contribution_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  total_contributed INTEGER DEFAULT 0,
  platform_fee INTEGER DEFAULT 0,
  net_after_fee INTEGER DEFAULT 0,
  amount_to_celebrant INTEGER DEFAULT 0,
  total_deducted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id)
);
CREATE INDEX IF NOT EXISTS idx_contribution_wallets_card ON contribution_wallets(card_id);

-- 4. Deduction requests (needed for deductions tab)
CREATE TABLE IF NOT EXISTS deduction_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES contribution_wallets(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  requested_by_id UUID REFERENCES company_members(id) ON DELETE CASCADE,
  requested_by_name TEXT,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  note TEXT,
  withdrawal_requested BOOLEAN DEFAULT FALSE,
  withdrawal_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deduction_requests_card ON deduction_requests(card_id);
CREATE INDEX IF NOT EXISTS idx_deduction_requests_requester ON deduction_requests(requested_by_id);
CREATE INDEX IF NOT EXISTS idx_deduction_requests_status ON deduction_requests(status);
CREATE INDEX IF NOT EXISTS idx_deduction_requests_company ON deduction_requests(company_id);
