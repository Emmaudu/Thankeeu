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
        Free for small groups. What about everyone else?
      </h2>
      <p style={{color:'#6B7280',fontSize:14,lineHeight:1.65,marginBottom:20}}>
        SendWishOnline charges per contributor once your group grows. Thankeeu keeps it simple — one flat price per card, any group size.
      </p>
      <div style={{background:'#F5F0FF',borderRadius:14,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white"><Icon name="Sparkles" size={20} className="text-primary-500"/></span>
        <div>
          <p style={{fontWeight:800,fontSize:13,color:'#1A1035',margin:0}}>Free to create</p>
          <p style={{fontSize:12,color:'#7A6CA8',margin:'2px 0 0'}}>From $3.15 to send · Any group size, one price</p>
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
  { feature: 'One flat price, any group size', other: false },
  { feature: 'No signer limit', other: false },
  { feature: 'Voice notes on every plan', other: false },
  { feature: 'Gift collection built in', other: false },
  { feature: 'Auto-generated Memory Movie', other: false },
  { feature: 'No account needed to sign', other: true },
  { feature: 'Scheduled delivery', other: true },
];

const FAQS = [
  { q: 'Does Thankeeu charge more for larger groups?', a: 'No. Thankeeu charges one flat price per card, regardless of how many people sign it. A card with 5 signers and a card with 500 signers cost the same.' },
  { q: 'Is there really no limit on how many people can sign?', a: 'Correct — there is no signer limit on any Thankeeu plan. Invite as many people as you want to contribute to the card.' },
  { q: 'Are voice notes included on every plan?', a: 'Yes. Voice note messages, photo uploads and GIFs are included on every Thankeeu card, not locked behind a higher tier.' },
  { q: 'Can we collect a group gift as well as messages?', a: 'Yes. Enable gift collection when creating the card and your group can contribute toward a present in the same link, in their own currency.' },
  { q: 'How much does Thankeeu cost?', a: 'Creating the card and collecting messages is free. A small one-time fee applies when you send the finished card, from $3.15 USD — the same price no matter your group size.' },
];

export default function SendWishOnlineAlternative() {
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
    title: 'SendWishOnline Alternative — One Flat Price, Any Group Size | Thankeeu',
    description: 'Looking for a SendWishOnline alternative? Thankeeu charges one flat price per card no matter how many people sign — plus voice notes, a gift pot, and an auto-generated Memory Movie included.',
    keywords: 'sendwishonline alternative, sendwishonline vs thankeeu, better than sendwishonline, group card pricing per contributor, group ecard flat price',
    canonical: '/sendwishonline-alternative',
    ogImage: 'https://www.thankeeu.com/og-leaving-card.jpg',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.webPage('SendWishOnline Alternative', 'A flat-price alternative to SendWishOnline for group cards of any size.', '/sendwishonline-alternative'),
      SCHEMAS.faqPage(FAQS),
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'SendWishOnline Alternative', url: '/sendwishonline-alternative' }]),
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
              SendWishOnline Alternative — Flat Pricing, Any Group Size
            </p>
            <h1 className="font-extrabold text-white leading-none mb-5"
              style={{ fontSize: 'clamp(2.4rem,7vw,4.5rem)', letterSpacing: '-0.03em' }}>
              One flat price.<br />
              <span style={{ color: '#FDE68A' }}>However many people sign.</span>
            </h1>
            <p className="text-lg sm:text-xl max-w-xl mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)' }}>
              Some group card tools charge per contributor, so the price climbs as your group grows. Thankeeu charges one flat price per card, whether five people sign or five hundred — plus voice notes and a gift pot that many alternatives leave out entirely.
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
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>One price, any group size</span>
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
              <Icon name="AlertCircle" size={13}/>Where per-contributor pricing gets expensive
            </div>
            <h2 className="font-extrabold text-warm-900 leading-tight"
              style={{ fontSize: 'clamp(1.85rem,5vw,2.75rem)' }}>
              The bigger your group, the more some tools charge
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: 'TrendingUp', title: 'Price scales with signers', desc: 'Some group card tools charge per contributor — a 50-person office card costs noticeably more than a 5-person one, even though the product is identical.' },
              { icon: 'Ban', title: 'No permanent free option for larger groups', desc: 'Small cards may be free, but once your group crosses a certain size, you are pushed onto a paid plan regardless of how simple the card is.' },
              { icon: 'Mic', title: 'Text-only in some tiers', desc: 'Voice notes and richer media are often locked behind higher tiers, even though a recorded message is one of the most meaningful things a signer can leave.' },
              { icon: 'Wallet', title: 'No built-in gift collection', desc: 'Wanting to also collect a group gift usually means a separate tool entirely — more links, more steps for your group to follow.' },
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
              What one flat price gets you with Thankeeu
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
            Thankeeu vs SendWishOnline
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50">
                  <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">SendWishOnline</th>
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
            No per-signer pricing, ever
          </p>
          <h2 className="font-extrabold text-white leading-tight mb-4" style={{ fontSize: 'clamp(2rem,6vw,3.5rem)' }}>
            One price.<br />
            <span style={{ color: '#FDE68A' }}>Whatever the size of your group.</span>
          </h2>
          <p className="mb-10 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No signer limit · Voice notes included · Gift collection included
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
