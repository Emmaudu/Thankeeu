const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');
const { stripTaskSecrets } = require('../utils/sanitize');
const { submitReview, requireNoPendingReviews } = require('../utils/reviews');
const { getProfileSlugs } = require('../utils/profileSlug');
const { getCompletedCounts } = require('../utils/taskerStats');
const { logActivity } = require('../utils/activity');
const { readTaskCosts } = require('../utils/taskCosts');
const { notifyBiddersOfCancellation } = require('../utils/cancelNotify');
const { uploadAnyFile, uploadAnyFileBuffer, deleteFile } = require('../utils/cloudinary');
const { countProofs } = require('../utils/reviews');
const { authenticate, requireRole, requireApprovedTasker } = require('../middleware/auth');
const { getCountry, parseCountry, money, pathPrefix } = require('../utils/countries');

/** Currency a task is priced in ('NGN' when the column does not exist yet). */
async function taskCurrencyOf(taskId) {
  try {
    const { data, error } = await supabase.from('tasks').select('currency').eq('id', taskId).maybeSingle();
    return (!error && data?.currency) || 'NGN';
  } catch (_) { return 'NGN'; }
}
const {
  sendNewBidEmail,
  sendBidAcceptedEmail,
  sendBidRejectedEmail,
  sendBidNotSelectedEmail,
  sendTaskCompletionCodeEmail,
  sendNewTaskNearbyEmail,
  sendCancelRequestEmail,
  sendDirectApplicationEmail,
} = require('../utils/email');

// ─── GET /tasks — list with filters ───────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { city, state, type, status = 'open', page = 1, limit = 20, search } = req.query;
    // Each market browses only its own tasks. No country = Nigeria (root site).
    const countryCode = req.query.country ? parseCountry(req.query.country) : 'NG';
    if (!countryCode) return res.status(400).json({ success: false, message: 'Unknown country' });
    const remoteOnly = req.query.remote === '1' || req.query.remote === 'true';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const now = new Date().toISOString();

    // Supabase query builders are MUTABLE — .eq() returns the same object rather
    // than a copy. So the query must be rebuilt from scratch for the fallback
    // path below, not derived from a partially-filtered builder.
    const buildQuery = (applyHiddenFilter, applyCountry = true) => {
      let q = supabase
        .from('tasks')
        .select(`
          *,
          requester:users!requester_id(id, username, avatar_url),
          bids:task_bids(count),
          accepted_tasker:users!accepted_tasker_id(id, username, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      // Only tasks open for new bids (open/bidding) whose deadline hasn't passed,
      // plus ongoing tasks regardless of deadline. Completed and cancelled never show.
      q = q.in('status', ['open', 'bidding', 'ongoing']);
      q = q.or(`deadline.gte.${now},status.eq.ongoing`);

      // Admin can pull a task off browse without changing its status.
      if (applyHiddenFilter) q = q.eq('is_hidden', false);
      if (applyCountry) q = q.eq('country', countryCode);
      if (applyCountry && remoteOnly) q = q.eq('is_remote', true);

      if (city)   q = q.ilike('task_city', `%${city}%`);
      if (state)  q = q.ilike('task_state', `%${state}%`);
      if (type)   q = q.eq('task_type', type);
      if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      return q;
    };

    let { data: tasks, error, count } = await buildQuery(true);

    // INTERNATIONAL_MIGRATION.sql not run yet: only Nigeria exists.
    if (error && /country|is_remote/i.test(error.message || '')) {
      if (countryCode !== 'NG') return res.json({ success: true, tasks: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 } });
      ({ data: tasks, error, count } = await buildQuery(true, false));
      if (error && /is_hidden/i.test(error.message || '')) ({ data: tasks, error, count } = await buildQuery(false, false));
    }

    // If ADMIN_HIDE_TASK_MIGRATION.sql hasn't been run the column won't exist and
    // the query errors. Rather than serving an empty browse page, retry without it.
    if (error && /is_hidden/i.test(error.message || '')) {
      console.warn('[tasks] is_hidden column missing — run ADMIN_HIDE_TASK_MIGRATION.sql. Serving unfiltered for now.');
      ({ data: tasks, error, count } = await buildQuery(false));
    }
    if (error) throw error;

    res.json({
      success: true,
      tasks: stripTaskSecrets(tasks || []),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

// ─── GET /tasks/:id — single task detail ──────────────────────────

router.get('/my/requester', authenticate, requireRole('requester', 'admin'), async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        accepted_tasker:users!accepted_tasker_id(id, full_name, avatar_url, phone),
        bids:task_bids(count)
      `)
      .eq('requester_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

router.get('/my/tasker', authenticate, async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        requester:users!requester_id(id, full_name, username, avatar_url, phone)
      `)
      .eq('accepted_tasker_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, tasks: stripTaskSecrets(tasks || []) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

router.get('/my/cancel-requests', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { data: requests } = await supabase
      .from('cancel_requests')
      .select('*, task:tasks(id, title, task_city, deadline), requester:users!requester_id(full_name, avatar_url)')
      .eq('tasker_id', req.user.id)
      .order('created_at', { ascending: false });

    res.json({ success: true, requests: requests || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cancel requests' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        requester:users!requester_id(id, username, avatar_url, created_at),
        accepted_tasker:users!accepted_tasker_id(id, username, avatar_url),
        bids:task_bids(
          id, workmanship_price, message, status, created_at,
          tasker:users!tasker_id(
            id, full_name, avatar_url,
            profile:tasker_profiles(rating_average, total_ratings, total_tasks_completed, task_city, task_state, skills, bio)
          )
        )
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !task)
      return res.status(404).json({ success: false, message: 'Task not found' });

    // Requester reputation (reviews written by taskers). Best-effort.
    let requester_rating = { average: 0, count: 0 };
    if (task.requester_id) {
      const { data: rp } = await supabase.from('requester_profiles')
        .select('rating_average, total_ratings').eq('user_id', task.requester_id).maybeSingle();
      if (rp) requester_rating = { average: Number(rp.rating_average || 0), count: Number(rp.total_ratings || 0) };
    }

    // Permanent profile links for the bidders and the chosen tasker.
    const slugs = await getProfileSlugs([
      ...(task.bids || []).map(b => b.tasker?.id),
      task.accepted_tasker?.id,
    ]);
    for (const b of task.bids || []) if (b.tasker) b.tasker.profile_slug = slugs.get(b.tasker.id) || null;
    // Live "tasks done" for each bidder (the cached column can be stale).
    const done = await getCompletedCounts((task.bids || []).map(b => b.tasker?.id));
    for (const b of task.bids || []) {
      const prof = Array.isArray(b.tasker?.profile) ? b.tasker.profile[0] : b.tasker?.profile;
      if (prof && done.has(b.tasker.id)) prof.total_tasks_completed = done.get(b.tasker.id);
    }
    if (task.accepted_tasker) task.accepted_tasker.profile_slug = slugs.get(task.accepted_tasker.id) || null;

    res.json({ success: true, task: { ...stripTaskSecrets(task), requester_rating } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
});

// ─── POST /tasks — create task ─────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole('requester', 'admin'),
  requireNoPendingReviews,
  [
    body('title').trim().isLength({ min: 5 }),
    body('description').trim().isLength({ min: 10 }),
    body('task_city').if((v, { req }) => !(req.body.is_remote === true || req.body.is_remote === 'true')).notEmpty(),
    body('task_state').if((v, { req }) => !(req.body.is_remote === true || req.body.is_remote === 'true')).notEmpty(),
    body('deadline').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const {
        title, description, task_type, from_address, from_city, from_state,
        to_address, to_city, to_state, task_city, task_state, task_full_address,
        deadline, budget_min, budget_max, is_equipment_required, equipment_description, tags,
      } = req.body;

      // A task is posted in the requester's own market, in its currency.
      const market = getCountry(req.user.market);
      if (req.body.country && parseCountry(req.body.country) !== market.code) {
        return res.status(403).json({
          success: false, code: 'WRONG_COUNTRY', country: market.code, country_slug: market.slug,
          message: `Your Taskeeu account is registered in ${market.name}. Tasks you post go on Taskeeu ${market.name}.`,
        });
      }
      const isRemote = req.body.is_remote === true || req.body.is_remote === 'true';

      // New posting form sends a cost breakdown; older clients send a budget range.
      const costs = readTaskCosts(req.body, null, { min: market.fundMin, minLabel: money(market.fundMin, market.currency) });
      if (costs.error) return res.status(400).json({ success: false, message: costs.error });

      const row = {
          requester_id: req.user.id,
          title,
          description,
          task_type: task_type || 'general',
          from_address, from_city, from_state,
          to_address, to_city, to_state,
          task_city: isRemote ? 'Remote' : task_city,
          task_state: isRemote ? (String(task_state || '').trim() || 'Remote') : task_state,
          task_full_address: isRemote ? null : task_full_address,
          deadline,
          budget_min: budget_min || null,
          budget_max: budget_max || null,
          is_equipment_required: is_equipment_required === true || is_equipment_required === 'true',
          equipment_description,
          tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
          status: 'open',
          ...(costs.fields || {}),
          ...(market.code !== 'NG' || isRemote ? { country: market.code, currency: market.currency, is_remote: isRemote } : {}),
        };
      let { data: task, error } = await supabase.from('tasks').insert(row).select().maybeSingle();
      if (error && /country|currency|is_remote/i.test(error.message || '')) {
        return res.status(503).json({ success: false, message: 'Posting in this country is not available yet (run database/INTERNATIONAL_MIGRATION.sql).' });
      }
      if (error && /cost_(workmanship|transport|waybill|items)/.test(error.message || '')) {
        // TASK_COSTS_MIGRATION.sql not run yet: keep the single total price, drop the breakdown.
        console.warn('[tasks] cost columns missing — run database/TASK_COSTS_MIGRATION.sql');
        const { cost_workmanship, cost_transport, cost_waybill, cost_items, ...rest } = row;
        ({ data: task, error } = await supabase.from('tasks').insert(rest).select().maybeSingle());
      }

      if (error) throw error;

      // Update requester total tasks
      try { await supabase.rpc('increment_requester_tasks', { uid: req.user.id }); } catch (_) {}

      // Find nearby taskers and notify them
      notifyNearbyTaskers(task).catch(console.error);

      res.status(201).json({ success: true, message: 'Task posted!', task });
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ success: false, message: 'Failed to post task' });
    }
  }
);

// Helper: notify taskers in matching city (fire-and-forget)
async function notifyNearbyTaskers(task) {
  // Remote tasks have no city to match; they are found on the browse page.
  if (task.is_remote) return;
  const taskCountry = task.country || 'NG';
  // Extract keywords from task city
  const taskCityKeywords = (task.task_city || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (!taskCityKeywords.length && !task.task_state) return;

  // Fetch all approved, available taskers
  let { data: allTaskers, error: tErr } = await supabase
    .from('tasker_profiles')
    .select('user_id, task_city, task_state, users:user_id(email, full_name, market)')
    .eq('verification_status', 'approved')
    .eq('is_available', true);
  if (tErr && /market/i.test(tErr.message || '')) {
    ({ data: allTaskers } = await supabase
      .from('tasker_profiles')
      .select('user_id, task_city, task_state, users:user_id(email, full_name)')
      .eq('verification_status', 'approved')
      .eq('is_available', true));
  }

  // Only taskers who live and work in the task's country.
  allTaskers = (allTaskers || []).filter((t) => (t.users?.market || 'NG') === taskCountry);
  if (!allTaskers.length) return;
  const taskPath = `${pathPrefix(taskCountry)}/tasks/${task.id}`;

  const cityTaskers  = [];
  const stateTaskers = []; // in same state but not matching city

  for (const t of allTaskers) {
    const tc = (t.task_city || '').toLowerCase();
    const ts = (t.task_state || '').toLowerCase();
    const taskState = (task.task_state || '').toLowerCase();

    const matchesCity  = taskCityKeywords.length > 0 && taskCityKeywords.some(kw => tc.includes(kw));
    const matchesState = taskState && ts === taskState;

    if (matchesCity) {
      cityTaskers.push(t);
    } else if (matchesState) {
      stateTaskers.push(t);
    }
  }

  const allNotifyTaskers = [...cityTaskers, ...stateTaskers];
  if (!allNotifyTaskers.length) return;

  // In-app notifications — city match gets priority title
  const notifications = [
    ...cityTaskers.map(t => ({
      user_id: t.user_id,
      type: 'new_task_nearby',
      title: 'New Task in Your City',
      message: `"${task.title}" — ${task.task_city}, ${task.task_state}`,
      data: { task_id: task.id },
      action_url: taskPath,
    })),
    ...stateTaskers.map(t => ({
      user_id: t.user_id,
      type: 'new_task_in_state',
      title: 'New Task in Your State',
      message: `"${task.title}" — ${task.task_city}, ${task.task_state}`,
      data: { task_id: task.id },
      action_url: taskPath,
    })),
  ];
  if (notifications.length) await supabase.from('notifications').insert(notifications);

  // Email city-matching taskers
  for (const t of cityTaskers) {
    const email = t.users?.email;
    const name  = t.users?.full_name || 'Tasker';
    if (!email) continue;
    sendNewTaskNearbyEmail(email, name, task.title, task.task_city, task.task_state,
      task.budget_min, task.budget_max, task.deadline, task.id, task.currency || 'NGN', taskPath).catch(() => {});
  }

  // Email state-matching taskers with slightly different subject
  for (const t of stateTaskers) {
    const email = t.users?.email;
    const name  = t.users?.full_name || 'Tasker';
    if (!email) continue;
    sendNewTaskNearbyEmail(email, name, task.title, task.task_city, task.task_state,
      task.budget_min, task.budget_max, task.deadline, task.id, task.currency || 'NGN', taskPath).catch(() => {});
  }
}

// ─── PUT /tasks/:id — update task (requester only) ────────────────
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.requester_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['completed', 'cancelled'].includes(task.status))
      return res.status(400).json({ success: false, message: 'Cannot edit completed/cancelled task' });

    const allowed = ['title','description','deadline','budget_min','budget_max','tags',
      'from_address','from_city','from_state','to_address','to_city','to_state',
      'task_full_address','equipment_description','is_equipment_required'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    // Cost breakdown edits recompute the single total (budget_min = budget_max).
    const costs = readTaskCosts(req.body, task);
    if (costs.error) return res.status(400).json({ success: false, message: costs.error });
    if (costs.fields) {
      if (task.is_funded) return res.status(400).json({ success: false, message: 'This task is already paid for, so its costs can no longer change.' });
      Object.assign(updates, costs.fields);
    }

    let { data: updated, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();
    if (error && /cost_(workmanship|transport|waybill|items)/.test(error.message || '')) {
      const { cost_workmanship, cost_transport, cost_waybill, cost_items, ...rest } = updates;
      ({ data: updated, error } = await supabase.from('tasks').update(rest).eq('id', req.params.id).select().maybeSingle());
    }

    if (error) throw error;
    res.json({ success: true, task: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ─── DELETE /tasks/:id — requester deletes/cancels an open task ───
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('requester_id, status, title')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.requester_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });

    // Only open or bidding tasks can be deleted by requester
    if (req.user.role !== 'admin' && !['open', 'bidding'].includes(task.status))
      return res.status(400).json({ success: false, message: `Cannot delete a task that is ${task.status}. Only open tasks can be deleted.` });

    if (task.status === 'cancelled')
      return res.json({ success: true, already: true, message: 'Task already cancelled.' });

    // Soft delete — mark as cancelled so it disappears from Browse Tasks.
    // Conditional: a double click can't cancel (and notify) twice.
    let q = supabase.from('tasks').update({ status: 'cancelled' }).eq('id', req.params.id).neq('status', 'cancelled');
    if (req.user.role !== 'admin') q = q.in('status', ['open', 'bidding']);
    const { data: cancelled, error: cancelErr } = await q.select('id');
    if (cancelErr) throw cancelErr;
    if (!cancelled?.length)
      return res.json({ success: true, already: true, message: 'Task already cancelled.' });

    logActivity(req.params.id, {
      actor: req.user, role: req.user.role === 'admin' ? 'admin' : 'requester',
      event: 'task_cancelled',
      summary: req.user.role === 'admin' ? 'Admin cancelled the task' : 'Requester cancelled the task',
      details: { previous_status: task.status },
    });
    notifyBiddersOfCancellation(req.params.id, task.title); // every bidder: in-app + email (background)

    res.json({ success: true, message: 'Task cancelled. Everyone who bid has been notified.' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ success: false, message: 'Deletion failed. Please try again.' });
  }
});

// ─── POST /tasks/:id/bid — tasker places bid ───────────────────────
router.post(
  '/:id/bid',
  authenticate,
  requireApprovedTasker,
  requireNoPendingReviews,
  [body('workmanship_price').isNumeric().isFloat({ min: 1 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { data: task } = await supabase
        .from('tasks')
        .select('*, requester:users!requester_id(email, full_name)')
        .eq('id', req.params.id)
        .maybeSingle();

      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
      if (!['open', 'bidding', 'ongoing'].includes(task.status))
        return res.status(400).json({ success: false, message: 'Task is not accepting bids' });

      // Taskers can only work in the country their account is registered in.
      const taskMarket = getCountry(task.country || 'NG');
      const taskerMarket = getCountry(req.user.market);
      if (taskMarket.code !== taskerMarket.code) {
        return res.status(403).json({
          success: false, code: 'WRONG_COUNTRY', country: taskerMarket.code, country_slug: taskerMarket.slug,
          message: `This task is on Taskeeu ${taskMarket.name}. Your tasker account is registered in ${taskerMarket.name}, so you can only bid on tasks there.`,
        });
      }
      if (Number(req.body.workmanship_price) < taskMarket.fundMin) {
        return res.status(400).json({ success: false, message: `Your price must be at least ${money(taskMarket.fundMin, taskMarket.currency)}.`, errors: [{ path: 'workmanship_price', msg: 'Invalid value' }] });
      }

      const { data: bid, error } = await supabase
        .from('task_bids')
        .insert({
          task_id: req.params.id,
          tasker_id: req.user.id,
          workmanship_price: req.body.workmanship_price,
          message: req.body.message || null,
          status: 'pending',
        })
        .select()
        .maybeSingle();

      if (error) {
        if (error.code === '23505')
          return res.status(409).json({ success: false, message: 'You already bid on this task' });
        throw error;
      }

      // Move an open task into 'bidding'. Do NOT touch an already-ongoing
      // task's status — a new bid on an ongoing task must not downgrade it
      // back to bidding (it's already assigned and being worked on).
      if (task.status === 'open') {
        await supabase.from('tasks').update({ status: 'bidding' }).eq('id', req.params.id);
      }

      // Notify requester (title reflects whether task is already in progress)
      const bidNotifTitle = task.status === 'ongoing' ? 'New Bid on Your Ongoing Task' : 'New Bid Received';
      (async () => {
        try {
          await supabase.from('notifications').insert({
          user_id: task.requester_id,
          type: 'new_bid',
          title: bidNotifTitle,
          message: `${req.user.full_name} bid ${money(req.body.workmanship_price, task.currency || 'NGN')} on "${task.title}"`,
          data: { task_id: task.id, bid_id: bid.id },
          action_url: `${pathPrefix(task.country)}/tasks/${task.id}`,
          });
        } catch (_) {}
      })();

      try {
        await sendNewBidEmail(
        task.requester.email,
        task.requester.full_name,
        req.user.full_name,
        task.title,
        req.body.workmanship_price,
        task.currency || 'NGN'
        );
      } catch (_) {}

      res.status(201).json({ success: true, message: 'Bid placed!', bid });
    } catch (err) {
      console.error('Bid error:', err);
      res.status(500).json({ success: false, message: 'Bid failed' });
    }
  }
);

// ─── Bids: chat, accept (assign), reject ───────────────────────────
// Requesters may talk to SEVERAL bidders before and after choosing one:
//   • POST /:id/bid/:bidId/chat   → opens a chat with that bidder, assigns nothing
//   • POST /:id/bid/:bidId/accept → assigns that tasker. Allowed to SWITCH to
//     another bidder until the task is funded. The previous tasker's bid goes
//     back to 'pending' (so the requester can switch back) and their chat stays.
//   • Once the task is funded the tasker is locked in (money is in escrow for
//     them); changing then goes through cancellation/refund.

async function loadTaskAndBid(req) {
  const { data: task, error: tErr } = await supabase
    .from('tasks')
    .select('id, requester_id, title, status, is_funded, accepted_tasker_id, accepted_bid_id')
    .eq('id', req.params.id)
    .maybeSingle();
  if (tErr) throw tErr;
  if (!task || (task.requester_id !== req.user.id && req.user.role !== 'admin'))
    return { error: { status: 403, message: 'Not authorized' } };

  const { data: bid, error: bErr } = await supabase
    .from('task_bids')
    .select('*, tasker:users!tasker_id(id, email, full_name)')
    .eq('id', req.params.bidId)
    .eq('task_id', req.params.id)          // the bid must belong to THIS task
    .maybeSingle();
  if (bErr) throw bErr;
  if (!bid) return { error: { status: 404, message: 'Bid not found' } };
  return { task, bid };
}

async function openChatRoom(taskId, requesterId, taskerId) {
  const { data: existing } = await supabase
    .from('chat_rooms').select('id')
    .eq('task_id', taskId).eq('requester_id', requesterId).eq('tasker_id', taskerId)
    .maybeSingle();
  if (existing) return { room: existing, created: false };
  const { data: room, error } = await supabase
    .from('chat_rooms')
    .insert({ task_id: taskId, requester_id: requesterId, tasker_id: taskerId })
    .select('id')
    .maybeSingle();
  if (error?.code === '23505') {
    const { data: again } = await supabase
      .from('chat_rooms').select('id')
      .eq('task_id', taskId).eq('requester_id', requesterId).eq('tasker_id', taskerId)
      .maybeSingle();
    return { room: again, created: false };
  }
  if (error) throw error;
  return { room, created: true };
}

const notify = (row) => Promise.resolve(supabase.from('notifications').insert(row)).catch(() => {});

// Tell the OTHER bidders (still-open bids) that someone else was chosen, with
// encouragement and tips. At most once per tasker per task, so switching back
// and forth never spams anyone. Runs in the background; never throws.
async function notifyNotSelectedBidders(task, chosenTaskerId) {
  try {
    const { data: others, error } = await supabase.from('task_bids')
      .select('tasker_id, tasker:users!tasker_id(email, full_name)')
      .eq('task_id', task.id)
      .eq('status', 'pending')
      .neq('tasker_id', chosenTaskerId);
    if (error || !others?.length) return;

    const { data: already } = await supabase.from('notifications')
      .select('user_id')
      .eq('type', 'bid_not_selected')
      .contains('data', { task_id: task.id })
      .in('user_id', others.map(o => o.tasker_id));
    const done = new Set((already || []).map(n => n.user_id));

    for (const o of others) {
      if (done.has(o.tasker_id)) continue;
      // Record first (this is also what prevents a second email later).
      const { error: nErr } = await supabase.from('notifications').insert({
        user_id: o.tasker_id,
        type: 'bid_not_selected',
        title: 'Another tasker was chosen — stay tuned',
        message: `The requester chose another tasker for "${task.title}". Your bid stays open — sometimes they don't agree and the requester picks someone else. Tip: pitch clearly and add a good profile photo.`,
        data: { task_id: task.id },
        action_url: '/tasker?tab=bids',
      });
      if (nErr) { console.warn('not-selected notification warn:', nErr.message); continue; }
      if (o.tasker?.email) {
        try { await sendBidNotSelectedEmail(o.tasker.email, o.tasker.full_name, task.title); }
        catch (e) { console.warn('not-selected email warn:', e?.message); }
      }
    }
  } catch (e) {
    console.warn('notifyNotSelectedBidders warn:', e?.message);
  }
}

// ─── POST /tasks/:id/bid/:bidId/chat — talk to a bidder without assigning ──
router.post('/:id/bid/:bidId/chat', authenticate, requireRole('requester', 'admin'), async (req, res) => {
  try {
    const found = await loadTaskAndBid(req);
    if (found.error) return res.status(found.error.status).json({ success: false, message: found.error.message });
    const { task, bid } = found;
    if (['completed', 'cancelled'].includes(task.status))
      return res.status(400).json({ success: false, message: `This task is ${task.status}.` });
    if (bid.status === 'rejected')
      return res.status(400).json({ success: false, message: 'You declined this bid. It can no longer be opened.' });

    const { room, created } = await openChatRoom(task.id, task.requester_id, bid.tasker_id);
    if (created) {
      logActivity(task.id, {
        actor: req.user, role: 'requester', event: 'chat_opened',
        summary: `Requester opened a chat with bidder ${bid.tasker?.full_name || ''}`.trim(),
        details: { tasker_id: bid.tasker_id, chat_room_id: room?.id },
      });
      notify({
        user_id: bid.tasker_id,
        type: 'bid_chat_opened',
        title: 'The requester wants to chat',
        message: `The requester opened a chat about your bid on "${task.title}". Reply to discuss the details.`,
        data: { task_id: task.id, chat_room_id: room?.id },
        action_url: '/tasker?tab=chat',
      });
    }
    res.json({ success: true, chat_room_id: room?.id, message: created ? `Chat opened with ${bid.tasker?.full_name || 'the tasker'}.` : 'Chat is already open.' });
  } catch (err) {
    console.error('Open bid chat error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not open the chat. Please try again.' });
  }
});

// ─── POST /tasks/:id/bid/:bidId/accept — assign (or switch to) this tasker ──
router.post('/:id/bid/:bidId/accept', authenticate, requireRole('requester', 'admin'), requireNoPendingReviews, async (req, res) => {
  try {
    const found = await loadTaskAndBid(req);
    if (found.error) return res.status(found.error.status).json({ success: false, message: found.error.message });
    const { task, bid } = found;

    if (['completed', 'cancelled', 'disputed'].includes(task.status))
      return res.status(400).json({ success: false, message: `This task is ${task.status}, so a tasker can no longer be chosen.` });
    if (bid.status === 'rejected')
      return res.status(400).json({ success: false, message: 'You declined this bid earlier, so it cannot be accepted.' });

    // Already the chosen tasker → idempotent success (double click).
    if (task.accepted_tasker_id === bid.tasker_id && task.status === 'ongoing') {
      const { room } = await openChatRoom(task.id, task.requester_id, bid.tasker_id);
      return res.json({ success: true, already: true, chat_room_id: room?.id, message: `${bid.tasker?.full_name || 'This tasker'} is already your chosen tasker.` });
    }

    // Money already in escrow for the current tasker → no switching.
    if (task.is_funded)
      return res.status(400).json({ success: false, message: 'You have already paid for this task, so the tasker can no longer be changed. To change tasker, request a cancellation from the task page.' });

    const previousTaskerId = task.accepted_tasker_id;
    const previousBidId = task.accepted_bid_id;

    // Conditional update: only succeeds if nobody changed the assignment or
    // funded the task since we read it (prevents two taskers ending up assigned).
    let q = supabase.from('tasks')
      .update({ status: 'ongoing', accepted_tasker_id: bid.tasker_id, accepted_bid_id: bid.id })
      .eq('id', task.id)
      .eq('is_funded', false);
    q = previousTaskerId ? q.eq('accepted_tasker_id', previousTaskerId) : q.is('accepted_tasker_id', null);
    const { data: moved, error: moveErr } = await q.select('id');
    if (moveErr) throw moveErr;
    if (!moved?.length) {
      // is_funded may be NULL on older rows — retry treating NULL as unfunded.
      let q2 = supabase.from('tasks')
        .update({ status: 'ongoing', accepted_tasker_id: bid.tasker_id, accepted_bid_id: bid.id })
        .eq('id', task.id)
        .is('is_funded', null);
      q2 = previousTaskerId ? q2.eq('accepted_tasker_id', previousTaskerId) : q2.is('accepted_tasker_id', null);
      const { data: moved2, error: moveErr2 } = await q2.select('id');
      if (moveErr2) throw moveErr2;
      if (!moved2?.length)
        return res.status(409).json({ success: false, message: 'This task changed a moment ago (it may have been funded or reassigned). Please refresh and try again.' });
    }

    await supabase.from('task_bids').update({ status: 'accepted' }).eq('id', bid.id);
    // The previously chosen tasker's bid goes back to pending (switch back possible).
    if (previousTaskerId && previousTaskerId !== bid.tasker_id) {
      if (previousBidId) await supabase.from('task_bids').update({ status: 'pending' }).eq('id', previousBidId).eq('status', 'accepted');
      else await supabase.from('task_bids').update({ status: 'pending' }).eq('task_id', task.id).eq('tasker_id', previousTaskerId).eq('status', 'accepted');
      notify({
        user_id: previousTaskerId,
        type: 'bid_switched',
        title: 'Requester chose another tasker',
        message: `The requester has chosen another tasker for "${task.title}" for now. Your bid stays open and your chat remains available.`,
        data: { task_id: task.id },
        action_url: '/tasker?tab=bids',
      });
    }

    const { room } = await openChatRoom(task.id, task.requester_id, bid.tasker_id);

    notify({
      user_id: bid.tasker_id,
      type: 'bid_accepted',
      title: 'Bid Accepted',
      message: `Your bid for "${task.title}" was accepted! Chat with the requester to agree the details.`,
      data: { task_id: task.id, chat_room_id: room?.id },
      action_url: '/tasker?tab=my-tasks',
    });
    try { await sendBidAcceptedEmail(bid.tasker.email, bid.tasker.full_name, task.title); } catch (_) {}
    notifyNotSelectedBidders(task, bid.tasker_id); // background — does not delay the response
    const switched = !!(previousTaskerId && previousTaskerId !== bid.tasker_id);
    logActivity(task.id, {
      actor: req.user, role: 'requester',
      event: switched ? 'tasker_switched' : 'tasker_chosen',
      summary: switched
        ? `Requester switched to ${bid.tasker?.full_name || 'another tasker'} (${money(bid.workmanship_price, await taskCurrencyOf(task.id))} bid)`
        : `Requester chose ${bid.tasker?.full_name || 'a tasker'} (${money(bid.workmanship_price, await taskCurrencyOf(task.id))} bid)`,
      details: { tasker_id: bid.tasker_id, bid_id: bid.id, previous_tasker_id: previousTaskerId || null },
    });

    res.json({
      success: true,
      switched: !!(previousTaskerId && previousTaskerId !== bid.tasker_id),
      chat_room_id: room?.id,
      message: previousTaskerId && previousTaskerId !== bid.tasker_id
        ? `You switched to ${bid.tasker?.full_name || 'this tasker'}. You can still chat with the previous tasker.`
        : `${bid.tasker?.full_name || 'Tasker'} accepted! A chat has been opened.`,
    });
  } catch (err) {
    console.error('Accept bid error:', err);
    res.status(500).json({ success: false, message: 'Failed to accept bid' });
  }
});

// ─── POST /tasks/:id/bid/:bidId/reject ────────────────────────────
router.post('/:id/bid/:bidId/reject', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const found = await loadTaskAndBid(req);
    if (found.error) return res.status(found.error.status).json({ success: false, message: found.error.message });
    const { task, bid } = found;
    if (bid.status === 'rejected') return res.json({ success: true, already: true, message: 'Bid declined' });

    const isChosen = task.accepted_tasker_id === bid.tasker_id;
    if (isChosen) {
      if (task.is_funded)
        return res.status(400).json({ success: false, message: 'You have already paid this tasker. To change tasker, request a cancellation from the task page.' });
      if (['completed', 'cancelled'].includes(task.status))
        return res.status(400).json({ success: false, message: `This task is ${task.status}.` });
      // Un-assign; the task goes back to receiving bids.
      const { count: otherBids } = await supabase.from('task_bids')
        .select('id', { count: 'exact', head: true })
        .eq('task_id', task.id).eq('status', 'pending').neq('id', bid.id);
      const unassign = (applyFundedFilter) => applyFundedFilter(
        supabase.from('tasks')
          .update({ status: otherBids > 0 ? 'bidding' : 'open', accepted_tasker_id: null, accepted_bid_id: null })
          .eq('id', task.id).eq('accepted_tasker_id', bid.tasker_id)
      ).select('id');
      // Only while unfunded (is_funded false, or NULL on older rows).
      let { data: freed, error: freeErr } = await unassign(q => q.eq('is_funded', false));
      if (freeErr) throw freeErr;
      if (!freed?.length) {
        ({ data: freed, error: freeErr } = await unassign(q => q.is('is_funded', null)));
        if (freeErr) throw freeErr;
      }
      if (!freed?.length)
        return res.status(409).json({ success: false, message: 'This task changed a moment ago. Please refresh and try again.' });
    }

    await supabase.from('task_bids').update({ status: 'rejected' }).eq('id', bid.id);

    notify({
      user_id: bid.tasker_id,
      type: 'bid_rejected',
      title: 'Bid Update',
      message: `Your bid for "${task.title}" was not selected.`,
      data: { task_id: task.id },
    });
    try { await sendBidRejectedEmail(bid.tasker.email, bid.tasker.full_name, task.title); } catch (_) {}

    logActivity(task.id, {
      actor: req.user, role: 'requester',
      event: isChosen ? 'tasker_removed' : 'bid_declined',
      summary: isChosen
        ? `Requester removed the chosen tasker ${bid.tasker?.full_name || ''} — task reopened for bids`.replace('  ', ' ')
        : `Requester declined ${bid.tasker?.full_name || 'a tasker'}'s bid`,
      details: { tasker_id: bid.tasker_id, bid_id: bid.id },
    });

    res.json({ success: true, unassigned: isChosen, message: isChosen ? 'Tasker removed. Your task is open for bids again.' : 'Bid declined' });
  } catch (err) {
    console.error('Reject bid error:', err?.message);
    res.status(500).json({ success: false, message: 'Failed to reject bid' });
  }
});

// ─── Proof of work (step 1 of the tasker's completion flow) ─────────
// Any file type except programs/scripts (they could harm whoever opens them).
const BLOCKED_EXT = /\.(exe|msi|bat|cmd|com|scr|ps1|vbs|js|jar|sh|apk|app|dll|reg|lnk|hta|cpl|msc|pif)$/i;
const MAX_PROOFS_PER_TASK = 30;

async function loadTaskForProofs(req) {
  const { data: task, error } = await supabase.from('tasks')
    .select('id, title, status, requester_id, accepted_tasker_id')
    .eq('id', req.params.id).maybeSingle();
  if (error) throw error;
  return task;
}

router.get('/:id/proofs', authenticate, async (req, res) => {
  try {
    const task = await loadTaskForProofs(req);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const allowed = req.user.role === 'admin' || task.requester_id === req.user.id || task.accepted_tasker_id === req.user.id;
    if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized' });
    const { data, error } = await supabase.from('task_proofs')
      .select('id, url, file_name, mime_type, size_bytes, resource_type, tasker_id, created_at')
      .eq('task_id', task.id).order('created_at', { ascending: true });
    if (error) {
      if (/task_proofs/i.test(error.message || '')) return res.json({ success: true, proofs: [] });
      throw error;
    }
    res.json({ success: true, proofs: data || [] });
  } catch (err) {
    console.error('List proofs error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load proofs.' });
  }
});

router.post('/:id/proofs', authenticate, (req, res, next) => {
  uploadAnyFile.array('files', 10)(req, res, (err) => {
    if (!err) return next();
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Each file must be 25 MB or smaller.'
      : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'You can upload up to 10 files at a time.'
      : 'Upload failed. Please try again.';
    res.status(400).json({ success: false, message: msg });
  });
}, async (req, res) => {
  try {
    const task = await loadTaskForProofs(req);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.accepted_tasker_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Only the tasker doing this task can upload proof of work.' });
    if (task.status !== 'ongoing')
      return res.status(400).json({ success: false, message: `This task is ${task.status}. Proofs can only be added while it is ongoing.` });

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ success: false, message: 'Choose at least one file to upload.' });
    const bad = files.find(f => BLOCKED_EXT.test(f.originalname || ''));
    if (bad) return res.status(400).json({ success: false, message: `"${bad.originalname}" can't be uploaded — programs and scripts are not allowed. Use photos, videos, PDFs or documents.` });
    const empty = files.find(f => !f.size);
    if (empty) return res.status(400).json({ success: false, message: `"${empty.originalname}" is empty.` });

    const { count: existing, error: cErr } = await supabase.from('task_proofs')
      .select('id', { count: 'exact', head: true }).eq('task_id', task.id);
    if (cErr) {
      if (/task_proofs/i.test(cErr.message || '')) return res.status(503).json({ success: false, message: 'Proof uploads are not set up yet (run TASK_WORKSPACE_MIGRATION.sql).' });
      throw cErr;
    }
    if ((existing || 0) + files.length > MAX_PROOFS_PER_TASK)
      return res.status(400).json({ success: false, message: `A task can have at most ${MAX_PROOFS_PER_TASK} proof files. You can add ${Math.max(0, MAX_PROOFS_PER_TASK - (existing || 0))} more.` });

    const saved = [];
    for (const f of files) {
      let up;
      try {
        up = await uploadAnyFileBuffer(f.buffer, { folder: `taskeeu/proofs/${task.id}`, filename: f.originalname, mimetype: f.mimetype });
      } catch (e) {
        console.error('Proof upload error:', e?.message);
        return res.status(502).json({ success: false, saved, message: `Could not upload "${f.originalname}". ${saved.length ? `${saved.length} file(s) were saved. ` : ''}Please try again.` });
      }
      const { data: row, error: insErr } = await supabase.from('task_proofs').insert({
        task_id: task.id,
        tasker_id: req.user.id,
        url: up.secure_url || up.url,
        file_name: String(f.originalname || 'file').slice(0, 200),
        mime_type: f.mimetype || null,
        size_bytes: f.size || null,
        public_id: up.public_id || null,
        resource_type: up.resource_type || null,
      }).select('id, url, file_name, mime_type, size_bytes, resource_type, created_at').maybeSingle();
      if (insErr) throw insErr;
      saved.push(row);
    }

    notify({
      user_id: task.requester_id,
      type: 'proof_uploaded',
      title: 'Proof of work uploaded',
      message: `Your tasker uploaded ${saved.length} proof file${saved.length === 1 ? '' : 's'} for "${task.title}". Open the task to see them.`,
      data: { task_id: task.id },
      action_url: `/requester?tab=tasks&task=${task.id}`,
    });

    res.status(201).json({ success: true, proofs: saved, message: `${saved.length} proof file${saved.length === 1 ? '' : 's'} saved.` });
  } catch (err) {
    console.error('Save proofs error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not save your proofs. Please try again.' });
  }
});

router.delete('/:id/proofs/:proofId', authenticate, async (req, res) => {
  try {
    const task = await loadTaskForProofs(req);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.accepted_tasker_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (task.status !== 'ongoing')
      return res.status(400).json({ success: false, message: 'Proofs can no longer be changed.' });
    const { data: gone, error } = await supabase.from('task_proofs')
      .delete().eq('id', req.params.proofId).eq('task_id', task.id).eq('tasker_id', req.user.id)
      .select('public_id, resource_type');
    if (error) throw error;
    if (!gone?.length) return res.json({ success: true, already: true });
    if (gone[0].public_id) Promise.resolve(deleteFile(gone[0].public_id, gone[0].resource_type)).catch(() => {});
    res.json({ success: true, message: 'Proof removed.' });
  } catch (err) {
    console.error('Delete proof error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not remove the proof.' });
  }
});

// ─── POST /tasks/:id/generate-code — requester generates completion code ──
router.post('/:id/generate-code', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('requester_id, accepted_tasker_id, status, title, completion_code')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!task || task.requester_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (task.status !== 'ongoing')
      return res.status(400).json({ success: false, message: 'Task must be ongoing' });

    // The requester must first rate & review the tasker and rate Taskeeu.
    const { data: myReview, error: rvErr } = await supabase.from('ratings').select('id')
      .eq('task_id', req.params.id).eq('rater_id', req.user.id).limit(1);
    if (rvErr) throw rvErr;
    if (!myReview?.length)
      return res.status(400).json({ success: false, code: 'REQUESTER_REVIEW_REQUIRED', message: 'Rate and review your tasker and Taskeeu first — then your completion code will appear.' });

    // Reuse the existing code. Generating a new one on every click silently
    // invalidated the code the requester had already given the tasker.
    let code = task.completion_code ? String(task.completion_code) : null;
    if (!code) {
      const fresh = Math.floor(100000 + Math.random() * 900000).toString();
      // Conditional: if two clicks race, only the first code is stored.
      const { data: setRows, error: setErr } = await supabase.from('tasks')
        .update({ completion_code: fresh })
        .eq('id', req.params.id)
        .is('completion_code', null)
        .select('completion_code');
      if (setErr) throw setErr;
      if (setRows?.length) {
        code = fresh;
        await supabase.from('task_completion_codes').insert({ task_id: req.params.id, code });
      } else {
        const { data: again } = await supabase.from('tasks').select('completion_code').eq('id', req.params.id).maybeSingle();
        code = String(again?.completion_code || '');
      }
    }
    if (!code) return res.status(500).json({ success: false, message: 'Failed to generate code' });

    try {
      await sendTaskCompletionCodeEmail(req.user.email, req.user.full_name, code, task.title);
    } catch (_) {}

    res.json({ success: true, message: 'Completion code generated and sent to your email', code });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate code' });
  }
});

// ─── POST /tasks/:id/complete — tasker submits completion code ─────
router.post('/:id/complete', authenticate, requireApprovedTasker, async (req, res) => {
  try {
    const code = String(req.body.code ?? '').trim();
    if (!code) return res.status(400).json({ success: false, message: 'Completion code required' });

    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('*, requester:users!requester_id(id, email, full_name)')
      .eq('id', req.params.id)
      .maybeSingle();
    if (taskErr) throw taskErr;

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.accepted_tasker_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not your task' });
    // Already completed (double click / retry after a slow response) → success.
    if (task.status === 'completed')
      return res.json({ success: true, already: true, status: 'completed', message: 'Task is already marked as completed. Your earnings are available in Earnings.' });
    if (task.status !== 'ongoing')
      return res.status(400).json({ success: false, message: 'Task is not ongoing' });
    // 3-step completion flow: 1) proof of work  2) review  3) code.
    if ((await countProofs(task.id)) === 0)
      return res.status(400).json({ success: false, code: 'PROOF_REQUIRED', message: 'Step 1: upload at least one proof of work before entering the completion code.' });
    const { data: myReview } = await supabase.from('ratings').select('id')
      .eq('task_id', task.id).eq('rater_id', req.user.id).limit(1);
    if (!myReview?.length)
      return res.status(400).json({ success: false, code: 'TASKER_REVIEW_REQUIRED', message: 'Step 2: rate the requester and Taskeeu before entering the completion code.' });

    if (!task.completion_code || String(task.completion_code) !== code)
      return res.status(400).json({ success: false, message: 'Invalid completion code. Ask the requester to check the code.' });

    // Conditional update: only the first request completes the task, so the
    // side-effects below (stats, referral commission) can never run twice.
    const completeTask = (fields) => supabase
      .from('tasks')
      .update(fields)
      .eq('id', req.params.id)
      .eq('status', 'ongoing')
      .select('id');
    const completedAt = new Date().toISOString();
    let { data: completedRows, error: completeErr } =
      await completeTask({ status: 'completed', completed_at: completedAt, review_required: true });
    // If REVIEWS_MIGRATION.sql has not been run yet, the column is missing —
    // still complete the task (reviews just won't be compulsory for it).
    if (completeErr && /review_required/i.test(completeErr.message || '')) {
      console.warn('[tasks] review_required column missing — run database/REVIEWS_MIGRATION.sql');
      ({ data: completedRows, error: completeErr } = await completeTask({ status: 'completed', completed_at: completedAt }));
    }
    if (completeErr) throw completeErr;
    if (!completedRows?.length)
      return res.json({ success: true, already: true, status: 'completed', message: 'Task is already marked as completed. Your earnings are available in Earnings.' });

    await supabase
      .from('task_completion_codes')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('task_id', req.params.id);

    // Update tasker stats. (Previously this wrote a query object into the
    // column via a non-existent RPC, so the count never updated.) Recount from
    // source so it is always correct and safe to repeat.
    try {
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('accepted_tasker_id', req.user.id)
        .eq('status', 'completed');
      if (typeof count === 'number') {
        await supabase.from('tasker_profiles')
          .update({ total_tasks_completed: count })
          .eq('user_id', req.user.id);
      }
    } catch (statErr) {
      console.warn('Tasker stats update warn:', statErr?.message);
    }

    // Both sides must now review each other (compulsory). The dashboards open
    // the review form automatically; these notifications point there.
    Promise.resolve(supabase.from('notifications').insert([
      {
        user_id: task.requester_id,
        type: 'review_requested',
        title: 'Task completed — please review your tasker',
        message: `Your task "${task.title}" is complete. Rate your tasker and leave a short comment.`,
        data: { task_id: task.id },
        action_url: '/requester',
      },
      {
        user_id: task.accepted_tasker_id,
        type: 'review_requested',
        title: 'Task completed — please review your requester',
        message: `You completed "${task.title}". Rate your requester and leave a short comment.`,
        data: { task_id: task.id },
        action_url: '/tasker',
      },
    ])).catch(() => {});

    // ── Referral commission ────────────────────────────────────────
    // If the requester who posted this task was referred by someone, credit
    // that referrer 10% of the workmanship value now that the task is
    // successfully complete. Best-effort; never blocks completion.
    creditReferralCommission(task).catch(e => console.warn('referral commission warn:', e?.message));

    res.json({ success: true, status: 'completed', message: 'Task completed! Your remaining balance is now available to withdraw in Earnings.' });
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ success: false, message: 'Task completion failed' });
  }
});

// ─── POST /tasks/:id/rate — requester rates tasker ────────────────
// Kept for older clients; same rules as POST /reviews (both roles).
router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { status, body } = await submitReview({ taskId: req.params.id, user: req.user, body: req.body });
    res.status(status).json(body);
  } catch (err) {
    console.error('Rate task error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not submit your review. Please try again.' });
  }
});

// ─── POST /tasks/:id/cancel-request — requester requests cancel on ongoing task ─
router.post('/:id/cancel-request', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 10)
      return res.status(400).json({ success: false, message: 'Please provide a reason (at least 10 characters)' });

    const { data: task } = await supabase
      .from('tasks')
      .select('requester_id, accepted_tasker_id, status, title, deadline, accepted_tasker:users!accepted_tasker_id(email, full_name)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (task.status !== 'ongoing') return res.status(400).json({ success: false, message: 'Only ongoing tasks can be cancelled' });

    // Check no existing pending cancel request
    const { data: existing } = await supabase
      .from('cancel_requests')
      .select('id')
      .eq('task_id', req.params.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) return res.status(409).json({ success: false, message: 'A cancellation request is already pending for this task' });

    const { data: cancelReq, error } = await supabase
      .from('cancel_requests')
      .insert({
        task_id: req.params.id,
        requester_id: req.user.id,
        tasker_id: task.accepted_tasker_id,
        reason: reason.trim(),
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    // Notify tasker
    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: task.accepted_tasker_id,
        type: 'cancel_request',
        title: 'Task Cancellation Requested',
        message: `${req.user.full_name} has requested to cancel "${task.title}". Please respond.`,
        data: { cancel_request_id: cancelReq.id, task_id: req.params.id },
        action_url: '/tasker',
        });
      } catch (_) {}
    })();

    sendCancelRequestEmail(
      task.accepted_tasker.email,
      task.accepted_tasker.full_name,
      req.user.full_name,
      task.title,
      reason.trim()
    ).catch(() => {});

    res.status(201).json({ success: true, message: 'Cancellation request sent to tasker. They must approve before the task is cancelled.', cancel_request: cancelReq });
  } catch (err) {
    console.error('Cancel request error:', err);
    res.status(500).json({ success: false, message: 'Could not submit cancellation request' });
  }
});

// ─── POST /tasks/:id/cancel-response — tasker approves or denies cancel ─
router.post('/:id/cancel-response', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { decision, response_note } = req.body; // decision: 'approve' | 'deny'
    if (!['approve', 'deny'].includes(decision))
      return res.status(400).json({ success: false, message: 'Decision must be approve or deny' });

    const { data: task } = await supabase
      .from('tasks')
      .select('accepted_tasker_id, requester_id, title, requester:users!requester_id(email, full_name)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!task || task.accepted_tasker_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const { data: cancelReq } = await supabase
      .from('cancel_requests')
      .select('*')
      .eq('task_id', req.params.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (!cancelReq) {
      // Already answered (double click / retry) → report the recorded outcome.
      const { data: lastReq } = await supabase
        .from('cancel_requests').select('status')
        .eq('task_id', req.params.id).in('status', ['approved', 'denied'])
        .order('responded_at', { ascending: false }).limit(1);
      const done = lastReq?.[0]?.status;
      if (done && ((done === 'approved') === (decision === 'approve')))
        return res.json({ success: true, already: true, message: done === 'approved' ? 'Task cancelled. Refund initiated.' : 'Cancellation denied. Task continues.' });
      return res.status(404).json({ success: false, message: 'No pending cancellation request found' });
    }

    // Conditional update — only one response can be recorded, so the refund
    // below can never be created twice.
    const { data: answered, error: answerErr } = await supabase
      .from('cancel_requests')
      .update({ status: decision === 'approve' ? 'approved' : 'denied', tasker_response: response_note || null, responded_at: new Date().toISOString() })
      .eq('id', cancelReq.id)
      .eq('status', 'pending')
      .select('id');
    if (answerErr) throw answerErr;
    if (!answered?.length)
      return res.json({ success: true, already: true, message: decision === 'approve' ? 'Task cancelled. Refund initiated.' : 'Cancellation denied. Task continues.' });

    if (decision === 'approve') {
      // Cancel the task
      await supabase.from('tasks').update({ status: 'cancelled' }).eq('id', req.params.id);

      // Auto-refund any completed payment for this task
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, requester_id, tasker_id')
        .eq('task_id', req.params.id)
        .eq('status', 'completed');

      // Advances already sent to the tasker's bank left escrow — they cannot be
      // refunded from it. Refund = paid in − advances paid out.
      const { data: paidAdvances } = await supabase
        .from('advance_requests')
        .select('approved_amount')
        .eq('task_id', req.params.id)
        .eq('status', 'withdrawn');
      const advancePaidOut = (paidAdvances || []).reduce((s, a) => s + Number(a.approved_amount || 0), 0);

      if (payments?.length > 0) {
        const totalRefund = Math.max(0, Math.round((payments.reduce((s, p) => s + Number(p.amount), 0) - advancePaidOut) * 100) / 100);
        // Insert refund record — will be processed by admin or auto payout
        if (totalRefund > 0) await supabase.from('refund_requests').insert({
          task_id: req.params.id,
          requester_id: task.requester_id,
          tasker_id: req.user.id,
          amount: totalRefund,
          reason: `Tasker approved cancellation.${advancePaidOut > 0 ? ` Advance of ${money(advancePaidOut, await taskCurrencyOf(req.params.id))} already paid to tasker was deducted.` : ''} Original reason: ${cancelReq.reason}`,
          status: 'approved',
          tasker_response: 'Approved by tasker',
          processed_at: new Date().toISOString(),
        });
      }

      logActivity(req.params.id, {
        actor: req.user, role: 'tasker', event: 'task_cancelled',
        summary: `Tasker agreed to cancel the task${advancePaidOut > 0 ? ` (refund reduced by ${money(advancePaidOut, await taskCurrencyOf(req.params.id))} advance already paid)` : ''}`,
        details: { cancel_request_id: cancelReq.id, advance_paid_out: advancePaidOut },
      });
      notifyBiddersOfCancellation(req.params.id, task.title, req.user.id); // other bidders (background)

      // Notify requester
      (async () => {
        try {
          await supabase.from('notifications').insert({
          user_id: task.requester_id,
          type: 'cancel_approved',
          title: 'Task Cancellation Approved',
          message: `Your cancellation request for "${task.title}" was approved. ${payments?.length > 0 ? 'A refund has been initiated.' : ''}`,
          data: { task_id: req.params.id },
          action_url: '/requester',
          });
        } catch (_) {}
      })();
    } else {
      // Notify requester of denial
      (async () => {
        try {
          await supabase.from('notifications').insert({
          user_id: task.requester_id,
          type: 'cancel_denied',
          title: 'Cancellation Request Denied',
          message: `The tasker declined your cancellation for "${task.title}".${response_note ? ` Note: ${response_note}` : ''} The task remains ongoing.`,
          data: { task_id: req.params.id },
          action_url: '/requester',
          });
        } catch (_) {}
      })();
    }

    res.json({ success: true, message: decision === 'approve' ? 'Task cancelled. Refund initiated.' : 'Cancellation denied. Task continues.' });
  } catch (err) {
    console.error('Cancel response error:', err);
    res.status(500).json({ success: false, message: 'Could not process response' });
  }
});

// ─── POST /tasks/direct-hire — create task & immediately assign tasker ──
// Creates a real task, inserts an accepted bid, sets task to 'ongoing',
// opens a chat room, and notifies the tasker — all in one call.
router.post(
  '/direct-hire',
  authenticate,
  requireRole('requester'),
  requireNoPendingReviews,
  async (req, res) => {
    try {
      const {
        tasker_id,
        title,
        description,
        task_city,
        task_state,
        deadline,
        budget,
      } = req.body;

      if (!tasker_id || !title || !description || !task_city || !task_state || !deadline) {
        return res.status(400).json({
          success: false,
          message: 'tasker_id, title, description, task_city, task_state, and deadline are required',
        });
      }

      // Verify tasker exists and is approved
      const { data: tasker } = await supabase
        .from('tasker_profiles')
        .select('verification_status, user_id, user:users!user_id(email, full_name)')
        .eq('user_id', tasker_id)
        .maybeSingle();

      if (!tasker || tasker.verification_status !== 'approved') {
        return res.status(404).json({ success: false, message: 'Tasker not available' });
      }

      const budgetNum = budget ? parseFloat(budget) : null;

      // 1. Create the task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          requester_id: req.user.id,
          title: title.trim(),
          description: description.trim(),
          task_type: 'general',
          task_city: task_city.trim(),
          task_state: task_state.trim(),
          deadline,
          budget_min: budgetNum,
          budget_max: budgetNum,
          status: 'open',
          tags: [],
        })
        .select()
        .maybeSingle();

      if (taskError) throw taskError;

      // 2. Insert an accepted bid from the tasker
      const { data: bid, error: bidError } = await supabase
        .from('task_bids')
        .insert({
          task_id: task.id,
          tasker_id,
          workmanship_price: budgetNum || 0,
          message: `Direct hire by ${req.user.full_name || 'requester'}`,
          status: 'accepted',
        })
        .select()
        .maybeSingle();

      if (bidError) throw bidError;

      // 3. Update task to ongoing with accepted tasker
      await supabase
        .from('tasks')
        .update({
          status: 'ongoing',
          accepted_tasker_id: tasker_id,
          accepted_bid_id: bid.id,
        })
        .eq('id', task.id);

      // 4. Create chat room (handle duplicate key gracefully)
      let chatRoom = null;
      const { data: newRoom, error: roomErr } = await supabase
        .from('chat_rooms')
        .insert({
          task_id: task.id,
          requester_id: req.user.id,
          tasker_id,
        })
        .select()
        .maybeSingle();

      if (roomErr && roomErr.code === '23505') {
        const { data: existingRoom } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('task_id', task.id)
          .eq('requester_id', req.user.id)
          .eq('tasker_id', tasker_id)
          .maybeSingle();
        chatRoom = existingRoom;
      } else {
        chatRoom = newRoom;
      }

      // 5. Update tasker stats
      try {
        await supabase.rpc('increment_requester_tasks', { uid: req.user.id });
      } catch (_) {}

      // 6. Notify tasker — fire and forget
      (async () => {
        try {
          await supabase.from('notifications').insert({
            user_id: tasker_id,
            type: 'direct_hire',
            title: 'You Were Directly Hired!',
            message: `${req.user.full_name || 'A requester'} hired you directly for "${task.title}"`,
            data: { task_id: task.id, chat_room_id: chatRoom?.id },
            action_url: '/tasker',
          });
        } catch (_) {}
      })();

      // 7. Send email to tasker
      try {
        await sendDirectApplicationEmail(
          tasker.user.email,
          tasker.user.full_name,
          req.user.full_name || 'A requester',
          description
        );
      } catch (_) {}

      res.status(201).json({
        success: true,
        message: 'Task created and tasker hired!',
        task_id: task.id,
        chat_room_id: chatRoom?.id,
      });
    } catch (err) {
      console.error('Direct hire error:', err?.message || err);
      res.status(500).json({
        success: false,
        message: err?.message || 'Failed to create task',
      });
    }
  }
);

// ── Referral commission crediting ──────────────────────────────────
// Called when a task is completed. If the task's requester was referred by
// someone, credit that referrer 10% of the workmanship value. The unique
// index on (task_id, referrer_id) makes this safe to call more than once.
const REFERRAL_RATE = 0.10;
async function creditReferralCommission(task) {
  if (!task?.requester_id) return;

  // Who referred this requester?
  const { data: requester } = await supabase
    .from('users').select('referred_by').eq('id', task.requester_id).maybeSingle();
  if (!requester?.referred_by) return;

  // Determine the workmanship value: prefer the accepted bid, fall back to
  // the task budget.
  let base = 0;
  if (task.accepted_bid_id) {
    const { data: bid } = await supabase
      .from('task_bids').select('workmanship_price').eq('id', task.accepted_bid_id).maybeSingle();
    base = Number(bid?.workmanship_price || 0);
  }
  if (!base) base = Number(task.budget_max || task.budget_min || 0);
  if (base <= 0) return;

  const commission = Math.round(base * REFERRAL_RATE * 100) / 100;
  if (commission <= 0) return;

  // Insert commission as 'available' (task is already complete). The unique
  // index prevents double-crediting if this runs twice.
  const { data: inserted, error } = await supabase.from('referral_commissions').insert({
    referrer_id: requester.referred_by,
    referred_user_id: task.requester_id,
    task_id: task.id,
    base_amount: base,
    commission_amount: commission,
    status: 'available',
  }).select('id').maybeSingle();
  // A duplicate-key error just means we already credited this task — ignore.
  if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
  if (error) return; // duplicate — already credited & ledgered, nothing more to do

  // Append immutable ledger entries: credited + immediately available
  // (commission is only created once the task is complete).
  try {
    await supabase.from('referral_ledger').insert([
      { commission_id: inserted?.id, referrer_id: requester.referred_by, referred_user_id: task.requester_id, task_id: task.id, event: 'credited', amount: commission, note: `10% of workmanship ${base}` },
      { commission_id: inserted?.id, referrer_id: requester.referred_by, referred_user_id: task.requester_id, task_id: task.id, event: 'available', amount: commission, note: 'Task completed — commission available' },
    ]);
  } catch (_) {}

  // Notify the referrer
  try {
    await supabase.from('notifications').insert({
      user_id: requester.referred_by,
      type: 'referral_commission',
      title: 'You earned a referral commission!',
      message: `You earned ${commission.toLocaleString()} from a task completed by someone you referred.`,
      action_url: '/requester?tab=refer-wallet',
    });
  } catch (_) {}
}

// ─── POST /tasks/:id/extend-deadline — requester extends a task deadline ──
router.post('/:id/extend-deadline', authenticate, async (req, res) => {
  try {
    const { new_deadline } = req.body;
    if (!new_deadline) return res.status(400).json({ success: false, message: 'New deadline is required' });

    const newDate = new Date(new_deadline);
    if (isNaN(newDate.getTime()) || newDate <= new Date())
      return res.status(400).json({ success: false, message: 'New deadline must be a valid future date' });

    const { data: task } = await supabase
      .from('tasks')
      .select('requester_id, accepted_tasker_id, status, title, accepted_tasker:users!accepted_tasker_id(email, full_name)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ success: false, message: 'Only the requester can extend the deadline' });
    if (!['open', 'bidding', 'ongoing'].includes(task.status))
      return res.status(400).json({ success: false, message: 'Cannot extend deadline on this task status' });

    await supabase.from('tasks').update({ deadline: newDate.toISOString() }).eq('id', req.params.id);
    logActivity(req.params.id, {
      actor: req.user, role: 'requester', event: 'deadline_extended',
      summary: `Deadline extended to ${newDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      details: { new_deadline: newDate.toISOString() },
    });

    // Notify the tasker if there is one
    if (task.accepted_tasker_id) {
      await Promise.resolve(supabase.from('notifications').insert({
        user_id: task.accepted_tasker_id,
        type: 'deadline_extended',
        title: 'Task deadline extended',
        message: `The requester extended the deadline for "${task.title}". New deadline: ${newDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
        action_url: '/tasker?tab=earnings',
      })).catch(() => {});
    }

    res.json({ success: true, message: 'Deadline extended successfully', new_deadline: newDate.toISOString() });
  } catch (err) {
    console.error('Extend deadline error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not extend deadline' });
  }
});

// ─── Expiry cron — runs every 30 minutes ─────────────────────────────────
// Finds tasks whose deadline just passed and:
//   • Removes open/bidding tasks from the active pool (sets status='expired')
//   • For ongoing tasks: emails the requester to extend, emails the tasker that
//     they are behind schedule, and sends an in-app notification to both.
async function runExpiryCron() {
  try {
    const now = new Date().toISOString();

    // 1. Expire open/bidding tasks past their deadline (not yet worked on).
    const { data: stale } = await supabase
      .from('tasks')
      .update({ status: 'expired' })
      .lt('deadline', now)
      .in('status', ['open', 'bidding'])
      .select('id, title, requester_id, requester:users!requester_id(email, full_name)');

    // 2. Find ongoing tasks past their deadline that have NOT yet been warned.
    // We use a simple flag column — if it doesn't exist yet, this will catch an
    // error and we fall through gracefully.
    const { data: overdue } = await supabase
      .from('tasks')
      .select('id, title, requester_id, accepted_tasker_id, deadline, requester:users!requester_id(email, full_name), accepted_tasker:users!accepted_tasker_id(email, full_name)')
      .lt('deadline', now)
      .eq('status', 'ongoing')
      .is('expiry_warned_at', null);

    if (!overdue?.length) return;

    const { sendEmail, buildEmail } = require('../utils/email');
    const FRONTEND = process.env.FRONTEND_URL || 'https://taskeeu.com';

    for (const task of overdue) {
      const deadlineStr = new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      // Email requester
      if (task.requester?.email) {
        const subject = `Your task "${task.title}" has passed its deadline`;
        const html = buildEmail(task.requester.full_name?.split(' ')[0] || 'there',
          `<p>Your task <strong>${task.title}</strong> passed its deadline on ${deadlineStr}. The tasker is still working on it.</p>
          <p>If you would like to give them more time, you can extend the deadline from your dashboard:</p>
          <a href="${FRONTEND}/requester?tab=tasks&extend=${task.id}" style="display:inline-block;background:#ff2d62;color:#fff;border-radius:10px;padding:12px 24px;font-weight:700;text-decoration:none;margin-top:8px">Extend deadline</a>
          <p style="margin-top:16px;font-size:13px;color:#888;">If the task is no longer needed, you can cancel it from your dashboard.</p>`
        );
        sendEmail({ to: task.requester.email, subject, html }).catch(() => {});
      }

      // Email tasker
      if (task.accepted_tasker?.email) {
        const subject = `Heads up: "${task.title}" is past its deadline`;
        const html = buildEmail(task.accepted_tasker.full_name?.split(' ')[0] || 'there',
          `<p>The task <strong>${task.title}</strong> passed its original deadline of ${deadlineStr}. The requester has been notified.</p>
          <p>If you need more time, <strong>chat the requester from your dashboard</strong> and ask them to extend the deadline. Do not go silent — keep the requester updated.</p>
          <a href="${FRONTEND}/tasker?tab=chat" style="display:inline-block;background:#ff2d62;color:#fff;border-radius:10px;padding:12px 24px;font-weight:700;text-decoration:none;margin-top:8px">Chat requester</a>`
        );
        sendEmail({ to: task.accepted_tasker.email, subject, html }).catch(() => {});
      }

      // In-app notifications
      const notifs = [];
      if (task.requester_id) notifs.push({
        user_id: task.requester_id, type: 'task_overdue',
        title: 'Task is past deadline',
        message: `"${task.title}" has passed its deadline. You can extend it or cancel it from your tasks tab.`,
        action_url: `/requester?tab=tasks&extend=${task.id}`,
      });
      if (task.accepted_tasker_id) notifs.push({
        user_id: task.accepted_tasker_id, type: 'task_overdue',
        title: 'Task is past deadline',
        message: `"${task.title}" has passed its deadline. Chat the requester and ask them to extend it.`,
        action_url: '/tasker?tab=chat',
      });
      if (notifs.length) await Promise.resolve(supabase.from('notifications').insert(notifs)).catch(() => {});

      // Mark as warned so we don't send again
      await Promise.resolve(supabase.from('tasks').update({ expiry_warned_at: now }).eq('id', task.id)).catch(() => {});
    }
  } catch (err) {
    console.error('Expiry cron error:', err?.message);
  }
}

// Export so server.js can start the interval
module.exports = router;
module.exports.runExpiryCron = runExpiryCron;
