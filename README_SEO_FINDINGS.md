# Search Console coverage report — findings and fix

## What the data actually showed
- 196 pages indexed, 100 not indexed as of Aug 7
- Critical issues breakdown: 93 "Discovered - currently not indexed", 2 "Not found (404)",
  2 "Alternate page with proper canonical tag", 1 "Soft 404", 1 "Page with redirect"

## What I checked and ruled out
1. **Sitemap-to-route mismatch**: verified programmatically (regex-matched all 92 sitemap
   URLs against every React Router route, including dynamic segments). Zero mismatches.
   This is NOT the cause of the 404s.
2. **Internal linking (mostly fine, one real gap found)**: Footer.jsx already links to
   ~111 destinations and Navbar to 22. Only 15 of 92 sitemap pages had NO internal link
   pointing to them anywhere on the site (true orphan pages, only reachable via sitemap).
   FIXED — see below.
3. **Soft 404**: the SPA's catch-all 404 page (NotFound.jsx) already correctly sets
   `noIndex: true`. Because Vercel's SPA rewrite serves HTTP 200 for all unmatched
   paths (this is inherent to client-side-rendered React apps), Google classifies a
   genuinely-missing page as "soft 404" instead of a true 404 — but the noindex tag
   means Google still excludes it correctly. This is expected SPA behavior, not a bug.
4. **Blog content quality**: fetched a live blog post directly. Confirmed full
   server-rendered SEO metadata (canonical, meta robots index,follow, complete OG tags)
   and substantive, unique long-form content — not thin/templated. Blog is not the
   problem.

## The real, data-confirmed issue
Re-reading Chart.csv closely: before 2026-07-25, every submitted page indexed almost
immediately (5 -> 121 indexed within a day). On 2026-07-25 a large batch of ~98 new
URLs appeared (this lines up with the SEO/GEO landing-page expansion). Since then
(13 days, 07-25 to 08-07), only 3 of those ~98 pages have moved from "not indexed" to
"indexed" — a real slowdown for that specific batch, not a stuck-forever situation but
a meaningfully slow one.

## Fix applied
Added the 15 orphaned sitemap pages into Footer.jsx's existing link columns
(USE_CASE_COL1, USE_CASE_COL3, and the Comparisons section) so every sitemap URL now
has at least one real internal link pointing to it, site-wide, on every page. Verified
programmatically: 0 orphaned sitemap pages remain after the fix.

Full production build (vite build) and full test suite (211 tests) both pass with this
file in place.

## What I could NOT fix from this export
The GSC Coverage export only gave aggregate counts per issue type, not the actual
affected URLs. To fix the 2 real 404s, 1 soft-404 page, and 1 redirect entry precisely,
open Search Console → Indexing → Pages → click each issue row → export the URL list.
Once you have those specific URLs, send them over and I can trace and fix each one
exactly (broken link source, correct redirect target, etc.) rather than guessing.

## What to do next
1. Deploy this Footer.jsx.
2. Pull the exact URL lists for the 4 specific error types from Search Console (5 min).
3. Use URL Inspection → Request Indexing on your 10-15 highest-value landing pages from
   the stalled batch to push them to the front of the crawl queue.
4. Re-check the Coverage report in ~2-3 weeks to see if the fix improved crawl velocity
   for the previously-orphaned pages.
