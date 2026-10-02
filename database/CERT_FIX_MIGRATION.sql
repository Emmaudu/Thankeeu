-- ============================================================
-- CERT FIX MIGRATION
-- Run this if certification "Mark Complete" was failing.
-- Ensures enterprise_cert_modules are seeded with module_number
-- 1-5 so the backend can resolve module_number -> UUID.
-- Safe to run more than once.
-- ============================================================

-- Make sure tables exist (idempotent)
CREATE TABLE IF NOT EXISTS enterprise_cert_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_number INTEGER UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(300),
  emoji VARCHAR(10),
  estimated_minutes INTEGER DEFAULT 15,
  requirements JSONB DEFAULT '[]'::jsonb,
  content JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasker_module_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tasker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES enterprise_cert_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_seconds INTEGER DEFAULT 0,
  UNIQUE(tasker_id, module_id)
);

CREATE TABLE IF NOT EXISTS tasker_enterprise_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tasker_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  is_valid BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT
);

-- Repair older installs where content existed without a default.
-- Do not force requirements here because older installs may use TEXT[] instead of JSONB.
ALTER TABLE enterprise_cert_modules ALTER COLUMN content SET DEFAULT '{}'::jsonb;
UPDATE enterprise_cert_modules SET content = '{}'::jsonb WHERE content IS NULL;

-- Seed the 5 modules (ON CONFLICT = safe to re-run)
INSERT INTO enterprise_cert_modules (
  module_number,
  title,
  subtitle,
  emoji,
  content,
  estimated_minutes,
  is_active
)
VALUES
  (1, 'Verification Tasks',           'KYC, Merchant, Address & Business Verification', 'search', '{}'::jsonb, 15, true),
  (2, 'Telecom & Infrastructure',     'Tower, Cable, Network & Utility Field Tasks',     'signal', '{}'::jsonb, 15, true),
  (3, 'Inspection & Audit Tasks',     'Property, Equipment & Compliance Inspections',    'audit',  '{}'::jsonb, 15, true),
  (4, 'Field Operations & Logistics', 'Delivery, Distribution & Field Coordination',     'truck',  '{}'::jsonb, 15, true),
  (5, 'Safety, Health & Standards',   'PPE, Risk Assessment & Professional Conduct',     'safety', '{}'::jsonb, 15, true)
ON CONFLICT (module_number) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  emoji = EXCLUDED.emoji,
  content = COALESCE(enterprise_cert_modules.content, EXCLUDED.content),
  estimated_minutes = EXCLUDED.estimated_minutes,
  is_active = true;

-- Ensure tasker_profiles has the enterprise columns
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS enterprise_certified BOOLEAN DEFAULT false;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS enterprise_certified_at TIMESTAMPTZ;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS enterprise_certificate_id UUID REFERENCES tasker_enterprise_certifications(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_module_completions_tasker ON tasker_module_completions(tasker_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_certs_tasker ON tasker_enterprise_certifications(tasker_id);
CREATE INDEX IF NOT EXISTS idx_cert_modules_number ON enterprise_cert_modules(module_number);
