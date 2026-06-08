-- Run this in Supabase SQL Editor to add all missing columns
-- Safe to run multiple times (IF NOT EXISTS)

-- Cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'elegant';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS created_by_member_id UUID;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS notification_scope TEXT;

-- Messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'handwritten';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Support tickets table (create if not exists)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'company', 'member')),
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_reply TEXT,
  admin_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sender ON support_tickets(sender_id);

-- Gift withdrawal tracking on cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_withdrawn BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_withdrawn_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_payout_reference TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS gift_payout_amount INTEGER;

-- Received cards table (for email-matched and transferred cards)
CREATE TABLE IF NOT EXISTS received_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transferred_by UUID REFERENCES users(id),
  transferred_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  UNIQUE(card_id, recipient_user_id)
);
CREATE INDEX IF NOT EXISTS idx_received_cards_user ON received_cards(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_received_cards_card ON received_cards(card_id);

-- Username on users (if not already)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Company members username
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE company_members ADD COLUMN IF NOT EXISTS phone TEXT;
