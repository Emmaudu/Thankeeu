import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * ───────────
 * React Router does client-side navigation, so the browser never gets a
 * fresh page load — it just swaps the rendered component while leaving the
 * scroll position exactly where it was. That's why clicking a link while
 * scrolled down on a long page (e.g. the homepage) and landing on a new page
 * like /pals/signup or /vendor/signup leaves you scrolled to the bottom of
 * that new page instead of starting at the top.
 *
 * Render this once near the top of the app, inside <BrowserRouter> but
 * outside <Routes> (same pattern as PageTracker) — it renders nothing, it
 * just resets the scroll position whenever the path changes.
 *
 * Hash links (e.g. /policy#refunds) are intentionally left alone — if the
 * URL includes a hash, the browser/React Router's own anchor-scrolling
 * behaviour should be allowed to scroll to that element instead of being
 * overridden back to the top.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return; // let the browser scroll to the #anchor instead
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
