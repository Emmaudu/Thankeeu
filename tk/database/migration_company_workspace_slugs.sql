-- Company workspace subdomains
-- Run this in Supabase before deploying the subdomain routing changes.

ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug TEXT;

WITH base_slugs AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        regexp_replace(
          regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'),
          '(^-|-$)',
          '',
          'g'
        ),
        ''
      ),
      'company'
    ) AS base_slug
  FROM companies
  WHERE slug IS NULL OR slug = ''
),
numbered AS (
  SELECT
    id,
    CASE
      WHEN row_number() OVER (PARTITION BY base_slug ORDER BY id) = 1 THEN base_slug
      ELSE base_slug || '-' || row_number() OVER (PARTITION BY base_slug ORDER BY id)
    END AS slug
  FROM base_slugs
)
UPDATE companies c
SET slug = numbered.slug
FROM numbered
WHERE c.id = numbered.id;

UPDATE companies
SET slug = slug || '-company'
WHERE slug IN ('admin', 'api', 'app', 'assets', 'blog', 'cdn', 'company', 'help', 'mail', 'support', 'www');

ALTER TABLE companies
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_slug_format_check;

ALTER TABLE companies
  ADD CONSTRAINT companies_slug_format_check
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug_unique ON companies(slug);
