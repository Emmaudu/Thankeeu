-- ════════════════════════════════════════════════════════════════════════════
-- Signature drafts.
-- While someone signs a group card, their message, name, email and attached
-- files are saved here every
-- few seconds and again when the page is closed. If they leave before their
-- signature is submitted, the draft stays here so an admin can post it for
-- them (Admin → Cards → card details → Signature drafts).
-- A draft is marked 'posted' as soon as the real signature is saved.
-- Only the backend (service key) reads or writes this table.
-- Safe to run more than once. Run in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS signature_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id       UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  draft_key     TEXT NOT NULL,                 -- random, made by the signer's browser
  author_name   TEXT,
  author_email  TEXT,
  content       TEXT NOT NULL,
  is_private    BOOLEAN NOT NULL DEFAULT false,
  font_style    TEXT,
  extra         JSONB NOT NULL DEFAULT '{}'::jsonb,  -- layout hints (album page, colours)
  has_media     BOOLEAN NOT NULL DEFAULT false,      -- signer had attached files (not saved in a draft)
  gift_intent   NUMERIC(14,2),                       -- NGN gift they had chosen, if any (never charged)
  status        TEXT NOT NULL DEFAULT 'draft',
  message_id    UUID,
  posted_by     TEXT,                                -- 'signer' or 'admin'
  posted_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE signature_drafts DROP CONSTRAINT IF EXISTS signature_drafts_status_check;
ALTER TABLE signature_drafts ADD CONSTRAINT signature_drafts_status_check
  CHECK (status IN ('draft', 'posting', 'posted', 'discarded'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_signature_drafts_key ON signature_drafts (draft_key);
CREATE INDEX IF NOT EXISTS idx_signature_drafts_card_status ON signature_drafts (card_id, status, updated_at DESC);

-- No public access: RLS on, no policies. The backend's service key bypasses RLS.
ALTER TABLE signature_drafts ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

-- Attached files (uploaded while the person was signing) and gift details.
ALTER TABLE signature_drafts ADD COLUMN IF NOT EXISTS media JSONB NOT NULL DEFAULT '[]'::jsonb;
NOTIFY pgrst, 'reload schema';
