import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; const FAQS = [ { q: 'How do friends and family upload birthday photos without an app?', a: 'Share the link before the birthday — friends and family upload photos and videos from their phone camera roll in seconds. No app download, no account, no sign-up. Works on iPhone, Android, and any device.' }, { q: 'Can people from different states or countries contribute?', a: 'Yes. Anyone with the link contributes from anywhere — friends across the country, family overseas. Distance is no barrier.' }, { q: 'Does the birthday memory wall stay live after the day?', a: 'Yes, permanently. Unlike Instagram Stories or Snapchat, every photo, video and message is preserved forever. The celebrant can go back to it months and years later.' }, { q: 'Can we share the birthday photos live on a screen at the party?', a: 'Yes. Open the Memory Wall on a TV or projector at the party venue. Guest photos appear the moment they\'re uploaded — a live birthday slideshow everyone watches together in real time.' }, { q: 'Does it automatically create a birthday video from the photos?', a: 'Yes. Thankeeu automatically combines every message, photo and video into a cinematic Birthday Memory Movie™ the celebrant keeps forever.' }, { q: 'How is this different from a shared Google Photos album?', a: 'Google Photos requires everyone to have an account and know how to navigate shared albums — most people won\'t bother. Thankeeu takes one tap. Plus, Thankeeu collects heartfelt birthday messages, voice notes, and gift contributions alongside the photos — Google Photos does none of that.' },
]; export default function BirthdayMemoryWallPage() { useSEO({ title: 'Birthday Memory Wall — Collect Guest Photos & Videos In One Place | Thankeeu', description: 'Create a live birthday memory wall where friends and family upload photos and videos throughout the day — no app, no account. Share the link, display live at the party, watch the auto Memory Movie™ after.', keywords: 'birthday memory wall, birthday photo sharing guests, collect birthday photos no app, birthday photo wall, share photos at birthday party, birthday photo sharing QR code, live birthday photo wall, birthday photo album guests upload, group birthday photo sharing, birthday memory album online, big birthday photo collection, birthday guest photo sharing no sign up', canonical: '/birthday-memory-wall', locale: 'en', jsonLd: [ SCHEMAS.organization, SCHEMAS.webPage( 'Birthday Memory Wall — Collect Guest Photos & Videos In One Place | Thankeeu', 'Create a live birthday memory wall where friends and family upload photos and videos throughout the day — no app, no account.', '/birthday-memory-wall' ), SCHEMAS.breadcrumb([ { name: 'Home', url: '/' }, { name: 'Birthday Memory Wall', url: '/birthday-memory-wall' }, ]), SCHEMAS.faqPage(FAQS), ], }); return ( <>
<Navbar /> {/* ── Hero ── */} <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-24 pb-20 px-4 text-center">
<div className="max-w-3xl mx-auto">
<h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight mb-6">Collect Every Birthday Photo From Every Guest<br />
<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">No App. No Sign-Up. Just Share a Link. </span>
</h1>
<p className="text-lg text-white/70 mb-4 max-w-2xl mx-auto">Share the link before the party. Friends and family upload photos and videos all day — from the venue, from their homes, from across the country. One live wall. Every memory. Kept forever. </p>
<p className="text-sm text-white/40 mb-10">Plus heartfelt birthday messages, voice notes, GIFs, and a gift pot — all in one birthday card. </p>
<div className="flex flex-wrap gap-4 justify-center">
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl inline-block hover:scale-105 transition-all">Create Birthday Memory Wall → </Link>
<Link to="/occasions/birthday" className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-lg border border-white/20 transition-all">See Birthday Group Cards </Link>
</div>
</div>
</section> {/* ── Features 3-col ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-4xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-3">Messages + photos + movie — all from one birthday card</h2>
<p className="text-center text-warm-500 text-sm mb-10">Not just a photo album — a complete birthday experience</p>
<div className="grid sm:grid-cols-3 gap-5"> {[ { icon: 'MessageSquare', title: 'Heartfelt birthday messages', desc: 'Every guest writes their own personal message — with photos, voice notes, GIFs and a gift contribution. Collected in a beautiful digital card.' }, { icon: 'Camera', title: 'Live birthday photo wall', desc: 'Guests upload photos all day — from the party, from home, from across the country. Every upload appears on the wall in real time.' }, { icon: 'Film', title: 'Auto Birthday Memory Movie™', desc: 'After the birthday, every message and photo becomes a cinematic birthday movie the celebrant keeps and watches for years.' }, ].map(({ emoji, title, desc }) => ( <div key={title} className="text-center p-6 rounded-2xl bg-purple-50 border border-purple-100">
{emoji && <span className="text-3xl block mb-3">{emoji}</span>}
<h3 className="font-bold text-warm-900 mb-2">{title}</h3>
<p className="text-sm text-warm-500 leading-relaxed">{desc}</p>
</div> ))} </div>
</div>
</section> {/* ── How it works ── */} <section className="py-16 px-4 bg-purple-50">
<div className="max-w-3xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-10">Set up in 2 minutes</h2>
<div className="space-y-4"> {[ { n: '1', title: 'Create the birthday card and enable Live Memory Wall™', body: 'Choose birthday, enter their name, pick a delivery time — and turn on the Memory Wall. Done.' }, { n: '2', title: 'Share the link — or print the auto-generated QR code', body: 'Thankeeu generates a QR code for your party automatically. Display it on a venue screen or print on table cards — guests scan and upload. Or send the link on WhatsApp to family and friends anywhere.' }, { n: '3', title: 'Watch photos roll in all day — live on any screen', body: 'Open the Memory Wall on a TV or laptop at the party. Every uploaded photo appears in real time. The celebrant watches their wall grow throughout the day.' }, { n: '4', title: 'After the birthday, enjoy the Memory Movie™', body: 'Thankeeu auto-assembles every message, photo and video into a cinematic birthday film. The most emotional thing they\'ll watch all year.' }, ].map(({ n, title, body }) => ( <div key={n} className="flex gap-4 bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
<span className="w-8 h-8 rounded-full bg-primary-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
<div>
<p className="font-bold text-warm-900 mb-1 text-sm">{title}</p>
<p className="text-xs text-warm-500 leading-relaxed">{body}</p>
</div>
</div> ))} </div>
</div>
</section> {/* ── Why it beats the alternatives ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-4xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-10">Why guests actually use Thankeeu (unlike Google Drive or group chats)</h2>
<div className="grid sm:grid-cols-2 gap-6"> {[ { icon: 'Smartphone', title: 'No app. No account. No friction.', body: 'The reason photos die in people\'s camera rolls: nobody wants to download another app. Thankeeu works directly in any phone browser — one tap from the link and they\'re uploading. That\'s why participation is genuinely high.' }, { icon: 'Sparkles', title: 'Works on every phone and device', body: 'iPhone, Android, or any smartphone with a browser — Thankeeu works for every guest, every generation. One link, no compatibility issues.' }, { icon: 'Sparkles', title: 'Friends and family anywhere can contribute', body: 'Someone on the other side of the country can upload a throwback photo or send a video message. The Memory Wall collects every perspective, no matter the distance.' }, { icon: 'Camera', title: 'Photos + gift in the same link', body: 'Instead of a separate payment link for the birthday gift, Thankeeu collects photos and gift contributions together. One link does everything.' }, ].map(({ emoji, title, body }) => ( <div key={title} className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
{emoji && <span className="text-3xl mb-3 block">{emoji}</span>}
<h3 className="font-bold text-warm-900 mb-2">{title}</h3>
<p className="text-sm text-warm-500 leading-relaxed">{body}</p>
</div> ))} </div>
</div>
</section> {/* ── FAQ ── */} <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-white">
<div className="max-w-2xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-8">Frequently asked questions</h2>
<div className="space-y-3"> {FAQS.map(({ q, a }) => ( <details key={q} className="rounded-2xl border border-purple-100 bg-white">
<summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between"> {q}<span className="text-warm-400 flex-shrink-0 ml-3">+</span>
</summary>
<p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
</details> ))} </div>
</div>
</section> {/* ── CTA ── */} <section className="py-16 px-4 text-center bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white">
<div className="max-w-xl mx-auto">
<h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Create a birthday memory they'll watch for years.</h2>
<p className="text-white/60 mb-3">Set up in 2 minutes. No app for guests. Works from any phone.</p>
<p className="text-white/40 text-sm mb-8">Messages · Photos · Voice notes · Gift pot · Memory Movie™</p>
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl inline-block hover:scale-105 transition-all">Create Birthday Memory Wall → </Link>
</div>
</section>
<Footer />
</> );
}
