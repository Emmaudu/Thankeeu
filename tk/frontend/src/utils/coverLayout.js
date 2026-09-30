/**
 * coverLayout.js — shared model for the movable/resizable/recolourable cover
 * texts (title, recipient, sender). Stored as a single JSON object on the card
 * (`cover_layout` column) so the recipient view renders exactly what the
 * creator arranged.
 *
 * Coordinates are PERCENTAGES of the cover box (0–100) so the layout is fully
 * responsive — the same JSON looks right on a thumbnail and a full A4 view.
 */

// A per-field entry: { x, y, size, color, show, shadow, shadowColor, shadowOpacity }
//  x,y           → centre point of the text block, in % of cover width/height
//  size          → font size in "cover units" (≈ px at a 210-wide reference)
//  color         → hex, or 'auto' to follow the cover's contrast text colour
//  show          → whether the field is rendered on the cover at all
//  shadow        → whether a drop-shadow is applied (helps text show on images)
//  shadowColor   → hex color of the shadow (default black)
//  shadowOpacity → 0–1 opacity multiplier for the shadow

export const COVER_FIELDS = ['title', 'recipient', 'sender'];

export const DEFAULT_COVER_LAYOUT = {
  recipient: { x: 50, y: 44, size: 30, color: 'auto', show: true,  shadow: false, shadowColor: '#000000', shadowOpacity: 0.55 },
  title:     { x: 50, y: 60, size: 15, color: 'auto', show: true,  shadow: false, shadowColor: '#000000', shadowOpacity: 0.55 },
  sender:    { x: 50, y: 84, size: 11, color: 'auto', show: true,  shadow: false, shadowColor: '#000000', shadowOpacity: 0.40 },
};

// Finished-art covers (the illustrated collection) already print their own
// headline and tagline, and measured across all of them there is no empty
// band except a sliver at the top and bottom edge. So by default nothing is
// overlaid; if the creator switches a text on, it starts in those free edges
// (name at the top, sender at the foot) and can be dragged from there.
export const FINISHED_ART_COVER_LAYOUT = {
  recipient: { x: 50, y: 4,  size: 11, color: 'auto', show: false, shadow: false, shadowColor: '#000000', shadowOpacity: 0.55 },
  title:     { x: 50, y: 31, size: 12, color: 'auto', show: false, shadow: false, shadowColor: '#000000', shadowOpacity: 0.55 },
  sender:    { x: 50, y: 96, size: 8,  color: 'auto', show: false, shadow: false, shadowColor: '#000000', shadowOpacity: 0.40 },
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const normField = (field, raw = {}, base = DEFAULT_COVER_LAYOUT) => {
  const d = base[field];
  return {
    x:             typeof raw.x === 'number'             ? clamp(raw.x, 4, 96)       : d.x,
    y:             typeof raw.y === 'number'             ? clamp(raw.y, 4, 96)       : d.y,
    size:          typeof raw.size === 'number'          ? clamp(raw.size, 7, 120)   : d.size,
    color:         typeof raw.color === 'string'         ? raw.color                 : d.color,
    show:          raw.show === undefined                ? d.show                    : !!raw.show,
    shadow:        raw.shadow === undefined              ? d.shadow                  : !!raw.shadow,
    shadowColor:   typeof raw.shadowColor === 'string'   ? raw.shadowColor           : d.shadowColor,
    shadowOpacity: typeof raw.shadowOpacity === 'number' ? clamp(raw.shadowOpacity, 0, 1) : d.shadowOpacity,
  };
};

// Accepts an object or a JSON string; returns a fully-populated, clamped layout.
// Pass the cover `design` so finished-art covers get their own defaults.
export const normalizeCoverLayout = (input, design) => {
  let src = input;
  if (typeof input === 'string') {
    try { src = JSON.parse(input); } catch { src = null; }
  }
  src = src && typeof src === 'object' ? src : {};
  const base = design?.finishedArt ? FINISHED_ART_COVER_LAYOUT : DEFAULT_COVER_LAYOUT;
  return {
    title: normField('title', src.title, base),
    recipient: normField('recipient', src.recipient, base),
    sender: normField('sender', src.sender, base),
  };
};

export const coverLayoutEqualsDefault = (layout) => {
  const normalized = normalizeCoverLayout(layout);
  return COVER_FIELDS.every((field) => {
    const current = normalized[field];
    const baseline = DEFAULT_COVER_LAYOUT[field];
    return current.x === baseline.x
      && current.y === baseline.y
      && current.size === baseline.size
      && current.color === baseline.color
      && current.show === baseline.show
      && current.shadow === baseline.shadow
      && current.shadowColor === baseline.shadowColor
      && current.shadowOpacity === baseline.shadowOpacity;
  });
};

// Preset colours offered in the editor swatches (plus 'auto').
export const COVER_TEXT_SWATCHES = [
  '#ffffff', '#172033', '#4c1d95', '#9f1239',
  '#14532d', '#92400e', '#0369a1', '#be185d',
];
