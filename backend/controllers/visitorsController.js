const supabase      = require('../utils/supabase');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();
const { sendEmail } = require('../utils/email');

const trackVisitor = async (req, res) => {
  try {
    const { email, full_name, card_slug } = req.body;
    if (!email || !card_slug) return res.json({ tracked: false });

    // Skip if already a registered user
    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
    if (existing) return res.json({ tracked: false, reason: 'already_user' });

    const { data: card } = await supabase.from('cards')
      .select('id, occasion, recipient_name, creator:users(full_name)')
      .eq('slug', card_slug).maybeSingle();

    const { data: existingVisitor } = await supabase.from('visitors')
      .select('id').eq('email', email.toLowerCase()).maybeSingle();

    if (existingVisitor) {
      await supabase.from('visitors').update({ full_name: full_name || undefined }).eq('id', existingVisitor.id);
    } else {
      await supabase.from('visitors').insert({
        email: email.toLowerCase().trim(),
        full_name: full_name?.trim() || null,
        card_id: card?.id || null,
        card_slug,
        occasion: card?.occasion || null,
        creator_name: card?.creator?.full_name || null,
        nudge_count: 0,
      });
    }
    res.json({ tracked: true });
  } catch (err) {
    console.error('trackVisitor:', err);
    res.json({ tracked: false });
  }
};

const getVisitors = async (req, res) => {
  try {
    const { data } = await supabase.from('visitors').select('*')
      .is('converted_to_user', null).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

const getVisitorStats = async (req, res) => {
  try {
    const { count: total } = await supabase.from('visitors').select('*', { count: 'exact', head: true });
    const { count: converted } = await supabase.from('visitors').select('*', { count: 'exact', head: true }).not('converted_to_user', 'is', null);
    const { data: byOcc } = await supabase.from('visitors').select('occasion').not('occasion', 'is', null);
    const oMap = {};
    (byOcc || []).forEach(v => { oMap[v.occasion] = (oMap[v.occasion] || 0) + 1; });
    res.json({ total: total || 0, converted: converted || 0, by_occasion: oMap });
  } catch { res.status(500).json({ error: 'Failed' }); }
};

const sendNudgeEmails = async () => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('visitors').select('*')
    .is('converted_to_user', null).lt('nudge_count', 4)
    .or(`last_nudged_at.is.null,last_nudged_at.lt.${cutoff}`);

  if (error) {
    console.error('[nudge] Failed to fetch visitors:', error.message);
    return;
  }

  const eligible = data || [];
  console.log(`[nudge] ${eligible.length} visitor(s) eligible for nudge email`);

  let sent = 0, failed = 0;
  for (const v of eligible) {
    try {
      await sendEmail({ to: v.email, template: 'visitorNudge', data: {
        name: v.full_name || 'Friend', occasion: v.occasion || 'special occasion',
        creatorName: v.creator_name || 'someone',
        signupLink: `${FRONTEND_URL}/signup`,
        cardLink: v.card_slug ? `${FRONTEND_URL}/sign/${v.card_slug}` : null,
        appUrl: FRONTEND_URL,
      }});
      // Only increment count when email actually sent successfully
      await supabase.from('visitors')
        .update({ nudge_count: (v.nudge_count || 0) + 1, last_nudged_at: new Date() })
        .eq('id', v.id);
      sent++;
    } catch (err) {
      console.error(`[nudge] Failed to send to ${v.email}:`, err.message);
      failed++;
    }
  }
  console.log(`[nudge] Done — sent: ${sent}, failed: ${failed}`);
};

module.exports = { trackVisitor, getVisitors, getVisitorStats, sendNudgeEmails };
