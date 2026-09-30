/**
 * PayForCard.jsx — /pay/:slug
 *
 * "Create Now, Pay Later": the creator's card is already live and collecting
 * signatures. Paying here (credit, or Flutterwave in any supported currency,
 * with an optional discount code) unlocks delivery — on the scheduled date,
 * or straight away if that date has passed.
 *
 * Linked from the congratulations/reminder emails, the dashboard "Pay Now"
 * buttons and the card page.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import Icon from '../components/ui/Icon';
import { cardsAPI, creditsAPI, paymentsAPI } from '../utils/api';
import { CURRENCIES, DEFAULT_CURRENCY, formatCurrency, formatUSD } from '../utils/currency';
import { formatInZone } from '../utils/timezones';

const FEE_NGN = 5000;

const sendInstant = (card) => {
  if (!card?.send_date) return null;
  const d = String(card.send_date).slice(0, 10);
  const t = card.send_time ? String(card.send_time).slice(0, 8) : '00:00:00';
  const iso = `${d}T${t}Z`;
  return isNaN(new Date(iso).getTime()) ? null : iso;
};

export default function PayForCard() {
  useSEO({ title: 'Pay for your card', description: 'Pay the one-time card fee so your card can be delivered.', noIndex: true });
  const { slug } = useParams();
  const { user } = useAuth();
  const [card, setCard] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | paid | notfound | forbidden
  const [credits, setCredits] = useState(0);
  const [method, setMethod] = useState('direct');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null); // { ngn, message } | { error }
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // success info after a credit payment

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await cardsAPI.getOne(slug);
        if (!alive) return;
        if (!data?.isCreatorPersonal && !data?.isCreator) { setState('forbidden'); return; }
        setCard(data);
        const paid = (data.status === 'active' || data.status === 'sent') && !data.payment_pending;
        setState(paid ? 'paid' : 'ready');
      } catch (err) {
        if (alive) setState(err.response?.status === 403 ? 'forbidden' : 'notfound');
      }
    })();
    creditsAPI.getBalance()
      .then(r => { if (alive) { const c = r.data?.credits || 0; setCredits(c); if (c > 0) setMethod('credit'); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  const applyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) return;
    try {
      const r = await paymentsAPI.discountPreview(code);
      setDiscount({ ngn: r.data.discounted_ngn, message: `${r.data.percent_off}% off applied` });
    } catch (err) {
      setDiscount({ error: err.response?.data?.error || 'Invalid discount code' });
    }
  };

  const pay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (method === 'credit') {
        const r = await creditsAPI.spend(slug);
        if (!r.data?.ok) throw new Error(r.data?.error || 'Could not use your credit');
        setCredits(r.data.credits_remaining ?? Math.max(0, credits - 1));
        setDone({ viaCredit: true });
        setState('paid');
        toast.success('Paid! Your card is all set 🎉');
        return;
      }
      const code = discount?.ngn != null ? discountCode.trim() : undefined;
      const r = await paymentsAPI.initCardFee(slug, currency, user?.email, code);
      if (r.data?.already_active || r.data?.already_paid) {
        setDone({ viaCredit: false });
        setState('paid');
        toast.success('This card is paid 🎉');
        return;
      }
      if (!r.data?.payment_link) throw new Error('No payment link returned');
      window.location.assign(r.data.payment_link);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Payment could not start. Please try again.');
      setBusy(false);
    }
  };

  const due = sendInstant(card);
  const dueLabel = due ? formatInZone(due, card?.delivery_timezone) : null;
  const overdue = due ? new Date(due).getTime() <= Date.now() : false;
  const feeLabel = discount?.ngn != null ? formatCurrency(discount.ngn, currency) : formatCurrency(FEE_NGN, currency);

  let body;
  if (state === 'loading') {
    body = <div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"/></div>;
  } else if (state === 'notfound' || state === 'forbidden') {
    body = (
      <div className="db-empty">
        <p className="db-empty-title">{state === 'forbidden' ? 'Only the card creator can pay for this card' : 'Card not found'}</p>
        <Link to="/dashboard/cards" className="btn-primary text-sm px-6 py-2.5 inline-flex">Go to my cards</Link>
      </div>
    );
  } else if (state === 'paid') {
    body = (
      <div className="mx-auto max-w-lg rounded-3xl border border-emerald-100 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Icon name="Check" size={30}/></div>
        <h2 className="mb-2 text-2xl font-extrabold text-warm-900">{done ? 'Payment received!' : 'This card is paid'}</h2>
        <p className="mb-6 text-sm leading-relaxed text-warm-600">
          {card?.status === 'sent'
            ? `It has already been delivered to ${card.recipient_name}.`
            : !card?.recipient_email
              ? `Add ${card?.recipient_name || 'the recipient'}'s email on the card so we can deliver it.`
              : overdue
                ? `It's being delivered to ${card?.recipient_name} right now — Memory Movie and gifts included.`
                : dueLabel
                  ? `It will be delivered to ${card?.recipient_name} automatically on ${dueLabel}.`
                  : `Send it to ${card?.recipient_name} from your cards whenever you're ready.`}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to={`/card/${slug}`} className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2"><Icon name="Eye" size={15}/>View card</Link>
          <Link to="/dashboard" className="btn-secondary px-6 py-2.5 text-sm">Dashboard</Link>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-3xl border border-purple-100 bg-white p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-600">Your card</p>
          <h2 className="mt-1 text-xl font-extrabold text-warm-900">{card.title}</h2>
          <p className="text-sm text-warm-500">For {card.recipient_name}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-purple-50 p-4">
              <p className="text-2xl font-extrabold text-primary-700">{card.messages?.length || 0}</p>
              <p className="text-xs text-warm-500">signatures so far</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-2xl font-extrabold text-emerald-700">{formatUSD(card.total_collected || 0)}</p>
              <p className="text-xs text-warm-500">in the gift pot</p>
            </div>
          </div>
          <div className={`mt-4 rounded-2xl p-4 text-sm ${overdue ? 'bg-amber-50 text-amber-900' : 'bg-warm-100 text-warm-700'}`}>
            {overdue
              ? <><strong>On hold:</strong> the delivery time ({dueLabel}) has passed. Pay now and it's delivered straight away.</>
              : dueLabel
                ? <>Scheduled for <strong>{dueLabel}</strong>. Pay before then and it goes out automatically.</>
                : <>No delivery date set. After paying you can send it from your cards whenever you like.</>}
          </div>
          <p className="mt-4 text-xs text-warm-400">Still collecting? Keep sharing the signing link — people can sign until it's delivered.</p>
          <button type="button" className="mt-2 text-xs font-bold text-primary-600"
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${slug}`); toast.success('Signing link copied'); }}>
            Copy signing link
          </button>
        </section>

        <section className="rounded-3xl border-2 border-primary-200 bg-white p-6">
          <p className="mb-3 text-sm font-extrabold text-warm-900">Pay the one-time card fee</p>
          {credits > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {[['credit', 'Use a credit', `${credits} left`], ['direct', 'Pay by card / bank', 'Flutterwave']].map(([id, t, sub]) => (
                <button key={id} type="button" onClick={() => setMethod(id)}
                  className={`rounded-xl border-2 p-3 text-left text-xs ${method === id ? 'border-primary-400 bg-primary-50' : 'border-purple-100'}`}>
                  <p className="font-bold text-warm-900">{t}</p><p className="text-warm-500">{sub}</p>
                </button>
              ))}
            </div>
          )}
          {method === 'direct' && (
            <>
              <p className="mb-1.5 text-xs font-semibold text-warm-500">Pay in:</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {CURRENCIES.map(c => (
                  <button key={c.code} type="button" onClick={() => setCurrency(c.code)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold ${currency === c.code ? 'bg-primary-500 text-white' : 'border border-primary-200 bg-primary-50 text-primary-600'}`}>
                    {c.flag} {c.code}
                  </button>
                ))}
              </div>
              <p className="mb-1.5 text-xs font-semibold text-warm-500">Discount code (optional):</p>
              <div className="mb-1 flex gap-2">
                <input className="input flex-1 py-2 text-sm" value={discountCode} placeholder="e.g. LAUNCH20"
                  onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscount(null); }}/>
                <button type="button" onClick={applyDiscount} disabled={!discountCode.trim()}
                  className="rounded-xl bg-primary-100 px-4 py-2 text-xs font-bold text-primary-600 disabled:opacity-50">Apply</button>
              </div>
              {discount && <p className={`mb-3 text-xs font-semibold ${discount.error ? 'text-red-500' : 'text-green-600'}`}>{discount.error || `✓ ${discount.message}`}</p>}
            </>
          )}
          <button type="button" onClick={pay} disabled={busy} className="btn-primary mt-3 w-full py-3.5 text-base font-extrabold">
            {busy ? 'Please wait…' : method === 'credit' ? 'Use 1 credit & pay' : `Pay ${feeLabel}`}
          </button>
          <p className="mt-3 text-center text-xs text-warm-400">
            {overdue ? 'Delivered immediately after payment' : 'Delivered automatically on the scheduled date'} · Memory Movie & gifts included
          </p>
        </section>
      </div>
    );
  }

  return <DashboardLayout title="Pay for your card" subtitle="Pay when you're happy — then it's delivered">{body}</DashboardLayout>;
}
