import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { weddingLanding, WEDDING_LANDING_KEYS } from '../data/weddingLandings';
import { landingFaqs } from '../data/countryLandings';

const root = path.resolve(__dirname, '../..');
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const pages = WEDDING_LANDING_KEYS.map(k => [k, weddingLanding(k)]);

describe('wedding landing pages on the homepage layout', () => {
  it('covers every wedding guestbook, photo, gift and comparison page', () => {
    expect(WEDDING_LANDING_KEYS.length).toBe(25);
    for (const [, l] of pages) expect(app).toContain(`path="${l.path}"`);
  });

  it('each page file renders the homepage template with its own key', () => {
    for (const [key] of pages) {
      const dirs = ['src/pages', 'src/pages/occasions'];
      const hit = dirs.some(d => fs.readdirSync(path.join(root, d)).some(f =>
        f.endsWith('.jsx') && fs.readFileSync(path.join(root, d, f), 'utf8').includes(`page="${key}"`)));
      expect(hit, key).toBe(true);
    }
  });

  it('has unique titles, descriptions and H1s, all within search limits', () => {
    const seen = { t: new Set(), d: new Set(), h: new Set() };
    for (const [key, l] of pages) {
      expect(l.description.length, key).toBeLessThanOrEqual(160);
      const h1 = `${l.h1Lead} ${l.h1Accent}`;
      seen.t.add(l.title); seen.d.add(l.description); seen.h.add(h1);
    }
    expect(seen.t.size).toBe(pages.length);
    expect(seen.d.size).toBe(pages.length);
    expect(seen.h.size).toBe(pages.length);
  });

  it('keeps the hero on weddings only — wedding covers, wedding CTA, no office sections', () => {
    for (const [, l] of pages) {
      expect(l.coverOccasions).toEqual(['wedding']);
      expect(l.ctaTo).toBe('/card/new?occasion=wedding');
      expect(l.hideTeams).toBe(true);
      expect(landingFaqs(l)).toEqual(l.faqs); // no homepage/office FAQs mixed in
    }
  });

  it('no duplicate FAQ questions on a page and no stale or unsupported claims', () => {
    for (const [key, l] of pages) {
      const qs = l.faqs.map(f => f.q);
      expect(new Set(qs).size, key).toBe(qs.length);
      const text = JSON.stringify(l);
      expect(text, key).not.toMatch(/stripe|naira|NGN|₦|zip|2025|aggregateRating/i);
    }
  });

  it('comparison rows match their column count', () => {
    for (const [key, l] of pages) {
      if (!l.comparison) continue;
      for (const row of l.comparison.rows) expect(row.length, `${key}: ${row[0]}`).toBe(l.comparison.columns.length + 1);
    }
  });
});
