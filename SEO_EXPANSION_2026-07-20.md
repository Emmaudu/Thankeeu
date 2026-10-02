# SEO/GEO Expansion — 2026-07-20

15 new landing pages targeting real, researched keyword gaps, plus GEO
(generative engine / AI-search) optimization. Verified with a full
`vite build` — all 15 pages prerendered correctly with server-rendered
meta tags (confirmed by inspecting the generated HTML), sitemap.xml
validated as well-formed XML with all new URLs, robots.txt updated.

## Keyword research summary

Researched via live web search (not assumed) across: general "errand
service/runner Nigeria" search competitors, Jiji's actual market position,
diaspora-specific errand competitors, and city-level local landmarks for
factual accuracy in new city pages.

**Direct competitors found:** helpmewaka.com, errandboynigeria.com,
errand.ng, errands.ng, Errand Angels, SendZira, Teereny — all smaller,
none with Taskeeu's escrow + identity verification + real-time tracking
combination as their core differentiator.

**Jiji's actual position:** a general classifieds marketplace (not a task
platform), #42 most-visited site in Nigeria by traffic, with a "Services"
category where anyone can post an ad with zero vetting. This is the basis
for the `/vs/jiji` comparison page — a factual, non-defamatory comparison
of what each platform structurally does and doesn't offer (verification,
escrow, tracking), with a disclaimer noting individual listings may vary.

**Gap analysis:** Taskeeu already had strong coverage for Lagos, Abuja,
Port Harcourt, Ibadan, Kano, plus a generic /diaspora page and 12 service
categories. The gaps were: 10 major Nigerian cities with real errand
demand and zero landing page, diaspora traffic not split by country
(UK/USA/Canada each have distinct search volume and competitors target
them separately), no direct Jiji-competitive page, and no dedicated
"near me" / city-directory page for that high-volume search modifier.

## New pages (15)

**10 new city pages** (`/errands/<city>`) — Benin City, Enugu, Warri,
Owerri, Calabar, Uyo, Ilorin, Abeokuta, Onitsha, Jos. Each follows the
exact structure of the existing `ErrandsIbadan.jsx` template, but with
genuinely distinct, fact-checked local content per city (real market
names, university names, government office references) rather than
templated filler — thin near-duplicate content across city pages actively
hurts SEO, so each city's markets/landmarks were verified via search
rather than invented.
Generated via `frontend/scripts/gen-city-pages.cjs` (kept in the repo in
case you want to add more cities later — edit the `CITIES` array and
re-run).

**3 diaspora country pages** (`/diaspora/uk`, `/diaspora/usa`,
`/diaspora/canada`) — split out from the generic `/diaspora` page to
capture country-specific search intent, each with a time-zone-appropriate
angle (e.g. UK is ~1hr from Nigeria time; US/Canada errands can be posted
before bed and completed while you sleep).
Generated via `frontend/scripts/gen-diaspora-pages.cjs`.

**`/vs/jiji`** — a fully custom page (not the generic template) with a
real head-to-head comparison table, styled consistently with the existing
comparison table pattern already used on `/pricing`. Includes FAQ schema
answering "is Jiji safe for errands", "Jiji alternative", etc. — these are
real search queries people type when frustrated with classifieds-based
services.

**`/errand-runner-near-me`** — a hub/directory page targeting the
high-volume "near me" search modifier. Links out to all 15 city pages
(existing 5 + new 10), which also solves an internal-linking need: the
new city pages needed inbound links from somewhere other than just the
`/errands` hub's `relatedLinks` list.

## Wiring (so these pages are actually reachable and indexable)

- `frontend/src/App.jsx` — 15 new lazy-loaded routes registered.
- `frontend/scripts/prerender.js` — 15 new entries so each page gets
  server-rendered `<title>`/`<meta description>` at build time (verified
  by inspecting `dist/errands/onitsha/index.html` etc. after a real build
  — correct title/description present in the static HTML, not just in the
  React component).
- `frontend/public/sitemap.xml` — 15 new `<url>` entries. Validated as
  well-formed XML (65 total URLs).
- `frontend/public/robots.txt` — new pages added to the explicit `Allow`
  list.
- `frontend/src/pages/services/Errands.jsx` — `relatedLinks` now includes
  the near-me hub, `/vs/jiji`, and several new city pages.
- `frontend/src/pages/services/Diaspora.jsx` — `relatedLinks` now includes
  the 3 new country pages.
- `frontend/src/components/layout/Footer.jsx` — added a link to the
  near-me hub in the sitewide footer (Services column), so the new city
  pages have a path to them from every single page on the site.

## GEO (AI answer-engine) optimization

- `frontend/public/robots.txt` — added explicit `Allow` rules for
  GPTBot, ChatGPT-User, ClaudeBot, Claude-User, anthropic-ai,
  PerplexityBot, Google-Extended, CCBot, Bytespider. (`Allow: /` under
  `User-agent: *` already permitted these; the explicit entries are a
  belt-and-suspenders signal, standard current practice.)
- `frontend/public/llms.txt` (new) — a plain-language summary of what
  Taskeeu does, its differentiation from classifieds sites like Jiji, and
  a full list of key/city/diaspora pages — the same pattern already used
  on your Thankeeu deployment, adapted for Taskeeu.
- Every new page has FAQ schema (`makeFAQSchema`) answering the exact
  phrasing people ask AI assistants ("is Jiji safe", "how do I find an
  errand runner near me", "how much does an errand runner cost in
  [city]") — this is what AI answer engines pull from when citing a
  source.

## Manual steps

- None required for the pages themselves — this is all static
  frontend code, no database or env changes.
- Recommended (not required): submit the updated sitemap.xml in Google
  Search Console so the 15 new URLs get crawled faster rather than
  waiting for organic discovery.
