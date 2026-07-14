const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'blog',
  'cdn',
  'company',
  'help',
  'games',
  'mail',
  'support',
  'www',
]);

const APP_DOMAIN = (import.meta.env.VITE_APP_DOMAIN || 'thankeeu.com').toLowerCase();

const cleanHost = (hostname = window.location.hostname) => (
  String(hostname || '').toLowerCase().replace(/:\d+$/, '')
);

export const getWorkspaceSlug = (hostname = window.location.hostname) => {
  const host = cleanHost(hostname);

  if (host.endsWith('.localhost')) {
    const slug = host.slice(0, -'.localhost'.length).split('.').pop();
    return slug && !RESERVED_SUBDOMAINS.has(slug) ? slug : null;
  }

  if (host.endsWith(`.${APP_DOMAIN}`)) {
    const slug = host.slice(0, -(APP_DOMAIN.length + 1)).split('.').pop();
    return slug && !RESERVED_SUBDOMAINS.has(slug) ? slug : null;
  }

  return null;
};

export const isWorkspaceHost = () => Boolean(getWorkspaceSlug());

export const isWorkspaceFinderHost = (hostname = window.location.hostname) => {
  const host = cleanHost(hostname);
  return host === `company.${APP_DOMAIN}` || host === 'company.localhost';
};

export const isGamesHost = (hostname = window.location.hostname) => {
  const host = cleanHost(hostname);
  return host === `games.${APP_DOMAIN}` || host === 'games.localhost';
};

export const isAdminHost = (hostname = window.location.hostname) => {
  const host = cleanHost(hostname);
  return host === `admin.${APP_DOMAIN}` || host === 'admin.localhost';
};

export const getWorkspaceUrl = (slug) => {
  const base = import.meta.env.VITE_WORKSPACE_BASE_URL || window.location.origin;
  try {
    const url = new URL(base);
    const host = url.hostname.replace(/^www\./, '');
    const port = url.port ? `:${url.port}` : '';

    if (host === 'localhost' || host.endsWith('.localhost')) {
      return `${url.protocol}//${slug}.localhost${port}`;
    }

    return `${url.protocol}//${slug}.${host}${port}`;
  } catch {
    return `https://${slug}.thankeeu.com`;
  }
};

export const companyPath = (path = '/') => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return isWorkspaceHost() ? clean : `/company${clean === '/' ? '/dashboard' : clean}`;
};

export const memberPath = (path = '/') => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return isWorkspaceHost() ? `/member${clean}` : `/member${clean}`;
};
