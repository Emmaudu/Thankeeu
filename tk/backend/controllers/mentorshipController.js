'use strict';
const axios    = require('axios');
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const FLW_BASE    = 'https://api.flutterwave.com/v3';
const FLW_TIMEOUT = 12000;
const FLW_SUCCESS = new Set(['successful', 'completed', 'success']);

// Mentorship subdomain URL — where FLW redirects the browser after payment.
// Falls back to the subdomain if the env var isn't set.
const MENTORSHIP_URL = (() => {
  const raw = (process.env.MENTORSHIP_URL || 'https://mentorship.thankeeu.com').trim();
  return raw.startsWith('http') ? raw.replace(/\/$/, '') : 'https://mentorship.thankeeu.com';
})();

const flwHeaders = () => ({
  Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLANS = {
  monthly: { amount: 50000, label: 'Monthly Mentorship' },
  weekly:  { amount: 12500, label: 'Weekly Mentorship' },
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Parent application (two-step flow submitted together)
// POST /api/mentorship/apply
// ─────────────────────────────────────────────────────────────────────────────
const submitApplication = async (req, res) => {
  try {
    const { parent_name, parent_email, parent_phone, child_class, career_paths } = req.body;

    if (!parent_name?.trim() || !parent_email?.trim() || !parent_phone?.trim() || !child_class?.trim()) {
      return res.status(400).json({ error: 'Parent name, email, phone and child class are all required' });
    }
    if (!emailRx.test(parent_email)) return res.status(400).json({ error: 'Please enter a valid email address' });
    if (!Array.isArray(career_paths) || career_paths.length === 0) {
      return res.status(400).json({ error: 'Please select at least one career path' });
    }
    // Sanitise paths — strings only, cap the count and length defensively
    const cleanPaths = career_paths
      .filter(p => typeof p === 'string' && p.trim())
      .map(p => p.trim().slice(0, 80))
      .slice(0, 40);

    const { data: app, error } = await supabase.from('mentorship_applications').insert({
      parent_name:  parent_name.trim(),
      parent_email: parent_email.trim().toLowerCase(),
      parent_phone: parent_phone.trim(),
      child_class:  child_class.trim(),
      career_paths: cleanPaths,
      status:       'new',
    }).select().maybeSingle();
    if (error) throw error;

    // Notify admin (plain email — no template dependency)
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'support@thankeeu.com',
      subject: `New Mentorship application — ${parent_name.trim()}`,
      html: `
        <h2>New Thankeeu Mentorship application</h2>
        <p><strong>Parent:</strong> ${parent_name.trim()}</p>
        <p><strong>Email:</strong> ${parent_email.trim()}</p>
        <p><strong>Phone:</strong> ${parent_phone.trim()}</p>
        <p><strong>Child class:</strong> ${child_class.trim()}</p>
        <p><strong>Career paths:</strong> ${cleanPaths.join(', ')}</p>
        <p>View in the admin panel to follow up.</p>`,
    }).catch(() => {});

    // Confirmation to parent
    await sendEmail({
      to: parent_email.trim(),
      subject: 'We received your Thankeeu Mentorship application',
      html: `
        <div style="font-family:'Nunito Sans',sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <h2 style="color:#7C3AED;">Thank you, ${parent_name.trim().split(' ')[0]}!</h2>
          <p>We've received your application for Thankeeu Mentorship. Our team will reach out shortly to discuss the next steps and match your child with the right mentor.</p>
          <p style="color:#6D5EA0;">— The Thankeeu Mentorship Team</p>
        </div>`,
    }).catch(() => {});

    res.status(201).json({ ok: true, application_id: app.id, message: 'Application received! Our team will reach out shortly.' });
  } catch (err) {
    console.error('submitApplication error:', err.message);
    res.status(500).json({ error: 'Could not submit your application. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Contact form
// POST /api/mentorship/contact
// ─────────────────────────────────────────────────────────────────────────────
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }
    if (!emailRx.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' });

    const { error } = await supabase.from('mentorship_contacts').insert({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      phone:   phone?.trim() || null,
      message: message.trim(),
      status:  'new',
    });
    if (error) throw error;

    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'support@thankeeu.com',
      subject: `New Mentorship contact message — ${name.trim()}`,
      html: `<h2>New contact message</h2><p><strong>${name.trim()}</strong> (${email.trim()}${phone ? ', ' + phone.trim() : ''})</p><p>${message.trim()}</p>`,
    }).catch(() => {});

    res.status(201).json({ ok: true, message: "Message sent! We'll get back to you soon." });
  } catch (err) {
    console.error('submitContact error:', err.message);
    res.status(500).json({ error: 'Could not send your message. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — Start a subscription payment (Flutterwave, same account as main app)
// POST /api/mentorship/subscribe   body: { plan, parent_name, parent_email, application_id? }
// ─────────────────────────────────────────────────────────────────────────────
const startSubscription = async (req, res) => {
  try {
    const { plan, parent_name, parent_email, application_id } = req.body;
    const planDef = PLANS[plan];
    if (!planDef) return res.status(400).json({ error: 'Choose a valid plan (monthly or weekly)' });
    if (!parent_email?.trim() || !emailRx.test(parent_email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const txRef = `TK-MNT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    await supabase.from('mentorship_subscriptions').insert({
      parent_name:   parent_name?.trim() || null,
      parent_email:  parent_email.trim().toLowerCase(),
      plan,
      amount_ngn:    planDef.amount,
      currency:      'NGN',
      flw_reference: txRef,
      status:        'pending',
      application_id: application_id || null,
    });

    const payload = {
      tx_ref:       txRef,
      amount:       planDef.amount,
      currency:     'NGN',
      redirect_url: `${MENTORSHIP_URL}/subscribe/verify`,
      customer:     { email: parent_email.trim(), name: parent_name?.trim() || parent_email.trim() },
      customizations: {
        title:       'Thankeeu Mentorship',
        description: planDef.label,
      },
      meta: { type: 'mentorship_subscription', plan, parent_email: parent_email.trim() },
    };

    const r = await axios.post(`${FLW_BASE}/payments`, payload, { headers: flwHeaders(), timeout: FLW_TIMEOUT });
    if (r.data.status !== 'success' || !r.data.data?.link) {
      throw new Error(r.data.message || 'Could not create payment link');
    }
    res.json({ payment_link: r.data.data.link, tx_ref: txRef });
  } catch (err) {
    console.error('startSubscription error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Could not start payment. Please try again.' });
  }
};

// GET /api/mentorship/subscribe/verify?tx_ref=...
const verifySubscription = async (req, res) => {
  try {
    const txRef = String(req.query.tx_ref || '').trim();
    if (!txRef) return res.status(400).json({ error: 'tx_ref is required' });

    const r = await axios.get(
      `${FLW_BASE}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      { headers: flwHeaders(), timeout: FLW_TIMEOUT }
    );
    if (r.data.status !== 'success') throw new Error('Verification failed');
    const txn = r.data.data;

    const { data: sub } = await supabase.from('mentorship_subscriptions')
      .select('*').eq('flw_reference', txRef).maybeSingle();
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    if (sub.status === 'paid') return res.json({ ok: true, already: true, plan: sub.plan });

    const paidOk = FLW_SUCCESS.has(txn.status) && txn.amount >= sub.amount_ngn * 0.9 && txn.currency === 'NGN';
    if (!paidOk) {
      await supabase.from('mentorship_subscriptions').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', sub.id);
      return res.status(400).json({ error: 'Payment could not be confirmed' });
    }

    await supabase.from('mentorship_subscriptions')
      .update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', sub.id);

    res.json({ ok: true, plan: sub.plan });
  } catch (err) {
    console.error('verifySubscription error:', err.message);
    res.status(500).json({ error: 'Could not verify payment' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN (reuses existing adminAuth middleware)
// ─────────────────────────────────────────────────────────────────────────────
const adminListApplications = async (req, res) => {
  try {
    const { status } = req.query;
    let q = supabase.from('mentorship_applications').select('*').order('created_at', { ascending: false });
    if (status && status !== 'all') q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ applications: data || [] });
  } catch (err) { res.status(500).json({ error: 'Could not load applications' }); }
};

const adminUpdateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const patch = { updated_at: new Date().toISOString() };
    if (status)       patch.status = status;
    if (admin_notes !== undefined) patch.admin_notes = admin_notes;
    const { data, error } = await supabase.from('mentorship_applications')
      .update(patch).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Application not found' });
    res.json({ ok: true, application: data });
  } catch (err) { res.status(500).json({ error: 'Could not update application' }); }
};

const adminListContacts = async (req, res) => {
  try {
    const { data, error } = await supabase.from('mentorship_contacts')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ contacts: data || [] });
  } catch (err) { res.status(500).json({ error: 'Could not load contacts' }); }
};

const adminListSubscriptions = async (req, res) => {
  try {
    const { data, error } = await supabase.from('mentorship_subscriptions')
      .select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ subscriptions: data || [] });
  } catch (err) { res.status(500).json({ error: 'Could not load subscriptions' }); }
};

module.exports = {
  submitApplication,
  submitContact,
  startSubscription,
  verifySubscription,
  adminListApplications,
  adminUpdateApplication,
  adminListContacts,
  adminListSubscriptions,
};
