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
const {
  listDiscountCodes, createDiscountCode, toggleDiscountCode, deleteDiscountCode,
} = require('../controllers/discountCodeController');
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

// Discount codes
router.get('/discount-codes',                                            listDiscountCodes);
router.post('/discount-codes',                                           createDiscountCode);
router.put('/discount-codes/:id',   validateUUIDParam('id'),             toggleDiscountCode);
router.delete('/discount-codes/:id',validateUUIDParam('id'),             deleteDiscountCode);

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



// ── Site settings (movie music, etc.) ─────────────────────────────────────
const { uploadMusic } = require('../utils/cloudinary');

// GET all settings
router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase.from('site_settings').select('key, value, updated_at');
    if (error) throw new Error(error.message);
    // Return as flat object { key: value }
    const settings = {};
    for (const row of (data || [])) settings[row.key] = row.value;
    res.json({ ok: true, settings });
  } catch (err) {
    console.error('[admin/settings] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/music-upload — upload an MP3 to Cloudinary, save URL to site_settings
router.post('/music-upload', uploadMusic.single('music'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No music file uploaded' });

    // Cloudinary URL is in req.file.path (multer-storage-cloudinary sets it)
    const musicUrl = req.file.path || req.file.secure_url;
    if (!musicUrl) return res.status(500).json({ error: 'Upload succeeded but no URL returned' });

    // Persist to site_settings
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'movie_bg_music_url', value: musicUrl, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw new Error(error.message);

    console.log(`[admin] Movie BG music updated: ${musicUrl}`);
    res.json({ ok: true, url: musicUrl, message: 'Music uploaded and saved. All new Memory Movies will use this track.' });
  } catch (err) {
    console.error('[admin/music-upload] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/music — remove the current track (revert to generated ambient)
router.delete('/music', async (req, res) => {
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'movie_bg_music_url', value: null, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
    res.json({ ok: true, message: 'Music track removed. Movies will use generated ambient music.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── Cover designs (bulk upload per occasion) ──────────────────────────────
const { uploadCoverDesigns, deleteFile: deleteCloudinaryFile } = require('../utils/cloudinary');

// Canonical occasion list — kept in sync with frontend's OCCASION_BLUEPRINTS
// in occasionCardDesigns.js. Validated server-side so a typo or unexpected
// value can never silently create an orphan occasion no page will ever query.
const COVER_DESIGN_OCCASIONS = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'valentine', label: "Valentine's" },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'baby_shower', label: 'Baby shower' },
  { id: 'retirement', label: 'Retirement' },
  { id: 'congratulations', label: 'Congratulations' },
  { id: 'graduation', label: 'Graduation' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'christmas', label: 'Christmas' },
  { id: 'get_well', label: 'Get well' },
  { id: 'new_year', label: 'New Year' },
  { id: 'thank_you', label: 'Thank you' },
  { id: 'sympathy', label: 'Sympathy' },
  { id: 'good_luck', label: 'Good luck' },
  { id: 'leaving', label: 'Leaving' },
];
const VALID_COVER_OCCASION_IDS = new Set(COVER_DESIGN_OCCASIONS.map(o => o.id));

// GET /admin/cover-designs/occasions — the list to populate the dropdown
router.get('/cover-designs/occasions', (req, res) => {
  res.json({ ok: true, occasions: COVER_DESIGN_OCCASIONS });
});

// GET /admin/cover-designs?occasion=birthday — newest first (the "queue")
router.get('/cover-designs', async (req, res) => {
  try {
    const { occasion } = req.query;
    let query = supabase.from('cover_designs').select('*').order('created_at', { ascending: false });
    if (occasion) {
      if (!VALID_COVER_OCCASION_IDS.has(occasion)) return res.status(400).json({ error: 'Unknown occasion' });
      query = query.eq('occasion', occasion);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    res.json({ ok: true, designs: data || [] });
  } catch (err) {
    console.error('[admin/cover-designs GET] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/cover-designs — bulk upload. Field: occasion (text) + designs (files[]).
// Ordering guarantee: file[0] in the batch ends up newest (created_at is stamped
// in reverse so it sorts first), and the whole batch sorts above every design
// uploaded before it, because "now" is always later than any past created_at.
router.post('/cover-designs', uploadCoverDesigns.array('designs', 40), async (req, res) => {
  try {
    const { occasion } = req.body;
    if (!occasion || !VALID_COVER_OCCASION_IDS.has(occasion)) {
      return res.status(400).json({ error: 'A valid occasion is required' });
    }
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No design images were uploaded' });

    const baseTime = Date.now();
    const rows = files.map((file, i) => {
      const imageUrl = file.path || file.secure_url;
      return {
        occasion,
        name: (file.originalname || `Design ${i + 1}`).replace(/\.[a-z0-9]+$/i, '').slice(0, 100),
        image_url: imageUrl,
        cloudinary_public_id: file.filename || file.public_id || null,
        is_active: true,
        uploaded_by_admin_id: req.user?.id || null,
        // Stamp so file[0] sorts newest within this batch, all of them newer
        // than baseTime so the whole batch sorts above prior uploads too.
        created_at: new Date(baseTime + (files.length - i)).toISOString(),
      };
    });

    const { data, error } = await supabase.from('cover_designs').insert(rows).select();
    if (error) throw new Error(error.message);

    console.log(`[admin] Uploaded ${data.length} cover design(s) for occasion "${occasion}"`);
    res.status(201).json({
      ok: true,
      designs: data,
      message: `${data.length} design${data.length === 1 ? '' : 's'} uploaded and now showing first for ${occasion}.`,
    });
  } catch (err) {
    console.error('[admin/cover-designs POST] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/cover-designs/:id — remove one design (Cloudinary + DB)
router.delete('/cover-designs/:id', validateUUIDParam('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { data: design } = await supabase.from('cover_designs').select('cloudinary_public_id').eq('id', id).maybeSingle();
    if (!design) return res.status(404).json({ error: 'Design not found' });

    const { error } = await supabase.from('cover_designs').delete().eq('id', id);
    if (error) throw new Error(error.message);

    if (design.cloudinary_public_id) {
      deleteCloudinaryFile(design.cloudinary_public_id, 'image').catch(() => {}); // best-effort, non-blocking
    }
    res.json({ ok: true, message: 'Design deleted' });
  } catch (err) {
    console.error('[admin/cover-designs DELETE] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


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
        text: buildBroadcastText(body),
        reply_to: 'support@thankeeu.com',
        headers: { 'X-Entity-Ref-ID': `broadcast-test-${Date.now()}` },
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
          text:     buildBroadcastText(body, u.full_name),
          reply_to: 'support@thankeeu.com',
          headers:  { 'X-Entity-Ref-ID': `broadcast-${Date.now()}-${u.email}` },
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
    .map(para => `<p style="margin:0 0 18px;color:#1a1a1a;font-size:15px;line-height:1.8;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">${para.trim().replace(/\n/g,'<br>')}</p>`)
    .join('');
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="max-width:560px;margin:0 auto;padding:48px 32px;background:#ffffff;font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif;">
  <p style="margin:0 0 24px;font-size:15px;color:#1a1a1a;line-height:1.8;">${greeting}</p>
  ${htmlBody}
</div>
</body></html>`;
}

function buildBroadcastText(body, firstName) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim().split(' ')[0]},` : 'Hi there,';
  return `${greeting}\n\n${body}`;
}


module.exports = router;
