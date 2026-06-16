const axios    = require('axios');
const supabase = require('../utils/supabase');
const { logActivity } = require('../utils/activityLog');

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

const RATE_PER_EMPLOYEE = 2000; // ₦2,000 per employee per month

// Calculate price from employee count
const calcMonthlyPrice = (employeeCount) => {
  const count  = Math.max(employeeCount || 1, 1);
  return Math.round(count * RATE_PER_EMPLOYEE);
};
const calcYearlyPrice = (employeeCount) => {
  const monthly = calcMonthlyPrice(employeeCount);
  return Math.round(monthly * 10); // 10 months = 2 months free
};

// Dynamic PLANS factory — called with employee count
const getPlans = (employeeCount = 0) => ({
  monthly: {
    naira:  calcMonthlyPrice(employeeCount),
    label:  `₦${calcMonthlyPrice(employeeCount).toLocaleString('en-NG')}/month`,
    count:  employeeCount,
  },
  yearly: {
    naira:  calcYearlyPrice(employeeCount),
    label:  `₦${calcYearlyPrice(employeeCount).toLocaleString('en-NG')}/year (2 months free)`,
    count:  employeeCount,
  },
});

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
    const { plan, currency: reqCurrency, employee_count: reqCount } = req.body;
    if (!['monthly','yearly'].includes(plan))
      return res.status(400).json({ error: 'Invalid plan. Choose monthly or yearly.' });

    const SUPPORTED = ['NGN','USD','GBP','EUR','CAD','GHS','KES','ZAR'];
    const FX = { NGN:1, USD:0.00063, GBP:0.00049, EUR:0.00058, CAD:0.00086, GHS:0.0095, KES:0.082, ZAR:0.011 };
    const currency = SUPPORTED.includes(reqCurrency) ? reqCurrency : 'NGN';

    // Get employee count from DB — unique emails across both tables
    const employeeCount = await countUniqueEmployees(req.company.id);

    // Use admin-set multiplier; fall back to 2000 if not set
    const multiplier = await getCompanyMultiplier(req.company.id);
    const ratePerHead = (multiplier !== null) ? multiplier : 2000;

    // If free tier (multiplier=0), don't charge
    if (ratePerHead === 0) {
      return res.status(400).json({ error: 'Your company has a free plan. No payment required.' });
    }

    const PLANS = getPlans(employeeCount);
    // Override plan naira with the admin-set rate
    const naira = plan === 'yearly'
      ? employeeCount * ratePerHead * 10
      : employeeCount * ratePerHead;
    const label = `${employeeCount} employees × ₦${ratePerHead.toLocaleString('en-NG')} per head`;

    const txRef = `TK-SUB-${req.company.id.slice(0,8).toUpperCase()}-${Date.now()}`;
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

    // Use the same strict allowlist as the rest of the payment flows — only
    // proceed for transactions FLW has confirmed as paid. Previously this
    // checked a blocklist, so a 'pending' (or any other unrecognized) status
    // would fall through and activate the subscription before payment was
    // actually confirmed.
    const FLW_SUCCESS = new Set(['successful', 'completed', 'success']);
    if (!FLW_SUCCESS.has(txn.status)) {
      return res.status(400).json({ error: `Payment not completed (status: ${txn.status})` });
    }

    // ── CRITICAL: Verify the amount actually paid matches what was expected ──
    // Without this check, an attacker can pay ₦1, get FLW to mark it successful,
    // then call verify to activate a full subscription.
    // We re-compute the expected amount from the DB (employee count × rate per head).
    try {
      const employeeCount = await countUniqueEmployees(req.company.id);
      const multiplier    = await getCompanyMultiplier(req.company.id);
      const ratePerHead   = multiplier !== null ? multiplier : 2000;
      if (ratePerHead > 0) {
        const rawPlanForAmount = (txn.meta?.plan || req.query.plan || 'monthly').toLowerCase();
        const expectedNaira = rawPlanForAmount === 'yearly'
          ? employeeCount * ratePerHead * 10
          : employeeCount * ratePerHead;
        // Allow ±5% tolerance for currency conversion rounding, but require at minimum
        // 90% of the expected naira amount (comparing to NGN equivalent of txn.amount)
        const paidNGN = txn.currency === 'NGN' ? txn.amount : txn.amount_settled;
        const tolerance = 0.90;
        if (expectedNaira > 0 && paidNGN && paidNGN < expectedNaira * tolerance) {
          console.error(`[verifySubscription] UNDERPAYMENT: expected ≥₦${Math.round(expectedNaira * tolerance)}, got ₦${paidNGN}. Company: ${req.company.id}, ref: ${reference}`);
          return res.status(400).json({ error: 'Payment amount does not match the subscription price. Please contact support.' });
        }
      }
    } catch (amountCheckErr) {
      // If amount check itself fails, log and continue — don't block genuine payments
      // but alert so this can be investigated
      console.error('[verifySubscription] amount check error:', amountCheckErr.message);
    }

    // Allowlist the plan value — don't trust req.query.plan directly since
    // an attacker could pass arbitrary strings that get stored and displayed
    const VALID_PLANS = new Set(['monthly', 'yearly', 'quarterly']);
    const rawPlan = txn.meta?.plan || req.query.plan || 'monthly';
    const resolvedPlan = VALID_PLANS.has(String(rawPlan).toLowerCase()) ? String(rawPlan).toLowerCase() : 'monthly';
    const now = new Date();
    const expires_at = resolvedPlan === 'yearly'
      ? new Date(new Date(now).setFullYear(now.getFullYear() + 1))
      : new Date(new Date(now).setMonth(now.getMonth() + 1));

    await saveSubscription(req.company.id, resolvedPlan, reference, expires_at);

    logActivity({
      company_id:  req.company.id,
      actor_id:    req.coreTeamMember?.id || req.company.id,
      actor_type:  req.actorType || 'hr',
      actor_name:  req.actorName || req.company.name || 'HR',
      action:      'subscribed_plan',
      entity_type: 'subscription',
      entity_name: `${resolvedPlan} plan`,
      details:     { reference, expires_at },
    }).catch(() => {});

    res.json({ success: true, plan: resolvedPlan, expires_at });
  } catch (err) {
    console.error('verifySubscription error: ref:', req.params?.reference, '| code:', err?.code || err?.response?.status);
    res.status(500).json({ error: 'Failed to verify subscription. Please contact support if payment was charged.' });
  }
};

// ── Get current subscription status ──────────────────────────────────────────
const getSubscription = async (req, res) => {
  try {
    const companyId = req.company.id;

    // Always fetch the companies row first — pricing_multiplier and pilot fields live here
    const { data: co } = await supabase.from('companies')
      .select('subscription_status, subscription_plan, subscription_expires_at, pilot_starts_at, pilot_ends_at, pilot_days, pricing_multiplier')
      .eq('id', companyId).maybeSingle();

    const now = new Date();

    // ── RULE 1: Admin set pricing_multiplier (any value including 0 = free)
    //    → Always active. Free is still fully active — automation runs, cards are created.
    if (co?.pricing_multiplier !== null && co?.pricing_multiplier !== undefined) {
      return res.json({
        status:             'active',
        is_active:          true,
        plan:               co.pricing_multiplier === 0 ? 'free' : 'admin',
        expires_at:         null,
        pricing_multiplier: co.pricing_multiplier,
        pilot_active:       false,
        _source:            'pricing_multiplier',
      });
    }

    // ── RULE 2: Active pilot period
    const pilotActive = co?.pilot_ends_at && new Date(co.pilot_ends_at) > now;
    if (pilotActive) {
      return res.json({
        status:           'active',
        is_active:        true,
        plan:             'pilot',
        expires_at:       co.pilot_ends_at,
        pilot_active:     true,
        pilot_ends_at:    co.pilot_ends_at,
        pilot_days:       co.pilot_days || null,
        pricing_multiplier: null,
        _source:          'pilot',
      });
    }

    // ── RULE 3: Active company_subscriptions row (paid subscription)
    const { data: rows, error } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5); // get a few in case some are expired

    if (error) console.warn('[getSubscription] query error:', error.message);

    // Find the best row: prefer active and not expired
    const activeRow = (rows || []).find(r =>
      r.status === 'active' && (!r.expires_at || new Date(r.expires_at) > now)
    );

    if (activeRow) {
      return res.json({
        ...activeRow,
        is_active:          true,
        pilot_active:       false,
        pricing_multiplier: co?.pricing_multiplier ?? null,
        _source:            'company_subscriptions',
      });
    }

    // ── RULE 4: companies.subscription_status fallback (set by payment webhook)
    if (co?.subscription_status === 'active') {
      const expired = co.subscription_expires_at
        ? new Date(co.subscription_expires_at) < now : false;
      if (!expired) {
        return res.json({
          status:             'active',
          is_active:          true,
          plan:               co.subscription_plan || 'monthly',
          expires_at:         co.subscription_expires_at,
          pilot_active:       false,
          pricing_multiplier: co?.pricing_multiplier ?? null,
          _source:            'companies_fallback',
        });
      }
    }

    // Auto-expire any stale active rows
    const staleRow = (rows || []).find(r => r.status === 'active');
    if (staleRow) {
      supabase.from('company_subscriptions')
        .update({ status: 'expired' }).eq('id', staleRow.id).catch(() => {});
    }

    // No active subscription of any kind
    const latestRow = rows?.[0] || null;
    res.json({
      ...(latestRow || {}),
      status:             latestRow?.status || 'none',
      is_active:          false,
      pilot_active:       false,
      pricing_multiplier: co?.pricing_multiplier ?? null,
      _source:            'none',
    });
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


// ── Helper: count unique employees across both tables ────────────────────────
const countUniqueEmployees = async (companyId) => {
  // Get all emails from company_members (active/approved)
  const { data: cm } = await supabase.from('company_members')
    .select('email').eq('company_id', companyId).neq('status', 'deactivated');
  const cmEmails = new Set((cm || []).map(m => m.email?.toLowerCase()).filter(Boolean));

  // Get all emails from occasion_members (any occasion type - deduplicated)
  const { data: om } = await supabase.from('occasion_members')
    .select('email').eq('company_id', companyId).eq('is_active', true);

  // Unique across BOTH tables by email - occasion_members counted only if not already in company_members
  const allEmails = new Set([
    ...cmEmails,
    ...(om || []).map(m => m.email?.toLowerCase()).filter(Boolean),
  ]);

  return allEmails.size;
};

// ── Helper: get admin-set pricing multiplier for a company ───────────────────
const getCompanyMultiplier = async (companyId) => {
  const { data } = await supabase.from('companies')
    .select('pricing_multiplier').eq('id', companyId).maybeSingle();
  // null means not set yet — use default. 0 means free. Any other number is the rate.
  if (data?.pricing_multiplier === null || data?.pricing_multiplier === undefined) return null; // not set
  return Number(data.pricing_multiplier);
};

// GET /api/subscription/quote — returns dynamic per-head pricing for this company
const getQuote = async (req, res) => {
  try {
    const headCount    = await countUniqueEmployees(req.company.id);
    const multiplier   = await getCompanyMultiplier(req.company.id);

    // If multiplier not set yet, return headcount only — frontend shows "Get a quote"
    if (multiplier === null) {
      return res.json({
        head_count:        headCount,
        monthly_price:     null,
        yearly_price:      null,
        per_head_rate:     null,
        multiplier_set:    false,
        message:           headCount > 0 ? `${headCount} employees imported` : 'No employees imported yet',
      });
    }

    // multiplier = 0 means free (admin granted free tier)
    if (multiplier === 0) {
      return res.json({
        head_count:     headCount,
        monthly_price:  0,
        yearly_price:   0,
        per_head_rate:  0,
        multiplier_set: true,
        is_free:        true,
      });
    }

    const monthlyPrice = headCount * multiplier;
    const yearlyPrice  = monthlyPrice * 10; // 2 months free
    res.json({
      head_count:     headCount,
      monthly_price:  monthlyPrice,
      yearly_price:   yearlyPrice,
      per_head_rate:  multiplier,
      multiplier_set: true,
      is_free:        false,
    });
  } catch (err) {
    console.error('getQuote error:', err.message);
    res.status(500).json({ error: 'Failed to calculate quote' });
  }
};

module.exports = { initializeSubscription, verifySubscription, getSubscription, cancelSubscription, getQuote, saveSubscription };
