
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

## Round 18: CAD card fee for individual Canadian users
- Verify page no longer says "Payment received but something went wrong" when the bank declined the card. A decline now returns 402 with a clear "you were not charged" message and sends the user back to /pay/:slug, preset to USD, with a notice.
- Pending (3D Secure still finishing on foreign cards) returns 202 and the verify page waits and re-checks instead of reporting failure.
- Verification uses Flutterwave's transaction_id from the redirect (checked against tx_ref), so a first declined attempt followed by a successful second card on the same checkout is no longer read as unpaid.
- Dashboard / PaymentCallback treat pending as "retry", never as success.
- Tests: tests/unit/card-fee-verify.test.js.

## Round 19: Lemon Squeezy as a second payment gateway
- New payment method dialog (`utils/paymentMethod.jsx`) for every non-NGN checkout: International card (Lemon Squeezy, USD) or Flutterwave. Hidden until Lemon Squeezy is configured.
- Wired into card fee (CardStart, CreateCard, PayForCard), credit packs (Pricing, DashboardCredits) and company subscriptions (Pricing). Gifts stay on Flutterwave.
- Backend: `utils/lemonSqueezy.js`, `controllers/lemonSqueezyController.js`, `/webhook/lemonsqueezy` (HMAC-SHA256, raw body), `/api/payments/providers`, `/api/payments/lemonsqueezy/status/:ref?k=`.
- The signed webhook is the only thing that marks a payment paid; claim-before-fulfil prevents double fulfilment; credits have their own claim; stuck payments are reclaimed after 5 minutes.
- New table: `database/migration_lemon_payments.sql`. Setup: `LEMONSQUEEZY_SETUP.md`.
- Fixed: `saveSubscription` referenced an undefined `PLANS`, which threw on a company's first subscription.
- Subscriptions now respect `FLW_DISABLED_CURRENCIES` like other payments.
- Decline messages now point to the International card option.
- Removed the unused Fincra card-checkout draft (Fincra CAD is Interac only; to be built after approval).

## Round 20: Currency dropdown with 130+ currencies
- Every currency picker (pricing, landing pages, card fee pages, gift pages) is now one dropdown: "🇮🇳 INR · Indian Rupee · India". Chargeable currencies (USD, NGN, GBP, EUR, CAD, GHS, KES, ZAR) first, then every currency Lemon Squeezy can show, A to Z.
- Display-only currencies show approximate local prices from daily USD rates (`/api/payments/fx-rates`, open.er-api.com, cached 12h, attribution shown). No rate → USD price shown, never a guess.
- Payments in display-only currencies are charged in USD on both gateways (`chargeableCurrency` on the backend; previously an unknown currency fell back to NGN).
- Payment dialog shows the approximate local price under the USD charge.
- Landing page price helpers now use `formatCurrency` (correct symbols and decimals for any currency).
- Fixed: Irish visitors (Europe/Dublin) defaulted to GBP; they now get EUR.
- Checkout: the "How would you like to pay?" dialog now has the currency dropdown too. Changing it there updates both prices, and the chosen currency is what gets charged (the page's own selector follows it).
- Lemon Squeezy store and variant IDs are now optional: looked up from the API when there is one store with one product.
- Lemon Squeezy: checkout price now uses the store's own currency (an NGN store read 315 as ₦3.15 and was rejected). Amount check compares in the store currency when the order is in it. A non-USD store logs a warning.

## Round 21: Admin → Currency (prices in USD) and gateway labels
- Payment dialog: "Flutterwave · For African countries" and "Lemon Squeezy · International: countries outside Africa".
- New Admin → Currency tab: set the card fee and every credit pack in USD; see the resulting NGN, GBP, EUR, CAD, GHS, KES, ZAR prices at today's rate; "change all prices by %" helper; confirm before saving. Stored in site_settings ('pricing_usd'); applies to new checkouts immediately.
- backend/utils/pricing.js is now the single source of prices and rates (daily live rates, legacy fixed rates as fallback). Removed the hard-coded ₦5,000 / plan prices / 0.00063 tables from payments, credits, subscriptions, Lemon Squeezy and emails. Naira prices are rounded to the nearest ₦100 (display and charge).
- Frontend loads /api/payments/pricing at start (and every 10 minutes / on tab focus); every price display, plan card, FAQ answer, page title and JSON-LD now shows the live price ("$3.15" launch copy is swapped for today's price).
- Fixes found in review: credit purchases now verify the amount paid; subscription verify and webhook compare in the charged currency (amount_settled is not naira); first checkouts after a restart wait for the admin prices; a near-free discount no longer becomes a ₦100 charge.
- Note: prerendered static HTML (for crawlers) still contains the launch prices until the next build; discount codes' max_discount_ngn caps are still in naira.
- Payment dialog: Lemon Squeezy option notes that sales tax or VAT may be added at checkout depending on country.
- Live prices also in emails (card fee lines and "a card credit is just …") and in blog post bodies (launch prices in DB articles are swapped for today's price when shown).

## Round 22: 360 new covers mixed into every occasion
- Three new styles, 10 covers per occasion each: mature cool (mc-), mature happy and adventurous (ad-), artistic (ar-). Files in public/cards/illustrated/<occasion>/ with those prefixes; general sympathy covers go to sympathy-colleague.
- Fonts embedded as subsets in each SVG (DM Serif Display regular/italic, Kaushan Script, Alfa Slab One, Nunito 800) so lettering renders inside <img>.
- Order per occasion: the first row (4) stays the cartoon lead covers; each following row of 4 holds 2 existing + 2 new covers in random slots (seeded shuffle, stable between builds); same motifs kept apart. When one kind runs out, the rest follow.
- 659 covers total (was 299). Tests updated, including a row-mixing test.

## Round 23: Memory Movie "Not authorised" for recipients

- Cause: the card page showed Generate to the creator and the recipient, but the server only allowed the creator, and it also required a login. Recipients got "Not authorised".
- `backend/controllers/movieController.js`: new `canManageMovie()` allows the creator (user, company or team member), anyone holding the card's private link token, a signed-in user or member whose email is the recipient email, and the recipient inbox (`received_cards`, `member_received_cards`). Clearer error message.
- `backend/routes/movies.js`: generate and regenerate use `optionalAuth`, so a recipient opening the card from their link can create the movie without signing in.
- `frontend/src/components/MemoryMoviePlayer.jsx`: sends the card link token, and also uses the team member login.
- `frontend/src/pages/CardView.jsx`: passes the token to the player.
- Test: `backend/tests/unit/movie-auth.test.js`.

## Round 24: signing safety, signature drafts, Transactions tab

**Run first:** `database/migration_signature_drafts.sql` in Supabase.

Signing
- `components/SigningSafety.jsx`: a note under the Sign button asks signers to keep the page open until the confirmation page appears. While the message is uploading, closing the tab shows the browser's "Leave site?" prompt (not during the payment redirect).
- `utils/signatureDraft.js`: what a signer writes is kept in their browser (restored if they come back) and saved to the server 3 seconds after they stop typing, and again when the page is closed or hidden (sendBeacon).
- `backend/utils/signatureDrafts.js` + `POST /api/messages/:slug/draft`: stores drafts. When the real signature is saved, `addMessage` closes the draft before replying. Limits: 15 new drafts per IP per card per hour, 300 open per card.
- Admin → Cards: a "N drafts" badge; card details has a "Signature drafts" section with Post and Remove. Post adds the text as the signer's message (no duplicates: double clicks are refused, and an identical existing signature is linked instead), emails the creator as usual, and emails the signer that their message is on the card. Only text is kept; files and gifts are not.

Transactions
- Admin → Transactions (`components/admin/TransactionsTab.jsx`, `backend/controllers/adminTransactionsController.js`).
- Flutterwave: live from Flutterwave, every attempt with the decline reason, name, email, phone, card brand, masked card, issuer, card country, method (card, bank transfer, USSD…), IP, fee and settlement. 10 per page (Flutterwave's page size).
- Lemon Squeezy: every checkout we started, with paid order details (name, country, tax, receipt). Lemon Squeezy does not give card details, phone numbers or decline reasons through its API; unpaid checkouts show as "Not completed".
- `lemonSqueezy.js` now records the customer name and, when a checkout cannot be created, the reason.

Tests: `backend/tests/unit/signature-drafts.test.js`, `admin-transactions.test.js`, `frontend/src/tests/signature-draft.test.jsx`.

## Round 25: 88 country landing pages, Top 5 blog post, PDF keepsake, drafts keep files and gifts

**Run first in Supabase:** `database/migration_signature_drafts.sql` (again: adds the `media` column) and `backend/migrations/migration_blog_best_online_group_card_websites_2026.sql` (the new post, linked from every landing page).

Landing pages (`frontend/src/data/occasionLandings/`, `pages/OccasionCountryLanding.jsx`)
- 88 pages. Group cards, farewell, birthday, baby shower and anniversary (couples and work), two pages each, for the UK, US, Canada, Germany, the Netherlands, Colombia, Mauritius and the Philippines. Farewell and birthday, two pages each, for Australia and France. URLs, languages and link text in `manifest.js`.
- One page per country and occasion is in German, Dutch, Spanish or French for Germany, the Netherlands, Colombia and France; the rest are English.
- Each page has:
  - three flipbook albums in the hero, like the homepage, with its own recipients and messages;
  - its own hero background: a country colour plus an occasion pattern (`heroBackdrop.js`), with no gradients and no pills;
  - 12 sample covers across categories, how it works, features, 3 or more country sections and 8 or more message ideas;
  - a live price table in the local currency, a competitor comparison and 12 or more FAQs;
  - links to every other page in the same country, the same page in other countries, supporting blog posts and core pages.
- SEO: unique titles and descriptions, canonical, reciprocal hreflang clusters (`en-GB`, `de-DE`, `fr-FR`…), `<html lang>`, FAQ, breadcrumb and WebPage JSON-LD. The prerendered HTML contains the full page, and the sitemap includes every page with its alternates.
- Fonts and sizes match the homepage (Nunito headings, Nunito Sans text). Blog post titles now use the same weight.
- Quality gate `src/tests/occasion-landings.test.js` checks every page for:
  - no hyphens or emojis, and no filler phrases;
  - minimum length and unique titles;
  - no two pages sharing 20% of their phrases;
  - real covers, icons and links;
  - complete hreflang clusters;
  - no prices that would go out of date.

Blog: "The 5 Best Online Group Card Websites in 2026". It ranks Thankeeu first, with the best pick for leaving, birthday, wedding, anniversary and congratulations cards. Competitor facts come from their own pricing pages (October 2026).

PDF keepsake (`components/CardKeepsake.jsx`): the card's Download PDF button now opens an A5 booklet on cream paper:
- the card's own front cover;
- a dedication page;
- one or two messages per page, kept whole with their photos and centred;
- a back cover listing every signer.

It saves through the browser's Save as PDF with zero margins, so there are no headers, URLs or watermarks.

Signature drafts now keep files and gifts:
- Attachments upload as they are added (`POST /api/messages/:slug/draft/media?k=`). This is checked before any upload and limited to 30 an hour per IP.
- On submit, files already uploaded are sent as links instead of being uploaded again (`prepared_media`).
- The gift a signer chose (an amount or a vendor product) is recorded, never charged.
- Admin card details shows the files and the gift. Post adds the files to the message, and the email to the signer explains that the gift was not paid.

## Round 26: Thankeeu for Teams landing pages (HR buyers)

Ten B2B pages, two per country, built to bring HR managers and founders to book a demo (/business) or create a free company account (/company/signup):

| Country | Page A (recognition platform) | Page B (automated staff cards) |
|---|---|---|
| US | /employee-recognition-platform-us | /automated-employee-birthday-cards-us |
| UK | /staff-recognition-platform-uk | /staff-birthday-and-leaving-cards-uk |
| Canada | /employee-recognition-software-canada | /work-anniversary-and-birthday-automation-canada |
| Germany | /employee-recognition-software-germany | /mitarbeiter-wertschaetzung-tool (German) |
| Mauritius | /employee-recognition-mauritius | /staff-celebration-software-mauritius |

- Files: `frontend/src/data/teamsLandings/` (manifest, shared facts, brief, pages per country) and `frontend/src/pages/TeamsCountryLanding.jsx`.
- Each page has:
  - three workplace flipbooks in the hero and its own hero background;
  - a section on what goes wrong today, six automations, the list of HR systems, six features, cards to send, three country sections and a one week rollout plan;
  - live pricing at the standard per employee rate in the local currency, with team size examples and the yearly saving;
  - a comparison with three competitors relevant to the country;
  - 14 or more FAQs;
  - links to the occasion pages for the same country and to guides.
- Pricing shown is the standard ₦2,000 per employee a month (about $1.26 at today's rate). If an admin sets a custom rate for a company, that company pays its own rate; the pages say larger organisations get a tailored quote.
- Facts checked against the code and the competitors' pricing pages (October 2026). There are no claims about SSO, compliance, Slack or Teams apps, opt outs, or delivery in each recipient's own time zone for automated cards.
- Prerendered HTML, hreflang clusters, sitemap entries and `<html lang="de">` for the German page.
- Long German words no longer overflow on phones; long headlines scale down automatically. This also applies to the occasion pages.
- Quality gate: `src/tests/teams-landings.test.js`.
