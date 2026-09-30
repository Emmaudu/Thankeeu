-- ════════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix company_members invite flow
-- Run this in Supabase SQL Editor → New Query → Run
-- Safe to run multiple times (all statements are idempotent)
-- ════════════════════════════════════════════════════════════════════════

-- 1. Ensure invite_token column exists
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS invite_token TEXT;

-- 2. Ensure reset_token columns exist
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- 3. Make password_hash nullable (older schema had NOT NULL which breaks invite flow)
ALTER TABLE company_members ALTER COLUMN password_hash DROP NOT NULL;

-- 4. Make department nullable (older schema had NOT NULL which breaks some imports)
ALTER TABLE company_members ALTER COLUMN department DROP NOT NULL;

-- 5. Add composite unique constraint on (company_id, email) if it doesn't exist
--    The upsert uses onConflict: 'company_id,email' which requires this.
--    Older schema only had UNIQUE on email alone.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'company_members'
      AND indexdef LIKE '%company_id%email%'
      AND indexdef LIKE '%UNIQUE%'
  ) THEN
    -- Drop the old email-only unique if it exists (conflicts with composite)
    BEGIN
      ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_email_key;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    -- Create composite unique
    ALTER TABLE company_members ADD CONSTRAINT company_members_company_email_unique
      UNIQUE (company_id, email);
  END IF;
END $$;

-- 6. Index on invite_token for fast lookups during password reset
CREATE INDEX IF NOT EXISTS idx_company_members_invite_token
  ON company_members(invite_token) WHERE invite_token IS NOT NULL;

-- 7. Ensure blog_subscribers confirm_token column exists (related fix)
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS confirm_token TEXT;
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirm_token
  ON blog_subscribers(confirm_token) WHERE confirm_token IS NOT NULL;
