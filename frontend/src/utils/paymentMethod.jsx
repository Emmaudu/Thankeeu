/**
 * paymentMethod.jsx — "How would you like to pay?" before any checkout.
 *
 *   const choice = await choosePaymentMethod({ currency, amountNGN });
 *   if (!choice) return;                          // customer closed the dialog
 *   api.initSomething(choice.currency, ..., choice.provider);
 *
 * Lemon Squeezy is offered for every currency except NGN (it always charges
 * in USD, which a naira card would only make harder). It is shown only when
 * the backend reports it switched on; otherwise this resolves to
 * 'flutterwave' straight away and no dialog appears.
 */
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { paymentsAPI } from './api';
import { formatCurrency, isChargeableCurrency, hasLiveRate } from './currency';
import { formatPrice } from './pricing';
import Icon from '../components/ui/Icon';
import { CurrencySelect } from './currencyUI';

let providersPromise = null;
function loadProviders() {
  if (!providersPromise) {
    providersPromise = paymentsAPI.providers()
      .then(r => ({
        lemonsqueezy: !!r.data?.lemonsqueezy,
        flwUsdFor: Array.isArray(r.data?.flutterwave_usd_for) ? r.data.flutterwave_usd_for : [],
      }))
      .catch(() => { providersPromise = null; return { lemonsqueezy: false, flwUsdFor: [] }; }); // retry next time
  }
  return providersPromise;
}

function MethodDialog({ initialCurrency, flwUsdFor, amountNGN, onDone }) {
  const firstBtn = useRef(null);
  // The customer can still change currency here, at checkout.
  const [currency, setCurrency] = useState(initialCurrency);
  const flwCurrency = flwUsdFor.includes(currency) || !isChargeableCurrency(currency) ? 'USD' : currency;
  const finish = (provider) => onDone(provider ? { provider, currency } : null);
  useEffect(() => {
    firstBtn.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onDone(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  const hasAmount = Number(amountNGN) > 0;
  const usd = hasAmount ? formatCurrency(amountNGN, 'USD') : null;
  // What Flutterwave will really charge (some currencies are charged in USD).
  const local = hasAmount ? formatPrice(amountNGN, flwCurrency) : null;
  // For a display-only currency (INR, KRW, …) also show the approximate local price.
  const approx = hasAmount && !isChargeableCurrency(currency) && hasLiveRate(currency)
    ? `About ${formatCurrency(amountNGN, currency)} in ${currency}. Your bank converts it.` : null;

  const option = (key, { title, lines, badge, price }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={() => finish(key)}
      className="w-full rounded-2xl border-2 border-purple-100 bg-white p-4 text-left transition hover:border-primary-400 focus:border-primary-500 focus:outline-none"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-extrabold text-warm-900">{title}</p>
        {price && <p className="shrink-0 text-sm font-extrabold text-primary-700">{price}</p>}
      </div>
      {badge && <span className="mt-1.5 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{badge}</span>}
      {lines.map(l => <p key={l} className="mt-1 text-sm leading-snug text-warm-600">{l}</p>)}
    </button>
  );

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="pm-title"
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onDone(null); }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="pm-title" className="text-lg font-extrabold text-warm-900">How would you like to pay?</h2>
            <p className="mt-1 text-sm text-warm-500">Pick the option that suits your card.</p>
          </div>
          <button type="button" aria-label="Close" onClick={() => onDone(null)} className="rounded-full p-1 text-warm-400 hover:bg-warm-100 hover:text-warm-700">
            <Icon name="X" size={18}/>
          </button>
        </div>
        <div className="mb-4">
          <p className="mb-1.5 text-xs font-semibold text-warm-500">Your currency</p>
          <CurrencySelect selected={currency} onChange={setCurrency} align="left" label="Your currency" />
        </div>
        <div className="space-y-3">
          {option('lemonsqueezy', {
            title: 'Lemon Squeezy',
            badge: 'International: countries outside Africa',
            lines: [
              'Visa, Mastercard, Amex, Apple Pay, Google Pay or PayPal.',
              'Processed by Lemon Squeezy and charged in US dollars.',
              'Sales tax or VAT may be added at checkout depending on your country.',
              ...(approx ? [approx] : []),
            ],
            price: usd ? `${usd} USD` : null,
          }, firstBtn)}
          {option('flutterwave', {
            title: 'Flutterwave',
            badge: 'For African countries',
            lines: [
              'Card, bank transfer and other local options.',
              flwCurrency === 'USD' ? 'Charged in US dollars.' : `Charged in ${flwCurrency}.`,
            ],
            price: local ? `${local} ${flwCurrency}` : null,
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-warm-400">
          Outside Africa, or your bank declined a card payment before? Choose Lemon Squeezy.
        </p>
      </div>
    </div>
  );
}

/**
 * Ask which payment method to use, with the currency still changeable.
 * @returns {Promise<{provider:'flutterwave'|'lemonsqueezy', currency:string}|null>}
 *          null when dismissed.
 */
export async function choosePaymentMethod({ currency, amountNGN } = {}) {
  const cur = String(currency || 'NGN').toUpperCase();
  // Naira goes straight to Flutterwave; so does everything when Lemon Squeezy is off.
  if (cur === 'NGN') return { provider: 'flutterwave', currency: cur };
  const providers = await loadProviders();
  if (!providers.lemonsqueezy) return { provider: 'flutterwave', currency: cur };

  return new Promise((resolve) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    let settled = false;
    const done = (choice) => {
      if (settled) return;
      settled = true;
      document.body.style.overflow = prevOverflow;
      // Unmount after this event finishes so React is not unmounting mid-render.
      setTimeout(() => { root.unmount(); host.remove(); }, 0);
      resolve(choice);
    };
    root.render(<MethodDialog initialCurrency={cur} flwUsdFor={providers.flwUsdFor} amountNGN={amountNGN} onDone={done} />);
  });
}
