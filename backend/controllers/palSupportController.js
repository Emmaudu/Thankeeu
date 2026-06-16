const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

// ── GET /api/pals/support — list this group's tickets ───────────────────────
const getPalTickets = async (req, res) => {
  try {
    const { data, error } = await supabase.from('pal_support_tickets')
      .select('*').eq('pal_group_id', req.palGroup.id).order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01') return res.json([]);
      throw error;
    }
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Support operation failed' }); }
};

// ── POST /api/pals/support — submit a new ticket ─────────────────────────────
const createPalTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim()) return res.status(400).json({ error: 'Subject and message are required' });

    const { data, error } = await supabase.from('pal_support_tickets').insert({
      pal_group_id: req.palGroup.id,
      group_name: req.palGroup.group_name,
      subject: subject.trim(), message: message.trim(), status: 'open',
    }).select().maybeSingle();
    if (error) throw error;

    sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@thankeeu.com',
      template: 'supportTicket',
      data: { name: req.palGroup.group_name, subject, message, type: 'Pals Group', ticketId: data.id },
    }).catch(() => {});

    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Support operation failed' }); }
};

// ── ADMIN: GET /api/admin/pals/tickets — all pal tickets ─────────────────────
const adminListPalTickets = async (req, res) => {
  try {
    const { status } = req.query;
    let q = supabase.from('pal_support_tickets').select('*').order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) {
      if (error.code === '42P01') return res.json([]);
      throw error;
    }
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Support operation failed' }); }
};

// ── ADMIN: PUT /api/admin/pals/tickets/:id/reply ──────────────────────────────
const adminReplyPalTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ error: 'Reply message is required' });

    const { data: ticket, error } = await supabase.from('pal_support_tickets')
      .update({ admin_reply: reply.trim(), status: 'answered', replied_at: new Date() })
      .eq('id', id).select('*, pal_groups(email, group_name)').maybeSingle();
    if (error) throw error;

    if (ticket.pal_groups?.email) {
      sendEmail({
        to: ticket.pal_groups.email,
        template: 'palSupportReply',
        data: { groupName: ticket.pal_groups.group_name, subject: ticket.subject, reply: reply.trim() },
      }).catch(() => {});
    }

    res.json({ ok: true, ticket });
  } catch (err) { res.status(500).json({ error: 'Support operation failed' }); }
};

module.exports = { getPalTickets, createPalTicket, adminListPalTickets, adminReplyPalTicket };
