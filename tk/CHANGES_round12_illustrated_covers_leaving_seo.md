# Round 12 — 219 illustrated covers first everywhere + leaving-card SEO fix

## ⚠️ Deploy notes (read first)
1. MERGE, don't replace, `frontend/public/cards/`. This upload never contained your
   existing `public/cards/priority/` and `public/cards/leaving/` image folders — they
   are only in your live repo. Only `public/cards/illustrated/` is new.
2. Run `database/migration_leaving_card_seo_consolidation.sql` in Supabase (safe to re-run).
3. After deploy, in Search Console: URL Inspection → `/cards/leaving-card` → Test live URL
   → Request indexing. Resubmit `sitemap.xml`. `/leaving-cards-uk` now 301s to it.

## Covers
- `public/cards/illustrated/<folder>/*.svg` — all 219 covers. Nunito (OFL) subset embedded
  per file: without it, browsers draw the lettering in Times inside <img>. Art untouched.
- `utils/illustratedCoverRows.js` (generated) + `utils/illustratedCardDesigns.js`.
  Folder → occasion: farewell→leaving, get-well→get_well, thank-you→thank_you,
  sympathy-colleague/partner/tears/pet→sympathy (ordered general → partner → comfort → pet).
  First 10 per folder are hand-curated lead covers (used on landing pages).
- `finishedArt` covers: no scrim/occasion chip/caption over the art; title/name/sender
  overlays default to hidden (they'd sit on the artwork — no free band exists), creators
  can switch them on in the cover studio; the name starts in the only free band (top edge).
- Order everywhere: new covers → admin uploads → older catalogue. Wizards pre-select
  "Happy birthday!" (b1-cake). Old/unknown design ids keep their previous fallback.
- Landing pages now showing new covers: home (10, one per occasion + hero albums),
  /cards/leaving-card (moved up, under the hero), gallery, /occasions/farewell, birthday,
  retirement, anniversary, promotion, graduation, staff appreciation, get well, thank you,
  Christmas, sympathy, pet loss (x3 URLs), wedding group card, UK/US/CA/NG country pages,
  8 keyword pages, the Rich pages (birthday UK/Nigeria, wedding, online group card),
  /cards/create library (mixed on "All", new stays first on "Newest").
- No matching folder → unchanged: baby shower, maternity, welcome, engagement, good luck,
  mother's/father's day, new home, new baby pages.

## Blog
- `components/BlogCoverStrip.jsx` + `utils/blogCoverMatch.js`: 4 matching covers inserted
  after the intro (or after the first section) of every matching post, live and future
  (incl. Christmas posts). Matching uses title + slug only, most specific first;
  romantic anniversary covers never go on work-anniversary posts. Posts with no genuine
  match show nothing. Reviewed against all 188 seeded posts.

## Leaving-card SEO (why it dropped + fixes)
- `/leaving-cards-uk` shared 67% of its text (same hero headline) with /cards/leaving-card,
  tagged en-GB, near-identical title → duplicate/cannibalisation. Now 301 → /cards/leaving-card
  (vercel.json + SPA route); removed from sitemap/prerender; footer link repointed.
- H1 had no keyword ("Their last day deserves…"). H1 is now "Online Leaving Cards for
  Colleagues · UK, US & Global" (same look; big line kept as a paragraph). Two H2s reworded.
- Static HTML and React page had different titles/descriptions → unified (≤160 chars).
- FAQPage JSON-LD didn't match the visible FAQ (and still said NGN 5,000) → one shared list.
- Prerendered HTML now lists the 10 lead leaving covers with alt text.
- Blog `/blog/online-leaving-card-uk` competed (same title, no link to the page) → retitled
  "Paper vs Online Leaving Cards…" + contextual link (migration above).
- Tests: `src/tests/leaving-page-seo.test.js` fails if these drift again.

---
# Round 12b — Canadian (CAD) payments

- BUG: frontend FLW_CURRENCIES lacked CAD, so gift contributions in CAD were silently
  charged in NGN (shown "C$", charged "₦" — commonly declined by Canadian banks). Fixed.
- NEW backend/utils/flwCurrency.js:
  - FLW_DISABLED_CURRENCIES env (e.g. `CAD`) → those currencies are charged in USD
    everywhere (card fee, credit packs, gift contributions). No redeploy needed.
  - Card fee + credit packs: if Flutterwave explicitly rejects a non-NGN/USD currency,
    retry once in USD (meta updated so verification still passes). Never retries on
    timeouts. Previously a rejection threw → customer saw a generic 500.
- Company subscriptions still charge NGN only (unchanged; see notes in chat).
- tests/unit/flw-currency.test.js.
