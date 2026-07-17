import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; const FAQS = [ { q: 'How do wedding guests share photos without downloading an app?', a: 'Guests scan your QR code — printed on table cards, welcome signs, or the order of service — or tap the link you share in the invite. They upload photos and videos directly from their phone in seconds. No app, no account, no friction. Works on iPhone, Android, and any device.' }, { q: 'How is Thankeeu different from Wedtrove or Chivent for wedding photos?', a: 'Wedtrove and Chivent collect photos only. Thankeeu\'s Live Memory Wall™ is built inside your wedding group card — guests write heartfelt messages, add voice notes, upload photos and videos, and contribute to the gift pot, all in one place. Every photo and message also automatically becomes a cinematic Wedding Memory Movie™.' }, { q: 'Can we display the wedding photos live on a screen at the reception?', a: 'Yes. Open the Memory Wall on a TV, projector, or laptop at your venue. As guests upload, their photos appear in real time — a live photo show your whole reception watches together.' }, { q: 'Do wedding photos disappear after the event?', a: 'No. Unlike Instagram Stories or apps with 30-90 day storage, every photo and video on your Thankeeu wedding memory wall is preserved permanently. Browse, download, and share them years later.' }, { q: 'Can we collect photos from guests who could not attend?', a: 'Yes. Anyone with the link can contribute — guests who joined via livestream, family who could not travel, or friends sending their love from across the country or the world.' }, { q: 'Does it automatically create a wedding video from guest photos?', a: 'Yes. After the wedding, Thankeeu automatically assembles every message, photo and video into a cinematic Wedding Memory Movie™ — your wedding film, made by everyone who loves you.' }, { q: 'How many guests can upload photos?', a: 'Unlimited. There is no cap on contributors. A wedding with 500 guests can all upload from the same link.' },
]; const CHECK   = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={14} className="text-green-600" strokeWidth={3}/></span>;
const CROSS   = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={14} className="text-red-400" strokeWidth={3}/></span>;
const PARTIAL = <span className="text-xs text-warm-400 font-medium">Some plans</span>;

export default function WeddingMemoryWallPage() { useSEO({ title: 'Wedding Guest Photo Sharing — Collect Every Photo with a QR Code | Thankeeu', description: 'Collect every wedding guest\'s photos and videos in one place. Guests scan a QR code — no app, no account. Real-time live photo wall for the reception. Plus heartfelt messages, voice notes, and a gift pot. Better than Wedtrove: it\'s a group card AND a photo wall in one.', keywords: 'collect wedding photos from guests, wedding guest photo sharing, QR code for wedding photos, wedding photo sharing no app, wedding photo wall, wedding live photo wall, share wedding photos online, wedding digital guest book, guest photo upload wedding QR code, collect guest photos wedding, wedding photo sharing app no download, real time photo sharing wedding, wedding memory wall, wedding photo album guests upload, wedding QR code photos', canonical: '/wedding-memory-wall', locale: 'en', jsonLd: [ SCHEMAS.organization, SCHEMAS.webPage( 'Wedding Guest Photo Sharing — Collect Every Photo with a QR Code | Thankeeu', 'Collect every wedding guest\'s photos and videos in one place. Guests scan a QR code — no app, no account needed.', '/wedding-memory-wall' ), SCHEMAS.breadcrumb([ { name: 'Home', url: '/' }, { name: 'Wedding Memory Wall', url: '/wedding-memory-wall' }, ]), SCHEMAS.faqPage(FAQS), ], }); return ( <>
<Navbar /> {/* ── Hero ── */} <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0030] via-[#2d0052] to-[#1a0533] text-white pt-24 pb-20 px-4">
<div className="max-w-4xl mx-auto text-center">
<h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight mb-6">Collect Every Wedding Guest's Photos<br />
<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">With One QR Code — No App Needed </span>
</h1>
<p className="text-lg text-white/70 max-w-2xl mx-auto mb-4">Your guests have hundreds of photos on their phones. Display your QR code at the venue — guests scan, upload, and every photo lands in your shared wedding memory wall in real time. </p>
<p className="text-sm text-white/40 max-w-xl mx-auto mb-10">Unlike Wedtrove — Thankeeu is a group card AND a photo wall. Guests write messages, record voice notes, upload photos, and contribute to the gift — all from one link. </p>
<div className="flex flex-wrap gap-4 justify-center">
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl transition-all hover:scale-105">Create Wedding Memory Wall → </Link>
<Link to="/occasions/wedding" className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-lg border border-white/20 transition-all">See Wedding Group Cards </Link>
</div>
</div>
</section> {/* ── The problem ── */} <section className="py-14 px-4 bg-white">
<div className="max-w-3xl mx-auto text-center">
<h2 className="text-2xl sm:text-3xl font-display font-bold text-warm-900 mb-4">Your photographer captures the highlight reel.<br />Your guests capture the real story. </h2>
<p className="text-warm-500 text-base leading-relaxed max-w-2xl mx-auto">The aunties on the dance floor at midnight. The best man's face during the speech. The flower girl stealing a bite of cake. These photos exist — they're on your guests'phones right now. Thankeeu collects all of them, the moment they're taken. </p>
</div>
</section> {/* ── How it works ── */} <section className="py-14 px-4 bg-purple-50">
<div className="max-w-4xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-3">Set up in 2 minutes. Works all day.</h2>
<p className="text-center text-warm-500 text-sm mb-10">From morning preparations to the last dance.</p>
<div className="space-y-4 max-w-2xl mx-auto"> {[ { n: '1', title: 'Create your wedding card and enable Live Memory Wall™', body: 'Choose "Group Card + Live Memory Wall" when setting up. Takes 2 minutes.' }, { n: '2', title: 'Print or share your auto-generated QR code', body: 'Thankeeu generates a unique, print-ready QR code the moment your card is created. Place it where guests gather — the bar, reception tables, the photo booth.' }, { n: '3', title: 'Share the link before the day so guests can upload early moments', body: 'Send the link in your pre-wedding message so guests can upload getting-ready photos and behind-the-scenes moments from the morning.' }, { n: '4', title: 'Guests scan, upload, done — photos appear on the wall in real time', body: 'No app, no account. Every guest on iPhone or Android uploads in seconds. Display the wall on a venue screen for a live slideshow.' }, { n: '5', title: 'After the wedding, watch your Memory Movie™', body: 'Thankeeu automatically assembles every photo, message and video into a cinematic wedding film — made by everyone who was there.' }, ].map(({ n, title, body }) => ( <div key={n} className="flex gap-4 bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
<span className="w-8 h-8 rounded-full bg-primary-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
<div>
<p className="font-bold text-warm-900 mb-1 text-sm">{title}</p>
<p className="text-xs text-warm-500 leading-relaxed">{body}</p>
</div>
</div> ))} </div>
</div>
</section> {/* ── Features ── */} <section className="py-14 px-4 bg-white">
<div className="max-w-4xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-10">Why couples choose Thankeeu for wedding photo sharing</h2>
<div className="grid sm:grid-cols-2 gap-6"> {[ { icon: 'Smartphone', title: 'No app. No account. No friction.', body: 'The #1 reason guests don\'t share photos is that they can\'t be bothered with sign-ups. Thankeeu removes every barrier — guests scan the QR code and are uploading in under 10 seconds. Works on every phone, for guests of every age.' }, { icon: 'Camera', title: 'Messages + photos + gift, not just photos', body: 'Wedtrove only collects photos. Thankeeu collects photos AND heartfelt messages, voice notes, and wedding gift contributions — all in one card, all delivered to the couple together.' }, { icon: 'Camera', title: 'Live photo wall on your venue screens', body: 'Open the Memory Wall on a TV or projector at your reception. Guest photos appear the moment they\'re uploaded — a live slideshow your whole wedding watches together in real time.' }, { icon: 'Film', title: 'Automatic Wedding Memory Movie™', body: 'After the celebration, Thankeeu assembles every message, photo and video into a cinematic Memory Movie. A wedding film made by everyone who loves you — not just the videographer.' }, { icon: 'Sparkles', title: 'Full quality, permanently preserved', body: 'Every photo uploads at original resolution. No compression. No 30-day expiry. The wall lives forever — open it on your first anniversary and relive every moment.' }, { icon: 'Users', title: 'Works for guests anywhere in the world', body: 'Friends across the country or overseas can upload photos and write messages from anywhere. The Memory Wall captures every perspective, no matter the distance.' }, ].map(({ icon, title, body }) => ( <div key={title} className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
{icon && <span className="inline-flex w-10 h-10 rounded-xl bg-white items-center justify-center text-primary-500 mb-3"><Icon name={icon} size={20}/></span>}
<h3 className="font-bold text-warm-900 mb-2">{title}</h3>
<p className="text-sm text-warm-500 leading-relaxed">{body}</p>
</div> ))} </div>
</div>
</section> {/* ── Comparison ── */} <section className="py-14 px-4 bg-gradient-to-br from-purple-50 to-white">
<div className="max-w-4xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-3">Thankeeu vs Wedtrove & Chivent </h2>
<p className="text-center text-warm-500 text-sm mb-10 max-w-xl mx-auto">Both are solid photo collection tools. But Thankeeu does more — because your wedding is about more than photos.</p>
<div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm">
<table className="w-full">
<thead>
<tr className="bg-purple-50">
<th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
<th className="text-center p-4 text-sm font-bold text-warm-400">Wedtrove / Chivent</th>
<th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
</tr>
</thead>
<tbody className="divide-y divide-purple-50"> {[ ['QR code for guest photos', CHECK, CHECK], ['No app or account for guests', CHECK, CHECK], ['Unlimited guests', CHECK, CHECK], ['Full-quality photo uploads', CHECK, CHECK], ['Personal heartfelt messages', CROSS, CHECK], ['Voice notes from guests', CROSS, CHECK], ['Wedding gift pot', CROSS, CHECK], ['Auto Memory Movie™ from photos', CROSS, CHECK], ['Photo + card in one delivery', CROSS, CHECK], ['Multi-currency payments', CROSS, CHECK], ].map(([f, a, b]) => ( <tr key={f} className="hover:bg-purple-50/40 transition-colors">
<td className="p-4 text-sm text-warm-700">{f}</td>
<td className="p-4 text-center">{a}</td>
<td className="p-4 text-center">{b}</td>
</tr> ))} </tbody>
</table>
</div>
</div>
</section> {/* ── FAQ ── */} <section className="py-14 px-4 bg-white">
<div className="max-w-2xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-8">Frequently asked questions</h2>
<div className="space-y-3"> {FAQS.map(({ q, a }) => ( <details key={q} className="rounded-2xl border border-purple-100 bg-white">
<summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between"> {q}<span className="text-warm-400 flex-shrink-0 ml-3">+</span>
</summary>
<p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
</details> ))} </div>
</div>
</section> {/* ── Related Wedding Pages ── */} <section className="py-12 px-4 bg-white">
<div className="max-w-4xl mx-auto">
<h2 className="text-xl font-display font-bold text-warm-900 mb-2">More wedding tools from Thankeeu</h2>
<p className="text-sm text-warm-500 mb-8">Everything you need for wedding memories — photos, messages, gifts, and more.</p>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{[
  { to:'/wedding-photo-sharing-app',     icon:'Camera', title:'Wedding Photo Sharing App',      desc:'The easiest way for guests to share photos. One QR code at the venue.' },
  { to:'/qr-code-for-wedding-photos',    icon:'Camera', title:'QR Code for Wedding Photos',     desc:'Auto-generated, print-ready QR code for your table cards and welcome sign.' },
  { to:'/collect-wedding-guest-photos',  icon:'Images', title:'Collect Wedding Guest Photos',   desc:'Gather every guest\'s best shots automatically — no chasing required.' },
  { to:'/digital-wedding-guest-book',    icon:'BookOpen', title:'Digital Wedding Guest Book',     desc:'Messages, photos, voice notes and videos — all in one digital keepsake.' },
  { to:'/online-wedding-guestbook',      icon:'Edit', title:'Online Wedding Guestbook',       desc:'Replace the paper book with one that captures far more than signatures.' },
  { to:'/wedding-group-card',            icon:'Mail', title:'Wedding Group Card',             desc:'Everyone signs one card — messages, photos, voice notes and a gift.' },
  { to:'/wedding-memory-book',           icon:'Film', title:'Wedding Memory Book',            desc:'A cinematic Memory Movie™ assembled from every guest\'s contribution.' },
  { to:'/wedding-video-message-book',    icon:'Video', title:'Wedding Video Messages',         desc:'Guests record short video clips — assembled into a keepsake film.' },
  { to:'/wedding-voice-note-guest-book', icon:'Mic', title:'Wedding Voice Note Book',        desc:'Hear every blessing and prayer in your guests\' own voices.' },
  { to:'/wedding-cash-gift-platform',    icon:'CreditCard', title:'Wedding Cash Gift Platform',     desc:'Pool cash gifts in NGN, GBP, USD alongside messages and photos.' },
  { to:'/best-wedding-photo-sharing-app',icon:'Star', title:'Best Wedding Photo App',        desc:'Honest 2025 comparison of GuestPix, WedUploader, Wedtrove & Thankeeu.' },
  { to:'/wedding-photo-album-online',    icon:'Image', title:'Online Wedding Photo Album',     desc:'A shared album every guest contributes to — full quality, permanent.' },
].map(({ to, icon, title, desc }) => (
  <Link key={to} to={to} onClick={() => window.scrollTo({ top:0, behavior:'instant' })}
    className="flex gap-3 p-4 rounded-2xl border-2 border-purple-100 bg-white hover:border-primary-300 hover:bg-primary-50 transition-all group">
    <span className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 group-hover:bg-primary-100 transition-colors"><Icon name={icon} size={16}/></span>
    <div>
      <p className="font-bold text-warm-900 text-sm leading-tight mb-1 group-hover:text-primary-700 transition-colors">{title}</p>
      <p className="text-xs text-warm-500 leading-snug">{desc}</p>
    </div>
  </Link>
))}
</div>
</div>
</section> {/* ── CTA ── */} <section className="py-20 px-4 bg-gradient-to-br from-[#1a0030] to-[#2d0052] text-white text-center">
<div className="max-w-2xl mx-auto">
<h2 className="text-3xl sm:text-4xl font-display font-extrabold mb-4">Capture every guest's perspective.</h2>
<p className="text-white/60 mb-3 text-lg">Set up the Memory Wall in 2 minutes. Guests scan, upload, done.</p>
<p className="text-white/40 text-sm mb-10">No app · No account · Works on any phone · Full quality · Permanent</p>
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl transition-all hover:scale-105 inline-block">Create Wedding Memory Wall → </Link>
</div>
</section>
<Footer />
</> );
}
