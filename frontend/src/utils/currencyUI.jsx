/**
 * currencyUI.jsx - Shared currency display components
 * Kept separate from Pricing.jsx so any page can import without loading
 * the entire Pricing page module.
 */
import { useState, useEffect, useId } from 'react';
import {
  CURRENCIES, ALL_CURRENCY_CODES, formatCurrency, getCurrency, currencyCountry,
  isChargeableCurrency, loadFxRates, hasLiveRate,
} from './currency';

/**
 * Currency picker: one dropdown listing every currency we can show, each with
 * its country, e.g. "🇮🇳 INR · Indian Rupee · India". Currencies we can charge
 * directly come first. Picking a display-only currency (INR, KRW, …) shows
 * approximate local prices; the payment itself is in US dollars.
 */
export const CurrencySelect = ({ selected, onChange, showFlags = true, label = 'Currency', className = '', align = 'center' }) => {
  const [, force] = useState(0);
  const id = useId();
  useEffect(() => {
    // Display-only currency already chosen (e.g. restored): make sure rates load.
    if (selected && !isChargeableCurrency(selected) && !hasLiveRate(selected)) {
      loadFxRates().then(() => force(n => n + 1));
    }
  }, [selected]);

  const choose = async (code) => {
    if (!isChargeableCurrency(code)) await loadFxRates();
    onChange(code);
  };

  const optionLabel = (code) => {
    const c = getCurrency(code);
    const country = currencyCountry(code);
    const name = c.name || code;
    return `${showFlags ? `${c.flag} ` : ''}${code} · ${name}${country && country !== name ? ` · ${country}` : ''}`;
  };

  const coreCodes = CURRENCIES.map(c => c.code);
  const otherCodes = ALL_CURRENCY_CODES.filter(c => !coreCodes.includes(c));
  const displayOnly = selected && !isChargeableCurrency(selected);
  const wrap = align === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <div className={`flex flex-col gap-1 ${wrap} ${className}`}>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <select
        id={id}
        value={selected}
        onChange={e => choose(e.target.value)}
        className="w-full max-w-xs rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-warm-800 shadow-sm focus:border-primary-400 focus:outline-none"
      >
        <optgroup label="Pay in your currency">
          {coreCodes.map(code => <option key={code} value={code}>{optionLabel(code)}</option>)}
        </optgroup>
        <optgroup label="See prices in your currency (paid in USD)">
          {otherCodes.map(code => <option key={code} value={code}>{optionLabel(code)}</option>)}
        </optgroup>
      </select>
      {displayOnly && (
        <p className="max-w-xs text-[11px] leading-snug text-warm-500">
          {hasLiveRate(selected)
            ? <>Prices in {selected} are approximate. You pay in US dollars and your bank converts it. <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">Rates By Exchange Rate API</a></>
            : <>Showing US dollar prices. You pay in US dollars.</>}
        </p>
      )}
    </div>
  );
};

/** Kept for existing pages: the old pill row is now the dropdown. */
export const CurrencyToggle = (props) => <CurrencySelect {...props} />;

export const RotatingPrice = ({ amountNGN, className = '', showFlags = true }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % CURRENCIES.length), 2000);
    return () => clearInterval(t);
  }, []);

  const cur = CURRENCIES[idx];
  return (
    <span key={cur.code}
      className={`inline-flex items-center gap-1 transition-all ${className}`}
      style={{ animation: 'fadeSlideIn 0.4s ease' }}>
      {showFlags && <span>{cur.flag}</span>}
      <span>{formatCurrency(amountNGN, cur.code)}</span>
    </span>
  );
};
