# Deploy notes — what changed in this build

Everything below is in the codebase and passing. Read §1 before you deploy.

---

## 1. One thing to do before deploying

**Run the money-transfers migration.** The Send Money feature needs its table:

```
database/migration_money_transfers.sql
```

Nothing else needs a migration. No new environment variables. No new
dependencies — `package.json` is unchanged on both sides.

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

---

## 4. Tests

```
cd backend  && node --test "tests/**/*.test.js"     # 423 passing
cd frontend && npx vitest run                        # 645 passing
```

Browser checks live in `/root/harness` (not shipped) and all pass with zero
page errors.

---

## 5. Still outstanding — not blockers, but you should know

1. **CORS is wide open.** `backend/server.js` builds an origin allowlist and
   then, on the last line of the callback, returns `callback(null, true)`
   unconditionally — so every origin is allowed, with `credentials: true`.
   Combined with `sameSite: 'none'` cookies this is a standing CSRF exposure.
   It is a two-line fix and it predates this work, but it is the single most
   valuable thing you could change next.

2. **Live Flutterwave and Supabase were never exercised.** Everything here is
   verified against shapes and contracts, not real infrastructure. Test one
   real card and one real money card in staging before you announce anything.

3. **Send Money is money transmission.** Worth a conversation with someone who
   knows CBN licensing, separate from the code.

4. **`docs/MCP_INTEGRATION.md`** describes an MCP server. **None of it is
   built** — it is a proposal, and nothing in this deploy depends on it.

5. **The homepage input starts pre-filled** with an editable example. Someone
   could press the button without editing and get a card addressed to "Ada".
   The summary strip makes it obvious and the first click selects the whole
   sentence, but watch real usage; switching to an empty box with a ghost
   placeholder is a one-line change.
