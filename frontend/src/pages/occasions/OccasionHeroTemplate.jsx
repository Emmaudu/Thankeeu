/**
 * OccasionHeroTemplate — shared hero + sections template used by
 * BirthdayPage, BabyShowerPage, LeavingCardPage (and future occasion pages).
 *
 * Props:
 *   slides           OCCASION_SLIDES[]  — hero slideshow data
 *   comparisonRows   COMPARISON_ROW[]   — feature comparison table rows
 *   features         FEATURE[]          — 6-item feature grid
 *   howItWorks       STEP[]             — 4 how-it-works steps
 *   faqs             FAQ[]              — FAQ accordion items
 *   seoProps         object             — passed to useSEO()
 *   heroEyebrow      string             — e.g. "Online Birthday Cards"
 *   heroHeadline     JSX                — big H1 with gradient span
 *   heroSubline      string
 *   ctaPath          string             — e.g. "/card/new?occasion=birthday"
 *   ctaLabel         string             — e.g. "Create Birthday Card — Free"
 *   ctaSecondaryHref string             — usually "#pricing"
 *   trustBadges      string[]           — trust-bar bullets
 *   pricingHeadline  string
 *   pricingSubline   string
 *   comparisonTitle  string
 *   comparisonBlurb  string
 *   comparisonCards  COMP_CARD[]        — summary cards for Thankbox/Kudoboard/Us
 *   testimonialsHeadline JSX
 *   finalCtaEmoji    string
 *   finalCtaHeadline string
 *   finalCtaSubline  string
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';
import { CurrencyToggle } from '../../utils/currencyUI';
import { convertFromNGN, getCurrency } from '../../utils/currency';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Icon from '../../components/ui/Icon';

// Strip emoji characters from eyebrow labels so they render as clean uppercase text
const stripEmoji = (str = '') =>
  String(str).replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
import HeroShowcase from '../../components/HeroShowcase';
import PriorityDesignGallery from '../../components/PriorityDesignGallery';

/* ─── Shared pricing plans ────────────────────────────────────────────── */
export const SHARED_PLANS = [
  {
    name: 'Classic', priceNGN: 5000, credits: 1, popular: false,
    label: 'One card — full experience included',
    btn: 'Send this card',
    btnStyle: 'border-2 border-purple-200 text-primary-600 hover:bg-primary-50',
    features: ['Send 1 group card', 'Unlimited signers', '100+ premium designs', 'Voice, photo & video messages', 'Gift collection included', 'Scheduled delivery — any date & time', 'Memory Movie™ auto-generated', 'Credit never expires'],
  },
  {
    name: 'Standard', priceNGN: 9000, credits: 2, popular: true,
    label: 'Two cards — save on the second',
    btn: 'Get 2 credits',
    btnStyle: 'bg-primary-500 text-white hover:bg-primary-600',
    features: ['Send 2 group cards', 'Unlimited signers', '100+ premium designs', 'Voice, photo & video messages', 'Gift collection included', 'Scheduled delivery — any date & time', 'Memory Movie™ auto-generated', 'Credits never expire'],
  },
  {
    name: 'Pack of 5', priceNGN: 20000, credits: 5, popular: false,
    label: '5 cards — best per-card price',
    btn: 'Buy 5 credits',
    btnStyle: 'border-2 border-green-300 text-green-700 hover:bg-green-50',
    features: ['Send 5 group cards', 'Unlimited signers', '100+ premium designs', 'Voice, photo & video messages', 'Gift collection included', 'Scheduled delivery — any date & time', 'Memory Movie™ auto-generated', 'Credits never expire'],
  },
];

/* ─── Check / Cross icons ─────────────────────────────────────────────── */
export const CHECK   = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100"><Icon name="Check" size={13} className="text-green-600" strokeWidth={3}/></span>;
export const CROSS   = <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50"><Icon name="X" size={13} className="text-red-400" strokeWidth={3}/></span>;
export const PAID    = <span className="text-xs text-warm-400 font-medium">Paid plan</span>;

/* ─── Shared comparison summary cards ────────────────────────────────── */
export const DEFAULT_COMP_CARDS = [
  { name: 'Thankbox',  icon: 'Mail',     colour: '#0ea5e9', bg: '#f0f9ff',
    line: 'UK group card platform. GBP gift collection. No voice notes, no Memory Movie, no Nigerian payments.' },
  { name: 'Kudoboard', icon: 'Award',    colour: '#f59e0b', bg: '#fffbeb',
    line: 'US recognition platform. USD-only. No voice notes, no live photo wall, expensive subscription.' },
  { name: 'Thankeeu',  icon: 'Sparkles', colour: '#7C3AED', bg: '#F5F0FF',
    line: 'Full group card + Memory Movie + Naira/GBP/USD + HRIS sync. Built for global teams.' },
];

/* ─── Card preview ─────────────────────────────────────────────────────── */
const CardPreview = ({ slide }) => (
  <div className="relative w-full max-w-md mx-auto select-none" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
    <div className="rounded-3xl overflow-hidden shadow-2xl border border-purple-100 bg-white">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg,${slide.accent},white)` }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: slide.color, opacity: 0.7 }}>{slide.cardLabel || 'group card'}</p>
          <h3 className="font-extrabold text-warm-900 text-base leading-tight">
            For {slide.messages[0].name.split(' ')[0]}
          </h3>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: slide.color, color: '#fff' }}>
            {slide.count} signed
          </div>
          {slide.gift && (
            <p className="text-xs font-bold mt-1.5" style={{ color: '#059669' }}>🎁 {slide.gift} pooled</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {slide.messages.map((m, i) => (
          <div key={m.name} className="rounded-2xl p-3 flex flex-col gap-1.5"
            style={{ background: m.bg, minHeight: i < 2 ? 120 : 100 }}>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: m.color, color: '#fff' }}>
                {m.name[0]}
              </div>
              <p className="font-bold text-xs text-warm-900 truncate">{m.name}</p>
            </div>
            <p className="text-warm-700 leading-relaxed" style={{ fontSize: '0.7rem' }}>
              {m.text.length > 85 ? m.text.slice(0, 85) + '…' : m.text}
            </p>
          </div>
        ))}
      </div>
      <div className="px-4 pb-3 pt-1 flex items-center justify-between">
        <div className="flex -space-x-1">
          {slide.messages.map((m, i) => (
            <div key={m.name} className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center font-bold"
              style={{ background: m.color, color: '#fff', fontSize: '8px', zIndex: 4 - i }}>
              {m.name[0]}
            </div>
          ))}
          <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center font-bold bg-warm-200 text-warm-600"
            style={{ fontSize: '8px' }}>
            +{slide.count - 4}
          </div>
        </div>
        <div style={{ fontSize: '10px' }} className="font-semibold text-warm-400">thankeeu.com</div>
      </div>
    </div>
    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl shadow-lg flex items-center justify-center"
      style={{ background: slide.color }}>
      <Icon name="Heart" size={18} className="text-white" />
    </div>
  </div>
);

/* ─── Hero slideshow ───────────────────────────────────────────────────── */
const HeroSlideshow = ({ slides, ctaPath, ctaLabel }) => {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);

  const goTo = (next) => {
    setFading(true);
    setTimeout(() => {
      setIdx(typeof next === 'function' ? next(idx) : next);
      setFading(false);
    }, 220);
  };

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(prev => (prev + 1) % slides.length);
        setFading(false);
      }, 220);
    }, 5500);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const slide = slides[idx];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="relative">
      <div className="transition-all duration-300"
        style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(6px)' : 'translateY(0)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center rounded-3xl px-6 py-8 sm:px-10 sm:py-10"
          style={{ background: `linear-gradient(135deg,${slide.accent}cc,white)`, border: `1.5px solid ${slide.accent}` }}>
          <div className="text-center lg:text-left order-2 lg:order-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] mb-5"
              style={{ color: slide.color }}>{slide.tag}</p>
            <h2 className="font-extrabold text-warm-900 mb-4 leading-tight"
              style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', letterSpacing: '-0.025em' }}>
              {slide.title}
            </h2>
            <p className="text-warm-500 mb-7 text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
              {slide.description}
            </p>
            <Link to={ctaPath}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-base transition-all hover:scale-105 hover:shadow-xl"
              style={{ background: `linear-gradient(135deg,${slide.color},${slide.color}cc)`, boxShadow: `0 8px 24px ${slide.color}44` }}>
              {ctaLabel} →
            </Link>
            <p className="text-xs text-warm-400 mt-4">Free to create · No account needed to sign</p>
          </div>
          <div className="flex items-center justify-center order-1 lg:order-2">
            <CardPreview slide={slide} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-5">
        <button onClick={() => goTo((idx - 1 + slides.length) % slides.length)}
          className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-purple-200 text-warm-500 hover:bg-purple-50 hover:border-primary-400 transition-all font-bold text-sm">‹</button>
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className="transition-all rounded-xl"
              style={{ width: i === idx ? 24 : 8, height: 8, background: i === idx ? slide.color : '#DDD6FE' }} />
          ))}
        </div>
        <button onClick={() => goTo((idx + 1) % slides.length)}
          className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-purple-200 text-warm-500 hover:bg-purple-50 hover:border-primary-400 transition-all font-bold text-sm">›</button>
      </div>
    </div>
  );
};

/* ─── Pricing section ──────────────────────────────────────────────────── */
const PricingSection = ({ headline, subline, ctaPath, ctaLabelOverride }) => {
  const [currency, setCurrency] = useState('USD');
  const curr = getCurrency(currency);
  const fmt = (ngn) => {
    const v = convertFromNGN(ngn, currency);
    return `${curr.symbol}${currency === 'NGN' ? Math.round(v).toLocaleString() : v.toFixed(2)}`;
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
            {headline || 'Simple, honest pricing'}
          </h2>
          <p className="text-warm-500 mb-6 text-base max-w-xl mx-auto">
            {subline || 'Free to create and collect messages. Pay once when you\'re ready to send. No subscription, no hidden fees.'}
          </p>
          <CurrencyToggle selected={currency} onChange={setCurrency} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SHARED_PLANS.map(plan => (
            <div key={plan.name}
              className={`relative rounded-3xl border-2 p-7 flex flex-col transition-all hover:shadow-xl ${plan.popular ? 'border-primary-400 shadow-lg' : 'border-purple-100'}`}
              style={{ background: plan.popular ? 'linear-gradient(160deg,#F5F0FF,#fff)' : '#fff' }}>
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-xl text-xs font-bold text-white bg-primary-500 whitespace-nowrap">
                  Most popular
                </div>
              )}
              <div className="mb-5">
                <p className="font-extrabold text-warm-900 text-xl mb-1">{plan.name}</p>
                <p className="text-warm-400 text-xs">{plan.label}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-warm-900">{fmt(plan.priceNGN)}</span>
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
              <Link to={ctaPath}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-center transition-all block ${plan.btnStyle}`}>
                {ctaLabelOverride || plan.btn}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-warm-400 mt-6">
          Credits work for any occasion. They never expire.
        </p>
      </div>
    </section>
  );
};

/* ─── Testimonials (shared real stories) ─────────────────────────────── */
const Testimonials = ({ headline }) => (
  <section className="py-14 md:py-20 px-4 bg-white">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
          <Icon name="Star" size={13}/>Real stories
        </div>
        <h2 className="font-bold text-warm-900" style={{ fontSize: 'clamp(1.85rem,5.5vw,2.75rem)' }}>
          {headline || <>People who made someone's day<br/><span className="text-primary-500">completely unforgettable</span></>}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            photo: '/photos/comfort.png', name: 'Comfort Irorere',
            linkedin: 'https://www.linkedin.com/in/comfort-uduebholo/',
            role: 'Security Engineer · Amazon Web Services',
            location: 'Virginia, United States',
            quote: "My best friend had her baby shower in December and I was stuck in Virginia — no way I could be there in person. I created a Thankeeu card, sent the link to 18 of our girls, and by the day of her shower, she opened it to 18 heartfelt messages, photos, and a gift pool we'd all put together. She literally called me crying. I didn't think an app could ever replace being in the room, but Thankeeu came incredibly close.",
          },
          {
            photo: '/photos/favour.jpg', name: 'Favour Ibude',
            linkedin: 'https://www.linkedin.com/in/favouribude/',
            role: 'Data Scientist / MLOps Engineer · Allianz',
            location: 'United Kingdom',
            quote: "Father's Day crept up on us and we had zero time to plan anything. I jumped on Thankeeu, created a card for my dad, and shared the link with my siblings and a few cousins. Within hours everyone had left him a message — some even added voice notes. We pooled a gift together and the card was delivered to him on the day. He called each one of us individually just to say thank you.",
          },
        ].map(t => (
          <div key={t.name} className="rounded-3xl border-2 border-purple-100 overflow-hidden hover:border-primary-300 hover:shadow-xl transition-all flex flex-col" style={{ background: '#FDFCFF' }}>
            <div className="p-6 flex flex-col gap-4 flex-1 relative">
              <div className="flex justify-center mb-2">
                <img src={t.photo} alt={t.name}
                  className="rounded-xl object-cover border-4 border-primary-100"
                  style={{ width: 200, height: 200, objectPosition: 'top' }}
                  loading="lazy"/>
              </div>
              <span className="absolute top-3 right-5 text-7xl text-primary-100 font-serif leading-none select-none pointer-events-none">"</span>
              <div className="flex justify-center gap-0.5">
                {[0,1,2,3,4].map(i => <Icon key={i} name="Star" size={15} className="text-amber-400 fill-amber-400"/>)}
              </div>
              <p className="text-sm text-warm-600 leading-relaxed italic flex-1 relative z-10">"{t.quote}"</p>
              <div className="flex flex-col gap-0.5 pt-4 border-t border-purple-50">
                <a href={t.linkedin} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-bold text-warm-900 hover:text-primary-600 transition-colors flex items-center gap-1.5">
                  {t.name}
                  <svg className="w-3.5 h-3.5 text-[#0A66C2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <p className="text-xs text-warm-400">{t.role}</p>
                <p className="text-xs text-warm-400">{t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Company logos marquee ───────────────────────────────────────────── */
const LogosMarquee = () => (
  <section className="py-10 px-4 overflow-hidden" style={{ background: '#FDFCFF' }}>
    <div className="max-w-4xl mx-auto">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-warm-300 mb-8">Trusted by teams at</p>
      <div className="overflow-hidden">
        <style>{`@keyframes oht-mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}.oht-logos{animation:oht-mq 18s linear infinite;}`}</style>
        <div className="flex items-center oht-logos" style={{ width: 'max-content', gap: '80px' }}>
          {[0,1].map(set => (
            <div key={set} className="flex items-center flex-shrink-0" style={{ gap: '80px' }}>
              {[
                { src: '/logos/huawei.png',   alt: 'Huawei',              w: 120 },
                { src: '/logos/covenant.png', alt: 'Covenant University', w: 90  },
                { src: '/logos/landmark.png', alt: 'Landmark University', w: 80  },
                { src: '/logos/bells.png',    alt: 'Bells University',    w: 76  },
              ].map(logo => (
                <div key={logo.alt} className="flex items-center justify-center flex-shrink-0" style={{ height: 60, width: logo.w }}>
                  <img src={logo.src} alt={logo.alt}
                    style={{ maxHeight: 48, width: logo.w, objectFit: 'contain', opacity: 0.5, filter: 'grayscale(100%)' }}
                    loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }}/>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ─── Main template ────────────────────────────────────────────────────── */
export default function OccasionHeroTemplate({
  /* SEO */
  seoProps,
  /* Hero */
  heroEyebrow, heroHeadline, heroSubline, heroImage,
  ctaPath, ctaLabel,
  trustBadges,
  slides,
  /* How it works */
  howItWorks,
  /* Features */
  features,
  featuresHeadline = 'Everything your card needs',
  featuresSubline = 'All included. No extras, no tiers, no surprises.',
  /* Pricing */
  pricingHeadline, pricingSubline,
  /* Comparison */
  comparisonTitle, comparisonBlurb,
  comparisonCards = DEFAULT_COMP_CARDS,
  comparisonRows,
  /* Testimonials */
  testimonialsHeadline,
  /* FAQ */
  faqs,
  /* Final CTA */
  finalCtaEmoji = '🎉',
  finalCtaHeadline, finalCtaSubline,
  /* Hero showcase (images 1-3 from screenshots) */
  sampleMessages, demoMessages,
  /* Optional priority A4 cover gallery */
  priorityDesigns,
  priorityDesignOccasion,
  priorityDesignEyebrow,
  priorityDesignTitle,
  priorityDesignDescription,
}) {
  useSEO(seoProps);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ════ HERO ════ */}
      {heroImage ? (
      <section className="relative overflow-hidden" style={{minHeight:'min(760px,82vh)',backgroundImage:`linear-gradient(90deg,rgba(22,10,40,0.97) 0%,rgba(47,20,68,0.88) 37%,rgba(40,15,54,0.3) 67%,rgba(20,8,30,0.08) 100%),url(${heroImage})`,backgroundSize:'cover',backgroundPosition:'center'}}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 relative z-10 flex items-center" style={{minHeight:'min(760px,82vh)'}}>
          <div className="max-w-2xl text-left">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-5" style={{color:'rgba(255,255,255,0.65)',letterSpacing:'0.2em'}}>{stripEmoji(heroEyebrow)}</p>
            <h1 className="font-extrabold text-white leading-[0.96] mb-6" style={{fontSize:'clamp(2.8rem,7vw,5.25rem)',letterSpacing:'-0.045em',textShadow:'0 3px 28px rgba(0,0,0,0.3)'}}>{heroHeadline}</h1>
            <p className="text-lg sm:text-xl max-w-xl mb-8 leading-relaxed" style={{color:'rgba(255,255,255,0.84)'}}>{heroSubline}</p>
            <div className="flex flex-wrap items-center gap-3 mb-7">
              <Link to={ctaPath} className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-extrabold text-warm-900 text-base transition-all hover:-translate-y-0.5 hover:shadow-2xl" style={{background:'linear-gradient(135deg,#FDE68A,#F9A8D4)',boxShadow:'0 12px 35px rgba(249,168,212,0.28)'}}><Icon name="Sparkles" size={18}/>{ctaLabel}</Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-white text-base border border-white/30 hover:bg-white/10 transition-all">See how it works <span aria-hidden="true">↓</span></a>
            </div>
            {trustBadges && <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold" style={{color:'rgba(255,255,255,0.75)'}}>{trustBadges.map(t=><span key={t} className="flex items-center gap-2"><Icon name="Check" size={13} className="text-emerald-300 flex-shrink-0"/>{t}</span>)}</div>}
          </div>
        </div>
        <div className="absolute bottom-5 right-5 sm:right-8 z-10 text-xs font-semibold text-white/60">One link · everyone contributes · one unforgettable reveal</div>
      </section>
      ) : (
      <section className="pt-10 pb-4 px-4" style={{ background: 'linear-gradient(180deg,#F5F0FF 0%,#fff 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary-500 mb-5">{stripEmoji(heroEyebrow)}</p>
            <h1 className="font-extrabold text-warm-900 leading-none mb-4"
              style={{ fontSize: 'clamp(2.4rem,7vw,4.5rem)', letterSpacing: '-0.03em' }}>
              {heroHeadline}
            </h1>
            <p className="text-warm-500 text-lg sm:text-xl max-w-2xl mx-auto mb-3 leading-relaxed">
              {heroSubline}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <Link to={ctaPath}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-base transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                <Icon name="Sparkles" size={17}/>{ctaLabel}
              </Link>
              <a href="#pricing"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-primary-600 text-base border-2 border-primary-200 hover:bg-primary-50 transition-all">
                See pricing
              </a>
            </div>
            {trustBadges && (
              <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-warm-400 font-medium">
                {trustBadges.map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Icon name="Check" size={14} className="text-green-500"/>{t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <HeroSlideshow slides={slides} ctaPath={ctaPath} ctaLabel={ctaLabel} />
        </div>
      </section>
      )}

      {/* ════ LOGOS ════ */}
      <LogosMarquee />

      {priorityDesigns?.length > 0 && (
        <PriorityDesignGallery
          designs={priorityDesigns}
          occasion={priorityDesignOccasion}
          eyebrow={priorityDesignEyebrow}
          title={priorityDesignTitle}
          description={priorityDesignDescription}
          background="#fff"
        />
      )}

      {/* ════ HOW IT WORKS ════ */}
      <section id="how-it-works" className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
              <Icon name="Wand" size={13}/>How it works
            </div>
            <h2 className="font-extrabold text-warm-900 leading-tight"
              style={{ fontSize: 'clamp(1.85rem,5vw,2.75rem)' }}>
              {howItWorks.heading}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {howItWorks.steps.map(step => (
              <div key={step.n} className="rounded-3xl border-2 border-purple-100 p-6 hover:border-primary-300 hover:shadow-lg transition-all bg-white">
                <div className="w-11 h-11 rounded-2xl mb-3 flex items-center justify-center" style={{ background: '#EDE9FE' }}>
                  <Icon name={step.icon} size={20} className="text-primary-600"/>
                </div>
                <div className="text-3xl font-extrabold text-purple-100 mb-1">{step.n}</div>
                <h3 className="font-bold text-warm-900 mb-2 text-sm">{step.title}</h3>
                <p className="text-warm-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FEATURES ════ */}
      <section className="py-14 px-4" style={{ background: '#F5F0FF' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-extrabold text-warm-900 leading-tight"
              style={{ fontSize: 'clamp(1.7rem,4.5vw,2.5rem)' }}>
              {featuresHeadline}
            </h2>
            <p className="text-warm-500 mt-3 max-w-xl mx-auto text-sm">{featuresSubline}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="rounded-2xl bg-white border-2 border-purple-100 p-6 hover:border-primary-300 hover:shadow-lg transition-all">
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: '#EDE9FE' }}>
                  <Icon name={f.icon} size={18} className="text-primary-600"/>
                </div>
                <h3 className="font-bold text-warm-900 mb-1.5 text-sm">{f.title}</h3>
                <p className="text-warm-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ PRICING ════ */}
      <PricingSection headline={pricingHeadline} subline={pricingSubline} ctaPath={ctaPath} />

      <div className="h-px mx-4" style={{ background: 'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ════ COMPARISON ════ */}
      {comparisonRows && (
        <section className="py-16 md:py-20 px-4 bg-white" id="comparison">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
                <Icon name="BarChart2" size={13}/>Comparison
              </div>
              <h2 className="font-extrabold text-warm-900 leading-tight"
                style={{ fontSize: 'clamp(1.7rem,4.5vw,2.5rem)' }}>
                {comparisonTitle || 'Thankeeu vs Thankbox vs Kudoboard'}
              </h2>
              {comparisonBlurb && (
                <p className="text-warm-500 mt-3 max-w-xl mx-auto text-sm">{comparisonBlurb}</p>
              )}
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {comparisonCards.map(p => (
                <div key={p.name} className="rounded-2xl p-5 border-2" style={{ background: p.bg, borderColor: p.colour + '30' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: p.colour + '18' }}>
                      <Icon name={p.icon} size={17} style={{ color: p.colour }}/>
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
            <div className="overflow-x-auto rounded-2xl border border-purple-100 shadow-sm bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-50 border-b border-purple-100">
                    <th className="text-left p-4 text-sm font-bold text-warm-700 w-2/5">Feature</th>
                    <th className="text-center p-4 text-sm font-bold text-warm-400">Thankbox</th>
                    <th className="text-center p-4 text-sm font-bold text-warm-400">Kudoboard</th>
                    <th className="text-center p-4 text-sm font-bold text-primary-600">Thankeeu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {comparisonRows.map(({ feature, thankbox, kudoboard, thankeeu }) => (
                    <tr key={feature} className="hover:bg-purple-50/40 transition-colors">
                      <td className="p-4 text-sm text-warm-700">{feature}</td>
                      <td className="p-4 text-center">{thankbox}</td>
                      <td className="p-4 text-center">{kudoboard}</td>
                      <td className="p-4 text-center" style={{ background: 'rgba(124,58,237,0.04)' }}>{thankeeu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-xs text-warm-400 mt-4">
              Based on publicly available feature pages. &nbsp;
              <Link to="/thankeeu-vs-thankbox" className="underline hover:text-primary-500">Full Thankbox comparison →</Link>
              &nbsp;·&nbsp;
              <Link to="/thankeeu-vs-kudoboard" className="underline hover:text-primary-500">Full Kudoboard comparison →</Link>
            </p>
          </div>
        </section>
      )}

      <div className="h-px mx-4" style={{ background: 'linear-gradient(90deg,transparent,#C4B5FD,transparent)' }}/>

      {/* ════ TESTIMONIALS ════ */}
      <Testimonials headline={testimonialsHeadline} />

      {/* ════ FAQ ════ */}
      <section className="py-14 px-4" style={{ background: '#F5F0FF' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-warm-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details key={q} className="rounded-2xl border border-purple-100 bg-white group">
                <summary className="px-5 py-4 font-semibold text-warm-800 text-sm cursor-pointer list-none flex items-center justify-between">
                  {q}<Icon name="ChevronDown" size={16} className="text-warm-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-3"/>
                </summary>
                <p className="px-5 pb-4 text-sm text-warm-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="py-16 px-4 text-center"
        style={{ background: 'linear-gradient(135deg,#0d0020,#2d1052)' }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
            {finalCtaHeadline}
          </h2>
          <p className="text-white/60 mb-8 text-base">{finalCtaSubline}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={ctaPath}
              className="px-8 py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}>
              {ctaLabel} →
            </Link>
            <Link to="/how-it-works"
              className="px-8 py-4 rounded-2xl font-bold text-white/80 text-base border-2 border-white/20 hover:bg-white/10 transition-all">
              How it works
            </Link>
          </div>
          <p className="text-white/30 text-xs mt-6">No credit card required to start</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
