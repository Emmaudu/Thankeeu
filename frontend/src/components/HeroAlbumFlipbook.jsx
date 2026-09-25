/**
 * HeroAlbumFlipbook — the homepage hero's sample card, as a real book.
 *
 * Sits directly on the hero background (no panel of its own). Two-page
 * spreads on wide containers, one page at a time on narrow ones (measured on
 * the component's own width, so it is right on laptops, tablets and every
 * phone size alike).
 *
 * The page turn is a genuine 3D leaf: a double-sided page hinged on the spine
 * rotates through 180° in perspective — its front is the page you were
 * reading, its back is the next page — with light and shadow moving across it
 * and onto the pages beneath. A synthesised paper-flip sound plays on every
 * turn the visitor makes (auto-turns stay silent: browsers only allow sound
 * after a tap/click anyway, and silence is politer).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './ui/Icon';
import CardCoverPreview from './CardCoverPreview';
import { CARD_DESIGNS } from '../utils/cardDesigns';
import { PAGE_TURN_CSS, PAGE_TURN_MS, playPageTurn } from '../utils/pageTurn';

const PAGE_BG = '#fffdf8';
const INK = '#1f2937';
const ACCENT = '#7C3AED';
const TURN_MS = PAGE_TURN_MS;
const RECIPIENT = 'Jane';

// Real celebration GIFs (Giphy CDN).
const GIF = {
  party: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  clap: 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',
  love: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
  dance: 'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',
};

const SIGNERS = [
  { name: 'Adaeze O.', role: 'Product team', initials: 'AO', tint: '#EC4899', font: 'font-dancing', size: 20,
    text: `Happy birthday, ${RECIPIENT}!! You are the reason our whole team smiles every day 💛`,
    media: { kind: 'gif', src: GIF.party }, reactions: 7 },
  { name: 'Tunde B.', role: 'Operations', initials: 'TB', tint: '#0EA5E9', font: 'font-dancing', size: 20,
    text: 'You run this place and we all know it. Enjoy every single minute today!',
    media: { kind: 'gif', src: GIF.clap }, reactions: 5 },
  { name: 'Sarah C.', role: 'Design', initials: 'SC', tint: '#7C3AED', font: 'font-sacramento', size: 25,
    text: 'I could not put this in writing, so I recorded it for you instead.',
    media: { kind: 'voice', length: 24, gif: GIF.love }, reactions: 9 },
  { name: 'Marcus W.', role: 'Sales', initials: 'MW', tint: '#F59E0B', font: 'font-dancing', size: 20,
    text: 'From the conference in Nairobi to every late deadline — thank you for always having our backs.',
    media: { kind: 'photo', src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=70', caption: 'Team offsite 🌍' }, reactions: 6 },
  { name: 'Chidi N.', role: 'Finance', initials: 'CN', tint: '#10B981', font: 'font-vibes', size: 24,
    text: 'Dance like nobody from the finance team is watching. (We are.) 🎉',
    media: { kind: 'gif', src: GIF.dance }, reactions: 12 },
  { name: 'Kemi A.', role: 'Engineering', initials: 'KA', tint: '#6366F1', font: 'font-dancing', size: 20,
    text: 'Made you a little video from all of us. Press play when you have a quiet minute ✨',
    media: { kind: 'video', src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=640&q=70', length: '0:38' }, reactions: 11 },
];

const PAGES = [
  { type: 'cover' },
  ...SIGNERS.map((s, i) => ({ type: 'signer', signer: s, number: i + 2 })),
  { type: 'gift' },
  { type: 'back' },
];

/* ── Voice note — plays a visual demo (waveform + timer) ─────────────────── */
const VoiceNote = ({ length, accent }) => {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setT(v => {
      if (v + 1 >= length) { setPlaying(false); return 0; }
      return v + 1;
    }), 1000);
    return () => clearInterval(id);
  }, [playing, length]);
  const bars = [7, 13, 20, 11, 24, 16, 9, 19, 13, 22, 8, 15, 11, 18, 6, 14, 21, 10];
  const fmt = (s) => `0:${String(s).padStart(2, '0')}`;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); setPlaying(p => !p); }}
      className="mt-3 flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left"
      style={{ borderColor: `${accent}44`, background: `${accent}10`, minHeight: 0 }}
      aria-label={playing ? 'Pause voice note' : 'Play voice note'}>
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white" style={{ background: accent }}>
        <Icon name={playing ? 'Pause' : 'Play'} size={14} className={playing ? '' : 'ml-0.5'} />
      </span>
      <span className="flex flex-1 items-end gap-[3px]" aria-hidden="true">
        {bars.map((h, i) => (
          <span key={i} className="w-[3px] rounded-full transition-all duration-300"
            style={{
              height: playing ? Math.max(5, h * (0.6 + 0.4 * Math.abs(Math.sin((t + i) * 1.3)))) : h,
              background: accent, opacity: i / bars.length <= t / length ? 1 : 0.3,
            }} />
        ))}
      </span>
      <span className="text-[11px] font-extrabold tabular-nums" style={{ color: accent }}>{playing ? fmt(t) : fmt(length)}</span>
    </button>
  );
};

/* ── Page faces ───────────────────────────────────────────────────────────── */
const SignerPage = ({ signer, number }) => (
  <div className="flex h-full flex-col overflow-hidden p-4 sm:p-5" style={{ background: PAGE_BG, color: INK }}>
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ background: signer.tint }}>{signer.initials}</span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-extrabold leading-tight">{signer.name}</span>
        <span className="block truncate text-[9px] font-bold uppercase tracking-[0.14em] opacity-45">{signer.role} · signed</span>
      </span>
    </div>

    {signer.media.kind === 'gif' && (
      <div className="relative mt-3 overflow-hidden rounded-xl bg-purple-50 shadow-[0_4px_14px_rgba(0,0,0,0.14)]">
        <img src={signer.media.src} alt="" loading="lazy" draggable="false" className="h-[118px] w-full object-cover sm:h-[132px]" />
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-extrabold text-white">GIF</span>
      </div>
    )}
    {signer.media.kind === 'photo' && (
      <div className="relative mt-3 self-center rounded-[3px] bg-white p-1.5 pb-5 shadow-[0_4px_16px_rgba(0,0,0,0.16)]" style={{ transform: 'rotate(-1.6deg)', width: '90%' }}>
        <div className="h-[104px] w-full overflow-hidden rounded-[2px] bg-purple-50 sm:h-[118px]">
          <img src={signer.media.src} alt="" loading="lazy" draggable="false" className="h-full w-full object-cover" />
        </div>
        <p className="mt-1 text-center text-[12px] font-dancing" style={{ color: '#5b5570' }}>{signer.media.caption}</p>
        <span className="absolute -top-1.5 left-1/2 h-3 w-10 -translate-x-1/2 rounded-[2px]" style={{ background: `${signer.tint}77` }} />
      </div>
    )}
    {signer.media.kind === 'video' && (
      <div className="relative mt-3 overflow-hidden rounded-xl bg-purple-50 shadow-[0_4px_14px_rgba(0,0,0,0.14)]">
        <img src={signer.media.src} alt="" loading="lazy" draggable="false" className="h-[118px] w-full object-cover sm:h-[132px]" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55"><Icon name="Play" size={17} className="ml-0.5 text-white" /></span>
        </span>
        <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-extrabold text-white">{signer.media.length}</span>
      </div>
    )}
    {signer.media.kind === 'voice' && signer.media.gif && (
      <div className="relative mt-3 overflow-hidden rounded-xl bg-purple-50 shadow-[0_4px_14px_rgba(0,0,0,0.14)]">
        <img src={signer.media.gif} alt="" loading="lazy" draggable="false" className="h-[92px] w-full object-cover sm:h-[104px]" />
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-extrabold text-white">GIF</span>
      </div>
    )}

    <p className={`mt-3 break-words leading-snug ${signer.font}`} style={{ fontSize: signer.size, color: '#374151' }}>{signer.text}</p>
    {signer.media.kind === 'voice' && <VoiceNote length={signer.media.length} accent={signer.tint} />}

    <div className="mt-auto flex items-center justify-between pt-3">
      <span className="inline-flex items-center gap-1 text-[12px] font-bold opacity-60">❤️ 🎉 <span className="ml-0.5">{signer.reactions}</span></span>
      <span className="text-[10px] opacity-30">{number}</span>
    </div>
  </div>
);

const GiftPage = () => (
  <div className="flex h-full flex-col items-center justify-center p-5 text-center" style={{ background: 'linear-gradient(160deg,#ECFDF5,#FFFDF8 60%)', color: INK }}>
    <span className="text-5xl" aria-hidden="true">🎁</span>
    <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-700">Group gift</p>
    <p className="mt-1 text-3xl font-extrabold text-emerald-700 sm:text-4xl">₦185,000</p>
    <p className="mt-1 text-sm text-warm-500">from 23 people who chipped in</p>
    <div className="mt-4 flex -space-x-2">
      {SIGNERS.map(s => (
        <span key={s.name} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-extrabold text-white" style={{ background: s.tint }}>{s.initials}</span>
      ))}
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-100 text-[10px] font-extrabold text-purple-700">+17</span>
    </div>
    <p className="mt-4 max-w-[15rem] text-xs text-warm-500">{RECIPIENT} claims it to her bank or as a gift card — with a Memory Movie of every message.</p>
  </div>
);

const BackPage = () => (
  <div className="flex h-full flex-col items-center justify-center p-5 text-center" style={{ background: 'linear-gradient(160deg,#F5F0FF,#FFF0F7)', color: INK }}>
    <p className="font-vibes text-4xl text-primary-700">With love,</p>
    <p className="mt-1 text-sm font-bold text-warm-600">24 people signed this card</p>
    <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-primary-700 shadow-sm">
      <Icon name="Film" size={14} /> Memory Movie ready to watch
    </div>
    <Link to="/card/new" className="gc-btn-primary mt-5 inline-flex items-center gap-2 text-sm" onClick={e => e.stopPropagation()}>
      <Icon name="Sparkles" size={16} /> Create a card like this
    </Link>
  </div>
);

// Plain paper, for the back of a single page on phones.
const PaperBack = () => (
  <div className="h-full w-full" style={{ background: 'linear-gradient(90deg,#f3eee3,#fffdf8 30%,#fbf7ee)' }} />
);

const CSS = `${PAGE_TURN_CSS}
.haf-spine { background: linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.14) 46%, rgba(0,0,0,.22) 50%, rgba(0,0,0,.14) 54%, rgba(0,0,0,0) 100%); }
@keyframes haf-in { 0% { transform: rotateY(-180deg) } 50% { transform: rotateY(-90deg) translateZ(30px) } 100% { transform: rotateY(0deg) } }
`;

export default function HeroAlbumFlipbook() {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(560);
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(null); // { from, to, dir: 'fwd'|'bwd' }
  const [auto, setAuto] = useState(true);
  const [hover, setHover] = useState(false);
  const touch = useRef(null);
  const turnTimer = useRef(null);
  const playSound = playPageTurn;

  const design = useMemo(() => (
    CARD_DESIGNS.find(d => d.occasion === 'birthday' && (d.image || d.artwork))
    || CARD_DESIGNS.find(d => d.id === 'starry_night') || CARD_DESIGNS[0]
  ), []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(el.clientWidth || 560);
    measure();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure); }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Spreads when two pages fit at a readable size; otherwise one page.
  const single = width < 540;
  const pageW = single ? Math.min(width - 72, 360) : Math.min(Math.floor((width - 72) / 2), 340);
  // A4 portrait, the same ratio as the card cover (210 × 297).
  const pageH = Math.round(pageW * 297 / 210);

  // A view is [left, right]; null = no page there (inside of the cover).
  const views = useMemo(() => {
    if (single) return PAGES.map(p => [null, p]);
    const rest = PAGES.slice(1);
    const out = [[null, PAGES[0]]];
    for (let i = 0; i < rest.length; i += 2) out.push([rest[i] || null, rest[i + 1] || null]);
    return out;
  }, [single]);

  useEffect(() => { setIndex(i => Math.min(i, views.length - 1)); setTurn(null); }, [views.length]);
  useEffect(() => () => clearTimeout(turnTimer.current), []);

  const go = useCallback((next, byUser = true) => {
    if (turn) return;                                   // one leaf at a time
    const to = ((next % views.length) + views.length) % views.length;
    if (to === index) return;
    if (byUser) { setAuto(false); playSound(); }
    setTurn({ from: index, to, dir: to > index ? 'fwd' : 'bwd' });
    clearTimeout(turnTimer.current);
    turnTimer.current = setTimeout(() => { setIndex(to); setTurn(null); }, TURN_MS);
  }, [turn, index, views.length, playSound]);

  // Gentle auto-turn until the visitor interacts.
  useEffect(() => {
    if (!auto || hover || turn) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setTimeout(() => go(index + 1, false), index === 0 ? 3000 : 4800);
    return () => clearTimeout(id);
  }, [auto, hover, index, turn, go]);

  const renderPage = (p) => {
    if (!p) return null;
    if (p.type === 'cover') {
      return (
        <div className="h-full w-full overflow-hidden" style={{ background: '#1a1035' }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: '100%' }}>
              <CardCoverPreview
                design={design}
                occasionLabel="Birthday"
                occasionStyle={{ color: '#ffffff', background: 'rgba(0,0,0,0.32)' }}
                recipientName={RECIPIENT}
                title={`Happy Birthday, ${RECIPIENT}!`}
                senderName="The Product Team"
              />
            </div>
          </div>
        </div>
      );
    }
    if (p.type === 'signer') return <SignerPage signer={p.signer} number={p.number} />;
    if (p.type === 'gift') return <GiftPage />;
    if (p.type === 'back') return <BackPage />;
    return null;
  };

  // What the static book shows underneath while a leaf turns.
  // The layout can switch between spreads and single pages at any moment
  // (resize, phone rotation, scrollbar appearing). `views` then has a
  // different length for one render before the effect above re-clamps the
  // state — so never index it with a stale value.
  const last = views.length - 1;
  const safeIndex = Math.min(Math.max(index, 0), last);
  const turnOk = !!turn && turn.from <= last && turn.to <= last;
  const cur = views[safeIndex] || [null, null];
  let baseLeft = cur[0];
  let baseRight = cur[1];
  let leaf = null;
  if (turnOk) {
    const A = views[turn.from];
    const B = views[turn.to];
    if (single) {
      // Phone: the page lifts off its left edge to reveal the next one
      // (forward), or the previous page swings back over it (back).
      if (turn.dir === 'fwd') { baseRight = B[1]; leaf = { side: 'right', front: A[1], back: 'paper' }; }
      else { baseRight = A[1]; leaf = { side: 'right-in', front: B[1], back: 'paper' }; }
      baseLeft = null;
    } else if (turn.dir === 'fwd') {
      baseLeft = A[0]; baseRight = B[1];
      leaf = { side: 'right', front: A[1], back: B[0] };
    } else {
      baseLeft = B[0]; baseRight = A[1];
      leaf = { side: 'left', front: A[0], back: B[1] };
    }
  }

  // Closed book (cover only) is centred; open spreads use the full width.
  const closed = !single && !turnOk && cur[0] === null;
  const bookW = single ? pageW : pageW * 2;
  const shift = closed ? -pageW / 2 : (!single && turnOk && views[turn.to][0] === null && turn.dir === 'bwd' ? -pageW / 2 : 0);

  const pageBox = (content, extra = {}) => (
    <div className="absolute top-0 overflow-hidden" style={{ width: pageW, height: pageH, ...extra }}>{content}</div>
  );

  const leafEl = leaf && (() => {
    const isIncoming = leaf.side === 'right-in';
    const left = leaf.side === 'left' ? 0 : (single ? 0 : pageW);
    const cls = leaf.side === 'left' ? 'pt-bwd' : 'pt-fwd';
    const backContent = leaf.back === 'paper' ? <PaperBack /> : renderPage(leaf.back);
    if (isIncoming) {
      // Previous page swings in from the left over the current one.
      return (
        <div className="pt-leaf" style={{ left: 0, width: pageW, transformOrigin: 'left center', animation: `haf-in ${TURN_MS}ms cubic-bezier(.42,.08,.22,1) forwards` }}>
          <div className="pt-face">{renderPage(leaf.front)}</div>
          <div className="pt-face pt-back"><PaperBack /></div>
        </div>
      );
    }
    return (
      <div className={`pt-leaf ${cls}`} style={{ left, width: pageW }}>
        <div className="pt-face pt-front">{renderPage(leaf.front)}<div className="pt-shade" /></div>
        <div className="pt-face pt-back">{backContent}<div className="pt-shade" /></div>
      </div>
    );
  })();

  const pageNo = views.slice(0, index).reduce((n, v) => n + v.filter(Boolean).length, 0) + 1;
  const showing = cur.filter(Boolean).length;

  return (
    <div ref={wrapRef} className="w-full select-none" style={{ overflowX: 'clip' }}>
      <style>{CSS}</style>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={`Sample Thankeeu card for ${RECIPIENT}, page ${pageNo}${showing > 1 ? `–${pageNo + 1}` : ''} of ${PAGES.length}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; setAuto(false); }}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
        className="relative flex items-center justify-center rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-primary-200"
        style={{ padding: '18px 0 40px' }}
      >
        {/* The book */}
        <div className="pt-book" style={{ width: bookW, height: pageH, transform: `translateX(${shift}px)`, transition: 'transform .6s cubic-bezier(.4,0,.2,1)' }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            go(index + (e.clientX - r.left > r.width / 2 ? 1 : -1));
          }}>
          {/* Soft drop shadow under the open pages */}
          <div className="pointer-events-none absolute -bottom-4 left-[4%] right-[4%] h-8 rounded-[50%]" style={{ background: 'radial-gradient(ellipse at center, rgba(49,24,99,0.28), transparent 70%)', filter: 'blur(4px)' }} />

          {!single && baseLeft && pageBox(renderPage(baseLeft), { left: 0, borderRadius: '10px 0 0 10px', boxShadow: '-6px 14px 34px rgba(49,24,99,0.18)' })}
          {baseRight && pageBox(renderPage(baseRight), { left: single ? 0 : pageW, borderRadius: single ? 10 : '0 10px 10px 0', boxShadow: '6px 14px 34px rgba(49,24,99,0.18)' })}

          {/* Shadow cast by the turning leaf onto the page it uncovers */}
          {leaf && leaf.side !== 'right-in' && (
            <div className="pt-cast" style={{
              left: leaf.side === 'left' ? 0 : (single ? 0 : pageW), width: pageW,
              background: leaf.side === 'left'
                ? 'linear-gradient(270deg, rgba(0,0,0,0.30), rgba(0,0,0,0) 70%)'
                : 'linear-gradient(90deg, rgba(0,0,0,0.30), rgba(0,0,0,0) 70%)',
            }} />
          )}

          {/* Spine */}
          {!single && baseLeft && <div className="haf-spine pointer-events-none absolute top-0 z-[3]" style={{ left: pageW - 14, width: 28, height: pageH }} />}

          {leafEl}
        </div>

        {/* Arrows — outside the pages so they never cover the content */}
        <button type="button" onClick={() => go(index - 1)} aria-label="Previous page" disabled={index === 0}
          className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-purple-100 bg-white/95 text-primary-600 shadow-md transition hover:scale-105 disabled:opacity-40 sm:h-11 sm:w-11">
          <Icon name="ChevronLeft" size={20} />
        </button>
        <button type="button" onClick={() => go(index + 1)} aria-label={index === views.length - 1 ? 'Back to the cover' : 'Next page'}
          className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-purple-100 bg-white/95 text-primary-600 shadow-md transition hover:scale-105 sm:h-11 sm:w-11">
          <Icon name={index === views.length - 1 ? 'Refresh' : 'ChevronRight'} size={20} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {views.map((_, i) => (
            <button key={i} type="button" onClick={() => go(i)} aria-label={i === 0 ? 'Go to cover' : `Go to page ${i + 1}`}
              className="flex items-center justify-center" style={{ minHeight: 0, height: 20, width: i === index ? 26 : 12 }}>
              <span className="block h-2 rounded-full transition-all" style={{ width: i === index ? 22 : 8, background: i === index ? ACCENT : '#D8CCF7' }} />
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-warm-400">
        Tap a page or swipe to flip · every signer gets a page with messages, photos, GIFs, videos &amp; voice notes
      </p>
    </div>
  );
}
