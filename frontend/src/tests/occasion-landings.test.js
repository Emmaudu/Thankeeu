/**
 * Quality gate for the occasion × country landing pages
 * (data/occasionLandings). Every page must pass all of these.
 *
 * Run one file while writing it:   ONLY=farewell-1 npx vitest run src/tests/occasion-landings.test.js
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LANDING_MANIFEST, manifestByKey, hreflangCluster } from '../data/occasionLandings/manifest';
import { pageFileOf } from '../data/occasionLandings/index';
import { ALL_LANDING_PAGES } from '../data/occasionLandings/all';
import { HERO_PHOTOS, HERO_GIFS, blogLinksFor, CORE_LINKS, COUNTRY_META } from '../data/occasionLandings/shared';
import { getIllustratedCovers } from '../utils/illustratedCardDesigns';

const ONLY = process.env.ONLY || '';
const PAGES = ALL_LANDING_PAGES.filter(p => !ONLY || pageFileOf(p) === ONLY);
const COMPLETE = !ONLY;

const app = fs.readFileSync(path.resolve(__dirname, '../App.jsx'), 'utf8');
const ICONS = fs.readFileSync(path.resolve(__dirname, '../components/ui/Icon.jsx'), 'utf8');

// Every visible string on a page (not URLs, keys or cover ids).
function texts(p) {
  const out = [p.title, p.description, p.breadcrumb, p.tagline, p.h1, p.subtitle, p.coversTitle, p.coversIntro,
    p.stepsTitle, p.featuresTitle, p.featuresIntro, p.messagesTitle, p.messagesIntro, p.pricingIntro,
    p.comparisonIntro, p.ctaTitle, p.ctaText];
  for (const [t, b] of p.highlights || []) out.push(t, b);
  for (const [t, b] of p.steps || []) out.push(t, b);
  for (const [, t, b] of p.features || []) out.push(t, b);
  for (const s of p.sections || []) { out.push(s.h2, ...(s.paragraphs || [])); for (const [t, b] of s.items || []) out.push(t, b); }
  out.push(...(p.messages || []));
  for (const f of p.faqs || []) out.push(f.q, f.a);
  for (const a of p.heroAlbums || []) {
    out.push(a.recipient, a.label, a.gift?.claimLine, a.gift?.amount);
    for (const s of a.signers || []) out.push(s.name, s.role, s.text, s.media?.caption, s.media?.line);
  }
  return out.filter(v => v != null);
}
const stripLinks = (t) => String(t).replace(/\]\((\/[^)\s]*)\)/g, ']');
const words = (t) => String(t).toLowerCase().replace(/\[|\]\([^)]*\)/g, ' ').match(/[\p{L}\p{N}']+/gu) || [];
const bodyText = (p) => texts(p).join(' ');

// Paths a page may link to inside its copy.
const ROUTES = new Set([...app.matchAll(/path="([^"]+)"/g)].map(m => m[1]));
const KNOWN = new Set([...ROUTES, ...LANDING_MANIFEST.map(m => m.path), '/pricing', '/sample', '/memory-movie', '/live-memory-wall']);
const linkTargets = (t) => [...String(t).matchAll(/\]\((\/[^)\s]*)\)/g)].map(m => m[1].split('?')[0]);

describe('occasion landing pages', () => {
  it('has a page for every manifest entry, each in the right file', () => {
    if (COMPLETE) {
      expect(ALL_LANDING_PAGES.map(p => p.key).sort()).toEqual(LANDING_MANIFEST.map(m => m.key).sort());
      expect(LANDING_MANIFEST).toHaveLength(88);
    }
    for (const p of PAGES) expect(manifestByKey[p.key]).toBeTruthy();
  });

  it('every page is routed', () => {
    for (const m of LANDING_MANIFEST) expect(app).toContain('OCCASION_LANDINGS_ROUTES');
    expect(new Set(LANDING_MANIFEST.map(m => m.path)).size).toBe(LANDING_MANIFEST.length);
  });

  it('has the full structure', () => {
    for (const p of PAGES) {
      const at = p.key;
      expect(p.heroAlbums, at).toHaveLength(3);
      expect(p.heroAlbums[0].signers.length, at).toBeGreaterThanOrEqual(4);
      for (const a of p.heroAlbums.slice(1)) expect(a.signers.length, at).toBeGreaterThanOrEqual(2);
      expect(p.highlights, at).toHaveLength(4);
      expect(p.steps, at).toHaveLength(4);
      expect(p.features, at).toHaveLength(6);
      expect(p.sections.length, at).toBeGreaterThanOrEqual(3);
      for (const s of p.sections) expect(s.paragraphs.length, `${at} ${s.h2}`).toBeGreaterThanOrEqual(2);
      expect(p.messages.length, at).toBeGreaterThanOrEqual(8);
      expect(p.faqs.length, at).toBeGreaterThanOrEqual(12);
      for (const k of ['title', 'description', 'keywords', 'breadcrumb', 'tagline', 'h1', 'subtitle', 'coversTitle', 'coversIntro', 'stepsTitle', 'featuresTitle', 'featuresIntro', 'messagesTitle', 'messagesIntro', 'pricingIntro', 'comparisonIntro', 'ctaTitle', 'ctaText']) {
        expect(typeof p[k] === 'string' && p[k].trim().length > 0, `${at}.${k}`).toBe(true);
      }
    }
  });

  it('has search friendly titles, descriptions and H1s', () => {
    for (const p of PAGES) {
      expect(p.title.length, `${p.key} title: ${p.title}`).toBeLessThanOrEqual(65);
      expect(p.title.length, p.key).toBeGreaterThanOrEqual(35);
      expect(p.title, p.key).toMatch(/\| Thankeeu$/);
      expect(p.description.length, `${p.key} description ${p.description.length}`).toBeGreaterThanOrEqual(130);
      expect(p.description.length, `${p.key} description ${p.description.length}`).toBeLessThanOrEqual(160);
      expect(p.h1.length, p.key).toBeLessThanOrEqual(80);
      expect(p.keywords.split(',').length, p.key).toBeGreaterThanOrEqual(8);
    }
  });

  it('titles, descriptions and H1s are unique across all pages', () => {
    for (const k of ['title', 'description', 'h1', 'subtitle', 'breadcrumb']) {
      const seen = new Map();
      for (const p of ALL_LANDING_PAGES) {
        const v = p[k].toLowerCase();
        expect(seen.get(v), `${k} repeated: ${p.key} and ${seen.get(v)}`).toBeUndefined();
        seen.set(v, p.key);
      }
    }
  });

  it('copy has no dashes, hyphens or emojis', () => {
    for (const p of PAGES) {
      for (const t of texts(p)) {
        const s = stripLinks(t);
        expect(s, `${p.key}: "${t}"`).not.toMatch(/[-‐-―−]/);
        expect(s, `${p.key}: "${t}"`).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });

  it('avoids stock filler phrases', () => {
    const SLOP = /\b(seamless(ly)?|elevate|unleash|game ?changer|delve|tapestry|in today'?s (fast paced|digital)|look no further|whether you'?re|navigate the|cutting edge|revolutioni[sz]e|effortless(ly)?|treasure trove|embark|bespoke experience|unforgettable experience|take it to the next level)\b/i;
    for (const p of PAGES) for (const t of texts(p)) expect(t, `${p.key}: "${t}"`).not.toMatch(SLOP);
  });

  it('hero albums use real covers, photos and GIFs', () => {
    for (const p of PAGES) {
      for (const a of p.heroAlbums) {
        const [occ, stem] = a.cover.split('/');
        expect(getIllustratedCovers(occ).some(d => d.id.endsWith(`-${stem}`)), `${p.key} cover ${a.cover}`).toBe(true);
        for (const s of a.signers) {
          const m = s.media;
          expect(['gif', 'photo', 'voice'], p.key).toContain(m.kind);
          if (m.kind === 'gif') expect(HERO_GIFS[m.gif], `${p.key} gif ${m.gif}`).toBeTruthy();
          if (m.kind === 'photo') expect(HERO_PHOTOS[m.photo], `${p.key} photo ${m.photo}`).toBeTruthy();
          if (m.kind === 'voice') { expect(HERO_GIFS[m.gif], `${p.key} voice gif`).toBeTruthy(); expect(m.line.length).toBeGreaterThan(20); }
          expect(s.text.length, `${p.key} signer text`).toBeLessThanOrEqual(150);
        }
      }
      // each page's three recipients differ, and differ from every other page's
    }
    const recipients = new Map();
    for (const p of ALL_LANDING_PAGES) for (const a of p.heroAlbums) {
      const k = a.recipient.toLowerCase();
      expect(recipients.get(k), `hero recipient ${a.recipient} used on ${p.key} and ${recipients.get(k)}`).toBeUndefined();
      recipients.set(k, p.key);
    }
  });

  it('feature icons exist', () => {
    for (const p of PAGES) for (const [icon] of p.features) expect(ICONS, `${p.key} icon ${icon}`).toMatch(new RegExp(`\\b${icon}\\b`));
  });

  it('links in the copy go to pages that exist', () => {
    for (const p of PAGES) for (const t of texts(p)) for (const href of linkTargets(t)) {
      expect(KNOWN.has(href), `${p.key} links to ${href}`).toBe(true);
    }
    for (const p of PAGES) for (const [href] of blogLinksFor(p)) expect(href).toMatch(/^\/blog\/[a-z0-9-]+$/);
    for (const links of Object.values(CORE_LINKS)) for (const [href] of links) expect(KNOWN.has(href), href).toBe(true);
  });

  it('no two pages read alike', () => {
    // Share of word trigrams one page has in common with another.
    const grams = new Map();
    const gramsOf = (p) => {
      if (!grams.has(p.key)) {
        const w = words(bodyText(p)); const g = new Set();
        for (let i = 0; i + 2 < w.length; i++) g.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
        grams.set(p.key, g);
      }
      return grams.get(p.key);
    };
    for (const a of PAGES) {
      for (const b of ALL_LANDING_PAGES) {
        if (a.key === b.key) continue;
        const ga = gramsOf(a); const gb = gramsOf(b);
        let shared = 0; for (const g of ga) if (gb.has(g)) shared++;
        const ratio = shared / Math.min(ga.size, gb.size);
        expect(ratio, `${a.key} and ${b.key} share ${(ratio * 100).toFixed(0)}% of phrases`).toBeLessThan(0.2);
      }
    }
  });

  it('every page is long enough to be useful', () => {
    for (const p of PAGES) expect(words(bodyText(p)).length, p.key).toBeGreaterThanOrEqual(1400);
  });

  it('pages in a country mention that country, and local pages are in their language', () => {
    const NAMES = { uk: /\b(UK|British|Britain|England|Scotland|Wales|London)\b/, us: /\b(US|USA|American|America|United States)\b/, canada: /\bCanad/, germany: /\b(Germany|German|Deutschland|deutsch)/i, netherlands: /\b(Netherlands|Dutch|Nederland|Amsterdam)/i, colombia: /\bColombi/i, mauritius: /\bMaurit/i, philippines: /\b(Philippines|Filipino|Pinoy|Manila)/i, australia: /\b(Australia|Aussie|Sydney|Melbourne)/i, france: /\b(France|French|français|Paris)/i };
    const STOP = { de: /\b(und|der|die|das|nicht|mit|für)\b/gi, nl: /\b(het|een|niet|voor|met|van)\b/gi, es: /\b(el|la|los|las|para|con|una)\b/gi, fr: /\b(le|la|les|des|pour|avec|une)\b/gi };
    for (const p of PAGES) {
      expect(bodyText(p), p.key).toMatch(NAMES[p.country]);
      if (p.lang !== 'en') expect((bodyText(p).match(STOP[p.lang]) || []).length, `${p.key} should be written in ${p.lang}`).toBeGreaterThan(80);
    }
  });

  it('never quotes a price that would go stale', () => {
    // Copy may only use the launch prices that are swapped for today's on
    // screen ($3.15, $5.67, $12.60, and £2.45 on UK pages). Local prices come
    // from the live pricing table. Hero gift totals are illustrations.
    const ALLOWED = /^(\$3\.15|\$5\.67|\$12\.60)$/;
    for (const p of PAGES) {
      const { heroAlbums: _h, ...rest } = p;
      const t = texts({ ...rest, heroAlbums: [] }).join(' ');
      const amounts = t.match(/(?:[$€£₱]|COP|MUR|Rs\.?|PHP|USD|EUR|GBP|CAD)\s?\d[\d.,]*/g) || [];
      const bad = amounts.map(a => a.replace(/[.,]$/, '')).filter(a => !ALLOWED.test(a) && !(p.country === 'uk' && a === '£2.45'));
      expect(bad, p.key).toEqual([]);
    }
  });

  it('hreflang clusters are complete and reciprocal', () => {
    for (const m of LANDING_MANIFEST) {
      const c = hreflangCluster(m);
      const size = LANDING_MANIFEST.filter(x => x.occasion === m.occasion && x.variant === m.variant).length;
      expect(c).toHaveLength(size);
      expect(new Set(c.map(x => x.hreflang)).size).toBe(size);
      expect(c.some(x => x.path === m.path)).toBe(true);
    }
    for (const c of Object.keys(COUNTRY_META)) expect(LANDING_MANIFEST.filter(m => m.country === c)).toHaveLength(['australia', 'france'].includes(c) ? 4 : 10);
  });
});
