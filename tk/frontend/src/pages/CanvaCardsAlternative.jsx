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
        No design skills? No Canva account needed.
      </h2>
      <p style={{color:'#6B7280',fontSize:14,lineHeight:1.65,marginBottom:20}}>
        Thankeeu collects signatures automatically — no manual sharing, no design work, no Canva account required for your group.
      </p>
      <div style={{background:'#F5F0FF',borderRadius:14,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white"><Icon name="Sparkles" size={20} className="text-primary-500"/></span>
        <div>
          <p style={{fontWeight:800,fontSize:13,color:'#1A1035',margin:0}}>Free to create</p>
          <p style={{fontSize:12,color:'#7A6CA8',margin:'2px 0 0'}}>From $3.15 to send · No design skills needed</p>
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
  { feature: 'Everyone can sign without an account', canva: false },
  { feature: 'Automated signature collection (one link)', canva: false },
  { feature: 'Works without any design skill', canva: false },
  { feature: 'Voice note messages', canva: false },
  { feature: 'Gift collection built in', canva: false },
  { feature: 'Auto-generated video montage', canva: false },
  { feature: 'Scheduled delivery', canva: false },
];

const FAQS = [
  { q: 'Is Canva good for making group cards?', a: 'Canva is a design tool, not a group card platform. You can design a beautiful card in Canva, but there is no automated way for a group to sign it — everyone needs a Canva account and editing access, and someone has to manually track who has added their message. Thankeeu automates the entire signing process with one link.' },
  { q: 'Do signers need a Canva account to use Thankeeu instead?', a: 'No. Nobody needs any account at all. Signers open the link, add their message, photo or voice note, and submit — done in under a minute, on any device.' },
  { q: 'Can I still get a professionally designed card without using Canva?', a: 'Yes. Thankeeu includes over 100 premium card designs across every occasion, so you get the same design quality without needing any design skill or a separate tool.' },
  { q: 'What about collecting a gift alongside the card?', a: 'Canva has no built-in gift collection. Thankeeu lets you enable a gift pot so your group can contribute money toward a present in the same link they sign the card, in their own currency.' },
  { q: 'How much does it cost?', a: 'Creating the card and collecting messages is free. A small one-time fee applies when you send the finished card, starting from $3.15 USD.' },
];

export default function CanvaCardsAlternative() {
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
    title: 'Canva Cards Alternative — Automatic Signing, No Design Skills | Thankeeu',
    description: 'Looking for a Canva group card alternative? Thankeeu automatically collects signatures from one link — no Canva account needed for signers, no manual design work, voice notes and a gift pot included.',
    keywords: 'canva cards alternative, canva group card alternative, canva ecard alternative, better than canva for cards, canva group greeting card alternative',
    canonical: '/canva-cards-alternative',
    ogImage: 'https://www.thankeeu.com/og-leaving-card.jpg',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.webPage('Canva Cards Alternative', 'An automated alternative to designing group cards in Canva.', '/canva-cards-alternative'),
      SCHEMAS.faqPage(FAQS),
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Canva Cards Alternative', url: '/canva-cards-alternative' }]),
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
              Canva Group Cards — The Automated Alternative
            </p>
            <h1 className="font-extrabold text-white leading-none mb-5"
              style={{ fontSize: 'clamp(2.4rem,7vw,4.5rem)', letterSpacing: '-0.03em' }}>
              Canva is a design tool.<br />
              <span style={{ color: '#FDE68A' }}>Thankeeu is a group card platform.</span>
            </h1>
            <p className="text-lg sm:text-xl max-w-xl mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)' }}>
              Designing a card in Canva is easy. Getting a whole group to sign it is not — everyone needs a Canva account, and there is no automated way to track who has added their message. Thankeeu does both: a beautiful design, and one link that automatically collects everyone's signature.
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
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>No design skills needed</span>
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
              <Icon name="AlertCircle" size={13}/>The real problem with Canva for group cards
            </div>
            <h2 className="font-extrabold text-warm-900 leading-tight"
              style={{ fontSize: 'clamp(1.85rem,5vw,2.75rem)' }}>
              Canva was built for one designer, not a group of signers
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: 'UserX', title: 'Everyone needs a Canva account', desc: 'To add their message, each signer must create a free Canva account and be granted editing access to the design — a real barrier for a coworker who just wants to say a quick goodbye.' },
              { icon: 'ListChecks', title: 'No automated tracking', desc: 'There is no way to see who has and has not signed. The organiser has to manually chase people or check the design themselves.' },
              { icon: 'PenTool', title: 'Requires design skill to look good', desc: 'A card that looks professional in Canva takes real design effort. Get it wrong and messages overlap, look cluttered, or need constant repositioning.' },
              { icon: 'Wallet', title: 'No gift collection', desc: 'If the group also wants to chip in for a gift, that means a completely separate tool or payment link — more friction, more steps.' },
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
              What Thankeeu does differently
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
            Thankeeu vs Canva for group cards
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50">
                  <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">Canva</th>
                  <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {COMPARISON_ROWS.map(({ feature, canva }) => (
                  <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 text-sm text-warm-700">{feature}</td>
                    <td className="p-4 text-center">
                      {canva
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
            No design skills required
          </p>
          <h2 className="font-extrabold text-white leading-tight mb-4" style={{ fontSize: 'clamp(2rem,6vw,3.5rem)' }}>
            Skip the Canva account.<br />
            <span style={{ color: '#FDE68A' }}>Just share one link.</span>
          </h2>
          <p className="mb-10 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No account needed for signers · Voice notes included · Gift collection included
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
