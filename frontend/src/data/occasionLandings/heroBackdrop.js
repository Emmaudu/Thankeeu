/**
 * Hero backgrounds for the landing pages: a soft flat colour per country and
 * a hand drawn pattern per occasion, tinted with the country's accent. Two
 * variants of the same page get a different tile arrangement, so no two
 * pages share the exact same header. Flat colours only, no gradients.
 */

const COUNTRY_STYLE = {
  uk:          { bg: '#FBF4EA', ink: '#B4533A' },
  us:          { bg: '#F1F5FC', ink: '#2F5BA8' },
  canada:      { bg: '#FCF1EF', ink: '#C0392B' },
  germany:     { bg: '#F5F3EC', ink: '#8A6D1F' },
  netherlands: { bg: '#FDF2E7', ink: '#D2691E' },
  colombia:    { bg: '#FDF8E4', ink: '#B8860B' },
  mauritius:   { bg: '#EBF7F4', ink: '#1B8A78' },
  philippines: { bg: '#EFF3FC', ink: '#3456B3' },
  australia:   { bg: '#FBF3E8', ink: '#B5652B' },
  france:      { bg: '#F1F3FB', ink: '#3B4CA0' },
};

// Thankeeu for Teams pages: their own, slightly cooler colours per country
// and variant, so the B2B pages never look like the occasion pages.
const TEAMS_STYLE = {
  us:        { a: { bg: '#EEF2FB', ink: '#3A57A5' }, b: { bg: '#F7F1E8', ink: '#9A5B2E' } },
  uk:        { a: { bg: '#F0F3F8', ink: '#2E4A7A' }, b: { bg: '#F8F0F0', ink: '#9C3B3B' } },
  canada:    { a: { bg: '#F6EEEE', ink: '#A33A32' }, b: { bg: '#EEF4F1', ink: '#2F7A5B' } },
  germany:   { a: { bg: '#F1F1EC', ink: '#5B5A3A' }, b: { bg: '#F3EFF8', ink: '#5A3F8C' } },
  mauritius: { a: { bg: '#E9F5F3', ink: '#17796A' }, b: { bg: '#F8F3E6', ink: '#A77A1C' } },
};

// Small motifs, drawn in a 0 0 24 24 box.
const M = {
  plane: '<path d="M2 12 22 3 15 21 11 13Z" fill="none" stroke-width="1.6" stroke-linejoin="round"/><path d="M11 13 22 3" fill="none" stroke-width="1.6"/>',
  dash: '<path d="M2 18c5-8 12-10 20-8" fill="none" stroke-width="1.6" stroke-dasharray="2.5 3" stroke-linecap="round"/>',
  confetti: '<rect x="6" y="8" width="5" height="10" rx="1.2" transform="rotate(25 8 13)"/>',
  dot: '<circle cx="12" cy="12" r="3.2"/>',
  ring: '<circle cx="12" cy="12" r="6.5" fill="none" stroke-width="1.8"/>',
  tri: '<path d="M12 5 19 18H5Z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
  star: '<path d="M12 3.5l2.4 5.6 6.1.5-4.6 4 1.4 6-5.3-3.2-5.3 3.2 1.4-6-4.6-4 6.1-.5Z"/>',
  cloud: '<path d="M7 17h10.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1.3A4.2 4.2 0 0 0 7 17Z" fill="none" stroke-width="1.6"/>',
  sparkle: '<path d="M12 3c.8 4.3 2.7 6.2 7 7-4.3.8-6.2 2.7-7 7-.8-4.3-2.7-6.2-7-7 4.3-.8 6.2-2.7 7-7Z"/>',
  envelope: '<rect x="3.5" y="6.5" width="17" height="12" rx="1.5" fill="none" stroke-width="1.6"/><path d="m4 7.5 8 6 8-6" fill="none" stroke-width="1.6"/>',
  rings: '<circle cx="9.5" cy="13" r="5" fill="none" stroke-width="1.6"/><circle cx="14.5" cy="13" r="5" fill="none" stroke-width="1.6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  balloon: '<ellipse cx="12" cy="9.5" rx="5.2" ry="6.3"/><path d="M12 16v6" fill="none" stroke-width="1.2"/>',
};

const SETS = {
  group:       ['envelope', 'heart', 'star', 'dot', 'sparkle', 'confetti'],
  farewell:    ['plane', 'dash', 'star', 'dot', 'cloud', 'sparkle'],
  birthday:    ['confetti', 'balloon', 'tri', 'dot', 'sparkle', 'ring'],
  babyshower:  ['cloud', 'star', 'heart', 'dot', 'sparkle', 'ring'],
  anniversary: ['heart', 'rings', 'sparkle', 'dot', 'star', 'heart'],
  work:        ['star', 'check', 'sparkle', 'dot', 'ring', 'confetti'],
  teams:       ['envelope', 'check', 'star', 'heart', 'sparkle', 'dot'],
};

// Positions in a 240 x 240 tile: [x, y, scale, rotation, opacity].
const LAYOUTS = {
  a: [[18, 22, 1.2, -12, 0.30], [128, 14, 0.9, 18, 0.22], [196, 70, 1.1, 8, 0.28], [62, 96, 0.8, 30, 0.2], [150, 130, 1.3, -20, 0.26], [24, 170, 1, 12, 0.24], [100, 196, 0.9, -8, 0.2], [200, 190, 0.8, 24, 0.22]],
  b: [[40, 10, 1, 20, 0.24], [170, 30, 1.25, -10, 0.3], [96, 72, 0.85, -25, 0.2], [14, 110, 1.15, 6, 0.28], [196, 124, 0.9, 15, 0.22], [120, 150, 1.2, -6, 0.26], [52, 202, 0.8, 28, 0.2], [176, 206, 1, -18, 0.24]],
};

const svgTile = (ink, motifs, layout) => {
  const shapes = layout.map(([x, y, s, r, o], i) => {
    const key = motifs[i % motifs.length];
    return `<g transform="translate(${x} ${y}) rotate(${r} 12 12) scale(${s})" opacity="${o}" fill="${ink}" stroke="${ink}" stroke-width="0">${M[key]}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">${shapes}</svg>`;
};

/** Style for a landing page hero: background colour plus a repeating pattern. */
export function heroBackdrop(page) {
  const c = (page.occasion === 'teams' && TEAMS_STYLE[page.country]?.[page.variant]) || COUNTRY_STYLE[page.country] || COUNTRY_STYLE.uk;
  const set = page.occasion === 'anniversary' && page.variant === 'b' ? SETS.work : SETS[page.occasion] || SETS.group;
  const tile = svgTile(c.ink, set, LAYOUTS[page.variant] || LAYOUTS.a);
  return {
    backgroundColor: c.bg,
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`,
    backgroundSize: page.variant === 'b' ? '280px 280px' : '240px 240px',
    backgroundRepeat: 'repeat',
  };
}

export const heroInk = (page) => ((page.occasion === 'teams' && TEAMS_STYLE[page.country]?.[page.variant]) || COUNTRY_STYLE[page.country] || COUNTRY_STYLE.uk).ink;
