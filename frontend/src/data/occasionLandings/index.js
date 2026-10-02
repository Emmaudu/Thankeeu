/**
 * Loading and linking the occasion × country landing pages.
 *
 * Page copy is split into ten files (five occasions × two country groups) so
 * a visitor only downloads the file their page is in. scripts/prerender.js
 * imports them all directly with allLandingPages().
 */
import { LANDING_MANIFEST, manifestByKey, hreflangCluster } from './manifest.js';
import { blogLinksFor, CORE_LINKS } from './shared.js';

const GROUP_1 = new Set(['uk', 'us', 'canada', 'germany']);
const GROUP_3 = new Set(['australia', 'france']);
export const pageFileOf = (m) => `${m.occasion}-${GROUP_1.has(m.country) ? 1 : GROUP_3.has(m.country) ? 3 : 2}`;

// Explicit so the bundler can split each file into its own chunk.
const LOADERS = {
  'group-1': () => import('./pages/group-1.js'),
  'group-2': () => import('./pages/group-2.js'),
  'farewell-1': () => import('./pages/farewell-1.js'),
  'farewell-2': () => import('./pages/farewell-2.js'),
  'farewell-3': () => import('./pages/farewell-3.js'),
  'birthday-1': () => import('./pages/birthday-1.js'),
  'birthday-2': () => import('./pages/birthday-2.js'),
  'birthday-3': () => import('./pages/birthday-3.js'),
  'babyshower-1': () => import('./pages/babyshower-1.js'),
  'babyshower-2': () => import('./pages/babyshower-2.js'),
  'anniversary-1': () => import('./pages/anniversary-1.js'),
  'anniversary-2': () => import('./pages/anniversary-2.js'),
};

/** The copy for one page, merged with its manifest entry. */
export async function loadLandingPage(key) {
  const m = manifestByKey[key];
  if (!m) return null;
  const mod = await LOADERS[pageFileOf(m)]();
  const page = (mod.default || []).find(p => p.key === key);
  return page ? { ...m, ...page } : null;
}

/** Links shown at the bottom of a page. */
export function landingLinks(m) {
  const sameCountry = LANDING_MANIFEST
    .filter(x => x.country === m.country && x.key !== m.key)
    .map(x => [x.path, x.anchor]);
  const otherCountries = LANDING_MANIFEST
    .filter(x => x.occasion === m.occasion && x.variant === m.variant && x.key !== m.key)
    .map(x => [x.path, x.anchor]);
  return { sameCountry, otherCountries, guides: blogLinksFor(m), core: CORE_LINKS[m.occasion] };
}

export { hreflangCluster };
