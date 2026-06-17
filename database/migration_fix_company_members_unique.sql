-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix company_members unique constraint
-- The original schema_occasions.sql created a GLOBAL email UNIQUE constraint
-- which blocks members with the same email from being in multiple companies.
-- This replaces it with a COMPOSITE unique on (company_id, email).
-- Run in Supabase SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════════════════════════

-- Step 1: Drop the global email unique constraint if it exists
DO $$
BEGIN
  -- Drop the constraint created by schema_occasions.sql (email TEXT UNIQUE NOT NULL)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_members_email_key'
    AND conrelid = 'company_members'::regclass
  ) THEN
    ALTER TABLE company_members DROP CONSTRAINT company_members_email_key;
    RAISE NOTICE 'Dropped global email unique constraint';
  END IF;
END $$;

-- Step 2: Add composite unique constraint on (company_id, email) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_members_company_email_unique'
    AND conrelid = 'company_members'::regclass
  ) THEN
    ALTER TABLE company_members
      ADD CONSTRAINT company_members_company_email_unique UNIQUE (company_id, email);
    RAISE NOTICE 'Added composite unique constraint (company_id, email)';
  END IF;
END $$;

-- Step 3: Make password_hash nullable (needed for invite flow)
ALTER TABLE company_members ALTER COLUMN password_hash DROP NOT NULL;

-- Step 4: Make first_name, last_name, department, role nullable or with defaults
-- (they may be NOT NULL in schema_occasions.sql but are optional in import flow)
ALTER TABLE company_members ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE company_members ALTER COLUMN last_name SET DEFAULT '';

-- Verify
SELECT conname, contype FROM pg_constraint
WHERE conrelid = 'company_members'::regclass
AND contype = 'u';
