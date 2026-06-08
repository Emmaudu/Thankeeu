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
