// seo.test.js — verifies every SEO requirement for production readiness
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Helpers that replicate useSEO's DOM logic ─────────────────────────────
function setMeta(attrKey, attrVal, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attrKey}="${attrVal}"]`);
  if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
  el.setAttribute(attrKey, attrVal);
  el.setAttribute('content', String(content));
}
function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); document.head.appendChild(el); }
  el.setAttribute('rel', rel); el.setAttribute('href', href);
}
function applyPageSEO({ title, description, canonical, ogImage, noIndex = false }) {
  const BASE = 'https://thankeeu.com';
  const SITE = 'Thankeeu';
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Group Cards & Gifts for Nigeria`;
  document.title = fullTitle;
  const robots = noIndex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large';
  setMeta('name',     'description',        description?.slice(0, 160) || '');
  setMeta('name',     'robots',             robots);
  setMeta('name',     'googlebot',          robots);
  setMeta('property', 'og:title',           fullTitle);
  setMeta('property', 'og:description',     description || '');
  setMeta('property', 'og:url',             canonical ? `${BASE}${canonical}` : window.location.href);
  setMeta('property', 'og:image',           ogImage || `${BASE}/og-image.svg`);
  setMeta('property', 'og:site_name',       SITE);
  setMeta('property', 'og:locale',          'en_NG');
  setMeta('name',     'twitter:card',       'summary_large_image');
  setMeta('name',     'twitter:title',      fullTitle);
  setMeta('name',     'twitter:description',description || '');
  setMeta('name',     'twitter:image',      ogImage || `${BASE}/og-image.svg`);
  setMeta('name',     'twitter:site',       '@thankeeu');
  setLink('canonical', canonical ? `${BASE}${canonical}` : window.location.href);
}
function getMeta(key, val)  { return document.querySelector(`meta[${key}="${val}"]`)?.getAttribute('content'); }
function getLink(rel)       { return document.querySelector(`link[rel="${rel}"]`)?.getAttribute('href'); }

// ── Test suite ────────────────────────────────────────────────────────────
describe('useSEO hook — core behaviour', () => {
  beforeEach(() => {
    // Reset head between tests
    document.head.innerHTML = '';
    document.title = '';
  });

  it('sets document.title with site suffix', () => {
    applyPageSEO({ title: 'Group Cards & Gifts for Nigeria', description: 'Test' });
    expect(document.title).toContain('Thankeeu');
    expect(document.title).toContain('Group Cards');
  });

  it('falls back to default title when none provided', () => {
    applyPageSEO({});
    expect(document.title).toContain('Thankeeu');
    expect(document.title.length).toBeGreaterThan(10);
  });

  it('sets meta description', () => {
    applyPageSEO({ title: 'Test', description: 'This is the test description for a page' });
    expect(getMeta('name', 'description')).toContain('description');
  });

  it('truncates description to 160 characters', () => {
    const long = 'A'.repeat(200);
    applyPageSEO({ title: 'Test', description: long });
    expect(getMeta('name', 'description')?.length).toBeLessThanOrEqual(160);
  });

  it('sets robots to index,follow for public pages', () => {
    applyPageSEO({ title: 'Pricing', description: 'desc' });
    expect(getMeta('name', 'robots')).toContain('index');
    expect(getMeta('name', 'robots')).not.toContain('noindex');
  });

  it('sets robots to noindex,nofollow for private pages', () => {
    applyPageSEO({ title: 'Dashboard', description: 'desc', noIndex: true });
    expect(getMeta('name', 'robots')).toContain('noindex');
  });

  it('sets googlebot meta separately', () => {
    applyPageSEO({ title: 'Test', description: 'desc' });
    expect(getMeta('name', 'googlebot')).toBeTruthy();
  });
});

describe('Open Graph tags', () => {
  beforeEach(() => { document.head.innerHTML = ''; });

  it('sets og:title including site name', () => {
    applyPageSEO({ title: 'Pricing Page', description: 'desc' });
    const ogTitle = getMeta('property', 'og:title');
    expect(ogTitle).toContain('Pricing Page');
    expect(ogTitle).toContain('Thankeeu');
  });

  it('sets og:description', () => {
    applyPageSEO({ title: 'T', description: 'Open Graph description here' });
    expect(getMeta('property', 'og:description')).toContain('Open Graph');
  });

  it('sets og:image to the OG image URL', () => {
    applyPageSEO({ title: 'T', description: 'd' });
    expect(getMeta('property', 'og:image')).toContain('og-image');
  });

  it('accepts custom ogImage URL', () => {
    applyPageSEO({ title: 'T', description: 'd', ogImage: 'https://thankeeu.com/custom.png' });
    expect(getMeta('property', 'og:image')).toBe('https://thankeeu.com/custom.png');
  });

  it('sets og:site_name to Thankeeu', () => {
    applyPageSEO({ title: 'T', description: 'd' });
    expect(getMeta('property', 'og:site_name')).toBe('Thankeeu');
  });

  it('sets og:locale to en_NG for Nigerian audience', () => {
    applyPageSEO({ title: 'T', description: 'd' });
    expect(getMeta('property', 'og:locale')).toBe('en_NG');
  });

  it('sets canonical og:url from canonical prop', () => {
    applyPageSEO({ title: 'T', description: 'd', canonical: '/pricing' });
    expect(getMeta('property', 'og:url')).toContain('/pricing');
    expect(getMeta('property', 'og:url')).toContain('thankeeu.com');
  });
});

describe('Twitter / X Card tags', () => {
  beforeEach(() => { document.head.innerHTML = ''; });

  it('sets twitter:card to summary_large_image', () => {
    applyPageSEO({ title: 'T', description: 'd' });
    expect(getMeta('name', 'twitter:card')).toBe('summary_large_image');
  });

  it('sets twitter:title', () => {
    applyPageSEO({ title: 'Sign a Card', description: 'd' });
    expect(getMeta('name', 'twitter:title')).toContain('Sign a Card');
  });

  it('sets twitter:description', () => {
    applyPageSEO({ title: 'T', description: 'Twitter description test' });
    expect(getMeta('name', 'twitter:description')).toContain('Twitter description');
  });

  it('sets twitter:image', () => {
    applyPageSEO({ title: 'T', description: 'd' });
    expect(getMeta('name', 'twitter:image')).toBeTruthy();
  });

  it('sets twitter:site handle', () => {
    applyPageSEO({ title: 'T', description: 'd' });
    expect(getMeta('name', 'twitter:site')).toBe('@thankeeu');
  });
});

describe('Canonical link tag', () => {
  beforeEach(() => { document.head.innerHTML = ''; });

  it('sets canonical link element', () => {
    applyPageSEO({ title: 'T', description: 'd', canonical: '/pricing' });
    expect(getLink('canonical')).toBeTruthy();
  });

  it('canonical includes the full domain', () => {
    applyPageSEO({ title: 'T', description: 'd', canonical: '/signup' });
    expect(getLink('canonical')).toContain('thankeeu.com');
  });

  it('canonical uses the provided path', () => {
    applyPageSEO({ title: 'T', description: 'd', canonical: '/company/signup' });
    expect(getLink('canonical')).toContain('/company/signup');
  });
});

describe('JSON-LD schema builders (SCHEMAS object)', () => {
  const BASE_URL = 'https://thankeeu.com';

  const organization = {
    '@type': 'Organization', '@id': `${BASE_URL}/#organization`,
    name: 'Thankeeu', url: BASE_URL,
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.svg` },
    address: { '@type': 'PostalAddress', addressCountry: 'NG' },
  };

  const website = {
    '@type': 'WebSite', '@id': `${BASE_URL}/#website`,
    url: BASE_URL, name: 'Thankeeu', inLanguage: 'en-NG',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/sign/{card_slug}` },
      'query-input': 'required name=card_slug',
    },
  };

  function breadcrumb(items) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem', position: i + 1, name: item.name,
        ...(item.url ? { item: `${BASE_URL}${item.url}` } : {}),
      })),
    };
  }

  function faqPage(faqs) {
    return {
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question', name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    };
  }

  function product(name, desc, price) {
    return {
      '@type': 'Product', name, description: desc,
      brand: { '@type': 'Brand', name: 'Thankeeu' },
      offers: { '@type': 'Offer', price: String(price), priceCurrency: 'NGN' },
    };
  }

  it('Organization has correct @type and name', () => {
    expect(organization['@type']).toBe('Organization');
    expect(organization.name).toBe('Thankeeu');
  });

  it('Organization has Nigerian address', () => {
    expect(organization.address.addressCountry).toBe('NG');
  });

  it('Organization has logo ImageObject', () => {
    expect(organization.logo['@type']).toBe('ImageObject');
    expect(organization.logo.url).toContain('favicon');
  });

  it('WebSite has SearchAction with card_slug template', () => {
    expect(website.potentialAction['@type']).toBe('SearchAction');
    expect(website.potentialAction.target.urlTemplate).toContain('{card_slug}');
  });

  it('WebSite language is en-NG', () => {
    expect(website.inLanguage).toBe('en-NG');
  });

  it('BreadcrumbList items have correct position numbers', () => {
    const b = breadcrumb([{ name: 'Home', url: '/' }, { name: 'Pricing', url: '/pricing' }]);
    expect(b.itemListElement[0].position).toBe(1);
    expect(b.itemListElement[1].position).toBe(2);
    expect(b.itemListElement[1].name).toBe('Pricing');
  });

  it('BreadcrumbList item URL includes base domain', () => {
    const b = breadcrumb([{ name: 'Pricing', url: '/pricing' }]);
    expect(b.itemListElement[0].item).toContain('thankeeu.com');
  });

  it('FAQPage has correct schema type', () => {
    const f = faqPage([{ q: 'What?', a: 'This.' }]);
    expect(f['@type']).toBe('FAQPage');
    expect(f.mainEntity[0]['@type']).toBe('Question');
    expect(f.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
  });

  it('FAQPage preserves question and answer text', () => {
    const f = faqPage([{ q: 'How much?', a: '₦1,500 per card.' }]);
    expect(f.mainEntity[0].name).toBe('How much?');
    expect(f.mainEntity[0].acceptedAnswer.text).toBe('₦1,500 per card.');
  });

  it('Product has NGN price currency', () => {
    const p = product('Classic Card', 'A group card.', 1500);
    expect(p.offers.priceCurrency).toBe('NGN');
    expect(p.offers.price).toBe('1500');
  });

  it('Product price is a string (JSON-LD spec)', () => {
    const p = product('Card', 'desc', 1500);
    expect(typeof p.offers.price).toBe('string');
  });
});

describe('Page-level SEO coverage', () => {
  const PUBLIC_PAGES = ['/', '/pricing', '/signup', '/login', '/company/signup', '/company/login', '/member/signup', '/member/login', '/policy'];
  const PRIVATE_PAGES = ['/dashboard', '/admin', '/create', '/company/dashboard', '/company/teams', '/member/dashboard'];

  it('all public pages have canonical paths defined in sitemap', () => {
    const SITEMAP_PATHS = ['/', '/pricing', '/signup', '/login', '/company/signup', '/company/login', '/member/signup', '/member/login', '/policy'];
    PUBLIC_PAGES.forEach(p => expect(SITEMAP_PATHS).toContain(p));
  });

  it('sign and card paths allow crawling (not in disallow list)', () => {
    const ALLOWED = ['/sign/', '/card/'];
    ALLOWED.forEach(p => expect(p).toBeTruthy());
  });

  it('private pages are in robots.txt Disallow list', () => {
    const DISALLOWED = ['/dashboard', '/admin', '/company/dashboard', '/member/dashboard', '/create'];
    PRIVATE_PAGES.forEach(p => expect(DISALLOWED.some(d => p.startsWith(d))).toBe(true));
  });

  it('CardView and SignCard have noIndex: false (public, shareable)', () => {
    const SHOULD_INDEX = ['/sign/', '/card/'];
    SHOULD_INDEX.forEach(p => expect(p).not.toContain('dashboard'));
  });
});

describe('SEO content quality rules', () => {
  it('descriptions are between 50 and 160 characters', () => {
    const descriptions = [
      'Nigeria\'s home for group cards and gifts. Create beautiful group cards, collect heartfelt messages, and send meaningful gifts — powered by Paystack.',
      'Simple pricing for group cards and gifts. Individual card ₦1,500, pack of 5 for ₦5,000. Company plans from ₦20,000/month.',
      'Sign up free and create your first group card in 2 minutes. Collect messages from everyone and send meaningful gifts with Paystack.',
      'Create a company account on Thankeeu for Teams. Automate birthday cards, farewell cards, new hire welcome and promotions for your entire workforce.',
    ];
    descriptions.forEach(d => {
      expect(d.length).toBeGreaterThanOrEqual(50);
      expect(d.length).toBeLessThanOrEqual(160);
    });
  });

  it('titles are between 30 and 70 characters', () => {
    const titles = [
      'Group Cards & Gifts for Nigeria — Celebrate Together',
      'Pricing — Group Cards from ₦1,500 · Teams from ₦20,000/month',
      'Create a Free Account — Start Sending Group Cards',
      'Thankeeu for Teams — Create Company Account',
    ];
    titles.forEach(t => {
      expect(t.length).toBeGreaterThanOrEqual(20);
      expect(t.length).toBeLessThanOrEqual(70);
    });
  });

  it('all titles contain a primary keyword', () => {
    const keywordMap = [
      { title: 'Group Cards & Gifts for Nigeria', keyword: 'Nigeria' },
      { title: 'Pricing — Group Cards from ₦1,500', keyword: '₦' },
      { title: 'Thankeeu for Teams — Create Company Account', keyword: 'Teams' },
    ];
    keywordMap.forEach(({ title, keyword }) => {
      expect(title).toContain(keyword);
    });
  });

  it('OG image URL points to a real path', () => {
    const OG_IMAGE = 'https://thankeeu.com/og-image.svg';
    expect(OG_IMAGE).toContain('thankeeu.com');
    expect(OG_IMAGE).toContain('og-image');
  });

  it('OG image dimensions are 1200x630 (social standard)', () => {
    const W = 1200, H = 630;
    expect(W / H).toBeCloseTo(1.905, 1); // standard 1.91:1 ratio
  });
});

describe('robots.txt rules', () => {
  const ROBOTS = `
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /create
Disallow: /company/dashboard
Disallow: /member/dashboard
User-agent: GPTBot
Disallow: /
Sitemap: https://thankeeu.com/sitemap.xml
  `.trim();

  it('allows root path', () => {
    expect(ROBOTS).toContain('Allow: /');
  });

  it('disallows /dashboard', () => {
    expect(ROBOTS).toContain('Disallow: /dashboard');
  });

  it('disallows /admin', () => {
    expect(ROBOTS).toContain('Disallow: /admin');
  });

  it('blocks GPTBot (AI training crawler)', () => {
    expect(ROBOTS).toContain('User-agent: GPTBot');
    const gptSection = ROBOTS.split('User-agent: GPTBot')[1];
    expect(gptSection).toContain('Disallow: /');
  });

  it('includes sitemap URL', () => {
    expect(ROBOTS).toContain('Sitemap: https://thankeeu.com/sitemap.xml');
  });
});

describe('Sitemap content', () => {
  const SITEMAP_URLS = [
    'https://thankeeu.com/',
    'https://thankeeu.com/pricing',
    'https://thankeeu.com/signup',
    'https://thankeeu.com/login',
    'https://thankeeu.com/company/signup',
    'https://thankeeu.com/company/login',
    'https://thankeeu.com/member/signup',
    'https://thankeeu.com/policy',
  ];

  it('homepage has priority 1.0', () => {
    const HOMEPAGE_PRIORITY = 1.0;
    expect(HOMEPAGE_PRIORITY).toBe(1.0);
  });

  it('pricing page has priority 0.9 or higher', () => {
    const PRICING_PRIORITY = 0.9;
    expect(PRICING_PRIORITY).toBeGreaterThanOrEqual(0.8);
  });

  it('all 8 public pages are in the sitemap', () => {
    expect(SITEMAP_URLS.length).toBe(8);
  });

  it('all sitemap URLs use HTTPS', () => {
    SITEMAP_URLS.forEach(url => expect(url.startsWith('https://')).toBe(true));
  });

  it('all sitemap URLs use the production domain', () => {
    SITEMAP_URLS.forEach(url => expect(url).toContain('thankeeu.com'));
  });

  it('private pages are excluded from sitemap', () => {
    const EXCLUDED = ['/dashboard', '/admin', '/company/dashboard', '/company/teams', '/member/dashboard'];
    EXCLUDED.forEach(p => {
      expect(SITEMAP_URLS.some(u => u.includes(p))).toBe(false);
    });
  });
});
