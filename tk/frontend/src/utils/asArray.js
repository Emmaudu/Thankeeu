/**
 * Coerce an API response into an array before iterating it.
 *
 * `asArray(res.data)` is the idiom this replaces, and it only guards null and
 * undefined. When an endpoint answers with an OBJECT instead — an error body,
 * a paginated envelope, a proxy's JSON, a shape change on the server — the
 * object sails through `||` and the next `.map()` throws, which in React means
 * the whole page renders as a white screen with the error only in the console.
 *
 * That has bitten this codebase twice already (the notification bell taking
 * down every dashboard page, and three dashboard pages found by the route
 * smoke test), so the guard lives in one place now.
 *
 * A common envelope is unwrapped rather than discarded: an endpoint that starts
 * returning `{ items: [...] }` keeps working instead of silently showing
 * "nothing here".
 */
const ENVELOPE_KEYS = ['items', 'data', 'rows', 'results', 'cards', 'records', 'list'];

export const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    for (const key of ENVELOPE_KEYS) {
      if (Array.isArray(value[key])) return value[key];
    }
  }
  return [];
};

export default asArray;
