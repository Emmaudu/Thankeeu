// Task price breakdown → one total.
// Workmanship is required; transport, waybill and items are optional.
// The total is stored in budget_min and budget_max so every existing screen
// shows one sum. Old clients that only send budget_min/budget_max still work.
const FIELDS = ['cost_workmanship', 'cost_transport', 'cost_waybill', 'cost_items'];
const MAX = 100000000; // ₦100m sanity cap per field

function parseAmount(v) {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(String(v).replace(/[,\s₦$£€]/g, ''));
  return n;
}

/**
 * @param body request body
 * @param {object|null} current existing task (for edits) or null (new task)
 * @returns {{ error?: string, fields?: object }} fields to store, or {} when no cost fields were sent
 */
function readTaskCosts(body, current = null, opts = {}) {
  const minWork = opts.min ?? 100;
  const minLabel = opts.minLabel || `₦${minWork}`;
  const sent = FIELDS.some((k) => body?.[k] !== undefined);
  if (!sent) return {};
  const values = {};
  for (const k of FIELDS) {
    const raw = body[k] !== undefined ? body[k] : current?.[k];
    const n = parseAmount(raw);
    if (!Number.isFinite(n) || n < 0) return { error: 'Costs must be positive numbers.' };
    if (n > MAX) return { error: 'One of the costs is too large.' };
    values[k] = Math.round(n * 100) / 100;
  }
  if (values.cost_workmanship < minWork) return { error: `Workmanship is required (at least ${minLabel}).` };
  const total = Math.round(FIELDS.reduce((s, k) => s + values[k], 0) * 100) / 100;
  return {
    fields: {
      ...values,
      cost_transport: values.cost_transport || null,
      cost_waybill: values.cost_waybill || null,
      cost_items: values.cost_items || null,
      budget_min: total,
      budget_max: total,
    },
  };
}

module.exports = { readTaskCosts, COST_FIELDS: FIELDS };
