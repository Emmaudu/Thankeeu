import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { COUNTRY_LANDINGS, OCCASION_LABELS, landingFaqs } from '../data/countryLandings';
import { getIllustratedCovers } from '../utils/illustratedCardDesigns';

const root = path.resolve(__dirname, '../..');
const home = fs.readFileSync(path.join(root, 'src/pages/Home.jsx'), 'utf8');
const country = fs.readFileSync(path.join(root, 'src/pages/occasions/CountryLandingPage.jsx'), 'utf8');

describe('country landing pages on the homepage layout', () => {
  const pages = Object.entries(COUNTRY_LANDINGS);

  it('covers UK, US, Canada and the global page, each routed to <Home landing>', () => {
    expect(Object.keys(COUNTRY_LANDINGS).sort()).toEqual(['canada', 'nigeria', 'uk', 'us']);
    for (const [key] of pages) expect(country).toContain(`<Home landing={COUNTRY_LANDINGS.${key}} />`);
  });

  it('has unique, well-sized titles and descriptions and a keyword H1', () => {
    const titles = new Set(); const descs = new Set();
    for (const [, l] of pages) {
      expect(l.title).toMatch(/^Online Group Cards/);
      expect(l.description.length).toBeLessThanOrEqual(160);
      expect(l.description.length).toBeGreaterThan(110);
      expect(`${l.h1Lead} ${l.h1Accent}`.toLowerCase()).toContain('online group cards');
      titles.add(l.title); descs.add(l.description);
    }
    expect(titles.size).toBe(4); expect(descs.size).toBe(4);
  });

  it('shows covers from many categories, all of which exist', () => {
    for (const [, l] of pages) {
      expect(l.coverOccasions.length).toBeGreaterThanOrEqual(8);
      for (const occ of l.coverOccasions) {
        expect(OCCASION_LABELS[occ]).toBeTruthy();
        expect(getIllustratedCovers(occ).length).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('FAQ markup and visible FAQ come from the same list, with no duplicate questions', () => {
    expect(home).toContain('SCHEMAS.faqPage(faqs)');
    expect(home).toContain('{faqs.map(');
    for (const [, l] of pages) {
      const qs = landingFaqs(l).map(f => f.q);
      expect(new Set(qs).size).toBe(qs.length);
      expect(qs.length).toBe(l.faqs.length + 5);
    }
  });

  it('the /online-group-cards-nigeria page is global and USD — nothing Nigeria-specific', () => {
    const l = COUNTRY_LANDINGS.nigeria;
    const { path: _p, blogLinks, ...visible } = l;
    expect(JSON.stringify(visible)).not.toMatch(/nigeria|naira|₦|NGN|lagos|flutterwave/i);
    expect(blogLinks.map(([, label]) => label).join(' ')).not.toMatch(/nigeria/i);
    expect(l.currency).toMatch(/USD/);
  });

  it('never shows a naira price for the card fee', () => {
    for (const [, l] of pages) expect(JSON.stringify(l)).not.toMatch(/NGN\s?\d|₦\s?\d/);
  });
});
