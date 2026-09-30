
## Round 13 — Scheduled delivery reliability (2026-09-30)
Root causes found and fixed:
1. Backend could die permanently (Railway restart limit 3, no unhandledRejection handler) → restart ALWAYS + crash handlers.
2. `recipient_notified` NULL rows never matched the sweep → NULL-tolerant queries + migration making it NOT NULL.
3. Scheduled cards with no recipient email were skipped silently forever → email now required when a date is set; creator alerted within a minute.
4. Unpaid (pay-later) cards held with late/no notice → "on hold" email within a minute, even past the reminder cap.
5. Failed schedule save still launched the card → now blocks launch.
6. Date picker min used UTC date (US evenings couldn't pick today) → recipient/browser zone.
7. Member occasions page sent local time as UTC → converted.
8. Partial updates lost the time (ISO instant / time-only edit) → `utils/schedule.js`.
9. Two instances could both email the recipient → claim checks rows changed.
10. Sweep query depended on an unused users join → removed.
New: `GET /api/internal/delivery-status` (x-admin-secret), `/health` shows last sweep.
Deploy: run `database/migration_delivery_reliability.sql`; optional `database/optional_delivery_heartbeat.sql`.

## Round 14 — Landing pages on the homepage layout (2026-09-30)
- /online-group-cards-uk, -us, -canada and -nigeria render the homepage (pages/Home.jsx `landing` prop) with their own title, meta, H1, hero copy, 10 cover categories and FAQs (data/countryLandings.js).
- /online-group-cards-nigeria keeps its URL but is now a global, USD page (no Nigeria/Naira copy; removed from the en-NG hreflang cluster).
- 25 wedding pages (/occasions/wedding, guestbooks, photo sharing, gift pot, GuestPix/Kululu/POV/GuestCam/WedUploader alternatives, vs Wedtrove, best apps, memory wall, QR code) render the homepage with wedding-only copy: static wedding hero (no rotating words), wedding album stack, 10 wedding covers, comparison tables and page-specific FAQs (data/weddingLandings.js).
- Removed false/unsupported claims: Stripe, ZIP download, "no compression", a made-up aggregateRating, WedUploader FAQs duplicated onto other competitor pages.
- Static prerender HTML + FAQ JSON-LD for these pages is generated from the same data files; geo pages no longer carry a conflicting homepage hreflang pair.
- FAQ answers stay in the DOM when collapsed (crawlable).

## Round 15 — Review pass, mobile layout, payment-provider copy (2026-09-30)
- /card/new (and /cards/create): the pager printed all 33+ page numbers in one row, pushing the page far off-screen on phones. Now a compact pager (1 … 4 5 6 … 33) that scrolls back to the results. No sideways scroll at 390/360/320px.
- Global mobile CSS forced 3/4-column grids into two rigid columns; they now shrink (minmax) and pricing plans stack. Fixed sideways scroll on leaving, sympathy, birthday, maternity, UK occasion, comparison, culture and Memory Movie pages (clean at 390 and 360px).
- Wedding pages show only wedding content: wedding card stack, wedding example in "What do you need today?" (wedding covers), wedding WhatsApp comparison and wedding mock card.
- /online-group-card ("any occasion") showed birthday covers only; now on the homepage layout with covers from 10 occasions. Unused old template removed.
- Example sentences use global names (Emma, Ada & Tom).
- Payments are Flutterwave only: fixed site copy (sitemap caption, llms.txt) and blog posts that said "Paystack" — run database/migration_payment_provider_copy.sql (seed files updated too). Posts about Paystack the company are unchanged.
- Static /pricing title now matches the page ($3.15, not £4.99).

## Round 16: Search safety for the revamped landing pages (2026-09-30)
- Titles, H1 wording, meta descriptions and FAQs that the 30 revamped URLs ranked with are restored (data/weddingLandings.js SEARCH_CONTINUITY, data/countryLandings.js). Only false or stale bits changed: no Naira, Stripe, ZIP or "2025", and " — " separators became ": ". /online-group-cards-nigeria stays global by request.
- Each page has its own long form article again (data/landingArticles.js), restored from the old pages where accurate and written new where the old page only had template text. Rendered on the page and in the static HTML.
- Landing pages drop the homepage only blocks (WhatsApp comparison, feature grid, how it works detail, Beyond the card, Send Money, testimonials) and the generic feature list. Every page has its own FAQ; no question is shared across pages.
- Copy rewritten in a plain human voice: no dashes, no hyphenated words, no emojis in landing copy (hero album text, intent chips, currency flags and reactions are plain on landing pages).
- Internal linking: 2 to 4 contextual links per article (validated against live indexable routes, no self links), a visible breadcrumb, the wedding hub links to every wedding page, the comparison hub links to every competitor page. Breadcrumb JSON-LD no longer points to the non-existent /comparisons URL.

## Round 17: Baby shower (50) and graduation (30) illustrated covers (2026-09-30)
- New files: public/cards/illustrated/baby-shower/*.svg and public/cards/illustrated/graduation/*.svg (Nunito subset embedded, same pipeline as round 12). Registry regenerated: 299 covers; existing rows unchanged.
- Baby shower (wizard occasion baby_shower): first in the wizard, /card/new and /cards/create library, /cards/baby-shower, /occasions/new-baby (new baby covers such as "Oh baby!" and "It's a boy/girl" lead), /cards/maternity-leave (pre-birth covers, card still created as a send-off), baby rows on /online-group-card, the global page and the UK/US/Canada pages, keyword page showcase.
- Graduation (wizard occasion graduation): /occasions/graduation now shows the 30 graduation covers instead of congratulations; library filter; general and global landing pages; keyword showcase.
- Blog strips: baby shower, maternity and new baby posts now get baby covers (post-birth covers never on shower/maternity posts, shower covers never on new baby posts, nothing on baby loss posts); graduation posts get graduation covers ("Class of 2026" kept off evergreen posts). Checked against all seeded posts: exactly the 5 baby and 5 graduation posts match.
- Static HTML for /cards/baby-shower, /cards/maternity-leave, /occasions/new-baby and /occasions/graduation lists the first 10 covers; their static titles/descriptions now match the live pages (the old Nigeria/Naira static titles are gone).
