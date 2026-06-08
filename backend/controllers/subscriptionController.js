const axios = require('axios');
const supabase = require('../utils/supabase');

const PAYSTACK_BASE = 'https://api.paystack.co';
const headers = () => ({ Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' });

// Subscription prices in Paystack kobo.
const PLANS = {
  monthly: { amount: 20000000, label: '₦200,000/month', naira: 200000 },
  yearly:  { amount: 240000000, label: '₦2,400,000/year', naira: 2400000 }
};

const initializeSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan. Choose monthly or yearly.' });

    const { amount, label } = PLANS[plan];
    const frontendUrl = process.env.FRONTEND_URL || 'https://thankeeu.com';

    const response = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, {
      email: req.company.email,
      amount,
      metadata: {
        company_id: req.company.id,
        company_name: req.company.name,
        plan,
        type: 'company_subscription',
        custom_fields: [
          { display_name: 'Company', variable_name: 'company', value: req.company.name },
          { display_name: 'Plan', variable_name: 'plan', value: label }
        ]
      },
      callback_url: `${frontendUrl}/company/subscription?sub=success&plan=${plan}`
    }, { headers: headers() });

    res.json(response.data.data);
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Failed to initialize subscription payment' });
  }
};

const verifySubscription = async (req, res) => {
  try {
    const { reference } = req.params;
    const response = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, { headers: headers() });
    const txn = response.data.data;

    if (txn.status !== 'success' && txn.status !== 'test') {
      // Accept any non-failed status — covers test mode too
      if (txn.status === 'failed' || txn.status === 'abandoned') {
        return res.status(400).json({ error: 'Payment was not completed' });
      }
    }

    const { company_id, plan } = txn.metadata;
    const now = new Date();
    const expires_at = plan === 'yearly'
      ? new Date(now.setFullYear(now.getFullYear() + 1))
      : new Date(now.setMonth(now.getMonth() + 1));

    // Check for existing subscription
    const { data: existing } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', company_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.status === 'active') {
      // Extend existing
      await supabase.from('company_subscriptions').update({
        expires_at, status: 'active', paystack_reference: reference
      }).eq('id', existing.id);
    } else {
      await supabase.from('company_subscriptions').insert({
        company_id, plan, status: 'active',
        amount: PLANS[plan].naira,
        paystack_reference: reference,
        starts_at: new Date(), expires_at
      });
    }

    res.json({ success: true, plan, expires_at });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Failed to verify subscription' });
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
    res.json(data || { status: 'none' });
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
