-- ══════════════════════════════════════════════════════════════════════════
-- migration_reminder_and_activity_fixes.sql
-- Adds columns required by the reminder-system and automation fixes.
-- Safe to run multiple times.
-- ══════════════════════════════════════════════════════════════════════════

-- Tracks whether the 48hr-before-deadline reminder has already been sent
-- for this card, so the 8am cron doesn't email people every day until the
-- deadline.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS deadline_reminded BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_cards_deadline_reminded
  ON cards(deadline_reminded) WHERE status = 'active';

-- Marks when the mid-period reminder was sent for a card. Used primarily by
-- the shared company-wide cards (Valentine's Day, Workers' Day) as a
-- company-level dedup flag — per-member occasion_tracking can't be used here
-- because every member has their own independent tracking object, so each
-- member would otherwise trigger a duplicate round of reminder emails.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS mid_reminded_at TIMESTAMPTZ;
