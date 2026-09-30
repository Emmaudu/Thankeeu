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
import { COUNTRY_LANDINGS, GENERAL_LANDINGS, OCCASION_LABELS, LANDING_COVERS_PER_CATEGORY, landingFaqs } from '../src/data/countryLandings.js';
import { ILLUSTRATED_COVER_ROWS } from '../src/utils/illustratedCoverRows.js';
import { weddingLanding, WEDDING_LANDING_KEYS } from '../src/data/weddingLandings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const APP_URL = (process.env.APP_URL || 'https://www.thankeeu.com')
  .replace(/\/+$/, '')
  .replace(/^https?:\/\/thankeeu\.com$/i, 'https://www.thankeeu.com');

function resolveApiBase() {
  // API_URL is the correct build-time Node env var for the Railway backend.
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, '');
  // VITE_API_URL is a browser env var — only use it if it's a real https URL
  // (not localhost, which would fail inside Vercel's build environment).
  if (process.env.VITE_API_URL && process.env.VITE_API_URL.startsWith('https://')) {
    return process.env.VITE_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
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
// Geo cluster: UK/US/Nigeria country pages cross-reference each other via
// hreflang in the SERVED HTML (client-side hreflang alone is unreliable for
// crawlers). x-default points to the global homepage.
const GEO_CLUSTER = {
  '/online-group-cards-uk':      'en-GB',
  '/online-group-cards-us':      'en-US',
  '/online-group-cards-canada':  'en-CA',
};

function buildHreflangLinks(canonicalPath) {
  if (!(canonicalPath in GEO_CLUSTER)) return '';
  const links = Object.entries(GEO_CLUSTER)
    .map(([p, lang]) => `<link rel="alternate" hreflang="${lang}" href="${APP_URL}${p}" />`)
    .join('\n    ');
  return `${links}\n    <link rel="alternate" hreflang="x-default" href="${APP_URL}/" />`;
}

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

  // hreflang cluster (geo pages only)
  const hreflangLinks = buildHreflangLinks(canonicalPath);
  if (hreflangLinks) {
    // Drop the template's homepage-only hreflang pair so the page doesn't
    // declare two different x-default / "en" alternates.
    html = html.replace(/\s*<link rel="alternate" href="[^"]*" hreflang="(?:x-default|en)"\s*\/>/g, '');
    html = html.replace('</head>', `    ${hreflangLinks}\n  </head>`);
  }

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
  //
  // NOTE: this used to be a non-greedy regex (`[\s\S]*?<\/div>`), which broke
  // silently whenever rootHtml contained its own nested <div> (e.g. blog post
  // rootHtml wraps `post.content` in a <div> — any div inside real post
  // content, which is common, made the regex stop at the wrong closing tag
  // and truncate the page). This scans for the actual balanced closing tag
  // instead, so nesting depth can never break it.
  if (rootHtml) {
    const openTag = '<div id="root">';
    const start = html.indexOf(openTag);
    if (start !== -1) {
      let depth = 1;
      let i = start + openTag.length;
      const tagRe = /<div[^>]*>|<\/div>/g;
      tagRe.lastIndex = i;
      let end = -1;
      let m;
      while ((m = tagRe.exec(html))) {
        if (m[0].startsWith('</')) depth--; else depth++;
        if (depth === 0) { end = m.index + m[0].length; break; }
      }
      if (end !== -1) {
        html = html.slice(0, start) + `<div id="root">${rootHtml}</div>` + html.slice(end);
      } else {
        console.warn('[prerender] Could not find balanced close for <div id="root"> — rootHtml not injected for this page.');
      }
    }
  }

  return html;
}

function writeStatic(relPath, html) {
  const dir = path.join(DIST_DIR, relPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
}


// ── Country landings (UK, Canada, Nigeria) — the homepage layout with its own
// copy. Built from the same data the React page renders (data/countryLandings.js)
// so the static HTML, the page and the FAQ markup can never disagree.
function countryLandingPages() {
  return [
    ...Object.values(COUNTRY_LANDINGS),
    ...Object.values(GENERAL_LANDINGS),
    ...WEDDING_LANDING_KEYS.map(k => weddingLanding(k)),
  ].map(landingStaticPage);
}

function landingStaticPage(l) {
  const h = (t) => esc(t);
  {
    const faqs = landingFaqs(l);
    const source = `landing-${l.path.slice(1)}`;
    const perCat = l.coversPerCategory || LANDING_COVERS_PER_CATEGORY;
    const coverRows = l.coverOccasions.map((occ) => {
      const rows = ILLUSTRATED_COVER_ROWS.filter(r => r[2] === occ).slice(0, perCat);
      if (!rows.length) return '';
      const label = OCCASION_LABELS[occ] || occ;
      const items = rows.map(([folder, stem, occasion, , headline, tagline]) => {
        const id = `illus-${folder}-${stem}`;
        const href = `/card/customize?occasion=${encodeURIComponent(occasion)}&design=${encodeURIComponent(id)}&layout=album&source=${encodeURIComponent(source)}`;
        const alt = `${tagline ? `${headline} — ${tagline}` : headline} — ${label.toLowerCase()} group card cover`;
        return `<li><a href="${h(href)}"><img src="/cards/illustrated/${folder}/${stem}.svg" alt="${h(alt)}" width="210" height="297" loading="lazy" /> ${h(headline)}</a></li>`;
      }).join('');
      return `<h3>${h(l.coverOccasions.length === 1 ? `${perCat} ${label.toLowerCase()} card covers` : `${label} cards`)}</h3><ul>${items}</ul><p><a href="/cards/create?occasion=${occ}">See all ${h(label.toLowerCase())} covers</a></p>`;
    }).join('\n  ');
    const rootHtml = `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="${l.path}">${h(l.breadcrumb)}</a></nav>
<main>
  <p>${h(l.tagline)}</p>
  <h1>${h(l.h1Lead)} ${h(l.h1Accent)}</h1>
  <p>${h(l.subtitle)}</p>
  <p><strong>Free to start · From $3.15 to send · No subscription</strong></p>
  <p><a href="${h(l.ctaTo || '/card/new')}">${h(l.ctaLabel || 'Create a card')}</a> | <a href="/sample">Try our demo card</a></p>
  <h2>${h(l.coversTitle)}</h2>
  ${coverRows}
  <h2>${h(l.useCasesTitle || 'What teams use it for')}</h2>
  ${l.payments ? `<p>${l.currency ? `<strong>Gift in ${h(l.currency)}.</strong> ` : ''}${h(l.payments)}</p>` : ''}
  <ul>${(l.useCases || []).map(([t, b]) => `<li><strong>${h(t)}</strong> — ${h(b)}</li>`).join('')}</ul>
  ${l.comparison ? `<h2>${h(l.comparison.title || `Thankeeu vs ${l.comparison.columns.slice(0, -1).join(', ')}`)}</h2>
  <table><thead><tr><th>Feature</th>${l.comparison.columns.map(c => `<th>${h(c)}</th>`).join('')}</tr></thead><tbody>${l.comparison.rows.map(([f, ...cells]) => `<tr><td>${h(f)}</td>${cells.map(c => `<td>${c === true ? 'Yes' : c === false ? 'No' : h(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>${l.comparison.note ? `<p>${h(l.comparison.note)}</p>` : ''}` : ''}
  <h2>${h(l.linksTitle || 'Guides & comparisons')}</h2>
  <ul>${[...(l.blogLinks || []), ...(l.related || [])].map(([href, label]) => `<li><a href="${href}">${h(label)}</a></li>`).join('')}</ul>
  <h2>Questions we get all the time</h2>
  ${faqs.map(f => `<h3>${h(f.q)}</h3><p>${h(f.a)}</p>`).join('\n  ')}
</main>`;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'BreadcrumbList', itemListElement: [
          ...[{ name: 'Thankeeu', url: '/' }, ...(l.breadcrumbParents || []), { name: l.breadcrumb, url: l.path }]
            .map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: `${APP_URL}${b.url}` })),
        ] },
        { '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      ],
    };
    return { path: l.path, title: l.title, description: l.description, rootHtml, jsonLd };
  }
}

// ── 1. Static marketing pages ────────────────────────────────────────────────
// Meta copied verbatim from each page's existing useSEO() call, so nothing
// user-facing changes — we're just making it visible to crawlers before JS.
const STATIC_PAGES = [
  ...countryLandingPages(),
  {
    path: '/groupgreeting-alternative',
    title: 'GroupGreeting Alternative — Voice Notes, Gift Pot & Memory Movie | Thankeeu',
    description: 'Looking for a GroupGreeting alternative? Thankeeu adds what GroupGreeting leaves out — voice note messages, a built-in gift pot in any currency, and an automatic Memory Movie keepsake.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/groupgreeting-alternative">GroupGreeting Alternative</a></nav><main><h1>Signatures are the start. Not the whole card.</h1><p>GroupGreeting does the basics of group signing competently — but a card is more than a stack of typed messages. Thankeeu adds recorded voice notes, a gift pot in any currency, and an automatic Memory Movie compiled from every contribution.</p><h2>What Thankeeu includes as standard</h2><ul><li>Voice note messages on every card.</li><li>Gift collection built in, multi-currency (NGN, GBP, USD, CAD).</li><li>Automatic Memory Movie keepsake video.</li><li>Live Memory Wall for events.</li><li>No account needed to sign.</li></ul><p><a href="/cards/create">Create your card — free</a> | <a href="/thankeeu-vs-kudoboard">Thankeeu vs Kudoboard</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/canva-cards-alternative',
    title: 'Canva Cards Alternative — Automatic Signing, No Design Skills | Thankeeu',
    description: 'Looking for a Canva group card alternative? Thankeeu automatically collects signatures from one link — no Canva account needed for signers, no manual design work, voice notes and a gift pot included.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/canva-cards-alternative">Canva Cards Alternative</a></nav><main><h1>Canva is a design tool. Thankeeu is a group card platform.</h1><p>Designing a card in Canva is easy. Getting a whole group to sign it is not — everyone needs a Canva account, and there is no automated way to track who has added their message. Thankeeu does both: a beautiful design, and one link that automatically collects everyone's signature. Free to create, from $3.15 to send.</p><h2>What Thankeeu does differently</h2><ul><li>One link, automatic signing — no Canva account needed for signers.</li><li>100+ ready-made designs — no design skill required.</li><li>Voice notes included, which Canva cannot do.</li><li>Gift pot built in — no separate payment tool.</li><li>Automatic Memory Movie from every message and photo.</li></ul><p><a href="/cards/create">Create your card — free</a> | <a href="/group-ecard">Group eCard</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/sendwishonline-alternative',
    title: 'SendWishOnline Alternative — One Flat Price, Any Group Size | Thankeeu',
    description: 'Looking for a SendWishOnline alternative? Thankeeu charges one flat price per card no matter how many people sign — plus voice notes, a gift pot, and an auto-generated Memory Movie included.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/sendwishonline-alternative">SendWishOnline Alternative</a></nav><main><h1>One flat price. However many people sign.</h1><p>Some group card tools charge per contributor, so the price climbs as your group grows. Thankeeu charges one flat price per card, whether five people sign or five hundred — plus voice notes and a gift pot that many alternatives leave out entirely.</p><h2>What one flat price gets you</h2><ul><li>No signer limit on any plan.</li><li>Voice notes included on every plan, not locked behind a tier.</li><li>Gift collection built in.</li><li>Automatic Memory Movie generated from every contribution.</li><li>Scheduled delivery at no extra cost.</li></ul><p><a href="/cards/create">Create your card — free</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/ecards',
    title: 'Free eCards Online — Group eCards Everyone Signs | Thankeeu',
    description: 'Create a free eCard the whole group signs from one link. Messages, photos, voice notes and a pooled gift - for birthdays, farewells, retirements and more. No app needed.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/ecards">eCards</a></nav><main><h1>One eCard. Everyone signs it together.</h1><p>Most eCards are a single design one person sends. Thankeeu is different - share one link and everyone in the group adds their own message, photo or voice note to the same card before it's delivered. Free to create, from $3.15 to send.</p><h2>How it works</h2><ol><li>Pick a design from 100+ premium eCard designs.</li><li>Share one link by WhatsApp, email or text.</li><li>Everyone adds their own message, photo or voice note.</li><li>Schedule delivery for the exact right moment.</li></ol><p><a href="/cards/create">Create a card — free</a> | <a href="/virtual-cards">Virtual Cards</a> | <a href="/free-ecards-for-friends-and-family">Free eCards for Friends and Family</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/free-ecards-for-friends-and-family',
    title: 'Free eCards for Friends and Family — Group Cards Everyone Signs | Thankeeu',
    description: 'Send a free eCard to a friend or family member that the whole group can sign. Messages, photos and voice notes from everyone who cares, in one card. Free to create.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/free-ecards-for-friends-and-family">Free eCards for Friends and Family</a></nav><main><h1>Free to make. Better when everyone joins in.</h1><p>A single "thinking of you" text gets forgotten. A card that the whole friend group or family signed together, with real messages and photos, does not. Free to create.</p><h2>Why it works better</h2><ul><li>The whole family or friend group signs one card.</li><li>Attach old photos alongside a message.</li><li>Record a voice note instead of typing.</li><li>Collect a group gift contribution in the same place.</li></ul><p><a href="/cards/create">Create a card — free</a> | <a href="/ecards">eCards</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/virtual-cards',
    title: 'Virtual Cards for Every Occasion — Group Signing | Thankeeu',
    description: 'Create a virtual card the whole group signs from one link. Birthdays, farewells, weddings and more - messages, photos, voice notes and a gift pot, all in one place.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/virtual-cards">Virtual Cards</a></nav><main><h1>A virtual card signed by everyone, not just you.</h1><p>A virtual card usually means one design from one sender. Thankeeu turns it into a shared experience - one link, and everyone who wants to be part of it adds their own message. Free to create, from $3.15 to send.</p><h2>What makes it different</h2><ul><li>Multiple signers per card, not just one sender.</li><li>Voice messages included.</li><li>Gift collection built in.</li><li>Automatically turns into a Memory Movie.</li><li>No account required for signers.</li></ul><p><a href="/cards/create">Create your card — free</a> | <a href="/virtual-birthday-card">Virtual Birthday Card</a> | <a href="/ecards">eCards</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/virtual-birthday-card',
    title: 'Virtual Birthday Card — Everyone Signs From One Link | Thankeeu',
    description: 'Send a virtual birthday card the whole group signs together. Messages, photos, voice notes and a pooled birthday gift - delivered right on their birthday.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/virtual-birthday-card">Virtual Birthday Card</a></nav><main><h1>One birthday card. Every message, one link.</h1><p>Instead of a single "happy birthday" text, gather everyone into one virtual card - messages, old photos, voice notes, all delivered together on the day. From $3.15 to send.</p><h2>Why groups use it</h2><ul><li>The whole friend group signs one card, not a dozen separate texts.</li><li>Birthday gift pot included.</li><li>Record voice birthday wishes.</li><li>Scheduled for their exact birthday.</li><li>Auto Birthday Memory Movie included.</li></ul><p><a href="/cards/create?occasion=birthday">Create a birthday card — free</a> | <a href="/occasions/birthday">Birthday Group Cards</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/group-ecard',
    title: 'Group eCard — Everyone Signs the Same Card | Thankeeu',
    description: 'Create a group eCard where the whole team, family or friend group signs the same card from one link. Messages, photos, voice notes and a gift, delivered together.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/group-ecard">Group eCard</a></nav><main><h1>A group eCard. Made by everyone, for one person.</h1><p>A group eCard is one shared card that multiple people sign together - instead of everyone sending their own message separately. Free to create, from $3.15 to send.</p><h2>Built for groups</h2><ul><li>Designed for teams, families and friend groups to sign together.</li><li>Signers add their message anytime before the delivery date.</li><li>Voice, photo and text all supported.</li><li>Group gift collection alongside messages.</li><li>Works for remote and global groups.</li></ul><p><a href="/cards/create">Create a card — free</a> | <a href="/ecard-for-coworker">eCard for a Coworker</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/digital-greeting-cards',
    title: 'Digital Greeting Cards Everyone Can Sign | Thankeeu',
    description: 'Create a digital greeting card the whole group signs from one link. Messages, photos, voice notes and a pooled gift - for any occasion, delivered on schedule.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/digital-greeting-cards">Digital Greeting Cards</a></nav><main><h1>A digital greeting card that more than one person can sign.</h1><p>Most digital greeting card tools are built for one sender. Thankeeu is built for the group - one shared card that everyone contributes to. Free to create, from $3.15 to send.</p><h2>What's included</h2><ul><li>Group-signed, not single-sender.</li><li>Voice greetings, not just text.</li><li>Gift collection alongside the card.</li><li>Turns into a video keepsake automatically.</li><li>No printing or postage needed.</li></ul><p><a href="/cards/create">Create a card — free</a> | <a href="/ecards">eCards</a> | <a href="/group-ecard">Group eCard</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/ecard-for-coworker',
    title: 'eCard for a Coworker — Group Signed, No App Needed | Thankeeu',
    description: 'Send an eCard to a coworker that the whole office or team can sign. Messages, photos, voice notes and an optional gift collection, all in one link.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/ecard-for-coworker">eCard for a Coworker</a></nav><main><h1>An eCard for a coworker the whole office signs together.</h1><p>A colleague leaving, celebrating a birthday, or hitting a work anniversary deserves more than one manager's email. Get the whole office to sign one card. From $3.15 to send.</p><h2>Built for the workplace</h2><ul><li>Office-wide participation, remote team included.</li><li>Work gift pot included.</li><li>Voice messages from the team.</li><li>No account needed for coworkers to sign.</li><li>Works for remote and hybrid teams.</li></ul><p><a href="/cards/create?occasion=leaving">Create a card — free</a> | <a href="/cards/leaving-card">Online Leaving Cards</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/virtual-farewell-card',
    title: 'Virtual Farewell Card — Group Signed Goodbye | Thankeeu',
    description: 'Create a virtual farewell card the whole team signs from one link. Messages, photos, voice notes and a farewell gift pot - delivered on their last day.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/virtual-farewell-card">Virtual Farewell Card</a></nav><main><h1>A virtual farewell card signed by everyone who will miss them.</h1><p>A proper goodbye deserves more than a single email. Get the whole team into one virtual farewell card, full of real messages and photos. From $3.15 to send.</p><h2>What makes it work</h2><ul><li>The whole team contributes to one goodbye.</li><li>Farewell gift pot included.</li><li>Voice farewell messages.</li><li>Timed for their exact last day.</li><li>Includes remote colleagues.</li></ul><p><a href="/cards/create?occasion=leaving">Create a farewell card — free</a> | <a href="/cards/leaving-card">Online Leaving Cards</a> | <a href="/blog/what-to-write-in-a-leaving-card">Leaving Card Messages</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/',
    title: 'Thankeeu — Group Cards, Memory Movies & Gift Pools for Every Occasion',
    description: 'Create beautiful online group cards, gift pools, Memory Movies and company workspaces on your own Thankeeu subdomain — for any occasion, any team.',
    rootHtml: `<nav aria-label="Thankeeu services"><a href="/occasions/birthday">Birthday group cards</a> <a href="/cards/leaving-card">Leaving cards</a> <a href="/cards/retirement">Retirement cards</a> <a href="/live-memory-wall">Live Memory Wall</a> <a href="/pricing">Pricing</a> <a href="/how-it-works">How it works</a></nav><main><h1>Online Group Cards, Gift Pools &amp; Live Memory Walls — Thankeeu</h1><p>Create a beautiful online group card everyone signs from one link. One link, everyone signs, any occasion. Share with the team — everyone adds messages, photos, voice notes and a gift. The recipient gets something genuinely unforgettable. Free to start, from $3.15 to send.</p><h2>Popular occasions</h2><ul><li><a href="/cards/leaving-card">Leaving &amp; farewell cards</a> — the whole team signs from one link, with an optional leaving gift collection.</li><li><a href="/occasions/birthday">Birthday group cards</a> — personalised messages, photos, GIFs and a pooled birthday gift.</li><li><a href="/cards/retirement">Retirement cards</a> — celebrate a career with a card full of memories.</li><li><a href="/occasions/wedding">Wedding group cards</a> — collect messages and a gift from everyone who loves them.</li><li><a href="/qr-code-for-wedding-photos">QR code for wedding photos</a> — guests scan and upload photos live at your venue.</li></ul><h2>How it works</h2><ol><li>Create your card and choose an occasion — takes 2 minutes.</li><li>Share one link via WhatsApp, Slack, email or text.</li><li>Everyone signs from any device — no account needed.</li><li>Set a delivery time — the recipient gets it at exactly the right moment.</li></ol><p><a href="/cards/create">Create a group card — free</a> | <a href="/sample">See a sample card</a> | <a href="/pricing">Pricing from $3.15</a></p></main>`,
  },
  {
    path: '/pricing',
    title: 'Pricing — Group Cards, Memory Movies & Photo Walls from $3.15 | Thankeeu',
    description: 'Send a group card from $3.15 USD / £2.45 GBP. Pool a gift in USD, GBP, EUR, CAD and more. Team plans with unlimited cards and HR automation. Free to create — pay when you send.',
  },
  {
    path: '/blog',
    title: 'Blog — Group Card Guides & Message Ideas | Thankeeu',
    description: '100+ guides on what to write in leaving cards, birthday cards, retirement cards, sympathy cards and more. UK and Nigeria focused.',
  },
  {
    path: '/signup',
    title: 'Create a Free Account | Thankeeu',
    description: 'Sign up free. Create group cards, collect gifts in GBP or NGN, and deliver at the perfect moment.',
  },
  {
    path: '/company/signup',
    title: 'Thankeeu for Teams — Unlimited Group Cards & HR Automation',
    description: 'Automate birthday and anniversary cards for your whole team. HRIS integration, unlimited cards, and gift collection in GBP or NGN. Free trial.',
  },
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
    path: '/cards/create',
    title: 'Browse Group Card Designs — 100+ Covers for Every Occasion | Thankeeu',
    description: 'Pick from 100+ premium A4 group card designs for birthdays, leaving, retirement, weddings, sympathy and more. Everyone signs from one link — photos, voice notes, GIFs and a group gift.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/cards/create">Card Designs</a></nav><main><h1>Browse Group Card Designs — 100+ Covers for Every Occasion</h1><p>Pick a design for any occasion — birthday, leaving, retirement, wedding, sympathy, thank you and more. Share one link and everyone on the team signs with messages, photos, GIFs and voice notes. Memory Movie™ auto-generated.</p><h2>Popular design categories</h2><ul><li><a href="/cards/create?occasion=leaving">Leaving &amp; farewell card designs</a> — colourful and professional send-off covers.</li><li><a href="/cards/create?occasion=birthday">Birthday card designs</a> — fun, bold and personalised birthday covers.</li><li><a href="/cards/create?occasion=retirement">Retirement card designs</a> — warm, celebratory covers for a career milestone.</li><li><a href="/cards/create?occasion=sympathy">Sympathy card designs</a> — gentle, respectful covers for difficult moments.</li><li><a href="/cards/create?occasion=wedding">Wedding card designs</a> — beautiful covers for the couple's special day.</li></ul><p><a href="/cards/leaving-card">Online Leaving Cards</a> | <a href="/occasions/birthday">Birthday Group Cards</a> | <a href="/pricing">Pricing</a></p></main>`,
  },
  {
    path: '/send-money-greeting-card',
    title: 'Send Money in a Greeting Card — Money Gift by Email | Thankeeu',
    description: 'Send money to anyone by email, tucked inside a greeting card they actually open. They withdraw it to their bank account or take it as a gift card. Nigeria, UK and US.',
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/send-money-greeting-card">Send Money in a Card</a></nav>
<main>
  <h1>Send money inside a card they will actually keep</h1>
  <p>A bank transfer is a reference line nobody reads. Thankeeu wraps the money in a real greeting card — your design, your message, your photos, your voice — and emails it to the person you are sending it to. They open the card, read it, then take the money to their bank account or as a gift card.</p>
  <p><strong>Send to any email · Withdraw to a Nigerian bank account or a gift card · Powered by Flutterwave and Reloadly</strong></p>
  <h2>How sending money in a card works</h2>
  <ol>
    <li>Pick a card design and write your message — add photos, videos, GIFs or a voice note.</li>
    <li>Choose how much money to tuck inside. You pay once, for the money and the card together.</li>
    <li>They get an email, open the card, and choose how to receive it.</li>
    <li>Straight to their bank account, or as a gift card for shopping, airtime, food and streaming.</li>
  </ol>
  <h2>Why send money this way</h2>
  <ul>
    <li>The message and the money arrive together, in one link.</li>
    <li>You only need their email address — no account number, no bank details.</li>
    <li>They choose bank withdrawal or a gift card, in their own time.</li>
    <li>Works for birthdays, thank yous, congratulations, school fees, sending money home and just because.</li>
  </ul>
  <h2>Send money to Nigeria, the UK and the US</h2>
  <p>Recipients in Nigeria withdraw straight to any Nigerian bank account. Gift cards cover Nigeria, the United Kingdom and the United States — Jumia, Amazon, iTunes, Google Play, Netflix, Spotify and more.</p>
  <p><a href="/signup">Send money in a card — get started</a> | <a href="/pricing">Pricing</a> | <a href="/how-it-works">How it works</a></p>
</main>`,
  },
  {
    path: '/cards/leaving-card',
    title: "Online Leaving Card — Group Leaving Cards Everyone Signs | Thankeeu",
    description: "Create an online leaving card the whole team signs from one link — messages, photos, GIFs and voice notes, plus an optional leaving gift. Free to start.",
    // FAQ text and cover list are generated from LeavingCardPage.jsx / illustratedCoverRows.js
    // (keep identical — Google compares the static HTML with the rendered page).
    rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="/cards/leaving-card">Online Leaving Card</a></nav>
<main>
  <h1>Online Leaving Cards for Colleagues · UK, US &amp; Global</h1>
  <p><strong>Their last day deserves more than a rushed goodbye.</strong></p>
  <p>Your colleague opens their email and finds a card full of real messages, photos and voice notes from the whole team — not a 10-second WhatsApp group. Set it up in 2 minutes. Share the link. Everyone signs before Friday.</p>
  <p><strong>Free to start · From $3.15 / £2.45 to send · No subscription · No account needed to sign</strong></p>
  <p>50,000+ messages posted · 10,000+ happy customers · $150K+ gifts issued globally</p>
  <h2>Choose a leaving card cover for their send-off</h2>
  <ul>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-3t-farewell-legend&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/3t-farewell-legend.svg" alt="Farewell, legend! — Thanks for everything. You’ll be so missed! — leaving card cover" width="210" height="297" loading="lazy" /> Farewell, legend!</a></li>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-3l-teary-cat&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/3l-teary-cat.svg" alt="We’ll miss you! — Don’t be a stranger — leaving card cover" width="210" height="297" loading="lazy" /> We’ll miss you!</a></li>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-fw3-airplane&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/fw3-airplane.svg" alt="Up, up and away! — Bon voyage from the team — leaving card cover" width="210" height="297" loading="lazy" /> Up, up and away!</a></li>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-3n-new-door&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/3n-new-door.svg" alt="Hello, next chapter! — So proud of you. Go get it! — leaving card cover" width="210" height="297" loading="lazy" /> Hello, next chapter!</a></li>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-3s-rainbow&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/3s-rainbow.svg" alt="Sad you’re going, happy for you! — We’ll miss you loads — leaving card cover" width="210" height="297" loading="lazy" /> Sad you’re going, happy for you!</a></li>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-fw1-moving-box&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/fw1-moving-box.svg" alt="Packing up, moving on! — We’ll miss you loads — leaving card cover" width="210" height="297" loading="lazy" /> Packing up, moving on!</a></li>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-fw10-map-pin&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/fw10-map-pin.svg" alt="Next stop: awesome! — Good luck in your new role — leaving card cover" width="210" height="297" loading="lazy" /> Next stop: awesome!</a></li>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-3r-signpost&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/3r-signpost.svg" alt="Onwards &amp; upwards! — Good luck in the new role — leaving card cover" width="210" height="297" loading="lazy" /> Onwards &amp; upwards!</a></li>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-3m-suitcase&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/3m-suitcase.svg" alt="Adventure awaits! — Good luck on your next journey — leaving card cover" width="210" height="297" loading="lazy" /> Adventure awaits!</a></li>
    <li><a href="/card/customize?occasion=leaving&amp;design=illus-farewell-3o-blast-off&amp;layout=album&amp;source=leaving-page"><img src="/cards/illustrated/farewell/3o-blast-off.svg" alt="Blast off! — To your next big thing — leaving card cover" width="210" height="297" loading="lazy" /> Blast off!</a></li>
  </ul>
  <p><a href="/cards/create?occasion=leaving">Create a leaving card — free</a> | <a href="/cards/leaving-card/gallery">Browse all leaving card designs</a> | <a href="/blog/what-to-write-in-a-leaving-card">What to write in a leaving card</a> | <a href="/pricing">Pricing</a></p>
  <h2>How an online leaving card works</h2>
  <ol>
    <li><strong>Create</strong> — choose the leaving occasion, pick a design, set delivery date. Done in 2 minutes.</li>
    <li><strong>Share</strong> — send the link via WhatsApp, Slack or email. Anyone can sign — no account needed.</li>
    <li><strong>Sign</strong> — everyone adds their message, photo, GIF or voice note at their own pace.</li>
    <li><strong>Deliver</strong> — the card arrives by email at the exact time you set, with the pooled gift if enabled.</li>
  </ol>
  <h2>Frequently asked questions</h2>
  <h3>How does an online leaving card work?</h3>
  <p>Create the card in under 2 minutes, share one link with colleagues, and everyone adds their message, photo, GIF or voice note. Schedule it to arrive on their last day at the exact time you choose.</p>
  <h3>Can we collect money for a leaving gift too?</h3>
  <p>Yes — every card includes an optional gift collection. Contributors chip in when they sign, and the recipient or organiser withdraws the pooled amount directly to their bank account.</p>
  <h3>Do people need an account to sign?</h3>
  <p>No. Anyone with the link can sign instantly — no registration, no app download. They just open the link and add their message.</p>
  <h3>How much does an online leaving card cost?</h3>
  <p>Free to create and collect messages. A small fee applies when you&#x27;re ready to send — always shown upfront before you pay. Classic (1 card) starts at $3.15 USD.</p>
  <h3>Can remote colleagues sign?</h3>
  <p>Yes — the link works from any device, anywhere. Your Manchester office, the person on parental leave, and the colleague who left last year but wants to sign can all contribute from one link.</p>
  <h3>What is the Memory Movie™?</h3>
  <p>After delivery, Thankeeu automatically generates a cinematic 1080p MP4 video from all the messages, photos and voice notes on the card. The recipient gets an email when it&#x27;s ready to watch and download.</p>
</main>`,
  },
  {
    path: '/cards/pet-loss-card',
    title: 'Online Pet Loss & Pet Sympathy Card — Group Memorial Cards Everyone Signs | Thankeeu',
    description: 'Create an online pet loss card the whole family and friends sign from one link. A group pet sympathy & memorial card for the loss of a dog, cat, bird or any beloved pet — messages, photos, voice notes and a Rainbow Bridge keepsake. Free to start, no signup to sign.',
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
  { path: '/cards/sympathy', title: 'Online Sympathy Card — Group Condolence Cards | Thankeeu', description: 'Send heartfelt condolences from the whole team with an online sympathy card — kind words, memories and support, delivered privately when it matters.' },
  { path: '/cards/welcome', title: 'Online Welcome Card — Group Welcome Cards for New Starters | Thankeeu', description: 'Make a new starter feel at home from day one with a welcome card signed by the whole team. Everyone adds a message, photo or GIF from one link. Free to start.' },
  { path: '/cards/good-luck', title: 'Online Good Luck Card — Group Good Luck Cards | Thankeeu', description: 'Send good luck wishes from the whole group with one online card. Perfect for job interviews, exams, surgery, a new venture, or any big moment. Everyone signs from one link.' },
  { path: '/cards/baby-shower', title: 'Online Baby Shower Card — Group Cards & Gift Collections | Thankeeu', description: 'Create an online baby shower card the whole group signs from one link — messages, photos, GIFs and voice notes, with an optional pooled baby gift.' },
  { path: '/cards/teacher-thank-you', title: 'Online Teacher Thank You Card — Group Cards from the Class | Thankeeu', description: 'Create a thank you card for a teacher or teaching assistant from the whole class. Every pupil, parent and family member signs from one link.' },
  { path: '/cards/engagement', title: 'Online Engagement Card — Group Congratulations Cards | Thankeeu', description: 'Celebrate an engagement with a group card from everyone who loves them. Messages, photos, GIFs, voice notes and an optional pooled engagement gift.' },
  { path: '/cards/new-home', title: 'Online New Home Card — Group Cards & Housewarming Gifts | Thankeeu', description: 'Celebrate a new home with a group card from family, friends and colleagues. Everyone signs from one link with an optional pooled housewarming gift.' },
  { path: '/cards/administrative-professionals-day', title: 'Administrative Professionals Day Card — Group Thank You Cards | Thankeeu', description: 'Celebrate Administrative Professionals Day with a group thank you card from the whole office. Everyone signs from one link — personal messages, photos and GIFs.' },
  { path: '/cards/boss-day', title: "Boss's Day Card — Online Group Cards for Your Manager | Thankeeu", description: "Celebrate Boss's Day with a group card the whole team signs. Messages, photos and GIFs from everyone — plus an optional gift collection." },
  { path: '/cards/teacher-appreciation', title: 'Teacher Appreciation Card — Group Cards from the Class | Thankeeu', description: 'Create a teacher appreciation card the whole class signs. Every student and parent contributes messages, photos and drawings from one link — with an optional group gift.' },
  { path: '/cards/thanksgiving', title: 'Online Thanksgiving Card — Group Cards for Teams & Clients | Thankeeu', description: 'Send a Thanksgiving card from the whole team. Colleagues sign from one link — personal messages, photos and GIFs — perfect for client appreciation and team gratitude.' },
  { path: '/cards/mothers-day', title: "Online Mother's Day Card — Group Cards from the Whole Family | Thankeeu", description: "Create a Mother's Day card the whole family signs from one link — messages, photos, voice notes and memories. Pool a gift together." },
  { path: '/cards/fathers-day', title: "Online Father's Day Card — Group Cards from the Whole Family | Thankeeu", description: "Create a Father's Day card the whole family signs from one link — messages, photos, voice notes and memories. Pool a gift together." },
  { path: '/online-birthday-cards-nigeria', title: 'Online Birthday Cards Nigeria — Buy, Personalise & Send Same Day | Thankeeu', description: 'Buy an online birthday card in Nigeria — personalised, delivered instantly, signed by everyone who loves them. No printing, no Lagos traffic, no delivery fees.' },
  { path: '/birthday-cards-uk', title: 'Online Birthday Cards UK — Group Birthday Cards for Every Team | Thankeeu', description: 'Create an online birthday group card for a UK colleague. Everyone signs from one link with a birthday gift collection in GBP. Delivered at midnight.' },
  { path: '/retirement-cards-uk', title: 'Online Retirement Cards UK — Group Cards for Retiring Colleagues | Thankeeu', description: 'Create an online retirement group card for a UK colleague — signed by current and former colleagues, with an optional retirement gift collection in GBP.' },
  { path: '/get-well-soon-cards-uk', title: 'Online Get Well Soon Cards UK — Group Cards from the Whole Team | Thankeeu', description: 'Send strength from the whole UK team with an online get well soon card. Everyone signs from one link — messages, photos and voice notes — delivered privately.' },
  {
    path: '/live-memory-wall',
    title: 'Live Memory Wall™ — Collect Every Photo & Video from Your Celebration | Thankeeu',
    description: 'Thankeeu Live Memory Wall lets guests upload photos and videos in real time. Everything preserved forever and automatically becomes a Memory Movie.',
  },
  {
    path: '/birthday-memory-wall',
    title: 'Birthday Memory Wall — Turn Your Birthday Into a Live Celebration | Thankeeu',
    description: "Collect birthday photos, videos and messages from everyone at the party and beyond with Thankeeu's Live Memory Wall.",
  },
  {
    path: '/church-memory-wall',
    title: 'Church Memory Wall — Capture Every Moment from Church Conferences | Thankeeu',
    description: 'Capture photos and videos from church conferences, pastor appreciation services, baby dedications and special occasions.',
  },
  {
    path: '/employee-memory-wall',
    title: 'Employee Memory Wall — Celebrate Employees With More Than Just Messages | Thankeeu',
    description: 'Capture photos, videos and memories from the entire team for employee celebrations. Build a permanent Memory Wall and auto-generate a keepsake movie.',
  },
  { path: '/live-memory-wall',     title: 'Live Memory Wall™ — Collect Every Guest Photo & Video at Your Event | Thankeeu',  description: 'Collect every guest\'s photos and videos in one shared wall — guests scan a QR code or click a link, no app needed. Real-time live photo wall for weddings, birthdays, owambe, and every occasion.' },
  { path: '/thankeeu-vs-thankbox',  title: 'Thankeeu vs Thankbox — Group Card Comparison | Thankeeu',                        description: 'Thankeeu vs Thankbox group card comparison. Thankeeu supports Naira payments, HRIS integration, live photo walls and Memory Movie.' },
  { path: '/thankeeu-vs-kudoboard', title: 'Thankeeu vs Kudoboard — Best Group Card for Nigerian & Global Teams | Thankeeu',  description: 'Kudoboard alternative for Nigeria. Thankeeu works in NGN, GBP and USD with HRIS sync and live photo wall.' },
  { path: '/birthday-memory-wall', title: 'Birthday Memory Wall — Collect Guest Photos & Videos In One Place | Thankeeu',     description: 'Create a live birthday memory wall where friends and family upload photos and videos throughout the day — no app, no account. Share via WhatsApp, display live at the party, auto Memory Movie™ after.' },
  { path: '/church-memory-wall',   title: 'Church Memory Wall — Capture Every Conference & Service Moment | Thankeeu',         description: 'Capture every moment from church conferences, pastor appreciation days and special services in one permanent memory wall.' },
  { path: '/employee-memory-wall', title: 'Employee Memory Wall — Celebrate Employees With More Than Messages | Thankeeu',     description: 'Capture photos, videos and memories from the whole team for birthdays, farewells, retirements and work anniversaries.' },
  {
    path: '/memory-movie',
    title: 'Thankeeu Memory Movie™ — Turn Birthday Messages, Photos & Videos Into One Beautiful Movie',
    description: 'Thankeeu automatically creates a cinematic 1080p Memory Movie from every message, photo, video and voice note on your group card. Included free on every plan.',
  },
  {
    path: '/occasions/staff-appreciation',
    title: 'Staff Appreciation Group Cards — Thank Your Team | Thankeeu',
    description: 'Create a staff appreciation group card in minutes. Everyone on the team adds a message, photo or voice note. Optional gift collection in GBP or NGN. Free to start.',
  },
  {
    path: '/member/signup',
    title: 'Join Your Team on Thankeeu — Member Signup',
    description: 'Join your company\'s Thankeeu account to sign group cards, send appreciation, and celebrate colleagues automatically.',
  },
  {
    path: '/occasions/birthday',
    title: 'Online Birthday Group Cards Nigeria | Thankeeu',
    description: 'Create an online birthday group card in Nigeria that everyone signs from their phone — photos, voice notes, and a pooled Naira gift.',
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
];

function prerenderStaticPages() {
  let count = 0;
  for (const page of STATIC_PAGES) {
    try {
      const genericRootHtml = `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="${esc(page.path)}">${esc(page.title.replace(/\s*[|\u2014-]\s*Thankeeu.*$/, ''))}</a></nav><main><h1>${esc(page.title.replace(/\s*[|\u2014-]\s*Thankeeu.*$/, ''))}</h1><p>${esc(page.description)}</p><p><a href="/cards/create">Create a group card</a> <a href="/occasions/birthday">Birthday cards</a> <a href="/cards/leaving-card">Leaving cards</a> <a href="/cards/retirement">Retirement cards</a> <a href="/live-memory-wall">Live Memory Wall</a> <a href="/pricing">Pricing</a></p></main>`;
      const html = buildPage({
        title: page.title,
        description: page.description,
        canonicalPath: page.path,
        rootHtml: page.rootHtml || genericRootHtml,
        jsonLd: page.jsonLd,
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

      // ── Named author entity — AI citation credibility requires Person, not Org ──
      const authorName = post.author_name || 'Thankeeu Team';
      const authorSchema = authorName === 'Thankeeu Team'
        ? { '@type': 'Organization', name: 'Thankeeu', url: APP_URL }
        : { '@type': 'Person', name: authorName, url: `${APP_URL}/about` };

      // ── Detect FAQ content in the post body ──
      const hasFaq = (post.content || '').includes('<h2>') &&
        /(FAQ|frequently asked|common question|faq)/i.test(post.content || '');

      // ── Build the JSON-LD graph — Article + Breadcrumb + optional FAQ ──
      const graph = [
        {
          '@type': ['Article', 'BlogPosting'],
          '@id': `${APP_URL}${canonicalPath}#article`,
          headline: post.title,
          description,
          image: ogImage ? [ogImage] : undefined,
          author: authorSchema,
          publisher: {
            '@type': 'Organization',
            '@id': `${APP_URL}/#organization`,
            name: 'Thankeeu',
            logo: { '@type': 'ImageObject', url: `${APP_URL}/android-chrome-512x512.png` },
          },
          datePublished: post.published_at || post.created_at,
          dateModified: post.updated_at || post.published_at || post.created_at,
          mainEntityOfPage: { '@type': 'WebPage', '@id': `${APP_URL}${canonicalPath}` },
          // Speakable — voice AI reads these sections first
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['h1', 'h2', '.article-excerpt'],
          },
          // Keywords extracted from tags
          keywords: (post.tags || []).join(', '),
          inLanguage: 'en',
          isPartOf: { '@type': 'Blog', '@id': `${APP_URL}/blog` },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home',  item: APP_URL },
            { '@type': 'ListItem', position: 2, name: 'Blog',  item: `${APP_URL}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: `${APP_URL}${canonicalPath}` },
          ],
        },
      ];

      // ── FAQPage schema — AI extracts Q&A pairs directly from this ──
      if (hasFaq) {
        const h2Pairs = [...(post.content || '').matchAll(/<h2[^>]*>(.*?)<\/h2>\s*<p[^>]*>(.*?)<\/p>/gs)];
        const faqItems = h2Pairs
          .filter(([, q]) => q.length < 120)
          .slice(0, 8)
          .map(([, q, a]) => ({
            '@type': 'Question',
            name: q.replace(/<[^>]+>/g, '').trim(),
            acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '').trim() },
          }));
        if (faqItems.length > 0) {
          graph.push({ '@type': 'FAQPage', mainEntity: faqItems });
        }
      }

      const jsonLd = { '@context': 'https://schema.org', '@graph': graph };

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

// ── IndexNow — ping Bing/DuckDuckGo/Yahoo after every deploy ────────────────
// Google doesn't support IndexNow (as of July 2026), but Bing shares submissions
// with DuckDuckGo, Yahoo, Ecosia, Yandex and other partners automatically.
// The key file must be hosted at: https://www.thankeeu.com/bb74ad2e9171ce36fe8d42aa69dc5ac7.txt
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'bb74ad2e9171ce36fe8d42aa69dc5ac7';

async function pingIndexNow(urls) {
  if (!INDEXNOW_KEY || urls.length === 0) return;
  const host = new URL(APP_URL).hostname;
  const body = JSON.stringify({
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${APP_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls.slice(0, 10000), // IndexNow batch limit
  });
  try {
    const { default: https } = await import('https');
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.indexnow.org',
        path: '/indexnow',
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
        timeout: 8000,
      }, (res) => {
        res.resume();
        if (res.statusCode === 200 || res.statusCode === 202) {
          console.log(`[indexnow] Pinged ${urls.length} URLs → HTTP ${res.statusCode}`);
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch (err) {
    // Non-fatal — IndexNow failure never breaks the build
    console.warn(`[indexnow] Ping failed (build continues): ${err.message}`);
  }
}

async function main() {
  console.log(`[prerender] API_URL=${API_URL} APP_URL=${APP_URL}`);
  prerenderStaticPages();
  await prerenderBlogPosts();

  // Build list of all URLs to ping IndexNow with
  const staticUrls = STATIC_PAGES.map(p => `${APP_URL}${p.path}`);
  await pingIndexNow(staticUrls);

  console.log('[prerender] Done.');
}

main().catch((err) => {
  // Never fail the build over prerender issues — the SPA fallback still works.
  console.error('[prerender] Unexpected error (build continues):', err);
  process.exit(0);
});
