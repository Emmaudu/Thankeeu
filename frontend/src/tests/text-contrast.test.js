import { describe, it, expect } from 'vitest';
import {
  parseColor, analyseBackground, contrastRatio, readableTextColor,
  backgroundIsDark, backgroundIsPhoto, legibilityShadow,
} from '../utils/textContrast';
import { CARD_DESIGNS } from '../utils/cardDesigns';
import { ALBUM_THEMES, getContrastTextColor } from '../utils/albumThemes';

const AA_LARGE = 3.0;
const AA_TEXT = 4.5;

describe('parseColor', () => {
  it('reads shorthand, long hex, alpha hex, rgb and rgba', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255, 1]);
    expect(parseColor('#1A1035')).toEqual([26, 16, 53, 1]);
    expect(parseColor('#00000080')[3]).toBeCloseTo(0.502, 2);
    expect(parseColor('rgb(12, 34, 56)')).toEqual([12, 34, 56, 1]);
    expect(parseColor('rgba(0,0,0,0.4)')[3]).toBe(0.4);
    expect(parseColor('not-a-colour')).toBeNull();
  });
});

describe('analyseBackground', () => {
  it('composites layers top-down: an opaque gradient hides the photo beneath it', () => {
    // This is the exact shape of every priority card preset.
    const a = analyseBackground('linear-gradient(145deg, #fff5f7, #ffffff), url(/cards/priority/x.avif)');
    expect(a.hasPhoto).toBe(false);
    expect(a.luminance).toBeGreaterThan(0.8);
  });

  it('keeps the photo when the layer above it is nearly transparent', () => {
    const a = analyseBackground('linear-gradient(180deg, rgba(255,255,255,0.04), rgba(15,23,42,0.08)), url("/x.png")');
    expect(a.hasPhoto).toBe(true);
  });

  it('measures a plain dark gradient as dark', () => {
    expect(backgroundIsDark('linear-gradient(145deg, #17133c 0%, #312e81 48%, #701a75 100%)')).toBe(true);
    expect(backgroundIsDark('linear-gradient(145deg, #fff1f5 0%, #ede9fe 100%)')).toBe(false);
  });
});

describe('readableTextColor', () => {
  it('keeps a creator colour that is already readable', () => {
    expect(readableTextColor('#831843', '#fff1f5')).toBe('#831843');
  });

  it('overrides white text on a pale cover', () => {
    const out = readableTextColor('#ffffff', 'linear-gradient(145deg, #fffbeb, #fed7aa)');
    expect(out).not.toBe('#ffffff');
    expect(contrastRatio(out, analyseBackground('linear-gradient(145deg, #fffbeb, #fed7aa)').luminance))
      .toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('overrides dark text on a dark cover', () => {
    const bg = '#142033';
    const out = readableTextColor('#172033', bg);
    expect(contrastRatio(out, analyseBackground(bg).luminance)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('falls back to white over an unmeasurable photo, and asks for a scrim', () => {
    const bg = 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45)), url("https://cdn/x.jpg")';
    expect(readableTextColor('auto', bg)).toBe('#FFFFFF');
    expect(backgroundIsPhoto(bg)).toBe(true);
    expect(legibilityShadow('#FFFFFF', bg)).not.toBe('');
  });
});

describe('every card design renders readable text', () => {
  it.each(CARD_DESIGNS.map(d => [d.id, d]))('%s', (_id, design) => {
    const surface = design.background;
    const analysis = analyseBackground(surface, design.soft || '#ffffff');
    if (analysis.hasPhoto) return; // protected by a scrim, not by colour choice

    const hero = readableTextColor('auto', surface, { ink: design.ink, fallback: design.soft, large: true });
    expect(contrastRatio(hero, analysis.luminance)).toBeGreaterThanOrEqual(AA_LARGE);

    // A creator who explicitly picks pure white must still end up readable.
    const forced = readableTextColor('#ffffff', surface, { ink: design.ink, fallback: design.soft, large: true });
    expect(contrastRatio(forced, analysis.luminance)).toBeGreaterThanOrEqual(AA_LARGE);

    // Message notes are body text — the stricter threshold applies.
    const noteInk = readableTextColor(design.ink, surface, { ink: design.ink, fallback: design.soft });
    expect(contrastRatio(noteInk, analysis.luminance)).toBeGreaterThanOrEqual(AA_TEXT);

    const noteAccent = readableTextColor(design.accent, surface, { ink: noteInk, fallback: design.soft });
    expect(contrastRatio(noteAccent, analysis.luminance)).toBeGreaterThanOrEqual(AA_TEXT);

    // The cover helper used by CardView / AlbumSign / the studio preview.
    const auto = getContrastTextColor(null, design);
    expect(contrastRatio(auto, analysis.luminance)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});

describe('album themes', () => {
  it.each(ALBUM_THEMES.map(t => [t.id, t]))('%s stage and page stay legible', (_id, theme) => {
    const stage = analyseBackground(theme.stage);
    const page = analyseBackground(theme.page);
    expect(contrastRatio(readableTextColor('#4B3F72', theme.stage, { ink: theme.ink }), stage.luminance))
      .toBeGreaterThanOrEqual(AA_TEXT);
    // A signer picking white handwriting on cream paper must be corrected.
    expect(contrastRatio(readableTextColor('#ffffff', theme.page, { ink: theme.ink }), page.luminance))
      .toBeGreaterThanOrEqual(AA_TEXT);
  });
});
