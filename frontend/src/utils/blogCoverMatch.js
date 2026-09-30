/**
 * blogCoverMatch — decide which illustrated covers belong in a blog post.
 *
 * Matching reads ONLY the post's title and slug (never the body or broad tags
 * such as "nigeria"), and rules run most-specific first, so e.g. a pet-loss
 * post gets pet covers rather than general sympathy ones, and a retirement
 * farewell gets retirement covers rather than leaving ones.
 *
 * Returns null when a post has no genuine match — such posts show no strip.
 */
import { getIllustratedCovers } from './illustratedCardDesigns';

// Each rule: test(text) → true, then which covers and where "see all" goes.
//   occasion / group — cover set; lead — cover stem to put first
//   label — used in the strip heading ("Send a group {label} card")
const RULES = [
  { key: 'pet', occasion: 'sympathy', group: 'pet', label: 'pet sympathy', href: '/cards/pet-loss-card',
    test: t => /\b(pets?|dogs?|cats?|puppy|kitten)\b|rainbow bridge/.test(t)
      && /\b(loss|lost|sympathy|condolences?|memorial|memorialise|memorialize|grief|grieving|passed|died|death|bridge|remember)\b/.test(t) },
  { key: 'sympathy-partner', occasion: 'sympathy', group: 'partner', label: 'sympathy', href: '/cards/sympathy',
    test: t => /\b(sympathy|condolences?|bereave\w*|grief|grieving|loss|funeral|passed away)\b/.test(t)
      && /\b(spouse|partner|husband|wife|widow\w*)\b/.test(t) },
  { key: 'sympathy', occasion: 'sympathy', group: 'colleague', label: 'sympathy', href: '/cards/sympathy',
    test: t => /\b(sympathy|condolences?|bereave\w*|grief|grieving|funeral|passed away|loss of)\b/.test(t) },
  { key: 'christmas', occasion: 'christmas', label: 'Christmas', href: '/cards/christmas',
    test: t => /\b(christmas|xmas|festive season|happy holidays|holiday cards?|season'?s greetings)\b/.test(t) },
  { key: 'retirement', occasion: 'retirement', label: 'retirement', href: '/cards/retirement',
    test: t => /\b(retire|retired|retiring|retirement|retiree)\b/.test(t) },
  { key: 'get-well', occasion: 'get_well', label: 'get well soon', href: '/cards/get-well-soon',
    test: t => /\bget well\b|\bfeel better\b|\b(recovery|recovering|surgery|hospital|illness)\b/.test(t) },
  // Romantic anniversary covers only for couples — never work anniversaries.
  { key: 'wedding-anniversary', occasion: 'anniversary', label: 'anniversary', href: '/occasions/anniversary',
    test: t => /\banniversar\w*/.test(t) && /\b(wedding|couple|marriage|married|husband|wife)\b/.test(t) },
  { key: 'birthday', occasion: 'birthday', label: 'birthday', href: '/occasions/birthday',
    test: t => /\b(birthdays?|bday)\b/.test(t) },
  { key: 'work-anniversary', occasion: 'congratulations', label: 'congratulations', href: '/occasions/promotion',
    test: t => /\bwork anniversar\w*|\banniversar\w*/.test(t) },
  { key: 'graduation', occasion: 'congratulations', lead: 'c7-grad-cap', label: 'graduation', href: '/occasions/graduation',
    // "graduation"/"graduating", not "graduates" — an HR piece about hiring graduates is not a card post.
    test: t => /\b(graduation|graduating|convocation|passing out|nysc)\b/.test(t) },
  { key: 'new-baby', occasion: 'congratulations', lead: 'cg5-new-baby', label: 'new baby', href: '/occasions/new-baby',
    test: t => /\bnew baby\b|\bnewborn\b/.test(t) },
  { key: 'new-home', occasion: 'congratulations', lead: 'cg4-new-home', label: 'new home', href: '/cards/new-home',
    test: t => /\bnew home\b|\bhousewarming\b/.test(t) },
  { key: 'leaving', occasion: 'leaving', label: 'leaving', href: '/cards/leaving-card',
    test: t => /\b(leaving|farewell|send forth|goodbye|last day|redundancy|resign\w*|changing jobs|new job)\b/.test(t) },
  { key: 'wedding', occasion: 'wedding', label: 'wedding', href: '/wedding-group-card',
    test: t => /\b(weddings?|bride|groom|newlyweds?)\b/.test(t) },
  { key: 'congratulations', occasion: 'congratulations', label: 'congratulations', href: '/occasions/promotion',
    test: t => /\b(promotion|promotions|promoted|congratulations|congrats)\b/.test(t) },
  { key: 'thank-you', occasion: 'thank_you', label: 'thank-you', href: '/cards/thank-you',
    test: t => /\bthank you\b|\b(thanks|gratitude|appreciation|appreciate|recognition|recognising|recognizing)\b/.test(t) },
  // Occasions with no cover set: show nothing rather than unrelated covers.
  { key: 'no-covers', none: true,
    test: t => /\b(baby shower|maternity|paternity|welcome|new starter|onboarding|engagement|good luck|women'?s day|mother'?s day|father'?s day|eid|ramadan|diwali|easter|valentine)\b/.test(t) },
  // General group-card articles: covers from four different occasions, varied per post.
  { key: 'group-cards', showcase: ['birthday', 'leaving', 'thank_you', 'get_well', 'retirement', 'congratulations', 'anniversary', 'wedding'],
    label: 'group', href: '/cards/create',
    test: t => /\b(group cards?|ecards?|e cards?|greeting cards?|online cards?|virtual cards?|group gift\w*|gift pots?)\b/.test(t) },
];

const normalise = (...parts) => parts.filter(Boolean).join(' ')
  .toLowerCase().replace(/[-_/]+/g, ' ').replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

// Small stable hash so each post shows a different, but always the same, set.
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Which rule a post matches (or null). Exposed for tests. */
export const matchBlogRule = ({ title, slug }) => {
  const text = normalise(title, slug);
  const rule = RULES.find(r => r.test(text)) || null;
  return rule && !rule.none ? rule : null;
};

// Congratulations covers made for one specific event; they only appear where
// that event is the topic (as the rule's lead), never as generic congrats.
const SPECIFIC_CONGRATS = ['c7-grad-cap', 'cg5-new-baby', 'cg4-new-home'];
const isSpecific = d => SPECIFIC_CONGRATS.some(stem => d.id.endsWith(`-${stem}`));

// Consecutive covers with the same headline (two "Thank you!" artworks) read
// as a duplicate in a 4-up strip — keep the first, move the other back.
const spreadDuplicates = (list) => {
  const out = []; const later = [];
  const key = d => d.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  list.forEach(d => (out.some(o => key(o) === key(d)) ? later : out).push(d));
  return [...out, ...later];
};

/**
 * Covers for a blog post: { rule, designs[count], href, label } or null.
 */
export const coversForBlogPost = (post, count = 4) => {
  if (!post) return null;
  const rule = matchBlogRule(post);
  if (!rule) return null;
  const h = hash(post.slug || post.title || '');
  if (rule.showcase) {
    // Four different occasions, starting at a per-post offset; within each
    // occasion one of its ten lead covers, also chosen per post.
    const occ = rule.showcase;
    const designs = Array.from({ length: count }, (_, i) => {
      const list = getIllustratedCovers(occ[(h + i) % occ.length], { limit: 10 });
      return list[(h >>> 4) % list.length];
    }).filter(Boolean);
    return { rule: rule.key, label: rule.label, href: rule.href, designs };
  }
  const all = getIllustratedCovers(rule.occasion, { group: rule.group });
  if (all.length < count) return null;
  const lead = rule.lead ? all.find(d => d.id.endsWith(`-${rule.lead}`)) : null;
  const pool = all.filter(d => d !== lead && !isSpecific(d));
  const start = h % pool.length;
  const rotated = spreadDuplicates([...pool.slice(start), ...pool.slice(0, start)]);
  const designs = [...(lead ? [lead] : []), ...rotated].slice(0, count);
  return { rule: rule.key, label: rule.label, href: rule.href, designs };
};

const BLOCK_TAGS = ['div', 'section', 'ul', 'ol', 'table', 'blockquote', 'figure', 'details', 'aside'];
const balanced = (html) => BLOCK_TAGS.every((tag) => {
  const open = (html.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
  const close = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
  return open === close;
});

/**
 * Where to put the cover strip: at the first <h2> section boundary that has a
 * real paragraph of text before it — after the intro, or after the first
 * section when a post opens straight with a heading. Only splits where every
 * block element before the cut is closed; otherwise the strip goes after the
 * article. Returns [before, after].
 */
export const splitArticleForStrip = (html) => {
  const content = html || '';
  const re = /<h2\b/gi;
  let m;
  while ((m = re.exec(content))) {
    if (m.index === 0) continue;
    const before = content.slice(0, m.index);
    const text = before.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, '').replace(/<[^>]+>/g, '').trim();
    if (/<p\b/i.test(before) && text.length >= 80 && balanced(before)) return [before, content.slice(m.index)];
  }
  return [content, ''];
};
