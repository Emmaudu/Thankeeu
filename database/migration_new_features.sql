-- Run this in Supabase SQL Editor to enable all new features

-- 1. Username on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Card fields
ALTER TABLE cards ADD COLUMN IF NOT EXISTS send_time TIME; -- time of day for delivery
ALTER TABLE cards ADD COLUMN IF NOT EXISTS deadline_time TIME; -- time for reminder deadline
ALTER TABLE cards ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ; -- when recipient opened
ALTER TABLE cards ADD COLUMN IF NOT EXISTS opened_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS schedule_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS send_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS never_expire BOOLEAN DEFAULT TRUE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS created_by_member_id UUID;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS notification_scope TEXT;

-- 3. Received cards (transferred card boxes)
CREATE TABLE IF NOT EXISTS received_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transferred_by UUID REFERENCES users(id),
  transferred_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  UNIQUE(card_id, recipient_user_id)
);

-- 4. Pending card signers (people invited to sign who have accounts)
CREATE TABLE IF NOT EXISTS card_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, email)
);

-- 5. Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  occasion TEXT NOT NULL,
  occasion_date DATE NOT NULL,
  frequency TEXT DEFAULT 'yearly' CHECK (frequency IN ('daily','weekly','bi-weekly','monthly','quarterly','yearly','once')),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_reminded_at TIMESTAMPTZ,
  next_remind_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_next ON reminders(next_remind_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_received_cards_user ON received_cards(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_card_invites_email ON card_invites(email);
CREATE INDEX IF NOT EXISTS idx_card_invites_user ON card_invites(user_id);

-- 6. Messages: allow multiple media per message (media gallery)
CREATE TABLE IF NOT EXISTS message_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'voice', 'gif')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_media ON message_media(message_id);
