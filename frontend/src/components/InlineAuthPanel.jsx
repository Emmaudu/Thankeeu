/**
 * InlineAuthPanel — finish the card without leaving the page.
 *
 * The old wall sent people off to /login or /signup and hoped they came back.
 * This asks one question — new here, or not — and then takes the fewest fields
 * that answer it, right where they already are.
 *
 * No verification code. Creating a card is not a moment that needs one: the
 * account is made immediately via the existing /auth/signup endpoint, and the
 * platform already treats email verification as non-blocking (authController
 * login works regardless of is_verified). The verification email still goes
 * out; it just does not stand between a customer and their card.
 *
 * Where an emailed code DOES still matter — claiming money addressed to your
 * email — it stays, because that check is the only thing stopping someone
 * claiming a stranger's money card.
 *
 * Username is generated, never asked for. It is a schema requirement, not
 * something a person sending their sister a birthday card should have to
 * invent.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Icon from './ui/Icon';
import { useAuth } from '../context/AuthContext';

/** ada@gmail.com → "ada" + 4 digits. Retried on collision. */
const usernameFrom = (email) => {
  const base = String(email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'friend';
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
};

const FIELD = 'w-full rounded-xl border-2 border-purple-100 px-3.5 py-3 text-warm-900 placeholder:text-warm-400 focus:border-primary-400 focus:outline-none';

const InlineAuthPanel = ({ onDone, onAuthenticated, redirectTo = '/create-card?resumed=1', beforeAuth, afterAuth, prefillEmail = '' }) => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null);          // null | 'new' | 'returning'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ full_name: '', email: prefillEmail || '', password: '' });
  const [countdown, setCountdown] = useState(null);   // null until authenticated
  const [outcome, setOutcome]     = useState(null);   // { mode:'live'|'review', slug? }
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
  const canSubmit = mode === 'new'
    ? f.full_name.trim().length >= 2 && emailOk && f.password.length >= 8
    : emailOk && f.password.length >= 1;

  // A short, visible hand-off rather than a jump: the customer sees that the
  // account worked and that their card is coming with them. Ten seconds is
  // long enough to read and short enough not to feel stuck, and "Continue now"
  // is there for anyone who does not want to wait.
  const finish = async () => {
    try { await beforeAuth?.(); } catch { /* draft save is best-effort */ }
    // Told first, so the host page can suspend its own "you're logged in now,
    // go to the dashboard" redirect — otherwise it unmounts this panel the
    // instant the account exists and the hand-off is never seen.
    onAuthenticated?.();
    onDone?.();

    // Every new account gets a free credit, so the common first-time path is
    // "already live" rather than "go and pay". A card that went live needs a
    // two-second hand-off, not ten — there is nothing left for them to do.
    let result = { mode: 'review' };
    try { result = (await afterAuth?.()) || result; } catch { /* fall back to review */ }
    setOutcome(result);
    setCountdown(result.mode === 'live' ? 2 : 10);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate(outcome?.mode === 'live'
        ? `/create-card?live=${encodeURIComponent(outcome.slug)}`
        : redirectTo);
      return;
    }
    const t = window.setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [countdown, navigate, redirectTo, outcome]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true); setError('');
    try {
      // The draft must be saved BEFORE the account exists, so that signing in
      // has something to claim. Failing here must not block the sign-in.
      try { await beforeAuth?.(); } catch { /* best effort */ }

      if (mode === 'new') {
        // One retry: the generated username can collide, and that is our
        // problem to solve, not something to show the customer.
        try {
          await signup(f.full_name.trim(), f.email.trim(), f.password, usernameFrom(f.email));
        } catch (err) {
          const msg = err?.response?.data?.error || '';
          if (/username/i.test(msg)) {
            await signup(f.full_name.trim(), f.email.trim(), f.password, usernameFrom(f.email));
          } else if (/already registered/i.test(msg)) {
            setError('That email already has an account — switch to "I have an account" below.');
            setBusy(false);
            return;
          } else throw err;
        }
      } else {
        await login(f.email.trim(), f.password);
      }
      await finish();
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  /* ── Signed in — hand over ─────────────────────────────────────────────── */
  if (countdown !== null) {
    const live = outcome?.mode === 'live';
    const total = live ? 2 : 10;
    return (
      <div className={`overflow-hidden rounded-2xl border-2 bg-white ${live ? 'border-emerald-300' : 'border-emerald-200'}`}>
        <div className="px-5 py-6 text-center"
          style={{ background: live ? 'linear-gradient(135deg,#ECFDF5,#EDE9FE)' : 'linear-gradient(135deg,#ECFDF5,#F0FDFA)' }}>
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-white text-2xl shadow-sm">
            {live ? '🎉' : '✓'}
          </div>
          <h3 className="mb-1 text-xl font-bold text-warm-900">
            {live ? 'Your card is live!' : "You're in — card saved"}
          </h3>
          <p className="mx-auto max-w-sm text-sm text-warm-600">
            {live
              ? <>We used your <strong>free credit</strong>, so there was nothing to pay. Taking you to your
                 sharing link now — we have emailed it to you too.</>
              : <>Taking you to your dashboard to review your card and pay. You'll land on the
                 review step, with <strong>Back</strong> and <strong>Next</strong> to check everything first.</>}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 px-5 py-4">
          <div className="flex w-full items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-purple-100">
              <div className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / total) * 100}%`, background: 'linear-gradient(90deg,#7C3AED,#EC4899)' }} />
            </div>
            <span className="w-24 shrink-0 text-right text-xs font-bold text-warm-500">{countdown}s to go</span>
          </div>
          <button type="button"
            onClick={() => navigate(live ? `/create-card?live=${encodeURIComponent(outcome.slug)}` : redirectTo)}
            className="btn-primary w-full py-3 font-bold">
            {live ? 'See my card now →' : 'Continue now →'}
          </button>
        </div>
      </div>
    );
  }

  /* ── The one question ──────────────────────────────────────────────────── */
  if (!mode) {
    return (
      <div className="rounded-2xl border border-purple-100 bg-white p-5">
        <h3 className="mb-1 text-lg font-bold text-warm-900">Almost there — is this your first card?</h3>
        <p className="mb-3 text-sm text-warm-500">
          We just need to know where to save it. No verification codes, no waiting.
        </p>
        <div className="mb-4 flex items-start gap-2.5 rounded-xl px-3.5 py-2.5"
          style={{ background:'#FEF3C7' }}>
          <span className="text-base leading-none">🎁</span>
          <p className="text-xs leading-relaxed" style={{ color:'#92400E' }}>
            <strong>New accounts get 1 free credit.</strong> If this is your first card we'll
            use it automatically — nothing to pay, and it goes live straight away so you can
            see exactly how it works.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setMode('new')}
            className="flex items-center gap-3 rounded-2xl border-2 border-primary-200 bg-primary-50/50 p-4 text-left transition-all hover:border-primary-400 hover:bg-primary-50">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white">
              <Icon name="Sparkles" size={17} className="text-primary-600" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-warm-900">I'm new here</span>
              <span className="block text-xs text-warm-500">Create a free account</span>
            </span>
          </button>
          <button type="button" onClick={() => setMode('returning')}
            className="flex items-center gap-3 rounded-2xl border-2 border-purple-100 p-4 text-left transition-all hover:border-primary-300 hover:bg-purple-50/60">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-purple-50">
              <Icon name="LogIn" size={17} className="text-warm-600" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-warm-900">I have an account</span>
              <span className="block text-xs text-warm-500">Just email and password</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  /* ── The fields ────────────────────────────────────────────────────────── */
  return (
    <form onSubmit={submit} className="rounded-2xl border border-purple-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-warm-900">
          {mode === 'new' ? 'Create your free account' : 'Welcome back'}
        </h3>
        <button type="button" onClick={() => { setMode(null); setError(''); }}
          className="text-xs font-semibold text-primary-600 underline" style={{ minHeight: 0 }}>
          Back
        </button>
      </div>

      <div className="space-y-3">
        {mode === 'new' && (
          <div>
            <label htmlFor="ia-name" className="mb-1 block text-xs font-bold text-warm-600">Your name</label>
            <input id="ia-name" className={FIELD} value={f.full_name} autoComplete="name"
              onChange={(e) => set('full_name', e.target.value)} placeholder="Emmanuel U." style={{ fontSize: 16 }} />
          </div>
        )}
        <div>
          <label htmlFor="ia-email" className="mb-1 block text-xs font-bold text-warm-600">Email</label>
          <input id="ia-email" type="email" className={FIELD} value={f.email} autoComplete="email"
            onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" style={{ fontSize: 16 }} />
        </div>
        <div>
          <label htmlFor="ia-pass" className="mb-1 block text-xs font-bold text-warm-600">
            Password {mode === 'new' && <span className="font-medium text-warm-400">(at least 8 characters)</span>}
          </label>
          <input id="ia-pass" type="password" className={FIELD} value={f.password}
            autoComplete={mode === 'new' ? 'new-password' : 'current-password'}
            onChange={(e) => set('password', e.target.value)} placeholder="••••••••" style={{ fontSize: 16 }} />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>
      )}

      <button type="submit" disabled={!canSubmit || busy}
        className="btn-primary mt-4 w-full py-3.5 text-base font-bold disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? 'One moment…' : mode === 'new' ? 'Create account & continue' : 'Sign in & continue'}
      </button>

      <p className="mt-3 text-center text-xs text-warm-500">
        Next you'll land in your dashboard on the review step — check everything with{' '}
        <strong className="text-warm-700">Back</strong> and <strong className="text-warm-700">Next</strong>, then hit pay.
      </p>

      {mode === 'returning' && (
        <p className="mt-2 text-center text-xs">
          <a href="/forgot-password" className="text-primary-600 underline">Forgot your password?</a>
        </p>
      )}
    </form>
  );
};

export default InlineAuthPanel;
