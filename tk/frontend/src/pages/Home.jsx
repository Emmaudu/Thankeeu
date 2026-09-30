import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { useState, useEffect, useMemo } from 'react';
import { RotatingPrice, CurrencyToggle } from '../utils/currencyUI';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import CardIntentBar from '../components/CardIntentBar';
import { demoAPI, siteAPI } from '../utils/api';
import HeroAlbumStack from '../components/HeroAlbumStack';
import { getIllustratedCovers, createIllustratedCardUrl } from '../utils/illustratedCardDesigns';

// One lead cover from each illustrated category for the homepage sample strip.
const HOME_COVERS = [
  ['birthday', 'Birthday'], ['leaving', 'Leaving'], ['thank_you', 'Thank you'], ['get_well', 'Get well'],
  ['retirement', 'Retirement'], ['congratulations', 'Congrats'], ['sympathy', 'Sympathy'],
  ['anniversary', 'Anniversary'], ['wedding', 'Wedding'], ['christmas', 'Christmas'],
].map(([occasion, label]) => ({ design: getIllustratedCovers(occasion)[0], label }));
import { FlagBackdrop, SupportedCountries } from '../components/WorldFlags';
import { resolveHero, splitHeroTitle, readCachedHero, writeCachedHero } from '../utils/heroDefaults';
import toast from 'react-hot-toast';
import { LANDING_COVERS_PER_CATEGORY, OCCASION_LABELS, landingFaqs } from '../data/countryLandings';
import { HOME_FAQS } from '../data/homeFaqs';
import { withArticle } from '../data/landingArticles';

// Country landings (see data/countryLandings.js): covers grouped by category.
const landingCoverRows = (landing) => landing.coverOccasions
  .map(occasion => ({ occasion, label: OCCASION_LABELS[occasion] || occasion,
    designs: getIllustratedCovers(occasion, { limit: landing.coversPerCategory || LANDING_COVERS_PER_CATEGORY }) }))
  .filter(r => r.designs.length);

// SEO for a country landing: its own title/description/canonical, and FAQ
// markup built from the same list the page renders.
const landingSeo = (landing, faqs) => ({
  title: landing.title,
  description: landing.description,
  canonical: landing.path,
  keywords: landing.keywords,
  locale: landing.locale,
  jsonLd: [
    SCHEMAS.organization,
    SCHEMAS.softwareApp,
    ...(landing.jsonLdExtra || []),
    SCHEMAS.breadcrumb([{ name: 'Thankeeu', url: '/' }, ...(landing.breadcrumbParents || []), { name: landing.breadcrumb, url: landing.path }]),
    SCHEMAS.webPage(landing.title, landing.description, landing.path),
    SCHEMAS.faqPage(faqs),
  ],
});


const HERO_FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Sacramento&family=Great+Vibes&display=swap');
.font-dancing { font-family:'Dancing Script', cursive; }
.font-vibes { font-family:'Great Vibes', cursive; }
.font-sacramento { font-family:'Sacramento', cursive; }
`;

const ROTATING_WORDS = [
 'Birthday', 'Wedding', 'Leaving', 'Farewell', 'Thank You',
 "Valentine's", 'Anniversary', 'Baby Shower', 'Graduation',
 'Promotion', 'Retirement', 'Christmas', 'Get Well', 'Appreciation',
];

const SAMPLE_MESSAGES = [
 { name: 'Jessica Morgan', role: 'VP of Product', font: 'font-vibes',
 media: 'photo', photoUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
 text: 'Working across time zones with you has been one of the highlights of this role. Happy birthday — hope your day is as bright as the energy you bring!',
 avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face' },
 { name: 'Tunde Bakare', role: 'Operations Lead', font: 'font-dancing',
 media: 'gif', gifUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
 text: 'You are the reason the ops team runs as smoothly as it does. Have a fantastic celebration!',
 avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=120&h=120&fit=crop&crop=face' },
 { name: 'Sarah Chen', role: 'Head of Design', font: 'font-dancing',
 media: 'voice',
 text: "You have the rarest combination — impeccable taste and genuine humility. Happy birthday! ",
 avatar: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=120&h=120&fit=crop&crop=face' },
 { name: 'Marcus Williams', role: 'Sales Director', font: 'font-sacramento',
 media: 'gif', gifUrl: 'https://media.giphy.com/media/3o7abGQa0aRJUurpII/giphy.gif',
 text: 'You make everyone around you sharper. Happy birthday to the most quietly influential person!',
 avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face' },
];

const OCCASIONS = [
 { icon: 'Cake', label: 'Birthday' }, { icon: 'Heart', label: "Valentine's" },
 { icon: 'Briefcase', label: 'Farewell' }, { icon: 'Gift', label: 'Anniversary' },
 { icon: 'HandHeart', label: 'Wedding' }, { icon: 'Baby', label: 'Baby Shower' },
 { icon: 'GraduationCap', label: 'Graduation' }, { icon: 'TrendingUp', label: 'Promotion' },
 { icon: 'Sun', label: 'Retirement' }, { icon: 'Snowflake', label: 'Christmas' },
 { icon: 'HeartPulse', label: 'Get Well' }, { icon: 'Party', label: 'More…' },
];

const STEPS = [
 { num:'01', icon:'Wand', label:'Create', title:'Pick occasion & design', desc:'14 occasions, beautiful designs, set delivery date. Done in 1 minute.' },
 { num:'02', icon:'Share', label:'Invite', title:'Share signing link', desc:'WhatsApp, email, Slack. Anyone can sign, no account needed.' },
 { num:'03', icon:'Heart', label:'Collect', title:'Pool a gift together', desc:'Everyone chips in whatever they can. Secure payments. No cash chasing. Works in USD, GBP, EUR and 30+ currencies.' },
 { num:'04', icon:'Rocket', label:'Deliver', title:'Deliver the surprise', desc:'Schedule or send instantly. Your recipient opens a full card with messages, media & gift.' },
];

const FEATURES = [
 { icon:'Zap', title:'Instant signing links', desc:'Copy a WhatsApp link in one click. No account needed to sign.' },
 { icon:'Gift', title:'Built-in gift pots', desc:'Everyone chips in securely. Pooled automatically. No chasing anyone.' },
 { icon:'Smartphone', title:'Any media type', desc:'Text, photo, video, voice note, GIF — all in one card.' },
 { icon:'Clock', title:'Scheduled delivery', desc:'Set the date. Card arrives exactly when it should.' },
 { icon:'Lock', title:'Private messages', desc:'Contributors can mark personal notes visible only to the recipient.' },
 { icon:'BarChart', title:'Real-time tracking', desc:"See who's signed, how much is collected, in your dashboard." },
];

const TESTIMONIALS = [
 { name:'Sarah M.', role:'HR Manager', location:'Manchester, UK', text:"Our colleague's farewell card had 41 messages and a £280 gift pot. She was in tears. I've never seen a leaving do land like that.", stars:5 },
 { name:'James R.', role:'Team Lead', location:'London, UK', text:"Organized my girlfriend's birthday from abroad. 26 people signed, raised $400. She had no idea it was coming. Absolutely worth it.", stars:5 },
 { name:'Priya K.', role:'People Ops', location:'Austin, TX', text:"No more Google Forms and chasing people for money. Everything just works. The HRIS sync alone saves our team hours every week.", stars:5 },
];

const TEAM_SIZE_OPTIONS = ['1–10','11–50','51–200','201–500','500+'];

/* ─── Demo messages for the hero flipbook ───────────────────────────── */
/* ─── B2B demo modal ─────────────────────────────────────────────────── */
const DemoModal = ({ onClose }) => {
 const [form, setForm] = useState({ contact_name:'', email:'', company_name:'', phone:'', team_size:'', message:'' });
 const [loading, setLoading] = useState(false);
 const [done, setDone] = useState(false);

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!form.contact_name.trim() || !form.email.trim() || !form.company_name.trim())
 return toast.error('Please fill in your name, email and company name');
 setLoading(true);
 try { await demoAPI.submit(form); setDone(true); }
 catch (err) { toast.error(err.response?.data?.error || 'Failed. Email us at support@thankeeu.com'); }
 finally { setLoading(false); }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
 style={{ background:'rgba(26,16,53,0.6)', backdropFilter:'blur(8px)' }} onClick={onClose}>
 <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
 style={{ background:'#fff', border:'1.5px solid #EDE5FF' }} onClick={e => e.stopPropagation()}>
 {done ? (
 <div className="text-center py-8">
 <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center animate-bounce-soft"><Icon name="Party" size={32} className="text-primary-500"/></div>
 <h3 className="text-2xl font-bold text-warm-900 mb-2">Request received!</h3>
 <p className="text-warm-500 text-sm mb-6">We'll reach out within 12 hours.</p>
 <button onClick={onClose} className="btn-primary px-8">Close</button>
 </div>
 ) : (
 <>
 <div className="flex items-start justify-between mb-5">
 <div>
 <div className="mb-2 inline-flex items-center gap-1.5"><Icon name="Calendar" size={13}/>Book a demo</div>
 <h3 className="text-xl font-bold text-warm-900">See Thankeeu for Teams live</h3>
 <p className="text-warm-500 text-sm mt-1">Free · 30 min · Usually within 24hrs</p>
 </div>
 <button onClick={onClose} className="text-warm-400 hover:text-warm-700 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-warm-100">
 <Icon name="X" size={18}/>
 </button>
 </div>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-warm-700 mb-1.5">Full name *</label>
 <input className="input" placeholder="Your name" value={form.contact_name} onChange={e=>setForm(p=>({...p,contact_name:e.target.value}))} required/>
 </div>
 <div>
 <label className="block text-xs font-bold text-warm-700 mb-1.5">Work email *</label>
 <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required/>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-warm-700 mb-1.5">Company name *</label>
 <input className="input" placeholder="Acme Corp" value={form.company_name} onChange={e=>setForm(p=>({...p,company_name:e.target.value}))} required/>
 </div>
 <div>
 <label className="block text-xs font-bold text-warm-700 mb-1.5">Phone</label>
 <input className="input" placeholder="+234…" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-warm-700 mb-1.5">Team size</label>
 <div className="flex flex-wrap gap-2">
 {TEAM_SIZE_OPTIONS.map(s => (
 <button type="button" key={s} onClick={()=>setForm(p=>({...p,team_size:s}))}
 className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.team_size===s?'border-primary-400 bg-primary-50 text-primary-600':'border-purple-100 text-warm-600 hover:border-primary-300'}`}>{s}</button>
 ))}
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-warm-700 mb-1.5">What would you like to see?</label>
 <textarea className="input resize-none" rows={3} placeholder="Birthday automations, HRIS sync..." value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}/>
 </div>
 <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
 {loading?<span className="flex items-center justify-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Booking…</span>:<span className="inline-flex items-center justify-center gap-2"><Icon name="Calendar" size={16}/>Book my demo <Icon name="ArrowRight" size={16}/></span>}
 </button>
 </form>
 </>
 )}
 </div>
 </div>
 );
};

/* ─── Demo content (swapped per landing: a wedding page shows a wedding) ── */
export const DEFAULT_DEMO = {
  groupName: 'Birthday Wishes',
  buriedSub: 'birthday buried under memes and work chat',
  cardGreeting: 'Happy Birthday, Adaeze!',
  mockIcon: 'Cake',
  mockTitle: 'Tolu\u2019s Birthday Card',
  mockMessages: [
    { av:'AO', name:'Adaeze O.', msg:"Happy birthday!! You're such an inspiration" },
    { av:'EK', name:'Emeka K.', msg:'Wishing you all the joy this year!' },
    { av:'KI', name:'Kemi I.', msg:'Another year wiser! Enjoy every moment' },
    { av:'BD', name:'Bolu D.', msg:'You deserve all the good things, boss!' },
  ],
};

/* ─── WhatsApp vs Thankeeu Conversion Section ───────────────────────── */
const WHATSAPP_PAINS = [
 { icon: 'MessageCircle', label: '58 unread messages', sub: null },
 { icon: 'Image', label: 'Photos buried in scroll', sub: 'mixed with receipts and random forwards' },
 { icon: 'Mic', label: 'Voice notes forgotten', sub: 'nobody replays a 34-second voice note twice' },
 { icon: 'UserX', label: '9 people never sent wishes', sub: '"I didn\'t see the message" — every time' },
 { icon: 'Search', label: 'Impossible to find later', sub: 'scroll back 3 weeks through 600 messages' },
 { icon: 'Clock', label: 'Gone in 48 hours', sub: 'replaced by grocery lists and work updates' },
];

const THANKEEU_WINS = [
 { icon: 'LayoutGrid', label: 'All messages in one place', sub: 'organised, searchable, beautifully displayed' },
 { icon: 'Image', label: 'Photos & videos preserved', sub: 'in a gallery built just for this moment' },
 { icon: 'Mic', label: 'Voice notes front and centre', sub: 'played back any time, forever' },
 { icon: 'Link', label: 'One link for everyone', sub: 'no app, no account, just open and sign' },
 { icon: 'Gift', label: 'Gift pool built in', sub: 'collect and send money together, no chaos' },
 { icon: 'Heart', label: 'Revisited years later', sub: 'a memory they\'ll actually treasure' },
];

const BENEFITS = [
 {
 icon: 'Layers',
 title: 'Everything in one place',
 text: 'Messages, photos, GIFs, videos and voice notes collected in a single beautiful card — not scattered across 3 apps.',
 },
 {
 icon: 'Users',
 title: 'Everyone contributes easily',
 text: 'Share one link. Friends, family or colleagues add their message from anywhere — no account, no download, no friction.',
 },
 {
 icon: 'Archive',
 title: 'Memories that last',
 text: 'Revisit heartfelt messages months or years later. This is what "I\'ll never forget this" actually looks like.',
 },
];

const WhatsAppVsThankeeu = ({ demo = DEFAULT_DEMO }) => (
 <section className="py-16 md:py-24 px-4 gc-font" style={{ background: '#fff' }}>
 <style>{`
 @keyframes wa-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
 @keyframes tk-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.15)} 70%{box-shadow:0 0 0 12px rgba(124,58,237,0)} }
 .wa-card { animation: none; }
 .wa-row { transition: opacity .2s; }
 .wa-row:hover { opacity: 0.7; }
 .tk-row { transition: transform .2s, box-shadow .2s; }
 .tk-row:hover { transform: translateX(4px); }
 `}</style>

 <div className="max-w-6xl mx-auto">

 {/* ── Headline ── */}
 <div className="text-center max-w-3xl mx-auto mb-16">
 <h2 className="font-extrabold text-warm-900 mb-5 leading-tight"
 style={{ fontSize: 'clamp(1.9rem,5vw,3rem)', letterSpacing: '-0.03em' }}>
 Their special day deserves better<br className="hidden sm:block"/>
 than a buried WhatsApp thread.
 </h2>
 <p className="text-warm-500 leading-relaxed" style={{ fontSize: 'clamp(1rem,2.2vw,1.2rem)' }}>
 Turn messages, photos, videos, GIFs and voice notes into one unforgettable group card they'll treasure forever.
 </p>
 </div>

 {/* ── Side-by-side comparison ── */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">

 {/* LEFT — WhatsApp */}
 <div className="wa-card rounded-3xl overflow-hidden border-2 border-warm-100 shadow-sm relative"
 style={{ background: 'linear-gradient(160deg,#f0fdf4 0%,#f9fafb 100%)' }}>
 {/* Header */}
 <div className="px-6 py-4 flex items-center justify-between border-b border-warm-100"
 style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl flex items-center justify-center"
 style={{ background: '#25D366' }}>
 <Icon name="MessageCircle" size={18} style={{ color: '#fff' }}/>
 </div>
 <div>
 <p className="font-bold text-warm-900 text-sm">WhatsApp Group</p>
 <p className="text-xs text-warm-400">{demo.groupName}</p>
 </div>
 </div>
 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold"
 style={{ background: '#ef44441a', color: '#dc2626' }}>
 <Icon name="Bell" size={11}/> 58 unread
 </div>
 </div>

 {/* Pain list */}
 <div className="p-5 space-y-2.5">
 {WHATSAPP_PAINS.map((p, i) => (
 <div key={p.label} className="wa-row flex items-start gap-3 p-3 rounded-2xl"
 style={{ background: 'rgba(255,255,255,0.7)', opacity: 1 }}>
 <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
 style={{ background: '#f3f4f6', color: '#374151' }}>
 <Icon name={p.icon} size={15}/>
 </div>
 <div className="min-w-0">
 <p className="font-semibold text-warm-700 text-sm leading-tight">{p.label}</p>
 <p className="text-xs text-warm-400 mt-0.5 leading-snug">{p.sub ?? demo.buriedSub}</p>
 </div>
 <div className="flex-shrink-0 mt-0.5">
 <Icon name="X" size={14} style={{ color: '#fca5a5' }}/>
 </div>
 </div>
 ))}
 </div>

 {/* Footer */}
 <div className="px-6 py-4 border-t border-warm-100 text-center"
 style={{ background: 'rgba(255,255,255,0.6)' }}>
 <p className="text-sm font-semibold text-warm-400 flex items-center justify-center gap-1.5">
 <Icon name="TrendingDown" size={14}/>Special moments disappear.
 </p>
 </div>
 </div>

 {/* RIGHT — Thankeeu */}
 <div className="rounded-3xl overflow-hidden border-2 shadow-xl relative"
 style={{ background: 'linear-gradient(160deg,#F5F0FF 0%,#fff 60%)', borderColor: '#DDD6FE' }}>
 {/* Glow */}
 <div className="absolute -top-10 -right-10 w-40 h-40 rounded-xl pointer-events-none"
 style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.15),transparent 70%)' }}/>

 {/* Header */}
 <div className="px-6 py-4 flex items-center justify-between border-b"
 style={{ borderColor: '#EDE9FE', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
 <div className="flex items-center gap-3">
 <img src="/android-chrome-192x192.png" alt="Thankeeu"
 className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
 onError={e => { e.currentTarget.src = '/favicon-96x96.png'; e.currentTarget.onerror = null; }}/>
 <div>
 <p className="font-bold text-warm-900 text-sm">Thankeeu Group Card</p>
 <p className="text-xs text-primary-400">{demo.cardGreeting}</p>
 </div>
 </div>
 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold"
 style={{ background: '#d1fae5', color: '#065f46' }}>
 <Icon name="CheckCircle" size={11}/> 32 signed
 </div>
 </div>

 {/* Win list */}
 <div className="p-5 space-y-2.5">
 {THANKEEU_WINS.map((w) => (
 <div key={w.label} className="tk-row flex items-start gap-3 p-3 rounded-2xl border"
 style={{ background: 'rgba(255,255,255,0.85)', borderColor: '#EDE9FE' }}>
 <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
 style={{ background: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', color: '#7C3AED' }}>
 <Icon name={w.icon} size={15}/>
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-semibold text-warm-900 text-sm leading-tight">{w.label}</p>
 <p className="text-xs text-warm-500 mt-0.5 leading-snug">{w.sub}</p>
 </div>
 <div className="flex-shrink-0 mt-0.5">
 <Icon name="Check" size={14} style={{ color: '#7C3AED' }}/>
 </div>
 </div>
 ))}
 </div>

 {/* Footer */}
 <div className="px-6 py-4 border-t text-center"
 style={{ borderColor: '#EDE9FE', background: 'rgba(255,255,255,0.6)' }}>
 <p className="text-sm font-semibold flex items-center justify-center gap-1.5"
 style={{ color: '#7C3AED' }}>
 <Icon name="Sparkles" size={14}/>Special moments become lasting memories.
 </p>
 </div>
 </div>
 </div>

 {/* ── Big statement ── */}
 <div className="text-center mb-16">
 <div className="inline-block px-8 py-6 rounded-3xl max-w-3xl"
 style={{ background: 'linear-gradient(135deg,#1A1035,#2D1B69)', boxShadow: '0 24px 80px rgba(124,58,237,0.25)' }}>
 <p className="font-extrabold text-white leading-snug"
 style={{ fontSize: 'clamp(1.3rem,3.5vw,2rem)', letterSpacing: '-0.02em' }}>
 WhatsApp is where wishes get buried.
 </p>
 <p className="font-extrabold leading-snug mt-1"
 style={{ fontSize: 'clamp(1.3rem,3.5vw,2rem)', letterSpacing: '-0.02em',
 background: 'linear-gradient(135deg,#A78BFA,#F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
 Thankeeu is where they live forever.
 </p>
 </div>
 </div>

 {/* ── Three benefit cards ── */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">
 {BENEFITS.map((b) => (
 <div key={b.title}
 className="rounded-3xl p-6 border-2 hover:shadow-lg transition-shadow"
 style={{ background: '#fff', borderColor: '#EDE9FE' }}>
 <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
 style={{ background: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)' }}>
 <Icon name={b.icon} size={22} style={{ color: '#7C3AED' }}/>
 </div>
 <h3 className="font-bold text-warm-900 mb-2 text-base">{b.title}</h3>
 <p className="text-warm-500 text-sm leading-relaxed">{b.text}</p>
 </div>
 ))}
 </div>

 {/* ── 3 Feature callouts ── */}
 <div className="mb-16">
 <div className="text-center mb-8">
 <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2">Choose one or all three — included in every plan</p>
 <h3 className="font-extrabold text-warm-900 leading-tight"
 style={{ fontSize:'clamp(1.6rem,4vw,2.2rem)', letterSpacing:'-0.025em' }}>
 One card. Three ways to make them feel it forever.
 </h3>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

 {/* Feature 1 — Group Card */}
 <div className="rounded-3xl p-7 border-2 flex flex-col" style={{ background:'#F5F0FF', borderColor:'#DDD6FE' }}>
 <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center" style={{background:'#DDD6FE'}}><Icon name="Mail" size={22} className="text-primary-600"/></div>
 <p className="font-extrabold text-warm-900 text-xl mb-2">Group Card</p>
 <p className="text-warm-600 text-sm leading-relaxed flex-1 mb-5">
 Everyone signs from one link — messages, photos, GIFs, voice notes and a pooled gift. Delivered at exactly the moment you choose. For any occasion: birthday, farewell, wedding, graduation and 25+ more.
 </p>
 <ul className="space-y-1.5 mb-6">
 {['Unlimited signers','Voice notes & photos','Gift pot built in','Scheduled delivery','No app needed to sign'].map(f => (
 <li key={f} className="flex items-center gap-2 text-xs text-warm-700">
 <span className="text-primary-500 font-bold"></span> {f}
 </li>
 ))}
 </ul>
 <Link to="/card/new"
 className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105"
 style={{ background:'linear-gradient(135deg,#7C3AED,#5B4BDF)' }}>
 <Icon name="Sparkles" size={15}/>Create a group card
 </Link>
 </div>

 {/* Feature 2 — Memory Movie */}
 <div className="rounded-3xl p-7 border-2 flex flex-col" style={{ background:'linear-gradient(160deg,#0d0020,#2d1052)', borderColor:'#4B1D8E' }}>
 <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center" style={{background:'rgba(255,255,255,0.1)'}}><Icon name="Film" size={22} className="text-purple-300"/></div>
 <p className="font-extrabold text-white text-xl mb-2">Memory Movie™</p>
 <p className="text-white/70 text-sm leading-relaxed flex-1 mb-5">
 The card gets delivered. Then something unexpected happens. Every message, photo and voice note automatically becomes a cinematic film — with music. A movie of their celebration, made by everyone who loves them. Included free.
 </p>
 <ul className="space-y-1.5 mb-6">
 {['Auto-generated from card content','Cinematic 1080p MP4','Background music included','Downloadable forever','Included on every plan'].map(f => (
 <li key={f} className="flex items-center gap-2 text-xs text-white/80">
 <span className="text-purple-300 font-bold"></span> {f}
 </li>
 ))}
 </ul>
 <Link to="/memory-movie"
 className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105"
 style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED)', color:'#fff' }}>
 <Icon name="Film" size={15}/>See Memory Movie →
 </Link>
 </div>

 {/* Feature 3 — Live Photo Wall */}
 <div className="rounded-3xl p-7 border-2 flex flex-col" style={{ background:'#FFF5FB', borderColor:'#FBCFE8' }}>
 <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center" style={{background:'#FBCFE8'}}><Icon name="QrCode" size={22} className="text-pink-600"/></div>
 <p className="font-extrabold text-warm-900 text-xl mb-2">Live Photo Wall™</p>
 <p className="text-warm-600 text-sm leading-relaxed flex-1 mb-5">
 Every guest at your event has a phone. Most of those photos never make it out of WhatsApp. Thankeeu generates a QR code for your occasion automatically — print it on table cards, display it on any screen, or share the link. Guests scan and upload in seconds. No app, no account.
 </p>
 <ul className="space-y-1.5 mb-6">
 {['QR code — scan & upload instantly','No app, no account for guests','Live display on venue screen','Full-quality, no compression','Works for any occasion'].map(f => (
 <li key={f} className="flex items-center gap-2 text-xs text-warm-700">
 <span className="text-pink-500 font-bold"></span> {f}
 </li>
 ))}
 </ul>
 <Link to="/live-memory-wall"
 className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105"
 style={{ background:'linear-gradient(135deg,#EC4899,#DB2777)' }}>
 See Live Photo Wall →
 </Link>
 </div>

 </div>
 <p className="text-center text-xs text-warm-400 mt-5">All three features are included on every Thankeeu plan — choose what fits your occasion.</p>
 </div>

 {/* ── Bottom CTA ── */}
 <div className="text-center rounded-3xl py-14 px-6"
 style={{ background: 'linear-gradient(135deg,#F5F0FF,#EDE9FE)', border: '2px solid #DDD6FE' }}>
 <h3 className="font-extrabold text-warm-900 mb-3"
 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', letterSpacing: '-0.025em' }}>
 Someone deserves a card that actually means something.
 </h3>
 <p className="text-warm-500 mb-8 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
 Set it up in under a minute. Share one link. Everyone joins. The celebration handles itself.
 </p>
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Link to="/card/new"
 className="gc-btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base">
 <Icon name="Plus" size={18}/>Create Free Card
 </Link>
 <Link to="/sample"
 className="gc-btn-secondary inline-flex items-center justify-center gap-2 px-8 py-4 text-base">
 <Icon name="Eye" size={18}/>See Example Card
 </Link>
 </div>
 <p className="text-xs text-warm-400 mt-5">Free to create · No signup to sign · Pay only when you send · Works in USD, GBP, EUR, NGN and 30+ currencies</p>
 </div>

 </div>
 </section>
);

/* Article text may contain [anchor text](/path) internal links. */
const withLinks = (text) => String(text).split(/(\[[^\]]+\]\(\/[^)\s]*\))/g).map((part, i) => {
  const m = part.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
  return m ? <Link key={i} to={m[2]} className="font-semibold text-primary-600 underline decoration-primary-200 underline-offset-2 hover:text-primary-700">{m[1]}</Link> : part;
});

/* ─── Main Home ──────────────────────────────────────────────────────── */
// Homepage FAQ — one source of truth for the visible list AND the FAQPage
// structured data below. They must not drift: Google requires the marked-up
// Q&A to be visible on the page, and answer engines quote whichever they find.
// HOME_FAQS lives in data/homeFaqs.js (shared with the country pages and prerender).

// Collapsible FAQ row. A component, not an inline callback: calling useState
// inside a .map() callback breaks the rules of hooks and only appears to work
// while the list length never changes.
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-purple-100">
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full text-left flex items-center justify-between py-4 gap-4 hover:text-primary-600 transition-colors">
        <span className="font-bold" style={{ fontSize:'0.9rem', color:'#1A1035' }}>{q}</span>
        <span className={`text-primary-400 flex-shrink-0 text-lg transition-transform ${open?'rotate-45':''}`}>+</span>
      </button>
      {/* Kept in the DOM when closed so crawlers read the answer the FAQ markup quotes. */}
      <p hidden={!open} className="text-sm text-warm-600 leading-relaxed pb-4">{a}</p>
    </div>
  );
};


const Home = ({ landing: landingProp = null } = {}) => {
 // Landing pages: attach the page's own long-form article and drop the
 // homepage-only Send Money block (see data/landingArticles.js).
 const landing = useMemo(
   () => (landingProp ? withArticle({ hideSendMoney: true, ...landingProp }) : null),
   [landingProp],
 );
 const faqs = landing ? landingFaqs(landing) : HOME_FAQS;
 const ctaTo = landing?.ctaTo || '/card/new';
 const sampleMessages = landing?.sampleMessages || SAMPLE_MESSAGES;
 const demo = { ...DEFAULT_DEMO, ...(landing?.demo || {}) };
 useSEO(landing ? landingSeo(landing, faqs) : {
 title:'Thankeeu — Group Cards, Memory Movies & Gift Pools for Every Occasion',
 description:'Create beautiful online group cards, gift pools, Memory Movies and company workspaces on your own Thankeeu subdomain — for any occasion, any team.',
 canonical:'/',
 keywords:'online group card, company workspace, employee recognition workspace, HR birthday automation, wildcard subdomain workspace, group birthday card, farewell card online, group gift collection, memory movie slideshow, collect wedding guest photos, event photo sharing QR code, live photo wall, digital group card, team birthday card, group card app',
 jsonLd:[
   SCHEMAS.organization,
   SCHEMAS.website,
   SCHEMAS.softwareApp,
   ...SCHEMAS.siteNavigation(),
   SCHEMAS.breadcrumb([{ name: 'Thankeeu', url: '/' }]),
   // Built from the SAME array the visible FAQ renders, so the markup can
   // never describe content a crawler cannot find on the page.
   SCHEMAS.faqPage(HOME_FAQS),
   // Mirrors the three visible steps under the homepage input. Answer engines
   // ("how do I make a group card quickly?") quote a clean procedure far more
   // readily than marketing prose.
   SCHEMAS.howTo(
     'Create a group card in about a minute',
     'Describe the card in one line on the Thankeeu homepage and the design, recipient, delivery date and gift pot are filled in for you. Review, share the signing link, and pay once when you are ready for it to be delivered.',
     [
       { name: 'Describe the card in one line',
         text: 'Type who the card is for, the occasion, when it should arrive and whether you are collecting for a gift — for example "birthday card for my sister Ada, sending Friday, collecting $50".' },
       { name: 'Check the details we filled in',
         text: 'Thankeeu picks a matching cover design and fills in the recipient, title, delivery date, signing deadline and gift pot. Every field stays editable.' },
       { name: 'Share the link, pay when you are happy',
         text: 'Publish the card for free and share the signing link by WhatsApp, email or QR code so everyone can add their messages, photos and voice notes. Pay the one-time card fee when you are happy, and it is delivered automatically on the date you chose.' },
     ],
     '/',
   ),
 ],
 });

 const [showDemo, setShowDemo] = useState(false);
 const [homeCurrency, setHomeCurrency] = useState('USD');
 const [wordIndex, setWordIndex] = useState(0);
 // Hero text is editable in Admin → Header. Start from the last copy this
 // browser saw (no flash on repeat visits), else the built-in default; the
 // server's current version replaces it as soon as it arrives.
 const [hero, setHero] = useState(() => resolveHero(readCachedHero()));
 useEffect(() => {
   if (landing) return undefined; // country pages carry their own hero copy
   let alive = true;
   siteAPI.getHero()
     .then(r => { if (!alive || !r.data?.hero) return; writeCachedHero(r.data.hero); setHero(resolveHero(r.data.hero)); })
     .catch(() => { /* defaults stay */ });
   return () => { alive = false; };
 }, [landing]);
 const heroTitle = splitHeroTitle(hero.title);

 useEffect(() => {
 const id = setInterval(() => setWordIndex(i => (i + 1) % ROTATING_WORDS.length), 2200);
 return () => clearInterval(id);
 }, []);

 return (
 <div className="min-h-screen" style={{ background:'linear-gradient(180deg,#F5F0FF 0%,#FDFCFF 20%)' }}>
 <style>{HERO_FONT_INJECT}</style>
 <Navbar onBookDemo={() => setShowDemo(true)} />

 {/* ══ HERO ══ */}
 <section className="relative overflow-visible pt-2 pb-10 md:pt-3 md:pb-14 px-2 sm:px-4 gc-font section-dots">

 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-16 pointer-events-none" style={{ background:'radial-gradient(ellipse,rgba(139,92,246,0.12) 0%,transparent 70%)' }}/>

 {/* Transparent world flags behind the hero — "my country is supported" */}
 <FlagBackdrop />

 <div className="relative max-w-6xl mx-auto" style={{ zIndex: 1 }}>
 {/* Hero is two columns: the copy and CTAs on the left, the signable demo card
    on the right, both starting at the same top edge. The headline used to span
    the full width above the grid, which pushed the demo card a full screen
    down — the one thing that shows what the product actually is. The
    type-to-create band is gone for the same reason: two competing entry points
    made the hero read as two different products. It still lives in "What do
    you need today?" further down. */}
 <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-start">

 {/* Left: headline, CTAs, feature cards and sample messages */}
 <div className="text-center lg:text-left">
 {landing && (
 <nav aria-label="Breadcrumb" className="mb-2 text-xs font-semibold text-warm-400">
 <Link to="/" className="hover:text-primary-600">Thankeeu</Link>
 {(landing.breadcrumbParents || []).map(b => <span key={b.url}> / <Link to={b.url} className="hover:text-primary-600">{b.name}</Link></span>)}
 <span> / </span><span className="text-warm-500" aria-current="page">{landing.breadcrumb}</span>
 </nav>
 )}
 <div style={{ display:'inline-block', background:'#EDE9FE', padding:'6px 12px', borderRadius:8, marginBottom:'0.6rem' }}>
 <p style={{ fontSize:'clamp(0.9rem,1.8vw,1.02rem)', lineHeight:1.45, fontFamily:"'Plus Jakarta Sans',sans-serif", color:'#4B3F72', fontWeight:500, margin:0, padding:0, display:'block' }}>
 {landing ? landing.tagline : hero.tagline}
 </p>
 </div>
 {landing ? (
 <h1 className="font-extrabold text-warm-900 mb-3" style={{ fontSize:'clamp(2rem,4.4vw,3.15rem)', lineHeight:1.08, letterSpacing:'-0.02em' }}>
 <span style={{ color:'#1A1035' }}>{landing.h1Lead}</span>
 {landing.h1Accent && (<>{' '}<br />
 <span style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED 50%,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{landing.h1Accent}</span></>)}
 </h1>
 ) : (
 <h1 className="font-extrabold text-warm-900 mb-3" style={{ fontSize:'clamp(2rem,4.4vw,3.15rem)', lineHeight:1.08, letterSpacing:'-0.02em' }}>
 {heroTitle.before && <span style={{ color:'#1A1035' }}>{heroTitle.before}</span>}
 {heroTitle.hasWord && (<>
 {heroTitle.before && <br />}
 <span style={{ display:'inline-block', background:'linear-gradient(135deg,#8B5CF6,#7C3AED 50%,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', minWidth:'1px' }}>
 {ROTATING_WORDS[wordIndex]}
 </span>
 {heroTitle.after && <br />}
 </>)}
 {heroTitle.after && <span style={{ color:'#1A1035' }}>{heroTitle.after}</span>}
 </h1>
 )}

 <p className="text-warm-600 mb-3 sm:mb-4 max-w-xl mx-auto lg:mx-0" style={{ fontSize:'clamp(1rem,2vw,1.12rem)', lineHeight:1.55 }}>
 {landing ? landing.subtitle : hero.subtitle}
 </p>

 {/* Price — visible before any scrolling, same pattern as leaving card hero */}
 <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-5 justify-center lg:justify-start">
   <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold" style={{background:'#EDE9FE',color:'#5B21B6'}}>
     <Icon name="Check" size={13} className="text-emerald-600"/>Free to start
   </span>
   <span className="text-warm-300 text-sm">·</span>
   <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold" style={{background:'#ECFDF5',color:'#065F46'}}>
     <Icon name="Tag" size={12}/>From $3.15 to send
   </span>
   <span className="text-warm-300 text-sm hidden sm:inline">·</span>
   <span className="text-xs font-semibold text-warm-400 hidden sm:inline">No subscription</span>
 </div>

 {/* ── 3 Feature Cards ── */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 max-w-xl mx-auto lg:mx-0">
 <Link to={ctaTo} className="rounded-2xl p-4 text-left border-2 transition-all hover:shadow-md hover:-translate-y-0.5 group"
 style={{ background:'#F5F0FF', borderColor:'#DDD6FE' }}>
  <p className="font-extrabold text-warm-900 text-sm leading-tight mb-1">Group Card</p>
 <p className="text-xs text-warm-500 leading-snug">One link, everyone signs. Messages, photos, voice notes, GIFs and a pooled gift. Delivered at exactly the right moment.</p>
 <p className="text-xs font-bold mt-2" style={{ color:'#7C3AED' }}>Everyone signs, one link →</p>
 </Link>
 <Link to="/memory-movie" className="rounded-2xl p-4 text-left border-2 transition-all hover:shadow-md hover:-translate-y-0.5 group"
 style={{ background:'#0d0020', borderColor:'#4B1D8E' }}>
  <p className="font-extrabold text-white text-sm leading-tight mb-1">Memory Movie™</p>
 <p className="text-xs text-white/60 leading-snug">Every message, photo and voice note put together into a video with music.</p>
 <p className="text-xs font-bold mt-2 text-purple-300">See how it works →</p>
 </Link>
 <Link to="/live-memory-wall" className="rounded-2xl p-4 text-left border-2 transition-all hover:shadow-md hover:-translate-y-0.5 group"
 style={{ background:'#FFF0F7', borderColor:'#FBCFE8' }}>
  <p className="font-extrabold text-warm-900 text-sm leading-tight mb-1">Live Photo Wall™</p>
 <p className="text-xs text-warm-500 leading-snug">Thankeeu makes a QR code for your event. Guests scan it at the venue and their photos appear on screen. No app, no account.</p>
 <p className="text-xs font-bold mt-2" style={{ color:'#DB2777' }}>Get your event QR code →</p>
 </Link>
 </div>

 <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
 <Link to={ctaTo} className="gc-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2">
 <Icon name="Sparkles" size={18}/>{landing?.ctaLabel || 'Create a card'}
 </Link>
 <Link to="/sample" className="gc-btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2">
 <Icon name="Eye" size={18}/>Try our demo card
 </Link>
 </div>
 <p className="text-sm font-medium text-warm-500 text-center lg:text-left">Free to create and share. Pay only when you send. No commitment.</p>

 {/* Countries we deliver to — colourful, labelled, scannable */}
 <SupportedCountries className="mt-6 max-w-xl mx-auto lg:mx-0" />

 {/* Sample card grid — large, rich tiles matching GroupCards style */}
 <div className="hidden lg:grid grid-cols-2 gap-4 mt-8" style={{ maxWidth: '100%' }}>
 {sampleMessages.map((m, i) => (
 <div key={m.name} className="bg-white rounded-3xl border-2 border-purple-100 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
 style={{ marginTop: i % 2 === 1 ? 32 : 0, minHeight: 340 }}>
 {/* Media — large, fills top of card */}
 {m.media === 'photo' && (
 <div style={{ height: 160, overflow:'hidden' }}>
 <img src={m.photoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy"/>
 </div>
 )}
 {m.media === 'gif' && (
 <div style={{ height: 160, overflow:'hidden', background:'#1A1035' }}>
 <img src={m.gifUrl} alt="GIF" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy"/>
 </div>
 )}
 {m.media === 'voice' && (
 <div style={{ height: 100, background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:'0 16px' }}>
 <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:36 }}>
 {Array.from({length:20},(_,i)=>(
 <div key={i} style={{ width:3, borderRadius:2, background:'#7C3AED', height: 10+Math.sin(i*0.7)*16, opacity:0.6+Math.sin(i)*0.4 }}/>
 ))}
 </div>
 <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:11, fontWeight:700, color:'#7C3AED' }}>Voice note · 0:34</span>
 </div>
 )}
 {/* Card body */}
 <div style={{ padding:'18px 20px 22px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
 <img src={m.avatar} alt={m.name} style={{ width:36, height:36, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
 <div>
 <p className={m.font} style={{ fontWeight:700, fontSize:'1.05rem', color:'#1A1035', margin:0, lineHeight:1.2 }}>{m.name}</p>
 <p style={{ fontSize:'0.7rem', color:'#9CA3AF', margin:0 }}>{m.role}</p>
 </div>
 </div>
 <p className={m.font} style={{ fontSize:'1.2rem', color:'#374151', lineHeight:1.65, margin:0 }}>{m.text}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Mobile sample cards — also bigger */}
 <div className="lg:hidden grid grid-cols-2 gap-3 mt-4 max-w-sm mx-auto">
 {sampleMessages.map(m => (
 <div key={m.name} className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden shadow-sm">
 {m.media === 'photo' && <div style={{ height:90, overflow:'hidden' }}><img src={m.photoUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/></div>}
 {m.media === 'gif' && <div style={{ height:90, overflow:'hidden', background:'#1A1035' }}><img src={m.gifUrl} alt="GIF" style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/></div>}
 {m.media === 'voice' && (
 <div style={{ height:60, background:'linear-gradient(135deg,#EDE9FE,#F5F0FF)', display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
 {Array.from({length:14},(_,i)=><div key={i} style={{ width:3, borderRadius:2, background:'#7C3AED', height:8+Math.sin(i*0.8)*10, opacity:0.7 }}/>)}
 </div>
 )}
 <div style={{ padding:'13px 14px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
 <img src={m.avatar} alt={m.name} style={{ width:28, height:28, borderRadius:8, objectFit:'cover', flexShrink:0 }}/>
 <p className={m.font} style={{ fontWeight:700, fontSize:'0.92rem', color:'#1A1035', margin:0 }}>{m.name}</p>
 </div>
 <p style={{ fontSize:'1rem', color:'#52525B', lineHeight:1.65, margin:0 }}>{m.text}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Right: three stacked album flipbooks — Jane (front), Sarah (left), Jackson (right) */}
 <div className="lg:sticky lg:top-24" style={{ paddingTop: '0.5rem' }}>
 <HeroAlbumStack variant={landing?.heroVariant} plain={!!landing} />
 </div>
 </div>

 </div>
 </section>


 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

 {/* ══ SOCIAL PROOF — LOGO STRIP ══ */}
 <section className="py-10 gc-font overflow-hidden" style={{ background:'#F0EEFF' }}>
 <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-warm-400 mb-8 px-4">
 Teams across these organisations celebrate with Thankeeu
 </p>

 {/* Full-width marquee — no max-width constraint */}
 <div className="relative">
 {/* Fade edges */}
 <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
 style={{ background:'linear-gradient(to right,#F0EEFF,transparent)' }}/>
 <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
 style={{ background:'linear-gradient(to left,#F0EEFF,transparent)' }}/>

 {/* Two identical sets — translate from 0 to -50% → seamless loop */}
 <div className="flex items-center animate-marquee" style={{ width:'max-content', gap:'80px' }}>
 {[0,1].map(set => (
 <div key={set} className="flex items-center flex-shrink-0" style={{ gap:'80px' }}>
 {[
 { src:'/logos/huawei.png', alt:'Huawei', w:120 },
 { src:'/logos/covenant.png', alt:'Covenant University', w:90 },
 { src:'/logos/landmark.png', alt:'Landmark University', w:80 },
 { src:'/logos/bells.png', alt:'Bells University', w:76 },
 ].map(logo => (
 <div key={logo.alt} className="flex items-center justify-center flex-shrink-0"
 style={{ height:68, width: logo.w }}>
 <img src={logo.src} alt={logo.alt}
 className="logo-strip-img"
 style={{ maxHeight:56, width:logo.w, objectFit:'contain' }}
 loading="lazy"
 title={logo.alt}
 onError={e => { e.currentTarget.style.display='none'; }}
 />
 </div>
 ))}
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Testimonials live on the homepage; landing pages carry their own content. */}
 {!landing && (<>
 {/* ══ TESTIMONIALS ══ */}
 <section className="py-14 md:py-20 px-4 gc-font" style={{ background:'#fff' }}>
 <div className="max-w-5xl mx-auto">
 <div className="text-center mb-12">
 <div className="mx-auto mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500">
 <Icon name="Star" size={13}/>Real stories
 </div>
 <h2 className="font-bold text-warm-900" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
 People who actually<br/><span className="text-primary-500">made someone's day</span>
 </h2>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

 {/* ── Comfort Irorere ── */}
 <div className="rounded-3xl border-2 border-purple-100 overflow-hidden hover:border-primary-300 hover:shadow-xl transition-all flex flex-col" style={{ background:'#FDFCFF' }}>
 <div className="p-6 flex flex-col gap-4 flex-1 relative">
 {/* Circular photo centred at top */}
 <div className="flex justify-center mb-2">
 <img src="/photos/comfort.png" alt="Comfort Irorere"
 className="rounded-xl object-cover border-4 border-primary-100"
 style={{ width:240, height:240, objectPosition:'top' }}
 loading="lazy"/>
 </div>
 <span className="absolute top-3 right-5 text-7xl text-primary-100 font-serif leading-none select-none pointer-events-none">"</span>
 <div className="flex justify-center gap-0.5">
 {[0,1,2,3,4].map(i => <Icon key={i} name="Star" size={15} className="text-amber-400 fill-amber-400"/>)}
 </div>
 <p className="text-sm text-warm-600 leading-relaxed italic flex-1 relative z-10">
 "My best friend had her baby shower in December and I was stuck in Virginia — no way I could be there in person. I created a Thankeeu card, sent the link to 18 of our girls, and by the day of her shower, she opened it to 18 heartfelt messages, photos, and a gift pool we'd all put together. She literally called me crying. I didn't think an app could ever replace being in the room, but Thankeeu came incredibly close."
 </p>
 <div className="flex flex-col gap-0.5 pt-4 border-t border-purple-50">
 <a href="https://www.linkedin.com/in/comfort-uduebholo/" target="_blank" rel="noopener noreferrer"
 className="text-sm font-bold text-warm-900 hover:text-primary-600 transition-colors flex items-center gap-1.5">
 Comfort Irorere
 <svg className="w-3.5 h-3.5 text-[#0A66C2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
 </a>
 <p className="text-xs text-warm-400">Security Engineer · Amazon Web Services</p>
 <p className="text-xs text-warm-400">Virginia, United States</p>
 </div>
 </div>
 </div>

 {/* ── Favour Ibude ── */}
 <div className="rounded-3xl border-2 border-purple-100 overflow-hidden hover:border-primary-300 hover:shadow-xl transition-all flex flex-col" style={{ background:'#FDFCFF' }}>
 <div className="p-6 flex flex-col gap-4 flex-1 relative">
 {/* Circular photo centred at top */}
 <div className="flex justify-center mb-2">
 <img src="/photos/favour.jpg" alt="Favour Ibude"
 className="rounded-xl object-cover border-4 border-primary-100"
 style={{ width:240, height:240, objectPosition:'top' }}
 loading="lazy"/>
 </div>
 <span className="absolute top-3 right-5 text-7xl text-primary-100 font-serif leading-none select-none pointer-events-none">"</span>
 <div className="flex justify-center gap-0.5">
 {[0,1,2,3,4].map(i => <Icon key={i} name="Star" size={15} className="text-amber-400 fill-amber-400"/>)}
 </div>
 <p className="text-sm text-warm-600 leading-relaxed italic flex-1 relative z-10">
 "Father's Day crept up on us and we had zero time to plan anything. I jumped on Thankeeu, created a card for my dad, and shared the link with my siblings and a few cousins. Within hours everyone had left him a message — some even added voice notes. We pooled a gift together and the card was delivered to him on the day. He called each one of us individually just to say thank you. That reaction is exactly why I'll use Thankeeu for every family celebration from now on."
 </p>
 <div className="flex flex-col gap-0.5 pt-4 border-t border-purple-50">
 <a href="https://www.linkedin.com/in/favouribude/" target="_blank" rel="noopener noreferrer"
 className="text-sm font-bold text-warm-900 hover:text-primary-600 transition-colors flex items-center gap-1.5">
 Favour Ibude
 <svg className="w-3.5 h-3.5 text-[#0A66C2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
 </a>
 <p className="text-xs text-warm-400">Data Scientist / MLOps Engineer · Allianz</p>
 <p className="text-xs text-warm-400">United Kingdom</p>
 </div>
 </div>
 </div>

 </div>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>
 </>)}

 {/* ══ GLOBAL TRUST STRIP ══ */}
 <section className="py-5 px-4 gc-font" style={{ background:'#fff', borderBottom:'1px solid #F3F0FF' }}>
 <div className="max-w-5xl mx-auto">
 <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
 <p className="text-xs font-bold text-warm-400 uppercase tracking-widest hidden sm:block">Celebrations across</p>
 {[
 { flag:'', name:'United Kingdom' },
 { flag:'', name:'United States' },
 { flag:'', name:'Canada' },
 { flag:'', name:'Nigeria' },
 { flag:'', name:'Ghana' },
 { flag:'', name:'Kenya' },
 { flag:'', name:'South Africa' },
 { flag:'', name:'Australia' },
 ].map(c => (
 <div key={c.name} className="flex items-center gap-1.5 text-xs font-semibold text-warm-600">
 <span className="text-base">{c.flag}</span>
 <span>{c.name}</span>
 </div>
 ))}
 <div className="flex items-center gap-1.5 text-xs font-bold text-primary-500">
 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
 30+ countries
 </div>
 </div>
 </div>
 </section>

 {/* ══ USE-CASE SLIDESHOW ══ */}
 <section className="py-12 md:py-16 px-4 gc-font" style={{ background:'linear-gradient(180deg,#FDFCFF 0%,#F5F0FF 100%)' }}>
 <div className="max-w-6xl mx-auto">
 {/* The only type-to-create box on the page now that the hero band is gone, so
     it takes the canonical `card-intent` input id. */}
 <div className="text-center mb-8">
 <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
 What do you need today?
 </h2>
 <p className="text-warm-500 text-sm sm:text-base max-w-xl mx-auto mb-6">
 Just type it below and we build the card for you. Free to create and share. You only pay when you send.
 </p>
 <CardIntentBar className="text-left" startWith={landing?.intentStart} plain={!!landing} />
 </div>
 </div>
 </section>
 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

 {!landing && (<>
 {/* ══ WHATSAPP VS THANKEEU CONVERSION SECTION ══ */}
 <WhatsAppVsThankeeu demo={demo} />

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>
 </>)}

 {!landing?.hideSendMoney && (<>
 {/* ══ SEND MONEY — money tucked inside a card ══ */}
 <section className="py-14 md:py-20 px-4 gc-font" style={{ background:'#fff' }}>
 <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.05fr_.95fr] items-center">
 <div>
 <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700 mb-4">
 <Icon name="Wallet" size={13}/> Send money
 </div>
 <h2 className="font-bold text-warm-900 mb-4" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)', lineHeight:1.15 }}>
 Send money in a card they<br/><span className="text-primary-500">actually open</span>
 </h2>
 <p className="text-warm-600 mb-6" style={{ fontSize:'clamp(1rem,2.2vw,1.125rem)', lineHeight:1.65 }}>
 A bank transfer is a reference line nobody reads. Wrap the money in a real
 card — your design, your words, your voice — and send it to their email.
 They open it, read it, then take the money to their bank account or as a gift card.
 </p>
 <ul className="mb-7 space-y-2.5">
 {[
 'One card from you to one person — not a group card',
 'All you need is their email address',
 'They withdraw to their bank, or take a gift card',
 'One payment covers the money and the card',
 ].map(t => (
 <li key={t} className="flex items-start gap-2.5 text-sm text-warm-700">
 <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold">✓</span>
 {t}
 </li>
 ))}
 </ul>
 <div className="flex flex-wrap gap-3">
 <Link to="/send-money-greeting-card" onClick={() => window.scrollTo({top:0})}
 className="btn-primary inline-flex items-center gap-2">
 <Icon name="Send" size={15}/> Send money in a card
 </Link>
 <Link to="/how-it-works" onClick={() => window.scrollTo({top:0})} className="btn-secondary">
 How it works
 </Link>
 </div>
 </div>

 {/* Visual: the card, then the money on it */}
 <div className="relative mx-auto w-full max-w-[380px]">
 <div className="rounded-[2rem] p-6 shadow-[0_28px_70px_rgba(31,23,62,0.16)]"
 style={{ background:'linear-gradient(160deg,#1A1035,#3B2A6B)' }}>
 <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/50 mb-2">A card, not a transfer</p>
 <p className="text-white/90 mb-5" style={{ fontFamily:"'Caveat',cursive", fontSize:22, lineHeight:1.45 }}>
 “Happy birthday Ada — get yourself something good. Proud of you always.”
 </p>
 <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
 <span className="text-xs font-bold text-white/70">Tucked inside</span>
 <span className="text-xl font-extrabold text-emerald-300">$32</span>
 </div>
 <div className="mt-4 grid grid-cols-2 gap-2">
 {[{i:'CreditCard',t:'To their bank'},{i:'Gift',t:'Or a gift card'}].map(o => (
 <div key={o.t} className="flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2.5">
 <Icon name={o.i} size={14} className="text-emerald-300"/>
 <span className="text-[11px] font-bold text-white/80">{o.t}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>
 </>)}

  {/* ══ NEW COVERS — one lead cover per occasion ══ */}
 <section className="py-14 md:py-20 px-4 gc-font" style={{ background:'linear-gradient(180deg,#F5F0FF 0%,#FDFCFF 100%)' }}>
 <div className="max-w-6xl mx-auto">
 <div className="text-center mb-10">
 <div className="mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Sparkles" size={13}/>New card covers</div>
 <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
 {landing ? landing.coversTitle : <>Pick a cover they'll love,<br/><span className="text-primary-500">then everyone signs</span></>}
 </h2>
 <p className="text-warm-500 text-sm sm:text-base max-w-xl mx-auto">
   {landing?.coversSubtitle || 'Illustrated covers for every occasion. Tap one to start your group card. It’s free and there’s no signup.'}
 </p>
 <p className="text-xs font-semibold text-primary-500 mt-2">
   {landing ? '' : '✏️ '}Add your recipient's name to the cover, then share one link for everyone to sign.
 </p>
 </div>

 <style>{`
 .svg-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; }
 @media(max-width:900px){.svg-grid{grid-template-columns:repeat(3,1fr);}}
 @media(max-width:540px){.svg-grid{grid-template-columns:repeat(2,1fr);}}
 .svg-tile { position:relative; border-radius:16px; overflow:hidden; cursor:pointer; aspect-ratio:210/297; box-shadow:0 2px 12px rgba(0,0,0,0.10); transition:transform 0.18s,box-shadow 0.18s; text-decoration:none; display:block; }
 .svg-tile:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(124,58,237,0.18); }
 .svg-tile img { width:100%; height:100%; object-fit:cover; object-position:center; display:block; }
 `}</style>

 {landing ? (
 <div className="space-y-10">
 {landingCoverRows(landing).map(row => (
 <div key={row.occasion}>
 <div className="flex items-end justify-between gap-3 mb-3">
 <h3 className="font-extrabold text-warm-900" style={{ fontSize:'1.15rem' }}>{landing.coverOccasions.length === 1 ? `${landing.coversPerCategory || LANDING_COVERS_PER_CATEGORY} ${row.label.toLowerCase()} card covers` : `${row.label} cards`}</h3>
 <Link to={`/cards/create?occasion=${row.occasion}`} className="text-sm font-bold text-primary-600 hover:text-primary-700 whitespace-nowrap">See all →</Link>
 </div>
 <div className="svg-grid">
 {row.designs.map(design => (
 <Link key={design.id} to={createIllustratedCardUrl(design, `landing-${landing.path.slice(1)}`)} className="svg-tile" title={`${design.name} — ${row.label.toLowerCase()} group card`}>
 <img src={design.image} alt={`${design.alt} — ${row.label.toLowerCase()} group card cover`} loading="lazy" decoding="async"/>
 </Link>
 ))}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="svg-grid">
 {HOME_COVERS.map(({ design, label }) => (
 <figure key={design.id} className="m-0">
 <Link to={createIllustratedCardUrl(design, 'home-covers')} className="svg-tile" title={`${design.name} — ${label} group card`}>
 <img src={design.image} alt={`${design.alt} — ${label.toLowerCase()} group card cover`} loading="lazy" decoding="async"/>
 </Link>
 <figcaption className="mt-2 text-center text-xs font-bold text-warm-500">{label}</figcaption>
 </figure>
 ))}
 </div>
 )}
 </div>
 </section>



 {landing?.article?.length > 0 && (
 <section className="py-14 md:py-20 px-4 gc-font" style={{ background:'#fff' }}>
 <div className="max-w-3xl mx-auto space-y-12">
 {landing.article.map(sec => (
 <div key={sec.h2}>
 <h2 className="font-extrabold text-warm-900 mb-4" style={{ fontSize:'clamp(1.6rem,4.5vw,2.25rem)', lineHeight:1.15, letterSpacing:'-0.02em' }}>{sec.h2}</h2>
 {sec.intro && <p className="text-warm-600 leading-relaxed mb-4">{withLinks(sec.intro)}</p>}
 {(sec.paragraphs || []).map((t, i) => <p key={i} className="text-warm-600 leading-relaxed mb-4" style={{ fontSize:'1.02rem' }}>{withLinks(t)}</p>)}
 {sec.steps && (
 <ol className="space-y-3 mt-2">
 {sec.steps.map((t, i) => (
 <li key={i} className="flex gap-3 items-start">
 <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-500 text-white text-sm font-extrabold flex items-center justify-center mt-0.5">{i + 1}</span>
 <span className="text-warm-700 leading-relaxed">{withLinks(t)}</span>
 </li>
 ))}
 </ol>
 )}
 {sec.items && (
 <div className="grid sm:grid-cols-2 gap-3 mt-2">
 {sec.items.map(([t, b]) => (
 <div key={t} className="rounded-2xl border-2 border-purple-100 p-4" style={{ background:'#FDFCFF' }}>
 <h3 className="font-extrabold text-warm-900 mb-1" style={{ fontSize:'0.98rem' }}>{t}</h3>
 <p className="text-sm text-warm-600 leading-relaxed">{withLinks(b)}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 </section>
 )}

 {!landing?.hideOccasions && (<>
 {/* ══ OCCASIONS ══ */}
 <section className="py-12 md:py-16 px-4 section-dots" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
 <div className="max-w-5xl mx-auto">
 <div className="text-center mb-8">
 <div className="mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Party" size={13}/> 14 occasions</div>
 <h2 className="font-bold text-warm-900" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
 Whatever the moment,<br/><span className="text-primary-500">there's a card for it</span>
 </h2>
 </div>
 <div className="occasion-grid">
 {OCCASIONS.map(({ icon, label }) => (
 <Link key={label} to="/card/new"
 className="bg-white border-2 border-purple-100 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center transition-all hover:border-primary-300 hover:bg-primary-50 hover:-translate-y-1 hover:shadow-md active:scale-95" style={{ minHeight: 44 }}>
 <Icon name={icon} size={26} className="text-primary-500"/>
 <span className="text-xs font-semibold text-warm-600 leading-tight">{label}</span>
 </Link>
 ))}
 </div>
 {/* SEO crawlable links — hidden visually, indexed by crawlers */}
 <div style={{position:'absolute',width:1,height:1,overflow:'hidden',opacity:0,pointerEvents:'none'}}>
 {[
 ['/cards/leaving-card','Leaving cards'],['/cards/sympathy','Sympathy cards'],
 ['/cards/retirement','Retirement cards'],['/cards/get-well-soon','Get well soon'],
 ['/cards/welcome','Welcome & new hire'],['/cards/baby-shower','Baby shower'],
 ['/cards/good-luck','Good luck cards'],['/cards/christmas','Christmas cards'],
 ['/cards/thank-you','Thank you cards'],['/online-group-cards-uk','Group cards UK'],
 ['/online-group-cards-us','Group cards US'],['/online-group-cards-nigeria','Online group cards'],
 ].map(([to,label]) => <Link key={to} to={to}>{label}</Link>)}
 </div>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>
 </>)}

  {/* ══ HOW IT WORKS ══ */}
 <section className="py-12 md:py-16 px-4">
 <div className="max-w-5xl mx-auto">
 <div className="text-center mb-10">
 <div className="mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Zap" size={13}/>Beautifully simple</div>
 <h2 className="font-bold text-warm-900" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
 From zero to delivered<br/><span className="text-primary-500">in under 1 minute</span>
 </h2>
 </div>
 <div className="steps-grid">
 {STEPS.map(s => (
 <div key={s.num} className="bg-white border-2 border-purple-100 rounded-3xl p-5 transition-all hover:border-primary-300 hover:shadow-md">
 <div className="flex items-center gap-3 mb-4">
 <span className="w-8 h-8 rounded-xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center font-display text-sm font-bold text-primary-600 flex-shrink-0">{s.num}</span>
 <Icon name={s.icon} size={20} className="text-primary-500"/>
 <span className="text-xs font-bold uppercase tracking-wide text-primary-500">{s.label}</span>
 </div>
 <h3 className="font-bold text-warm-900 mb-2 text-base">{s.title}</h3>
 <p className="text-sm text-warm-500 leading-relaxed">{s.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

 {!landing && (<>
 {/* ══ FEATURES + MOCK CARD ══ */}
 <section className="py-12 md:py-16 px-4 section-dots" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
 <div className="max-w-5xl mx-auto">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
 <div className="text-center mx-auto w-full">
 <div className="mb-4 inline-flex items-center gap-1.5"><Icon name="Heart" size={13}/>For individuals</div>
 <h2 className="font-bold text-warm-900 mb-4 text-center" style={{ fontSize:'clamp(1.85rem,5.5vw,2.6rem)' }}>
 Everything a group card<br/><span className="text-primary-500">should actually have</span>
 </h2>
 <p className="text-warm-500 mb-6 leading-relaxed text-center">No generic e-cards. One link, everyone signs, gift collected — and it looks stunning.</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
 {FEATURES.map(f => (
 <div key={f.title} className="bg-white rounded-2xl border-2 border-purple-100 p-4 flex gap-3">
 <Icon name={f.icon} size={18} className="text-primary-500 flex-shrink-0 mt-0.5"/>
 <div>
 <p className="text-sm font-bold text-warm-900 mb-0.5">{f.title}</p>
 <p className="text-xs text-warm-500 leading-relaxed">{f.desc}</p>
 </div>
 </div>
 ))}
 </div>
 <Link to={ctaTo} className="gc-btn-primary px-7 py-3.5 text-sm w-full sm:w-auto inline-flex items-center justify-center gap-2">
 <Icon name="Sparkles" size={15}/>Create your first card <Icon name="ArrowRight" size={15}/>
 </Link>
 </div>
 {/* Mock card */}
 <div className="relative">
 <div className="bg-gradient-to-br from-purple-50 to-rose-50 border-2 border-purple-200 rounded-3xl p-5 shadow-lg">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-purple-100"><Icon name={demo.mockIcon} size={18} className="text-primary-500"/></div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-warm-900 text-sm truncate">{demo.mockTitle}</p>
 <p className="text-xs text-warm-500">28 signed · $240 collected</p>
 </div>
 <span className="text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-xl flex-shrink-0 inline-flex items-center gap-1"><Icon name="Check" size={12}/>Active</span>
 </div>
 <div className="grid grid-cols-2 gap-2 mb-3" style={{ gridTemplateColumns:'repeat(2,minmax(0,1fr))' }}>
 {demo.mockMessages.map(m => (
 <div key={m.av} className="bg-white rounded-2xl p-3 border border-purple-100">
 <div className="flex items-center gap-2 mb-1.5">
 <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{m.av}</div>
 <span className="text-xs font-semibold text-warm-800 truncate">{m.name}</span>
 </div>
 <p className="text-xs text-warm-600 leading-relaxed line-clamp-2">{m.msg}</p>
 </div>
 ))}
 </div>
 <div className="bg-green-50 border border-green-200 rounded-2xl p-3">
 <div className="flex items-center gap-2 mb-2">
 <Icon name="Gift" size={17} className="text-green-600"/>
 <span className="text-xs font-bold text-green-800 flex-1">Gift pot · 28 contributors</span>
 <span className="font-display text-base font-bold text-green-700">$240</span>
 </div>
 <div className="w-full h-2 bg-green-100 rounded-xl overflow-hidden">
 <div className="h-full rounded-xl" style={{ width:'85%', background:'linear-gradient(90deg,#10B981,#34D399)' }}/>
 </div>
 <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">$240 raised · Goal: $300 <Icon name="Target" size={11}/></p>
 </div>
 </div>
 <div className="absolute -top-3 -right-3 w-9 h-9 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center animate-bounce-soft shadow-sm"><Icon name="Party" size={16} className="text-primary-500"/></div>
 <div className="absolute -top-2 -left-3 w-8 h-8 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center animate-float shadow-sm"><Icon name="Gift" size={14} className="text-pink-500"/></div>
 </div>
 </div>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>
 </>)}

 {!landing?.hideTeams && (<>
 {/* ══ FOR TEAMS ══ */}
 <section className="py-12 md:py-16 px-4 gc-font section-dots" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
 <div className="max-w-5xl mx-auto">
 <div className="text-center mb-10">
 <div className="mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Building" size={13}/>For HR &amp; People teams</div>
 <h2 className="font-bold text-warm-900 mb-3" style={{ fontSize:'clamp(1.85rem,5.5vw,2.75rem)' }}>
 Automate every celebration.<br/><span className="text-primary-500">Zero manual effort.</span>
 </h2>
 <p className="text-warm-500 max-w-xl mx-auto text-sm leading-relaxed">
 Connect your HRIS once. Thankeeu creates cards, notifies departments, pools gifts and delivers them on the right day, every time.
 </p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
 {[
 { icon:'Building2', title:'Your own company workspace', desc:'Every organisation gets a dedicated subdomain like acme.thankeeu.com for HR admins and employees.' },
 { icon:'Link', title:'HRIS Integration', desc:'SeamlessHR, BambooHR, Zoho People, WorkPay. One sync and your whole org is in.' },
 { icon:'Party', title:'12 Occasions Automated', desc:"Birthdays, farewells, promotions, new hires and Women's Day, with no manual work." },
 { icon:'Mail', title:'Whole Department Notifications', desc:'Every department member gets an email to sign. No one left out.' },
 { icon:'Card', title:'Gift pot per employee', desc:'Gift collections in USD, GBP, EUR and more. HR never chases money again.' },
 { icon:'File', title:'HR Analytics Dashboard', desc:'Full visibility into automations, upcoming occasions, and spending.' },
 { icon:'Shield', title:'Approval Workflows', desc:'Team leaders sign off on card creation. Full control maintained.' },
 ].map(f => (
 <div key={f.title} className="gc-card gc-card-hover p-4 flex gap-3">
 <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0"><Icon name={f.icon} size={18} className="text-primary-500"/></div>
 <div>
 <p className="font-bold text-warm-900 text-sm mb-1">{f.title}</p>
 <p className="text-xs text-warm-500 leading-relaxed">{f.desc}</p>
 </div>
 </div>
 ))}
 </div>
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Link to="/company/signup" className="gc-btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Building" size={16}/>Start for your team <Icon name="ArrowRight" size={15}/></Link>
 <button onClick={() => setShowDemo(true)} className="gc-btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Calendar" size={16}/>Book a 30 minute demo</button>
 </div>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>
 </>)}

 {/* ══ PRICING ══ */}
 <section className="py-12 md:py-16 px-4 gc-font">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-6">
 <p className="text-xs font-semibold text-warm-500 mb-2 uppercase tracking-wide">See prices in your currency</p>
 <CurrencyToggle selected={homeCurrency} onChange={setHomeCurrency} showFlags={!landing}/>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="bg-gradient-to-br from-purple-50 to-rose-50 border-2 border-purple-200 rounded-3xl p-7">
 <div className="w-12 h-12 rounded-2xl bg-white border-2 border-purple-200 flex items-center justify-center mb-4"><Icon name="Heart" size={22} className="text-primary-500"/></div>
 <h3 className="text-2xl font-bold text-warm-900 mb-1">For individuals</h3>
 <div className="flex items-baseline gap-2 mb-1">
 <span className="text-primary-600 font-extrabold text-2xl">{formatCurrency(5000, homeCurrency)}</span>
 <span className="text-warm-400 text-sm">one time</span>
 </div>
 {homeCurrency !== 'USD' && homeCurrency !== 'GBP' && <p className="text-xs text-warm-400 mb-3">See your currency above</p>}
 <p className="text-warm-600 mb-5 text-sm leading-relaxed">Create a card for anyone: a friend, a colleague, family. No account needed to sign.</p>
 <ul className="space-y-2 mb-6">
 {['Quick card creation','Unlimited signers','Global gift pot','Photo & video messages'].map(f => (
 <li key={f} className="text-sm text-warm-700 flex items-center gap-2">
   <Icon name="Check" size={14} className="text-primary-500 flex-shrink-0"/>
   <span style={{whiteSpace:'nowrap'}}>{f}</span>
 </li>
 ))}
 </ul>
 <Link to={ctaTo} className="gc-btn-primary px-7 py-3 w-full sm:w-auto inline-flex items-center justify-center">Get started →</Link>
 </div>
 <div className="rounded-3xl p-7 border-2 border-primary-800" style={{ background:'linear-gradient(135deg,#1A1035,#2E1F6B)' }}>
 <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border-2 border-purple-700 flex items-center justify-center mb-4"><Icon name="Building" size={22} className="text-purple-200"/></div>
 <h3 className="font-display text-2xl font-bold text-purple-100 mb-1">For companies</h3>
 <p className="text-purple-200 font-extrabold text-2xl mb-1">Get a quote</p>
 <p className="text-xs text-purple-400 mb-2">Price based on your team size</p>
 <p className="text-purple-300 mb-5 text-sm leading-relaxed">Automate all team celebrations. Connect your HRIS. Never forget a birthday again.</p>
 <ul className="space-y-2 mb-6">
 {['Unlimited employees','HRIS integration','12 automated occasions','HR analytics dashboard'].map(f => (
 <li key={f} className="text-sm text-purple-200 flex items-center gap-2">
   <Icon name="Check" size={14} className="text-purple-400 flex-shrink-0"/>
   <span style={{whiteSpace:'nowrap'}}>{f}</span>
 </li>
 ))}
 </ul>
 <div className="flex flex-wrap gap-2">
 <button onClick={() => setShowDemo(true)} className="gc-btn-primary px-6 py-3 text-sm">Get a quote →</button>
 <Link to="/company/signup" className="px-6 py-3 text-sm font-bold rounded-2xl border-2 border-purple-500 text-purple-200 hover:bg-purple-800 transition-colors">Create account</Link>
 </div>
 </div>
 </div>
 <p className="text-center text-xs text-warm-400 mt-4 flex items-center justify-center gap-1.5"><Icon name="Globe" size={13}/>Works in the US, UK, Canada, Australia, Europe and 30+ countries · Pay in your local currency</p>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

 {!landing && (<>
 {/* ══ HOW IT WORKS DETAIL ══ */}
 <section id="how-it-works" className="py-14 md:py-20 px-4 gc-font section-dots" style={{ background:'linear-gradient(180deg,#F5F0FF,#F8F4FF)' }}>
 <div className="max-w-5xl mx-auto">
 <div className="text-center mb-12">
 <div className="mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Lightbulb" size={13}/>How it works</div>
 <h2 style={{ fontWeight:800, fontSize:'clamp(2rem,5.5vw,3rem)', letterSpacing:'-0.02em', color:'#1A1035' }}>
 From zero to celebration<br/><span className="text-primary-500">in under 1 minute</span>
 </h2>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
 {[
 { num:'1', icon:'Wand', title:'Create your card', desc:'Pick an occasion, choose a design, set the recipient and delivery date. Takes 1 minute flat.' },
 { num:'2', icon:'Share', title:'Share the signing link', desc:'Copy a WhatsApp link or email it. No login needed — anyone can sign from their phone.' },
 { num:'3', icon:'Heart', title:'Watch messages roll in', desc:'Your signers add messages, photos, voice notes, GIFs and chip in to the gift pot securely.' },
 { num:'4', icon:'Gift', title:'Deliver the surprise', desc:'Card and gift arrive by email on the exact day. The recipient opens a beautiful card, reads every message and claims the gift.' },
 ].map(s => (
 <div key={s.num} className="gc-card gc-card-hover p-6 flex gap-4">
 <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-extrabold flex-shrink-0">{s.num}</div>
 <div>
 <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center mb-2"><Icon name={s.icon} size={16} className="text-primary-500"/></div>
 <h3 className="font-extrabold" style={{ fontSize:'1rem', color:'#1A1035', marginBottom:'0.3rem' }}>{s.title}</h3>
 <p className="text-sm text-warm-500 leading-relaxed">{s.desc}</p>
 </div>
 </div>
 ))}
 </div>
 <p className="text-center text-xs text-warm-400 mt-8">Need a walkthrough? <a href="/how-it-works" className="text-primary-500 font-semibold hover:underline">See the full guide →</a></p>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>
 </>)}

 {landing && (
 <section className="py-14 md:py-20 px-4 gc-font" style={{ background:'#fff' }}>
 <div className="max-w-5xl mx-auto">
 {(landing.useCases?.length > 0 || landing.payments) && <div className="text-center mb-10">
 <h2 className="font-extrabold text-warm-900 mb-3" style={{ fontSize:'clamp(1.85rem,5vw,2.6rem)' }}>{landing.useCasesTitle || 'What teams use it for'}</h2>
 {landing.payments && <p className="text-warm-500 text-sm sm:text-base max-w-xl mx-auto">{landing.currency && <strong>Gift in {landing.currency}. </strong>}{landing.payments}</p>}
 {landing.useCasesIntro && <p className="text-warm-500 text-sm sm:text-base max-w-2xl mx-auto">{landing.useCasesIntro}</p>}
 </div>}
 <div className="grid sm:grid-cols-2 gap-4">
 {(landing.useCases || []).map(([title, body]) => (
 <div key={title} className="rounded-2xl p-5 border-2 border-purple-100" style={{ background:'#FDFCFF' }}>
 <h3 className="font-extrabold text-warm-900 mb-1.5" style={{ fontSize:'1rem' }}>{title}</h3>
 <p className="text-sm text-warm-600 leading-relaxed">{body}</p>
 </div>
 ))}
 </div>
 {landing.comparison && (
 <div className={landing.useCases?.length ? 'mt-14' : ''}>
 <h2 className="font-extrabold text-warm-900 mb-2 text-center" style={{ fontSize:'clamp(1.6rem,4.5vw,2.2rem)' }}>{landing.comparison.title || `Thankeeu vs ${landing.comparison.columns.slice(0, -1).join(', ')}`}</h2>
 {landing.comparison.intro && <p className="text-warm-500 text-sm text-center max-w-2xl mx-auto mb-6">{landing.comparison.intro}</p>}
 <div className="overflow-x-auto rounded-2xl border-2 border-purple-100 mt-6">
 <table className={`w-full ${landing.comparison.columns.length > 2 ? 'min-w-[560px]' : ''}`}>
 <thead><tr style={{ background:'#F5F0FF' }}>
 <th className="text-left p-3 sm:p-4 text-sm font-bold text-warm-700">Feature</th>
 {landing.comparison.columns.map((c, ci) => (
 <th key={c} className={`text-center p-3 sm:p-4 text-sm font-bold ${ci === landing.comparison.columns.length - 1 ? 'text-primary-600' : 'text-warm-500'}`}>{c}</th>
 ))}
 </tr></thead>
 <tbody className="divide-y divide-purple-50">
 {landing.comparison.rows.map(([feature, ...cells]) => (
 <tr key={feature}>
 <td className="p-3 sm:p-4 text-sm text-warm-700">{feature}</td>
 {cells.map((c, ci) => <td key={ci} className="p-3 sm:p-4 text-center text-sm">{c === true
 ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100" aria-label="Yes"><Icon name="Check" size={13} className="text-green-600" strokeWidth={3}/></span>
 : c === false
 ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50" aria-label="No"><Icon name="X" size={13} className="text-red-400" strokeWidth={3}/></span>
 : <span className="text-xs font-semibold text-warm-500">{c}</span>}</td>)}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {landing.comparison.note && <p className="text-xs text-warm-400 text-center mt-3">{landing.comparison.note}</p>}
 </div>
 )}
 {(landing.blogLinks?.length || landing.related?.length) ? (
 <div className="mt-10 text-center">
 <h3 className="font-bold text-warm-900 mb-3">{landing.linksTitle || 'Guides & comparisons'}</h3>
 <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
 {[...(landing.blogLinks || []), ...(landing.related || [])].map(([href, label]) => (
 <li key={href}><Link to={href} className="text-primary-600 font-semibold hover:underline">{label}</Link></li>
 ))}
 </ul>
 </div>
 ) : null}
 </div>
 </section>
 )}

 {/* ══ FAQ ══ */}
 <section id="faq" className="py-14 md:py-20 px-4 gc-font">
 <div className="max-w-2xl mx-auto">
 <div className="text-center mb-10">
 <div className="mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="HelpCircle" size={13}/>FAQ</div>
 <h2 className="font-extrabold" style={{ fontSize:'clamp(2rem,5.5vw,2.8rem)', letterSpacing:'-0.02em', color:'#1A1035' }}>
 Questions we get all the time
 </h2>
 </div>
 {faqs.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
 <p className="text-center text-xs text-warm-400 mt-8">More questions? <a href="/faq" className="text-primary-500 font-semibold hover:underline">See all FAQs →</a></p>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

 {!landing && (<>
 {/* ══ ECOSYSTEM: Pals + Vendor ══ */}
 <section className="py-14 md:py-20 px-4" style={{ background:'#fff' }}>
 <div className="max-w-5xl mx-auto">
 <div className="text-center mb-10">
 <div className="mx-auto mb-3 inline-flex items-center gap-1.5"><Icon name="Layers" size={13}/>More ways to celebrate</div>
 <h2 className="font-extrabold text-warm-900 mb-3" style={{ fontSize:'clamp(2rem,5.5vw,2.9rem)' }}>Beyond the card</h2>
 <p className="text-warm-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
 Thankeeu is a full celebration platform — not just a card tool. Send real gifts. Celebrate with your inner circle. Do it all in one place.
 </p>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="relative rounded-3xl overflow-hidden border-2 border-purple-100 p-7 flex flex-col" style={{ background:'linear-gradient(135deg,#F5F0FF 0%,#FFF0F8 100%)' }}>
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:'linear-gradient(135deg,#8B5CF6,#EC4899)' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
 <div>
 <p className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-0.5">New</p>
 <h3 className="text-xl font-extrabold text-warm-900">Thankeeu Pals</h3>
 </div>
 </div>
 <p className="text-warm-600 text-sm leading-relaxed mb-4">A private celebration circle for your closest people — best friends, family, a tight-knit crew. Everyone joins, adds their dates, and Thankeeu automatically creates a group card when someone's special day arrives.</p>
 <ul className="space-y-2 mb-6">
 {['Up to 15 people in a private group','Auto-created cards for every occasion','Gift pot collected and paid out at 6 pm on the day','No HR. No company. Just your people.'].map((item,i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-warm-700"><span className="text-primary-500 mt-0.5 flex-shrink-0"></span>{item}</li>
 ))}
 </ul>
 <div className="mt-auto flex flex-wrap gap-3">
 <Link to="/pals" className="gc-btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-1.5"><Icon name="Users" size={14}/>Learn about Pals</Link>
 <Link to="/pals/signup" className="gc-btn-secondary px-5 py-2.5 text-sm inline-flex items-center gap-1.5">Start a group →</Link>
 </div>
 </div>
 <div className="relative rounded-3xl overflow-hidden border-2 border-amber-100 p-7 flex flex-col" style={{ background:'linear-gradient(135deg,#FFFBEB 0%,#FFF5F0 100%)' }}>
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:'linear-gradient(135deg,#F59E0B,#EF4444)' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
 <div>
 <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Marketplace</p>
 <h3 className="text-xl font-extrabold text-warm-900">Gift Marketplace</h3>
 </div>
 </div>
 <p className="text-warm-600 text-sm leading-relaxed mb-4">Attach a real, physical gift to any card — straight from local vendors. Pick from cakes, flowers, chocolates, jewellery, hampers and more. The vendor is notified with the delivery deadline so your gift arrives on time.</p>
 <ul className="space-y-2 mb-6">
 {['Browse verified local gift vendors','Order cakes, flowers, chocolates & more','Vendor notified with your celebration date','Sell on Thankeeu? Apply to become a vendor'].map((item,i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-warm-700"><span className="text-amber-500 mt-0.5 flex-shrink-0"></span>{item}</li>
 ))}
 </ul>
 <div className="mt-auto flex flex-wrap gap-3">
 <Link to="/vendors" className="px-5 py-2.5 text-sm font-bold rounded-2xl inline-flex items-center gap-1.5 transition-all" style={{ background:'linear-gradient(135deg,#F59E0B,#EF4444)', color:'#fff' }}>
 <Icon name="Store" size={14}/>Browse gift vendors
 </Link>
 <Link to="/vendors" className="px-5 py-2.5 text-sm font-bold rounded-2xl border-2 border-amber-200 text-amber-700 hover:bg-amber-50 transition-all inline-flex items-center gap-1.5">Sell on Thankeeu →</Link>
 </div>
 </div>
 </div>
 </div>
 </section>

 <div className="h-px mx-4" style={{ background:'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>
 </>)}

 {/* ══ BOTTOM CTA ══ */}
 <section className="py-16 md:py-24 px-4 text-center gc-font section-dots" style={{ background:'linear-gradient(135deg,#F5F0FF,#FFF0F5)' }}>
 <div className="max-w-2xl mx-auto">
 <div className="flex justify-center gap-2 sm:gap-3 mb-6">
 {['Cake','Gift','Party','Heart','Sparkles'].map((name,i) => (
 <span key={i} className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center animate-float" style={{ animationDelay:`${i*0.15}s` }}>
 <Icon name={name} size={22} className="text-primary-500"/>
 </span>
 ))}
 </div>
 <h2 className="font-bold text-warm-900 mb-4" style={{ fontSize:'clamp(2.1rem,6.5vw,3.6rem)' }}>
 {landing?.ctaLead || 'Make someone feel'}<br/>
 <span style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED 50%,#F43F5E)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{landing?.ctaAccent || 'genuinely loved'}</span>
 </h2>
 <p className="text-warm-500 mb-8 text-base sm:text-lg">From <RotatingPrice amountNGN={5000} showFlags={!landing}/> per card · Pay only when you send · Works worldwide</p>
 <div className="flex flex-col sm:flex-row gap-3 justify-center">
 <Link to={ctaTo} className="gc-btn-primary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Sparkles" size={16}/>Get started in a minute</Link>
 <Link to="/pricing" className="gc-btn-secondary px-6 py-3.5 text-sm sm:text-base w-full sm:w-auto inline-flex items-center justify-center gap-2"><Icon name="Card" size={16}/>See pricing</Link>
 </div>
 <p className="text-xs text-warm-400 mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
 <span className="inline-flex items-center gap-1"><Icon name="Lock" size={12}/>Secure payments</span><span>·</span>
 <span className="inline-flex items-center gap-1"><Icon name="Sparkles" size={12}/>No credit card needed</span><span>·</span>
 <span className="inline-flex items-center gap-1"><Icon name="Globe" size={12}/>Used worldwide</span>
 </p>
 </div>
 </section>

 <Footer/>
 {showDemo && <DemoModal onClose={() => setShowDemo(false)}/>}
 </div>
 );
};

export default Home;
