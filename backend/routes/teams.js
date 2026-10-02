const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const supabase = require('../utils/supabase');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadAvatar, uploadAvatarBuffer } = require('../utils/cloudinary');
const { initializePayment, verifyPayment, generateReference } = require('../utils/flutterwave');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const FROM = `Taskeeu Teams <${process.env.EMAIL_FROM || 'teams@taskeeu.com'}>`;

const PLANS = {
  monthly: { amount: 200000, label: 'Monthly', durationDays: 30 },
  yearly:  { amount: 2400000, label: 'Yearly',  durationDays: 365 },
};

// ── Helper: send HTML email ────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
    console.error(`❌ TEAMS EMAIL NOT SENT — RESEND_API_KEY not set. [${subject}] To: ${to}`);
    return null;
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) { console.error(`❌ Teams email error to ${to} [${subject}]:`, JSON.stringify(error)); return null; }
    console.log(`✅ Teams email sent to ${to} [${subject}] id=${data?.id}`);
    return data;
  } catch (err) {
    console.error(`❌ Teams email exception to ${to} [${subject}]:`, err?.message);
    return null;
  }
};

const teamsEmail = (content) => `
<!DOCTYPE html><html><head><style>
body{font-family:'Segoe UI',sans-serif;background:#f5f7f5;margin:0}
.wrap{max-width:580px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden}
.head{background:linear-gradient(135deg,#0D1117,#1a2e3a);padding:28px 32px}
.head h1{color:#00C37E;margin:0;font-size:20px;font-weight:700}
.head p{color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px}
.body{padding:28px 32px}.body p{color:#374151;line-height:1.6;font-size:14px}
.btn{display:inline-block;background:#00C37E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:12px 0}
.box{background:#f9fafb;border-radius:8px;padding:16px;margin:12px 0;border-left:3px solid #00C37E}
.foot{background:#f9fafb;padding:16px 32px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb}
</style></head><body>
<div class="wrap">
<div class="head"><h1>⚡ Taskeeu for Teams</h1><p>Nigeria's Field Operations Platform</p></div>
<div class="body">${content}</div>
<div class="foot">© ${new Date().getFullYear()} Taskeeu Technologies Ltd · Lagos, Nigeria</div>
</div></body></html>`;

// ── GET /teams/task-types — public list ───────────────────────────
router.get('/task-types', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enterprise_task_types')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');
    if (error) throw error;
    res.json({ success: true, task_types: data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch task types' });
  }
});

// ── POST /teams/companies/register — HR creates company account ───
router.post('/companies/register',
  uploadAvatar.single('logo'),
  [
    body('company_name').trim().isLength({ min: 2 }),
    body('company_domain').trim().matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('hr_first_name').trim().notEmpty(),
    body('hr_last_name').trim().notEmpty(),
    body('hr_phone').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const {
      company_name, company_domain, branch_name, branch_address,
      industry, company_size, company_address,
      email, password, hr_first_name, hr_last_name, hr_phone,
    } = req.body;

    const domain = company_domain.toLowerCase().replace(/^@/, '');
    const branch = (branch_name || '').trim() || 'Head Office';

    try {
      // Check domain+branch combo not already registered
      const { data: existing } = await supabase.from('companies')
        .select('id, company_name')
        .eq('company_domain', domain)
        .ilike('branch_name', branch)
        .maybeSingle();
      if (existing) return res.status(409).json({ success: false, message: `${existing.company_name} (${branch}) already has a Taskeeu for Teams account` });

      // Check email not taken
      const { data: emailEx } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
      if (emailEx) return res.status(409).json({ success: false, message: 'Email already registered' });

      const password_hash = await bcrypt.hash(password, 12);
      const full_name = `${hr_first_name} ${hr_last_name}`;

      // Create user
      const { data: user, error: uErr } = await supabase
        .from('users')
        .insert({ email, full_name, phone: hr_phone, password_hash, role: 'requester', email_verified: true })
        .select().maybeSingle();
      if (uErr) throw uErr;

      // Create company with branch
      const logoUrl = req.file?.buffer
        ? (await uploadAvatarBuffer(req.file.buffer)).secure_url
        : null;
      const { data: company, error: cErr } = await supabase
        .from('companies')
        .insert({
          hr_user_id: user.id, company_name, company_domain: domain,
          branch_name: branch, branch_address: branch_address || company_address || null,
          industry, company_size, company_address, company_logo_url: logoUrl,
        })
        .select().maybeSingle();
      if (cErr) throw cErr;

      // Create HR company member
      const { data: member } = await supabase
        .from('company_members')
        .insert({
          user_id: user.id, company_id: company.id, first_name: hr_first_name,
          last_name: hr_last_name, work_email: email, job_role: 'HR Administrator',
          permission_level: 'hr', status: 'active', is_hr: true,
          approved_by: user.id, approved_at: new Date().toISOString(),
        })
        .select().maybeSingle();

      // Create wallet
      await supabase.from('company_wallets').insert({ company_id: company.id });

      // Welcome email
      sendEmail(email, '🎉 Welcome to Taskeeu for Teams!', teamsEmail(`
        <p>Hi ${hr_first_name},</p>
        <p>Your company account for <strong>${company_name} — ${branch}</strong> has been created successfully!</p>
        <div class="box">
          <p><strong>Company Domain:</strong> @${domain}</p>
          <p><strong>Branch:</strong> ${branch}</p>
          <p><strong>Your Role:</strong> HR Administrator (Full Access)</p>
        </div>
        <p><strong>Next steps:</strong></p>
        <p>1. Subscribe to activate your account (₦200,000/month or ₦2.4M/year)</p>
        <p>2. Create departments and assign team leaders</p>
        <p>3. Fund your task wallet</p>
        <p>4. Share your company domain <strong>@${domain}</strong> so team members can self-register</p>
        <a href="${process.env.FRONTEND_URL}/teams/dashboard/hr" class="btn">Go to HR Dashboard →</a>
      `))
      .catch(() => {});

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        success: true,
        message: 'Company account created! Subscribe to activate.',
        token,
        user: { id: user.id, email, full_name, role: 'requester' },
        company: { id: company.id, company_name, company_domain: domain, branch_name: branch },
        member: { id: member.id, permission_level: 'hr', is_hr: true },
      });
    } catch (err) {
      console.error('Company register error:', err);
      console.error('[teams.js] Registration failed:', err?.message);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }
);

// ── POST /teams/members/signup — team member creates account ──────
// LOGIC: Normal members → auto-approved (instant access)
//        Team Leaders  → auto-approved as member, HR notified to grant leader rights
router.post('/members/signup',
  [
    body('first_name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
    body('work_email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('department').trim().notEmpty(),
    body('job_role').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { first_name, last_name, work_email, password, department, job_role, requested_role } = req.body;
    // requested_role: 'team_leader' | 'member' (default)
    const isTeamLeader = requested_role === 'team_leader';

    try {
      const emailDomain = work_email.split('@')[1]?.toLowerCase();
      if (!emailDomain) return res.status(400).json({ success: false, message: 'Invalid email address' });

      // Find matching company by domain
      const { data: company } = await supabase
        .from('companies')
        .select('id, company_name, branch_name, company_domain, subscription_status, hr_user_id')
        .eq('company_domain', emailDomain)
        .eq('is_active', true)
        .maybeSingle();

      if (!company) return res.status(404).json({ success: false, message: `No Taskeeu for Teams account found for @${emailDomain}. Contact your HR.` });
      if (!['trial','active'].includes(company.subscription_status))
        return res.status(403).json({ success: false, message: 'Your company subscription is not active. Contact your HR.' });

      // Check not already a member
      const { data: existingMember } = await supabase
        .from('company_members').select('id,status').eq('work_email', work_email).eq('company_id', company.id).maybeSingle();
      if (existingMember) return res.status(409).json({ success: false, message: 'This email already has an account. Please log in.' });

      // Match department
      let deptId = null;
      const { data: dept } = await supabase
        .from('company_departments')
        .select('id').eq('company_id', company.id).ilike('name', `%${department}%`).maybeSingle();
      if (dept) deptId = dept.id;

      // Create or find user
      let userId;
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', work_email).maybeSingle();
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const password_hash = await bcrypt.hash(password, 12);
        const { data: newUser, error: nuErr } = await supabase
          .from('users')
          .insert({ email: work_email, full_name: `${first_name} ${last_name}`, password_hash, role: 'requester', email_verified: true })
          .select().maybeSingle();
        if (nuErr) throw nuErr;
        userId = newUser.id;
      }

      // Auto-approve all members immediately.
      // Team leaders get 'member' status but leader_right_status = 'pending' (HR grants full rights)
      const { data: member, error: mErr } = await supabase
        .from('company_members')
        .insert({
          user_id: userId,
          company_id: company.id,
          department_id: deptId,
          first_name, last_name, work_email, job_role,
          permission_level: isTeamLeader ? 'member' : 'member', // leader rights granted by HR separately
          status: 'active', // ALL members are auto-approved
          approved_by: userId,
          approved_at: new Date().toISOString(),
          leader_right_status: isTeamLeader ? 'pending' : 'none',
        })
        .select().maybeSingle();
      if (mErr) throw mErr;

      // Welcome email to member
      sendEmail(work_email, `✅ Welcome to ${company.company_name}${company.branch_name ? ' — ' + company.branch_name : ''}!`, teamsEmail(`
        <p>Hi ${first_name},</p>
        <p>You have successfully joined <strong>${company.company_name}${company.branch_name ? ' — ' + company.branch_name : ''}</strong> on Taskeeu for Teams!</p>
        <div class="box">
          <p><strong>Department:</strong> ${department}</p>
          <p><strong>Role:</strong> ${job_role}</p>
          ${isTeamLeader ? '<p><strong>Team Leader Rights:</strong> Pending HR approval</p>' : ''}
        </div>
        ${isTeamLeader
          ? '<p>Your account is active and you can log in now. Your <strong>Team Leader privileges</strong> are pending HR approval — you will be notified once granted.</p>'
          : '<p>Your account is active. You can log in and start posting enterprise tasks right away!</p>'
        }
        <a href="${process.env.FRONTEND_URL}/teams/login" class="btn">Log In Now →</a>
      `))
      .catch(() => {});

      // If team leader, notify HR for rights approval
      if (isTeamLeader) {
        const { data: hrUser } = await supabase.from('users').select('email, full_name').eq('id', company.hr_user_id).maybeSingle();

        if (hrUser) {
          sendEmail(hrUser.email, `👔 Team Leader Joined — Approval Needed: ${first_name} ${last_name}`, teamsEmail(`
            <p>Hi,</p>
            <p>A new team member has joined <strong>${company.company_name}</strong> and has requested <strong>Team Leader</strong> privileges for their department:</p>
            <div class="box">
              <p><strong>Name:</strong> ${first_name} ${last_name}</p>
              <p><strong>Email:</strong> ${work_email}</p>
              <p><strong>Department:</strong> ${department}</p>
              <p><strong>Requested Role:</strong> Team Leader</p>
            </div>
            <p>They have been given basic member access. Please review and grant them full Team Leader rights in your HR dashboard.</p>
            <a href="${process.env.FRONTEND_URL}/teams/dashboard/hr" class="btn">Review in HR Dashboard →</a>
          `))
      .catch(() => {});
        }

        // In-app notification for HR
        (async () => {
          try {
            await supabase.from('notifications').insert({
            user_id: company.hr_user_id,
            type: 'team_leader_pending',
            title: `👔 Team Leader Rights Pending: ${first_name} ${last_name}`,
            message: `${first_name} ${last_name} joined as a team leader. Grant full rights in the HR dashboard.`,
            data: { member_id: member.id, company_id: company.id },
            action_url: `/teams/dashboard/hr`,
            });
          } catch (_) {}
        })();
      }

      res.status(201).json({
        success: true,
        message: isTeamLeader
          ? 'Account created! You can log in now. Team Leader rights are pending HR approval.'
          : 'Account created successfully! You can log in right away.',
        auto_approved: true,
        is_team_leader_pending: isTeamLeader,
        member_id: member.id,
      });
    } catch (err) {
      console.error('Member signup error:', err);
      console.error('[teams.js] Signup failed:', err?.message);
      res.status(500).json({ success: false, message: 'Signup failed' });
    }
  }
);
router.post('/members/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    try {
      const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

      const { data: member } = await supabase
        .from('company_members')
        .select('*, company:companies(id,company_name,company_domain,subscription_status,company_logo_url), department:company_departments(id,name,budget_allocated,budget_spent)')
        .eq('work_email', email)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!member) return res.status(403).json({ success: false, message: 'No active company account found for this email. Contact your HR.' });
      if (!['trial','active'].includes(member.company?.subscription_status))
        return res.status(403).json({ success: false, message: 'Your company subscription is not active.' });

      // Get permissions
      const { data: permissions } = await supabase
        .from('company_permission_grants')
        .select('permission').eq('granted_to_member', member.id).eq('is_active', true);

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true, token,
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        member, permissions: permissions?.map(p => p.permission) || [],
      });
    } catch (err) {
      console.error('Member login error:', err);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  }
);

// ── GET /teams/companies/me — company info for HR ────────────────
router.get('/companies/me', authenticate, async (req, res) => {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('*, wallet:company_wallets(*)')
      .eq('hr_user_id', req.user.id)
      .maybeSingle();
    if (!company) return res.status(404).json({ success: false, message: 'No company found' });
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ── GET /teams/companies/:id/members — list members ──────────────
router.get('/companies/:id/members', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let q = supabase
      .from('company_members')
      .select('*, department:company_departments(id,name), user:users!user_id(email, avatar_url, last_seen)')
      .eq('company_id', req.params.id)
      .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data: members, error } = await q;
    if (error) throw error;
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ── POST /teams/companies/:id/members/:memberId/approve ───────────
router.post('/companies/:id/members/:memberId/approve', authenticate, async (req, res) => {
  try {
    const { data: member } = await supabase
      .from('company_members')
      .select('*, company:companies(company_name)')
      .eq('id', req.params.memberId).eq('company_id', req.params.id).maybeSingle();

    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const { permission_level, department_id } = req.body;

    await supabase.from('company_members').update({
      status: 'active',
      permission_level: permission_level || 'member',
      department_id: department_id || member.department_id,
      approved_by: req.user.id,
      approved_at: new Date().toISOString(),
    }).eq('id', req.params.memberId);

    sendEmail(member.work_email, `✅ Account Approved — ${member.company?.company_name}`, teamsEmail(`
      <p>Hi ${member.first_name},</p>
      <p>Your account has been approved! You now have access to <strong>${member.company?.company_name}</strong> on Taskeeu for Teams.</p>
      <a href="${process.env.FRONTEND_URL}/teams/login" class="btn">Log In to Your Account →</a>
    `))
      .catch(() => {});

    res.json({ success: true, message: 'Member approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Approve failed' });
  }
});

// ── POST /teams/companies/:id/members/:memberId/action ────────────
router.post('/companies/:id/members/:memberId/action', authenticate, async (req, res) => {
  try {
    const { action, reason } = req.body; // suspend | remove | activate
    const statusMap = { suspend: 'suspended', remove: 'removed', activate: 'active' };
    if (!statusMap[action]) return res.status(400).json({ success: false, message: 'Invalid action' });

    await supabase.from('company_members').update({ status: statusMap[action] }).eq('id', req.params.memberId);
    res.json({ success: true, message: `Member ${action}d` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Action failed' });
  }
});

// ── POST /teams/companies/:id/members/:memberId/permissions ───────
router.post('/companies/:id/members/:memberId/permissions', authenticate, async (req, res) => {
  try {
    const { permissions, permission_level } = req.body;

    if (permission_level) {
      await supabase.from('company_members')
        .update({ permission_level }).eq('id', req.params.memberId);
    }

    if (permissions && Array.isArray(permissions)) {
      // Remove old grants first
      await supabase.from('company_permission_grants')
        .update({ is_active: false })
        .eq('company_id', req.params.id)
        .eq('granted_to_member', req.params.memberId);

      // Insert new grants
      const grants = permissions.map(p => ({
        company_id: req.params.id,
        granted_to_member: req.params.memberId,
        granted_by: req.user.id,
        permission: p,
        is_active: true,
      }));
      if (grants.length > 0) await supabase.from('company_permission_grants').upsert(grants, { onConflict: 'company_id,granted_to_member,permission' });
    }

    res.json({ success: true, message: 'Permissions updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Permission update failed' });
  }
});

// ── DEPARTMENTS ───────────────────────────────────────────────────
router.get('/companies/:id/departments', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('company_departments')
      .select('*, leader:company_members!leader_member_id(first_name,last_name,work_email)')
      .eq('company_id', req.params.id).eq('is_active', true).order('name');
    if (error) throw error;
    res.json({ success: true, departments: data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

router.post('/companies/:id/departments', authenticate, async (req, res) => {
  try {
    const { name, description, leader_member_id, budget_allocated } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Department name required' });
    const { data, error } = await supabase
      .from('company_departments')
      .insert({ company_id: req.params.id, name, description, leader_member_id, budget_allocated: budget_allocated || 0 })
      .select().maybeSingle();
    if (error) throw error;
    res.status(201).json({ success: true, department: data });
  } catch (err) {
    console.error('[teams.js] Create failed:', err?.message);
      res.status(500).json({ success: false, message: 'Create failed' });
  }
});

router.put('/companies/:id/departments/:deptId', authenticate, async (req, res) => {
  try {
    const { name, description, leader_member_id, budget_allocated } = req.body;
    await supabase.from('company_departments')
      .update({ name, description, leader_member_id, budget_allocated })
      .eq('id', req.params.deptId).eq('company_id', req.params.id);
    res.json({ success: true, message: 'Department updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ── WALLET ────────────────────────────────────────────────────────
router.get('/companies/:id/wallet', authenticate, async (req, res) => {
  try {
    const { data: wallet } = await supabase.from('company_wallets').select('*').eq('company_id', req.params.id).maybeSingle();
    const { data: txns } = await supabase.from('wallet_transactions')
      .select('*').eq('company_id', req.params.id)
      .order('created_at', { ascending: false }).limit(50);
    res.json({ success: true, wallet, transactions: txns || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

router.post('/companies/:id/wallet/topup', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1000) return res.status(400).json({ success: false, message: 'Minimum topup is ₦1,000' });

    const reference = generateReference('WALLET');
    const { data: company } = await supabase.from('companies').select('company_name').eq('id', req.params.id).maybeSingle();
    const payData = await initializePayment({
      email: req.user.email, amount,
      currency: 'NGN',
      customerName: req.user.full_name || req.user.email,
      reference,
      metadata: { type: 'wallet_topup', company_id: req.params.id, company_name: company?.company_name },
      callbackUrl: `${process.env.FRONTEND_URL}/teams/payment/callback`,
    });

    // Log pending transaction
    await supabase.from('wallet_transactions').insert({
      company_id: req.params.id, transaction_type: 'topup',
      amount, description: 'Wallet top-up via Flutterwave',
      flw_reference: reference, initiated_by: req.user.id,
    });

    res.json({ success: true, authorization_url: payData.authorization_url, reference });
  } catch (err) {
    console.error('[teams.js] Top-up init failed:', err?.message);
      res.status(500).json({ success: false, message: 'Top-up init failed' });
  }
});

router.post('/companies/:id/wallet/verify/:reference', authenticate, async (req, res) => {
  try {
    const txn = await verifyPayment(req.params.reference);
    if (txn.status !== 'successful') return res.json({ success: false, message: 'Payment not successful' });

    const { data: pendingTxn } = await supabase.from('wallet_transactions')
      .select('*').eq('flw_reference', req.params.reference).maybeSingle();
    if (!pendingTxn) return res.status(404).json({ success: false, message: 'Transaction not found' });

    // Update wallet balance
    const { data: wallet } = await supabase.from('company_wallets').select('total_balance').eq('company_id', req.params.id).maybeSingle();
    const newBalance = parseFloat(wallet.total_balance || 0) + parseFloat(pendingTxn.amount);
    await supabase.from('company_wallets').update({ total_balance: newBalance }).eq('company_id', req.params.id);
    await supabase.from('wallet_transactions').update({ balance_after: newBalance }).eq('flw_reference', req.params.reference);

    res.json({ success: true, message: 'Wallet funded!', new_balance: newBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verify failed' });
  }
});

router.post('/companies/:id/wallet/allocate', authenticate, async (req, res) => {
  try {
    const { department_id, amount, use_general_purse } = req.body;

    if (typeof use_general_purse === 'boolean') {
      await supabase.from('company_wallets').update({ use_general_purse }).eq('company_id', req.params.id);
    }

    if (department_id && amount) {
      // Check wallet has enough
      const { data: wallet } = await supabase.from('company_wallets').select('available_balance').eq('company_id', req.params.id).maybeSingle();
      if (parseFloat(wallet.available_balance) < parseFloat(amount))
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });

      // Deduct from general and add to dept budget
      await supabase.from('company_wallets').update({ total_balance: supabase.rpc('decrement', { x: amount }) }).eq('company_id', req.params.id);
      await supabase.from('company_departments').update({ budget_allocated: supabase.rpc('increment', { x: amount }) }).eq('id', department_id);

      await supabase.from('wallet_transactions').insert({
        company_id: req.params.id, department_id,
        transaction_type: 'dept_allocation', amount,
        description: `Budget allocated to department`, initiated_by: req.user.id,
      });
    }

    res.json({ success: true, message: 'Allocation updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Allocation failed' });
  }
});

// ── SUBSCRIPTION ──────────────────────────────────────────────────
router.post('/companies/:id/subscribe', authenticate, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const reference = generateReference('SUB');
    const planInfo = PLANS[plan];
    const { data: company } = await supabase.from('companies').select('company_name').eq('id', req.params.id).maybeSingle();

    const payData = await initializePayment({
      email: req.user.email,
      amount: planInfo.amount,
      currency: 'NGN',
      customerName: req.user.full_name || req.user.email,
      reference,
      metadata: { type: 'subscription', company_id: req.params.id, plan, company_name: company?.company_name },
      callbackUrl: `${process.env.FRONTEND_URL}/teams/payment/callback?type=subscription`,
    });

    await supabase.from('company_subscriptions').insert({
      company_id: req.params.id, plan,
      amount: planInfo.amount, flw_reference: reference, status: 'pending',
    });

    res.json({ success: true, authorization_url: payData.authorization_url, reference });
  } catch (err) {
    console.error('[teams.js] Subscription init failed:', err?.message);
      res.status(500).json({ success: false, message: 'Subscription init failed' });
  }
});

router.post('/companies/:id/subscribe/verify/:reference', authenticate, async (req, res) => {
  try {
    const txn = await verifyPayment(req.params.reference);
    if (txn.status !== 'successful') return res.json({ success: false, message: 'Payment not successful' });

    const { data: sub } = await supabase.from('company_subscriptions')
      .select('*').eq('flw_reference', req.params.reference).maybeSingle();
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    const planInfo = PLANS[sub.plan];
    const now = new Date();
    const end = new Date(now.getTime() + planInfo.durationDays * 86400000);

    await supabase.from('company_subscriptions').update({
      status: 'active', period_start: now.toISOString(), period_end: end.toISOString(),
    }).eq('flw_reference', req.params.reference);

    await supabase.from('companies').update({
      subscription_status: 'active', subscription_plan: sub.plan,
      subscription_start: now.toISOString(), subscription_end: end.toISOString(),
    }).eq('id', req.params.id);

    res.json({ success: true, message: `${planInfo.label} subscription activated!`, expires: end });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verify failed' });
  }
});

// ── GET /teams/member/me — current member profile ─────────────────
router.get('/member/me', authenticate, async (req, res) => {
  try {
    const { data: member } = await supabase
      .from('company_members')
      .select('*, company:companies(id,company_name,company_domain,company_logo_url,subscription_status), department:company_departments(id,name,budget_allocated,budget_spent)')
      .eq('user_id', req.user.id).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!member) return res.status(404).json({ success: false, message: 'No active company membership found' });

    const { data: permissions } = await supabase
      .from('company_permission_grants')
      .select('permission').eq('granted_to_member', member.id).eq('is_active', true);

    res.json({ success: true, member, permissions: permissions?.map(p => p.permission) || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ── GET /teams/companies/:id/leaders/pending — list pending team leaders ──
router.get('/companies/:id/leaders/pending', authenticate, async (req, res) => {
  try {
    const { data: leaders, error } = await supabase
      .from('company_members')
      .select('*, user:users!user_id(email, avatar_url, last_seen), department:company_departments(id,name)')
      .eq('company_id', req.params.id)
      .eq('leader_right_status', 'pending')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, leaders: leaders || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ── POST /teams/companies/:id/leaders/:memberId/grant-rights ──────
router.post('/companies/:id/leaders/:memberId/grant-rights', authenticate, async (req, res) => {
  try {
    const { department_id } = req.body;

    const { data: member } = await supabase
      .from('company_members')
      .select('*, company:companies(company_name, branch_name)')
      .eq('id', req.params.memberId).eq('company_id', req.params.id).maybeSingle();
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    // Update to dept_leader permission
    await supabase.from('company_members').update({
      permission_level: 'dept_leader',
      department_id: department_id || member.department_id,
      leader_right_status: 'approved',
      leader_right_approved_at: new Date().toISOString(),
      leader_right_approved_by: req.user.id,
    }).eq('id', req.params.memberId);

    // If department specified, set them as dept leader
    if (department_id || member.department_id) {
      await supabase.from('company_departments')
        .update({ leader_member_id: req.params.memberId })
        .eq('id', department_id || member.department_id);
    }

    // Grant standard dept-leader permissions
    const perms = ['approve_tasks', 'view_all_tasks'];
    const grants = perms.map(p => ({
      company_id: req.params.id,
      granted_to_member: req.params.memberId,
      granted_by: req.user.id,
      permission: p,
      is_active: true,
    }));
    await supabase.from('company_permission_grants').upsert(grants, { onConflict: 'company_id,granted_to_member,permission' });

    // Notify the member
    sendEmail(member.work_email, `✅ Team Leader Rights Granted — ${member.company?.company_name}`, teamsEmail(`
      <p>Hi ${member.first_name},</p>
      <p>Your <strong>Team Leader privileges</strong> have been approved for <strong>${member.company?.company_name}${member.company?.branch_name ? ' — ' + member.company.branch_name : ''}</strong>.</p>
      <p>You can now manage your department's team members and approve tasks.</p>
      <a href="${process.env.FRONTEND_URL}/teams/dashboard" class="btn">Open Dashboard →</a>
    `))
      .catch(() => {});

    (async () => {
      try {
        await supabase.from('notifications').insert({
        user_id: member.user_id,
        type: 'leader_rights_granted',
        title: 'Team Leader Rights Granted',
        message: 'Your Team Leader privileges are now active. You can manage your department.',
        action_url: '/teams/dashboard',
        });
      } catch (_) {}
    })();

    res.json({ success: true, message: 'Team Leader rights granted!' });
  } catch (err) {
    console.error('Grant leader rights error:', err);
    console.error('[teams.js] Failed:', err?.message);
      res.status(500).json({ success: false, message: 'Failed' });
  }
});

// ── POST /teams/companies/:id/leaders/:memberId/reject-rights ─────
router.post('/companies/:id/leaders/:memberId/reject-rights', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const { data: member } = await supabase
      .from('company_members').select('work_email, first_name, user_id').eq('id', req.params.memberId).maybeSingle();
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    await supabase.from('company_members').update({
      leader_right_status: 'rejected',
      permission_level: 'member',
    }).eq('id', req.params.memberId);

    sendEmail(member.work_email, 'Team Leader Request Update', teamsEmail(`
      <p>Hi ${member.first_name}, your request for Team Leader privileges was not approved at this time.${reason ? ' Reason: ' + reason : ''}</p>
      <p>You still have full member access. Contact your HR for more information.</p>
    `))
      .catch(() => {});

    res.json({ success: true, message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// ── GET /teams/companies/:id/file-history — task proof file history ──
router.get('/companies/:id/file-history', authenticate, async (req, res) => {
  try {
    const { task_id, tasker_id, page = 1, limit = 50, date_from, date_to } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Use the view or join directly
    let q = supabase
      .from('enterprise_task_proofs')
      .select(`
        id, proof_type, proof_category, file_url, gps_lat, gps_lng,
        gps_address, taken_at, caption, is_approved, created_at,
        device_info, original_filename,
        enterprise_task:enterprise_tasks!enterprise_task_id(
          id, title, status, completed_at, custom_task_type, member_department,
          company_id,
          task_type:enterprise_task_types(name, category),
          member:company_members!member_id(first_name, last_name, job_role)
        ),
        tasker:users!tasker_id(id, full_name, email, avatar_url),
        tasker_profile:tasker_profiles!tasker_id(task_city, task_state, enterprise_certified)
      `, { count: 'exact' })
      .eq('enterprise_task.company_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (task_id) q = q.eq('enterprise_task_id', task_id);
    if (tasker_id) q = q.eq('tasker_id', tasker_id);
    if (date_from) q = q.gte('created_at', date_from);
    if (date_to) q = q.lte('created_at', date_to);

    const { data: files, error, count } = await q;
    if (error) throw error;

    res.json({
      success: true,
      files: files || [],
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil((count || 0) / parseInt(limit)) },
    });
  } catch (err) {
    console.error('File history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch file history' });
  }
});


// ─── GET /teams/admin/companies — admin view all companies ───────────
router.get('/admin/companies', authenticate, async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, company_name, industry, company_size, subscription_status, created_at, contact_email')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ success: true, companies: companies || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch companies' });
  }
});

module.exports = router;

