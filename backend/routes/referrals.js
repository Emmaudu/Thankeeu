const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticate } = require('../middleware/auth');
const { initiateTransfer, generateReference } = require('../utils/flutterwave');

// Slug rules: 3-30 chars, lowercase letters/numbers/hyphens only.
function normaliseSlug(raw) {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')   // non-allowed -> hyphen
    .replace(/-+/g, '-')            // collapse repeats
    .replace(/^-|-$/g, '');         // trim edge hyphens
}

const RESERVED = new Set([
  'admin', 'api', 'auth', 'login', 'signup', 'refer', 'referral', 'taskeeu',
  'support', 'about', 'terms', 'privacy', 'blog', 'teams', 'tasks', 'taskers',
]);

// ─── GET /referrals/me — my slug + referral wallet summary ─────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: me } = await supabase
      .from('users').select('referral_slug, full_name').eq('id', userId).maybeSingle();

    // People I referred + whether they've posted/paid (via their tasks)
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id, created_at, referred:users!referred_user_id(id, full_name, role, created_at)')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    // For each referred user, count their tasks + whether any completed
    const referredIds = (referrals || []).map(r => r.referred?.id).filter(Boolean);
    let taskStats = {};
    if (referredIds.length) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('requester_id, status')
        .in('requester_id', referredIds);
      for (const t of tasks || []) {
        const s = taskStats[t.requester_id] || { total: 0, completed: 0 };
        s.total += 1;
        if (t.status === 'completed') s.completed += 1;
        taskStats[t.requester_id] = s;
      }
    }

    // Commissions
    const { data: commissions } = await supabase
      .from('referral_commissions')
      .select('id, commission_amount, base_amount, status, created_at, task_id, referred_user_id')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    const sumBy = (st) => (commissions || [])
      .filter(c => c.status === st)
      .reduce((sum, c) => sum + Number(c.commission_amount), 0);

    const wallet = {
      available: sumBy('available'),
      pending: sumBy('pending'),
      withdrawn: sumBy('withdrawn'),
      total_earned: sumBy('available') + sumBy('withdrawn'),
    };

    const referredList = (referrals || []).map(r => ({
      id: r.referred?.id,
      full_name: r.referred?.full_name,
      role: r.referred?.role,
      joined_at: r.created_at,
      tasks_posted: taskStats[r.referred?.id]?.total || 0,
      tasks_completed: taskStats[r.referred?.id]?.completed || 0,
    }));

    res.json({
      success: true,
      slug: me?.referral_slug || null,
      wallet,
      referred: referredList,
      commissions: commissions || [],
    });
  } catch (err) {
    console.error('Referral me error:', err);
    res.status(500).json({ success: false, message: 'Could not load referral data' });
  }
});

// ─── PUT /referrals/slug — create/update my custom slug ────────────
router.put('/slug', authenticate, async (req, res) => {
  try {
    const slug = normaliseSlug(req.body.slug);
    if (slug.length < 3 || slug.length > 30)
      return res.status(400).json({ success: false, message: 'Link name must be 3–30 characters (letters, numbers, hyphens).' });
    if (RESERVED.has(slug))
      return res.status(400).json({ success: false, message: 'That link name is reserved. Try another.' });

    // Uniqueness check (excluding myself)
    const { data: existing } = await supabase
      .from('users').select('id').eq('referral_slug', slug).maybeSingle();
    if (existing && existing.id !== req.user.id)
      return res.status(409).json({ success: false, message: 'That link name is already taken. Try another.' });

    const { error } = await supabase.from('users').update({ referral_slug: slug }).eq('id', req.user.id);
    if (error) throw error;

    res.json({ success: true, slug, message: 'Your referral link is ready!' });
  } catch (err) {
    console.error('Set slug error:', err);
    res.status(500).json({ success: false, message: 'Could not save link name' });
  }
});

// ─── GET /referrals/resolve/:slug — public: slug -> referrer (for signup) ──
// Used by the /refer/:slug redirect page to attribute the signup.
router.get('/resolve/:slug', async (req, res) => {
  try {
    const slug = normaliseSlug(req.params.slug);
    const { data } = await supabase
      .from('users').select('id, full_name').eq('referral_slug', slug).maybeSingle();
    if (!data) return res.json({ success: true, valid: false });
    res.json({ success: true, valid: true, referrer_name: data.full_name, slug });
  } catch (err) {
    res.json({ success: true, valid: false });
  }
});

// ─── POST /referrals/withdraw — withdraw available commission ──────
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Tasker or requester bank details live on tasker_profiles for taskers;
    // requesters may not have one, so we require bank details to be provided
    // on the profile. Reuse tasker_profiles bank fields where present.
    const { data: profile } = await supabase
      .from('tasker_profiles')
      .select('bank_account_number, bank_code, bank_account_name, bank_name')
      .eq('user_id', userId).maybeSingle();

    if (!profile?.bank_account_number || !profile?.bank_code)
      return res.status(400).json({ success: false, message: 'Add your bank details first (in KYC/Profile) to withdraw referral earnings.' });

    // Find available commissions
    const { data: availableRaw } = await supabase
      .from('referral_commissions')
      .select('id, commission_amount, task_id')
      .eq('referrer_id', userId)
      .eq('status', 'available');

    if (!availableRaw?.length)
      return res.status(400).json({ success: false, message: 'No available commission to withdraw.' });

    // ── Settlement safeguard ───────────────────────────────────────
    // Only allow withdrawal of commissions whose underlying task actually
    // has a SETTLED requester payment (a completed workmanship payment). This
    // guarantees a referrer can never be paid from a task whose funds never
    // arrived — the money pool always exists first.
    const taskIds = [...new Set(availableRaw.map(c => c.task_id).filter(Boolean))];
    let settledTaskIds = new Set();
    if (taskIds.length) {
      const { data: settledPays } = await supabase
        .from('payments')
        .select('task_id')
        .in('task_id', taskIds)
        .eq('payment_type', 'workmanship')
        .eq('status', 'completed');
      settledTaskIds = new Set((settledPays || []).map(p => p.task_id));
    }

    const available = availableRaw.filter(c => c.task_id && settledTaskIds.has(c.task_id));
    const blocked = availableRaw.length - available.length;

    if (!available.length)
      return res.status(400).json({ success: false, message: 'Your commission is not settled yet. It becomes withdrawable once the referred task\u2019s payment is fully confirmed.' });

    const total = available.reduce((s, c) => s + Number(c.commission_amount), 0);
    if (total < 100)
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is 100.' });

    const ref = generateReference('REF');
    const ids = available.map(c => c.id);

    // Reserve first (guard against double withdrawal), same safe pattern as
    // the earnings withdrawal: stamp before transfer, roll back on failure.
    const { data: reserved, error: reserveErr } = await supabase
      .from('referral_commissions')
      .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString(), flw_reference: ref })
      .in('id', ids)
      .eq('status', 'available')
      .select('id');

    if (reserveErr) throw reserveErr;
    if (!reserved || reserved.length !== ids.length) {
      if (reserved?.length) {
        await supabase.from('referral_commissions')
          .update({ status: 'available', withdrawn_at: null, flw_reference: null })
          .in('id', reserved.map(r => r.id));
      }
      return res.status(409).json({ success: false, message: 'This commission is already being withdrawn. Refresh and try again.' });
    }

    try {
      await initiateTransfer({
        accountNumber: profile.bank_account_number,
        bankCode: profile.bank_code,
        accountName: profile.bank_account_name,
        amount: total,
        currency: 'NGN',
        narration: 'Taskeeu referral commission',
        reference: ref,
      });
    } catch (transferErr) {
      if (transferErr?.ambiguous) {
        // Provider gave no clear answer — the money may have been sent.
        // Keep the commissions reserved so a retry cannot pay twice.
        console.error('Referral withdraw AMBIGUOUS transfer — needs manual check. ref:', ref, transferErr?.message);
        return res.status(202).json({ success: true, pending_confirmation: true, message: `Your withdrawal was submitted but the bank has not confirmed yet (ref ${ref}). Please do not retry — check your bank in a few minutes. If nothing arrives within 1 hour, contact support with this reference.` });
      }
      await supabase.from('referral_commissions')
        .update({ status: 'available', withdrawn_at: null, flw_reference: null })
        .in('id', ids);
      return res.status(502).json({ success: false, message: `Withdrawal could not be sent: ${transferErr?.message || 'provider error'}. Your commission is untouched.` });
    }

    // Ledger: append a 'withdrawn' entry per commission for full traceability.
    try {
      await supabase.from('referral_ledger').insert(
        available.map(c => ({
          commission_id: c.id, referrer_id: userId, task_id: c.task_id,
          event: 'withdrawn', amount: c.commission_amount, note: `Payout ref ${ref}`,
        }))
      );
    } catch (_) {}

    res.json({
      success: true,
      message: `Referral withdrawal of ${Number(total).toLocaleString()} initiated.${blocked > 0 ? ` (${blocked} commission(s) not yet settled were held back.)` : ''}`,
      amount: total,
    });
  } catch (err) {
    console.error('Referral withdraw error:', err);
    res.status(500).json({ success: false, message: 'Withdrawal failed. Please try again.' });
  }
});

module.exports = router;
