// Removes fields that must never reach a tasker or the public.
// completion_code is the requester's secret: whoever knows it can mark the
// task complete and unlock the escrow payout. Only the requester receives it
// (from POST /tasks/:id/generate-code and by email).
const TASK_SECRET_FIELDS = ['completion_code'];

function stripTaskSecrets(value) {
  if (Array.isArray(value)) return value.map(stripTaskSecrets);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (TASK_SECRET_FIELDS.includes(k)) continue;
      out[k] = (v && typeof v === 'object') ? stripTaskSecrets(v) : v;
    }
    return out;
  }
  return value;
}

module.exports = { stripTaskSecrets };
