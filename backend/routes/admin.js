const express = require('express');
const router  = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  getStats, getAllUsers, updateUserRole, deleteUser, giftCredits,
  getAllCards, deleteCard, redeliverCard,
  getAllCompanies, deleteCompany, getCompanyTeamMembers,
  getVisitors, setCompanyMultiplier, grantPilot,
  listPalApplications, approvePalGroup, rejectPalGroup,
} = require('../controllers/adminController');
const { adminListPalTickets, adminReplyPalTicket } = require('../controllers/palSupportController');
const { sendNudgeEmails } = require('../controllers/visitorsController');
const { validateUUIDParam } = require('../utils/paramGuard');

router.use(adminAuth);

router.get('/stats',    getStats);
router.get('/visitors', getVisitors);

// Nudge emails — trigger manually from admin panel
router.post('/visitors/nudge', async (req, res) => {
  try {
    await sendNudgeEmails();
    res.json({ ok: true, message: 'Nudge emails dispatched to eligible unconverted visitors.' });
  } catch (err) {
    console.error('admin nudge error:', err.message);
    res.status(500).json({ error: 'Nudge failed: ' + err.message });
  }
});

// Users
router.get('/users',                                         getAllUsers);
router.put('/users/:userId/role',     validateUUIDParam('userId'), updateUserRole);
router.post('/users/:userId/gift-credits', validateUUIDParam('userId'), giftCredits);
router.delete('/users/:userId',       validateUUIDParam('userId'), deleteUser);

// Cards
router.get('/cards',                                    getAllCards);
router.post('/cards/:cardId/redeliver', validateUUIDParam('cardId'), redeliverCard);
router.delete('/cards/:cardId',     validateUUIDParam('cardId'),    deleteCard);

// Companies — fixed routes before /:companyId wildcard
router.get('/companies',                                getAllCompanies);
router.get('/companies/:companyId/members', validateUUIDParam('companyId'), getCompanyTeamMembers);
router.post('/companies/:companyId/set-multiplier', validateUUIDParam('companyId'), setCompanyMultiplier);
router.post('/companies/:companyId/grant-pilot',    validateUUIDParam('companyId'), grantPilot);
router.delete('/companies/:companyId',  validateUUIDParam('companyId'), deleteCompany);

// Pals — fixed routes (tickets) before /:id wildcard
router.get('/pals',                    listPalApplications);
router.get('/pals/tickets',            adminListPalTickets);
router.put('/pals/tickets/:id/reply',  validateUUIDParam('id'), adminReplyPalTicket);
router.post('/pals/:id/approve',       validateUUIDParam('id'), approvePalGroup);
router.post('/pals/:id/reject',        validateUUIDParam('id'), rejectPalGroup);



// ── Broadcast email ────────────────────────────────────────────────────────
const supabase      = require('../utils/supabase');
const { sendEmail } = require('../utils/email');
const FRONTEND_URL  = process.env.FRONTEND_URL || 'https://thankeeu.com';

// Helper: fetch ALL distinct creator_ids who have at least one card
// Uses pagination to avoid Supabase's default 1000-row limit
async function getActiveUserIds() {
  const ids = new Set();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('cards')
      .select('creator_id')
      .not('creator_id', 'is', null)
      .range(from, from + PAGE - 1);
    if (error || !data?.length) break;
    data.forEach(r => { if (r.creator_id) ids.add(r.creator_id); });
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return [...ids];
}

// Helper: fetch ALL users with pagination (avoids Supabase 1000-row default limit)
async function fetchBroadcastUsers(extraFilter) {
  const users = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    let q = supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .neq('email', '')
      .not('email', 'is', null)
      .neq('role', 'admin')  // never email admin accounts
      .range(from, from + PAGE - 1);
    if (extraFilter) q = extraFilter(q);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    users.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return users;
}

router.post('/broadcast', async (req, res) => {
  try {
    const { subject, body, segment = 'all', test_email } = req.body;
    if (!subject?.trim()) return res.status(400).json({ error: 'Subject is required' });
    if (!body?.trim())    return res.status(400).json({ error: 'Email body is required' });

    // ── Test mode ───────────────────────────────────────────────────────────
    if (test_email) {
      const result = await sendEmail({
        to: test_email.trim(),
        subject,
        html: buildBroadcastHtml(body, FRONTEND_URL),
        reply_to: 'support@thankeeu.com',
      });
      if (!result.success) throw new Error('Failed to send test email');
      return res.json({ ok: true, sent: 1, message: `Test email sent to ${test_email}` });
    }

    // ── Fetch target users ──────────────────────────────────────────────────
    let users = [];
    const now = new Date();

    if (segment === 'active') {
      const activeIds = await getActiveUserIds();
      if (!activeIds.length) return res.json({ ok:true, sent:0, message:'No active users found' });
      // Fetch in batches since .in() also has limits
      const CHUNK = 400;
      for (let i = 0; i < activeIds.length; i += CHUNK) {
        const chunk = activeIds.slice(i, i + CHUNK);
        const batch = await fetchBroadcastUsers(q => q.in('id', chunk));
        users.push(...batch);
      }

    } else if (segment === 'inactive_30' || segment === 'inactive_90') {
      const days   = segment === 'inactive_90' ? 90 : 30;
      const cutoff = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
      const allOld = await fetchBroadcastUsers(q => q.lte('created_at', cutoff));
      const activeIds = new Set(await getActiveUserIds());
      users = allOld.filter(u => !activeIds.has(u.id));

    } else if (segment === 'visitors') {
      // Unconverted visitors who have an email (not yet registered users)
      let from = 0;
      const PAGE = 1000;
      const visitorRows = [];
      while (true) {
        const { data, error } = await supabase
          .from('visitors')
          .select('email, full_name')
          .not('email', 'is', null)
          .neq('email', '')
          .is('converted_to_user', null)   // not yet signed up
          .range(from, from + PAGE - 1);
        if (error) throw new Error(error.message);
        if (!data?.length) break;
        visitorRows.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      users = visitorRows.map(v => ({ email: v.email, full_name: v.full_name || null }));

    } else {
      // 'all'
      users = await fetchBroadcastUsers();
    }
    if (!users?.length) return res.json({ ok:true, sent:0, message:'No users matched the selected segment' });

    // ── Send in batches of 10 with 300ms gap ───────────────────────────────
    let sent = 0, failed = 0;
    for (let i = 0; i < users.length; i += 10) {
      const batch = users.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map(u => sendEmail({
          to:       u.email,
          subject,
          html:     buildBroadcastHtml(body, FRONTEND_URL, u.full_name),
          reply_to: 'support@thankeeu.com',
        }))
      );
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value?.success) sent++;
        else failed++;
      });
      if (i + 10 < users.length) await new Promise(r => setTimeout(r, 300));
    }

    console.log(`[broadcast] segment=${segment} sent=${sent} failed=${failed} total=${users.length}`);
    return res.json({ ok:true, sent, failed, total: users.length, message: `Sent to ${sent} of ${users.length} users${failed ? ` (${failed} failed)` : ''}` });

  } catch (err) {
    console.error('broadcast error:', err.message);
    return res.status(500).json({ error: err.message || 'Broadcast failed' });
  }
});

// ── Preview: recipient count for a segment ─────────────────────────────────
router.get('/broadcast/preview', async (req, res) => {
  try {
    const { segment = 'all' } = req.query;
    const now = new Date();

    if (segment === 'active') {
      const activeIds = await getActiveUserIds();
      // Count only non-admin users in the active set
      let count = 0;
      const CHUNK = 400;
      for (let i = 0; i < activeIds.length; i += CHUNK) {
        const chunk = activeIds.slice(i, i + CHUNK);
        const { count: c } = await supabase.from('users')
          .select('id', { count:'exact', head:true })
          .in('id', chunk)
          .neq('role', 'admin');
        count += c || 0;
      }
      return res.json({ count });
    }

    if (segment === 'inactive_30' || segment === 'inactive_90') {
      const days   = segment === 'inactive_90' ? 90 : 30;
      const cutoff = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
      const allOld = await fetchBroadcastUsers(q => q.lte('created_at', cutoff));
      const activeIds = new Set(await getActiveUserIds());
      const count = allOld.filter(u => !activeIds.has(u.id)).length;
      return res.json({ count });
    }

    if (segment === 'visitors') {
      const { count, error } = await supabase
        .from('visitors')
        .select('id', { count: 'exact', head: true })
        .not('email', 'is', null)
        .neq('email', '')
        .is('converted_to_user', null);
      if (error) throw new Error(error.message);
      return res.json({ count: count || 0 });
    }

    // 'all' — count all non-admin users
    const { count, error } = await supabase.from('users')
      .select('id', { count:'exact', head:true })
      .neq('role', 'admin');
    if (error) throw new Error(error.message);
    return res.json({ count: count || 0 });

  } catch (err) {
    console.error('broadcast preview error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

function buildBroadcastHtml(body, frontendUrl, firstName) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim().split(' ')[0]},` : 'Hi there,';
  const htmlBody = body
    .split(/\n\n+/)
    .map(para => `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">${para.trim().replace(/\n/g,'<br>')}</p>`)
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F3FF;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.08);">
    <div style="background:linear-gradient(135deg,#7C3AED,#EC4899);padding:24px 32px;display:flex;align-items:center;gap:12px;">
      <img src="${frontendUrl}/android-chrome-192x192.png" alt="Thankeeu" style="height:40px;width:40px;border-radius:10px;flex-shrink:0;" onerror="this.style.display='none'">
      <span style="font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">thank<span style="opacity:0.85;">eeu</span></span>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#1a1a2e;">${greeting}</p>
      ${htmlBody}
      <div style="margin-top:28px;padding-top:24px;border-top:1px solid #EDE9FF;">
        <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
          You're receiving this because you have a Thankeeu account.<br>
          Questions? Reply to this email — it goes straight to <a href="mailto:support@thankeeu.com" style="color:#7C3AED;">support@thankeeu.com</a><br>
          <a href="${frontendUrl}/unsubscribe" style="color:#9CA3AF;font-size:11px;">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body></html>`;
}


module.exports = router;
