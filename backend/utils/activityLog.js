const supabase = require('./supabase');

/**
 * Log an action to the activity_logs table.
 * @param {object} opts
 *   company_id, actor_id, actor_type ('hr'|'core_team'|'member'), actor_name,
 *   action (string), entity_type, entity_id, entity_name, details (object)
 */
const logActivity = async (opts) => {
  try {
    await supabase.from('activity_logs').insert({
      company_id:  opts.company_id,
      actor_id:    String(opts.actor_id),
      actor_type:  opts.actor_type || 'hr',
      actor_name:  opts.actor_name || 'Unknown',
      action:      opts.action,
      entity_type: opts.entity_type || null,
      entity_id:   opts.entity_id   ? String(opts.entity_id) : null,
      entity_name: opts.entity_name || null,
      details:     opts.details     || null,
    });
  } catch (err) {
    // Never crash the main flow
    console.error('activityLog error:', err.message);
  }
};

module.exports = { logActivity };
