-- Admin-uploaded cover designs. Lets the admin dashboard bulk-upload cover
-- images per occasion instead of editing static frontend files by hand.
--
-- Queue ordering: newest uploads should appear FIRST wherever designs are
-- shown, ahead of both older uploads and the existing static/built-in
-- designs. This is achieved purely by created_at DESC — no separate
-- "sort_order" column is needed, which keeps this simple and avoids a class
-- of reorder-related bugs (stale positions, gaps, concurrent-write races).
-- Within a single bulk upload of N files, insertion order is preserved by
-- giving each row a created_at a few milliseconds after the previous one,
-- so file #1 in the batch still sorts above file #2, etc.

CREATE TABLE IF NOT EXISTS cover_designs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion            TEXT NOT NULL,
  name                TEXT,
  image_url           TEXT NOT NULL,
  cloudinary_public_id TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  uploaded_by_admin_id UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every read is "give me active designs for this occasion, newest first" —
-- this composite index serves that query directly without a sort step.
CREATE INDEX IF NOT EXISTS idx_cover_designs_occasion_active_created
  ON cover_designs (occasion, is_active, created_at DESC);
