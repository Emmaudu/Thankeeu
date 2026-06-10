const axios = require('axios');
const supabase = require('../utils/supabase');

const FLW_BASE    = 'https://api.flutterwave.com/v3';
const headers     = () => ({ Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' });
// Must use FRONTEND_URL (Vercel) not APP_URL (Railway backend) for redirect_url
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.APP_URL || 'https://thankeeu.com').replace(/\/$/, '');

// Subscription prices in Flutterwave (Naira).
const PLANS = {
  monthly: { naira: 200000,   label: '₦200,000/month'   },
  yearly:  { naira: 2400000,  label: '₦2,400,000/year'  },
};

const initializeSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan. Choose monthly or yearly.' });

    const { naira, label } = PLANS[plan];
    const txRef  = `TK-SUB-${req.company.id.slice(0,8).toUpperCase()}-${Date.now()}`;

    const response = await axios.post(`${FLW_BASE}/payments`, {
      tx_ref:         txRef,
      amount:         naira,           // Flutterwave uses Naira directly (NOT kobo)
      currency:       'NGN',
      redirect_url:   `${FRONTEND_URL}/company/subscription?sub=success&plan=${plan}&tx_ref=${txRef}`,
      customer:       { email: req.company.email, name: req.company.name },
      customizations: {
        title:       'Thankeeu for Teams',
        description: `${label} subscription`,
        logo:        `${FRONTEND_URL}/logo.png`,
      },
      meta: {
        type:         'company_subscription',
        company_id:   req.company.id,
        plan,
      },
    }, { headers: headers() });

    if (response.data.status !== 'success') throw new Error(response.data.message);

    const payment_link = response.data.data.link;
    // Return both payment_link (FLW) and authorization_url / access_code for backwards compat
    res.json({ payment_link, authorization_url: payment_link, access_code: txRef, reference: txRef });
  } catch (err) {
    console.error('initializeSubscription error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize subscription payment' });
  }
};

const verifySubscription = async (req, res) => {
  try {
    const { reference } = req.params;
    const response = await axios.get(`${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, { headers: headers() });
    const txn = response.data.data;

    if (!['successful', 'success', 'test'].includes(txn.status)) {
      if (['failed', 'abandoned', 'reversed', 'cancelled', 'error'].includes(txn.status)) {
        return res.status(400).json({ error: `Payment was not completed (status: ${txn.status})` });
      }
      // Other statuses (pending, processing) — allow through optimistically
      console.warn(`Subscription verify: unusual status "${txn.status}" for ref ${reference}`);
    }

    // Always trust the authenticated company (req.company.id) — never rely solely on Flutterwave metadata
    // which can occasionally be dropped or empty
    const resolvedCompanyId = req.company.id;
    const resolvedPlan      = txn.meta?.plan || req.query.plan || 'monthly'; // Bug 7: plan from meta, URL, or default

    const now2 = new Date();
    const expires_at = resolvedPlan === 'yearly'
      ? new Date(new Date(now2).setFullYear(now2.getFullYear() + 1))
      : new Date(new Date(now2).setMonth(now2.getMonth() + 1));

    // Check for existing subscription
    const { data: existing } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', resolvedCompanyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Extend/renew existing
      await supabase.from('company_subscriptions').update({
        expires_at, status: 'active', flw_reference: reference,
        plan: resolvedPlan, updated_at: new Date()
      }).eq('id', existing.id);
    } else {
      await supabase.from('company_subscriptions').insert({
        company_id: resolvedCompanyId, plan: resolvedPlan, status: 'active',
        amount: PLANS[resolvedPlan]?.naira || 200000,
        flw_reference: reference,
        starts_at: new Date(), expires_at
      });
    }

    // Update the company row itself so subscription status is easy to query
    await supabase.from('companies')
      .update({ subscription_status: 'active', subscription_plan: resolvedPlan, subscription_expires_at: expires_at })
      .eq('id', resolvedCompanyId)
      .catch(e => console.warn('Could not update company subscription_status:', e.message));

    res.json({ success: true, plan: resolvedPlan, expires_at });
  } catch (err) {
    console.error('Subscription verify error:', {
      message: err.message,
      flw_error: err.response?.data,
      reference: req.params?.reference,
    });
    res.status(500).json({ error: 'Failed to verify subscription. Please contact support if payment was charged.' });
  }
};

const getSubscription = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', req.company.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.json({ status: 'none', is_active: false });

    // Check if subscription is still valid
    const now = new Date();
    const expired = data.expires_at && new Date(data.expires_at) < now;
    const is_active = data.status === 'active' && !expired;

    // Auto-expire in DB if needed
    if (data.status === 'active' && expired) {
      await supabase.from('company_subscriptions').update({ status: 'expired' }).eq('id', data.id).catch(() => {});
      await supabase.from('companies').update({ subscription_status: 'expired' }).eq('id', req.company.id).catch(() => {});
    }

    res.json({ ...data, is_active });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { data: sub } = await supabase
      .from('company_subscriptions')
      .select('id')
      .eq('company_id', req.company.id)
      .eq('status', 'active')
      .single();

    if (!sub) return res.status(404).json({ error: 'No active subscription found' });

    await supabase.from('company_subscriptions').update({
      status: 'cancelled', cancelled_at: new Date(), auto_renew: false
    }).eq('id', sub.id);

    res.json({ message: 'Subscription cancelled. Access continues until expiry date.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

module.exports = { initializeSubscription, verifySubscription, getSubscription, cancelSubscription };
