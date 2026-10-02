const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticate, requireRole, softAuth } = require('../middleware/auth');

const VEHICLE_LABELS = {
  any: 'Any Vehicle', car: 'Car', truck: 'Truck', van: 'Van',
  motorcycle: 'Motorcycle', bus: 'Bus', flight: 'Flight ✈️', ship: 'Ship 🚢',
};

// ── Notify all users when a vooom task is posted ──────────────────
async function notifyVooomTask(task, requester) {
  try {
    const { sendPushToUsers } = require('./push');
    const route = `${task.from_city} → ${task.to_city}`;
    await sendPushToUsers({
      userIds: null,
      title: `⚡ New Vooom Request: ${route}`,
      body: `${requester?.full_name || 'Someone'} needs a carrier for ${task.item_type}.${task.proposed_price ? ` Proposed: ₦${Number(task.proposed_price).toLocaleString()}` : ''}`,
      url: `/vooom/${task.id}`,
    }).catch(() => {});

    const { data: users } = await supabase
      .from('users')
      .select('email, full_name, role')
      .in('role', ['requester', 'tasker'])
      .neq('id', task.requester_id)
      .limit(500);

    if (!users?.length) return;

    const { sendEmail } = require('../utils/email');
    const FRONTEND = process.env.FRONTEND_URL || 'https://taskeeu.com';
    const F = "'Helvetica Neue',Helvetica,Arial,sans-serif";
    const travelDate = new Date(task.travel_date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f9f9f9;font-family:${F}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <tr><td style="background:linear-gradient(135deg,#0f0720,#1e0d33);padding:28px 32px">
    <p style="margin:0;font-size:20px;font-weight:900;color:#fff;font-family:${F}">⚡ Vooom by Taskeeu</p>
    <p style="margin:5px 0 0;font-size:13px;color:rgba(255,255,255,0.55);font-family:${F}">New logistics request posted</p>
  </td></tr>
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 18px;font-size:15px;color:#374151;font-family:${F}">Someone needs a carrier. Check if you are going their way.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:20px">
      <tr><td style="padding:18px 20px">
        <p style="margin:0 0 10px;font-size:19px;font-weight:800;color:#111827;font-family:${F}">${task.from_city}, ${task.from_state}${task.from_country !== 'Nigeria' ? ', ' + task.from_country : ''} → ${task.to_city}, ${task.to_state}${task.to_country !== 'Nigeria' ? ', ' + task.to_country : ''}</p>
        <p style="margin:0 0 5px;font-size:13px;color:#6b7280;font-family:${F}">📦 Item: <strong style="color:#111">${task.item_type}</strong></p>
        <p style="margin:0 0 5px;font-size:13px;color:#6b7280;font-family:${F}">🚗 Vehicle: <strong style="color:#111">${VEHICLE_LABELS[task.vehicle_type] || task.vehicle_type}</strong></p>
        <p style="margin:0 0 5px;font-size:13px;color:#6b7280;font-family:${F}">📅 Travel date: <strong style="color:#111">${travelDate}</strong></p>
        ${task.proposed_price ? `<p style="margin:4px 0 0;font-size:14px;color:#059669;font-weight:700;font-family:${F}">₦${Number(task.proposed_price).toLocaleString()} proposed</p>` : ''}
      </td></tr>
    </table>
    <a href="${FRONTEND}/vooom/${task.id}" style="display:inline-block;background:#ff2d62;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;font-family:${F}">View & Bid</a>
  </td></tr>
</table></td></tr></table></body></html>`;

    const BATCH = 50;
    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH);
      await Promise.all(batch.map(u =>
        sendEmail({ to: u.email, subject: `⚡ Vooom: ${route} — bid now`, html }).catch(() => {})
      ));
      if (i + BATCH < users.length) await new Promise(r => setTimeout(r, 600));
    }
    await Promise.resolve(supabase.from('vooom_tasks').update({ notification_sent: true }).eq('id', task.id)).catch(() => {});
  } catch (err) {
    console.error('Vooom notify error:', err?.message);
  }
}

// ─────────────────────────────────────────────────────────────────────
// IMPORTANT: Specific paths MUST come before /:id to avoid Express
// treating 'my', 'switch-to-requester' etc. as id params.
// ─────────────────────────────────────────────────────────────────────

// ── GET /vooom — browse with filters + pagination ─────────────────
router.get('/', softAuth, async (req, res) => {
  try {
    const { from_city, from_state, from_country, to_city, to_state, to_country,
      vehicle_type, item_type, search, is_international, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = supabase
      .from('vooom_tasks')
      .select('*, requester:users!requester_id(id, full_name, avatar_url, username), bids:vooom_bids(count)', { count: 'exact' })
      .in('status', ['open', 'bidding'])
      .gte('travel_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (from_city)   q = q.ilike('from_city', `%${from_city}%`);
    if (from_state)  q = q.ilike('from_state', `%${from_state}%`);
    if (from_country) q = q.eq('from_country', from_country);
    if (to_city)     q = q.ilike('to_city', `%${to_city}%`);
    if (to_state)    q = q.ilike('to_state', `%${to_state}%`);
    if (to_country)  q = q.eq('to_country', to_country);
    if (vehicle_type) q = q.eq('vehicle_type', vehicle_type);
    if (item_type)   q = q.ilike('item_type', `%${item_type}%`);
    if (is_international === 'true') q = q.eq('is_international', true);
    if (search) q = q.or(`from_city.ilike.%${search}%,to_city.ilike.%${search}%,item_type.ilike.%${search}%,item_description.ilike.%${search}%`);

    const { data, error, count } = await q;
    if (error) throw error;

    res.json({
      success: true, tasks: data || [],
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count || 0, pages: Math.ceil((count || 0) / parseInt(limit)) },
    });
  } catch (err) {
    console.error('Vooom list error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load Vooom requests' });
  }
});

// ── GET /vooom/my/requester — MUST be before /:id ─────────────────
router.get('/my/requester', authenticate, async (req, res) => {
  try {
    const { data } = await supabase
      .from('vooom_tasks')
      .select('*, bids:vooom_bids(*, tasker:users!tasker_id(id, full_name, avatar_url, username))')
      .eq('requester_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json({ success: true, tasks: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load your Vooom requests' });
  }
});

// ── GET /vooom/my/tasker — MUST be before /:id ───────────────────
router.get('/my/tasker', authenticate, async (req, res) => {
  try {
    const { data } = await supabase
      .from('vooom_bids')
      .select('*, task:vooom_tasks(*)')
      .eq('tasker_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json({ success: true, bids: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load your Vooom bids' });
  }
});

// ── POST /vooom/switch-to-requester — MUST be before /:id ────────
router.post('/switch-to-requester', authenticate, async (req, res) => {
  try {
    const { accepted } = req.body;
    if (!accepted) return res.status(400).json({ success: false, message: 'You must accept the terms to switch' });

    const { data: existing } = await supabase
      .from('requester_profiles').select('user_id').eq('user_id', req.user.id).maybeSingle();
    if (!existing) {
      const { error: pe } = await supabase.from('requester_profiles').insert({ user_id: req.user.id });
      if (pe) throw pe;
    }

    await supabase.from('users').update({
      has_requester_account: true,
      has_tasker_account: true,
    }).eq('id', req.user.id);

    res.json({ success: true, message: 'Requester account activated. You can now switch between dashboards.' });
  } catch (err) {
    console.error('Switch error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not activate requester account' });
  }
});

// ── POST /vooom — create a vooom task ────────────────────────────
// Only requesters OR taskers who have switched (has_requester_account=true) can post.
router.post('/', authenticate, async (req, res) => {
  try {
    // Gate: must be a requester or a dual-account tasker who accepted the switch
    const canPost = req.user.role === 'requester' || req.user.has_requester_account === true;
    if (!canPost) {
      return res.status(403).json({
        success: false,
        message: 'Taskers must activate a requester account before posting Vooom requests. Use the "Post request" button in your Vooom dashboard tab to get started.',
      });
    }
    const {
      from_city, from_state, from_country = 'Nigeria',
      to_city, to_state, to_country = 'Nigeria',
      travel_date, vehicle_type, item_type, item_description, proposed_price,
    } = req.body;

    if (!from_city || !from_state || !to_city || !to_state || !travel_date || !vehicle_type || !item_type || !item_description)
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    if (new Date(travel_date) < new Date())
      return res.status(400).json({ success: false, message: 'Travel date must be in the future' });

    const isInternational = from_country !== 'Nigeria' || to_country !== 'Nigeria';

    const { data: task, error } = await supabase
      .from('vooom_tasks')
      .insert({
        requester_id: req.user.id,
        from_city: from_city.trim(), from_state: from_state.trim(), from_country,
        to_city: to_city.trim(), to_state: to_state.trim(), to_country,
        travel_date: new Date(travel_date).toISOString(),
        vehicle_type, item_type: item_type.trim(),
        item_description: item_description.trim(),
        proposed_price: proposed_price || null,
        is_international: isInternational,
      })
      .select('*, requester:users!requester_id(full_name)')
      .single();

    if (error) throw error;

    notifyVooomTask(task, task.requester).catch(() => {});
    res.status(201).json({ success: true, task });
  } catch (err) {
    console.error('Vooom create error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not create request' });
  }
});

// ── GET /vooom/:id — single task detail ──────────────────────────
router.get('/:id', softAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vooom_tasks')
      .select(`
        *,
        requester:users!requester_id(id, full_name, avatar_url, username, created_at),
        bids:vooom_bids(id, amount, message, status, created_at, tasker_id, tasker:users!tasker_id(id, full_name, avatar_url, username))
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Request not found' });

    // Check if a completed payment exists
    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('vooom_task_id', req.params.id)
      .eq('payment_type', 'vooom')
      .eq('status', 'completed')
      .maybeSingle();

    const userId = req.user?.id;
    const isRequester = userId === data.requester_id;
    const sanitizedBids = (data.bids || []).map(bid => {
      const isMyBid = userId === bid.tasker_id;
      if (isRequester || isMyBid) return bid;
      return { ...bid, amount: null, message: null };
    });

    res.json({ success: true, task: { ...data, bids: sanitizedBids, funded: !!payment } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load request' });
  }
});

// ── POST /vooom/:id/bid ───────────────────────────────────────────
router.post('/:id/bid', authenticate, async (req, res) => {
  try {
    const { amount, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Please include a message explaining why you are the right carrier' });

    const { data: task } = await supabase
      .from('vooom_tasks')
      .select('requester_id, status, from_city, to_city, item_type')
      .eq('id', req.params.id).maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Request not found' });
    if (!['open', 'bidding'].includes(task.status))
      return res.status(400).json({ success: false, message: 'This request is no longer accepting bids' });
    if (task.requester_id === req.user.id)
      return res.status(400).json({ success: false, message: 'You cannot bid on your own request' });

    const { data: bid, error } = await supabase
      .from('vooom_bids')
      .insert({ vooom_task_id: req.params.id, tasker_id: req.user.id, amount: amount ? Number(amount) : null, message: message.trim() })
      .select('*, tasker:users!tasker_id(full_name, avatar_url)')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ success: false, message: 'You have already bid on this request' });
      throw error;
    }

    await supabase.from('vooom_tasks').update({ status: 'bidding' }).eq('id', req.params.id).eq('status', 'open');

    await Promise.resolve(supabase.from('notifications').insert({
      user_id: task.requester_id, type: 'vooom_bid',
      title: 'New bid on your Vooom request',
      message: `${bid.tasker?.full_name || 'A carrier'} bid on your ${task.from_city} → ${task.to_city} request${amount ? ` for ₦${Number(amount).toLocaleString()}` : ''}.`,
      action_url: `/vooom/${req.params.id}`,
    })).catch(() => {});

    res.status(201).json({ success: true, bid });
  } catch (err) {
    console.error('Vooom bid error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not place bid' });
  }
});

// ── POST /vooom/:id/accept-bid/:bidId ────────────────────────────
router.post('/:id/accept-bid/:bidId', authenticate, async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('vooom_tasks').select('requester_id, status')
      .eq('id', req.params.id).maybeSingle();
    if (!task) return res.status(404).json({ success: false, message: 'Not found' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (!['open', 'bidding'].includes(task.status))
      return res.status(400).json({ success: false, message: 'Cannot accept a bid on this task' });

    const { data: bid } = await supabase
      .from('vooom_bids')
      .select('tasker_id, amount, tasker:users!tasker_id(full_name)')
      .eq('id', req.params.bidId).maybeSingle();
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    // Accept bid + close others
    await supabase.from('vooom_bids').update({ status: 'accepted' }).eq('id', req.params.bidId);
    await supabase.from('vooom_bids').update({ status: 'rejected' })
      .eq('vooom_task_id', req.params.id).neq('id', req.params.bidId).eq('status', 'pending');
    await supabase.from('vooom_tasks')
      .update({ status: 'ongoing', accepted_tasker_id: bid.tasker_id })
      .eq('id', req.params.id);

    // Create chat room so requester and carrier can coordinate handover
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('vooom_task_id', req.params.id)
      .maybeSingle();

    if (!existingRoom) {
      const { data: taskInfo } = await supabase
        .from('vooom_tasks')
        .select('from_city, to_city')
        .eq('id', req.params.id)
        .maybeSingle();

      await Promise.resolve(supabase.from('chat_rooms').insert({
        vooom_task_id: req.params.id,
        requester_id: req.user.id,
        tasker_id: bid.tasker_id,
        task_title: `⚡ Vooom: ${taskInfo?.from_city || ''} → ${taskInfo?.to_city || ''}`,
      })).catch(e => console.warn('Chat room create warn:', e?.message));
    }

    await Promise.resolve(supabase.from('notifications').insert({
      user_id: bid.tasker_id, type: 'vooom_accepted',
      title: 'Your Vooom bid was accepted!',
      message: 'The requester accepted your bid. Chat them to coordinate the handover details.',
      action_url: `/vooom/${req.params.id}`,
    })).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error('Accept bid error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not accept bid' });
  }
});

// ── POST /vooom/:id/complete — requester confirms delivery, releases payment ──
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('vooom_tasks')
      .select('requester_id, accepted_tasker_id, status, from_city, to_city')
      .eq('id', req.params.id).maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Not found' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (task.status !== 'ongoing') return res.status(400).json({ success: false, message: 'Task is not ongoing' });

    // Verify a completed payment exists before allowing delivery confirmation
    const { data: payment } = await supabase
      .from('payments')
      .select('id, amount, tasker_id')
      .eq('vooom_task_id', req.params.id)
      .eq('payment_type', 'vooom')
      .eq('status', 'completed')
      .maybeSingle();

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: 'Please complete the escrow payment before confirming delivery. This protects the carrier.',
      });
    }

    await supabase.from('vooom_tasks').update({ status: 'completed' }).eq('id', req.params.id);

    if (task.accepted_tasker_id) {
      await Promise.resolve(supabase.from('notifications').insert({
        user_id: task.accepted_tasker_id, type: 'vooom_completed',
        title: 'Vooom delivery confirmed!',
        message: `The requester confirmed delivery for your ${task.from_city} → ${task.to_city} Vooom task. Payment will be processed.`,
        action_url: `/vooom/${req.params.id}`,
      })).catch(() => {});
    }

    res.json({ success: true, message: 'Delivery confirmed. Payment will be released to the carrier.' });
  } catch (err) {
    console.error('Vooom complete error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not confirm delivery' });
  }
});

// ── POST /vooom/:id/cancel — cancel a vooom task ─────────────────
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('vooom_tasks')
      .select('requester_id, accepted_tasker_id, status')
      .eq('id', req.params.id).maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Not found' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ success: false, message: 'Only the requester can cancel' });
    if (['completed', 'cancelled'].includes(task.status))
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed or already cancelled task' });

    await supabase.from('vooom_tasks').update({ status: 'cancelled' }).eq('id', req.params.id);
    await supabase.from('vooom_bids').update({ status: 'rejected' })
      .eq('vooom_task_id', req.params.id).eq('status', 'pending');

    if (task.accepted_tasker_id) {
      await Promise.resolve(supabase.from('notifications').insert({
        user_id: task.accepted_tasker_id, type: 'vooom_cancelled',
        title: 'Vooom request cancelled',
        message: 'The requester cancelled this Vooom logistics request.',
        action_url: '/tasker?tab=vooom',
      })).catch(() => {});
    }

    res.json({ success: true, message: 'Request cancelled' });
  } catch (err) {
    console.error('Vooom cancel error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not cancel request' });
  }
});

module.exports = router;
