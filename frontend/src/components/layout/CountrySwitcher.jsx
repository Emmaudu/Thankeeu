import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { MARKETS, marketFromPath, prefixOf } from '../../utils/market';

export const MARKET_CHOICE_KEY = 'taskeeu_market_choice';

// Pages that exist on every country site keep the visitor on the same page
// when they switch; anything else goes to the chosen country's home page.
const MIRRORED = /^\/(tasks|taskers|post-task|remote|requester\/(login|signup)|tasker\/(login|signup))\/?$/;

export function rememberMarket(code) {
  try { localStorage.setItem(MARKET_CHOICE_KEY, code); } catch { /* storage blocked */ }
}

/**
 * Country picker shown at the top right of every public page.
 * Airtasker and TaskRabbit use the same pattern: one site per country,
 * switchable at any time, with the choice remembered.
 */
export default function CountrySwitcher({ dark = false, compact = false, onPicked }) {
  const location = useLocation();
  const navigate = useNavigate();
  const current = marketFromPath(location.pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  const pick = (m) => {
    setOpen(false);
    rememberMarket(m.code);
    onPicked?.();
    if (m.code === current.code) return;
    const rest = current.slug ? location.pathname.slice(current.slug.length + 1) || '/' : location.pathname;
    const keep = MIRRORED.test(rest);
    navigate(`${prefixOf(m.code)}${keep ? rest : ''}` || '/');
  };

  return (
    <div ref={ref} className="relative" data-testid="country-switcher">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country: ${current.name}. Change country`}
        className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all"
        style={{
          color: dark ? 'rgba(255,255,255,0.85)' : 'var(--text-2)',
          background: open ? (dark ? 'rgba(255,255,255,0.1)' : 'var(--rose-light)') : 'transparent',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : 'var(--border-light)'}`,
        }}
      >
        <Globe size={14} />
        <span>{compact ? current.code === 'GB' ? 'UK' : current.code : current.short}</span>
        <ChevronDown size={13} style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Choose your country"
          className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden p-1.5"
          style={{ background: 'white', border: '1px solid var(--border-light)', boxShadow: '0 12px 40px rgba(18,9,26,0.15)', zIndex: 60, minWidth: 230 }}
        >
          <li className="px-3 pt-2 pb-1.5" style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Choose your country
          </li>
          {MARKETS.map((m) => {
            const active = m.code === current.code;
            return (
              <li key={m.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => pick(m)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left"
                  style={{ fontSize: 14, fontWeight: active ? 800 : 600, color: active ? 'var(--rose)' : 'var(--text)', background: active ? 'var(--rose-light)' : 'transparent' }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{m.name}</span>
                  <span className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                    {m.currency}
                    {active && <Check size={14} style={{ color: 'var(--rose)' }} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
