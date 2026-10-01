/**
 * adminTransactionsController.js — Admin → Transactions.
 *
 * Flutterwave: read live from Flutterwave's own transaction list, so it shows
 * every attempt, including declined cards and their reason ("Restricted
 * Card", "Insufficient funds", …), card brand, country and the payment method
 * the customer used. Flutterwave returns 10 transactions per page.
 *
 * Lemon Squeezy: our lemon_payments table has every checkout we started (paid,
 * not completed, could not start, amount problems, refunds). Paid orders are
 * enriched from the Lemon Squeezy API (name, country, tax, receipt). Lemon
 * Squeezy does not give card details, phone numbers or decline reasons to
 * merchants through its API; a declined card is retried inside its checkout
 * and never reaches us, so such a checkout shows as "not completed".
 */
const axios = require('axios');
const supabase = require('../utils/supabase');

const FLW = 'https://api.flutterwave.com/v3';
const TIMEOUT = 20000;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const LS_PAGE_SIZE = 25;
const LS_EXPIRY_MS = 2 * 60 * 60 * 1000; // checkout links expire after 2 hours

const flwHeaders = () => ({ Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` });

// What a reference was for, from the prefix our code gives it.
const PRODUCTS = [
  ['TK-GAMES-SPONSOR-', 'Games sponsorship'],
  ['TK-FEE-', 'Card fee'],
  ['TK-CR-', 'Credits'],
  ['TK-SUB-', 'Company subscription'],
  ['TK-GIFT-', 'Gift to a card'],
  ['TK-SEND-', 'Money card'],
  ['TK-MNT-', 'Mentorship'],
  ['TK-VND-', 'Vendor gift order'],
];
const productFor = (ref) => {
  const r = String(ref || '').toUpperCase();
  const hit = PRODUCTS.find(([p]) => r.startsWith(p));
  return hit ? hit[1] : 'Other';
};

const PAYMENT_TYPES = {
  card: 'Card', bank_transfer: 'Bank transfer', account: 'Bank account', ussd: 'USSD',
  mobilemoneygh: 'Mobile money (Ghana)', mobilemoneyuganda: 'Mobile money (Uganda)',
  mobilemoneyzambia: 'Mobile money (Zambia)', mobilemoneyfranco: 'Mobile money', mpesa: 'M-Pesa',
  mobilemoneyrwanda: 'Mobile money (Rwanda)', mobilemoneytanzania: 'Mobile money (Tanzania)',
  barter: 'Barter', qr: 'QR', applepay: 'Apple Pay', googlepay: 'Google Pay', opay: 'OPay', enaira: 'eNaira',
  'bank transfer': 'Bank transfer',
};
const paymentTypeLabel = (t) => PAYMENT_TYPES[String(t || '').toLowerCase()] || (t ? String(t) : null);

/** YYYY-MM-DD, defaulting to `fallbackDaysAgo` days before today (UTC). */
function day(v, fallbackDaysAgo) {
  if (typeof v === 'string' && DAY_RE.test(v) && !isNaN(Date.parse(`${v}T00:00:00Z`))) return v;
  return new Date(Date.now() - fallbackDaysAgo * 86400000).toISOString().slice(0, 10);
}
const pageNum = (v) => Math.min(10000, Math.max(1, parseInt(v, 10) || 1));
const cleanEmail = (v) => String(v || '').trim().toLowerCase().slice(0, 254);

// ── Flutterwave ────────────────────────────────────────────────────────────

// Full transaction records, cached once the transaction is final.
const flwDetailCache = new Map();
const FINAL = new Set(['successful', 'failed', 'cancelled']);
async function flwDetail(id) {
  const key = String(id);
  if (flwDetailCache.has(key)) return flwDetailCache.get(key);
  const r = await axios.get(`${FLW}/transactions/${encodeURIComponent(key)}/verify`, { headers: flwHeaders(), timeout: TIMEOUT });
  const d = r.data?.data || null;
  if (d && FINAL.has(String(d.status).toLowerCase())) {
    if (flwDetailCache.size > 3000) flwDetailCache.delete(flwDetailCache.keys().next().value);
    flwDetailCache.set(key, d);
  }
  return d;
}

function statusGroup(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'successful' || s === 'success' || s === 'completed') return 'successful';
  if (s === 'pending' || s === 'processing' || s === 'new') return 'pending';
  return 'failed';
}

function normaliseFlw(t) {
  const card = t.card || null;
  const cust = t.customer || {};
  const group = statusGroup(t.status);
  const pr = t.processor_response ? String(t.processor_response) : null;
  const masked = card && (card.first_6digits || card.last_4digits)
    ? `${card.first_6digits || '••••••'}••••••${card.last_4digits || '••••'}` : null;
  return {
    provider: 'flutterwave',
    id: String(t.id),
    reference: t.tx_ref || null,
    provider_reference: t.flw_ref || null,
    product: productFor(t.tx_ref),
    status: String(t.status || '').toLowerCase(),
    status_group: group,
    reason: group === 'successful' ? null : (pr || (group === 'failed' ? 'No reason given by Flutterwave' : 'Waiting for the customer or the bank')),
    processor_response: pr,
    amount: Number(t.amount) || 0,
    charged_amount: t.charged_amount != null ? Number(t.charged_amount) : null,
    currency: t.currency || null,
    fee: t.app_fee != null ? Number(t.app_fee) : null,
    amount_settled: t.amount_settled != null ? Number(t.amount_settled) : null,
    name: cust.name || t.customer_name || null,
    email: cust.email || t.customer_email || null,
    phone: cust.phone_number || t.customer_phone || null,
    country: card?.country || null,
    card_type: card?.type || null,
    card_issuer: card?.issuer || null,
    card_number: masked,
    card_expiry: card?.expiry || null,
    payment_option: 'Flutterwave',
    payment_method: paymentTypeLabel(t.payment_type),
    bank: t.account?.bank || null,
    ip: t.ip || null,
    narration: t.narration || null,
    auth_model: t.auth_model || null,
    created_at: t.created_at || null,
  };
}

// GET /admin/transactions/flutterwave?page&status&from&to&email&reference
const listFlutterwave = async (req, res) => {
  if (!process.env.FLW_SECRET_KEY) return res.status(503).json({ error: 'FLW_SECRET_KEY is not set on the server.' });
  const from = day(req.query.from, 30);
  const to = day(req.query.to, 0);
  const page = pageNum(req.query.page);
  const status = ['successful', 'failed', 'pending'].includes(req.query.status) ? req.query.status : '';
  const params = { from, to, page };
  if (status) params.status = status;
  const email = cleanEmail(req.query.email);
  if (email) params.customer_email = email;
  const ref = String(req.query.reference || '').trim().slice(0, 120);
  if (ref) params.tx_ref = ref;

  try {
    const r = await axios.get(`${FLW}/transactions`, { headers: flwHeaders(), params, timeout: TIMEOUT });
    const list = Array.isArray(r.data?.data) ? r.data.data : [];
    const info = r.data?.meta?.page_info || {};

    // The list leaves out some fields (often phone and card). Fill them from
    // each transaction's full record. At most 10 per page, cached when final.
    const full = await Promise.all(list.map(async (t) => {
      const missing = !(t.customer?.phone_number || t.customer_phone)
        || (String(t.payment_type).toLowerCase() === 'card' && !t.card);
      if (!missing) return t;
      try { const d = await flwDetail(t.id); return d ? { ...t, ...d } : t; } catch { return t; }
    }));

    return res.json({
      provider: 'flutterwave',
      from, to, page,
      total: Number(info.total) || list.length,
      total_pages: Number(info.total_pages) || 1,
      items: full.map(normaliseFlw),
    });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('[admin transactions] flutterwave list failed:', msg);
    return res.status(502).json({ error: `Flutterwave did not return transactions: ${msg}` });
  }
};

// GET /admin/transactions/flutterwave/:id — everything Flutterwave has on one.
const flutterwaveDetail = async (req, res) => {
  if (!process.env.FLW_SECRET_KEY) return res.status(503).json({ error: 'FLW_SECRET_KEY is not set on the server.' });
  const id = String(req.params.id || '');
  if (!/^\d{1,20}$/.test(id)) return res.status(400).json({ error: 'Invalid transaction id' });
  try {
    const d = await flwDetail(id);
    if (!d) return res.status(404).json({ error: 'Transaction not found' });
    const { card, ...rest } = d;
    // Never send the reusable card token to the browser.
    const safeCard = card ? { ...card, token: undefined } : null;
    return res.json({ item: normaliseFlw(d), raw: { ...rest, card: safeCard } });
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    return res.status(err.response?.status === 404 ? 404 : 502).json({ error: `Flutterwave: ${msg}` });
  }
};

// ── Lemon Squeezy ──────────────────────────────────────────────────────────

const lsOrderCache = new Map();
async function lsOrder(orderId) {
  const key = String(orderId);
  const hit = lsOrderCache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.value;
  const ls = require('../utils/lemonSqueezy');
  const r = await axios.get(`${ls.API_BASE}/orders/${encodeURIComponent(key)}?include=customer`, { headers: ls.apiHeaders(), timeout: TIMEOUT });
  const order = r.data?.data || null;
  const customer = (r.data?.included || []).find(x => x.type === 'customers') || null;
  const value = order ? { order: order.attributes || {}, customer: customer?.attributes || null } : null;
  if (lsOrderCache.size > 2000) lsOrderCache.delete(lsOrderCache.keys().next().value);
  lsOrderCache.set(key, { at: Date.now(), value });
  return value;
}

const LS_TYPES = { card_fee: 'Card fee', card_credits: 'Credits', company_subscription: 'Company subscription' };
const usd = (cents) => (Number.isFinite(Number(cents)) ? (Number(cents) / 100).toFixed(2) : null);

function lsStatus(row, now = Date.now()) {
  const meta = row.meta || {};
  const age = now - new Date(row.created_at).getTime();
  switch (row.status) {
    case 'paid':
      return { group: 'successful', label: 'Paid', reason: null };
    case 'processing':
      return { group: 'pending', label: 'Paid, being applied', reason: 'Payment received; Thankeeu is applying it.' };
    case 'pending':
      return age < LS_EXPIRY_MS
        ? { group: 'pending', label: 'Checkout open', reason: 'The customer has the checkout open and has not paid yet.' }
        : { group: 'failed', label: 'Not completed', reason: 'The customer did not finish paying. They closed the checkout, their card was declined there, or the link expired. Lemon Squeezy does not tell us which.' };
    case 'init_failed':
      return { group: 'failed', label: 'Could not start', reason: `The checkout could not be created${meta.error ? `: ${meta.error}` : '.'}` };
    case 'amount_mismatch':
      return { group: 'failed', label: 'Amount problem', reason: `Paid ${usd(row.paid_total_usd_cents) ?? '?'} USD but ${usd(row.amount_usd_cents)} USD was expected. Nothing was applied; review it in Lemon Squeezy and refund if needed.` };
    case 'failed':
      return { group: 'failed', label: 'Failed', reason: 'Lemon Squeezy marked this order as failed or fraudulent.' };
    case 'refunded':
      return { group: 'refunded', label: 'Refunded', reason: 'Refunded in Lemon Squeezy.' };
    case 'partial_refund':
      return { group: 'refunded', label: 'Partly refunded', reason: 'Partly refunded in Lemon Squeezy.' };
    default:
      return { group: 'failed', label: row.status, reason: null };
  }
}

function normaliseLs(row, extra) {
  const meta = row.meta || {};
  const st = lsStatus(row);
  const o = extra?.order || null;
  const c = extra?.customer || null;
  const what = [LS_TYPES[row.type] || row.type];
  if (row.type === 'card_credits' && meta.credits) what.push(`${meta.credits} credits`);
  if (row.type === 'company_subscription' && meta.plan) what.push(meta.plan);
  return {
    provider: 'lemonsqueezy',
    id: row.reference,
    reference: row.reference,
    provider_reference: o?.identifier || row.order_identifier || row.order_id || null,
    order_number: o?.order_number || null,
    product: what.join(' · '),
    card_slug: meta.card_slug || null,
    status: st.label,
    status_group: st.group,
    reason: st.reason,
    amount: o ? Number(o.total) / 100 : Number(row.amount_usd_cents) / 100,
    currency: o?.currency || 'USD',
    amount_usd: o ? Number(o.total_usd) / 100 : Number(row.amount_usd_cents) / 100,
    tax: o && Number(o.tax) ? `${(Number(o.tax) / 100).toFixed(2)} ${o.currency}${o.tax_name ? ` (${o.tax_name})` : ''}` : null,
    name: o?.user_name || c?.name || meta.customer_name || null,
    email: o?.user_email || row.customer_email || null,
    phone: null,
    country: c?.country_formatted || c?.country || null,
    city: [c?.city, c?.region].filter(Boolean).join(', ') || null,
    card_type: null,
    card_number: null,
    payment_option: 'Lemon Squeezy',
    payment_method: 'Lemon Squeezy checkout',
    receipt_url: o?.urls?.receipt || null,
    test_mode: o ? !!o.test_mode : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /admin/transactions/lemonsqueezy?page&status&from&to&email
const listLemonSqueezy = async (req, res) => {
  const from = day(req.query.from, 30);
  const to = day(req.query.to, 0);
  const page = pageNum(req.query.page);
  const status = String(req.query.status || '');
  const email = cleanEmail(req.query.email);
  const expiredBefore = new Date(Date.now() - LS_EXPIRY_MS).toISOString();

  let q = supabase.from('lemon_payments').select('*', { count: 'exact' })
    .gte('created_at', `${from}T00:00:00.000Z`).lte('created_at', `${to}T23:59:59.999Z`);
  if (status === 'successful') q = q.eq('status', 'paid');
  else if (status === 'failed') q = q.or(`status.in.(init_failed,failed,amount_mismatch),and(status.eq.pending,created_at.lt."${expiredBefore}")`);
  else if (status === 'pending') q = q.or(`status.eq.processing,and(status.eq.pending,created_at.gte."${expiredBefore}")`);
  else if (status === 'refunded') q = q.in('status', ['refunded', 'partial_refund']);
  if (email) q = q.ilike('customer_email', `%${email.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const ref = String(req.query.reference || '').trim().slice(0, 120);
  if (ref) q = q.eq('reference', ref);

  const start = (page - 1) * LS_PAGE_SIZE;
  const { data, error, count } = await q.order('created_at', { ascending: false }).range(start, start + LS_PAGE_SIZE - 1);
  if (error) {
    if (/lemon_payments/.test(error.message || '') && /exist|find/i.test(error.message || '')) {
      return res.json({ provider: 'lemonsqueezy', from, to, page, total: 0, total_pages: 1, items: [], notice: 'Run database/migration_lemon_payments.sql to start recording Lemon Squeezy payments.' });
    }
    console.error('[admin transactions] lemon list failed:', error.message);
    return res.status(500).json({ error: 'Could not load Lemon Squeezy payments' });
  }

  // Order details for rows Lemon Squeezy has an order for (5 at a time).
  const rows = data || [];
  const extras = new Array(rows.length).fill(null);
  const ls = require('../utils/lemonSqueezy');
  let lookupFailed = false;
  if (ls.isConfigured()) {
    for (let i = 0; i < rows.length; i += 5) {
      await Promise.all(rows.slice(i, i + 5).map(async (row, j) => {
        if (!row.order_id) return;
        try { extras[i + j] = await lsOrder(row.order_id); } catch { lookupFailed = true; }
      }));
    }
  }

  return res.json({
    provider: 'lemonsqueezy',
    from, to, page,
    total: count || 0,
    total_pages: Math.max(1, Math.ceil((count || 0) / LS_PAGE_SIZE)),
    items: rows.map((r, i) => normaliseLs(r, extras[i])),
    ...(lookupFailed ? { notice: 'Some order details could not be loaded from Lemon Squeezy right now.' } : {}),
  });
};

// GET /admin/transactions/lemonsqueezy/:ref
const lemonSqueezyDetail = async (req, res) => {
  const ref = String(req.params.id || '').slice(0, 120);
  const { data: row, error } = await supabase.from('lemon_payments').select('*').eq('reference', ref).maybeSingle();
  if (error) return res.status(500).json({ error: 'Could not load this payment' });
  if (!row) return res.status(404).json({ error: 'Payment not found' });
  let extra = null;
  if (row.order_id) { try { extra = await lsOrder(row.order_id); } catch { extra = null; } }
  const { status_token: _t, ...safeRow } = row; // the return-page secret stays on the server
  return res.json({ item: normaliseLs(row, extra), raw: { record: safeRow, order: extra?.order || null, customer: extra?.customer || null } });
};

module.exports = {
  listFlutterwave, flutterwaveDetail, listLemonSqueezy, lemonSqueezyDetail,
  _normaliseFlw: normaliseFlw, _normaliseLs: normaliseLs, _productFor: productFor, _lsStatus: lsStatus,
};
