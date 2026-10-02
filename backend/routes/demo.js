const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../utils/supabase');
const { authenticate, requireRole } = require('../middleware/auth');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const FROM = `Taskeeu Teams <${process.env.EMAIL_FROM || 'teams@taskeeu.com'}>`;

// ── POST /demo/request — public, submit book-a-demo form ──────────
router.post('/request',
  [
    body('company_name').trim().isLength({ min: 2 }).withMessage('Company name required'),
    body('contact_name').trim().isLength({ min: 2 }).withMessage('Contact name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').trim().isLength({ min: 7 }).withMessage('Phone number required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg });

    const { company_name, contact_name, email, phone, company_size, industry, message } = req.body;

    try {
      // Store in DB
      const { data: demo, error } = await supabase
        .from('demo_requests')
        .insert({
          company_name, contact_name, email, phone,
          company_size: company_size || null,
          industry: industry || null,
          message: message || null,
          status: 'new',
        })
        .select()
        .maybeSingle();

      if (error) {
        // Table might not exist yet — still return success
        console.warn('Demo request DB error (non-fatal):', error.message);
      }

      // Email to admin
      await resend.emails.send({
        from: FROM,
        to: process.env.ADMIN_EMAIL || 'admin@taskeeu.com',
        subject: `📩 New Demo Request — ${company_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
            <h2 style="color:#00C37E;margin-top:0">New Taskeeu for Teams Demo Request</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Company</td><td style="padding:8px 0;font-weight:600">${company_name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Contact</td><td style="padding:8px 0;font-weight:600">${contact_name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#00C37E">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Phone</td><td style="padding:8px 0">${phone}</td></tr>
              ${company_size ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Size</td><td style="padding:8px 0">${company_size}</td></tr>` : ''}
              ${industry ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Industry</td><td style="padding:8px 0">${industry}</td></tr>` : ''}
            </table>
            ${message ? `<div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:8px;font-size:14px;color:#374151">${message}</div>` : ''}
            <a href="${process.env.FRONTEND_URL}/admin" style="display:inline-block;margin-top:20px;background:#00C37E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View in Admin Dashboard →</a>
          </div>`,
      }).catch(err => console.error(`❌ Demo email failed:`, err?.message));

      // Confirmation email to requester
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `✅ Demo Request Received — Taskeeu for Teams`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
            <h2 style="color:#00C37E;margin-top:0">We received your demo request! 🎉</h2>
            <p style="color:#374151">Hi ${contact_name},</p>
            <p style="color:#374151">Thank you for your interest in <strong>Taskeeu for Teams</strong>. Our team will reach out to you within <strong>24 hours</strong> to schedule your demo.</p>
            <div style="background:#f0fff8;border-left:4px solid #00C37E;padding:16px;border-radius:4px;margin:16px 0">
              <p style="margin:0;color:#065f46;font-size:14px"><strong>Company:</strong> ${company_name}</p>
              <p style="margin:4px 0 0;color:#065f46;font-size:14px"><strong>We'll contact:</strong> ${email} / ${phone}</p>
            </div>
            <p style="color:#6b7280;font-size:14px">While you wait, explore <a href="${process.env.FRONTEND_URL}/teams" style="color:#00C37E">Taskeeu for Teams</a> to learn more about our platform.</p>
          </div>`,
      }).catch(err => console.error(`❌ Demo email failed:`, err?.message));

      // In-app notification for admin
      const { data: admin } = await supabase
        .from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
      if (admin) {
        (async () => {
          try {
            await supabase.from('notifications').insert({
            user_id: admin.id,
            type: 'demo_request',
            title: `📩 New Demo Request: ${company_name}`,
            message: `${contact_name} (${email}) from ${company_name} wants a demo.`,
            data: { company_name, email, phone },
            action_url: '/admin?tab=demo-requests',
            });
          } catch (_) {}
        })();
      }

      res.status(201).json({
        success: true,
        message: 'Demo request submitted! We will contact you within 24 hours.',
      });
    } catch (err) {
      console.error('Demo request error:', err);
      res.status(500).json({ success: false, message: 'Failed to submit request. Please try again.' });
    }
  }
);

// ── GET /demo/requests — admin view all demo requests ─────────────
router.get('/requests', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data: demos, error } = await supabase
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet
      return res.json({ success: true, demos: [] });
    }

    res.json({ success: true, demos: demos || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ── PUT /demo/requests/:id — admin updates demo status ────────────
router.put('/requests/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    await supabase
      .from('demo_requests')
      .update({ status, admin_notes: notes })
      .eq('id', req.params.id);

    res.json({ success: true, message: 'Updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
