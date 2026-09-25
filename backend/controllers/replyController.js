// replyController.js — the creator and the recipient replying to individual
// signers (one reply thread under each board card / album page).
//
// Who may reply:
//   • the recipient — a valid access_token (the private link), or signed in
//     with the recipient's email, or the card was transferred to them;
//   • the creator — the individual user, the team member who made it, or the
//     company (HR) account that owns it.
// Everyone who can see a message can read its replies; replies on a private
// message are only shown to the creator and the recipient.
//
// Schema tolerance: if the message_replies table has not been created yet the
// read endpoint returns an empty list (the card still loads) and writes return
// a clear 503 instead of a crash.

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
      .select('id, message_id, author_role, author_name, content, created_at')
      .eq('card_id', card.id)
      .order('created_at', { ascending: true })
      .limit(2000);
    if (error) {
      if (isMissingTable(error)) return res.json({ replies: [], role: who.role, can_reply: false, unavailable: true });
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
    res.json({ replies: visible, role: who.role, can_reply: !!who.role });
  } catch (err) {
    console.error('[listReplies]', err.message);
    res.status(500).json({ error: 'Could not load replies' });
  }
};

// POST /api/messages/:card_slug/replies/:message_id  { content }
const addReply = async (req, res) => {
  try {
    const card = await loadCard(req.params.card_slug);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const who = await resolveReplier(req, card);
    if (!who.role) return res.status(403).json({ error: 'Only the card creator or the recipient can reply to messages.' });

    const content = stripHtml(String(req.body?.content || '')).slice(0, 1000).trim();
    if (!content) return res.status(400).json({ error: 'Write a reply first' });

    const { data: msg } = await supabase.from('messages')
      .select('id, card_id, author_name, author_email')
      .eq('id', req.params.message_id).maybeSingle();
    if (!msg || msg.card_id !== card.id) return res.status(404).json({ error: 'Message not found on this card' });

    const authorName = stripHtml(String(who.name)).slice(0, 80) || (who.role === 'recipient' ? 'The recipient' : 'The card creator');
    const { data: reply, error } = await supabase.from('message_replies').insert({
      message_id: msg.id,
      card_id: card.id,
      author_role: who.role,
      author_name: authorName,
      author_user_id: who.userId,
      content,
    }).select('id, message_id, author_role, author_name, content, created_at').maybeSingle();
    if (error) {
      if (isMissingTable(error)) return res.status(503).json({ error: MIGRATION_HINT });
      throw error;
    }

    res.status(201).json({ reply });

    // Let the signer know — best effort, never blocks the reply.
    if (msg.author_email) {
      const cardTitle = card.title || `${card.recipient_name}'s card`;
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
              <p style="color:#888;font-size:13px;margin:10px 0 0;">— ${esc(authorName)}${who.role === 'recipient' ? '' : ' (card organiser)'}</p>
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

// DELETE /api/messages/:card_slug/replies/:reply_id — creator or recipient,
// on replies written in their own role.
const deleteReply = async (req, res) => {
  try {
    const card = await loadCard(req.params.card_slug);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const who = await resolveReplier(req, card);
    if (!who.role) return res.status(403).json({ error: 'Not allowed' });
    const { data: reply, error } = await supabase.from('message_replies')
      .select('id, card_id, author_role').eq('id', req.params.reply_id).maybeSingle();
    if (error) {
      if (isMissingTable(error)) return res.status(503).json({ error: MIGRATION_HINT });
      throw error;
    }
    if (!reply || reply.card_id !== card.id) return res.status(404).json({ error: 'Reply not found' });
    if (reply.author_role !== who.role) return res.status(403).json({ error: 'You can only delete your own replies' });
    const { error: delErr } = await supabase.from('message_replies').delete().eq('id', reply.id);
    if (delErr) throw delErr;
    res.json({ ok: true });
  } catch (err) {
    console.error('[deleteReply]', err.message);
    res.status(500).json({ error: 'Could not delete the reply' });
  }
};

module.exports = { resolveReplier, listReplies, addReply, deleteReply, esc };
