-- ════════════════════════════════════════════════════════════════════════════
-- Round 11 — blog posts lead with USD.
--   "₦5,000"       → "$3.15 (₦5,000)"
--   "₦5 million"   → "$3,150 (₦5 million)"
-- Naira stays in brackets so Nigeria-targeted articles keep their keywords.
-- Rate: ₦1 = $0.00063 (same as the app). Also corrects stale Thankeeu fee claims.
-- Idempotent: each post is converted once (tracked in blog_usd_converted).
-- Run in Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blog_usd_converted (
  post_id      UUID PRIMARY KEY,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION tk_usd_label(ngn NUMERIC) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE usd NUMERIC := round(ngn * 0.00063, 2);
BEGIN
  IF usd >= 100 THEN RETURN '$' || to_char(round(usd), 'FM999,999,999,990'); END IF;
  IF usd = trunc(usd) THEN RETURN '$' || trunc(usd)::TEXT; END IF;
  RETURN '$' || to_char(usd, 'FM990.00');
END $$;

CREATE OR REPLACE FUNCTION tk_naira_to_usd_text(src TEXT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  -- ₦A  |  ₦A–B  |  ₦A–₦B, each optionally followed by million/billion/thousand
  -- (a trailing unit applies to both ends: "₦2–4 million").
  pat  TEXT := '(₦ ?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(\.[0-9]+)?(?: ?[–-] ?₦? ?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(\.[0-9]+)?)?( ?(million|billion|thousand)\M)?)';
  rest TEXT := src;
  out  TEXT := '';
  m    TEXT[];
  pos  INT;
  mult NUMERIC;
  lo   NUMERIC;
  hi   NUMERIC;
  lbl  TEXT;
BEGIN
  IF src IS NULL OR strpos(src, '₦') = 0 THEN RETURN src; END IF;

  -- Stale Thankeeu price/fee statements → current prices.
  rest := replace(rest, 'Classic card from £4.99 GBP / ₦5,000 NGN / $5.99 USD', 'Classic card from $3.15 USD / £2.45 GBP');
  rest := replace(rest, 'you only pay ₦1,500 to send it', 'you only pay $3.15 to send it');
  rest := replace(rest, 'anyone can chip in from ₦500', 'anyone can chip in from $1.58');
  rest := replace(rest, 'from ₦500 upwards', 'from ₦2,500 upwards');

  LOOP
    m := regexp_match(rest, pat);
    EXIT WHEN m IS NULL;
    pos  := strpos(rest, m[1]);
    mult := CASE lower(COALESCE(m[7], ''))
              WHEN 'thousand' THEN 1e3 WHEN 'million' THEN 1e6 WHEN 'billion' THEN 1e9 ELSE 1 END;
    lo  := (replace(m[2], ',', '') || COALESCE(m[3], ''))::NUMERIC * mult;
    lbl := tk_usd_label(lo);
    IF m[4] IS NOT NULL THEN
      hi  := (replace(m[4], ',', '') || COALESCE(m[5], ''))::NUMERIC * mult;
      lbl := lbl || '–' || tk_usd_label(hi);
    END IF;
    out  := out || substr(rest, 1, pos - 1) || lbl || ' (' || m[1] || ')';
    rest := substr(rest, pos + length(m[1]));
  END LOOP;
  RETURN out || rest;
END $$;

WITH todo AS (
  SELECT id FROM blog_posts b
   WHERE NOT EXISTS (SELECT 1 FROM blog_usd_converted c WHERE c.post_id = b.id)
     AND (strpos(coalesce(title,''),'₦') > 0 OR strpos(coalesce(excerpt,''),'₦') > 0
       OR strpos(coalesce(content,''),'₦') > 0 OR strpos(coalesce(meta_title,''),'₦') > 0
       OR strpos(coalesce(meta_description,''),'₦') > 0)
), upd AS (
  UPDATE blog_posts b SET
    title            = tk_naira_to_usd_text(title),
    excerpt          = tk_naira_to_usd_text(excerpt),
    content          = tk_naira_to_usd_text(content),
    meta_title       = tk_naira_to_usd_text(meta_title),
    meta_description = tk_naira_to_usd_text(meta_description),
    updated_at       = now()
  FROM todo WHERE b.id = todo.id
  RETURNING b.id
)
INSERT INTO blog_usd_converted (post_id) SELECT id FROM upd ON CONFLICT DO NOTHING;

-- Posts with no naira are marked too, so a re-run never touches them.
INSERT INTO blog_usd_converted (post_id) SELECT id FROM blog_posts ON CONFLICT DO NOTHING;
