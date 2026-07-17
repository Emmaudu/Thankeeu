import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Icon from '../../components/ui/Icon';
import PriorityDesignGallery from '../../components/PriorityDesignGallery';
import { useSEO, SCHEMAS } from '../../hooks/useSEO';
import { OCCASIONS } from './occasionsData';
import { RETIREMENT_PRIORITY_DESIGNS } from '../../utils/priorityCardDesigns';

const BENEFITS = [
  ['Book', 'A career in one keepsake', 'Collect the stories, lessons and moments that deserve more space than a paper card allows.'],
  ['Users', 'Nobody gets left out', 'One private link lets past and present colleagues contribute from any location, on any device.'],
  ['Mic', 'More than typed messages', 'Add photos, GIFs, videos and voice notes so the finished card feels unmistakably personal.'],
  ['Gift', 'The group gift is handled', 'Let colleagues contribute while they sign — one thoughtful collection without awkward follow-ups.'],
];

const STEPS = [
  ['1', 'Create their card', 'Choose a retirement design, add their name and pick the reveal date.'],
  ['2', 'Share one link', 'Send it privately by WhatsApp, Slack, Teams or email. No account is needed to sign.'],
  ['3', 'Everyone adds a memory', 'Colleagues write, upload and record at a time that suits them.'],
  ['4', 'Deliver the full story', 'Reveal a page-by-page keepsake they can revisit throughout their next chapter.'],
];

export default function RetirementLanding() {
  const data = OCCASIONS.retirement;
  useSEO({
    title: data.title,
    description: data.desc,
    keywords: data.keywords,
    canonical: data.path,
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name:'Home', url:'/' }, { name:'Retirement cards', url:data.path }]),
      SCHEMAS.webPage(data.title, data.desc, data.path),
      SCHEMAS.faqPage((data.faqs || []).map(([q, a]) => ({ q, a }))),
    ],
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="relative overflow-hidden" style={{minHeight:'min(760px,82vh)',backgroundImage:'linear-gradient(90deg,rgba(15,14,39,0.98) 0%,rgba(38,22,61,0.9) 39%,rgba(38,22,61,0.25) 70%,rgba(20,12,30,0.05) 100%),url(/images/heroes/retirement-hero.jpg)',backgroundSize:'cover',backgroundPosition:'center'}}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 flex items-center" style={{minHeight:'min(760px,82vh)'}}>
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white mb-6" style={{background:'rgba(255,255,255,0.13)',border:'1px solid rgba(255,255,255,0.22)',backdropFilter:'blur(10px)'}}><Icon name="Star" size={15} />Retirement cards made together</div>
            <h1 className="font-extrabold text-white leading-[0.96] mb-6" style={{fontSize:'clamp(2.8rem,7vw,5.25rem)',letterSpacing:'-0.045em'}}>Celebrate the career.<br/><span style={{color:'#FDE68A'}}>Keep every story.</span></h1>
            <p className="text-lg sm:text-xl max-w-xl mb-8 leading-relaxed" style={{color:'rgba(255,255,255,0.84)'}}>Turn years of shared moments into one lasting retirement keepsake — messages, photos, voice notes and a thoughtful group gift, all from one link.</p>
            <div className="flex flex-wrap gap-3 mb-7">
              <Link to="/card/new?occasion=retirement" className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-extrabold text-warm-900 transition-all hover:-translate-y-0.5" style={{background:'linear-gradient(135deg,#FDE68A,#F9A8D4)',boxShadow:'0 12px 35px rgba(253,230,138,0.22)'}}><Icon name="Sparkles" size={18}/>Create retirement card — free</Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-white border border-white/30 hover:bg-white/10 transition-all">See how it works <Icon name="ArrowDown" size={16} /></a>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold" style={{color:'rgba(255,255,255,0.8)'}}>{['Free to create','No account to sign','Unlimited contributors','Scheduled reveal'].map(item=><span key={item} className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>{item}</span>)}</div>
          </div>
        </div>
      </section>

      <PriorityDesignGallery
        designs={RETIREMENT_PRIORITY_DESIGNS}
        occasion="retirement"
        eyebrow="20 new retirement covers"
        title="Choose a cover that honours the whole journey"
        description="Browse ten premium A4 designs at a time, then personalise the retirement album with the stories, photos and voices that made the career memorable."
        background="#ffffff"
      />

      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12"><p className="text-sm font-extrabold uppercase tracking-[.18em] text-primary-600 mb-3">A send-off worthy of the journey</p><h2 className="text-3xl sm:text-5xl font-extrabold text-warm-900 leading-tight">Not just congratulations.<br/>A record of what they meant.</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{BENEFITS.map(([icon,title,body])=><div key={title} className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm"><div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5"><Icon name={icon} size={22}/></div><h3 className="font-extrabold text-warm-900 mb-2">{title}</h3><p className="text-sm text-warm-600 leading-relaxed">{body}</p></div>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 sm:py-20 px-4" style={{background:'#F7F3FF'}}>
        <div className="max-w-5xl mx-auto"><div className="text-center mb-12"><h2 className="text-3xl sm:text-4xl font-extrabold text-warm-900 mb-3">From “we should do something” to done</h2><p className="text-warm-600">Set it up in minutes. Let the people who know them best fill in the rest.</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{STEPS.map(([n,title,body])=><div key={n} className="bg-white rounded-3xl p-6"><span className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-extrabold mb-5">{n}</span><h3 className="font-extrabold text-warm-900 mb-2">{title}</h3><p className="text-sm text-warm-600 leading-relaxed">{body}</p></div>)}</div></div>
      </section>

      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto"><div className="text-center mb-10"><h2 className="text-3xl sm:text-4xl font-extrabold text-warm-900 mb-3">Retirement card questions</h2><p className="text-warm-600">Everything you need before you start.</p></div><div className="space-y-4">{(data.faqs || []).map(([q,a])=><details key={q} className="rounded-2xl border border-warm-100 bg-white p-6 shadow-sm"><summary className="font-bold text-warm-900 cursor-pointer">{q}</summary><p className="text-sm text-warm-600 leading-relaxed mt-4">{a}</p></details>)}</div></div>
      </section>

      <section className="px-4 pb-20"><div className="max-w-5xl mx-auto rounded-[2rem] px-6 py-14 sm:p-16 text-center text-white" style={{background:'linear-gradient(135deg,#2E174B,#7C3AED)'}}><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-amber-200"><Icon name="Star" size={27} /></div><h2 className="text-3xl sm:text-5xl font-extrabold mb-4">Give their next chapter<br/>the perfect first page.</h2><p className="text-purple-100 mb-8">Free to create. Easy for everyone to sign. Meaningful for years.</p><Link to="/card/new?occasion=retirement" className="inline-flex items-center gap-2 bg-white text-primary-700 font-extrabold px-8 py-4 rounded-2xl hover:-translate-y-0.5 transition-transform">Create retirement card <Icon name="ArrowRight" size={17} /></Link></div></section>
      <Footer />
    </div>
  );
}
