const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

    const isCompany = !!req.company;
    const isMember = !!req.member;
    const sender = isCompany ? req.company : isMember ? req.member : req.user;

    const senderName = isCompany
      ? sender.name
      : isMember
      ? `${sender.first_name} ${sender.last_name}`
      : sender.full_name;

    const senderType = isCompany ? 'company' : isMember ? 'member' : 'user';

    const { data: ticket, error } = await supabase.from('support_tickets').insert({
      sender_type: senderType,
      sender_id: sender.id,
      sender_name: senderName,
      sender_email: sender.email,
      subject,
      message
    }).select().single();

    if (error) {
      console.error('Support ticket DB error:', error);
      throw error;
    }

    // Send emails - don't fail ticket creation if email fails
    const emailResults = await Promise.allSettled([
      sendEmail({
        to: process.env.SUPPORT_EMAIL || 'support@thankeeu.com',
        template: 'supportTicket',
        data: {
          senderName,
          senderEmail: sender.email,
          senderType: isCompany ? 'Company (HR)' : isMember ? 'Team Member' : 'User',
          subject,
          message,
          ticketId: ticket.id
        }
      }),
      sendEmail({
        to: sender.email,
        template: 'supportConfirm',
        data: {
          name: senderName,
          subject,
          ticketId: ticket.id
        }
      })
    ]);

    emailResults
      .filter(result => result.status === 'rejected')
      .forEach(result => console.error('Support email failed:', result.reason));

    res.status(201).json({ message: 'Support ticket submitted. We will respond within 24 hours.', ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit support ticket' });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const senderId = req.company?.id || req.member?.id || req.user?.id;
    if (!senderId) return res.status(401).json({ error: 'Not authenticated' });
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, subject, message, status, admin_reply, admin_replied_at, created_at')
      .eq('sender_id', senderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

// Admin: get all tickets
const getAllTickets = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

// Admin: reply to ticket
const replyToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reply } = req.body;
    const { data: ticket } = await supabase.from('support_tickets').select('*').eq('id', ticketId).single();
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    await supabase.from('support_tickets').update({
      admin_reply: reply, admin_replied_at: new Date(), status: 'resolved', updated_at: new Date()
    }).eq('id', ticketId);

    await sendEmail({
      to: ticket.sender_email,
      template: 'supportReply',
      data: { name: ticket.sender_name, subject: ticket.subject, reply, ticketId }
    });

    res.json({ message: 'Reply sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reply to ticket' });
  }
};

module.exports = { createTicket, getMyTickets, getAllTickets, replyToTicket };
