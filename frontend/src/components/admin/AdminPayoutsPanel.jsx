import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { adminApi } from '../../utils/api';
import { formatMoney, getMarket } from '../../utils/market';
import { BANK_FIELDS } from '../task/IntlPayoutCard';

const STATUS_STYLE = {
  pending: { color: '#92400e', bg: '#fffbeb', label: 'To pay' },
  paid: { color: '#047857', bg: '#ecfdf5', label: 'Paid' },
  rejected: { color: '#b91c1c', bg: '#fef2f2', label: 'Rejected' },
};

/**
 * International withdrawals (US, UK, Ireland, Australia, New Zealand, Canada,
 * Singapore). Pay each one by bank transfer from the business account in the
 * stated currency, then mark it paid. Rejecting returns the money to the
 * tasker's balance with your reason.
 */
export default function AdminPayoutsPanel() {
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = () => {
    setData(null);
    adminApi.getPayouts({ status }).then(({ data: d }) => setData(d)).catch(() => setData({ error: true }));
  };
  useEffect(load, [status]);

  const act = async (p, action) => {
    let note = '';
    if (action === 'reject') {
      note = window.prompt('Reason for the tasker (for example: account name does not match):') || '';
      if (!note.trim()) return;
    } else if (!window.confirm(`Confirm you have sent ${formatMoney(p.amount, p.currency)} to ${p.tasker?.full_name || 'this tasker'}?`)) return;
    setBusy(p.id);
    try {
      const { data: d } = await adminApi.payoutAction(p.id, action, note);
      toast.success(d.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update the payout.');
    } finally { setBusy(null); }
  };

  const totals = {};
  for (const p of data?.payouts || []) if (p.status === 'pending') totals[p.currency] = (totals[p.currency] || 0) + Number(p.amount);

  return (
    <div className="space-y-4" data-testid="admin-payouts">
      <div className="card p-5">
        <h2 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)' }}>International payouts</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Withdrawals from taskers outside Nigeria. Send each by bank transfer in the currency shown, then mark it paid. Card refunds for international tasks are made in the Rapyd dashboard.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {['pending', 'paid', 'rejected'].map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)} className="btn-sm"
              style={{ borderRadius: 10, padding: '7px 14px', fontWeight: 700, fontSize: 13, border: '1px solid var(--border-light)', background: status === s ? 'var(--dark)' : 'white', color: status === s ? 'white' : 'var(--text-2)' }}>
              {STATUS_STYLE[s].label}
            </button>
          ))}
          <button type="button" onClick={load} className="ml-auto" aria-label="Refresh"><RefreshCw size={16} style={{ color: 'var(--muted)' }} /></button>
        </div>
        {status === 'pending' && Object.keys(totals).length > 0 && (
          <p className="text-sm mt-3" style={{ color: 'var(--text-2)' }}>
            To pay: {Object.entries(totals).map(([c, v]) => formatMoney(v, c)).join(', ')}
          </p>
        )}
      </div>

      {!data ? (
        <div className="card p-6 flex justify-center"><RefreshCw size={20} className="animate-spin" style={{ color: 'var(--muted)' }} /></div>
      ) : data.error ? (
        <div className="card p-5 text-sm" style={{ color: 'var(--muted)' }}>Could not load payouts.</div>
      ) : data.ready === false ? (
        <div className="card p-5 text-sm" style={{ color: '#92400e', background: '#fffbeb' }}>{data.message}</div>
      ) : !data.payouts.length ? (
        <div className="card p-6 text-sm" style={{ color: 'var(--muted)' }}>Nothing here.</div>
      ) : data.payouts.map((p) => {
        const mk = getMarket(p.country);
        const st = STATUS_STYLE[p.status] || STATUS_STYLE.pending;
        const bank = p.bank_snapshot || {};
        return (
          <div key={p.id} className="card p-5" data-testid="payout-row">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)' }}>{formatMoney(p.amount, p.currency)}</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {p.tasker?.full_name || 'Tasker'} · {mk.name} · {p.kind === 'advance' ? 'Advance' : 'Earnings'} · ref {p.reference}
                  {p.created_at ? ` · ${format(new Date(p.created_at), 'MMM d, yyyy HH:mm')}` : ''}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.tasker?.email}{p.tasker?.phone ? ` · ${p.tasker.phone}` : ''}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: st.color, background: st.bg, borderRadius: 8, padding: '4px 10px' }}>{st.label}</span>
            </div>
            <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2 mt-3 text-sm">
              {(BANK_FIELDS[mk.code] || []).map(([k, label]) => (
                <div key={k} className="flex gap-2"><dt style={{ color: 'var(--muted)', minWidth: 150 }}>{label}</dt><dd style={{ fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all' }}>{bank[k] || 'Not given'}</dd></div>
              ))}
            </dl>
            {p.admin_note && <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>Note: {p.admin_note}</p>}
            {p.status === 'pending' && (
              <div className="flex gap-2 mt-4">
                <button type="button" disabled={busy === p.id} onClick={() => act(p, 'paid')} className="btn-primary btn-sm">Mark as paid</button>
                <button type="button" disabled={busy === p.id} onClick={() => act(p, 'reject')} className="btn-sm" style={{ border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '7px 14px', fontWeight: 700 }}>Reject</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
