// Task activity log — records events that leave no other trace in the database
// (tasker chosen/switched/declined, chat opened, task cancelled, deadline
// extended, earnings withdrawn). The admin timeline merges these with events
// read from bids, messages, payments, advances, proofs, reviews, etc.
// Best-effort: logging can never break or slow the action being logged.
const supabase = require('./supabase');

function logActivity(taskId, { actor, role, event, summary, details } = {}) {
  if (!taskId || !event || !summary) return Promise.resolve();
  return Promise.resolve(
    supabase.from('task_activity').insert({
      task_id: taskId,
      actor_id: actor?.id || null,
      actor_role: role || actor?.role || 'system',
      event,
      summary: String(summary).slice(0, 500),
      details: details || {},
    })
  ).then(({ error } = {}) => {
    if (error && !/task_activity/i.test(error.message || '')) console.warn('activity log warn:', error.message);
  }).catch(() => {});
}

module.exports = { logActivity };
