const supabase  = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const { logActivity } = require('../utils/activityLog');
const crypto    = require('crypto');
const bcrypt    = require('bcryptjs');
const argon2    = require('argon2');
const hashPassword = (plain) => argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
const verifyPassword = async (plain, stored) => {
  if (stored && stored.startsWith('$argon2')) return argon2.verify(stored, plain);
  return bcrypt.compare(plain, stored);
};

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

    // Also create/update company_member account so they can sign in. If
    // they're already an active member with a password set, do NOT
    // overwrite password_hash/invite_token — that would silently lock them
    // out of their existing account until they used a new invite link.
    const { data: existingMember } = await supabase.from('company_members')
      .select('password_hash').eq('company_id', req.company.id).eq('email', cleanEmail).maybeSingle();
    const memberNeedsInvite = !existingMember?.password_hash;
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await hashPassword(tempPassword);
    const nameParts = (full_name || email.split('@')[0]).split(' ');

    await supabase.from('company_members').upsert({
      company_id: req.company.id,
      email: cleanEmail,
      first_name: nameParts[0] || '',
      last_name:  nameParts.slice(1).join(' ') || '',
      role: 'team_leader',  // Core team always get team_leader role
      status: 'approved',
      job_title: title || null,
      is_core_team: true,       // Grants switching access to HR dashboard
      ...(memberNeedsInvite && { password_hash: passwordHash, invite_token: inviteToken }),
    }, { onConflict: 'company_id,email' });

    // Send invite email with set-password link
    const frontendUrl = (() => { let s=(process.env.FRONTEND_URL||'').trim(); if(s.includes('=')&&!s.startsWith('http'))s=s.slice(s.indexOf('=')+1).trim(); return s.startsWith('http')?s.replace(/\/$/,''):'https://thankeeu.com'; })();
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
            This link does not expire. If you didn't expect this invitation, you can safely ignore it.
          </p>
          <p style="color:#ccc;font-size:11px;text-align:center;">
            Powered by <a href="${frontendUrl}" style="color:#7C3AED;">Thankeeu</a> — Group Cards &amp; Gifts
          </p>
        </div>
      `
    });

    res.status(201).json({ message: `Invitation sent to ${cleanEmail}`, invite });

    logActivity({
      company_id:  req.company.id,
      actor_id:    req.coreTeamMember?.id || req.company.id,
      actor_type:  req.actorType || 'hr',
      actor_name:  req.actorName || req.company.name || 'HR',
      action:      'invited_core_team_member',
      entity_type: 'core_team',
      entity_id:   invite?.id,
      entity_name: full_name || cleanEmail,
      details:     { permission_level },
    }).catch(() => {});
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

    logActivity({
      company_id:  req.company.id,
      actor_id:    req.coreTeamMember?.id || req.company.id,
      actor_type:  req.actorType || 'hr',
      actor_name:  req.actorName || req.company.name || 'HR',
      action:      'invited_core_team_member',
      entity_type: 'core_team',
      entity_name: 'Bulk invite',
      details:     { sent: results.sent, failed: results.failed },
    }).catch(() => {});
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
  const passHash    = await hashPassword(tempPass);
  const nameParts   = (full_name || '').split(' ');

  await supabase.from('company_core_team').upsert({
    company_id: company.id, email: cleanEmail,
    full_name, title, permission_level, invite_token: inviteToken,
  }, { onConflict: 'company_id,email' });

  // Don't overwrite password_hash/invite_token if this person is already an
  // active member with a password set — same protection as inviteCoreMember.
  const { data: existingMember } = await supabase.from('company_members')
    .select('password_hash').eq('company_id', company.id).eq('email', cleanEmail).maybeSingle();
  const memberNeedsInvite = !existingMember?.password_hash;

  await supabase.from('company_members').upsert({
    company_id: company.id, email: cleanEmail,
    first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '',
    role: 'team_leader',
    status: 'approved', job_title: title || null,
    is_core_team: true,
    ...(memberNeedsInvite && { password_hash: passHash, invite_token: inviteToken }),
  }, { onConflict: 'company_id,email' });

  const frontendUrl = (() => { let s=(process.env.FRONTEND_URL||'').trim(); if(s.includes('=')&&!s.startsWith('http'))s=s.slice(s.indexOf('=')+1).trim(); return s.startsWith('http')?s.replace(/\/$/,''):'https://thankeeu.com'; })();
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
      <p style="color:#aaa;font-size:12px;">This link does not expire.</p>
    </div>`
  });
};

// DELETE /api/company/core-team/:id
const removeCoreMember = async (req, res) => {
  try {
    const { data: removed } = await supabase.from('company_core_team')
      .select('full_name, email').eq('id', req.params.id).eq('company_id', req.company.id).maybeSingle();

    await supabase.from('company_core_team').delete().eq('id', req.params.id).eq('company_id', req.company.id);

    // IMPORTANT: get-company-access (the "Switch to HR View" flow) checks
    // company_members.is_core_team, not the company_core_team table. Without
    // resetting this flag, a removed core team member would retain
    // permanent access to the HR dashboard via that endpoint.
    if (removed?.email) {
      await supabase.from('company_members')
        .update({ is_core_team: false })
        .eq('company_id', req.company.id)
        .eq('email', removed.email);
    }

    logActivity({
      company_id:  req.company.id,
      actor_id:    req.coreTeamMember?.id || req.company.id,
      actor_type:  req.actorType || 'hr',
      actor_name:  req.actorName || req.company.name || 'HR',
      action:      'removed_core_team_member',
      entity_type: 'core_team',
      entity_id:   req.params.id,
      entity_name: removed?.full_name || removed?.email || 'Core team member',
    }).catch(() => {});

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
