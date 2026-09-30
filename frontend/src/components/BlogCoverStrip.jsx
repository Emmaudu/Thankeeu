import { Link } from 'react-router-dom';
import Icon from './ui/Icon';
import { createIllustratedCardUrl } from '../utils/illustratedCardDesigns';

/**
 * Four matching card covers inside a blog post, each opening the card studio
 * with that cover selected. Rendered between article sections (outside the
 * .prose-blog styles, so post typography never restyles it).
 *
 *   covers — result of coversForBlogPost(post)
 *   slug   — post slug, recorded as the ?source= of each link
 */
export default function BlogCoverStrip({ covers, slug }) {
  if (!covers?.designs?.length) return null;
  const { designs, label, href, rule } = covers;
  const generic = rule === 'group-cards';
  const heading = generic ? 'Start a group card everyone signs' : `Send a group ${label} card`;
  const source = `blog-${slug || 'post'}`.slice(0, 80);
  // Pet covers live on the pet-loss page; every other set is the library filtered to its occasion.
  const seeAllUrl = generic ? '/cards/create'
    : rule === 'pet' ? '/cards/pet-loss-card#designs'
    : `/cards/create?occasion=${encodeURIComponent(designs[0].occasion)}`;

  return (
    <aside
      aria-label={generic ? 'Group card covers' : `${label} card covers`}
      className="my-10 rounded-3xl border border-purple-100 p-5 sm:p-6"
      style={{ background: 'linear-gradient(160deg,#F7F3FF 0%,#FFFFFF 70%)' }}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary-600">New card covers</p>
          <p className="mt-1 text-lg sm:text-xl font-extrabold leading-tight text-warm-900">{heading}</p>
        </div>
        <Link to={seeAllUrl} className="text-sm font-bold text-primary-600 hover:text-primary-700">
          {generic ? 'See all covers'
            : designs[0].occasion === 'congratulations' ? 'See all congratulations covers'
            : `See all ${label} covers`} →
        </Link>
      </div>

      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4 sm:gap-4">
        {designs.map((design) => (
          <li key={design.id} className="m-0 p-0">
            <Link
              to={createIllustratedCardUrl(design, source)}
              className="group block overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg"
              title={`Use the “${design.name}” cover`}
            >
              <img
                src={design.image}
                alt={`${design.alt} — group ${generic ? '' : `${label} `}card cover`}
                loading="lazy"
                decoding="async"
                className="block w-full aspect-[210/297] object-cover"
              />
              <span className="flex items-center justify-center gap-1 px-2 py-2 text-xs font-bold text-primary-700 group-hover:text-primary-800">
                Use this cover <Icon name="ArrowRight" size={12} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-warm-500">
        Free to start · everyone signs from one link · messages, photos, voice notes and an optional group gift.
        {!generic && href && (
          <> {' '}<Link to={href} className="font-semibold text-primary-600 hover:underline">More about {label} cards</Link></>
        )}
      </p>
    </aside>
  );
}
