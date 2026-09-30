# Round 11 — USD-first display across the card flow

Amounts are still STORED in NGN (no DB migration). Display + default checkout currency is now USD.
Rate: ₦1 = $0.00063 (frontend utils/currency.js == backend utils/cardPayment.js CARD_FEE_FX). Update both together.

## Frontend
- utils/currency.js: DEFAULT_CURRENCY='USD', formatUSD(), USD listed first; money never shows 1 decimal ("$15.9" bug fixed).
- CardStart (public wizard) + CreateCard (signed-in wizard): every amount in USD; final step "Pay in" defaults to USD. Card fee = $3.15.
- PayForCard: USD default, gift pot in USD.
- SignCard: presets/pot in USD, pay in USD by default, NEW "Pay in" switch (NGN still available); custom amount typed in chosen currency.
- Dashboards (home, cards, delivered, finances, legacy Dashboard) + CardView gift displays → USD.
  CardView withdrawal breakdown intentionally stays NGN (actual bank payout).
- Homepage prompt: understands "$50", "20 dollars", "usd 25"; examples say "collecting $50".

## Backend
- SECURITY: initContribution no longer trusts client flw_amount; charge computed server-side.
  verifyContribution + webhook now refuse to credit a gift when the paid amount doesn't cover it
  (previously ₦5,000,000 could be credited for a $0.01 payment).
- BUG: webhook recorded USD gifts as floor(txn.amount) naira ($6.30 → ₦6) and overwrote the correct
  stored amount. Now uses the stored NGN amount / meta.expected_ngn.
- Emails: card fee "$3.15", gift pot totals and "chip in from $1.58" in USD. Withdrawal/deduction/vendor emails stay NGN.
- tests/unit/contribution-amount.test.js added.

---
# Round 11b — database, marketing, blog

## ⚠️ Deploy order (important)
1. Run `database/migration_contribution_paid_currency.sql` in Supabase FIRST.
   (It backfills existing gifts as NGN. If new code runs first, USD gifts made
   in the gap would be backfilled as NGN.)
2. Run `database/migration_blog_usd_amounts.sql` (safe to re-run; converts each post once).
3. Deploy backend, then frontend.

## Database
- contributions.paid_currency / paid_amount: what Flutterwave actually charged (e.g. USD 6.30).
  `amount` is unchanged = NGN credited to the pot. Backend writes these best-effort
  (won't break if the migration hasn't run).
- Blog: "₦5,000" → "$3.15 (₦5,000)", ranges "$1.89–$5.04 (₦3,000–8,000)", "₦2–4 million" handled.
  Stale fee claims corrected (₦1,500 send fee, £4.99/$5.99 Classic, ₦500 minimum).
  Seed files converted with the same SQL function. Tested on Postgres 16 with all 190 seed posts;
  second run changes nothing.

## Site-wide
- Pricing/SEO: "from $3.99/£4.99" and schema.org $5.99/£4.99 were wrong vs actual charge → $3.15 / £2.45.
  Removed false "AUD and 30+ currencies" claim.
- Policy: 5-pack was stated as both ₦10,000 and ₦20,000 → $12.60 (backend charges ₦20,000).
- Social share image (og-image.png/svg): ₦92,500 → $58, currency order USD first.
- AlbumSign (album-style signing page): same as SignCard — USD default + Pay-in switch;
  dropped the ₦1,000 preset that was below the ₦2,500 minimum and never counted as a gift.
- Demo gift pots, FAQ, How It Works, occasion pages, footer, member/pals/company dashboards → USD.
- Company subscription: shown in USD with "billed as ₦X" — still CHARGED in NGN (bank transfer friendly).

## Intentionally still NGN
Withdrawals/payouts, Send Money, payroll deductions, vendor marketplace, mentorship,
admin ledger, Nigeria-targeted SEO pages ("Naira payments" is the selling point there).
