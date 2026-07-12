import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon'; const OCCASIONS = ['Birthday','Wedding','Baby Shower','Graduation','Farewell','Retirement','Anniversary','Memorial','Corporate Event','Employee Appreciation','Office Party','Team Retreat','Engagement','Housewarming','Sweet 16','Quinceañera']; const FAQS = [ { q: 'What is a Live Memory Wall?', a: 'A Live Memory Wall is a shared, real-time photo and video wall that every guest at your event can contribute to from their phone — by scanning a QR code or clicking a link. No app, no sign-up. Unlike Instagram Stories, it never disappears — every upload is preserved permanently.' }, { q: 'How do guests share photos without downloading an app?', a: 'Guests scan the QR code you display at the venue — on table cards, a welcome sign, or a projector screen — or click the link you share. They upload photos and videos instantly from their camera roll. No account or app download required. Works on iPhone, Android, or any device.' }, { q: 'How is this different from Wedtrove, Chivent, or Warpbin?', a: 'Those are photo-only collection tools. Thankeeu\'s Live Memory Wall is built inside your group card. Guests write heartfelt messages AND upload photos — it\'s a digital guest book and a live photo wall in one place. Every photo and message also automatically becomes a cinematic Memory Movie™. No separate subscription or separate link.' }, { q: 'Can we display photos live at the venue?', a: 'Yes. Open the Memory Wall on any screen, TV, or projector and photos appear in real time as guests upload throughout the event — a live slideshow your whole celebration watches together.' }, { q: 'Does the Memory Wall replace the group card?', a: 'Not unless you want it to. Choose Group Card Only, Live Memory Wall Only, or both together. We recommend combining them — contributors write personal messages AND upload event photos, all delivered in one experience.' }, { q: 'What happens to photos after the event?', a: 'Everything is preserved permanently. Browse, download, and share every photo long after the celebration ends. All uploads automatically feed into the Thankeeu Memory Movie™ — a cinematic video of the whole event.' }, { q: 'Is there a guest limit?', a: 'No. There\'s no cap on how many guests can scan the QR code and upload. Whether it\'s 20 people or 500, everyone gets in.' }, { q: 'Is the Live Memory Wall included on all plans?', a: 'Yes — the Live Memory Wall is included on every Thankeeu plan.' },
]; export default function LiveMemoryWallPage() { useSEO({ title: 'Live Memory Wall™ — Collect Every Guest Photo & Video at Your Event | Thankeeu', description: 'Collect every guest\'s photos and videos in one shared wall — guests scan a QR code or click a link, no app needed. Real-time live photo wall for weddings, birthdays, and every celebration. A group card AND a photo wall in one.', keywords: 'live memory wall, collect guest photos event, wedding guest photo sharing, QR code for event photos, guest photo sharing no app, share photos at event no sign up, live photo wall event, real time photo sharing wedding, collect wedding photos from guests, event photo wall QR code, birthday photo sharing guests, wedding photo album guests upload, digital guest book photos, share photos at party no download, group photo sharing event, guest photo collection app, event photo wall', canonical: '/live-memory-wall', locale: 'en', jsonLd: [ SCHEMAS.organization, SCHEMAS.webPage( 'Live Memory Wall™ — Collect Every Guest Photo & Video at Your Event | Thankeeu', 'Collect every guest\'s photos and videos in one shared wall — guests scan a QR code or click a link, no app needed.', '/live-memory-wall' ), SCHEMAS.breadcrumb([ { name: 'Home', url: '/' }, { name: 'Live Memory Wall', url: '/live-memory-wall' }, ]), SCHEMAS.faqPage(FAQS), { '@type': 'SoftwareApplication', name: 'Thankeeu Live Memory Wall™', applicationCategory: 'PhotoSharing', description: 'Real-time shared photo and video wall for events. Guests upload via QR code or link — no app, no account.', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' }, operatingSystem: 'Any — works in any mobile browser', featureList: 'QR code sharing, no app download, real-time uploads, live slideshow, permanent storage, Memory Movie auto-generation, gift pot', }, ], }); return ( <>
<Navbar /> {/* ── Hero ── */} <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0020] via-[#1a0533] to-[#2d1052] text-white pt-24 pb-20 px-4">
<div className="max-w-4xl mx-auto text-center">
<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/10 text-xs font-bold uppercase tracking-widest border border-white/20 mb-6">Live Memory Wall™ </span>
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight mb-6">Your Guests Are Taking Amazing Photos. <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">Stop Losing Them. </span>
</h1>
<p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-4">Guests scan a QR code or tap your link — no app, no account, no friction. Every photo and video lands in one beautiful shared wall in real time. Works for weddings, birthdays, corporate events, and every celebration. </p>
<p className="text-sm text-white/40 max-w-xl mx-auto mb-10">Unlike Wedtrove or Chivent — your photo wall lives inside your group card. Messages + photos + gift, all in one place. </p>
<div className="flex flex-wrap gap-4 justify-center">
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 font-bold text-lg shadow-xl transition-all hover:scale-105">Create Memory Wall — Free → </Link>
<Link to="/sample" className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-lg border border-white/20 transition-all">See Live Demo </Link>
</div>
</div>
</section> {/* ── The real problem ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-3xl mx-auto text-center">
<h2 className="text-2xl sm:text-3xl font-display font-bold text-warm-900 mb-4">Your photographer catches the ceremony.<br />Your guests catch everything else. </h2>
<p className="text-warm-500 text-base leading-relaxed max-w-2xl mx-auto">The inside jokes, the candid dance floor moments, the reactions nobody planned for. They're all sitting in dozens of different camera rolls — and most will never make it out of a group chat. Thankeeu collects all of it, automatically, the moment it's taken. </p>
</div>
</section> {/* ── How it works ── */} <section className="py-16 px-4 bg-purple-50">
<div className="max-w-4xl mx-auto">
<h2 className="text-3xl font-display font-bold text-center text-warm-900 mb-3">How it works — 3 steps</h2>
<p className="text-center text-warm-500 mb-12 text-sm">Set up in 2 minutes. Guests scan. You get every photo.</p>
<div className="grid sm:grid-cols-3 gap-6"> {[ { step: 1, icon: 'Link', title: 'Share a QR code or link', desc: 'Print the QR code on table cards or display it on a screen at the venue. Or send the link in the event invite. Guests scan or click — that\'s it.' }, { step: 2, icon: 'Upload', title: 'Guests upload instantly', desc: 'No app download. No account. Guests upload photos and videos from any phone and every upload appears on the wall in real time.' }, { step: 3, icon: 'Heart', title: 'Every memory preserved forever', desc: 'The wall never disappears. Browse, download, and share every photo and video long after the celebration ends — and watch the auto Memory Movie™.' }, ].map(({ step, icon, title, desc }) => ( <div key={step} className="text-center p-6 rounded-2xl bg-white border border-purple-100 shadow-sm">
<div className="w-10 h-10 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">{step}</div>
<Icon name={icon} size={28} className="text-primary-400 mx-auto mb-3" />
<h3 className="font-bold text-warm-900 mb-2">{title}</h3>
<p className="text-sm text-warm-500 leading-relaxed">{desc}</p>
</div> ))} </div>
</div>
</section> {/* ── Comparison ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-4xl mx-auto">
<h2 className="text-2xl sm:text-3xl font-display font-bold text-center text-warm-900 mb-3">Not just a photo wall — a group card AND a photo wall </h2>
<p className="text-center text-warm-500 text-sm mb-12 max-w-2xl mx-auto">Wedtrove, Chivent, and Warpbin collect photos only. Thankeeu does more: every guest writes a heartfelt message, uploads photos, adds a voice note — and chips into a gift. All delivered in one experience. </p>
<div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm">
<table className="w-full">
<thead>
<tr className="bg-purple-50">
<th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
<th className="text-center p-4 text-sm font-bold text-warm-400">Wedtrove / Chivent</th>
<th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu Live Wall™</th>
</tr>
</thead>
<tbody className="divide-y divide-purple-50"> {[ ['QR code for guest photo upload', '', ''], ['No app or account needed', '', ''], ['Heartfelt personal messages', '', ''], ['Voice notes & audio messages', '', ''], ['Pooled gift collection', '', ''], ['Auto Memory Movie™ from photos', '', ''], ['Live display on venue screens', 'Some plans', 'Included'], ['Photo + card in one delivery', '', ''], ['Permanent storage, no expiry', 'Paid add-on', 'Included'], ].map(([f, a, b]) => ( <tr key={f}>
<td className="p-4 text-sm text-warm-700">{f}</td>
<td className="p-4 text-sm text-center text-warm-400">{a}</td>
<td className="p-4 text-sm text-center text-primary-600 font-semibold">{b}</td>
</tr> ))} </tbody>
</table>
</div>
</div>
</section> {/* ── Key features ── */} <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-white">
<div className="max-w-4xl mx-auto">
<h2 className="text-2xl font-display font-bold text-center text-warm-900 mb-10">Everything your event photo wall needs</h2>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"> {[ { emoji: '', title: 'QR code — scan and upload instantly', body: 'Print on table cards, place cards, or welcome signs. Display on a projector. Guests scan and are uploading within seconds.' }, { emoji: '', title: 'No app. No account. No friction.', body: 'The biggest reason guests don\'t share photos is friction. Thankeeu removes every barrier — no download, no registration, no password. Just tap and upload.' }, { emoji: '', title: 'Live slideshow at the venue', body: 'Open the Memory Wall on any TV, projector, or big screen. Guest photos appear in real time as they upload — a live show your whole celebration watches together.' }, { emoji: '', title: 'Full quality, no compression', body: 'Every photo and video uploads at original quality. No chat app compression, no pixelated memories. The same shot your guest took is the one you download.' }, { emoji: '', title: 'Auto Memory Movie™ included', body: 'After the event, Thankeeu assembles every photo, video and message into a cinematic Memory Movie™ — a film of the whole celebration made by everyone who was there.' }, { emoji: '', title: 'Gift collection built in', body: 'Guests contribute to the gift alongside their photos. One link collects photos AND gifts — no separate payment link, no group chat coordination.' }, ].map(({ emoji, title, body }) => ( <div key={title} className="rounded-2xl p-5 bg-white border border-purple-100 shadow-sm">
{emoji && <div className="text-2xl mb-3">{emoji}</div>}
<p className="font-bold text-warm-900 mb-1 text-sm">{title}</p>
<p className="text-xs text-warm-500 leading-relaxed">{body}</p>
</div> ))} </div>
</div>
</section> {/* ── Occasions ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-4xl mx-auto text-center">
<h2 className="text-2xl font-display font-bold text-warm-900 mb-3">Works for every occasion</h2>
<p className="text-warm-500 text-sm mb-8">Any event where guests take photos.</p>
<div className="flex flex-wrap justify-center gap-2"> {OCCASIONS.map(o => ( <Link key={o} to="/card/new" className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-100 hover:border-primary-300 text-sm font-medium text-warm-700 transition-colors"> {o} </Link> ))} </div>
</div>
</section> {/* ── Social proof ── */} <section className="py-12 px-4 bg-purple-50">
<div className="max-w-2xl mx-auto text-center">
<p className="text-lg text-warm-800 italic leading-relaxed mb-4"> "We sent the link in the invite a few days before. By the end of the night we had photos from the getting-ready, the ceremony, the reception — all in one place. Our photographer got the formals. Our guests got everything else." </p>
<p className="text-sm font-bold text-primary-600">— Thankeeu user</p>
</div>
</section> {/* ── FAQ ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-2xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-8">Frequently asked questions</h2>
<div className="space-y-3"> {FAQS.map(({ q, a }) => ( <details key={q} className="rounded-2xl border border-purple-100 group bg-white">
<summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between"> {q}<Icon name="ChevronDown" size={16} className="text-warm-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3" />
</summary>
<p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
</details> ))} </div>
</div>
</section> {/* ── CTA ── */} <section className="py-20 px-4 bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white text-center">
<div className="max-w-2xl mx-auto">
<h2 className="text-3xl sm:text-4xl font-display font-extrabold mb-4">Every guest. Every shot. All in one place.</h2>
<p className="text-white/60 mb-3 text-lg">Create a card with a Live Memory Wall. Guests scan, upload, done.</p>
<p className="text-white/40 text-sm mb-10">No app · No account · Works from any phone · Full quality · Kept forever</p>
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 font-bold text-lg shadow-xl transition-all hover:scale-105">Create Your Memory Wall — Free → </Link>
</div>
</section>
<Footer />
</> );
}
