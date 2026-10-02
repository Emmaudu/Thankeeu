-- ═══════════════════════════════════════════════════════════════════════════
-- TASKEEU — REQUIRED MIGRATION
-- Run this ENTIRE file in your Supabase SQL Editor.
-- This fixes the "couldn't find the country column in the schema cache" error
-- and all related login/signup failures.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(5) DEFAULT 'NG';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;

-- 2. Add missing columns to tasker_profiles
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(5) DEFAULT 'NG';
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS motivation TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS kyc_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS kyc_submission_status TEXT DEFAULT 'not_submitted';
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS national_id_url TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS driver_license_url TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS passport_url TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS proof_of_address_url TEXT;

-- 3. Add missing columns to requester_profiles
ALTER TABLE requester_profiles ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);

-- 4. Add missing columns to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS flw_reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS flw_transaction_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS flw_link TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NGN';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

-- 5. Add missing columns to wallet_transactions
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS flw_reference TEXT;

-- 6. Add missing columns to company_subscriptions
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS flw_reference TEXT;

-- 7. Create RPC function for setting country (bypasses PostgREST schema cache)
CREATE OR REPLACE FUNCTION set_user_country(p_user_id UUID, p_country TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE users SET country = p_country WHERE id = p_user_id;
  UPDATE tasker_profiles SET country = p_country WHERE user_id = p_user_id;
END;
$$;

-- 8. RELOAD THE SCHEMA CACHE — THIS IS THE FIX FOR THE ERROR
NOTIFY pgrst, 'reload schema';

-- 9. RPC: admin_set_kyc_status (used by admin KYC approval/rejection)
CREATE OR REPLACE FUNCTION admin_set_kyc_status(
  p_user_id UUID,
  p_complete BOOLEAN,
  p_status TEXT,
  p_clear_docs BOOLEAN DEFAULT FALSE
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_clear_docs THEN
    UPDATE tasker_profiles SET
      kyc_complete = p_complete,
      kyc_submission_status = p_status,
      national_id_url = NULL,
      driver_license_url = NULL,
      passport_url = NULL,
      proof_of_address_url = NULL
    WHERE user_id = p_user_id;
  ELSE
    UPDATE tasker_profiles SET
      kyc_complete = p_complete,
      kyc_submission_status = p_status
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- 10. Re-reload the schema cache after all changes
NOTIFY pgrst, 'reload schema';

-- 11. RPC: set_user_verification_token (used by requester signup)
CREATE OR REPLACE FUNCTION set_user_verification_token(
  p_user_id UUID,
  p_username TEXT,
  p_token TEXT,
  p_expires TIMESTAMPTZ
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE users SET
    username = p_username,
    verification_token = p_token,
    verification_token_expires = p_expires
  WHERE id = p_user_id;
END;
$$;

-- 12. RPC: get_user_by_verification_token (used by email verify endpoint)
CREATE OR REPLACE FUNCTION get_user_by_verification_token(p_token TEXT, p_role TEXT)
RETURNS TABLE(
  id UUID, email TEXT, full_name TEXT, phone TEXT, role TEXT,
  avatar_url TEXT, is_active BOOLEAN, email_verified BOOLEAN,
  verification_token TEXT, verification_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.phone, u.role,
         u.avatar_url, u.is_active, u.email_verified,
         u.verification_token, u.verification_token_expires,
         u.created_at
  FROM users u
  WHERE u.verification_token = p_token AND u.role = p_role
  LIMIT 1;
END;
$$;

-- 13. RPC: clear_verification_token (used after email verification)
CREATE OR REPLACE FUNCTION clear_verification_token(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE users SET
    verification_token = NULL,
    verification_token_expires = NULL
  WHERE id = p_user_id;
END;
$$;

-- 14. Final schema cache reload
NOTIFY pgrst, 'reload schema';

-- 15. RPC: set_tasker_profile_extras (linkedin_url, resume_url, motivation)
CREATE OR REPLACE FUNCTION set_tasker_profile_extras(
  p_user_id UUID,
  p_linkedin_url TEXT,
  p_resume_url TEXT,
  p_motivation TEXT
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE tasker_profiles SET
    linkedin_url = p_linkedin_url,
    resume_url   = p_resume_url,
    motivation   = p_motivation
  WHERE user_id = p_user_id;
END;
$$;

-- 16. RPC: set_bank_code (bank_code is ALTER TABLE on tasker_profiles and requester_profiles)
CREATE OR REPLACE FUNCTION set_bank_code(p_user_id UUID, p_role TEXT, p_bank_code TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_role = 'tasker' THEN
    UPDATE tasker_profiles SET bank_code = p_bank_code WHERE user_id = p_user_id;
  ELSE
    UPDATE requester_profiles SET bank_code = p_bank_code WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- 17. RPC: set_kyc_submission_pending (kyc_submission_status, kyc_complete, linkedin_url, resume_url)
CREATE OR REPLACE FUNCTION set_kyc_submission_pending(
  p_user_id UUID,
  p_linkedin_url TEXT DEFAULT NULL,
  p_resume_url TEXT DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE tasker_profiles SET
    kyc_submission_status = 'pending_review',
    kyc_complete          = false,
    linkedin_url          = COALESCE(p_linkedin_url, linkedin_url),
    resume_url            = COALESCE(p_resume_url, resume_url)
  WHERE user_id = p_user_id;
END;
$$;

-- 18. Final schema cache reload
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════════
-- ADMIN USER FIX — Run this to fix "Invalid email or password" on admin login
-- Default password: Admin@Taskeeu2025!
-- Uses DO block — avoids ON CONFLICT issues with composite unique index
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM users WHERE email = 'admin@taskeeu.com' AND role = 'admin';
  IF v_id IS NOT NULL THEN
    UPDATE users SET
      password_hash  = '$2b$12$3abdXEYnT5lIoSeqshF1UOUY5X1Ao4UJycfAoYnDSNKpeM1tr1rb.',
      email_verified = true, is_active = true
    WHERE id = v_id;
    RAISE NOTICE 'Admin password reset.';
  ELSE
    SELECT id INTO v_id FROM users WHERE email = 'admin@taskeeu.com';
    IF v_id IS NOT NULL THEN
      UPDATE users SET
        role = 'admin',
        password_hash  = '$2b$12$3abdXEYnT5lIoSeqshF1UOUY5X1Ao4UJycfAoYnDSNKpeM1tr1rb.',
        email_verified = true, is_active = true
      WHERE id = v_id;
      RAISE NOTICE 'Existing user promoted to admin.';
    ELSE
      INSERT INTO users (email, phone, full_name, password_hash, role, email_verified, is_active)
      VALUES ('admin@taskeeu.com', '08012345678', 'Taskeeu Admin',
        '$2b$12$3abdXEYnT5lIoSeqshF1UOUY5X1Ao4UJycfAoYnDSNKpeM1tr1rb.',
        'admin', true, true);
      RAISE NOTICE 'Admin created fresh.';
    END IF;
  END IF;
END $$;

-- Confirm the result
SELECT id, email, role, is_active, email_verified FROM users WHERE email = 'admin@taskeeu.com';

-- Final schema reload
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- MIGRATION: Cancel Requests + Task Funded Flag
-- Run this after deploying the payment/cancel flow updates
-- ============================================================

-- 1. Cancel requests table (requester → tasker must approve)
CREATE TABLE IF NOT EXISTS cancel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  tasker_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cancel_requests_task ON cancel_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_cancel_requests_tasker ON cancel_requests(tasker_id);
CREATE INDEX IF NOT EXISTS idx_cancel_requests_status ON cancel_requests(status);

-- 2. Add is_funded + funded_amount to tasks (track escrow state)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_funded BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funded_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funded_amount DECIMAL(12,2);

-- 3. Notifications: add new types if enum/check constraint exists
-- (Supabase typically uses TEXT for type so no ALTER needed)
