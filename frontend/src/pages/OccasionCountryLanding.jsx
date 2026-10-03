/**
 * OccasionCountryLanding — the occasion × country landing pages
 * (data/occasionLandings). One template, eighty pages, each with its own
 * copy, hero flipbooks, FAQs and links.
 *
 * Design rules for these pages: flat colours (no gradients), no emojis, no
 * dashes in copy.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import HeroAlbumStack from '../components/HeroAlbumStack';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { usePricing, priceNGN, priceUSD, livePriceText, formatPrice, planCredits } from '../utils/pricing';
import { loadFxRates, hasLiveRate, formatCurrency, formatLocalPrice } from '../utils/currency';
import { getIllustratedCovers, createIllustratedCardUrl } from '../utils/illustratedCardDesigns';
import { manifestByKey, hreflangCluster } from '../data/occasionLandings/manifest';
import { loadLandingPage, landingLinks } from '../data/occasionLandings';
import {
  COUNTRY_META, coverPlanFor, COMPARISON, UI, ALBUM_LABELS, HERO_PHOTOS, HERO_GIFS, HERO_ACCENTS, SIGNER_TINTS,
} from '../data/occasionLandings/shared';
import { OCCASION_LABELS } from '../data/countryLandings';
import NotFound from './NotFound';
import { heroBackdrop } from '../data/occasionLandings/heroBackdrop';

const FONTS = ['font-dancing', 'font-vibes', 'font-sacramento', 'font-dancing'];
const SIZES = { 'font-dancing': 20, 'font-vibes': 24, 'font-sacramento': 25 };
const PRICE_ROWS = ['card_fee', 'standard', 'pack5', 'pack10', 'pack25', 'pack50', 'pack100'];
const ALBUM_IDS = ['jane', 'sarah', 'jackson'];

const initials = (name) => String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// [text](/path) → a link; everything else stays text.
export function RichText({ text }) {
  const parts = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let last = 0; let m;
  const src = livePriceText(text);
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push(src.slice(last, m.index));
    parts.push(<Link key={m.index} to={m[2]} className="font-semibold text-primary-700 underline underline-offset-2">{m[1]}</Link>);
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push(src.slice(last));
  return <>{parts}</>;
}

/** Page data → the three album configs HeroAlbumStack expects. */
export function buildHeroAlbums(page, ctaTo) {
  const labels = ALBUM_LABELS[page.lang] || ALBUM_LABELS.en;
  return page.heroAlbums.slice(0, 3).map((a, ai) => {
    const [occ, stem] = a.cover.split('/');
    const covers = getIllustratedCovers(occ);
    const design = covers.find(d => d.id.endsWith(`-${stem}`)) || covers[0];
    return {
      id: ALBUM_IDS[ai],
      recipient: a.recipient,
      occasion: a.label,
      coverTitle: a.label,
      accent: HERO_ACCENTS[ai % HERO_ACCENTS.length],
      design,
      ctaTo,
      labels,
      lang: page.lang,
      gift: a.gift ? { amount: a.gift.amount, currency: '', claimLine: a.gift.claimLine } : null,
      signers: a.signers.map((s, si) => {
        const font = FONTS[(si + ai) % FONTS.length];
        const media = s.media.kind === 'photo' ? { kind: 'photo', src: HERO_PHOTOS[s.media.photo] || HERO_PHOTOS.team, caption: s.media.caption || '' }
          : s.media.kind === 'voice' ? { kind: 'voice', length: s.media.length || 10, line: s.media.line, gif: HERO_GIFS[s.media.gif] || HERO_GIFS.love }
            : { kind: 'gif', src: HERO_GIFS[s.media.gif] || HERO_GIFS.party };
        return {
          name: s.name, role: s.role, text: s.text, media, font, size: SIZES[font],
          initials: initials(s.name), tint: SIGNER_TINTS[(si + ai * 2) % SIGNER_TINTS.length], reactions: 5 + ((si * 7 + ai * 3) % 14),
        };
      }),
    };
  });
}

/** Twelve sample covers: six from the occasion, six from other categories. */
export function landingCovers(m) {
  const plan = coverPlanFor(m);
  const lead = getIllustratedCovers(plan.lead, { limit: 6 }).map(d => ({ design: d, occasion: plan.lead }));
  const others = plan.others.map(o => ({ design: getIllustratedCovers(o, { limit: 1 })[0], occasion: o })).filter(x => x.design);
  return [...lead, ...others].slice(0, 12);
}

function PricingTable({ m, ui }) {
  usePricing();
  const meta = COUNTRY_META[m.country];
  const [ratesReady, setRatesReady] = useState(meta.chargeable || hasLiveRate(meta.currency));
  useEffect(() => {
    if (meta.chargeable) return undefined;
    let alive = true;
    loadFxRates().then(() => { if (alive) setRatesReady(hasLiveRate(meta.currency)); });
    return () => { alive = false; };
  }, [meta.chargeable, meta.currency]);
  const cur = meta.currency;
  const showLocal = cur !== 'USD' && ratesReady;
  const local = (ngn) => (meta.chargeable && cur !== 'USD' && !/^\$/.test(formatPrice(ngn, cur)) ? formatPrice(ngn, cur) : formatLocalPrice(ngn, cur));
  const usd = (v) => `$${v.toFixed(2)}`;
  return (
    <div className="overflow-x-auto rounded-2xl border border-purple-100 bg-white">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-purple-100 bg-[#F8F6FF] text-left text-xs uppercase tracking-wide text-warm-500">
            <th className="px-4 py-3 font-bold">{ui.pricingCols[0]}</th>
            <th className="px-4 py-3 font-bold">{ui.pricingCols[1]}</th>
            <th className="px-4 py-3 font-bold">{ui.pricingCols[2]}</th>
            <th className="px-4 py-3 font-bold">{ui.pricingCols[3]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-50">
          <tr>
            <td className="px-4 py-3 font-semibold text-warm-800" colSpan={2}>{ui.freeRow}</td>
            <td className="px-4 py-3 font-extrabold text-emerald-700" colSpan={2}>{ui.free}</td>
          </tr>
          {PRICE_ROWS.map(id => {
            const credits = planCredits(id);
            const totalUsd = priceUSD(id);
            const per = totalUsd / credits;
            const ngn = priceNGN(id);
            return (
              <tr key={id}>
                <td className="px-4 py-3 font-semibold text-warm-800">{ui.plans[id]}</td>
                <td className="px-4 py-3 text-warm-600">{credits}</td>
                <td className="px-4 py-3">
                  <span className="font-extrabold text-warm-900">{showLocal ? local(ngn) : usd(totalUsd)}</span>
                  {showLocal && <span className="ml-1.5 text-xs text-warm-400">{usd(totalUsd)}</span>}
                </td>
                <td className="px-4 py-3 text-warm-600">{showLocal ? local(ngn / credits) : usd(per)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-purple-50 px-4 py-3 text-xs leading-relaxed text-warm-500">
        {meta.chargeable ? ui.charged(cur) : ui.approx(cur)} {ui.pricingFoot}
      </p>
    </div>
  );
}

function ComparisonTable({ ui }) {
  usePricing();
  const cell = (v) => {
    if (v === true) return <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><Icon name="Check" size={14} />{ui.cells.yes}</span>;
    if (v === false) return <span className="text-warm-400">{ui.cells.no}</span>;
    if (ui.cells[v]) return <span className={v === 'notListed' ? 'text-warm-400' : 'text-warm-600'}>{ui.cells[v]}</span>;
    return <span className="text-warm-600">{v}</span>;
  };
  const thankeeu = {
    price: `${livePriceText('$3.15')}`,
    packPrice: `$${(priceUSD('pack5') / 5).toFixed(2)}`,
    unlimited: true, video: 'thankeeuVideo', voice: 'thankeeuVoice', cashGift: 'thankeeuGift',
    movie: 'thankeeuMovie', wall: 'thankeeuWall', expiry: 'never',
  };
  return (
    <div className="overflow-x-auto rounded-2xl border border-purple-100 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-purple-100 bg-[#F8F6FF] text-left text-xs uppercase tracking-wide text-warm-500">
            <th className="px-4 py-3 font-bold">{ui.compareFeature}</th>
            {COMPARISON.columns.map((c, i) => <th key={c} className={`px-4 py-3 font-bold ${i === 0 ? 'text-primary-700' : ''}`}>{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-50">
          {COMPARISON.rows.map(([row, others]) => (
            <tr key={row}>
              <td className="px-4 py-3 font-semibold text-warm-800">{ui.rows[row]}</td>
              <td className="bg-[#FAF8FF] px-4 py-3 font-semibold text-warm-900">{cell(thankeeu[row])}</td>
              <td className="px-4 py-3">{cell(others.kudoboard)}</td>
              <td className="px-4 py-3">{cell(others.thankbox)}</td>
              <td className="px-4 py-3">{cell(others.groupgreeting)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-purple-50 px-4 py-3 text-xs leading-relaxed text-warm-400">{ui.compareNote}</p>
    </div>
  );
}

export const SectionHead = ({ title, intro, center = true }) => (
  <div className={`mb-8 ${center ? 'text-center' : ''}`}>
    <h2 className="font-bold text-warm-900" style={{ fontSize: 'clamp(1.85rem,5.5vw,2.75rem)', lineHeight: 1.15 }}>{title}</h2>
    {intro && <p className={`mt-3 text-base leading-relaxed text-warm-500 ${center ? 'mx-auto max-w-2xl' : ''}`}><RichText text={intro} /></p>}
  </div>
);

function LandingBody({ page }) {
  usePricing();
  const ui = UI[page.lang] || UI.en;
  const meta = COUNTRY_META[page.country];
  const plan = coverPlanFor(page);
  const source = `landing-${page.path.slice(1)}`;
  const ctaTo = `/card/new?occasion=${plan.createOccasion}`;
  const albums = useMemo(() => buildHeroAlbums(page, ctaTo), [page, ctaTo]);
  const covers = useMemo(() => landingCovers(page), [page]);
  const links = landingLinks(page);
  const faqs = page.faqs.map(f => ({ q: livePriceText(f.q), a: livePriceText(f.a) }));
  const [openFaq, setOpenFaq] = useState(0);

  useSEO({
    title: page.title,
    description: page.description,
    canonical: page.path,
    keywords: page.keywords,
    locale: page.lang === 'en' ? meta.locale : meta.localLocale,
    lang: page.lang,
    alternates: hreflangCluster(page),
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.softwareApp,
      SCHEMAS.breadcrumb([{ name: 'Thankeeu', url: '/' }, { name: page.breadcrumb, url: page.path }]),
      SCHEMAS.webPage(page.title, page.description, page.path, { inLanguage: page.lang }),
      SCHEMAS.faqPage(faqs.map(f => ({ q: f.q, a: f.a.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') }))),
    ],
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FFFDF8]" lang={page.lang}>
      <Navbar />

      {/* Hero */}
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
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={ctaTo} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-primary-700">
                  <Icon name="Sparkles" size={18} />{ui.create}
                </Link>
                <Link to="/sample" className="inline-flex items-center gap-2 rounded-2xl border-2 border-purple-200 bg-white px-6 py-3.5 text-base font-bold text-primary-700 hover:border-primary-400">
                  <Icon name="Eye" size={18} />{ui.demo}
                </Link>
              </div>
              <p className="mt-4 text-sm font-semibold text-warm-500">{livePriceText(ui.freeLine)}</p>
              {ui.langNote && <p className="mt-3 max-w-xl text-xs leading-relaxed text-warm-400">{ui.langNote}</p>}
            </div>
            <div className="mx-auto w-full max-w-[560px]">
              <HeroAlbumStack plain albums={albums} />
            </div>
          </div>
        </div>
      </header>

      {/* Highlights */}
      <section className="border-b border-purple-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-px bg-purple-100 sm:grid-cols-2 lg:grid-cols-4">
          {page.highlights.map(([t, b]) => (
            <div key={t} className="bg-white px-5 py-6">
              <p className="font-extrabold text-warm-900">{livePriceText(t)}</p>
              <p className="mt-1 text-sm leading-relaxed text-warm-500">{livePriceText(b)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample covers */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead title={page.coversTitle} intro={page.coversIntro} />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {covers.map(({ design, occasion }) => (
            <li key={design.id}>
              <Link to={createIllustratedCardUrl(design, source)} className="group block" title={`${design.name}, ${(OCCASION_LABELS[occasion] || occasion).toLowerCase()} card`}>
                <div className="overflow-hidden rounded-xl border border-purple-100 bg-white shadow-sm transition group-hover:shadow-md">
                  <img src={design.image} alt={`${String(design.alt || design.name).replace(/\s—\s/g, ', ')}, ${(OCCASION_LABELS[occasion] || occasion).toLowerCase()} group card cover`} decoding="async" width="210" height="297" loading="lazy" className="block aspect-[210/297] w-full object-cover" />
                </div>
                <p className="mt-2 truncate text-xs font-bold text-warm-700">{design.name}</p>
                <p className="text-[11px] text-warm-400">{OCCASION_LABELS[occasion] || occasion}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-warm-500">
          {ui.coversHint}{' '}
          <Link to={`/cards/create?occasion=${plan.lead}`} className="font-bold text-primary-700 underline underline-offset-2">{ui.seeAll}</Link>
        </p>
      </section>

      {/* Steps */}
      <section className="border-y border-purple-100 bg-[#F8F6FF]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHead title={page.stepsTitle} />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {page.steps.map(([t, b], i) => (
              <li key={t} className="rounded-2xl border border-purple-100 bg-white p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-extrabold text-white">{i + 1}</span>
                <h3 className="mt-4 font-extrabold text-warm-900">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-500"><RichText text={b} /></p>
              </li>
            ))}
          </ol>
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

      {/* Article */}
      <section className="border-y border-purple-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
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
        </div>
      </section>

      {/* Message ideas */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHead title={page.messagesTitle} intro={page.messagesIntro} />
        <div className="grid gap-4 sm:grid-cols-2">
          {page.messages.map(t => (
            <blockquote key={t} className="rounded-2xl border border-purple-100 bg-white p-5 text-base leading-relaxed text-warm-700">
              <Icon name="Quote" size={16} className="mb-2 text-primary-400" />
              {t}
            </blockquote>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link to={ctaTo} className="font-bold text-primary-700 underline underline-offset-2">{ui.messagesCta}</Link>
        </p>
      </section>

      {/* Pricing */}
      <section className="border-y border-purple-100 bg-[#F8F6FF]">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <SectionHead title={ui.pricingTitle(meta.short)} intro={page.pricingIntro} />
          <PricingTable m={page} ui={ui} />
          <p className="mt-4 text-center text-sm"><Link to="/pricing" className="font-bold text-primary-700 underline underline-offset-2">{ui.fullPricing}</Link></p>
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <SectionHead title={ui.compareTitle} intro={page.comparisonIntro} />
        <ComparisonTable ui={ui} />
      </section>

      {/* FAQ */}
      <section className="border-y border-purple-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <SectionHead title={ui.faqTitle} />
          <div className="divide-y divide-purple-100 rounded-2xl border border-purple-100">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <h3>
                  <button type="button" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-warm-900" style={{ minHeight: 0 }}>
                    <span>{f.q}</span>
                    <Icon name={openFaq === i ? 'Minus' : 'Plus'} size={18} className="flex-shrink-0 text-primary-600" />
                  </button>
                </h3>
                {/* Answers stay in the page (hidden, not removed) so search engines read them. */}
                <div className={openFaq === i ? 'px-5 pb-5' : 'hidden'}>
                  <p className="text-base leading-relaxed text-warm-600"><RichText text={f.a} /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <nav aria-label={ui.linksTitle(meta.short)}>
            <h2 className="mb-3 text-lg font-extrabold text-warm-900">{ui.linksTitle(meta.short)}</h2>
            <ul className="space-y-2 text-sm">
              {links.sameCountry.map(([href, label]) => <li key={href}><Link to={href} className="text-primary-700 hover:underline">{label}</Link></li>)}
            </ul>
          </nav>
          <nav aria-label={ui.otherCountries}>
            <h2 className="mb-3 text-lg font-extrabold text-warm-900">{ui.otherCountries}</h2>
            <ul className="space-y-2 text-sm">
              {links.otherCountries.map(([href, label]) => <li key={href}><Link to={href} className="text-primary-700 hover:underline">{label}</Link></li>)}
            </ul>
          </nav>
          <nav aria-label={ui.guides}>
            <h2 className="mb-3 text-lg font-extrabold text-warm-900">{ui.guides}</h2>
            <ul className="space-y-2 text-sm">
              {links.guides.map(([href, label]) => <li key={href}><Link to={href} className="text-primary-700 hover:underline">{label}</Link></li>)}
            </ul>
            <h2 className="mb-3 mt-6 text-lg font-extrabold text-warm-900">{ui.alsoSee}</h2>
            <ul className="space-y-2 text-sm">
              {links.core.map(([href, label]) => <li key={href}><Link to={href} className="text-primary-700 hover:underline">{label}</Link></li>)}
            </ul>
          </nav>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="bg-primary-700">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-extrabold text-white" style={{ fontSize: 'clamp(1.7rem,5vw,2.5rem)' }}>{page.ctaTitle}</h2>
          <p className="mt-3 text-lg text-purple-100">{livePriceText(page.ctaText)}</p>
          <Link to={ctaTo} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-bold text-primary-700 hover:bg-purple-50">
            <Icon name="Sparkles" size={18} />{ui.create}
          </Link>
          <p className="mt-4 text-sm text-purple-200">{livePriceText(ui.freeLine)}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function OccasionCountryLanding({ pageKey }) {
  const [page, setPage] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let alive = true;
    setPage(null); setMissing(false);
    loadLandingPage(pageKey).then(p => { if (!alive) return; if (p) setPage(p); else setMissing(true); })
      .catch(() => { if (alive) setMissing(true); });
    window.scrollTo?.(0, 0);
    return () => { alive = false; };
  }, [pageKey]);
  if (missing || !manifestByKey[pageKey]) return <NotFound />;
  if (!page) return <div className="min-h-screen bg-[#FFFDF8]"><Navbar /></div>;
  return <LandingBody page={page} />;
}
