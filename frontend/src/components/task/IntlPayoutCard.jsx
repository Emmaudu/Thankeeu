import { useEffect, useState } from 'react';
import { Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { taskersApi } from '../../utils/api';
import { activeMarket, formatMoney } from '../../utils/market';

// Bank fields per country (same rules as the server, backend/utils/countries.js).
export const BANK_FIELDS = {
  US: [['account_holder', 'Account holder name'], ['bank_name', 'Bank name'], ['routing_number', 'Routing number (ABA, 9 digits)'], ['account_number', 'Account number']],
  GB: [['account_holder', 'Account holder name'], ['bank_name', 'Bank name'], ['sort_code', 'Sort code (6 digits)'], ['account_number', 'Account number (8 digits)']],
  IE: [['account_holder', 'Account holder name'], ['bank_name', 'Bank name'], ['iban', 'IBAN (starts with IE)'], ['bic', 'BIC (optional)']],
  AU: [['account_holder', 'Account name'], ['bank_name', 'Bank name'], ['bsb', 'BSB (6 digits)'], ['account_number', 'Account number']],
  NZ: [['account_holder', 'Account name'], ['bank_name', 'Bank name'], ['account_number', 'Account number (bank, branch, account, suffix)']],
  CA: [['account_holder', 'Account holder name'], ['bank_name', 'Bank name'], ['institution_number', 'Institution number (3 digits)'], ['transit_number', 'Transit number (5 digits)'], ['account_number', 'Account number']],
  SG: [['account_holder', 'Account holder name'], ['bank_name', 'Bank name'], ['account_number', 'Account number']],
};

const STATUS = { pending: 'Being processed', paid: 'Sent to your bank', rejected: 'Not sent, returned to balance' };

/** Bank details and withdrawal history for taskers outside Nigeria. */
export default function IntlPayoutCard({ profile, onUpdate }) {
  const mk = activeMarket();
  const fields = BANK_FIELDS[mk.code] || [];
  const saved = profile?.payout_details || {};
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(([k]) => [k, saved[k] || ''])));
  const [saving, setSaving] = useState(false);
  const [payouts, setPayouts] = useState([]);

  useEffect(() => { taskersApi.myPayouts().then(({ data }) => setPayouts(data.payouts || [])).catch(() => {}); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await taskersApi.savePayoutDetails(form);
      toast.success(data.message || 'Bank details saved');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save bank details.');
    } finally { setSaving(false); }
  };

  return (
    <div className="card p-6" data-testid="intl-bank-card">
      <div className="flex items-center gap-2 mb-2">
        <Banknote size={18} style={{ color: 'var(--rose)' }} />
        <h4 className="font-black text-lg" style={{ color: 'var(--text)' }}>Bank details ({mk.currency})</h4>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
        Withdrawals are paid by bank transfer in {mk.currency} to an account in your name in {mk.name}, usually within 1 to 2 business days.
      </p>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        {fields.map(([k, label]) => (
          <div key={k} className={k === 'account_holder' ? 'sm:col-span-2' : ''}>
            <label className="label" htmlFor={`payout-${k}`}>{label}</label>
            <input id={`payout-${k}`} className="input" value={form[k] || ''} autoComplete="off"
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
          </div>
        ))}
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? 'Saving...' : 'Save bank details'}</button>
          {saved.account_holder && <span className="text-xs ml-3" style={{ color: '#047857' }}>Saved for {saved.account_holder}</span>}
        </div>
      </form>
      {payouts.length > 0 && (
        <div className="mt-6">
          <p className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>Withdrawals</p>
          <ul className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm" style={{ gap: 12 }}>
                <span style={{ color: 'var(--text-2)' }}>
                  {formatMoney(p.amount, p.currency)} {p.kind === 'advance' ? 'advance' : 'earnings'}
                  <span className="block text-xs" style={{ color: 'var(--muted)' }}>Ref {p.reference}{p.admin_note ? `. ${p.admin_note}` : ''}</span>
                </span>
                <span className="text-xs font-bold" style={{ color: p.status === 'paid' ? '#047857' : p.status === 'rejected' ? '#b91c1c' : '#92400e' }}>{STATUS[p.status] || p.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
