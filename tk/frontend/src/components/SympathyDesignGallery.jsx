import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './ui/Icon';
import CardCoverPreview from './CardCoverPreview';
import { CARD_DESIGNS } from '../utils/cardDesigns';

const PAGE_SIZE = 10;

/**
 * SympathyDesignGallery
 *
 * Pulls the TOP sympathy cover designs straight from the shared design library
 * (any design tagged `occasion: 'sympathy'`), so whenever more sympathy designs
 * are added anywhere in the app, this gallery — and the pet-loss page that uses
 * it — updates automatically with zero extra work.
 *
 * Selecting a cover opens the album customiser with the sympathy occasion, the
 * chosen design, and the album layout preselected.
 *
 * Props:
 *   limit        max designs to include (default: all sympathy designs)
 *   recipient    name shown on the preview covers (e.g. "Bella")
 *   title        cover title (e.g. "Forever in our hearts")
 *   source       analytics/source tag appended to the customize URL
 */
export const getSympathyDesigns = (limit) => {
  const designs = CARD_DESIGNS.filter(d => d.occasion === 'sympathy');
  return typeof limit === 'number' ? designs.slice(0, limit) : designs;
};

export const createSympathyCardUrl = (designId, source = 'pet-loss-gallery') =>
  `/card/customize?occasion=sympathy&design=${encodeURIComponent(designId)}&layout=album&source=${encodeURIComponent(source)}`;

export default function SympathyDesignGallery({
  designs: suppliedDesigns,
  limit,
  recipient = 'Bella',
  title = 'Forever in our hearts',
  sender = 'Everyone who loved them',
  source = 'pet-loss-gallery',
  eyebrow = 'Pet memorial cover designs',
  heading = 'Choose a cover that honours their memory',
  description = 'Every design is soft, warm and made for a beloved companion. Pick one and everyone can add their message, photo and favourite memory.',
  background = '#ffffff',
  id = 'designs',
}) {
  const designs = useMemo(
    () => suppliedDesigns || getSympathyDesigns(limit),
    [suppliedDesigns, limit],
  );
  const [page, setPage] = useState(1);
  const sectionRef = useRef(null);
  const pageCount = Math.max(1, Math.ceil(designs.length / PAGE_SIZE));
  const visible = useMemo(() => designs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [designs, page]);

  useEffect(() => { setPage(1); }, [designs.length]);

  const changePage = (next) => {
    setPage(Math.min(pageCount, Math.max(1, next)));
    requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  if (designs.length === 0) return null;

  return (
    <section ref={sectionRef} id={id} className="scroll-mt-20 px-4 py-16 sm:py-20" style={{ background }}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-600 mb-3">
            <Icon name="Flower" size={15} />
            {eyebrow}
          </div>
          <h2 className="font-extrabold text-warm-900 leading-tight" style={{ fontSize: 'clamp(1.9rem,5vw,3rem)' }}>{heading}</h2>
          {description && <p className="text-warm-500 mt-4 leading-relaxed">{description}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {visible.map(design => (
            <article key={design.id} className="group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl">
              <Link to={createSympathyCardUrl(design.id, source)} className="block h-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200" aria-label={`Choose ${design.name}`}>
                <div className="relative">
                  <CardCoverPreview design={design} occasionLabel="In loving memory" recipientName={recipient} title={title} senderName={sender} compact />
                  {design.badge && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-extrabold text-primary-700 shadow-sm backdrop-blur">
                      <Icon name={design.badge === 'New' ? 'Sparkles' : 'Star'} size={11} />
                      {design.badge}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-extrabold leading-tight text-warm-900">{design.name}</h3>
                  <span className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white transition-colors group-hover:bg-primary-700">
                    Use this cover
                    <Icon name="ArrowRight" size={13} />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {pageCount > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3" aria-label="Cover design pages">
            <button type="button" onClick={() => changePage(page - 1)} disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-100 bg-white px-4 py-2.5 text-sm font-bold text-warm-600 transition-colors hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40">
              <Icon name="ChevronLeft" size={16} /> Previous 10
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
              <button key={n} type="button" onClick={() => changePage(n)} aria-current={n === page ? 'page' : undefined}
                className={`h-10 min-w-10 rounded-xl px-3 text-sm font-extrabold transition-colors ${n === page ? 'bg-primary-600 text-white shadow-md' : 'bg-purple-50 text-warm-600 hover:bg-primary-50'}`}>
                {n}
              </button>
            ))}
            <button type="button" onClick={() => changePage(page + 1)} disabled={page === pageCount}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-100 bg-white px-4 py-2.5 text-sm font-bold text-warm-600 transition-colors hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40">
              Next 10 <Icon name="ChevronRight" size={16} />
            </button>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to={createSympathyCardUrl(designs[0].id, source)} className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:bg-primary-700">
            <Icon name="Heart" size={17} /> Create a pet memorial card — free
          </Link>
        </div>
      </div>
    </section>
  );
}
