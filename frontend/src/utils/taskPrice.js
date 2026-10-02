import { money } from './market';
// One price per task. New tasks store the sum of their cost breakdown in both
// budget_min and budget_max; older tasks may have a range, in which case the
// higher figure is shown (what the requester said they would pay at most).
export const COST_KEYS = ['cost_workmanship', 'cost_transport', 'cost_waybill', 'cost_items'];

export const costNumber = (v) => {
  const n = Number(String(v ?? '').replace(/[,\s₦$£€]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const costTotal = (form) => COST_KEYS.reduce((s, k) => s + costNumber(form?.[k]), 0);

export function taskPrice(task) {
  if (!task) return null;
  // Prefer the breakdown total; fall back to the stored single price.
  const n = costTotal(task) || Number(task.budget_max || task.budget_min || 0);
  return n > 0 ? n : null;
}

export const naira = (n) => money(n);

export function costLines(task) {
  return [
    ['Workmanship', task?.cost_workmanship],
    ['Transport', task?.cost_transport],
    ['Waybill', task?.cost_waybill],
    ['Items / equipment', task?.cost_items],
  ].filter(([, v]) => Number(v) > 0);
}
