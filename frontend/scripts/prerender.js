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
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${rootHtml}</div>`);
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
    path: '/',
    title: 'Thankeeu — Online Group Cards & Gift Collection | Everyone Signs',
    description: 'Create an online group card for birthdays, leaving dos, retirements and more. Everyone signs from one link. Optional gift pool in GBP, NGN, USD and more. Free to start.',
  },
  {
    path: '/pricing',
    title: 'Pricing — Online Group Cards from £4.99 | Thankeeu',
    description: 'Send a group card from £4.99 GBP / ₦5,000 NGN. Pool a gift in GBP, NGN, USD, CAD and more. Team plans with unlimited cards and HR automation. Free to create — pay when you send.',
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
  { path: '/cards/sympathy', title: 'Online Sympathy Card — Group Condolence Cards | Thankeeu', description: 'Send heartfelt condolences from the whole team with an online sympathy card. Everyone signs from one link — kind words, memories and support — delivered privately when needed most.' },
  { path: '/cards/welcome', title: 'Online Welcome Card — Group Welcome Cards for New Starters | Thankeeu', description: 'Make a new starter feel at home from day one with a welcome card signed by the whole team. Everyone adds a message, photo or GIF from one link. Free to start.' },
  { path: '/cards/good-luck', title: 'Online Good Luck Card — Group Good Luck Cards | Thankeeu', description: 'Send good luck wishes from the whole group with one online card. Perfect for job interviews, exams, surgery, a new venture, or any big moment. Everyone signs from one link.' },
  { path: '/cards/baby-shower', title: 'Online Baby Shower Card — Group Cards & Gift Collections | Thankeeu', description: 'Create an online baby shower card the whole team or group signs from one link. Messages, photos, GIFs and voice notes, with an optional pooled baby shower gift.' },
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
  { path: '/leaving-cards-uk', title: 'Online Leaving Cards UK — Group Leaving Cards Everyone Signs | Thankeeu', description: 'Create an online leaving card for a UK colleague in under 2 minutes. The whole team signs from one link — messages, photos, GIFs, voice notes — with a leaving gift collection in GBP.' },
  { path: '/birthday-cards-uk', title: 'Online Birthday Cards UK — Group Birthday Cards for Every Team | Thankeeu', description: 'Create an online birthday group card for a UK colleague. Everyone signs from one link with a birthday gift collection in GBP. Delivered at midnight.' },
  { path: '/retirement-cards-uk', title: 'Online Retirement Cards UK — Group Cards for Retiring Colleagues | Thankeeu', description: 'Create an online retirement group card for a UK colleague — signed by current and former colleagues, with an optional retirement gift collection in GBP.' },
  { path: '/get-well-soon-cards-uk', title: 'Online Get Well Soon Cards UK — Group Cards from the Whole Team | Thankeeu', description: 'Send strength from the whole UK team with an online get well soon card. Everyone signs from one link — messages, photos and voice notes — delivered privately.' },
  {
    path: '/live-memory-wall',
    title: 'Live Memory Wall™ — Collect Every Photo & Video from Your Celebration | Thankeeu',
    description: 'Thankeeu Live Memory Wall lets guests upload photos and videos in real time. Everything preserved forever and automatically becomes a Memory Movie.',
  },
  {
    path: '/wedding-memory-wall',
    title: "Wedding Memory Wall — Collect Every Guest's Photos & Videos | Thankeeu",
    description: "Collect every guest's wedding photos and videos in one shared Memory Wall. Guests scan a QR code, upload throughout the day, and get a permanent album and Memory Movie.",
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
  { path: '/wedding-memory-wall',  title: 'Wedding Guest Photo Sharing — Collect Every Photo with a QR Code | Thankeeu',      description: 'Collect every wedding guest\'s photos and videos in one place. Guests scan a QR code — no app, no account. Real-time live photo wall for the reception. Plus heartfelt messages, voice notes, and a gift pot.' },
  { path: '/thankeeu-vs-wedtrove',  title: 'Thankeeu vs Wedtrove — Which Is Better for Wedding Guest Photos? | Thankeeu', description: 'Honest comparison of Thankeeu vs Wedtrove for wedding guest photo sharing. Thankeeu adds messages, voice notes, gift pot, Memory Movie and Naira payments.' },
  { path: '/thankeeu-vs-thankbox',  title: 'Thankeeu vs Thankbox — Group Card Comparison | Thankeeu',                        description: 'Thankeeu vs Thankbox group card comparison. Thankeeu supports Naira payments, HRIS integration, live photo walls and Memory Movie.' },
  { path: '/weduploader-alternative', title: 'The Best WedUploader Alternative for Wedding Guest Photo Sharing | Thankeeu', description: 'Collect photos, videos, voice notes, GIFs, wishes and cash gifts in one beautiful wedding memory experience. The complete WedUploader alternative.' },
  { path: '/guestpix-alternative',   title: 'The Best GuestPix Alternative for Wedding Guest Photo Sharing | Thankeeu',   description: 'GuestPix alternative that collects photos, videos, voice notes, GIFs, messages and cash gifts. Live gallery, Memory Movie, permanent storage.' },
  { path: '/kululu-alternative',     title: 'The Best Kululu Alternative for Wedding Guest Photo Sharing | Thankeeu',     description: 'Kululu alternative with photo uploads, voice blessings, cash gifts and Memory Movie. Works in NGN, GBP, USD. No app for guests.' },
  { path: '/pov-alternative',        title: 'The Best POV Alternative for Wedding Guest Photo Sharing | Thankeeu',        description: 'POV app alternative with complete wedding memory collection — photos, videos, voice notes, GIFs, messages and cash gifts in one platform.' },
  { path: '/guestcam-alternative',   title: 'The Best GuestCam Alternative for Wedding Guest Photo Sharing | Thankeeu',   description: 'GuestCam alternative that collects every wedding memory — photos, videos, voice notes and gifts in one place. Auto Memory Movie included.' },
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
        rootHtml: `<nav aria-label="Breadcrumb"><a href="/">Thankeeu</a> / <a href="${esc(page.path)}">${esc(page.title.replace(/\s*[|â€”-]\s*Thankeeu.*$/, ''))}</a></nav><main><h1>${esc(page.title.replace(/\s*[|â€”-]\s*Thankeeu.*$/, ''))}</h1><p>${esc(page.description)}</p><p><a href="/create-card">Create a group card</a> <a href="/occasions/birthday">Birthday cards</a> <a href="/cards/leaving-card">Leaving cards</a> <a href="/cards/retirement">Retirement cards</a> <a href="/live-memory-wall">Live Memory Wall</a> <a href="/pricing">Pricing</a></p></main>`,
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
