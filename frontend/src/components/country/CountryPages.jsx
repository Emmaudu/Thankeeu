// Landing pages for the international country sites:
//   /:country                 country home
//   /:country/services/:slug  one service in that country
//   /:country/:city           one city
//   /:country/compare/:slug   Taskeeu vs a local competitor
//   /:country/remote          remote and online tasks
// All copy comes from src/content/countries/<slug>.js.
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ChevronDown, ArrowRight, Check, MapPin, Laptop, ShieldCheck, Wrench, Truck, Sparkles, Leaf, Hammer,
  Package, Paintbrush, Tv, Trash2, ShoppingBag, Home, Briefcase, Clock, Star, CreditCard, MessageCircle, Users,
} from 'lucide-react';
import CountrySEO from './CountrySEO';
import { useCountryContent } from './content';

/* ── Picks an icon from the words in a label (no emojis anywhere) ── */
const ICONS = [
  [/clean|tenancy|maid|housekeep/i, Sparkles], [/garden|yard|lawn|hedge|landscap/i, Leaf],
  [/assembl|flat ?pack|furniture|ikea/i, Hammer], [/mov|removal|van|haul/i, Truck],
  [/tv|mount/i, Tv], [/junk|rubbish|waste|clearance/i, Trash2], [/paint|decorat/i, Paintbrush],
  [/deliver|errand|courier|pick ?up|grocer/i, ShoppingBag], [/handy|repair|odd job|fix|plumb|electric/i, Wrench],
  [/remote|online|data|admin|research|design|writ|virtual/i, Laptop], [/vs |compare/i, Star],
  [/home|house|aircon/i, Home], [/pack|parcel/i, Package],
];
const iconFor = (label) => (ICONS.find(([re]) => re.test(label || '')) || [null, Briefcase])[1];

/* ── Hero artwork: brand-coloured shapes and floating task cards ─── */
function HeroArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <pattern id="tk-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.6" fill="rgba(255,255,255,0.07)" />
        </pattern>
      </defs>
      <rect width="1440" height="560" fill="url(#tk-dots)" />
      <circle cx="120" cy="90" r="160" fill="#ff2d62" opacity="0.14" />
      <circle cx="1340" cy="470" r="210" fill="#ff2d62" opacity="0.12" />
      <circle cx="1260" cy="80" r="60" fill="none" stroke="#ff2d62" strokeOpacity="0.45" strokeWidth="2" />
      <circle cx="210" cy="470" r="38" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
      <path d="M0 520 C 320 450, 520 600, 820 520 S 1260 430, 1440 500 L1440 560 L0 560 Z" fill="#ff2d62" opacity="0.10" />
      {/* floating task card, left */}
      <g transform="translate(70 200) rotate(-6)" opacity="0.9"><g className="tk-float">
        <rect width="190" height="92" rx="16" fill="#ffffff" />
        <rect x="16" y="18" width="34" height="34" rx="10" fill="#ff2d62" />
        <path d="M25 35 l6 6 l11 -12" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="62" y="20" width="104" height="10" rx="5" fill="#1a0d2e" opacity="0.85" />
        <rect x="62" y="38" width="76" height="8" rx="4" fill="#7b6490" opacity="0.5" />
        <rect x="16" y="66" width="70" height="12" rx="6" fill="#ffeef3" />
        <rect x="120" y="64" width="54" height="16" rx="8" fill="#ff2d62" />
      </g></g>
      {/* floating bid card, right */}
      <g transform="translate(1180 230) rotate(5)" opacity="0.9"><g className="tk-float-2">
        <rect width="200" height="100" rx="16" fill="#ffffff" />
        <circle cx="36" cy="36" r="18" fill="#ffeef3" />
        <circle cx="36" cy="31" r="7" fill="#ff2d62" />
        <path d="M24 48 a12 9 0 0 1 24 0" fill="#ff2d62" />
        <rect x="64" y="24" width="96" height="10" rx="5" fill="#1a0d2e" opacity="0.85" />
        <g fill="#ffb800">{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={68 + i * 14} cy="48" r="4.5" />)}</g>
        <rect x="16" y="70" width="168" height="16" rx="8" fill="#00c37e" opacity="0.18" />
        <rect x="16" y="70" width="110" height="16" rx="8" fill="#00c37e" />
      </g></g>
      {/* map pin */}
      <g transform="translate(1030 120)" opacity="0.85">
        <path d="M24 0 C10.7 0 0 10.4 0 23.3 C0 41 24 64 24 64 C24 64 48 41 48 23.3 C48 10.4 37.3 0 24 0 Z" fill="#ff2d62" />
        <circle cx="24" cy="23" r="9" fill="#12091a" />
      </g>
      {/* sparkle */}
      <path d="M360 110 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6 Z" fill="#ffffff" opacity="0.25" />
      <path d="M1110 430 l4 11 l11 4 l-11 4 l-4 11 l-4 -11 l-11 -4 l11 -4 Z" fill="#ff2d62" opacity="0.7" />
    </svg>
  );
}

function PageLoading() {
  return (
    <div className="container-xl" style={{ paddingTop: 160, paddingBottom: 120 }}>
      <div className="skeleton" style={{ height: 40, width: '60%', borderRadius: 12, margin: '0 auto 16px' }} />
      <div className="skeleton" style={{ height: 18, width: '70%', borderRadius: 8, margin: '0 auto' }} />
    </div>
  );
}

function Crumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20 }}>
      <ol className="flex flex-wrap items-center justify-center" style={{ gap: 6 }}>
        {items.map((b, i) => (
          <li key={b.path} className="flex items-center" style={{ gap: 6 }}>
            {i > 0 && <span aria-hidden="true" style={{ opacity: 0.5 }}>/</span>}
            {i < items.length - 1
              ? <Link to={b.path} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{b.name}</Link>
              : <span aria-current="page" style={{ color: '#ffffff', fontWeight: 700 }}>{b.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* Navbar is 64px and fixed; the hero starts below it with room to breathe. */
function Hero({ crumbs, eyebrow, h1, sub, market, children }) {
  const p = `/${market.slug}`;
  return (
    <section data-testid="country-hero" className="tk-hero" style={{ position: 'relative', overflow: 'hidden', background: '#12091a', color: '#ffffff' }}>
      <style>{`
        @keyframes tkFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        .tk-float { animation: tkFloat 6s ease-in-out infinite; transform-box: fill-box; }
        .tk-float-2 { animation: tkFloat 7s ease-in-out infinite 1s; transform-box: fill-box; }
        @media (prefers-reduced-motion: reduce) { .tk-float, .tk-float-2 { animation: none } }
        @media (max-width: 900px) { .tk-float, .tk-float-2 { display: none } }
        .tk-hero { padding-top: 136px; padding-bottom: 96px; }
        .tk-sec { padding-top: 76px; padding-bottom: 76px; }
        @media (max-width: 640px) {
          .tk-hero { padding-top: 104px; padding-bottom: 64px; }
          .tk-sec { padding-top: 52px; padding-bottom: 52px; }
          .tk-cta a { width: 100%; justify-content: center; }
        }
      `}</style>
      <HeroArt />
      <div className="container-xl" style={{ position: 'relative', textAlign: 'center', maxWidth: 920 }}>
        {crumbs && <Crumbs items={crumbs} />}
        {eyebrow && (
          <p style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ffffff', background: 'rgba(255,45,98,0.22)', border: '1px solid rgba(255,45,98,0.55)', borderRadius: 10, padding: '7px 14px', marginBottom: 20 }}>
            {eyebrow}
          </p>
        )}
        <h1 style={{ color: '#ffffff', fontSize: 'clamp(32px, 5.4vw, 58px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.035em', margin: '0 auto', maxWidth: 860, textWrap: 'balance' }}>{h1}</h1>
        {sub && <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', lineHeight: 1.65, color: 'rgba(255,255,255,0.86)', margin: '20px auto 0', maxWidth: 680 }}>{sub}</p>}
        <div className="tk-cta flex flex-wrap items-center justify-center" style={{ gap: 12, marginTop: 34 }}>
          <Link to={`${p}/post-task`} className="btn-primary btn-lg">Post a task for free <ArrowRight size={17} /></Link>
          <Link to={`${p}/tasker/signup`} className="btn-white btn-lg">Earn as a tasker</Link>
        </div>
        {children}
      </div>
    </section>
  );
}

function Section({ title, kicker, intro, children, tone = 'white', id }) {
  const bg = tone === 'white' ? '#ffffff' : tone === 'rose' ? '#fff5f8' : 'var(--surface)';
  return (
    <section id={id} className="tk-sec" style={{ background: bg, scrollMarginTop: 80 }}>
      <div className="container-xl">
        {(kicker || title) && (
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 40px' }}>
            {kicker && <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 10 }}>{kicker}</p>}
            {title && <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 900, letterSpacing: '-0.025em', color: 'var(--text)', lineHeight: 1.15, textWrap: 'balance' }}>{title}</h2>}
            {intro && <p style={{ fontSize: 17, color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

const Prose = ({ paras }) => (
  <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
    {paras.map((t, i) => <p key={i} style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--text-2)', marginBottom: 18 }}>{t}</p>)}
  </div>
);

const STEP_ICONS = [MessageCircle, Users, CreditCard];
function Steps({ steps }) {
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {steps.map((s, i) => {
        const Icon = STEP_ICONS[i % 3];
        return (
          <li key={s.title} className="card" style={{ padding: 30, textAlign: 'center', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 16, right: 18, fontSize: 40, fontWeight: 900, color: 'var(--rose-light)', lineHeight: 1 }}>{i + 1}</span>
            <span style={{ display: 'inline-flex', width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', background: 'var(--rose)', color: '#ffffff', boxShadow: '0 10px 24px rgba(255,45,98,0.28)' }}><Icon size={26} /></span>
            <h3 style={{ fontSize: 19, fontWeight: 800, marginTop: 18, color: 'var(--text)' }}>{s.title}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', marginTop: 8 }}>{s.text}</p>
          </li>
        );
      })}
    </ol>
  );
}

function CheckList({ items, columns = 2 }) {
  const cls = columns === 1 ? '' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <ul className={`grid gap-3 ${cls}`} style={{ maxWidth: columns === 1 ? 760 : 1040, margin: '0 auto' }}>
      {items.map((t) => (
        <li key={t} className="flex items-start" style={{ gap: 12, fontSize: 16, lineHeight: 1.6, color: 'var(--text-2)', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 14, padding: '14px 16px' }}>
          <span style={{ display: 'inline-flex', flexShrink: 0, width: 24, height: 24, borderRadius: 8, background: 'var(--rose-light)', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}><Check size={15} style={{ color: 'var(--rose)' }} /></span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function LinkGrid({ links, icons = true }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {links.map((l) => {
        const Icon = l.icon || iconFor(l.label);
        return (
          <li key={l.to + l.label}>
            <Link to={l.to} className="card card-hover flex items-center" style={{ padding: '18px 18px', gap: 14, height: '100%' }}>
              {icons && <span style={{ display: 'inline-flex', flexShrink: 0, width: 44, height: 44, borderRadius: 14, background: 'var(--rose-light)', color: 'var(--rose)', alignItems: 'center', justifyContent: 'center' }}><Icon size={21} /></span>}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: 'var(--text)', lineHeight: 1.35 }}>{l.label}</span>
                {l.note && <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{l.note}</span>}
              </span>
              <ArrowRight size={16} style={{ color: 'var(--rose)', flexShrink: 0 }} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function FAQ({ faqs }) {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="card" style={{ marginBottom: 12, padding: '0 22px', borderColor: isOpen ? 'rgba(255,45,98,0.35)' : undefined }}>
            <h3>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between text-left" style={{ gap: 16, padding: '18px 0', fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
                {f.q}
                <span style={{ display: 'inline-flex', flexShrink: 0, width: 30, height: 30, borderRadius: 10, background: isOpen ? 'var(--rose)' : 'var(--rose-light)', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronDown size={17} style={{ color: isOpen ? '#ffffff' : 'var(--rose)', transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                </span>
              </button>
            </h3>
            {/* Answers stay in the page for search engines; only the view collapses. */}
            <div hidden={!isOpen} style={{ paddingBottom: 20, fontSize: 16, lineHeight: 1.75, color: 'var(--text-2)' }}>{f.a}</div>
          </div>
        );
      })}
    </div>
  );
}

function CtaBand({ market, title, text }) {
  const p = `/${market.slug}`;
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--rose)', color: '#ffffff', paddingTop: 72, paddingBottom: 72 }}>
      <svg aria-hidden="true" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <circle cx="90" cy="40" r="140" fill="#ffffff" opacity="0.08" />
        <circle cx="1380" cy="300" r="180" fill="#ffffff" opacity="0.08" />
        <circle cx="1220" cy="60" r="34" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" />
      </svg>
      <div className="container-xl" style={{ position: 'relative', textAlign: 'center', maxWidth: 760 }}>
        <h2 style={{ color: '#ffffff', fontSize: 'clamp(26px, 3.4vw, 38px)', fontWeight: 900, letterSpacing: '-0.025em', textWrap: 'balance' }}>{title}</h2>
        <p style={{ fontSize: 17, marginTop: 10, color: 'rgba(255,255,255,0.92)' }}>{text}</p>
        <div className="tk-cta flex flex-wrap justify-center" style={{ gap: 12, marginTop: 26 }}>
          <Link to={`${p}/post-task`} className="btn-white btn-lg">Post a task</Link>
          <Link to={`${p}/tasks`} className="btn-lg" style={{ border: '2px solid rgba(255,255,255,0.85)', color: '#ffffff', borderRadius: 14, padding: '12px 24px', fontWeight: 800 }}>Browse tasks</Link>
        </div>
      </div>
    </section>
  );
}

/* Trust strip under the hero */
function TrustStrip({ market }) {
  const items = [
    [ShieldCheck, 'Verified local taskers'], [Check, 'Free to post, free to bid'],
    [CreditCard, `Pay in ${market.currency} into a secure hold`], [Clock, 'Bids often within hours'],
  ];
  return (
    <div style={{ background: '#ffffff', borderBottom: '1px solid var(--border-light)' }}>
       <ul className="container-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 12, paddingTop: 22, paddingBottom: 22 }}>
        {items.map(([Icon, t]) => (
          <li key={t} className="flex items-center justify-center" style={{ gap: 10, fontSize: 14, fontWeight: 700, color: 'var(--text-2)', textAlign: 'center' }}>
            <Icon size={18} style={{ color: 'var(--rose)', flexShrink: 0 }} /> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

const serviceBySlug = (c, slug) => c.services.find((s) => s.slug === slug);
const cityBySlug = (c, slug) => c.cities.find((s) => s.slug === slug);

/* ── Country home ────────────────────────────────────────────────── */

export function CountryHome({ market }) {
  const c = useCountryContent(market.slug);
  if (c === undefined) return <PageLoading />;
  if (!c) return <Navigate to="/" replace />;
  const p = `/${market.slug}`;
  const h = c.home;
  return (
    <>
      <CountrySEO market={market} title={h.metaTitle} description={h.metaDescription} path={p} alternatesPath="" faqs={h.faqs}
        breadcrumbs={[{ name: 'Taskeeu', path: '/' }, { name: c.name, path: p }]}
        extraLD={{ '@context': 'https://schema.org', '@type': 'Organization', name: `Taskeeu ${market.short}`, url: `https://taskeeu.com${p}`, logo: 'https://taskeeu.com/logo.svg', areaServed: c.name }} />
      <Hero market={market} eyebrow={`Taskeeu ${c.name}`} h1={h.h1} sub={h.subhead} />
      <TrustStrip market={market} />
      <Section><Prose paras={h.intro} /></Section>
      <Section tone="rose" kicker="How it works" title={`How Taskeeu works in ${c.name}`}><Steps steps={h.steps} /></Section>
      <Section kicker="Popular right now" title="Tasks people post every day">
        <LinkGrid links={h.popularTasks.map((t) => ({
          to: t.service ? `${p}/services/${t.service}` : `${p}/post-task`,
          label: t.name,
          note: t.service ? serviceBySlug(c, t.service)?.name : 'Post it free',
        }))} />
      </Section>
      <Section id="services" tone="surface" kicker="Services" title={`Services on Taskeeu ${market.short}`}>
        <LinkGrid links={c.services.map((s) => ({ to: `${p}/services/${s.slug}`, label: s.name }))} />
        <div style={{ marginTop: 20 }}>
          <Link to={`${p}/remote`} className="card card-hover flex items-center" style={{ padding: '22px 24px', gap: 18, background: '#12091a', borderColor: '#12091a' }}>
            <span style={{ display: 'inline-flex', flexShrink: 0, width: 52, height: 52, borderRadius: 16, background: 'var(--rose)', color: '#ffffff', alignItems: 'center', justifyContent: 'center' }}><Laptop size={24} /></span>
            <span style={{ flex: 1 }}><strong style={{ color: '#ffffff', fontSize: 17 }}>Remote and online tasks</strong><span style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 2 }}>Admin, research, writing, design and more, done from anywhere in {c.name}.</span></span>
            <ArrowRight size={18} style={{ color: '#ffffff' }} />
          </Link>
        </div>
      </Section>
      <Section kicker="Cities" title={`Find taskers near you in ${c.name}`}>
        <LinkGrid links={c.cities.map((ci) => ({ to: `${p}/${ci.slug}`, label: ci.name, note: ci.region, icon: MapPin }))} />
      </Section>
      <Section tone="rose" kicker="Why Taskeeu" title="Why people choose Taskeeu">
        <div className="grid gap-5 md:grid-cols-2">
          {h.whyTaskeeu.map((w, i) => {
            const Icon = [ShieldCheck, CreditCard, Star, MessageCircle][i % 4];
            return (
              <div key={w.title} className="card flex" style={{ padding: 26, gap: 16 }}>
                <span style={{ display: 'inline-flex', flexShrink: 0, width: 48, height: 48, borderRadius: 14, background: 'var(--rose)', color: '#ffffff', alignItems: 'center', justifyContent: 'center' }}><Icon size={22} /></span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{w.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', marginTop: 6 }}>{w.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card flex items-start" style={{ padding: 26, marginTop: 20, gap: 16, background: '#12091a', borderColor: '#12091a' }}>
          <ShieldCheck size={26} style={{ color: 'var(--rose)', flexShrink: 0 }} />
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.88)' }}>{h.safety}</p>
        </div>
      </Section>
      <Section kicker="Compare" title="How Taskeeu compares">
        <LinkGrid links={c.compare.map((x) => ({ to: `${p}/compare/${x.slug}`, label: `Taskeeu vs ${x.competitor}` }))} />
      </Section>
      <Section tone="surface" kicker="FAQs" title="Questions people ask"><FAQ faqs={h.faqs} /></Section>
      <CtaBand market={market} title="Have something on your to do list?" text="Post it in two minutes. Taskers near you bid, you choose." />
    </>
  );
}

/* ── Service page ────────────────────────────────────────────────── */

export function ServicePage({ market }) {
  const { service } = useParams();
  const c = useCountryContent(market.slug);
  if (c === undefined) return <PageLoading />;
  const p = `/${market.slug}`;
  const s = c && serviceBySlug(c, service);
  if (!s) return <Navigate to={p} replace />;
  const path = `${p}/services/${s.slug}`;
  const crumbs = [{ name: c.name, path: p }, { name: 'Services', path: `${p}#services` }, { name: s.name, path }];
  const others = c.services.filter((x) => x.slug !== s.slug);
  return (
    <>
      <CountrySEO market={market} title={s.metaTitle} description={s.metaDescription} path={path} faqs={s.faqs}
        breadcrumbs={[{ name: c.name, path: p }, { name: s.name, path }]}
        extraLD={{ '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: s.name, areaServed: c.name, provider: { '@type': 'Organization', name: 'Taskeeu', url: 'https://taskeeu.com' } }} />
      <Hero market={market} crumbs={crumbs} eyebrow={s.name} h1={s.h1} />
      <Section><Prose paras={s.intro} /></Section>
      <Section tone="rose" kicker="Typical jobs" title={`${s.name} jobs people post`}><CheckList items={s.typicalJobs} /></Section>
      <Section kicker="Before you post" title="Tips for a smooth job">
        <CheckList items={s.tips} columns={1} />
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-2)', margin: '26px auto 0', maxWidth: 760, textAlign: 'center' }}>{s.consider}</p>
      </Section>
      <Section tone="surface" kicker="Where" title={`${s.name} by city`}>
        <LinkGrid links={s.cities.map((slug) => cityBySlug(c, slug)).filter(Boolean).map((ci) => ({ to: `${p}/${ci.slug}`, label: `${s.name} in ${ci.name}`, note: ci.region }))} />
      </Section>
      <Section kicker="FAQs" title={`${s.name}: common questions`}><FAQ faqs={s.faqs} /></Section>
      <Section tone="surface" kicker="More services" title="Other things taskers can help with">
        <LinkGrid links={[...others.map((x) => ({ to: `${p}/services/${x.slug}`, label: x.name })), { to: `${p}/remote`, label: 'Remote tasks' }]} />
      </Section>
      <CtaBand market={market} title={`Need ${s.name.toLowerCase()}?`} text="Describe the job, set your budget and get bids from local taskers." />
    </>
  );
}

/* ── City page ───────────────────────────────────────────────────── */

export function CityPage({ market }) {
  const { city } = useParams();
  const c = useCountryContent(market.slug);
  if (c === undefined) return <PageLoading />;
  const p = `/${market.slug}`;
  const ci = c && cityBySlug(c, city);
  if (!ci) return <Navigate to={p} replace />;
  const path = `${p}/${ci.slug}`;
  const nearby = c.cities.filter((x) => x.slug !== ci.slug && x.region === ci.region).concat(c.cities.filter((x) => x.slug !== ci.slug && x.region !== ci.region)).slice(0, 8);
  return (
    <>
      <CountrySEO market={market} title={ci.metaTitle} description={ci.metaDescription} path={path} faqs={ci.faqs}
        breadcrumbs={[{ name: c.name, path: p }, { name: ci.name, path }]}
        extraLD={{ '@context': 'https://schema.org', '@type': 'Service', name: `Local taskers in ${ci.name}`, areaServed: { '@type': 'City', name: ci.name, containedInPlace: ci.region }, provider: { '@type': 'Organization', name: 'Taskeeu', url: 'https://taskeeu.com' } }} />
      <Hero market={market} crumbs={[{ name: c.name, path: p }, { name: ci.name, path }]} eyebrow={ci.region && ci.region !== ci.name ? `${ci.name}, ${ci.region}` : ci.name} h1={ci.h1} />
      <Section><Prose paras={ci.intro} /></Section>
      <Section tone="rose" kicker="Popular here" title={`Popular services in ${ci.name}`}>
        <LinkGrid links={ci.popularServices.map((slug) => serviceBySlug(c, slug)).filter(Boolean).map((s) => ({ to: `${p}/services/${s.slug}`, label: s.name }))} />
      </Section>
      <Section kicker="Areas" title={`Areas we cover in and around ${ci.name}`}>
        <ul className="flex flex-wrap justify-center" style={{ gap: 10, maxWidth: 940, margin: '0 auto' }}>
          {ci.neighbourhoods.map((n) => (
            <li key={n} className="flex items-center" style={{ gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--text-2)', background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 12, padding: '8px 14px' }}><MapPin size={14} style={{ color: 'var(--rose)' }} /> {n}</li>
          ))}
        </ul>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-2)', margin: '28px auto 0', maxWidth: 760, textAlign: 'center' }}>{ci.localNote}</p>
      </Section>
      <Section tone="surface" kicker="FAQs" title={`Taskeeu in ${ci.name}: questions`}><FAQ faqs={ci.faqs} /></Section>
      <Section kicker="Nearby" title="Other cities">
        <LinkGrid links={nearby.map((x) => ({ to: `${p}/${x.slug}`, label: x.name, note: x.region }))} />
      </Section>
      <CtaBand market={market} title={`Get it done in ${ci.name}`} text="Post a task free and hear from taskers near you." />
    </>
  );
}

/* ── Comparison page ─────────────────────────────────────────────── */

export function ComparePage({ market }) {
  const { slug } = useParams();
  const c = useCountryContent(market.slug);
  if (c === undefined) return <PageLoading />;
  const p = `/${market.slug}`;
  const x = c && c.compare.find((k) => k.slug === slug);
  if (!x) return <Navigate to={p} replace />;
  const path = `${p}/compare/${x.slug}`;
  return (
    <>
      <CountrySEO market={market} title={x.metaTitle} description={x.metaDescription} path={path} faqs={x.faqs}
        breadcrumbs={[{ name: c.name, path: p }, { name: `Taskeeu vs ${x.competitor}`, path }]} />
      <Hero market={market} crumbs={[{ name: c.name, path: p }, { name: `Taskeeu vs ${x.competitor}`, path }]} eyebrow="Comparison" h1={x.h1} />
      <Section><Prose paras={x.intro} /></Section>
      <Section tone="rose" kicker="Side by side" title={`Taskeeu and ${x.competitor} compared`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <thead>
              <tr style={{ background: 'var(--dark)', color: 'white', textAlign: 'left' }}>
                <th scope="col" style={{ color: 'white', padding: '14px 16px', fontSize: 13, width: '24%' }}>Feature</th>
                <th scope="col" style={{ color: 'white', padding: '14px 16px', fontSize: 13 }}>Taskeeu</th>
                <th scope="col" style={{ color: 'white', padding: '14px 16px', fontSize: 13 }}>{x.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {x.rows.map((r) => (
                <tr key={r.feature} style={{ borderTop: '1px solid var(--border-light)', verticalAlign: 'top' }}>
                  <th scope="row" style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: 'var(--text)', textAlign: 'left' }}>{r.feature}</th>
                  <td style={{ padding: '14px 16px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>{r.taskeeu}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>{r.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14, textAlign: 'center' }}>Competitor details checked {x.checked} from their public pages. Prices and terms can change, so confirm on their site before deciding.</p>
      </Section>
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card" style={{ padding: 26 }}>
            <h2 style={{ fontSize: 21, fontWeight: 900, color: 'var(--text)', marginBottom: 16 }}>When Taskeeu is the better fit</h2>
            <CheckList items={x.chooseTaskeeu} columns={1} />
          </div>
          <div className="card" style={{ padding: 26 }}>
            <h2 style={{ fontSize: 21, fontWeight: 900, color: 'var(--text)', marginBottom: 16 }}>When {x.competitor} may suit you</h2>
            <CheckList items={x.chooseThem} columns={1} />
          </div>
        </div>
        <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-2)', margin: '28px auto 0', maxWidth: 760, textAlign: 'center' }}>{x.cityNote}</p>
      </Section>
      <Section tone="surface" kicker="FAQs" title={`Taskeeu vs ${x.competitor}: questions`}><FAQ faqs={x.faqs} /></Section>
      <Section kicker="Other comparisons" title="Compare more options">
        <LinkGrid links={c.compare.filter((k) => k.slug !== x.slug).map((k) => ({ to: `${p}/compare/${k.slug}`, label: `Taskeeu vs ${k.competitor}` }))} />
        {x.sources?.length > 0 && (
          <div style={{ marginTop: 30, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
            <p style={{ fontWeight: 800, marginBottom: 6 }}>Sources</p>
            <ul>{x.sources.map((u) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer nofollow" style={{ color: 'var(--muted)', textDecoration: 'underline', wordBreak: 'break-all' }}>{u}</a></li>)}</ul>
          </div>
        )}
      </Section>
      <CtaBand market={market} title="Try Taskeeu for your next task" text="Posting is free and there is no fee to bid." />
    </>
  );
}

/* ── Remote tasks page ───────────────────────────────────────────── */

export function RemotePage({ market }) {
  const c = useCountryContent(market.slug);
  if (c === undefined) return <PageLoading />;
  if (!c) return <Navigate to="/" replace />;
  const p = `/${market.slug}`;
  const r = c.remote;
  const path = `${p}/remote`;
  return (
    <>
      <CountrySEO market={market} title={r.metaTitle} description={r.metaDescription} path={path} faqs={r.faqs}
        breadcrumbs={[{ name: c.name, path: p }, { name: 'Remote tasks', path }]} />
      <Hero market={market} crumbs={[{ name: c.name, path: p }, { name: 'Remote tasks', path }]} eyebrow="Remote and online" h1={r.h1}>
        <div style={{ marginTop: 22 }}>
          <Link to={`${p}/tasks?remote=1`} style={{ color: '#ffffff', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 }}>See open remote tasks in {c.name}</Link>
        </div>
      </Hero>
      <Section><Prose paras={r.intro} /></Section>
      <Section tone="rose" kicker="Typical jobs" title="Remote tasks people post"><CheckList items={r.typicalJobs} columns={3} /></Section>
      <Section kicker="How it works" title="How remote tasks work"><Steps steps={r.howItWorks} /></Section>
      <Section tone="surface" kicker="Tips" title="Get the best result"><CheckList items={r.tips} columns={1} /></Section>
      <Section kicker="FAQs" title="Remote tasks: questions"><FAQ faqs={r.faqs} /></Section>
      <Section tone="surface" kicker="In person" title="Need someone on site instead?">
        <LinkGrid links={c.services.map((s) => ({ to: `${p}/services/${s.slug}`, label: s.name }))} />
      </Section>
      <CtaBand market={market} title="Post a remote task" text="Tick the remote option when you post. No address needed." />
    </>
  );
}
