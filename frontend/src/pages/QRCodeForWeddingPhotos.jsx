import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { CurrencyToggle } from '../utils/currencyUI';
import { convertFromNGN, getCurrency } from '../utils/currency';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';

/* ─── Exit-intent modal ──────────────────────────────────────────────── */
const ExitIntentModal = ({ onClose }) => (
  <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(15,5,30,0.82)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
    onClick={onClose}>
    <div style={{background:'#fff',borderRadius:24,maxWidth:460,width:'100%',padding:'36px 32px',boxShadow:'0 32px 80px rgba(0,0,0,0.35)',position:'relative'}}
      onClick={e=>e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="Close"
        style={{position:'absolute',top:14,right:16,background:'none',border:'none',fontSize:20,color:'#9CA3AF',cursor:'pointer',lineHeight:1}}>✕</button>
      <p style={{fontSize:11,fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase',color:'#7C3AED',marginBottom:8}}>Wait — one second</p>
      <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,color:'#1A1035',marginBottom:10,lineHeight:1.25}}>
        Every guest's photo. One QR code.
      </h2>
      <p style={{color:'#6B7280',fontSize:14,lineHeight:1.65,marginBottom:20}}>
        Set up a Thankeeu Live Memory Wall in 2 minutes. Print the QR code on your table cards. Guests scan, upload, done — no app, no account, no delays.
      </p>
      <div style={{background:'#F5F0FF',borderRadius:14,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:28}}>📸</span>
        <div>
          <p style={{fontWeight:800,fontSize:13,color:'#1A1035',margin:0}}>Free to create</p>
          <p style={{fontSize:12,color:'#7A6CA8',margin:'2px 0 0'}}>From $3.15 to send · No subscription · Credits never expire</p>
        </div>
      </div>
      <Link to="/card/new?occasion=wedding" onClick={onClose}
        style={{display:'block',textAlign:'center',background:'linear-gradient(135deg,#7C3AED,#5B21B6)',color:'#fff',borderRadius:14,padding:'13px 20px',fontWeight:800,fontSize:15,textDecoration:'none',boxShadow:'0 8px 24px rgba(124,58,237,0.35)'}}>
        Create wedding photo wall — free →
      </Link>
      <p style={{textAlign:'center',fontSize:11,color:'#D1D5DB',marginTop:12}}>No account needed · Takes 2 minutes</p>
    </div>
  </div>
);

/* ─── Pricing section ───────────────────────────────────────────────── */
const CHECK = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={13} className="text-green-600" strokeWidth={3}/></span>;
const CROSS = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={13} className="text-red-400" strokeWidth={3}/></span>;
const PAID  = <span className="text-xs text-warm-400 font-medium">Paid plan</span>;

const COMPARISON_ROWS = [
  { feature: 'QR code for guest photo upload',        other: 'Some tools', thankeeu: CHECK },
  { feature: 'No app or account for guests',          other: CROSS,         thankeeu: CHECK },
  { feature: 'Live wall on venue screen/projector',   other: CROSS,         thankeeu: CHECK },
  { feature: 'Heartfelt written messages',            other: CROSS,         thankeeu: CHECK },
  { feature: 'Voice notes from guests',               other: CROSS,         thankeeu: CHECK },
  { feature: 'Wedding gift pot',                      other: CROSS,         thankeeu: CHECK },
  { feature: 'Auto Memory Movie™ from all uploads',   other: CROSS,         thankeeu: CHECK },
  { feature: 'Multi-currency gift payments',          other: CROSS,         thankeeu: CHECK },
  { feature: 'Permanent photo storage',               other: PAID,          thankeeu: CHECK },
];

const PricingSection = () => {
  const [currency, setCurrency] = useState('USD');
  const curr = getCurrency(currency);
  const fmt = (ngn) => {
    const v = convertFromNGN(ngn, currency);
    return `${curr.symbol}${currency === 'NGN' ? v.toLocaleString() : v.toFixed(2)}`;
  };
  const plans = [
    { name:'Classic', ngn:5000,  badge:null,       highlight:false, btn:'Create wedding wall', btnStyle:'bg-primary-600 hover:bg-primary-700 text-white', features:['1 wedding card', 'Unlimited guest uploads', 'QR code included', 'Live Memory Wall', 'Memory Movie™', 'Delivery on your day'] },
    { name:'Premium', ngn:9000,  badge:'Most popular', highlight:true,  btn:'Get Premium',        btnStyle:'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg', features:['Everything in Classic', '2 wedding cards', 'Priority support', 'HD Memory Movie™', 'Gift pot enabled', 'Custom branding'] },
    { name:'Duo',     ngn:20000, badge:'Best value',   highlight:false, btn:'Get 2 credits',      btnStyle:'bg-warm-900 hover:bg-warm-800 text-white', features:['Everything in Premium', '4 wedding cards', 'Memory Movie™ for each', 'Dedicated support', 'Early feature access', 'Team gift collection'] },
  ];
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
          <p className="text-warm-500 mb-2 text-base max-w-xl mx-auto">
            Free to create your wall and collect photos. Pay once when you're ready to send.
          </p>
          <p className="text-sm font-bold text-primary-600 mb-6">
            No subscription · No hidden fees · Credits never expire
          </p>
          <CurrencyToggle selected={currency} onChange={setCurrency} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-3xl border-2 p-7 flex flex-col relative ${plan.highlight ? 'border-primary-400 shadow-2xl shadow-primary-100' : 'border-purple-100'}`}>
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-extrabold text-white bg-primary-600 px-4 py-1 rounded-full">{plan.badge}</span>
              )}
              <p className="font-extrabold text-warm-900 text-xl mb-1">{plan.name}</p>
              <p className="text-4xl font-extrabold text-primary-600 mb-5">{fmt(plan.ngn)}<span className="text-sm text-warm-400 font-medium ml-1">once</span></p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-warm-700">
                    <Icon name="Check" size={14} className="text-primary-500 flex-shrink-0" strokeWidth={3}/>{f}
                  </li>
                ))}
              </ul>
              <Link to="/card/new?occasion=wedding"
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-center transition-all ${plan.btnStyle}`}>
                {plan.btn}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── FAQ data ──────────────────────────────────────────────────────── */
const FAQS = [
  { q: 'How do I create a QR code for wedding guest photos?', a: 'Create your wedding card on Thankeeu and enable the Live Memory Wall. Thankeeu instantly generates a print-ready QR code. Print it on table cards, the welcome sign, or the photo booth. Guests scan and upload straight from their phone camera — no app, no account.' },
  { q: 'Do guests need to download an app or create an account?', a: 'No. They scan the QR code with any phone camera, tap the link, and are uploading photos in under 10 seconds. Works on every phone, for guests of every age — including the ones who struggle with technology.' },
  { q: 'Can I display the live photo wall on a screen at the venue?', a: 'Yes. Open the Memory Wall URL on any device connected to a TV or projector at your reception. Photos appear on the screen the moment guests upload them. Couples love opening their reception with an already-filling wall.' },
  { q: 'Where should I display the QR code at my wedding?', a: 'The most effective spots: each reception table, the welcome sign at the entrance, the bar area, and inside the photo booth. The more places guests see it, the more photos you collect.' },
  { q: 'What happens to the photos after the wedding?', a: 'Every photo is permanently saved in your Thankeeu wedding card at full resolution. Download them all as a ZIP, or let Thankeeu automatically turn them into a Memory Movie™ — a cinematic film made by everyone who was there.' },
  { q: 'Can guests also write messages and contribute to a gift?', a: 'Yes — that\'s what makes Thankeeu different from basic QR photo tools. Guests can upload photos, write heartfelt messages, record voice notes, and contribute to a pooled wedding gift — all from the same link.' },
  { q: 'How much does a QR code photo wall for a wedding cost?', a: `Free to create and collect uploads. A small one-time fee applies when you're ready to send the final card to the couple — from $3.15 USD / ₦5,000 NGN. No subscription, no per-photo charges.` },
];

/* ═══════════════════════════════════════════════════════════════════ */
export default function QRCodeForWeddingPhotos() {
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
    title: 'QR Code for Wedding Photos — Let Guests Upload Instantly | Thankeeu',
    description: 'Create a QR code for your wedding so every guest uploads photos to a live shared wall. Print on table cards or a welcome sign. No app needed. Includes messages, voice notes & a gift pot. From $3.15.',
    keywords: 'QR code for wedding photos, wedding QR code photos, wedding guest photo upload, live wedding photo wall, wedding photo sharing QR code, wedding memory wall',
    canonical: '/qr-code-for-wedding-photos',
    ogImage: 'https://www.thankeeu.com/og-leaving-card.jpg',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.webPage('QR Code for Wedding Photos', 'Create a QR code for your wedding so guests can instantly upload photos to a shared live wall.', '/qr-code-for-wedding-photos'),
      SCHEMAS.faqPage(FAQS),
      SCHEMAS.breadcrumb([{ name: 'Home', url: '/' }, { name: 'QR Code for Wedding Photos', url: '/qr-code-for-wedding-photos' }]),
    ],
  });

  return (
    <>
      {showExit && <ExitIntentModal onClose={() => setShowExit(false)} />}
      <Navbar />

      {/* ══ HERO — same image and gradient as /cards/leaving-card ══ */}
      <section className="relative overflow-hidden px-4"
        style={{
          minHeight: 'min(760px,82vh)',
          backgroundImage: 'linear-gradient(90deg,rgba(24,10,38,0.97) 0%,rgba(54,27,65,0.88) 38%,rgba(59,28,66,0.27) 69%,rgba(20,8,30,0.06) 100%),url(/images/heroes/leaving-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <div className="max-w-6xl mx-auto flex items-center py-16 sm:py-24" style={{ minHeight: 'min(760px,82vh)' }}>
          <div className="text-left max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Wedding Live Photo Wall · UK, US &amp; Global
            </p>
            <h1 className="font-extrabold text-white leading-none mb-5"
              style={{ fontSize: 'clamp(2.4rem,7vw,4.5rem)', letterSpacing: '-0.03em' }}>
              One QR code.<br />
              <span style={{ color: '#FDE68A' }}>Every guest's photo. Instantly.</span>
            </h1>
            <p className="text-lg sm:text-xl max-w-xl mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.84)' }}>
              Print a Thankeeu QR code on your table cards. Guests scan, upload photos from their camera roll, and watch the live wall fill up in real time on your venue screen — no app, no account, no friction.
            </p>
            {/* Price visibility — free to start, USD price to send */}
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
              <Link to="/card/new?occasion=wedding"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg,#FDE68A,#F9A8D4)', color: '#2D1638', boxShadow: '0 12px 35px rgba(249,168,212,0.28)' }}>
                <Icon name="QrCode" size={17} />
                Create Your Wedding Photo Wall — Free
              </Link>
              <a href="#how-it-works"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-base border border-white/30 hover:bg-white/10 transition-all">
                <Icon name="Eye" size={16}/>See how it works
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>No app to download</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>Live wall on venue screen</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>Gift pot included</span>
              <span className="flex items-center gap-1.5"><Icon name="Check" size={14} className="text-emerald-300"/>Memory Movie™ auto-generated</span>
            </div>
            <p className="text-xs mt-4 font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Unlike basic QR photo tools — messages, voice notes, wedding gift &amp; Memory Movie™ all included. Free to create.
            </p>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF NUMBERS ══ */}
      <section className="py-10 px-4 border-b border-purple-50" style={{ background: '#fff' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
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

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
              <Icon name="Wand" size={13}/>How it works
            </div>
            <h2 className="font-extrabold text-warm-900 leading-tight"
              style={{ fontSize: 'clamp(1.85rem,5vw,2.75rem)' }}>
              From setup to live wall in four steps
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'Wand',         n: '1', title: 'Create your wedding card', desc: 'Choose the Wedding occasion, enable Live Memory Wall, set your delivery date. Done in 2 minutes.' },
              { icon: 'QrCode',       n: '2', title: 'Print the QR code',        desc: 'Thankeeu generates a print-ready QR code. Put it on table cards, the welcome sign, and the photo booth.' },
              { icon: 'Camera',       n: '3', title: 'Guests scan and upload',   desc: 'Guests point their phone camera at any QR code. They upload straight from their camera roll — no app, no account, 10 seconds.' },
              { icon: 'Monitor',      n: '4', title: 'Watch the wall fill live', desc: 'Open the Memory Wall on a venue screen or projector. Every upload appears in real time. The room goes wild.' },
            ].map(step => (
              <div key={step.n} className="rounded-3xl border-2 border-purple-100 p-6 hover:border-primary-300 hover:shadow-lg transition-all bg-white">
                <div className="w-11 h-11 rounded-2xl mb-4 flex items-center justify-center" style={{ background: '#EDE9FE' }}>
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
              More than just a photo upload tool
            </h2>
            <p className="text-warm-500 mt-3 max-w-xl mx-auto">
              Basic QR photo tools collect pictures. Thankeeu collects the whole story.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: 'QrCode',        title: 'Print-ready QR code',          desc: 'Auto-generated at high resolution, ready to drop into your table card template or print at any size — from 2-inch table cards to 6-foot welcome signs.' },
              { icon: 'Monitor',       title: 'Live wall on venue screens',    desc: 'Open the Memory Wall URL on a TV or projector. Photos appear the instant guests upload. Watch the wall grow throughout the reception.' },
              { icon: 'Camera',        title: 'Full-resolution photo uploads', desc: 'Every photo uploads at original resolution. No compression, no watermarks, no expiry. Download the full-quality ZIP after your wedding.' },
              { icon: 'MessageSquare', title: 'Messages and voice notes too',  desc: 'Guests don\'t just upload photos — they write heartfelt messages and record voice notes. The couple gets the whole emotional story, not just a gallery.' },
              { icon: 'Gift',          title: 'Wedding gift pot built in',     desc: 'Enable the optional gift collection and guests contribute when they sign. No awkward bank transfers. Multi-currency — USD, GBP, NGN and more.' },
              { icon: 'Film',          title: 'Memory Movie™ auto-generated',  desc: 'After the wedding, Thankeeu assembles every message, photo and video into a cinematic film — the couple\'s wedding story, told by everyone who was there.' },
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

      {/* ══ COMPARISON TABLE ══ */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-extrabold text-warm-900 text-center mb-10 leading-tight"
            style={{ fontSize: 'clamp(1.7rem,4.5vw,2.4rem)' }}>
            Thankeeu vs basic QR photo tools
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50">
                  <th className="text-left p-4 text-sm font-bold text-warm-700">Feature</th>
                  <th className="text-center p-4 text-sm font-bold text-warm-400">QR-Only Tools</th>
                  <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {COMPARISON_ROWS.map(({ feature, other, thankeeu }) => (
                  <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-4 text-sm text-warm-700">{feature}</td>
                    <td className="p-4 text-center">{other}</td>
                    <td className="p-4 text-center">{thankeeu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <PricingSection />

      {/* ══ FAQ ══ */}
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

      {/* ══ RELATED LINKS ══ */}
      <section className="py-10 px-4 bg-purple-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-base font-bold text-warm-700 mb-5">More wedding photo tools</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { to: '/wedding-photo-sharing-app',      label: 'Wedding Photo Sharing App' },
              { to: '/collect-wedding-guest-photos',   label: 'Collect Wedding Guest Photos' },
              { to: '/digital-wedding-guest-book',     label: 'Digital Wedding Guest Book' },
              { to: '/wedding-memory-wall',            label: 'Wedding Memory Wall' },
              { to: '/occasions/wedding',              label: 'Wedding Cards' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="text-xs font-semibold text-primary-600 bg-white border border-primary-200 px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="py-20 px-4 text-center"
        style={{
          backgroundImage: 'linear-gradient(90deg,rgba(24,10,38,0.97) 0%,rgba(54,27,65,0.92) 55%,rgba(59,28,66,0.88) 100%),url(/images/heroes/leaving-hero.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Set it up before your big day
          </p>
          <h2 className="font-extrabold text-white leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem,6vw,3.5rem)' }}>
            One QR code.<br />
            <span style={{ color: '#FDE68A' }}>Every guest's perspective.</span>
          </h2>
          <p className="mb-2 text-base font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Free to create. Set up in 2 minutes. Guests scan on the day — done.
          </p>
          <p className="mb-10 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No app · No account · Full-resolution photos · Live on venue screens · Memory Movie™ included
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/card/new?occasion=wedding"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#FDE68A,#F9A8D4)', color: '#2D1638', boxShadow: '0 12px 35px rgba(249,168,212,0.28)' }}>
              <Icon name="QrCode" size={18}/>Create Wedding Photo Wall — Free
            </Link>
            <Link to="/occasions/wedding"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-base border border-white/30 hover:bg-white/10 transition-all">
              <Icon name="Eye" size={16}/>See wedding cards
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
