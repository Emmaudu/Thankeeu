/** Quality gate for the Thankeeu for Teams pages (data/teamsLandings). ONLY=<country> to check one file. */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TEAMS_MANIFEST, teamsHreflang } from '../data/teamsLandings/manifest';
import { ALL_TEAMS_PAGES } from '../data/teamsLandings/all';
import { ALL_LANDING_PAGES } from '../data/occasionLandings/all';
import { LANDING_MANIFEST } from '../data/occasionLandings/manifest';
import { HERO_PHOTOS, HERO_GIFS } from '../data/occasionLandings/shared';
import { TEAMS_BLOG, occasionLinksFor } from '../data/teamsLandings/shared';
import { getIllustratedCovers } from '../utils/illustratedCardDesigns';

const ONLY = process.env.ONLY || '';
const PAGES = ALL_TEAMS_PAGES.filter(p => !ONLY || p.country === ONLY);
const app = fs.readFileSync(path.resolve(__dirname, '../App.jsx'), 'utf8');
const ICONS = fs.readFileSync(path.resolve(__dirname, '../components/ui/Icon.jsx'), 'utf8');

function texts(p) {
  const o = [p.title, p.description, p.breadcrumb, p.tagline, p.h1, p.subtitle, p.problemTitle, p.problemIntro, p.automationTitle, p.automationIntro,
    p.integrationsIntro, p.featuresTitle, p.featuresIntro, p.rolloutTitle, p.pricingIntro, p.comparisonIntro, p.ctaTitle, p.ctaText];
  for (const [t, b] of p.proof || []) o.push(t, b);
  for (const [t, b] of p.problems || []) o.push(t, b);
  for (const [, t, b] of p.automations || []) o.push(t, b);
  for (const [, t, b] of p.features || []) o.push(t, b);
  for (const [t, b] of p.rollout || []) o.push(t, b);
  for (const s of p.sections || []) { o.push(s.h2, ...(s.paragraphs || [])); for (const [t, b] of s.items || []) o.push(t, b); }
  for (const f of p.faqs || []) o.push(f.q, f.a);
  for (const a of p.heroAlbums || []) { o.push(a.recipient, a.label, a.gift?.claimLine); for (const s of a.signers || []) o.push(s.name, s.role, s.text, s.media?.caption, s.media?.line); }
  return o.filter(v => v != null);
}
function occTexts(p) {
  const o = [p.title, p.description, p.h1, p.subtitle, p.coversIntro, p.featuresIntro, p.messagesIntro, p.pricingIntro, p.comparisonIntro, p.ctaText];
  for (const [t, b] of p.highlights) o.push(t, b);
  for (const [t, b] of p.steps) o.push(t, b);
  for (const [, t, b] of p.features) o.push(t, b);
  for (const s of p.sections) o.push(s.h2, ...s.paragraphs);
  o.push(...p.messages); for (const f of p.faqs) o.push(f.q, f.a);
  return o;
}
const words = (t) => String(t).toLowerCase().replace(/\[|\]\([^)]*\)/g, ' ').match(/[\p{L}\p{N}']+/gu) || [];
const gramsOf = (arr) => { const w = words(arr.join(' ')); const g = new Set(); for (let i = 0; i + 2 < w.length; i++) g.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`); return g; };
const ROUTES = new Set([...app.matchAll(/path="([^"]+)"/g)].map(m => m[1]));
const KNOWN = new Set([...ROUTES, ...LANDING_MANIFEST.map(m => m.path), ...TEAMS_MANIFEST.map(m => m.path)]);

describe('Thankeeu for Teams pages', () => {
  it('every page exists and is routed', () => {
    if (!ONLY) expect(ALL_TEAMS_PAGES.map(p => p.key).sort()).toEqual(TEAMS_MANIFEST.map(m => m.key).sort());
    expect(app).toContain('TEAMS_LANDINGS_ROUTES');
  });

  it('has the full structure', () => {
    for (const p of PAGES) {
      expect(p.heroAlbums, p.key).toHaveLength(3);
      expect(p.heroAlbums[0].signers.length, p.key).toBeGreaterThanOrEqual(4);
      expect(p.proof, p.key).toHaveLength(4);
      expect(p.problems, p.key).toHaveLength(3);
      expect(p.automations, p.key).toHaveLength(6);
      expect(p.features, p.key).toHaveLength(6);
      expect(p.rollout, p.key).toHaveLength(4);
      expect(p.sections.length, p.key).toBeGreaterThanOrEqual(3);
      expect(p.faqs.length, p.key).toBeGreaterThanOrEqual(14);
      for (const k of ['title', 'description', 'keywords', 'breadcrumb', 'tagline', 'h1', 'subtitle', 'problemTitle', 'problemIntro', 'automationTitle', 'automationIntro', 'integrationsIntro', 'featuresTitle', 'featuresIntro', 'rolloutTitle', 'pricingIntro', 'comparisonIntro', 'ctaTitle', 'ctaText']) {
        expect(typeof p[k] === 'string' && p[k].trim().length > 0, `${p.key}.${k}`).toBe(true);
      }
    }
  });

  it('search friendly and unique titles, descriptions and H1s', () => {
    for (const p of PAGES) {
      expect(p.title.length, p.key).toBeLessThanOrEqual(65);
      expect(p.title, p.key).toMatch(/\| Thankeeu$/);
      expect(p.description.length, `${p.key} ${p.description.length}`).toBeGreaterThanOrEqual(130);
      expect(p.description.length, `${p.key} ${p.description.length}`).toBeLessThanOrEqual(160);
      expect(p.keywords.split(',').length, p.key).toBeGreaterThanOrEqual(8);
    }
    const all = [...ALL_TEAMS_PAGES, ...ALL_LANDING_PAGES];
    for (const k of ['title', 'description', 'h1']) expect(new Set(all.map(p => p[k].toLowerCase())).size, k).toBe(all.length);
  });

  it('copy has no dashes, emojis, filler or prices', () => {
    const SLOP = /\b(seamless(ly)?|elevate|unleash|game ?changer|delve|tapestry|look no further|whether you'?re|cutting edge|revolutioni[sz]e|effortless(ly)?|treasure trove|embark|synerg\w*)\b/i;
    const FALSE = /\b(SOC ?2|ISO ?27001|single sign on|SSO|GDPR compliant|DSGVO konform|data residency|Slack integration|Teams integration)\b/i;
    for (const p of PAGES) for (const t of texts(p)) {
      const s = String(t).replace(/\]\((\/[^)\s]*)\)/g, ']');
      expect(s, `${p.key}: ${t}`).not.toMatch(/[-‐-―−]/);
      expect(s, `${p.key}: ${t}`).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(s, `${p.key}: ${t}`).not.toMatch(SLOP);
      expect(s, `${p.key}: ${t}`).not.toMatch(/(?:[$€£₹]|Rs\.?|MUR|USD|EUR|GBP|CAD)\s?\d/);
    }
    for (const p of PAGES) {
      const { heroAlbums: _h, comparisonIntro: _c, faqs, ...rest } = p;
      // Competitor names may appear; false claims about Thankeeu may not.
      for (const t of texts({ ...rest, faqs: [], heroAlbums: [] })) expect(String(t), `${p.key}: ${t}`).not.toMatch(FALSE);
    }
  });

  it('hero albums use real covers, photos and GIFs, with unique recipients', () => {
    const seen = new Map();
    for (const p of ALL_LANDING_PAGES) for (const a of p.heroAlbums) seen.set(a.recipient.toLowerCase(), p.key);
    for (const p of PAGES) for (const a of p.heroAlbums) {
      const [occ, stem] = a.cover.split('/');
      expect(getIllustratedCovers(occ).some(d => d.id.endsWith(`-${stem}`)), `${p.key} ${a.cover}`).toBe(true);
      expect(seen.get(a.recipient.toLowerCase()), `${p.key} recipient ${a.recipient}`).toBeUndefined();
      seen.set(a.recipient.toLowerCase(), p.key);
      for (const s of a.signers) {
        if (s.media.kind === 'gif') expect(HERO_GIFS[s.media.gif], p.key).toBeTruthy();
        if (s.media.kind === 'photo') expect(HERO_PHOTOS[s.media.photo], p.key).toBeTruthy();
        if (s.media.kind === 'voice') expect(HERO_GIFS[s.media.gif], p.key).toBeTruthy();
        expect(s.text.length, p.key).toBeLessThanOrEqual(150);
      }
    }
  });

  it('icons and links exist', () => {
    for (const p of PAGES) for (const [icon] of [...p.automations, ...p.features]) expect(ICONS, `${p.key} ${icon}`).toMatch(new RegExp(`\\b${icon}\\b`));
    for (const p of PAGES) for (const t of texts(p)) for (const m of String(t).matchAll(/\]\((\/[^)\s]*)\)/g)) expect(KNOWN.has(m[1].split('?')[0]), `${p.key} ${m[1]}`).toBe(true);
    for (const [href] of TEAMS_BLOG) expect(href).toMatch(/^\/blog\//);
    for (const c of ['us', 'uk', 'canada', 'germany', 'mauritius']) for (const [href] of occasionLinksFor(c)) expect(KNOWN.has(href)).toBe(true);
    expect(ROUTES.has('/business')).toBe(true);
    expect(ROUTES.has('/company/signup')).toBe(true);
  });

  it('long, unique and different from every other page', () => {
    const occ = ALL_LANDING_PAGES.map(p => [p.key, gramsOf(occTexts(p))]);
    const team = ALL_TEAMS_PAGES.map(p => [p.key, gramsOf(texts(p))]);
    for (const p of PAGES) {
      expect(words(texts(p).join(' ')).length, p.key).toBeGreaterThanOrEqual(1500);
      const g = gramsOf(texts(p));
      for (const [k, o] of [...team, ...occ]) {
        if (k === p.key) continue;
        let n = 0; for (const x of g) if (o.has(x)) n++;
        expect(n / Math.min(g.size, o.size), `${p.key} vs ${k}`).toBeLessThan(0.2);
      }
    }
  });

  it('mentions its country; the German page is German', () => {
    const NAMES = { us: /\b(US|USA|American|United States)\b/, uk: /\b(UK|British|Britain|England|Scotland|Wales)\b/, canada: /\bCanad/, germany: /\b(Germany|Deutschland|deutsch)/i, mauritius: /\bMaurit/ };
    for (const p of PAGES) {
      expect(texts(p).join(' '), p.key).toMatch(NAMES[p.country]);
      if (p.lang === 'de') expect((texts(p).join(' ').match(/\b(und|der|die|das|nicht|mit|für)\b/gi) || []).length, p.key).toBeGreaterThan(100);
    }
  });

  it('hreflang clusters are reciprocal', () => {
    for (const m of TEAMS_MANIFEST) {
      const c = teamsHreflang(m);
      expect(c).toHaveLength(5);
      expect(new Set(c.map(x => x.hreflang)).size).toBe(5);
      expect(c.some(x => x.path === m.path)).toBe(true);
    }
  });
});
