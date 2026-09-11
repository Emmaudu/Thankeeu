/**
 * CardIntentBar — the homepage "just type it" box.
 *
 * ONE input, asked three things in turn, because a sentence, an email address
 * and a list of invitees do not fit on one line and should not try to:
 *
 *   1. describe  — "birthday card for my sister Ada, ada@gmail.com, this Friday"
 *   2. sender    — the customer's own email (skipped when already signed in)
 *   3. invites   — optional, comma separated
 *
 * The strip above the box carries the choices, so none of them needs a panel of
 * its own: cover suggestions appear as soon as the sentence names an occasion,
 * and the moment one is picked they collapse into a compact Test / Real pair in
 * the same place.
 *
 * Everything here runs in the browser — no API key, no cost — except the
 * account creation on the test path, which is one call to /auth/quick-start.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './ui/Icon';
import { parseCardIntent, stashIntent, OCCASION_LABELS } from '../utils/cardIntent';
import { coversForOccasion, coverInkFor } from '../utils/applyCardIntent';
import { authAPI, creditsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Real, editable sentences — the box starts with one already in it so the
// customer edits a working example instead of facing an empty field.
const TEMPLATES = [
  'Birthday card for my sister Ada, ada@gmail.com, sending this Friday morning, deadline Wednesday',
  'Leaving card for my oga Emeka, emeka@work.com, sending next Friday afternoon, collecting 50k',
  'Wedding card for Ada & Tunde, ada@gmail.com, sending on the 20th at 11am',
  'Retirement card for Mr Okafor, okafor@work.com, sending next week Monday evening',
];

const EXAMPLES = [
  { chip: '🎂 Birthday', text: 'Birthday card for my sister Ada, ada@gmail.com, sending this Friday morning' },
  { chip: '👋 Leaving',  text: 'Leaving card for my oga Emeka, emeka@work.com, sending next Friday, collecting 50k' },
  { chip: '💍 Wedding',  text: 'Wedding card for Ada & Tunde, ada@gmail.com, sending on the 20th at 2pm' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
};

// `inputId` keeps a second copy of this box on the same page valid: two
// elements sharing one id would break the label and focus for both.
const CardIntentBar = ({ className = '', inputId = 'card-intent' }) => {
  const navigate = useNavigate();
  const { user, loginWithToken } = useAuth();

  const [stage, setStage]       = useState('describe');   // describe | sender | invites
  const [tpl, setTpl]           = useState(0);
  const [text, setText]         = useState(TEMPLATES[0]);
  const [sender, setSender]     = useState('');
  const [invites, setInvites]   = useState('');
  const [touched, setTouched]   = useState(false);
  const [picked, setPicked]     = useState(null);
  const [cardMode, setCardMode] = useState('test');
  const [usedTest, setUsedTest] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [focused, setFocused]   = useState(false);
  const [err, setErr]           = useState('');

  const inputRef = useRef(null);
  const goTimer  = useRef(null);

  // Without this, submitting and then navigating away leaves a pending timeout
  // that yanks the customer to the wizard from wherever they went.
  useEffect(() => () => { if (goTimer.current) window.clearTimeout(goTimer.current); }, []);

  // A returning tester has no free credit left, so the test option is closed
  // rather than offered and then refused two screens later.
  useEffect(() => {
    if (!user) { setUsedTest(false); return undefined; }
    let alive = true;
    creditsAPI.getBalance()
      .then(r => {
        if (!alive) return;
        const free = (r.data?.total_purchased || 0) > 0 ? 0 : (r.data?.credits || 0);
        if (free < 1) { setUsedTest(true); setCardMode('real'); }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [user]);

  // Re-read the sentence as they type so the suggestions follow the occasion.
  // Pure string work, so it is cheap enough to run on every keystroke.
  const liveOccasion = useMemo(
    () => (stage === 'describe' ? parseCardIntent(text)?.occasion || null : null),
    [text, stage],
  );
  const suggestions = useMemo(
    () => (liveOccasion ? coversForOccasion(liveOccasion).slice(0, 14) : []),
    [liveOccasion],
  );

  // A cover picked for one occasion must not survive into another — but only
  // while they are still describing the card. `suggestions` is empty on every
  // later step by design, and without this guard advancing to step 2 silently
  // threw away the cover they had just chosen.
  useEffect(() => {
    if (stage !== 'describe') return;
    if (picked && suggestions.length && !suggestions.some(d => d.id === picked.id)) setPicked(null);
  }, [suggestions, stage]);   // eslint-disable-line react-hooks/exhaustive-deps

  const totalSteps = user ? 2 : 3;

  /* ── What the single input is asking for right now ─────────────────────── */
  const STEP = {
    describe: {
      n: 1,
      value: text,
      set: (v) => { setText(v); setTouched(true); },
      placeholder: 'Birthday card for my sister Ada, ada@gmail.com, sending this Friday morning…',
      cta: 'Set up my card',
      hint: touched ? 'Looking good — hit the button' : 'Edit the names and dates above, or',
    },
    sender: {
      n: 2,
      value: sender,
      set: (v) => { setSender(v); setErr(''); },
      placeholder: 'Your own email address — so the card is saved to you',
      cta: 'Next',
      hint: `Step 2 of ${totalSteps} · your email, not theirs`,
    },
    invites: {
      n: user ? 2 : 3,
      value: invites,
      set: setInvites,
      placeholder: 'Invite people to sign — ada@gmail.com, tunde@work.com (optional)',
      cta: cardMode === 'test' ? 'Create my free test card' : 'Create my card',
      hint: `Step ${user ? 2 : 3} of ${totalSteps} · separate emails with commas, or skip`,
    },
  }[stage];

  // Shown straight away, not held back until the box is touched: the box starts
  // pre-filled with a real sentence, so the occasion is already known on load
  // and the covers are the first thing worth seeing. They disappear the moment
  // one is picked, handing the strip over to the Test / Real pair.
  const showCovers = stage === 'describe' && suggestions.length > 0 && !picked;
  const showModes  = !!picked || stage !== 'describe';

  const buildIntent = () => {
    const intent = parseCardIntent(text.trim()) || {};
    if (picked) {
      intent.design_theme     = picked.id;
      intent.cover_text_color = coverInkFor(picked);
    }
    intent.card_mode = cardMode;
    if (sender.trim()) intent.sender_email = sender.trim();
    const list = invites.split(/[,\n]/).map(e => e.trim()).filter(Boolean);
    if (list.length) intent.invite_emails = list;
    return intent;
  };

  const leave = () => {
    stashIntent(buildIntent(), text.trim());
    goTimer.current = window.setTimeout(
      () => navigate('/card/customize?intent=1'), prefersReducedMotion() ? 0 : 220);
  };

  /** Test card, signed out: the account is created from the email alone. */
  const finishTest = async () => {
    setBusy(true); setErr('');
    try {
      const { data } = await authAPI.quickStart({ email: sender.trim() });
      if (data?.existing) {
        // Knowing an address must never be enough to enter someone's account,
        // so this one signs in on the next screen instead.
        setErr('That email already has an account — continue and sign in on the next screen.');
        setBusy(false);
        return;
      }
      loginWithToken(data.token, data.user);
      leave();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not start your card. Please try again.');
      setBusy(false);
    }
  };

  const submit = (e) => {
    e?.preventDefault();
    if (busy) return;

    if (stage === 'describe') {
      if (!text.trim()) return;
      // A signed-in customer already has an email on file — do not ask again.
      setStage(user ? 'invites' : 'sender');
      window.setTimeout(() => inputRef.current?.focus(), 30);
      return;
    }

    if (stage === 'sender') {
      if (!EMAIL_RE.test(sender.trim())) { setErr('Please enter a valid email address.'); return; }
      setStage('invites');
      window.setTimeout(() => inputRef.current?.focus(), 30);
      return;
    }

    if (cardMode === 'test' && !user) { finishTest(); return; }
    setBusy(true);
    try { leave(); } catch { setBusy(false); navigate('/card/customize'); }
  };

  const back = () => {
    setErr('');
    setStage(stage === 'invites' ? (user ? 'describe' : 'sender') : 'describe');
    window.setTimeout(() => inputRef.current?.focus(), 30);
  };

  const shuffle = () => {
    const next = (tpl + 1) % TEMPLATES.length;
    setTpl(next); setText(TEMPLATES[next]); setTouched(false);
    inputRef.current?.focus();
  };

  return (
    <div className={className}>
      <style>{`
        @keyframes tkSpin { to { transform: rotate(360deg); } }
        @keyframes tkShine { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
        @keyframes tkFloat { 0%,100% { transform:translateY(0) scale(1); opacity:.55 }
                             50% { transform:translateY(-7px) scale(1.16); opacity:1 } }
        .tk-ring { position:relative; border-radius:1.15rem; padding:2.5px; overflow:hidden;
                   background:linear-gradient(90deg,#E9D5FF,#FBCFE8,#DDD6FE); }
        /* A square far larger than the bar, spun about its centre — inset:-N%
           makes the sweep hit the long edges at different rates, which reads as
           a glitch rather than a ring. */
        .tk-ring::before {
          content:''; position:absolute; left:50%; top:50%; z-index:0;
          width:max(240%, 760px); aspect-ratio:1; transform:translate(-50%,-50%);
          background:conic-gradient(from 0deg,#7C3AED,#EC4899,#F59E0B,#10B981,#3B82F6,#7C3AED);
          animation:tkSpin 7s linear infinite; opacity:0; transition:opacity .45s ease;
        }
        .tk-ring.is-live::before { opacity:1; }
        .tk-ring > * { position:relative; z-index:1; }
        .tk-spark { animation:tkFloat 2.6s ease-in-out infinite; }

        /* The sentence is the centrepiece of the page, so it is set like one.
           A solid fill colour is declared FIRST, so a browser without
           background-clip:text shows strong pink rather than nothing at all. */
        .tk-input { font-weight:800; letter-spacing:-0.01em; line-height:1.35;
                    color:#BE185D; -webkit-text-fill-color:#BE185D; }
        @supports (-webkit-background-clip: text) or (background-clip: text) {
          .tk-input {
            background:linear-gradient(92deg,#DB2777 0%,#E11D48 45%,#F43F5E 70%,#DB2777 100%);
            background-size:220% 100%;
            -webkit-background-clip:text; background-clip:text;
            -webkit-text-fill-color:transparent;
            animation:tkShine 6s ease-in-out infinite;
          }
        }
        .tk-input::placeholder { -webkit-text-fill-color:#F9A8D4; color:#F9A8D4; font-weight:700; }
        .tk-opt { transition:background .18s ease, border-color .18s ease; }
        @media (prefers-reduced-motion: reduce) {
          .tk-ring::before, .tk-spark, .tk-input { animation:none !important; }
          .tk-ring.is-live::before { opacity:.55; }
        }
      `}</style>

      {/* ── The strip: covers first, then the compact mode pair ───────────── */}
      {showCovers && (
        <div className="mb-1.5">
          {/* Label and tiles share one row: a separate heading line cost 20px of
              vertical space, which is the difference between the input sitting
              above or below the fold on a laptop. */}
          <div className="flex items-center gap-2">
            <span className="hidden shrink-0 text-[11px] font-bold leading-tight text-warm-500 sm:block"
              style={{ maxWidth: 74 }}>
              {OCCASION_LABELS[liveOccasion] || 'Card'} covers ↓
            </span>
            <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {suggestions.map((d) => (
              <button key={d.id} type="button" data-cover={d.id} onClick={() => setPicked(d)}
                title={d.name || d.id}
                className="relative flex-shrink-0 overflow-hidden rounded-lg transition-transform hover:-translate-y-0.5"
                style={{ width: 40, height: 50, minHeight: 0, padding: 0,
                         background: d.background || '#F5F0FF', border: '1.5px solid #E9D5FF' }}>
                {d.image
                  ? <img src={d.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  : <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[8px] font-bold leading-tight"
                      style={{ color: coverInkFor(d) }}>
                      {(d.coverTitle || d.name || '').slice(0, 22)}
                    </span>}
              </button>
            ))}
            </div>
          </div>
        </div>
      )}

      {showModes && (
        // The covers have done their job and collapse away, so this sits in the
        // same place and keeps the whole thing to one compact strip.
        <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
          {picked && (
            <button type="button" data-role="change-cover"
              onClick={() => { setPicked(null); setStage('describe'); }}
              className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-white py-1 pl-1 pr-2.5 text-xs font-bold text-warm-700"
              style={{ minHeight: 0 }}>
              <span className="block h-5 w-4 overflow-hidden rounded"
                style={{ background: picked.background || '#F5F0FF' }}>
                {picked.image && <img src={picked.image} alt="" className="h-full w-full object-cover" />}
              </span>
              Cover ✓
            </button>
          )}
          {[
            { id: 'test', label: '🎁 Free test card', ink: '#92400E', tint: '#FEF3C7' },
            { id: 'real', label: '💳 Real card',      ink: '#5B21B6', tint: '#F5F3FF' },
          ].map(o => {
            const spent = o.id === 'test' && usedTest;
            const on = cardMode === o.id && !spent;
            return (
              <button key={o.id} type="button" data-mode={o.id} disabled={spent}
                onClick={() => !spent && setCardMode(o.id)} aria-pressed={on}
                title={spent ? "You've already used your free test card" : undefined}
                className="tk-opt rounded-full border-2 px-3 py-1 text-xs font-bold disabled:cursor-not-allowed"
                style={{ minHeight: 0, opacity: spent ? 0.5 : 1,
                         background: on ? o.tint : '#fff',
                         borderColor: on ? o.ink : '#E9D5FF', color: o.ink }}>
                {spent ? '🎁 Test used' : o.label}{on ? ' ✓' : ''}
              </button>
            );
          })}
          <span className="text-xs text-warm-400">
            {usedTest ? 'Your free test card is used — this one is a real card'
              : cardMode === 'test' ? 'Uses your 1 free credit — nothing to pay'
              : 'One-time card fee at the end'}
          </span>
        </div>
      )}

      {/* ── The one input ─────────────────────────────────────────────────── */}
      <form onSubmit={submit}>
        <div className={`tk-ring ${focused || STEP.value ? 'is-live' : ''}`}
          style={{ boxShadow: focused ? '0 14px 40px -10px rgba(124,58,237,.45)'
                                      : '0 8px 26px -12px rgba(124,58,237,.30)' }}>
          <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 sm:flex-row sm:items-center sm:gap-2">
            <label htmlFor={inputId} className="sr-only">{STEP.placeholder}</label>
            <div className="flex flex-1 items-center gap-2.5 px-2.5 py-2 sm:py-1">
              {stage === 'describe'
                ? <Icon name="Sparkles" size={18}
                    className={`flex-shrink-0 text-primary-500 ${focused ? '' : 'tk-spark'}`} />
                : <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[11px] font-extrabold"
                    style={{ background: '#EDE9FE', color: '#5B21B6' }}>{STEP.n}</span>}
              <input
                id={inputId}
                ref={inputRef}
                data-stage={stage}
                type={stage === 'sender' ? 'email' : 'text'}
                autoComplete={stage === 'sender' ? 'email' : 'off'}
                value={STEP.value}
                onChange={(e) => STEP.set(e.target.value)}
                onFocus={(e) => { setFocused(true); if (stage === 'describe' && !touched) e.target.select(); }}
                onBlur={() => setFocused(false)}
                maxLength={stage === 'describe' ? 200 : 400}
                placeholder={STEP.placeholder}
                className="tk-input w-full bg-transparent focus:outline-none"
                /* 16px minimum stops iOS Safari zooming the page on focus. */
                style={{ fontSize: 'clamp(16px, 1.35vw, 19px)' }}
              />
            </div>

            <button type="submit"
              disabled={busy || (stage === 'describe' && !text.trim())}
              className="group flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-45 sm:py-2.5"
              style={{ background: 'linear-gradient(120deg,#7C3AED 0%,#A855F7 45%,#EC4899 100%)',
                       boxShadow: busy ? 'none' : '0 8px 20px -6px rgba(168,85,247,.6)' }}>
              {busy ? 'Setting it up…'
                : <>{STEP.cta} <Icon name="ArrowRight" size={16} className="transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </div>
        </div>
      </form>

      {err && (
        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{err}</p>
      )}

      {/* ── Footer: examples on step 1, navigation afterwards ─────────────── */}
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
        {stage === 'describe' ? (
          <>
            <span className="text-xs font-semibold text-warm-500">{STEP.hint}</span>
            <button type="button" onClick={shuffle}
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-transform hover:-translate-y-0.5"
              style={{ minHeight: 0, borderColor: '#DDD6FE', background: '#F5F3FF', color: '#5B21B6' }}>
              <Icon name="Shuffle" size={12} /> try another example
            </button>
            {EXAMPLES.map((ex, i) => (
              <button key={ex.chip} type="button"
                onClick={() => { setText(ex.text); setTouched(true); inputRef.current?.focus(); }}
                className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-transform hover:-translate-y-0.5"
                style={{ minHeight: 0,
                         borderColor: ['#DDD6FE', '#FBCFE8', '#BFDBFE'][i % 3],
                         background: ['#F5F3FF', '#FDF2F8', '#EFF6FF'][i % 3],
                         color: ['#5B21B6', '#9D174D', '#1E40AF'][i % 3] }}>
                {ex.chip}
              </button>
            ))}
          </>
        ) : (
          <>
            <span className="text-xs font-semibold text-warm-500">{STEP.hint}</span>
            <button type="button" onClick={back} data-role="back"
              className="text-xs font-semibold text-primary-600 underline" style={{ minHeight: 0 }}>
              Back
            </button>
            {stage === 'invites' && (
              <button type="button" onClick={submit} data-role="skip"
                className="text-xs font-semibold text-warm-500 underline" style={{ minHeight: 0 }}>
                Skip — I'll share the link myself
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CardIntentBar;
