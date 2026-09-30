-- ════════════════════════════════════════════════════════════════════════════
-- Leaving-card SEO consolidation (2026-09-30)
--
-- /cards/leaving-card is the page that should rank for "online leaving card".
-- The blog post /blog/online-leaving-card-uk had an almost identical title
-- ("Online Leaving Cards UK — Virtual Leaving Cards for Every Colleague") and
-- never linked to /cards/leaving-card, so it competed with the page instead of
-- supporting it. This:
--   1. retitles the post as the guide it is (paper vs online) — only if the
--      title is still the original, so a title edited in the admin is kept;
--   2. adds one contextual link to /cards/leaving-card at the end — only if
--      the post doesn't already link there.
-- Safe to run more than once. Run in Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════════

UPDATE blog_posts
   SET title      = 'Paper vs Online Leaving Cards — Why UK Teams Are Switching',
       meta_title = 'Paper vs Online Leaving Cards — Why UK Teams Are Switching | Thankeeu',
       updated_at = now()
 WHERE slug = 'online-leaving-card-uk'
   AND title = 'Online Leaving Cards UK — Virtual Leaving Cards for Every Colleague';

UPDATE blog_posts
   SET content    = content || '<p>Ready to send one? <a href="/cards/leaving-card">Create an online leaving card</a> the whole team can sign from one link — free to start.</p>',
       updated_at = now()
 WHERE slug = 'online-leaving-card-uk'
   AND content NOT LIKE '%href="/cards/leaving-card"%';
