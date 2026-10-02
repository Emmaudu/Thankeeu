// ═══════════════════════════════════════════════════════════════════════
// Escrow balance — single source of truth
//
// Every screen and every money-moving endpoint computes a task's balance
// through this module, so the tasker dashboard, requester dashboard,
// advance approval, final withdrawal and cancellation refund can never
// disagree with each other.
//
//   funded            = amount the requester paid into escrow (workmanship)
//   advance_withdrawn = advances already sent to the tasker's bank
//   advance_approved  = advances approved but not yet withdrawn
//   advance_pending   = advances requested, awaiting the requester
//
//   While the task is ONGOING:
//     remaining = funded − advance_withdrawn − advance_approved
//     (an approved advance is committed money, so it is deducted at approval)
//
//   Once the task is COMPLETED or CANCELLED:
//     advances can no longer be withdrawn, so an approved-but-unwithdrawn
//     advance is folded back into the balance:
//     remaining = funded − advance_withdrawn
//
//   Example: funded ₦200, advance ₦100 approved/withdrawn → remaining ₦100.
//
//   Platform fee (Taskeeu's income) = fee rate × FUNDED (the whole sum paid),
//   taken from the final payout: net_payout = remaining − fee.
//   Example: funded ₦200, 20% fee = ₦40; advance ₦100 → final payout ₦60.
//   Tasker total = ₦100 advance + ₦60 = ₦160 = ₦200 − ₦40.
// ═══════════════════════════════════════════════════════════════════════
const supabase = require('./supabase');

const PLATFORM_FEE_RATE = 0.20;
const ADVANCE_MAX_RATE = 0.50;

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// ── Per-tasker platform fee ────────────────────────────────────────
// Standard fee is 20%. An admin may lower it for one tasker (down to 0% =
// tasker keeps 100%) via tasker_profiles.platform_fee_rate. NULL = standard.
// Any unexpected value falls back to the standard 20%, never to 0.
function normaliseFeeRate(raw) {
  if (raw === null || raw === undefined || raw === '') return PLATFORM_FEE_RATE;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > PLATFORM_FEE_RATE) return PLATFORM_FEE_RATE;
  return n;
}

/** tasker user id → fee rate (0 – 0.20). Missing column/row → standard 20%. */
async function getTaskerFeeRates(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  const out = new Map(ids.map((id) => [id, PLATFORM_FEE_RATE]));
  if (!ids.length) return out;
  const { data, error } = await supabase
    .from('tasker_profiles')
    .select('user_id, platform_fee_rate')
    .in('user_id', ids);
  if (error) {
    if (!/platform_fee_rate/i.test(error.message || '')) console.warn('[escrow] fee rate lookup failed:', error.message);
    return out; // TASKER_FEE_OVERRIDE_MIGRATION not run yet → everyone on 20%
  }
  for (const row of data || []) out.set(row.user_id, normaliseFeeRate(row.platform_fee_rate));
  return out;
}

async function getTaskerFeeRate(userId) {
  return (await getTaskerFeeRates([userId])).get(userId) ?? PLATFORM_FEE_RATE;
}

/** "20%", "0%", "12.5%" */
const feePercentLabel = (rate) => `${Math.round(Number(rate) * 10000) / 100}%`;

/**
 * Load escrow figures for a list of task ids.
 * @returns {Promise<Map<string, object>>} task_id → escrow summary
 */
async function getEscrowForTasks(taskIds) {
  const ids = [...new Set((taskIds || []).filter(Boolean))];
  const out = new Map();
  if (!ids.length) return out;

  const TASK_COLS = 'id, title, status, requester_id, accepted_tasker_id, is_funded, funded_amount';
  const loadTasks = async () => {
    const r = await supabase.from('tasks').select(`${TASK_COLS}, currency`).in('id', ids);
    if (r.error && /currency/i.test(r.error.message || '')) return supabase.from('tasks').select(TASK_COLS).in('id', ids);
    return r;
  };
  const [tasksRes, paymentsRes, advancesRes] = await Promise.all([
    loadTasks(),
    // The workmanship payment is the record of money actually received.
    // 'processing' = final payout already initiated (withdrawn_at is set).
    supabase
      .from('payments')
      .select('id, task_id, amount, status, withdrawn_at, created_at')
      .in('task_id', ids)
      .eq('payment_type', 'workmanship')
      .in('status', ['completed', 'processing'])
      .order('created_at', { ascending: false }),
    supabase
      .from('advance_requests')
      .select('id, task_id, status, requested_amount, approved_amount, withdrawn_at')
      .in('task_id', ids),
  ]);

  if (tasksRes.error) throw tasksRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (advancesRes.error) throw advancesRes.error;

  const feeRates = await getTaskerFeeRates((tasksRes.data || []).map((t) => t.accepted_tasker_id));

  const paymentByTask = new Map();
  for (const p of paymentsRes.data || []) {
    if (!paymentByTask.has(p.task_id)) paymentByTask.set(p.task_id, p); // newest first
  }

  for (const t of tasksRes.data || []) {
    const payment = paymentByTask.get(t.id) || null;
    const funded = round2(payment ? payment.amount : (t.is_funded ? t.funded_amount : 0));

    let advance_withdrawn = 0, advance_approved = 0, advance_pending = 0;
    for (const a of (advancesRes.data || []).filter(x => x.task_id === t.id)) {
      if (a.status === 'withdrawn') advance_withdrawn += Number(a.approved_amount || 0);
      else if (a.status === 'approved') advance_approved += Number(a.approved_amount || 0);
      else if (a.status === 'pending') advance_pending += Number(a.requested_amount || 0);
    }
    advance_withdrawn = round2(advance_withdrawn);
    advance_approved = round2(advance_approved);
    advance_pending = round2(advance_pending);

    const isOngoing = t.status === 'ongoing';
    const committed = isOngoing ? advance_withdrawn + advance_approved : advance_withdrawn;
    const remaining = round2(Math.max(0, funded - committed));

    // Advance cap: 50% of funded, minus what has already been approved/withdrawn.
    const advance_cap_total = Math.floor(funded * ADVANCE_MAX_RATE);
    const advance_available = Math.max(0, Math.floor(advance_cap_total - advance_withdrawn - advance_approved));

    const payout_withdrawn = !!payment?.withdrawn_at;
    let payout_status = 'none';
    if (payment) {
      if (payout_withdrawn) payout_status = 'withdrawn';
      else if (t.status === 'completed') payout_status = 'available';
      else if (t.status === 'cancelled') payout_status = 'cancelled';
      else payout_status = 'locked'; // waiting for completion code
    }

    const platform_fee_rate = t.accepted_tasker_id ? (feeRates.get(t.accepted_tasker_id) ?? PLATFORM_FEE_RATE) : PLATFORM_FEE_RATE;
    // Taskeeu's fee is a percentage of the WHOLE amount the requester paid in
    // (not of the balance left after advances). Advances are capped at 50%, so
    // the balance always covers a fee of up to 20%; never let net go negative.
    const platform_fee = round2(Math.min(remaining, funded * platform_fee_rate));
    out.set(t.id, {
      task_id: t.id,
      title: t.title,
      task_status: t.status,
      currency: t.currency || 'NGN',
      requester_id: t.requester_id,
      tasker_id: t.accepted_tasker_id,
      payment_id: payment?.id || null,
      funded,
      advance_withdrawn,
      advance_approved,
      advance_pending,
      advance_cap_total,
      advance_available,
      remaining,
      platform_fee_rate,
      platform_fee,
      net_payout: round2(remaining - platform_fee),
      payout_status,
    });
  }
  return out;
}

async function getEscrowForTask(taskId) {
  const map = await getEscrowForTasks([taskId]);
  return map.get(taskId) || null;
}

module.exports = {
  getEscrowForTasks,
  getEscrowForTask,
  PLATFORM_FEE_RATE,
  ADVANCE_MAX_RATE,
  getTaskerFeeRates,
  getTaskerFeeRate,
  normaliseFeeRate,
  feePercentLabel,
  round2,
};
