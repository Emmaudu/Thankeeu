import { useEffect, useState } from 'react';

// Each country's page content is its own chunk, loaded only on that country's site.
const loaders = import.meta.glob('../../content/countries/*.js');
const cache = new Map();

export function loadCountryContent(slug) {
  if (cache.has(slug)) return Promise.resolve(cache.get(slug));
  const key = `../../content/countries/${slug}.js`;
  if (!loaders[key] || slug === 'index') return Promise.resolve(null);
  return loaders[key]().then((m) => { cache.set(slug, m.default); return m.default; });
}

/** Country content for a slug: undefined while loading, null when there is none. */
export function useCountryContent(slug) {
  const [content, setContent] = useState(() => cache.get(slug));
  useEffect(() => {
    let live = true;
    if (cache.has(slug)) { setContent(cache.get(slug)); return undefined; }
    setContent(undefined);
    loadCountryContent(slug).then((c) => { if (live) setContent(c); }).catch(() => { if (live) setContent(null); });
    return () => { live = false; };
  }, [slug]);
  return content;
}
