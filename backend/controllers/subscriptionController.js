const axios    = require('axios');
const supabase = require('../utils/supabase');

const FLW_BASE = 'https://api.flutterwave.com/v3';
const headers  = () => ({ Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' });

const cleanUrl = (u) => {
  if (!u) return 'https://thankeeu.com';
  let s = String(u).trim();
  const eqIdx = s.indexOf('=');
  if (eqIdx !== -1 && !s.startsWith('http')) s = s.slice(eqIdx + 1).trim();
  s = s.replace(/[\r\n\s]+/g, '').replace(/\/$/, '');
  return s.startsWith('http') ? s : 'https://thankeeu.com';
};
const FRONTEND_URL = cleanUrl(process.env.FRONTEND_URL || 'https://thankeeu.com');

const PLANS = {
  monthly: { naira: 200000,  label: '₦200,000/month'  },
  yearly:  { naira: 2400000, label: '₦2,400,000/year' },
};

// ── Helper: write subscription to BOTH tables so any query path finds it ─────
const saveSubscription = async (companyId, plan, flwReference, expiresAt) => {
  const log = (msg) => console.log(`[subscription] ${msg}`);

  // 1. companies.subscription_status — simplest fallback, always works
  const { error: coErr } = await supabase.from('companies')
    .update({
      subscription_status:     'active',
      subscription_plan:       plan,
      subscription_expires_at: expiresAt,
    })
    .eq('id', companyId);
  if (coErr) console.error('[subscription] companies update error:', coErr.message);
  else log(`companies.subscription_status = active for ${companyId}`);

  // 2. company_subscriptions row — upsert by (company_id, flw_reference) so
  //    duplicate runs (verify + webhook) are idempotent
  const existing = await supabase.from('company_subscriptions')
    .select('id, status')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1);

  const existingRow = existing.data?.[0];

  if (existingRow) {
    const { error: upErr } = await supabase.from('company_subscriptions')
      .update({ status: 'active', plan, flw_reference: flwReference, expires_at: expiresAt, updated_at: new Date() })
      .eq('id', existingRow.id);
    if (upErr) console.error('[subscription] update error:', upErr.message);
    else log(`updated row ${existingRow.id}`);
  } else {
    const { error: inErr } = await supabase.from('company_subscriptions').insert({
      company_id:    companyId,
      plan,
      status:        'active',
      amount:        PLANS[plan]?.naira || 200000,
      flw_reference: flwReference,
      starts_at:     new Date(),
      expires_at:    expiresAt,
    });
    if (inErr) console.error('[subscription] insert error:', inErr.message);
    else log(`inserted new row for company ${companyId}`);
  }
};

// ── Initialize payment ───────────────────────────────────────────────────────
const initializeSubscription = async (req, res) => {
  try {
    const { plan, currency: reqCurrency } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan. Choose monthly or yearly.' });

    const SUPPORTED = ['NGN','USD','GBP','EUR','CAD','GHS','KES','ZAR'];
    const FX = { NGN:1, USD:0.00063, GBP:0.00049, EUR:0.00058, CAD:0.00086, GHS:0.0095, KES:0.082, ZAR:0.011 };
    const currency = SUPPORTED.includes(reqCurrency) ? reqCurrency : 'NGN';

    const txRef = `TK-SUB-${req.company.id.slice(0,8).toUpperCase()}-${Date.now()}`;
    const { naira, label } = PLANS[plan];
    const amount = currency === 'NGN' ? naira : parseFloat((naira * FX[currency]).toFixed(2));

    const response = await axios.post(`${FLW_BASE}/payments`, {
      tx_ref:       txRef,
      amount,
      currency,
      redirect_url: `${FRONTEND_URL}/company/subscription?sub=success&plan=${plan}&tx_ref=${txRef}`,
      customer:     { email: req.company.email, name: req.company.name },
      customizations: {
        title:       'Thankeeu for Teams',
        description: `${label} subscription`,
        logo:        `${FRONTEND_URL}/logo.png`,
      },
      meta: { type: 'company_subscription', company_id: req.company.id, plan },
    }, { headers: headers() });

    if (response.data.status !== 'success') throw new Error(response.data.message);
    const payment_link = response.data.data.link;
    res.json({ payment_link, authorization_url: payment_link, access_code: txRef, reference: txRef });
  } catch (err) {
    console.error('initializeSubscription error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize subscription payment' });
  }
};

// ── Verify payment (called from frontend redirect) ───────────────────────────
const verifySubscription = async (req, res) => {
  try {
    const { reference } = req.params;
    console.log('[verifySubscription] ref:', reference, 'company:', req.company.id);

    const response = await axios.get(
      `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: headers() }
    );
    const txn = response.data.data;
    console.log('[verifySubscription] FLW status:', txn.status, 'amount:', txn.amount);

    if (['failed', 'abandoned', 'reversed', 'cancelled', 'error'].includes(txn.status)) {
      return res.status(400).json({ error: `Payment was not completed (status: ${txn.status})` });
    }

    const resolvedPlan = txn.meta?.plan || req.query.plan || 'monthly';
    const now = new Date();
    const expires_at = resolvedPlan === 'yearly'
      ? new Date(new Date(now).setFullYear(now.getFullYear() + 1))
      : new Date(new Date(now).setMonth(now.getMonth() + 1));

    await saveSubscription(req.company.id, resolvedPlan, reference, expires_at);

    res.json({ success: true, plan: resolvedPlan, expires_at });
  } catch (err) {
    console.error('verifySubscription error:', err.response?.data || err.message, 'ref:', req.params?.reference);
    res.status(500).json({ error: 'Failed to verify subscription. Please contact support if payment was charged.' });
  }
};

// ── Get current subscription status ──────────────────────────────────────────
const getSubscription = async (req, res) => {
  try {
    // Primary: company_subscriptions table
    const { data: rows, error } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', req.company.id)
      .order('created_at', { ascending: false })
      .limit(1);    // returns array — safe against multiple rows / maybeSingle errors

    if (error) {
      console.warn('[getSubscription] company_subscriptions query error:', error.message, '— trying fallback');
    }

    const data = rows?.[0] || null;

    // Fallback: check companies.subscription_status (set by verifySubscription)
    if (!data || data.status !== 'active') {
      const { data: co } = await supabase.from('companies')
        .select('subscription_status, subscription_plan, subscription_expires_at')
        .eq('id', req.company.id)
        .single();

      if (co?.subscription_status === 'active') {
        const expired = co.subscription_expires_at
          ? new Date(co.subscription_expires_at) < new Date()
          : false;
        if (!expired) {
          return res.json({
            status:     'active',
            is_active:  true,
            plan:       co.subscription_plan || 'monthly',
            expires_at: co.subscription_expires_at,
            _source:    'companies_fallback',
          });
        }
      }

      if (!data) return res.json({ status: 'none', is_active: false });
    }

    // Evaluate from company_subscriptions row
    const now     = new Date();
    const expired = data.expires_at ? new Date(data.expires_at) < now : false;
    const is_active = data.status === 'active' && !expired;

    // Auto-expire if past expiry
    if (data.status === 'active' && expired) {
      try { await supabase.from('company_subscriptions').update({ status: 'expired' }).eq('id', data.id); } catch {}
      try { await supabase.from('companies').update({ subscription_status: 'expired' }).eq('id', req.company.id); } catch {}
    }

    res.json({ ...data, is_active });
  } catch (err) {
    console.error('[getSubscription] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

// ── Cancel ───────────────────────────────────────────────────────────────────
const cancelSubscription = async (req, res) => {
  try {
    const { data: rows } = await supabase
      .from('company_subscriptions')
      .select('id')
      .eq('company_id', req.company.id)
      .eq('status', 'active')
      .limit(1);

    if (!rows?.[0]) return res.status(404).json({ error: 'No active subscription found' });

    await supabase.from('company_subscriptions').update({
      status: 'cancelled', cancelled_at: new Date(), auto_renew: false,
    }).eq('id', rows[0].id);

    await supabase.from('companies').update({ subscription_status: 'cancelled' }).eq('id', req.company.id);

    res.json({ message: 'Subscription cancelled. Access continues until expiry date.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

module.exports = { initializeSubscription, verifySubscription, getSubscription, cancelSubscription, saveSubscription };
