// One place that builds tasker profile links, so every page links the same way.
//
//   Preferred:  /tasker/<profile_slug>   e.g. /tasker/emmanuel-uduebholo  (permanent, readable)
//   Fallbacks:  /tasker/<username>, then /taskers/<user id>               (older data; still resolve)
//
// taskerProfileUrl() uses the site you are on (so a staging or local build
// never sends you to a different live site). Use PUBLIC_SITE only for things
// meant for the outside world (posters, search-engine data).

export const PUBLIC_SITE = 'https://taskeeu.com';

export function taskerProfilePath({ slug, username, id } = {}) {
  if (slug) return `/tasker/${encodeURIComponent(slug)}`;
  if (username) return `/tasker/${encodeURIComponent(username)}`;
  if (id) return `/taskers/${encodeURIComponent(id)}`;
  return null;
}

export function taskerProfileUrl(pathOrParts, origin) {
  const path = typeof pathOrParts === 'string' ? pathOrParts : taskerProfilePath(pathOrParts);
  if (!path) return null;
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : PUBLIC_SITE);
  return `${base}${path}`;
}
