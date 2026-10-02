-- ============================================================
-- TASKEEU FOR TEAMS — Database Schema Extension
-- Add to existing schema.sql or run separately in Supabase
-- ============================================================

-- ── COMPANIES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hr_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_name VARCHAR(255) NOT NULL,
  company_domain VARCHAR(100) NOT NULL UNIQUE, -- e.g. "huawei.com"
  industry VARCHAR(100),
  company_size VARCHAR(50),
  company_address TEXT,
  company_logo_url TEXT,
  country VARCHAR(50) DEFAULT 'Nigeria',
  subscription_status VARCHAR(30) DEFAULT 'inactive'
    CHECK (subscription_status IN ('inactive','trial','active','expired','suspended')),
  subscription_plan VARCHAR(20) DEFAULT 'monthly'
    CHECK (subscription_plan IN ('monthly','yearly')),
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  -- paystack_customer_code removed — using Flutterwave
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMPANY SUBSCRIPTIONS (history) ──────────────────────────────
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('monthly','yearly')),
  amount DECIMAL(14,2) NOT NULL,
  flw_reference VARCHAR(255),
  flw_transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','active','expired','failed','cancelled')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMPANY DEPARTMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  leader_member_id UUID, -- FK set after members table
  budget_allocated DECIMAL(14,2) DEFAULT 0,
  budget_spent DECIMAL(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- ── COMPANY MEMBERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES company_departments(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  work_email VARCHAR(255) NOT NULL,
  job_role VARCHAR(150),
  permission_level VARCHAR(30) DEFAULT 'member'
    CHECK (permission_level IN ('hr','dept_leader','finance','member')),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','active','suspended','removed')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  is_hr BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, work_email)
);

-- Set FK from departments to members for leader
DO $$ BEGIN
  ALTER TABLE company_departments
  ADD CONSTRAINT fk_dept_leader
  FOREIGN KEY (leader_member_id) REFERENCES company_members(id) ON DELETE SET NULL
  ;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── COMPANY TASK WALLET ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  total_balance DECIMAL(14,2) DEFAULT 0,
  reserved_balance DECIMAL(14,2) DEFAULT 0, -- funds locked for ongoing tasks
  available_balance DECIMAL(14,2) GENERATED ALWAYS AS (total_balance - reserved_balance) STORED,
  use_general_purse BOOLEAN DEFAULT true, -- false = split by department
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── WALLET TRANSACTIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES company_departments(id) ON DELETE SET NULL,
  transaction_type VARCHAR(30) NOT NULL
    CHECK (transaction_type IN ('topup','task_reserve','task_deduct','dept_allocation','refund','subscription')),
  amount DECIMAL(14,2) NOT NULL,
  balance_after DECIMAL(14,2),
  description TEXT,
  enterprise_task_id UUID,
  flw_reference VARCHAR(255),
  initiated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ENTERPRISE TASK TYPES (fixed pricing) ─────────────────────────
CREATE TABLE IF NOT EXISTS enterprise_task_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) UNIQUE NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  estimated_duration_hours INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT true
);

-- Seed fixed task types
INSERT INTO enterprise_task_types (name, base_price, category) VALUES
  ('Merchant Verification',          12000, 'Verification'),
  ('Address Verification',           10000, 'Verification'),
  ('KYC Verification',               11000, 'Verification'),
  ('Business Verification',          13000, 'Verification'),
  ('Property Inspection',            15000, 'Inspection'),
  ('Warehouse Inspection',           18000, 'Inspection'),
  ('Construction Site Inspection',   20000, 'Inspection'),
  ('Vehicle Inspection',             12000, 'Inspection'),
  ('Telecom Tower Inspection',       22000, 'Inspection'),
  ('Fiber Network Inspection',       20000, 'Inspection'),
  ('ATM Inspection',                 12000, 'Inspection'),
  ('POS Terminal Verification',      10000, 'Verification'),
  ('Retail Shelf Audits',            11000, 'Audit'),
  ('Competitor Price Monitoring',    12000, 'Audit'),
  ('Product Availability Checks',    10000, 'Audit'),
  ('Inventory Audits',               14000, 'Audit'),
  ('Delivery Verification',          10000, 'Verification'),
  ('Route Validation',               13000, 'Logistics'),
  ('Truck Inspection',               15000, 'Inspection'),
  ('Real Estate Walkthroughs',       18000, 'Inspection'),
  ('Tenant Occupancy Checks',        12000, 'Inspection'),
  ('Insurance Claims Inspection',    20000, 'Inspection'),
  ('Accident Scene Documentation',   15000, 'Documentation'),
  ('Farm Inspection',                14000, 'Inspection'),
  ('Crop Monitoring',                12000, 'Monitoring'),
  ('Event Activation Monitoring',    13000, 'Monitoring'),
  ('Brand Compliance Audits',        15000, 'Audit'),
  ('Mystery Shopping',               11000, 'Audit'),
  ('Utility Meter Inspection',       10000, 'Inspection'),
  ('Solar Installation Verification',18000, 'Verification'),
  ('Diesel Level Monitoring',        10000, 'Monitoring'),
  ('NGO Field Surveys',              13000, 'Survey'),
  ('Aid Distribution Verification',  14000, 'Verification'),
  ('Environmental Compliance Checks',20000, 'Compliance'),
  ('Safety Compliance Audits',       22000, 'Compliance'),
  ('Market Research Data Collection',13000, 'Survey'),
  ('Local Procurement Tasks',        12000, 'Logistics'),
  ('Emergency Dispatch Tasks',       25000, 'Dispatch'),
  ('Queueing & Representation Tasks',10000, 'Dispatch'),
  ('Physical Evidence Collection',   15000, 'Documentation'),
  ('GPS Mapping & Location Verification',13000,'Documentation'),
  ('Photo & Video Documentation',    11000, 'Documentation'),
  ('Drone Site Coverage',            25000, 'Documentation'),
  ('Hyperlocal Intelligence Gathering',16000,'Survey')
ON CONFLICT (name) DO NOTHING;

-- ── ENTERPRISE TASKS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enterprise_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  member_id UUID REFERENCES company_members(id) ON DELETE SET NULL,
  department_id UUID REFERENCES company_departments(id) ON DELETE SET NULL,
  member_department VARCHAR(150),
  member_role VARCHAR(150),

  -- Task details
  title VARCHAR(255) NOT NULL,
  task_type_id UUID REFERENCES enterprise_task_types(id),
  custom_task_type VARCHAR(150), -- if not in list
  description TEXT NOT NULL,
  attachment_urls TEXT[],

  -- Pricing
  base_price_per_person DECIMAL(10,2) NOT NULL,
  adjusted_price_per_person DECIMAL(10,2) NOT NULL, -- after member modifications
  adjustment_type VARCHAR(20) CHECK (adjustment_type IN ('none','multiply','add','subtract','divide')),
  adjustment_value DECIMAL(10,2),

  -- Deployment (can span multiple states)
  total_people_needed INTEGER DEFAULT 1,
  total_estimated_cost DECIMAL(14,2),

  -- Schedule
  commence_date TIMESTAMPTZ NOT NULL,
  duration_days INTEGER DEFAULT 1,
  deadline TIMESTAMPTZ,

  -- Approval workflow
  line_manager_name VARCHAR(150),
  line_manager_email VARCHAR(255),
  line_manager_approved BOOLEAN,
  line_manager_approved_at TIMESTAMPTZ,
  line_manager_notes TEXT,

  -- Status
  status VARCHAR(30) DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','live','ongoing','completed','cancelled','rejected')),

  -- Completion
  completion_code VARCHAR(6),
  completed_at TIMESTAMPTZ,

  -- SLA
  sla_hours INTEGER DEFAULT 24,
  proof_required BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ENTERPRISE TASK STATE DEPLOYMENTS ────────────────────────────
CREATE TABLE IF NOT EXISTS enterprise_task_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enterprise_task_id UUID REFERENCES enterprise_tasks(id) ON DELETE CASCADE,
  state VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  people_needed INTEGER DEFAULT 1,
  full_address TEXT,
  task_type_override VARCHAR(150), -- per-state task type if different
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ENTERPRISE TASK BIDS (taskers bid) ───────────────────────────
CREATE TABLE IF NOT EXISTS enterprise_task_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enterprise_task_id UUID REFERENCES enterprise_tasks(id) ON DELETE CASCADE,
  state_deployment_id UUID REFERENCES enterprise_task_states(id) ON DELETE CASCADE,
  tasker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','ignored')),
  accepted_at TIMESTAMPTZ,
  rejected_reason TEXT,
  authorization_letter_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enterprise_task_id, tasker_id, state_deployment_id)
);

-- ── ENTERPRISE TASK PROOFS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enterprise_task_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enterprise_task_id UUID REFERENCES enterprise_tasks(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES enterprise_task_bids(id) ON DELETE CASCADE,
  tasker_id UUID REFERENCES users(id),
  proof_type VARCHAR(30) CHECK (proof_type IN ('gps_photo','timestamp_photo','video','document','other')),
  file_url TEXT NOT NULL,
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  gps_address TEXT,
  taken_at TIMESTAMPTZ,
  caption TEXT,
  is_approved BOOLEAN,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TASKER BLACKLIST (per company) ───────────────────────────────
CREATE TABLE IF NOT EXISTS company_tasker_blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  tasker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blacklisted_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, tasker_id)
);

-- ── ENTERPRISE CHAT BROADCASTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS enterprise_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enterprise_task_id UUID REFERENCES enterprise_tasks(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES users(id),
  message TEXT NOT NULL,
  attachment_url TEXT,
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ENTERPRISE MEETING LINKS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS enterprise_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enterprise_task_id UUID REFERENCES enterprise_tasks(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  meeting_title VARCHAR(255),
  jitsi_room_id VARCHAR(100) UNIQUE,
  meeting_url TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  attendee_ids UUID[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PERMISSION GRANTS (HR assigns rights) ─────────────────────────
CREATE TABLE IF NOT EXISTS company_permission_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  granted_to_member UUID REFERENCES company_members(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  permission VARCHAR(50) NOT NULL,
  -- permissions: 'approve_members','manage_wallet','manage_departments',
  --              'approve_tasks','view_all_tasks','manage_subscriptions'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, granted_to_member, permission)
);

-- ── INDEXES ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(company_domain);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_email ON company_members(work_email);
CREATE INDEX IF NOT EXISTS idx_enterprise_tasks_company ON enterprise_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_tasks_status ON enterprise_tasks(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_task_states_task ON enterprise_task_states(enterprise_task_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_bids_task ON enterprise_task_bids(enterprise_task_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_bids_tasker ON enterprise_task_bids(tasker_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_company ON wallet_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_company ON company_tasker_blacklist(company_id);

-- ── TRIGGERS ───────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_enterprise_tasks_updated_at ON enterprise_tasks;
CREATE TRIGGER trg_enterprise_tasks_updated_at
  BEFORE UPDATE ON enterprise_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_company_members_updated_at ON company_members;
CREATE TRIGGER trg_company_members_updated_at
  BEFORE UPDATE ON company_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_company_wallets_updated_at ON company_wallets;
CREATE TRIGGER trg_company_wallets_updated_at
  BEFORE UPDATE ON company_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- NOTE: company_task_file_history is defined as a VIEW in teams-schema-v2.sql
-- (Section 7). Do not create a table here.
