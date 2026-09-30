import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import CardCoverPreview from '../components/CardCoverPreview';
import { useSEO } from '../hooks/useSEO';
import { LEAVING_CARD_DESIGNS } from '../utils/leavingCardDesigns';
import { OCCASION_CARD_DESIGNS, OCCASION_FILTERS, getOccasionLabel } from '../utils/occasionCardDesigns';
import { PRIORITY_CARD_DESIGNS } from '../utils/priorityCardDesigns';
import { ILLUSTRATED_CARD_DESIGNS } from '../utils/illustratedCardDesigns';

// Compact pager: 1 … 4 5 6 … 43. Rendering all 40+ page numbers made the
// row far wider than a phone screen (the whole page scrolled sideways).
export const pageList = (current, count) => {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i + 1);
  const pages = new Set([1, count, current - 1, current, current + 1]);
  const sorted = [...pages].filter(n => n >= 1 && n <= count).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => { if (i && n - sorted[i - 1] > 1) out.push('…'); out.push(n); });
  return out;
};

const PAGE_SIZE = 16;

const LEAVING_DESIGNS = LEAVING_CARD_DESIGNS.map(design => ({
  ...design,
  occasion: 'leaving',
  ink: '#ffffff',
  accent: '#f6c453',
  soft: '#f5f0ff',
  dark: true,
  palette: ['#102a43', '#7c3aed', '#0f766e', '#be123c', '#ca8a04'],
}));

const OLDER_DESIGNS = [...PRIORITY_CARD_DESIGNS, ...LEAVING_DESIGNS, ...OCCASION_CARD_DESIGNS];
const ALL_DESIGNS = [...ILLUSTRATED_CARD_DESIGNS, ...OLDER_DESIGNS];

// "All designs" view: the illustrated collection round-robin across occasions
// (birthday, leaving, thank you, …) so the first page shows the whole range.
const ILLUSTRATED_MIXED = (() => {
  const byOccasion = ILLUSTRATED_CARD_DESIGNS.reduce((m, d) => ((m[d.occasion] ||= []).push(d), m), {});
  const lists = Object.values(byOccasion);
  const out = [];
  for (let i = 0; out.length < ILLUSTRATED_CARD_DESIGNS.length; i += 1) lists.forEach(l => { if (l[i]) out.push(l[i]); });
  return out;
})();

const CardGallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedOccasion = searchParams.get('occasion') || 'all';
  const activeOccasion = OCCASION_FILTERS.some(item => item.id === requestedOccasion) ? requestedOccasion : 'all';
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const resultsRef = useRef(null);

  useSEO({
    title: 'Browse Online Group Card Designs | Thankeeu',
    description: 'Browse 100+ online group card designs for birthdays, leaving, retirement, weddings, thank you cards and more. Pick a design and start collecting messages in seconds.',
    canonical: '/cards/create',
    keywords: 'group card designs, online card designs, birthday card designs, leaving card designs, retirement card designs',
  });

  const occasionCounts = useMemo(() => ALL_DESIGNS.reduce((counts, design) => ({
    ...counts,
    [design.occasion]: (counts[design.occasion] || 0) + 1,
  }), {}), []);

  const filteredDesigns = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = ALL_DESIGNS.filter(design => {
      const occasionMatches = activeOccasion === 'all' || design.occasion === activeOccasion;
      const haystack = `${design.name} ${design.coverTitle || ''} ${design.coverSubtitle || ''} ${getOccasionLabel(design.occasion)}`.toLowerCase();
      return occasionMatches && (!needle || haystack.includes(needle));
    });

    if (sort === 'name') return [...matches].sort((a, b) => a.name.localeCompare(b.name));
    // The illustrated collection is the newest, so it stays on top for "newest" too.
    const isNew = d => d.collection === 'illustrated';
    if (sort === 'newest') return [...matches.filter(isNew), ...matches.filter(d => !isNew(d)).reverse()];
    if (activeOccasion === 'all' && !needle) {
      const shown = new Set(matches.map(d => d.id));
      return [...ILLUSTRATED_MIXED.filter(d => shown.has(d.id)), ...matches.filter(d => !isNew(d))];
    }
    return matches;
  }, [activeOccasion, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredDesigns.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleDesigns = filteredDesigns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  // Change page and bring the top of the results back into view — otherwise a
  // phone user taps "next" at the bottom and stays looking at the pager.
  const goToPage = (n) => {
    setPage(Math.min(pageCount, Math.max(1, n)));
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chooseOccasion = occasion => {
    const next = new URLSearchParams(searchParams);
    if (occasion === 'all') next.delete('occasion');
    else next.set('occasion', occasion);
    setSearchParams(next);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-warm-900">
      <Navbar />
      <main>
        <section className="border-b border-purple-100 bg-white">
          <div className="section-container py-8 sm:py-10">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-600">Card design library</p>
            <div className="mt-2 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">Choose a cover they will want to keep.</h1>
                <p className="mt-3 text-sm text-warm-500 sm:text-base">Browse by occasion, choose an A4 cover, then personalise the complete album in real time.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-warm-500">
                <Icon name="LayoutGrid" size={15} /> {ALL_DESIGNS.length} A4 designs
              </div>
            </div>
          </div>
        </section>

        <section className="section-container py-7 sm:py-9">
          <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px] lg:ml-[268px]">
            <label className="relative block">
              <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-400" />
              <input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search designs, occasions or styles" className="h-12 w-full rounded-lg border border-purple-100 bg-white pl-11 pr-4 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50" />
            </label>
            <select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }} className="h-12 rounded-lg border border-purple-100 bg-white px-4 text-sm font-bold text-warm-700 outline-none focus:border-primary-400" aria-label="Sort card designs">
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          <div className="mb-5 lg:hidden">
            <select value={activeOccasion} onChange={event => chooseOccasion(event.target.value)} className="h-12 w-full rounded-lg border border-purple-100 bg-white px-4 text-sm font-bold text-warm-700">
              {OCCASION_FILTERS.map(occasion => <option key={occasion.id} value={occasion.id}>{occasion.label}</option>)}
            </select>
          </div>

          <div className="grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="sticky top-24 hidden max-h-[calc(100vh-120px)] overflow-y-auto rounded-lg border border-purple-100 bg-white p-3 lg:block" aria-label="Card occasions">
              <p className="px-3 pb-3 pt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-warm-400">Browse occasions</p>
              <nav className="space-y-1">
                {OCCASION_FILTERS.map(occasion => {
                  const count = occasion.id === 'all' ? ALL_DESIGNS.length : (occasionCounts[occasion.id] || 0);
                  return (
                    <button key={occasion.id} type="button" onClick={() => chooseOccasion(occasion.id)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${activeOccasion === occasion.id ? 'bg-primary-500 text-white' : 'text-warm-700 hover:bg-primary-50 hover:text-primary-700'}`}>
                      <Icon name={occasion.icon} size={16} />
                      <span className="min-w-0 flex-1 truncate font-bold">{occasion.label}</span>
                      <span className={`text-[10px] font-extrabold ${activeOccasion === occasion.id ? 'text-white/70' : 'text-warm-400'}`}>{count}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="min-w-0">
              <div ref={resultsRef} className="flex items-end justify-between gap-4" style={{ scrollMarginTop: 88 }}>
                <div>
                  <p className="text-xs font-bold text-primary-600">{activeOccasion === 'all' ? 'Every occasion' : getOccasionLabel(activeOccasion)}</p>
                  <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">{activeOccasion === 'all' ? 'All card covers' : `${getOccasionLabel(activeOccasion)} card covers`}</h2>
                </div>
                <p className="flex-shrink-0 text-xs font-bold text-warm-400">{filteredDesigns.length} results</p>
              </div>

              {visibleDesigns.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 xl:grid-cols-4">
                  {visibleDesigns.map(design => (
                    <article key={design.id} className="group min-w-0">
                      <Link to={`/card/customize?occasion=${encodeURIComponent(design.occasion)}&design=${encodeURIComponent(design.id)}&layout=album&source=card-gallery`} className="block" aria-label={`Choose ${design.name}`}>
                        <div className="relative overflow-hidden rounded-md border border-black/5 bg-white transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_18px_38px_rgba(31,23,62,0.16)]">
                          <CardCoverPreview design={design} occasionLabel={getOccasionLabel(design.occasion)} compact />
                          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                            <span className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary-500 px-3 text-xs font-extrabold text-white shadow-lg">Choose cover <Icon name="ArrowRight" size={14} /></span>
                          </div>
                          {design.badge && <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-extrabold text-warm-800 shadow-sm">{design.badge}</span>}
                        </div>
                        <h3 className="mt-3 truncate text-sm font-bold text-warm-900">{design.name}</h3>
                        <p className="mt-0.5 text-xs text-warm-500">{getOccasionLabel(design.occasion)}</p>
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-lg border border-dashed border-purple-200 bg-white py-16 text-center">
                  <Icon name="Search" size={24} className="mx-auto text-warm-400" />
                  <p className="mt-3 font-bold">No designs match that search.</p>
                  <button type="button" onClick={() => setQuery('')} className="mt-3 text-sm font-bold text-primary-600">Clear search</button>
                </div>
              )}

              {pageCount > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2" aria-label="Design pages">
                  <button type="button" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-purple-100 bg-white disabled:opacity-40" aria-label="Previous page"><Icon name="ChevronLeft" size={17} /></button>
                  {pageList(currentPage, pageCount).map((item, i) => (item === '…'
                    ? <span key={`gap-${i}`} className="w-6 flex-shrink-0 text-center text-sm font-bold text-warm-400" aria-hidden="true">…</span>
                    : <button key={item} type="button" onClick={() => goToPage(item)} aria-label={`Page ${item}`} aria-current={currentPage === item ? 'page' : undefined} className={`h-10 min-w-10 flex-shrink-0 rounded-md px-2 text-sm font-bold ${currentPage === item ? 'bg-primary-500 text-white' : 'border border-purple-100 bg-white text-warm-700'}`}>{item}</button>))}
                  <button type="button" disabled={currentPage === pageCount} onClick={() => goToPage(currentPage + 1)} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-purple-100 bg-white disabled:opacity-40" aria-label="Next page"><Icon name="ChevronRight" size={17} /></button>
                </nav>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CardGallery;
