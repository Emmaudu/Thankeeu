const { sendEmail } = require('../utils/email');
const supabase = require('../utils/supabase');
const { getMemberOccasions } = require('../utils/occasionEngine');
const crypto = require('crypto');
const argon2 = require('argon2');
const { catchUpMemberCards } = require('../utils/catchUpCards');
const hashPassword = (plain) => argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();
const XLSX = require('xlsx');
const { nanoid } = require('nanoid');

// Download Excel template
const downloadTemplate = (req, res) => {
  const wb = XLSX.utils.book_new();
  const headers = [['First Name', 'Last Name', 'Email Address', 'Department', 'Birthday (DD-MM-YY)']];
  const sample = [
    ['Amaka', 'Okafor', 'amaka@company.com', 'Engineering', '14-02-90'],
    ['Emeka', 'Eze', 'emeka@company.com', 'Marketing', '20-06-88'],
    ['Kemi', 'Adeyemi', 'kemi@company.com', 'HR', '05-11-92'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...sample]);

  // Column widths
  ws['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 20 }];

  // Style header row
  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: '7F77DD' } }, alignment: { horizontal: 'center' } };
  ['A1','B1','C1','D1','E1'].forEach(cell => {
    if (ws[cell]) ws[cell].s = headerStyle;
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Team Members');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="thankeeu_team_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

// Parse birthday string DD-MM-YY or DD-MM-YYYY to valid date
const parseBirthday = (raw) => {
  if (!raw) return null;
  const str = String(raw).trim();
  // Handle Excel date serial numbers
  if (!isNaN(str) && str.length > 3) {
    const d = XLSX.SSF.parse_date_code(parseInt(str));
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  // DD-MM-YY or DD-MM-YYYY
  const parts = str.split(/[-\/]/);
  if (parts.length === 3) {
    let [d, m, y] = parts.map(Number);
    if (y < 100) y += y < 30 ? 2000 : 1900;
    return new Date(y, m - 1, d);
  }
  return null;
};

// Import team members from uploaded Excel
const importTeamMembers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (rows.length < 2) return res.status(400).json({ error: 'File has no data rows' });

    const header = rows[0].map(h => String(h).toLowerCase().trim());
    const fnIdx = header.findIndex(h => h.includes('first'));
    const lnIdx = header.findIndex(h => h.includes('last'));
    const emIdx = header.findIndex(h => h.includes('email'));
    const dpIdx = header.findIndex(h => h.includes('dept') || h.includes('department'));
    const bdIdx = header.findIndex(h => h.includes('birth'));

    if ([fnIdx, lnIdx, emIdx, dpIdx, bdIdx].some(i => i === -1))
      return res.status(400).json({ error: 'Template columns not found. Please use the official template.' });

    const toInsert = [];
    const errors = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const first_name = String(row[fnIdx] || '').trim();
      const last_name = String(row[lnIdx] || '').trim();
      const email = String(row[emIdx] || '').trim().toLowerCase();
      const department = String(row[dpIdx] || '').trim();
      const bdRaw = row[bdIdx];

      if (!first_name && !last_name && !email) continue; // skip blank rows

      if (!first_name || !last_name || !email || !department || !bdRaw) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      const bdDate = parseBirthday(bdRaw);
      if (!bdDate || isNaN(bdDate.getTime())) {
        errors.push(`Row ${i + 1}: Invalid birthday format for ${first_name} ${last_name}. Use DD-MM-YY`);
        continue;
      }

      toInsert.push({
        company_id: req.company.id,
        first_name,
        last_name,
        email,
        department,
        birthday: bdDate.toISOString().split('T')[0],
      });
    }

    if (toInsert.length === 0)
      return res.status(400).json({ error: 'No valid rows found', row_errors: errors });

    // Upsert into company_members (the authoritative login table).
    // For each member: if they already have a password or accepted invite, keep their
    // existing record intact (fill-gaps only). For brand-new / password-less members,
    // generate an invite_token so they can set their password via the email link.
    const appUrl = FRONTEND_URL;
    let co = null;
    try { const { data: coData } = await supabase.from('companies').select('name, contact_person').eq('id', req.company.id).maybeSingle(); co = coData; } catch {}

    const results = [];
    const inviteQueue = []; // { member, inviteToken }

    // Pre-generate ONE shared placeholder hash — reused for all new members.
    // invite_token is unique per member so each person's set-password link is individual.
    // This avoids N × 300ms argon2 calls that cause timeout on large imports.
    const sharedPlaceholderHash = await hashPassword(crypto.randomBytes(16).toString('hex'));

    // Batch-fetch ALL existing company_members in one query instead of N queries
    const importEmails = toInsert.map(r => r.email);
    const { data: existingRows } = await supabase
      .from('company_members')
      .select('id, password_hash, invite_token, invite_accepted, status, date_of_birth, resumption_date, gender')
      .eq('company_id', req.company.id)
      .in('email', importEmails);
    const existingByEmail = {};
    for (const m of (existingRows || [])) existingByEmail[m.email] = m;

    for (const row of toInsert) {
      const existing = existingByEmail[row.email] || null;

      const needsInvite = !existing?.password_hash && !existing?.invite_accepted;
      const inviteToken = needsInvite
        ? (existing?.invite_token || crypto.randomBytes(32).toString('hex'))
        : (existing?.invite_token || null);

      // Build the upsert row — fill gaps only for optional fields
      const fillGap = (existingVal, newVal) =>
        (existingVal === null || existingVal === undefined || existingVal === '') ? (newVal || null) : existingVal;

      const cmRow = {
        company_id:    req.company.id,
        first_name:    row.first_name,
        last_name:     row.last_name,
        email:         row.email,
        department:    row.department,
        date_of_birth: fillGap(existing?.date_of_birth, row.birthday),
        status:        existing?.status === 'deactivated' ? 'deactivated' : 'approved',
        updated_at:    new Date(),
      };

      if (needsInvite) {
        cmRow.invite_token  = inviteToken;
        // placeholder hash so the column is never null; will be replaced when member sets password
        cmRow.password_hash = existing?.password_hash || sharedPlaceholderHash;
      }

      const { data: upserted, error: upsertErr } = await supabase
        .from('company_members')
        .upsert(cmRow, { onConflict: 'company_id,email' })
        .select()
        .maybeSingle();

      if (upsertErr) {
        console.error(`Import upsert failed for ${row.email}:`, upsertErr.message);
        errors.push(`${row.email}: upsert failed — ${upsertErr.message}`);
        continue;
      }

      results.push(upserted);
      if (needsInvite && inviteToken) inviteQueue.push({ member: upserted || row, inviteToken });

    }

    // Also mirror into team_members for dashboard counts (legacy — non-blocking)
    setImmediate(async () => {
      await supabase
        .from('team_members')
        .upsert(toInsert, { onConflict: 'company_id,email', ignoreDuplicates: false })
        .select()
        .catch(() => {});
    });

    // Send set-password emails to members who don't have a password yet
    setImmediate(async () => {
      for (const { member, inviteToken } of inviteQueue) {
        const link = `${appUrl}/member/reset-password?token=${inviteToken}&email=${encodeURIComponent(member.email)}`;
        await sendEmail({
          to: member.email,
          template: 'teamMemberInvite',
          data: {
            name:        member.first_name,
            companyName: co?.name || 'Your Company',
            companyCode: req.company.id,
            inviteLink:  link,
            appUrl,
          },
        }).catch(() => {});
      }
    });

    const data = results;

    res.json({
      message: `Successfully imported ${data.length} team members`,
      imported: data.length,
      skipped: rows.length - 1 - toInsert.length,
      row_errors: errors,
    });

    // ── Catch-up notifications: run AFTER all members are in DB ──────────────
    const _teamsCompanyId = req.company.id;
    setImmediate(async () => {
      try {
        console.log('[teams import catchUp] starting for company', _teamsCompanyId, '— members:', results.filter(Boolean).length);
        const { data: companyRow } = await supabase
          .from('companies').select('*').eq('id', _teamsCompanyId).maybeSingle();
        if (!companyRow) { console.error('[teams import catchUp] company not found'); return; }
        for (const upserted of results.filter(Boolean)) {
          await catchUpMemberCards(upserted, companyRow).catch(e =>
            console.error(`[teams import catchUp] ${upserted.email}:`, e.message)
          );
        }
        console.log('[teams import catchUp] done');
      } catch (e) {
        console.error('[teams import catchUp batch] error:', e.message);
      }
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import team members' });
  }
};

// Get all team members with pagination + search
const getTeamMembers = async (req, res) => {
  try {
    const { search, department, page = 1, limit = 100 } = req.query;
    let query = supabase
      .from('team_members')
      .select('*')
      .eq('company_id', req.company.id)
      .eq('is_active', true)
      .order('first_name');

    if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    if (department) query = query.eq('department', department);

    const from = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(from, from + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ members: data || [], total: count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

// Get departments list
const getDepartments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('department')
      .eq('company_id', req.company.id)
      .eq('is_active', true);
    if (error) throw error;
    const depts = [...new Set(data.map(d => d.department))].sort();
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Delete a team member
const deleteTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const companyId = req.company.id;

    // Clean up all three tables so the member doesn't reappear on refresh
    await Promise.allSettled([
      supabase.from('team_members').delete().eq('id', memberId).eq('company_id', companyId),
      supabase.from('company_members').delete().eq('id', memberId).eq('company_id', companyId),
      supabase.from('occasion_members').delete().eq('member_id', memberId).eq('company_id', companyId),
    ]);

    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

// Teams dashboard data
const getTeamsDashboard = async (req, res) => {
  try {
    const companyId = req.company.id;
    const today     = new Date();
    const in30days  = new Date(today); in30days.setDate(today.getDate() + 30);

    // ── 1. Total members: union of company_members + distinct occasion_members ──
    const [{ data: cmRowsRaw }, { data: omRows }] = await Promise.all([
      supabase.from('company_members')
        .select('id, first_name, last_name, email, department, role, status, gender, date_of_birth, resumption_date, promotion_date, leaving_date')
        .eq('company_id', companyId),
      supabase.from('occasion_members')
        .select('email, first_name, last_name, department, gender')
        .eq('company_id', companyId)
        .eq('is_active', true),
    ]);
    // Exclude deactivated members — NULL status counts as active (not deactivated)
    const cmRows = (cmRowsRaw || []).filter(m => m.status !== 'deactivated');

    // Deduplicate by email — company_members is authoritative if both exist
    const cmEmails = new Set((cmRows || []).map(m => m.email?.toLowerCase()));
    const omOnly   = (omRows || []).filter(m => m.email && !cmEmails.has(m.email.toLowerCase()));
    // Deduplicate omOnly too (one email per person across occasion types)
    const omUnique = Object.values(
      omOnly.reduce((acc, m) => { acc[m.email.toLowerCase()] = m; return acc; }, {})
    );
    const allMembers = [...(cmRows || []), ...omUnique];
    const departments = [...new Set(allMembers.map(m => m.department).filter(Boolean))];

    // ── 2. Teams count = distinct departments ──────────────────────────────────
    const teamsCount = departments.length;

    // ── 3. Active cards ────────────────────────────────────────────────────────
    const { count: activeCards } = await supabase
      .from('cards').select('id', { count: 'exact', head: true })
      .eq('company_id', companyId).eq('status', 'active');

    // ── 4. Gifts collected from contributions ──────────────────────────────────
    const { data: cardRows } = await supabase
      .from('cards').select('total_collected')
      .eq('company_id', companyId);
    const totalCollected = (cardRows || []).reduce((s, c) => s + (c.total_collected || 0), 0);

    // ── 5. Upcoming occasions (all types, next 30 days) ────────────────────────
    // Computed directly from company_members + companies.country, the single
    // source of truth — no separate occasion_members query needed.
    const { data: companyForOccasions } = await supabase
      .from('companies').select('country').eq('id', companyId).maybeSingle();

    const OCCASION_LABELS = {
      birthday:         '🎂 Birthday',
      work_anniversary: '🏆 Work Anniversary',
      new_hire:         '🎉 New Hire',
      valentines_day:   '💝 Valentine Day',
      womens_day:       '👩 Womens Day',
      mens_day:         '👨 Mens Day',
      mothers_day:      '🌹 Mothers Day',
      fathers_day:      '👔 Fathers Day',
      workers_day:      '✊ Workers Day',
      promotion:        '⭐ Promotion',
      leaving:          '👋 Farewell',
    };

    // Upcoming occasions, computed directly from company_members (single
    // source of truth) — same logic the daily automation cron uses.
    const upcoming_occasions = [];
    {
      const todayMidnight = new Date(today); todayMidnight.setHours(0, 0, 0, 0);
      const year = todayMidnight.getFullYear();

      for (const m of allMembers) {
        const occasions = getMemberOccasions(m, companyForOccasions || {}, year);
        for (const occ of occasions) {
          const occDate = new Date(occ.occasionDate + 'T00:00:00');
          if (isNaN(occDate)) continue;
          const diff = Math.round((occDate - todayMidnight) / 86400000);
          if (diff < 0 || diff > 30) continue;

          upcoming_occasions.push({
            name: `${m.first_name} ${m.last_name}`,
            department: m.department || 'General',
            occasion_type: occ.occasionName,
            label: OCCASION_LABELS[occ.occasionName] || occ.occasionName,
            occasion_date: occ.occasionDate,
            days_until: diff,
          });
        }
      }
      upcoming_occasions.sort((a, b) => a.days_until - b.days_until);
    }

    // Response shape matches what CompanyDashboard frontend expects
    // Frontend reads: data.total_members, data.upcoming_occasions, data.active_cards etc.
    res.json({
      total_members:      allMembers.length,
      teams:              teamsCount,
      departments,
      upcoming_occasions: upcoming_occasions.slice(0, 20),
      active_cards:       activeCards || 0,
      total_collected:    totalCollected,
      // Legacy fields for backward compatibility
      stats: {
        total_members:  allMembers.length,
        departments:    teamsCount,
        active_cards:   activeCards || 0,
        total_collected: totalCollected,
      },
    });
  } catch (err) {
    console.error('getTeamsDashboard error:', err);
    res.status(500).json({ error: 'Failed to load teams dashboard' });
  }
};

module.exports = { downloadTemplate, importTeamMembers, getTeamMembers, getDepartments, deleteTeamMember, getTeamsDashboard };
