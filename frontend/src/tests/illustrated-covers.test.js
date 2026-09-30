import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ILLUSTRATED_CARD_DESIGNS, getIllustratedCovers, DEFAULT_ILLUSTRATED_DESIGN } from '../utils/illustratedCardDesigns';
import { CARD_DESIGNS, getCardDesign } from '../utils/cardDesigns';
import { PRIORITY_CARD_DESIGNS } from '../utils/priorityCardDesigns';
import { normalizeCoverLayout } from '../utils/coverLayout';
import { matchBlogRule, coversForBlogPost, splitArticleForStrip } from '../utils/blogCoverMatch';

const PUBLIC = path.resolve(__dirname, '../../public');
const WIZARD_OCCASIONS = ['birthday', 'leaving', 'retirement', 'anniversary', 'wedding', 'christmas',
  'congratulations', 'get_well', 'thank_you', 'sympathy', 'baby_shower', 'graduation'];

describe('illustrated cover collection', () => {
  it('has all 299 covers with unique ids and existing files', () => {
    expect(ILLUSTRATED_CARD_DESIGNS).toHaveLength(299);
    expect(new Set(ILLUSTRATED_CARD_DESIGNS.map(d => d.id)).size).toBe(299);
    for (const d of ILLUSTRATED_CARD_DESIGNS) {
      expect(fs.existsSync(path.join(PUBLIC, d.image)), d.image).toBe(true);
      expect(d.finishedArt).toBe(true);
      expect(d.name.length).toBeGreaterThan(2);
    }
  });

  it('maps every folder to a real wizard occasion with the right counts', () => {
    const counts = {};
    ILLUSTRATED_CARD_DESIGNS.forEach(d => { counts[d.occasion] = (counts[d.occasion] || 0) + 1; });
    expect(Object.keys(counts).sort()).toEqual([...WIZARD_OCCASIONS].sort());
    expect(counts).toMatchObject({ birthday: 22, leaving: 20, retirement: 10, sympathy: 40, christmas: 25,
      wedding: 22, anniversary: 20, congratulations: 20, get_well: 20, thank_you: 20, baby_shower: 50, graduation: 30 });
  });

  it('files each sympathy folder into sympathy, general first and pet last', () => {
    const groups = getIllustratedCovers('sympathy').map(d => d.sympathyGroup);
    expect(groups.slice(0, 10).every(g => g === 'colleague')).toBe(true);
    expect(groups.slice(-10).every(g => g === 'pet')).toBe(true);
    expect(getIllustratedCovers('sympathy', { group: 'partner' })).toHaveLength(10);
  });

  it('lists the new covers first in every occasion', () => {
    for (const occ of WIZARD_OCCASIONS) {
      const first = CARD_DESIGNS.filter(d => d.occasion === occ && (d.image || d.artwork))[0];
      expect(first.collection, occ).toBe('illustrated');
    }
  });

  it('pre-selects the lead birthday cover and keeps the old fallback for unknown ids', () => {
    expect(DEFAULT_ILLUSTRATED_DESIGN.id).toBe('illus-birthday-b1-cake');
    expect(getCardDesign('no-such-design').id).toBe(PRIORITY_CARD_DESIGNS[0].id);
  });
});

describe('cover text layout on finished-art covers', () => {
  const art = ILLUSTRATED_CARD_DESIGNS[0];
  it('overlays nothing by default', () => {
    const L = normalizeCoverLayout(null, art);
    expect([L.title.show, L.recipient.show, L.sender.show]).toEqual([false, false, false]);
  });
  it('keeps the creator’s saved choices', () => {
    expect(normalizeCoverLayout({ recipient: { show: true } }, art).recipient.show).toBe(true);
  });
  it('leaves other covers unchanged', () => {
    const L = normalizeCoverLayout(null, { id: 'x' });
    expect([L.title.show, L.recipient.show, L.sender.show]).toEqual([true, true, true]);
  });
});

describe('blog post cover matching', () => {
  const rule = (slug, title = '') => matchBlogRule({ slug, title })?.key || null;
  it('matches the specific occasion first', () => {
    expect(rule('condolence-messages-loss-of-pet')).toBe('pet');
    expect(rule('rainbow-bridge-poem-meaning')).toBe('pet');
    expect(rule('condolence-messages-loss-of-spouse')).toBe('sympathy-partner');
    expect(rule('what-to-write-sympathy-card-coworker')).toBe('sympathy');
    expect(rule('heartfelt-retirement-messages-uk')).toBe('retirement');
    expect(rule('farewell-card-ideas-for-colleagues')).toBe('leaving');
    expect(rule('how-to-organise-send-forth-colleague-nigeria')).toBe('leaving');
    expect(rule('get-well-soon-messages-uk-colleague')).toBe('get-well');
    expect(rule('what-to-write-thank-you-card-uk')).toBe('thank-you');
    expect(rule('best-christmas-card-messages-for-colleagues')).toBe('christmas');
    expect(rule('automate-birthday-anniversary-cards-uk-hr-2025')).toBe('birthday');
  });
  it('never puts romantic anniversary covers on work-anniversary posts', () => {
    expect(rule('work-anniversary-messages-uk-colleague')).toBe('work-anniversary');
    expect(rule('wedding-anniversary-messages-nigerian-couple')).toBe('wedding-anniversary');
  });
  it('shows nothing where there is no matching cover set', () => {
    expect(rule('covenant-university-graduates-changing-nigerian-hr')).toBeNull();
    expect(rule('hr-admin-automation-what-to-automate-first')).toBeNull();
  });
  it('gives four covers of the matching occasion, lead first for specific events', () => {
    const grad = coversForBlogPost({ slug: 'graduation-messages-university-graduate', title: '' });
    expect(grad.designs).toHaveLength(4);
    expect(grad.designs.every(d => d.occasion === 'graduation')).toBe(true);
    const pet = coversForBlogPost({ slug: 'how-to-memorialise-a-pet', title: '' });
    expect(pet.designs.every(d => d.sympathyGroup === 'pet')).toBe(true);
  });
  it('never shows two covers with the same headline side by side', () => {
    const c = coversForBlogPost({ slug: 'get-well-soon-messages-colleague-friend-nigeria', title: '' });
    const keys = c.designs.map(d => d.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('baby shower covers', () => {
  const AFTER_BIRTH = /welcome to the world|welcome, little one|it’s a (boy|girl)|twins/i;
  const BEFORE_BIRTH = /shower|on the way|coming|bump|almost here|nearly here|counting down|soon|can’t wait|can't wait/i;
  const text = d => `${d.name} ${d.coverSubtitle || ''}`;
  it('leads with ten covers that suit a shower and a maternity send-off', () => {
    const lead = getIllustratedCovers('baby_shower', { limit: 10 });
    expect(lead).toHaveLength(10);
    expect(lead.some(d => AFTER_BIRTH.test(text(d)))).toBe(false);
    expect(lead[0].id).toBe('illus-baby-shower-bs7-booties');
  });
  it('drops the letter blocks and sleepy z from headlines', () => {
    const names = getIllustratedCovers('baby_shower').map(d => d.name);
    expect(names).toContain('A, B, C... baby!');
    expect(names).toContain('Baby steps');
    expect(names).toContain('Nap time soon!');
  });
  it('matches baby blog posts to the right covers', () => {
    const rule = (slug, title = '') => matchBlogRule({ slug, title })?.key || null;
    expect(rule('what-to-write-baby-shower-card-uk')).toBe('baby-shower');
    expect(rule('baby-shower-group-card-ideas-celebrate-new-mum')).toBe('baby-shower');
    expect(rule('maternity-leave-card-messages-uk')).toBe('maternity');
    expect(rule('new-baby-congratulations-messages-nigeria-prayers')).toBe('new-baby');
    expect(rule('baby-shower-thank-you-card-wording')).toBe('baby-shower');
    expect(rule('what-to-say-after-miscarriage')).toBeNull();
    expect(rule('managing-baby-boomers-at-work')).toBeNull();
    const shower = coversForBlogPost({ slug: 'what-to-write-baby-shower-card-uk', title: '' });
    expect(shower.designs.some(d => AFTER_BIRTH.test(text(d)))).toBe(false);
    const mat = coversForBlogPost({ slug: 'funny-maternity-leave-messages-uk', title: '' });
    expect(mat.designs[0].id).toBe('illus-baby-shower-bs3-bottle');
    expect(mat.designs.some(d => AFTER_BIRTH.test(text(d)))).toBe(false);
    const nb = coversForBlogPost({ slug: 'new-baby-congratulations-messages-nigeria-prayers', title: '' });
    expect(nb.designs[0].id).toBe('illus-baby-shower-bs1-oh-baby');
    expect(nb.designs.some(d => BEFORE_BIRTH.test(text(d)))).toBe(false);
  });
});

describe('placing the strip inside a post', () => {
  const intro = '<p>' + 'A proper introduction paragraph for this article. '.repeat(3) + '</p>';
  it('splits before the first section heading', () => {
    const [a, b] = splitArticleForStrip(`${intro}<h2>One</h2><p>x</p>`);
    expect(a).toBe(intro);
    expect(b.startsWith('<h2>One</h2>')).toBe(true);
  });
  it('never splits inside an open element', () => {
    const html = `<div>${intro}<h2>Inside</h2></div>`;
    expect(splitArticleForStrip(html)).toEqual([html, '']);
  });
  it('goes after the first section when a post opens with a heading', () => {
    const html = `<h2>First</h2>${intro}<h2>Second</h2><p>y</p>`;
    const [a, b] = splitArticleForStrip(html);
    expect(a).toBe(`<h2>First</h2>${intro}`);
    expect(b.startsWith('<h2>Second</h2>')).toBe(true);
  });
  it('falls back to the end when there is no heading', () => {
    expect(splitArticleForStrip(intro)).toEqual([intro, '']);
  });
});
