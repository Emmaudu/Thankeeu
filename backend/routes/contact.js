const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { authenticate, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_not_set');
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Taskeeu';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@taskeeu.com';
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;
const FRONTEND = process.env.FRONTEND_URL || 'https://taskeeu.com';

const adminOnly = [authenticate, requireRole('admin')];

// ─── POST /contact — public inquiry form ─────────────────────────
router.post('/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('subject').trim().isLength({ min: 3, max: 200 }),
    body('category').optional().isIn(['general', 'support', 'enterprise', 'partnership', 'feedback', 'other']),
    body('message').trim().isLength({ min: 10, max: 3000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { name, email, subject, category, message } = req.body;

    try {
      const id = crypto.randomUUID();
      const { error } = await supabase.from('contact_inquiries').insert({
        id, name, email, subject,
        category: category || 'general',
        message,
        status: 'unread',
      });
      if (error) throw error;

      // Notify admin via in-app notification (non-fatal)
      try {
        const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
        if (admins?.length) {
          (async () => {
            try {
              await supabase.from('notifications').insert(
              admins.map(a => ({
              user_id: a.id,
              type: 'contact_inquiry',
              title: `New Contact Inquiry: ${subject}`,
              message: `${name} (${email}): ${message.substring(0, 80)}`,
              data: { inquiry_id: id },
              action_url: '/admin?tab=contacts',
              }))
              );
            } catch (_) {}
          })();
        }
      } catch (notifErr) {
        console.warn('Contact notification error (non-fatal):', notifErr.message);
      }

      // Auto-reply to user confirming receipt
      try {
        await resend.emails.send({
          from: FROM,
          to: email,
          subject: `We received your message — Taskeeu`,
          headers: {
            'X-Priority': '1',
            'X-Mailer': 'Taskeeu Platform',
          },
          html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f7f2f4;margin:0;padding:0;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#ff2d62,#c41445);padding:36px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;font-family:'Segoe UI',Arial,sans-serif;">Taskeeu</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Africa's Task Outsourcing Platform</p>
  </div>
  <div style="padding:36px 32px;font-family:'Segoe UI',Arial,sans-serif;">
    <h2 style="color:#1a0a10;margin-top:0;font-size:20px;font-weight:800;">Hi ${name}, we got your message!</h2>
    <p style="color:#4b3040;line-height:1.7;font-size:15px;">Thank you for reaching out. Our team has received your inquiry and will get back to you within <strong>24–48 hours</strong> during business hours (Mon–Fri, 8am–6pm WAT).</p>
    <div style="background:#fff5f7;border-left:4px solid #ff2d62;padding:16px 18px;border-radius:6px;margin:20px 0;font-size:14px;color:#7a1030;">
      <strong>Your message:</strong> ${subject}<br/>
      <span style="color:#9c6070;">${message.substring(0, 200)}${message.length > 200 ? '…' : ''}</span>
    </div>
    <p style="color:#4b3040;line-height:1.7;font-size:15px;">In the meantime, you can check our <a href="${FRONTEND}/faq" style="color:#ff2d62;font-weight:600;">FAQs</a> — your question might already be answered there.</p>
  </div>
  <div style="background:#fdf0f3;padding:20px 32px;text-align:center;color:#9c6070;font-size:12px;border-top:1px solid #fde0e8;font-family:'Segoe UI',Arial,sans-serif;">
    © ${new Date().getFullYear()} Taskeeu Technologies Ltd. · <a href="${FRONTEND}" style="color:#ff2d62;text-decoration:none;">taskeeu.com</a>
  </div>
</div>
</body></html>`,
        });
      } catch (mailErr) {
        console.warn('Auto-reply email error (non-fatal):', mailErr.message);
      }

      res.status(201).json({ success: true, message: 'Message sent! We\'ll be in touch within 24–48 hours.' });
    } catch (err) {
      console.error('Contact inquiry error:', err);
      res.status(500).json({ success: false, message: 'Could not send your message. Please try again.' });
    }
  }
);

// ─── GET /contact — admin: list all inquiries ─────────────────────
router.get('/', ...adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('contact_inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, inquiries: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch inquiries' });
  }
});

// ─── POST /contact/broadcast — admin sends bulk email ─────────────
router.post('/broadcast', ...adminOnly,
  [
    body('subject').trim().isLength({ min: 3, max: 200 }),
    body('body').trim().isLength({ min: 20, max: 10000 }),
    body('audience').isIn(['all', 'requesters', 'taskers', 'specific']),
    body('user_ids').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { subject, body: emailBody, audience, user_ids } = req.body;

    // For a targeted send, require at least one valid user id
    if (audience === 'specific' && (!Array.isArray(user_ids) || user_ids.length === 0))
      return res.status(400).json({ success: false, message: 'Select at least one recipient for a specific send' });

    try {
      // Fetch target users
      let query = supabase.from('users').select('id, email, full_name, role').eq('is_active', true).eq('email_verified', true);
      if (audience === 'requesters') query = query.eq('role', 'requester');
      else if (audience === 'taskers') query = query.eq('role', 'tasker');
      else if (audience === 'specific') query = query.in('id', user_ids);
      else query = query.in('role', ['requester', 'tasker']);

      const { data: users, error } = await query;
      if (error) throw error;
      if (!users?.length) return res.status(400).json({ success: false, message: 'No matching verified users found for this selection' });

      // Build HTML email with inbox-delivery best practices
      const buildEmail = (recipientName) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>${subject}</title>
</head>
<body style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#f7f2f4;margin:0;padding:0;">
  <!--[if mso]><table width="600" align="center"><tr><td><![endif]-->
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #f0e8f5;">
    <div style="background:linear-gradient(135deg,#ff2d62 0%,#c41445 100%);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;font-family:'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-0.5px;">Taskeeu</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">Africa's Task Outsourcing Platform</p>
    </div>
    <div style="padding:36px 32px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
      <p style="color:#4b3040;font-size:15px;line-height:1.7;margin:0 0 16px;">Hi ${recipientName},</p>
      <div style="color:#1a0a10;font-size:15px;line-height:1.85;white-space:pre-wrap;">${emailBody}</div>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #fde0e8;">
        <p style="color:#9c6070;font-size:12px;line-height:1.7;margin:0;">
          You're receiving this because you have a Taskeeu account.<br/>
          <a href="${FRONTEND}" style="color:#ff2d62;text-decoration:none;font-weight:600;">Visit Taskeeu</a>
          &nbsp;·&nbsp;
          <a href="${FRONTEND}/unsubscribe" style="color:#9c6070;text-decoration:none;">Unsubscribe</a>
        </p>
      </div>
    </div>
    <div style="background:#fdf0f3;padding:18px 32px;text-align:center;color:#9c6070;font-size:11px;border-top:1px solid #fde0e8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
      © ${new Date().getFullYear()} Taskeeu Technologies Ltd. · Lagos, Nigeria
    </div>
  </div>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;

      // Create the broadcast record FIRST so we can tag every email with its
      // id — Resend webhooks use this tag to attribute opens/clicks back.
      const { data: broadcastRow } = await supabase.from('broadcast_emails').insert({
        sent_by: req.user.id,
        subject,
        body: emailBody,
        audience,
        recipient_count: 0,
        status: 'sending',
      }).select('id').maybeSingle();
      const broadcastId = broadcastRow?.id || null;

      // Send in batches of 50 (Resend batch limit)
      const BATCH_SIZE = 50;
      let sentCount = 0;
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        const emails = batch.map(u => ({
          from: FROM,
          to: u.email,
          subject,
          html: buildEmail(u.full_name?.split(' ')[0] || 'there'),
          headers: {
            // Inbox-delivery headers
            'X-Mailer': 'Taskeeu Platform',
            'X-Priority': '3',
            'Precedence': 'bulk',
            'List-Unsubscribe': `<${FRONTEND}/unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
          // The broadcast_id tag lets the Resend webhook match events back to
          // this specific broadcast for open/click analytics.
          tags: [
            { name: 'broadcast', value: audience },
            ...(broadcastId ? [{ name: 'broadcast_id', value: broadcastId }] : []),
          ],
        }));

        try {
          await resend.batch.send(emails);
          sentCount += batch.length;
        } catch (batchErr) {
          console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, batchErr.message);
          // Continue with next batch even if one fails
        }
      }

      // Finalise the broadcast record with the real count.
      if (broadcastId) {
        await supabase.from('broadcast_emails')
          .update({ recipient_count: sentCount, status: 'sent' })
          .eq('id', broadcastId);
      }

      res.json({
        success: true,
        message: `Broadcast sent to ${sentCount} user${sentCount !== 1 ? 's' : ''}`,
        sent: sentCount,
        total: users.length,
      });
    } catch (err) {
      console.error('Broadcast error:', err);
      res.status(500).json({ success: false, message: 'Broadcast failed. Please try again.' });
    }
  }
);

// ─── GET /contact/broadcast/history — list past broadcasts ────────
router.get('/broadcast/history', ...adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('broadcast_emails')
      .select('*, sent_by:users!sent_by(full_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ success: true, broadcasts: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch broadcast history' });
  }
});
// ─── POST /contact/:id/reply — admin replies to inquiry ──────────
router.post('/:id/reply', ...adminOnly,
  [body('reply').trim().isLength({ min: 5, max: 5000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    try {
      const { data: inquiry } = await supabase
        .from('contact_inquiries').select('*').eq('id', req.params.id).maybeSingle();
      if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

      const { reply } = req.body;

      // Send reply email to user
      await resend.emails.send({
        from: FROM,
        to: inquiry.email,
        subject: `Re: ${inquiry.subject} — Taskeeu`,
        headers: {
          'X-Priority': '1',
          'X-Mailer': 'Taskeeu Platform',
          'List-Unsubscribe': `<${FRONTEND}/unsubscribe>`,
        },
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f7f2f4;margin:0;padding:0;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#ff2d62,#c41445);padding:36px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;font-family:'Segoe UI',Arial,sans-serif;">Taskeeu</h1>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;font-family:'Segoe UI',Arial,sans-serif;">Africa's Task Outsourcing Platform</p>
  </div>
  <div style="padding:36px 32px;font-family:'Segoe UI',Arial,sans-serif;">
    <h2 style="color:#1a0a10;margin-top:0;font-size:20px;font-weight:800;">Hi ${inquiry.name},</h2>
    <p style="color:#4b3040;line-height:1.7;font-size:15px;">Thank you for reaching out to Taskeeu. Here is our response to your inquiry:</p>
    <div style="background:#f9f5ff;border-left:4px solid #ff2d62;padding:20px 24px;border-radius:8px;margin:20px 0;font-size:15px;color:#1a0a10;line-height:1.8;white-space:pre-wrap;">${reply}</div>
    <p style="color:#4b3040;line-height:1.7;font-size:15px;">If you have any further questions, please visit <a href="${FRONTEND}/contact" style="color:#ff2d62;font-weight:600;">taskeeu.com/contact</a> to reach us again.</p>
    <hr style="border:none;border-top:1px solid #fde0e8;margin:24px 0;"/>
    <p style="color:#9c6070;font-size:12px;line-height:1.6;">
      <strong>Your original message:</strong><br/>
      <em>${inquiry.subject}</em><br/>
      ${inquiry.message.substring(0, 200)}${inquiry.message.length > 200 ? '…' : ''}
    </p>
  </div>
  <div style="background:#fdf0f3;padding:20px 32px;text-align:center;color:#9c6070;font-size:12px;border-top:1px solid #fde0e8;font-family:'Segoe UI',Arial,sans-serif;">
    © ${new Date().getFullYear()} Taskeeu Technologies Ltd. · <a href="${FRONTEND}" style="color:#ff2d62;text-decoration:none;">taskeeu.com</a>
  </div>
</div>
</body></html>`,
      });

      // Update inquiry status
      await supabase.from('contact_inquiries').update({
        status: 'replied',
        admin_reply: reply,
        replied_at: new Date().toISOString(),
        replied_by: req.user.id,
        updated_at: new Date().toISOString(),
      }).eq('id', req.params.id);

      res.json({ success: true, message: 'Reply sent successfully' });
    } catch (err) {
      console.error('Contact reply error:', err);
      res.status(500).json({ success: false, message: 'Could not send reply. Please try again.' });
    }
  }
);

// ─── PUT /contact/:id/read — mark as read ─────────────────────────
router.put('/:id/read', ...adminOnly, async (req, res) => {
  try {
    await supabase.from('contact_inquiries')
      .update({ status: 'read', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Could not update status' });
  }
});


// ─── POST /contact/resend-webhook — receive email events from Resend ──
// Configure this URL in your Resend dashboard (Webhooks). Resend sends
// events like email.delivered, email.opened, email.clicked, email.bounced.
// We record them and, when the email carried a broadcast_id tag, attribute
// the event to that broadcast for open/click analytics.
router.post('/resend-webhook', async (req, res) => {
  try {
    const evt = req.body || {};
    const type = (evt.type || '').replace('email.', ''); // delivered | opened | clicked | bounced | complained | sent
    const data = evt.data || {};

    // Resend includes the tags we sent. Find our broadcast_id tag.
    let broadcastId = null;
    const tags = data.tags || {};
    if (Array.isArray(tags)) {
      const t = tags.find(x => x.name === 'broadcast_id');
      broadcastId = t?.value || null;
    } else if (tags && typeof tags === 'object') {
      broadcastId = tags.broadcast_id || null;
    }

    const email = Array.isArray(data.to) ? data.to[0] : data.to;

    await supabase.from('email_events').insert({
      broadcast_id: broadcastId,
      email: (email || '').slice(0, 200),
      event: type || 'unknown',
      resend_email_id: data.email_id || data.id || null,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Resend webhook error:', err.message);
    res.json({ success: true }); // always 200 so Resend doesn't retry-storm
  }
});

module.exports = router;
