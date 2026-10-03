/**
 * SampleCard.jsx — /sample
 *
 * Full editable demo — no backend calls needed.
 * Board view (masonry) + Card/Flipbook view toggle.
 * Inline sign modal: name, message, GIFs, photos, videos, voice notes.
 * Gift area: demo accepts any amount and shows success (no FLW redirect).
 * Thankeeu purple theme background — no Thankbox sky-blue.
 */
import { usePricing, usdLabel } from '../utils/pricing';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import SampleMusic from "../components/SampleMusic";
import { AlbumFlipbookViewer, MessageCard, Confetti } from './CardView';
import { getIllustratedCovers } from '../utils/illustratedCardDesigns';
import { getAlbumTheme } from '../utils/albumThemes';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import VoiceRecorder from '../components/VoiceRecorder';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import { FONT_STYLES, getFontStyle } from '../utils/cardDesigns';
import toast from 'react-hot-toast';
import { formatUSD, convertToNGN } from '../utils/currency';

/* ─── Google fonts ──────────────────────────────────────────────────── */
const FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Patrick+Hand&family=Architects+Daughter&family=Indie+Flower&family=Kalam:wght@400;700&family=Permanent+Marker&family=Dancing+Script:wght@400;700&family=Shadows+Into+Light&display=swap');
`;

const HANDWRITTEN = [
 { id:'caveat', family:"'Caveat',cursive", size:'1.3rem', lh:'1.6' },
 { id:'patrick', family:"'Patrick Hand',cursive", size:'1.1rem', lh:'1.65'},
 { id:'architects', family:"'Architects Daughter',cursive", size:'0.98rem', lh:'1.65'},
 { id:'indie', family:"'Indie Flower',cursive", size:'1.1rem', lh:'1.65'},
 { id:'kalam', family:"'Kalam',cursive", size:'1.15rem', lh:'1.6' },
 { id:'marker', family:"'Permanent Marker',cursive", size:'0.92rem', lh:'1.7' },
 { id:'dancing', family:"'Dancing Script',cursive", size:'1.2rem', lh:'1.65'},
 { id:'shadows', family:"'Shadows Into Light',cursive", size:'1.1rem', lh:'1.7' },
];
const getFont = id =>HANDWRITTEN.find(f=>f.id===id) || HANDWRITTEN[0];

const AMOUNTS = [2500,5000,10000,20000,50000];
// Demo amounts are NGN-stored like real cards; shown in USD.
const formatNGN = n => formatUSD(n);

const GIPHY_PRESETS = [
 { url:'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', label:'Party' },
 { url:'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', label:'Star' },
 { url:'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif', label:'Cake' },
 { url:'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif', label:'Clap' },
 { url:'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', label:'Love' },
 { url:'https://media.giphy.com/media/RrVzUOXldFe8M/giphy.gif', label:'Confetti'},
];

// If the photo cannot load, show a soft "J" monogram instead of alt text.
const JANE_FALLBACK = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#EDE4FF"/><text x="50" y="66" text-anchor="middle" font-family="Georgia,serif" font-size="48" fill="#6D28D9">J</text></svg>');
const onJaneError = e => { if (e.currentTarget.src !== JANE_FALLBACK) e.currentTarget.src = JANE_FALLBACK; };
const JANE_PHOTO = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=320&h=320&fit=crop&crop=faces&q=80';

/* ─── Seed messages ─────────────────────────────────────────────────── */
const SEED = [
 { id:1, name:'Ashley R.', font:'caveat', color:'#1e3a5f', bg:'#f0f4ff',
 text:'Jane! Three years of working with you has been a highlight. Your energy lit up the whole office and this place will feel different without you. Wishing you everything.',
 media:{ type:'gif', url:'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' } },
 { id:2, name:'Michael T.', font:'patrick', color:'#1a1035', bg:'#fff8f0',
 text:"I still remember the day you walked in with those slides and owned the entire room. Go show the world what we already know. Good luck Jane, you'll be a star.",
 media:{ type:'photo', url:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80' } },
 { id:3, name:'Emily B.', font:'architects', color:'#1e3a5f', bg:'#f0fff8',
 text:'Enjoy your travels and the new job. I hope you see so many beautiful places. All the best.',
 media:{ type:'photo', url:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' } },
 { id:4, name:'Jimmy P.', font:'kalam', color:'#3d1a6e', bg:'#1e1e3e', dark:true,
 text:'My favorite coffee buddy! What am I going to do without you? All the very best at the new place.',
 media:{ type:'photo', url:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80' } },
 { id:5, name:'Ryan C.', font:'indie', color:'#1e3a5f', bg:'#fff0f5',
 text:"Dear Jane, I can't believe you're going, but I know adventure is calling. Enjoy every moment of the new chapter.",
 media:{ type:'gif', url:'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' } },
 { id:6, name:'Megan H.', font:'shadows', color:'#1e3a5f', bg:'#f5f0ff',
 text:"YOU'RE SIMPLY THE BEST! Three years, a hundred presentations, one unforgettable farewell party.",
 media:{ type:'gif', url:'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif' }, bigText:true },
 { id:7, name:'Dr. Karen W.',font:'dancing', color:'#1a3d1a', bg:'#f0fff4',
 text:'Watching you grow from a brilliant newcomer into a leader who shapes this company has been a privilege. You are not just talented. You make every room more human.',
 media:null },
 { id:8, name:'Victor S.', font:'caveat', color:'#3d1a00', bg:'#fffbf0',
 text:'Happy farewell to the most diplomatic human I have ever worked with. This next chapter is going to be extraordinary for you.',
 media:{ type:'gif', url:'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif' } },
 { id:9, name:'Brittany O.', font:'kalam', color:'#1e3a5f', bg:'#f0f8ff',
 text:'THANK YOU FOR BEING AWESOME JANE. I LEARNED SO MUCH FROM YOU. PLEASE KEEP IN TOUCH!',
 media:{ type:'photo', url:'https://images.unsplash.com/photo-1516571748831-5d81767b788d?w=600&q=80' }, allCaps:true },
 { id:10, name:'Tyler F.', font:'patrick', color:'#1e1a3e', bg:'#fdf0ff',
 text:'You expand what feels possible. Every room you walk into leaves thinking bigger. Go show the world.',
 media:{ type:'photo', url:'https://images.unsplash.com/photo-1536936459024-2cded18fce68?w=600&q=80' } },
 { id:11, name:'Kevin A.', font:'architects', color:'#1e3a5f', bg:'#fff8f0',
 text:'Happy farewell to the one person who actually reads the IT security emails! Working with you has been a masterclass. Good luck.',
 media:null },
 { id:12, name:'Sarah M.', font:'indie', color:'#1a3d1a', bg:'#f0fff4',
 text:'You were the first senior person to sit down with me and just talk. That conversation gave me more confidence than any training ever could. Thank you, Jane.',
 media:null },
];

/* ─── The real card components, fed with demo data ─────────────────── */
// Resolved lazily: calling these at module load hits a circular import TDZ.
let _demo = null;
const demo = () => {
  if (!_demo) {
    const covers = getIllustratedCovers('leaving');
    const design = covers.find(d => d.id.endsWith('-3t-farewell-legend')) || covers[0];
    _demo = { design, theme: getAlbumTheme('cover_blur'), card: { ...DEMO_CARD_BASE, design_theme: design.id } };
  }
  return _demo;
};
const DEMO_CARD_BASE = {
  id: 'demo', slug: 'sample', occasion: 'leaving', recipient_name: 'Jane', title: 'Farewell, legend!',
  cover_sender: 'The Bluepeak Studio team', album_background_theme: 'cover_blur',
  font_style: 'handwritten', status: 'sent',
};
const FONT_FOR = { caveat: 'handwritten', patrick: 'handwritten', architects: 'modern', indie: 'handwritten', kalam: 'classic', marker: 'modern', dancing: 'calligraphy', shadows: 'elegant' };
const MEDIA_TYPE = { photo: 'image', localImg: 'image', gif: 'gif', video: 'video', voice: 'voice' };
const noop = () => {};
// Demo message → the shape real cards use.
const toRealMessage = (m) => ({
  id: `demo-${m.id}`,
  author_name: m.name,
  content: m.text,
  font_style: FONT_FOR[m.font] || 'handwritten',
  media_url: m.media?.url || null,
  media_type: m.media ? MEDIA_TYPE[m.media.type] || 'image' : null,
  is_private: false,
  reactions: { heart: (Number(String(m.id).slice(-2)) * 7) % 23 },
  created_at: '2026-09-26T10:00:00Z',
});

/* ─── Memory Movie demo: the card played as a short film ─────────────── */
const MOVIE_SLIDES = [
  { photo: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=75' },
  { photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=75' },
  { photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=75' },
  { photo: 'https://images.unsplash.com/photo-1516571748831-5d81767b788d?w=1200&q=75' },
  { photo: 'https://images.unsplash.com/photo-1536936459024-2cded18fce68?w=1200&q=75' },
];
function DemoMovie({ messages }) {
  const slides = useMemo(() => [
    { kind: 'title' },
    ...messages.filter(m => m.content).slice(0, 10).map((m, i) => ({ kind: 'msg', m, photo: m.media_type === 'image' ? m.media_url : MOVIE_SLIDES[i % MOVIE_SLIDES.length].photo })),
    { kind: 'end' },
  ], [messages]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => setI(x => (x + 1) % slides.length), i === 0 ? 3200 : 4200);
    return () => clearTimeout(t);
  }, [i, playing, slides.length]);
  const s = slides[i];
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl" style={{ aspectRatio: '16/9' }}>
        {slides.map((sl, k) => (
          <div key={k} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: k === i ? 1 : 0 }}>
            {sl.kind === 'msg' && <img src={sl.photo} alt="" className="h-full w-full object-cover" style={{ transform: k === i ? 'scale(1.08)' : 'scale(1)', transition: 'transform 4.5s ease-out' }} />}
            {sl.kind !== 'msg' && <img src={demo().design.image} alt="" className="h-full w-full object-cover" style={{ filter: 'blur(18px)', transform: 'scale(1.2)' }} />}
            <div className="absolute inset-0" style={{ background: 'rgba(10,6,24,0.5)' }} />
          </div>
        ))}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white sm:p-10">
          {s.kind === 'title' && (<>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">A Memory Movie for</p>
            <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(2.6rem,8vw,4.5rem)', lineHeight: 1.1 }}>Jane</p>
            <p className="mt-1 text-sm text-white/85">from {messages.length} people at Bluepeak Studio</p>
          </>)}
          {s.kind === 'msg' && (<>
            <p className="max-w-xl text-lg leading-relaxed sm:text-2xl" style={{ fontFamily: "'Dancing Script', cursive", textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>{s.m.content}</p>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-white/90">{s.m.author_name}</p>
          </>)}
          {s.kind === 'end' && (<>
            <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(2.2rem,7vw,3.6rem)' }}>With love, from all of us</p>
            <Link to="/card/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary-700">Make a card like this</Link>
          </>)}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-3">
          <button type="button" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary-700" style={{ minHeight: 0 }}>
            <Icon name={playing ? 'Pause' : 'Play'} size={15} />
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-white/30">
            <div className="h-full bg-white transition-all" style={{ width: `${((i + 1) / slides.length) * 100}%` }} />
          </div>
          <span className="text-xs font-bold text-white/90">{i + 1}/{slides.length}</span>
        </div>
      </div>
      <p className="mt-4 text-center text-sm leading-relaxed text-warm-500">
        Every Thankeeu card becomes a Memory Movie: an MP4 with music made from the messages, photos and voice notes, ready to download and share.{' '}
        <Link to="/memory-movie" className="font-bold text-primary-700 underline underline-offset-2">How the Memory Movie works</Link>
      </p>
    </div>
  );
}

/* ─── Main SampleCard ────────────────────────────────────────────────── */
export default function SampleCard() {
  usePricing(); // re-render when today's prices arrive
 useSEO({
 title: 'See a Live Demo Card | Thankeeu',
 description: 'Try Thankeeu before you commit. Sign this demo group card, add a gift, and see exactly what your recipients will experience.',
 canonical: '/sample',
 });

 const [view, setView] = useState('card');
 // Confetti like a real delivered card: when the card opens, and again after
 // someone signs or chips in. Skipped for people who prefer reduced motion.
 const [celebrate, setCelebrate] = useState(false);
 const burst = useCallback(() => {
   if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
   setCelebrate(false);
   requestAnimationFrame(() => setCelebrate(true));
 }, []);
 useEffect(() => { burst(); }, [burst]);
 useEffect(() => {
   if (!celebrate) return undefined;
   const t = setTimeout(() => setCelebrate(false), 9000);
   return () => clearTimeout(t);
 }, [celebrate]);
 const [messages, setMessages] = useState(SEED);
 const realMessages = useMemo(() => messages.map(toRealMessage), [messages]);
 const [showModal, setShowModal] = useState(false);
 const [signDone, setSignDone] = useState(false);
 const [giftDone, setGiftDone] = useState(false);
 const [giftAmount, setGiftAmount] = useState(null);
 const [customGift, setCustomGift] = useState('');
 const [showGiftArea, setShowGiftArea]= useState(false);

 // Sign form state
 const [name, setName] = useState('');
 const [fontId, setFontId] = useState('caveat');
 const [msgText, setMsgText] = useState('');
 const [mediaFiles, setMediaFiles] = useState([]);
 const [carouselIdx, setCarouselIdx] = useState(0);
 const [showEmoji, setShowEmoji] = useState(false);
 const [showGifPick, setShowGifPick] = useState(false);
 const [showGifFull, setShowGifFull] = useState(false);
 const [isPrivate, setIsPrivate] = useState(false);

 const fileRef = useRef();
 const textareaRef = useRef();

 const openModal = () => { setShowModal(true); setSignDone(false); setGiftDone(false); setShowGiftArea(false); setName(''); setMsgText(''); setMediaFiles([]); setGiftAmount(null); setCustomGift(''); };

 const addMedia = useCallback(files => {
 const items = [];
 for (const f of Array.from(files)) {
 if (f.size > 50*1024*1024) { toast.error(`${f.name} too large`); continue; }
 const type = f.type.startsWith('video/')?'video':f.type.startsWith('audio/')?'voice':f.type==='image/gif'?'gif':'localImg';
 items.push({ file:f, url:URL.createObjectURL(f), type });
 }
 setMediaFiles(p => [...p,...items].slice(0,5));
 }, []);

 const removeMedia = i => {
 setMediaFiles(p => { const n=[...p]; URL.revokeObjectURL(n[i].url); n.splice(i,1); setCarouselIdx(idx=>Math.min(idx,Math.max(0,n.length-1))); return n; });
 };

 const insertEmoji = useCallback(emoji => {
 const el = textareaRef.current;
 if (el && typeof el.selectionStart==='number') {
 const s=el.selectionStart, e=el.selectionEnd;
 setMsgText(t => t.slice(0,s)+emoji+t.slice(e));
 requestAnimationFrame(()=>{ el.focus(); const p=s+emoji.length; el.setSelectionRange(p,p); });
 } else setMsgText(t=>t+emoji);
 setShowEmoji(false);
 },[]);

 const handleSign = () => {
 if (!name.trim()) return toast.error('Please enter your name');
 if (!msgText.trim() && mediaFiles.length===0) return toast.error('Add a message or media');
 const media = mediaFiles[0] ? { type:mediaFiles[0].type, url:mediaFiles[0].url } : null;
 setMessages(p => [...p, {
 id: Date.now(), name:name.trim(), font:fontId,
 color:'#1e3a5f', bg:'#F5F0FF', text:msgText.trim(), media,
 }]);
 setSignDone(true);
 burst();
 };

 const handleGift = () => {
 // Custom amount is typed in USD; presets are NGN-stored like real cards.
 const amt = customGift ? convertToNGN(Number(customGift)||0,'USD') : Number(giftAmount||0);
 if (amt < convertToNGN(1,'USD')) return toast.error('Minimum gift is $1');
 toast.success(`Demo gift of ${formatNGN(amt)} accepted! (No real payment on demo)`);
 setGiftDone(true);
 burst();
 };

 return (
 <>
 <style>{FONT_INJECT}</style>
 <Navbar/>

 {/* Hidden H1 for SEO — visually hidden but readable by crawlers */}
 <h1 className="sr-only">Thankeeu sample group card: see a real farewell card for Jane</h1>

 {celebrate && <Confetti />}
 <SampleMusic />

 {/* ── Hero: the card's own cover, blurred behind a short banner ── */}
 <header className="relative overflow-hidden">
   <div aria-hidden="true" className="absolute inset-0" style={{ background: `url("${demo().design.image}") center / cover no-repeat`, transform: 'scale(1.15)', filter: 'blur(26px) saturate(1.15)' }} />
   <div aria-hidden="true" className="absolute inset-0" style={{ background: 'rgba(255,253,248,0.55)' }} />
   <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:items-center sm:py-10">
     <div className="relative flex-shrink-0">
       <img src={JANE_PHOTO} onError={onJaneError} alt="Jane, smiling" width="160" height="160"
         className="h-32 w-32 rounded-full object-cover shadow-xl ring-4 ring-white sm:h-40 sm:w-40" />
       <div className="absolute -bottom-2 -right-4 w-12 overflow-hidden rounded-md shadow-lg ring-2 ring-white sm:w-14" style={{ aspectRatio: '210/297', transform: 'rotate(8deg)' }}>
         <img src={demo().design.image} alt="Farewell, legend! card cover" className="h-full w-full object-cover" />
       </div>
     </div>
     <div className="min-w-0 flex-1 text-center sm:text-left">
       <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">Sample card · Farewell</p>
       <h2 className="mt-1 text-warm-900" style={{ fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(2.2rem,6vw,3.4rem)', lineHeight: 1.1 }}>Farewell, Jane!</h2>
       <p className="mt-1 text-sm font-semibold text-warm-700">From the Bluepeak Studio team · {messages.length} messages · gift pot {formatNGN(487500)}</p>
       <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
         <button type="button" onClick={openModal} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700" style={{ minHeight: 0 }}>
           <Icon name="PenLine" size={16} /> Add your message
         </button>
         <button type="button" onClick={() => setShowGiftArea(s => !s)} className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-200 bg-white px-5 py-2.5 text-sm font-bold text-primary-700 hover:border-primary-400" style={{ minHeight: 0 }}>
           <Icon name="Gift" size={16} /> Chip in to the gift
         </button>
         <button type="button" onClick={() => setView('movie')} className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-200 bg-white px-5 py-2.5 text-sm font-bold text-primary-700 hover:border-primary-400" style={{ minHeight: 0 }}>
           <Icon name="Film" size={16} /> Watch the Memory Movie
         </button>
       </div>
     </div>
   </div>
 </header>

 {/* ── Tabs ── */}
 <div className="sticky top-0 z-30 border-b border-purple-100 bg-white/95 backdrop-blur">
   <div className="mx-auto flex max-w-5xl justify-center gap-1 px-4 py-2">
     {[['card', 'BookOpen', 'Card'], ['board', 'LayoutGrid', 'Board'], ['movie', 'Film', 'Memory Movie']].map(([id, icon, label]) => (
       <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id}
         className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 sm:px-4 py-2 text-sm font-extrabold ${view === id ? 'bg-primary-600 text-white' : 'text-warm-600 hover:bg-purple-50'}`} style={{ minHeight: 0 }}>
         <Icon name={icon} size={15} />{label}
       </button>
     ))}
   </div>
 </div>

 {/* Gift area (expandable demo) */}
 {showGiftArea && (
 <div style={{ maxWidth:480, margin:'24px auto 0', background:'rgba(255,255,255,0.97)', borderRadius:20, border:'1.5px solid #DDD6FE', padding:'20px 24px', position:'relative', zIndex:3 }}>
 {!giftDone ? (
 <>
 <p style={{ fontWeight:800, fontSize:17, color:'#1A1035', marginBottom:4 }}>Contribute to Jane's gift</p>
 <p style={{ fontSize:13, color:'#7A6CA8', marginBottom:14 }}>34 contributors · {formatNGN(487500)} raised · Demo mode, no real payment</p>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
 {AMOUNTS.map(a => (
 <button key={a} onClick={()=>{setGiftAmount(a);setCustomGift('');}} style={{ padding:'10px 4px', borderRadius:12, border:`2px solid ${giftAmount===a&&!customGift?'#7C3AED':'#DDD6FE'}`, background:giftAmount===a&&!customGift?'#7C3AED':'#fff', color:giftAmount===a&&!customGift?'#fff':'#4A3A7A', fontWeight:700, fontSize:13, cursor:'pointer' }}>
 {formatNGN(a)}
 </button>
 ))}
 </div>
 <input className="input" type="number" placeholder="Custom amount ($)" value={customGift} onChange={e=>{setCustomGift(e.target.value);setGiftAmount(null);}} style={{ marginBottom:10 }}/>
 <button onClick={handleGift} style={{ width:'100%', padding:'13px', borderRadius:14, border:'none', background:'#7C3AED', color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer' }}>
 Contribute (Demo)
 </button>
 </>
 ) : (
 <div style={{ textAlign:'center', padding:'12px 0' }}>
 <p style={{ fontWeight:800, fontSize:18, color:'#1A1035', marginBottom:6 }}>Gift accepted! (Demo)</p>
 <p style={{ fontSize:14, color:'#7A6CA8' }}>On a real card, Jane claims the pot to her bank or as a gift card.</p>
 </div>
 )}
 </div>
 )}

 {/* ── Card / Board / Movie ── */}
 <main style={{ background:'#FAF8FF' }}>
 <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-10">
 {view === 'card' && (
   <AlbumFlipbookViewer card={demo().card} messages={realMessages} design={demo().design} albumTheme={demo().theme}
     coverBackground={demo().design.background} coverTextColor={demo().design.ink || '#1A1035'} replyKit={null} onReact={noop} />
 )}
 {view === 'board' && (
   <>
     <div className="mb-6 grid items-stretch gap-4 md:grid-cols-[1.4fr_1fr]">
       <div className="flex items-start gap-4 rounded-2xl border border-purple-100 bg-white p-5">
         <img src={JANE_PHOTO} onError={onJaneError} alt="Jane" width="64" height="64" className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-2 ring-primary-100" />
         <div className="min-w-0">
         <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">The message wall for Jane</p>
         <h2 className="mt-1 text-2xl font-extrabold text-warm-900">Words to keep forever</h2>
         <p className="mt-2 text-sm leading-relaxed text-warm-500">{messages.length} colleagues signed with messages, photos, GIFs and voice notes. Tap a heart to like one, or add your own.</p>
         </div>
       </div>
       <button type="button" onClick={() => setView('movie')} className="group relative overflow-hidden rounded-2xl text-left" style={{ minHeight: 140, background: '#140C2E' }}>
         <img src={MOVIE_SLIDES[0].photo} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 transition group-hover:opacity-70" />
         <span className="relative flex h-full flex-col justify-end p-5 text-white">
           <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-700"><Icon name="Play" size={18} className="ml-0.5" /></span>
           <span className="text-lg font-extrabold">Memory Movie</span>
           <span className="text-sm text-white/85">Every message turned into a short film with music</span>
         </span>
       </button>
     </div>
     <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
       {realMessages.map((m, i) => (
         <MessageCard key={m.id} message={m} index={i} design={demo().design} canViewPrivate onOpen={noop} onReact={noop} highlighted={false} replyKit={null} canDelete={false} />
       ))}
     </div>
   </>
 )}
 {view === 'movie' && <DemoMovie messages={realMessages} />}
 </div>
 </main>

 {/* ── CTA ── */}
 <div style={{ background:'#fff', padding:'60px 24px', textAlign:'center' }}>
 <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:28, color:'#1A1035', marginBottom:8 }}>Create a card like this for someone special</h2>
 <p style={{ color:'#6B7280', marginBottom:32, fontSize:16 }}>Beautiful group cards with gift pots. From {usdLabel('card_fee')}. Pay only when you send.</p>
 <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
 <Link to="/card/new" style={{ background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', padding:'14px 32px', borderRadius:24, fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:16, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>Create a card, it's free</Link>
 <Link to="/signup" style={{ background:'#F5F0FF', color:'#7C3AED', border:'2px solid #DDD6FE', padding:'14px 32px', borderRadius:24, fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:16, textDecoration:'none' }}>Get started free →</Link>
 </div>
 </div>

 <Footer/>

 {/* ── Sign modal ── */}
 {showModal && (
 <div style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(26,16,53,0.65)', backdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
 onClick={()=>setShowModal(false)}>
 <div style={{ background:'#fff', borderRadius:'28px 28px 0 0', width:'100%', maxWidth:560, padding:'28px 24px 40px', maxHeight:'94vh', overflowY:'auto' }}
 onClick={e=>e.stopPropagation()}>
 {!signDone ? (
 <>
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
 <h3 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:20, color:'#1A1035', margin:0 }}>Sign this demo card </h3>
 <button onClick={()=>setShowModal(false)} style={{ background:'#F5F0FF', border:'none', width:34, height:34, borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
 <Icon name="X" size={16} className="text-warm-400"/>
 </button>
 </div>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, color:'#7A6CA8', marginBottom:16 }}>
 This is a demo. Your message appears here locally, no account needed.
 </p>

 {/* Name */}
 <label style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:700, color:'#5B4B8A', display:'block', marginBottom:6 }}>Your name *</label>
 <input className="input" placeholder="e.g. Kemi Adeyemi" value={name} onChange={e=>setName(e.target.value)} style={{ marginBottom:14 }} maxLength={60}/>

 {/* Font style */}
 <label style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:700, color:'#5B4B8A', display:'block', marginBottom:8 }}>Writing style</label>
 <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
 {FONT_STYLES.map(f => (
 <button key={f.id} onClick={()=>setFontId(f.id)} style={{ padding:'6px 12px', borderRadius:20, border:`2px solid ${fontId===f.id?'#7C3AED':'#DDD6FE'}`, background:fontId===f.id?'#EDE9FE':'#fff', fontFamily:f.family, fontSize:13, fontWeight:600, cursor:'pointer', color:fontId===f.id?'#5B21B6':'#6B7280' }}>
 {f.name}
 </button>
 ))}
 </div>

 {/* Message */}
 <label style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:700, color:'#5B4B8A', display:'block', marginBottom:6 }}>Message</label>
 <div style={{ position:'relative', marginBottom:4 }}>
 <textarea ref={textareaRef} className="input" rows={5} style={{ resize:'none', fontFamily:getFont(fontId).family, fontSize:getFont(fontId).size }} placeholder="Write something heartfelt for Jane…" maxLength={1200} value={msgText} onChange={e=>setMsgText(e.target.value)}/>
 <button type="button" onClick={()=>{setShowEmoji(s=>!s);setShowGifPick(false);setShowGifFull(false);}} style={{ position:'absolute', bottom:8, right:8, width:34, height:34, border:'1.5px solid #EDE9FE', background:'#fff', borderRadius:'50%', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}></button>
 {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={()=>setShowEmoji(false)}/>}
 </div>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11, color:'#9CA3AF', textAlign:'right', marginBottom:14 }}>{msgText.length}/1200</p>

 {/* Media buttons */}
 <div style={{ position:'relative', display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
 <button type="button" onClick={()=>fileRef.current?.click()} className="voice-record-button">Photos/video</button>
 <button type="button" onClick={()=>{setShowGifPick(s=>!s);setShowGifFull(false);setShowEmoji(false);}} className="voice-record-button">Quick GIF</button>
 <button type="button" onClick={()=>{setShowGifFull(s=>!s);setShowGifPick(false);setShowEmoji(false);}} className="voice-record-button">Search GIFs</button>
 <VoiceRecorder onRecorded={f=>addMedia([f])}/>
 <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" multiple className="hidden" onChange={e=>addMedia(e.target.files)}/>

 {/* Quick GIF picker */}
 {showGifPick && (
 <div style={{ position:'absolute', top:'100%', left:0, zIndex:20, background:'#fff', borderRadius:16, border:'1.5px solid #EDE9FE', padding:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, width:280, marginTop:6 }}>
 {GIPHY_PRESETS.map(g => (
 <button key={g.url} onClick={()=>{ setMediaFiles(p=>[...p,{file:null,url:g.url,type:'gif'}].slice(0,5)); setShowGifPick(false); }} style={{ borderRadius:10, overflow:'hidden', border:'none', cursor:'pointer', padding:0, lineHeight:0 }}>
 <img src={g.url} alt={g.label} style={{ width:'100%', height:56, objectFit:'cover', display:'block' }} loading="lazy"/>
 </button>
 ))}
 </div>
 )}
 {showGifFull && <div style={{ width:'100%', marginTop:6 }}><GifPicker onSelect={f=>{ addMedia([f]); setShowGifFull(false); }} onClose={()=>setShowGifFull(false)}/></div>}
 </div>

 {/* Media carousel */}
 {mediaFiles.length > 0 && (
 <div style={{ borderRadius:16, overflow:'hidden', border:'1.5px solid #EDE9FE', marginBottom:14 }}>
 <div style={{ position:'relative', aspectRatio:'16/9', background:'#1A1035' }}>
 {mediaFiles[carouselIdx].type==='video' ? <video src={mediaFiles[carouselIdx].url} className="w-full h-full object-contain" controls/> :
 mediaFiles[carouselIdx].type==='voice' ? <div className="w-full h-full flex flex-col items-center justify-center gap-3"><span style={{fontSize:40}}></span><audio src={mediaFiles[carouselIdx].url} controls style={{width:'80%'}}/></div> :
 <img src={mediaFiles[carouselIdx].url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>}
 <button onClick={()=>removeMedia(carouselIdx)} style={{ position:'absolute', top:6, right:6, width:26, height:26, borderRadius:'50%', background:'rgba(0,0,0,0.6)', color:'#fff', border:'none', cursor:'pointer', fontSize:14 }}></button>
 {mediaFiles.length>1 && <>
 <button onClick={()=>setCarouselIdx(i=>(i-1+mediaFiles.length)%mediaFiles.length)} style={{ position:'absolute', left:4, top:'50%', transform:'translateY(-50%)', width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', cursor:'pointer', fontSize:16 }}>‹</button>
 <button onClick={()=>setCarouselIdx(i=>(i+1)%mediaFiles.length)} style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', cursor:'pointer', fontSize:16 }}>›</button>
 </>}
 </div>
 <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', padding:'6px 0' }}>{carouselIdx+1} of {mediaFiles.length}</p>
 </div>
 )}

 {/* Private toggle */}
 <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, cursor:'pointer' }}>
 <input type="checkbox" checked={isPrivate} onChange={e=>setIsPrivate(e.target.checked)} style={{ width:18, height:18, accentColor:'#7C3AED' }}/>
 <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:14, color:'#374151', fontWeight:600 }}>Private message (only recipient sees this)</span>
 </label>

 <button onClick={handleSign} disabled={!name.trim()||(!msgText.trim()&&mediaFiles.length===0)}
 style={{ width:'100%', padding:'14px', borderRadius:20, border:'none', background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:16, cursor:'pointer', opacity:(!name.trim()||(!msgText.trim()&&mediaFiles.length===0))?0.5:1 }}>
 Add my message to the card
 </button>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, color:'#9CA3AF', textAlign:'center', marginTop:10 }}>
 On a real card you can also add a gift contribution via Flutterwave.
 </p>
 </>
 ) : (
 <div style={{ textAlign:'center', padding:'20px 0' }}>
 <div style={{ fontSize:56, marginBottom:12 }}></div>
 <h3 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:22, color:'#1A1035', marginBottom:8 }}>You signed it!</h3>
 <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, color:'#7A6CA8', marginBottom:20 }}>
 Your message is on the {view==='card'?'flipbook card':'board'} now.
 </p>
 <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
 <Link to="/card/new" style={{ background:'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'#fff', padding:'14px 28px', borderRadius:20, fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, textDecoration:'none', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}>
 Create a card, it's free
 </Link>
 <button onClick={()=>setShowModal(false)} style={{ background:'#F5F0FF', border:'2px solid #DDD6FE', padding:'12px 28px', borderRadius:20, fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, color:'#7C3AED', cursor:'pointer' }}>
 Back to card
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}`}</style>
 </>
 );
}
