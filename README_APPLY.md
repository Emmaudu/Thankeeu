# Money Transfer — safe parts (no payment-code risk)

These are the parts that DON'T touch your live payment logic. Apply these now.
The money-flow app changes (auto-opening Money Transfer dashboard tab, per-step
Flutterwave funding, money-gift on the group flow) come next, once you upload
your live App.jsx / CreateCard.jsx / CardStart.jsx / cardController.js /
routes/cards.js / dashboard tab file.

## 1. New landing page (drop in)
Copy `frontend/src/pages/MoneyTransferPage.jsx` into your repo at the same path.

Then add TWO lines to your LIVE `frontend/src/App.jsx`:

  import MoneyTransferPage from './pages/MoneyTransferPage';

and, next to your other public routes:

  <Route path="/send-money-greeting-card" element={<MoneyTransferPage />} />

The landing CTA points to `/signup?intent=money-transfer`. When we do the
app-flow step, signup will read that intent and open the Money Transfer tab.

## 2. Five blog posts (run in Supabase)
Run `database/seed_blog_money_transfer.sql` in the Supabase SQL editor.
Safe to re-run — it uses ON CONFLICT (slug) DO NOTHING.
Slugs added:
  - send-money-in-a-greeting-card (featured)
  - best-way-to-send-money-to-a-loved-one
  - money-card-vs-bank-transfer
  - how-to-withdraw-money-from-a-greeting-card
  - send-money-home-nigeria-greeting-card

## 3. Homepage gift-card section
`merge-into-live/Home.jsx.reference` shows the finished Home.jsx with a new
"Put real money inside the card" section added just before the bottom CTA
(search for the comment `{/* ── Gift cards & money ── */}`). Copy that JSX block
into your LIVE Home.jsx at the same spot. It links to /send-money-greeting-card.

## 4. Sitemap
After deploy, add these paths to your sitemap generator (STATIC_PAGES in
frontend/scripts/generate-sitemap.js) so they get indexed:
  /send-money-greeting-card
  /blog/send-money-in-a-greeting-card
  /blog/best-way-to-send-money-to-a-loved-one
  /blog/money-card-vs-bank-transfer
  /blog/how-to-withdraw-money-from-a-greeting-card
  /blog/send-money-home-nigeria-greeting-card
(Blog slugs are auto-added if your generator pulls from the blog API.)

## Verified
- vite build passes with all changes
- 211/211 frontend tests pass
- All icons used exist in your Icon component
- Blog SQL matches your schema (tags TEXT[], slug UNIQUE, $content$ quoting)

## Still needed from you for the money-flow (next step)
Upload these LIVE files and I'll build the dashboard tab + funding flow safely:
  frontend/src/App.jsx
  frontend/src/pages/CreateCard.jsx
  frontend/src/pages/CardStart.jsx
  backend/controllers/cardController.js
  backend/routes/cards.js
  the dashboard tab-list file (e.g. DashboardHome.jsx or dashboard layout)
