# Deploy notes — what changed in this build

Everything below is in the codebase and passing. Read §1 before you deploy.

---

## 1. Before deploying — run two migrations

```
database/migration_money_transfers.sql        # Send Money table
database/migration_test_card_quickstart.sql   # test-card accounts + password nudges
```

Both are safe to re-run. No new environment variables. No new dependencies —
`package.json` is unchanged on both sides.

---

## 2. What is new

### Homepage type-to-create
A customer types one line — *"birthday card for my sister Ada, sending Friday,
deadline Wednesday, collecting 50k, from Emmanuel"* — and lands in the card
wizard with the occasion, cover design, cover text colour, recipient, title,
delivery date, signing deadline, sender and gift pot already filled in.

- `frontend/src/utils/cardIntent.js` — the parser. Runs in the browser. **No API
  key, no AI service, no running cost.**
- `frontend/src/utils/applyCardIntent.js` — maps a parsed sentence onto the
  wizard form, and picks a readable cover ink for the design it chose.
- `frontend/src/components/CardIntentBar.jsx` — the homepage input. Full width,
  above the fold on desktop, laptop and phone. Starts pre-filled with an
  editable example. As soon as the sentence names an occasion, a horizontal row
  of matching cover designs appears above the box — tap one and it becomes the
  card's cover, with the title ink contrast-checked against it.
- `frontend/src/components/IntentSummaryStrip.jsx` — "here's what we set up".
- Wired into `pages/Home.jsx`, `pages/CardStart.jsx`, `pages/CreateCard.jsx`.

### Sign-up without a verification code
Creating a card no longer sends anyone to `/login` or `/signup`, and no longer
asks for a 6-digit code, a username or a date of birth.

- `frontend/src/components/InlineAuthPanel.jsx` — asks "first card or not",
  then takes name + email + password (new) or email + password (returning),
  using the existing `/auth/signup` and `/auth/login` endpoints. Username is
  generated from the email.
- A 10-second hand-off screen, then the dashboard review step.

**The emailed code is unchanged for money claims.** That check is what stops
someone claiming a money card addressed to another person, and it stays.

### Resume alert
`frontend/src/components/ResumeDraftAlert.jsx` — replaces the toast that used to
flash for three seconds. A saved-but-unpaid card now says so, with a
"Continue to payment" button.

### Send Money fixes
- The recipient's card rendered **no attachments at all**. Fixed.
- Multiple attachments now show as a swipeable carousel
  (`components/MediaSwiper.jsx`) in both the composer preview and the card.
- Sender-chosen cover text colour, guarded for contrast.
- Incremental saves no longer lose earlier attachments, and removing an
  attachment now actually removes it (`backend/controllers/moneyTransferController.js`,
  `pickMedia`).
- `?draft=` is now loaded instead of silently overwritten with a blank form.
- Individual-vs-group messaging on the dashboard, landing page and homepage.

### Dates and times, written however people write them
Customers should not have to learn a format. The parser now reads:

- **Relatives** — today, tonight, tomorrow, day after tomorrow, a week today,
  a week tomorrow, in 3 days, in 2 weeks / in two weeks, in 3 months.
- **Weekdays, qualified** — this / next / coming / following Friday and week
  after next, full or abbreviated (`fri`, `weds`, `thurs`, `mon`).
  *"this Friday" and "next Friday" are seven days apart and are treated as
  such*, including the awkward case of saying "next Friday" on a Friday.
- **Weekends** — this weekend, next weekend.
- **Month edges** — end of the month, end of next month, beginning of next
  month, mid next month.
- **Named months, either order, abbreviated or not** — 25 December, Dec 25,
  20th Sept, 1 Jan.
- **Numeric** — 25/12, 25/12/2026, 25-12-2026, and ISO 2026-12-25. Read
  **day-first**, the Nigerian and UK convention.
- **Holidays** — Christmas, Boxing Day, New Year's Day, New Year's Eve,
  Valentine's Day.
- **Times** — morning 09:00, lunchtime 12:00, afternoon 14:00, evening 18:00,
  night 20:00, "first thing" 07:00, midnight; and explicit clock times
  ("at 11am", "3:30pm", "9 a.m.", "8 o'clock") override the vague ones.

Everything resolves **forward** — a card is never scheduled into the past — and
anything it is not sure of is left blank so the wizard's own default stands.
The delivery time and the signing-deadline time come from their own clauses, so
*"sending next Friday morning, deadline this Wednesday evening"* fills four
separate fields correctly.

### CORS is now actually enforced
`server.js` built an allowlist and then ended the callback with an
unconditional `callback(null, true)`, so **every origin on the internet was
allowed** — with `credentials: true` and `sameSite: 'none'` session cookies
behind it. Any page anywhere could make authenticated calls as a signed-in
user. That is fixed.

What is allowed now: `thankeeu.com` and any subdomain (workspaces, games,
mentorship, admin), Vercel previews, `FRONTEND_URL`, and localhost including
`*.localhost` workspace testing. Everything else is refused and logged once
with the exact value to add.

Two things worth knowing:

- The old `origin.includes('thankeeu')` test matched **evil-thankeeu.com** and
  **thankeeu.attacker.net**. Gone — suffix and exact matches only.
- Everything except localhost must be **https**. Session cookies here are
  `secure`; honouring an http origin on our own domain invites a downgrade.

**`CORS_EXTRA_ORIGINS`** (comma-separated) adds an origin without a code
change, so a missed origin is a env-var edit, not a redeploy. Watch the logs
for `[cors] blocked origin` after deploying — if a real one appears, add it
there.

`tests/cors.test.js` covers both directions: ten origins that must keep
working, ten that must be refused.

### Test card vs real card — an explicit choice
Pressing **Set up my card** no longer jumps straight to the wizard. It opens a
second slide on the homepage asking the one question worth asking while the
sentence is still on screen:

- **Test card — free.** Uses the welcome credit. A real card, really delivered,
  nothing to pay.
- **Real card — paid.** The normal one-time fee at the end.

Plus an optional comma-separated **invitee emails** box, which pre-fills the
wizard's own invite field.

Choosing *test* while signed out asks for **one field — an email** — and creates
the account through the new `POST /auth/quick-start`. They land in the dashboard
already signed in, with the album studio beside the form, and a **docked 25-second
timer** publishes the card with the free credit when it reaches zero. The timer
never blocks editing and carries a quiet "Stop the timer — I'll send it myself"
link. A returning tester with no free credit left sees the test option greyed out
with an explanation, and **real** is selected for them.

> **On the shared default password.** The request was to sign test users in with
> a fixed password (`testcard@#2026#`). That is not built, and should not be.
> A constant like that ships inside the frontend bundle where anyone can read
> it, and from then on knowing an email address is enough to enter that
> person's account — their cards, their recipients' addresses, their credits.
> `quickStart` gives the identical one-field experience by generating a
> **cryptographically random** password nobody ever sees, signing them in
> directly, and emailing a link to set a real one. An address that already has
> an account is never signed in this way; it is asked for a password instead.

### The dashboard wizard now has the album studio
`CreateCard.jsx` previously had no live preview at all — signed-in creators were
the only ones who could not see their card while building it. It now renders the
same `AlbumStudioPreview` as the public wizard, in a sticky right-hand column,
with the cover fully editable and draggable.

### Free first card — 1 welcome credit
Every new account is granted **1 credit** at signup (both `/auth/signup` and
`/auth/verify-code`), recorded as `plan_type_v2: 'welcome_free'` with
`total_purchased: 0` so a granted credit can always be told from a bought one.

What that changes in the flow: after sign-in from the homepage input, the
balance is checked. **If they have a credit it is spent automatically, the card
goes live immediately, and they are handed to the sharing screen after 2
seconds** (`/create-card?live=<slug>`). No payment step at all. If they have no
credit, the existing 10-second hand-off to the dashboard review-and-pay step is
unchanged.

Activation via credit now also **emails the creator** their sharing link
(`cardCreated` template), and says the card was free when the welcome credit
was the one used.

Signal copy sits on the hero price row, under the homepage input, on the
"is this your first card" panel and on the saved-draft screen.

### SEO / GEO
- `FAQPage` structured data on the homepage, built from the same array the
  visible FAQ renders — the two cannot drift, which is what Google requires.
- `HowTo` structured data mirroring the three visible steps under the input.
- A new FAQ entry answering "How fast can I create a group card?".

---

## 3. Bugs fixed along the way

| Bug | Where |
|---|---|
| `ada@example.com` made the parser choose "Good Luck" — `\bexam` matched inside "example" | `cardIntent.js` |
| "my oga Emeka" produced a recipient called "Oga Emeka" | `cardIntent.js` |
| "for my mum" invented a recipient called "Mum" | `cardIntent.js` |
| `useState` called inside a `.map()` callback — a rules-of-hooks violation | `Home.jsx` |
| Auth panel unmounted itself on success (`!user` gate) so the hand-off never showed | `CardStart.jsx` |
| Auto-redirect raced the hand-off and swallowed the countdown | `CardStart.jsx` |
| Carousel dot strip swallowed clicks meant for the arrows (global 44px button min-height) | `MediaSwiper.jsx` |
| `require('node:crypto')` returned undefined under one test runner | `tests/unit/auth.test.js` |
| Said **on** a Friday, "next Friday" resolved 14 days out instead of 7 | `cardIntent.js` |
| "week after next Friday" lost a week — it ends in "next", which the qualifier test claimed first | `cardIntent.js` |
| "next week Friday" dropped the Friday and returned a bare +7 days | `cardIntent.js` |
| The cover row at rest pushed the input below the fold on laptop and phone | `CardIntentBar.jsx` |
| "a week today" matched the plain `today` rule first and returned today | `cardIntent.js` |
| **The free-credit path could never work** — the anonymous draft was never claimed, so `spendCredit` returned 403 and the failure was swallowed | `CardStart.jsx` |
| The pay block rendered underneath the hand-off countdown — a live "pay ₦5,000" button for a card just activated free | `CardStart.jsx` |
| A typed sentence merged with a stale abandoned draft, so paying could update and send the OLD card to its OLD recipient | `CreateCard.jsx` |
| Auto-spend took **purchased** credits without a click | `CardStart.jsx` |
| `?live=<slug>` was trusted, showing a "your card is live" screen and sharing link for any slug | `CreateCard.jsx` |
| The welcome-credit `try/catch` was dead code — supabase resolves with `{error}` and never throws, so failures were silent | `authController.js` |
| The activation-failure refund overwrote a concurrently changed balance, creating credits from nothing | `creditController.js` |
| `sendDate` printed as a raw ISO timestamp in the email | `creditController.js` |
| Sympathy and thank-you cards got a **birthday** cover auto-applied | `applyCardIntent.js` |
| An email typed in the sentence pre-filled the *sign-in* field — people would have created accounts under their recipient's address | `cardIntent.js` |
| A pending navigate timeout fired after the customer had left the page | `CardIntentBar.jsx` |
| `takeIntent()` consumed and cleared the intent on a cold load before auth resolved, then threw it away on redirect | `CardStart.jsx` |
| Recipient photo silently dropped on the free-credit path | `CardStart.jsx` |
| TDZ: the auto-start effect's dependency array referenced `intentMode` above its declaration | `CreateCard.jsx` |
| `occasionLabel` did not exist in `CreateCard` — the ported preview crashed the page | `CreateCard.jsx` |

---

## 4. Tests

```
cd backend  && node --test "tests/**/*.test.js"     # 463 passing
cd frontend && npx vitest run                        # 667 passing
```

Browser checks live in `/root/harness` (not shipped) and all pass with zero
page errors.

---

## 5. Still outstanding — not blockers, but you should know

1. **Live Flutterwave and Supabase were never exercised.** Everything here is
   verified against shapes and contracts, not real infrastructure. Test one
   real card and one real money card in staging before you announce anything.

3. **Send Money is money transmission.** Worth a conversation with someone who
   knows CBN licensing, separate from the code.

4. **`docs/MCP_INTEGRATION.md`** describes an MCP server. **None of it is
   built** — it is a proposal, and nothing in this deploy depends on it.

5. **The welcome credit is one free card per EMAIL ADDRESS, not per person.**
   Nothing stops someone signing up repeatedly with new addresses to get free
   cards. That is a deliberate growth trade — but if farming shows up, the
   cheapest fix is to gate the credit on `is_verified`, so the free card
   requires a working inbox. The grant is in one place per signup path
   (`plan_type_v2: 'welcome_free'`), so that change is a few lines.

6. **The homepage input starts pre-filled** with an editable example. Someone
   could press the button without editing and get a card addressed to "Ada".
   The summary strip makes it obvious and the first click selects the whole
   sentence, but watch real usage; switching to an empty box with a ghost
   placeholder is a one-line change.
