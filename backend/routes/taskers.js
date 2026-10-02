const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { stripTaskSecrets } = require('../utils/sanitize');
const { displayName, getReviewsForUser } = require('../utils/reviews');
const { ensureProfileSlug, getProfileSlugs, findTaskerBySlug } = require('../utils/profileSlug');
const { applyLiveCompletedCounts } = require('../utils/taskerStats');

// Columns that are safe to show the public. tasker_profiles also holds ID
// documents, home address, bank details and admin notes — never select '*'
// for a public response.
const PUBLIC_TASKER_COLUMNS = 'id, user_id, bio, profile_picture_url, task_city, task_state, skills, rating_average, total_ratings, total_tasks_completed, is_available, country, enterprise_certified, enterprise_certified_at, created_at';
// Core columns from schema.sql — used if an optional column above is missing in a database.
const PUBLIC_TASKER_COLUMNS_CORE = 'id, user_id, bio, task_city, task_state, skills, rating_average, total_ratings, total_tasks_completed, is_available, created_at';
const { authenticate, requireRole, requireApprovedTasker } = require('../middleware/auth');
const { uploadKYC, uploadKYCBuffer } = require('../utils/cloudinary');
const { sendDirectApplicationEmail } = require('../utils/email');
const { resolveAccountNumber } = require('../utils/flutterwave');

const makeProfileSlug = (value = '') =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── GET /taskers — public listing of approved taskers ────────────
router.get('/', async (req, res) => {
  try {
    const { city, state, page = 1, limit = 20, search, sort = 'rating' } = req.query;
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const { parseCountry } = require('../utils/countries');
    const marketCode = req.query.country ? parseCountry(req.query.country) : 'NG';
    if (!marketCode) return res.status(400).json({ success: false, message: 'Unknown country' });
    let withMarket = true;
    const buildQuery = (columns) => {
      let q = supabase
        .from('tasker_profiles')
        .select(`
          ${columns},
          user:users!user_id(id, full_name, avatar_url, created_at${withMarket ? ', market' : ''})
        `, { count: 'exact' })
        .eq('verification_status', 'approved')
        .eq('is_available', true);
      if (city)  q = q.ilike('task_city',  `%${city.trim()}%`);
      if (state) q = q.ilike('task_state', `%${state.trim()}%`);
      return q.order(
        sort === 'tasks'  ? 'total_tasks_completed' :
        sort === 'newest' ? 'created_at' :
        'rating_average',
        { ascending: false, nullsFirst: false }
      );
    };

    // No DB-level search filter — we fetch all approved taskers and filter in memory
    // so that name searches (joined column) work correctly alongside bio/city/skill searches

    // ── Ordering: taskers WITH a bio always come before those without ──
    // Primary:  bio_has (nulls / empty bio → lower priority)
    // Secondary: chosen sort field
    // Supabase does not support computed column ordering directly, so we
    // fetch all matching rows (no range yet), sort in memory, then slice.
    // For large datasets use a DB view; for typical marketplace scale this is fine.
    let { data: all, error } = await buildQuery(PUBLIC_TASKER_COLUMNS);
    if (error && /market/i.test(error.message || '')) {
      withMarket = false; // INTERNATIONAL_MIGRATION.sql not run: everyone is in Nigeria
      ({ data: all, error } = await buildQuery(PUBLIC_TASKER_COLUMNS));
    }
    if (error && /column/i.test(error.message || '')) {
      console.warn('[taskers] optional column missing, using core columns:', error.message);
      ({ data: all, error } = await buildQuery(PUBLIC_TASKER_COLUMNS_CORE));
    }
    if (error) throw error;

    // Each country site lists only its own taskers.
    let result = (all || []).filter((t) => (t.user?.market || 'NG') === marketCode);

    // Filter by name/skill search (can't be done in Supabase filter easily for joined columns)
    if (search) {
      const s = search.trim().toLowerCase();
      result = result.filter(t =>
        t.user?.full_name?.toLowerCase().includes(s) ||
        t.bio?.toLowerCase().includes(s) ||
        t.task_city?.toLowerCase().includes(s) ||
        t.task_state?.toLowerCase().includes(s) ||
        t.skills?.some(sk => sk.toLowerCase().includes(s))
      );
    }

    // Sort: taskers with a non-empty bio first, then by chosen sort (already done by DB order above)
    result.sort((a, b) => {
      const aBio = a.bio && a.bio.trim().length > 0 ? 0 : 1;
      const bBio = b.bio && b.bio.trim().length > 0 ? 0 : 1;
      return aBio - bBio; // stable — keeps DB sort order within each group
    });

    // Live "tasks completed" (the cached column can be stale).
    await applyLiveCompletedCounts(result);
    if (sort === 'tasks') {
      result.sort((a, b) => (Number(b.total_tasks_completed) || 0) - (Number(a.total_tasks_completed) || 0));
      result.sort((a, b) => (a.bio && a.bio.trim() ? 0 : 1) - (b.bio && b.bio.trim() ? 0 : 1)); // bio-first stays
    }

    const total     = result.length;
    const paginated = result.slice(offset, offset + limitNum);

    // Attach each tasker's permanent profile link (/tasker/<slug>).
    const slugs = await getProfileSlugs(paginated.map(t => t.user_id));
    for (const t of paginated) {
      if (t.user) t.user.profile_slug = slugs.get(t.user_id) || null;
    }

    res.json({
      success: true,
      taskers: paginated,
      pagination: {
        total,
        page:  pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get taskers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch taskers' });
  }
});

// ─── GET /taskers/me/dashboard — tasker dashboard data ───────────
router.get('/me/dashboard', authenticate, async (req, res) => {
  try {
    const [profileRes, bidsRes, activeTasksRes, notifRes] = await Promise.all([
      supabase.from('tasker_profiles').select('*').eq('user_id', req.user.id).maybeSingle(),
      supabase
        .from('task_bids')
        .select('*, task:tasks(id, title, task_city, task_state, status, deadline)')
        .eq('tasker_id', req.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('tasks')
        .select('*, requester:users!requester_id(username, avatar_url, phone)')
        .eq('accepted_tasker_id', req.user.id)
        .in('status', ['ongoing'])
        .order('updated_at', { ascending: false }),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (profileRes.data) await applyLiveCompletedCounts([profileRes.data]);
    res.json({
      success: true,
      profile: profileRes.data,
      pending_bids: bidsRes.data || [],
      active_tasks: stripTaskSecrets(activeTasksRes.data || []),
      notifications: notifRes.data || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Dashboard fetch failed' });
  }
});

router.get('/me/kyc-requests', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { data } = await supabase
      .from('kyc_change_requests')
      .select('id, request_type, reason, status, admin_note, created_at')
      .eq('tasker_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    res.json({ success: true, requests: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch requests' });
  }
});

// ── GET /taskers/by-username/:username — look up by @username ────
router.get('/by-username/:username', async (req, res) => {
  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('username', req.params.username.toLowerCase())
      .maybeSingle();
    if (userErr || !user) return res.status(404).json({ success: false, message: 'Tasker not found' });
    // Reuse the /:userId logic by redirecting internally
    req.params.userId = user.id;
    // fall through to the next handler — but we can't do that easily, so just inline:
    return res.redirect(307, `/api/taskers/${user.id}`);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Resolve a profile link (/taskers/<id> or /tasker/<username-or-name-slug>) to
// the TASKER account's user id.
// Usernames and emails are unique per ROLE (idx_users_username_role,
// idx_users_email_role), so one person with both a requester and a tasker
// account has two users rows with the same username/email. Every lookup must
// therefore pick the role='tasker' row — the old username lookup matched both
// rows, errored, and every such profile showed "Tasker not found".
async function resolveTaskerUserId(rawParam) {
  const param = String(rawParam || '').trim();
  if (!param) return null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

  if (isUUID) {
    const { data: u, error } = await supabase.from('users').select('id, role, email').eq('id', param).maybeSingle();
    if (error) throw error;
    if (!u) return null;
    if (u.role === 'tasker') return u.id;
    // A requester-account id of someone who also has a tasker account → same email.
    if (!u.email) return null;
    const { data: t, error: tErr } = await supabase.from('users').select('id')
      .eq('email', u.email).eq('role', 'tasker').limit(1);
    if (tErr) throw tErr;
    return t?.[0]?.id || null;
  }

  const handle = param.toLowerCase().replace(/^@/, '');

  // 1. Permanent profile link (/tasker/emmanuel-uduebholo) — exact, unique.
  const bySlug = await findTaskerBySlug(handle);
  if (bySlug) return bySlug;

  // 2. Username (older links).
  const { data: byUsername, error: uErr } = await supabase.from('users').select('id')
    .eq('username', handle).eq('role', 'tasker').limit(1);
  if (uErr) throw uErr;
  if (byUsername?.[0]) return byUsername[0].id;

  // No username set → links use a slug of the full name ("funmi-ade-bello").
  const { data: taskerUsers, error: sErr } = await supabase.from('users')
    .select('id, full_name').eq('role', 'tasker').eq('is_active', true).limit(1000);
  if (sErr) throw sErr;
  return (taskerUsers || []).find(u => makeProfileSlug(u.full_name) === handle)?.id || null;
}

// ─── GET /taskers/me/profile-link — the signed-in tasker's own public link ──
router.get('/me/profile-link', authenticate, async (req, res) => {
  try {
    // Resolve to the TASKER account (a requester account of the same person maps by email).
    const taskerId = await resolveTaskerUserId(req.user.id);
    if (!taskerId) return res.status(404).json({ success: false, message: 'No tasker account found.' });
    const { data: tp } = await supabase.from('tasker_profiles')
      .select('verification_status').eq('user_id', taskerId).maybeSingle();
    const slug = await ensureProfileSlug(taskerId);
    res.json({
      success: true,
      slug,
      path: `/tasker/${slug || taskerId}`,
      is_public: tp?.verification_status === 'approved',
      message: tp?.verification_status === 'approved'
        ? 'Your profile is public.'
        : 'Your profile becomes public once Taskeeu approves your account.',
    });
  } catch (err) {
    console.error('Profile link error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load your profile link.' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const userId = await resolveTaskerUserId(req.params.userId);
    if (!userId) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Tasker not found' });

    const { data: profile, error } = await supabase
      .from('tasker_profiles')
      .select(`
        id, user_id, bio, task_city, task_state, task_address, skills,
        rating_average, total_ratings, total_tasks_completed, is_available,
        created_at, verification_status,
        user:users!user_id(id, full_name, avatar_url, created_at, username)
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!profile)
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Tasker not found' });
    if (profile.verification_status !== 'approved')
      return res.status(404).json({ success: false, code: 'NOT_APPROVED', message: 'This tasker profile will be public once the account is approved by Taskeeu.' });
    delete profile.verification_status;

    await applyLiveCompletedCounts([profile]);
    const profile_slug = await ensureProfileSlug(userId);
    if (profile.user) profile.user.profile_slug = profile_slug;

    // Recent reviews ABOUT this tasker (written by requesters). Reviews the
    // tasker wrote about requesters must never appear here.
    let reviews = [];
    {
      const { data, error: revErr } = await supabase
        .from('ratings')
        .select('rating, comment, created_at, rater:users!rater_id(full_name, username, avatar_url)')
        .eq('ratee_id', userId)
        .eq('direction', 'requester_to_tasker')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!revErr) {
        reviews = (data || []).map(r => ({
          rating: r.rating, comment: r.comment, created_at: r.created_at,
          reviewer_name: displayName(r.rater),
          requester: { username: r.rater?.username || null, avatar_url: r.rater?.avatar_url || null },
        }));
      } else {
        // REVIEWS_MIGRATION.sql not run yet → old single-direction table.
        const { data: old } = await supabase
          .from('ratings')
          .select('rating, comment, created_at, requester:users!requester_id(username, avatar_url)')
          .eq('tasker_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        reviews = old || [];
      }
    }

    // Get recent completed tasks (title only for privacy)
    const { data: recentTasks } = await supabase
      .from('tasks')
      .select('title, task_city, task_state, completed_at')
      .eq('accepted_tasker_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);

    // Star breakdown over ALL reviews (not just the 10 listed). Best-effort.
    let review_stats = null;
    try {
      const st = await getReviewsForUser(userId, 'tasker', { limit: 1 });
      review_stats = { average: st.average, count: st.count, distribution: st.distribution };
    } catch (_) {}

    res.json({ success: true, profile, reviews: reviews || [], review_stats, recentTasks: recentTasks || [] });
  } catch (err) {
    console.error('Tasker profile error:', err?.message);
    res.status(500).json({ success: false, message: 'Failed to fetch tasker profile' });
  }
});

// ─── PUT /taskers/me/task-address — tasker updates task city ──────
router.put('/me/task-address', authenticate, async (req, res) => {
  try {
    const { task_city, task_state, task_address, country } = req.body;
    if (!task_city || !task_state)
      return res.status(400).json({ success: false, message: 'City and state required' });

    // Update task location (don't include country here — schema cache issue)
    const updates = { task_city, task_state, task_address: task_address || null };
    await supabase.from('tasker_profiles').update(updates).eq('user_id', req.user.id);

    // Update country via RPC to bypass PostgREST schema cache
    if (country) {
      try {
        await supabase.rpc('set_user_country', { p_user_id: req.user.id, p_country: country.toUpperCase() });
      } catch (_e) {
        console.warn('Country update skipped (schema cache):', _e?.message);
      }
    }

    res.json({ success: true, message: 'Task address updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ─── PUT /taskers/me/availability ─────────────────────────────────
router.put('/me/availability', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'tasker') {
      return res.status(403).json({ success: false, message: 'Only taskers can update availability' });
    }
    const { is_available } = req.body;
    await supabase
      .from('tasker_profiles')
      .update({ is_available: Boolean(is_available) })
      .eq('user_id', req.user.id);

    res.json({ success: true, message: `You are now ${is_available ? 'available' : 'unavailable'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ─── PUT /taskers/me/bank-details ─────────────────────────────────
router.put('/me/bank-details', authenticate, async (req, res) => {
  try {
    const { bank_name, bank_code, bank_account_number, country } = req.body;
    if (!bank_name || !bank_code || !bank_account_number)
      return res.status(400).json({ success: false, message: 'Bank, bank code, and account number are required' });

    // Never trust a client-supplied account name. Re-resolve the account
    // server-side with the bank provider so the saved name always matches
    // the real account holder — no manual self-reported names.
    let resolved;
    try {
      resolved = await resolveAccountNumber(
        bank_account_number,
        bank_code,
        (country || 'NG').toUpperCase()
      );
    } catch (err) {
      console.error('Bank verification failed on save:', err?.message);
      const status = err?.code === 'BANK_PROVIDER_UNAVAILABLE' ? 503 : 400;
      return res.status(status).json({
        success: false,
        message: err?.message || 'Could not verify this account. Please check the details and try again.',
      });
    }

    const baseBankPayload = {
      bank_name,
      bank_account_number,
      bank_account_name: resolved.account_name,
    };

    if (req.user.role === 'tasker') {
      await supabase.from('tasker_profiles').update(baseBankPayload).eq('user_id', req.user.id);
    } else {
      await supabase.from('requester_profiles').update(baseBankPayload).eq('user_id', req.user.id);
    }

    // bank_code is ALTER TABLE col — update via RPC
    if (bank_code) {
      try { await supabase.rpc('set_bank_code', {
        p_user_id: req.user.id,
        p_role: req.user.role,
        p_bank_code: bank_code,
      }); } catch(e) { console.warn('set_bank_code warn:', e?.message); }
    }

    res.json({ success: true, message: 'Bank details verified and updated', account_name: resolved.account_name });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ─── PUT /taskers/me/payout-details — international bank details ──
// Nigeria keeps /me/bank-details (Flutterwave account lookup). Other markets
// store local bank fields (sort code, BSB, routing number ...) that the
// Taskeeu team uses to pay withdrawals from the payout queue.
router.put('/me/payout-details', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { getCountry, validatePayoutDetails } = require('../utils/countries');
    const market = getCountry(req.user.market);
    if (market.code === 'NG') return res.status(400).json({ success: false, message: 'Use your Nigerian bank account details.' });
    const v = validatePayoutDetails(market.code, req.body || {});
    if (!v.ok) return res.status(400).json({ success: false, message: v.errors[0], errors: v.errors });
    const { error } = await supabase.from('tasker_profiles')
      .update({ payout_details: v.clean, bank_name: v.clean.bank_name || null, bank_account_name: v.clean.account_holder })
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: 'Bank details saved', payout_details: v.clean });
  } catch (err) {
    console.error('Payout details error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not save bank details. Please try again.' });
  }
});

// ─── GET /taskers/me/payouts — international withdrawal history ──
router.get('/me/payouts', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('payout_requests')
      .select('id, amount, currency, kind, reference, status, admin_note, created_at, processed_at')
      .eq('tasker_id', req.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) return res.json({ success: true, payouts: [] });
    res.json({ success: true, payouts: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load payouts.' });
  }
});

// ─── PUT /taskers/me/profile ───────────────────────────────────────
router.put('/me/profile', authenticate, async (req, res) => {
  try {
    const allowed = ['bio', 'skills', 'home_address', 'office_address', 'profile_picture_url'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await supabase.from('tasker_profiles').update(updates).eq('user_id', req.user.id);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ─── POST /taskers/:userId/apply — requester applies directly ─────
router.post('/me/kyc-request', authenticate, requireRole('tasker'), async (req, res) => {
  try {
    const { request_type, reason } = req.body;
    if (!['edit', 'delete_account'].includes(request_type))
      return res.status(400).json({ success: false, message: 'Invalid request type' });
    if (!reason || reason.trim().length < 20)
      return res.status(400).json({ success: false, message: 'Please provide a reason (at least 20 characters)' });

    // Check no pending request of same type already exists
    const { data: existing } = await supabase
      .from('kyc_change_requests')
      .select('id')
      .eq('tasker_id', req.user.id)
      .eq('request_type', request_type)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing)
      return res.status(409).json({ success: false, message: `You already have a pending ${request_type === 'edit' ? 'edit' : 'account deletion'} request. Wait for admin review.` });

    const { data, error } = await supabase.from('kyc_change_requests').insert({
      tasker_id: req.user.id,
      request_type,
      reason: reason.trim(),
    }).select().maybeSingle();
    if (error) throw error;

    // Notify admin
    const { data: admin } = await supabase.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
    if (admin) {
      (async () => {
        try {
          await supabase.from('notifications').insert({
          user_id: admin.id,
          type: 'kyc_change_request',
          title: `KYC ${request_type === 'edit' ? 'Edit' : 'Account Deletion'} Request`,
          message: `${req.user.full_name} requested ${request_type === 'edit' ? 'to edit their KYC documents' : 'account deletion'}`,
          data: { request_id: data.id, tasker_id: req.user.id },
          action_url: `/admin?tab=kyc-requests`,
          });
        } catch (_) {}
      })();
    }

    res.json({ success: true, message: 'Request submitted. Our team will review within 24–48 hours.' });
  } catch (err) {
    console.error('KYC request error:', err);
    res.status(500).json({ success: false, message: 'Could not submit request' });
  }
});

router.post('/:userId/apply', authenticate, requireRole('requester'), async (req, res) => {
  try {
    const { task_description, task_city, task_state, deadline, budget } = req.body;
    if (!task_description)
      return res.status(400).json({ success: false, message: 'Task description required' });

    // Check tasker exists and is approved
    const { data: tasker } = await supabase
      .from('tasker_profiles')
      .select('verification_status, user_id, user:users!user_id(email, full_name)')
      .eq('user_id', req.params.userId)
      .maybeSingle();

    if (!tasker || tasker.verification_status !== 'approved')
      return res.status(404).json({ success: false, message: 'Tasker not available' });
    {
      const { data: tu } = await supabase.from('users').select('*').eq('id', req.params.userId).maybeSingle();
      if ((tu?.market || 'NG') !== (req.user.market || 'NG'))
        return res.status(403).json({ success: false, code: 'WRONG_COUNTRY', message: 'This tasker works in a different country. Choose a tasker in your own country.' });
    }

    const { data: application, error } = await supabase
      .from('direct_applications')
      .insert({
        requester_id: req.user.id,
        tasker_id: req.params.userId,
        task_description,
        task_city,
        task_state,
        deadline: deadline || null,
        budget: budget || null,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    // Create chat room directly
    const { data: chatRoom } = await supabase
      .from('chat_rooms')
      .insert({
        requester_id: req.user.id,
        tasker_id: req.params.userId,
      })
      .select()
      .single();

    // Notify tasker
    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: req.params.userId,
        type: 'direct_application',
        title: 'Direct Task Request',
        message: `${req.user.full_name} wants to hire you directly`,
        data: { application_id: application.id, chat_room_id: chatRoom?.id },
        action_url: `/tasker/dashboard`,
        });
      } catch (_) {}
    })();

    try {
      await sendDirectApplicationEmail(
      tasker.user.email,
      tasker.user.full_name,
      req.user.full_name,
      task_description
      );
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'Application sent! You can now chat.',
      chat_room_id: chatRoom?.id,
    });
  } catch (err) {
    console.error('Direct apply error:', err);
    res.status(500).json({ success: false, message: 'Application failed' });
  }
});

// ─── GET /taskers/me/dashboard — tasker dashboard data ───────────

// ─── POST /taskers/me/kyc — submit KYC docs for admin review ──────

router.post(
  '/me/kyc',
  authenticate,
  requireRole('tasker'),
  uploadKYC.fields([
    { name: 'national_id',      maxCount: 1 },
    { name: 'driver_license',   maxCount: 1 },
    { name: 'passport',         maxCount: 1 },
    { name: 'proof_of_address', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Block if already pending review
      const { data: existingPending } = await supabase
        .from('kyc_change_requests')
        .select('id')
        .eq('tasker_id', req.user.id)
        .eq('request_type', 'kyc_submission')
        .eq('status', 'pending')
        .maybeSingle();

      if (existingPending)
        return res.status(409).json({
          success: false,
          message: 'You already have a KYC submission pending admin review. Please wait for the outcome before submitting again.',
        });

      const uploadDoc = async (fieldName) => {
        const file = req.files?.[fieldName]?.[0];
        if (!file?.buffer) return undefined;
        try {
          const result = await uploadKYCBuffer(file.buffer);
          return result.secure_url;
        } catch (err) {
          console.error(`KYC upload failed for ${fieldName}:`, err?.message);
          return undefined;
        }
      };

      const [national_id_url, driver_license_url, passport_url, proof_of_address_url] =
        await Promise.all([
          uploadDoc('national_id'),
          uploadDoc('driver_license'),
          uploadDoc('passport'),
          uploadDoc('proof_of_address'),
        ]);

      const { home_address, linkedin_url, resume_url } = req.body;

      // Get existing profile to merge
      const { data: existingProfile } = await supabase
        .from('tasker_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .maybeSingle();

      const mergedId    = national_id_url     || driver_license_url   || passport_url     || existingProfile?.national_id_url || existingProfile?.driver_license_url || existingProfile?.passport_url;
      const mergedPoa   = proof_of_address_url || existingProfile?.proof_of_address_url;

      if (!mergedId)
        return res.status(400).json({ success: false, message: "Upload at least one ID document (National ID, Driver's License, or Passport)" });
      if (!mergedPoa)
        return res.status(400).json({ success: false, message: 'Upload a Proof of Address document (utility bill or bank statement)' });

      // Save contact details immediately — no review needed
      // Separate original-schema cols from ALTER TABLE cols
      // Original schema: home_address, national_id_url, driver_license_url, passport_url, proof_of_address_url
      // ALTER TABLE: linkedin_url, resume_url, kyc_submission_status, kyc_complete
      const safeDocUpdates = { updated_at: new Date().toISOString() };
      if (home_address)         safeDocUpdates.home_address         = home_address;
      if (national_id_url)      safeDocUpdates.national_id_url      = national_id_url;
      if (driver_license_url)   safeDocUpdates.driver_license_url   = driver_license_url;
      if (passport_url)         safeDocUpdates.passport_url         = passport_url;
      if (proof_of_address_url) safeDocUpdates.proof_of_address_url = proof_of_address_url;

      await supabase.from('tasker_profiles').update(safeDocUpdates).eq('user_id', req.user.id);

      // Update ALTER TABLE cols via RPC
      try { await supabase.rpc('set_kyc_submission_pending', {
        p_user_id: req.user.id,
        p_linkedin_url: linkedin_url || null,
        p_resume_url: resume_url || null,
      }); } catch(e) { console.warn('set_kyc_submission_pending warn:', e?.message); }

      // Create kyc_submission request so admin can review
      const { data: kycReq, error: reqErr } = await supabase
        .from('kyc_change_requests')
        .insert({
          tasker_id: req.user.id,
          request_type: 'kyc_submission',
          reason: 'KYC documents submitted for enterprise task access verification',
          national_id_url:      national_id_url      || existingProfile?.national_id_url      || null,
          driver_license_url:   driver_license_url   || existingProfile?.driver_license_url   || null,
          passport_url:         passport_url         || existingProfile?.passport_url         || null,
          proof_of_address_url: proof_of_address_url || existingProfile?.proof_of_address_url || null,
          home_address: home_address || null,
          social_url:   linkedin_url || null,
        })
        .select()
        .maybeSingle();

      if (reqErr) throw reqErr;

      // Notify admin
      const { data: admin } = await supabase.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
      if (admin) {
        (async () => {
          try {
            await supabase.from('notifications').insert({
            user_id: admin.id,
            type: 'kyc_submission',
            title: 'New KYC Submission for Review',
            message: `${req.user.full_name} submitted KYC documents for enterprise task eligibility`,
            data: { request_id: kycReq.id, tasker_id: req.user.id },
            action_url: `/admin?tab=kyc-requests`,
            });
          } catch (_) {}
        })();
      }

      res.json({
        success: true,
        message: 'KYC documents submitted for review. You will be notified within 24–48 hours.',
        submission_status: 'pending_review',
      });
    } catch (err) {
      console.error('KYC submit error:', err?.message);
      res.status(500).json({ success: false, message: 'Could not submit KYC documents. Please try again.' });
    }
  }
);

// ─── POST /taskers/me/kyc-request — request edit or account deletion ─

// ─── GET /taskers/me/kyc-requests — get my pending requests ───────

module.exports = router;
