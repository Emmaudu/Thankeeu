const bcrypt = require('bcryptjs');
const argon2  = require('argon2');
const hashPassword = (plain) => argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
const verifyPassword = async (plain, stored) => {
  if (!stored) return false; // no password set yet (invite not completed) — don't throw
  if (stored.startsWith('$argon2')) return argon2.verify(stored, plain);
  return require('bcryptjs').compare(plain, stored);
};
const rehashIfLegacy = async (id, plain, stored, table, supabase) => {
  if (!stored || stored.startsWith('$argon2')) return;
  try { await supabase.from(table).update({ password_hash: await hashPassword(plain) }).eq('id', id); } catch {}
};

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { getMemberOccasions } = require('../utils/occasionEngine');
const { logActivity } = require('../utils/activityLog');

const setCookie = (res, name, token, expiresIn = '7d') => {
  const maxAge = expiresIn.endsWith('d')
    ? parseInt(expiresIn) * 86400000
    : expiresIn.endsWith('h')
    ? parseInt(expiresIn) * 3600000
    : 7 * 86400000;
  res.cookie(name, token, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'none',        // required for cross-origin (Vercel ↔ Railway)
    maxAge,
    path:      '/',
  });
};
const clearCookie = (res, name) => res.clearCookie(name, { httpOnly: true, secure: true, sameSite: 'none', path: '/' });

const { sendEmail } = require('../utils/email');

// Department defaults
const DEFAULT_DEPARTMENTS = [
  // Tech / Fintech
  'Engineering','Frontend Development','Backend Development','Mobile Development',
  'DevOps / Infrastructure','Data Science','Product Management','UI/UX Design',
  'Quality Assurance','Cybersecurity','IT Support',
  // Business
  'Finance','Accounting','Audit','Treasury','Risk Management',
  'Human Resources','Legal','Compliance','Administration',
  'Marketing','Digital Marketing','Brand','Public Relations','Communications',
  'Sales','Business Development','Customer Success','Customer Service',
  'Operations','Supply Chain','Logistics','Procurement',
  'Strategy','Research & Development','Innovation',
  // Sector-specific
  'Oil & Gas Operations','Drilling','Exploration','Refinery',
  'Network Operations','Telecoms Engineering','Spectrum Management',
  'Retail','Merchandising','Store Operations','E-Commerce',
  'Agriculture','Agronomy','Farm Operations',
  'Healthcare','Clinical','Pharmacy','Nursing',
  'Media','Content','Editorial','Broadcasting',
  'Executive / C-Suite','Board',
];

const generateToken = (memberId, companyId) =>
  jwt.sign({ memberId, companyId, type: 'company_member' }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Extract domain from email
const getDomain = (email) => email.split('@')[1]?.toLowerCase();

// Validate member email matches company domain
const validateDomain = async (memberEmail, companyId) => {
  const { data: company } = await supabase.from('companies').select('email').eq('id', companyId).single();
  if (!company) return false;
  const companyDomain = getDomain(company.email);
  const memberDomain  = getDomain(memberEmail);
  return companyDomain && memberDomain && companyDomain === memberDomain;
};

// POST /api/members/signup
const memberSignup = async (req, res) => {
  try {
    const { company_code, first_name, last_name, email, password, role, department, profile_picture_url,
            gender, resumption_date, date_of_birth } = req.body;

    if (!company_code) return res.status(400).json({ error: 'Company code is required' });

    // Find company by code (we use company ID as the code)
    const { data: company } = await supabase.from('companies').select('id, name, email').eq('id', company_code).single();
    if (!company) return res.status(404).json({ error: 'Company not found. Check your company code.' });

    // Check if employee was pre-imported by HR (skip domain validation for pre-seeded members)
    const { data: preImported } = await supabase
      .from('company_members')
      .select('id, status')
      .eq('company_id', company.id)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    // If not pre-imported, do domain validation as fallback
    if (!preImported) {
      const domainOk = await validateDomain(email, company.id);
      if (!domainOk) {
        const companyDomain = getDomain(company.email);
        // Soft warning — allow if HR explicitly added them, block only unknown outsiders
        // We warn but still check whether company allows open join
        const { data: companySettings } = await supabase
          .from('companies').select('allow_any_domain').eq('id', company.id).maybeSingle();
        if (!companySettings?.allow_any_domain) {
          return res.status(400).json({
            error: `Your email must match your company domain (@${companyDomain}), or ask your HR to import your email first. Company code: ${company_code}`
          });
        }
      }
    }

    const password_hash = await hashPassword(password, 12);
    let member, memberError;

    // company_members is the single source of truth for occasion automation
    // (date_of_birth, resumption_date, gender). HR-entered data (via the
    // master template or HRIS) takes priority — if these fields are already
    // filled in on a pre-imported record, don't overwrite them with what the
    // employee enters at signup. Only fill in if currently empty.
    const fillGapSignup = (existingVal, newVal) => {
      const existingIsEmpty = existingVal === null || existingVal === undefined || existingVal === '';
      return existingIsEmpty ? (newVal || null) : existingVal;
    };

    if (preImported) {
      // Fetch current values so we can fill-gaps-only
      const { data: preImportedFull } = await supabase
        .from('company_members')
        .select('date_of_birth, resumption_date, gender')
        .eq('id', preImported.id).maybeSingle();

      const occasionFields = {
        gender:          fillGapSignup(preImportedFull?.gender,          gender),
        resumption_date: fillGapSignup(preImportedFull?.resumption_date, resumption_date),
        date_of_birth:   fillGapSignup(preImportedFull?.date_of_birth,   date_of_birth),
      };

      // Employee was pre-imported by HR — update their record with password + personal details
      if (preImported.status === 'approved') {
        // Already approved (imported + approved by HR), just set password
        const { data: updated, error } = await supabase
          .from('company_members')
          .update({ first_name, last_name, password_hash, department: department || undefined, profile_picture_url: profile_picture_url || null,
            ...occasionFields })
          .eq('id', preImported.id)
          .select('id, first_name, last_name, email, role, department, status, company_id')
          .single();
        member = updated; memberError = error;
      } else {
        // Pre-imported but not yet approved — update details, keep status as pending
        const { data: updated, error } = await supabase
          .from('company_members')
          .update({ first_name, last_name, password_hash, role, department: department || undefined, profile_picture_url: profile_picture_url || null, status: 'pending',
            ...occasionFields })
          .eq('id', preImported.id)
          .select('id, first_name, last_name, email, role, department, status, company_id')
          .single();
        member = updated; memberError = error;
      }
    } else {
      // New employee — check not already registered with a password
      const { data: existing } = await supabase.from('company_members').select('id, password_hash').eq('email', email.toLowerCase().trim()).eq('company_id', company.id).maybeSingle();
      if (existing?.password_hash) return res.status(400).json({ error: 'Email already registered in this company' });

      const { data: inserted, error } = await supabase
        .from('company_members')
        .insert({ company_id: company.id, first_name, last_name, email: email.toLowerCase().trim(), password_hash, role, department, profile_picture_url: profile_picture_url || null, status: 'pending',
          gender: gender || null, resumption_date: resumption_date || null, date_of_birth: date_of_birth || null })
        .select('id, first_name, last_name, email, role, department, status, company_id')
        .single();
      member = inserted; memberError = error;
    }
    if (memberError) throw memberError;

    // Notify HR + team leader
    const { data: hrCompany } = await supabase.from('companies').select('email, name, contact_person').eq('id', company.id).single();
    await sendEmail({ to: hrCompany.email, template: 'memberJoinRequest', data: {
      companyName: hrCompany.name, hrName: hrCompany.contact_person,
      memberName: `${first_name} ${last_name}`, memberEmail: email,
      role, department, companyId: company.id
    }});

    // If team member, also notify the department's team leader
    if (role === 'team_member') {
      const { data: leaders } = await supabase.from('company_members')
        .select('email, first_name')
        .eq('company_id', company.id)
        .eq('department', department)
        .eq('role', 'team_leader')
        .eq('status', 'approved');
      for (const leader of (leaders || [])) {
        await sendEmail({ to: leader.email, template: 'memberJoinRequest', data: {
          companyName: company.name, hrName: leader.first_name,
          memberName: `${first_name} ${last_name}`, memberEmail: email,
          role, department, companyId: company.id, isLeader: true
        }});
      }
    }

    res.status(201).json({ message: 'Account created. Awaiting approval.', member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

// POST /api/members/login
const memberLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const { data: member } = await supabase.from('company_members')
      .select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (!member) return res.status(401).json({ error: 'Invalid email or password' });
    if (member.status === 'pending') return res.status(403).json({ error: 'Your account is pending approval. You will be notified by email.' });
    if (member.status === 'rejected') return res.status(403).json({ error: 'Your account was not approved. Contact your HR.' });
    if (!member.password_hash) return res.status(403).json({ error: 'Please check your email for an invite link to set up your password first.' });

    const valid = await verifyPassword(password, member.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Get company info
    const { data: company } = await supabase.from('companies').select('id, name, email').eq('id', member.company_id).single();
    const token = generateToken(member.id, member.company_id);
    const { password_hash, reset_token, ...safeMember } = member;
    setCookie(res, 'tk_member', token);
    res.json({token, member: { ...safeMember, company } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /api/members/me
const getMemberMe = async (req, res) => {
  try {
    const { data: member, error } = await supabase
      .from('company_members')
      .select('id, first_name, last_name, email, role, department, status, profile_picture_url, company_id, created_at, is_core_team')
      .eq('id', req.member.id).single();
    if (error) throw error;
    const { data: company } = await supabase.from('companies').select('id, name, email, logo_url').eq('id', member.company_id).single();
    res.json({ ...member, company });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch member' });
  }
};

// GET /api/members/departments?companyId=xxx — for signup dropdown
const getDepartmentOptions = async (req, res) => {
  try {
    const { companyId } = req.query;
    let uploadedDepts = [];
    if (companyId) {
      // company_members is the single source of truth for HR-imported data
      // (master template + HRIS sync), so pull departments from there.
      const { data } = await supabase.from('company_members')
        .select('department').eq('company_id', companyId).eq('status', 'approved');
      uploadedDepts = [...new Set((data || []).map(d => d.department).filter(Boolean))];
    }
    const merged = [...new Set([...uploadedDepts, ...DEFAULT_DEPARTMENTS])].sort();
    res.json(merged);
  } catch (err) {
    res.json(DEFAULT_DEPARTMENTS);
  }
};

// GET /api/members/pending — HR sees all pending requests
const getPendingMembers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select('*')
      .eq('company_id', req.company.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// GET /api/members/dept-pending — team leader sees pending in their dept
const getDeptPendingMembers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .select('*')
      .eq('company_id', req.member.company_id)
      .eq('department', req.member.department)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending members' });
  }
};

// POST /api/members/:memberId/approve — HR or team leader approves
const approveMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const isHR = !!req.company;
    const approver = isHR ? req.company : req.member;

    const { data: member } = await supabase.from('company_members').select('*').eq('id', memberId).single();
    if (!member) return res.status(404).json({ error: 'Member not found' });

    // Team leader can only approve team members in their own department
    if (!isHR) {
      if (req.member.role !== 'team_leader') return res.status(403).json({ error: 'Only team leaders or HR can approve members' });
      if (member.department !== req.member.department) return res.status(403).json({ error: 'You can only approve members in your department' });
      if (member.role === 'team_leader') return res.status(403).json({ error: 'Only HR can approve team leaders' });
    }

    await supabase.from('company_members').update({
      status: 'approved',
      approved_by: approver.id,
      approved_at: new Date(),
    }).eq('id', memberId);

    const { data: company } = await supabase.from('companies').select('name').eq('id', member.company_id).single();
    await sendEmail({ to: member.email, template: 'memberApproved', data: {
      memberName: member.first_name,
      companyName: company.name,
      role: member.role,
      department: member.department,
    }});

    logActivity({
      company_id:  member.company_id,
      actor_id:    approver.id,
      actor_type:  isHR ? 'hr' : 'core_team',
      actor_name:  isHR ? (req.company.contact_person || req.company.name || company?.name || 'HR') : `${req.member.first_name} ${req.member.last_name}`,
      action:      'approved_member',
      entity_type: 'company_member',
      entity_id:   member.id,
      entity_name: `${member.first_name} ${member.last_name}`,
    }).catch(() => {});

    res.json({ message: `${member.first_name} has been approved` });
  } catch (err) {
    res.status(500).json({ error: 'Approval failed' });
  }
};

// POST /api/members/:memberId/reject
const rejectMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { reason } = req.body;
    const { data: member } = await supabase.from('company_members').select('*').eq('id', memberId).single();
    if (!member) return res.status(404).json({ error: 'Member not found' });

    await supabase.from('company_members').update({
      status: 'rejected', rejection_reason: reason || 'No reason provided'
    }).eq('id', memberId);

    await sendEmail({ to: member.email, template: 'memberRejected', data: {
      memberName: member.first_name, reason: reason || 'No reason provided'
    }});

    logActivity({
      company_id:  member.company_id,
      actor_id:    req.company?.id || req.member?.id,
      actor_type:  req.company ? 'hr' : 'core_team',
      actor_name:  req.company ? (req.company.contact_person || req.company.name || 'HR') : `${req.member.first_name} ${req.member.last_name}`,
      action:      'rejected_member',
      entity_type: 'company_member',
      entity_id:   member.id,
      entity_name: `${member.first_name} ${member.last_name}`,
      details:     { reason: reason || 'No reason provided' },
    }).catch(() => {});

    res.json({ message: 'Member rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Rejection failed' });
  }
};

// GET /api/members/dashboard — team leader / member dashboard data
const getMemberDashboard = async (req, res) => {
  try {
    const member = req.member;
    const isLeader = member.role === 'team_leader';

    // Get dept members — include all fields needed for occasion computation
    // (date_of_birth, resumption_date, gender, promotion_date, leaving_date).
    // company_members is the single source of truth for occasion automation.
    const { data: deptMembers } = await supabase
      .from('company_members')
      .select('id, first_name, last_name, email, role, department, status, profile_picture_url, date_of_birth, resumption_date, gender, promotion_date, leaving_date, job_title, phone')
      .eq('company_id', member.company_id)
      .eq('department', member.department)
      .eq('status', 'approved');

    // Get upcoming occasions for dept members — computed directly from
    // company_members columns (same logic the daily automation cron uses).
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();

    const { data: company } = await supabase
      .from('companies').select('country').eq('id', member.company_id).maybeSingle();

    const { data: ots } = await supabase
      .from('occasion_types')
      .select('name, label, icon')
      .eq('company_id', member.company_id)
      .eq('is_active', true);
    const otByName = Object.fromEntries((ots || []).map(o => [o.name, o]));

    const withDays = [];
    for (const m of (deptMembers || [])) {
      const occasions = getMemberOccasions(m, company || {}, year);
      for (const occ of occasions) {
        const ot = otByName[occ.occasionName];
        if (!ot) continue; // company doesn't have this occasion type configured/active

        const occDate = new Date(occ.occasionDate + 'T00:00:00');
        if (isNaN(occDate)) continue;
        const daysUntil = Math.round((occDate - today) / 86400000);
        if (daysUntil < 0 || daysUntil > 30) continue;

        withDays.push({
          first_name: m.first_name, last_name: m.last_name, department: m.department,
          occasion_date: occ.occasionDate, days_until: daysUntil,
          occasion_type: occ.occasionName,
          occasion_types: { name: ot.name, label: ot.label, icon: ot.icon },
        });
      }
    }
    withDays.sort((a, b) => a.days_until - b.days_until);

    // Cards involving dept members — filter for active cards for signing
    const { data: deptCards } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, occasion, status, total_collected, created_at, notification_scope, created_by_member_id')
      .eq('company_id', member.company_id)
      .in('status', ['active', 'sent'])
      .order('created_at', { ascending: false })
      .limit(10);

    // Cards created by THIS member (history)
    const { data: myCards } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, occasion, status, total_collected, created_at, messages(count)')
      .eq('created_by_member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Active dept/company cards pending the member's signature
    const activeDeptCards = (deptCards || []).filter(c => {
      if (c.status !== 'active') return false;
      if (c.notification_scope === 'company_wide') return true;
      // department cards — only show if same dept (already filtered by company, dept check via creator)
      return true;
    });

    // Pending approvals for team leader
    let pendingApprovals = [];
    if (isLeader) {
      const { data } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', member.company_id)
        .eq('department', member.department)
        .eq('status', 'pending');
      pendingApprovals = data || [];
    }

    res.json({
      member,
      dept_members: deptMembers || [],
      upcoming_occasions: withDays.slice(0, 10),
      recent_cards: activeDeptCards,
      my_created_cards: (myCards || []).map(card => ({
        ...card,
        signed_count: card.messages?.[0]?.count || 0,
        messages: undefined
      })),
      pending_approvals: pendingApprovals,
      stats: {
        dept_size: (deptMembers || []).length,
        upcoming_occasions: withDays.length,
        active_cards: activeDeptCards.filter(c => c.status === 'active').length,
        pending_approvals: pendingApprovals.length,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// POST /api/members/forgot-password
const memberForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { data: member } = await supabase.from('company_members').select('id, first_name').eq('email', (email || '').toLowerCase().trim()).maybeSingle();
    if (!member) return res.json({ message: 'If that email exists, a reset link has been sent' });

    const token = crypto.randomBytes(32).toString('hex');
    await supabase.from('company_members').update({
      reset_token: token, reset_token_expires: new Date(Date.now() + 3600000)
    }).eq('id', member.id);

    await sendEmail({ to: email, template: 'memberPasswordReset', data: { token, name: member.first_name } });
    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/members/reset-password
const memberResetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    if (!password || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Check reset_token first (from forgot-password flow, expires in 1hr)
    let member = null;
    let tokenType = null;

    const { data: byReset, error: resetErr } = await supabase
      .from('company_members')
      .select('id, reset_token_expires, status')
      .eq('reset_token', token)
      .maybeSingle();

    if (resetErr) console.error('memberResetPassword reset_token query error:', resetErr.message);

    if (byReset) {
      // Check expiry only for reset tokens
      if (new Date(byReset.reset_token_expires) < new Date()) {
        return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
      }
      member = byReset;
      tokenType = 'reset';
    } else {
      // Try invite_token (from HR import / bulk upload — never expires)
      const { data: byInvite, error: inviteErr } = await supabase
        .from('company_members')
        .select('id, status')
        .eq('invite_token', token)
        .maybeSingle();

      if (inviteErr) {
        console.error('memberResetPassword invite_token query error:', inviteErr.message);
        // If the column doesn't exist, tell the user clearly
        if (/column|invite_token|does not exist/i.test(inviteErr.message || '')) {
          return res.status(500).json({ error: 'Account setup incomplete. Please ask your HR admin to contact support@thankeeu.com.' });
        }
      }

      if (byInvite) {
        member = byInvite;
        tokenType = 'invite';
      }
    }

    if (!member) {
      console.error('memberResetPassword: no member found for token (first 8 chars):', token.slice(0, 8));
      return res.status(400).json({ error: 'Invalid reset link. It may have already been used. Please request a new one.' });
    }

    const password_hash = await hashPassword(password, 12);

    if (tokenType === 'reset') {
      const { error: upErr } = await supabase.from('company_members')
        .update({ password_hash, reset_token: null, reset_token_expires: null, status: 'approved', invite_accepted: true })
        .eq('id', member.id);
      if (upErr) { console.error('memberResetPassword update error (reset):', upErr.message); throw upErr; }
    } else {
      // invite_token — clear it, mark approved, mark invite accepted
      const { error: upErr } = await supabase.from('company_members')
        .update({ password_hash, invite_token: null, status: 'approved', invite_accepted: true })
        .eq('id', member.id);
      if (upErr) { console.error('memberResetPassword update error (invite):', upErr.message); throw upErr; }
    }

    res.json({ message: 'Password set successfully! You can now sign in.' });
  } catch (err) {
    console.error('memberResetPassword error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// PUT /api/members/profile — update member profile
const updateMemberProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, profile_picture_url, username, job_title, bio, date_of_birth } = req.body;

    // Validate username uniqueness if provided
    if (username && username.trim()) {
      const { data: existing } = await supabase
        .from('company_members')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .neq('id', req.member.id)
        .maybeSingle();
      if (existing) return res.status(400).json({ error: 'Username already taken. Choose another.' });
    }

    // Build update — only include defined fields
    const updateData = { updated_at: new Date() };
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name  !== undefined) updateData.last_name  = last_name;
    if (phone      !== undefined) updateData.phone      = phone;
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url;
    if (username !== undefined) updateData.username = username?.toLowerCase().trim() || null;

    // These columns may not exist yet — try with them, fall back without if schema error
    const extendedData = { ...updateData };
    if (job_title    !== undefined) extendedData.job_title    = job_title;
    if (bio          !== undefined) extendedData.bio          = bio;
    if (date_of_birth !== undefined) extendedData.date_of_birth = date_of_birth || null;

    let data, error;

    // Try with extended fields first
    ({ data, error } = await supabase
      .from('company_members')
      .update(extendedData)
      .eq('id', req.member.id)
      .select('id, first_name, last_name, email, role, department, status, profile_picture_url, username, phone, company_id')
      .single());

    // If schema error on extended fields, retry with base fields only
    if (error && (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('schema cache'))) {
      console.warn('Extended profile columns not yet in schema, falling back to base fields:', error.message);
      ({ data, error } = await supabase
        .from('company_members')
        .update(updateData)
        .eq('id', req.member.id)
        .select('id, first_name, last_name, email, role, department, status, profile_picture_url, username, phone, company_id')
        .single());
    }

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile. ' + (err.message || '') });
  }
};

// PUT /api/members/password — change member password
const changeMemberPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords are required' });
    if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const { data: member } = await supabase
      .from('company_members')
      .select('password_hash')
      .eq('id', req.member.id)
      .single();

    const valid = await verifyPassword(current_password, member.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const password_hash = await hashPassword(new_password, 12);
    await supabase.from('company_members').update({ password_hash }).eq('id', req.member.id);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};


// ────────────────────────────────────────────────────────────────────
// MEMBER DASHBOARD EXTENDED FEATURES
// ────────────────────────────────────────────────────────────────────

// GET /api/members/my-cards — cards created by this member
const getMemberMyCards = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, occasion, status, total_collected, created_at, background_color, messages(count)')
      .eq('created_by_member_id', req.member.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(c => ({ ...c, signed_count: c.messages?.[0]?.count || 0, messages: undefined })));
  } catch (err) { res.status(500).json({ error: 'Failed to load cards' }); }
};

// GET /api/members/pending-to-sign — active dept/company cards not yet signed by this member
const getMemberPendingToSign = async (req, res) => {
  try {
    const member = req.member;
    // Get all active cards for this company
    const { data: cards } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, occasion, status, total_collected, created_at, background_color, deadline')
      .eq('company_id', member.company_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!cards?.length) return res.json([]);

    // Check which ones this member has already signed (by email)
    const { data: signed } = await supabase
      .from('messages')
      .select('card_id')
      .eq('author_email', member.email)
      .in('card_id', cards.map(c => c.id));

    const signedCardIds = new Set((signed || []).map(s => s.card_id));
    const pending = cards.filter(c => !signedCardIds.has(c.id));
    res.json(pending);
  } catch (err) { res.status(500).json({ error: 'Failed to load pending cards' }); }
};

// GET /api/members/received — cards transferred to this member
const getMemberReceivedCards = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('member_received_cards')
      .select('id, transferred_at, opened_at, note, card:cards(id,slug,title,recipient_name,occasion,status,total_collected,created_at,background_color,messages(count))')
      .eq('recipient_member_id', req.member.id)
      .order('transferred_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({
      ...r,
      card: r.card ? { ...r.card, signed_count: r.card.messages?.[0]?.count || 0, messages: undefined } : null
    })));
  } catch (err) { res.status(500).json({ error: 'Failed to load received cards' }); }
};

// POST /api/members/transfer-card — transfer a card to another team member
const transferCardToMember = async (req, res) => {
  try {
    const { card_slug, recipient_username, note } = req.body;
    if (!card_slug || !recipient_username) return res.status(400).json({ error: 'card_slug and recipient_username are required' });

    // Find recipient
    const { data: recipient } = await supabase
      .from('company_members')
      .select('id, first_name, last_name, email, company_id')
      .eq('username', recipient_username.toLowerCase().trim())
      .maybeSingle();
    if (!recipient) return res.status(404).json({ error: `No member found with username @${recipient_username}` });
    if (recipient.company_id !== req.member.company_id) return res.status(403).json({ error: 'Recipient must be in the same company' });

    // Find card
    const { data: card } = await supabase
      .from('cards')
      .select('id, title, recipient_name, created_by_member_id, company_id')
      .eq('slug', card_slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.company_id !== req.member.company_id) return res.status(403).json({ error: 'Card is not in your company' });

    // Upsert received card record
    const { error } = await supabase
      .from('member_received_cards')
      .upsert({
        card_id: card.id,
        recipient_member_id: recipient.id,
        transferred_by: req.member.id,
        note: note || null,
        transferred_at: new Date(),
      }, { onConflict: 'card_id,recipient_member_id' });
    if (error) throw error;

    res.json({ message: `Card transferred to @${recipient_username} (${recipient.first_name} ${recipient.last_name}) ✓` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to transfer card' });
  }
};

// GET /api/members/reminders — personal reminders for this member
const getMemberReminders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('member_reminders')
      .select('*')
      .eq('member_id', req.member.id)
      .order('occasion_date', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to load reminders' }); }
};

// POST /api/members/reminders — create reminder
const createMemberReminder = async (req, res) => {
  try {
    const { recipient_name, recipient_email, occasion, occasion_date, frequency, notes } = req.body;
    if (!recipient_name || !occasion || !occasion_date) return res.status(400).json({ error: 'Name, occasion, and date are required' });
    const { data, error } = await supabase
      .from('member_reminders')
      .insert({ member_id: req.member.id, recipient_name, recipient_email, occasion, occasion_date, frequency: frequency || 'yearly', notes })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to create reminder' }); }
};

// DELETE /api/members/reminders/:id
const deleteMemberReminder = async (req, res) => {
  try {
    await supabase.from('member_reminders').delete().eq('id', req.params.id).eq('member_id', req.member.id);
    res.json({ message: 'Reminder deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete reminder' }); }
};

// GET /api/members/finances — financial history for this member
const getMemberFinances = async (req, res) => {
  try {
    // Contributions this member made as a signer
    const { data: contributions } = await supabase
      .from('contributions')
      .select('id, amount, contributor_name, contributor_email, created_at, card_id')
      .eq('contributor_email', req.member.email)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(50);

    // Cards created by this member — try created_by_member_id, fall back to empty
    let myCardWallets = [];
    try {
      const { data: memberCards, error: colErr } = await supabase
        .from('cards')
        .select('id, slug, title, recipient_name, occasion, total_collected, status, created_at')
        .eq('created_by_member_id', req.member.id)
        .gt('total_collected', 0)
        .order('created_at', { ascending: false });

      if (!colErr) myCardWallets = memberCards || [];
    } catch (e) {
      // Column doesn't exist yet — skip silently
    }

    // Enrich contributions with card titles
    let enrichedContributions = contributions || [];
    if (enrichedContributions.length > 0) {
      const cardIds = [...new Set(enrichedContributions.map(c => c.card_id).filter(Boolean))];
      if (cardIds.length > 0) {
        const { data: cards } = await supabase
          .from('cards').select('id, title, recipient_name, occasion').in('id', cardIds);
        const cardMap = Object.fromEntries((cards || []).map(c => [c.id, c]));
        enrichedContributions = enrichedContributions.map(c => ({
          ...c, card: cardMap[c.card_id] || null,
        }));
      }
    }

    const totalContributed = enrichedContributions.reduce((s, c) => s + (c.amount || 0), 0);
    const totalCollected   = myCardWallets.reduce((s, c) => s + (c.total_collected || 0), 0);

    res.json({
      contributions:     enrichedContributions,
      my_card_wallets:   myCardWallets,
      total_contributed: totalContributed,
      total_collected:   totalCollected,
    });
  } catch (err) {
    console.error('getMemberFinances error:', err);
    res.status(500).json({ error: 'Failed to load financial history' });
  }
};

module.exports = {
  DEFAULT_DEPARTMENTS,
  memberSignup, memberLogin, getMemberMe, getDepartmentOptions,
  getPendingMembers, getDeptPendingMembers,
  approveMember, rejectMember,
  getMemberDashboard,
  memberForgotPassword, memberResetPassword,
  updateMemberProfile, changeMemberPassword,
  getMemberMyCards, getMemberPendingToSign, getMemberReceivedCards,
  getMemberFinances,
  transferCardToMember,
  getMemberReminders, createMemberReminder, deleteMemberReminder,
};

// GET /api/members/received-cards
