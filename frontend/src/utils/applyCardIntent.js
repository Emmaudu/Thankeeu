/**
 * applyCardIntent — turn a parsed intent into a wizard form patch.
 *
 * Shared by CardStart.jsx (guests) and CreateCard.jsx (signed in) so the two
 * wizards cannot drift apart in what a typed sentence does.
 *
 * Rules it follows:
 *  - Only fields the parser actually found are patched. Anything unknown is
 *    left alone so the wizard's own default stands.
 *  - The occasion is validated against the CALLING wizard's own list, because
 *    the two lists differ (CreateCard has no thank_you/sympathy/good_luck).
 *    An occasion the wizard does not offer falls back to 'other'.
 *  - A design is only chosen from real covers for that occasion, matching the
 *    rule both wizards already use for their design grid.
 */
import { CARD_DESIGNS } from './cardDesigns';
import { OCCASION_LABELS } from './cardIntent';
import { backgroundIsDark, backgroundIsPhoto } from './textContrast';

const MIN_GIFT = 500;

const BRIGHT_ON_DARK = '#FFFFFF';
const DEEP_ON_LIGHT  = '#1A1035';

/**
 * A bright, high-contrast ink for a cover we picked ourselves.
 *
 * An image cover is treated as dark: a photo's average brightness says nothing
 * about the patch of it sitting behind the title, and white with the wizard's
 * own text shadow stays legible over almost any photograph, while dark ink
 * over a busy image does not.
 */
export const coverInkFor = (design) => {
  if (!design) return BRIGHT_ON_DARK;
  if (design.image) return BRIGHT_ON_DARK;
  const surface = design.background || design.bg;
  try {
    if (backgroundIsPhoto(surface)) return BRIGHT_ON_DARK;
    return backgroundIsDark(surface) ? BRIGHT_ON_DARK : (design.ink || DEEP_ON_LIGHT);
  } catch {
    return design.dark ? BRIGHT_ON_DARK : DEEP_ON_LIGHT;
  }
};

/** The same filter both wizards use to build their design grid. */
export const coversForOccasion = (occasion) => {
  const real = CARD_DESIGNS.filter(d => (d.artwork || d.image) && d.occasion === occasion);
  return real.length ? real : CARD_DESIGNS.filter(d => d.artwork || d.image).slice(0, 10);
};

/**
 * Covers we are willing to apply WITHOUT being asked.
 * No design carries occasion 'other', so the generic fallback above returns
 * birthday covers — which is how "sympathy card, her mum passed away" ended up
 * pre-selecting balloons and confetti. When we cannot match the occasion we
 * choose nothing and let the customer pick.
 */
const autoCoverFor = (occasion) => {
  const real = CARD_DESIGNS.filter(d => (d.artwork || d.image) && d.occasion === occasion);
  return real[0] || null;
};

/**
 * @param intent    the object from parseCardIntent()
 * @param options   { creatorName, occasionIds }  occasionIds = the calling
 *                  wizard's own supported occasion ids
 * @returns { patch, step, summary }  step is the wizard step to open on;
 *                                    summary is chips for the "we understood"
 *                                    strip, already human-readable.
 */
export const applyCardIntent = (intent, { creatorName = 'You', occasionIds = [] } = {}) => {
  const patch = {};
  const summary = [];
  if (!intent || typeof intent !== 'object') return { patch, step: 0, summary };

  // ── Occasion ────────────────────────────────────────────────────────────
  let occasion = null;
  if (intent.occasion) {
    occasion = occasionIds.includes(intent.occasion) ? intent.occasion : 'other';
    patch.occasion = occasion;
    summary.push({ key: 'occasion', label: OCCASION_LABELS[intent.occasion] || 'Special' });
    // Keep the customer's word when we had to fall back, so an unsupported
    // occasion still reads correctly on the card instead of just "Other".
    if (occasion === 'other') patch.custom_occasion = OCCASION_LABELS[intent.occasion] || '';
  }

  // ── Design, and a cover ink that is actually readable on it ─────────────
  // We are choosing the cover on the customer's behalf, so we owe them text
  // they can read on it: white on a dark or photographic cover, near-black on
  // a pale one. The colour is measured against the composited surface rather
  // than trusting the design's own `dark` flag, which has been wrong before
  // (a pale gradient laid over a dark photo reads as dark but paints light).
  if (occasion) {
    // A cover the customer tapped on the homepage wins over our default pick,
    // but is still validated — a design id that is not in the catalogue (a
    // stale sessionStorage entry after a deploy) must not blank the cover.
    const chosen = intent.design_theme
      ? CARD_DESIGNS.find(d => d.id === intent.design_theme)
      : null;
    const cover = chosen || autoCoverFor(occasion);
    if (cover) {
      patch.design_theme = cover.id;
      patch.background_color = cover.background || cover.image || '#F5F0FF';
      // Their explicit ink is honoured; otherwise measure the cover we chose.
      patch.cover_text_color = intent.cover_text_color || coverInkFor(cover);
      if (chosen) summary.push({ key: 'cover', label: `Cover: ${chosen.name || 'chosen'}` });
    }
  }

  // ── Who it's for ────────────────────────────────────────────────────────
  if (intent.recipient_name) {
    patch.recipient_name = intent.recipient_name;
    summary.push({ key: 'recipient', label: `For ${intent.recipient_name}` });
  }

  if (intent.recipient_email) {
    patch.recipient_email = intent.recipient_email;
    summary.push({ key: 'recipient_email', label: intent.recipient_email });
  }

  // Title: prefer the parser's, else build one, else leave the default.
  if (intent.title) patch.title = intent.title;
  else if (intent.recipient_name && occasion) {
    patch.title = `${intent.recipient_name}'s ${OCCASION_LABELS[intent.occasion] || 'Special'} Card`;
  }
  // A sender named in the sentence beats the account name — "from the whole
  // team" is what should appear on the card, not the one person who typed it.
  if (intent.sender_name) {
    patch.cover_sender = intent.sender_name;
    summary.push({ key: 'sender', label: `From ${intent.sender_name}` });
  } else if (creatorName && creatorName !== 'You' && (occasion || intent.recipient_name)) {
    // Only when something was actually understood — a sentence we could make
    // nothing of must patch nothing at all, so the wizard opens untouched.
    patch.cover_sender = creatorName;
  }

  // ── When ────────────────────────────────────────────────────────────────
  if (intent.send_date) {
    patch.send_date = intent.send_date;
    if (intent.send_time) patch.send_time = intent.send_time;
    // A card must not be scheduled into the past if the tab sat open overnight.
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(`${intent.send_date}T00:00:00`) < today) delete patch.send_date;
    else summary.push({ key: 'date',
      label: `${formatDateChip(intent.send_date)}${intent.send_time ? ` · ${prettyTime(intent.send_time)}` : ''}` });
  }

  // ── Signing deadline ────────────────────────────────────────────────────
  if (intent.deadline) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(`${intent.deadline}T00:00:00`) >= today) {
      patch.deadline = intent.deadline;
      if (intent.deadline_time) patch.deadline_time = intent.deadline_time;
      summary.push({ key: 'deadline', label: `Sign by ${formatDateChip(intent.deadline)}` });
    }
  }

  // ── Gift pot ────────────────────────────────────────────────────────────
  if (typeof intent.is_gift_enabled === 'boolean') {
    patch.is_gift_enabled = intent.is_gift_enabled;
    summary.push({ key: 'gift', label: intent.is_gift_enabled ? 'Gift pot on' : 'No gift pot' });
  }
  if (intent.suggested_amount && intent.suggested_amount >= MIN_GIFT) {
    patch.suggested_amount = intent.suggested_amount;
    patch.is_gift_enabled = true;
  }

  // ── Which step to open on ───────────────────────────────────────────────
  // Understanding the occasion means the first two steps are already answered,
  // so Details (2) is the first thing still worth their attention. Without an
  // occasion we change nothing and start at the beginning.
  const step = occasion ? 2 : 0;

  return { patch, step, summary };
};

const pad2 = (n) => String(n).padStart(2, '0');

/** "14:00" → "2pm", "09:30" → "9:30am" — chips read better than a 24h clock. */
export const prettyTime = (hhmm) => {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (Number.isNaN(h)) return '';
  const ampm = h < 12 ? 'am' : 'pm';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hr}:${pad2(m)}${ampm}` : `${hr}${ampm}`;
};

export const formatDateChip = (iso) => {
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return iso; }
};

export default applyCardIntent;
