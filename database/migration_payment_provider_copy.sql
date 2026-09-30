-- ════════════════════════════════════════════════════════════════════════════
-- Payment-provider copy fix (2026-09-30). Thankeeu takes payments through
-- Flutterwave only. Published blog posts said gift pots were "powered by
-- Paystack and Flutterwave" or paid "via Paystack". This rewrites only those
-- claims about Thankeeu's own payments. Posts that discuss Paystack the
-- company (its teams, its culture) and Thankbox's use of Stripe are untouched.
-- Safe to run more than once. Run in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION pg_temp.fix_provider(t TEXT) RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(t,
      'powered by Paystack and Flutterwave', 'powered by Flutterwave'),
      'via Paystack and Flutterwave', 'via Flutterwave'),
      'via Paystack or Flutterwave', 'via Flutterwave'),
      'run on Paystack and Flutterwave rails', 'run on Flutterwave rails'),
      'contributes via Paystack instantly', 'contributes via Flutterwave instantly'),
      'gift contributions via Paystack', 'gift contributions via Flutterwave'),
      'Automated Paystack gift pots', 'Automated gift pots'),
      'colleagues contribute via Paystack', 'colleagues contribute via Flutterwave'),
      'Paystack handles international card payments.', 'Flutterwave handles international card payments.'),
      'Cash gift pots via Paystack', 'Cash gift pots via Flutterwave'),
      'whatever they are comfortable with via Paystack', 'whatever they are comfortable with via Flutterwave'),
      'Paystack changed that. Here is how Thankeeu makes group gifting frictionless.', 'Online payments changed that. Here is how Thankeeu makes group gifting frictionless.'),
      '<h2>Why Paystack changed everything</h2><p>Paystack solved Nigerian payments.', '<h2>Why online payments changed everything</h2><p>Card, bank transfer and USSD payments are now instant.'),
      'Any Nigerian with a debit card, mobile money, or USSD can pay instantly.', 'Thankeeu takes contributions through Flutterwave, so anyone with a debit card, bank transfer or USSD can chip in within seconds.'),
      'The infrastructure is solid, the fraud protection is real.', 'Card details are handled by Flutterwave, a regulated, PCI-DSS compliant provider.'),
      'Thankeeu processes all payments through Paystack.', 'Thankeeu processes all payments through Flutterwave.'),
      'with a Naira gift pot collected via the same Paystack infrastructure they help build every day.', 'with a gift pot everyone can chip in to from their phone.')
$$;

UPDATE blog_posts
   SET content          = pg_temp.fix_provider(content),
       excerpt          = pg_temp.fix_provider(excerpt),
       meta_description = pg_temp.fix_provider(meta_description),
       updated_at       = now()
 WHERE content ILIKE '%paystack%' OR excerpt ILIKE '%paystack%' OR meta_description ILIKE '%paystack%';

-- Check: remaining Paystack mentions should only be about Paystack the company.
-- SELECT slug, substring(content from position('Paystack' in content) - 60 for 140)
--   FROM blog_posts WHERE content ILIKE '%paystack%';
