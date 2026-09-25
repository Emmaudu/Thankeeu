// cardPayment.js — the single source of truth for "has this card's fee been paid?"
//
// ── Create Now, Pay Later ────────────────────────────────────────────────────
// An individual creator can publish a card BEFORE paying. The card goes
// `status: 'active'` (so people can sign it, add media and chip in to the gift
// pot) with `payment_pending: true`. While payment_pending is true the card is
// NEVER delivered to the recipient — not by the scheduler, not by the minute
// sweep, not by "Send now". The moment the fee is paid (Flutterwave redirect,
// Flutterwave webhook, a credit, or a 100%-off code) `markCardFeePaid` clears
// the flag and re-arms delivery; a card whose date has already passed is then
// delivered straight away.
//
// Company / team / pal cards are free and are never marked payment_pending.
//
// Schema tolerance: every read of `payment_pending` treats "column does not
// exist" (migration not run yet) as "not pending", so existing deliveries keep
// working. The one WRITE that matters — publishing unpaid — fails closed:
// without the column the card is not published, because an unpaid card that
// cannot be flagged would be delivered for free.

const supabase = require('./supabase');

const CARD_FEE_NGN = 5000;
const CARD_FEE_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'GHS', 'KES', 'ZAR'];
// Approximate — Flutterwave converts at live rates at checkout.
const CARD_FEE_FX = { NGN: 1, USD: 0.00063, GBP: 0.00049, EUR: 0.00058, CAD: 0.00086, GHS: 0.0095, KES: 0.082, ZAR: 0.011 };

const isMissingColumnError = (err) => !!err && (
  err.code === '42703' || err.code === 'PGRST204' ||
  /column .* does not exist|could not find the .* column/i.test(`${err.message || ''} ${err.details || ''}`)
);

let warnedMissing = false;
const warnMissingSchema = (where) => {
  if (warnedMissing) return;
  warnedMissing = true;
  console.warn(`[pay-later] cards.payment_pending is missing (${where}). Run database/migration_pay_later_and_hero.sql in Supabase.`);
};

/** Company, team and pal cards are free; only individual cards carry the fee. */
const cardRequiresFee = (card) => !!card && !card.company_id && !card.pal_group_id;

/**
 * Authoritative, fresh read of the flag. Missing column → false (legacy
 * behaviour); any other error is thrown so callers fail closed.
 */
async function isPaymentPending(cardId) {
  if (!cardId) return false;
  const { data, error } = await supabase
    .from('cards').select('payment_pending').eq('id', cardId).maybeSingle();
  if (error) {
    if (isMissingColumnError(error)) { warnMissingSchema('isPaymentPending'); return false; }
    throw error;
  }
  return !!data?.payment_pending;
}

/**
 * Run a cards query with a `payment_pending = false` filter, falling back to
 * the unfiltered query on a database that has not been migrated yet.
 * `build(withFilter)` must return a fresh Supabase query builder.
 */
async function queryExcludingUnpaid(build, label) {
  let res = await build(true);
  if (res.error && isMissingColumnError(res.error)) {
    warnMissingSchema(label);
    res = await build(false);
  }
  return res;
}

/**
 * Publish an unpaid individual card: draft → active + payment_pending.
 * Conditional on the card still being a draft so a double click, or a
 * payment landing at the same moment, can never flag a paid card as unpaid.
 * Returns { published: boolean }. Throws { code: 'PAY_LATER_SCHEMA_MISSING' }
 * when the migration has not been run.
 */
async function publishUnpaid(slug) {
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('cards')
    .update({
      status: 'active',
      payment_pending: true,
      payment_reminder_count: 0,
      // The "congratulations — now pay when you are ready" email counts as
      // the first nudge; the reminder sweep measures its interval from here.
      payment_reminder_sent_at: now,
      updated_at: now,
    })
    .eq('slug', slug)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle();
  if (error) {
    if (isMissingColumnError(error)) {
      warnMissingSchema('publishUnpaid');
      const e = new Error('Pay-later needs the latest database migration');
      e.code = 'PAY_LATER_SCHEMA_MISSING';
      throw e;
    }
    throw error;
  }
  return { published: !!data };
}

/**
 * Record that a card's fee has been paid. Idempotent and race-safe:
 *   - a draft is published (pay-now path),
 *   - a pay-later card has its flag cleared — the conditional update means
 *     exactly one of (redirect verify, webhook, retry) sees wasPending=true,
 *     so follow-up emails are sent once,
 *   - delivery is (re)armed; an overdue card is delivered immediately.
 * Never downgrades a delivered ('sent') card back to 'active'.
 */
async function markCardFeePaid(slug) {
  const now = new Date().toISOString();

  const { data: activated, error: activateErr } = await supabase.from('cards')
    .update({ status: 'active', updated_at: now })
    .eq('slug', slug)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle();
  if (activateErr) throw activateErr;

  let wasPending = false;
  const { data: cleared, error: clearErr } = await supabase.from('cards')
    .update({ payment_pending: false, fee_paid_at: now })
    .eq('slug', slug)
    .eq('payment_pending', true)
    .select('id')
    .maybeSingle();
  if (clearErr) {
    if (isMissingColumnError(clearErr)) warnMissingSchema('markCardFeePaid');
    else throw clearErr;
  } else {
    wasPending = !!cleared;
  }

  if (activated && !wasPending) {
    // Pay-now path: stamp when it was paid. Best effort — optional column.
    const { error: stampErr } = await supabase.from('cards')
      .update({ fee_paid_at: now }).eq('slug', slug).is('fee_paid_at', null);
    if (stampErr && !isMissingColumnError(stampErr)) {
      console.warn('[pay-later] fee_paid_at stamp failed:', stampErr.message);
    }
  }

  const { data: card } = await supabase.from('cards').select('*').eq('slug', slug).maybeSingle();

  if (card && card.status === 'active' && !card.recipient_notified && !card.payment_pending
      && card.send_date && card.recipient_email) {
    try {
      require('./scheduler').scheduleCardDelivery(card);
    } catch (_) { /* scheduler not initialised yet — the minute sweep delivers it */ }
  }

  return { card, wasPending, wasDraft: !!activated };
}

/**
 * Does a successful Flutterwave card-fee transaction cover the fee?
 * Compared in the currency actually charged: txn.amount is in txn.currency,
 * so comparing a USD 3.15 charge against ₦5,000 (the old check) rejected every
 * foreign-currency payment as an underpayment.
 */
function isCardFeeAmountOk(txn) {
  const meta = txn?.meta || {};
  const paid = Number(txn?.amount);
  if (!isFinite(paid) || paid <= 0) return false;
  const expectedNGN = Number(meta.expected_ngn) > 0 ? Number(meta.expected_ngn) : CARD_FEE_NGN;
  const currency = String(txn?.currency || meta.currency || 'NGN').toUpperCase();
  if (currency === 'NGN') return paid >= expectedNGN * 0.9;
  const expectedInCurrency =
    Number(meta.expected_amount) > 0 && String(meta.currency || '').toUpperCase() === currency
      ? Number(meta.expected_amount)
      : (CARD_FEE_FX[currency] ? expectedNGN * CARD_FEE_FX[currency] : null);
  if (!expectedInCurrency) return false; // unknown currency — refuse, support can resolve
  return paid >= expectedInCurrency * 0.9;
}

/** "Friday, 3 October 2026, 09:00 UTC"-style label for emails. */
/** Printed in the recipient's time zone when the creator chose one, else UTC. */
function humanSendDate(sendDate, timeZone) {
  if (!sendDate) return null;
  const d = new Date(sendDate);
  if (isNaN(d.getTime())) return null;
  const opts = {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  };
  try {
    return d.toLocaleString('en-GB', { ...opts, timeZone: timeZone || 'UTC' });
  } catch {
    return d.toLocaleString('en-GB', { ...opts, timeZone: 'UTC' });
  }
}

module.exports = {
  CARD_FEE_NGN,
  CARD_FEE_CURRENCIES,
  CARD_FEE_FX,
  isMissingColumnError,
  cardRequiresFee,
  isPaymentPending,
  queryExcludingUnpaid,
  publishUnpaid,
  markCardFeePaid,
  isCardFeeAmountOk,
  humanSendDate,
};
