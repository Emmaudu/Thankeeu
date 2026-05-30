-- ============================================
-- THANKEEU — HRIS Integration & Branch Schema
-- Run AFTER schema_occasions.sql
-- ============================================

-- COMPANY BRANCHES: a company can have multiple locations/branches
CREATE TABLE company_branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,        -- e.g. "Ikeja Branch", "Lekki Office", "HQ Abuja"
  city        TEXT,
  state       TEXT,                 -- e.g. "Lagos", "Abuja", "Rivers"
  is_default  BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add branch support to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS branch_id  UUID REFERENCES company_branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city       TEXT,
  ADD COLUMN IF NOT EXISTS state      TEXT,
  ADD COLUMN IF NOT EXISTS country    TEXT DEFAULT 'Nigeria';

-- Add branch support to team_members and occasion_members
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS branch_id        UUID REFERENCES company_branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_title        TEXT,
  ADD COLUMN IF NOT EXISTS hire_date        DATE,
  ADD COLUMN IF NOT EXISTS gender           TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
  ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active'
    CHECK (employment_status IN ('active','terminated','on_leave','suspended')),
  ADD COLUMN IF NOT EXISTS hris_employee_id TEXT, -- external ID from HRIS system
  ADD COLUMN IF NOT EXISTS hris_source      TEXT, -- 'bamboohr', 'seamlesshr', etc.
  ADD COLUMN IF NOT EXISTS additional_data  JSONB;

ALTER TABLE occasion_members
  ADD COLUMN IF NOT EXISTS branch_id        UUID REFERENCES company_branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_title        TEXT,
  ADD COLUMN IF NOT EXISTS hire_date        DATE,
  ADD COLUMN IF NOT EXISTS years_of_service INTEGER, -- for work anniversary
  ADD COLUMN IF NOT EXISTS new_title        TEXT,     -- for promotion
  ADD COLUMN IF NOT EXISTS previous_title   TEXT,     -- for promotion
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,   -- for leaving
  ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active'
    CHECK (employment_status IN ('active','terminated','on_leave','suspended')),
  ADD COLUMN IF NOT EXISTS hris_employee_id TEXT,
  ADD COLUMN IF NOT EXISTS hris_source      TEXT,
  ADD COLUMN IF NOT EXISTS additional_data  JSONB;

-- Unique constraint for HRIS deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_occasion_members_hris
  ON occasion_members(company_id, occasion_type_id, hris_employee_id)
  WHERE hris_employee_id IS NOT NULL;

-- HRIS CONNECTIONS: stores credentials per company per provider
CREATE TABLE hris_connections (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL
    CHECK (provider IN ('bamboohr','seamlesshr','sap_successfactors','zoho_people','workpay')),
  display_name   TEXT NOT NULL,         -- e.g. "BambooHR"
  -- Auth fields (store encrypted in production — use Supabase vault or env-level encryption)
  api_key        TEXT,                  -- BambooHR, SeamlessHR, WorkPay
  api_secret     TEXT,                  -- additional secret if needed
  subdomain      TEXT,                  -- BambooHR subdomain
  company_code   TEXT,                  -- SAP company code
  base_url       TEXT,                  -- SAP data center URL or custom
  access_token   TEXT,                  -- Zoho OAuth access token
  refresh_token  TEXT,                  -- Zoho OAuth refresh token
  token_expires_at TIMESTAMPTZ,
  -- Connection state
  is_active      BOOLEAN DEFAULT TRUE,
  is_verified    BOOLEAN DEFAULT FALSE, -- True after successful test connection
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'never'
    CHECK (last_sync_status IN ('never','success','partial','failed')),
  last_sync_count INTEGER DEFAULT 0,    -- employees synced in last run
  last_sync_error TEXT,
  -- Settings
  auto_sync      BOOLEAN DEFAULT FALSE, -- daily auto-sync
  sync_frequency TEXT DEFAULT 'manual'  -- 'manual', 'daily', 'weekly'
    CHECK (sync_frequency IN ('manual','daily','weekly')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, provider)
);

-- HRIS SYNC LOGS: detailed history of every sync operation
CREATE TABLE hris_sync_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  connection_id   UUID NOT NULL REFERENCES hris_connections(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  status          TEXT DEFAULT 'running'
    CHECK (status IN ('running','success','partial','failed')),
  -- Counts per occasion table
  total_employees    INTEGER DEFAULT 0,
  birthday_synced    INTEGER DEFAULT 0,
  anniversary_synced INTEGER DEFAULT 0,
  womens_day_synced  INTEGER DEFAULT 0,
  mens_day_synced    INTEGER DEFAULT 0,
  valentines_synced  INTEGER DEFAULT 0,
  workers_day_synced INTEGER DEFAULT 0,
  promotions_synced  INTEGER DEFAULT 0,
  leaving_synced     INTEGER DEFAULT 0,
  new_hire_synced    INTEGER DEFAULT 0,
  deactivated_count  INTEGER DEFAULT 0,
  error_count        INTEGER DEFAULT 0,
  errors             JSONB,            -- array of error messages
  duration_ms        INTEGER
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_hris_connections_company
  ON hris_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_hris_sync_logs_company
  ON hris_sync_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_hris_sync_logs_connection
  ON hris_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_company_branches_company
  ON company_branches(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_hris
  ON team_members(company_id, hris_employee_id)
  WHERE hris_employee_id IS NOT NULL;

-- TRIGGER: updated_at for hris_connections
CREATE TRIGGER hris_connections_updated_at
  BEFORE UPDATE ON hris_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- VIEW: HRIS sync summary per company
CREATE OR REPLACE VIEW hris_sync_summary AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  hc.provider,
  hc.is_active,
  hc.is_verified,
  hc.last_synced_at,
  hc.last_sync_status,
  hc.last_sync_count,
  hc.auto_sync
FROM companies c
LEFT JOIN hris_connections hc ON hc.company_id = c.id AND hc.is_active = TRUE;


-- DEMO REQUESTS TABLE (run after schema.sql)
CREATE TABLE IF NOT EXISTS demo_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  team_size    TEXT,
  message      TEXT,
  status       TEXT DEFAULT 'new'
    CHECK (status IN ('new','contacted','scheduled','converted','declined')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created ON demo_requests(created_at DESC);
