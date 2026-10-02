import { minAmount, money, sym } from '../../utils/market';
// Cost breakdown inputs used by BOTH task posting flows (public page and the
// requester dashboard). Workmanship is required; the rest are optional.
// The total shown here is the single price displayed on /tasks.
import { COST_KEYS, costNumber, costTotal, naira } from '../../utils/taskPrice';

const FIELDS = [
  {
    key: 'cost_workmanship', label: 'Workmanship', required: true, placeholder: 'e.g. 5000',
    help: "The tasker's pay for doing the work itself.",
  },
  {
    key: 'cost_transport', label: 'Transportation', placeholder: 'e.g. 1500',
    help: 'Sometimes a tasker lives close to the task location and needs no transport. Sometimes they are far away and must pay to get there and back. Add it if it applies.',
  },
  {
    key: 'cost_waybill', label: 'Waybill', placeholder: 'e.g. 2000',
    help: 'The cost of sending or delivering an item by courier, bus or dispatch rider, if the task needs it.',
  },
  {
    key: 'cost_items', label: 'Items or equipment', placeholder: 'e.g. 8000',
    help: 'The cost of any item or equipment the tasker will buy or pay for on your behalf.',
  },
];

export const emptyCosts = () => Object.fromEntries(COST_KEYS.map((k) => [k, '']));
export const costsValid = (form) => costNumber(form?.cost_workmanship) >= minAmount();

export default function CostFields({ value, onChange }) {
  const total = costTotal(value);
  return (
    <div className="space-y-4" data-testid="cost-fields">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="label" htmlFor={f.key}>
            {f.label} ({sym()}) {f.required ? <span style={{ color: '#dc2626' }}>*</span> : <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(if applicable)</span>}
          </label>
          <p className="text-xs mb-1.5" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>{f.help}</p>
          <input id={f.key} type="number" inputMode="numeric" min={f.required ? 100 : 0} step={1} placeholder={f.placeholder}
            value={value?.[f.key] ?? ''} onChange={(e) => onChange({ ...value, [f.key]: e.target.value })} className="input" />
        </div>
      ))}
      <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--rose-light, #fff5f7)', border: '1px solid #ffd1dc' }}>
        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Total task price</span>
        <span className="font-black text-lg" style={{ color: 'var(--primary, #ff2d62)' }} data-testid="cost-total">{naira(total)}</span>
      </div>
      {!costsValid(value) && <p className="text-xs" style={{ color: '#b45309' }}>Enter the workmanship amount (at least {money(minAmount())}) to continue.</p>}
    </div>
  );
}

// Compact read-only breakdown for dashboard task pages. The requester still
// pays ONE amount (the total); this only shows what that total is made of.
export function CostBreakdown({ task }) {
  const rows = [
    ['Workmanship', task?.cost_workmanship],
    ['Transportation', task?.cost_transport],
    ['Waybill', task?.cost_waybill],
    ['Items or equipment', task?.cost_items],
  ];
  if (!(Number(task?.cost_workmanship) > 0)) return null;
  const total = rows.reduce((s, [, v]) => s + (Number(v) || 0), 0);
  return (
    <div className="mt-4 rounded-xl border" style={{ borderColor: 'var(--border, #e5e7eb)' }} data-testid="dashboard-cost-breakdown">
      {rows.map(([label, v]) => (
        <div key={label} className="flex justify-between px-4 py-2 text-sm" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ color: 'var(--muted, #6b7280)' }}>{label}</span>
          {Number(v) > 0 ? <span className="font-bold" style={{ color: 'var(--text, #111827)' }}>{naira(v)}</span> : <span style={{ color: '#9ca3af' }}>Not needed</span>}
        </div>
      ))}
      <div className="flex justify-between px-4 py-2.5 text-sm" style={{ background: '#f9fafb' }}>
        <span className="font-black" style={{ color: 'var(--text, #111827)' }}>Total (one payment)</span>
        <span className="font-black" style={{ color: 'var(--primary, #ff2d62)' }}>{naira(total)}</span>
      </div>
    </div>
  );
}
