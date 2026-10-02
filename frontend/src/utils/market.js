// ═══════════════════════════════════════════════════════════════════════
// Taskeeu markets (mirrors backend/utils/countries.js).
//
// Nigeria keeps the root URLs (/tasks, /requester ...). Every other market
// lives under its own prefix (/uk/tasks, /us/requester ...). The market of a
// page is read from the URL every time, so money and links are always in the
// currency of the page the person is on.
// ═══════════════════════════════════════════════════════════════════════

export const MARKETS = [
  { code: 'NG', slug: null, name: 'Nigeria', short: 'Nigeria', currency: 'NGN', symbol: '₦', locale: 'en-NG', min: 100, tipMin: 100, provider: 'flutterwave', regionLabel: 'State', cityLabel: 'City or area', postcodeLabel: null },
  { code: 'US', slug: 'us', name: 'United States', short: 'US', currency: 'USD', symbol: '$', locale: 'en-US', min: 5, tipMin: 2, provider: 'rapyd', regionLabel: 'State', cityLabel: 'City', postcodeLabel: 'ZIP code' },
  { code: 'GB', slug: 'uk', name: 'United Kingdom', short: 'UK', currency: 'GBP', symbol: '£', locale: 'en-GB', min: 5, tipMin: 2, provider: 'rapyd', regionLabel: 'Region', cityLabel: 'Town or city', postcodeLabel: 'Postcode' },
  { code: 'IE', slug: 'ireland', name: 'Ireland', short: 'Ireland', currency: 'EUR', symbol: '€', locale: 'en-IE', min: 5, tipMin: 2, provider: 'rapyd', regionLabel: 'County', cityLabel: 'Town or city', postcodeLabel: 'Eircode' },
  { code: 'AU', slug: 'australia', name: 'Australia', short: 'Australia', currency: 'AUD', symbol: 'A$', locale: 'en-AU', min: 5, tipMin: 2, provider: 'rapyd', regionLabel: 'State or territory', cityLabel: 'Suburb or city', postcodeLabel: 'Postcode' },
  { code: 'NZ', slug: 'new-zealand', name: 'New Zealand', short: 'New Zealand', currency: 'NZD', symbol: 'NZ$', locale: 'en-NZ', min: 5, tipMin: 2, provider: 'rapyd', regionLabel: 'Region', cityLabel: 'Suburb or city', postcodeLabel: 'Postcode' },
  { code: 'CA', slug: 'canada', name: 'Canada', short: 'Canada', currency: 'CAD', symbol: 'C$', locale: 'en-CA', min: 5, tipMin: 2, provider: 'rapyd', regionLabel: 'Province or territory', cityLabel: 'City', postcodeLabel: 'Postal code' },
  { code: 'SG', slug: 'singapore', name: 'Singapore', short: 'Singapore', currency: 'SGD', symbol: 'S$', locale: 'en-SG', min: 5, tipMin: 2, provider: 'rapyd', regionLabel: 'Region', cityLabel: 'Area or town', postcodeLabel: 'Postal code' },
];

export const NIGERIA = MARKETS[0];
export const INTL_SLUGS = MARKETS.filter((m) => m.slug).map((m) => m.slug);

/** 'uk' | 'GB' | null → market (Nigeria for anything unknown). */
export function getMarket(input) {
  if (!input) return NIGERIA;
  const s = String(input).trim();
  return MARKETS.find((m) => m.code === s.toUpperCase() || (m.slug && m.slug === s.toLowerCase())) || NIGERIA;
}

/** Market of a URL path: /uk/tasks → UK, /tasks → Nigeria. */
export function marketFromPath(pathname) {
  const first = String(pathname || '').split('/')[1] || '';
  return MARKETS.find((m) => m.slug && m.slug === first.toLowerCase()) || NIGERIA;
}

const currentPath = () => (typeof window !== 'undefined' && window.location ? window.location.pathname : '/');

/** Market of the page being viewed right now. */
export const activeMarket = () => marketFromPath(currentPath());

/** URL prefix for a market ('' for Nigeria). */
export const prefixOf = (m) => (getMarket(m?.code || m).slug ? `/${getMarket(m?.code || m).slug}` : '');

/** Path inside the current market: cpath('/tasks') → '/uk/tasks' on the UK site. */
export const cpath = (p = '/', m = activeMarket()) => {
  const pre = m.slug ? `/${m.slug}` : '';
  if (!pre) return p;
  return p === '/' ? pre : `${pre}${p.startsWith('/') ? p : `/${p}`}`;
};

/** Same page in another market: /uk/tasks → /us/tasks. */
export function switchMarketPath(pathname, target) {
  const parts = String(pathname || '/').split('/');
  const cur = marketFromPath(pathname);
  const rest = cur.slug ? '/' + parts.slice(2).join('/') : pathname;
  const t = getMarket(target);
  return t.slug ? `/${t.slug}${rest === '/' ? '' : rest}` : (rest || '/');
}

const CURRENCY_MARKET = Object.fromEntries(MARKETS.map((m) => [m.currency, m]));

/**
 * Money in a currency. Naira keeps the exact format used before the expansion
 * (₦12,500). Other currencies show cents only when there are cents.
 */
export function formatMoney(n, currency) {
  const v = Number(n || 0);
  const m = CURRENCY_MARKET[String(currency || '').toUpperCase()] || NIGERIA;
  if (m.currency === 'NGN') return `₦${v.toLocaleString()}`;
  const cents = Math.round(v * 100) % 100 !== 0;
  return `${m.symbol}${v.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/** Money in the current page's currency. */
export const money = (n) => formatMoney(n, activeMarket().currency);
/** Currency symbol of the current page. */
export const sym = () => activeMarket().symbol;
/** Smallest price, payment or advance on the current page's market. */
export const minAmount = () => activeMarket().min;
export const minTip = () => activeMarket().tipMin;
