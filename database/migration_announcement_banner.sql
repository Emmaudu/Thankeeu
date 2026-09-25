-- Announcement banner (Admin → Discount Codes → Announcement banner).
-- Stored as one JSON row in site_settings; safe to run more than once.
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);
INSERT INTO site_settings (key, value) VALUES ('announcement_banner', NULL)
ON CONFLICT (key) DO NOTHING;
NOTIFY pgrst, 'reload schema';
