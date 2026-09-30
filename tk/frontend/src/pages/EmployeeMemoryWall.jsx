import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; export default function EmployeeMemoryWallPage() { useSEO({ title: 'Employee Memory Wall — Celebrate Employees With More Than Just Messages | Thankeeu', description: 'Capture photos, videos and memories from the whole team for birthdays, farewells, retirements and work anniversaries. The employee receives a permanent memory wall and a cinematic Memory Movie.', keywords: 'employee memory wall, employee appreciation photos, team celebration wall, work anniversary memory, farewell memory wall, remote team celebration', canonical: '/employee-memory-wall', locale: 'en', jsonLd: [ SCHEMAS.organization, SCHEMAS.faqPage([ { q: 'How do teams celebrate employees with a memory wall?', a: 'The whole team signs a group card and uploads photos and videos from work events to a shared memory wall. The employee receives a permanent keepsake and a Memory Movie.' }, { q: 'Does it work for remote teams?', a: 'Yes. Everyone contributes from one link regardless of location, so remote and hybrid team members are included automatically.' }, { q: 'What employee occasions does it support?', a: 'Birthdays, farewells, retirements, work anniversaries and promotions — any moment worth celebrating as a team.' }, { q: 'Can HR automate this?', a: 'Yes. Thankeeu team plans integrate with SeamlessHR, BambooHR, Zoho People and WorkPay to automate birthday and anniversary cards with memory walls enabled.' }, ]), ], }); return ( <>
<Navbar />
<section className="relative overflow-hidden bg-gradient-to-br from-[#0d0020] to-[#2d1052] text-white pt-24 pb-20 px-4 text-center">
<div className="max-w-3xl mx-auto">
<h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight mb-6">Celebrate Employees With More Than Just Messages </h1>
<p className="text-lg text-white/70 mb-10">Capture photos, videos and memories from the entire team. The employee receives a permanent memory wall of every moment the team has shared — and a cinematic Memory Movie™ they keep forever. </p>
<div className="flex flex-wrap gap-4 justify-center">
<Link to="/card/new" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-purple-600 font-bold text-lg shadow-xl transition-all hover:scale-105">Create Employee Memory Wall → </Link>
<Link to="/company/signup" className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold border border-white/20 transition-all">For HR Teams → </Link>
</div>
</div>
</section>
<section className="py-16 px-4 bg-white">
<div className="max-w-3xl mx-auto">
<h2 className="text-2xl font-bold text-warm-900 text-center mb-8">Works for every employee celebration</h2>
<div className="grid sm:grid-cols-2 gap-5"> {[ { emoji:'', title:'Birthday', desc:'The whole team signs the card, uploads photos from past work events, and the employee gets a Memory Wall of their working life with you.' }, { emoji:'', title:'Farewell / Leaving', desc:'A permanent record of the team\'s appreciation. Messages, memories and photos from every colleague — including remote workers.' }, { emoji:'', title:'Work Anniversary', desc:'Mark milestones with a living memory wall of photos from across the career. More meaningful than a LinkedIn notification.' }, { emoji:'', title:'Promotion', desc:'Celebrate achievements with a card from every colleague and a photo wall of the journey that led there.' }, ].map(({emoji,title,desc}) => ( <div key={title} className="p-6 rounded-2xl bg-purple-50 border border-purple-100">
{emoji && <span className="text-3xl mb-2 block">{emoji}</span>}
<h3 className="font-bold text-warm-900 mb-1">{title}</h3>
<p className="text-sm text-warm-500">{desc}</p>
</div> ))} </div>
</div>
</section>
<section className="py-12 px-4 bg-white">
<div className="max-w-3xl mx-auto">
<div className="rounded-2xl border-2 border-purple-100 p-6 sm:p-8 bg-gradient-to-br from-purple-50 to-white">
<div className="flex flex-col sm:flex-row items-start gap-5">
<div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
<Icon name="QrCode" size={28} className="text-primary-600"/>
</div>
<div>
<h3 className="font-extrabold text-warm-900 text-lg mb-2">QR code generated automatically for every team event</h3>
<p className="text-warm-500 text-sm leading-relaxed mb-4">
Enable the Live Memory Wall for team birthdays, farewells and corporate occasions — Thankeeu generates a unique QR code instantly. Display it on the office screen or print on table cards. Employees scan from any phone — no app, no account, no friction.
</p>
<div className="flex flex-wrap gap-2">
{['Download PNG', 'Print ready', 'Display on screen', 'Share on Slack or WhatsApp'].map(label => (
<span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary-200 text-xs font-semibold text-warm-700 bg-white">
<Icon name="Check" size={12} className="text-primary-500" strokeWidth={3}/>
{label}
</span>
))}
</div>
</div>
</div>
</div>
</div>
</section>

<Footer />
</> );
}
