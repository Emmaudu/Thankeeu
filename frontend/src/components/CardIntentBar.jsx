/**
 * CardIntentBar — the homepage "just type it" box.
 *
 * One sentence in, a pre-filled card wizard out. Everything happens in the
 * browser: no API call, no key, no cost, and nothing to go down.
 *
 * It always lands the customer on /card/customize. That route is the public
 * wizard, and it forwards signed-in individual users to /create-card with the
 * query string intact, so one destination is correct for guests, companies and
 * members alike. The parsed intent travels in sessionStorage (see
 * utils/cardIntent.js) rather than the URL, so a recipient's name never reaches
 * browser history or a shared link.
 *
 * If the sentence cannot be understood we still go to the wizard — just without
 * pre-filling. Nobody gets stuck on the homepage being told to rephrase.
 *
 * Motion: an animated conic-gradient ring, a placeholder that types itself, and
 * a sparkle sweep on submit. All of it is disabled under
 * prefers-reduced-motion — a homepage that jitters is not a wow, it's a
 * headache, and some people get literally sick from it.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './ui/Icon';
import { parseCardIntent, stashIntent, OCCASION_LABELS } from '../utils/cardIntent';
import { coversForOccasion, coverInkFor } from '../utils/applyCardIntent';

// Deliberately concrete. A blank box is the main way an input like this fails —
// people do not know what they are allowed to say, so they say nothing.
// `chip` is what the customer sees — short enough that three fit on one line,
// including on a phone. `text` is the full sentence that actually goes in the
// box, so the example still teaches the phrasing that works.
const EXAMPLES = [
  { chip: '🎂 Birthday',  text: 'Birthday card for my sister Ada, sending this Friday morning' },
  { chip: '👋 Leaving',   text: 'Leaving card for my oga Emeka, sending next Friday, collecting 50k' },
  { chip: '💍 Wedding',   text: 'Wedding card for Ada & Tunde, sending on the 20th at 2pm' },
];

// Real, editable sentences — the box starts with one already in it so the
// customer edits a working example instead of facing an empty field and
// guessing what they are allowed to say. Selecting all on first focus makes it
// obvious this is a template, not something they typed.
const TEMPLATES = [
  'Birthday card for my sister Ada, sending this Friday morning, deadline Wednesday, from Emmanuel',
  'Leaving card for my oga Emeka, sending next Friday afternoon, collecting 50k, from the whole team',
  'Wedding card for Ada & Tunde, sending on the 20th at 11am, from Emmanuel',
  'Retirement card for Mr Okafor, sending next week Monday evening, deadline this Friday, from the office',
];

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
};

const CardIntentBar = ({ className = '' }) => {
  const [tpl, setTpl] = useState(0);
  const [picked, setPicked] = useState(null);      // a cover the customer chose
  const [text, setText] = useState(TEMPLATES[0]);
  const [touched, setTouched] = useState(false);   // has the customer edited it?
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Re-read the sentence as they type so the cover suggestions follow the
  // occasion. The parser is pure string work — no network, no cost — so this
  // is cheap enough to run on every keystroke without debouncing.
  const liveOccasion = useMemo(() => parseCardIntent(text)?.occasion || null, [text]);
  const suggestions  = useMemo(
    () => (liveOccasion ? coversForOccasion(liveOccasion).slice(0, 14) : []),
    [liveOccasion],
  );

  // A cover picked for one occasion must not survive into another.
  useEffect(() => {
    if (picked && !suggestions.some(d => d.id === picked.id)) setPicked(null);
  }, [suggestions]);   // eslint-disable-line react-hooks/exhaustive-deps

  // First click selects the whole template, so one keystroke replaces it.
  const onFocus = (e) => {
    setFocused(true);
    if (!touched) e.target.select();
  };
  const shuffle = () => {
    const next = (tpl + 1) % TEMPLATES.length;
    setTpl(next); setText(TEMPLATES[next]); setTouched(false);
    inputRef.current?.focus();
  };

  const go = (value) => {
    const sentence = (value ?? text).trim();
    if (!sentence || busy) return;
    setBusy(true);
    try {
      const intent = parseCardIntent(sentence);
      // A cover the customer chose beats the one we would have picked, and it
      // brings its own readable ink with it.
      if (intent && picked) {
        intent.design_theme    = picked.id;
        intent.cover_text_color = coverInkFor(picked);
      }
      // Even a low-confidence read is worth carrying: the wizard only applies
      // the fields that are present, so a partial understanding still saves
      // typing and never overwrites anything with a guess.
      if (intent && (intent.ok || intent.matched?.length)) stashIntent(intent, sentence);
      // Brief hold so the sweep animation is seen rather than flashing.
      window.setTimeout(() => navigate('/card/customize?intent=1'), prefersReducedMotion() ? 0 : 260);
    } catch {
      navigate('/card/customize');       // parser must never block card creation
    }
  };

  return (
    <div className={className}>
      <style>{`
        @keyframes tkSpin { to { transform: rotate(360deg); } }
        @keyframes tkSweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
        @keyframes tkFloat { 0%,100% { transform: translateY(0) scale(1); opacity:.55 }
                             50% { transform: translateY(-7px) scale(1.16); opacity:1 } }
        .tk-ring { position:relative; border-radius:1.15rem; padding:2.5px; overflow:hidden;
                   background:linear-gradient(90deg,#E9D5FF,#FBCFE8,#DDD6FE); }
        /* A square far larger than the bar, spun about its centre. Using
           inset:-N% instead makes the sweep hit the long edges of a wide, short
           element at different rates, which reads as a glitch rather than a
           ring. */
        .tk-ring::before {
          content:''; position:absolute; left:50%; top:50%; z-index:0;
          width:max(240%, 760px); aspect-ratio:1; transform:translate(-50%,-50%);
          background:conic-gradient(from 0deg,#7C3AED,#EC4899,#F59E0B,#10B981,#3B82F6,#7C3AED);
          animation:tkSpin 7s linear infinite; opacity:0; transition:opacity .45s ease;
        }
        .tk-ring.is-live::before { opacity:1; }
        .tk-ring > * { position:relative; z-index:1; }
        .tk-sweep { position:absolute; inset:0; z-index:2; pointer-events:none; overflow:hidden; border-radius:1rem; }
        .tk-sweep i { position:absolute; top:0; bottom:0; width:38%; transform:translateX(-120%);
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);
          animation:tkSweep .75s ease-out forwards; }
        .tk-spark { animation:tkFloat 2.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .tk-ring::before, .tk-spark, .tk-sweep i { animation:none !important; }
          .tk-ring.is-live::before { opacity:.55; }
        }
      `}</style>

      {/* Cover suggestions — appear the moment the sentence names an occasion.
          Picking one here means the customer never has to scroll a grid of 300+
          designs later, and the ink is contrast-checked against whichever cover
          they choose so the title stays legible on it. */}
      {/* Held back until the customer engages with the box. Rendered at rest it
          pushed the input itself 120px further down and below the fold on a
          laptop and a phone, which costs more than the suggestions gain. */}
      {suggestions.length > 0 && (focused || touched) && (
        <div className="mb-2">
          <div className="mb-1 flex items-center gap-2 px-1">
            <Icon name="Image" size={13} className="text-primary-500" />
            <span className="text-xs font-bold text-warm-600">
              {OCCASION_LABELS[liveOccasion] || 'Card'} covers — tap one to use it
            </span>
            {picked && (
              <button type="button" onClick={() => setPicked(null)}
                className="text-xs font-semibold text-primary-600 underline" style={{ minHeight: 0 }}>
                clear
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5"
            style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
            {suggestions.map((d) => {
              const on = picked?.id === d.id;
              const ink = coverInkFor(d);
              return (
                <button key={d.id} type="button" onClick={() => setPicked(on ? null : d)}
                  title={d.name || d.id} aria-pressed={on}
                  className="relative flex-shrink-0 overflow-hidden rounded-lg transition-all hover:-translate-y-0.5"
                  style={{
                    width: 50, height: 64, minHeight: 0, padding: 0,
                    background: d.background || '#F5F0FF',
                    border: on ? '2.5px solid #7C3AED' : '1.5px solid #E9D5FF',
                    boxShadow: on ? '0 6px 16px -4px rgba(124,58,237,.55)' : 'none',
                  }}>
                  {d.image && (
                    <img src={d.image} alt="" loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  {/* The name is the fallback for artwork covers, which have no
                      image file — it also confirms the ink is readable. */}
                  {!d.image && (
                    <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[8px] font-bold leading-tight"
                      style={{ color: ink }}>
                      {(d.coverTitle || d.name || '').slice(0, 22)}
                    </span>
                  )}
                  {on && (
                    <span className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary-600 text-[9px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); go(); }}>
        <div className={`tk-ring ${focused || text ? 'is-live' : ''}`}
          style={{ boxShadow: focused ? '0 14px 40px -10px rgba(124,58,237,.45)' : '0 8px 26px -12px rgba(124,58,237,.30)' }}>
          <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 sm:flex-row sm:items-center sm:gap-2">
            {busy && <span className="tk-sweep"><i /></span>}

            <label htmlFor="card-intent" className="sr-only">Describe the card you want to make</label>
            <div className="flex flex-1 items-center gap-2.5 px-2.5 py-2 sm:py-1">
              <Icon name="Sparkles" size={18}
                className={`flex-shrink-0 text-primary-500 ${focused ? '' : 'tk-spark'}`} />
              <input
                id="card-intent"
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => { setText(e.target.value); setTouched(true); }}
                onFocus={onFocus}
                onBlur={() => setFocused(false)}
                maxLength={200}
                autoComplete="off"
                placeholder="Birthday card for my sister Ada, sending this Friday morning…"
                className="w-full bg-transparent text-warm-900 placeholder:text-warm-400 focus:outline-none"
                style={{ fontSize: '16px' }}   /* 16px stops iOS Safari zooming on focus */
              />
            </div>

            <button
              type="submit"
              disabled={!text.trim() || busy}
              className="group relative flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl px-5 py-3 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-45 sm:py-2.5"
              style={{
                background: 'linear-gradient(120deg,#7C3AED 0%,#A855F7 45%,#EC4899 100%)',
                boxShadow: text.trim() && !busy ? '0 8px 20px -6px rgba(168,85,247,.6)' : 'none',
              }}
            >
              {busy
                ? <>Setting it up<span className="inline-block animate-pulse">…</span></>
                : <>Set up my card <Icon name="ArrowRight" size={16} className="transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
        <span className="text-xs font-semibold text-warm-500">
          {touched ? 'Looking good — hit the button' : 'Edit the names and dates above, or'}
        </span>
        <button type="button" onClick={shuffle}
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all hover:-translate-y-0.5"
          style={{ minHeight: 0, borderColor: '#DDD6FE', background: '#F5F3FF', color: '#5B21B6' }}>
          <Icon name="Shuffle" size={12} /> try another example
        </button>
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.chip}
            type="button"
            onClick={() => { setText(ex.text); setTouched(true); inputRef.current?.focus(); }}
            className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{
              minHeight: 0,          /* the global 44px button min-height would balloon these chips */
              borderColor: ['#DDD6FE', '#FBCFE8', '#BFDBFE'][i % 3],
              background: ['#F5F3FF', '#FDF2F8', '#EFF6FF'][i % 3],
              color: ['#5B21B6', '#9D174D', '#1E40AF'][i % 3],
            }}
          >
            {ex.chip}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CardIntentBar;
