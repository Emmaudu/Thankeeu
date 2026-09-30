/**
 * HeroAlbumFlipbook — the homepage hero's sample card, as a real book.
 *
 * Sits directly on the hero background (no panel of its own). Pages are turned
 * by hand with NaturalFlipBook: drag a corner and the paper folds where you
 * pull it, or tap / swipe / use the arrows for an animated corner-lift turn.
 * Two-page spreads on wide containers, one page at a time on phones. A gentle,
 * silent auto-turn runs until the visitor touches the book.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './ui/Icon';
import CardCoverPreview from './CardCoverPreview';
import { CARD_DESIGNS } from '../utils/cardDesigns';
import NaturalFlipBook, { flipViews, viewOf } from './NaturalFlipBook';

const PAGE_BG = '#fffdf8';
const INK = '#1f2937';
const ACCENT = '#7C3AED';
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
    media: { kind: 'voice', length: 12, gif: GIF.love }, reactions: 9 },
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

// Even page count so the back cover closes the book on its own.
const PAGES = [
  { type: 'cover' },
  { type: 'inside' },
  ...SIGNERS.map((s, i) => ({ type: 'signer', signer: s, number: i + 3 })),
  { type: 'gift' },
  { type: 'back' },
];

/* ── Voice note — actually speaks when pressed ────────────────────────────
 * An original, movie-trailer style line read by the browser's own speech
 * voice (no recording of a real actor is used — that would need their
 * permission). The waveform and timer follow the speech. Falls back to the
 * visual demo on browsers without speech synthesis. */
const VOICE_LINE = `In a world full of ordinary days… one person made every single one of them better. ${'Jane'}… happy birthday. From all of us — with love.`;

const pickVoice = () => {
  const list = window.speechSynthesis?.getVoices?.() || [];
  const en = list.filter(v => /^en(-|_|$)/i.test(v.lang));
  const prefer = [/Google UK English Male/i, /Daniel/i, /Arthur/i, /Guy/i, /Ryan/i, /Male/i, /Google US English/i, /Alex/i];
  for (const re of prefer) { const v = en.find(x => re.test(x.name)); if (v) return v; }
  return en[0] || list[0] || null;
};

const VoiceNote = ({ length, accent }) => {
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const uttRef = useRef(null);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setT(v => Math.min(length, v + 1)), 1000);
    return () => clearInterval(id);
  }, [playing, length]);
  // Stop talking if the page unmounts mid-sentence.
  useEffect(() => () => { try { if (uttRef.current) window.speechSynthesis.cancel(); } catch { /* ignore */ } }, []);

  const stop = () => {
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    uttRef.current = null; setPlaying(false); setT(0);
  };
  const play = () => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    setT(0); setPlaying(true);
    if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') {
      setTimeout(() => { setPlaying(false); setT(0); }, length * 1000);
      return;
    }
    synth.cancel();
    const u = new window.SpeechSynthesisUtterance(VOICE_LINE);
    const v = pickVoice(); if (v) u.voice = v;
    u.lang = v?.lang || 'en-GB';
    u.rate = 0.86; u.pitch = 0.82; u.volume = 1;
    u.onend = () => { if (uttRef.current === u) { uttRef.current = null; setPlaying(false); setT(0); } };
    u.onerror = u.onend;
    uttRef.current = u;
    synth.speak(u);
  };

  const bars = [7, 13, 20, 11, 24, 16, 9, 19, 13, 22, 8, 15, 11, 18, 6, 14, 21, 10];
  const fmt = (s) => `0:${String(s).padStart(2, '0')}`;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); if (playing) stop(); else play(); }}
      className="mt-3 flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left"
      style={{ borderColor: `${accent}44`, background: `${accent}10`, minHeight: 0 }}
      aria-label={playing ? 'Stop voice note' : 'Play voice note'}>
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
    <p className="mt-1 text-3xl font-extrabold text-emerald-700 sm:text-4xl">$117</p>
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

const InsidePage = () => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center" style={{ background: 'linear-gradient(160deg,#FFFDF8,#FBF5FF)', color: INK }}>
    <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-primary-500">For</p>
    <p className="font-vibes text-5xl leading-tight text-primary-700">{RECIPIENT}</p>
    <p className="mt-3 max-w-[14rem] text-sm leading-relaxed text-warm-500">Every page in this book was written by someone who loves working with you.</p>
    <p className="mt-5 text-xs font-bold text-warm-400">Turn the page →</p>
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

export default function HeroAlbumFlipbook() {
  const bookRef = useRef(null);
  const [auto, setAuto] = useState(true);
  const [hover, setHover] = useState(false);
  const [index, setIndex] = useState(0);

  const design = useMemo(() => (
    CARD_DESIGNS.find(d => d.occasion === 'birthday' && (d.image || d.artwork))
    || CARD_DESIGNS.find(d => d.id === 'starry_night') || CARD_DESIGNS[0]
  ), []);

  const renderPage = (p) => {
    if (p.type === 'cover') {
      return (
        <div className="h-full w-full overflow-hidden" style={{ background: '#1a1035' }}>
          <CardCoverPreview
            design={design}
            occasionLabel="Birthday"
            occasionStyle={{ color: '#ffffff', background: 'rgba(0,0,0,0.32)' }}
            recipientName={RECIPIENT}
            title={`Happy Birthday, ${RECIPIENT}!`}
            senderName="The Product Team"
            // Finished-art covers print their own headline — show just the name.
            layout={design?.finishedArt ? { recipient: { show: true } } : undefined}
            inBook
          />
        </div>
      );
    }
    if (p.type === 'inside') return <InsidePage />;
    if (p.type === 'signer') return <SignerPage signer={p.signer} number={p.number} />;
    if (p.type === 'gift') return <GiftPage />;
    return <BackPage />;
  };

  const pages = useMemo(() => PAGES.map((p, i) => ({
    key: `${p.type}-${i}`,
    hard: p.type === 'cover' || p.type === 'back',
    content: renderPage(p),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [design]);

  // ── Auto-turn (silent) until the visitor turns a page themselves ──────────
  // Desktop: the book is in view with the hero, so it starts right away.
  // Phones: the book sits below the headline, so nothing turns until it is
  // actually on screen — the visitor first sees the COVER for 5 seconds, then
  // a page turns every 2 seconds. Scrolling away pauses it.
  const wrapRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 767px)');
    if (!mq) return undefined;
    const on = () => setMobile(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return undefined; }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const autoTurning = useRef(false);
  useEffect(() => {
    if (!auto || (!mobile && hover)) return undefined;
    if (mobile && !inView) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const delay = index === 0 ? (mobile ? 5000 : 3200) : (mobile ? 2000 : 5200);
    const id = setTimeout(() => {
      const api = bookRef.current;
      if (!api) return;
      autoTurning.current = true;
      if (index >= PAGES.length - 1) { api.flipTo(0, false); autoTurning.current = false; } // a jump, not a turn
      else api.next(false);
    }, delay);
    return () => clearTimeout(id);
  }, [auto, hover, index, mobile, inView]);

  // Any turn the visitor makes (drag, tap, swipe) hands the book over to them.
  const onBookState = (s) => {
    if (s === 'read') { autoTurning.current = false; return; }
    if ((s === 'user_fold' || s === 'flipping') && !autoTurning.current) setAuto(false);
  };
  const stopAuto = () => setAuto(false);

  return (
    <div ref={wrapRef} className="w-full" style={{ overflowX: 'clip' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onKeyDown={stopAuto}>
      <div role="region" aria-roledescription="book" tabIndex={0}
        aria-label={`Sample Thankeeu card for ${RECIPIENT}, page ${index + 1} of ${PAGES.length}`}
        className="relative rounded-2xl px-12 pb-2 pt-4 outline-none focus-visible:ring-4 focus-visible:ring-primary-200 sm:px-14">
        <NaturalFlipBook
          ref={bookRef}
          pages={pages}
          maxPageWidth={340}
          minPageWidth={210}
          showCover
          onPageChange={setIndex}
          onStateChange={onBookState}
          volume={0.45}
          controls={({ index: i, single, count, api }) => {
            const views = flipViews(count, single);
            const cur = viewOf(i, count, single);
            const atEnd = cur === views.length - 1;
            return (
              <>
                <button type="button" onClick={() => { stopAuto(); api.prev(); }} aria-label="Previous page" disabled={i === 0}
                  className="absolute left-0 top-[42%] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-purple-100 bg-white/95 text-primary-600 shadow-md transition hover:scale-105 disabled:opacity-40 sm:h-11 sm:w-11">
                  <Icon name="ChevronLeft" size={20} />
                </button>
                <button type="button" onClick={() => { stopAuto(); if (atEnd) api.flipTo(0); else api.next(); }} aria-label={atEnd ? 'Back to the cover' : 'Next page'}
                  className="absolute right-0 top-[42%] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-purple-100 bg-white/95 text-primary-600 shadow-md transition hover:scale-105 sm:h-11 sm:w-11">
                  <Icon name={atEnd ? 'Refresh' : 'ChevronRight'} size={20} />
                </button>
                <div className="mt-6 flex items-center justify-center gap-1.5">
                  {views.map((start, v) => (
                    <button key={start} type="button" onClick={() => { stopAuto(); api.flipTo(start); }} aria-label={v === 0 ? 'Go to cover' : `Go to page ${start + 1}`}
                      className="flex items-center justify-center" style={{ minHeight: 0, height: 20, width: v === cur ? 26 : 12 }}>
                      <span className="block h-2 rounded-full transition-all" style={{ width: v === cur ? 22 : 8, background: v === cur ? ACCENT : '#D8CCF7' }} />
                    </button>
                  ))}
                </div>
              </>
            );
          }}
        />
      </div>

      <p className="mt-1 text-center text-xs text-warm-400">
        Drag a page corner, tap or swipe to turn · every signer gets a page with messages, photos, GIFs, videos &amp; voice notes
      </p>
    </div>
  );
}
