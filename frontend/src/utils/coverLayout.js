/**
 * coverLayout.js — shared model for the movable/resizable/recolourable cover
 * texts (title, recipient, sender). Stored as a single JSON object on the card
 * (`cover_layout` column) so the recipient view renders exactly what the
 * creator arranged.
 *
 * Coordinates are PERCENTAGES of the cover box (0–100) so the layout is fully
 * responsive — the same JSON looks right on a thumbnail and a full A4 view.
 */

// A per-field entry: { x, y, size, color, show }
//  x,y   → centre point of the text block, in % of cover width/height
//  size  → font size in "cover units" (≈ px at a 210-wide reference); scaled
//          responsively by the renderer
//  color → hex, or 'auto' to follow the cover's contrast text colour
//  show  → whether the field is rendered on the cover at all

export const COVER_FIELDS = ['title', 'recipient', 'sender'];

export const DEFAULT_COVER_LAYOUT = {
  recipient: { x: 50, y: 44, size: 30, color: 'auto', show: true },
  title:     { x: 50, y: 60, size: 15, color: 'auto', show: true },
  sender:    { x: 50, y: 84, size: 11, color: 'auto', show: true },
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const normField = (field, raw = {}) => {
  const d = DEFAULT_COVER_LAYOUT[field];
  return {
    x: typeof raw.x === 'number' ? clamp(raw.x, 4, 96) : d.x,
    y: typeof raw.y === 'number' ? clamp(raw.y, 4, 96) : d.y,
    size: typeof raw.size === 'number' ? clamp(raw.size, 7, 120) : d.size,
    color: typeof raw.color === 'string' ? raw.color : d.color,
    show: raw.show === undefined ? d.show : !!raw.show,
  };
};

// Accepts an object or a JSON string; returns a fully-populated, clamped layout.
export const normalizeCoverLayout = (input) => {
  let src = input;
  if (typeof input === 'string') {
    try { src = JSON.parse(input); } catch { src = null; }
  }
  src = src && typeof src === 'object' ? src : {};
  return {
    title: normField('title', src.title),
    recipient: normField('recipient', src.recipient),
    sender: normField('sender', src.sender),
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
      && current.show === baseline.show;
  });
};

// Preset colours offered in the editor swatches (plus 'auto').
export const COVER_TEXT_SWATCHES = [
  '#ffffff', '#172033', '#4c1d95', '#9f1239',
  '#14532d', '#92400e', '#0369a1', '#be185d',
];
