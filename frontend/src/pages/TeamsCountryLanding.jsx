/**
 * TeamsCountryLanding — Thankeeu for Teams pages for HR managers and
 * founders (data/teamsLandings). Two calls to action everywhere: book a demo
 * and create a free company account.
 *
 * Same design rules as the occasion pages: flat colours, no pills, no
 * emojis, homepage typography.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import HeroAlbumStack from '../components/HeroAlbumStack';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { usePricing, livePriceText } from '../utils/pricing';
import { loadFxRates, hasLiveRate, formatCurrency, formatLocalPrice } from '../utils/currency';
import { getIllustratedCovers, createIllustratedCardUrl } from '../utils/illustratedCardDesigns';
import { heroBackdrop } from '../data/occasionLandings/heroBackdrop';
import { teamsByKey, teamsHreflang, TEAMS_MANIFEST } from '../data/teamsLandings/manifest';
import {
  TEAMS_COUNTRY, TEAMS_RATE_NGN, TEAM_SIZES, HRIS, CTA, COMPETITORS, COMPARE_WITH, COMPARE_ROWS,
  TEAMS_BLOG, TEAMS_UI, occasionLinksFor,
} from '../data/teamsLandings/shared';
import { buildHeroAlbums, RichText, SectionHead } from './OccasionCountryLanding';
import NotFound from './NotFound';

const LOADERS = {
  us: () => import('../data/teamsLandings/pages/us.js'),
  uk: () => import('../data/teamsLandings/pages/uk.js'),
  canada: () => import('../data/teamsLandings/pages/canada.js'),
  germany: () => import('../data/teamsLandings/pages/germany.js'),
  mauritius: () => import('../data/teamsLandings/pages/mauritius.js'),
};

/** Money in the country's currency (live rate), from an NGN amount. */
function useMoney(country) {
  usePricing();
  const meta = TEAMS_COUNTRY[country];
  const [ready, setReady] = useState(meta.chargeable || hasLiveRate(meta.currency));
  useEffect(() => {
    if (meta.chargeable) return undefined;
    let alive = true;
    loadFxRates().then(() => { if (alive) setReady(hasLiveRate(meta.currency)); });
    return () => { alive = false; };
  }, [meta.chargeable, meta.currency]);
  const cur = ready ? meta.currency : 'USD';
  return { cur, fmt: (ngn) => formatLocalPrice(ngn, cur), usd: (ngn) => formatCurrency(ngn, 'USD') };
}

const COVER_MIX = [['birthday', 2], ['leaving', 2], ['congratulations', 2], ['thank_you', 2], ['retirement', 1], ['baby_shower', 1], ['get_well', 1], ['wedding', 1]];

function Body({ page }) {
  const ui = TEAMS_UI[page.lang] || TEAMS_UI.en;
  const meta = TEAMS_COUNTRY[page.country];
  const money = useMoney(page.country);
  const rate = money.fmt(TEAMS_RATE_NGN);
  const albums = useMemo(() => buildHeroAlbums(page, CTA.signup), [page]);
  const covers = useMemo(() => COVER_MIX.flatMap(([o, n]) => getIllustratedCovers(o, { limit: n })), []);
  const faqs = page.faqs.map(f => ({ q: livePriceText(f.q), a: livePriceText(f.a) }));
  const [openFaq, setOpenFaq] = useState(0);
  const others = COMPARE_WITH[page.country].map(k => COMPETITORS[k]);
  const sameCountry = [
    ...TEAMS_MANIFEST.filter(m => m.country === page.country && m.key !== page.key).map(m => [m.path, m.anchor]),
    ...occasionLinksFor(page.country),
  ];
  const otherCountries = TEAMS_MANIFEST.filter(m => m.variant === page.variant && m.key !== page.key).map(m => [m.path, m.anchor]);

  useSEO({
    title: page.title,
    description: page.description,
    canonical: page.path,
    keywords: page.keywords,
    locale: page.lang === 'en' ? meta.locale : meta.localLocale,
    lang: page.lang,
    alternates: teamsHreflang(page),
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.softwareApp,
      SCHEMAS.breadcrumb([{ name: 'Thankeeu', url: '/' }, { name: page.breadcrumb, url: page.path }]),
      SCHEMAS.webPage(page.title, page.description, page.path, { inLanguage: page.lang }),
      SCHEMAS.faqPage(faqs.map(f => ({ q: f.q, a: f.a.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') }))),
    ],
  });

  const ourCell = (row) => (row === 'price' ? ui.us.price(rate) : ui.us[row]);
  const cell = (v) => {
    if (v === true) return <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><Icon name="Check" size={14} />{ui.cells.yes}</span>;
    if (v === false) return <span className="text-warm-400">{ui.cells.no}</span>;
    if (ui.cells[v]) return <span className={v === 'notListed' ? 'text-warm-400' : 'text-warm-600'}>{ui.cells[v]}</span>;
    return <span className="text-warm-600">{v}</span>;
  };

  const Ctas = ({ light = false }) => (
    <div className="flex flex-wrap gap-3">
      <Link to={CTA.demo} className={`inline-flex max-w-full items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-bold ${light ? 'bg-white text-primary-700 hover:bg-purple-50' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
        <Icon name="Calendar" size={18} />{ui.demo}
      </Link>
      <Link to={CTA.signup} className={`inline-flex max-w-full items-center gap-2 rounded-2xl border-2 px-6 py-3.5 text-base font-bold ${light ? 'border-white/70 text-white hover:bg-white/10' : 'border-purple-200 bg-white text-primary-700 hover:border-primary-400'}`}>
        <Icon name="Building2" size={18} />{ui.signup}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FFFDF8]" lang={page.lang}>
      <Navbar />

      <header className="border-b border-purple-100" style={heroBackdrop(page)}>
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:pt-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-warm-400">
            <Link to="/" className="hover:text-primary-600">{ui.home}</Link>
            <span> / </span><span className="text-warm-500" aria-current="page">{page.breadcrumb}</span>
          </nav>
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-primary-700" style={{ overflowWrap: 'anywhere' }}>{page.tagline}</p>
              <h1 className="font-extrabold text-warm-900" style={{ fontSize: Math.max(...page.h1.split(/\s+/).map(w => w.length)) > 18 ? 'clamp(1.45rem,4.4vw,3.15rem)' : 'clamp(2rem,4.4vw,3.15rem)', lineHeight: 1.08, letterSpacing: '-0.02em', overflowWrap: 'anywhere', hyphens: 'auto', WebkitHyphens: 'auto' }}>{page.h1}</h1>
              <p className="mt-4 max-w-xl text-warm-600" style={{ fontSize: 'clamp(1rem,2vw,1.12rem)', lineHeight: 1.55 }}><RichText text={page.subtitle} /></p>
              <div className="mt-7"><Ctas /></div>
              <p className="mt-4 text-sm font-semibold text-warm-500">{ui.trust}</p>
            </div>
            <div className="mx-auto w-full max-w-[560px]">
              <HeroAlbumStack plain albums={albums} />
            </div>
          </div>
        </div>
      </header>

      {/* Proof strip */}
      <section className="border-b border-purple-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-px bg-purple-100 sm:grid-cols-2 lg:grid-cols-4">
          {page.proof.map(([t, b]) => (
            <div key={t} className="bg-white px-5 py-6">
              <p className="font-extrabold text-warm-900">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-warm-500">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The problem */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead title={page.problemTitle} intro={page.problemIntro} />
        <div className="grid gap-5 md:grid-cols-3">
          {page.problems.map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-purple-100 bg-white p-6">
              <h3 className="font-extrabold text-warm-900">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-500"><RichText text={b} /></p>
            </div>
          ))}
        </div>
      </section>

      {/* Automations */}
      <section className="border-y border-purple-100 bg-[#F8F6FF]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="mb-2 text-center text-sm font-bold uppercase tracking-[0.14em] text-primary-700">{ui.automationsKicker}</p>
          <SectionHead title={page.automationTitle} intro={page.automationIntro} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.automations.map(([icon, t, b]) => (
              <div key={t} className="rounded-2xl border border-purple-100 bg-white p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon name={icon} size={20} /></span>
                <h3 className="mt-4 font-extrabold text-warm-900">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-500"><RichText text={b} /></p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-purple-100 bg-white p-6 text-center">
            <p className="font-extrabold text-warm-900">{ui.integrations}</p>
            <p className="mt-3 text-sm leading-relaxed text-warm-600">{HRIS.join(', ')}, {ui.integrationsNote}</p>
            {page.integrationsIntro && <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-warm-500"><RichText text={page.integrationsIntro} /></p>}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead title={page.featuresTitle} intro={page.featuresIntro} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {page.features.map(([icon, t, b]) => (
            <div key={t} className="rounded-2xl border border-purple-100 bg-white p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon name={icon} size={20} /></span>
              <h3 className="mt-4 font-extrabold text-warm-900">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-500"><RichText text={b} /></p>
            </div>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section className="border-y border-purple-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHead title={ui.cardsTitle} />
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {covers.slice(0, 12).map(d => (
              <li key={d.id}>
                <Link to={createIllustratedCardUrl(d, `teams-${page.path.slice(1)}`)} className="block overflow-hidden rounded-xl border border-purple-100 bg-white shadow-sm hover:shadow-md" title={d.name}>
                  <img src={d.image} alt={`${String(d.alt || d.name).replace(/\s—\s/g, ', ')}, team card cover`} width="210" height="297" loading="lazy" decoding="async" className="block aspect-[210/297] w-full object-cover" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Country article */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        {page.sections.map(sec => (
          <article key={sec.h2} className="mb-12 last:mb-0">
            <h2 className="font-bold text-warm-900" style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', lineHeight: 1.2 }}>{sec.h2}</h2>
            {sec.paragraphs.map((t, i) => <p key={i} className="mt-4 text-base leading-relaxed text-warm-600"><RichText text={t} /></p>)}
            {sec.items?.length > 0 && (
              <ul className="mt-5 space-y-3">
                {sec.items.map(([t, b]) => (
                  <li key={t} className="flex gap-3 text-base leading-relaxed text-warm-600">
                    <Icon name="Check" size={18} className="mt-1 flex-shrink-0 text-emerald-600" />
                    <span><strong className="text-warm-900">{t}.</strong> <RichText text={b} /></span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      {/* Rollout */}
      <section className="border-y border-purple-100 bg-[#F8F6FF]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHead title={page.rolloutTitle} />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {page.rollout.map(([t, b], i) => (
              <li key={t} className="rounded-2xl border border-purple-100 bg-white p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-extrabold text-white">{i + 1}</span>
                <h3 className="mt-4 font-extrabold text-warm-900">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-500"><RichText text={b} /></p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <SectionHead title={ui.pricingTitle(meta.short)} intro={page.pricingIntro} />
        <div className="grid gap-5 md:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border-2 border-primary-500 bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary-700">{ui.standardRate}</p>
              <p className="mt-2 text-4xl font-extrabold text-warm-900">{rate}</p>
              <p className="text-sm text-warm-500">{ui.perEmployee}</p>
              <p className="mt-3 text-sm font-semibold text-emerald-700">{ui.yearlyNote}</p>
              <Link to={CTA.demo} className="mt-5 inline-flex items-center gap-2 font-bold text-primary-700 underline underline-offset-2">{ui.quote}</Link>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-white p-6">
              <p className="font-extrabold text-warm-900">{ui.freeTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-warm-500">{ui.freeText}</p>
              <Link to={CTA.signup} className="mt-4 inline-flex items-center gap-2 font-bold text-primary-700 underline underline-offset-2">{ui.signup}</Link>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-purple-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-100 bg-[#F8F6FF] text-left text-xs uppercase tracking-wide text-warm-500">
                  {ui.sizesCols.map(c => <th key={c} className="px-4 py-3 font-bold">{c}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {TEAM_SIZES.map(n => (
                  <tr key={n}>
                    <td className="px-4 py-3 font-semibold text-warm-800">{ui.employees(n)}</td>
                    <td className="px-4 py-3 text-warm-900">{money.fmt(TEAMS_RATE_NGN * n)}</td>
                    <td className="px-4 py-3 font-bold text-warm-900">{money.fmt(TEAMS_RATE_NGN * n * 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-purple-50 px-4 py-3 text-xs leading-relaxed text-warm-500">
              {meta.chargeable ? ui.live(money.cur) : ui.approx(money.cur)} {ui.pricingFoot}
            </p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y border-purple-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHead title={ui.compareTitle} intro={page.comparisonIntro} />
          <div className="overflow-x-auto rounded-2xl border border-purple-100 bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-purple-100 bg-[#F8F6FF] text-left text-xs uppercase tracking-wide text-warm-500">
                  <th className="px-4 py-3 font-bold">{ui.feature}</th>
                  <th className="px-4 py-3 font-bold text-primary-700">Thankeeu for Teams</th>
                  {others.map(c => <th key={c.name} className="px-4 py-3 font-bold">{c.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {COMPARE_ROWS.map(row => (
                  <tr key={row}>
                    <td className="px-4 py-3 font-semibold text-warm-800">{ui.rows[row]}</td>
                    <td className="bg-[#FAF8FF] px-4 py-3 font-semibold text-warm-900">{ourCell(row)}</td>
                    {others.map(c => <td key={c.name} className="px-4 py-3">{cell(c[row])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-purple-50 px-4 py-3 text-xs leading-relaxed text-warm-400">{ui.compareNote}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <SectionHead title={ui.faqTitle} />
        <div className="divide-y divide-purple-100 rounded-2xl border border-purple-100 bg-white">
          {faqs.map((f, i) => (
            <div key={f.q}>
              <h3>
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-warm-900" style={{ minHeight: 0 }}>
                  <span>{f.q}</span>
                  <Icon name={openFaq === i ? 'Minus' : 'Plus'} size={18} className="flex-shrink-0 text-primary-600" />
                </button>
              </h3>
              <div className={openFaq === i ? 'px-5 pb-5' : 'hidden'}>
                <p className="text-base leading-relaxed text-warm-600"><RichText text={f.a} /></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="border-t border-purple-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {[[ui.linksTitle(meta.short), sameCountry], [ui.otherCountries, otherCountries], [ui.guides, TEAMS_BLOG]].map(([title, list]) => (
            <nav key={title} aria-label={title}>
              <h2 className="mb-3 text-lg font-extrabold text-warm-900">{title}</h2>
              <ul className="space-y-2 text-sm">
                {list.map(([href, label]) => <li key={href}><Link to={href} className="text-primary-700 hover:underline">{label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
      </section>

      <section className="bg-primary-700">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-extrabold text-white" style={{ fontSize: 'clamp(1.85rem,5.5vw,2.75rem)' }}>{page.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-purple-100">{page.ctaText}</p>
          <div className="mt-7 flex justify-center"><Ctas light /></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function TeamsCountryLanding({ pageKey }) {
  const m = teamsByKey[pageKey];
  const [page, setPage] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    setPage(null); setMissing(false);
    if (!m) { setMissing(true); return undefined; }
    LOADERS[m.country]().then(mod => {
      if (!alive) return;
      const p = (mod.default || []).find(x => x.key === pageKey);
      if (p) setPage({ ...m, ...p }); else setMissing(true);
    }).catch(() => { if (alive) setMissing(true); });
    window.scrollTo?.(0, 0);
    return () => { alive = false; };
  }, [pageKey, m]);
  if (missing) return <NotFound />;
  if (!page) return <div className="min-h-screen bg-[#FFFDF8]"><Navbar /></div>;
  return <Body page={page} />;
}
