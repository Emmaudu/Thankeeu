const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

// Calculate and ensure wallet exists for a card
const ensureWallet = async (cardId, companyId) => {
  const { data: existing } = await supabase
    .from('contribution_wallets').select('*').eq('card_id', cardId).maybeSingle();
  if (existing) return existing;

  const { data: contribs } = await supabase
    .from('contributions').select('amount').eq('card_id', cardId).eq('status', 'success');
  const total = (contribs || []).reduce((s, c) => s + (c.amount || 0), 0);
  const fee   = Math.round(total * 0.035); // 3.5% platform fee

  const { data: wallet } = await supabase.from('contribution_wallets').insert({
    card_id: cardId, company_id: companyId,
    total_contributed: total, platform_fee: fee,
    net_after_fee: total - fee, amount_to_celebrant: total - fee,
  }).select().single();
  return wallet;
};

// GET /api/deductions/wallet/:cardId
const getWallet = async (req, res) => {
  try {
    const { cardId } = req.params;
    const wallet = await ensureWallet(cardId, req.member?.company_id || req.company?.id);

    const { data: deductions } = await supabase
      .from('deduction_requests').select('*').eq('card_id', cardId).order('created_at', { ascending: false });

    res.json({ wallet, deductions: deductions || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
};

// POST /api/deductions/request — team leader requests a deduction
const requestDeduction = async (req, res) => {
  try {
    if (req.member.role !== 'team_leader')
      return res.status(403).json({ error: 'Only team leaders can request deductions' });

    const { card_id, amount, reason } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (!reason?.trim()) return res.status(400).json({ error: 'A reason is required' });

    const wallet = await ensureWallet(card_id, req.member.company_id);
    const pending = await supabase.from('deduction_requests')
      .select('amount').eq('card_id', card_id).eq('status', 'pending');
    const pendingTotal = (pending.data || []).reduce((s, d) => s + d.amount, 0);
    const available = wallet.net_after_fee - wallet.total_deducted - pendingTotal;

    if (amount > available)
      return res.status(400).json({ error: `Amount exceeds available balance (₦${available.toLocaleString('en-NG')} available)` });

    const { data: request, error } = await supabase.from('deduction_requests').insert({
      card_id, wallet_id: wallet.id,
      company_id: req.member.company_id,
      requested_by_id: req.member.id,
      requested_by_name: `${req.member.first_name} ${req.member.last_name}`,
      amount, reason,
    }).select().single();
    if (error) throw error;

    // Notify HR
    const { data: company } = await supabase.from('companies').select('email, contact_person, name').eq('id', req.member.company_id).single();
    const { data: card } = await supabase.from('cards').select('title, recipient_name').eq('id', card_id).single();
    await sendEmail({ to: company.email, template: 'deductionRequest', data: {
      hrName: company.contact_person, companyName: company.name,
      leaderName: `${req.member.first_name} ${req.member.last_name}`,
      recipientName: card?.recipient_name || 'Employee',
      cardTitle: card?.title || 'Card',
      amount, reason, requestId: request.id,
    }});

    res.status(201).json({ message: 'Deduction request submitted to HR for approval', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

// POST /api/deductions/:requestId/approve — HR approves deduction
const approveDeduction = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { note } = req.body;

    const { data: dr } = await supabase.from('deduction_requests').select('*').eq('id', requestId).single();
    if (!dr) return res.status(404).json({ error: 'Request not found' });
    if (dr.company_id !== req.company.id) return res.status(403).json({ error: 'Not authorized' });
    if (dr.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    // Update wallet
    const { data: wallet } = await supabase.from('contribution_wallets').select('*').eq('id', dr.wallet_id).single();
    const newDeducted = (wallet.total_deducted || 0) + dr.amount;
    const newToCelebrant = wallet.net_after_fee - newDeducted;

    await supabase.from('contribution_wallets').update({
      total_deducted: newDeducted,
      amount_to_celebrant: newToCelebrant,
    }).eq('id', dr.wallet_id);

    await supabase.from('deduction_requests').update({
      status: 'approved', reviewed_by_id: req.company.id,
      reviewed_at: new Date(), review_note: note || null,
    }).eq('id', requestId);

    // Notify team leader
    const { data: leader } = await supabase.from('company_members').select('email, first_name, id').eq('id', dr.requested_by_id).single();
    if (leader) {
      await sendEmail({ to: leader.email, template: 'deductionApproved', data: {
        leaderName: leader.first_name, amount: dr.amount,
        reason: dr.reason, note: note || null,
      }});
      // Dashboard notification — prompt to withdraw
      const { pushNotification } = require('../utils/notify');
      await pushNotification(leader.id, 'member', 'deduction_approved',
        `💸 Deduction approved — ₦${dr.amount.toLocaleString()} ready to withdraw`,
        `HR approved your deduction request. Go to Deductions → Withdraw to receive the funds.`,
        { deduction_id: requestId, amount: dr.amount });
    }

    res.json({ message: `Deduction of ₦${dr.amount.toLocaleString('en-NG')} approved` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve deduction' });
  }
};

// POST /api/deductions/:requestId/reject — HR rejects
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
      }});
    }

    res.json({ message: 'Deduction request rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject deduction' });
  }
};

// GET /api/deductions/pending — HR sees all pending deduction requests
const getPendingDeductions = async (req, res) => {
  try {
    const companyId = req.company?.id || req.member?.company_id;
    const { data, error } = await supabase
      .from('deduction_requests')
      .select('*, cards(title, recipient_name, slug)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deductions' });
  }
};

// POST /api/deductions/cross-dept-request — request company-wide notification
const requestCrossDept = async (req, res) => {
  try {
    const { card_id, reason } = req.body;
    const requesterId = req.member?.id || req.company?.id;
    const requesterType = req.member ? req.member.role : 'hr';
    const requesterName = req.member
      ? `${req.member.first_name} ${req.member.last_name}`
      : req.company.name;

    const { data, error } = await supabase.from('notification_approvals').insert({
      card_id, company_id: req.member?.company_id || req.company.id,
      requested_by_id: requesterId, requested_by_type: requesterType,
      requested_by_name: requesterName, reason,
    }).select().single();
    if (error) throw error;

    // Notify HR if not HR requesting
    if (req.member) {
      const { data: company } = await supabase.from('companies').select('email, contact_person, name').eq('id', req.member.company_id).single();
      const { data: card } = await supabase.from('cards').select('title').eq('id', card_id).single();
      await sendEmail({ to: company.email, template: 'crossDeptRequest', data: {
        hrName: company.contact_person, companyName: company.name,
        requesterName, cardTitle: card?.title, reason, requestId: data.id,
      }});
    }

    res.status(201).json({ message: 'Cross-department request submitted', data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

// GET /api/deductions/cross-dept — HR sees pending cross-dept requests
const getCrossDeptRequests = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notification_approvals')
      .select('*, cards(title, recipient_name)')
      .eq('company_id', req.company.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

// POST /api/deductions/cross-dept/:requestId/approve
const approveCrossDept = async (req, res) => {
  try {
    const { requestId } = req.params;
    await supabase.from('notification_approvals').update({
      status: 'approved', reviewed_by_id: req.company.id, reviewed_at: new Date()
    }).eq('id', requestId).eq('company_id', req.company.id);

    // Update card scope to company_wide
    const { data: nr } = await supabase.from('notification_approvals').select('card_id').eq('id', requestId).single();
    if (nr?.card_id) await supabase.from('cards').update({ notification_scope: 'company_wide' }).eq('id', nr.card_id);

    res.json({ message: 'Cross-department notification approved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve' });
  }
};


// ── LEADER-FACING (uses memberAuth / leaderAuth) ─────────────────────

// GET /api/deductions/leader/occasions — all dept cards with wallets
const getLeaderOccasions = async (req, res) => {
  try {
    const member = req.member;
    // Get all cards created for this leader's department + company-wide
    const { data: cards } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, occasion, status, total_collected, created_at, notification_scope')
      .eq('company_id', member.company_id)
      .in('status', ['active', 'sent'])
      .order('created_at', { ascending: false });

    // For each card, get wallet and any existing deduction by this leader
    const results = [];
    for (const card of (cards || [])) {
      // Only show cards from THIS dept or company-wide
      // (company-wide only if scope_approved_at is set)
      const wallet = await ensureWallet(card.id, member.company_id).catch(() => null);
      const { data: myDeductions } = await supabase
        .from('deduction_requests')
        .select('id, amount, reason, status, created_at, withdrawal_requested')
        .eq('card_id', card.id)
        .eq('requested_by_id', member.id)
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

// GET /api/deductions/leader/requests — deduction requests by this leader
const getLeaderRequests = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deduction_requests')
      .select('id, card_id, amount, reason, status, created_at, approved_at, note, withdrawal_requested, withdrawal_id, card:cards(title, recipient_name, slug)')
      .eq('requested_by_id', req.member.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load requests' });
  }
};

module.exports = {
  getWallet, requestDeduction, approveDeduction, rejectDeduction,
  getPendingDeductions, requestCrossDept, getCrossDeptRequests, approveCrossDept,
  getLeaderOccasions, getLeaderRequests,
};