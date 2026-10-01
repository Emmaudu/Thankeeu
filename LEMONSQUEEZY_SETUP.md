# Lemon Squeezy setup (international card payments)

Customers who pick any currency other than NGN now see "How would you like to pay?":
**International card** (Lemon Squeezy, charged in USD) or **Flutterwave**.
Used for the card fee, credit packs and company subscriptions.
Gift contributions stay on Flutterwave (a merchant of record cannot collect money for someone else).

Nothing changes until all steps below are done: the option stays hidden.

## 1. Lemon Squeezy dashboard
1. Create the store with currency **USD** and submit it for activation
   (describe Thankeeu as "digital group greeting cards, software").
2. Create one product, e.g. "Thankeeu payment", with one variant. Any price: the app sets the real price per checkout.
3. Settings > API: create an API key.
4. Settings > Webhooks: add
   - URL: `https://thankeeu-production.up.railway.app/webhook/lemonsqueezy`
   - Events: `order_created`, `order_refunded`
   - A signing secret (any long random string).
5. Store ID and variant ID: you do NOT need to find them. Leave them empty and the
   backend looks them up itself, as long as you have one store with one product.
   (The log then says `[lemonsqueezy] using store …, variant …`.)

## 2. Supabase
Run `database/migration_lemon_payments.sql` in the SQL editor.

## 3. Railway env vars
```
LEMONSQUEEZY_API_KEY=...
# LEMONSQUEEZY_STORE_ID / LEMONSQUEEZY_VARIANT_ID: optional, leave out
LEMONSQUEEZY_WEBHOOK_SECRET=...      # same as the webhook signing secret
LEMONSQUEEZY_TEST_MODE=true          # while testing with test mode; remove for live
```
Redeploy. `GET /api/payments/providers` should now return `"lemonsqueezy": true`.

## 4. Test (test mode)
Pay a card fee in USD or CAD, choose International card, pay with Lemon Squeezy's test card.
You should land back on Thankeeu and the card should go live within seconds.
Then remove `LEMONSQUEEZY_TEST_MODE` and use a live API key.

## Watch the logs for
- `AMOUNT MISMATCH`: paid less than expected, nothing granted.
- `DUPLICATE PAYMENT`: customer paid twice; refund one in Lemon Squeezy.
- `REFUND`: a refund happened; access is not revoked automatically.
- `CREDITS NEED MANUAL CHECK`: a crash mid-crediting; check the user's balance by hand.
