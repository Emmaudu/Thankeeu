/**
 * Illustrated cover collection (299 finished SVG greeting-card covers).
 *
 * These covers are complete cards: each already carries its own headline and
 * tagline ("Happy birthday! · Make a wish (or three)"). They are therefore
 * flagged `finishedArt`, which tells CardCoverPreview not to paint a scrim,
 * occasion chip or default overlay text on top of the artwork (see
 * utils/coverLayout.js → normalizeCoverLayout(layout, design)).
 *
 * They are listed FIRST in every occasion — ahead of admin uploads and the
 * older catalogue — wherever covers are shown.
 *
 * Files: /public/cards/illustrated/<folder>/<stem>.svg (Nunito subset embedded,
 * so the lettering renders as designed inside <img>).
 */
import { ILLUSTRATED_COVER_ROWS } from './illustratedCoverRows';

const OCCASION_ICON = {
  birthday: 'Cake', leaving: 'Briefcase', retirement: 'Sun', anniversary: 'Gift',
  wedding: 'Diamond', christmas: 'Snowflake', congratulations: 'PartyPopper',
  get_well: 'HeartPulse', thank_you: 'Heart', sympathy: 'Flower', baby_shower: 'Baby',
  graduation: 'GraduationCap',
};

const DARK_INK = '#2E2459';   // the outline colour used throughout the artwork
const LIGHT_INK = '#FFFFFF';

export const ILLUSTRATED_CARD_DESIGNS = ILLUSTRATED_COVER_ROWS.map(
  ([folder, stem, occasion, group, headline, tagline, bg], index) => {
    const dark = bg.toUpperCase() === '#5A499C';
    const image = `/cards/illustrated/${folder}/${stem}.svg`;
    return {
      id: `illus-${folder}-${stem}`,
      occasion,
      sympathyGroup: group || undefined,
      collection: 'illustrated',
      finishedArt: true,
      name: headline,
      coverTitle: headline,
      coverSubtitle: tagline,
      alt: tagline ? `${headline} — ${tagline}` : headline,
      icon: OCCASION_ICON[occasion] || 'Sparkles',
      image,
      // Used by the board banner / album stage behind the card; the artwork
      // itself is always the <img>. A soft wash of the cover's own colour.
      background: dark
        ? `linear-gradient(145deg, ${bg} 0%, #3F3280 100%)`
        : `linear-gradient(145deg, ${bg} 0%, #FFFFFF 100%)`,
      coverBg: bg,
      ink: dark ? LIGHT_INK : DARK_INK,
      accent: '#7C3AED',
      soft: '#F5F0FF',
      palette: ['#7C3AED', bg, '#FFFFFF', DARK_INK],
      dark,
      badge: null,
      rank: index,
    };
  },
);

/**
 * Covers for one occasion, in curated order.
 *   group — sympathy only: 'colleague' | 'partner' | 'comfort' | 'pet'
 *   limit — number of covers to return
 */
export const getIllustratedCovers = (occasion, { group, limit } = {}) => {
  const list = ILLUSTRATED_CARD_DESIGNS.filter(
    (d) => d.occasion === occasion && (!group || d.sympathyGroup === group),
  );
  return typeof limit === 'number' ? list.slice(0, limit) : list;
};

/** The lead covers (first N) of several occasions interleaved — for mixed showcases. */
export const getIllustratedShowcase = (occasions, perOccasion = 2) => {
  const lists = occasions.map((o) => (typeof o === 'string'
    ? getIllustratedCovers(o, { limit: perOccasion })
    : getIllustratedCovers(o.occasion, { group: o.group, limit: perOccasion })));
  const out = [];
  for (let i = 0; i < perOccasion; i += 1) lists.forEach((l) => { if (l[i]) out.push(l[i]); });
  return out;
};

export const createIllustratedCardUrl = (design, source = 'illustrated-gallery') =>
  `/card/customize?occasion=${encodeURIComponent(design.occasion)}&design=${encodeURIComponent(design.id)}&layout=album&source=${encodeURIComponent(source)}`;

/** Pre-selected cover when a new card starts on the default (birthday) occasion. */
export const DEFAULT_ILLUSTRATED_DESIGN = getIllustratedCovers('birthday')[0];
