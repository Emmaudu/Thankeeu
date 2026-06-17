-- ════════════════════════════════════════════════════════════════════════
-- SEED: permanent demo card for the homepage "Try our demo card" link
-- Run in Supabase SQL Editor → New Query → Run
-- Safe to run multiple times (checks for existing slug first).
--
-- This creates a real, persistent, viewable card at /sign/demo-thankeeu-card
-- with a few sample messages already on it — the same pattern GroupCards
-- and Thankbox use for their own homepage demo links. Without this, the
-- "Try our demo card" CTA on the homepage points at a slug that doesn't
-- exist.
-- ════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_card_id UUID;
BEGIN
  -- Only seed if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM cards WHERE slug = 'demo-thankeeu-card') THEN

    INSERT INTO cards (
      slug, creator_id, recipient_name, recipient_email, occasion, title,
      design_theme, background_color, status, is_gift_enabled, gift_type,
      suggested_amount, allow_private_messages, send_reminders, hide_amounts
    ) VALUES (
      'demo-thankeeu-card', NULL, 'Adaeze', NULL, 'leaving',
      'Happy Farewell, Adaeze! 🎉',
      'rose_love', 'linear-gradient(145deg, #fff1f5 0%, #fce7f3 45%, #ede9fe 100%)',
      'active', TRUE, 'pot', 2500, TRUE, FALSE, FALSE
    )
    RETURNING id INTO v_card_id;

    INSERT INTO messages (card_id, author_name, content, font_style, reactions, created_at) VALUES
      (v_card_id, 'Tunde', 'Adaeze, it has genuinely not been the same energy in the office without you these past few weeks already knowing you''re leaving 😂 Go be amazing out there!', 'handwritten', '{"heart": 12}', NOW() - INTERVAL '3 days'),
      (v_card_id, 'Folake', 'Working with you taught me so much — your patience with the new hires alone deserves an award. We''ll miss you loads. Stay in touch!', 'elegant', '{"heart": 8}', NOW() - INTERVAL '2 days'),
      (v_card_id, 'Chidi', 'Remember the Lagos traffic stories we used to swap every Monday? Going to miss those way more than I expected. Best of luck at the new place 🚀', 'modern', '{"heart": 15}', NOW() - INTERVAL '1 day'),
      (v_card_id, 'Ngozi', 'You made every project deadline feel less terrifying somehow. Thank you for everything, and congratulations on the new role!! 🎉💜', 'calligraphy', '{"heart": 20}', NOW() - INTERVAL '6 hours');

  END IF;
END $$;

-- Verify
SELECT slug, title, status FROM cards WHERE slug = 'demo-thankeeu-card';
SELECT author_name, content FROM messages
WHERE card_id = (SELECT id FROM cards WHERE slug = 'demo-thankeeu-card')
ORDER BY created_at;
