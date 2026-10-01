/**
 * TransactionsTab — Admin → Transactions.
 *
 * Every Flutterwave and Lemon Squeezy payment attempt, successful or not,
 * with the reason a payment failed, who paid, how, from where and with which
 * card. Flutterwave data comes live from Flutterwave; Lemon Squeezy data
 * comes from our own checkout records plus the Lemon Squeezy order.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../utils/api';

const PROVIDERS = [
  { id: 'flutterwave', label: 'Flutterwave', note: 'African countries' },
  { id: 'lemonsqueezy', label: 'Lemon Squeezy', note: 'International' },
];
const STATUSES = {
  flutterwave: [['', 'All'], ['successful', 'Successful'], ['failed', 'Failed'], ['pending', 'Pending']],
  lemonsqueezy: [['', 'All'], ['successful', 'Successful'], ['failed', 'Failed or not completed'], ['pending', 'In progress'], ['refunded', 'Refunded']],
};
const BADGE = {
  successful: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  refunded: 'bg-slate-100 text-slate-700 border-slate-200',
};

const today = (offsetDays = 0) => new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);
const when = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const money = (amount, currency) => {
  if (amount == null || !Number.isFinite(Number(amount))) return '—';
  return `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim();
};
const titleCase = (s) => String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

function Detail({ provider, item, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    adminAPI.getTransactionDetail(provider, item.id)
      .then(r => { if (alive) setData(r.data); })
      .catch(e => { if (alive) setError(e.response?.data?.error || 'Could not load the full record'); });
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { alive = false; window.removeEventListener('keydown', onKey); };
  }, [provider, item.id, onClose]);

  const it = data?.item || item;
  const rows = [
    ['Status', `${it.status}${it.reason ? `. ${it.reason}` : ''}`],
    ['When', when(it.created_at)],
    ['For', it.product],
    ['Amount', money(it.amount, it.currency)],
    ...(it.amount_usd != null && it.currency !== 'USD' ? [['In USD', money(it.amount_usd, 'USD')]] : []),
    ...(it.charged_amount != null && it.charged_amount !== it.amount ? [['Charged', money(it.charged_amount, it.currency)]] : []),
    ...(it.fee != null ? [['Flutterwave fee', money(it.fee, it.currency)]] : []),
    ...(it.amount_settled != null ? [['Settled to you', money(it.amount_settled, it.currency)]] : []),
    ...(it.tax ? [['Tax', it.tax]] : []),
    ['Name', it.name || '—'],
    ['Email', it.email || '—'],
    ['Phone', it.phone || (provider === 'lemonsqueezy' ? 'Not shared by Lemon Squeezy' : '—')],
    ['Country', it.country || '—'],
    ...(it.city ? [['City', it.city]] : []),
    ['Payment option', it.payment_option],
    ['Method', it.payment_method || '—'],
    ['Card type', it.card_type || (provider === 'lemonsqueezy' ? 'Not shared by Lemon Squeezy' : '—')],
    ['Card', it.card_number || '—'],
    ...(it.card_issuer ? [['Card issuer', it.card_issuer]] : []),
    ...(it.card_expiry ? [['Card expiry', it.card_expiry]] : []),
    ...(it.bank ? [['Bank', it.bank]] : []),
    ...(it.ip ? [['IP address', it.ip]] : []),
    ['Our reference', it.reference || '—'],
    ['Provider reference', it.provider_reference || '—'],
    ...(it.order_number ? [['Order number', `#${it.order_number}`]] : []),
    ...(it.card_slug ? [['Greeting card', it.card_slug]] : []),
    ...(it.test_mode ? [['Mode', 'Test']] : []),
  ];

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Transaction details">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-purple-100 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary-600">{provider === 'flutterwave' ? 'Flutterwave' : 'Lemon Squeezy'}</p>
            <h2 className="text-lg font-extrabold text-warm-900">{money(it.amount, it.currency)}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-purple-100 px-3 py-2 text-sm font-bold text-warm-600" style={{ minHeight: 0 }}>Close</button>
        </div>
        <div className="p-5">
          {error && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}. Showing what the list had.</p>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-warm-400">{k}</dt>
                <dd className="break-words text-warm-800">{v}</dd>
              </div>
            ))}
          </dl>
          {it.receipt_url && (
            <a href={it.receipt_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-bold text-primary-700 underline">Open the Lemon Squeezy receipt</a>
          )}
          {data?.raw && (
            <details className="mt-5">
              <summary className="cursor-pointer text-xs font-bold text-warm-500">Full record from {provider === 'flutterwave' ? 'Flutterwave' : 'Lemon Squeezy and Thankeeu'}</summary>
              <pre className="mt-2 max-h-[50vh] overflow-auto rounded-xl bg-warm-50 p-3 text-[11px] leading-relaxed text-warm-700">{JSON.stringify(data.raw, null, 2)}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransactionsTab() {
  const [provider, setProvider] = useState('flutterwave');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState(today(30));
  const [to, setTo] = useState(today(0));
  const [email, setEmail] = useState('');
  const [reference, setReference] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);
  const [applied, setApplied] = useState({ email: '', reference: '' });

  const load = useCallback(() => {
    let alive = true;
    setLoading(true); setError(null);
    adminAPI.getTransactions(provider, { status, from, to, page, ...(applied.email ? { email: applied.email } : {}), ...(applied.reference ? { reference: applied.reference } : {}) })
      .then(r => { if (alive) setResult(r.data); })
      .catch(e => { if (alive) { setResult(null); setError(e.response?.data?.error || 'Could not load transactions'); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [provider, status, from, to, page, applied]);

  useEffect(() => load(), [load]);

  const switchProvider = (p) => { setProvider(p); setStatus(''); setPage(1); setResult(null); };
  const search = (e) => { e.preventDefault(); setPage(1); setApplied({ email: email.trim(), reference: reference.trim() }); };
  const closeDetail = useCallback(() => setOpen(null), []);

  const counts = useMemo(() => {
    const c = { successful: 0, failed: 0, pending: 0, refunded: 0 };
    for (const it of result?.items || []) c[it.status_group] = (c[it.status_group] || 0) + 1;
    return c;
  }, [result]);

  const items = result?.items || [];
  const totalPages = result?.total_pages || 1;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-7">
      <h2 className="mb-1 text-[22px] font-extrabold text-warm-900">Transactions</h2>
      <p className="mb-5 max-w-3xl text-sm leading-relaxed text-warm-500">
        Every payment attempt, successful or not, with the reason a payment failed and how the customer paid.
        {provider === 'flutterwave'
          ? ' Flutterwave records are read live from Flutterwave, 10 per page.'
          : ' Lemon Squeezy shows every checkout Thankeeu started. Lemon Squeezy does not share card details, phone numbers or card decline reasons; a declined card is retried inside its checkout, so it appears here as not completed.'}
      </p>

      {/* Provider */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PROVIDERS.map(p => (
          <button key={p.id} type="button" onClick={() => switchProvider(p.id)}
            className={`rounded-xl border-2 px-4 py-2 text-left text-sm font-bold transition ${provider === p.id ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-purple-100 bg-white text-warm-600 hover:border-purple-200'}`}
            style={{ minHeight: 0 }}>
            {p.label}<span className="ml-2 text-[11px] font-semibold text-warm-400">{p.note}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <form onSubmit={search} className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-purple-100 bg-white p-4">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES[provider].map(([id, label]) => (
            <button key={id || 'all'} type="button" onClick={() => { setStatus(id); setPage(1); }}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${status === id ? 'border-primary-500 bg-primary-600 text-white' : 'border-purple-100 bg-white text-warm-600 hover:bg-purple-50'}`}
              style={{ minHeight: 0 }}>{label}</button>
          ))}
        </div>
        <label className="text-[11px] font-bold text-warm-500">From
          <input type="date" value={from} max={to} onChange={e => { setFrom(e.target.value); setPage(1); }} className="input mt-1 block py-1.5 text-sm" />
        </label>
        <label className="text-[11px] font-bold text-warm-500">To
          <input type="date" value={to} min={from} max={today(0)} onChange={e => { setTo(e.target.value); setPage(1); }} className="input mt-1 block py-1.5 text-sm" />
        </label>
        <label className="min-w-[180px] flex-1 text-[11px] font-bold text-warm-500">Customer email
          <input type="search" value={email} onChange={e => setEmail(e.target.value)} placeholder={provider === 'flutterwave' ? 'Exact email' : 'Email or part of it'} className="input mt-1 block w-full py-1.5 text-sm" />
        </label>
        <label className="min-w-[160px] flex-1 text-[11px] font-bold text-warm-500">Reference
          <input type="search" value={reference} onChange={e => setReference(e.target.value)} placeholder="TK-FEE-…" className="input mt-1 block w-full py-1.5 text-sm" />
        </label>
        <button type="submit" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700" style={{ minHeight: 0 }}>Search</button>
        <button type="button" onClick={load} className="rounded-xl border border-purple-100 px-3 py-2 text-sm font-bold text-warm-600 hover:bg-purple-50" style={{ minHeight: 0 }}>Refresh</button>
      </form>

      {result?.notice && <p className="mb-3 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800">{result.notice}</p>}
      {error && <p className="mb-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>}

      {result && (
        <p className="mb-2 text-xs text-warm-500">
          {result.total} transaction{result.total === 1 ? '' : 's'} from {result.from} to {result.to}
          {items.length > 0 && <> · on this page: {counts.successful} successful, {counts.failed} failed{counts.pending ? `, ${counts.pending} in progress` : ''}{counts.refunded ? `, ${counts.refunded} refunded` : ''}</>}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-purple-100 bg-white">
        <table className="w-full min-w-[980px] text-xs">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-warm-400">
              <th className="px-3 py-2.5">When</th>
              <th className="px-3 py-2.5">Customer</th>
              <th className="px-3 py-2.5">For</th>
              <th className="px-3 py-2.5">Amount</th>
              <th className="px-3 py-2.5">Status and reason</th>
              <th className="px-3 py-2.5">Paid with</th>
              <th className="px-3 py-2.5">Country</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-50">
            {loading && <tr><td colSpan={7} className="px-3 py-10 text-center text-warm-400">Loading…</td></tr>}
            {!loading && items.length === 0 && !error && <tr><td colSpan={7} className="px-3 py-10 text-center text-warm-400">No transactions for these filters.</td></tr>}
            {!loading && items.map(it => (
              <tr key={`${it.provider}-${it.id}`} onClick={() => setOpen(it)} className="cursor-pointer align-top hover:bg-purple-50/40">
                <td className="whitespace-nowrap px-3 py-2.5 text-warm-600">{when(it.created_at)}</td>
                <td className="px-3 py-2.5">
                  <p className="font-bold text-warm-800">{it.name || '—'}</p>
                  <p className="break-all text-warm-500">{it.email || '—'}</p>
                  {it.phone && <p className="text-warm-500">{it.phone}</p>}
                </td>
                <td className="px-3 py-2.5 text-warm-700">
                  <p>{it.product}</p>
                  <p className="break-all text-[10px] text-warm-400">{it.reference}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-bold text-warm-800">
                  {money(it.amount, it.currency)}
                  {it.amount_usd != null && it.currency !== 'USD' && <p className="font-normal text-warm-400">{money(it.amount_usd, 'USD')}</p>}
                </td>
                <td className="max-w-[300px] px-3 py-2.5">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${BADGE[it.status_group] || BADGE.pending}`}>{titleCase(it.status)}</span>
                  {it.reason && <p className={`mt-1 leading-snug ${it.status_group === 'failed' ? 'font-semibold text-rose-700' : 'text-warm-500'}`}>{it.reason}</p>}
                </td>
                <td className="px-3 py-2.5 text-warm-700">
                  <p className="font-semibold">{it.payment_option}</p>
                  <p className="text-warm-500">{it.payment_method || '—'}</p>
                  {(it.card_type || it.card_number) && <p className="text-warm-500">{[it.card_type, it.card_number].filter(Boolean).join(' ')}</p>}
                  {it.card_issuer && <p className="text-[10px] text-warm-400">{it.card_issuer}</p>}
                </td>
                <td className="px-3 py-2.5 text-warm-600">{it.country || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}
          className="rounded-xl border border-purple-100 bg-white px-4 py-2 text-sm font-bold text-warm-600 disabled:opacity-40" style={{ minHeight: 0 }}>Previous</button>
        <span className="text-xs text-warm-500">Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}
          className="rounded-xl border border-purple-100 bg-white px-4 py-2 text-sm font-bold text-warm-600 disabled:opacity-40" style={{ minHeight: 0 }}>Next</button>
      </div>

      {open && <Detail provider={provider} item={open} onClose={closeDetail} />}
    </div>
  );
}
