const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { notifyBiddersOfCancellation } = require('../utils/cancelNotify');
const { logActivity } = require('../utils/activity');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendTaskerApprovedEmail, sendTaskerRejectedEmail, sendKYCApprovedEmail, sendKYCRejectedEmail } = require('../utils/email');

const adminOnly = [authenticate, requireRole('admin')];

// ─── GET /admin/dashboard — stats overview ────────────────────────
router.get('/dashboard', ...adminOnly, async (req, res) => {
  try {
    // Each query is wrapped so one failure never crashes the whole dashboard
    const safe = q => Promise.resolve(q).then(r => r).catch(() => ({ data: [], error: 'skipped' }));
    const [usersRes, tasksRes, paymentsRes, pendingTaskersRes, recentTasksRes, vooomRes] = await Promise.all([
      safe(supabase.from('users').select('id, role, created_at', { count: 'exact', head: false })),
      safe(supabase.from('tasks').select('id, status', { count: 'exact', head: false })),
      safe(supabase.from('payments').select('amount, status, currency').eq('status', 'completed')),
      safe(supabase
        .from('tasker_profiles')
        .select('*, user:users!user_id(id, full_name, email, phone, avatar_url, username, created_at)')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })),
      safe(supabase
        .from('tasks')
        .select('id, title, status, task_city, task_state, created_at, requester:users!requester_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(10)),
      safe(supabase.from('vooom_tasks').select('id, status', { count: 'exact', head: false })),
    ]);

    // Taskeeu's own income (platform fees) — best-effort, never breaks the dashboard.
    let earningsTotals = null;
    try { const f = await getFinanceSummary(); if (f.ready) earningsTotals = f.totals; }
    catch (e) { console.warn('Dashboard earnings skipped:', e?.message); }

    const visibleUsers = (usersRes.data || []).filter(u => !String(u.email || '').startsWith('deleted_'));

    // Naira only; international currencies are reported separately (Revenue tab).
    const totalRevenue = (paymentsRes.data || []).filter(p => (p.currency || 'NGN') === 'NGN').reduce(
      (s, p) => s + parseFloat(p.amount || 0), 0
    );

    const tasksByStatus = (tasksRes.data || []).reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    const usersByRole = visibleUsers.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        total_users: visibleUsers.length,
        users_by_role: usersByRole,
        total_tasks: tasksRes.data?.length || 0,
        tasks_by_status: tasksByStatus,
        total_vooom_tasks: vooomRes.data?.length || 0,
        total_revenue: totalRevenue,
        pending_tasker_approvals: pendingTaskersRes.data?.length || 0,
        platform_earnings: earningsTotals,
      },
      pending_taskers: pendingTaskersRes.data || [],
      recent_tasks: recentTasksRes.data || [],
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ success: false, message: 'Dashboard fetch failed' });
  }
});

// ─── GET /admin/taskers — all tasker applications ─────────────────
router.get('/taskers', ...adminOnly, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = supabase
      .from('tasker_profiles')
      .select(`
        *,
        user:users!user_id(id, full_name, email, phone, avatar_url, username, created_at, last_seen)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Only filter by status if not 'all'
    if (status && status !== 'all') {
      q = q.eq('verification_status', status);
    }

    const { data: taskers, error, count } = await q;

    if (error) throw error;

    res.json({
      success: true,
      taskers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── GET /admin/taskers/:userId — view full tasker KYC ───────────
router.get('/taskers/:userId', ...adminOnly, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('tasker_profiles')
      .select(`
        *,
        user:users!user_id(id, full_name, email, phone, avatar_url, username, created_at, last_seen)
      `)
      .eq('user_id', req.params.userId)
      .maybeSingle();

    if (error || !profile)
      return res.status(404).json({ success: false, message: 'Tasker not found' });

    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('count')
      .eq('accepted_tasker_id', req.params.userId)
      .eq('status', 'completed');

    res.json({ success: true, profile, completed_tasks: completedTasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── POST /admin/taskers/:userId/approve ─────────────────────────
// ─── PUT /admin/taskers/:userId/fee — set or reset a tasker's platform fee ──
// Body: { fee_percent: 0–20 (e.g. 0 = tasker keeps 100%) | null (back to the
// standard 20%), note?: string }. Applies to every withdrawal the tasker makes
// from now on (including balances already waiting to be withdrawn).
router.put('/taskers/:userId/fee', ...adminOnly, async (req, res) => {
  try {
    const { normaliseFeeRate, feePercentLabel, PLATFORM_FEE_RATE } = require('../utils/escrow');
    const raw = req.body?.fee_percent;
    let rate = null;
    if (!(raw === null || raw === undefined || raw === '' || raw === 'default')) {
      const pct = Number(raw);
      if (!Number.isFinite(pct) || pct < 0 || pct > PLATFORM_FEE_RATE * 100)
        return res.status(400).json({ success: false, message: `Fee must be between 0% and ${PLATFORM_FEE_RATE * 100}%.` });
      if (Math.abs(Math.round(pct * 100) - pct * 100) > 1e-6)
        return res.status(400).json({ success: false, message: 'Use at most 2 decimal places (e.g. 12.5).' });
      rate = Math.round(pct * 100) / 10000; // 12.5 → 0.125, 0.07 → 0.0007
    }
    const note = String(req.body?.note ?? '').trim().slice(0, 500) || null;

    const { data: profile, error: pErr } = await supabase.from('tasker_profiles')
      .select('user_id, platform_fee_rate, user:users!user_id(full_name)')
      .eq('user_id', req.params.userId).maybeSingle();
    if (pErr) {
      if (/platform_fee_rate/i.test(pErr.message || ''))
        return res.status(503).json({ success: false, message: 'Run database/TASKER_FEE_OVERRIDE_MIGRATION.sql first.' });
      throw pErr;
    }
    if (!profile) return res.status(404).json({ success: false, message: 'Tasker not found' });

    const before = profile.platform_fee_rate === null || profile.platform_fee_rate === undefined ? null : Number(profile.platform_fee_rate);
    const { data: updated, error } = await supabase.from('tasker_profiles')
      .update({ platform_fee_rate: rate, platform_fee_note: note, platform_fee_updated_at: new Date().toISOString(), platform_fee_updated_by: req.user.id })
      .eq('user_id', req.params.userId)
      .select('user_id, platform_fee_rate, platform_fee_note, platform_fee_updated_at')
      .maybeSingle();
    if (error) throw error;

    const effective = normaliseFeeRate(rate);
    const label = feePercentLabel(effective);

    Promise.resolve(supabase.from('admin_audit_log').insert({
      admin_id: req.user.id, action: 'set_tasker_fee', target_type: 'user', target_id: req.params.userId,
      details: { from: before, to: rate, note },
    })).catch(() => {});

    const changed = (before ?? PLATFORM_FEE_RATE) !== effective;
    if (changed) {
      Promise.resolve(supabase.from('notifications').insert({
        user_id: req.params.userId, type: 'fee_updated',
        title: effective === 0 ? '🎉 No platform fee on your earnings' : effective < PLATFORM_FEE_RATE ? '🎉 Your platform fee was reduced' : 'Platform fee update',
        message: effective === 0
          ? 'Taskeeu has removed the platform fee on your earnings — you keep 100% of your task balance when you withdraw.'
          : `Your platform fee is now ${label} of your task balance (you keep ${feePercentLabel(1 - effective)}). This applies to your next withdrawal.`,
        action_url: '/tasker?tab=payments',
      })).catch(() => {});
    }

    res.json({
      success: true, profile: updated, platform_fee_rate: effective, is_custom: rate !== null,
      message: rate === null ? `Back to the standard ${label} fee.` : `Fee set to ${label} — the tasker keeps ${feePercentLabel(1 - effective)}.`,
    });
  } catch (err) {
    console.error('Set tasker fee error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not update the fee.' });
  }
});

router.post('/taskers/:userId/approve', ...adminOnly, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('tasker_profiles')
      .select('user:users!user_id(email, full_name)')
      .eq('user_id', req.params.userId)
      .maybeSingle();

    if (!profile)
      return res.status(404).json({ success: false, message: 'Tasker not found' });

    await supabase
      .from('tasker_profiles')
      .update({ verification_status: 'approved', admin_notes: req.body.notes || null })
      .eq('user_id', req.params.userId);

    // Notify tasker
    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: req.params.userId,
        type: 'tasker_approved',
        title: 'Your tasker application has been approved!',
        message: 'Your application has been approved. Start browsing tasks now!',
        action_url: '/tasker/dashboard',
        });
      } catch (_) {}
    })();


    const loginToken = jwt.sign({ id: req.params.userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    sendTaskerApprovedEmail(profile.user.email, profile.user.full_name, loginToken)
      .then(() => console.log(`✅ Approval email sent to ${profile.user.email}`))
      .catch(err => console.error(`❌ Approval email failed for ${profile.user.email}:`, err?.message));

    // Audit log
    await supabase.from('admin_audit_log').insert({
      admin_id: req.user.id,
      action: 'approve_tasker',
      target_type: 'user',
      target_id: req.params.userId,
      details: { notes: req.body.notes },
    });

    res.json({ success: true, message: 'Tasker approved' });
  } catch (err) {
    console.error('Approve tasker error:', err);
    res.status(500).json({ success: false, message: 'Approval failed' });
  }
});

// ─── POST /admin/taskers/:userId/reject ──────────────────────────
router.post('/taskers/:userId/reject', ...adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;

    const { data: profile } = await supabase
      .from('tasker_profiles')
      .select('user:users!user_id(email, full_name)')
      .eq('user_id', req.params.userId)
      .maybeSingle();

    if (!profile)
      return res.status(404).json({ success: false, message: 'Tasker not found' });

    await supabase
      .from('tasker_profiles')
      .update({ verification_status: 'rejected', admin_notes: reason || null })
      .eq('user_id', req.params.userId);

    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: req.params.userId,
        type: 'tasker_rejected',
        title: 'Application Update',
        message: `Your tasker application was not approved. ${reason ? 'Reason: ' + reason : ''}`,
        });
      } catch (_) {}
    })();

    sendTaskerRejectedEmail(profile.user.email, profile.user.full_name, reason)
      .then(() => console.log(`✅ Rejection email sent to ${profile.user.email}`))
      .catch(err => console.error(`❌ Rejection email failed for ${profile.user.email}:`, err?.message));

    await supabase.from('admin_audit_log').insert({
      admin_id: req.user.id,
      action: 'reject_tasker',
      target_type: 'user',
      target_id: req.params.userId,
      details: { reason },
    });

    res.json({ success: true, message: 'Tasker rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Rejection failed' });
  }
});

// ─── POST /admin/taskers/:userId/ignore ──────────────────────────
router.post('/taskers/:userId/ignore', ...adminOnly, async (req, res) => {
  try {
    await supabase
      .from('tasker_profiles')
      .update({ verification_status: 'ignored' })
      .eq('user_id', req.params.userId);

    res.json({ success: true, message: 'Application ignored' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Action failed' });
  }
});

// ─── GET /admin/users — all users ────────────────────────────────
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { role, page = 1, limit = 30, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = supabase
      .from('users')
      .select('id, email, full_name, username, phone, role, is_active, email_verified, avatar_url, created_at, last_seen, tasker_profiles(task_city, task_state)', { count: 'exact' })
      .not('email', 'like', 'deleted_%@deleted.taskeeu.com')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (role) q = q.eq('role', role);
    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data: rawUsers, error, count } = await q;
    if (error) throw error;

    // Flatten the joined tasker_profile so the frontend can read task_city/
    // task_state directly off each user object. tasker_profiles comes back as
    // an array (or null) from the foreign-table select; taskers have exactly
    // one, requesters have none.
    const users = (rawUsers || []).map(u => {
      const profile = Array.isArray(u.tasker_profiles) ? u.tasker_profiles[0] : u.tasker_profiles;
      const { tasker_profiles, ...rest } = u;
      return { ...rest, task_city: profile?.task_city || null, task_state: profile?.task_state || null };
    });

    res.json({
      success: true,
      users,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── PUT /admin/users/:userId/status — activate/deactivate ───────
router.put('/users/:userId/status', ...adminOnly, async (req, res) => {
  try {
    const { is_active } = req.body;
    await supabase.from('users').update({ is_active: Boolean(is_active) }).eq('id', req.params.userId);

    await supabase.from('admin_audit_log').insert({
      admin_id: req.user.id,
      action: is_active ? 'activate_user' : 'deactivate_user',
      target_type: 'user',
      target_id: req.params.userId,
    });

    res.json({ success: true, message: `User ${is_active ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ─── PUT /admin/users/:userId/verify-email — manually verify a stuck requester ───
// Used to unblock requesters whose email verification link never worked
// (e.g. account created before the verify-link bug was fixed). Marks the
// account verified and clears any leftover verification token so they can
// log in immediately without needing to click the email link again.
router.put('/users/:userId/verify-email', ...adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, email, full_name, role, email_verified')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr || !user)
      return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role !== 'requester')
      return res.status(400).json({ success: false, message: 'Only requester accounts need manual email verification' });

    if (user.email_verified)
      return res.json({ success: true, message: 'User is already verified' });

    const { error } = await supabase.from('users').update({ email_verified: true }).eq('id', userId);
    if (error) throw error;

    // Clear any stale verification token so it can't be reused
    try { await supabase.rpc('clear_verification_token', { p_user_id: userId }); } catch (_) {}

    await supabase.from('admin_audit_log').insert({
      admin_id: req.user.id,
      action: 'manual_verify_email',
      target_type: 'user',
      target_id: userId,
    });

    res.json({ success: true, message: `${user.full_name || user.email} has been verified and can now log in.` });
  } catch (err) {
    console.error('Manual verify-email error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// ─── DELETE /admin/users/:userId — hard delete user from database ────
router.delete('/users/:userId', ...adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id)
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });

    const { data: target } = await supabase
      .from('users').select('email, full_name, role').eq('id', userId).maybeSingle();

    if (!target)
      return res.status(404).json({ success: false, message: 'User not found.' });

    if (target.role === 'admin')
      return res.status(403).json({ success: false, message: 'Cannot delete an admin account.' });

    // ── Step 1: get task IDs owned by this user (needed for cascade) ──
    const { data: ownedTasks } = await supabase
      .from('tasks').select('id').eq('requester_id', userId);
    const ownedTaskIds = (ownedTasks || []).map(t => t.id);

    // ── Step 2: ratings (refs tasks + users, no cascade) ──────────────
    await supabase.from('ratings').delete()
      .or(`requester_id.eq.${userId},tasker_id.eq.${userId}`);

    // ── Step 3: refund_requests (refs payments + tasks + users) ───────
    await supabase.from('refund_requests').delete()
      .or(`requester_id.eq.${userId},tasker_id.eq.${userId}`);

    // ── Step 4: direct_applications ───────────────────────────────────
    await supabase.from('direct_applications').delete()
      .or(`requester_id.eq.${userId},tasker_id.eq.${userId}`);

    // ── Step 5: payments (must go before tasks due to FK on payment_id) ──
    await supabase.from('payments').delete()
      .or(`requester_id.eq.${userId},tasker_id.eq.${userId}`);

    // ── Step 5b: custom_payments — same shape as payments, was missing ──
    // (task_id cascades from tasks, but a tasker's custom_payments row on
    // someone else's task wouldn't be caught by the task-deletion cascade)
    await supabase.from('custom_payments').delete()
      .or(`requester_id.eq.${userId},tasker_id.eq.${userId}`);

    // ── Step 5c: Enterprise/Teams tables — these reference users(id) with
    // NO cascade rule (plain FK), so a dangling reference blocks user
    // deletion with a foreign key violation. These rows are financial/audit
    // records that shouldn't be destroyed just because the user who
    // initiated them is gone, so we nullify the reference instead of
    // deleting the row. This is what "wallet_transactions_initiated_by_fkey"
    // (and its siblings below) were violating.
    try {
      await supabase.from('wallet_transactions').update({ initiated_by: null }).eq('initiated_by', userId);
      await supabase.from('company_members').update({ approved_by: null }).eq('approved_by', userId);
      await supabase.from('enterprise_task_proofs').update({ tasker_id: null }).eq('tasker_id', userId);
      await supabase.from('enterprise_task_proofs').update({ approved_by: null }).eq('approved_by', userId);
      await supabase.from('company_tasker_blacklist').update({ blacklisted_by: null }).eq('blacklisted_by', userId);
      await supabase.from('enterprise_broadcasts').update({ sent_by: null }).eq('sent_by', userId);
      await supabase.from('enterprise_meetings').update({ created_by: null }).eq('created_by', userId);
      await supabase.from('company_permission_grants').update({ granted_by: null }).eq('granted_by', userId);
    } catch (e) {
      console.warn('Enterprise/teams FK cleanup warn (safe to ignore if teams feature not installed):', e?.message);
    }
    // company_members.user_id and enterprise_task_bids.tasker_id are ON DELETE
    // CASCADE already, and companies.hr_user_id is ON DELETE SET NULL — Postgres
    // handles those automatically, no explicit step needed.

    // ── Step 6: task_bids (as tasker or on owned tasks) ───────────────
    await supabase.from('task_bids').delete().eq('tasker_id', userId);
    if (ownedTaskIds.length) {
      await supabase.from('task_bids').delete().in('task_id', ownedTaskIds);
    }

    // ── Step 7: chat rooms + messages (messages cascade from rooms) ────
    const { data: rooms } = await supabase
      .from('chat_rooms').select('id')
      .or(`requester_id.eq.${userId},tasker_id.eq.${userId}`);
    if (rooms?.length) {
      // chat_messages has ON DELETE CASCADE from chat_rooms — deleting rooms is enough
      await supabase.from('chat_rooms').delete().in('id', rooms.map(r => r.id));
    }

    // ── Step 8: nullify accepted_tasker_id before deleting tasks ──────
    await supabase.from('tasks')
      .update({ accepted_tasker_id: null, accepted_bid_id: null })
      .eq('accepted_tasker_id', userId);

    // ── Step 9: tasks owned by requester ──────────────────────────────
    if (ownedTaskIds.length) {
      await supabase.from('tasks').delete().in('id', ownedTaskIds);
    }

    // ── Step 10: tasker_profile (ON DELETE CASCADE but explicit is safer) ──
    if (target.role === 'tasker') {
      await supabase.from('tasker_profiles').delete().eq('user_id', userId);
      await supabase.from('kyc_change_requests').delete().eq('tasker_id', userId);
    }

    // ── Step 11: notifications (ON DELETE CASCADE but explicit) ───────
    await supabase.from('notifications').delete().eq('user_id', userId);

    // ── Step 12: support tickets ───────────────────────────────────────
    await supabase.from('support_tickets').delete().eq('user_id', userId);

    // ── Step 13: finally delete the user row ──────────────────────────
    const { error: delError } = await supabase.from('users').delete().eq('id', userId);
    if (delError) throw delError;

    // Audit log — fire and forget
    (async () => {
      try {
        await supabase.from('admin_audit_log').insert({
          admin_id: req.user.id,
          action: 'hard_delete_user',
          target_type: 'user',
          target_id: userId,
          details: { email: target.email, full_name: target.full_name, role: target.role },
        });
      } catch (_) {}
    })();

    res.json({ success: true, message: `${target.full_name} (${target.email}) permanently deleted.` });
  } catch (err) {
    console.error('Delete user error:', err?.message);
    res.status(500).json({ success: false, message: err?.message || 'Could not delete user. Please try again.' });
  }
});

// ─── GET /admin/tasks — all tasks ────────────────────────────────
router.get('/tasks', ...adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = supabase
      .from('tasks')
      .select(`
        id, title, status, task_city, task_state, deadline, created_at, budget_min, budget_max,
        is_hidden, hidden_at, hidden_reason,
        requester:users!requester_id(full_name, email),
        accepted_tasker:users!accepted_tasker_id(full_name, email),
        bids:task_bids(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) q = q.eq('status', status);

    const { data: tasks, error, count } = await q;
    if (error) throw error;

    res.json({
      success: true,
      tasks,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── GET /admin/tasks/:id — full task detail: all bids + progress ─
router.get('/tasks/:id', ...adminOnly, async (req, res) => {
  try {
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select(`
        *,
        requester:users!requester_id(id, full_name, email, phone),
        accepted_tasker:users!accepted_tasker_id(id, full_name, email, phone)
      `)
      .eq('id', req.params.id)
      .maybeSingle();

    if (taskErr) throw taskErr;
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Admin only: the chosen tasker's bank details (e.g. to send money manually).
    if (task.accepted_tasker_id) {
      const { data: bank } = await supabase.from('tasker_profiles')
        .select('bank_name, bank_code, bank_account_number, bank_account_name')
        .eq('user_id', task.accepted_tasker_id).maybeSingle();
      if (task.accepted_tasker) task.accepted_tasker.bank = bank || null;
    }

    // Every bid on this task, including rejected ones — full monitoring, not just the accepted bid
    const { data: bids, error: bidsErr } = await supabase
      .from('task_bids')
      .select(`
        id, workmanship_price, message, status, created_at,
        tasker:users!tasker_id(id, full_name, email, phone, avatar_url)
      `)
      .eq('task_id', req.params.id)
      .order('created_at', { ascending: false });
    if (bidsErr) throw bidsErr;

    // Payment/escrow progress — standard workmanship payments
    const { data: payments } = await supabase
      .from('payments')
      .select('id, payment_type, amount, status, created_at, updated_at')
      .eq('task_id', req.params.id)
      .order('created_at', { ascending: true });

    // Equipment-purchase flow progress (if this task required equipment)
    const { data: customPayment } = await supabase
      .from('custom_payments')
      .select('*')
      .eq('task_id', req.params.id)
      .maybeSingle();

    // ── Full chat monitoring: EVERY room on this task (a requester may chat
    // with several bidders) + every message, including deleted ones ──
    const { data: chatRooms } = await supabase
      .from('chat_rooms')
      .select('id, requester_id, tasker_id, is_active, last_message_at, created_at, tasker:users!tasker_id(full_name)')
      .eq('task_id', req.params.id)
      .order('created_at', { ascending: true });
    const rooms = chatRooms || [];
    const chatRoom = rooms[0] || null; // kept for older admin UI code

    let messages = [];
    if (rooms.length) {
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!sender_id(id, full_name, avatar_url, role)
        `)
        .in('room_id', rooms.map(r => r.id))
        .order('created_at', { ascending: true });
      const roomName = new Map(rooms.map(r => [r.id, r.tasker?.full_name || 'tasker']));
      messages = (msgs || []).map(m => ({ ...m, room_tasker_name: roomName.get(m.room_id) || null }));
    }

    // Task completion codes (proof the requester released the code / job done)
    const { data: completionCodes } = await supabase
      .from('task_completion_codes')
      .select('*')
      .eq('task_id', req.params.id)
      .order('created_at', { ascending: true });

    // Any refund/dispute requests raised on this task
    const { data: refunds } = await supabase
      .from('refund_requests')
      .select('id, amount, reason, status, tasker_response, admin_notes, processed_at, created_at')
      .eq('task_id', req.params.id)
      .order('created_at', { ascending: true });

    // ── Unified, timestamped activity log across every process ──
    // Merges task creation, bids, messages, payments, custom-payment state,
    // completion, and refunds into one chronological stream so an admin can
    // see exactly what happened and when (e.g. a payment that failed right
    // after a specific chat message).
    const activity = [];
    if (task.created_at) activity.push({ ts: task.created_at, type: 'task', label: 'Task posted', detail: task.title });
    (bids || []).forEach(b => activity.push({ ts: b.created_at, type: 'bid', label: `Bid ${b.status}`, detail: `${b.tasker?.full_name || 'Tasker'} — ₦${Number(b.workmanship_price).toLocaleString()}` }));
    messages.filter(m => m.is_bot).forEach(m => activity.push({ ts: m.created_at, type: 'message', actor: 'system', label: `Keeu (chat assistant) reminder${rooms.length > 1 && m.room_tasker_name ? ` (chat with ${m.room_tasker_name})` : ''}`, detail: m.content || '' }));
    messages.filter(m => !m.is_bot).forEach(m => activity.push({ ts: m.created_at, type: 'message', actor: m.sender?.role === 'tasker' ? 'tasker' : m.sender?.role === 'admin' ? 'admin' : 'requester', label: `Message from ${m.sender?.full_name || 'user'}${rooms.length > 1 && m.room_tasker_name ? ` (chat with ${m.room_tasker_name})` : ''}`, detail: m.is_deleted ? '(deleted message)' : (m.content || `[${m.media_type || 'media'}]`) }));
    (payments || []).forEach(p => activity.push({ ts: p.created_at, type: 'payment', label: `Payment ${p.status} (${p.payment_type})`, detail: `₦${Number(p.amount).toLocaleString()}` }));
    if (customPayment) {
      activity.push({ ts: customPayment.created_at, type: 'custom_payment', label: 'Custom payment created', detail: `status: ${customPayment.status}` });
      if (customPayment.updated_at && customPayment.updated_at !== customPayment.created_at)
        activity.push({ ts: customPayment.updated_at, type: 'custom_payment', label: 'Custom payment updated', detail: `status: ${customPayment.status}` });
    }
    (completionCodes || []).forEach(c => {
      activity.push({ ts: c.created_at, type: 'completion', label: 'Completion code issued', detail: '' });
      if (c.is_used && c.used_at) activity.push({ ts: c.used_at, type: 'completion', label: 'Completion code used — job confirmed', detail: '' });
    });
    (refunds || []).forEach(r => {
      activity.push({ ts: r.created_at, type: 'refund', label: `Refund requested (${r.status})`, detail: `₦${Number(r.amount).toLocaleString()} — ${r.reason?.slice(0, 80) || ''}` });
      if (r.processed_at) activity.push({ ts: r.processed_at, type: 'refund', label: `Refund ${r.status}`, detail: r.admin_notes?.slice(0, 80) || '' });
    });
    if (task.completed_at) activity.push({ ts: task.completed_at, type: 'completion', actor: 'tasker', label: 'Task marked completed (completion code entered)', detail: '' });

    // ── Everything between requester and tasker, from each source table ──
    const nameOf = (id) => id === task.requester_id ? (task.requester?.full_name || 'Requester')
      : id === task.accepted_tasker_id ? (task.accepted_tasker?.full_name || 'Tasker')
      : ((bids || []).find(b => b.tasker?.id === id)?.tasker?.full_name || 'User');
    const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;
    const stars = (n) => '★'.repeat(Number(n) || 0) + '☆'.repeat(5 - (Number(n) || 0));
    const safe = async (p) => { try { const { data, error } = await p; return error ? [] : (data || []); } catch { return []; } };

    const [advances, proofs, ratings, platformFb, cancelReqs, logRows] = await Promise.all([
      safe(supabase.from('advance_requests').select('id, tasker_id, requested_amount, approved_amount, status, note, response_note, created_at, responded_at, withdrawn_at, flw_reference').eq('task_id', req.params.id)),
      safe(supabase.from('task_proofs').select('id, tasker_id, url, file_name, mime_type, created_at').eq('task_id', req.params.id)),
      safe(supabase.from('ratings').select('id, rater_id, ratee_id, direction, rating, comment, created_at').eq('task_id', req.params.id)),
      safe(supabase.from('platform_feedback').select('id, user_id, role, rating, comment, created_at').eq('task_id', req.params.id)),
      safe(supabase.from('cancel_requests').select('id, reason, status, tasker_response, responded_at, created_at').eq('task_id', req.params.id)),
      safe(supabase.from('task_activity').select('id, actor_id, actor_role, event, summary, details, created_at').eq('task_id', req.params.id)),
    ]);

    for (const a of advances) {
      activity.push({ ts: a.created_at, type: 'advance', actor: 'tasker', label: `Advance requested: ${naira(a.requested_amount)}`, detail: a.note || '' });
      if (a.responded_at && ['approved', 'withdrawn', 'rejected'].includes(a.status)) {
        const approved = a.status !== 'rejected';
        activity.push({ ts: a.responded_at, type: 'advance', actor: 'requester',
          label: approved ? `Advance approved: ${naira(a.approved_amount)}${Number(a.approved_amount) !== Number(a.requested_amount) ? ` (requested ${naira(a.requested_amount)})` : ''}` : 'Advance rejected',
          detail: a.response_note || '' });
      }
      if (a.withdrawn_at && a.status === 'withdrawn')
        activity.push({ ts: a.withdrawn_at, type: 'advance', actor: 'tasker', label: `Advance withdrawn to bank: ${naira(a.approved_amount)}`, detail: a.flw_reference ? `Ref ${a.flw_reference}` : '' });
    }
    // Proofs: one entry per upload batch (files saved within the same minute)
    const batches = [];
    for (const p of [...proofs].sort((x, y) => new Date(x.created_at) - new Date(y.created_at))) {
      const last = batches[batches.length - 1];
      if (last && new Date(p.created_at) - new Date(last.ts) < 60000) last.files.push(p);
      else batches.push({ ts: p.created_at, files: [p] });
    }
    for (const b of batches)
      activity.push({ ts: b.ts, type: 'proof', actor: 'tasker', label: `Proof of work uploaded (${b.files.length} file${b.files.length === 1 ? '' : 's'})`,
        detail: b.files.map(f => f.file_name || 'file').join(', '), links: b.files.map(f => ({ url: f.url, name: f.file_name || 'file' })) });
    for (const r of ratings) {
      const byRequester = r.direction === 'requester_to_tasker' || (!r.direction && r.rater_id === task.requester_id);
      activity.push({ ts: r.created_at, type: 'review', actor: byRequester ? 'requester' : 'tasker',
        label: `${byRequester ? 'Requester' : 'Tasker'} rated ${byRequester ? 'the tasker' : 'the requester'} ${r.rating}/5 ${stars(r.rating)}`,
        detail: r.comment ? `“${r.comment}”` : '', rating: r.rating });
    }
    for (const fb of platformFb)
      activity.push({ ts: fb.created_at, type: 'review', actor: fb.role || 'tasker',
        label: `${fb.role === 'requester' ? 'Requester' : 'Tasker'} rated Taskeeu ${fb.rating}/5 ${stars(fb.rating)}`,
        detail: fb.comment ? `“${fb.comment}”` : '', rating: fb.rating });
    for (const c of cancelReqs) {
      activity.push({ ts: c.created_at, type: 'cancel', actor: 'requester', label: 'Requester asked to cancel the task', detail: c.reason || '' });
      // Skip if the same approval is already in the task_activity log (it has more detail).
      const loggedApproval = logRows.some(l => l.event === 'task_cancelled' && l.details?.cancel_request_id === c.id);
      if (c.responded_at && c.status !== 'pending' && !(c.status === 'approved' && loggedApproval))
        activity.push({ ts: c.responded_at, type: 'cancel', actor: 'tasker', label: c.status === 'approved' ? 'Tasker agreed to cancel' : 'Tasker declined the cancellation', detail: c.tasker_response || '' });
    }
    const LOG_TYPE = { tasker_chosen: 'bid', tasker_switched: 'bid', tasker_removed: 'bid', bid_declined: 'bid', chat_opened: 'message',
      task_cancelled: 'cancel', deadline_extended: 'task', earnings_withdrawn: 'payment',
      tip_paid: 'payment', extra_money_paid: 'payment', tip_withdrawn: 'payment' };
    for (const l of logRows)
      activity.push({ ts: l.created_at, type: LOG_TYPE[l.event] || 'task', actor: l.actor_role || 'system', label: l.summary, detail: '', event: l.event });

    // Who did what, for events recorded before "actor" existed
    for (const a of activity) {
      if (a.actor) continue;
      if (a.type === 'bid') a.actor = 'tasker';
      else if (a.type === 'payment') a.actor = 'requester';
      else a.actor = 'system';
    }
    activity.sort((a, b) => new Date(a.ts) - new Date(b.ts));

    res.json({
      success: true,
      task,
      bids: bids || [],
      payments: payments || [],
      custom_payment: customPayment || null,
      chat_room: chatRoom || null,
      chat_rooms: rooms,
      messages,
      completion_codes: completionCodes || [],
      refunds: refunds || [],
      activity,
    });
  } catch (err) {
    console.error('Get task detail error:', err);
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});


router.get('/referrals', ...adminOnly, async (req, res) => {
  try {
    const { data: referrers } = await supabase
      .from('users')
      .select('id, full_name, email, role, referral_slug')
      .not('referral_slug', 'is', null)
      .order('full_name', { ascending: true });

    if (!referrers?.length) return res.json({ success: true, referrers: [] });

    const referrerIds = referrers.map(r => r.id);

    const { data: referrals } = await supabase
      .from('referrals')
      .select('referrer_id, referred_user_id, created_at, referred:users!referred_user_id(id, full_name, email, role)')
      .in('referrer_id', referrerIds);

    const { data: commissions } = await supabase
      .from('referral_commissions')
      .select('referrer_id, referred_user_id, task_id, base_amount, commission_amount, status, created_at')
      .in('referrer_id', referrerIds);

    const referredIds = (referrals || []).map(r => r.referred_user_id);
    let tasksByUser = {};
    if (referredIds.length) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, requester_id, title, status, budget_min, budget_max, accepted_bid_id, created_at')
        .in('requester_id', referredIds);
      const taskIds = (tasks || []).map(t => t.id);
      let bidCounts = {};
      if (taskIds.length) {
        const { data: bids } = await supabase
          .from('task_bids').select('task_id, workmanship_price, status').in('task_id', taskIds);
        for (const b of bids || []) {
          const c = bidCounts[b.task_id] || { total: 0, accepted: null };
          c.total += 1;
          if (b.status === 'accepted') c.accepted = Number(b.workmanship_price);
          bidCounts[b.task_id] = c;
        }
      }
      let paidByTask = {};
      if (taskIds.length) {
        const { data: pays } = await supabase
          .from('payments').select('task_id, amount, status, payment_type').in('task_id', taskIds);
        for (const p of pays || []) {
          if (p.status === 'completed') paidByTask[p.task_id] = (paidByTask[p.task_id] || 0) + Number(p.amount);
        }
      }
      for (const t of tasks || []) {
        const arr = tasksByUser[t.requester_id] || [];
        arr.push({
          id: t.id, title: t.title, status: t.status,
          budget_min: t.budget_min, budget_max: t.budget_max,
          bids: bidCounts[t.id]?.total || 0,
          accepted_amount: bidCounts[t.id]?.accepted || null,
          amount_paid: paidByTask[t.id] || 0,
          created_at: t.created_at,
        });
        tasksByUser[t.requester_id] = arr;
      }
    }

    const result = referrers.map(ref => {
      const myReferrals = (referrals || []).filter(r => r.referrer_id === ref.id);
      const myCommissions = (commissions || []).filter(c => c.referrer_id === ref.id);
      const sumBy = (st) => myCommissions.filter(c => c.status === st).reduce((s, c) => s + Number(c.commission_amount), 0);
      return {
        id: ref.id, full_name: ref.full_name, email: ref.email, role: ref.role, slug: ref.referral_slug,
        referred_count: myReferrals.length,
        wallet: { available: sumBy('available'), pending: sumBy('pending'), withdrawn: sumBy('withdrawn') },
        referred: myReferrals.map(r => ({
          id: r.referred?.id, full_name: r.referred?.full_name, email: r.referred?.email, role: r.referred?.role,
          joined_at: r.created_at,
          tasks: tasksByUser[r.referred_user_id] || [],
          commission: myCommissions
            .filter(c => c.referred_user_id === r.referred_user_id)
            .map(c => ({ task_id: c.task_id, amount: c.commission_amount, status: c.status })),
        })),
      };
    });

    res.json({ success: true, referrers: result });
  } catch (err) {
    console.error('Admin referrals error:', err);
    res.status(500).json({ success: false, message: 'Could not load referral overview' });
  }
});


// ─── GET /admin/analytics/pwa-push — install + push analytics ─────
router.get('/analytics/pwa-push', ...adminOnly, async (req, res) => {
  try {
    const { data: installs } = await supabase
      .from('pwa_installs').select('platform, device_type, created_at');

    const byPlatform = {}; const byDevice = {};
    for (const i of installs || []) {
      byPlatform[i.platform] = (byPlatform[i.platform] || 0) + 1;
      byDevice[i.device_type] = (byDevice[i.device_type] || 0) + 1;
    }

    // Push: group events by campaign
    const { data: events } = await supabase
      .from('push_events').select('campaign_id, event, title, created_at')
      .order('created_at', { ascending: false });

    const campaigns = {};
    for (const e of events || []) {
      const key = e.campaign_id || 'unknown';
      if (!campaigns[key]) campaigns[key] = { campaign_id: key, title: e.title, sent: 0, shown: 0, opened: 0, created_at: e.created_at };
      if (e.event === 'sent') campaigns[key].sent += 1;
      if (e.event === 'shown') campaigns[key].shown += 1;
      if (e.event === 'opened') campaigns[key].opened += 1;
      if (e.title && !campaigns[key].title) campaigns[key].title = e.title;
    }

    res.json({
      success: true,
      installs: {
        total: (installs || []).length,
        by_platform: byPlatform,
        by_device: byDevice,
      },
      push_campaigns: Object.values(campaigns).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    });
  } catch (err) {
    console.error('PWA/push analytics error:', err);
    res.status(500).json({ success: false, message: 'Could not load analytics' });
  }
});

// ─── GET /admin/analytics/email — broadcast open/click stats ──────
// ─── GET /admin/analytics/posters ─────────────────────────────────
// ─── GET /admin/feature-announcements — history of all sent announcements ──
router.get('/feature-announcements', ...adminOnly, async (req, res) => {
  try {
    const { data } = await supabase
      .from('feature_announcements')
      .select('id, subject, recipient_count, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    res.json({ success: true, announcements: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load announcement history' });
  }
});

// ─── GET /admin/feature-announcement-template — default email content ──────
router.get('/feature-announcement-template', ...adminOnly, (req, res) => {
  const FRONTEND = process.env.FRONTEND_URL || 'https://taskeeu.com';
  const defaultSubject = 'New on Taskeeu: install the app, create your poster, and start earning';
  const defaultFeatures = [
    { title: 'Install Taskeeu on your phone as an app', body: 'Taskeeu is now a Progressive Web App. Open the site on your phone, tap Share, then Add to Home Screen. It installs like a real app — full-screen, fast, works on Android and iPhone. No App Store needed.' },
    { title: 'Marketing poster', body: 'In your dashboard, go to the Marketing tab. Upload your photo, choose a circular or square frame, and download a professional 1:1 poster to share on WhatsApp status, Instagram, and Twitter.' },
    { title: 'Your referral code and profile link', body: 'Requesters have a 4-pin referral code. When people sign up using your code you earn 10% commission on their completed tasks. Taskers have a searchable profile link — share it on your WhatsApp bio, Instagram, and LinkedIn.' },
    { title: 'Update your LinkedIn', body: 'Add Taskeeu to your LinkedIn profile under Experience. Taskers: title is Independent Tasker. Requesters: title is Taskeeu Ambassador. Paste your Taskeeu link as the company URL.' },
    { title: 'Real-time chat with voice notes', body: 'Every task has a built-in chat with text, photo evidence, and voice notes. No need to move conversations to WhatsApp.' },
    { title: 'Escrow-protected payments', body: 'All task payments are held in escrow and only released when the requester confirms the job is done. Taskers get paid reliably. Requesters never lose money on uncompleted tasks.' },
    { title: 'Refer and earn', body: 'Invite others using your referral link or poster code. When someone you referred completes a paid task, you earn 10% commission — withdrawable to your Nigerian bank account.' },
  ];
  res.json({ success: true, defaultSubject, defaultFeatures });
});

// ─── POST /admin/send-feature-announcement ────────────────────────
router.post('/send-feature-announcement', ...adminOnly, async (req, res) => {
  try {
    const { sendEmail } = require('../utils/email');
    const { subject, features } = req.body || {};

    if (!subject?.trim()) return res.status(400).json({ success: false, message: 'Subject is required' });
    if (!Array.isArray(features) || features.length === 0)
      return res.status(400).json({ success: false, message: 'At least one feature is required' });

    const FRONTEND = process.env.FRONTEND_URL || 'https://taskeeu.com';
    const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

    // Build email HTML from editable features list
    const buildHtml = (firstName, role) => {
      const dashLink = role === 'tasker' ? `${FRONTEND}/tasker` : `${FRONTEND}/requester`;
      const featureRows = features.map(f =>
        `<div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid #f0f0f0;">
          <p style="margin:0 0 6px;font-weight:700;color:#1a1a1a;font-size:15px;font-family:${FONT};">${f.title}</p>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.65;font-family:${FONT};">${f.body}</p>
        </div>`
      ).join('');

      return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:${FONT};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#fff;border:1px solid #e2e2e2;">
        <tr><td style="padding:28px 36px 20px;border-bottom:1px solid #e8e8e8;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a1a;font-family:${FONT};">Taskeeu</p>
          <p style="margin:4px 0 0;font-size:12px;color:#888;font-family:${FONT};">Nigeria's Task Outsourcing Platform</p>
        </td></tr>
        <tr><td style="padding:32px 36px;font-family:${FONT};font-size:15px;line-height:1.7;color:#1a1a1a;">
          <p style="margin:0 0 6px;font-size:14px;color:#888;">Hi ${firstName},</p>
          <p style="margin:0 0 28px;font-weight:700;font-size:18px;color:#1a1a1a;line-height:1.3;">Here is what is new on Taskeeu.</p>
          ${featureRows}
          <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.65;">All of these are live now in your dashboard.</p>
          <a href="${dashLink}" style="display:inline-block;background:#ff2d62;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:10px;font-family:${FONT};">Open my dashboard</a>
          <p style="margin:24px 0 0;color:#888;font-size:13px;">The Taskeeu Team</p>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid #e8e8e8;text-align:center;">
          <p style="margin:0;font-size:11px;color:#999;font-family:${FONT};">You received this email because you have an account on Taskeeu.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
    };

    // Get all users with valid emails
    const { data: users } = await supabase
      .from('users')
      .select('email, full_name, role')
      .neq('email', null)
      .neq('email', '')
      .in('role', ['requester', 'tasker'])
      .limit(10000);

    if (!users?.length) return res.json({ success: true, sent: 0, message: 'No users found.' });

    let sent = 0;
    const BATCH = 50;

    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH);
      await Promise.all(batch.map(u => {
        const firstName = u.full_name?.split(' ')[0] || 'there';
        return sendEmail({
          to: u.email, subject: subject.trim(),
          html: buildHtml(firstName, u.role),
        }).catch(err => console.error(`Announcement failed for ${u.email}:`, err?.message));
      }));
      sent += batch.length;
      if (i + BATCH < users.length) await new Promise(r => setTimeout(r, 800));
    }

    // Save to announcement history
    const historyHtml = buildHtml('{firstName}', 'requester');
    await Promise.resolve(supabase.from('feature_announcements').insert({
      subject: subject.trim(),
      body_html: historyHtml,
      sent_by: req.user.id,
      recipient_count: sent,
      status: 'sent',
    })).catch(() => {});

    res.json({ success: true, sent, message: `Announcement sent to ${sent} users.` });
  } catch (err) {
    console.error('Feature announcement error:', err);
    res.status(500).json({ success: false, message: 'Could not send announcement' });
  }
});

router.get('/analytics/posters', ...adminOnly, async (req, res) => {
  try {
    const { data: events } = await supabase
      .from('poster_events')
      .select('user_id, event, role, created_at, user:users!user_id(full_name, username, avatar_url, role)')
      .order('created_at', { ascending: false })
      .limit(500);

    const byUser = {};
    for (const e of events || []) {
      const uid = e.user_id || 'anon';
      if (!byUser[uid]) byUser[uid] = {
        user_id: uid, user: e.user, downloads: 0, copies: 0, role: e.role, last_at: e.created_at,
      };
      if (e.event === 'download') byUser[uid].downloads += 1;
      if (e.event === 'copy_link') byUser[uid].copies += 1;
      if (e.created_at > byUser[uid].last_at) byUser[uid].last_at = e.created_at;
    }

    const rows = Object.values(byUser).sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
    const totals = {
      total_downloads: rows.reduce((s, r) => s + r.downloads, 0),
      total_copies: rows.reduce((s, r) => s + r.copies, 0),
      unique_users: rows.length,
    };

    res.json({ success: true, rows, totals });
  } catch (err) {
    console.error('Poster analytics error:', err);
    res.status(500).json({ success: false, message: 'Could not load poster analytics' });
  }
});

router.get('/analytics/email', ...adminOnly, async (req, res) => {
  try {
    const { data: broadcasts } = await supabase
      .from('broadcast_emails')
      .select('id, subject, audience, recipient_count, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    const ids = (broadcasts || []).map(b => b.id);
    let statsByBroadcast = {};
    if (ids.length) {
      const { data: events } = await supabase
        .from('email_events').select('broadcast_id, event, email').in('broadcast_id', ids);
      for (const e of events || []) {
        const s = statsByBroadcast[e.broadcast_id] || { delivered: new Set(), opened: new Set(), clicked: new Set(), bounced: new Set() };
        if (e.event === 'delivered') s.delivered.add(e.email);
        if (e.event === 'opened') s.opened.add(e.email);
        if (e.event === 'clicked') s.clicked.add(e.email);
        if (e.event === 'bounced') s.bounced.add(e.email);
        statsByBroadcast[e.broadcast_id] = s;
      }
    }

    const result = (broadcasts || []).map(b => {
      const s = statsByBroadcast[b.id];
      return {
        ...b,
        delivered: s ? s.delivered.size : 0,
        opened: s ? s.opened.size : 0,
        clicked: s ? s.clicked.size : 0,
        bounced: s ? s.bounced.size : 0,
      };
    });

    res.json({ success: true, broadcasts: result });
  } catch (err) {
    console.error('Email analytics error:', err);
    res.status(500).json({ success: false, message: 'Could not load email analytics' });
  }
});

router.post('/push', ...adminOnly, async (req, res) => {
  try {
    const { title, body, url, audience, user_ids } = req.body;
    if (!title?.trim() || !body?.trim())
      return res.status(400).json({ success: false, message: 'Title and message are required' });

    const { sendPushToUsers } = require('./push');

    let userIds = null; // null = everyone with a subscription
    if (audience === 'specific') {
      if (!Array.isArray(user_ids) || !user_ids.length)
        return res.status(400).json({ success: false, message: 'Select at least one recipient' });
      userIds = user_ids;
    } else if (audience === 'requesters' || audience === 'taskers') {
      const role = audience === 'requesters' ? 'requester' : 'tasker';
      const { data: users } = await supabase.from('users').select('id').eq('role', role);
      userIds = (users || []).map(u => u.id);
    }

    const result = await sendPushToUsers({
      userIds, title: title.trim(), body: body.trim(), url: url?.trim() || '/',
    });

    if (result.disabled)
      return res.status(400).json({ success: false, message: 'Push is not configured. Set VAPID keys in the backend environment.' });

    // Record a 'sent' analytics row per successful send under one campaign id,
    // so the admin can later compare sent vs opened.
    try {
      if (result.campaign_id && result.sent > 0) {
        const rows = Array.from({ length: result.sent }, () => ({
          campaign_id: result.campaign_id, event: 'sent', title: title.trim(),
        }));
        await supabase.from('push_events').insert(rows);
      }
    } catch (_) {}

    res.json({ success: true, message: `Push sent to ${result.sent} device(s).${result.failed ? ' ' + result.failed + ' failed.' : ''}`, ...result });
  } catch (err) {
    console.error('Admin push error:', err);
    res.status(500).json({ success: false, message: 'Could not send push notification' });
  }
});


router.get('/payments', ...adminOnly, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *, task:tasks(title),
        requester:users!requester_id(full_name),
        tasker:users!tasker_id(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const totalVolume = payments
      .filter((p) => p.status === 'completed')
      .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    res.json({ success: true, payments, total_volume: totalVolume });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── GET /admin/finance — Taskeeu's own income (platform fees) ──────
// Earned  = fees kept on payouts already sent (platform_earnings ledger).
// Pending = payouts the bank has not confirmed yet.
// Due     = completed tasks whose tasker has not withdrawn yet (fee will be
//           taken at that withdrawal). Upcoming = funded tasks still ongoing.
const LAGOS_OFFSET_MS = 60 * 60 * 1000; // UTC+1, no daylight saving
const lagosDay = (d) => new Date(new Date(d).getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
async function getFinanceSummary() {
  const { getEscrowForTasks, round2 } = require('../utils/escrow');
  const { data: ledger, error } = await supabase.from('platform_earnings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20000);
  if (error) {
    if (/platform_earnings/i.test(error.message || '')) return { ready: false };
    throw error;
  }
  const all = ledger || [];
  // International income per currency (never added to Naira figures).
  const intlMap = new Map();
  for (const r of all) {
    const c = r.currency || 'NGN';
    if (c === 'NGN') continue;
    const cur = intlMap.get(c) || { currency: c, earned_fees: 0, pending_fees: 0, gross: 0, count: 0 };
    if (r.status === 'earned') cur.earned_fees += Number(r.fee_amount || 0); else cur.pending_fees += Number(r.fee_amount || 0);
    cur.gross += Number(r.gross_amount || 0); cur.count += 1;
    intlMap.set(c, cur);
  }
  const by_currency = [...intlMap.values()].map(v => ({ ...v, earned_fees: round2(v.earned_fees), pending_fees: round2(v.pending_fees), gross: round2(v.gross) }));
  // Everything below is Naira, as before.
  const rows = all.filter(r => (r.currency || 'NGN') === 'NGN');
  const today = lagosDay(Date.now());
  const month = today.slice(0, 7);
  const sum = (arr, k) => round2(arr.reduce((t, r) => t + Number(r[k] || 0), 0));
  const earned = rows.filter(r => r.status === 'earned');
  const pending = rows.filter(r => r.status === 'pending');

  const byMonth = new Map();
  for (const r of earned) {
    const m = lagosDay(r.created_at).slice(0, 7);
    const cur = byMonth.get(m) || { month: m, fees: 0, gross: 0, payouts: 0, count: 0 };
    cur.fees += Number(r.fee_amount || 0); cur.gross += Number(r.gross_amount || 0);
    cur.payouts += Number(r.tasker_payout || 0); cur.count += 1;
    byMonth.set(m, cur);
  }
  const months = [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12)
    .map(m => ({ ...m, fees: round2(m.fees), gross: round2(m.gross), payouts: round2(m.payouts) }));

  // Fees not yet taken: completed-but-not-withdrawn (due) and ongoing funded (upcoming).
  const { data: open } = await supabase.from('payments')
    .select('task_id').eq('payment_type', 'workmanship').in('status', ['completed']).is('withdrawn_at', null);
  const escrow = await getEscrowForTasks((open || []).map(p => p.task_id).filter(Boolean));
  let due = 0, dueCount = 0, upcoming = 0, upcomingCount = 0;
  for (const e of escrow.values()) {
    if ((e.currency || 'NGN') !== 'NGN') continue;
    if (e.payout_status === 'available') { due += e.platform_fee; dueCount++; }
    else if (e.payout_status === 'locked') { upcoming += round2(e.funded * e.platform_fee_rate); upcomingCount++; }
  }

  // Names for the recent list
  const recent = rows.slice(0, 50);
  const taskIds = [...new Set(recent.map(r => r.task_id).filter(Boolean))];
  const userIds = [...new Set(recent.map(r => r.tasker_id).filter(Boolean))];
  const [{ data: tasks }, { data: users }] = await Promise.all([
    taskIds.length ? supabase.from('tasks').select('id, title').in('id', taskIds) : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from('users').select('id, full_name').in('id', userIds) : Promise.resolve({ data: [] }),
  ]);
  const title = new Map((tasks || []).map(t => [t.id, t.title]));
  const name = new Map((users || []).map(u => [u.id, u.full_name]));

  return {
    by_currency,
    ready: true,
    totals: {
      earned_all_time: sum(earned, 'fee_amount'),
      earned_this_month: round2(earned.filter(r => lagosDay(r.created_at).slice(0, 7) === month).reduce((t, r) => t + Number(r.fee_amount), 0)),
      earned_today: round2(earned.filter(r => lagosDay(r.created_at) === today).reduce((t, r) => t + Number(r.fee_amount), 0)),
      pending_confirmation: sum(pending, 'fee_amount'),
      due_on_withdrawal: round2(due), due_count: dueCount,
      upcoming_from_ongoing: round2(upcoming), upcoming_count: upcomingCount,
      task_value_paid_out: sum(earned, 'gross_amount'),
      paid_to_taskers: sum(earned, 'tasker_payout'),
      payouts_count: earned.length,
    },
    months,
    recent: recent.map(r => ({ ...r, task_title: title.get(r.task_id) || null, tasker_name: name.get(r.tasker_id) || null })),
  };
}

router.get('/finance', ...adminOnly, async (req, res) => {
  try {
    const summary = await getFinanceSummary();
    if (!summary.ready) return res.json({ success: true, ready: false, message: 'Run database/PLATFORM_EARNINGS_MIGRATION.sql to start recording Taskeeu earnings.' });
    res.json({ success: true, ...summary });
  } catch (err) {
    console.error('Finance summary error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load earnings.' });
  }
});

// ─── International payout queue ───────────────────────────────────
// Withdrawals in the international markets are paid by the Taskeeu team by
// bank transfer, then marked paid here. Rejecting releases the money back
// to the tasker's balance (earnings) or back to an approved advance.
router.get('/payouts', ...adminOnly, async (req, res) => {
  try {
    let q = supabase.from('payout_requests')
      .select('*, tasker:users!tasker_id(id, full_name, email, phone)')
      .order('created_at', { ascending: false }).limit(300);
    if (['pending', 'paid', 'rejected'].includes(req.query.status)) q = q.eq('status', req.query.status);
    const { data, error } = await q;
    if (error) {
      if (/payout_requests/i.test(error.message || '')) return res.json({ success: true, ready: false, payouts: [], message: 'Run database/INTERNATIONAL_MIGRATION.sql.' });
      throw error;
    }
    res.json({ success: true, ready: true, payouts: data || [] });
  } catch (err) {
    console.error('Admin payouts error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load payouts.' });
  }
});

router.post('/payouts/:id/:action', ...adminOnly, async (req, res) => {
  try {
    const { action } = req.params;
    if (!['paid', 'reject'].includes(action)) return res.status(400).json({ success: false, message: 'Unknown action.' });
    const note = String(req.body?.note || '').trim().slice(0, 500) || null;
    if (action === 'reject' && !note) return res.status(400).json({ success: false, message: 'Give a reason so the tasker knows what to fix.' });
    const status = action === 'paid' ? 'paid' : 'rejected';
    // Conditional: only a pending payout can change, so a double click is harmless.
    const { data: rows, error } = await supabase.from('payout_requests')
      .update({ status, admin_note: note, processed_by: req.user.id, processed_at: new Date().toISOString() })
      .eq('id', req.params.id).eq('status', 'pending').select('*');
    if (error) throw error;
    const po = rows?.[0];
    if (!po) return res.status(409).json({ success: false, message: 'This payout was already processed.' });

    const { money, pathPrefix } = require('../utils/countries');
    const amt = money(po.amount, po.currency);
    if (status === 'paid') {
      if (po.kind === 'earnings') {
        await supabase.from('platform_earnings').update({ status: 'earned' }).eq('payout_reference', po.reference);
      }
    } else if (po.kind === 'earnings') {
      await supabase.from('payments').update({ withdrawn_at: null, status: 'completed', payout_reference: null }).in('id', po.payment_ids || []);
      await supabase.from('platform_earnings').delete().eq('payout_reference', po.reference).eq('status', 'pending');
    } else if (po.advance_id) {
      await supabase.from('advance_requests').update({ status: 'approved', withdrawn_at: null, flw_reference: null }).eq('id', po.advance_id).eq('status', 'withdrawn');
    }
    Promise.resolve(supabase.from('notifications').insert({
      user_id: po.tasker_id,
      type: status === 'paid' ? 'payout_sent' : 'payout_rejected',
      title: status === 'paid' ? 'Withdrawal sent' : 'Withdrawal not sent',
      message: status === 'paid'
        ? `${amt} has been sent to your bank account (ref ${po.reference}).`
        : `Your withdrawal of ${amt} was not sent: ${note}. The money is back in your balance.`,
      data: { payout_id: po.id },
      action_url: `${pathPrefix(po.country)}/tasker?tab=payments`,
    })).catch(() => {});
    if (status === 'paid') {
      const { data: u } = await supabase.from('users').select('email, full_name').eq('id', po.tasker_id).maybeSingle();
      if (u?.email) require('../utils/email').sendPaymentSentEmail(u.email, u.full_name, po.amount, po.kind === 'advance' ? 'advance' : 'workmanship', po.currency).catch(() => {});
    }
    Promise.resolve(supabase.from('admin_audit_log').insert({
      admin_id: req.user.id, action: `payout_${status}`, target_type: 'payout', target_id: po.id,
      details: { amount: po.amount, currency: po.currency, reference: po.reference, note },
    })).catch(() => {});
    res.json({ success: true, payout: po, message: status === 'paid' ? `Marked ${amt} as paid.` : 'Payout rejected and returned to the tasker.' });
  } catch (err) {
    console.error('Admin payout action error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not update the payout.' });
  }
});

// ─── GET /admin/refunds — refund requests ────────────────────────
router.get('/refunds', ...adminOnly, async (req, res) => {
  try {
    const { data: refunds, error } = await supabase
      .from('refund_requests')
      .select(`
        *, task:tasks(title),
        requester:users!requester_id(full_name, email),
        tasker:users!tasker_id(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, refunds });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── POST /admin/tasks/:id/cancel — force cancel a task ──────────
// ─── PATCH /admin/tasks/:id/visibility — hide or show on public browse ─
// Body: { hidden: true|false, reason?: string }
// Does NOT change task status, bids, chat, or dashboards. Purely controls
// whether the task appears on the public /tasks browse page.
router.patch('/tasks/:id/visibility', ...adminOnly, async (req, res) => {
  try {
    const { hidden, reason } = req.body;
    if (typeof hidden !== 'boolean') {
      return res.status(400).json({ success: false, message: 'hidden must be true or false' });
    }

    const { data: task, error: findErr } = await supabase
      .from('tasks')
      .select('id, title, is_hidden')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const patch = hidden
      ? { is_hidden: true,  hidden_at: new Date().toISOString(), hidden_by: req.user.id, hidden_reason: reason?.trim() || null }
      : { is_hidden: false, hidden_at: null, hidden_by: null, hidden_reason: null };

    const { data: updated, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', req.params.id)
      .select('id, title, is_hidden, hidden_at, hidden_reason')
      .maybeSingle();

    if (error) throw error;

    // Fire-and-forget audit entry
    Promise.resolve(supabase.from('admin_audit_log').insert({
      admin_id: req.user.id,
      action: hidden ? 'hide_task' : 'unhide_task',
      target_type: 'task',
      target_id: req.params.id,
      details: { title: task.title, reason: reason?.trim() || null },
    })).catch(() => {});

    res.json({
      success: true,
      message: hidden ? 'Task hidden from public browse' : 'Task is now visible on public browse',
      task: updated,
    });
  } catch (err) {
    console.error('Toggle task visibility error:', err);
    res.status(500).json({ success: false, message: 'Could not update task visibility' });
  }
});

router.post('/tasks/:id/cancel', ...adminOnly, async (req, res) => {
  try {
    const { data: task, error: tErr } = await supabase.from('tasks')
      .select('id, title, status, accepted_tasker_id').eq('id', req.params.id).maybeSingle();
    if (tErr) throw tErr;
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.status === 'cancelled') return res.json({ success: true, already: true, message: 'Task is already cancelled' });
    if (task.status === 'completed')
      return res.status(400).json({ success: false, message: 'This task is already completed and paid out, so it cannot be cancelled.' });

    // Conditional: only the first request changes it (no double notifications).
    const { data: changed, error: uErr } = await supabase.from('tasks')
      .update({ status: 'cancelled' }).eq('id', req.params.id).neq('status', 'cancelled').neq('status', 'completed').select('id');
    if (uErr) throw uErr;
    if (!changed?.length) return res.json({ success: true, already: true, message: 'Task is already cancelled' });

    const reason = String(req.body?.reason || '').trim().slice(0, 500);
    logActivity(task.id, {
      actor: req.user, role: 'admin', event: 'task_cancelled',
      summary: `Admin cancelled the task${reason ? `: ${reason}` : ''}`, details: { reason: reason || null, previous_status: task.status },
    });
    notifyBiddersOfCancellation(task.id, task.title, null, 'admin'); // every bidder (background)

    await supabase.from('admin_audit_log').insert({
      admin_id: req.user.id,
      action: 'cancel_task',
      target_type: 'task',
      target_id: req.params.id,
      details: { reason: req.body.reason },
    });

    res.json({ success: true, message: 'Task cancelled by admin' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cancel failed' });
  }
});

// ─── GET /admin/audit-log ─────────────────────────────────────────
router.get('/audit-log', ...adminOnly, async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('admin_audit_log')
      .select(`*, admin:users!admin_id(full_name)`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── GET /admin/kyc-requests — list all KYC change requests ───────
router.get('/kyc-requests', ...adminOnly, async (req, res) => {
  try {
    const { status, type } = req.query;
    let q = supabase
      .from('kyc_change_requests')
      .select(`
        *,
        tasker:users!tasker_id(id, full_name, email, phone),
        reviewer:users!reviewed_by(full_name)
      `)
      .order('created_at', { ascending: false });

    if (status) q = q.eq('status', status);
    if (type)   q = q.eq('request_type', type);

    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, requests: data || [] });
  } catch (err) {
    console.error('KYC requests fetch error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch requests' });
  }
});

// ─── PUT /admin/kyc-requests/:id — approve or reject ──────────────
router.put('/kyc-requests/:id', ...adminOnly, async (req, res) => {
  try {
    const { action, admin_note } = req.body;
    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ success: false, message: 'Invalid action. Use approve or reject.' });

    const { data: request, error: fetchErr } = await supabase
      .from('kyc_change_requests')
      .select('id, tasker_id, request_type, status')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr || !request)
      return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending')
      return res.status(409).json({ success: false, message: 'This request has already been reviewed.' });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const now = new Date().toISOString();

    // Update the request record
    const { error: updateErr } = await supabase.from('kyc_change_requests').update({
      status: newStatus,
      admin_note: admin_note?.trim() || null,
      reviewed_by: req.user.id,
      reviewed_at: now,
      updated_at: now,
    }).eq('id', req.params.id);

    if (updateErr) throw updateErr;

    // Apply side-effects based on request type + action
    if (request.request_type === 'kyc_submission') {
      if (action === 'approve') {
        // Grant enterprise task access — use RPC to bypass schema cache for ALTER TABLE columns
        await supabase.from('tasker_profiles').update({ updated_at: now }).eq('user_id', request.tasker_id);
        try { await supabase.rpc('admin_set_kyc_status', {
          p_user_id: request.tasker_id, p_complete: true, p_status: 'approved',
          p_clear_docs: false,
        }); } catch(e) { console.warn('admin_set_kyc_status RPC warn:', e?.message); }
      } else {
        // Rejected — clear docs and allow resubmission
        await supabase.from('tasker_profiles').update({ updated_at: now }).eq('user_id', request.tasker_id);
        try { await supabase.rpc('admin_set_kyc_status', {
          p_user_id: request.tasker_id, p_complete: false, p_status: 'rejected',
          p_clear_docs: true,
        }); } catch(e) { console.warn('admin_set_kyc_status RPC warn:', e?.message); }
      }
    } else if (request.request_type === 'edit') {
      if (action === 'approve') {
        // Clear docs so tasker can re-upload and resubmit for review
        await supabase.from('tasker_profiles').update({ updated_at: now }).eq('user_id', request.tasker_id);
        try { await supabase.rpc('admin_set_kyc_status', {
          p_user_id: request.tasker_id, p_complete: false, p_status: 'not_submitted',
          p_clear_docs: true,
        }); } catch(e) { console.warn('admin_set_kyc_status RPC warn:', e?.message); }
      }
    } else if (request.request_type === 'delete_account') {
      if (action === 'approve') {
        await supabase.from('users').update({ is_active: false }).eq('id', request.tasker_id);
      }
    }

    // Notify the tasker
    const typeLabels = {
      kyc_submission: 'KYC verification',
      edit: 'KYC edit',
      delete_account: 'account deletion',
    };
    const label = typeLabels[request.request_type] || 'request';

    let notifTitle, notifMsg;
    if (request.request_type === 'kyc_submission') {
      if (action === 'approve') {
        notifTitle = 'KYC Approved — Enterprise Tasks Unlocked!';
        notifMsg = 'Your KYC documents have been verified. You can now receive and bid on enterprise tasks.';
      } else {
        notifTitle = 'KYC Submission Rejected';
        notifMsg = `Your KYC documents were not approved.${admin_note ? ` Reason: ${admin_note}` : ' Please re-upload correct documents and resubmit.'}`;
      }
    } else if (request.request_type === 'edit') {
      if (action === 'approve') {
        notifTitle = 'KYC Edit Approved';
        notifMsg = 'Your request to edit KYC documents was approved. Your documents have been cleared — please re-upload and resubmit for verification.';
      } else {
        notifTitle = 'KYC Edit Request Rejected';
        notifMsg = `Your KYC edit request was not approved.${admin_note ? ` Reason: ${admin_note}` : ''}`;
      }
    } else {
      notifTitle = `Account deletion request ${newStatus}`;
      notifMsg = action === 'approve'
        ? 'Your account deletion request was approved. Your account has been deactivated.'
        : `Your account deletion request was not approved.${admin_note ? ` Reason: ${admin_note}` : ''}`;
    }

    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: request.tasker_id,
        type: 'kyc_request_reviewed',
        title: notifTitle,
        message: notifMsg,
        data: { request_id: req.params.id, request_type: request.request_type },
        });
      } catch (_) {}
    })();

    // Send email for KYC submission decisions
    if (request.request_type === 'kyc_submission') {
      const { data: taskerUser } = await supabase
        .from('users').select('email, full_name').eq('id', request.tasker_id).maybeSingle();
      if (taskerUser?.email) {
        if (action === 'approve') {
          sendKYCApprovedEmail(taskerUser.email, taskerUser.full_name).catch(() => {});
        } else {
          sendKYCRejectedEmail(taskerUser.email, taskerUser.full_name, admin_note?.trim() || '').catch(() => {});
        }
      }
    }

    res.json({ success: true, message: `Request ${newStatus} successfully.` });
  } catch (err) {
    console.error('KYC request review error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not process this request. Please try again.' });
  }
});

// ─── GET /admin/analytics — site visitor analytics ────────────────
// ─── DELETE /admin/analytics/reset — truncate page view counts ────
router.delete('/analytics/reset', ...adminOnly, async (req, res) => {
  try {
    // site_analytics.id is BIGSERIAL (integer).
    // Supabase requires at least one filter on DELETE.
    // Use gte with epoch to match ALL rows (works even if table is empty).
    const { error } = await supabase
      .from('site_analytics')
      .delete()
      .gte('visited_at', '2000-01-01T00:00:00Z');
    if (error) throw error;
    res.json({ success: true, message: 'Analytics reset to 0' });
  } catch (err) {
    console.error('Analytics reset error:', err);
    res.status(500).json({ success: false, message: 'Could not reset analytics' });
  }
});

router.get('/analytics', ...adminOnly, async (req, res) => {
  try {
    const range = req.query.range || '7d';
    const days = range === '30d' ? 30 : range === '1d' ? 1 : 7;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: rows } = await supabase
      .from('site_analytics')
      .select('*')
      .gte('visited_at', since)
      .order('visited_at', { ascending: false });

    const events = rows || [];

    // Total views & unique sessions
    const totalViews = events.length;
    const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean)).size;

    // Views by country
    const byCountry = {};
    events.forEach(e => {
      const c = e.country || 'Unknown';
      byCountry[c] = (byCountry[c] || 0) + 1;
    });
    const countryCounts = Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([country, views]) => ({ country, views }));

    // Views by page
    const byPage = {};
    events.forEach(e => {
      const p = e.page || '/';
      byPage[p] = (byPage[p] || 0) + 1;
    });
    const pageCounts = Object.entries(byPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([page, views]) => ({ page, views }));

    // Views per day (last N days)
    const dailyMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }
    events.forEach(e => {
      const key = (e.visited_at || '').slice(0, 10);
      if (key in dailyMap) dailyMap[key]++;
    });
    const dailyViews = Object.entries(dailyMap).map(([date, views]) => ({ date, views }));

    // Recent raw events
    const recent = events.slice(0, 50).map(e => ({
      page: e.page,
      country: e.country || 'Unknown',
      city: e.city || '',
      visited_at: e.visited_at,
      referrer: e.referrer || '',
    }));

    res.json({
      success: true,
      range,
      summary: { totalViews, uniqueSessions },
      byCountry: countryCounts,
      byPage: pageCounts,
      dailyViews,
      recent,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to load analytics' });
  }
});

// ─── POST /admin/analytics/track — ingest a page view ─────────────
// Called from the frontend on every public page load (fire-and-forget)
router.post('/analytics/track', async (req, res) => {
  try {
    const { page, referrer, session_id } = req.body;
    if (!page) return res.status(400).json({ success: false });

    // Best-effort IP geolocation using ip-api.com (free, no key needed)
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '';

    let country = null;
    let city = null;

    // Skip localhost / private IPs
    const isPrivate = /^(::1|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip);
    if (!isPrivate && ip) {
      try {
        const http = require('http'); // ip-api.com is HTTP only
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 1500);
          http.get(`http://ip-api.com/json/${ip}?fields=country,city,status`, (r) => {
            let body = '';
            r.on('data', d => { body += d; });
            r.on('end', () => {
              clearTimeout(timer);
              try {
                const geo = JSON.parse(body);
                if (geo.status === 'success') {
                  country = geo.country || null;
                  city = geo.city || null;
                }
              } catch (_) {}
              resolve();
            });
          }).on('error', () => { clearTimeout(timer); resolve(); });
        });
      } catch (_) {}
    }

    await supabase.from('site_analytics').insert({
      page: page.slice(0, 500),
      referrer: (referrer || '').slice(0, 500),
      session_id: (session_id || '').slice(0, 100),
      ip_address: ip.slice(0, 45),
      country,
      city,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Track error:', err);
    res.status(500).json({ success: false });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SITE SETTINGS — generic key/value toggles for public-facing UI
// (currently: nav_show_browse_taskers, more can be added the same way)
// ═══════════════════════════════════════════════════════════════════

// ─── GET /admin/settings — all site settings ───────────────────────
router.get('/settings', ...adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, updated_at')
      .order('key');
    if (error) throw error;
    res.json({ success: true, settings: data || [] });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ─── PUT /admin/settings/:key — upsert a single setting ────────────
router.put('/settings/:key', ...adminOnly, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined || value === null)
      return res.status(400).json({ success: false, message: 'Missing value' });

    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;

    // Fire-and-forget audit log. target_id is UUID in the schema and a
    // setting key isn't one, so the key/value go in `details` instead.
    Promise.resolve(supabase.from('admin_audit_log').insert({
      admin_id: req.user.id,
      action: 'update_site_setting',
      target_type: 'site_setting',
      details: { key, value: String(value) },
    })).catch(() => {});

    res.json({ success: true, message: 'Setting updated' });
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
