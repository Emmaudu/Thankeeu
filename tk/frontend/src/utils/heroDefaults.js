// Built-in homepage hero copy. Admin → Header can override each field; an
// empty override falls back to these. `{word}` in the title is replaced by the
// rotating occasion word (Birthday, Farewell, …) on its own highlighted line.
export const HERO_WORD_TOKEN = '{word}';

export const DEFAULT_HERO = {
  tagline: 'More than a group card. More than Instagram Stories. One place for everyone.',
  title: 'Send an Online Group {word} Card that will be Read and Watched',
  subtitle: "The card that collects everyone's love — messages, photos, voice notes and a gift — then turns it all into a group card and movie video memory they keep forever.",
};

/** Split a title around the {word} token → { before, after, hasWord }. */
export const splitHeroTitle = (title) => {
  const t = (title || DEFAULT_HERO.title).trim();
  const i = t.indexOf(HERO_WORD_TOKEN);
  if (i === -1) return { before: t, after: '', hasWord: false };
  return { before: t.slice(0, i).trim(), after: t.slice(i + HERO_WORD_TOKEN.length).trim(), hasWord: true };
};

const CACHE_KEY = 'thankeeu_hero_v1';
export const readCachedHero = () => {
  try { const v = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); return v && typeof v === 'object' ? v : null; }
  catch { return null; }
};
export const writeCachedHero = (hero) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(hero)); } catch { /* private mode */ }
};

/** Merge server overrides onto the defaults (null/empty = default). */
export const resolveHero = (hero) => ({
  tagline: hero?.tagline?.trim() || DEFAULT_HERO.tagline,
  title: hero?.title?.trim() || DEFAULT_HERO.title,
  subtitle: hero?.subtitle?.trim() || DEFAULT_HERO.subtitle,
});
