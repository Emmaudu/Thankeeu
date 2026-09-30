-- ══════════════════════════════════════════════════════════════════════════
-- migration_member_status_enum.sql
-- RUN THIS FILE ALONE, BY ITSELF, in Supabase SQL Editor.
-- Do NOT paste it together with other SQL — PostgreSQL requires enum value
-- additions to be committed in their own transaction before they can be used.
--
-- What this does:
--   Adds 'deactivated' and 'suspended' to the member_status enum so that:
--   - HRIS-terminated employees can be stored as 'deactivated'
--   - The cron and notify queries work without "invalid input value for enum" errors
-- ══════════════════════════════════════════════════════════════════════════

ALTER TYPE member_status ADD VALUE IF NOT EXISTS 'deactivated';
ALTER TYPE member_status ADD VALUE IF NOT EXISTS 'suspended';

-- Confirm all values now present:
SELECT unnest(enum_range(NULL::member_status)) AS member_status_values;
