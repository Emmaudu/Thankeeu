#!/usr/bin/env node
/**
 * generate-sitemap.js
 *
 * Regenerates frontend/public/sitemap.xml with:
 *   1. All static public pages (home, pricing, occasions, auth, legal, etc.)
 *   2. Every published post from the blog_posts table, fetched via
 *      GET /api/blog/sitemap (an existing, lightweight endpoint that returns
 *      [{ slug, updated_at, published_at }, ...] for status='published').
 *
 * Run before `vite build` so the deployed sitemap.xml always reflects the
 * current set of published posts:
 *
 *   node scripts/generate-sitemap.js && vite build
 *
 * Env:
 *   APP_URL      – public site URL, default https://www.thankeeu.com
 *                  (the live site's canonical host is www — the apex
 *                  thankeeu.com 308-redirects to www.thankeeu.com. Every
 *                  URL here MUST use www, or Google sees sitemap entries
 *                  that redirect away from themselves, and canonical tags
 *                  that point back to a URL that just redirected — a
 *                  documented cause of indexing failures.)
 *   API_URL      – backend base URL to fetch /api/blog/sitemap from,
 *                  default https://api.thankeeu.com (override for staging/local)
 *
 * If the API request fails (e.g. backend unreachable during a local build),
 * the script logs a warning and falls back to writing only the static pages
 * — it never throws, so it can't break a build.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const APP_URL = (process.env.APP_URL || 'https://www.thankeeu.com').replace(/\/$/, '');

// API_URL: prefer explicit API_URL, then derive from VITE_API_URL (which is
// usually something like https://api.thankeeu.com/api), then fall back to
// the production default.
function resolveApiBase() {
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, '');
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return 'https://api.thankeeu.com';
}
const API_URL = resolveApiBase();
const OUT_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

const TODAY = new Date().toISOString().slice(0, 10);

// ── Static public pages ──────────────────────────────────────────────────────
// changefreq/priority are SEO hints to crawlers, not guarantees.
const STATIC_PAGES = [
  { loc: '/',                changefreq: 'weekly',  priority: '1.0', hreflang: true,
    image: {
      loc: `${APP_URL}/og-image.png`,
      title: 'Thankeeu — Group Cards and Gifts',
      caption: 'Create beautiful group cards and collect gifts together with Paystack and Flutterwave.',
    } },
  { loc: '/pricing',         changefreq: 'monthly', priority: '0.9', hreflang: true },
  { loc: '/how-it-works',    changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/sample',          changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/faq',             changefreq: 'monthly', priority: '0.6', hreflang: true },

  // ── Occasion landing pages ─────────────────────────────────────────────────
  { loc: '/online-group-cards-uk',      changefreq: 'monthly', priority: '0.9', hreflang: 'en-GB' },
  { loc: '/online-group-cards-us',      changefreq: 'monthly', priority: '0.9', hreflang: 'en-US' },
  { loc: '/online-group-cards-canada',  changefreq: 'monthly', priority: '0.9', hreflang: 'en-CA' },
  { loc: '/online-group-cards-nigeria', changefreq: 'monthly', priority: '0.9', hreflang: 'en-NG' },
  { loc: '/cards/leaving-card',    changefreq: 'monthly', priority: '0.9', hreflang: true },
  { loc: '/cards/retirement',      changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/get-well-soon',   changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/thank-you',       changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/maternity-leave', changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/christmas',       changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/sympathy',                       changefreq: 'monthly', priority: '0.9', hreflang: true },
  { loc: '/cards/welcome',                        changefreq: 'monthly', priority: '0.9', hreflang: true },
  { loc: '/cards/good-luck',                      changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/baby-shower',                    changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/teacher-thank-you',              changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/engagement',                     changefreq: 'monthly', priority: '0.7', hreflang: true },
  { loc: '/cards/new-home',                       changefreq: 'monthly', priority: '0.7', hreflang: true },
  { loc: '/cards/administrative-professionals-day', changefreq: 'monthly', priority: '0.9', hreflang: true },
  { loc: '/cards/boss-day',                       changefreq: 'monthly', priority: '0.9', hreflang: true },
  { loc: '/cards/teacher-appreciation',           changefreq: 'monthly', priority: '0.9', hreflang: true },
  { loc: '/cards/thanksgiving',                   changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/mothers-day',                    changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/cards/fathers-day',                    changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/occasions/birthday',    changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/occasions/farewell',    changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/occasions/anniversary', changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/occasions/promotion',   changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/occasions/graduation',  changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/occasions/new-baby',    changefreq: 'monthly', priority: '0.8', hreflang: true },
  { loc: '/occasions/wedding',     changefreq: 'monthly', priority: '0.8', hreflang: true },

  // ── Individual user auth pages ─────────────────────────────────────────────
  // Only /signup is listed — it carries real marketing copy and is
  // intentionally indexable (noIndex:false). /login and /forgot-password are
  // pure auth forms marked noIndex:true in useSEO() and are deliberately left
  // out of the sitemap — listing a noindex page wastes crawl budget and sends
  // a contradictory signal to Google.
  { loc: '/signup',           changefreq: 'yearly', priority: '0.8', hreflang: true },

  // ── Company / Teams auth pages ─────────────────────────────────────────────
  // /company/login and /company/forgot-password are noIndex:true — excluded.
  { loc: '/company/signup',          changefreq: 'yearly', priority: '0.8', hreflang: true },

  // ── Team member pages ───────────────────────────────────────────────────────
  // /member/login is noIndex:true — excluded.
  { loc: '/member/signup', changefreq: 'yearly', priority: '0.7', hreflang: true },

  // ── Legal ────────────────────────────────────────────────────────────────────
  { loc: '/policy', changefreq: 'yearly', priority: '0.4', hreflang: true },

  // ── Blog index ───────────────────────────────────────────────────────────────
  { loc: '/blog', changefreq: 'daily', priority: '0.9', hreflang: true },
];

// ── Fetch published blog posts from the API ─────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 10000 }, (res) => {
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
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function lastmodFrom(post) {
  const raw = post.updated_at || post.published_at;
  if (!raw) return TODAY;
  const d = new Date(raw);
  if (isNaN(d)) return TODAY;
  return d.toISOString().slice(0, 10);
}

function renderUrl({ loc, changefreq, priority, hreflang, image }) {
  const fullLoc = `${APP_URL}${loc}`;
  const lines = [];
  lines.push('  <url>');
  lines.push(`    <loc>${escapeXML(fullLoc)}</loc>`);
  lines.push(`    <lastmod>${TODAY}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority)   lines.push(`    <priority>${priority}</priority>`);
  if (hreflang) {
    // hreflang can be true (generic 'en') or a specific locale string (e.g. 'en-GB')
    const lang = typeof hreflang === 'string' ? hreflang : 'en';
    lines.push(`    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXML(fullLoc)}"/>`);
    // x-default on homepage and generic pages only
    if (loc === '/' || hreflang === true) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXML(fullLoc)}"/>`);
    }
  }
  if (image) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${escapeXML(image.loc)}</image:loc>`);
    lines.push(`      <image:title>${escapeXML(image.title)}</image:title>`);
    lines.push(`      <image:caption>${escapeXML(image.caption)}</image:caption>`);
    lines.push('    </image:image>');
  }
  lines.push('  </url>');
  return lines.join('\n');
}

function renderBlogPostUrl(post) {
  const fullLoc = `${APP_URL}/blog/${post.slug}`;
  const lines = [];
  lines.push('  <url>');
  lines.push(`    <loc>${escapeXML(fullLoc)}</loc>`);
  lines.push(`    <lastmod>${lastmodFrom(post)}</lastmod>`);
  lines.push('    <changefreq>monthly</changefreq>');
  lines.push(`    <priority>${post.is_featured ? '0.8' : '0.7'}</priority>`);
  lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${escapeXML(fullLoc)}"/>`);
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXML(fullLoc)}"/>`);
  lines.push('  </url>');
  return lines.join('\n');
}

async function main() {
  let posts = [];
  try {
    posts = await fetchJSON(`${API_URL}/api/blog/sitemap`);
    if (!Array.isArray(posts)) {
      console.warn('[generate-sitemap] /api/blog/sitemap did not return an array — skipping blog posts');
      posts = [];
    } else {
      console.log(`[generate-sitemap] fetched ${posts.length} published blog posts`);
    }
  } catch (err) {
    console.warn(`[generate-sitemap] could not fetch blog posts (${err.message}) — writing static pages only`);
  }

  const staticBlocks = STATIC_PAGES.map(renderUrl);
  const blogBlocks   = posts.filter(p => p && p.slug).map(renderBlogPostUrl);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">

${staticBlocks.join('\n\n')}

${blogBlocks.join('\n\n')}

</urlset>
`;

  fs.writeFileSync(OUT_PATH, xml);
  console.log(`[generate-sitemap] wrote ${STATIC_PAGES.length} static pages + ${blogBlocks.length} blog posts to ${OUT_PATH}`);
}

main();
