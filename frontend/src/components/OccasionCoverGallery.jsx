import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Icon from './ui/Icon';
import { cardsAPI } from '../utils/api';
import { CARD_DESIGNS } from '../utils/cardDesigns';

/**
 * OccasionCoverGallery — shows the latest top 10 cover designs for one
 * occasion, sourced live from:
 *   1. Admin-uploaded designs (Cover Design tab), newest first
 *   2. The built-in static design catalogue, filling any remaining slots
 * A design uploaded via the admin dashboard appears here immediately —
 * no code change, no redeploy. This is the same merge order used on the
 * card-creation design picker, so what a visitor sees here is exactly
 * what they'll see when they go to build the card.
 */
export default function OccasionCoverGallery({
  cardOccasion,     // occasion id used when creating the card, e.g. 'leaving'
  coverOccasion,    // occasion id to fetch/filter covers by (defaults to cardOccasion)
  eyebrow = 'Latest cover designs',
  title = 'Choose a cover that feels right',
  description,
  background = '#ffffff',
}) {
  const occasionForCovers = coverOccasion || cardOccasion;
  const [covers, setCovers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    cardsAPI.getCoverDesigns(occasionForCovers)
      .then(r => {
        if (cancelled) return;
        const adminRows = (r.data?.designs || []).map(row => ({
          id: `admin-${row.id}`,
          name: row.name || 'Cover design',
          image: row.image_url,
          isNew: true,
        }));
        const staticRows = CARD_DESIGNS
          .filter(d => d.image && d.occasion === occasionForCovers)
          .map(d => ({ id: d.id, name: d.name, image: d.image, isNew: false }));
        setCovers([...adminRows, ...staticRows].slice(0, 10));
      })
      .catch(() => {
        if (cancelled) return;
        // Never let this section break the page — fall back to static-only.
        const staticRows = CARD_DESIGNS
          .filter(d => d.image && d.occasion === occasionForCovers)
          .map(d => ({ id: d.id, name: d.name, image: d.image, isNew: false }));
        setCovers(staticRows.slice(0, 10));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [occasionForCovers]);

  const coverUrl = designId =>
    `/card/new?occasion=${encodeURIComponent(cardOccasion)}&design=${encodeURIComponent(designId)}`;

  return (
    <section className="px-4 py-16 sm:py-20" style={{ background }}>
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

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-purple-100 bg-purple-50 animate-pulse" style={{ aspectRatio: '210/297' }} />
            ))}
          </div>
        ) : covers.length === 0 ? (
          <div className="text-center py-12 text-warm-400 text-sm">
            New covers for this occasion are on the way — <Link to="/card/new" className="text-primary-600 font-bold underline">start your card</Link> to browse the full catalogue.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {covers.map(design => (
              <article
                key={design.id}
                className="group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl"
              >
                <Link
                  to={coverUrl(design.id)}
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
                      <Icon name={design.isNew ? 'Sparkles' : 'Star'} size={11} />
                      {design.isNew ? 'New' : 'Featured'}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-extrabold leading-tight text-warm-900 truncate">{design.name}</h3>
                    <span className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white transition-colors group-hover:bg-primary-700">
                      Use this cover
                      <Icon name="ArrowRight" size={13} />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
