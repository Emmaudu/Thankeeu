const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');
const { authenticate } = require('../middleware/auth');
const { uploadProof, uploadProofBuffer } = require('../utils/cloudinary');
const { generateReference } = require('../utils/flutterwave');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const FROM = `Taskeeu Teams <${process.env.EMAIL_FROM || 'teams@taskeeu.com'}>`;

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

const teamsEmail = (content) => `<!DOCTYPE html><html><head><style>
body{font-family:'Segoe UI',sans-serif;background:#f5f7f5;margin:0}
.wrap{max-width:580px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden}
.head{background:linear-gradient(135deg,#0D1117,#1a2e3a);padding:28px 32px}
.head h1{color:#00C37E;margin:0;font-size:20px;font-weight:700}
.body{padding:28px 32px}.body p{color:#374151;line-height:1.6;font-size:14px}
.btn{display:inline-block;background:#00C37E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:12px 0}
.box{background:#f9fafb;border-radius:8px;padding:16px;margin:12px 0;border-left:3px solid #00C37E}
.foot{background:#f9fafb;padding:16px 32px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb}
</style></head><body>
<div class="wrap">
<div class="head"><h1>⚡ Taskeeu for Teams</h1></div>
<div class="body">${content}</div>
<div class="foot">© ${new Date().getFullYear()} Taskeeu Technologies Ltd · Lagos, Nigeria</div>
</div></body></html>`;

// ── POST /enterprise-tasks — create task ──────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title, task_type_id, custom_task_type, description, attachment_urls,
      base_price_per_person, adjusted_price_per_person, adjustment_type, adjustment_value,
      commence_date, duration_days, sla_hours,
      line_manager_name, line_manager_email,
      member_department, member_role,
      state_deployments, // array: [{state, region, people_needed, full_address, task_type_override, notes}]
    } = req.body;

    // Get member info
    const { data: member } = await supabase
      .from('company_members')
      .select('*, company:companies(id, company_name, company_domain, subscription_status, company_logo_url)')
      .eq('user_id', req.user.id).eq('status', 'active').maybeSingle();

    if (!member) return res.status(403).json({ success: false, message: 'No active company membership' });
    if (!['trial','active'].includes(member.company?.subscription_status))
      return res.status(403).json({ success: false, message: 'Company subscription is not active' });

    // Calculate total
    const deployments = Array.isArray(state_deployments) ? state_deployments : [];
    const totalPeople = deployments.reduce((s, d) => s + (parseInt(d.people_needed) || 1), 0);
    const pricePerPerson = parseFloat(adjusted_price_per_person || base_price_per_person);
    const totalCost = pricePerPerson * totalPeople;

    // Check wallet balance (reserve funds)
    const { data: wallet } = await supabase
      .from('company_wallets').select('*').eq('company_id', member.company_id).maybeSingle();

    const useGeneral = wallet?.use_general_purse;
    const available = useGeneral
      ? parseFloat(wallet?.available_balance || 0)
      : parseFloat(member.department?.budget_allocated || 0) - parseFloat(member.department?.budget_spent || 0);

    if (available < totalCost)
      return res.status(400).json({ success: false, message: `Insufficient ${useGeneral ? 'wallet' : 'department'} balance. Need ₦${totalCost.toLocaleString()}, available ₦${available.toLocaleString()}` });

    // Create task
    const deadline = new Date(new Date(commence_date).getTime() + (duration_days || 1) * 86400000);
    const { data: task, error } = await supabase
      .from('enterprise_tasks')
      .insert({
        company_id: member.company_id,
        member_id: member.id,
        department_id: member.department_id,
        member_department: member_department || member.department?.name,
        member_role: member_role || member.job_role,
        title, task_type_id: task_type_id || null,
        custom_task_type: custom_task_type || null,
        description,
        attachment_urls: attachment_urls || [],
        base_price_per_person: parseFloat(base_price_per_person),
        adjusted_price_per_person: pricePerPerson,
        adjustment_type: adjustment_type || 'none',
        adjustment_value: adjustment_value ? parseFloat(adjustment_value) : null,
        total_people_needed: totalPeople,
        total_estimated_cost: totalCost,
        commence_date, duration_days: parseInt(duration_days) || 1,
        deadline: deadline.toISOString(),
        sla_hours: sla_hours || 24,
        line_manager_name, line_manager_email,
        status: 'pending_approval',
        proof_required: true,
      })
      .select().maybeSingle();
    if (error) throw error;

    // Create state deployments
    if (deployments.length > 0) {
      const stateRows = deployments.map(d => ({
        enterprise_task_id: task.id,
        state: d.state, region: d.region || null,
        people_needed: parseInt(d.people_needed) || 1,
        full_address: d.full_address || null,
        task_type_override: d.task_type_override || null,
        notes: d.notes || null,
      }));
      await supabase.from('enterprise_task_states').insert(stateRows);
    }

    // Reserve funds from wallet
    if (useGeneral) {
      await supabase.from('company_wallets')
        .update({ reserved_balance: parseFloat(wallet.reserved_balance || 0) + totalCost })
        .eq('company_id', member.company_id);
    } else {
      await supabase.from('company_departments')
        .update({ budget_spent: parseFloat(member.department?.budget_spent || 0) + totalCost })
        .eq('id', member.department_id);
    }

    await supabase.from('wallet_transactions').insert({
      company_id: member.company_id,
      department_id: member.department_id,
      transaction_type: 'task_reserve',
      amount: totalCost,
      description: `Reserved for task: ${title}`,
      enterprise_task_id: task.id,
      initiated_by: req.user.id,
    });

    // Notify line manager
    if (line_manager_email) {
      await sendEmail(line_manager_email, `📋 Task Approval Required — ${title}`, teamsEmail(`
        <p>Hi ${line_manager_name || 'Team Leader'},</p>
        <p>A new field task from <strong>${member.company?.company_name}</strong> requires your approval before going live:</p>
        <div class="box">
          <p><strong>Task:</strong> ${title}</p>
          <p><strong>Submitted by:</strong> ${member.first_name} ${member.last_name} (${member.job_role})</p>
          <p><strong>Dept:</strong> ${member_department || member.department?.name}</p>
          <p><strong>States:</strong> ${deployments.map(d => d.state).join(', ')}</p>
          <p><strong>People needed:</strong> ${totalPeople}</p>
          <p><strong>Total cost:</strong> ₦${totalCost.toLocaleString()}</p>
          <p><strong>Commence:</strong> ${new Date(commence_date).toLocaleDateString()}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/teams/dashboard?tab=approvals&task=${task.id}" class="btn">Approve / Reject →</a>
      `));
    }

    res.status(201).json({ success: true, message: 'Task submitted for line manager approval!', task });
  } catch (err) {
    console.error('Create enterprise task error:', err);
    console.error('[enterprise-tasks.js] Task creation failed:', err?.message);
      res.status(500).json({ success: false, message: 'Task creation failed' });
  }
});

// ── POST /enterprise-tasks/:id/approve-line — line manager approves ─
router.post('/:id/approve-line', authenticate, async (req, res) => {
  try {
    const { approved, notes } = req.body;
    const { data: task } = await supabase
      .from('enterprise_tasks')
      .select('*, company:companies(company_name,company_logo_url), state_deployments:enterprise_task_states(*)')
      .eq('id', req.params.id).maybeSingle();

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const newStatus = approved ? 'live' : 'rejected';
    await supabase.from('enterprise_tasks').update({
      line_manager_approved: approved,
      line_manager_approved_at: new Date().toISOString(),
      line_manager_notes: notes || null,
      status: newStatus,
    }).eq('id', req.params.id);

    if (approved) {
      // Notify taskers in the relevant states
      await notifyTaskersInStates(task);
    } else {
      // Refund reserved funds
      await releaseReservedFunds(task);
    }

    // Notify the task creator
    const { data: member } = await supabase
      .from('company_members').select('work_email, first_name').eq('id', task.member_id).maybeSingle();

    if (member) {
      await sendEmail(member.work_email, approved ? `✅ Task Approved: ${task.title}` : `❌ Task Rejected: ${task.title}`, teamsEmail(`
        <p>Hi ${member.first_name},</p>
        <p>Your task <strong>${task.title}</strong> has been ${approved ? 'approved and is now LIVE' : 'rejected'} by your line manager.</p>
        ${notes ? `<div class="box"><p><strong>Note:</strong> ${notes}</p></div>` : ''}
        ${approved ? `<p>Taskers in the specified states will now receive notifications and can start bidding.</p>` : `<p>The reserved funds have been returned to your wallet.</p>`}
        <a href="${process.env.FRONTEND_URL}/teams/dashboard" class="btn">View Dashboard →</a>
      `));
    }

    res.json({ success: true, message: `Task ${approved ? 'approved and live' : 'rejected'}` });
  } catch (err) {
    console.error('Approve line error:', err);
    res.status(500).json({ success: false, message: 'Action failed' });
  }
});

// Helper: notify taskers in matching states
async function notifyTaskersInStates(task) {
  const states = task.state_deployments || [];
  for (const dep of states) {
    const { data: taskers } = await supabase
      .from('tasker_profiles')
      .select('user_id, user:users!user_id(email, full_name)')
      .eq('verification_status', 'approved')
      .eq('is_available', true)
      .ilike('task_state', `%${dep.state}%`);

    if (!taskers?.length) continue;

    // In-app notifications
    const notifs = taskers.map(t => ({
      user_id: t.user_id,
      type: 'enterprise_task_available',
      title: `🏢 Enterprise Task in ${dep.state}`,
      message: `${task.company?.company_name}: ${task.title} — ${dep.people_needed} person(s) needed`,
      data: { enterprise_task_id: task.id },
      action_url: `/tasker/dashboard?tab=enterprise`,
    }));
    (async () => {
      try {
        await supabase.from('notifications').insert(notifs);
      } catch (_) {}
    })();

    // Email notifications
    for (const t of taskers) {
      if (!t.user?.email) continue;
      await sendEmail(t.user.email, `🏢 New Enterprise Task in ${dep.state} — ${task.company?.company_name}`, teamsEmail(`
        <p>Hi ${t.user.full_name},</p>
        <p>A new enterprise field task is available in <strong>${dep.state}</strong>:</p>
        <div class="box">
          <p><strong>Task:</strong> ${task.title}</p>
          <p><strong>Company:</strong> ${task.company?.company_name}</p>
          <p><strong>People Needed:</strong> ${dep.people_needed}</p>
          <p><strong>Rate:</strong> ₦${Number(task.adjusted_price_per_person).toLocaleString()} per person</p>
          <p><strong>Duration:</strong> ${task.duration_days} day(s)</p>
          <p><strong>SLA:</strong> ${task.sla_hours} hours</p>
        </div>
        <p>⚠️ <strong>Important:</strong> You will need to upload GPS-verified timestamp photos as proof of work. Please download a GPS Timestamp Camera app before accepting this task.</p>
        <a href="${process.env.FRONTEND_URL}/tasker/dashboard?tab=enterprise" class="btn">View & Bid on Task →</a>
      `));
    }
  }
}

async function releaseReservedFunds(task) {
  const { data: wallet } = await supabase.from('company_wallets').select('reserved_balance').eq('company_id', task.company_id).maybeSingle();
  const newReserved = Math.max(0, parseFloat(wallet?.reserved_balance || 0) - parseFloat(task.total_estimated_cost || 0));
  await supabase.from('company_wallets').update({ reserved_balance: newReserved }).eq('company_id', task.company_id);
}

// ── GET /enterprise-tasks — list (company member) ─────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, my_tasks } = req.query;
    const { data: member } = await supabase
      .from('company_members').select('id,company_id,permission_level,department_id,is_hr')
      .eq('user_id', req.user.id).eq('status', 'active').maybeSingle();
    if (!member) return res.status(403).json({ success: false, message: 'No membership found' });

    let q = supabase.from('enterprise_tasks')
      .select(`*, task_type:enterprise_task_types(name,category), state_deployments:enterprise_task_states(*), member:company_members(first_name,last_name,job_role)`)
      .eq('company_id', member.company_id)
      .order('created_at', { ascending: false });

    if (status) q = q.eq('status', status);
    if (my_tasks === 'true') q = q.eq('member_id', member.id);
    else if (!['hr','dept_leader'].includes(member.permission_level) && !member.is_hr)
      q = q.eq('department_id', member.department_id);

    const { data: tasks, error } = await q;
    if (error) throw error;
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ── GET /enterprise-tasks/:id — single task ───────────────────────
router.get('/tasker/available', authenticate, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('tasker_profiles')
      .select('task_state,task_city,verification_status,kyc_complete')
      .eq('user_id', req.user.id).maybeSingle();

    if (!profile || profile.verification_status !== 'approved')
      return res.status(403).json({ success: false, message: 'Only approved taskers can see enterprise tasks' });

    if (!profile.kyc_complete)
      return res.status(403).json({
        success: false,
        message: 'Complete your KYC verification in the dashboard to access enterprise tasks.',
        kyc_required: true,
      });

    // Get tasks in tasker's state
    const { data: stateDeps } = await supabase
      .from('enterprise_task_states')
      .select('enterprise_task_id, enterprise_task:enterprise_tasks!enterprise_task_id(*, company:companies(company_name,company_logo_url), task_type:enterprise_task_types(name,category))')
      .ilike('state', `%${profile.task_state}%`);

    const taskIds = [...new Set(stateDeps?.map(d => d.enterprise_task_id))];
    if (!taskIds.length) return res.json({ success: true, tasks: [] });

    const { data: tasks } = await supabase
      .from('enterprise_tasks')
      .select('*, company:companies(company_name,company_logo_url), task_type:enterprise_task_types(name,category), state_deployments:enterprise_task_states(*)')
      .in('id', taskIds).eq('status', 'live');

    const { data: blacklists } = await supabase
      .from('company_tasker_blacklist').select('company_id').eq('tasker_id', req.user.id);
    const blacklistedCompanies = new Set(blacklists?.map(b => b.company_id) || []);

    const filtered = (tasks || []).filter(t => !blacklistedCompanies.has(t.company_id));
    res.json({ success: true, tasks: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ── GET /enterprise-tasks/tasker/my-tasks — tasker's won enterprise tasks ─

router.get('/tasker/my-tasks', authenticate, async (req, res) => {
  try {
    const { data: bids } = await supabase
      .from('enterprise_task_bids')
      .select('*, enterprise_task:enterprise_tasks(*, company:companies(company_name,company_logo_url), task_type:enterprise_task_types(name)), proofs:enterprise_task_proofs(*)')
      .eq('tasker_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json({ success: true, bids: bids || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data: task, error } = await supabase
      .from('enterprise_tasks')
      .select(`*, task_type:enterprise_task_types(name,category,base_price),
        state_deployments:enterprise_task_states(*),
        member:company_members(first_name,last_name,job_role,work_email),
        company:companies(company_name,company_logo_url,company_domain),
        bids:enterprise_task_bids(*, tasker:users!tasker_id(id,full_name,avatar_url,profile:tasker_profiles(rating_average,total_tasks_completed,task_city)))`)
      .eq('id', req.params.id).maybeSingle();
    if (error || !task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ── POST /enterprise-tasks/:id/bids — tasker bids ────────────────
router.post('/:id/bids', authenticate, async (req, res) => {
  try {
    const { state_deployment_id, message } = req.body;

    const { data: task } = await supabase
      .from('enterprise_tasks').select('*, company:companies(company_name,company_logo_url)')
      .eq('id', req.params.id).maybeSingle();
    if (!task || task.status !== 'live')
      return res.status(400).json({ success: false, message: 'Task is not accepting bids' });

    // Check not blacklisted
    const { data: blacklisted } = await supabase
      .from('company_tasker_blacklist').select('id')
      .eq('company_id', task.company_id).eq('tasker_id', req.user.id).maybeSingle();
    if (blacklisted) return res.status(403).json({ success: false, message: 'You are not eligible to bid on this company\'s tasks' });

    const { data: bid, error } = await supabase
      .from('enterprise_task_bids')
      .insert({ enterprise_task_id: req.params.id, state_deployment_id: state_deployment_id || null, tasker_id: req.user.id, message: message || null })
      .select().maybeSingle();
    if (error?.code === '23505') return res.status(409).json({ success: false, message: 'You have already bid on this task' });
    if (error) throw error;

    // Notify member
    const { data: member } = await supabase
      .from('company_members').select('work_email,first_name').eq('id', task.member_id).maybeSingle();
    if (member) {
      await sendEmail(member.work_email, `💼 New Bid on "${task.title}"`, teamsEmail(`
        <p>Hi ${member.first_name},</p>
        <p>A verified tasker has bid on your enterprise task:</p>
        <div class="box"><p><strong>Task:</strong> ${task.title}</p><p><strong>Rate:</strong> ₦${Number(task.adjusted_price_per_person).toLocaleString()}</p></div>
        <a href="${process.env.FRONTEND_URL}/teams/dashboard" class="btn">Review Bid →</a>
      `));
    }

    res.status(201).json({ success: true, message: 'Bid submitted!', bid });
  } catch (err) {
    console.error('[enterprise-tasks.js] Bid failed:', err?.message);
      res.status(500).json({ success: false, message: 'Bid failed' });
  }
});

// ── POST /enterprise-tasks/:id/bids/:bidId/action ─────────────────
router.post('/:id/bids/:bidId/action', authenticate, async (req, res) => {
  try {
    const { action, reason } = req.body; // accept | reject | ignore
    if (!['accept','reject','ignore'].includes(action))
      return res.status(400).json({ success: false, message: 'Invalid action' });

    const { data: bid } = await supabase
      .from('enterprise_task_bids')
      .select('*, tasker:users!tasker_id(id,email,full_name)')
      .eq('id', req.params.bidId).maybeSingle();
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    const statusMap = { accept: 'accepted', reject: 'rejected', ignore: 'ignored' };
    await supabase.from('enterprise_task_bids').update({
      status: statusMap[action],
      ...(action === 'accept' ? { accepted_at: new Date().toISOString() } : {}),
      ...(action === 'reject' ? { rejected_reason: reason || null } : {}),
    }).eq('id', req.params.bidId);

    if (action === 'accept') {
      // Generate authorization letter
      const authLetterUrl = await generateAuthLetter(req.params.id, bid);
      await supabase.from('enterprise_task_bids').update({ authorization_letter_url: authLetterUrl }).eq('id', req.params.bidId);
      await supabase.from('enterprise_tasks').update({ status: 'ongoing' }).eq('id', req.params.id);

      // Notify tasker of acceptance + auth letter + GPS requirement
      await sendEmail(bid.tasker.email, `✅ Bid Accepted — You Have a New Task!`, teamsEmail(`
        <p>Hi ${bid.tasker.full_name},</p>
        <p>Your bid has been accepted! Here are your task details and important instructions:</p>
        <div class="box">
          <p><strong>📋 Task ID:</strong> ${req.params.id}</p>
          <p><strong>📄 Authorization Letter:</strong> <a href="${authLetterUrl}" style="color:#00C37E">Download Here</a></p>
        </div>
        <p><strong>⚠️ IMPORTANT — GPS Photo Requirement:</strong></p>
        <p>For this enterprise task, you are required to upload <strong>GPS-stamped timestamp photos</strong> as proof of work. Please:</p>
        <ol>
          <li>Download a GPS Timestamp Camera app (recommended: "Timestamp Camera" on Android/iOS)</li>
          <li>Ensure location services are ON before taking any photos</li>
          <li>Each proof photo must show: GPS coordinates, date & time, and the task location</li>
          <li>Upload proofs through your Taskeeu dashboard under "My Enterprise Tasks"</li>
        </ol>
        <p>Your workmanship fee of <strong>₦${Number(bid.tasker?.price || 0).toLocaleString()}</strong> will be paid 2 days after task approval. Taskeeu retains 20%; 80% goes to your account.</p>
        <a href="${process.env.FRONTEND_URL}/tasker/dashboard" class="btn">Open Dashboard →</a>
      `));
    } else if (action === 'reject') {
      await sendEmail(bid.tasker.email, `Task Bid Update`, teamsEmail(`
        <p>Hi ${bid.tasker.full_name}, your bid was not selected for this task. Keep browsing for other opportunities!</p>
      `));
    }

    res.json({ success: true, message: `Bid ${action}ed` });
  } catch (err) {
    console.error('Bid action error:', err);
    res.status(500).json({ success: false, message: 'Action failed' });
  }
});

// Helper: generate authorization letter as URL (using Cloudinary-stored HTML)
async function generateAuthLetter(taskId, bid) {
  const { data: task } = await supabase
    .from('enterprise_tasks')
    .select('*, company:companies(company_name,company_address,company_logo_url), member:company_members(first_name,last_name,job_role,work_email)')
    .eq('id', taskId).maybeSingle();
  const { data: taskerProfile } = await supabase
    .from('tasker_profiles').select('home_address,task_city,task_state').eq('user_id', bid.tasker_id).maybeSingle();

  // Return a URL to a route that generates the letter dynamically
  return `${process.env.FRONTEND_URL || ''}/enterprise-tasks/${taskId}/auth-letter/${bid.id}`;
}

// ── GET /enterprise-tasks/:id/auth-letter/:bidId ─────────────────
router.get('/:id/auth-letter/:bidId', async (req, res) => {
  try {
    const { data: task } = await supabase
      .from('enterprise_tasks')
      .select('*, company:companies(company_name,company_address,company_domain), member:company_members(first_name,last_name,job_role,work_email), task_type:enterprise_task_types(name), state_deployments:enterprise_task_states(*)')
      .eq('id', req.params.id).maybeSingle();

    const { data: bid } = await supabase
      .from('enterprise_task_bids')
      .select('*, tasker:users!tasker_id(full_name, email)')
      .eq('id', req.params.bidId).maybeSingle();

    const { data: taskerProfile } = await supabase
      .from('tasker_profiles').select('home_address,task_city,task_state').eq('user_id', bid?.tasker_id).maybeSingle();

    if (!task || !bid) return res.status(404).send('Not found');

    const taskTypeName = task.custom_task_type || task.task_type?.name || 'Field Task';
    const states = task.state_deployments?.map(d => `${d.state}${d.region ? ' (' + d.region + ')' : ''}`).join(', ') || 'N/A';
    const letterDate = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
    const commenceDate = new Date(task.commence_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <style>
      body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:40px;color:#1a1a2e;line-height:1.8;font-size:14px}
      .header{text-align:center;border-bottom:3px solid #00C37E;padding-bottom:20px;margin-bottom:30px}
      .logo{font-size:24px;font-weight:900;color:#00C37E;letter-spacing:2px}
      .company{font-size:18px;font-weight:bold;margin-top:8px;color:#1a1a2e}
      h1{text-align:center;font-size:16px;text-transform:uppercase;letter-spacing:3px;color:#374151;margin:24px 0;text-decoration:underline}
      .field{margin:8px 0}.field strong{display:inline-block;min-width:200px;color:#374151}
      .section{margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid #00C37E}
      .sig{margin-top:40px;border-top:1px solid #e5e7eb;padding-top:20px}
      .footer{margin-top:40px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb;padding-top:16px}
      @media print{body{margin:0;padding:20px}}
    </style>
    </head><body>
    <div class="header">
      <div class="logo">⚡ TASKEEU</div>
      <div class="company">${task.company?.company_name?.toUpperCase()}</div>
      <div style="color:#6b7280;font-size:12px;margin-top:4px">${task.company?.company_address || ''}</div>
    </div>

    <h1>Letter of Authorization for Field Task</h1>

    <p>Date: <strong>${letterDate}</strong></p>
    <p>Reference: <strong>TKU-ENT-${task.id.substring(0, 8).toUpperCase()}</strong></p>

    <p>To Whom It May Concern,</p>

    <p>This letter serves to confirm that the individual named below has been officially authorized by <strong>${task.company?.company_name}</strong>, through the Taskeeu for Teams field operations platform, to carry out the following task on behalf of our organization.</p>

    <div class="section">
      <strong>AUTHORIZED FIELD AGENT DETAILS</strong><br/><br/>
      <div class="field"><strong>Full Name:</strong> ${bid.tasker?.full_name}</div>
      <div class="field"><strong>Email:</strong> ${bid.tasker?.email}</div>
      <div class="field"><strong>Location:</strong> ${taskerProfile?.task_city || ''}, ${taskerProfile?.task_state || ''}</div>
      <div class="field"><strong>Address:</strong> ${taskerProfile?.home_address || 'On file with Taskeeu'}</div>
    </div>

    <div class="section">
      <strong>TASK DETAILS</strong><br/><br/>
      <div class="field"><strong>Task Type:</strong> ${taskTypeName}</div>
      <div class="field"><strong>Description:</strong> ${task.title}</div>
      <div class="field"><strong>Deployment State(s):</strong> ${states}</div>
      <div class="field"><strong>Commencement Date:</strong> ${commenceDate}</div>
      <div class="field"><strong>Duration:</strong> ${task.duration_days} day(s)</div>
      <div class="field"><strong>SLA:</strong> ${task.sla_hours} hours</div>
    </div>

    <div class="section">
      <strong>AUTHORIZING OFFICER</strong><br/><br/>
      <div class="field"><strong>Name:</strong> ${task.member?.first_name} ${task.member?.last_name}</div>
      <div class="field"><strong>Designation:</strong> ${task.member?.job_role}</div>
      <div class="field"><strong>Company Email:</strong> ${task.member?.work_email}</div>
      <div class="field"><strong>Company Domain:</strong> @${task.company?.company_domain}</div>
    </div>

    <p>The bearer of this letter has undergone full KYC verification on the Taskeeu platform and is a verified, approved field agent. Any queries or concerns regarding this authorization should be directed to the authorizing officer or to Taskeeu Technologies Ltd.</p>

    <div class="sig">
      <p>Yours faithfully,</p><br/>
      <p><strong>${task.member?.first_name} ${task.member?.last_name}</strong><br/>
      ${task.member?.job_role}<br/>
      ${task.company?.company_name}<br/>
      Facilitated by Taskeeu Technologies Ltd.</p>
    </div>

    <div class="footer">
      This authorization letter was generated by Taskeeu for Teams — Africa's Field Operations Infrastructure Platform<br/>
      Verify authenticity at: taskeeu.com/verify/${task.id} | taskeeu.com/contact
    </div>
    </body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="authorization-letter-${bid.id.substring(0,8)}.html"`);
    res.send(html);
  } catch (err) {
    res.status(500).send('Failed to generate letter');
  }
});

// ── POST /enterprise-tasks/:id/proofs — tasker uploads GPS proof ──
router.post('/:id/proofs', authenticate, uploadProof.array('proofs', 10), async (req, res) => {
  try {
    const { bid_id, gps_lat, gps_lng, gps_address, taken_at, caption } = req.body;
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'At least one proof file required' });

    // Upload all files to Cloudinary via buffer
    const uploadedUrls = await Promise.all(
      req.files.map(f => uploadProofBuffer(f.buffer).then(r => ({ url: r.secure_url, mimetype: f.mimetype })))
    );

    const proofs = uploadedUrls.map(({ url, mimetype }) => ({
      enterprise_task_id: req.params.id,
      bid_id: bid_id || null,
      tasker_id: req.user.id,
      proof_type: mimetype.startsWith('video/') ? 'video' : 'gps_photo',
      file_url: url,
      gps_lat: gps_lat ? parseFloat(gps_lat) : null,
      gps_lng: gps_lng ? parseFloat(gps_lng) : null,
      gps_address: gps_address || null,
      taken_at: taken_at || null,
      caption: caption || null,
    }));

    const { data: inserted, error } = await supabase.from('enterprise_task_proofs').insert(proofs).select();
    if (error) throw error;

    // Notify member that proofs uploaded
    const { data: task } = await supabase.from('enterprise_tasks')
      .select('title, member:company_members(work_email,first_name)').eq('id', req.params.id).maybeSingle();

    if (task?.member?.work_email) {
      await sendEmail(task.member.work_email, `📸 Proof Uploaded — ${task.title}`, teamsEmail(`
        <p>Hi ${task.member.first_name}, a tasker has uploaded ${req.files.length} proof file(s) for task <strong>${task.title}</strong>.</p>
        <p>Please review and approve the proofs in your dashboard.</p>
        <a href="${process.env.FRONTEND_URL}/teams/dashboard" class="btn">Review Proofs →</a>
      `));
    }

    res.status(201).json({ success: true, message: `${inserted.length} proof(s) uploaded`, proofs: inserted });
  } catch (err) {
    console.error('[enterprise-tasks.js] Upload failed:', err?.message);
      res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// ── POST /enterprise-tasks/:id/proofs/:proofId/approve ───────────
router.post('/:id/proofs/:proofId/approve', authenticate, async (req, res) => {
  try {
    const { approved, rejection_note } = req.body;
    await supabase.from('enterprise_task_proofs').update({
      is_approved: approved,
      approved_by: req.user.id,
      approved_at: approved ? new Date().toISOString() : null,
      rejection_note: rejection_note || null,
    }).eq('id', req.params.proofId);

    if (approved) {
      // Check if all proofs approved → mark task complete & schedule payout
      const { data: allProofs } = await supabase
        .from('enterprise_task_proofs').select('is_approved').eq('enterprise_task_id', req.params.id);
      const allApproved = allProofs?.every(p => p.is_approved === true);
      if (allApproved) {
        await supabase.from('enterprise_tasks').update({
          status: 'completed', completed_at: new Date().toISOString()
        }).eq('id', req.params.id);
      }
    }

    res.json({ success: true, message: `Proof ${approved ? 'approved' : 'rejected'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Action failed' });
  }
});

// ── POST /enterprise-tasks/:id/blacklist-tasker ───────────────────
router.post('/:id/blacklist-tasker', authenticate, async (req, res) => {
  try {
    const { tasker_id, reason } = req.body;
    const { data: task } = await supabase.from('enterprise_tasks').select('company_id').eq('id', req.params.id).maybeSingle();
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error } = await supabase.from('company_tasker_blacklist').insert({
      company_id: task.company_id, tasker_id, blacklisted_by: req.user.id, reason,
    });
    if (error?.code === '23505') return res.status(409).json({ success: false, message: 'Already blacklisted' });
    if (error) throw error;

    res.json({ success: true, message: 'Tasker blacklisted from future tasks' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Blacklist failed' });
  }
});

// ── POST /enterprise-tasks/:id/broadcast ─────────────────────────
router.post('/:id/broadcast', authenticate, async (req, res) => {
  try {
    const { message, attachment_url } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required' });

    // Get all accepted taskers for this task
    const { data: acceptedBids } = await supabase
      .from('enterprise_task_bids')
      .select('tasker_id, tasker:users!tasker_id(email, full_name)')
      .eq('enterprise_task_id', req.params.id).eq('status', 'accepted');

    if (!acceptedBids?.length) return res.status(400).json({ success: false, message: 'No accepted taskers to broadcast to' });

    const { data: task } = await supabase.from('enterprise_tasks').select('title, company:companies(company_name)').eq('id', req.params.id).maybeSingle();

    const { data: broadcast } = await supabase.from('enterprise_broadcasts').insert({
      enterprise_task_id: req.params.id,
      sent_by: req.user.id, message, attachment_url: attachment_url || null,
      recipient_count: acceptedBids.length,
    }).select().maybeSingle();

    // Send notification + email to all accepted taskers
    const notifs = acceptedBids.map(b => ({
      user_id: b.tasker_id, type: 'enterprise_broadcast',
      title: `📢 Team Message — ${task?.company?.company_name}`,
      message: message.substring(0, 120),
      data: { enterprise_task_id: req.params.id, broadcast_id: broadcast?.id },
    }));
    (async () => {
      try {
        await supabase.from('notifications').insert(notifs);
      } catch (_) {}
    })();

    for (const b of acceptedBids) {
      await sendEmail(b.tasker.email, `📢 Group Message — ${task?.title}`, teamsEmail(`
        <p>Hi ${b.tasker.full_name},</p>
        <p>A group message from <strong>${task?.company?.company_name}</strong> regarding task <strong>${task?.title}</strong>:</p>
        <div class="box"><p>${message}</p></div>
        ${attachment_url ? `<p><a href="${attachment_url}" style="color:#00C37E">View Attachment</a></p>` : ''}
        <a href="${process.env.FRONTEND_URL}/tasker/dashboard" class="btn">Open Dashboard →</a>
      `));
    }

    res.json({ success: true, message: `Broadcast sent to ${acceptedBids.length} tasker(s)`, broadcast });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Broadcast failed' });
  }
});

// ── POST /enterprise-tasks/:id/meeting ───────────────────────────
router.post('/:id/meeting', authenticate, async (req, res) => {
  try {
    const { meeting_title, scheduled_at, duration_minutes, notes } = req.body;

    // Generate Jitsi room ID
    const roomId = `taskeeu-${req.params.id.substring(0,8)}-${Date.now()}`;
    const meetingUrl = `https://meet.jit.si/${roomId}`;

    const { data: meeting } = await supabase.from('enterprise_meetings').insert({
      enterprise_task_id: req.params.id,
      created_by: req.user.id,
      meeting_title: meeting_title || 'Task Alignment Meeting',
      jitsi_room_id: roomId,
      meeting_url: meetingUrl,
      scheduled_at: scheduled_at || new Date().toISOString(),
      duration_minutes: duration_minutes || 60,
      notes,
    }).select().maybeSingle();

    // Notify accepted taskers
    const { data: acceptedBids } = await supabase
      .from('enterprise_task_bids')
      .select('tasker_id, tasker:users!tasker_id(email,full_name)')
      .eq('enterprise_task_id', req.params.id).eq('status', 'accepted');

    const { data: task } = await supabase.from('enterprise_tasks')
      .select('title, company:companies(company_name)').eq('id', req.params.id).maybeSingle();

    for (const b of acceptedBids || []) {
      await sendEmail(b.tasker.email, `📅 Meeting Scheduled — ${meeting_title || 'Task Alignment'}`, teamsEmail(`
        <p>Hi ${b.tasker.full_name},</p>
        <p>A virtual meeting has been scheduled for task <strong>${task?.title}</strong>:</p>
        <div class="box">
          <p><strong>Meeting:</strong> ${meeting_title || 'Task Alignment Meeting'}</p>
          <p><strong>Scheduled:</strong> ${scheduled_at ? new Date(scheduled_at).toLocaleString('en-NG') : 'Now'}</p>
          <p><strong>Duration:</strong> ${duration_minutes || 60} minutes</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
        <a href="${meetingUrl}" class="btn">Join Meeting →</a>
        <p style="font-size:12px;color:#9ca3af">Click the button above to join directly. No account required.</p>
      `));
    }

    res.status(201).json({ success: true, meeting, meeting_url: meetingUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Meeting creation failed' });
  }
});

// ── GET /enterprise-tasks/tasker/available — tasker sees enterprise tasks ─


module.exports = router;

// ── GET /enterprise-tasks/company/:companyId/file-history ─────────
router.get('/company/:companyId/file-history', authenticate, async (req, res) => {
  try {
    const { department_id, task_id, tasker_id, from_date, to_date, approved, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = supabase
      .from('company_task_file_history')
      .select('*', { count: 'exact' })
      .eq('company_id', req.params.companyId)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (task_id) q = q.eq('enterprise_task_id', task_id);
    if (tasker_id) q = q.eq('tasker_id', tasker_id);
    if (department_id) q = q.eq('department_id', department_id);
    if (from_date) q = q.gte('uploaded_at', from_date);
    if (to_date) q = q.lte('uploaded_at', to_date);
    if (approved !== undefined) q = q.eq('is_approved', approved === 'true');

    const { data: files, error, count } = await q;
    if (error) throw error;

    res.json({
      success: true,
      files: files || [],
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('File history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch file history' });
  }
});

// ── GET /enterprise-tasks/:id/proofs — get all proofs for a task ──
router.get('/:id/proofs', authenticate, async (req, res) => {
  try {
    const { data: proofs, error } = await supabase
      .from('enterprise_task_proofs')
      .select('*, tasker:users!tasker_id(full_name, avatar_url)')
      .eq('enterprise_task_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, proofs: proofs || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// ── POST /enterprise-tasks/company/:companyId/team-leader-rights ──
// HR approves team leader full rights
router.post('/company/:companyId/team-leader-rights/:memberId', authenticate, async (req, res) => {
  try {
    const { action } = req.body; // approve | reject
    const { data: member } = await supabase
      .from('company_members')
      .select('work_email, first_name, last_name')
      .eq('id', req.params.memberId)
      .maybeSingle();

    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    if (action === 'approve') {
      await supabase.from('company_members').update({
        permission_level: 'dept_leader',
        leader_right_status: 'approved',
        leader_right_approved_at: new Date().toISOString(),
        leader_right_approved_by: req.user.id,
      }).eq('id', req.params.memberId);

      await sendEmail(member.work_email, '✅ Team Leader Rights Granted!', teamsEmail(`
        <p>Hi ${member.first_name},</p>
        <p>Your <strong>Team Leader</strong> privileges have been approved by HR. You now have full access to manage your department team members and tasks.</p>
        <a href="${process.env.FRONTEND_URL}/teams/dashboard" class="btn">Open Dashboard →</a>
      `));
    } else {
      await supabase.from('company_members').update({
        leader_right_status: 'rejected',
        permission_level: 'member',
      }).eq('id', req.params.memberId);
    }

    res.json({ success: true, message: `Team Leader rights ${action}d` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Action failed' });
  }
});
