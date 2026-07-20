import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { CurrencyToggle } from '../utils/currencyUI';
import { convertFromNGN, getCurrency } from '../utils/currency';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

const ExitIntentModal = ({ onClose }) => (
  <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(15,5,30,0.82)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
    onClick={onClose}>
    <div style={{background:'#fff',borderRadius:24,maxWidth:460,width:'100%',padding:'36px 32px',boxShadow:'0 32px 80px rgba(0,0,0,0.35)',position:'relative'}}
      onClick={e=>e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="Close"
        style={{position:'absolute',top:14,right:16,background:'none',border:'none',cursor:'pointer',lineHeight:1,padding:4}}>
        <Icon name="X" size={18} className="text-warm-400"/>
      </button>
      <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'#7C3AED',marginBottom:8}}>Wait — one second</p>
      <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,color:'#1A1035',marginBottom:10,lineHeight:1.25}}>
        More than signatures. A card they actually keep.
      </h2>
      <p style={{color:'#6B7280',fontSize:14,lineHeight:1.65,marginBottom:20}}>
        GroupGreeting collects signatures well. Thankeeu adds voice notes, a gift pot, and an automatic Memory Movie — the parts that make a card unforgettable.
      </p>
      <div style={{background:'#F5F0FF',borderRadius:14,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white"><Icon name="Sparkles" size={20} className="text-primary-500"/></span>
        <div>
          <p style={{fontWeight:800,fontSize:13,color:'#1A1035',margin:0}}>Free to create</p>
          <p style={{fontSize:12,color:'#7A6CA8',margin:'2px 0 0'}}>From $3.15 to send · Voice notes & gift pot included</p>
        </div>
      </div>
      <Link to="/card/new" onClick={onClose}
        style={{display:'block',textAlign:'center',background:'linear-gradient(135deg,#7C3AED,#5B21B6)',color:'#fff',borderRadius:14,padding:'13px 20px',fontWeight:800,fontSize:15,textDecoration:'none',boxShadow:'0 8px 24px rgba(124,58,237,0.35)'}}>
        Create your card — free →
      </Link>
      <p style={{textAlign:'center',fontSize:11,color:'#D1D5DB',marginTop:12}}>No account needed · Takes 2 minutes</p>
    </div>
  </div>
);

const COMPARISON_ROWS = [
  { feature: 'Voice note messages', other: false },
  { feature: 'Gift collection built in (multi-currency)', other: false },
  { feature: 'Auto-generated Memory Movie', other: false },
  { feature: 'Live Memory Wall for events', other: false },
  { feature: 'Group signing from one link', other: true },
  { feature: 'No account needed to sign', other: true },
  { feature: 'Scheduled delivery', other: true },
];

const FAQS = [
  { q: 'What does Thankeeu offer that GroupGreeting does not?', a: 'Three main things: recorded voice note messages on every card, a built-in gift pot that works in multiple currencies, and an automatic Memory Movie that compiles every message, photo and voice note into a keepsake video the recipient watches and keeps.' },
  { q: 'Is switching from GroupGreeting difficult?', a: 'No. The core flow is the same - create a card, share one link, everyone signs without an account. The difference is what your signers can add and what the recipient receives at the end.' },
  { q: 'Do signers need an account?', a: 'No. Anyone with the link signs immediately from any device - no sign-up, no password, no app download.' },
  { q: 'Can global teams contribute to the gift in their own currency?', a: 'Yes. Gift contributions work across multiple currencies including NGN, GBP, USD and CAD, so a team spread across countries contributes without conversion friction.' },
  { q: 'How much does Thankeeu cost?', a: 'Creating the card and collecting messages is free. A small one-time fee applies when you send, from $3.15 USD, with no per-signer charges.' },
];

export default function GroupGreetingAlternative() {
  const [showExit, setShowExit] = useState(false);
  const exitFiredRef = useRef(false);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (exitFiredRef.current) return;
      if (e.clientY < 40) { exitFiredRef.current = true; setShowExit(true); }
    };
    if (window.innerWidth >= 768) document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);

  useSEO({
    title: 'GroupGreeting Alternative — Voice Notes, Gift Pot & Memory Movie | Thankeeu',
    description: 'Looking for a GroupGreeting alternative? Thankeeu adds what GroupGreeting leaves out — voice note messages, a built-in gift pot in any currency, and an automatic Memory Movie keepsake.',
    keywords: 'groupgreeting alternative, groupgreeting vs thankeeu, better than groupgreeting, group greeting card alternative, office card platform',
    canonical: '/groupgreeting-alternative',
    ogImage: 'https://www.thankeeu.com/og-leaving-card.jpg',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.webPage('GroupGreeting Alternative', 'A richer alternative to GroupGreeting with voice notes, gift collection and Memory Movies.', '/groupgreeting-alternative'),
      SCHEMAS.faqPage(FAQS),
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'GroupGreeting Alternative', url: '/groupgreeting-alternative' }]),
    ],
  });

  return (
    <>
      {showExit && <ExitIntentModal onClose={() => setShowExit(false)} />}
      <Navbar />

      <section className="relative overflow-hidden px-4"
        style={{
          minHeight: 'min(760px,82vh)',
          backgroundImage: 'linear-gradient(90deg,rgba(24,10,38,0.97) 0%,rgba(54,27,65,0.88) 38%,rgba(59,28,66,0.27) 69%,rgba(20,8,30,0.06) 100%),url(/images/heroes/leaving-hero.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
        <div className="max-w-6xl mx-auto flex items-center py-16 sm:py-24" style={{ minHeight: 'min(760px,82vh)' }}>
          <div className="text-left max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              GroupGreeting Alternative — The Richer Group Card
            </p>
            <h1 className="font-extrabold text-white leading-none mb-5"
              style={{ fontSize: 'clamp(2.4rem,7vw,4.5rem)', letterSpacing: '-0.03em' }}>
              Signatures are the start.<br />
              <span style={{ color: '#FDE68A' }}>Not the whole card.</span>
            </h1>
            <p className="text-lg sm:text-xl max-w-xl mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)' }}>
              GroupGreeting does the basics of group signing competently — but a card is more than a stack of typed messages. Thankeeu adds recorded voice notes, a gift pot in any currency, and an automatic Memory Movie compiled from every contribution, so the finished card is a keepsake, not a document.
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-1.5 text-sm font-bold text-white">
                <Icon name="Check" size={14} className="text-emerald-300"/>Free to create
              </span>
              <span className="text-white/40 text-sm hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-4 py-1.5 text-sm font-bold text-emerald-200">
                <Icon name="Tag" size={13}/>From $3.15 to send
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-7">
              <Link to="/card/new"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg,#FDE68A,#F9A8D4)', color: '#2D1638', boxShadow: '0 12px 35px rgba(249,168,212,0.28)' }}>
                <Icon name="Sparkles" size={17} />
                Create Your Card — Free
              </Link>
              <a href="#comparison"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-base border border-white/30 hover:bg-white/10 transition-all">
                <Icon name="Eye" size={16}/>See the comparison
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>Voice notes on every card</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>No account for signers</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>Gift collection included</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-4 border-b border-purple-50" style={{ background: '#fff' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
            {[
              { stat: '50,000+', label: 'Messages posted',     icon: 'MessageSquare' },
              { stat: '10,000+', label: 'Happy customers',     icon: 'Users' },
              { stat: '$150K+',  label: 'Gifts issued globally', icon: 'Gift' },
            ].map(({ stat, label, icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon name={icon} size={18} className="text-primary-400 mb-1" />
                <p className="text-2xl sm:text-3xl font-extrabold text-warm-900">{stat}</p>
                <p className="text-xs sm:text-sm text-warm-400 font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
              <Icon name="AlertCircle" size={13}/>What basic signature collection leaves out
            </div>
            <h2 className="font-extrabold text-warm-900 leading-tight"
              style={{ fontSize: 'clamp(1.85rem,5vw,2.75rem)' }}>
              A stack of typed messages is not the same as a keepsake
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: 'Mic', title: 'No voice messages', desc: 'A typed line is easy to skim. A recorded goodbye in a colleague\'s actual voice is what gets replayed years later - and basic signing platforms leave it out entirely.' },
              { icon: 'Wallet', title: 'Gift collection is an afterthought', desc: 'If the team also wants to chip in for a present, that means a separate collection tool, another link, and someone tracking a spreadsheet.' },
              { icon: 'Film', title: 'The finished card is static', desc: 'Once signed, the card is just a page of messages. No compilation, no keepsake video, nothing the recipient will actually revisit.' },
              { icon: 'Globe2', title: 'Limited currency support', desc: 'Global teams with members in Nigeria, the UK and the US need gift contributions to work in local currencies - not one currency with conversion friction.' },
            ].map(item => (
              <div key={item.title} className="rounded-2xl bg-purple-50 border border-purple-100 p-6">
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-white"><Icon name={item.icon} size={18} className="text-primary-600" /></div>
                <h3 className="font-bold text-warm-900 mb-1.5">{item.title}</h3>
                <p className="text-warm-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4" style={{ background: '#F5F0FF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-extrabold text-warm-900 leading-tight" style={{ fontSize: 'clamp(1.7rem,4.5vw,2.5rem)' }}>
              What Thankeeu includes as standard
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: 'Link', title: 'One link, automatic signing', desc: 'Share a single link. Everyone who opens it can add their message immediately — no account, no editing access to request.' },
              { icon: 'Palette', title: '100+ ready-made designs', desc: 'Every design is already professionally laid out. Pick one and it looks finished from the first signature.' },
              { icon: 'Mic', title: 'Voice notes included', desc: 'Signers can leave a recorded voice message alongside text — something Canva cannot do at all.' },
              { icon: 'Gift', title: 'Gift pot built in', desc: 'Enable gift collection and your group contributes toward a present in the same link, no separate tool needed.' },
              { icon: 'Film', title: 'Automatic Memory Movie', desc: 'Every message, photo and voice note is compiled into a short video the recipient keeps — no manual editing.' },
              { icon: 'CalendarClock', title: 'Scheduled delivery', desc: 'Set the exact date and time the card should arrive, so it lands at the right moment automatically.' },
            ].map(f => (
              <div key={f.title} className="rounded-2xl bg-white border-2 border-purple-100 p-6 hover:border-primary-300 hover:shadow-lg transition-all">
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: '#EDE9FE' }}>
                  <Icon name={f.icon} size={18} className="text-primary-600" />
                </div>
                <h3 className="font-bold text-warm-900 mb-1.5">{f.title}</h3>
                <p className="text-warm-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="comparison" className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-extrabold text-warm-900 text-center mb-10 leading-tight" style={{ fontSize: 'clamp(1.7rem,4.5vw,2.4rem)' }}>
            Thankeeu vs GroupGreeting
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50">
                  <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">GroupGreeting</th>
                  <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {COMPARISON_ROWS.map(({ feature, canva }) => (
                  <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 text-sm text-warm-700">{feature}</td>
                    <td className="p-4 text-center">
                      {other
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={13} className="text-green-600" strokeWidth={3}/></span>
                        : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={13} className="text-red-400" strokeWidth={3}/></span>}
                    </td>
                    <td className="p-4 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={13} className="text-green-600" strokeWidth={3}/></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-warm-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="rounded-2xl border border-purple-100 bg-white">
                <summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between">
                  {q}<Icon name="ChevronDown" size={16} className="text-warm-400 flex-shrink-0 ml-3"/>
                </summary>
                <p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 px-4 bg-purple-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-base font-bold text-warm-700 mb-5">Related pages</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { to: '/group-ecard', label: 'Group eCard' },
              { to: '/ecards', label: 'eCards' },
              { to: '/thankeeu-vs-thankbox', label: 'Thankeeu vs Thankbox' },
              { to: '/pricing', label: 'Pricing' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="text-xs font-semibold text-primary-600 bg-white border border-primary-200 px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center"
        style={{
          backgroundImage: 'linear-gradient(90deg,rgba(24,10,38,0.97) 0%,rgba(54,27,65,0.92) 55%,rgba(59,28,66,0.88) 100%),url(/images/heroes/leaving-hero.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
            The card they will actually keep
          </p>
          <h2 className="font-extrabold text-white leading-tight mb-4" style={{ fontSize: 'clamp(2rem,6vw,3.5rem)' }}>
            Give them more than signatures.<br />
            <span style={{ color: '#FDE68A' }}>Give them a keepsake.</span>
          </h2>
          <p className="mb-10 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Voice notes · Gift pot · Memory Movie included
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/card/new"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#FDE68A,#F9A8D4)', color: '#2D1638', boxShadow: '0 12px 35px rgba(249,168,212,0.28)' }}>
              <Icon name="Sparkles" size={18}/>Create Your Card — Free
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base border border-white/30 hover:bg-white/10 transition-all">
              <Icon name="Tag" size={16}/>See pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
