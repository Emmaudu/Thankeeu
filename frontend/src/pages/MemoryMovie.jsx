import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon'; const STEPS = [ { icon: 'Users', title: 'Everyone contributes', desc: 'Friends, family and colleagues upload photos, videos, voice notes and heartfelt messages from anywhere in the world.' }, { icon: 'Film', title: 'Thankeeu creates the movie', desc: 'Our engine automatically arranges every contribution into a beautiful cinematic timeline with transitions, music and animations.' }, { icon: 'Play', title: 'Watch together', desc: 'The recipient receives a link to watch, download and share their personalised Memory Movie — a keepsake they\'ll return to for years.' },
]; const FEATURES = [ { icon: 'MessageSquare', label: 'Unlimited heartfelt messages' }, { icon: 'Mic', label: 'Voice notes in their own voice' }, { icon: 'Video', label: 'Video clips from loved ones' }, { icon: 'Image', label: 'Photos from the celebration' }, { icon: 'Music', label: 'Beautiful background music' }, { icon: 'Download', label: 'Downloadable MP4 — keep forever' }, { icon: 'Share2', label: 'Shareable link for everyone' }, { icon: 'Gift', label: 'Gift collection included' },
]; const OCCASIONS = [ { emoji: 'Cake', label: 'Birthdays' }, { emoji: 'Briefcase', label: 'Farewell & Leaving' }, { icon: 'Sun', label: 'Retirement' }, { icon: 'GraduationCap', label: 'Graduation' }, { emoji: 'Diamond', label: 'Engagements' }, { emoji: 'Baby', label: 'New Baby' }, { emoji: 'Home', label: 'New Home' }, { emoji: 'TrendingUp', label: 'Promotions' },
]; const FAQS = [ ['How long does the Memory Movie take to generate?', 'Usually 2–5 minutes, depending on how many photos and videos were uploaded. You\'ll see a progress indicator and receive notification when it\'s ready.'], ['How long is the movie?', 'Typically 2–8 minutes depending on the number of contributions. Every message, photo and video is included — nothing is cut.'], ['Can I download the movie?', 'Yes — every Memory Movie is downloadable as a 1080p MP4 you can keep, share, re-watch and back up anywhere.'], ['Is the Memory Movie included on all plans?', 'Yes. Every Thankeeu card — Classic, Standard, and all team plans — includes a Memory Movie at no extra cost. It is a core part of the Thankeeu experience, not an add-on.'], ['What if new people sign the card after the movie was made?', 'You can regenerate the movie at any time to include newly added messages and media.'], ['Can contributors add photos and videos?', 'Yes. Any contributor can attach a photo, video or voice note to their message when signing the card.'],
]; export default function MemoryMoviePage() { useSEO({ title: 'Thankeeu Memory Movie™ — Turn Birthday Messages, Photos & Videos Into One Beautiful Movie', description: 'Thankeeu automatically creates a cinematic 1080p Memory Movie from every message, photo, video and voice note uploaded to your group card. Included free on every plan.', keywords: 'memory movie, birthday video from messages, group card video, combine birthday wishes into video, birthday memory video, farewell video from colleagues, online group card video, Thankeeu Memory Movie', canonical: '/memory-movie', locale: 'en', jsonLd: [ SCHEMAS.organization, SCHEMAS.faqPage(FAQS.map(([q, a]) => ({ q, a }))), { '@context': 'https://schema.org', '@type': 'Product', name: 'Thankeeu Memory Movie™', description: 'Automatically generated 1080p MP4 memory video from group card messages, photos, videos and voice notes.', brand: { '@type': 'Brand', name: 'Thankeeu' }, offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP', description: 'Included free with every group card' }, }, ], }); return ( <>
<Navbar /> {/* ── Hero ── */} <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0020] via-[#1a0533] to-[#2d1052] text-white pt-24 pb-20 px-4">
<div className="max-w-4xl mx-auto text-center">
<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/10 text-xs font-bold uppercase tracking-widest border border-white/20 mb-6">
<span></span>New Feature </span>
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight mb-6">Turn Hundreds of Birthday Wishes<br className="hidden sm:block" />
<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300"> {' '}Into One Beautiful Movie. </span>
</h1>
<p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10">Thankeeu automatically transforms every message, photo, video and voice note into a cinematic 1080p Memory Movie™ — a keepsake your loved ones will watch again and again. </p>
<div className="flex flex-wrap gap-4 justify-center">
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 font-bold text-lg shadow-xl transition-all hover:scale-105">Create Your Memory → </Link>
<Link to="/sample" className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-lg border border-white/20 transition-all">Watch Sample Movie </Link>
</div>
</div>
</section> {/* ── What it includes ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-5xl mx-auto">
<h2 className="text-3xl font-display font-bold text-center text-warm-900 mb-4">Don't just send a card. Create a memory. </h2>
<p className="text-warm-500 text-center mb-10 max-w-2xl mx-auto">Every Thankeeu card automatically becomes a cinematic keepsake. No extra apps. No editing. No effort. </p>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4"> {FEATURES.map(({ icon, label }) => ( <div key={label} className="flex flex-col items-center text-center p-5 rounded-2xl bg-purple-50 border border-purple-100 hover:border-primary-200 transition-colors">
<Icon name={icon} size={28} className="text-primary-500 mb-2" />
<span className="text-sm font-semibold text-warm-700">{label}</span>
</div> ))} </div>
</div>
</section> {/* ── Big comparison ── */} <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
<div className="max-w-4xl mx-auto text-center">
<h2 className="text-3xl font-display font-bold text-warm-900 mb-12">More Than A Group Card </h2>
<div className="grid sm:grid-cols-2 gap-6">
<div className="rounded-2xl bg-warm-100 border border-warm-200 p-8 text-left opacity-60">
<p className="text-xs font-bold uppercase tracking-widest text-warm-400 mb-4">Everyone else</p>
<p className="font-bold text-warm-700 text-lg mb-4">Anyone can collect messages.</p>
<ul className="space-y-2 text-warm-500 text-sm">
<li>Messages collected</li>
<li>Card delivered by email</li>
<li className="text-warm-300">No movie</li>
<li className="text-warm-300">Forgotten in a month</li>
</ul>
</div>
<div className="rounded-2xl bg-gradient-to-br from-[#1a0533] to-[#2d1052] p-8 text-left text-white shadow-2xl relative overflow-hidden">
<div className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-xl bg-primary-500">Thankeeu </div>
<p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Only Thankeeu</p>
<p className="font-bold text-white text-lg mb-4">Turns them into a movie.</p>
<ul className="space-y-2 text-white/80 text-sm">
<li>Messages collected</li>
<li>Card delivered by email</li>
<li>
<strong>Automatic Memory Movie™</strong></li>
<li>
<strong>Kept and re-watched for years</strong></li>
</ul>
</div>
</div>
</div>
</section> {/* ── Imagine section ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-3xl mx-auto text-center">
<h2 className="text-3xl font-display font-bold text-warm-900 mb-4">Imagine receiving…</h2>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-10"> {[ { emoji: 'Heart', n: '80', label: 'birthday wishes' }, { emoji: 'Camera', n: '50', label: 'photos' }, { emoji: 'Video', n: '12', label: 'videos' }, { emoji: 'Mic', n: '20', label: 'voice notes' }, ].map(({ emoji, n, label }) => ( <div key={label} className="rounded-2xl bg-purple-50 border border-purple-100 p-5">
{emoji && <div className="mb-2 text-primary-500"><Icon name={emoji} size={20}/></div>}
<div className="text-2xl font-extrabold text-warm-900">{n}</div>
<div className="text-sm text-warm-500">{label}</div>
</div> ))} </div>
<p className="text-xl font-semibold text-warm-700">Beautifully transformed into one unforgettable movie. </p>
<p className="text-warm-400 mt-3 text-sm max-w-lg mx-auto">WhatsApp messages disappear. Memories shouldn't. Thankeeu preserves life's biggest celebrations forever. </p>
</div>
</section> {/* ── How it works ── */} <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-white">
<div className="max-w-4xl mx-auto">
<h2 className="text-3xl font-display font-bold text-center text-warm-900 mb-12">How It Works</h2>
<div className="grid sm:grid-cols-3 gap-6"> {STEPS.map(({ icon, title, desc }, i) => ( <div key={title} className="relative text-center p-6 rounded-2xl bg-white border border-purple-100 shadow-sm">
<div className="w-10 h-10 rounded-full bg-primary-500 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg"> {i + 1} </div>
<Icon name={icon} size={28} className="text-primary-400 mx-auto mb-3" />
<h3 className="font-bold text-warm-900 mb-2">{title}</h3>
<p className="text-sm text-warm-500">{desc}</p>
</div> ))} </div>
</div>
</section> {/* ── Occasions ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-4xl mx-auto text-center">
<h2 className="text-2xl font-display font-bold text-warm-900 mb-8">A Memory Movie for every occasion</h2>
<div className="flex flex-wrap justify-center gap-3"> {OCCASIONS.map(({ emoji, label }) => ( <Link key={label} to="/card/new" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-100 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm font-medium text-warm-700">
{emoji && <span className="text-primary-400 mr-1"><Icon name={emoji} size={16} style={{display:"inline"}}/></span>}{label} </Link> ))} </div>
</div>
</section> {/* ── Emotional CTA ── */} <section className="py-20 px-4 bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white text-center">
<div className="max-w-2xl mx-auto">
<p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-4">Free on every plan</p>
<h2 className="text-3xl sm:text-4xl font-display font-extrabold mb-4">The easiest way to create<br />an unforgettable celebration. </h2>
<p className="text-white/60 mb-8 text-lg">Create a group card today. Thankeeu handles the movie. </p>
<div className="flex flex-wrap gap-4 justify-center">
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 font-bold text-lg shadow-xl transition-all hover:scale-105">Create Your Memory → </Link>
<Link to="/pricing" className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold border border-white/20 transition-all">See Pricing </Link>
</div>
</div>
</section> {/* ── FAQ ── */} <section className="py-16 px-4 bg-white">
<div className="max-w-2xl mx-auto">
<h2 className="text-2xl font-display font-bold text-warm-900 text-center mb-8">Frequently asked questions</h2>
<div className="space-y-4"> {FAQS.map(([q, a]) => ( <details key={q} className="rounded-2xl border border-purple-100 group">
<summary className="px-5 py-4 font-semibold text-warm-800 cursor-pointer text-sm list-none flex items-center justify-between"> {q} <Icon name="ChevronDown" size={16} className="text-warm-400 group-open:rotate-180 transition-transform" />
</summary>
<p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
</details> ))} </div>
</div>
</section>
<Footer />
</> );
}
