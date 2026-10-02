// Live "tasks completed" counts, computed from the tasks table itself.
//
// tasker_profiles.total_tasks_completed is only a cached copy. It was left at 0
// for tasks completed before the completion-code fix (the old code wrote a
// query object into it), so every screen now uses the live count, and any
// cached value that disagrees is quietly corrected.
const supabase = require('./supabase');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Map tasker user id → number of completed tasks. Never throws (empty map on failure). */
async function getCompletedCounts(taskerIds) {
  const ids = [...new Set((taskerIds || []).filter((x) => x && UUID_RE.test(x)))];
  const counts = new Map(ids.map((id) => [id, 0]));
  if (!ids.length) return counts;
  try {
    // Page through results so large histories are counted fully.
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase.from('tasks')
        .select('accepted_tasker_id')
        .in('accepted_tasker_id', ids)
        .eq('status', 'completed')
        .range(from, from + PAGE - 1);
      if (error) return new Map();
      for (const r of data || []) counts.set(r.accepted_tasker_id, (counts.get(r.accepted_tasker_id) || 0) + 1);
      if (!data || data.length < PAGE) break;
    }
  } catch (_) { return new Map(); }
  return counts;
}

/**
 * Replace total_tasks_completed on profile objects with the live count and fix
 * the cached column where it is wrong (fire-and-forget).
 * @param {Array<object>} profiles objects with user_id + total_tasks_completed
 */
async function applyLiveCompletedCounts(profiles, idOf = (p) => p?.user_id) {
  const list = (profiles || []).filter(Boolean);
  if (!list.length) return list;
  const counts = await getCompletedCounts(list.map(idOf));
  if (!counts.size) return list; // lookup failed — keep cached values
  for (const p of list) {
    const id = idOf(p);
    if (!counts.has(id)) continue;
    const live = counts.get(id);
    if (Number(p.total_tasks_completed) !== live) {
      Promise.resolve(supabase.from('tasker_profiles').update({ total_tasks_completed: live }).eq('user_id', id)).catch(() => {});
    }
    p.total_tasks_completed = live;
  }
  return list;
}

module.exports = { getCompletedCounts, applyLiveCompletedCounts };
