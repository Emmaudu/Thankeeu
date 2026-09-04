/**
 * textContrast.js
 * ---------------------------------------------------------------------------
 * Guarantees that cover / hero / card text is always legible, no matter what
 * the creator picked or what a design preset declares.
 *
 * Why this exists
 * ---------------
 * Card designs used to advertise their text colour with a boolean `dark` flag
 * plus an `ink` value. Several presets are wrong:
 *
 *   priorityCardDesigns:  background: `linear-gradient(145deg, <soft>, #ffffff), url(<photo>)`
 *                         ink: '#ffffff', dark: true
 *
 * In CSS the FIRST background layer paints on TOP, so that opaque pale
 * gradient completely hides the photo — the surface is nearly white, yet the
 * preset says "dark, use white text". Result: invisible headings, invisible
 * navbar logo, invisible signing page hero. Same class of bug for the leaving
 * designs (a 4%-opacity scrim over an arbitrary photo) and for any creator who
 * hand-picks white text on a pale cover.
 *
 * Rather than hand-auditing ~80 preset objects (and trusting every future one),
 * we measure the background we are actually going to paint, and only keep the
 * requested colour when it genuinely passes WCAG AA. Otherwise we substitute a
 * calm, on-brand colour that does pass.
 */

const BRAND_INK = '#1A1035';       // deep aubergine — the brand's dark ink
const SOFT_WHITE = '#FFFFFF';
const AA_TEXT = 4.5;               // WCAG AA for body text
const AA_LARGE = 3.0;              // WCAG AA for large / display text

/* ── colour parsing ─────────────────────────────────────────────────────── */

const NAMED = {
  white: [255, 255, 255, 1], black: [0, 0, 0, 1], transparent: [0, 0, 0, 0],
};

/** Parse a CSS colour into [r,g,b,a] (0-255, 0-1). Returns null if unknown. */
export const parseColor = (input) => {
  if (!input || typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  if (NAMED[value]) return NAMED[value].slice();

  if (value[0] === '#') {
    let hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6 && hex.length !== 8) return null;
    if (!/^[0-9a-f]+$/.test(hex)) return null;
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    ];
  }

  const fn = value.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
    const alpha = parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1;
    return [parts[0], parts[1], parts[2], alpha];
  }
  return null;
};

const toHex = ([r, g, b]) =>
  '#' + [r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');

/* ── luminance & contrast (WCAG 2.1) ────────────────────────────────────── */

const channelLuminance = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = (color) => {
  const rgb = Array.isArray(color) ? color : parseColor(color);
  if (!rgb) return null;
  return 0.2126 * channelLuminance(rgb[0])
       + 0.7152 * channelLuminance(rgb[1])
       + 0.0722 * channelLuminance(rgb[2]);
};

/** Contrast ratio between two colours (or a colour and a known luminance). */
export const contrastRatio = (a, b) => {
  const la = typeof a === 'number' ? a : relativeLuminance(a);
  const lb = typeof b === 'number' ? b : relativeLuminance(b);
  if (la == null || lb == null) return null;
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

/* ── background analysis ────────────────────────────────────────────────── */

/** Split a CSS value on top-level commas (ignoring commas inside parens). */
const splitTopLevel = (value) => {
  const out = [];
  let depth = 0;
  let current = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(current); current = ''; }
    else current += ch;
  }
  if (current.trim()) out.push(current);
  return out.map(s => s.trim()).filter(Boolean);
};

const COLOR_TOKEN = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi;

/** Average the colour stops of one gradient layer → { rgb, alpha } or null. */
const analyseGradientLayer = (layer) => {
  const tokens = layer.match(COLOR_TOKEN);
  if (!tokens || !tokens.length) return null;
  const stops = tokens.map(parseColor).filter(Boolean);
  if (!stops.length) return null;
  const sum = stops.reduce((acc, s) => [acc[0] + s[0], acc[1] + s[1], acc[2] + s[2], acc[3] + s[3]], [0, 0, 0, 0]);
  const n = stops.length;
  return { rgb: [sum[0] / n, sum[1] / n, sum[2] / n], alpha: sum[3] / n };
};

/** Composite `top` (with alpha) over `base` (opaque). */
const over = (top, alpha, base) => ([
  top[0] * alpha + base[0] * (1 - alpha),
  top[1] * alpha + base[1] * (1 - alpha),
  top[2] * alpha + base[2] * (1 - alpha),
]);

/**
 * Work out what a CSS `background` shorthand actually looks like.
 *
 * Returns { rgb, hex, luminance, hasPhoto } where `hasPhoto` means an image
 * layer is still meaningfully visible (so the measured luminance is a guess
 * and text needs a scrim rather than a colour swap).
 */
export const analyseBackground = (background, fallback = SOFT_WHITE) => {
  const base = parseColor(fallback) || [255, 255, 255, 1];
  let acc = [base[0], base[1], base[2]];
  let photoVisibility = 0;

  if (typeof background === 'string' && background.trim()) {
    const layers = splitTopLevel(background);
    // CSS paints the first layer on top → composite from the bottom up.
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (/url\(/i.test(layer)) {
        // Unknown photo: assume a mid-tone and remember that it is showing.
        acc = [128, 128, 128];
        photoVisibility = 1;
        continue;
      }
      if (/gradient\(/i.test(layer)) {
        const g = analyseGradientLayer(layer);
        if (!g) continue;
        acc = over(g.rgb, g.alpha, acc);
        photoVisibility *= (1 - g.alpha);
        continue;
      }
      const solid = parseColor(layer);
      if (solid) {
        acc = over([solid[0], solid[1], solid[2]], solid[3], acc);
        photoVisibility *= (1 - solid[3]);
      }
    }
  }

  return {
    rgb: acc,
    hex: toHex(acc),
    luminance: relativeLuminance(acc),
    // Below ~25% the photo is too washed out to move the needle.
    hasPhoto: photoVisibility > 0.25,
  };
};

/* ── the public helpers ─────────────────────────────────────────────────── */

/**
 * Keep the requested colour if it is readable on `background`; otherwise
 * return the most pleasant colour that is.
 *
 * @param {string}  desired     colour the creator/preset asked for ('auto' ok)
 * @param {string}  background  the CSS background that will sit behind it
 * @param {object}  options     { fallback, ink, large, candidates }
 */
export const readableTextColor = (desired, background, options = {}) => {
  const { fallback = SOFT_WHITE, ink, large = false, candidates } = options;
  const analysis = analyseBackground(background, fallback);
  const threshold = large ? AA_LARGE : AA_TEXT;

  const wanted = desired && desired !== 'auto' ? desired : null;
  if (wanted) {
    const ratio = contrastRatio(wanted, analysis.luminance);
    if (ratio != null && ratio >= threshold) return wanted;
    // A photo backdrop can't be measured reliably; if the creator explicitly
    // chose a colour and we're only *guessing* the backdrop, respect the
    // choice and let the caller add a scrim instead of overriding them.
    if (analysis.hasPhoto && desired && desired !== 'auto') {
      return wanted;
    }
  }

  // Unmeasurable photo backdrop and no explicit choice: white plus a scrim is
  // the standard, safe treatment (see legibilityShadow / coverScrim).
  if (analysis.hasPhoto) return SOFT_WHITE;

  // Prefer the design's own ink, then brand ink, then white — first that passes.
  const pool = candidates || [ink, BRAND_INK, SOFT_WHITE].filter(Boolean);
  let best = null;
  for (const candidate of pool) {
    const ratio = contrastRatio(candidate, analysis.luminance);
    if (ratio == null) continue;
    if (ratio >= threshold) return candidate;
    if (!best || ratio > best.ratio) best = { candidate, ratio };
  }
  // Nothing cleared AA — fall back to plain black/white, whichever wins.
  const blackRatio = contrastRatio('#000000', analysis.luminance) || 0;
  const whiteRatio = contrastRatio(SOFT_WHITE, analysis.luminance) || 0;
  if (Math.max(blackRatio, whiteRatio) > (best?.ratio || 0)) {
    return blackRatio >= whiteRatio ? BRAND_INK : SOFT_WHITE;
  }
  return best ? best.candidate : BRAND_INK;
};

/** True when the backdrop is a photo we can't measure → text needs a scrim. */
export const backgroundIsPhoto = (background, fallback = SOFT_WHITE) =>
  analyseBackground(background, fallback).hasPhoto;

/**
 * A text-shadow that keeps text legible over an unmeasurable photo, or over a
 * backdrop that is close in tone to the text colour. Returns '' when the
 * contrast is already comfortable.
 */
export const legibilityShadow = (textColor, background, options = {}) => {
  const { fallback = SOFT_WHITE, force = false } = options;
  const analysis = analyseBackground(background, fallback);
  const ratio = contrastRatio(textColor, analysis.luminance);
  if (!force && !analysis.hasPhoto && ratio != null && ratio >= 7) return '';
  const textLum = relativeLuminance(textColor);
  const light = textLum != null && textLum > 0.5;
  return light
    ? '0 1px 2px rgba(8,6,20,0.55), 0 2px 18px rgba(8,6,20,0.45)'
    : '0 1px 2px rgba(255,255,255,0.65), 0 2px 16px rgba(255,255,255,0.55)';
};

/**
 * True when the surface behind text is dark — for choosing between light and
 * dark UI treatments (borders, chips, translucent pills).
 */
export const backgroundIsDark = (background, fallback = SOFT_WHITE) => {
  const { luminance } = analyseBackground(background, fallback);
  return luminance != null && luminance < 0.42;
};

export { BRAND_INK, SOFT_WHITE, AA_TEXT, AA_LARGE };
