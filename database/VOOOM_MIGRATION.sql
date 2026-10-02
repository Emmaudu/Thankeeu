-- ============================================================
-- VOOOM LOGISTICS MIGRATION
-- Run once in Supabase SQL Editor.
-- Vooom is Taskeeu's peer logistics network — post a journey,
-- find someone already going your way.
-- ============================================================

CREATE TABLE IF NOT EXISTS vooom_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Journey route
  from_city VARCHAR(120) NOT NULL,
  from_state VARCHAR(120) NOT NULL,
  from_country VARCHAR(120) DEFAULT 'Nigeria',
  to_city VARCHAR(120) NOT NULL,
  to_state VARCHAR(120) NOT NULL,
  to_country VARCHAR(120) DEFAULT 'Nigeria',

  -- Journey details
  travel_date TIMESTAMPTZ NOT NULL,
  vehicle_type VARCHAR(60) NOT NULL
    CHECK (vehicle_type IN ('any','car','truck','van','motorcycle','bus','flight','ship')),
  item_type VARCHAR(100) NOT NULL,
  item_description TEXT NOT NULL,
  proposed_price DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'NGN',

  -- Status
  status VARCHAR(30) DEFAULT 'open'
    CHECK (status IN ('open','bidding','ongoing','completed','cancelled')),
  accepted_tasker_id UUID REFERENCES users(id),

  -- Meta
  is_international BOOLEAN DEFAULT false,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vooom_tasks_status ON vooom_tasks(status);
CREATE INDEX IF NOT EXISTS idx_vooom_tasks_from ON vooom_tasks(from_city, from_state);
CREATE INDEX IF NOT EXISTS idx_vooom_tasks_to ON vooom_tasks(to_city, to_state);
CREATE INDEX IF NOT EXISTS idx_vooom_tasks_date ON vooom_tasks(travel_date);
CREATE INDEX IF NOT EXISTS idx_vooom_tasks_requester ON vooom_tasks(requester_id);
ALTER TABLE vooom_tasks DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS vooom_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vooom_task_id UUID NOT NULL REFERENCES vooom_tasks(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vooom_task_id, tasker_id)
);

CREATE INDEX IF NOT EXISTS idx_vooom_bids_task ON vooom_bids(vooom_task_id);
CREATE INDEX IF NOT EXISTS idx_vooom_bids_tasker ON vooom_bids(tasker_id);
ALTER TABLE vooom_bids DISABLE ROW LEVEL SECURITY;

-- Track whether a user has a dual account (tasker + requester)
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_requester_account BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_tasker_account BOOLEAN DEFAULT false;

NOTIFY pgrst, 'reload schema';

-- ── Allow chat rooms to be linked to Vooom tasks (separate from regular tasks) ──
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS vooom_task_id UUID REFERENCES vooom_tasks(id) ON DELETE SET NULL;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS task_title VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_vooom ON chat_rooms(vooom_task_id);

NOTIFY pgrst, 'reload schema';

-- ── Fix payments table to support Vooom payments ──────────────────
-- Add vooom_task_id column (nullable FK to vooom_tasks)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vooom_task_id UUID REFERENCES vooom_tasks(id) ON DELETE SET NULL;

-- Expand payment_type CHECK to include 'vooom'
-- Postgres doesn't support ALTER CONSTRAINT directly, so we drop and re-add
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN ('workmanship','equipment','shipment','refund','full','vooom'));

CREATE INDEX IF NOT EXISTS idx_payments_vooom ON payments(vooom_task_id);

NOTIFY pgrst, 'reload schema';

-- ── Prevent duplicate chat rooms for the same vooom task + participants ──
-- Postgres NULL != NULL so the existing UNIQUE(task_id, requester_id, tasker_id)
-- doesn't protect vooom rooms where task_id IS NULL.
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_rooms_vooom_unique
  ON chat_rooms(vooom_task_id, requester_id, tasker_id)
  WHERE vooom_task_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
