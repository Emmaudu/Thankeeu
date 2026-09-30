# Type-to-create: one box on the homepage

**Plain answer to the money question first, then how it works.**

---

## 1. Will you pay anything? Will you set up tokens?

**No. Nothing. No API key, no tokens, no monthly bill, no signup with any AI company.**

The version I'm recommending runs entirely inside the customer's own browser, in
the JavaScript you already ship. There is no AI service involved. It costs
exactly ₦0 whether 10 people use it or 10 million.

| | Cost | Setup needed |
|---|---|---|
| **What I'd build** | **₦0 / month** | **None** |
| Optional smart version (later, only if you want) | ~$0.11–$3 / month | An API key |

You never have to build the second one. The first one works on its own.

The reason it's free is simple: understanding *"birthday card for my sister Ada,
sending Friday"* does not need artificial intelligence. It needs a list of your
15 occasions, a list of relationship words, and a date reader. That's ordinary
code. AI would only help with unusual, rambling sentences — and those are the
minority.

---

## 2. What the customer sees

**Step 1 — They land on thankeeu.com.**
Under your headline is one box:

> **Tell us about the card — we'll set it up.**
> `[ birthday card for my sister Ada, sending Friday…            ] [ Go → ]`
>
> Try: *leaving card for my boss* · *wedding card for Tunde & Ada* · *birthday card for mum*

Those three examples underneath matter. An empty box makes people freeze. The
examples are tappable, so a customer who doesn't know what to type can just tap
one and edit it.

**Step 2 — They type and press Go.**
Instant. No loading spinner, no waiting on a server.

**Step 3 — They're inside the card builder, already filled in.**

| Field | Filled from their sentence |
|---|---|
| Occasion | Birthday |
| Design | A birthday cover, already chosen |
| Recipient | Ada |
| Title | "Ada's Birthday Card" |
| Send date | This Friday, 09:00 |
| Gift pot | On, if they mentioned collecting money |

At the top: *"Here's what we understood — change anything."* Everything is
editable. Nothing is locked in.

**Step 4 — They finish and pay.** Exactly your current flow. Unchanged.

**What this saves them:** today a customer clicks *Create a card* → picks an
occasion → scrolls ~315 designs → fills a details form → reaches payment. That's
four screens and a lot of choosing. The box gets them to the last screen in one
sentence. They can still browse designs if they want to — the old button stays
right next to the box.

---

## 3. The account part — no stress, no signup page

You asked whether they can get an account from the same flow. **Yes, and you have
already built the hard parts.** I checked:

- `POST /api/auth/send-code` and `POST /api/auth/verify-code`
  (`backend/routes/auth.js:30-31`) — email + 6-digit code signup, **no password**.
  This already works today.
- Anonymous draft cards with a `draft_edit_token`
  (`backend/controllers/cardController.js:188`) — a visitor who is not logged in
  can already build and save a card.

So the flow is:

1. They type in the box. **No account needed.**
2. They build the card. **Still no account.** It saves as an anonymous draft.
3. At the end, one field: **"Your email"**.
4. A 6-digit code arrives. They type it in.
5. Account created, draft attached to it, straight to payment.

**No password to invent. No separate signup page. No email verification link to
go hunting for in another app.** Just an email and six digits, in the same
screen they were already on.

### Where the email field should sit

You said "from the input field" — my recommendation is to ask for the email at
**step 3**, not step 1.

The reason is conversion. If the box asks for an email before they've seen
anything, it reads as a signup form and people bounce. If they've already watched
their card come together with their sister's name on it, giving an email to
finish feels like the natural last step, not a toll gate. Same number of fields,
much higher completion.

If you'd rather have it in the box from the start, that's a small change and I
can do it — but I'd A/B it before committing.

---

## 4. What I need to build

Three things. Roughly **2–3 days**.

1. **The reader** (`frontend/src/utils/cardIntent.js`) — turns a sentence into
   card fields. Knows your 15 occasions plus the words Nigerians actually use
   (*send-forth*, *oga*, *owambe*, *naming ceremony*), reads dates like "Friday"
   and "25th December", spots amounts like "50k" and "₦5,000".
2. **The box** (`CardIntentBar`) — the input, the examples, the Go button.
3. **The wiring** — pre-fill `CreateCard.jsx` and show the "here's what we
   understood" strip so nothing is silently wrong.

No new database tables. No new dependencies. No backend changes at all for the
free version.

---

## 5. If you ever want the smarter version

Only worth doing if the data says so. I'd add a counter that quietly records how
confident the reader was on each submission. After two weeks you'll know whether
people are typing things it can't handle. If they are, adding AI is a small
change — one env var — and costs roughly **$0.11 a month** on a cheap model at
3,000 uses.

One warning for when that day comes: an AI endpoint on a public homepage must be
locked down (rate limits, length caps, a spend cap), because bots will find it
and bots trigger exactly the expensive path. Free version has no such risk at all
— nothing to attack.

---

## 6. What it won't do — honestly

- **It won't write their message for them.** It sets the card up; the words are
  still theirs. (That's a separate feature, and that one *would* need AI.)
- **It won't skip payment.** Your ₦5,000 fee still applies at the same point.
- **It won't always guess the design right.** It picks a sensible cover for the
  occasion; some people will change it. That's fine — that's why the design
  step stays.
- **It won't understand everything.** A long rambling sentence may fill in only
  the occasion and the name. The customer lands on a partly-filled form instead
  of an empty one, which is still better than today.

---

## 7. The one-line summary

A customer types one sentence, lands in your builder with everything filled in,
gives an email and six digits at the end, and pays. **You pay nothing and set up
nothing.**
