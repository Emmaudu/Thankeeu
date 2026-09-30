/**
 * HeroAlbumStack — three group-card albums stacked in the homepage hero.
 * All three are birthday cards now (Jane, Sarah, Jackson).
 *
 * Jane's album is in the front (straight). Sarah's tilts left behind it.
 * Jackson's tilts right behind it. Clicking any back album brings it to
 * the front with a smooth CSS transition — the previously-front album
 * slides behind with the appropriate tilt.
 *
 * Each album is a full NaturalFlipBook with its own cover design, signers,
 * and page set — exactly like HeroAlbumFlipbook but parameterised.
 *
 * Visible on both mobile and desktop, same tilt/offset on every size —
 * the percentages are relative to the container so it scales cleanly.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Icon from './ui/Icon';
import CardCoverPreview from './CardCoverPreview';
import { getIllustratedCovers } from '../utils/illustratedCardDesigns';
import NaturalFlipBook, { flipViews, viewOf } from './NaturalFlipBook';

/* ── shared typography ───────────────────────────────────────────────────── */
const PAGE_BG = '#fffdf8';
const INK = '#1f2937';
// Stable reference (not recreated per render) so background albums that
// haven't been activated yet don't remount their book on every parent render.
const COVER_ONLY_PAGE = [{ type: 'cover' }];

const FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Sacramento&family=Great+Vibes&display=swap');
.font-dancing { font-family:'Dancing Script', cursive; }
.font-vibes   { font-family:'Great Vibes', cursive; }
.font-sacramento { font-family:'Sacramento', cursive; }
`;

/* ── GIFs ───────────────────────────────────────────────────────────────── */
const GIF = {
  party:   'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  clap:    'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',
  love:    'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
  dance:   'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif',
  confetti:'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif',
  hug:     'https://media.giphy.com/media/l4Ki2obCyAQS5WhFe/giphy.gif',
  cake:    'https://media.giphy.com/media/3o7abKhkRnlFXUVzpe/giphy.gif',
};

/* ── Voice note ─────────────────────────────────────────────────────────── */
const pickVoice = () => {
  const list = window.speechSynthesis?.getVoices?.() || [];
  const en = list.filter(v => /^en(-|_|$)/i.test(v.lang));
  const prefer = [/Google UK English Male/i, /Daniel/i, /Arthur/i, /Guy/i, /Ryan/i, /Male/i, /Google US English/i, /Alex/i];
  for (const re of prefer) { const v = en.find(x => re.test(x.name)); if (v) return v; }
  return en[0] || list[0] || null;
};

const VoiceNote = ({ line, length, accent }) => {
  const [playing, setPlaying] = useState(false);
  const [t, setT]   = useState(0);
  const uttRef       = useRef(null);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setT(v => Math.min(length, v + 1)), 1000);
    return () => clearInterval(id);
  }, [playing, length]);
  useEffect(() => () => { try { if (uttRef.current) window.speechSynthesis.cancel(); } catch { /**/ } }, []);
  const stop = () => { try { window.speechSynthesis?.cancel(); } catch { /**/ } uttRef.current = null; setPlaying(false); setT(0); };
  const play = () => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    setT(0); setPlaying(true);
    if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') { setTimeout(() => { setPlaying(false); setT(0); }, length * 1000); return; }
    synth.cancel();
    const u = new window.SpeechSynthesisUtterance(line);
    const v = pickVoice(); if (v) u.voice = v;
    u.lang = v?.lang || 'en-GB'; u.rate = 0.86; u.pitch = 0.82; u.volume = 1;
    u.onend = () => { if (uttRef.current === u) { uttRef.current = null; setPlaying(false); setT(0); } };
    u.onerror = u.onend; uttRef.current = u; synth.speak(u);
  };
  const bars = [7,13,20,11,24,16,9,19,13,22,8,15,11,18,6,14,21,10];
  const fmt = s => `0:${String(s).padStart(2,'0')}`;
  return (
    <button type="button" onClick={e => { e.stopPropagation(); if (playing) stop(); else play(); }}
      className="mt-3 flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left"
      style={{ borderColor:`${accent}44`, background:`${accent}10`, minHeight:0 }}
      aria-label={playing ? 'Stop voice note' : 'Play voice note'}>
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white" style={{ background: accent }}>
        <Icon name={playing ? 'Pause' : 'Play'} size={14} className={playing ? '' : 'ml-0.5'} />
      </span>
      <span className="flex flex-1 items-end gap-[3px]" aria-hidden="true">
        {bars.map((h, i) => (
          <span key={i} className="w-[3px] rounded-full transition-all duration-300"
            style={{ height: playing ? Math.max(5, h * (0.6 + 0.4 * Math.abs(Math.sin((t + i) * 1.3)))) : h,
              background: accent, opacity: i / bars.length <= t / length ? 1 : 0.3 }} />
        ))}
      </span>
      <span className="text-[11px] font-extrabold tabular-nums" style={{ color: accent }}>{playing ? fmt(t) : fmt(length)}</span>
    </button>
  );
};

/* ── Page face components ────────────────────────────────────────────────── */
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
      <div className="relative mt-3 self-center rounded-[3px] bg-white p-1.5 pb-5 shadow-[0_4px_16px_rgba(0,0,0,0.16)]" style={{ transform:'rotate(-1.6deg)', width:'90%' }}>
        <div className="h-[104px] w-full overflow-hidden rounded-[2px] bg-purple-50 sm:h-[118px]">
          <img src={signer.media.src} alt="" loading="lazy" draggable="false" className="h-full w-full object-cover" />
        </div>
        <p className="mt-1 text-center text-[12px] font-dancing" style={{ color:'#5b5570' }}>{signer.media.caption}</p>
        <span className="absolute -top-1.5 left-1/2 h-3 w-10 -translate-x-1/2 rounded-[2px]" style={{ background:`${signer.tint}77` }} />
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

    <p className={`mt-3 break-words leading-snug ${signer.font}`} style={{ fontSize: signer.size, color:'#374151' }}>{signer.text}</p>
    {signer.media.kind === 'voice' && <VoiceNote line={signer.media.line} length={signer.media.length} accent={signer.tint} />}

    <div className="mt-auto flex items-center justify-between pt-3">
      <span className="inline-flex items-center gap-1 text-[12px] font-bold opacity-60">❤️ 🎉 <span className="ml-0.5">{signer.reactions}</span></span>
      <span className="text-[10px] opacity-30">{number}</span>
    </div>
  </div>
);

const InsidePage = ({ recipient, accent }) => (
  <div className="flex h-full flex-col items-center justify-center p-6 text-center" style={{ background:'linear-gradient(160deg,#FFFDF8,#FBF5FF)', color: INK }}>
    <p className="text-[10px] font-extrabold uppercase tracking-[0.24em]" style={{ color: accent }}>For</p>
    <p className="font-vibes text-5xl leading-tight" style={{ color: accent }}>{recipient}</p>
    <p className="mt-3 max-w-[14rem] text-sm leading-relaxed text-warm-500">Every page in this book was written by someone who cares about you.</p>
    <p className="mt-5 text-xs font-bold text-warm-400">Turn the page →</p>
  </div>
);

const GiftPage = ({ signers, recipient, amount, currency }) => (
  <div className="flex h-full flex-col items-center justify-center p-5 text-center" style={{ background:'linear-gradient(160deg,#ECFDF5,#FFFDF8 60%)', color: INK }}>
    <span className="text-5xl" aria-hidden="true">🎁</span>
    <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-700">Group gift</p>
    <p className="mt-1 text-3xl font-extrabold text-emerald-700 sm:text-4xl">{currency}{amount}</p>
    <p className="mt-1 text-sm text-warm-500">from {signers.length + 17} people who chipped in</p>
    <div className="mt-4 flex -space-x-2">
      {signers.map(s => (
        <span key={s.name} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-extrabold text-white" style={{ background: s.tint }}>{s.initials}</span>
      ))}
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-100 text-[10px] font-extrabold text-purple-700">+17</span>
    </div>
    <p className="mt-4 max-w-[15rem] text-xs text-warm-500">{recipient} claims it to her bank or as a gift card.</p>
  </div>
);

const BackPage = ({ signerCount }) => (
  <div className="flex h-full flex-col items-center justify-center p-5 text-center" style={{ background:'linear-gradient(160deg,#F5F0FF,#FFF0F7)', color: INK }}>
    <p className="font-vibes text-4xl text-primary-700">With love,</p>
    <p className="mt-1 text-sm font-bold text-warm-600">{signerCount} people signed this card</p>
    <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-primary-700 shadow-sm">
      <Icon name="Film" size={14} /> Memory Movie ready to watch
    </div>
    <Link to="/card/new" className="gc-btn-primary mt-5 inline-flex items-center gap-2 text-sm" onClick={e => e.stopPropagation()}>
      <Icon name="Sparkles" size={16} /> Create a card like this
    </Link>
  </div>
);

/* ── Album config ────────────────────────────────────────────────────────── */

// Jane — Birthday (front album, cosmic/celebration design)
const JANE_SIGNERS = [
  { name:'Adaeze O.', role:'Product team', initials:'AO', tint:'#EC4899', font:'font-dancing', size:20,
    text:`Happy birthday, Jane!! You are the reason our whole team smiles every day 💛`,
    media:{ kind:'gif', src:GIF.party }, reactions:7 },
  { name:'Tunde B.', role:'Operations', initials:'TB', tint:'#0EA5E9', font:'font-dancing', size:20,
    text:'You run this place and we all know it. Enjoy every single minute today!',
    media:{ kind:'gif', src:GIF.clap }, reactions:5 },
  { name:'Sarah C.', role:'Design', initials:'SC', tint:'#7C3AED', font:'font-sacramento', size:25,
    text:'I could not put this in writing, so I recorded it for you instead.',
    media:{ kind:'voice', length:12, gif:GIF.love, line:`In a world full of ordinary days… one person made every single one of them better. Jane… happy birthday. From all of us — with love.` }, reactions:9 },
  { name:'Marcus W.', role:'Sales', initials:'MW', tint:'#F59E0B', font:'font-dancing', size:20,
    text:'From the conference in Nairobi to every late deadline — thank you for always having our backs.',
    media:{ kind:'photo', src:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=70', caption:'Team offsite 🌍' }, reactions:6 },
  { name:'Chidi N.', role:'Finance', initials:'CN', tint:'#10B981', font:'font-vibes', size:24,
    text:'Dance like nobody from the finance team is watching. (We are.) 🎉',
    media:{ kind:'gif', src:GIF.dance }, reactions:12 },
  { name:'Kemi A.', role:'Engineering', initials:'KA', tint:'#6366F1', font:'font-dancing', size:20,
    text:'Made you a little video from all of us. Press play when you have a quiet minute ✨',
    media:{ kind:'video', src:'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=640&q=70', length:'0:38' }, reactions:11 },
];

// Sarah — Birthday (music-studio photo cover, birthday_08)
const SARAH_SIGNERS = [
  { name:'Emeka J.', role:'Backend Eng', initials:'EJ', tint:'#E11D48', font:'font-vibes', size:24,
    text:`Sarah, working alongside you is one of those rare gifts. Happy birthday 🎂`,
    media:{ kind:'gif', src:GIF.party }, reactions:14 },
  { name:'Ngozi A.', role:'Product', initials:'NA', tint:'#DB2777', font:'font-dancing', size:20,
    text:'You bring kindness into every room you walk into. The whole team feels it. Happy birthday!',
    media:{ kind:'gif', src:GIF.hug }, reactions:8 },
  { name:'Damilola F.', role:'Design', initials:'DF', tint:'#9333EA', font:'font-sacramento', size:26,
    text:"Your warmth is the team's secret ingredient. So grateful for you.",
    media:{ kind:'voice', length:10, gif:GIF.love, line:`Sarah… on your birthday, the whole team just wants you to know — you are absolutely wonderful. Thank you for being you.` }, reactions:11 },
  { name:'Temi O.', role:'Marketing', initials:'TO', tint:'#F43F5E', font:'font-dancing', size:20,
    text:'From a card designed with love — you deserve every good thing on your day 🎈',
    media:{ kind:'photo', src:'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=640&q=70', caption:'Rooftop picnic 🌸' }, reactions:9 },
  { name:'Kofi B.', role:'Strategy', initials:'KB', tint:'#EC4899', font:'font-dancing', size:20,
    text:"Heart full of gratitude for you. Happy birthday from the whole crew.",
    media:{ kind:'gif', src:GIF.confetti }, reactions:7 },
];

// Jackson — Birthday (cosmic / celestial design — different from Jane's)
const JACKSON_SIGNERS = [
  { name:'Priya K.', role:'People Ops', initials:'PK', tint:'#6366F1', font:'font-vibes', size:24,
    text:`Jackson! Another year of being the coolest person in the building 🚀`,
    media:{ kind:'gif', src:GIF.confetti }, reactions:13 },
  { name:'James R.', role:'Team Lead', initials:'JR', tint:'#0EA5E9', font:'font-dancing', size:20,
    text:'You are the reason every project ships on time. Happy birthday, legend.',
    media:{ kind:'gif', src:GIF.party }, reactions:6 },
  { name:'Zara M.', role:'UX Research', initials:'ZM', tint:'#8B5CF6', font:'font-sacramento', size:25,
    text:'From the whole UX team — stars aligned the day you joined us. Happy birthday ✨',
    media:{ kind:'voice', length:11, gif:GIF.love, line:`Jackson… from all of us… wishing you the most remarkable year yet. Stars are aligning for you. Happy birthday.` }, reactions:10 },
  { name:'Olu T.', role:'Data', initials:'OT', tint:'#F59E0B', font:'font-dancing', size:20,
    text:'My data says: you are 100% exceptional and 0% replaceable. Cheers! 🎂',
    media:{ kind:'photo', src:'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=640&q=70', caption:'Office celebrations 🎉' }, reactions:8 },
  { name:'Chioma E.', role:'Finance', initials:'CE', tint:'#10B981', font:'font-dancing', size:20,
    text:'The budget for how much we appreciate you: unlimited. Happy birthday!',
    media:{ kind:'gif', src:GIF.cake }, reactions:15 },
];

/* ── Pick cover designs ──────────────────────────────────────────────────── */
// All three use real featured photo covers from priority/birthday:
// Jane → birthday_02 (cake & gold balloons), Jackson → birthday_01 (rocket
// launch), Sarah → birthday_08 (music studio).

/* ── Single-album flipbook (parameterised) ────────────────────────────────── */
function AlbumFlipbook({ config, isActive, fullyLoad }) {
  const bookRef  = useRef(null);
  const wrapRef  = useRef(null);
  const [auto, setAuto]       = useState(true);
  const [hover, setHover]     = useState(false);
  const [index, setIndex]     = useState(0);
  const [inView, setInView]   = useState(false);
  const [mobile, setMobile]   = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches);
  const autoTurning = useRef(false);

  const { recipient, signers, design, accent, occasion, gift } = config;
  const FULL_PAGES = useMemo(() => [
    { type:'cover' },
    { type:'inside' },
    ...signers.map((s, i) => ({ type:'signer', signer:s, number:i+3 })),
    ...(gift ? [{ type:'gift' }] : []),
    { type:'back' },
  ], [signers, gift]);
  // Background (never-yet-activated) albums only need their cover to render —
  // the inner pages carry Unsplash photos and Giphy GIFs that would otherwise
  // download for two albums nobody has asked to open yet. The full page set
  // mounts the moment the album is clicked to the front (see `fullyLoad`).
  const PAGES = fullyLoad ? FULL_PAGES : COVER_ONLY_PAGE;

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
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && e.intersectionRatio >= 0.4), { threshold:[0, 0.4, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!isActive) return undefined; // only auto-turn the active (front) album
    if (!auto || (!mobile && hover)) return undefined;
    if (mobile && !inView) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const delay = index === 0 ? (mobile ? 5000 : 3200) : (mobile ? 2000 : 5200);
    const id = setTimeout(() => {
      const api = bookRef.current;
      if (!api) return;
      autoTurning.current = true;
      if (index >= PAGES.length - 1) { api.flipTo(0, false); autoTurning.current = false; }
      else api.next(false);
    }, delay);
    return () => clearTimeout(id);
  }, [auto, hover, index, mobile, inView, isActive, PAGES.length]);

  const onBookState = (s) => {
    if (s === 'read') { autoTurning.current = false; return; }
    if ((s === 'user_fold' || s === 'flipping') && !autoTurning.current) setAuto(false);
  };
  const stopAuto = () => setAuto(false);

  const renderPage = useCallback((p) => {
    if (p.type === 'cover') return (
      <div className="h-full w-full overflow-hidden" style={{ background:'#1a1035' }}>
        <CardCoverPreview
          design={design}
          occasionLabel={occasion}
          occasionStyle={{ color:'#ffffff', background:'rgba(0,0,0,0.32)' }}
          recipientName={recipient}
          title={`Happy ${occasion}, ${recipient}!`}
          senderName="The Team"
          layout={design?.finishedArt ? HERO_COVER_LAYOUT : undefined}
          inBook
        />
      </div>
    );
    if (p.type === 'inside') return <InsidePage recipient={recipient} accent={accent} />;
    if (p.type === 'signer') return <SignerPage signer={p.signer} number={p.number} />;
    if (p.type === 'gift') return <GiftPage signers={signers} recipient={recipient} amount={gift.amount} currency={gift.currency} />;
    return <BackPage signerCount={signers.length + 18} />;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, recipient, accent, occasion, signers, gift]);

  const pages = useMemo(() => PAGES.map((p, i) => ({
    key:`${p.type}-${i}`,
    hard: p.type === 'cover' || p.type === 'back',
    content: renderPage(p),
  })), [PAGES, renderPage]);

  return (
    <div ref={wrapRef} className="w-full h-full"
      onMouseEnter={() => { setHover(true); }}
      onMouseLeave={() => setHover(false)}
      onKeyDown={stopAuto}>
      <div role="region" aria-roledescription="book" tabIndex={isActive ? 0 : -1}
        aria-label={`${recipient}'s ${occasion} card`}
        className={`relative rounded-2xl pb-2 pt-4 outline-none focus-visible:ring-4 focus-visible:ring-primary-200 ${isActive ? 'px-10 sm:px-12' : 'px-2'}`}>
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
            if (!isActive) return null; // no controls on background albums
            const views = flipViews(count, single);
            const cur   = viewOf(i, count, single);
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
                      className="flex items-center justify-center" style={{ minHeight:0, height:20, width: v === cur ? 26 : 12 }}>
                      <span className="block h-2 rounded-full transition-all" style={{ width: v === cur ? 22 : 8, background: v === cur ? accent : '#D8CCF7' }} />
                    </button>
                  ))}
                </div>
              </>
            );
          }}
        />
      </div>
    </div>
  );
}

/* ── Three-album stack ────────────────────────────────────────────────────── */

// Pre-build designs once — three contrasting covers from the illustrated
// birthday collection (cream cake, purple crown, lilac balloons).
const BIRTHDAY_COVERS = getIllustratedCovers('birthday');
const pickCover = stem => BIRTHDAY_COVERS.find(d => d.id.endsWith(`-${stem}`)) || BIRTHDAY_COVERS[0];
const JANE_DESIGN    = pickCover('b1-cake');     // "Happy birthday!"
const JACKSON_DESIGN = pickCover('b2-balloons'); // "Hip hip hooray!"
const SARAH_DESIGN   = pickCover('bd3-crown');   // "Birthday royalty"
// Finished-art covers print their own headline; the demo only adds the
// recipient's name in the free band at the top, as a creator can.
const HERO_COVER_LAYOUT = { recipient: { show: true } };

const ALBUMS = [
  {
    id: 'jane',
    recipient: 'Jane',
    occasion: 'Birthday',
    accent: '#7C3AED',
    design: JANE_DESIGN,
    signers: JANE_SIGNERS,
    gift: { amount:'117', currency:'$' },
  },
  {
    id: 'sarah',
    recipient: 'Sarah',
    occasion: 'Birthday',
    accent: '#A21CAF',
    design: SARAH_DESIGN,
    signers: SARAH_SIGNERS,
    gift: null,
  },
  {
    id: 'jackson',
    recipient: 'Jackson',
    occasion: 'Birthday',
    accent: '#6366F1',
    design: JACKSON_DESIGN,
    signers: JACKSON_SIGNERS,
    gift: { amount:'$240', currency:'' },
  },
];

// Rotation order: [leftId, frontId, rightId]. Clicking left rotates the
// wheel one way, clicking right rotates it the other way — the album you
// clicked always ends up in the middle, and the other two settle either
// side, so it reads as one continuous turn rather than an unrelated swap.
// Sarah sits left, Jackson sits right of Jane (front), tucked behind it.
const INITIAL_ORDER = ['sarah', 'jane', 'jackson'];

export default function HeroAlbumStack() {
  const [order, setOrder] = useState(INITIAL_ORDER);
  // Once an album has been brought to the front, keep its full content
  // mounted (avoids re-downloading photos/GIFs if the visitor flips back
  // and forth). Starts with just the initial front album loaded.
  const [loaded, setLoaded] = useState(() => new Set([INITIAL_ORDER[1]]));

  const bringToFront = useCallback((clickedId) => {
    const [leftId, frontId, rightId] = order;
    if (clickedId === frontId) return; // already front — nothing to do
    setLoaded(prev => (prev.has(clickedId) ? prev : new Set(prev).add(clickedId)));
    if (clickedId === leftId) setOrder([rightId, leftId, frontId]); // rotate right
    else if (clickedId === rightId) setOrder([frontId, rightId, leftId]); // rotate left
  }, [order]);

  // Inject font styles once
  useEffect(() => {
    if (document.getElementById('hero-stack-fonts')) return;
    const s = document.createElement('style');
    s.id = 'hero-stack-fonts';
    s.textContent = FONT_INJECT;
    document.head.appendChild(s);
  }, []);

  const [leftId, frontId, rightId] = order;
  const roleOf = (id) => (id === frontId ? 'front' : id === leftId ? 'left' : 'right');

  // Per-role visual treatment. Every album keeps ONE stable component
  // instance for its whole lifetime (keyed by album id below) — only these
  // style values change as its role changes, so the transition below
  // actually animates a single continuous object rather than swapping DOM
  // nodes at the moment of the click.
  //
  // "left" and "right" are exact mirror images of each other (every value
  // is the same magnitude, sign-flipped) so Sarah (left) and Jackson
  // (right) fan out symmetrically behind Jane.
  //
  // Previous numbers (width 90%, offset -14%) put a back card's own box at
  // [-14%, 76%] / [24%, 114%] of the stack's width — 14 points past the
  // stack's own edge on the outer side. Since the stack clips overflow,
  // that's why one card read as "hiding" (the visible sliver left after
  // the far side got clipped off) while the other read as "distancing"
  // itself (its near edge sat 14% deeper under Jane than intended, so the
  // whole card looked pushed away rather than tucked neatly beside her).
  // The box below never leaves [5%, 95%] before rotation, and the rotation
  // itself (±11deg, default center pivot) can't swing it past that margin,
  // so all three stand fully inside the stack, side by side, Jane in front.
  const roleStyle = (role) => {
    if (role === 'front') return {
      position: 'relative', top: 0, left: 'auto', right: 'auto', width: '100%',
      zIndex: 10, transform: 'rotate(0deg) translate(0,0) scale(1)', opacity: 1,
      pointerEvents: 'all', cursor: 'default', filter: 'none',
    };
    const mirror = role === 'left' ? -1 : 1;
    return {
      position: 'absolute', top: '5%', left: mirror < 0 ? '5%' : 'auto', right: mirror < 0 ? 'auto' : '5%', width: '52%',
      zIndex: 1, transform: `rotate(${mirror * 11}deg) translateY(2%) scale(0.96)`, opacity: 1,
      pointerEvents: 'all', cursor: 'pointer',
      filter: `saturate(1.15) contrast(1.05) drop-shadow(${mirror * 6}px 8px 18px rgba(0,0,0,0.22))`,
    };
  };

  return (
    <div className="relative w-full select-none" style={{ minHeight: 480, overflow: 'visible' }}>
      {ALBUMS.map((album) => {
        const role = roleOf(album.id);
        const style = roleStyle(role);
        const isBack = role !== 'front';
        return (
          <div
            key={album.id}
            onClick={isBack ? () => bringToFront(album.id) : undefined}
            title={isBack ? `View ${album.recipient}'s card` : undefined}
            style={{ ...style, transition: 'transform 0.5s cubic-bezier(.4,0,.2,1), opacity 0.4s, z-index 0s' }}
            role={isBack ? 'button' : undefined}
            tabIndex={isBack ? 0 : undefined}
            aria-label={isBack ? `Bring ${album.recipient}'s card to the front` : undefined}
            onKeyDown={isBack ? (e => (e.key === 'Enter' || e.key === ' ') && bringToFront(album.id)) : undefined}
          >
            <div style={{ pointerEvents: isBack ? 'none' : 'all' }}>
              <AlbumFlipbook config={album} isActive={role === 'front'} fullyLoad={loaded.has(album.id)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
