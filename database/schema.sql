-- Thankeeu Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CARD OCCASIONS ENUM
CREATE TYPE occasion_type AS ENUM (
  'birthday', 'valentine', 'leaving', 'anniversary', 'wedding',
  'baby_shower', 'retirement', 'congratulations', 'christmas',
  'new_year', 'promotion', 'graduation', 'get_well', 'other'
);

-- CARD STATUS ENUM
CREATE TYPE card_status AS ENUM ('draft', 'active', 'sent', 'expired');

-- CARDS TABLE
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  occasion occasion_type NOT NULL,
  title TEXT NOT NULL,
  design_theme TEXT DEFAULT 'rose_love',
  background_color TEXT DEFAULT '#FBEAF0',
  status card_status DEFAULT 'draft',
  is_gift_enabled BOOLEAN DEFAULT FALSE,
  gift_type TEXT DEFAULT 'pot' CHECK (gift_type IN ('pot', 'flowers', 'voucher', 'none')),
  suggested_amount INTEGER DEFAULT 2500,
  total_collected INTEGER DEFAULT 0,
  send_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  allow_private_messages BOOLEAN DEFAULT TRUE,
  send_reminders BOOLEAN DEFAULT TRUE,
  hide_amounts BOOLEAN DEFAULT FALSE,
  access_token TEXT UNIQUE DEFAULT uuid_generate_v4()::TEXT,
  recipient_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES TABLE
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'voice', 'gif', NULL)),
  reactions JSONB DEFAULT '{"heart": 0}',
  contributed_amount INTEGER DEFAULT 0,
  payment_reference TEXT,
  payment_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIFT CONTRIBUTIONS TABLE
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  contributor_name TEXT NOT NULL,
  contributor_email TEXT,
  amount INTEGER NOT NULL,
  paystack_reference TEXT UNIQUE,
  paystack_access_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CARD CREDITS TABLE (for pack purchases)
CREATE TABLE card_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credits_remaining INTEGER DEFAULT 0,
  paystack_reference TEXT,
  plan_type TEXT CHECK (plan_type IN ('single', 'pack5', 'business')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REACTIONS TABLE
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reactor_name TEXT,
  emoji TEXT DEFAULT 'heart',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMIN STATS VIEW
CREATE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM cards) AS total_cards,
  (SELECT COUNT(*) FROM cards WHERE status = 'active') AS active_cards,
  (SELECT COUNT(*) FROM cards WHERE status = 'sent') AS sent_cards,
  (SELECT COALESCE(SUM(amount), 0) FROM contributions WHERE status = 'success') AS total_revenue,
  (SELECT COUNT(*) FROM contributions WHERE status = 'success') AS total_contributions,
  (SELECT COUNT(*) FROM messages) AS total_messages;

-- INDEXES
CREATE INDEX idx_cards_slug ON cards(slug);
CREATE INDEX idx_cards_creator ON cards(creator_id);
CREATE INDEX idx_cards_access_token ON cards(access_token);
CREATE INDEX idx_messages_card ON messages(card_id);
CREATE INDEX idx_contributions_card ON contributions(card_id);
CREATE INDEX idx_contributions_reference ON contributions(paystack_reference);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update total_collected on card when contribution is verified
CREATE OR REPLACE FUNCTION update_card_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    UPDATE cards SET total_collected = total_collected + NEW.amount
    WHERE id = NEW.card_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contribution_verified AFTER UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION update_card_total();
