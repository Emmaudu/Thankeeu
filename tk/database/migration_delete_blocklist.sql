-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: company_deleted_members blocklist
-- Prevents HRIS auto-sync from re-creating members HR explicitly deleted.
-- Run in Supabase SQL Editor → New Query → Run (safe to run multiple times)
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS company_deleted_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, email)
);

CREATE INDEX IF NOT EXISTS idx_deleted_members_company
  ON company_deleted_members(company_id, email);

-- Verify
SELECT 'company_deleted_members table ready' AS status;
