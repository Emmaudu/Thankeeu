import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Route prefixes that are PRIVATE (logged-in dashboards). The public support
// widget should be hidden here so it doesn't clutter or conflict with the
// in-app requester/tasker chat.
//
// Note on matching: we intentionally match '/requester' and '/tasker' as
// PREFIXES for the dashboards (/requester/..., /tasker/...). But two PUBLIC
// paths start similarly and must stay whitelisted:
//   - /taskers            (browse taskers — public)
//   - /tasker/:username   (public tasker profile)
// So we treat '/tasker' as private ONLY for the auth + dashboard sub-paths,
// and keep the public ones visible.
function isPrivatePath(pathname) {
  // Country sites (/uk/requester ...) follow the same rules as the root site.
  const p = pathname.toLowerCase().replace(/^\/(us|uk|ireland|australia|new-zealand|canada|singapore)(?=\/|$)/, '') || '/';

  // Explicitly PUBLIC even though they share a prefix — check these first.
  if (p === '/taskers' || p.startsWith('/taskers/')) return false; // browse taskers
  // Public tasker profile: /tasker/<username> that is NOT a known private sub-route.
  // Private tasker sub-routes are the dashboard root and auth pages handled below.

  // Private dashboards.
  if (p === '/requester' || p.startsWith('/requester/')) return true;
  if (p === '/admin' || p.startsWith('/admin/')) return true;
  if (p === '/teams/dashboard' || p === '/teams/hr' || p === '/teams/post-task') return true;

  // Tasker: dashboard root and its sub-pages are private, but /tasker/<username>
  // (public profile) is not. The dashboard lives at exactly '/tasker' or
  // '/tasker/' with dashboard sections, while public profiles are
  // '/tasker/<something>'. To disambiguate cleanly we treat the dashboard as
  // the routes the app actually renders privately: '/tasker' exactly, and the
  // login/signup pages. Public profiles keep the widget.
  if (p === '/tasker' || p === '/tasker/') return true;
  if (p === '/tasker/login' || p === '/tasker/signup') return true;
  if (p === '/requester/login' || p === '/requester/signup') return true;

  return false;
}

export default function TawkController() {
  const { pathname } = useLocation();

  useEffect(() => {
    const priv = isPrivatePath(pathname);

    const apply = () => {
      const api = window.Tawk_API;
      if (!api || typeof api.hideWidget !== 'function') return false;
      try {
        if (priv) api.hideWidget();
        else api.showWidget();
        return true;
      } catch {
        return false;
      }
    };

    // The tawk.to script loads asynchronously, so on first navigation the API
    // may not be ready yet. Try now; if not ready, hook onLoad and also retry
    // briefly. This avoids the widget flashing on a dashboard before hiding.
    if (!apply()) {
      const prevOnLoad = window.Tawk_API?.onLoad;
      if (window.Tawk_API) {
        window.Tawk_API.onLoad = function () {
          if (typeof prevOnLoad === 'function') { try { prevOnLoad(); } catch (_) {} }
          apply();
        };
      }
      // Fallback retries in case onLoad already fired before we hooked it.
      let tries = 0;
      const timer = setInterval(() => {
        if (apply() || ++tries > 20) clearInterval(timer);
      }, 250);
      return () => clearInterval(timer);
    }
  }, [pathname]);

  return null;
}
