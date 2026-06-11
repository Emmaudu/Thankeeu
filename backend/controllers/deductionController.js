const supabase = require('../utils/supabase');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://thankeeu.com').replace(/\/$/, '');
const { pushNotification } = require('../utils/notify');
const { sendEmail } = require('../utils/email');
const axios = require('axios');

const FLW   = 'https://api.flutterwave.com/v3';
const flwH  = () => ({ Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' });

// ── ensureWallet ──────────────────────────────────────────────────────────────
const ensureWallet = async (cardId, companyId) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('contribution_wallets').select('*').eq('card_id', cardId).maybeSingle();

    if (fetchErr && (fetchErr.code === '42P01' || fetchErr.message?.includes('does not exist'))) {
      const { data: contribs } = await supabase.from('contributions').select('amount').eq('card_id', cardId).eq('status', 'success');
      const total = (contribs || []).reduce((s, c) => s + (c.amount || 0), 0);
      const fee   = Math.round(total * 0.035); // 3.5%
      return { id: null, card_id: cardId, total_contributed: total, platform_fee: fee, net_after_fee: total - fee, total_deducted: 0, _synthetic: true };
    }
    if (existing) return existing;

    const { data: contribs } = await supabase.from('contributions').select('amount').eq('card_id', cardId).eq('status', 'success');
    const total = (contribs || []).reduce((s, c) => s + (c.amount || 0), 0);
    const fee   = Math.round(total * 0.035); // 3.5% platform fee

    const { data: wallet, error: insertErr } = await supabase.from('contribution_wallets').insert({
      card_id: cardId, company_id: companyId,
      total_contributed: total, platform_fee: fee,
      net_after_fee: total - fee, amount_to_celebrant: total - fee,
    }).select().single();

    if (insertErr) return { id: null, card_id: cardId, total_contributed: total, platform_fee: fee, net_after_fee: total - fee, total_deducted: 0, _synthetic: true };
    return wallet;
  } catch { return null; }
};

// ── tryInstantTransfer ────────────────────────────────────────────────────────
// Attempts FLW bank transfer immediately. Returns { ok, reason }
const tryInstantTransfer = async (leaderId, amount, deductionId, cardTitle) => {
  const { data: bank } = await supabase.from('bank_accounts')
    .select('*').eq('owner_id', leaderId).eq('is_default', true).maybeSingle();

  if (!bank?.flw_beneficiary_id || !bank?.account_number || !bank?.bank_code) {
    return { ok: false, reason: 'no_bank' };
  }

  const transferRef = `TK-DED-${deductionId.slice(0,8)}-${Date.now()}`;
  try {
    const r = await axios.post(`${FLW}/transfers`, {
      account_bank:     bank.bank_code,
      account_number:   bank.account_number,
      amount,
      narration:        `Thankeeu deduction payout — ${cardTitle || 'team celebration'}`,
      currency:         'NGN',
      reference:        transferRef,
      beneficiary_name: bank.account_name,
      debit_currency:   'NGN',
    }, { headers: flwH() });

    if (r.data.status !== 'success') return { ok: false, reason: 'flw_error', detail: r.data.message };

    await supabase.from('deduction_requests').update({
      withdrawal_requested: true,
      withdrawal_id:        transferRef,
      transferred_at:       new Date(),
    }).eq('id', deductionId);

    return { ok: true, transferRef };
  } catch (err) {
    console.error('tryInstantTransfer error:', err.response?.data || err.message);
    return { ok: false, reason: 'flw_error', detail: err.response?.data?.message || err.message };
  }
};

// ── GET /api/deductions/wallet/:cardId ────────────────────────────────────────
const getWallet = async (req, res) => {
  try {
    const { cardId } = req.params;
    const wallet = await ensureWallet(cardId, req.member?.company_id || req.company?.id);
    const { data: deductions } = await supabase.from('deduction_requests').select('*').eq('card_id', cardId).order('created_at', { ascending: false });
    res.json({ wallet, deductions: deductions || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
};

// ── POST /api/deductions/request ──────────────────────────────────────────────
const requestDeduction = async (req, res) => {
  try {
    if (req.member.role !== 'team_leader')
      return res.status(403).json({ error: 'Only team leaders can request deductions' });

    const { card_id, amount, reason } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!reason?.trim()) return res.status(400).json({ error: 'A reason is required' });

    // ── ONE DEDUCTION PER GIFT POT PER LEADER ────────────────────────────────
    const { data: existing } = await supabase.from('deduction_requests')
      .select('id, status').eq('card_id', card_id).eq('requested_by_id', req.member.id)
      .not('status', 'eq', 'rejected').maybeSingle();
    if (existing) {
      return res.status(400).json({
        error: `You already have a ${existing.status} deduction request for this gift pot. Only one deduction per gift pot is allowed.`,
      });
    }

    const wallet = await ensureWallet(card_id, req.member.company_id);
    if (wallet?._synthetic || !wallet?.id) {
      return res.status(503).json({ error: 'Deduction tables not set up yet. Ask your admin to run the migration in Supabase.' });
    }

    const { data: pending } = await supabase.from('deduction_requests')
      .select('amount').eq('card_id', card_id).eq('status', 'pending');
    const pendingTotal = (pending || []).reduce((s, d) => s + d.amount, 0);
    const available    = wallet.net_after_fee - wallet.total_deducted - pendingTotal;

    if (amount > available)
      return res.status(400).json({ error: `Amount exceeds available balance (₦${available.toLocaleString('en-NG')} available after 3.5% fee)` });

    const { data: request, error } = await supabase.from('deduction_requests').insert({
      card_id, wallet_id: wallet.id,
      company_id: req.member.company_id,
      requested_by_id:   req.member.id,
      requested_by_name: `${req.member.first_name} ${req.member.last_name}`,
      amount, reason,
    }).select().single();
    if (error) throw error;

    // Notify HR
    const { data: company } = await supabase.from('companies').select('email, contact_person, name').eq('id', req.member.company_id).single();
    const { data: card }    = await supabase.from('cards').select('title, recipient_name').eq('id', card_id).single();
    await sendEmail({ to: company.email, template: 'deductionRequest', data: {
      hrName: company.contact_person, companyName: company.name,
      leaderName: `${req.member.first_name} ${req.member.last_name}`,
      recipientName: card?.recipient_name || 'Employee',
      cardTitle: card?.title || 'Card',
      amount, reason, requestId: request.id,
    }}).catch(() => {});

    res.status(201).json({ message: 'Deduction request submitted to HR for approval', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

// ── POST /api/deductions/:requestId/approve ───────────────────────────────────
const approveDeduction = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { note } = req.body;

    const { data: dr } = await supabase.from('deduction_requests').select('*').eq('id', requestId).single();
    if (!dr)                         return res.status(404).json({ error: 'Request not found' });
    if (dr.company_id !== req.company.id) return res.status(403).json({ error: 'Not authorized' });
    if (dr.status !== 'pending')     return res.status(400).json({ error: 'Request already processed' });

    // Update wallet totals
    const { data: wallet } = await supabase.from('contribution_wallets').select('*').eq('id', dr.wallet_id).single();
    const newDeducted      = (wallet.total_deducted || 0) + dr.amount;
    const newToCelebrant   = wallet.net_after_fee - newDeducted;

    await supabase.from('contribution_wallets').update({
      total_deducted: newDeducted, amount_to_celebrant: newToCelebrant,
    }).eq('id', dr.wallet_id);

    await supabase.from('deduction_requests').update({
      status: 'approved', reviewed_by_id: req.company.id,
      reviewed_at: new Date(), review_note: note || null,
    }).eq('id', requestId);

    // Get card info for narration
    const { data: card } = await supabase.from('cards').select('title, recipient_name').eq('id', dr.card_id).maybeSingle();
    const cardTitle = card?.title || `${card?.recipient_name || 'Employee'}'s card`;

    // Get team leader
    const { data: leader } = await supabase.from('company_members')
      .select('email, first_name, id').eq('id', dr.requested_by_id).single();

    // ── ATTEMPT INSTANT TRANSFER ─────────────────────────────────────────────
    const transfer = await tryInstantTransfer(dr.requested_by_id, dr.amount, requestId, cardTitle);

    if (transfer.ok) {
      // Transferred instantly — notify leader
      if (leader) {
        await sendEmail({ to: leader.email, template: 'deductionApproved', data: {
          leaderName: leader.first_name, amount: dr.amount,
          reason: dr.reason, note: note || null,
          transferred: true, transferRef: transfer.transferRef,
        }}).catch(() => {});

        await pushNotification(leader.id, 'member', 'deduction_approved',
          `💸 ₦${dr.amount.toLocaleString()} is on its way to your bank!`,
          `HR approved your deduction request and the funds have been sent to your registered bank account.`,
          { deduction_id: requestId, amount: dr.amount }
        ).catch(() => {});
      }
    } else {
      // No bank account set up — notify leader to add one
      if (leader) {
        await sendEmail({ to: leader.email, template: 'deductionApproved', data: {
          leaderName: leader.first_name, amount: dr.amount,
          reason: dr.reason, note: note || null,
          transferred: false,
          appUrl: FRONTEND_URL,
        }}).catch(() => {});

        await pushNotification(leader.id, 'member', 'deduction_approved',
          `✅ Deduction approved — add your bank account to receive ₦${dr.amount.toLocaleString()}`,
          transfer.reason === 'no_bank'
            ? `HR approved your ₦${dr.amount.toLocaleString()} deduction. Please add and verify your bank account in Settings → Bank Accounts to receive the funds.`
            : `HR approved your deduction. There was an issue sending the transfer. Please use the "Withdraw" button on your deduction card.`,
          { deduction_id: requestId, amount: dr.amount }
        ).catch(() => {});
      }
    }

    res.json({
      message: transfer.ok
        ? `Deduction approved and ₦${dr.amount.toLocaleString('en-NG')} sent to team leader's bank`
        : `Deduction approved. ${transfer.reason === 'no_bank' ? 'Team leader has no bank account set — they will be notified to add one.' : 'Transfer queued — leader can withdraw manually.'}`,
      transferred: transfer.ok,
    });
  } catch (err) {
    console.error('approveDeduction error:', err);
    res.status(500).json({ error: 'Failed to approve deduction' });
  }
};

// ── POST /api/deductions/:requestId/withdraw ──────────────────────────────────
// Team leader manually triggers withdrawal on an approved request
const withdrawDeduction = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { data: dr } = await supabase.from('deduction_requests')
      .select('*, card:cards(title, recipient_name)').eq('id', requestId).single();

    if (!dr)                                  return res.status(404).json({ error: 'Request not found' });
    if (dr.requested_by_id !== req.member.id) return res.status(403).json({ error: 'Not your request' });
    if (dr.status !== 'approved')             return res.status(400).json({ error: 'Request not approved yet' });
    if (dr.withdrawal_requested)              return res.status(400).json({ error: 'Already withdrawn' });

    const cardTitle = dr.card?.title || `${dr.card?.recipient_name || 'Employee'}'s card`;
    const transfer  = await tryInstantTransfer(req.member.id, dr.amount, requestId, cardTitle);

    if (!transfer.ok) {
      if (transfer.reason === 'no_bank') {
        return res.status(400).json({
          error: 'No verified bank account found. Please add and verify your bank account in Settings → Bank Accounts first.',
          code:  'no_bank',
        });
      }
      return res.status(500).json({ error: `Transfer failed: ${transfer.detail || 'Please try again.'}` });
    }

    res.json({ message: `₦${dr.amount.toLocaleString('en-NG')} is on its way to your bank account!`, transferRef: transfer.transferRef });
  } catch (err) {
    console.error('withdrawDeduction error:', err);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
};

// ── POST /api/deductions/:requestId/reject ────────────────────────────────────
const rejectDeduction = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { note } = req.body;
    const { data: dr } = await supabase.from('deduction_requests').select('*').eq('id', requestId).single();
    if (!dr || dr.company_id !== req.company.id) return res.status(404).json({ error: 'Not found' });

    await supabase.from('deduction_requests').update({
      status: 'rejected', reviewed_by_id: req.company.id,
      reviewed_at: new Date(), review_note: note,
    }).eq('id', requestId);

    const { data: leader } = await supabase.from('company_members').select('email, first_name').eq('id', dr.requested_by_id).single();
    if (leader) {
      await sendEmail({ to: leader.email, template: 'deductionRejected', data: {
        leaderName: leader.first_name, amount: dr.amount, reason: dr.reason, note,
      }}).catch(() => {});
    }
    res.json({ message: 'Deduction request rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject deduction' });
  }
};

// ── GET /api/deductions/pending ───────────────────────────────────────────────
const getPendingDeductions = async (req, res) => {
  try {
    const companyId = req.company?.id || req.member?.company_id;
    const { data, error } = await supabase.from('deduction_requests')
      .select('*, cards(title, recipient_name, slug)').eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deductions' });
  }
};

// ── Cross-dept helpers (unchanged) ────────────────────────────────────────────
const requestCrossDept = async (req, res) => {
  try {
    const { card_id, reason } = req.body;
    const requesterId    = req.member?.id || req.company?.id;
    const requesterType  = req.member ? req.member.role : 'hr';
    const requesterName  = req.member ? `${req.member.first_name} ${req.member.last_name}` : req.company.name;

    const { data, error } = await supabase.from('notification_approvals').insert({
      card_id, company_id: req.member?.company_id || req.company.id,
      requested_by_id: requesterId, requested_by_type: requesterType,
      requested_by_name: requesterName, reason,
    }).select().single();
    if (error) throw error;

    if (req.member) {
      const { data: company } = await supabase.from('companies').select('email, contact_person, name').eq('id', req.member.company_id).single();
      const { data: card }    = await supabase.from('cards').select('title').eq('id', card_id).single();
      await sendEmail({ to: company.email, template: 'crossDeptRequest', data: {
        hrName: company.contact_person, companyName: company.name,
        requesterName, cardTitle: card?.title, reason, requestId: data.id,
      }}).catch(() => {});
    }
    res.status(201).json({ message: 'Cross-department request submitted', data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

const getCrossDeptRequests = async (req, res) => {
  try {
    const { data, error } = await supabase.from('notification_approvals')
      .select('*, cards(title, recipient_name)').eq('company_id', req.company.id)
      .eq('status', 'pending').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch requests' }); }
};

const approveCrossDept = async (req, res) => {
  try {
    const { requestId } = req.params;
    await supabase.from('notification_approvals').update({
      status: 'approved', reviewed_by_id: req.company.id, reviewed_at: new Date(),
    }).eq('id', requestId).eq('company_id', req.company.id);
    const { data: nr } = await supabase.from('notification_approvals').select('card_id').eq('id', requestId).single();
    if (nr?.card_id) await supabase.from('cards').update({ notification_scope: 'company_wide' }).eq('id', nr.card_id);
    res.json({ message: 'Cross-department notification approved' });
  } catch (err) { res.status(500).json({ error: 'Failed to approve' }); }
};

// ── Leader-facing ─────────────────────────────────────────────────────────────
const getLeaderOccasions = async (req, res) => {
  try {
    const member = req.member;
    const { data: cards } = await supabase.from('cards')
      .select('id, slug, title, recipient_name, occasion, status, total_collected, created_at, notification_scope')
      .eq('company_id', member.company_id).in('status', ['active','sent'])
      .order('created_at', { ascending: false });

    const results = [];
    for (const card of (cards || [])) {
      const wallet = await ensureWallet(card.id, member.company_id).catch(() => null);
      const { data: myDeductions } = await supabase.from('deduction_requests')
        .select('id, amount, reason, status, created_at, withdrawal_requested, withdrawal_id, transferred_at')
        .eq('card_id', card.id).eq('requested_by_id', member.id)
        .order('created_at', { ascending: false });

      if (wallet && (wallet.net_after_fee - wallet.total_deducted) > 0) {
        results.push({ ...card, wallet, my_deductions: myDeductions || [] });
      }
    }
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load occasions' });
  }
};

const getLeaderRequests = async (req, res) => {
  try {
    const { data, error } = await supabase.from('deduction_requests')
      .select('id, card_id, amount, reason, status, created_at, approved_at, note, withdrawal_requested, withdrawal_id, transferred_at, card:cards(title, recipient_name, slug)')
      .eq('requested_by_id', req.member.id).order('created_at', { ascending: false });

    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) return res.json([]);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load requests' });
  }
};

module.exports = {
  getWallet, requestDeduction, approveDeduction, rejectDeduction, withdrawDeduction,
  getPendingDeductions, requestCrossDept, getCrossDeptRequests, approveCrossDept,
  getLeaderOccasions, getLeaderRequests,
};
