/**
 * currencyUI.jsx - Shared currency display components
 * Kept separate from Pricing.jsx so any page can import without loading
 * the entire Pricing page module.
 */
import { useState, useEffect } from 'react';
import { CURRENCIES, formatCurrency } from './currency';

export const CurrencyToggle = ({ selected, onChange }) => (
  <div className="flex flex-wrap gap-1.5 justify-center">
    {CURRENCIES.map(c => (
      <button key={c.code} onClick={() => onChange(c.code)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
          selected === c.code
            ? 'bg-primary-500 text-white shadow-sm'
            : 'bg-white border border-purple-200 text-warm-600 hover:border-primary-300'
        }`}>
        <span>{c.flag}</span>
        <span>{c.code}</span>
      </button>
    ))}
  </div>
);

export const RotatingPrice = ({ amountNGN, className = '' }) => {
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
      <span>{cur.flag}</span>
      <span>{formatCurrency(amountNGN, cur.code)}</span>
    </span>
  );
};
