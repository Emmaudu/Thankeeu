/**
 * ogImageController.js
 * GET /api/cards/:slug/og-image
 *
 * Returns a 1200×630 SVG (accepted by all OG crawlers) personalised
 * with the card's recipient name, occasion, and design theme colour.
 * No image processing libraries needed — pure SVG text.
 */

const supabase = require('../utils/supabase');

// Map design_theme → gradient colours (match frontend cardDesigns.js)
const THEME_GRADIENTS = {
  rose_love:       ['#7C3AED', '#EC4899'],
  ocean_blue:      ['#1D4ED8', '#06B6D4'],
  forest_green:    ['#065F46', '#10B981'],
  sunset_orange:   ['#EA580C', '#FBBF24'],
  midnight_dark:   ['#1E1B4B', '#4C1D95'],
  golden_yellow:   ['#D97706', '#FDE68A'],
  candy_pink:      ['#BE185D', '#F9A8D4'],
  sky_blue:        ['#0284C7', '#7DD3FC'],
  default:         ['#7C3AED', '#EC4899'],
};

const OCCASION_EMOJI = {
  birthday: '🎂', anniversary: '💍', leaving: '👋', promotion: '🌟',
  wedding: '💒', baby_shower: '👶', retirement: '🏖️', congratulations: '🎉',
  graduation: '🎓', christmas: '🎄', get_well: '🌷', new_year: '✨',
  valentine: '💝', other: '💌',
};

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Wrap text into lines of max `maxChars` characters
function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // max 3 lines
}

const getOgImage = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: card } = await supabase
      .from('cards')
      .select('title, recipient_name, occasion, custom_occasion, design_theme, background_color, total_collected, messages(count)')
      .eq('slug', slug)
      .in('status', ['active', 'sent'])
      .maybeSingle();

    if (!card) {
      return res.status(404).send('Card not found');
    }

    const signers = card.messages?.[0]?.count || 0;

    const [c1, c2] = THEME_GRADIENTS[card.design_theme] || THEME_GRADIENTS.default;
    const occasionRaw = card.occasion === 'other' && card.custom_occasion
      ? card.custom_occasion
      : (card.occasion || 'special day').replace(/_/g, ' ');
    const occasion = occasionRaw.charAt(0).toUpperCase() + occasionRaw.slice(1);
    const emoji = OCCASION_EMOJI[card.occasion] || '💜';
    const recipientName = escapeXml(card.recipient_name || 'Someone');
    const title = escapeXml(card.title || `${card.recipient_name}'s ${occasion} Card`);

    // Name may be long — wrap
    const nameLines = wrapText(recipientName, 18);
    const nameY0 = nameLines.length > 1 ? 270 : 290;
    const nameLineSVG = nameLines.map((line, i) =>
      `<tspan x="600" dy="${i === 0 ? 0 : 82}">${escapeXml(line)}</tspan>`
    ).join('');

    const signerText = signers > 0
      ? `${signers} ${signers === 1 ? 'person' : 'people'} signed`
      : 'Be the first to sign!';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${c2};stop-opacity:1"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="20" flood-color="rgba(0,0,0,0.25)"/>
    </filter>
  </defs>

  <!-- Background gradient -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="1080" cy="80" r="180" fill="rgba(255,255,255,0.07)"/>
  <circle cx="120" cy="550" r="140" fill="rgba(255,255,255,0.07)"/>
  <circle cx="1150" cy="520" r="90" fill="rgba(255,255,255,0.05)"/>

  <!-- Card panel -->
  <rect x="140" y="80" width="920" height="470" rx="32" fill="rgba(255,255,255,0.14)" filter="url(#shadow)"/>
  <rect x="140" y="80" width="920" height="470" rx="32" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>

  <!-- Emoji -->
  <text x="600" y="200" text-anchor="middle" font-size="88" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${emoji}</text>

  <!-- Recipient name -->
  <text x="600" y="${nameY0}" text-anchor="middle"
    font-size="72" font-weight="800" fill="white"
    font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
    style="letter-spacing:-2px;">
    ${nameLineSVG}
  </text>

  <!-- Occasion label -->
  <text x="600" y="${nameY0 + nameLines.length * 82 + 14}" text-anchor="middle"
    font-size="32" fill="rgba(255,255,255,0.82)"
    font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
    font-weight="500">${escapeXml(occasion)} Card</text>

  <!-- Signer count pill -->
  <rect x="468" y="${nameY0 + nameLines.length * 82 + 55}" width="264" height="48" rx="24" fill="rgba(255,255,255,0.22)"/>
  <text x="600" y="${nameY0 + nameLines.length * 82 + 86}" text-anchor="middle"
    font-size="22" fill="white" font-weight="600"
    font-family="'Helvetica Neue',Helvetica,Arial,sans-serif">✍️ ${escapeXml(signerText)}</text>

  <!-- Thankeeu branding -->
  <text x="600" y="585" text-anchor="middle"
    font-size="22" fill="rgba(255,255,255,0.7)" font-weight="700"
    font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
    letter-spacing="1px">THANKEEU · GROUP CARDS &amp; GIFTS</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5min cache
    res.send(svg);
  } catch (err) {
    console.error('[og-image]', err.message);
    res.status(500).send('Error generating image');
  }
};

/**
 * GET /api/cards/:slug/og-meta
 * Returns JSON with title, description for the Vercel Edge prerender function.
 * No auth required — used by the crawler prerender layer.
 */
const getOgMeta = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: card } = await supabase
      .from('cards')
      .select('title, recipient_name, occasion, custom_occasion, messages(count)')
      .eq('slug', slug)
      .in('status', ['active', 'sent'])
      .maybeSingle();

    if (!card) return res.status(404).json({ error: 'Not found' });

    const signers = card.messages?.[0]?.count || 0;
    const occasionRaw = card.occasion === 'other' && card.custom_occasion
      ? card.custom_occasion
      : (card.occasion || 'special day').replace(/_/g, ' ');
    const occasion = occasionRaw.charAt(0).toUpperCase() + occasionRaw.slice(1);

    const title = `Sign ${card.recipient_name}'s ${occasion} card 💜`;
    const description = signers > 0
      ? `${signers} ${signers === 1 ? 'person has' : 'people have'} already signed. Add your message to ${card.recipient_name}'s ${occasion} card — takes 60 seconds, no account needed.`
      : `Add your message to ${card.recipient_name}'s ${occasion} card — takes 60 seconds, no account needed.`;

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    res.json({ title, description, slug });
  } catch (err) {
    console.error('[og-meta]', err.message);
    res.status(500).json({ error: 'Failed' });
  }
};

module.exports = { getOgImage, getOgMeta };
