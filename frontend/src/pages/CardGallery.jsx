import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import CardCoverPreview from '../components/CardCoverPreview';
import { useSEO } from '../hooks/useSEO';
import { LEAVING_CARD_DESIGNS } from '../utils/leavingCardDesigns';
import { OCCASION_CARD_DESIGNS, OCCASION_FILTERS, getOccasionLabel } from '../utils/occasionCardDesigns';

const PAGE_SIZE = 12;

const LEAVING_DESIGNS = LEAVING_CARD_DESIGNS.map(design => ({
  ...design,
  occasion: 'leaving',
  ink: '#ffffff',
  accent: '#f6c453',
  soft: '#f5f0ff',
  dark: true,
  palette: ['#102a43', '#7c3aed', '#0f766e', '#be123c', '#ca8a04'],
}));

const ALL_DESIGNS = [...LEAVING_DESIGNS, ...OCCASION_CARD_DESIGNS];

const CardGallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedOccasion = searchParams.get('occasion') || 'all';
  const activeOccasion = OCCASION_FILTERS.some(item => item.id === requestedOccasion) ? requestedOccasion : 'all';
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useSEO({
    title: 'Choose an Online Group Card Design | Thankeeu',
    description: 'Browse A4 online group card covers for birthdays, leaving, retirement, weddings, thank you cards and more.',
    canonical: '/cards/create',
  });

  const filteredDesigns = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ALL_DESIGNS.filter(design => {
      const occasionMatches = activeOccasion === 'all' || design.occasion === activeOccasion;
      const textMatches = !needle || `${design.name} ${design.coverTitle || ''} ${getOccasionLabel(design.occasion)}`.toLowerCase().includes(needle);
      return occasionMatches && textMatches;
    });
  }, [activeOccasion, query]);

  const pageCount = Math.max(1, Math.ceil(filteredDesigns.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleDesigns = filteredDesigns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const chooseOccasion = occasion => {
    const next = new URLSearchParams(searchParams);
    if (occasion === 'all') next.delete('occasion');
    else next.set('occasion', occasion);
    setSearchParams(next);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#f8f7fb] text-warm-900">
      <Navbar />
      <main>
        <section className="border-b border-purple-100 bg-white">
          <div className="section-container py-10 sm:py-14">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-600">Create a group card</p>
              <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold leading-tight">Find the right card for the moment.</h1>
              <p className="mt-4 text-base sm:text-lg text-warm-500 max-w-2xl">Choose an occasion, pick a cover, then personalise every detail with a live preview.</p>
            </div>

            <div className="mt-7 max-w-xl relative">
              <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                value={query}
                onChange={event => { setQuery(event.target.value); setPage(1); }}
                placeholder="Search card designs"
                className="w-full h-12 rounded-xl border border-purple-100 bg-[#faf9fd] pl-11 pr-4 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50"
              />
            </div>
          </div>
        </section>

        <section className="section-container py-8 sm:py-10">
          <div className="flex gap-2 overflow-x-auto pb-3" aria-label="Filter card designs by occasion">
            {OCCASION_FILTERS.map(occasion => (
              <button
                key={occasion.id}
                type="button"
                onClick={() => chooseOccasion(occasion.id)}
                className={`h-10 flex-shrink-0 inline-flex items-center gap-2 px-4 rounded-xl border text-sm font-bold transition-colors ${activeOccasion === occasion.id ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-purple-100 text-warm-700 hover:border-primary-300'}`}
              >
                <Icon name={occasion.icon} size={15} />
                {occasion.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold">{activeOccasion === 'all' ? 'All card designs' : `${getOccasionLabel(activeOccasion)} cards`}</h2>
              <p className="mt-1 text-sm text-warm-500">{filteredDesigns.length} designs</p>
            </div>
          </div>

          {visibleDesigns.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {visibleDesigns.map(design => (
                <article key={design.id} className="group min-w-0">
                  <Link
                    to={`/card/customize?occasion=${encodeURIComponent(design.occasion)}&design=${encodeURIComponent(design.id)}&layout=album&source=card-gallery`}
                    className="block"
                    aria-label={`Use ${design.name}`}
                  >
                    <div className="relative transition-transform duration-200 group-hover:-translate-y-1">
                      <CardCoverPreview design={design} occasionLabel={getOccasionLabel(design.occasion)} compact />
                      {design.badge && <span className="absolute top-2 left-2 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-extrabold text-warm-800 shadow-sm">{design.badge}</span>}
                    </div>
                    <div className="pt-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-warm-900 truncate">{design.name}</h3>
                        <p className="mt-0.5 text-xs text-warm-500">{getOccasionLabel(design.occasion)}</p>
                      </div>
                      <span className="w-8 h-8 flex-shrink-0 rounded-lg border border-purple-100 bg-white flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        <Icon name="ArrowRight" size={15} />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 py-16 text-center border border-dashed border-purple-200 bg-white rounded-lg">
              <Icon name="Search" size={24} className="mx-auto text-warm-400" />
              <p className="mt-3 font-bold">No designs match that search.</p>
              <button type="button" onClick={() => setQuery('')} className="mt-3 text-sm font-bold text-primary-600">Clear search</button>
            </div>
          )}

          {pageCount > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Design pages">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage(value => Math.max(1, value - 1))} className="w-10 h-10 rounded-lg border border-purple-100 bg-white flex items-center justify-center disabled:opacity-40" aria-label="Previous page"><Icon name="ChevronLeft" size={17} /></button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => (
                <button key={number} type="button" onClick={() => setPage(number)} className={`w-10 h-10 rounded-lg text-sm font-bold ${currentPage === number ? 'bg-primary-500 text-white' : 'border border-purple-100 bg-white text-warm-700'}`}>{number}</button>
              ))}
              <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(value => Math.min(pageCount, value + 1))} className="w-10 h-10 rounded-lg border border-purple-100 bg-white flex items-center justify-center disabled:opacity-40" aria-label="Next page"><Icon name="ChevronRight" size={17} /></button>
            </nav>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CardGallery;
