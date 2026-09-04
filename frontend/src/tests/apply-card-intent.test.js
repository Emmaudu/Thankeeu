/**
 * applyCardIntent — the bridge between a typed sentence and the wizard form.
 *
 * The contrast rule matters most here: we are choosing the cover on the
 * customer's behalf, so unreadable cover text would be our fault, not theirs.
 */
import { describe, it, expect } from 'vitest';
import { applyCardIntent, coverInkFor, coversForOccasion } from '../utils/applyCardIntent';
import { contrastRatio, analyseBackground } from '../utils/textContrast';
import parseCardIntent from '../utils/cardIntent';

const WIZARD = ['birthday', 'valentine', 'leaving', 'anniversary', 'wedding', 'baby_shower',
  'retirement', 'congratulations', 'graduation', 'promotion', 'christmas',
  'get_well', 'new_year', 'thank_you', 'sympathy', 'good_luck', 'other'];
const CREATECARD = WIZARD.filter(o => !['thank_you', 'sympathy', 'good_luck'].includes(o));

const opts = (ids = WIZARD) => ({ creatorName: 'Emmanuel U.', occasionIds: ids });

describe('cover ink', () => {
  it('white on a dark cover', () => {
    expect(coverInkFor({ background: '#1a1035' })).toBe('#FFFFFF');
    expect(coverInkFor({ background: '#000000' })).toBe('#FFFFFF');
  });

  it('dark ink on a pale cover', () => {
    expect(coverInkFor({ background: '#FBEAF0', ink: '#4A1D3F' })).toBe('#4A1D3F');
    expect(coverInkFor({ background: '#ffffff' })).not.toBe('#FFFFFF');
  });

  it('white over a photo, whatever its average brightness', () => {
    expect(coverInkFor({ image: '/cards/priority/birthday/bd_01.avif', background: '#eeeeee' })).toBe('#FFFFFF');
  });

  it('never throws on a malformed design', () => {
    [null, {}, { background: 'not-a-colour' }, { background: undefined }]
      .forEach(d => expect(() => coverInkFor(d)).not.toThrow());
  });

  // The point of the whole exercise: real readability, on every real cover we
  // would actually auto-pick.
  it('every auto-picked cover gets readable text', () => {
    const failures = [];
    CREATECARD.forEach(occ => {
      const cover = coversForOccasion(occ)[0];
      if (!cover || cover.image) return;          // photos are handled by the shadow
      const ink = coverInkFor(cover);
      // A design background may be a gradient; measure the composited surface
      // the text actually sits on, not the raw CSS value.
      const surface = analyseBackground(cover.background || '#ffffff');
      const ratio = contrastRatio(ink, surface?.color || '#ffffff');
      // 3:1 is the WCAG AA bar for large text, which cover titles are.
      if (ratio < 3) failures.push(`${occ}/${cover.id}: ${ink} on ${cover.background} = ${ratio.toFixed(2)}`);
    });
    expect(failures).toEqual([]);
  });
});

describe('form patch', () => {
  it('fills occasion, design, ink, recipient, title and date together', () => {
    const intent = parseCardIntent('birthday card for my sister Ada, sending Friday', new Date(2026, 8, 3));
    const { patch, step } = applyCardIntent(intent, opts());
    expect(patch.occasion).toBe('birthday');
    expect(patch.design_theme).toBeTruthy();
    expect(patch.cover_text_color).toMatch(/^#/);
    expect(patch.recipient_name).toBe('Ada');
    expect(patch.title).toBe("Ada's Birthday Card");
    expect(patch.send_date).toBe('2026-09-04'); // 3 Sep 2026 is a Thursday
    expect(step).toBe(2);
  });

  it('falls back to "other" for an occasion the wizard lacks, keeping the word', () => {
    const intent = parseCardIntent('sympathy card for Emeka', new Date(2026, 8, 3));
    const { patch } = applyCardIntent(intent, opts(CREATECARD));
    expect(patch.occasion).toBe('other');
    expect(patch.custom_occasion).toBe('Sympathy');
  });

  it('keeps the occasion when the wizard does support it', () => {
    const intent = parseCardIntent('sympathy card for Emeka', new Date(2026, 8, 3));
    expect(applyCardIntent(intent, opts(WIZARD)).patch.occasion).toBe('sympathy');
  });

  it('patches nothing and stays on step 0 when nothing was understood', () => {
    const { patch, step } = applyCardIntent(parseCardIntent('asdkjh'), opts());
    expect(patch).toEqual({});
    expect(step).toBe(0);
  });

  it('drops a date that has already passed rather than scheduling backwards', () => {
    const { patch } = applyCardIntent({ occasion: 'birthday', send_date: '2020-01-01' }, opts());
    expect(patch.send_date).toBeUndefined();
  });

  it('an amount turns the gift pot on', () => {
    const { patch } = applyCardIntent({ occasion: 'birthday', suggested_amount: 50000 }, opts());
    expect(patch.suggested_amount).toBe(50000);
    expect(patch.is_gift_enabled).toBe(true);
  });

  it('ignores an amount below the platform minimum', () => {
    const { patch } = applyCardIntent({ occasion: 'birthday', suggested_amount: 100 }, opts());
    expect(patch.suggested_amount).toBeUndefined();
  });

  it('uses a cover the customer picked on the homepage', () => {
    const cover = coversForOccasion('birthday')[3];
    const { patch } = applyCardIntent(
      { occasion: 'birthday', design_theme: cover.id, cover_text_color: '#FFFFFF' }, opts());
    expect(patch.design_theme).toBe(cover.id);
    expect(patch.cover_text_color).toBe('#FFFFFF');
  });

  it('ignores a design id that is no longer in the catalogue', () => {
    // A stale sessionStorage entry after a deploy must not blank the cover.
    const { patch } = applyCardIntent({ occasion: 'birthday', design_theme: 'deleted-design-999' }, opts());
    expect(patch.design_theme).toBeTruthy();
    expect(patch.design_theme).not.toBe('deleted-design-999');
  });

  it('survives junk input', () => {
    [null, undefined, 'string', 42, []].forEach(j =>
      expect(() => applyCardIntent(j, opts())).not.toThrow());
  });
});
