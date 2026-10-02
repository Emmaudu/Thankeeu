// Tell every tasker who bid on a task (except excludeTaskerId) that it was
// cancelled: in-app notification + email, once per tasker. Runs in the
// background and never throws. `by` = 'requester' | 'admin' (wording only).
const supabase = require('./supabase');
const { sendTaskCancelledToBidderEmail } = require('./email');

async function notifyBiddersOfCancellation(taskId, title, excludeTaskerId = null, by = 'requester') {
  try {
    let q = supabase.from('task_bids')
      .select('tasker_id, tasker:users!tasker_id(email, full_name)')
      .eq('task_id', taskId);
    if (excludeTaskerId) q = q.neq('tasker_id', excludeTaskerId);
    const { data: bidders, error } = await q;
    if (error || !bidders?.length) return;
    const seen = new Set();
    for (const b of bidders) {
      if (seen.has(b.tasker_id)) continue;
      seen.add(b.tasker_id);
      await Promise.resolve(supabase.from('notifications').insert({
        user_id: b.tasker_id,
        type: 'task_cancelled',
        title: 'Task cancelled',
        message: `${by === 'admin' ? 'Taskeeu' : 'The requester'} cancelled "${title}", which you bid on. It is no longer available.`,
        data: { task_id: taskId },
        action_url: '/tasker?tab=bids',
      })).catch(() => {});
      if (b.tasker?.email) {
        try { await sendTaskCancelledToBidderEmail(b.tasker.email, b.tasker.full_name, title, by); }
        catch (e) { console.warn('cancel email warn:', e?.message); }
      }
    }
  } catch (e) {
    console.warn('notifyBiddersOfCancellation warn:', e?.message);
  }
}

module.exports = { notifyBiddersOfCancellation };
