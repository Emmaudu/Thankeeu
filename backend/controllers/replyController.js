// replyController.js — replies to individual signers (one reply thread under
// each board card / album page).
//
// Who may reply:
//   • the recipient — a valid access_token (the private link), or signed in
//     with the recipient's email, or the card was transferred to them;
//   • the creator — the individual user, the team member who made it, or the
//     company (HR) account that owns it;
//   • anyone else viewing the card ("guest") — while signing is open and
//     afterwards — with their account name, or a name they type. Guests cannot
//     reply to private messages, and are rate-limited per IP.
// Every reply emails that one signer (never the whole card).
// Everyone who can see a message can read its replies; replies on a private
// message are only shown to the creator and the recipient.
// Moderation: the creator and the recipient can remove guest replies; a guest
// can remove their own (account, or the delete token their browser kept).
//
// Schema tolerance: if the message_replies table has not been created yet the
// read endpoint returns an empty list (the card still loads) and writes return
// a clear 503 instead of a crash.

const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { stripHtml } = require('../utils/sanitize');

const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return s.startsWith('http') ? s : 'https://thankeeu.com';
})();

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const isMissingTable = (err) => !!err && (
  err.code === '42P01' || err.code === 'PGRST205' ||
  /relation .*message_replies.* does not exist|could not find the table/i.test(err.message || '')
);

const MIGRATION_HINT = 'Replies need the latest database migration (database/migration_message_replies.sql).';
const GUEST_MIGRATION_HINT = 'Public replies need the latest database migration (database/migration_public_replies.sql).';
const isSchemaTooOld = (err) => !!err && (
  err.code === '23514' || err.code === 'PGRST204' || err.code === '42703' ||
  /author_role_check|delete_token_hash|author_email/i.test(err.message || '')
);
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

// Simple per-IP limiter for guest replies (per card): 8 per 10 minutes.
const GUEST_WINDOW_MS = 10 * 60 * 1000;
const GUEST_MAX = 8;
const guestHits = new Map();
function guestLimited(ip, cardId, now = Date.now()) {
  const key = `${ip}|${cardId}`;
  const list = (guestHits.get(key) || []).filter(t => now - t < GUEST_WINDOW_MS);
  if (list.length >= GUEST_MAX) { guestHits.set(key, list); return true; }
  list.push(now); guestHits.set(key, list);
  if (guestHits.size > 5000) { for (const [k, v] of guestHits) if (!v.some(t => now - t < GUEST_WINDOW_MS)) guestHits.delete(k); }
  return false;
}
const clientIp = (req) => String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';

/** A viewer's display name when signed in (user / team member / company). */
const signedInName = (req) => (req.user?.full_name
  || (req.member ? `${req.member.first_name || ''} ${req.member.last_name || ''}`.trim() : '')
  || req.company?.contact_person || req.company?.name || '').trim();

/**
 * Work out whether the requester is this card's creator or recipient.
 * Returns { role: 'creator'|'recipient'|null, name, userId }.
 * A person who is both (sent a card to themselves) is treated as recipient.
 */
async function resolveReplier(req, card) {
  const token = req.query.access_token || req.body?.access_token || req.headers['x-card-token'];
  const email = (req.user?.email || req.member?.email || '').toLowerCase();
  const recipientEmail = (card.recipient_email || '').toLowerCase();

  let isRecipient = !!(token && card.access_token && token === card.access_token);
  if (!isRecipient && email && recipientEmail && email === recipientEmail) isRecipient = true;
  if (!isRecipient && req.user?.id) {
    const { data } = await supabase.from('received_cards').select('id')
      .eq('card_id', card.id).eq('recipient_user_id', req.user.id).maybeSingle();
    if (data) isRecipient = true;
  }
  if (!isRecipient && req.member?.id) {
    const { data } = await supabase.from('member_received_cards').select('id')
      .eq('card_id', card.id).eq('recipient_member_id', req.member.id).maybeSingle();
    if (data) isRecipient = true;
  }
  if (isRecipient) {
    return {
      role: 'recipient',
      name: req.user?.full_name
        || (req.member ? `${req.member.first_name || ''} ${req.member.last_name || ''}`.trim() : '')
        || card.recipient_name || 'The recipient',
      userId: req.user?.id || req.member?.id || null,
    };
  }

  const isCreator = (req.user && card.creator_id && req.user.id === card.creator_id)
    || (req.member && card.created_by_member_id && req.member.id === card.created_by_member_id)
    || (req.company && card.company_id && req.company.id === card.company_id);
  if (isCreator) {
    return {
      role: 'creator',
      name: req.user?.full_name
        || (req.member ? `${req.member.first_name || ''} ${req.member.last_name || ''}`.trim() : '')
        || req.company?.contact_person || req.company?.name || card.cover_sender || 'The card creator',
      userId: req.user?.id || req.member?.id || req.company?.id || null,
    };
  }
  return { role: null, name: null, userId: null };
}

const loadCard = async (slug) => {
  const { data } = await supabase.from('cards')
    .select('id, slug, title, recipient_name, recipient_email, access_token, creator_id, created_by_member_id, company_id, cover_sender')
    .eq('slug', slug).maybeSingle();
  return data;
};

// GET /api/messages/:card_slug/replies
const listReplies = async (req, res) => {
  try {
    const card = await loadCard(req.params.card_slug);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const who = await resolveReplier(req, card);

    const { data: replies, error } = await supabase.from('message_replies')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: true })
      .limit(2000);
    if (error) {
      if (isMissingTable(error)) return res.json({ replies: [], role: who.role, can_reply: false, can_moderate: false, unavailable: true });
      throw error;
    }

    let visible = replies || [];
    if (!who.role && visible.length) {
      // Outsiders never see replies to private messages.
      const { data: priv } = await supabase.from('messages').select('id')
        .eq('card_id', card.id).eq('is_private', true);
      const hidden = new Set((priv || []).map(m => m.id));
      visible = visible.filter(r => !hidden.has(r.message_id));
    }
    const uid = req.user?.id || req.member?.id || null;
    const out = visible.map(({ author_user_id, ...r }) => ({ ...r, mine: !!(uid && author_user_id === uid) }));
    res.json({
      replies: out,
      role: who.role,
      // Everyone can reply to a signer (guests on public messages only).
      can_reply: true,
      can_moderate: !!who.role,
      signed_in_name: signedInName(req) || null,
    });
  } catch (err) {
    console.error('[listReplies]', err.message);
    res.status(500).json({ error: 'Could not load replies' });
  }
};

// POST /api/messages/:card_slug/replies/:message_id  { content, author_name?, author_email? }
const addReply = async (req, res) => {
  try {
    const card = await loadCard(req.params.card_slug);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const who = await resolveReplier(req, card);
    const isGuest = !who.role;

    const content = stripHtml(String(req.body?.content || '')).slice(0, 1000).trim();
    if (!content) return res.status(400).json({ error: 'Write a reply first' });

    const { data: msg } = await supabase.from('messages')
      .select('id, card_id, author_name, author_email, is_private')
      .eq('id', req.params.message_id).maybeSingle();
    if (!msg || msg.card_id !== card.id) return res.status(404).json({ error: 'Message not found on this card' });

    let authorName;
    let guestEmail = null;
    if (isGuest) {
      if (msg.is_private) return res.status(403).json({ error: 'Only the card creator or the recipient can reply to a private message.' });
      authorName = signedInName(req) || stripHtml(String(req.body?.author_name || '')).replace(/\s+/g, ' ').trim();
      authorName = authorName.slice(0, 60);
      if (!authorName) return res.status(400).json({ error: 'Add your name so they know who replied' });
      const e = String(req.body?.author_email || req.user?.email || req.member?.email || '').trim().toLowerCase();
      if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200) guestEmail = e;
      if (guestLimited(clientIp(req), card.id)) {
        return res.status(429).json({ error: 'You are replying very quickly — please wait a few minutes.' });
      }
    } else {
      authorName = stripHtml(String(who.name)).slice(0, 80) || (who.role === 'recipient' ? 'The recipient' : 'The card creator');
    }

    const row = {
      message_id: msg.id,
      card_id: card.id,
      author_role: isGuest ? 'guest' : who.role,
      author_name: authorName,
      author_user_id: isGuest ? (req.user?.id || req.member?.id || null) : who.userId,
      content,
    };
    let deleteToken = null;
    if (isGuest) {
      deleteToken = crypto.randomBytes(18).toString('hex');
      row.delete_token_hash = sha(deleteToken);
      if (guestEmail) row.author_email = guestEmail;
    }
    const { data: reply, error } = await supabase.from('message_replies').insert(row)
      .select('id, message_id, author_role, author_name, content, created_at').maybeSingle();
    if (error) {
      if (isMissingTable(error)) return res.status(503).json({ error: MIGRATION_HINT });
      if (isGuest && isSchemaTooOld(error)) return res.status(503).json({ error: GUEST_MIGRATION_HINT });
      throw error;
    }

    res.status(201).json({ reply: { ...reply, mine: true }, ...(deleteToken ? { delete_token: deleteToken } : {}) });

    // Let THIS signer know — best effort, never blocks the reply.
    const selfReply = msg.author_email && guestEmail && msg.author_email.toLowerCase() === guestEmail;
    if (msg.author_email && !selfReply) {
      const cardTitle = card.title || `${card.recipient_name}'s card`;
      const roleNote = who.role === 'recipient' ? ` (${esc(card.recipient_name || 'the recipient')})`
        : who.role === 'creator' ? ' (card organiser)' : '';
      sendEmail({
        to: msg.author_email,
        subject: `${authorName} replied to your message on "${cardTitle}" 💬`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <div style="text-align:center;margin-bottom:18px;"><div style="font-size:40px;">💬</div>
              <h2 style="color:#5B4BDF;margin:8px 0;">${esc(authorName)} replied to you</h2>
              <p style="color:#888;font-size:14px;margin:0;">on "${esc(cardTitle)}"</p></div>
            <div style="background:#F5F3FF;border-radius:16px;padding:18px 22px;margin:18px 0;border-left:4px solid #7C6EFF;">
              <p style="color:#1A1730;font-size:16px;line-height:1.7;margin:0;">"${esc(content)}"</p>
              <p style="color:#888;font-size:13px;margin:10px 0 0;">— ${esc(authorName)}${roleNote}</p>
            </div>
            <div style="text-align:center;margin-top:22px;">
              <a href="${FRONTEND_URL}/card/${encodeURIComponent(card.slug)}" style="background:#6C5CE7;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">See the card</a>
            </div>
          </div>`,
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[addReply]', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Could not send your reply' });
  }
};

// DELETE /api/messages/:card_slug/replies/:reply_id  { delete_token? }
//   • creator / recipient: their own role's replies, and any guest reply
//     (moderation);
//   • a guest: their own reply (same account, or the delete token their
//     browser got back when they posted it).
const deleteReply = async (req, res) => {
  try {
    const card = await loadCard(req.params.card_slug);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const who = await resolveReplier(req, card);
    const { data: reply, error } = await supabase.from('message_replies')
      .select('*').eq('id', req.params.reply_id).maybeSingle();
    if (error) {
      if (isMissingTable(error)) return res.status(503).json({ error: MIGRATION_HINT });
      throw error;
    }
    if (!reply || reply.card_id !== card.id) return res.status(404).json({ error: 'Reply not found' });

    const uid = req.user?.id || req.member?.id || null;
    const token = req.body?.delete_token || req.query?.delete_token;
    const ownsGuestReply = reply.author_role === 'guest' && (
      (uid && reply.author_user_id === uid) ||
      (token && reply.delete_token_hash && sha(token) === reply.delete_token_hash)
    );
    const allowed = ownsGuestReply
      || (who.role && reply.author_role === who.role)
      || (who.role && reply.author_role === 'guest');
    if (!allowed) {
      return res.status(403).json({ error: who.role ? 'You can only delete your own replies' : 'Not allowed' });
    }
    const { error: delErr } = await supabase.from('message_replies').delete().eq('id', reply.id);
    if (delErr) throw delErr;
    res.json({ ok: true });
  } catch (err) {
    console.error('[deleteReply]', err.message);
    res.status(500).json({ error: 'Could not delete the reply' });
  }
};

module.exports = { resolveReplier, listReplies, addReply, deleteReply, esc, signedInName, _guestHits: guestHits };
