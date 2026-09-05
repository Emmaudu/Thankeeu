-- Quick-start accounts for free test cards.
--
-- A visitor who chooses "test card" gives only an email address. The account is
-- created for them and signed in immediately, with a RANDOM password they never
-- see (see authController.quickStart). These two columns let us find those
-- accounts later and nag them, once a day for two days, to set a password of
-- their own.
--
-- Safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_set_password    BOOLEAN     DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_nudge_count SMALLINT    DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_nudged_at   TIMESTAMPTZ;

-- The nightly sweep looks up exactly this set, so keep it cheap.
CREATE INDEX IF NOT EXISTS users_must_set_password_idx
  ON users (must_set_password, password_nudged_at)
  WHERE must_set_password = TRUE;

COMMENT ON COLUMN users.must_set_password IS
  'TRUE for accounts created by the test-card quick start, which have a random password the user has never seen. Cleared when they set one.';
COMMENT ON COLUMN users.password_nudge_count IS
  'How many "set your password" reminders have been sent. Capped at 2 (one per day for two days).';
