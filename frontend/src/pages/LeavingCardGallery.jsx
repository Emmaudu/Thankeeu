import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import { useSEO, SCHEMAS } from '../hooks/useSEO';
import { LEAVING_CARD_DESIGNS, createLeavingCardUrl } from '../utils/leavingCardDesigns';
import { FAREWELL_PRIORITY_DESIGNS } from '../utils/priorityCardDesigns';

const PAGE_SIZE = 10;
const ALL_LEAVING_DESIGNS = [...FAREWELL_PRIORITY_DESIGNS, ...LEAVING_CARD_DESIGNS];

export default function LeavingCardGallery() {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(ALL_LEAVING_DESIGNS.length / PAGE_SIZE);
  const visibleDesigns = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return ALL_LEAVING_DESIGNS.slice(start, start + PAGE_SIZE);
  }, [page]);

  useSEO({
    title: 'Leaving Card Design Gallery | Thankeeu',
    description: 'Browse leaving card, farewell card and retirement card designs. Choose a design and create an album-style group card everyone can sign.',
    canonical: '/cards/leaving-card/gallery',
    jsonLd: [
      SCHEMAS.organization,
      SCHEMAS.breadcrumb([
        { name: 'Home', url: '/' },
        { name: 'Leaving Cards', url: '/cards/leaving-card' },
        { name: 'Design Gallery', url: '/cards/leaving-card/gallery' },
      ]),
      SCHEMAS.webPage('Leaving Card Design Gallery', 'Browse leaving card designs and start an album-style group card.', '/cards/leaving-card/gallery'),
    ],
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="px-4 pt-12 pb-10" style={{ background: 'linear-gradient(180deg,#F5F0FF 0%,#fff 100%)' }}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_420px] gap-10 items-center">
            <div>
              <Link to="/cards/leaving-card" className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 mb-5">
                <Icon name="ArrowLeft" size={16} /> Back to leaving cards
              </Link>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold mb-5"
                style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                <Icon name="Images" size={16} /> Leaving card catalogue
              </div>
              <h1 className="font-extrabold text-warm-900 leading-tight mb-4"
                style={{ fontSize: 'clamp(2.2rem,6vw,4.25rem)' }}>
                Choose a card design, then build the album.
              </h1>
              <p className="text-warm-600 text-lg sm:text-xl leading-relaxed max-w-2xl mb-7">
                Pick the leaving, farewell, or retirement design that fits the person. Your selection opens a flipbook-style card flow where the team adds pages, photos, voice notes, GIFs, and a gift collection from one link.
              </p>
              <div className="flex flex-wrap gap-3 text-sm font-semibold text-warm-500">
                <span className="inline-flex items-center gap-1.5"><Icon name="Check" size={15} className="text-green-500" /> Album layout preselected</span>
                <span className="inline-flex items-center gap-1.5"><Icon name="Check" size={15} className="text-green-500" /> Free to start</span>
                <span className="inline-flex items-center gap-1.5"><Icon name="Check" size={15} className="text-green-500" /> No account needed to sign</span>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-3 gap-3 items-center">
              {ALL_LEAVING_DESIGNS.slice(0, 6).map((design, index) => (
                <div key={design.id} className="rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white"
                  style={{ transform: `translateY(${index % 2 ? 20 : 0}px) rotate(${index % 2 ? 2 : -2}deg)` }}>
                  <img src={design.image} alt="" className="w-full aspect-[3/4] object-cover" loading="eager" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-warm-900">Leave and retirement card designs</h2>
                <p className="text-warm-500 mt-2">Rows, columns, and pagination for fast browsing.</p>
              </div>
              <div className="text-sm font-bold text-warm-400">
                Showing {visibleDesigns.length} of {ALL_LEAVING_DESIGNS.length}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {visibleDesigns.map(design => (
                <article key={design.id} className="rounded-lg border border-purple-100 bg-white shadow-sm overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all">
                  <Link to={createLeavingCardUrl(design.id)} className="block group">
                    <div className="relative bg-warm-100">
                      <img src={design.image} alt={`${design.name} leaving card design`} className="w-full aspect-[3/4] object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-extrabold text-white bg-primary-600 shadow-sm">
                        {design.badge}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-extrabold text-warm-900 text-sm sm:text-base leading-tight">{design.name}</h3>
                      <p className="text-xs text-warm-400 mt-1">{design.style}</p>
                      <span className="mt-3 inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary-600 px-3 py-2.5 text-xs sm:text-sm font-bold text-white group-hover:bg-primary-700 transition-colors">
                        Select to create card <Icon name="ArrowRight" size={15} />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-100 px-4 py-2 text-sm font-bold text-warm-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary-200 hover:bg-primary-50 transition-colors"
              >
                <Icon name="ChevronLeft" size={16} /> Previous
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-extrabold transition-colors ${page === n ? 'bg-primary-600 text-white' : 'bg-purple-50 text-warm-600 hover:bg-primary-50'}`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-100 px-4 py-2 text-sm font-bold text-warm-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary-200 hover:bg-primary-50 transition-colors"
              >
                Next <Icon name="ChevronRight" size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
