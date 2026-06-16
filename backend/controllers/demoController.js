// controllers/demoController.js
'use strict';
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

// POST /api/demo/request — public, no auth needed
const submitDemoRequest = async (req, res) => {
  try {
    const { company_name, contact_name, email, phone, team_size, message } = req.body;

    if (!company_name?.trim() || !contact_name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Company name, contact name and email are required' });
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) return res.status(400).json({ error: 'Invalid email address' });

    const { data: demo, error } = await supabase.from('demo_requests').insert({
      company_name: company_name.trim(),
      contact_name: contact_name.trim(),
      email:        email.trim().toLowerCase(),
      phone:        phone?.trim() || null,
      team_size:    team_size || null,
      message:      message?.trim() || null,
      status:       'new',
    }).select().maybeSingle();

    if (error) throw error;

    // Notify admin
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || 'support@thankeeu.com',
      template: 'demoRequest',
      data: { company_name, contact_name, email, phone, team_size, message, demoId: demo.id },
    }).catch(() => {}); // don't fail if email fails

    // Confirm to requester
    await sendEmail({
      to: email,
      template: 'demoConfirm',
      data: { contact_name, company_name },
    }).catch(() => {});

    res.status(201).json({ message: 'Demo request received! Our team will be in touch within 24 hours.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit request. Please try again.' });
  }
};

// GET /api/demo/requests — admin only
const getDemoRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('demo_requests').select('*').order('created_at', { ascending: false });
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch demo requests' });
  }
};

// PATCH /api/demo/requests/:id — admin marks status
const updateDemoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;
    const validStatuses = ['new', 'contacted', 'scheduled', 'converted', 'declined'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await supabase.from('demo_requests').update({ status, admin_note, updated_at: new Date() }).eq('id', id);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
};

module.exports = { submitDemoRequest, getDemoRequests, updateDemoStatus };
