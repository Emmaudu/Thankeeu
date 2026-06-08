const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
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
    const { company_code, first_name, last_name, email, password, role, department, profile_picture_url } = req.body;

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

    const password_hash = await bcrypt.hash(password, 12);
    let member, memberError;

    if (preImported) {
      // Employee was pre-imported by HR — update their record with password + personal details
      if (preImported.status === 'approved') {
        // Already approved (imported + approved by HR), just set password
        const { data: updated, error } = await supabase
          .from('company_members')
          .update({ first_name, last_name, password_hash, department: department || undefined, profile_picture_url: profile_picture_url || null })
          .eq('id', preImported.id)
          .select('id, first_name, last_name, email, role, department, status, company_id')
          .single();
        member = updated; memberError = error;
      } else {
        // Pre-imported but not yet approved — update details, keep status as pending
        const { data: updated, error } = await supabase
          .from('company_members')
          .update({ first_name, last_name, password_hash, role, department: department || undefined, profile_picture_url: profile_picture_url || null, status: 'pending' })
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
        .insert({ company_id: company.id, first_name, last_name, email: email.toLowerCase().trim(), password_hash, role, department, profile_picture_url: profile_picture_url || null, status: 'pending' })
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
    const { data: member } = await supabase.from('company_members').select('*').eq('email', email).single();
    if (!member) return res.status(401).json({ error: 'Invalid email or password' });
    if (member.status === 'pending') return res.status(403).json({ error: 'Your account is pending approval. You will be notified by email.' });
    if (member.status === 'rejected') return res.status(403).json({ error: 'Your account was not approved. Contact your HR.' });

    const valid = await bcrypt.compare(password, member.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Get company info
    const { data: company } = await supabase.from('companies').select('id, name, email').eq('id', member.company_id).single();
    const token = generateToken(member.id, member.company_id);
    const { password_hash, reset_token, ...safeMember } = member;
    res.json({ token, member: { ...safeMember, company } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /api/members/me
const getMemberMe = async (req, res) => {
  try {
    const { data: member, error } = await supabase
      .from('company_members')
      .select('id, first_name, last_name, email, role, department, status, profile_picture_url, company_id, created_at')
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
      const { data } = await supabase.from('occasion_members').select('department').eq('company_id', companyId).eq('is_active', true);
      uploadedDepts = [...new Set((data || []).map(d => d.department))];
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

    // Get dept members
    const { data: deptMembers } = await supabase
      .from('company_members')
      .select('id, first_name, last_name, email, role, department, status, profile_picture_url')
      .eq('company_id', member.company_id)
      .eq('department', member.department)
      .eq('status', 'approved');

    // Get upcoming birthdays in dept from occasion_members
    const today = new Date();
    const { data: upcoming } = await supabase
      .from('occasion_members')
      .select('*, occasion_types(name, label, icon)')
      .eq('company_id', member.company_id)
      .eq('department', member.department)
      .eq('is_active', true);

    const withDays = (upcoming || []).map(m => {
      const bd = new Date(m.occasion_date);
      const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      return { ...m, days_until: Math.ceil((next - today) / 86400000) };
    }).filter(m => m.days_until <= 30).sort((a, b) => a.days_until - b.days_until);

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
    const { data: member } = await supabase.from('company_members').select('id, first_name').eq('email', email).maybeSingle();
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
    const { data: member } = await supabase
      .from('company_members').select('id, reset_token_expires').eq('reset_token', token).maybeSingle();
    if (!member || new Date(member.reset_token_expires) < new Date())
      return res.status(400).json({ error: 'Invalid or expired reset link' });

    const password_hash = await bcrypt.hash(password, 12);
    await supabase.from('company_members').update({ password_hash, reset_token: null, reset_token_expires: null }).eq('id', member.id);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/members/profile — update member profile
const updateMemberProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, profile_picture_url } = req.body;
    const { data, error } = await supabase
      .from('company_members')
      .update({ first_name, last_name, phone, profile_picture_url, updated_at: new Date() })
      .eq('id', req.member.id)
      .select('id, first_name, last_name, email, role, department, status, profile_picture_url, company_id')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
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

    const valid = await bcrypt.compare(current_password, member.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const password_hash = await bcrypt.hash(new_password, 12);
    await supabase.from('company_members').update({ password_hash }).eq('id', req.member.id);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
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
};
