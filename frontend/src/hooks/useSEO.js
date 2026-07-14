/**
 * useSEO — Production-grade SEO hook for Thankeeu React SPA
 *
 * Manages document.title + all <meta> + <link rel="canonical"> + JSON-LD
 * with NO external dependencies. Works with Google, Twitter/X, Facebook,
 * LinkedIn, WhatsApp, Telegram and every other major crawler/platform.
 *
 * Usage:
 *   useSEO({ title, description, canonical, ogImage, ogType, noIndex, jsonLd })
 *
 * Schema builders: SCHEMAS.organization, SCHEMAS.faqPage([...]), etc.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL   = import.meta.env.VITE_APP_URL || 'https://www.thankeeu.com';
// NOTE: the live site's canonical host is www.thankeeu.com — the apex
// (thankeeu.com) 308-redirects to www. VITE_APP_URL in Vercel MUST be set
// to https://www.thankeeu.com, or every canonical/og:url tag on the site
// points to a URL that immediately redirects away from itself, which is
// a documented cause of Google refusing to index pages.
const SITE_NAME  = 'Thankeeu';
const SITE_DESC  = "Group cards, gift pools, Memory Movies, Live Photo Walls and dedicated company workspaces for every occasion. Companies get their own Thankeeu subdomain to automate employee birthdays, farewells, anniversaries and recognition moments.";
const OG_IMAGE   = `${BASE_URL}/og-image.png`;
const TWITTER_HANDLE = '@thankeeu';

// ─── DOM helpers ─────────────────────────────────────────────────────────────

function setTitle(text) {
  document.title = text;
}

function setMeta(attr, key, value) {
  if (!value && value !== 0) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', String(value));
}

function setLink(rel, href, extra = {}) {
  if (!href) return;
  // canonical: only one allowed
  let el = rel === 'canonical'
    ? document.querySelector('link[rel="canonical"]')
    : document.querySelector(`link[rel="${rel}"][href="${href}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
}

function setJsonLd(data, id = 'ld-page') {
  const prev = document.getElementById(id);
  if (prev) prev.remove();
  if (!data) return;
  const s    = document.createElement('script');
  s.id       = id;
  s.type     = 'application/ld+json';
  // Always wrap with @context
  const payload = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : { '@context': 'https://schema.org', ...data };
  s.textContent = JSON.stringify(payload);
  document.head.appendChild(s);
}

// ─── Main hook ────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string}  opts.title         – Page-specific title (brand suffix added automatically)
 * @param {string}  opts.description   – 50–160 chars. Shown in Google snippets.
 * @param {string}  [opts.canonical]   – Canonical path (e.g. '/pricing'). Defaults to current path.
 * @param {string}  [opts.ogImage]     – Full URL to OG image, 1200×630px. Falls back to site default.
 * @param {string}  [opts.ogType]      – 'website' | 'article'. Default: 'website'.
 * @param {string}  [opts.twitterCard] – 'summary_large_image' | 'summary'. Default: 'summary_large_image'.
 * @param {boolean} [opts.noIndex]     – true → noindex,nofollow (private/auth pages).
 * @param {string}  [opts.keywords]    – Comma-separated keywords for legacy engines.
 * @param {object|Array} [opts.jsonLd] – JSON-LD schema object or array.
 */
export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  ogType      = 'website',
  twitterCard = 'summary_large_image',
  noIndex     = false,
  keywords    = '',
  locale      = 'en',
  jsonLd      = null,
} = {}) {
  const location = useLocation();

  useEffect(() => {
    // Don't double-append brand if title already ends with "| Thankeeu"
    const fullTitle = title
      ? (title.includes(SITE_NAME)
          ? title
          : `${title} | ${SITE_NAME}`)
      : `${SITE_NAME} — Group Cards & Gifts for Every Occasion`;

    const desc = (description || SITE_DESC).slice(0, 160);

    // Use explicit canonical if provided (path or full URL), otherwise current path
    const canonicalPath = canonical
      ? (canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`)
      : `${BASE_URL}${location.pathname}`;

    const img      = ogImage || OG_IMAGE;
    const robots   = noIndex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1';
    const gbot     = noIndex ? 'noindex,nofollow' : 'index,follow';

    // ── <title> ───────────────────────────────────────────────────────────────
    setTitle(fullTitle);

    // ── Standard meta ────────────────────────────────────────────────────────
    setMeta('name', 'description', desc);
    setMeta('name', 'robots',      robots);
    setMeta('name', 'googlebot',   gbot);
    setMeta('name', 'bingbot',     gbot);
    if (keywords) setMeta('name', 'keywords', keywords);
    setMeta('name', 'author', SITE_NAME);
    setMeta('name', 'theme-color', '#7F77DD');

    // ── Open Graph (Facebook, LinkedIn, WhatsApp, Telegram) ──────────────────
    setMeta('property', 'og:title',        fullTitle);
    setMeta('property', 'og:description',  desc);
    setMeta('property', 'og:url',          canonicalPath);
    setMeta('property', 'og:type',         ogType);
    setMeta('property', 'og:image',        img);
    setMeta('property', 'og:image:secure_url', img);
    setMeta('property', 'og:image:alt',    `${SITE_NAME} — ${title || 'Group Cards & Gifts'}`);
    setMeta('property', 'og:image:width',  '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:type',   'image/png');
    setMeta('property', 'og:site_name',    SITE_NAME);
    setMeta('property', 'og:locale',       locale);

    // ── Twitter / X Card ─────────────────────────────────────────────────────
    setMeta('name', 'twitter:card',        twitterCard);
    setMeta('name', 'twitter:site',        TWITTER_HANDLE);
    setMeta('name', 'twitter:creator',     TWITTER_HANDLE);
    setMeta('name', 'twitter:title',       fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image',       img);
    setMeta('name', 'twitter:image:alt',   `${SITE_NAME} — ${title || 'Group Cards & Gifts'}`);

    // ── WhatsApp / iMessage rich preview ─────────────────────────────────────
    setMeta('property', 'og:image:url', img); // explicit fallback for some crawlers

    // ── Canonical ─────────────────────────────────────────────────────────────
    setLink('canonical', canonicalPath);

    // ── hreflang (Primary language) ───────────────────────────────────
    setLink('alternate', canonicalPath, { hreflang: 'en' });
    setLink('alternate', canonicalPath, { hreflang: 'x-default' });

    // ── JSON-LD ───────────────────────────────────────────────────────────────
    setJsonLd(jsonLd, 'ld-page');

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    return () => {
      const ldScript = document.getElementById('ld-page');
      if (ldScript) ldScript.remove();
    };
  }); // no deps — runs on every render so dynamic titles (card name, etc.) update
}

// ─── Pre-built schema builders ────────────────────────────────────────────────

export const SCHEMAS = {
  // ── Sitewide ────────────────────────────────────────────────────────────────
  organization: {
    '@type': 'Organization',
    '@id':   `${BASE_URL}/#organization`,
    name:    SITE_NAME,
    url:     BASE_URL,
    logo: {
      '@type':  'ImageObject',
      '@id':    `${BASE_URL}/#logo`,
      url:      `${BASE_URL}/favicon.svg`,
      width:    64,
      height:   64,
      caption:  SITE_NAME,
    },
    image:       { '@id': `${BASE_URL}/#logo` },
    description: SITE_DESC,
    foundingDate: '2024',
    address: {
      '@type':           'PostalAddress',
      addressRegion:     'Global',
      addressLocality:   'Worldwide',
    },
    areaServed: [
      { '@type': 'Country', name: 'Worldwide' },
    ],
    contactPoint: [{
      '@type':            'ContactPoint',
      contactType:        'customer support',
      email:              'support@thankeeu.com',
      availableLanguage:  [{ '@type': 'Language', name: 'English' }],
    },{
      '@type':            'ContactPoint',
      contactType:        'sales',
      email:              'teams@thankeeu.com',
      availableLanguage:  [{ '@type': 'Language', name: 'English' }],
    }],
    sameAs: [
      'https://twitter.com/thankeeu',
      'https://www.instagram.com/thankeeu',
      'https://www.linkedin.com/company/thankeeu',
    ],
  },

  website: {
    '@type':    'WebSite',
    '@id':      `${BASE_URL}/#website`,
    url:        BASE_URL,
    name:       SITE_NAME,
    description: SITE_DESC,
    publisher:  { '@id': `${BASE_URL}/#organization` },
    inLanguage: 'en',
    potentialAction: {
      '@type':  'SearchAction',
      target:   { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/sign/{search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  },

  softwareApp: {
    '@type':                'SoftwareApplication',
    '@id':                  `${BASE_URL}/#app`,
    name:                   SITE_NAME,
    alternateName:          ['Thankeeu group cards', 'Thankeeu online cards'],
    applicationCategory:    'BusinessApplication',
    applicationSubCategory: 'Group Greeting Cards & Gift Collection',
    operatingSystem:        'Web, iOS, Android',
    url:                    BASE_URL,
    description:            'Thankeeu is an online group card, memory movie, event photo and company workspace platform. Groups co-sign one digital card for birthdays, weddings, leaving dos, retirements, get well soon, work anniversaries and more. Companies get dedicated wildcard-subdomain workspaces such as company.thankeeu.com for HR admins and employees, with automated milestone recognition, HRIS import, messages, photos, GIFs, voice notes and optional gift pools in USD, GBP, EUR, NGN, CAD and other currencies.',
    screenshot:             `${BASE_URL}/og-image.png`,
    featureList: [
      'Group cards for any occasion — everyone signs one card from a single link',
      'Dedicated company workspaces on wildcard subdomains such as flutterwave.thankeeu.com',
      'Employee recognition automation for birthdays, farewells, work anniversaries, promotions and new hires',
      'Memory Movie — automatically turns all card messages, photos and videos into a cinematic slideshow video the celebrant will love',
      'Live Photo Wall — collect real-time wedding and event guest photos and videos via a QR code, no app or account needed',
      'Group e-cards with unlimited signers',
      'Optional gift pool in USD, GBP, EUR, NGN, CAD and more',
      'Scheduled delivery — any date and time including midnight',
      'Photos, GIFs and voice notes in messages',
      'HRIS integration (SeamlessHR, BambooHR, Zoho People, WorkPay)',
      '25+ occasion types — birthday, wedding, leaving, retirement, get well soon, sympathy, maternity leave, baby shower, work anniversary, engagement, new home, graduation, promotion',
      'Remote and hybrid team friendly — sign from any device',
      'Worldwide support with local currency gift pools',
    ],
    offers: [
      { '@type': 'Offer', price: '4.99',  priceCurrency: 'GBP', description: 'Classic — 1 group card in GBP' },
      { '@type': 'Offer', price: '5.99',  priceCurrency: 'USD', description: 'Classic — 1 group card in USD' },
      { '@type': 'Offer', price: '5000',  priceCurrency: 'NGN', description: 'Classic — 1 group card in NGN' },
      { '@type': 'Offer', price: '0',     priceCurrency: 'GBP', description: 'Free to create — pay only when sending' },
    ],
    publisher: { '@id': `${BASE_URL}/#organization` },
  },

  // ── Page-level ──────────────────────────────────────────────────────────────
  breadcrumb(items) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: items.map(({ name, url }, i) => ({
        '@type':    'ListItem',
        position:   i + 1,
        name,
        ...(url ? { item: `${BASE_URL}${url}` } : {}),
      })),
    };
  },

  webPage(name, description, path, extra = {}) {
    return {
      '@type':       'WebPage',
      '@id':         `${BASE_URL}${path}#webpage`,
      url:           `${BASE_URL}${path}`,
      name,
      description,
      isPartOf:      { '@id': `${BASE_URL}/#website` },
      publisher:     { '@id': `${BASE_URL}/#organization` },
      inLanguage:    'en',
      potentialAction: {
        '@type':  'ReadAction',
        target:   [`${BASE_URL}${path}`],
      },
      ...extra,
    };
  },

  // price is the numeric amount already in `currency` units (not NGN).
  // Defaults to USD — the site's primary marketed currency — so Google rich
  // results match the "$" prices shown to most visitors and the page title.
  product(name, description, price, currency = 'USD', path = '/pricing') {
    return {
      '@type':       'Product',
      '@id':         `${BASE_URL}${path}#${name.toLowerCase().replace(/\s+/g,'-')}`,
      name,
      description,
      brand:   { '@type': 'Brand', name: SITE_NAME },
      image:   `${BASE_URL}/og-image.png`,
      url:     `${BASE_URL}${path}`,
      offers: {
        '@type':           'Offer',
        price:             String(price),
        priceCurrency:     currency,
        availability:      'https://schema.org/InStock',
        url:               `${BASE_URL}${path}`,
        priceValidUntil:   `${new Date().getFullYear() + 1}-12-31`,
        seller:            { '@id': `${BASE_URL}/#organization` },
      },
    };
  },

  faqPage(faqs) {
    return {
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name:    q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    };
  },

  // HowTo rich result — steps must be an array of { name, text }.
  // Powers Google's "how to" rich results and gives AI answer engines a
  // clean, machine-readable procedure to cite.
  howTo(name, description, steps, path = '/how-it-works') {
    return {
      '@type': 'HowTo',
      '@id':   `${BASE_URL}${path}#howto`,
      name,
      description,
      step: steps.map((s, i) => ({
        '@type':    'HowToStep',
        position:   i + 1,
        name:       s.name,
        text:       s.text,
        url:        `${BASE_URL}${path}#step-${i + 1}`,
      })),
    };
  },

  // For dynamic card pages
  cardEvent(recipientName, occasion, cardSlug, signerCount) {
    const label = occasion?.replace(/_/g, ' ') || 'celebration';
    return {
      '@type':       'Event',
      name:          `${recipientName}'s ${label} card`,
      description:   `A group card for ${recipientName} — signed by ${signerCount} people on Thankeeu.`,
      url:           `${BASE_URL}/sign/${cardSlug}`,
      organizer:     { '@id': `${BASE_URL}/#organization` },
      eventStatus:   'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: {
        '@type': 'VirtualLocation',
        url:     `${BASE_URL}/sign/${cardSlug}`,
      },
    };
  },

  // For landing page LocalBusiness
  localBusiness: {
    '@type':         ['LocalBusiness', 'SoftwareApplication'],
    '@id':           `${BASE_URL}/#localbusiness`,
    name:            SITE_NAME,
    url:             BASE_URL,
    description:     SITE_DESC,
    currenciesAccepted: 'NGN, GBP, USD, CAD',
    paymentAccepted:    'Flutterwave (Cards, Bank Transfer, USSD)',
    areaServed: {
      '@type': 'Country',
      name:    'Global',
    },
    address: {
      '@type':         'PostalAddress',
      addressLocality: 'Worldwide',
      addressRegion:   'Global',
    },
  },

  // Article schema for blog-style pages
  article(title, description, datePublished, path) {
    return {
      '@type':           'Article',
      headline:          title,
      description,
      url:               `${BASE_URL}${path}`,
      datePublished,
      dateModified:      datePublished,
      author:            { '@id': `${BASE_URL}/#organization` },
      publisher:         { '@id': `${BASE_URL}/#organization` },
      mainEntityOfPage:  { '@type': 'WebPage', '@id': `${BASE_URL}${path}` },
      inLanguage:        'en',
    };
  },

  // SiteNavigationElement — tells Google which pages to show as sitelinks
  siteNavigation() {
    const links = [
      { name: 'Birthday Group Cards',       url: '/occasions/birthday' },
      { name: 'Online Leaving Cards',        url: '/cards/leaving-card' },
      { name: 'Pricing',                    url: '/pricing' },
      { name: 'How It Works',               url: '/how-it-works' },
      { name: 'Farewell Group Cards',       url: '/occasions/farewell' },
      { name: 'Get Well Soon Cards',        url: '/cards/get-well-soon' },
      { name: 'Sympathy Cards',             url: '/cards/sympathy' },
      { name: 'Group Cards UK',             url: '/online-group-cards-uk' },
      { name: 'Group Cards Nigeria',        url: '/online-group-cards-nigeria' },
      { name: 'Blog',                       url: '/blog' },
      { name: 'Company Workspaces',         url: '/business' },
      { name: 'Retirement Cards',           url: '/cards/retirement' },
    ];
    return links.map(({ name, url }) => ({
      '@type': 'SiteNavigationElement',
      name,
      url: `${BASE_URL}${url}`,
    }));
  },
};

export { BASE_URL, OG_IMAGE, SITE_NAME, SITE_DESC };
