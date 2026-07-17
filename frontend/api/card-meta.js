/**
 * api/card-meta.js — Vercel Edge Function
 *
 * Intercepts /sign/:slug and /card/:slug for ALL requests.
 *
 * • Social crawlers  → Returns OG-enriched HTML (meta tags from live card data)
 *                      with a <meta http-equiv="refresh"> so if a human somehow lands
 *                      here, they get bounced to the SPA immediately.
 * • Real browsers    → Returns a thin HTML shell that loads the Vite SPA bundle,
 *                      identical to index.html but with card-specific OG tags pre-baked.
 *
 * This way WhatsApp/Facebook/Twitter see real og:title + og:image,
 * and human users get the full React app — no URL changes.
 */

const BACKEND  = 'https://thankeeu-production.up.railway.app';
const BASE_URL = 'https://www.thankeeu.com'; // live canonical host — apex 308-redirects here
const ASSETS_BASE = BASE_URL; // Vite assets live here

const CRAWLER_RE = /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|discordbot|applebot|googlebot|adsbot-google|google-inspectiontool|mediapartners-google|bingbot|bingpreview|duckduckbot|yandex(bot)?|baiduspider|pinterest|vkshare|xing-contenttabreceiver|mattermost|rocket\.chat|iframely|opengraph|preview|embedly|quora/i;

// Search-index crawlers (as opposed to social link-preview crawlers). Individual
// cards are private, user-generated pages that must NOT be indexed — they'd be
// thin/near-duplicate content that dilutes the site's overall quality signal and
// can suppress the brand in search. We still return rich OG tags (so social
// previews work) but add noindex for these engines.
const SEARCH_CRAWLER_RE = /googlebot|google-inspectiontool|adsbot-google|mediapartners-google|bingbot|bingpreview|duckduckbot|yandex(bot)?|baiduspider|applebot/i;

function isCrawler(ua) {
  return CRAWLER_RE.test(ua || '');
}
function isSearchCrawler(ua) {
  return SEARCH_CRAWLER_RE.test(ua || '');
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchCardMeta(slug) {
  try {
    const res = await fetch(
      `${BACKEND}/api/cards/${encodeURIComponent(slug)}/og-meta`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function ogHtml({ title, description, ogImage, canonicalUrl, forBrowser, noindex }) {
  const t   = esc(title);
  const d   = esc(description);
  const img = esc(ogImage);
  const u   = esc(canonicalUrl);
  const robotsMeta = noindex ? '\n  <meta name="robots" content="noindex,follow"/>' : '';

  // Common meta block
  const meta = `${robotsMeta}
  <title>${t}</title>
  <meta name="description"          content="${d}"/>
  <meta property="og:type"          content="website"/>
  <meta property="og:url"           content="${u}"/>
  <meta property="og:title"         content="${t}"/>
  <meta property="og:description"   content="${d}"/>
  <meta property="og:image"         content="${img}"/>
  <meta property="og:image:secure_url" content="${img}"/>
  <meta property="og:image:type"    content="image/svg+xml"/>
  <meta property="og:image:width"   content="1200"/>
  <meta property="og:image:height"  content="630"/>
  <meta property="og:image:alt"     content="${t}"/>
  <meta property="og:site_name"     content="Thankeeu"/>
  <meta name="twitter:card"         content="summary_large_image"/>
  <meta name="twitter:site"         content="@thankeeu"/>
  <meta name="twitter:title"        content="${t}"/>
  <meta name="twitter:description"  content="${d}"/>
  <meta name="twitter:image"        content="${img}"/>
  <meta name="twitter:image:alt"    content="${t}"/>
  <link rel="canonical"             href="${u}"/>`;

  if (!forBrowser) {
    // Crawler-only: minimal, no scripts
    return `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  ${meta}
</head>
<body><p><a href="${u}">${t}</a></p></body>
</html>`;
  }

  // Browser: full SPA shell with OG tags pre-baked
  // Load the Vite-built assets from the CDN (same origin on Vercel)
  return `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <meta name="theme-color" content="#7C3AED"/>
  ${meta}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
  <link rel="icon" href="/favicon-96x96.png" sizes="96x96" type="image/png"/>
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"/>
  <link rel="manifest" href="/site.webmanifest"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,800&display=swap"/>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    // Load the Vite SPA entry point from the built assets
    // Vercel serves /src/main.jsx via the SPA fallback, but for the module build
    // we need to reference the hashed asset. Redirect to index.html to let Vite handle it.
    // This script replaces this shell with the real SPA without changing the URL.
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    // Simply fetch index.html and replace document content
    fetch('/index.html').then(r => r.text()).then(html => {
      document.open();
      document.write(html);
      document.close();
    }).catch(() => { window.location.reload(); });
  </script>
</body>
</html>`;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const ua  = req.headers.get('user-agent') || '';

  // Extract slug from /sign/:slug or /card/:slug
  const match = url.pathname.match(/^\/(sign|card)\/([^/?#]+)/);
  if (!match) return new Response('Not found', { status: 404 });

  const slug       = match[2];
  const canonicalUrl = `${BASE_URL}${url.pathname}${url.search}`;
  const crawler       = isCrawler(ua);
  const searchCrawler = isSearchCrawler(ua);

  // Fetch card meta from backend (needed for both crawlers and browser OG tags)
  const meta   = await fetchCardMeta(slug);
  const ogImage = `${BACKEND}/api/cards/${slug}/og-image`;

  const title = meta?.title
    || 'You\'ve been invited to sign a card 💜';
  const description = meta?.description
    || 'Add your message to a beautiful group card on Thankeeu — takes 60 seconds, no account needed.';

  // Individual cards are private/user-generated — never index them, but keep OG
  // tags so WhatsApp/Facebook/Twitter previews still render.
  const html = ogHtml({ title, description, ogImage, canonicalUrl, forBrowser: !crawler, noindex: searchCrawler });

  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': crawler ? 'public, max-age=60, s-maxage=60' : 'no-store',
  };
  if (searchCrawler) headers['X-Robots-Tag'] = 'noindex, follow';

  return new Response(html, { status: 200, headers });
}

export const config = { runtime: 'edge' };
