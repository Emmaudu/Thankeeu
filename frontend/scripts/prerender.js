#!/usr/bin/env node
/**
 * prerender.js
 *
 * Fixes "Discovered — currently not indexed" for ~113 pages by generating
 * REAL static HTML files at build time, instead of relying on Googlebot to
 * execute JS + wait on a Railway/Supabase API round-trip to see unique
 * content.
 *
 * Why this exists:
 *   - Every route was previously served via the SPA fallback rewrite in
 *     vercel.json, which always returns the same index.html — identical
 *     <title>/meta/JSON-LD for every URL. Google's indexer treats that as
 *     duplicate/thin content before it even gets to rendering JS.
 *   - Blog post content is fetched client-side, after mount, from the
 *     backend. If that backend is slow/cold (Supabase free-tier pausing,
 *     Railway cold start), Google's renderer can see an empty shell.
 *
 * What this script does:
 *   1. Writes dist/<static-page>/index.html for the static marketing pages
 *      (faq, how-it-works, sample, policy, occasions/*) with unique
 *      title/description/canonical/OG baked in as real HTML.
 *   2. Fetches every published blog post from the backend and writes
 *      dist/blog/<slug>/index.html with unique title/description/canonical/
 *      OG/JSON-LD (Article) AND the actual post body rendered as visible
 *      HTML — so the very first byte Google sees already has the content.
 *
 * Vercel serves a matching static file (dist/blog/foo/index.html) directly —
 * the SPA fallback rewrite only fires when no file matches — so this doesn't
 * change any URLs or behaviour for real visitors. React still mounts into
 * #root and takes over immediately, giving full interactivity.
 *
 * Run after `vite build`:
 *   vite build && node scripts/prerender.js
 *
 * Never throws — a failed backend call logs a warning and skips just that
 * page, so a flaky API can never break the whole deploy.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const APP_URL = (process.env.APP_URL || 'https://www.thankeeu.com').replace(/\/$/, '');

function resolveApiBase() {
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, '');
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return 'https://api.thankeeu.com';
}
const API_URL  = resolveApiBase();
const DIST_DIR = path.join(__dirname, '..', 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

// ── HTTP helper (with timeout, never throws past the caller) ────────────────
function fetchJSON(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => req.destroy(new Error(`timeout after ${timeoutMs}ms for ${url}`)));
    req.on('error', reject);
  });
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(str, max) {
  const s = String(str ?? '');
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

// ── Load the built index.html once as our template ──────────────────────────
if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error(`[prerender] dist/index.html not found at ${INDEX_HTML_PATH} — did "vite build" run first? Skipping prerender.`);
  process.exit(0); // never break the build
}
const TEMPLATE = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

/**
 * Given the base template, swap in page-specific title/meta/OG/canonical/
 * JSON-LD, and optionally inject visible HTML into #root.
 */
function buildPage({ title, description, canonicalPath, ogType = 'website', jsonLd, rootHtml }) {
  const fullTitle = title;
  const url = `${APP_URL}${canonicalPath}`;
  let html = TEMPLATE;

  // <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(fullTitle)}</title>`);

  // meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${esc(description)}" />`
  );

  // canonical
  if (/<link rel="canonical" href="[^"]*"\s*\/>/.test(html)) {
    html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${esc(url)}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${esc(url)}" />\n  </head>`);
  }

  // Open Graph + Twitter
  html = html
    .replace(/<meta property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${esc(url)}" />`)
    .replace(/<meta property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(fullTitle)}" />`)
    .replace(/<meta property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:type"\s+content="[^"]*"\s*\/>/, `<meta property="og:type" content="${esc(ogType)}" />`)
    .replace(/<meta name="twitter:title"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(fullTitle)}" />`)
    .replace(/<meta name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(description)}" />`);

  // Extra JSON-LD (page-specific), appended alongside the base org/website graph
  if (jsonLd) {
    // Escaping "<" prevents a title/description containing "</script>" (or
    // "<!--") from breaking out of this script tag — the browser's HTML
    // parser looks for the literal closing tag regardless of JS string
    // context, so JSON.stringify alone is not enough here.
    const safeJson = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    const ldTag = `\n  <script type="application/ld+json" id="ld-page">${safeJson}</script>\n`;
    html = html.replace('</head>', `${ldTag}  </head>`);
  }

  // Inject visible content into #root so crawlers see real content pre-JS.
  // React's createRoot(...).render() on mount will clear and replace this,
  // so it never causes hydration mismatches for real browsers.
  if (rootHtml) {
    html = html.replace('<div id="root"></div>', `<div id="root">${rootHtml}</div>`);
  }

  return html;
}

function writeStatic(relPath, html) {
  const dir = path.join(DIST_DIR, relPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
}

// ── 1. Static marketing pages ────────────────────────────────────────────────
// Meta copied verbatim from each page's existing useSEO() call, so nothing
// user-facing changes — we're just making it visible to crawlers before JS.
const STATIC_PAGES = [
  {
    path: '/faq',
    title: 'FAQ — Group Cards, Gift Pots & Payments Explained | Thankeeu',
    description: 'Answers to the most common questions about Thankeeu. How to create a group card, pool a gift, pay securely with Flutterwave, withdraw money to your bank, and more.',
  },
  {
    path: '/how-it-works',
    title: 'How It Works — Create an Online Group Card in 2 Minutes | Thankeeu',
    description: 'Create a group card, share one link on WhatsApp, collect messages and gifts, then deliver it automatically. No signup needed to sign. Free to start.',
  },
  {
    path: '/sample',
    title: 'See a Live Demo Card | Thankeeu',
    description: 'Try Thankeeu before you commit. Sign this demo group card, add a gift, and see exactly what your recipients will experience.',
  },
  {
    path: '/policy',
    title: 'Privacy Policy & Terms of Service | Thankeeu',
    description: 'Thankeeu Privacy Policy and Terms of Service. Your data is safe — we never sell personal information. Secure payments via Flutterwave.',
  },
  {
    path: '/online-group-cards-uk',
    title: 'Online Group Cards UK — Sign Together, Add a Group Gift | Thankeeu',
    description: 'Create an online group card in the UK in under 2 minutes. Colleagues sign from one link — messages, photos, GIFs, voice notes — and chip in to a group gift in GBP. Free to start, no signup needed to sign.',
  },
  {
    path: '/online-group-cards-us',
    title: 'Online Group Cards US — Group Ecards & Group Gifts | Thankeeu',
    description: 'Create an online group card for your US team. Coworkers sign from one link — messages, photos, GIFs, voice notes — and pool a group gift in USD. Free to start; nobody needs an account to sign.',
  },
  {
    path: '/online-group-cards-canada',
    title: 'Online Group Cards Canada — Group Ecards & Gifts in CAD | Thankeeu',
    description: 'Create an online group card for your Canadian team. Everyone signs from one link — messages, photos, GIFs, voice notes — and chips in to a group gift. Free to start, bilingual-team friendly.',
  },
  {
    path: '/online-group-cards-nigeria',
    title: 'Online Group Cards Nigeria — Sign Together, Pool a Naira Gift | Thankeeu',
    description: 'Create an online group card in Nigeria. The whole team signs from one WhatsApp link — messages, photos, voice notes — and pools a Naira gift with secure Flutterwave payments. Withdraw to any Nigerian bank.',
  },
  {
    path: '/cards/leaving-card',
    title: 'Online Leaving Card — Group Leaving Cards for Colleagues | Thankeeu',
    description: "Create an online leaving card the whole team signs from one link. Messages, photos, GIFs and voice notes, plus an optional gift collection. Free to start — no signup needed to sign.",
  },
  {
    path: '/cards/retirement',
    title: 'Online Retirement Card — Group Retirement Cards & Gifts | Thankeeu',
    description: 'Honour decades of service with an online retirement card signed by everyone — colleagues past and present. Messages, photos, voice notes, and a pooled retirement gift.',
  },
  {
    path: '/cards/get-well-soon',
    title: 'Online Get Well Soon Card — Group Get Well Cards | Thankeeu',
    description: 'Send strength from the whole team with an online get well soon card. Everyone signs from one link — kind words, photos and voice notes — delivered when it matters most.',
  },
  {
    path: '/cards/thank-you',
    title: 'Online Thank You Card — Group Thank You Cards & Ecards | Thankeeu',
    description: 'Say thank you together. Create an online thank you card the whole team signs — messages, photos, GIFs and voice notes, with an optional group gift. Free to start.',
  },
  {
    path: '/cards/maternity-leave',
    title: 'Maternity Leave Card — Group Cards for Mums-to-Be | Thankeeu',
    description: 'Send a colleague off on maternity leave with a group card the whole team signs — warm wishes, photos, voice notes, and a pooled baby gift.',
  },
  {
    path: '/cards/christmas',
    title: 'Online Christmas Card — Group Christmas Cards for Teams | Thankeeu',
    description: 'Send one beautiful online Christmas card from the whole team. Everyone signs from one link — festive messages, photos, GIFs — with an optional group gift or bonus pool.',
  },
  {
    path: '/occasions/birthday',
    title: 'Online Birthday Group Cards Nigeria | Thankeeu',
    description: 'Create an online birthday group card in Nigeria that everyone signs from their phone. Add photos, voice notes, and a pooled Naira gift. Delivered at the perfect moment.',
  },
  {
    path: '/occasions/farewell',
    title: 'Online Farewell Group Cards Nigeria | Thankeeu',
    description: "When a colleague leaves your company in Nigeria, don't let them go without a proper send-off. One Thankeeu link, the whole team signs — messages, photos, voice notes, and a pooled going-away gift.",
  },
  {
    path: '/occasions/anniversary',
    title: 'Work Anniversary Group Cards Nigeria | Thankeeu',
    description: 'Work anniversaries deserve more than a Slack message. Create an automatic work anniversary group card signed by the whole Nigerian team, with messages, photos, and a pooled gift.',
  },
  {
    path: '/occasions/promotion',
    title: 'Promotion Congratulations Group Cards Nigeria | Thankeeu',
    description: "A promotion is a big deal. Celebrate it properly with a Thankeeu group card signed by the entire Nigerian team — personal messages, photos, voice notes, and a pooled congratulations gift.",
  },
  {
    path: '/occasions/graduation',
    title: 'Graduation Congratulations Group Cards Nigeria | Thankeeu',
    description: "Years of JAMB, WAEC, sleepless nights, and hard work led to this moment. A Thankeeu graduation group card in Nigeria lets family, friends and church community celebrate them together.",
  },
  {
    path: '/occasions/new-baby',
    title: 'New Baby & Baby Shower Group Cards Nigeria | Thankeeu',
    description: "A new baby is the greatest gift. Celebrate Nigerian parents with a beautiful group card full of love, prayers, and blessings — plus a pooled Naira baby gift from colleagues and family.",
  },
  {
    path: '/occasions/wedding',
    title: 'Wedding Congratulations Group Cards Nigeria | Thankeeu',
    description: 'Send a beautiful wedding congratulations group card in Nigeria. Everyone on the team or in the family adds their warmest wishes, and you pool a Naira wedding gift — all in one place.',
  },
];

function prerenderStaticPages() {
  let count = 0;
  for (const page of STATIC_PAGES) {
    try {
      const html = buildPage({
        title: page.title,
        description: page.description,
        canonicalPath: page.path,
      });
      writeStatic(page.path, html);
      count++;
    } catch (err) {
      console.warn(`[prerender] Failed static page ${page.path}:`, err.message);
    }
  }
  console.log(`[prerender] Wrote ${count}/${STATIC_PAGES.length} static marketing pages.`);
}

// ── 2. Blog posts (the main fix — ~94 of the 119 unindexed pages) ──────────
async function prerenderBlogPosts() {
  let slugs = [];
  try {
    const list = await fetchJSON(`${API_URL}/api/blog/sitemap`);
    slugs = (Array.isArray(list) ? list : []).map((p) => p.slug).filter(Boolean);
  } catch (err) {
    console.warn(`[prerender] Could not fetch blog slug list from ${API_URL}/api/blog/sitemap — skipping blog prerender entirely. Error: ${err.message}`);
    return;
  }

  if (slugs.length === 0) {
    console.warn('[prerender] Blog slug list was empty — nothing to prerender.');
    return;
  }

  let ok = 0, failed = 0;
  for (const slug of slugs) {
    try {
      const data = await fetchJSON(`${API_URL}/api/blog/${encodeURIComponent(slug)}`);
      const post = data?.post;
      if (!post) throw new Error('no post in response');

      const title = post.meta_title || `${post.title} | Thankeeu Blog`;
      const description = post.meta_description || post.excerpt || truncate((post.content || '').replace(/<[^>]+>/g, ''), 160);
      const ogImage = post.og_image || post.cover_image || `${APP_URL}/og-image.png`;
      const canonicalPath = `/blog/${post.slug}`;

      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description,
        image: ogImage ? [ogImage] : undefined,
        author: { '@type': 'Organization', name: post.author_name || 'Thankeeu Team' },
        publisher: {
          '@type': 'Organization',
          name: 'Thankeeu',
          logo: { '@type': 'ImageObject', url: `${APP_URL}/android-chrome-512x512.png` },
        },
        datePublished: post.published_at || post.created_at,
        dateModified: post.updated_at || post.published_at || post.created_at,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${APP_URL}${canonicalPath}` },
      };

      // Visible, crawlable content — real <h1>/<article> markup, not JS-injected.
      const rootHtml = `
<article>
  <h1>${esc(post.title)}</h1>
  <p>${esc(post.excerpt || '')}</p>
  <div>${post.content || ''}</div>
</article>`.trim();

      const html = buildPage({
        title,
        description,
        canonicalPath,
        ogType: 'article',
        jsonLd,
        rootHtml,
      });

      writeStatic(canonicalPath, html);
      ok++;
    } catch (err) {
      failed++;
      console.warn(`[prerender] Failed blog post "${slug}":`, err.message);
    }
  }

  console.log(`[prerender] Wrote ${ok}/${slugs.length} blog post pages${failed ? ` (${failed} failed — check API_URL/backend availability)` : ''}.`);
}

async function main() {
  console.log(`[prerender] API_URL=${API_URL} APP_URL=${APP_URL}`);
  prerenderStaticPages();
  await prerenderBlogPosts();
  console.log('[prerender] Done.');
}

main().catch((err) => {
  // Never fail the build over prerender issues — the SPA fallback still works.
  console.error('[prerender] Unexpected error (build continues):', err);
  process.exit(0);
});
