import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './ui/Icon';
import { createPriorityCardUrl } from '../utils/priorityCardDesigns';

const PAGE_SIZE = 10;

export default function PriorityDesignGallery({
  designs,
  occasion,
  eyebrow = 'Featured cover designs',
  title = 'Choose the cover that feels like them',
  description,
  background = '#ffffff',
  id = 'designs',
}) {
  const [page, setPage] = useState(1);
  const sectionRef = useRef(null);
  const pageCount = Math.max(1, Math.ceil(designs.length / PAGE_SIZE));
  const visibleDesigns = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return designs.slice(start, start + PAGE_SIZE);
  }, [designs, page]);

  useEffect(() => {
    setPage(1);
  }, [designs]);

  const changePage = nextPage => {
    setPage(Math.min(pageCount, Math.max(1, nextPage)));
    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <section ref={sectionRef} id={id} className="scroll-mt-20 px-4 py-16 sm:py-20" style={{ background }}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-600 mb-3">
            <Icon name="Images" size={15} />
            {eyebrow}
          </div>
          <h2 className="font-extrabold text-warm-900 leading-tight" style={{ fontSize: 'clamp(1.9rem,5vw,3rem)' }}>
            {title}
          </h2>
          {description && <p className="text-warm-500 mt-4 leading-relaxed">{description}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {visibleDesigns.map(design => (
            <article
              key={design.id}
              className="group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl"
            >
              <Link
                to={createPriorityCardUrl(occasion, design.id)}
                className="block h-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200"
                aria-label={`Choose ${design.name}`}
              >
                <div className="relative overflow-hidden bg-purple-50">
                  <img
                    src={design.image}
                    alt={`${design.name} cover design`}
                    className="w-full aspect-[210/297] object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                    loading="lazy"
                  />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-extrabold text-primary-700 shadow-sm backdrop-blur">
                    <Icon name={design.badge === 'New' ? 'Sparkles' : 'Star'} size={11} />
                    {design.badge}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-extrabold leading-tight text-warm-900">{design.name}</h3>
                  <p className="mt-1 text-[11px] text-warm-400">{design.style}</p>
                  <span className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white transition-colors group-hover:bg-primary-700">
                    Use this cover
                    <Icon name="ArrowRight" size={13} />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3" aria-label="Cover design pages">
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-100 bg-white px-4 py-2.5 text-sm font-bold text-warm-600 transition-colors hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="ChevronLeft" size={16} />
            Previous 10
          </button>

          {Array.from({ length: pageCount }, (_, index) => index + 1).map(pageNumber => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => changePage(pageNumber)}
              aria-current={pageNumber === page ? 'page' : undefined}
              aria-label={`Show cover designs page ${pageNumber}`}
              className={`h-10 min-w-10 rounded-xl px-3 text-sm font-extrabold transition-colors ${
                pageNumber === page
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-purple-50 text-warm-600 hover:bg-primary-50'
              }`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={page === pageCount}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-100 bg-white px-4 py-2.5 text-sm font-bold text-warm-600 transition-colors hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next 10
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>

        <p className="mt-4 text-center text-xs font-semibold text-warm-400">
          Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, designs.length)} of {designs.length} premium covers
        </p>
      </div>
    </section>
  );
}
