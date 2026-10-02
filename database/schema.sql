-- ============================================================
-- TASKEEU DATABASE SCHEMA
-- Nigerian Task Outsourcing Platform
-- PostgreSQL via Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS (base table for both requesters & taskers)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'requester' CHECK (role IN ('requester', 'tasker', 'admin')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKER PROFILES (extra KYC & operational fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS tasker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  profile_picture_url TEXT,
  national_id_url TEXT,
  driver_license_url TEXT,
  passport_url TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,
  home_address TEXT,
  office_address TEXT,
  proof_of_address_url TEXT,
  task_city VARCHAR(100),
  task_state VARCHAR(100),
  task_address TEXT,
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(20),
  bank_account_name VARCHAR(255),
  verification_status VARCHAR(20) DEFAULT 'pending'
    CHECK (verification_status IN ('pending','approved','rejected','ignored')),
  admin_notes TEXT,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  skills TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REQUESTER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS requester_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(20),
  bank_account_name VARCHAR(255),
  total_tasks_posted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  task_type VARCHAR(50) DEFAULT 'general'
    CHECK (task_type IN ('pickup_delivery','location_only','purchase_ship','general')),

  -- Location fields
  from_address TEXT,
  from_city VARCHAR(100),
  from_state VARCHAR(100),
  to_address TEXT,
  to_city VARCHAR(100),
  to_state VARCHAR(100),
  task_city VARCHAR(100) NOT NULL,
  task_state VARCHAR(100) NOT NULL,
  task_full_address TEXT,

  -- Timing & status
  deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) DEFAULT 'open'
    CHECK (status IN ('open','bidding','ongoing','completed','cancelled','disputed')),

  -- Budget
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),

  -- Assignment
  accepted_tasker_id UUID REFERENCES users(id),
  accepted_bid_id UUID,

  -- Equipment & flags
  is_equipment_required BOOLEAN DEFAULT false,
  equipment_description TEXT,
  tags TEXT[],

  -- Completion
  completion_code VARCHAR(6),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASK BIDS
-- ============================================================
CREATE TABLE IF NOT EXISTS task_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tasker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workmanship_price DECIMAL(12,2) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, tasker_id)
);

-- ============================================================
-- CUSTOM PAYMENT WINDOWS (equipment + shipment + workmanship)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES users(id),
  tasker_id UUID REFERENCES users(id),
  equipment_cost DECIMAL(12,2) DEFAULT 0,
  shipment_cost DECIMAL(12,2) DEFAULT 0,
  workmanship_cost DECIMAL(12,2) DEFAULT 0,
  equipment_proof_urls TEXT[],
  shipment_proof_urls TEXT[],
  requester_confirmed BOOLEAN DEFAULT false,
  equipment_paid BOOLEAN DEFAULT false,
  workmanship_paid BOOLEAN DEFAULT false,
  status VARCHAR(30) DEFAULT 'pending'
    CHECK (status IN ('pending','awaiting_proof','proof_uploaded','confirmed','equipment_paid','workmanship_paid','completed')),
  flw_equip_ref VARCHAR(255),
  flw_work_ref VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS (transaction log)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  custom_payment_id UUID REFERENCES custom_payments(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES users(id),
  tasker_id UUID REFERENCES users(id),
  payment_type VARCHAR(30)
    CHECK (payment_type IN ('workmanship','equipment','shipment','refund','full')),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  paystack_reference VARCHAR(255),  -- legacy column kept so existing data is not lost; flw_reference is the active column
  flw_reference TEXT UNIQUE,
  flw_transaction_id TEXT,
  flw_link TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFUND REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  requester_id UUID REFERENCES users(id),
  tasker_id UUID REFERENCES users(id),
  payment_id UUID REFERENCES payments(id),
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','processing','completed')),
  tasker_response TEXT,
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES users(id),
  tasker_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ,
  requester_last_read TIMESTAMPTZ,
  tasker_last_read TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, requester_id, tasker_id)
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(30)
    CHECK (media_type IN ('image','video','file','audio')),
  reactions JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RATINGS & REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  requester_id UUID REFERENCES users(id),
  tasker_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, requester_id)
);

-- ============================================================
-- TASK COMPLETION CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS task_completion_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DIRECT TASKER APPLICATIONS (requester contacts tasker directly)
-- ============================================================
CREATE TABLE IF NOT EXISTS direct_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES users(id),
  tasker_id UUID REFERENCES users(id),
  task_description TEXT NOT NULL,
  task_city VARCHAR(100),
  task_state VARCHAR(100),
  deadline TIMESTAMPTZ,
  budget DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','completed')),
  task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_city ON tasks(task_city);
CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks(task_state);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_requester ON tasks(requester_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasker_profiles_city ON tasker_profiles(task_city);
CREATE INDEX IF NOT EXISTS idx_tasker_profiles_status ON tasker_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_payments_task ON payments(task_id);
CREATE INDEX IF NOT EXISTS idx_bids_task ON task_bids(task_id, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_tasker_profiles_updated_at ON tasker_profiles;
CREATE TRIGGER trg_tasker_profiles_updated_at
  BEFORE UPDATE ON tasker_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_custom_payments_updated_at ON custom_payments;
CREATE TRIGGER trg_custom_payments_updated_at
  BEFORE UPDATE ON custom_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Email verification OTP codes
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'requester',
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_verify_email ON email_verification_codes(email, role);

-- ─── Migration: allow same email for different roles ─────────────────
-- Drop the old unique constraint on email alone
-- Add composite unique on (email, role) instead
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);

-- ============================================================
-- SEED: Admin user
-- ============================================================
-- ADMIN USER SEED
-- Default password: Admin@Taskeeu2025!
-- Change immediately after first login via POST /auth/change-password
-- Uses DO block to avoid ON CONFLICT issues with composite unique index
-- ============================================================
DO $$
DECLARE v_id UUID;
BEGIN
  -- Check if admin already exists
  SELECT id INTO v_id FROM users WHERE email = 'admin@taskeeu.com' AND role = 'admin';

  IF v_id IS NOT NULL THEN
    -- Update existing admin
    UPDATE users SET
      password_hash  = '$2b$12$3abdXEYnT5lIoSeqshF1UOUY5X1Ao4UJycfAoYnDSNKpeM1tr1rb.',
      email_verified = true,
      is_active      = true
    WHERE id = v_id;
  ELSE
    -- Check if email exists with different role
    SELECT id INTO v_id FROM users WHERE email = 'admin@taskeeu.com';
    IF v_id IS NOT NULL THEN
      UPDATE users SET
        role           = 'admin',
        password_hash  = '$2b$12$3abdXEYnT5lIoSeqshF1UOUY5X1Ao4UJycfAoYnDSNKpeM1tr1rb.',
        email_verified = true,
        is_active      = true
      WHERE id = v_id;
    ELSE
      -- Fresh insert
      INSERT INTO users (email, phone, full_name, password_hash, role, email_verified, is_active)
      VALUES (
        'admin@taskeeu.com', '08012345678', 'Taskeeu Admin',
        '$2b$12$3abdXEYnT5lIoSeqshF1UOUY5X1Ao4UJycfAoYnDSNKpeM1tr1rb.',
        'admin', true, true
      );
    END IF;
  END IF;
END $$;

-- Add withdrawn_at column to payments table for withdrawal tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

-- Track password changes to invalidate old JWT tokens
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- ─── Support Tickets (from support-tickets-schema.sql) ─────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  admin_id UUID REFERENCES users(id),
  admin_notes TEXT
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);

-- ─── Email verification token columns for requester signup ────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

-- ─── Demo Requests (Book a Demo form) ────────────────────────────
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_size TEXT,
  industry TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created ON demo_requests(created_at DESC);

-- ─── Username column ─────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
-- Unique username per role (same username can exist for requester and tasker)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_role ON users(username, role) WHERE username IS NOT NULL;

-- ─── Nigerian Banks Cache ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nigerian_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─── Contact Inquiries ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread', -- unread | read | replied
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_inquiries(created_at DESC);

-- ─── Broadcast Emails Log ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all', -- all | requesters | taskers
  recipient_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RPC: increment_requester_tasks ─────────────────────────────
CREATE OR REPLACE FUNCTION increment_requester_tasks(uid UUID)
RETURNS void AS $$
BEGIN
  UPDATE requester_profiles
  SET total_tasks_posted = total_tasks_posted + 1
  WHERE user_id = uid;
END;
$$ LANGUAGE plpgsql;

-- ─── bank_code column for bank dropdown restoration ───────────────
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);
ALTER TABLE requester_profiles ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);







-- ─── KYC Change Requests ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kyc_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tasker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('kyc_submission', 'edit', 'delete_account')),
  reason TEXT NOT NULL,
  -- For kyc_submission: store the uploaded doc URLs so admin can review
  national_id_url TEXT,
  driver_license_url TEXT,
  passport_url TEXT,
  proof_of_address_url TEXT,
  home_address TEXT,
  social_url TEXT,
  -- Review fields
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_req_tasker ON kyc_change_requests(tasker_id);
CREATE INDEX IF NOT EXISTS idx_kyc_req_status ON kyc_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_kyc_req_type ON kyc_change_requests(request_type);




-- ═══════════════════════════════════════════════════════════════════
-- MIGRATIONS — Run these in Supabase SQL editor
-- All use IF NOT EXISTS / IF EXISTS so safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════

-- Tasker profile additions
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS motivation TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS platform_feedback TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS kyc_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS kyc_submission_status TEXT DEFAULT 'not_submitted';
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);

-- Users additions
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);

-- Requester profile additions
ALTER TABLE requester_profiles ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);

-- RPC for incrementing requester tasks
CREATE OR REPLACE FUNCTION increment_requester_tasks(uid UUID)
RETURNS void AS $$
BEGIN
  UPDATE requester_profiles SET total_tasks_posted = total_tasks_posted + 1 WHERE user_id = uid;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- FLUTTERWAVE MIGRATION — Run in Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════════

-- Flutterwave column additions for payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS flw_reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS flw_transaction_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS flw_link TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NGN';
-- Data migration: copy legacy reference data into flw_reference (one-time, safe to re-run)
UPDATE payments SET flw_reference = paystack_reference WHERE flw_reference IS NULL AND paystack_reference IS NOT NULL;

-- Flutterwave column additions for wallet_transactions
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS flw_reference TEXT;
UPDATE wallet_transactions SET flw_reference = paystack_reference WHERE flw_reference IS NULL AND paystack_reference IS NOT NULL;  -- legacy migration

-- Add country to tasker_profiles
ALTER TABLE tasker_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(5) DEFAULT 'NG';
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(5) DEFAULT 'NG';

-- ── Flutterwave migration for company_subscriptions ──────────────
ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS flw_reference TEXT;
UPDATE company_subscriptions SET flw_reference = paystack_reference WHERE flw_reference IS NULL AND paystack_reference IS NOT NULL;  -- legacy migration

-- ═══════════════════════════════════════════════════════════════════
-- RPC FUNCTION: set_user_country
-- Run this in Supabase SQL editor.
-- Bypasses PostgREST schema cache so country can be set even before
-- the cache is reloaded after ALTER TABLE.
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION set_user_country(p_user_id UUID, p_country TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE users SET country = p_country WHERE id = p_user_id;
  UPDATE tasker_profiles SET country = p_country WHERE user_id = p_user_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- IMPORTANT: Run this after all ALTER TABLE statements to reload
-- Supabase's PostgREST schema cache.
-- ═══════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';
