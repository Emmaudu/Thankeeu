-- Fix: ensure confirm_token column exists on blog_subscribers
-- The column was defined inside CREATE TABLE IF NOT EXISTS, but if the
-- table was already created before this column was added, the entire
-- CREATE TABLE is skipped and the column never gets created.
ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS confirm_token TEXT;

-- Index for fast token lookups (idempotent)
CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirm_token
  ON blog_subscribers(confirm_token) WHERE confirm_token IS NOT NULL;
