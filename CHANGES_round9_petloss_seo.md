# Round 9 — Pet-loss landing page + branded-search SEO recovery

Worked entirely on the freshly-attached codebase.

## PART A — New /cards/pet-loss-card page (SEO for pet loss)

People search Google for online group cards for the loss of a pet, so this adds a
dedicated, heavily-optimised page mirroring the leaving-card page.

**Keyword research (Google):** the top themes people search around pet-loss
condolences are — pet sympathy card, pet loss card, loss of pet card, dog sympathy
/ bereavement / memorial card, cat sympathy card, **rainbow bridge card** (the big
emotional anchor), pet condolence / bereavement card, **online / free** pet sympathy
card, **group** pet sympathy card (what SendWishOnline ranks for), pet memorial card,
"what to write / loss of a pet sympathy message", and veterinary/clinic sympathy cards.

**New files**
- `frontend/src/pages/PetLossCardPage.jsx` — full landing page: rainbow-bridge SVG hero
  (self-contained, no external asset to break), empathy intro, dynamic design gallery,
  how-it-works, use-cases (dog / cat / bird / rainbow bridge / clinic / memorial),
  features, "what to write" message samples, 8-question FAQ with FAQPage schema, related
  blog links, and CTAs. Title/description/keywords/canonical all target the pet-loss
  keyword cluster; canonical is `/cards/pet-loss-card`.
- `frontend/src/components/SympathyDesignGallery.jsx` — pulls the TOP sympathy cover
  designs straight from the shared design library (`occasion === 'sympathy'`). **When you
  add more sympathy designs anywhere, this gallery — and the pet-loss page — updates
  automatically.** Selecting a cover opens the customiser with sympathy + that design +
  album layout preselected. 13 sympathy designs flow through today.

**Routing / SEO plumbing**
- `App.jsx` — routes `/cards/pet-loss-card` (primary), plus `/cards/pet-sympathy-card`
  and `/cards/pet-memorial-card` as keyword alternates that canonical-consolidate to the
  primary (no duplicate-content risk; only the primary is in the sitemap).
- `scripts/prerender.js` — added `/cards/pet-loss-card` so Google gets real static HTML
  (title/desc/canonical baked in) instead of an empty SPA shell.
- `public/sitemap.xml` — added `/cards/pet-loss-card` (priority 0.9).

**Blog → page funnel**
- `frontend/src/pages/BlogPost.jsx` — the blog CTA is now occasion-aware: pet-loss posts
  (e.g. `condolence-messages-loss-of-pet`) funnel readers to `/cards/pet-loss-card`;
  other sympathy posts funnel to `/cards/sympathy`; everything else keeps the generic CTA.
- The pet-loss page's "related reading" links to the real existing sympathy posts.

## PART B — Branded-search SEO recovery ("thankeeu" not on page 1)

Investigated why Google doesn't surface the site for the branded query until you type
`thankeeu.com`. Root causes found and fixed:

1. **No apex→www redirect (the big one).** `SEO_RECOVERY.md` and `card-meta.js` both
   *assume* `thankeeu.com` 308-redirects to `www.thankeeu.com`, but nothing enforced it —
   there was no `redirects` block in `vercel.json`. If both hosts answer 200, Google sees
   two competing sites and splits/suppresses the brand. **Added an explicit permanent
   apex→www redirect in `vercel.json`.**

2. **Individual private cards were indexable.** `/card/:slug` and `/sign/:slug` are served
   by the `api/card-meta.js` edge function, which returned indexable, self-canonical HTML
   to Googlebot — thousands of thin, near-duplicate pages diluting site quality and
   burning crawl budget. Fixed:
   - `card-meta.js` now distinguishes **search crawlers** (Googlebot/Bingbot/…) from
     **social crawlers** (WhatsApp/FB/Twitter). Search crawlers get `noindex,follow` (meta
     **and** `X-Robots-Tag` header); social crawlers still get full OG tags so link
     previews keep working.
   - `public/robots.txt` now disallows `/card/` and `/sign/` for all crawlers. (`/cards/`
     marketing pages are unaffected — different prefix.)
   - Fixed an inconsistent Twitter handle in `card-meta.js` (`@thankeeu_ng` → `@thankeeu`).

3. **Three different homepage titles** (index.html vs prerender vs runtime useSEO)
   weakened the brand signal. Aligned all three to
   **"Thankeeu — Group Cards, Gift Pools & Company Workspaces"** (brand-first).

4. **Missing sitelinks search signal.** Added a `SearchAction` (`potentialAction`) to the
   WebSite schema in `useSEO.js`, which reinforces branded results / the sitelinks
   searchbox.

5. **Sitemap/robots conflict.** Removed `/card/new` from the sitemap (it's now under the
   `/card/` disallow, and the `/card/:slug` rewrite would treat "new" as a card slug
   anyway). Sitemap is valid XML.

### Deploy checklist (unchanged pieces still apply from SEO_RECOVERY.md)
1. After deploy, confirm `https://thankeeu.com` 308-redirects to `https://www.thankeeu.com/`.
2. Ensure Vercel env `VITE_APP_URL=https://www.thankeeu.com` and `API_URL` (Railway) are set,
   so canonicals and the blog prerender resolve correctly.
3. In Search Console: resubmit `https://www.thankeeu.com/sitemap.xml`; URL-inspect + Request
   Indexing on the homepage and `/cards/pet-loss-card`.
4. The `noindex` on `/card/*` and `/sign/*` will drop the thin private-card pages from the
   index over the next few crawls, which should recover overall site quality and the brand
   query.

## PART C — Pet-loss blog posts (feed the funnel)

Added 3 SEO blog posts that target the long-tail pet-loss searches and each link
straight to `/cards/pet-loss-card`, so blog readers flow into the new page:

- `database/seed_blog_pet_loss.sql` (idempotent, `ON CONFLICT (slug) DO NOTHING`):
  1. `what-to-write-pet-sympathy-card` — 45 heartfelt messages (dog/cat/rainbow bridge)
  2. `rainbow-bridge-poem-meaning` — meaning, origin and how to use it
  3. `how-to-memorialise-a-pet` — 12 lasting ways to remember them

Each post is tagged pet/dog/cat/rainbow-bridge, so the occasion-aware BlogPost CTA
automatically points these readers to the pet memorial card page. Because
`generate-sitemap.js` (prebuild) and `prerender.js` both pull published slugs from
`/api/blog/sitemap`, these posts auto-enter the sitemap and get prerendered on the
next build once seeded — no manual sitemap edit needed.

### Sitemap generator fixes (important)
`scripts/generate-sitemap.js` runs on every `prebuild` and **regenerates** sitemap.xml
from its own page list, so a manual edit to sitemap.xml alone would be overwritten.
Fixed at the source:
- Added `/cards/pet-loss-card` to the generator's static page list (+ lastmod).
- Removed `/card/new` from the generator (it's now blocked by robots `Disallow: /card/`
  and the `/card/:slug` rewrite would treat "new" as a card slug).

### New deploy step
Run `database/seed_blog_pet_loss.sql` in Supabase once (idempotent). Then the normal
build regenerates the sitemap + prerenders the new posts automatically.

## Validation
- All modified JSX pass esbuild parse; `card-meta.js`, `prerender.js` and
  `generate-sitemap.js` pass `node --check`.
- `vercel.json` is valid JSON; `sitemap.xml` is valid XML.
- `seed_blog_pet_loss.sql`: 3 INSERTs, balanced `$content$` quotes, 13 cols = 13 values,
  8 internal links to `/cards/pet-loss-card`.
- 13 sympathy designs confirmed flowing into the gallery; customize URLs correct.
- Confirmed `/cards/pet-loss-card` is NOT blocked by `Disallow: /card/`.
