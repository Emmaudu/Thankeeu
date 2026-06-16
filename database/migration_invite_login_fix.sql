-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: Ensure all columns needed for HR import → login flow exist
-- Run in Supabase SQL Editor → New Query → Run
-- Safe to run multiple times (all statements are idempotent)
-- ════════════════════════════════════════════════════════════════════════

-- 1. invite_token — used to identify the member when they set their password
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS invite_token TEXT;

-- 2. invite_accepted — set to true once member sets password via invite link
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS invite_accepted BOOLEAN DEFAULT FALSE;

-- 3. reset_token / reset_token_expires — used by forgot-password flow
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- 4. password_hash must be nullable (invite flow stores a placeholder until member sets it)
ALTER TABLE company_members ALTER COLUMN password_hash DROP NOT NULL;

-- 5. department must be nullable (HRIS imports may not always have it)
ALTER TABLE company_members ALTER COLUMN department DROP NOT NULL;

-- 6. Composite unique index on (company_id, email) — required for upsert onConflict
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'company_members'
      AND indexdef LIKE '%company_id%email%'
      AND indexdef LIKE '%UNIQUE%'
  ) THEN
    BEGIN
      ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_email_key;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    ALTER TABLE company_members ADD CONSTRAINT company_members_company_email_unique
      UNIQUE (company_id, email);
  END IF;
END $$;

-- 7. Fast index for invite_token lookups
CREATE INDEX IF NOT EXISTS idx_company_members_invite_token
  ON company_members(invite_token) WHERE invite_token IS NOT NULL;

-- 8. Fast index for reset_token lookups  
CREATE INDEX IF NOT EXISTS idx_company_members_reset_token
  ON company_members(reset_token) WHERE reset_token IS NOT NULL;

-- Verify — should show all columns including invite_token and invite_accepted
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_members'
  AND column_name IN ('password_hash','invite_token','invite_accepted','reset_token','reset_token_expires')
ORDER BY column_name;
