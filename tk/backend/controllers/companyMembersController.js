const bcrypt = require('bcryptjs');
const argon2  = require('argon2');
const {
  validateEmail, validatePassword, sanitizeName, sanitizeDate,
  validateUUID, isSanitizeError,
} = require('../utils/sanitize');
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
  const { data: company } = await supabase.from('companies').select('email').eq('id', companyId).maybeSingle();
  if (!company) return false;
  const companyDomain = getDomain(company.email);
  const memberDomain  = getDomain(memberEmail);
  return companyDomain && memberDomain && companyDomain === memberDomain;
};

// POST /api/members/signup
const memberSignup = async (req, res) => {
  try {
    const raw = req.body;

    // ── Sanitize & validate ───────────────────────────────────────────────
    const requestedCompanyCode = raw.company_code || raw.company_id || req.tenantCompany?.id;
    const cleanCompanyCode = validateUUID(requestedCompanyCode, 'Company code');
    if (req.tenantCompany && cleanCompanyCode !== req.tenantCompany.id) {
      return res.status(403).json({
        error: 'This signup link does not belong to this workspace',
        code: 'WORKSPACE_MISMATCH',
      });
    }
    const cleanEmail       = validateEmail(raw.email);
    const cleanPassword    = validatePassword(raw.password);
    const cleanFirstName   = sanitizeName(raw.first_name, 'First name', { maxLen: 60 });
    const cleanLastName    = sanitizeName(raw.last_name, 'Last name', { maxLen: 60 });
    const cleanDOB         = sanitizeDate(raw.date_of_birth, 'Date of birth');
    const cleanResumption  = sanitizeDate(raw.resumption_date, 'Resumption date', { allowFuture: true });
    // gender: restrict to known values only
    const rawGender = raw.gender ? String(raw.gender).toLowerCase().trim() : null;
    const cleanGender = ['male','female','other'].includes(rawGender) ? rawGender : null;
    const rawRole = raw.role ? String(raw.role).toLowerCase().trim() : 'team_member';
    const cleanRole = rawRole === 'team_leader' ? 'team_leader' : 'team_member';
    // ─────────────────────────────────────────────────────────────────────

    // Find company by code (we use company ID as the code)
    const { data: company } = await supabase.from('companies').select('id, name, email, slug').eq('id', cleanCompanyCode).maybeSingle();
    if (!company) return res.status(404).json({ error: 'Company not found. Check your company code.' });

    // Check if employee was pre-imported by HR (skip domain validation for pre-seeded members)
    const { data: preImported } = await supabase
      .from('company_members')
      .select('id, status')
      .eq('company_id', company.id)
      .eq('email', cleanEmail)
      .maybeSingle();

    // If not pre-imported, do domain validation as fallback
    if (!preImported) {
      const domainOk = await validateDomain(cleanEmail, company.id);
      if (!domainOk) {
        const companyDomain = getDomain(company.email);
        const { data: companySettings } = await supabase
          .from('companies').select('allow_any_domain').eq('id', company.id).maybeSingle();
        if (!companySettings?.allow_any_domain) {
          return res.status(400).json({
            error: `Your email must match your company domain (@${companyDomain}), or ask your HR to import your email first. Company code: ${cleanCompanyCode}`
          });
        }
      }
    }

    const password_hash = await hashPassword(cleanPassword);
    let member, memberError;

    const fillGapSignup = (existingVal, newVal) => {
      const existingIsEmpty = existingVal === null || existingVal === undefined || existingVal === '';
      return existingIsEmpty ? (newVal || null) : existingVal;
    };

    if (preImported) {
      const { data: preImportedFull } = await supabase
        .from('company_members')
        .select('date_of_birth, resumption_date, gender')
        .eq('id', preImported.id).maybeSingle();

      const occasionFields = {
        gender:          fillGapSignup(preImportedFull?.gender,          cleanGender),
        resumption_date: fillGapSignup(preImportedFull?.resumption_date, cleanResumption),
        date_of_birth:   fillGapSignup(preImportedFull?.date_of_birth,   cleanDOB),
      };

      if (preImported.status === 'approved') {
        const { data: updated, error } = await supabase
          .from('company_members')
          .update({
            first_name: cleanFirstName, last_name: cleanLastName,
            password_hash, role: cleanRole, ...occasionFields,
          })
          .eq('id', preImported.id)
          .select('id, first_name, last_name, email, role, department, status, company_id')
          .maybeSingle();
        member = updated; memberError = error;
      } else {
        // Pre-imported but not yet approved — update details, keep status as pending
        const { data: updated, error } = await supabase
          .from('company_members')
          .update({
            first_name: cleanFirstName, last_name: cleanLastName,
            password_hash, role: cleanRole, status: 'pending', ...occasionFields,
          })
          .eq('id', preImported.id)
          .select('id, first_name, last_name, email, role, department, status, company_id')
          .maybeSingle();
        member = updated; memberError = error;
      }
    } else {
      // New employee — check not already registered with a password
      const { data: existing } = await supabase.from('company_members')
        .select('id, password_hash').eq('email', cleanEmail).eq('company_id', company.id).maybeSingle();
      if (existing?.password_hash) return res.status(400).json({ error: 'Email already registered in this company' });

      const { data: inserted, error } = await supabase
        .from('company_members')
        .insert({
          company_id: company.id, first_name: cleanFirstName, last_name: cleanLastName,
          email: cleanEmail, password_hash, role: cleanRole, status: 'pending',
          gender: cleanGender, resumption_date: cleanResumption, date_of_birth: cleanDOB,
        })
        .select('id, first_name, last_name, email, role, department, status, company_id')
        .maybeSingle();
      member = inserted; memberError = error;
    }
    if (memberError) throw memberError;

    // Notify HR + team leader
    const { data: hrCompany } = await supabase.from('companies').select('email, name, contact_person').eq('id', company.id).maybeSingle();
    await sendEmail({ to: hrCompany.email, template: 'memberJoinRequest', data: {
      companyName: hrCompany.name, hrName: hrCompany.contact_person,
      memberName: `${cleanFirstName} ${cleanLastName}`, memberEmail: cleanEmail,
      companyId: company.id,
    }});

    res.status(201).json({ message: 'Account created. Awaiting approval.', member });
  } catch (err) {
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

// POST /api/members/login
const memberLogin = async (req, res) => {
  try {
    const cleanEmail    = validateEmail(req.body.email);
    const cleanPassword = validatePassword(req.body.password);

    // Fetch ALL rows for this email (a person can belong to multiple companies).
    // We try each in turn and return the first one where the password matches.
    const { data: members } = await supabase.from('company_members')
      .select('*').eq('email', cleanEmail);

    if (!members || members.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    // If the client passed a company_code hint, prefer that company's row first
    const hintId = req.tenantCompany?.id || req.body.company_id || req.body.company_code || null;
    const ordered = hintId
      ? [...members.filter(m => m.company_id === hintId), ...members.filter(m => m.company_id !== hintId)]
      : members;

    let member = null;
    for (const candidate of ordered) {
      if (!candidate.password_hash) continue;
      const valid = await verifyPassword(cleanPassword, candidate.password_hash);
      if (valid) { member = candidate; break; }
    }

    if (!member) {
      // Surface the most meaningful status error from any matching row
      const anyPending  = ordered.find(m => m.status === 'pending');
      const anyRejected = ordered.find(m => m.status === 'rejected');
      const anyNoHash   = ordered.find(m => !m.password_hash);
      if (anyNoHash)   return res.status(403).json({ error: 'Please check your email for an invite link to set up your password first.' });
      if (anyPending)  return res.status(403).json({ error: 'Your account is pending approval. You will be notified by email.' });
      if (anyRejected) return res.status(403).json({ error: 'Your account was not approved. Contact your HR.' });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (member.status === 'pending')    return res.status(403).json({ error: 'Your account is pending approval. You will be notified by email.' });
    if (member.status === 'rejected')   return res.status(403).json({ error: 'Your account was not approved. Contact your HR.' });
    if (member.status === 'deactivated') return res.status(403).json({ error: 'Your account has been deactivated. Contact your HR.' });
    if (req.tenantCompany && member.company_id !== req.tenantCompany.id) {
      return res.status(403).json({
        error: 'This account does not belong to this workspace',
        code: 'WORKSPACE_MISMATCH',
      });
    }

    // Upgrade bcrypt → argon2 transparently on next login
    await rehashIfLegacy(member.id, cleanPassword, member.password_hash, 'company_members', supabase);

    // Get company info
    const { data: company } = await supabase.from('companies').select('id, name, email, slug, logo_url').eq('id', member.company_id).maybeSingle();
    const token = generateToken(member.id, member.company_id);
    const { password_hash, reset_token, invite_token, ...safeMember } = member;
    setCookie(res, 'tk_member', token);
    res.json({token, member: { ...safeMember, company } });
  } catch (err) {
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /api/members/me
const getMemberMe = async (req, res) => {
  try {
    const { data: member, error } = await supabase
      .from('company_members')
      .select('id, first_name, last_name, email, role, department, status, profile_picture_url, company_id, created_at, is_core_team')
      .eq('id', req.member.id).maybeSingle();
    if (error) throw error;
    const { data: company } = await supabase.from('companies').select('id, name, email, logo_url, slug').eq('id', member.company_id).maybeSingle();
    res.json({ ...member, company });
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Failed to fetch member' });
  }
};

// GET /api/members/departments?companyId=xxx — for signup dropdown
const getDepartmentOptions = async (req, res) => {
  try {
    const companyId = req.tenantCompany?.id || req.query.companyId;
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
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

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
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Failed to fetch pending members' });
  }
};

// POST /api/members/:memberId/approve — HR or team leader approves
const approveMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const isHR = !!req.company;
    const approver = isHR ? req.company : req.member;

    const { data: member } = await supabase.from('company_members').select('*').eq('id', memberId).maybeSingle();
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

    const { data: company } = await supabase.from('companies').select('name').eq('id', member.company_id).maybeSingle();
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
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Approval failed' });
  }
};

// POST /api/members/:memberId/reject
const rejectMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { reason } = req.body;
    const { data: member } = await supabase.from('company_members').select('*').eq('id', memberId).maybeSingle();
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
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

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

    // Active cards for this member's company
    const { data: allActiveCards } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, recipient_email, occasion, status, total_collected, created_at, notification_scope, background_color, deadline')
      .eq('company_id', member.company_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100);

    const activeDeptCards = (allActiveCards || []);

    // pending_to_sign: cards the member has NOT yet signed and is NOT the recipient of
    let pendingToSign = [];
    if (activeDeptCards.length > 0) {
      const { data: signedMessages } = await supabase
        .from('messages')
        .select('card_id')
        .eq('author_email', member.email)
        .in('card_id', activeDeptCards.map(c => c.id));
      const signedIds = new Set((signedMessages || []).map(s => s.card_id));
      pendingToSign = activeDeptCards.filter(c =>
        !signedIds.has(c.id) &&
        c.recipient_email !== member.email
      );
    }

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
      recent_cards: activeDeptCards.slice(0, 10),
      pending_to_sign: pendingToSign,
      my_created_cards: (myCards || []).map(card => ({
        ...card,
        signed_count: card.messages?.[0]?.count || 0,
        messages: undefined
      })),
      pending_approvals: pendingApprovals,
      stats: {
        dept_size: (deptMembers || []).length,
        upcoming_occasions: withDays.length,
        active_cards: activeDeptCards.length,
        pending_to_sign: pendingToSign.length,
        pending_approvals: pendingApprovals.length,
      }
    });
  } catch (err) {
    console.error(err);
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// POST /api/members/forgot-password
const memberForgotPassword = async (req, res) => {
  try {
    let cleanEmail;
    try { cleanEmail = validateEmail(req.body.email); }
    catch { return res.json({ message: 'If that email exists, a reset link has been sent' }); }

    const { data: member } = await supabase.from('company_members').select('id, first_name').eq('email', cleanEmail).maybeSingle();
    if (!member) return res.json({ message: 'If that email exists, a reset link has been sent' });

    const token = crypto.randomBytes(32).toString('hex');
    await supabase.from('company_members').update({
      reset_token: token, reset_token_expires: new Date(Date.now() + 3600000)
    }).eq('id', member.id);

    await sendEmail({ to: cleanEmail, template: 'memberPasswordReset', data: { token, name: member.first_name } });
    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/members/reset-password
const memberResetPassword = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string' || token.length > 200)
      return res.status(400).json({ error: 'Invalid reset token' });

    let cleanPassword;
    try { cleanPassword = validatePassword(req.body.password); }
    catch (e) { return res.status(400).json({ error: e.error || 'Invalid password' }); }

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

    const password_hash = await hashPassword(cleanPassword);

    if (tokenType === 'reset') {
      const { data: updated, error: upErr } = await supabase.from('company_members')
        .update({ password_hash, reset_token: null, reset_token_expires: null, status: 'approved', invite_accepted: true })
        .eq('id', member.id)
        .select('id, status, invite_accepted');
      if (upErr) { console.error('memberResetPassword update error (reset):', upErr.message); throw upErr; }
      if (!updated || updated.length === 0) {
        console.error('memberResetPassword: update matched 0 rows for id:', member.id);
        return res.status(500).json({ error: 'Failed to save password. Please try again or contact support.' });
      }
    } else {
      // invite_token — clear it, mark approved, mark invite accepted
      const { data: updated, error: upErr } = await supabase.from('company_members')
        .update({ password_hash, invite_token: null, status: 'approved', invite_accepted: true })
        .eq('id', member.id)
        .select('id, status, invite_accepted');
      if (upErr) { console.error('memberResetPassword update error (invite):', upErr.message); throw upErr; }
      if (!updated || updated.length === 0) {
        console.error('memberResetPassword: update matched 0 rows for id:', member.id);
        return res.status(500).json({ error: 'Failed to save password. Please try again or contact support.' });
      }
    }

    res.json({ message: 'Password set successfully! You can now sign in.' });
  } catch (err) {
    console.error('memberResetPassword error:', err.message);
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// PUT /api/members/profile — update member profile
const updateMemberProfile = async (req, res) => {
  try {
    const { sanitizeName, sanitizeDate, sanitizePhone, sanitizeText, isSanitizeError } = require('../utils/sanitize');
    const raw = req.body;

    // Sanitize all user-supplied fields before touching the DB
    const cleanFirstName = raw.first_name !== undefined
      ? sanitizeName(raw.first_name, 'First name', { required: false, maxLen: 60 }) : undefined;
    const cleanLastName  = raw.last_name  !== undefined
      ? sanitizeName(raw.last_name,  'Last name',  { required: false, maxLen: 60 }) : undefined;
    const cleanPhone     = raw.phone      !== undefined
      ? sanitizePhone(raw.phone) : undefined;
    const cleanDOB       = raw.date_of_birth !== undefined
      ? sanitizeDate(raw.date_of_birth, 'Date of birth') : undefined;
    const cleanJobTitle  = raw.job_title  !== undefined
      ? sanitizeText(raw.job_title,  'Job title',  { maxLen: 100 }) : undefined;
    const cleanBio       = raw.bio        !== undefined
      ? sanitizeText(raw.bio,        'Bio',        { maxLen: 500 }) : undefined;

    const { username, profile_picture_url } = raw;

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
    if (cleanFirstName !== undefined) updateData.first_name = cleanFirstName;
    if (cleanLastName  !== undefined) updateData.last_name  = cleanLastName;
    if (cleanPhone     !== undefined) updateData.phone      = cleanPhone;
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url;
    if (username !== undefined) updateData.username = username?.toLowerCase().trim() || null;

    // These columns may not exist yet — try with them, fall back without if schema error
    const extendedData = { ...updateData };
    if (cleanJobTitle !== undefined) extendedData.job_title    = cleanJobTitle;
    if (cleanBio      !== undefined) extendedData.bio          = cleanBio;
    if (cleanDOB      !== undefined) extendedData.date_of_birth = cleanDOB || null;

    let data, error;

    // Try with extended fields first
    ({ data, error } = await supabase
      .from('company_members')
      .update(extendedData)
      .eq('id', req.member.id)
      .select('id, first_name, last_name, email, role, department, status, profile_picture_url, username, phone, company_id')
      .maybeSingle());

    // If schema error on extended fields, retry with base fields only
    if (error && (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('schema cache'))) {
      console.warn('Extended profile columns not yet in schema, falling back to base fields:', error.message);
      ({ data, error } = await supabase
        .from('company_members')
        .update(updateData)
        .eq('id', req.member.id)
        .select('id, first_name, last_name, email, role, department, status, profile_picture_url, username, phone, company_id')
        .maybeSingle());
    }

    if (error) throw error;
    res.json(data);
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// PUT /api/members/password — change member password
const changeMemberPassword = async (req, res) => {
  try {
    const { current_password } = req.body;
    if (!current_password || !req.body.new_password)
      return res.status(400).json({ error: 'Both passwords are required' });
    const { validatePassword } = require('../utils/sanitize');
    const new_password = validatePassword(req.body.new_password, 'New password');

    const { data: member } = await supabase
      .from('company_members')
      .select('password_hash')
      .eq('id', req.member.id)
      .maybeSingle();

    const valid = await verifyPassword(current_password, member.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const password_hash = await hashPassword(new_password);
    await supabase.from('company_members').update({ password_hash }).eq('id', req.member.id);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

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
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Failed to load cards' }); }
};

// GET /api/members/pending-to-sign — active company cards not yet signed by this member
const getMemberPendingToSign = async (req, res) => {
  try {
    const member = req.member;

    // All active cards for this company (include recipient_email to exclude own card)
    const { data: cards } = await supabase
      .from('cards')
      .select('id, slug, title, recipient_name, recipient_email, occasion, status, total_collected, created_at, background_color, deadline, notification_scope')
      .eq('company_id', member.company_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!cards?.length) return res.json([]);

    // Check which ones this member has already signed
    const { data: signed } = await supabase
      .from('messages')
      .select('card_id')
      .eq('author_email', member.email)
      .in('card_id', cards.map(c => c.id));

    const signedIds = new Set((signed || []).map(s => s.card_id));

    // We need the member's department for scope filtering
    // (already on req.member from auth middleware but double-check)
    const memberDept = member.department || req.member?.department;

    const pending = cards.filter(c => {
      if (signedIds.has(c.id)) return false;
      if (c.recipient_email === member.email) return false; // own card
      // Department-scoped cards: only show to members in the recipient's department.
      // We don't store the recipient's dept on the card, so use notification_scope:
      // 'department' cards are only visible to members in the same dept as the card recipient.
      // Since we can't know the recipient's dept from card alone, we include
      // department-scoped cards only when member is in the same company (already filtered)
      // and the scope allows it. company_wide cards are always visible.
      // This is a best-effort filter — HR approval controls who was NOTIFIED,
      // but the signing page is open to anyone with the link.
      return true; // include all active cards the member hasn't signed
    });

    res.json(pending);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Failed to load pending cards' }); }
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
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Failed to load received cards' }); }
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
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

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
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Failed to load reminders' }); }
};

// POST /api/members/reminders — create reminder
const createMemberReminder = async (req, res) => {
  try {
    const { recipient_name, recipient_email, occasion, occasion_date, frequency, notes } = req.body;
    if (!recipient_name || !occasion || !occasion_date) return res.status(400).json({ error: 'Name, occasion, and date are required' });
    const { data, error } = await supabase
      .from('member_reminders')
      .insert({ member_id: req.member.id, recipient_name, recipient_email, occasion, occasion_date, frequency: frequency || 'yearly', notes })
      .select().maybeSingle();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Failed to create reminder' }); }
};

// DELETE /api/members/reminders/:id
const deleteMemberReminder = async (req, res) => {
  try {
    await supabase.from('member_reminders').delete().eq('id', req.params.id).eq('member_id', req.member.id);
    res.json({ message: 'Reminder deleted' });
  } catch (err) { const { isSanitizeError } = require('../utils/sanitize');
 if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
 res.status(500).json({ error: 'Failed to delete reminder' }); }
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
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

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
