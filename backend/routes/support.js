const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const adminOnly = [authenticate, (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  next();
}];

const genTicketNumber = () => `TKT-${Date.now().toString(36).toUpperCase()}`;

// ─── POST /support/tickets ─────────────────────────────────────────
router.post('/tickets', authenticate,
  [
    body('subject').trim().isLength({ min: 3, max: 200 }),
    body('message').trim().isLength({ min: 10, max: 5000 }),
    body('category').optional().isIn(['general','payment','task_dispute','account','kyc','withdrawal','other']),
    body('priority').optional().isIn(['low','normal','high','urgent']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, message: errors.array()[0].msg });

      const { subject, category, priority, message } = req.body;

      // Generate IDs upfront so we don't rely on .select() after insert (avoids RLS issues)
      const ticketId     = crypto.randomUUID();
      const messageId    = crypto.randomUUID();
      const ticket_number = genTicketNumber();

      const { error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          id: ticketId,
          user_id: req.user.id,
          ticket_number,
          subject: subject.trim(),
          category: category || 'general',
          priority: priority || 'normal',
          status: 'open',
        });

      if (ticketError) {
        console.error('Ticket insert error:', ticketError);
        throw ticketError;
      }

      // Add first message
      const { error: msgError } = await supabase.from('support_messages').insert({
        id: messageId,
        ticket_id: ticketId,
        sender_id: req.user.id,
        message: message.trim(),
        is_admin: false,
      });
      if (msgError) console.error('Support message insert error:', msgError);

      // Notify admins (non-fatal)
      try {
        const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
        if (admins?.length) {
          (async () => {
            try {
              await supabase.from('notifications').insert(
              admins.map(a => ({
              user_id: a.id,
              type: 'support_ticket',
              title: `New Support Ticket #${ticket_number}`,
              message: `${req.user.full_name || req.user.email}: ${subject}`,
              data: { ticket_id: ticketId },
              action_url: `/admin?tab=support`,
              }))
              );
            } catch (_) {}
          })();
        }
      } catch (notifErr) {
        console.warn('Notification error (non-fatal):', notifErr.message);
      }

      res.status(201).json({
        success: true,
        ticket: { id: ticketId, ticket_number, subject, status: 'open' },
      });
    } catch (err) {
      console.error('Create ticket error:', err);
      res.status(500).json({ success: false, message: 'Could not create ticket. Please try again.' });
    }
  }
);

// ─── GET /support/tickets ──────────────────────────────────────────
router.get('/tickets', authenticate, async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*, messages:support_messages(id)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, tickets: tickets || [] });
  } catch (err) {
    console.error('Get tickets error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch tickets' });
  }
});

// ─── GET /support/tickets/:id ──────────────────────────────────────
router.get('/tickets/:id', authenticate, async (req, res) => {
  try {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('*, user:users!user_id(id, full_name, email, role, avatar_url)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !ticket)
      return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (ticket.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied' });

    const { data: messages } = await supabase
      .from('support_messages')
      .select('*, sender:users!sender_id(id, full_name, avatar_url, role)')
      .eq('ticket_id', req.params.id)
      .order('created_at', { ascending: true });

    res.json({ success: true, ticket, messages: messages || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch ticket' });
  }
});

// ─── POST /support/tickets/:id/messages ───────────────────────────
router.post('/tickets/:id/messages', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim())
      return res.status(400).json({ success: false, message: 'Message is required' });

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id, status, ticket_number, subject')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied' });

    const isAdmin = req.user.role === 'admin';
    const messageId = crypto.randomUUID();

    const { data: msg, error } = await supabase
      .from('support_messages')
      .insert({ id: messageId, ticket_id: ticket.id, sender_id: req.user.id, message: message.trim(), is_admin: isAdmin })
      .select('*, sender:users!sender_id(id, full_name, avatar_url, role)')
      .maybeSingle();

    if (error) throw error;

    const newStatus = isAdmin
      ? 'in_progress'
      : (ticket.status === 'resolved' ? 'open' : ticket.status);
    await supabase.from('support_tickets')
      .update({ updated_at: new Date().toISOString(), status: newStatus })
      .eq('id', ticket.id);

    // Notifications (non-fatal)
    try {
      if (!isAdmin) {
        const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
        if (admins?.length) {
          (async () => {
            try {
              await supabase.from('notifications').insert(
              admins.map(a => ({
              user_id: a.id,
              type: 'support_reply',
              title: `Reply on Ticket #${ticket.ticket_number}`,
              message: `${req.user.full_name || req.user.email}: ${message.substring(0, 80)}`,
              data: { ticket_id: ticket.id },
              action_url: `/admin?tab=support`,
              }))
              );
            } catch (_) {}
          })();
        }
      } else {
        (async () => {
          try {
            await supabase.from('notifications').insert({
            user_id: ticket.user_id,
            type: 'support_reply',
            title: `Support Update: ${ticket.subject}`,
            message: `Admin replied to your ticket #${ticket.ticket_number}`,
            data: { ticket_id: ticket.id },
            action_url: `/support`,
            });
          } catch (_) {}
        })();
      }
    } catch (notifErr) {
      console.warn('Notification error (non-fatal):', notifErr.message);
    }

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ success: false, message: 'Could not send reply' });
  }
});

// ─── PUT /support/tickets/:id/status ──────────────────────────────
router.put('/tickets/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const { data: ticket } = await supabase
      .from('support_tickets').select('user_id').eq('id', req.params.id).maybeSingle();
    if (!ticket) return res.status(404).json({ success: false, message: 'Not found' });

    const allowed = req.user.role === 'admin'
      ? ['open', 'in_progress', 'waiting_user', 'resolved', 'closed']
      : ['closed'];
    if (!allowed.includes(status))
      return res.status(403).json({ success: false, message: 'Not allowed to set this status' });
    if (req.user.role !== 'admin' && ticket.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const updates = { status, updated_at: new Date().toISOString() };
    if (['resolved', 'closed'].includes(status)) updates.resolved_at = new Date().toISOString();
    if (req.user.role === 'admin') updates.admin_id = req.user.id;

    await supabase.from('support_tickets').update(updates).eq('id', req.params.id);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update status' });
  }
});

// ─── ADMIN: GET /support/admin/tickets ────────────────────────────
router.get('/admin/tickets', ...adminOnly, async (req, res) => {
  try {
    const { status, category } = req.query;
    let query = supabase
      .from('support_tickets')
      .select('*, user:users!user_id(id, full_name, email, role, avatar_url)')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data: tickets, error } = await query;
    if (error) throw error;
    res.json({ success: true, tickets: tickets || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch tickets' });
  }
});

// ─── ADMIN: GET /support/admin/stats ──────────────────────────────
router.get('/admin/stats', ...adminOnly, async (req, res) => {
  try {
    const [open, inProgress, resolved, urgent] = await Promise.all([
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('priority', 'urgent').neq('status', 'closed'),
    ]);
    res.json({
      success: true,
      stats: {
        open: open.count || 0,
        in_progress: inProgress.count || 0,
        resolved: resolved.count || 0,
        urgent: urgent.count || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch stats' });
  }
});

// ─── ADMIN: POST /support/admin/tickets/:id/reply ─────────────────
router.post('/admin/tickets/:id/reply', ...adminOnly, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim())
      return res.status(400).json({ success: false, message: 'Message is required' });

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, user_id, status, ticket_number, subject')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const messageId = crypto.randomUUID();
    const { data: msg, error } = await supabase
      .from('support_messages')
      .insert({ id: messageId, ticket_id: ticket.id, sender_id: req.user.id, message: message.trim(), is_admin: true })
      .select('*, sender:users!sender_id(id, full_name, avatar_url, role)')
      .maybeSingle();

    if (error) throw error;

    // Move ticket to in_progress
    await supabase.from('support_tickets')
      .update({ status: 'in_progress', admin_id: req.user.id, updated_at: new Date().toISOString() })
      .eq('id', ticket.id);

    // Notify the user
    try {
      (async () => {
        try {
          await supabase.from('notifications').insert({
          user_id: ticket.user_id,
          type: 'support_reply',
          title: `Support Update: ${ticket.subject}`,
          message: `Admin replied to your ticket #${ticket.ticket_number}`,
          data: { ticket_id: ticket.id },
          action_url: `/support`,
          });
        } catch (_) {}
      })();
    } catch (_) {}

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error('Admin reply error:', err);
    res.status(500).json({ success: false, message: 'Could not send reply' });
  }
});

// ─── ADMIN: PUT /support/admin/tickets/:id/status ─────────────────
router.put('/admin/tickets/:id/status', ...adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const { data: ticket } = await supabase
      .from('support_tickets').select('user_id, ticket_number, subject').eq('id', req.params.id).maybeSingle();
    if (!ticket) return res.status(404).json({ success: false, message: 'Not found' });

    const updates = { status, admin_id: req.user.id, updated_at: new Date().toISOString() };
    if (['resolved', 'closed'].includes(status)) updates.resolved_at = new Date().toISOString();

    await supabase.from('support_tickets').update(updates).eq('id', req.params.id);

    // Notify the user of status change
    try {
      (async () => {
        try {
          await supabase.from('notifications').insert({
          user_id: ticket.user_id,
          type: 'support_update',
          title: `Ticket ${status}: ${ticket.subject}`,
          message: `Your support ticket #${ticket.ticket_number} has been marked as ${status.replace('_', ' ')}`,
          data: { ticket_id: req.params.id },
          action_url: `/support`,
          });
        } catch (_) {}
      })();
    } catch (_) {}

    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update status' });
  }
});

module.exports = router;
