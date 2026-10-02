// ═══════════════════════════════════════════════════════════════════════
// Two-way reviews — single source of truth
//
// • Requester reviews the tasker, tasker reviews the requester.
// • 1–5 whole stars + a comment of 10–1000 characters, both required.
// • One review per person per task (DB: UNIQUE(task_id, rater_id)).
// • Compulsory for tasks with review_required = true (set when a task is
//   completed). While a review is owed, the user cannot post/accept/hire
//   (requester) or bid (tasker) — see requireNoPendingReviews.
// • Reviews are final once submitted (no edits), so ratings can't be
//   changed later to retaliate.
// ═══════════════════════════════════════════════════════════════════════
const supabase = require('./supabase');

const DIRECTION = {
  REQ_TO_TASKER: 'requester_to_tasker',
  TASKER_TO_REQ: 'tasker_to_requester',
};
const COMMENT_MIN = 10;
const COMMENT_MAX = 1000;

// The global sanitizer HTML-escapes request text ("<3" → "&lt;3"). Reviews are
// stored as plain text and React escapes on render, so decode back to what the
// user typed. (Review text is never inserted into HTML emails.)
function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

function validateReviewInput(body) {
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: 'Please choose a star rating from 1 to 5.' };
  const comment = decodeEntities(body?.comment ?? '').replace(/\s+/g, ' ').trim();
  if (comment.length < COMMENT_MIN)
    return { error: `Please write a short comment (at least ${COMMENT_MIN} characters).` };
  if (comment.length > COMMENT_MAX)
    return { error: `Your comment is too long (maximum ${COMMENT_MAX} characters).` };
  return { rating, comment };
}

/** Number of proof-of-work files on a task (0 if the table doesn't exist yet). */
async function countProofs(taskId) {
  const { count, error } = await supabase.from('task_proofs')
    .select('id', { count: 'exact', head: true }).eq('task_id', taskId);
  if (error) return /task_proofs/i.test(error.message || '') ? 1 : 0; // migration not run → don't block
  return count || 0;
}

function validatePlatformInput(body, required) {
  const raw = body?.platform_rating;
  if (raw === undefined || raw === null || raw === '') {
    return required ? { error: 'Please rate Taskeeu (1 to 5 stars).' } : { value: null };
  }
  const rating = Number(raw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Please rate Taskeeu from 1 to 5 stars.' };
  const comment = decodeEntities(body?.platform_comment ?? '').replace(/\s+/g, ' ').trim();
  if (comment.length > COMMENT_MAX) return { error: `Your Taskeeu feedback is too long (maximum ${COMMENT_MAX} characters).` };
  return { value: { rating, comment: comment || null } };
}

async function savePlatformFeedback(taskId, userId, role, { rating, comment }) {
  const { error } = await supabase.from('platform_feedback')
    .insert({ task_id: taskId, user_id: userId, role, rating, comment });
  if (error && error.code !== '23505' && !/platform_feedback/i.test(error.message || ''))
    console.warn('platform feedback warn:', error.message);
}

async function getPlatformFeedback(taskId, userId) {
  const { data, error } = await supabase.from('platform_feedback')
    .select('rating, comment, created_at').eq('task_id', taskId).eq('user_id', userId).maybeSingle();
  return error ? null : data;
}

/** Which side of this task is the user on? */
function roleOnTask(task, userId) {
  if (!task || !userId) return null;
  if (task.requester_id === userId && task.accepted_tasker_id === userId) return null; // never review yourself
  if (task.requester_id === userId) return 'requester';
  if (task.accepted_tasker_id === userId) return 'tasker';
  return null;
}

/** Recompute a user's average for one direction and store it on their profile. */
async function recomputeAggregates(rateeId, direction) {
  const { data, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('ratee_id', rateeId)
    .eq('direction', direction);
  if (error) throw error;
  const count = (data || []).length;
  const avg = count ? Math.round((data.reduce((s, r) => s + Number(r.rating), 0) / count) * 100) / 100 : 0;

  if (direction === DIRECTION.REQ_TO_TASKER) {
    const { error: e } = await supabase.from('tasker_profiles')
      .update({ rating_average: avg, total_ratings: count })
      .eq('user_id', rateeId);
    if (e) throw e;
  } else {
    // A requester may not have a requester_profiles row yet (e.g. older accounts).
    const { data: rows, error: e1 } = await supabase.from('requester_profiles')
      .update({ rating_average: avg, total_ratings: count })
      .eq('user_id', rateeId)
      .select('id');
    if (e1) throw e1;
    if (!rows?.length) {
      const { error: e2 } = await supabase.from('requester_profiles')
        .insert({ user_id: rateeId, rating_average: avg, total_ratings: count });
      if (e2 && e2.code !== '23505') throw e2;
      if (e2?.code === '23505') {
        await supabase.from('requester_profiles')
          .update({ rating_average: avg, total_ratings: count }).eq('user_id', rateeId);
      }
    }
  }
  return { average: avg, count };
}

/**
 * Submit a review for a task. Idempotent: submitting again returns the
 * existing review with { already: true } instead of an error.
 * @returns {{status:number, body:object}}
 */
async function submitReview({ taskId, user, body }) {
  const input = validateReviewInput(body);
  if (input.error) return { status: 400, body: { success: false, message: input.error } };

  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .select('id, title, status, requester_id, accepted_tasker_id')
    .eq('id', taskId)
    .maybeSingle();
  if (taskErr) throw taskErr;
  if (!task) return { status: 404, body: { success: false, message: 'Task not found.' } };

  const role = roleOnTask(task, user.id);
  if (!role) return { status: 403, body: { success: false, message: 'Only the requester and the tasker on this task can review it.' } };

  // Requester: after completion. Tasker: this is step 2 of their completion
  // flow — allowed while the task is ongoing once proof of work is uploaded
  // (or after completion, for older tasks).
  // Requester: required BEFORE the completion code is released (task ongoing),
  // or afterwards for tasks completed before this rule.
  if (role === 'requester' && !['ongoing', 'completed'].includes(task.status))
    return { status: 400, body: { success: false, message: `This task is ${task.status}, so it can't be reviewed.` } };
  if (role === 'tasker') {
    if (!['ongoing', 'completed'].includes(task.status))
      return { status: 400, body: { success: false, message: `This task is ${task.status}, so it can't be reviewed.` } };
    if (task.status === 'ongoing') {
      const proofs = await countProofs(taskId);
      if (proofs === 0)
        return { status: 400, body: { success: false, message: 'Upload at least one proof of work first (step 1), then review the requester.' } };
    }
  }

  // Platform rating (required for the tasker's step 2, optional otherwise).
  const platform = validatePlatformInput(body, true); // Taskeeu rating is compulsory with every review (both sides)
  if (platform.error) return { status: 400, body: { success: false, message: platform.error } };

  const direction = role === 'requester' ? DIRECTION.REQ_TO_TASKER : DIRECTION.TASKER_TO_REQ;
  const rateeId = role === 'requester' ? task.accepted_tasker_id : task.requester_id;
  if (!rateeId) return { status: 400, body: { success: false, message: 'This task has no one to review.' } };

  const existing = async () => {
    const { data } = await supabase.from('ratings')
      .select('id, rating, comment, direction, created_at')
      .eq('task_id', taskId).eq('rater_id', user.id).maybeSingle();
    return data;
  };

  const prior = await existing();
  if (prior) {
    if (platform.value) await savePlatformFeedback(taskId, user.id, role, platform.value);
    return { status: 200, body: { success: true, already: true, review: prior, message: 'You have already reviewed this task. Thank you!' } };
  }

  const { data: inserted, error } = await supabase.from('ratings')
    .insert({
      task_id: taskId,
      requester_id: task.requester_id,      // kept for older queries / account deletion
      tasker_id: task.accepted_tasker_id,
      rater_id: user.id,
      ratee_id: rateeId,
      direction,
      rating: input.rating,
      comment: input.comment,
    })
    .select('id, rating, comment, direction, created_at')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') { // double click / concurrent submit
      return { status: 200, body: { success: true, already: true, review: await existing(), message: 'You have already reviewed this task. Thank you!' } };
    }
    throw error;
  }

  if (platform.value) await savePlatformFeedback(taskId, user.id, role, platform.value);

  let aggregates = null;
  try { aggregates = await recomputeAggregates(rateeId, direction); }
  catch (e) { console.error('Review aggregate update error:', e?.message); }

  Promise.resolve(supabase.from('notifications').insert({
    user_id: rateeId,
    type: 'review_received',
    title: `⭐ You received a ${input.rating}-star review`,
    message: `${user.full_name || (role === 'requester' ? 'Your requester' : 'Your tasker')} reviewed you for "${task.title}".`,
    data: { task_id: taskId, rating: input.rating },
    action_url: role === 'requester' ? '/tasker?tab=profile' : '/requester?tab=profile',
  })).catch(() => {});

  return {
    status: 201,
    body: { success: true, review: inserted, aggregates, message: 'Thank you! Your review has been submitted.' },
  };
}

/** Completed tasks where this user still owes a compulsory review. */
async function getPendingReviews(userId) {
  const [asRequester, asTasker] = await Promise.all([
    supabase.from('tasks')
      .select('id, title, completed_at, requester_id, accepted_tasker_id, counterpart:users!accepted_tasker_id(id, full_name, username, avatar_url)')
      .eq('requester_id', userId).eq('status', 'completed').eq('review_required', true)
      .not('accepted_tasker_id', 'is', null),
    supabase.from('tasks')
      .select('id, title, completed_at, requester_id, accepted_tasker_id, counterpart:users!requester_id(id, full_name, username, avatar_url)')
      .eq('accepted_tasker_id', userId).eq('status', 'completed').eq('review_required', true),
  ]);
  if (asRequester.error) throw asRequester.error;
  if (asTasker.error) throw asTasker.error;

  const tasks = [
    ...(asRequester.data || []).map(t => ({ ...t, you_review: 'tasker' })),
    ...(asTasker.data || []).filter(t => t.requester_id !== userId).map(t => ({ ...t, you_review: 'requester' })),
  ];
  if (!tasks.length) return [];

  const { data: mine, error } = await supabase.from('ratings')
    .select('task_id').eq('rater_id', userId).in('task_id', tasks.map(t => t.id));
  if (error) throw error;
  const done = new Set((mine || []).map(r => r.task_id));

  return tasks
    .filter(t => !done.has(t.id))
    .sort((a, b) => new Date(a.completed_at || 0) - new Date(b.completed_at || 0))
    .map(t => ({
      task_id: t.id,
      title: t.title,
      completed_at: t.completed_at,
      you_review: t.you_review,                       // 'tasker' | 'requester'
      counterpart: t.counterpart ? {
        id: t.counterpart.id,
        name: t.counterpart.full_name || (t.counterpart.username ? '@' + t.counterpart.username : ''),
        avatar_url: t.counterpart.avatar_url || null,
      } : null,
    }));
}

/** Express middleware: block the next big action while a review is owed. */
function requireNoPendingReviews(req, res, next) {
  if (!req.user || req.user.role === 'admin') return next();
  getPendingReviews(req.user.id)
    .then((pending) => {
      if (!pending.length) return next();
      res.status(403).json({
        success: false,
        code: 'REVIEW_REQUIRED',
        pending,
        message: `Please review your completed task "${pending[0].title}" first. Reviews are required after every completed task.`,
      });
    })
    .catch((err) => {
      // Never lock users out because of a lookup failure.
      console.error('Pending review check failed:', err?.message);
      next();
    });
}

/** Reviews a user has RECEIVED in one role, with full-distribution stats. */
async function getReviewsForUser(userId, as, { limit = 20, offset = 0 } = {}) {
  const direction = as === 'requester' ? DIRECTION.TASKER_TO_REQ : DIRECTION.REQ_TO_TASKER;
  const [listRes, allRes] = await Promise.all([
    supabase.from('ratings')
      .select('id, rating, comment, created_at, task:tasks(title), rater:users!rater_id(id, full_name, username, avatar_url)')
      .eq('ratee_id', userId).eq('direction', direction)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    supabase.from('ratings').select('rating').eq('ratee_id', userId).eq('direction', direction),
  ]);
  if (listRes.error) throw listRes.error;
  if (allRes.error) throw allRes.error;

  const all = allRes.data || [];
  const count = all.length;
  const average = count ? Math.round((all.reduce((s, r) => s + Number(r.rating), 0) / count) * 100) / 100 : 0;
  const distribution = [5, 4, 3, 2, 1].map(star => ({ star, count: all.filter(r => Number(r.rating) === star).length }));

  return {
    as: as === 'requester' ? 'requester' : 'tasker',
    average, count, distribution,
    reviews: (listRes.data || []).map(r => ({
      id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at,
      task_title: r.task?.title || null,
      // Public display: first name + last initial, or @username.
      reviewer: {
        name: displayName(r.rater),
        avatar_url: r.rater?.avatar_url || null,
      },
    })),
  };
}

function displayName(u) {
  if (!u) return 'Taskeeu user';
  if (u.full_name) {
    const parts = u.full_name.trim().split(/\s+/);
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
  }
  return u.username ? '@' + u.username : 'Taskeeu user';
}

module.exports = {
  DIRECTION,
  COMMENT_MIN,
  COMMENT_MAX,
  validateReviewInput,
  roleOnTask,
  recomputeAggregates,
  submitReview,
  getPendingReviews,
  requireNoPendingReviews,
  getReviewsForUser,
  displayName,
  countProofs,
  getPlatformFeedback,
};
