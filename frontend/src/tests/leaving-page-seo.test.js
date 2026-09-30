import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LEAVING_FAQS } from '../pages/LeavingCardPage';

const root = path.resolve(__dirname, '../..');
const page = fs.readFileSync(path.join(root, 'src/pages/LeavingCardPage.jsx'), 'utf8');
const prerender = fs.readFileSync(path.join(root, 'scripts/prerender.js'), 'utf8');
const entry = prerender.slice(prerender.indexOf("path: '/cards/leaving-card',"), prerender.indexOf("path: '/cards/pet-loss-card',"));
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

describe('/cards/leaving-card SEO consistency', () => {
  it('uses the same title and description in the static HTML and the React page', () => {
    const title = page.match(/useSEO\(\{\s*title: '([^']+)'/)[1];
    const description = page.match(/description: '([^']+)',\n\s+keywords/)[1];
    expect(entry).toContain(JSON.stringify(title));
    expect(entry).toContain(JSON.stringify(description));
    expect(description.length).toBeLessThanOrEqual(160);
  });
  it('has a keyword H1 in both', () => {
    expect(page).toMatch(/<h1[^>]*>[^<]*Online Leaving Cards for Colleagues/);
    expect(entry).toContain('<h1>Online Leaving Cards for Colleagues');
  });
  it('repeats every visible FAQ word for word in the static HTML', () => {
    expect(LEAVING_FAQS).toHaveLength(6);
    for (const { q, a } of LEAVING_FAQS) {
      const inHtml = s => entry.includes(s) || entry.includes(esc(s));
      expect(inHtml(q), q).toBe(true);
      expect(inHtml(a), a).toBe(true);
    }
  });
  it('builds the FAQPage JSON-LD from the same list as the visible FAQ', () => {
    expect(page).toContain('SCHEMAS.faqPage(LEAVING_FAQS)');
    expect(page).toContain('{LEAVING_FAQS.map(');
  });
});
