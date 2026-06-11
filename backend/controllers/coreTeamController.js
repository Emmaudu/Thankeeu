const supabase  = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const crypto    = require('crypto');
const bcrypt    = require('bcryptjs');

// GET /api/company/core-team
const getCoreTeam = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('company_core_team')
      .select('id, email, full_name, title, permission_level, include_in_celebrations, invite_accepted, invited_at, accepted_at')
      .eq('company_id', req.company.id)
      .order('invited_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/company/core-team/invite — invite one by email
const inviteCoreMember = async (req, res) => {
  try {
    const { email, full_name, title, permission_level = 'medium', include_in_celebrations = true } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const inviteToken = crypto.randomBytes(32).toString('hex');

    const { data: existing } = await supabase
      .from('company_core_team')
      .select('id')
      .eq('company_id', req.company.id)
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) return res.status(409).json({ error: 'This person is already in your core team' });

    // Create core team record
    const { data: invite, error } = await supabase
      .from('company_core_team')
      .insert({
        company_id: req.company.id, email: cleanEmail,
        full_name, title, permission_level, include_in_celebrations, invite_token: inviteToken,
      })
      .select().single();
    if (error) throw error;

    // Also create company_member account so they can sign in
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await hashPassword(tempPassword, 12);
    const nameParts = (full_name || email.split('@')[0]).split(' ');

    await supabase.from('company_members').upsert({
      company_id: req.company.id,
      email: cleanEmail,
      first_name: nameParts[0] || '',
      last_name:  nameParts.slice(1).join(' ') || '',
      role: 'team_leader',  // Core team always get team_leader role
      status: 'approved',
      job_title: title || null,
      password_hash: passwordHash,
      is_core_team: true,       // Grants switching access to HR dashboard
      invite_token: inviteToken,
    }, { onConflict: 'company_id,email' });

    // Send invite email with set-password link
    const frontendUrl = (process.env.FRONTEND_URL || 'https://thankeeu.com').replace(/\/$/, '');
    const setPasswordLink = `${frontendUrl}/member/reset-password?token=${inviteToken}&email=${encodeURIComponent(cleanEmail)}`;

    const companyName = req.company.name || 'Your company';
    const inviterName = req.company.contact_person || companyName;

    await sendEmail({
      to: cleanEmail,
      subject: `${inviterName} invited you to join ${companyName} on Thankeeu 🎉`,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#A855F7,#7C3AED);font-size:26px;margin-bottom:12px;">💌</div>
            <h2 style="color:#1A1035;margin:0;font-size:22px;font-weight:800;">You're invited to ${companyName}'s team!</h2>
            <p style="color:#888;margin:8px 0 0;font-size:14px;">${inviterName} has added you as ${title || 'a team member'}</p>
          </div>

          <div style="background:#F5F3FF;border-radius:16px;padding:20px 24px;margin:20px 0;">
            <p style="color:#5B4BDF;font-size:14px;margin:0 0 8px;font-weight:700;">Your access level: <span style="text-transform:capitalize">${permission_level}</span></p>
            <p style="color:#6B678A;font-size:13px;margin:0;line-height:1.6;">
              ${permission_level === 'full' ? 'You have full access to manage occasions, team members, and company settings.'
              : permission_level === 'medium' ? 'You can manage occasions and view team data.'
              : permission_level === 'limited' ? 'You can view team occasions and contribute to celebrations.'
              : 'You have been added to the team.'}
            </p>
          </div>

          <div style="text-align:center;margin:28px 0 20px;">
            <a href="${setPasswordLink}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6C5CE7);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
              Set your password & join 🚀
            </a>
          </div>

          <p style="color:#aaa;font-size:12px;text-align:center;margin-top:16px;">
            This link expires in 7 days. If you didn't expect this invitation, you can safely ignore it.
          </p>
          <p style="color:#ccc;font-size:11px;text-align:center;">
            Powered by <a href="${frontendUrl}" style="color:#7C3AED;">Thankeeu</a> — Group Cards &amp; Gifts
          </p>
        </div>
      `
    });

    res.status(201).json({ message: `Invitation sent to ${cleanEmail}`, invite });
  } catch (err) {
    console.error('inviteCoreMember error:', err);
    res.status(500).json({ error: err.message || 'Failed to send invitation' });
  }
};

// POST /api/company/core-team/bulk-invite — invite multiple from CSV
const bulkInviteCoreTeam = async (req, res) => {
  try {
    const { members } = req.body;
    if (!Array.isArray(members) || !members.length)
      return res.status(400).json({ error: 'No members provided' });

    const results = { sent: 0, failed: 0, errors: [] };
    for (const m of members) {
      if (!m.email) { results.failed++; results.errors.push('Missing email'); continue; }
      try {
        await inviteCoreMemberInternally(req.company, m);
        results.sent++;
      } catch (e) {
        results.failed++;
        results.errors.push(`${m.email}: ${e.message}`);
      }
    }
    res.json({ message: `${results.sent} invitation${results.sent !== 1 ? 's' : ''} sent`, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Internal helper for bulk
const inviteCoreMemberInternally = async (company, memberData) => {
  const { email, full_name, title, permission_level = 'medium' } = memberData;
  const cleanEmail  = email.trim().toLowerCase();
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const tempPass    = crypto.randomBytes(8).toString('hex');
  const passHash    = await hashPassword(tempPass, 12);
  const nameParts   = (full_name || '').split(' ');

  await supabase.from('company_core_team').upsert({
    company_id: company.id, email: cleanEmail,
    full_name, title, permission_level, invite_token: inviteToken,
  }, { onConflict: 'company_id,email' });

  await supabase.from('company_members').upsert({
    company_id: company.id, email: cleanEmail,
    first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '',
    role: permission_level === 'full' ? 'leader' : 'member',
    status: 'approved', job_title: title || null, password_hash: passHash,
    role: 'team_leader', is_core_team: true, invite_token: inviteToken,
  }, { onConflict: 'company_id,email' });

  const frontendUrl = (process.env.FRONTEND_URL || 'https://thankeeu.com').replace(/\/$/, '');
  const link = `${frontendUrl}/member/reset-password?token=${inviteToken}&email=${encodeURIComponent(cleanEmail)}`;

  await sendEmail({
    to: cleanEmail,
    subject: `${company.contact_person || company.name} invited you to join ${company.name} on Thankeeu 🎉`,
    html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;text-align:center;">
      <h2 style="color:#1A1035;">You're invited to ${company.name}'s team! 🎉</h2>
      <p style="color:#666;">Hello ${full_name || 'there'}, you have been added as <strong>${title || permission_level + ' access'}</strong>.</p>
      <a href="${link}" style="display:inline-block;background:#7C3AED;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;margin:20px 0;">
        Set your password & join 🚀
      </a>
      <p style="color:#aaa;font-size:12px;">This link expires in 7 days.</p>
    </div>`
  });
};

// DELETE /api/company/core-team/:id
const removeCoreMember = async (req, res) => {
  try {
    await supabase.from('company_core_team').delete().eq('id', req.params.id).eq('company_id', req.company.id);
    res.json({ message: 'Removed from core team' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PATCH /api/company/core-team/:id
const updateCoreMember = async (req, res) => {
  try {
    const { permission_level, include_in_celebrations, title } = req.body;
    const updates = {};
    if (permission_level) updates.permission_level = permission_level;
    if (include_in_celebrations !== undefined) updates.include_in_celebrations = include_in_celebrations;
    if (title !== undefined) updates.title = title;
    const { data, error } = await supabase.from('company_core_team')
      .update(updates)
      .eq('id', req.params.id)
      .eq('company_id', req.company.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getCoreTeam, inviteCoreMember, bulkInviteCoreTeam, removeCoreMember, updateCoreMember };
