import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { RotatingPrice, CurrencyToggle } from '../utils/currencyUI';
import { convertFromNGN, getCurrency } from '../utils/currency';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import PriorityDesignGallery from '../components/PriorityDesignGallery';
import { LEAVING_CARD_DESIGNS, createLeavingCardUrl } from '../utils/leavingCardDesigns';
import { FAREWELL_PRIORITY_DESIGNS } from '../utils/priorityCardDesigns';

/* ─── Comparison table data ──────────────────────────────────────────── */
const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={13} className="text-green-600" strokeWidth={3}/></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={13} className="text-red-400" strokeWidth={3}/></span>;
const PAID  = <span className="text-xs text-warm-400 font-medium">Paid plan</span>;

const COMPARISON_ROWS = [
  { feature: 'Group leaving card (everyone signs)',   thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'No account needed to sign',             thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'Photo, video & GIF messages',           thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'Voice note messages',                   thankbox: CHECK, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Pooled leaving gift collection',        thankbox: CHECK, kudoboard: PAID,    thankeeu: CHECK },
  { feature: 'Scheduled delivery (exact time)',       thankbox: CHECK, kudoboard: CHECK,   thankeeu: CHECK },
  { feature: 'GBP payments',                         thankbox: CHECK, kudoboard: PAID,    thankeeu: CHECK },
  { feature: 'NGN / African currency payments',       thankbox: CROSS, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Memory Movie™ (auto-generated MP4)',   thankbox: CROSS, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Live Photo Wall via QR code',           thankbox: CROSS, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'HRIS sync (SeamlessHR, BambooHR)',      thankbox: CROSS, kudoboard: CROSS,   thankeeu: CHECK },
  { feature: 'Free to create & collect messages',     thankbox: PAID,  kudoboard: PAID,    thankeeu: CHECK },
  { feature: 'Affordable for small teams',            thankbox: PAID,  kudoboard: CROSS,   thankeeu: CHECK },
];

/* ─── Pricing component ──────────────────────────────────────────────── */
const PLANS = [
  {
    name: 'Classic', priceNGN: 5000, credits: 1, popular: false,
    label: 'One perfect farewell card',
    features: ['Send 1 group card', 'Unlimited signers', '100+ premium designs', 'Voice, photo & video messages', 'Gift collection included', 'Scheduled delivery', 'Memory Movie™ included', 'Credits never expire'],
    btn: 'Send this leaving card', btnStyle: 'border-2 border-purple-200 text-primary-600 hover:bg-primary-50',
  },
  {
    name: 'Standard', priceNGN: 9000, credits: 2, popular: true,
    label: 'Two cards — save on the second',
    features: ['Send 2 group cards', 'Unlimited signers', '100+ premium designs', 'Voice, photo & video messages', 'Gift collection included', 'Scheduled delivery', 'Memory Movie™ included', 'Credits never expire'],
    btn: 'Get 2 credits', btnStyle: 'bg-primary-500 text-white hover:bg-primary-600',
  },
  {
    name: 'Pack of 5', priceNGN: 20000, credits: 5, popular: false,
    label: '5 cards — best per-card price',
    features: ['Send 5 group cards', 'Unlimited signers', '100+ premium designs', 'Voice, photo & video messages', 'Gift collection included', 'Scheduled delivery', 'Memory Movie™ included', 'Credits never expire'],
    btn: 'Buy 5 credits', btnStyle: 'border-2 border-green-300 text-green-700 hover:bg-green-50',
  },
];

const PricingSection = () => {
  const [currency, setCurrency] = useState('USD');
  const curr = getCurrency(currency);
  const fmt = (ngn) => {
    const v = convertFromNGN(ngn, currency);
    return `${curr.symbol}${currency === 'NGN' ? v.toLocaleString() : v.toFixed(2)}`;
  };

  return (
    <section className="py-16 md:py-24 px-4 bg-white" id="pricing">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
            <Icon name="Tag" size={13}/>Pricing
          </div>
          <h2 className="font-extrabold text-warm-900 mb-4 leading-tight"
            style={{ fontSize: 'clamp(1.85rem,5vw,2.75rem)' }}>
            Simple, honest pricing
          </h2>
          <p className="text-warm-500 mb-6 text-base max-w-xl mx-auto">
            Free to create and collect messages. Pay once when you're ready to send. No subscription, no hidden fees.
          </p>
          <CurrencyToggle selected={currency} onChange={setCurrency} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.name}
              className={`relative rounded-3xl border-2 p-7 flex flex-col transition-all hover:shadow-xl ${plan.popular ? 'border-primary-400 shadow-lg' : 'border-purple-100'}`}
              style={{ background: plan.popular ? 'linear-gradient(160deg,#F5F0FF,#fff)' : '#fff' }}>
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-xl text-xs font-bold text-white bg-primary-500">
                  Most popular
                </div>
              )}
              <div className="mb-5">
                <p className="font-extrabold text-warm-900 text-xl mb-1">{plan.name}</p>
                <p className="text-warm-400 text-xs">{plan.label}</p>
              </div>
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-warm-900">{fmt(plan.priceNGN)}</span>
                </div>
                <p className="text-xs text-warm-400 mt-1">
                  {fmt(Math.round(plan.priceNGN / plan.credits))} per card
                  {plan.credits > 1 ? ` · ${plan.credits} credits` : ''}
                </p>
              </div>
              <ul className="space-y-2.5 mb-7 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-warm-700">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                      <Icon name="Check" size={10} className="text-green-600" strokeWidth={3}/>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/cards/leaving-card/gallery"
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-center transition-all ${plan.btnStyle}`}>
                {plan.btn}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-warm-400 mt-6">
          Credits work for any occasion — birthday, retirement, thank you, or another farewell. They never expire.
        </p>
      </div>
    </section>
  );
};

/* ─── Main page ──────────────────────────────────────────────────────── */
const LeavingDesignPreviewSection = () => (
  <PriorityDesignGallery
    designs={FAREWELL_PRIORITY_DESIGNS}
    occasion="leaving"
    eyebrow="20 new leaving-card covers"
    title="Choose a proper cover for their send-off"
    description="Browse ten premium A4 designs at a time. Select one to open it in the album studio and add the team's messages, photos, GIFs, videos and voice notes."
    background="#ffffff"
  />
);

export default function LeavingCardPage() {
  useSEO({
    title: 'Online Leaving Card — Group Farewell Cards Everyone Signs | Thankeeu',
    description: 'Create an online leaving card the whole team signs from one link. Messages, photos, GIFs and voice notes — with an optional pooled leaving gift. Scheduled delivery. Free to create.',
    keywords: 'online leaving card, group leaving card, farewell card everyone signs, leaving card for colleague, virtual leaving card, goodbye card online, leaving collection for colleague, leaving card UK, online farewell card',
    canonical: '/cards/leaving-card',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'Leaving Cards', url: '/cards/leaving-card' }]),
      SCHEMAS.webPage('Online Leaving Card', 'Create a group leaving card the whole team signs from one link.', '/cards/leaving-card'),
      SCHEMAS.faqPage([
        { q: 'How does an online leaving card work?', a: 'Create the card in under 2 minutes, share one link with colleagues, and everyone adds their message, photo, GIF or voice note. Schedule it to arrive on their last day.' },
        { q: 'Can we collect money for a leaving gift?', a: 'Yes — every card includes an optional gift collection. People chip in when they sign, and the recipient or organiser withdraws the pooled amount.' },
        { q: 'Do people need an account to sign?', a: 'No. Anyone with the link can sign instantly — no registration, no app download.' },
        { q: 'How much does an online leaving card cost?', a: 'Free to create and collect messages. A small fee applies when you send, always shown upfront.' },
      ]),
    ],
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ══ HERO — matches home exactly ══ */}
      <section className="relative overflow-hidden px-4" style={{minHeight:'min(760px,82vh)',backgroundImage:'linear-gradient(90deg,rgba(24,10,38,0.97) 0%,rgba(54,27,65,0.88) 38%,rgba(59,28,66,0.27) 69%,rgba(20,8,30,0.06) 100%),url(/images/heroes/leaving-hero.jpg)',backgroundSize:'cover',backgroundPosition:'center'}}>
        <div className="max-w-6xl mx-auto flex items-center py-16 sm:py-24" style={{minHeight:'min(760px,82vh)'}}>
          {/* eyebrow */}
          <div className="text-left max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-5"
              style={{ color: 'rgba(255,255,255,0.65)' }}>Online Leaving Cards</p>
            <h1 className="font-extrabold text-white leading-none mb-5"
              style={{ fontSize: 'clamp(2.4rem,7vw,4.5rem)', letterSpacing: '-0.03em' }}>
              Their last day deserves<br />
              <span style={{color:'#FDE68A'}}>more than a rushed goodbye.</span>
            </h1>
            <p className="text-lg sm:text-xl max-w-xl mb-7 leading-relaxed" style={{color:'rgba(255,255,255,0.84)'}}>
              Give everyone one place to share the stories, photos and voice notes that made working together matter — with an optional leaving gift built in.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-7">
              <Link to="/cards/leaving-card/gallery"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-105 hover:shadow-xl"
                style={{background:'linear-gradient(135deg,#FDE68A,#F9A8D4)',color:'#2D1638',boxShadow:'0 12px 35px rgba(249,168,212,0.28)'}}>
                <Icon name="Sparkles" size={17} />
                Create Leaving Card — Free
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-base border border-white/30 hover:bg-white/10 transition-all">
                See how it works ↓
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold" style={{color:'rgba(255,255,255,0.8)'}}>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>Free to create</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>No account to sign</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>Gift collection included</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>Works for remote teams</span>
            </div>
            <div className="hidden">
              {LEAVING_CARD_DESIGNS.slice(0, 4).map((design, index) => (
                <Link key={design.id} to={createLeavingCardUrl(design.id)}
                  className="block w-24 lg:w-32 rounded-2xl overflow-hidden shadow-lg border-4 border-white hover:-translate-y-1 hover:shadow-xl transition-all"
                  style={{ transform: `rotate(${index % 2 ? 3 : -3}deg)` }}>
                  <img src={design.image} alt={`${design.name} preview`} className="w-full aspect-[3/4] object-cover" loading="eager" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══ COMPANY LOGOS ══ */}
      <section className="py-10 px-4 overflow-hidden" style={{ background: '#FDFCFF' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-warm-300 mb-8">
            Trusted by teams at
          </p>
          <div className="overflow-hidden">
            <style>{`
              @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
              .logo-marquee { animation: marquee 18s linear infinite; }
            `}</style>
            <div className="flex items-center logo-marquee" style={{ width: 'max-content', gap: '80px' }}>
              {[0, 1].map(set => (
                <div key={set} className="flex items-center flex-shrink-0" style={{ gap: '80px' }}>
                  {[
                    { src: '/logos/huawei.png', alt: 'Huawei', w: 120 },
                    { src: '/logos/covenant.png', alt: 'Covenant University', w: 90 },
                    { src: '/logos/landmark.png', alt: 'Landmark University', w: 80 },
                    { src: '/logos/bells.png', alt: 'Bells University', w: 76 },
                  ].map(logo => (
                    <div key={logo.alt} className="flex items-center justify-center flex-shrink-0"
                      style={{ height: 60, width: logo.w }}>
                      <img src={logo.src} alt={logo.alt}
                        style={{ maxHeight: 48, width: logo.w, objectFit: 'contain', opacity: 0.55, filter: 'grayscale(100%)' }}
                        loading="lazy"
                        onError={e => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
              <Icon name="Wand" size={13}/>How it works
            </div>
            <h2 className="font-extrabold text-warm-900 leading-tight"
              style={{ fontSize: 'clamp(1.85rem,5vw,2.75rem)' }}>
              A proper farewell in four steps
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'Wand', n: '1', title: 'Create the card', desc: 'Choose "Leaving" occasion, pick a beautiful design, set their last-day delivery time. Done in 90 seconds.' },
              { icon: 'Share2', n: '2', title: 'Share one link', desc: 'Send via WhatsApp, Slack, email or text. Anyone can sign from anywhere — no account needed.' },
              { icon: 'MessageSquare', n: '3', title: 'Everyone signs', desc: 'Contributors add personal messages, photos, GIFs and voice notes. Remote colleagues included automatically.' },
              { icon: 'Send', n: '4', title: 'Deliver on their day', desc: 'Card arrives by email at the exact time you set. With a pooled gift, if you added one. A proper goodbye.' },
            ].map(step => (
              <div key={step.n} className="rounded-3xl border-2 border-purple-100 p-6 hover:border-primary-300 hover:shadow-lg transition-all bg-white">
                <div className="w-11 h-11 rounded-2xl mb-4 flex items-center justify-center"
                  style={{ background: '#EDE9FE' }}>
                  <Icon name={step.icon} size={20} className="text-primary-600" />
                </div>
                <div className="text-3xl font-extrabold text-purple-100 mb-1">{step.n}</div>
                <h3 className="font-bold text-warm-900 mb-2 text-base">{step.title}</h3>
                <p className="text-warm-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="py-14 px-4" style={{ background: '#F5F0FF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-extrabold text-warm-900 leading-tight"
              style={{ fontSize: 'clamp(1.7rem,4.5vw,2.5rem)' }}>
              Everything a great farewell needs
            </h2>
            <p className="text-warm-500 mt-3 max-w-xl mx-auto">All included in every card. No extras, no tiers, no surprises.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: 'Users', title: 'Unlimited signers', desc: 'No cap on contributors. 5 people or 500 — the whole company can sign the same card from one link.' },
              { icon: 'Camera', title: 'Photos, GIFs & voice notes', desc: 'Each signer personalises their message with photos, a GIF, or a voice recording straight from their phone.' },
              { icon: 'Gift', title: 'Pooled leaving gift', desc: 'Enable the optional collection pot. Everyone chips in when they sign — no chasing, no awkward bank transfers.' },
              { icon: 'Clock', title: 'Scheduled delivery', desc: 'Set the exact date and time. Midnight the night before. 9am on their last morning. You choose.' },
              { icon: 'Globe', title: 'Works for remote teams', desc: 'The link works from any device, anywhere. Nobody gets left out because they\'re remote or in a different office.' },
              { icon: 'Film', title: 'Memory Movie™ included', desc: 'Every card auto-generates a 1080p MP4 movie from all the messages, photos and voice notes. Free with every plan.' },
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

      {/* ══ PRICING ══ */}
      <LeavingDesignPreviewSection />

      <PricingSection />

      <div className="h-px mx-4" style={{ background: 'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ══ COMPARISON — Thankbox & Kudoboard ══ */}
      <section className="py-16 md:py-20 px-4 bg-white" id="comparison">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
              <Icon name="BarChart2" size={13}/>Comparison
            </div>
            <h2 className="font-extrabold text-warm-900 leading-tight"
              style={{ fontSize: 'clamp(1.7rem,4.5vw,2.5rem)' }}>
              Thankeeu vs Thankbox vs Kudoboard
            </h2>
            <p className="text-warm-500 mt-3 max-w-xl mx-auto text-sm">
              All three do group leaving cards. Here's what sets Thankeeu apart.
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { name: 'Thankbox', icon: 'Mail', colour: '#0ea5e9', bg: '#f0f9ff',
                line: 'UK group card platform. GBP gift collection. No voice notes, no Memory Movie, no Nigerian payments.' },
              { name: 'Kudoboard', icon: 'Award', colour: '#f59e0b', bg: '#fffbeb',
                line: 'US recognition platform. USD-only. No voice notes, no live photo wall, expensive subscription model.' },
              { name: 'Thankeeu', icon: 'Sparkles', colour: '#7C3AED', bg: '#F5F0FF',
                line: 'Full group card + Memory Movie + live photo wall + Naira/GBP/USD + HRIS sync. Built for global teams.' },
            ].map(p => (
              <div key={p.name} className="rounded-2xl p-5 border-2" style={{ background: p.bg, borderColor: p.colour + '30' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: p.colour + '18' }}>
                    <Icon name={p.icon} size={17} style={{ color: p.colour }} />
                  </div>
                  <h3 className="font-extrabold text-warm-900 text-sm">{p.name}</h3>
                  {p.name === 'Thankeeu' && (
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg text-white" style={{ background: p.colour }}>Us ✓</span>
                  )}
                </div>
                <p className="text-warm-600 text-xs leading-relaxed">{p.line}</p>
              </div>
            ))}
          </div>

          {/* Feature table */}
          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-100">
                  <th className="text-left p-4 text-sm font-bold text-warm-700 w-1/2">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">Thankbox</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">Kudoboard</th>
                  <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {COMPARISON_ROWS.map(({ feature, thankbox, kudoboard, thankeeu }) => (
                  <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 text-sm text-warm-700">{feature}</td>
                    <td className="p-4 text-center">{thankbox}</td>
                    <td className="p-4 text-center">{kudoboard}</td>
                    <td className="p-4 text-center bg-purple-50/30">{thankeeu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-xs text-warm-400 mt-4">
            Information based on publicly available feature pages. <Link to="/thankeeu-vs-thankbox" className="underline hover:text-primary-500">Full Thankbox comparison →</Link>
            {' '}· <Link to="/thankeeu-vs-kudoboard" className="underline hover:text-primary-500">Full Kudoboard comparison →</Link>
          </p>
        </div>
      </section>

      <div className="h-px mx-4" style={{ background: 'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }} />

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-14 md:py-20 px-4" style={{ background: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="mx-auto mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500">
              <Icon name="Star" size={13}/>Real stories
            </div>
            <h2 className="font-bold text-warm-900" style={{ fontSize: 'clamp(1.85rem,5.5vw,2.75rem)' }}>
              People who made<br /><span className="text-primary-500">someone's last day special</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Comfort */}
            <div className="rounded-3xl border-2 border-purple-100 overflow-hidden hover:border-primary-300 hover:shadow-xl transition-all flex flex-col" style={{ background: '#FDFCFF' }}>
              <div className="p-6 flex flex-col gap-4 flex-1 relative">
                <div className="flex justify-center mb-2">
                  <img src="/photos/comfort.png" alt="Comfort Irorere"
                    className="rounded-xl object-cover border-4 border-primary-100"
                    style={{ width: 200, height: 200, objectPosition: 'top' }}
                    loading="lazy" />
                </div>
                <span className="absolute top-3 right-5 text-7xl text-primary-100 font-serif leading-none select-none pointer-events-none">"</span>
                <div className="flex justify-center gap-0.5">
                  {[0, 1, 2, 3, 4].map(i => <Icon key={i} name="Star" size={15} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-warm-600 leading-relaxed italic flex-1 relative z-10">
                  "My best friend had her baby shower in December and I was stuck in Virginia — no way I could be there in person. I created a Thankeeu card, sent the link to 18 of our girls, and by the day of her shower, she opened it to 18 heartfelt messages, photos, and a gift pool we'd all put together. She literally called me crying."
                </p>
                <div className="flex flex-col gap-0.5 pt-4 border-t border-purple-50">
                  <a href="https://www.linkedin.com/in/comfort-uduebholo/" target="_blank" rel="noopener noreferrer"
                    className="text-sm font-bold text-warm-900 hover:text-primary-600 transition-colors flex items-center gap-1.5">
                    Comfort Irorere
                    <svg className="w-3.5 h-3.5 text-[#0A66C2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                  <p className="text-xs text-warm-400">Security Engineer · Amazon Web Services</p>
                  <p className="text-xs text-warm-400">Virginia, United States</p>
                </div>
              </div>
            </div>

            {/* Favour */}
            <div className="rounded-3xl border-2 border-purple-100 overflow-hidden hover:border-primary-300 hover:shadow-xl transition-all flex flex-col" style={{ background: '#FDFCFF' }}>
              <div className="p-6 flex flex-col gap-4 flex-1 relative">
                <div className="flex justify-center mb-2">
                  <img src="/photos/favour.jpg" alt="Favour Ibude"
                    className="rounded-xl object-cover border-4 border-primary-100"
                    style={{ width: 200, height: 200, objectPosition: 'top' }}
                    loading="lazy" />
                </div>
                <span className="absolute top-3 right-5 text-7xl text-primary-100 font-serif leading-none select-none pointer-events-none">"</span>
                <div className="flex justify-center gap-0.5">
                  {[0, 1, 2, 3, 4].map(i => <Icon key={i} name="Star" size={15} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm text-warm-600 leading-relaxed italic flex-1 relative z-10">
                  "Father's Day crept up on us and we had zero time to plan anything. I jumped on Thankeeu, created a card for my dad, and shared the link with my siblings and a few cousins. Within hours everyone had left him a message — some even added voice notes. We pooled a gift together and the card was delivered to him on the day. He called each one of us individually just to say thank you."
                </p>
                <div className="flex flex-col gap-0.5 pt-4 border-t border-purple-50">
                  <a href="https://www.linkedin.com/in/favouribude/" target="_blank" rel="noopener noreferrer"
                    className="text-sm font-bold text-warm-900 hover:text-primary-600 transition-colors flex items-center gap-1.5">
                    Favour Ibude
                    <svg className="w-3.5 h-3.5 text-[#0A66C2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                  <p className="text-xs text-warm-400">Data Scientist / MLOps Engineer · Allianz</p>
                  <p className="text-xs text-warm-400">United Kingdom</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="py-14 px-4" style={{ background: '#F5F0FF' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-warm-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {[
              { q: 'How does an online leaving card work?', a: 'Create the card in under 2 minutes, share one link with colleagues, and everyone adds their message, photo, GIF or voice note. Schedule it to arrive on their last day at the exact time you choose.' },
              { q: 'Can we collect money for a leaving gift too?', a: 'Yes — every card includes an optional gift collection. Contributors chip in when they sign, and the recipient or organiser withdraws the pooled amount directly to their bank account.' },
              { q: 'Do people need an account to sign?', a: 'No. Anyone with the link can sign instantly — no registration, no app download. They just open the link and add their message.' },
              { q: 'How much does an online leaving card cost?', a: 'Free to create and collect messages. A small fee applies when you\'re ready to send — always shown upfront before you pay. Classic (1 card) starts at $3.15 USD / ₦5,000 NGN.' },
              { q: 'Can remote colleagues sign?', a: 'Yes — the link works from any device, anywhere. Your Manchester office, the person on parental leave, and the colleague who left last year but wants to sign can all contribute from one link.' },
              { q: 'What is the Memory Movie™?', a: 'After delivery, Thankeeu automatically generates a cinematic 1080p MP4 video from all the messages, photos and voice notes on the card. The recipient gets an email when it\'s ready to watch and download.' },
            ].map(({ q, a }) => (
              <details key={q} className="rounded-2xl border border-purple-100 bg-white group">
                <summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between">
                  {q}<Icon name="ChevronDown" size={16} className="text-warm-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3" />
                </summary>
                <p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-16 px-4 text-center"
        style={{ background: 'linear-gradient(135deg,#0d0020,#2d1052)' }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
            Give them the farewell<br />they actually deserve.
          </h2>
          <p className="text-white/60 mb-8 text-base">
            Free to create. The whole team signs. Delivered at the exact moment you choose.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/card/new?occasion=farewell"
              className="px-8 py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}>
              Create Leaving Card — Free →
            </Link>
            <Link to="/how-it-works"
              className="px-8 py-4 rounded-2xl font-bold text-white/80 text-base border-2 border-white/20 hover:bg-white/10 transition-all">
              How it works
            </Link>
          </div>
          <p className="text-white/30 text-xs mt-6">No credit card required to start · Free to collect messages</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
