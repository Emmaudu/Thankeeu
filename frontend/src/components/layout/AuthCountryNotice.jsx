import { useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { marketFromPath } from '../../utils/market';
import CountrySwitcher from './CountrySwitcher';

/**
 * Country first, the way Airtasker and TaskRabbit do it: every account
 * belongs to one country site. The sign up and log in forms say which
 * country you are on and let you change it before you start.
 */
export default function AuthCountryNotice({ role = 'requester', mode = 'signup' }) {
  const m = marketFromPath(useLocation().pathname);
  return (
    <div className="flex items-center justify-between" data-testid="auth-country"
      style={{ gap: 12, padding: '12px 14px', borderRadius: 14, background: 'white', border: '1px solid var(--border-light)', marginBottom: 20 }}>
      <div className="flex items-start" style={{ gap: 10 }}>
        <Globe size={18} style={{ color: 'var(--rose)', marginTop: 2, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Taskeeu {m.name}</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            {mode === 'signup'
              ? (role === 'tasker'
                ? `You will bid on tasks in ${m.name} and be paid in ${m.currency}. You must live in ${m.name}.`
                : `You will post tasks in ${m.name} and pay in ${m.currency}.`)
              : `Not in ${m.name}? Choose your country first.`}
          </p>
        </div>
      </div>
      <CountrySwitcher compact />
    </div>
  );
}
