const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticate } = require('../middleware/auth');
const {
  submitReview,
  getPendingReviews,
  getReviewsForUser,
  roleOnTask,
  getPlatformFeedback,
} = require('../utils/reviews');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── GET /reviews/pending — reviews I still owe (compulsory) ───────
router.get('/pending', authenticate, async (req, res) => {
  try {
    const pending = await getPendingReviews(req.user.id);
    res.json({ success: true, pending });
  } catch (err) {
    console.error('Pending reviews error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load pending reviews.' });
  }
});

// ─── POST /reviews — submit a review { task_id, rating, comment } ──
router.post('/', authenticate, async (req, res) => {
  try {
    const taskId = req.body?.task_id;
    if (!taskId || !UUID_RE.test(String(taskId)))
      return res.status(400).json({ success: false, message: 'A valid task is required.' });
    const { status, body } = await submitReview({ taskId, user: req.user, body: req.body });
    res.status(status).json(body);
  } catch (err) {
    console.error('Submit review error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not submit your review. Please try again.' });
  }
});

// ─── GET /reviews/me — reviews I have received, in my current role ──
router.get('/me', authenticate, async (req, res) => {
  try {
    const as = req.query.as === 'requester' || req.query.as === 'tasker'
      ? req.query.as
      : (req.user.role === 'tasker' ? 'tasker' : 'requester');
    const data = await getReviewsForUser(req.user.id, as, { limit: 50 });
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('My reviews error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load your reviews.' });
  }
});

// ─── GET /reviews/user/:userId?as=tasker|requester ─────────────────
// Tasker reviews are public (shown on public profiles). Requester reviews
// are visible to signed-in users only (taskers deciding whether to bid).
router.get('/user/:userId', async (req, res, next) => {
  const as = req.query.as === 'requester' ? 'requester' : 'tasker';
  if (as === 'requester') return authenticate(req, res, next);
  next();
}, async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.userId))
      return res.status(400).json({ success: false, message: 'Invalid user.' });
    const as = req.query.as === 'requester' ? 'requester' : 'tasker';
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const data = await getReviewsForUser(req.params.userId, as, { limit, offset });
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('User reviews error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load reviews.' });
  }
});

// ─── GET /reviews/task/:taskId — both reviews on a task (participants only) ──
router.get('/task/:taskId', authenticate, async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.taskId))
      return res.status(400).json({ success: false, message: 'Invalid task.' });
    const { data: task, error } = await supabase.from('tasks')
      .select('id, status, requester_id, accepted_tasker_id')
      .eq('id', req.params.taskId).maybeSingle();
    if (error) throw error;
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    const role = roleOnTask(task, req.user.id);
    if (!role && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized.' });

    const { data: rows, error: rErr } = await supabase.from('ratings')
      .select('id, rating, comment, direction, rater_id, created_at')
      .eq('task_id', task.id);
    if (rErr) throw rErr;

    const mine = (rows || []).find(r => r.rater_id === req.user.id) || null;
    const theirs = (rows || []).find(r => r.rater_id !== req.user.id) || null;
    res.json({
      success: true,
      task_status: task.status,
      my_review: mine,
      // Only show what the other side wrote once you have written yours,
      // so neither review can be written in reaction to the other.
      their_review: mine ? theirs : null,
      their_review_submitted: !!theirs,
      my_platform_feedback: await getPlatformFeedback(task.id, req.user.id),
    });
  } catch (err) {
    console.error('Task reviews error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not load reviews.' });
  }
});

module.exports = router;
