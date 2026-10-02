const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadProof, uploadProofBuffer } = require('../utils/cloudinary');
const {
  initializePayment,
  verifyPayment,
  verifyWebhookSignature,
  generateReference,
  initiateTransfer,
  resolveAccountNumber,
} = require('../utils/flutterwave');
const {
  sendPaymentSentEmail,
  sendProofUploadedEmail,
  sendRefundRequestEmail,
  sendTaskPaidEmail,
} = require('../utils/email');
const {
  getEscrowForTasks,
  getEscrowForTask,
  round2,
  PLATFORM_FEE_RATE,
  getTaskerFeeRate,
  feePercentLabel,
} = require('../utils/escrow');
const { logActivity } = require('../utils/activity');
const rapyd = require('../utils/rapyd');
const { getCountry, money, pathPrefix, payoutDetailsComplete, countryByCurrency } = require('../utils/countries');

const frontendBase = () => (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

/**
 * Start a card payment for a task in its own country.
 * Nigeria → Flutterwave (unchanged). Every other market → Rapyd hosted checkout.
 * @returns {{ authorization_url, provider, provider_ref }}
 */
async function startCheckout({ user, taskCountry, amount, reference, metadata, description }) {
  const country = getCountry(taskCountry);
  if (country.provider !== 'rapyd') {
    const payData = await initializePayment({
      email: user.email, amount, currency: 'NGN', reference, customerName: user.full_name, metadata,
    });
    return { authorization_url: payData.authorization_url, provider: 'flutterwave', provider_ref: null };
  }
  const base = frontendBase();
  const back = `${base}/payment/callback?tx_ref=${encodeURIComponent(reference)}&provider=rapyd`;
  const co = await rapyd.createCheckout({
    amount, currency: country.currency, country: country.code, reference, email: user.email, description,
    completeUrl: back, cancelUrl: `${back}&status=cancelled`, metadata,
  });
  return { authorization_url: co.redirect_url, provider: 'rapyd', provider_ref: co.id };
}

/** Insert a payment row; tolerate a database where INTERNATIONAL_MIGRATION has not run (Nigeria only). */
async function insertPayment(row) {
  let { error } = await supabase.from('payments').insert(row);
  if (error && /provider/i.test(error.message || '') && row.provider !== 'rapyd') {
    const { provider, provider_ref, ...rest } = row;
    ({ error } = await supabase.from('payments').insert(rest));
  }
  return { error };
}

/** Reads the task's market; columns missing (migration not run) → Nigeria. */
async function taskMarket(taskId) {
  const { data, error } = await supabase.from('tasks').select('country, currency').eq('id', taskId).maybeSingle();
  if (error || !data) return { country: 'NG', currency: 'NGN' };
  return { country: data.country || 'NG', currency: data.currency || 'NGN' };
}

// ─── POST /payments/fund-task — requester pays agreed amount to activate task ──
// This is the primary payment flow: requester enters final agreed price → Flutterwave
// On verification, task is marked 'funded', tasker is emailed to start work.
router.post('/fund-task', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { task_id } = req.body;
    if (!task_id) return res.status(400).json({ success: false, message: 'Task ID and amount (min ₦100) are required' });

    const { data: task } = await supabase
      .from('tasks')
      .select('accepted_tasker_id, requester_id, title, status, deadline')
      .eq('id', task_id)
      .maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const market = await taskMarket(task_id);
    const country = getCountry(market.country);
    const amount = Math.round(Number(req.body.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount < country.fundMin)
      return res.status(400).json({ success: false, message: `Task ID and amount (min ${money(country.fundMin, country.currency)}) are required` });

    if (task.status !== 'ongoing') return res.status(400).json({ success: false, message: 'Task must be in ongoing status (bid must be accepted first)' });

    // Check if already funded
    const { data: existing } = await supabase
      .from('payments')
      .select('id, status')
      .eq('task_id', task_id)
      .eq('payment_type', 'workmanship')
      .eq('status', 'completed')
      .maybeSingle();

    if (existing) return res.status(409).json({ success: false, message: 'This task is already funded' });

    const reference = generateReference();
    const checkout = await startCheckout({
      user: req.user, taskCountry: country.code, amount, reference, description: task.title,
      metadata: { task_id, payment_type: 'workmanship', tasker_id: task.accepted_tasker_id, requester_id: req.user.id, fund_task: true },
    });

    const { error: insErr } = await insertPayment({
      task_id,
      requester_id: req.user.id,
      tasker_id: task.accepted_tasker_id,
      payment_type: 'workmanship',
      amount,
      currency: country.currency,
      flw_reference: reference,
      flw_link: checkout.authorization_url,
      provider: checkout.provider,
      provider_ref: checkout.provider_ref,
      status: 'pending',
    });
    if (insErr) throw insErr;

    res.json({
      success: true,
      authorization_url: checkout.authorization_url,
      reference,
      provider: checkout.provider,
      message: 'Redirect to payment page',
    });
  } catch (err) {
    console.error('Fund task error:', err?.message, err?.flwResponse || err?.details || '');
    res.status(500).json({
      success: false,
      message: err?.name === 'RapydError' && /not configured/i.test(err.message) ? err.message : 'Payment initialization failed. Please try again.',
      ...(req.user?.role === 'admin' ? { debug: err?.message } : {}),
    });
  }
});

// ─── POST /payments/initiate — start a payment ────────────────────
router.post('/initiate', authenticate, requireRole('requester', 'admin'), async (req, res) => {
  try {
    const { task_id, custom_payment_id, payment_type, amount, currency } = req.body;

    if (!task_id || !payment_type || !amount)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    const reference = generateReference();

    const { data: task } = await supabase
      .from('tasks')
      .select('accepted_tasker_id, title, requester_id')
      .eq('id', task_id)
      .maybeSingle();

    if (!task || task.requester_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const payData = await initializePayment({
      email: req.user.email,
      amount: parseFloat(amount),
      currency: currency || 'NGN',
      reference,
      customerName: req.user.full_name,
      metadata: {
        task_id,
        custom_payment_id: custom_payment_id || null,
        payment_type,
        tasker_id: task.accepted_tasker_id,
        requester_id: req.user.id,
      },
    });

    // Log payment record
    await supabase.from('payments').insert({
      task_id,
      custom_payment_id: custom_payment_id || null,
      requester_id: req.user.id,
      tasker_id: task.accepted_tasker_id,
      payment_type,
      amount: parseFloat(amount),
      currency: currency || 'NGN',
      flw_reference: reference,
      flw_link: payData.authorization_url,
      status: 'pending',
    });

    res.json({
      success: true,
      authorization_url: payData.authorization_url,
      reference,
    });
  } catch (err) {
    console.error('Payment initiate error:', err?.message, err?.flwResponse || '');
    res.status(500).json({
      success: false,
      message: 'Payment initialization failed. Please try again.',
      ...(req.user?.role === 'admin' ? { debug: err?.message } : {}),
    });
  }
});

// ─── Tips and extra money for the tasker ───────────────────────────
// kind 'tip'   — a thank-you, during or after the task
// kind 'extra' — a sudden unforeseen cost during the task
// Both go straight to the tasker's withdrawable balance with NO platform fee.
const TIP_MIN = 100, TIP_MAX = 5000000;

async function onTipPaid(payment) {
  try {
    const kind = payment.metadata?.kind === 'extra' ? 'extra' : 'tip';
    const amt = Number(payment.amount || 0);
    const m = money(amt, payment.currency || 'NGN');
    const { data: task } = await supabase.from('tasks').select('title, country').eq('id', payment.task_id).maybeSingle();
    await Promise.resolve(supabase.from('notifications').insert({
      user_id: payment.tasker_id,
      type: kind === 'extra' ? 'extra_money_received' : 'tip_received',
      title: kind === 'extra' ? 'Extra money added for your task' : 'You received a tip',
      message: kind === 'extra'
        ? `The requester added ${m} for "${task?.title || 'your task'}"${payment.metadata?.note ? `: ${payment.metadata.note}` : ''}. It is in Earnings, ready to withdraw, with no platform fee.`
        : `The requester tipped you ${m} for "${task?.title || 'your task'}". It is in Earnings, ready to withdraw, with no platform fee.`,
      data: { task_id: payment.task_id, payment_id: payment.id },
      action_url: `${pathPrefix(task?.country)}/tasker?tab=payments`,
    })).catch(() => {});
    logActivity(payment.task_id, {
      actor: { id: payment.requester_id }, role: 'requester', event: kind === 'extra' ? 'extra_money_paid' : 'tip_paid',
      summary: kind === 'extra'
        ? `Requester added ${m} extra money for the tasker${payment.metadata?.note ? ` (${payment.metadata.note})` : ''}`
        : `Requester tipped the tasker ${m}`,
      details: { amount: amt, kind, payment_id: payment.id },
    });
  } catch (e) { console.warn('onTipPaid warn:', e?.message); }
}

// ─── POST /payments/tip — { task_id, amount, kind: 'tip'|'extra', note? } ──
router.post('/tip', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { task_id } = req.body || {};
    const kind = req.body?.kind === 'extra' ? 'extra' : 'tip';
    const amount = Math.round(Number(req.body?.amount) * 100) / 100;
    const note = String(req.body?.note || '').trim().slice(0, 300) || null;
    if (!task_id) return res.status(400).json({ success: false, message: 'Task is required.' });
    const market = await taskMarket(task_id);
    const country = getCountry(market.country);
    const tipMin = country.code === 'NG' ? TIP_MIN : country.tipMin;
    const tipMax = country.code === 'NG' ? TIP_MAX : country.tipMax;
    if (!Number.isFinite(amount) || amount < tipMin || amount > tipMax)
      return res.status(400).json({ success: false, message: `Enter an amount between ${money(tipMin, country.currency)} and ${money(tipMax, country.currency)}.` });

    const { data: task, error } = await supabase.from('tasks')
      .select('id, title, status, requester_id, accepted_tasker_id').eq('id', task_id).maybeSingle();
    if (error) throw error;
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (!task.accepted_tasker_id) return res.status(400).json({ success: false, message: 'Choose a tasker first.' });
    if (kind === 'extra' && task.status !== 'ongoing')
      return res.status(400).json({ success: false, message: 'Extra money can be added while the task is in progress.' });
    if (!['ongoing', 'completed'].includes(task.status))
      return res.status(400).json({ success: false, message: `This task is ${task.status}.` });

    const reference = generateReference('TIP');
    const checkout = await startCheckout({
      user: req.user, taskCountry: country.code, amount, reference, description: `${kind === 'extra' ? 'Extra money' : 'Tip'}: ${task.title}`,
      metadata: { task_id, payment_type: 'tip', kind, tasker_id: task.accepted_tasker_id, requester_id: req.user.id },
    });
    const { error: insErr } = await insertPayment({
      task_id, requester_id: req.user.id, tasker_id: task.accepted_tasker_id,
      payment_type: 'tip', amount, currency: country.currency,
      flw_reference: reference, flw_link: checkout.authorization_url, status: 'pending',
      provider: checkout.provider, provider_ref: checkout.provider_ref,
      metadata: { kind, note },
    });
    if (insErr) {
      if (/payment_type/i.test(insErr.message || '')) return res.status(503).json({ success: false, message: 'Tips are not set up yet (run TIPS_MIGRATION.sql).' });
      throw insErr;
    }
    res.json({ success: true, authorization_url: checkout.authorization_url, reference, provider: checkout.provider });
  } catch (err) {
    console.error('Tip error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not start the payment. Please try again.' });
  }
});

// ─── GET /payments/tips/task/:taskId — tips and extra money on a task ──
router.get('/tips/task/:taskId', authenticate, async (req, res) => {
  try {
    const { data: task } = await supabase.from('tasks').select('requester_id, accepted_tasker_id').eq('id', req.params.taskId).maybeSingle();
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    if (![task.requester_id, task.accepted_tasker_id].includes(req.user.id) && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    const { data, error } = await supabase.from('payments')
      .select('id, amount, status, metadata, created_at, withdrawn_at, tasker_id')
      .eq('task_id', req.params.taskId).eq('payment_type', 'tip').eq('status', 'completed')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const tips = data || [];
    res.json({ success: true, tips, total: round2(tips.reduce((s, t) => s + Number(t.amount || 0), 0)) });
  } catch (err) {
    console.error('Tips list error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load tips.' });
  }
});

// ─── GET /payments/verify/:reference ─────────────────────────────
// Collects the answer of confirmPaymentByReference so the browser's verify
// call and the Rapyd webhook share one code path.
const resultCollector = () => {
  const out = { code: 200, body: null };
  const api = {
    status(c) { out.code = c; return api; },
    json(b) { out.body = b; return out; },
  };
  return api;
};

async function confirmPaymentByReference(reference) {
  const res = resultCollector();
  try {
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('flw_reference', reference)
      .maybeSingle();

    // Ask the provider that took the money. Never trust the browser's word.
    let providerTxnId;
    if (payment?.provider === 'rapyd') {
      if (payment.status === 'completed') return res.json({ success: true, message: 'Payment already verified', payment });
      const check = await rapyd.checkCheckoutPaid(payment.provider_ref, { amount: payment.amount, currency: payment.currency });
      if (!check.paid) {
        if (check.failed) {
          await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id).eq('status', 'pending');
        }
        return res.json({ success: false, pending: !check.failed, message: check.failed ? 'Payment not successful' : 'Payment is not confirmed yet', txn: { status: check.status } });
      }
      providerTxnId = check.paymentId || payment.provider_ref;
    } else {
      const txn = await verifyPayment(reference);
      if (txn.status !== 'successful') {
        // Only a still-pending payment can be marked failed (never undo a
        // payment the webhook has already confirmed).
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('flw_reference', reference)
          .eq('status', 'pending');
        return res.json({ success: false, message: 'Payment not successful', txn });
      }
      providerTxnId = txn.id;
    }

    if (!payment)
      return res.status(404).json({ success: false, message: 'Payment record not found' });

    // Idempotency: if already completed, return success without re-processing
    if (payment.status === 'completed') {
      return res.json({ success: true, message: 'Payment already verified', payment });
    }

    // Mark payment completed — conditional, because the provider webhook
    // may confirm the same payment at the same moment. Only the first one to
    // flip pending → completed runs the follow-up actions below.
    const { data: claimed, error: claimErr } = await supabase
      .from('payments')
      .update({ status: 'completed', flw_transaction_id: String(providerTxnId) })
      .eq('flw_reference', reference)
      .in('status', ['pending', 'failed'])
      .select('id');
    if (claimErr) throw claimErr;
    if (!claimed?.length) {
      return res.json({ success: true, message: 'Payment already verified', payment: { ...payment, status: 'completed' } });
    }

    // Handle post-payment logic
    if (payment.custom_payment_id) {
      const { data: cp } = await supabase
        .from('custom_payments')
        .select('*')
        .eq('id', payment.custom_payment_id)
        .maybeSingle();

      if (payment.payment_type === 'equipment' || payment.payment_type === 'shipment') {
        await supabase
          .from('custom_payments')
          .update({ equipment_paid: true, status: 'equipment_paid' })
          .eq('id', payment.custom_payment_id);

        (async () => {
          try {
            await supabase.from('notifications').insert({
            user_id: cp.tasker_id,
            type: 'equipment_funds_held',
            title: 'Equipment Funds Ready',
            message: 'The requester has funded equipment costs. Upload proof to release funds.',
            data: { task_id: cp.task_id, custom_payment_id: cp.id },
            action_url: '/tasker',
            });
          } catch (_) {}
        })();
      }

      if (payment.payment_type === 'workmanship') {
        await supabase
          .from('custom_payments')
          .update({ workmanship_paid: true, status: 'completed' })
          .eq('id', payment.custom_payment_id);

        releaseWorkmanshipPayment(payment, cp).catch(console.error);
      }
    }

    // Handle direct fund-task payment (no custom_payment_id)
    if (!payment.custom_payment_id && payment.payment_type === 'workmanship') {
      await syncPaymentToCurrentTasker(payment);
      // Mark task as funded
      await supabase
        .from('tasks')
        .update({ is_funded: true, funded_at: new Date().toISOString(), funded_amount: payment.amount })
        .eq('id', payment.task_id);

      // Notify tasker in-app
      (async () => {
        try {
          await supabase.from('notifications').insert({
          user_id: payment.tasker_id,
          type: 'task_funded',
          title: '💰 Payment Received — Start Your Task',
          message: `The requester has paid ${money(payment.amount, payment.currency)} for your task. Work can begin now.`,
          data: { task_id: payment.task_id, payment_id: payment.id },
          action_url: '/tasker',
          });
        } catch (_) {}
      })();

      // Email the tasker
      const { data: taskerData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', payment.tasker_id)
        .maybeSingle();

      const { data: taskData } = await supabase
        .from('tasks')
        .select('title, deadline')
        .eq('id', payment.task_id)
        .maybeSingle();

      if (taskerData && taskData) {
        sendTaskPaidEmail(taskerData.email, taskerData.full_name, taskData.title, payment.amount, taskData.deadline, payment.currency || 'NGN').catch(() => {});
      }
    }

    if (payment.payment_type === 'tip') await onTipPaid(payment);

    // Handle Vooom task payment — marks task as funded, notifies carrier
    if (payment.payment_type === 'vooom') {
      const vtaskId = payment.vooom_task_id;
      if (vtaskId) {
        const { data: vtask } = await supabase
          .from('vooom_tasks')
          .select('from_city, to_city, requester_id')
          .eq('id', vtaskId)
          .maybeSingle();

        await Promise.resolve(supabase.from('notifications').insert({
          user_id: payment.tasker_id,
          type: 'vooom_funded',
          title: '💰 Vooom payment received — proceed with delivery',
          message: `The requester has paid ${money(payment.amount, payment.currency)} for the Vooom delivery${vtask ? ` (${vtask.from_city} → ${vtask.to_city})` : ''}. Proceed with the handover.`,
          action_url: `/vooom/${vtaskId}`,
        })).catch(() => {});

        // 80% payout to carrier after platform fee
        const feeRate = await getTaskerFeeRate(payment.tasker_id);
        const taskerAmount = Math.round(payment.amount * (1 - feeRate));
        const { data: carrier } = await supabase.from('users').select('email, full_name').eq('id', payment.tasker_id).maybeSingle();
        if (carrier?.email) {
          const { sendEmail } = require('../utils/email');
          sendEmail({
            to: carrier.email,
            subject: `Vooom payment of ₦${Number(taskerAmount).toLocaleString()} is being processed`,
            html: `<p>Hi ${carrier.full_name?.split(' ')[0] || 'there'},</p><p>The requester confirmed the Vooom delivery and payment of <strong>₦${Number(taskerAmount).toLocaleString()}</strong> (after platform fee) is being processed to your account.</p>`,
          }).catch(() => {});
        }
      }
    }

    return res.json({ success: true, message: 'Payment verified', payment });
  } catch (err) {
    console.error('Verify error:', err?.message);
    return res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
}

router.get('/verify/:reference', authenticate, async (req, res) => {
  const out = await confirmPaymentByReference(req.params.reference);
  res.status(out.code).json(out.body);
});

// ─── POST /payments/rapyd-webhook — Rapyd payment notifications ───
// The body is only a hint: the payment is re-read from Rapyd before anything
// is marked paid (confirmPaymentByReference → checkCheckoutPaid).
router.post('/rapyd-webhook', async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
  const urlPath = (process.env.RAPYD_WEBHOOK_URL || '').trim() || `https://${req.get('host')}${req.originalUrl}`;
  if (!rapyd.verifyWebhook(urlPath, req.headers, rawBody)) {
    console.warn('Rapyd webhook: invalid signature');
    return res.status(401).send('Invalid signature');
  }
  let body;
  try { body = JSON.parse(rawBody); } catch { return res.status(400).send('Invalid JSON'); }
  const d = body?.data || {};
  const reference = d.merchant_reference_id || d.metadata?.reference || d.payment?.merchant_reference_id;
  if (reference && /PAYMENT_COMPLETED|PAYMENT_SUCCEEDED|CHECKOUT_COMPLETED|PAYMENT_FAILED|PAYMENT_EXPIRED/i.test(body?.type || '')) {
    try {
      const { data: payment } = await supabase.from('payments').select('id, provider').eq('flw_reference', reference).maybeSingle();
      if (payment?.provider === 'rapyd') await confirmPaymentByReference(reference);
    } catch (e) { console.error('Rapyd webhook processing error:', e?.message); }
  }
  res.sendStatus(200);
});

// ─── POST /payments/webhook — Flutterwave webhook ─────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['verif-hash'] || req.headers['x-flw-signature'];
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  let body;
  try { body = JSON.parse(rawBody); } catch { return res.status(400).send('Invalid JSON'); }

  if (!verifyWebhookSignature(body, signature)) {
    console.warn('Flutterwave webhook: invalid signature');
    return res.status(401).send('Invalid signature');
  }

  console.log('Flutterwave webhook:', body.event);

  if (body.event === 'charge.completed' && body.data?.status === 'successful') {
    const txRef = body.data.tx_ref;
    try {
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('flw_reference', txRef)
        .maybeSingle();

      // Conditional claim: the browser's /verify call may be confirming the
      // same payment right now; only the first one runs the follow-up actions.
      let claimedByWebhook = false;
      if (payment && payment.status === 'pending') {
        const { data: claimed } = await supabase
          .from('payments')
          .update({ status: 'completed', flw_transaction_id: String(body.data.id) })
          .eq('flw_reference', txRef)
          .eq('status', 'pending')
          .select('id');
        claimedByWebhook = !!claimed?.length;
      }
      if (claimedByWebhook) {

        // Handle fund-task workmanship payments (no custom_payment_id)
        if (!payment.custom_payment_id && payment.payment_type === 'workmanship') {
          await syncPaymentToCurrentTasker(payment);
          // Mark task as funded
          await supabase
            .from('tasks')
            .update({ is_funded: true, funded_at: new Date().toISOString(), funded_amount: payment.amount })
            .eq('id', payment.task_id);

          // Notify tasker in-app — fire and forget
          (async () => {
            try {
              await supabase.from('notifications').insert({
                user_id: payment.tasker_id,
                type: 'task_funded',
                title: '💰 Payment Received — Start Your Task',
                message: `Payment of ${money(payment.amount, payment.currency)} received for your task.`,
                data: { task_id: payment.task_id },
                action_url: '/tasker',
              });
            } catch (_) {}
          })();

          // Email the tasker
          const [{ data: taskerData }, { data: taskData }] = await Promise.all([
            supabase.from('users').select('email, full_name').eq('id', payment.tasker_id).maybeSingle(),
            supabase.from('tasks').select('title, deadline').eq('id', payment.task_id).maybeSingle(),
          ]);
          if (taskerData && taskData) {
            sendTaskPaidEmail(taskerData.email, taskerData.full_name, taskData.title, payment.amount, taskData.deadline, payment.currency || 'NGN').catch(() => {});
          }
        }

        if (payment.payment_type === 'tip') await onTipPaid(payment);

        // Handle Vooom payment via webhook
        if (payment.payment_type === 'vooom' && payment.vooom_task_id) {
          const vtaskId = payment.vooom_task_id;

          const { data: vtask } = await supabase
            .from('vooom_tasks')
            .select('from_city, to_city, requester_id')
            .eq('id', vtaskId)
            .maybeSingle();

          await Promise.resolve(supabase.from('notifications').insert({
            user_id: payment.tasker_id,
            type: 'vooom_funded',
            title: '💰 Vooom payment received — proceed with delivery',
            message: `The requester has paid ${money(payment.amount, payment.currency)} for the Vooom delivery${vtask ? ` (${vtask.from_city} → ${vtask.to_city})` : ''}. Proceed with the handover.`,
            action_url: `/vooom/${vtaskId}`,
          })).catch(() => {});

          const feeRate = await getTaskerFeeRate(payment.tasker_id);
          const taskerAmount = Math.round(payment.amount * (1 - feeRate));
          const { data: carrier } = await supabase.from('users').select('email, full_name').eq('id', payment.tasker_id).maybeSingle();
          if (carrier?.email) {
            const { sendEmail } = require('../utils/email');
            sendEmail({
              to: carrier.email,
              subject: `Vooom payment of ₦${Number(taskerAmount).toLocaleString()} is being processed`,
              html: `<p>Hi ${carrier.full_name?.split(' ')[0] || 'there'},</p><p>The requester confirmed the Vooom delivery and payment of <strong>₦${Number(taskerAmount).toLocaleString()}</strong> (after platform fee) is being processed to your account.</p>`,
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('Webhook processing error:', err?.message);
    }
  }

  res.sendStatus(200);
});

// ─── POST /payments/custom — create custom payment window ─────────
router.post('/custom', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { task_id, equipment_cost, shipment_cost, workmanship_cost } = req.body;

    const { data: task } = await supabase
      .from('tasks')
      .select('requester_id, accepted_tasker_id, status')
      .eq('id', task_id)
      .maybeSingle();

    if (!task || task.requester_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (task.status !== 'ongoing')
      return res.status(400).json({ success: false, message: 'Task must be ongoing' });

    const { data: cp, error } = await supabase
      .from('custom_payments')
      .insert({
        task_id,
        requester_id: req.user.id,
        tasker_id: task.accepted_tasker_id,
        equipment_cost: equipment_cost || 0,
        shipment_cost: shipment_cost || 0,
        workmanship_cost: workmanship_cost || 0,
        status: equipment_cost || shipment_cost ? 'awaiting_proof' : 'pending',
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: task.accepted_tasker_id,
        type: 'custom_payment_created',
        title: 'Payment Window Created',
        message: 'A payment window has been set up. Review details in your dashboard.',
        data: { custom_payment_id: cp.id, task_id },
        action_url: '/tasker',
        });
      } catch (_) {}
    })();

    res.status(201).json({ success: true, custom_payment: cp });
  } catch (err) {
    console.error('Custom payment error:', err?.message);
    res.status(500).json({ success: false, message: 'Failed to create payment window' });
  }
});

// ─── POST /payments/custom/:id/upload-proof ───────────────────────
router.post(
  '/custom/:id/upload-proof',
  authenticate,
  uploadProof.array('proofs', 5),
  async (req, res) => {
    try {
      const { data: cp } = await supabase
        .from('custom_payments')
        .select('*, task:tasks(title), requester:users!requester_id(email, full_name)')
        .eq('id', req.params.id)
        .maybeSingle();

      if (!cp || cp.tasker_id !== req.user.id)
        return res.status(403).json({ success: false, message: 'Not authorized' });

      const urls = req.files?.length
        ? await Promise.all(req.files.map(f => uploadProofBuffer(f.buffer).then(r => r.secure_url)))
        : [];
      const existing = cp.equipment_proof_urls || [];

      await supabase
        .from('custom_payments')
        .update({ equipment_proof_urls: [...existing, ...urls], status: 'proof_uploaded' })
        .eq('id', req.params.id);

      (async () => {
        try {
          await supabase.from('notifications').insert({
          user_id: cp.requester_id,
          type: 'proof_uploaded',
          title: 'Equipment Proof Uploaded',
          message: 'Your tasker has uploaded evidence. Review and confirm to release funds.',
          data: { custom_payment_id: cp.id, task_id: cp.task_id },
          action_url: '/requester',
          });
        } catch (_) {}
      })();

      try {
        await sendProofUploadedEmail(cp.requester.email, cp.requester.full_name, cp.task.title);
      } catch (_) {}

      res.json({ success: true, message: 'Proof uploaded', urls });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Upload failed' });
    }
  }
);

// ─── POST /payments/custom/:id/confirm ───────────────────────────
router.post('/custom/:id/confirm', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { data: cp } = await supabase
      .from('custom_payments')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!cp || cp.requester_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (cp.status !== 'proof_uploaded')
      return res.status(400).json({ success: false, message: 'No proof to confirm' });

    await supabase
      .from('custom_payments')
      .update({ requester_confirmed: true, status: 'confirmed' })
      .eq('id', req.params.id);

    const amount = parseFloat(cp.equipment_cost) + parseFloat(cp.shipment_cost);
    if (amount > 0) {
      releaseEquipmentFunds(cp, amount).catch(console.error);
    }

    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: cp.tasker_id,
        type: 'proof_confirmed',
        title: 'Proof Confirmed',
        message: `Equipment + shipment funds are being transferred to you.`,
        data: { custom_payment_id: cp.id },
        action_url: '/tasker',
        });
      } catch (_) {}
    })();

    res.json({ success: true, message: 'Confirmed! Funds being released to tasker.' });
  } catch (err) {
    console.error('Confirm error:', err?.message);
    res.status(500).json({ success: false, message: 'Confirmation failed' });
  }
});

// ─── POST /payments/refund/request ───────────────────────────────
router.post('/refund/request', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { task_id, payment_id, amount, reason } = req.body;
    if (!task_id || !amount || !reason)
      return res.status(400).json({ success: false, message: 'Missing fields' });

    const { data: task } = await supabase
      .from('tasks')
      .select('accepted_tasker_id, requester_id, title, accepted_tasker:users!accepted_tasker_id(email, full_name)')
      .eq('id', task_id)
      .maybeSingle();

    if (!task || task.requester_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const { data: refund, error } = await supabase
      .from('refund_requests')
      .insert({
        task_id,
        requester_id: req.user.id,
        tasker_id: task.accepted_tasker_id,
        payment_id: payment_id || null,
        amount: parseFloat(amount),
        reason,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: task.accepted_tasker_id,
        type: 'refund_request',
        title: 'Refund Request',
        message: `${req.user.full_name} has requested a refund. Please respond.`,
        data: { refund_id: refund.id, task_id },
        action_url: '/tasker',
        });
      } catch (_) {}
    })();

    try {
      await sendRefundRequestEmail(
      task.accepted_tasker.email,
      task.accepted_tasker.full_name,
      req.user.full_name,
      amount,
      reason
      );
    } catch (_) {}

    res.status(201).json({ success: true, message: 'Refund request submitted', refund });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Refund request failed' });
  }
});

// ─── POST /payments/refund/:id/respond ───────────────────────────
router.post('/refund/:id/respond', authenticate, async (req, res) => {
  try {
    const { status, response_message } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const { data: refund } = await supabase
      .from('refund_requests')
      .select('*, requester:users!requester_id(email, full_name)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!refund || refund.tasker_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await supabase
      .from('refund_requests')
      .update({ status, tasker_response: response_message })
      .eq('id', req.params.id);

    if (status === 'approved') {
      processRefundTransfer(refund).catch(console.error);
    }

    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: refund.requester_id,
        type: 'refund_response',
        title: status === 'approved' ? 'Refund Approved' : 'Refund Rejected',
        message: status === 'approved'
        ? `Your refund is being processed`
        : `Your refund request was rejected.${response_message ? ' Reason: ' + response_message : ''}`,
        data: { refund_id: refund.id },
        });
      } catch (_) {}
    })();

    res.json({ success: true, message: `Refund ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Response failed' });
  }
});

// ─── GET /payments/history ────────────────────────────────────────
router.get('/history', authenticate, async (req, res) => {
  try {
    let q = supabase
      .from('payments')
      .select('*, task:tasks(title, task_city, status)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (req.user.role === 'requester') q = q.eq('requester_id', req.user.id);
    else if (req.user.role === 'tasker') q = q.eq('tasker_id', req.user.id);

    const { data: payments, error } = await q;
    if (error) throw error;
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// ─── GET /payments/custom/:taskId ────────────────────────────────
router.get('/custom/:taskId', authenticate, async (req, res) => {
  try {
    const { data: cp } = await supabase
      .from('custom_payments')
      .select('*')
      .eq('task_id', req.params.taskId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({ success: true, custom_payment: cp || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── GET /payments/refunds ────────────────────────────────────────
router.get('/refunds', authenticate, async (req, res) => {
  try {
    let q = supabase
      .from('refund_requests')
      .select('*, task:tasks(title)')
      .order('created_at', { ascending: false });

    if (req.user.role === 'requester') q = q.eq('requester_id', req.user.id);
    else if (req.user.role === 'tasker') q = q.eq('tasker_id', req.user.id);

    const { data: refunds, error } = await q;
    if (error) throw error;
    res.json({ success: true, refunds });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── POST /payments/withdraw — tasker requests bank payout ────────
router.post('/withdraw', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('tasker_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!profile)
      return res.status(404).json({ success: false, message: 'Tasker profile not found' });
    if (profile.verification_status !== 'approved')
      return res.status(403).json({ success: false, message: 'Your account must be approved before withdrawing' });
    const country = getCountry(req.user.market);
    const intl = country.provider === 'rapyd';
    const cur = country.currency;
    if (intl ? !payoutDetailsComplete(profile.payout_details) : (!profile.bank_account_number || !profile.bank_code))
      return res.status(400).json({ success: false, message: intl ? 'Please add your bank details in your Profile before withdrawing' : 'Please set your bank details (with bank code) before withdrawing' });

    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('id, amount, task_id, payment_type, task:tasks(status)')
      .eq('tasker_id', req.user.id)
      .eq('status', 'completed')
      .eq('currency', cur)
      .in('payment_type', ['workmanship', 'tip'])
      .is('withdrawn_at', null);
    if (payErr) throw payErr;

    // Tips and extra money from the requester: withdrawable at any time, no fee.
    const tipPays = (payments || []).filter(p => p.payment_type === 'tip');
    const tipsTotal = round2(tipPays.reduce((sum, p) => sum + Number(p.amount || 0), 0));

    const workPays = (payments || []).filter(p => p.payment_type === 'workmanship');
    if (!workPays.length && !tipPays.length)
      return res.status(400).json({ success: false, message: 'No earnings available for withdrawal.' });

    // Only tasks confirmed complete with the requester's completion code are
    // payable. Ongoing tasks are simply skipped (their money stays in escrow);
    // they must not block payout of tasks that ARE complete.
    const eligible = workPays.filter(p => p.task?.status === 'completed');
    if (!eligible.length && !tipPays.length)
      return res.status(400).json({ success: false, message: 'Your earnings become available after the requester confirms task completion with the 6-digit completion code. Only an approved advance can be withdrawn before then.' });

    // Balance per task = funded − advances already paid out (shared calculator).
    const escrowMap = await getEscrowForTasks(eligible.map(p => p.task_id));
    const totalAmount = round2(eligible.reduce((sum, p) => sum + (escrowMap.get(p.task_id)?.remaining || 0), 0));
    const totalAdvanceDeduction = round2(eligible.reduce((sum, p) => sum + (escrowMap.get(p.task_id)?.advance_withdrawn || 0), 0));

    const wMin = country.withdrawMin;
    if (totalAmount + tipsTotal < wMin)
      return res.status(400).json({ success: false, message: totalAdvanceDeduction > 0 ? `After deducting advances of ${money(totalAdvanceDeduction, cur)}, your remaining balance of ${money(totalAmount + tipsTotal, cur)} is below the minimum withdrawal of ${money(wMin, cur)}.` : `Minimum withdrawal amount is ${money(wMin, cur)}.` });

    // Platform fee: 20% (or the tasker's admin-set rate) of the WHOLE amount the
    // requester paid for each task — not of the balance left after advances.
    // The shared escrow calculator already applied it per task.
    const feeRate = await getTaskerFeeRate(req.user.id); // label only; each task's fee is summed below
    const feeLabel = feePercentLabel(feeRate);
    const platformFee = round2(eligible.reduce((sum, p) => sum + (escrowMap.get(p.task_id)?.platform_fee || 0), 0));
    const netPayout = round2(totalAmount - platformFee + tipsTotal); // tips: no fee

    const ref = generateReference('PAY');
    const paymentIds = [...eligible, ...tipPays].map(p => p.id);

    // STEP 1 — Reserve these earnings BEFORE moving any money. The
    // `.is('withdrawn_at', null)` guard makes a concurrent second request a no-op.
    // ('withdrawn' is not allowed by the payments.status CHECK; 'processing' is.)
    // The payout reference goes in payout_reference. It must NOT overwrite
    // flw_reference: that column is UNIQUE and holds each payment's own
    // Flutterwave charge reference (used by webhooks). Writing one payout ref
    // onto several rows made every multi-task withdrawal fail.
    const reserve = (fields) => supabase
      .from('payments')
      .update(fields)
      .in('id', paymentIds)
      .is('withdrawn_at', null)
      .select('id');
    const reservedAt = new Date().toISOString();
    let { data: reserved, error: reserveErr } = await reserve({ withdrawn_at: reservedAt, status: 'processing', payout_reference: ref });
    if (reserveErr && /payout_reference/i.test(reserveErr.message || '')) {
      // ADVANCE_PAYMENTS_MIGRATION.sql not run yet — reserve without storing the ref.
      console.warn('[payments] payout_reference column missing — run database/ADVANCE_PAYMENTS_MIGRATION.sql');
      ({ data: reserved, error: reserveErr } = await reserve({ withdrawn_at: reservedAt, status: 'processing' }));
    }

    if (reserveErr) {
      console.error('Withdraw reserve error:', reserveErr.message);
      return res.status(500).json({ success: false, message: 'Could not lock earnings for withdrawal. Please try again.' });
    }
    if (!reserved || reserved.length !== paymentIds.length) {
      if (reserved?.length) {
        await supabase.from('payments')
          .update({ withdrawn_at: null, status: 'completed' })
          .in('id', reserved.map(r => r.id));
      }
      return res.status(409).json({ success: false, already: true, message: 'These earnings are already being withdrawn. Refreshing your balance…' });
    }

    // Taskeeu income ledger — one row per task in this payout (best-effort:
    // money has already moved when this runs, so it must never fail the request).
    const recordEarnings = async (status) => {
      const rows = eligible.map((p) => {
        const e = escrowMap.get(p.task_id);
        if (!e) return null;
        return {
          payment_id: p.id, task_id: p.task_id, tasker_id: req.user.id, requester_id: e.requester_id || null,
          gross_amount: e.funded, fee_rate: e.platform_fee_rate, fee_amount: e.platform_fee,
          advance_deducted: e.advance_withdrawn, tasker_payout: e.net_payout,
          payout_reference: ref, status, source: 'payout', currency: cur,
        };
      }).filter(Boolean);
      if (!rows.length) return;
      try {
        let { error } = await supabase.from('platform_earnings').upsert(rows, { onConflict: 'payment_id' });
        if (error && /currency/i.test(error.message || '') && cur === 'NGN') {
          ({ error } = await supabase.from('platform_earnings').upsert(rows.map(({ currency, ...r }) => r), { onConflict: 'payment_id' }));
        }
        if (error) console.error('[earnings] ledger write failed — ref', ref, error.message);
      } catch (e) { console.error('[earnings] ledger write failed — ref', ref, e?.message); }
    };

    // STEP 2 (international) — the Taskeeu team pays it from the payout queue.
    if (intl) {
      const { error: qErr } = await supabase.from('payout_requests').insert({
        tasker_id: req.user.id, country: country.code, currency: cur, amount: netPayout, kind: 'earnings',
        reference: ref, payment_ids: paymentIds, bank_snapshot: profile.payout_details || null, status: 'pending',
      });
      if (qErr) {
        await supabase.from('payments').update({ withdrawn_at: null, status: 'completed' }).in('id', paymentIds);
        console.error('Payout queue insert failed:', qErr.message);
        return res.status(500).json({ success: false, message: 'Could not submit the withdrawal. Your earnings are untouched, please try again.' });
      }
      await recordEarnings('pending');
      for (const p of eligible) {
        const e = escrowMap.get(p.task_id);
        if (!e) continue;
        logActivity(p.task_id, {
          actor: req.user, role: 'tasker', event: 'earnings_withdrawn',
          summary: `Tasker requested the final balance: ${money(e.net_payout, cur)} (balance ${money(e.remaining, cur)} minus Taskeeu fee ${money(e.platform_fee, cur)}, ${feePercentLabel(e.platform_fee_rate)} of the ${money(e.funded, cur)} paid)`,
          details: { funded: e.funded, balance: e.remaining, net: e.net_payout, fee: e.platform_fee, fee_rate: e.platform_fee_rate, advance_deducted: e.advance_withdrawn, payout_reference: ref, currency: cur },
        });
      }
      return res.json({
        success: true,
        queued: true,
        message: `Withdrawal of ${money(netPayout, cur)} submitted (ref ${ref}). Taskeeu pays it to your bank account within 1 to 2 business days and emails you when it is sent.`,
        amount: netPayout, gross: totalAmount, advance_deducted: totalAdvanceDeduction, tips: tipsTotal,
        platform_fee: platformFee, platform_fee_rate: feeRate, currency: cur, reference: ref,
      });
    }

    // STEP 2 — Transfer.
    try {
      await initiateTransfer({
        accountNumber: profile.bank_account_number,
        bankCode: profile.bank_code,
        accountName: profile.bank_account_name,
        amount: netPayout,
        currency: 'NGN',
        narration: 'Taskeeu earnings payout',
        reference: ref,
      });
    } catch (transferErr) {
      if (transferErr?.ambiguous) {
        // No clear answer from the provider — the money may already be on its way.
        // Keep the reservation so a retry can never pay twice.
        console.error('Withdraw AMBIGUOUS transfer — needs manual check. ref:', ref, transferErr?.message);
        await recordEarnings('pending');
        return res.status(202).json({ success: true, pending_confirmation: true, amount: netPayout, message: `Your withdrawal of ₦${netPayout.toLocaleString()} was submitted but the bank has not confirmed yet (ref ${ref}). Please do not retry — check your bank in a few minutes. If nothing arrives within 1 hour, contact support with this reference.` });
      }
      await supabase.from('payments')
        .update({ withdrawn_at: null, status: 'completed' })
        .in('id', paymentIds);
      console.error('Withdraw transfer rejected:', transferErr?.message);
      return res.status(502).json({ success: false, message: `Withdrawal could not be sent: ${transferErr?.message || 'bank transfer provider error'}. Your earnings are untouched — please try again.` });
    }

    await recordEarnings('earned');

    // Activity log for tips / extra money paid out.
    const tipsByTask = new Map();
    for (const t of tipPays) tipsByTask.set(t.task_id, round2((tipsByTask.get(t.task_id) || 0) + Number(t.amount || 0)));
    for (const [taskId, amt] of tipsByTask) {
      if (!taskId) continue;
      logActivity(taskId, {
        actor: req.user, role: 'tasker', event: 'tip_withdrawn',
        summary: `Tasker withdrew tips / extra money: ₦${amt.toLocaleString()} (no platform fee)`,
        details: { amount: amt, payout_reference: ref },
      });
    }

    // Activity log: each task's share of this payout.
    for (const p of eligible) {
      const e = escrowMap.get(p.task_id);
      if (!e) continue;
      logActivity(p.task_id, {
        actor: req.user, role: 'tasker', event: 'earnings_withdrawn',
        summary: `Tasker withdrew the final balance: ₦${e.net_payout.toLocaleString()} (balance ₦${e.remaining.toLocaleString()} − Taskeeu fee ₦${e.platform_fee.toLocaleString()} = ${feePercentLabel(e.platform_fee_rate)} of the ₦${e.funded.toLocaleString()} paid${e.platform_fee_rate < PLATFORM_FEE_RATE ? ', reduced by admin' : ''})`,
        details: { funded: e.funded, balance: e.remaining, net: e.net_payout, fee: e.platform_fee, fee_rate: e.platform_fee_rate, advance_deducted: e.advance_withdrawn, payout_reference: ref },
      });
    }

    try {
      await sendPaymentSentEmail(req.user.email, req.user.full_name, netPayout, 'workmanship');
    } catch (_) {}

    res.json({
      success: true,
      message: `₦${netPayout.toLocaleString()} is on its way to ${profile.bank_name || 'your bank'} (${platformFee > 0 ? `balance ₦${totalAmount.toLocaleString()} − ₦${platformFee.toLocaleString()} Taskeeu fee (${feeLabel} of the task payment)` : 'your full balance, no platform fee'}${tipsTotal > 0 ? ` + ₦${tipsTotal.toLocaleString()} tips and extra money, no fee` : ''}). Funds arrive in 1–3 minutes.`,
      amount: netPayout,
      gross: totalAmount,
      advance_deducted: totalAdvanceDeduction,
      tips: tipsTotal,
      platform_fee: platformFee,
      platform_fee_rate: feeRate,
    });
  } catch (err) {
    console.error('Withdraw error:', err?.message);
    res.status(500).json({ success: false, message: 'Withdrawal could not be completed. Please refresh — if your balance is unchanged, try again.' });
  }
});


// ─── Helpers ──────────────────────────────────────────────────────
// A requester may switch tasker (before funding) while a checkout is open.
// The payment row was created for whoever was assigned at checkout time, so
// when the money actually arrives, always credit the task's CURRENT tasker.
async function syncPaymentToCurrentTasker(payment) {
  try {
    const { data: t } = await supabase.from('tasks')
      .select('accepted_tasker_id').eq('id', payment.task_id).maybeSingle();
    if (t?.accepted_tasker_id && t.accepted_tasker_id !== payment.tasker_id) {
      await supabase.from('payments').update({ tasker_id: t.accepted_tasker_id }).eq('id', payment.id);
      payment.tasker_id = t.accepted_tasker_id;
    }
  } catch (e) {
    console.error('Sync payment tasker error:', e?.message);
  }
}

async function releaseEquipmentFunds(cp, amount) {
  const { data: tasker } = await supabase
    .from('tasker_profiles')
    .select('*, user:users!user_id(email, full_name)')
    .eq('user_id', cp.tasker_id)
    .maybeSingle();

  if (!tasker?.bank_account_number || !tasker?.bank_code) return;

  const ref = generateReference('EQUIP');
  try {
    await initiateTransfer({
      accountNumber: tasker.bank_account_number,
      bankCode: tasker.bank_code,
      accountName: tasker.bank_account_name,
      amount,
      currency: 'NGN',
      narration: 'Equipment/shipment reimbursement',
      reference: ref,
    });
    try {
      await sendPaymentSentEmail(tasker.user.email, tasker.user.full_name, amount, 'equipment');
    } catch (_) {}
  } catch (err) {
    console.error('Equipment funds release error:', err?.message);
  }
}

async function releaseWorkmanshipPayment(payment, cp) {
  const { data: tasker } = await supabase
    .from('tasker_profiles')
    .select('bank_name, user:users!user_id(email, full_name)')
    .eq('user_id', payment.tasker_id)
    .maybeSingle();

  if (!tasker) return;
  try {
    await sendPaymentSentEmail(tasker.user.email, tasker.user.full_name, payment.amount, 'workmanship');
  } catch (_) {}
}

async function processRefundTransfer(refund) {
  const { data: requester } = await supabase
    .from('requester_profiles')
    .select('*, user:users!user_id(email, full_name)')
    .eq('user_id', refund.requester_id)
    .maybeSingle();

  if (!requester) return;

  await supabase
    .from('refund_requests')
    .update({ status: 'processing', processed_at: new Date().toISOString() })
    .eq('id', refund.id);

  // International tasks were paid by card through Rapyd: the Taskeeu team
  // refunds the card from the Rapyd dashboard (the refund stays 'processing'
  // in Admin until then). Only Naira refunds go out by bank transfer.
  const refundCurrency = refund.task_id ? (await taskMarket(refund.task_id)).currency : 'NGN';
  if (refundCurrency === 'NGN' && requester.bank_account_number && requester.bank_code) {
    const ref = generateReference('REFUND');
    try {
      await initiateTransfer({
        accountNumber: requester.bank_account_number,
        bankCode: requester.bank_code,
        accountName: requester.bank_account_name,
        amount: refund.amount,
        currency: 'NGN',
        narration: 'Taskeeu refund',
        reference: ref,
      });
    } catch (err) {
      console.error('Refund transfer error:', err?.message);
    }
  }

  try {
    await sendPaymentSentEmail(requester.user.email, requester.user.full_name, refund.amount, 'refund', refundCurrency);
  } catch (_) {}
}

// ─── POST /payments/fund-vooom — escrow payment for Vooom tasks ───
router.post('/fund-vooom', authenticate, async (req, res) => {
  try {
    const { vooom_task_id, amount } = req.body;
    if (!vooom_task_id || !amount || Number(amount) < 100)
      return res.status(400).json({ success: false, message: 'Vooom task ID and amount (min ₦100) are required' });

    const { data: task } = await supabase
      .from('vooom_tasks')
      .select('accepted_tasker_id, requester_id, from_city, to_city, status')
      .eq('id', vooom_task_id)
      .maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Vooom task not found' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (task.status !== 'ongoing') return res.status(400).json({ success: false, message: 'Carrier must be accepted before payment' });
    if (!task.accepted_tasker_id) return res.status(400).json({ success: false, message: 'No carrier accepted yet' });

    // Check if already funded
    const { data: existing } = await supabase
      .from('payments')
      .select('id, status')
      .eq('vooom_task_id', vooom_task_id)
      .eq('payment_type', 'vooom')
      .eq('status', 'completed')
      .maybeSingle();
    if (existing) return res.status(409).json({ success: false, message: 'This Vooom task is already funded' });

    const { generateReference, initializePayment } = require('../utils/flutterwave');
    const reference = generateReference();

    const payData = await initializePayment({
      email: req.user.email,
      amount: parseFloat(amount),
      currency: 'NGN',
      reference,
      customerName: req.user.full_name,
      metadata: {
        vooom_task_id,
        payment_type: 'vooom',
        tasker_id: task.accepted_tasker_id,
        requester_id: req.user.id,
        task_label: `Vooom: ${task.from_city} → ${task.to_city}`,
      },
    });

    // Use vooom_task_id column (NOT task_id which has FK constraint to tasks table)
    await supabase.from('payments').insert({
      vooom_task_id,
      requester_id: req.user.id,
      tasker_id: task.accepted_tasker_id,
      payment_type: 'vooom',
      amount: parseFloat(amount),
      currency: 'NGN',
      flw_reference: reference,
      flw_link: payData.authorization_url,
      status: 'pending',
    });

    res.json({
      success: true,
      payment_url: payData.authorization_url,
      reference,
      message: 'Redirect user to payment_url to complete payment.',
    });
  } catch (err) {
    console.error('Fund vooom error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not initialize payment' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// ADVANCE PAYMENT SYSTEM
// Taskers can request up to 50% of the escrowed amount (in total, across all
// advances on a task) for equipment/transport. The requester approves (may
// lower the amount) or rejects. An approved advance can be withdrawn to the
// tasker's bank while the task is ongoing. The escrow balance shown everywhere
// is funded − advances (see utils/escrow.js).
//
// Every write here is IDEMPOTENT: if the same action is repeated (double
// click, network retry, response lost on a slow connection) the endpoint
// answers with the same success result instead of an error.
// ═══════════════════════════════════════════════════════════════════════

const ADVANCE_STATUS_TEXT = {
  pending: 'waiting for the requester to approve it',
  approved: 'approved',
  rejected: 'rejected by the requester',
  withdrawn: 'already sent to your bank',
};

const notify = (row) => Promise.resolve(supabase.from('notifications').insert(row)).catch(() => {});

// ─── POST /payments/advance/request ─────────────────────────────────
router.post('/advance/request', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { task_id, note } = req.body;
    const requested = Math.floor(Number(req.body.requested_amount));

    const advCountry = getCountry(req.user.market);
    const advMin = advCountry.advanceMin;
    if (!task_id || !Number.isFinite(requested) || requested < advMin)
      return res.status(400).json({ success: false, message: `Select a task and enter an amount of at least ${money(advMin, advCountry.currency)}.` });

    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('id, title, requester_id, accepted_tasker_id, status')
      .eq('id', task_id)
      .maybeSingle();
    if (taskErr) throw taskErr;

    if (!task)
      return res.status(404).json({ success: false, message: 'Task not found.' });
    if (task.accepted_tasker_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'You are not the assigned tasker for this task.' });
    if (task.status !== 'ongoing')
      return res.status(400).json({ success: false, message: 'Advance requests are only available while the task is ongoing.' });

    // An active request already exists → return it (idempotent for double clicks).
    const { data: activeList, error: activeErr } = await supabase
      .from('advance_requests')
      .select('*')
      .eq('task_id', task_id)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1);
    if (activeErr) throw activeErr;
    const active = activeList?.[0];
    if (active) {
      if (active.status === 'pending' && Number(active.requested_amount) === requested) {
        // Same request submitted again (double click / retry) — treat as success.
        return res.json({ success: true, already: true, advance: active, message: 'Your advance request has been sent. The requester will review it shortly.' });
      }
      return res.status(409).json({
        success: false,
        advance: active,
        message: active.status === 'pending'
          ? 'You already have an advance request waiting for the requester on this task.'
          : 'Your advance on this task is approved — withdraw it before requesting another.',
      });
    }

    const escrow = await getEscrowForTask(task_id);
    if (!escrow || escrow.funded <= 0)
      return res.status(400).json({ success: false, message: 'This task has not been funded yet. The requester must pay into escrow before you can request an advance.' });
    const ec = escrow.currency;
    if (escrow.advance_available < countryByCurrency(ec).advanceMin)
      return res.status(400).json({ success: false, message: `You have already received the maximum advance for this task (50% of ${money(escrow.funded, ec)}).` });
    if (requested > escrow.advance_available)
      return res.status(400).json({ success: false, message: `You can request at most ${money(escrow.advance_available, ec)} (50% of ${money(escrow.funded, ec)} in escrow, minus advances already given).` });

    const { data: advance, error } = await supabase
      .from('advance_requests')
      .insert({
        task_id,
        tasker_id: req.user.id,
        requester_id: task.requester_id,
        requested_amount: requested,
        approved_amount: null,
        status: 'pending',
        note: (note || '').trim() || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      // 23505 = the one-active-advance-per-task unique index caught a concurrent duplicate.
      if (error.code === '23505') {
        const { data: dup } = await supabase.from('advance_requests').select('*')
          .eq('task_id', task_id).in('status', ['pending', 'approved'])
          .order('created_at', { ascending: false }).limit(1);
        return res.json({ success: true, already: true, advance: dup?.[0] || null, message: 'Your advance request has been sent. The requester will review it shortly.' });
      }
      throw error;
    }

    notify({
      user_id: task.requester_id,
      type: 'advance_request',
      title: '💳 Advance Payment Request',
      message: `Your tasker has requested a ${money(requested, escrow.currency)} advance for equipment/transport costs on "${task.title}". Please review and approve or adjust the amount.`,
      data: { advance_id: advance.id, task_id },
      action_url: `/requester?tab=tasks&task=${task_id}`,
    });

    res.status(201).json({ success: true, advance, message: 'Advance request sent. The requester will review it shortly.' });
  } catch (err) {
    console.error('Advance request error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not submit advance request. Please refresh and check before trying again.' });
  }
});

// ─── GET /payments/advance/task/:taskId ─────────────────────────────
// Advances + escrow balance for one task. Only that task's requester,
// assigned tasker, or an admin may read it.
router.get('/advance/task/:taskId', authenticate, async (req, res) => {
  try {
    const escrow = await getEscrowForTask(req.params.taskId);
    if (!escrow) return res.status(404).json({ success: false, message: 'Task not found.' });
    const allowed = req.user.role === 'admin' || escrow.requester_id === req.user.id || escrow.tasker_id === req.user.id;
    if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const { data: advances, error } = await supabase
      .from('advance_requests')
      .select('*')
      .eq('task_id', req.params.taskId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.json({ success: true, advance: advances?.[0] || null, advances: advances || [], escrow });
  } catch (err) {
    console.error('Advance task fetch error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not fetch advance request.' });
  }
});

// ─── GET /payments/escrow — balances for every funded task of the caller ──
router.get('/escrow', authenticate, async (req, res) => {
  try {
    const col = req.user.role === 'tasker' ? 'accepted_tasker_id' : 'requester_id';
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id')
      .eq(col, req.user.id)
      .in('status', ['ongoing', 'completed', 'cancelled']);
    if (error) throw error;
    const map = await getEscrowForTasks((tasks || []).map(t => t.id));
    const rows = [...map.values()].filter(e => e.funded > 0);
    const summary = {
      available_gross: round2(rows.filter(r => r.payout_status === 'available').reduce((s, r) => s + r.remaining, 0)),
    };
    summary.platform_fee = round2(rows.filter(r => r.payout_status === 'available').reduce((s, r) => s + r.platform_fee, 0));
    if (req.user.role === 'tasker') summary.platform_fee_rate = await getTaskerFeeRate(req.user.id);
    summary.available_net = round2(summary.available_gross - summary.platform_fee);
    if (req.user.role === 'tasker') {
      const { data: tips } = await supabase.from('payments').select('amount')
        .eq('tasker_id', req.user.id).eq('payment_type', 'tip').eq('status', 'completed').is('withdrawn_at', null);
      summary.tips_available = round2((tips || []).reduce((s, t) => s + Number(t.amount || 0), 0));
      summary.withdrawable_total = round2(summary.available_net + summary.tips_available);
    }
    res.json({ success: true, escrow: rows, summary });
  } catch (err) {
    console.error('Escrow fetch error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load balances.' });
  }
});

// ─── GET /payments/advance/pending ──────────────────────────────────
router.get('/advance/pending', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { data: advances, error } = await supabase
      .from('advance_requests')
      .select('*, task:tasks(id, title, funded_amount, status), tasker:users!tasker_id(id, full_name, avatar_url)')
      .eq('requester_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const escrowMap = await getEscrowForTasks((advances || []).map(a => a.task_id));
    res.json({ success: true, advances: (advances || []).map(a => ({ ...a, escrow: escrowMap.get(a.task_id) || null })) });
  } catch (err) {
    console.error('Pending advances error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not fetch pending advances.' });
  }
});

// ─── GET /payments/advance/my-requests ──────────────────────────────
router.get('/advance/my-requests', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { data: advances, error } = await supabase
      .from('advance_requests')
      .select('*, task:tasks(id, title, funded_amount, status)')
      .eq('tasker_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const escrowMap = await getEscrowForTasks((advances || []).map(a => a.task_id));
    res.json({ success: true, advances: (advances || []).map(a => ({ ...a, escrow: escrowMap.get(a.task_id) || null })) });
  } catch (err) {
    console.error('My advances error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not fetch advance requests.' });
  }
});

// ─── PUT /payments/advance/:id/respond ──────────────────────────────
router.put('/advance/:id/respond', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { decision, response_note } = req.body;
    if (!['approved', 'rejected'].includes(decision))
      return res.status(400).json({ success: false, message: 'Decision must be "approved" or "rejected".' });

    const { data: advance, error: fetchErr } = await supabase
      .from('advance_requests')
      .select('*, task:tasks(title, status)')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    if (!advance)
      return res.status(404).json({ success: false, message: 'Advance request not found.' });
    if (advance.requester_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    // Already decided. Same decision again = double click / retry → success.
    const alreadyAnswer = async (current) => {
      const sameDecision = current.status === decision || (decision === 'approved' && current.status === 'withdrawn');
      const escrow = await getEscrowForTask(current.task_id);
      if (sameDecision) {
        return res.json({
          success: true, already: true, escrow,
          message: decision === 'approved'
            ? `Advance of ${money(current.approved_amount, escrow?.currency)} is approved. The tasker has been notified.`
            : 'Advance request rejected. The tasker has been notified.',
        });
      }
      return res.status(409).json({ success: false, already: true, escrow, message: `This request was already ${current.status === 'withdrawn' ? 'approved and withdrawn' : current.status}.` });
    };
    if (advance.status !== 'pending') return alreadyAnswer(advance);

    let finalApprovedAmount = null;
    if (decision === 'approved') {
      if (advance.task?.status !== 'ongoing')
        return res.status(400).json({ success: false, message: 'This task is no longer ongoing, so the advance cannot be approved.' });

      const escrow = await getEscrowForTask(advance.task_id);
      if (!escrow || escrow.funded <= 0)
        return res.status(400).json({ success: false, message: 'Could not find the escrow payment for this task. Please contact support.' });

      const raw = req.body.approved_amount;
      const amt = Math.floor(Number(raw === undefined || raw === null || raw === '' ? advance.requested_amount : raw));
      const ec = escrow.currency;
      const minAdv = countryByCurrency(ec).advanceMin;
      if (!Number.isFinite(amt) || amt < minAdv)
        return res.status(400).json({ success: false, message: `Approved amount must be at least ${money(minAdv, ec)}.` });
      if (amt > Number(advance.requested_amount))
        return res.status(400).json({ success: false, message: `You can approve up to the ${money(advance.requested_amount, ec)} requested (or less).` });
      if (amt > escrow.advance_available) {
        // A simultaneous approval of THIS request (second tab/device) may have
        // just used up the limit — answer as "already approved", not an error.
        const { data: now } = await supabase.from('advance_requests').select('*').eq('id', advance.id).maybeSingle();
        if (now && now.status !== 'pending') return alreadyAnswer(now);
        return res.status(400).json({ success: false, message: `Approved amount cannot exceed ${money(escrow.advance_available, ec)} (50% of the ${money(escrow.funded, ec)} escrow, minus advances already given).` });
      }
      finalApprovedAmount = amt;
    }

    // Conditional update — only one request can move it out of 'pending'.
    const { data: updated, error } = await supabase
      .from('advance_requests')
      .update({
        status: decision,
        approved_amount: finalApprovedAmount,
        response_note: (response_note || '').trim() || null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .select('*');
    if (error) throw error;

    if (!updated?.length) {
      const { data: current } = await supabase.from('advance_requests').select('*').eq('id', req.params.id).maybeSingle();
      return alreadyAnswer(current || advance);
    }

    const escrow = await getEscrowForTask(advance.task_id);
    const ec = escrow?.currency || 'NGN';
    notify({
      user_id: advance.tasker_id,
      type: decision === 'approved' ? 'advance_approved' : 'advance_rejected',
      title: decision === 'approved' ? '✅ Advance Approved — Withdraw Now' : '❌ Advance Request Rejected',
      message: decision === 'approved'
        ? `Your advance of ${money(finalApprovedAmount, ec)} has been approved. Open the task in My Tasks → Advance to withdraw it to your bank account.`
        : `Your advance request was not approved.${response_note ? ' Note: ' + response_note : ''} You can discuss with the requester via chat.`,
      data: { advance_id: advance.id, task_id: advance.task_id },
      action_url: `/tasker?tab=my-tasks&task=${advance.task_id}`,
    });

    res.json({
      success: true,
      advance: updated[0],
      escrow,
      message: decision === 'approved'
        ? `Advance of ${money(finalApprovedAmount, ec)} approved. ${money(escrow.remaining, ec)} remains in escrow until the task is completed.`
        : 'Advance request rejected. The tasker has been notified.',
    });
  } catch (err) {
    console.error('Advance respond error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not process response. Please refresh and check before trying again.' });
  }
});

// ─── POST /payments/advance/:id/withdraw ────────────────────────────
router.post('/advance/:id/withdraw', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { data: advance, error: fetchErr } = await supabase
      .from('advance_requests')
      .select('*, task:tasks(title, status)')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    if (!advance)
      return res.status(404).json({ success: false, message: 'Advance request not found.' });
    if (advance.tasker_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    const advCountry = getCountry(req.user.market);
    const advIntl = advCountry.provider === 'rapyd';
    const ac = advCountry.currency;
    const alreadySent = (row) => res.json({
      success: true, already: true, amount: Number(row.approved_amount),
      message: advIntl
        ? `${money(row.approved_amount, ac)} has already been requested${row.flw_reference ? ` (ref ${row.flw_reference})` : ''}. Taskeeu pays it to your bank within 1 to 2 business days.`
        : `₦${Number(row.approved_amount).toLocaleString()} has already been sent to your bank${row.flw_reference ? ` (ref ${row.flw_reference})` : ''}. Allow a few minutes for the alert.`,
    });

    // Checked FIRST so a retry after success is answered as success.
    if (advance.status === 'withdrawn' || advance.withdrawn_at) return alreadySent(advance);
    if (advance.status !== 'approved')
      return res.status(400).json({ success: false, message: `This advance is ${ADVANCE_STATUS_TEXT[advance.status] || advance.status}.` });
    if (advance.task?.status !== 'ongoing')
      return res.status(400).json({ success: false, message: 'This task is no longer ongoing. The approved advance has been added back to your final balance — withdraw it from Earnings.' });

    const { data: profile } = await supabase
      .from('tasker_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!profile)
      return res.status(404).json({ success: false, message: 'Tasker profile not found.' });
    if (profile.verification_status !== 'approved')
      return res.status(403).json({ success: false, message: 'Your account must be fully approved before withdrawing.' });
    if (advIntl ? !payoutDetailsComplete(profile.payout_details) : (!profile.bank_account_number || !profile.bank_code))
      return res.status(400).json({ success: false, message: 'Please add your bank account details in your Profile before withdrawing.' });

    const amount = Number(advance.approved_amount);
    if (!amount || amount < advCountry.advanceMin)
      return res.status(400).json({ success: false, message: 'Invalid approved amount.' });

    // Lock: approved → withdrawn. Only ONE request can win this update.
    const ref = generateReference('ADV');
    const { data: locked, error: lockErr } = await supabase
      .from('advance_requests')
      .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString(), flw_reference: ref })
      .eq('id', advance.id)
      .eq('status', 'approved')
      .is('withdrawn_at', null)
      .select('id');

    if (lockErr) {
      console.error('Advance withdraw lock error:', lockErr.message, lockErr.code);
      return res.status(500).json({ success: false, message: 'Could not start the withdrawal. Please try again.' });
    }
    if (!locked?.length) {
      const { data: current } = await supabase.from('advance_requests').select('*').eq('id', advance.id).maybeSingle();
      if (current?.status === 'withdrawn') return alreadySent(current);
      return res.status(409).json({ success: false, message: `This advance is ${ADVANCE_STATUS_TEXT[current?.status] || 'no longer available'}.` });
    }

    const rollback = () => supabase.from('advance_requests')
      .update({ status: 'approved', withdrawn_at: null, flw_reference: null })
      .eq('id', advance.id);

    // Safety: the final payout for this task must not already have been taken.
    const { data: payoutTaken } = await supabase.from('payments').select('id')
      .eq('task_id', advance.task_id).eq('payment_type', 'workmanship')
      .not('withdrawn_at', 'is', null).limit(1);
    if (payoutTaken?.length) {
      await rollback();
      return res.status(400).json({ success: false, message: 'The final payment for this task has already been withdrawn, so this advance is no longer available.' });
    }

    if (advIntl) {
      const { error: qErr } = await supabase.from('payout_requests').insert({
        tasker_id: req.user.id, country: advCountry.code, currency: ac, amount, kind: 'advance',
        reference: ref, advance_id: advance.id, bank_snapshot: profile.payout_details || null, status: 'pending',
      });
      if (qErr) {
        await rollback();
        console.error('Advance payout queue insert failed:', qErr.message);
        return res.status(500).json({ success: false, message: 'Could not submit the withdrawal. Your advance is still available, please try again.' });
      }
      notify({
        user_id: advance.requester_id,
        type: 'advance_withdrawn',
        title: 'Advance withdrawn by tasker',
        message: `Your tasker has withdrawn the ${money(amount, ac)} advance for "${advance.task?.title}".`,
        data: { advance_id: advance.id, task_id: advance.task_id },
        action_url: `${pathPrefix(advCountry.code)}/requester?tab=tasks&task=${advance.task_id}`,
      });
      let escrowQ = null;
      try { escrowQ = await getEscrowForTask(advance.task_id); } catch (_) {}
      return res.json({
        success: true, queued: true, amount, escrow: escrowQ, reference: ref,
        message: `Advance of ${money(amount, ac)} submitted (ref ${ref}). Taskeeu pays it to your bank account within 1 to 2 business days.`,
      });
    }

    try {
      await initiateTransfer({
        accountNumber: profile.bank_account_number,
        bankCode: profile.bank_code,
        accountName: profile.bank_account_name,
        amount,
        currency: 'NGN',
        narration: `Taskeeu advance for ${advance.task?.title || 'task'} (equipment/transport)`,
        reference: ref,
      });
    } catch (transferErr) {
      if (transferErr?.ambiguous) {
        // No clear answer — money may be on its way. Keep it marked withdrawn so a
        // retry can never send it twice.
        console.error('Advance withdraw AMBIGUOUS transfer — needs manual check. ref:', ref, transferErr?.message);
        return res.status(202).json({ success: true, pending_confirmation: true, amount, message: `Your advance of ₦${amount.toLocaleString()} was submitted but the bank has not confirmed yet (ref ${ref}). Please do not retry — check your bank in a few minutes. If nothing arrives within 1 hour, contact support with this reference.` });
      }
      await rollback();
      console.error('Advance transfer rejected:', transferErr?.message);
      return res.status(502).json({ success: false, message: `Bank transfer was declined: ${transferErr?.message || 'provider error'}. Your advance is still available — please check your bank details and try again.` });
    }

    // Money has been sent. Nothing below may turn this into an error response.
    notify({
      user_id: advance.requester_id,
      type: 'advance_withdrawn',
      title: '💸 Advance Withdrawn by Tasker',
      message: `Your tasker has withdrawn the ₦${amount.toLocaleString()} advance for "${advance.task?.title}".`,
      data: { advance_id: advance.id, task_id: advance.task_id },
      action_url: `/requester?tab=tasks&task=${advance.task_id}`,
    });
    try { await sendPaymentSentEmail(req.user.email, req.user.full_name, amount, 'advance'); } catch (_) {}

    let escrow = null;
    try { escrow = await getEscrowForTask(advance.task_id); } catch (_) {}

    res.json({
      success: true,
      amount,
      escrow,
      message: `₦${amount.toLocaleString()} is on its way to ${profile.bank_name || 'your bank'} (${profile.bank_account_number}). It usually arrives within 1–3 minutes.`,
    });
  } catch (err) {
    console.error('Advance withdraw error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not complete the withdrawal. Please refresh — your advance status will show whether it was sent.' });
  }
});


module.exports = router;
