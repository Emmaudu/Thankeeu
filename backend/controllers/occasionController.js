const XLSX = require('xlsx');
const supabase = require('../utils/supabase');
const { nanoid } = require('nanoid');

// All possible occasion types with their template columns
const OCCASION_CONFIGS = {
  birthday:         { label: 'Birthday',          icon: '🎂', dateCol: 'Birthday (DD-MM-YY)',   genderCol: false, notifyDays: 2 },
  leaving:          { label: 'Leaving Company',   icon: '👋', dateCol: 'Last Day (DD-MM-YYYY)', genderCol: false, notifyDays: 7 },
  work_anniversary: { label: 'Work Anniversary',  icon: '🏆', dateCol: 'Start Date (DD-MM-YYYY)',genderCol: false, notifyDays: 7 },
  promotion:        { label: 'Promotion',          icon: '🌟', dateCol: 'Promotion Date (DD-MM-YYYY)', genderCol: false, notifyDays: 7 },
  wedding:          { label: 'Wedding',            icon: '💍', dateCol: 'Wedding Date (DD-MM-YYYY)', genderCol: false, notifyDays: 7 },
  valentines_day:   { label: "Valentine's Day",   icon: '💝', dateCol: 'Date (DD-MM-YYYY)',     genderCol: false, notifyDays: 7 },
  womens_day:       { label: "Women's Day",        icon: '👩', dateCol: 'Date (DD-MM-YYYY)',     genderCol: true,  notifyDays: 7, gender: 'female' },
  mens_day:         { label: "Men's Day",          icon: '👨', dateCol: 'Date (DD-MM-YYYY)',     genderCol: true,  notifyDays: 7, gender: 'male'   },
  workers_day:      { label: "Workers' Day",       icon: '✊', dateCol: 'Date (DD-MM-YYYY)',     genderCol: false, notifyDays: 7 },
  graduation:       { label: 'Graduation',         icon: '🎓', dateCol: 'Graduation Date (DD-MM-YYYY)', genderCol: false, notifyDays: 7 },
  new_baby:         { label: 'New Baby',           icon: '👶', dateCol: 'Due/Birth Date (DD-MM-YYYY)', genderCol: false, notifyDays: 7 },
  retirement:       { label: 'Retirement',         icon: '🏖️', dateCol: 'Retirement Date (DD-MM-YYYY)', genderCol: false, notifyDays: 14 },
  new_hire:         { label: 'New Employee Welcome',icon: '🌟', dateCol: 'Start Date (DD-MM-YYYY)',       genderCol: false, notifyDays: 0,  isWelcome: true },
};

const parseDateCol = (raw) => {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!isNaN(s) && s.length > 3) {
    const d = XLSX.SSF.parse_date_code(parseInt(s));
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const parts = s.split(/[-\/]/);
  if (parts.length === 3) {
    let [d, m, y] = parts.map(Number);
    if (y < 100) y += y < 30 ? 2000 : 1900;
    return new Date(y, m - 1, d);
  }
  return null;
};

// GET /api/occasions — list all occasion types for company
const getOccasionTypes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('occasion_types')
      .select('*')
      .eq('company_id', req.company.id)
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    // Attach member counts
    const withCounts = await Promise.all((data || []).map(async (ot) => {
      const { count } = await supabase
        .from('occasion_members')
        .select('*', { count: 'exact', head: true })
        .eq('occasion_type_id', ot.id)
        .eq('is_active', true);
      return { ...ot, member_count: count || 0 };
    }));
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch occasion types' });
  }
};

// POST /api/occasions — create custom occasion type
const createOccasionType = async (req, res) => {
  try {
    const { name, label, icon, notify_days_before, gender_filter, default_scope } = req.body;
    const { data, error } = await supabase
      .from('occasion_types')
      .insert({ company_id: req.company.id, name, label, icon: icon || '🎉', notify_days_before: notify_days_before || 7, gender_filter, default_scope: default_scope || 'department' })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create occasion type' });
  }
};

// GET /api/occasions/:occasionTypeId/template — download Excel template
const downloadOccasionTemplate = (req, res) => {
  const { occasionName } = req.params;
  const config = OCCASION_CONFIGS[occasionName] || {
    label: occasionName, dateCol: 'Date (DD-MM-YYYY)', genderCol: false
  };

  const wb = XLSX.utils.book_new();
  const cols = ['First Name', 'Last Name', 'Email Address', 'Department'];
  if (config.genderCol) cols.push('Gender (male/female)');
  cols.push(config.dateCol);
  if (!['womens_day','mens_day','valentines_day','workers_day'].includes(occasionName)) {
    cols.push('Notes (optional)');
  }

  const sampleRows = occasionName === 'womens_day'
    ? [['Amaka', 'Okafor', 'amaka@company.com', 'Engineering', 'female', '08-03-2025']]
    : occasionName === 'mens_day'
    ? [['Emeka', 'Eze', 'emeka@company.com', 'Finance', 'male', '19-11-2025']]
    : [
        ['Amaka', 'Okafor', 'amaka@company.com', 'Engineering', '14-02-2025', ''],
        ['Tunde', 'Bello', 'tunde@company.com', 'Marketing', '22-06-2025', ''],
      ];

  const ws = XLSX.utils.aoa_to_sheet([[...cols], ...sampleRows]);
  ws['!cols'] = cols.map(() => ({ wch: 22 }));
  // Style header
  cols.forEach((_, i) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: i });
    if (ws[cell]) ws[cell].s = { font: { bold: true }, fill: { fgColor: { rgb: '7F77DD' } } };
  });
  XLSX.utils.book_append_sheet(wb, ws, config.label.replace("'", ""));
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="thankeeu_${occasionName}_template.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

// POST /api/occasions/:occasionTypeId/import — upload Excel for occasion
const importOccasionMembers = async (req, res) => {
  try {
    const { occasionTypeId } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { data: ot } = await supabase.from('occasion_types').select('*').eq('id', occasionTypeId).single();
    if (!ot || ot.company_id !== req.company.id) return res.status(404).json({ error: 'Occasion type not found' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rows.length < 2) return res.status(400).json({ error: 'File has no data rows' });

    const header = rows[0].map(h => String(h).toLowerCase().trim());
    const fnIdx = header.findIndex(h => h.includes('first'));
    const lnIdx = header.findIndex(h => h.includes('last'));
    const emIdx = header.findIndex(h => h.includes('email'));
    const dpIdx = header.findIndex(h => h.includes('dept') || h.includes('department'));
    const dtIdx = header.findIndex(h => h.includes('date') || h.includes('birthday') || h.includes('day'));
    const gnIdx = header.findIndex(h => h.includes('gender'));

    if ([fnIdx, lnIdx, emIdx, dpIdx, dtIdx].some(i => i < 0))
      return res.status(400).json({ error: 'Missing required columns. Please use the official template.' });

    const toInsert = [];
    const errors = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const first_name = String(row[fnIdx] || '').trim();
      const last_name  = String(row[lnIdx] || '').trim();
      const email      = String(row[emIdx] || '').trim().toLowerCase();
      const department = String(row[dpIdx] || '').trim();
      const dateRaw    = row[dtIdx];
      const gender     = gnIdx >= 0 ? String(row[gnIdx] || '').trim().toLowerCase() : (ot.gender_filter || null);

      if (!first_name && !last_name && !email) continue;
      if (!first_name || !last_name || !email || !department || !dateRaw) {
        errors.push(`Row ${i + 1}: Missing fields for ${first_name || '?'} ${last_name || ''}`);
        continue;
      }

      const dateObj = parseDateCol(dateRaw);
      if (!dateObj || isNaN(dateObj.getTime())) {
        errors.push(`Row ${i + 1}: Invalid date for ${first_name} ${last_name}`);
        continue;
      }

      // Gender filter — skip if wrong gender for gendered occasions
      if (ot.gender_filter && gender && gender !== ot.gender_filter) {
        errors.push(`Row ${i + 1}: ${first_name} ${last_name} skipped — gender mismatch for ${ot.label}`);
        continue;
      }

      toInsert.push({
        company_id: req.company.id,
        occasion_type_id: occasionTypeId,
        first_name, last_name, email, department,
        gender: gender || null,
        occasion_date: dateObj.toISOString().split('T')[0],
      });
    }

    if (toInsert.length === 0)
      return res.status(400).json({ error: 'No valid rows found', row_errors: errors });

    const { data, error } = await supabase
      .from('occasion_members')
      .upsert(toInsert, { onConflict: 'company_id,occasion_type_id,email' })
      .select();
    if (error) throw error;

    res.json({ message: `Imported ${data.length} members`, imported: data.length, row_errors: errors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed' });
  }
};

// GET /api/occasions/:occasionTypeId/members
const getOccasionMembers = async (req, res) => {
  try {
    const { occasionTypeId } = req.params;
    const { search, department } = req.query;

    let query = supabase
      .from('occasion_members')
      .select('*')
      .eq('company_id', req.company.id)
      .eq('occasion_type_id', occasionTypeId)
      .eq('is_active', true)
      .order('first_name');

    if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    if (department) query = query.eq('department', department);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// DELETE /api/occasions/:occasionTypeId/members/:memberId
const deleteOccasionMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    await supabase.from('occasion_members')
      .update({ is_active: false })
      .eq('id', memberId)
      .eq('company_id', req.company.id);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

// ── GENERAL MASTER TEMPLATE ──────────────────────────────────────────────────

// GET /api/occasions/general-template — download master Excel (6 sheets)
const downloadGeneralTemplate = (req, res) => {
  const wb = XLSX.utils.book_new();

  const hdStyle = { font:{ bold:true, color:{ rgb:'FFFFFF' } }, fill:{ fgColor:{ rgb:'5B4BDF' } } };
  const applyHd = (ws, cols) => {
    cols.forEach((_, i) => {
      const cell = XLSX.utils.encode_cell({ r:0, c:i });
      if (ws[cell]) ws[cell].s = hdStyle;
    });
    ws['!cols'] = cols.map(() => ({ wch:26 }));
  };

  // Sheet 1: General — populates ALL tables
  const g = ['First Name','Last Name','Email','Department','Role (member/leader)','Birthday (DD-MM-YYYY)','Gender (male/female)','Job Title','Phone'];
  const gd = [
    ['Amaka','Okafor','amaka@company.com','Engineering','leader','14-02-1990','female','Lead Engineer','08012345678'],
    ['Emeka','Eze','emeka@company.com','Marketing','member','20-06-1988','male','Marketing Executive','08098765432'],
    ['Kemi','Adeyemi','kemi@company.com','HR','member','05-11-1992','female','HR Officer','08023456789'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet([g, ...gd]); applyHd(ws1, g);
  XLSX.utils.book_append_sheet(wb, ws1, '📋 General (All Tables)');

  // Sheet 2: Promotions
  const p = ['First Name','Last Name','Email','Department','Promotion Level (1-10)','Promotion Date (DD-MM-YYYY)','Congratulatory Message','Scope (all/department)'];
  const pd = [['Tunde','Bello','tunde@co.com','Engineering','3','01-03-2025','Congratulations on your well-deserved promotion!','all']];
  const ws2 = XLSX.utils.aoa_to_sheet([p,...pd]); applyHd(ws2, p);
  XLSX.utils.book_append_sheet(wb, ws2, '🌟 Promotions');

  // Sheet 3: Farewells
  const fa = ['First Name','Last Name','Email','Department','Last Working Day (DD-MM-YYYY)','Farewell Message','Scope (all/department)'];
  const fd = [['Zainab','Ibrahim','z@co.com','Finance','28-02-2025','We will miss you dearly!','department']];
  const ws3 = XLSX.utils.aoa_to_sheet([fa,...fd]); applyHd(ws3, fa);
  XLSX.utils.book_append_sheet(wb, ws3, '👋 Farewells');

  // Sheet 4: Valentine's Day (Feb 14 — auto-filled)
  const vd = ["First Name","Last Name","Email","Department","Date (14-02 pre-filled)","Scope (all/department)"];
  const vdd = [['Amaka','Okafor','amaka@co.com','Engineering','14-02-2025','all'],['Emeka','Eze','emeka@co.com','Marketing','14-02-2025','all']];
  const ws4 = XLSX.utils.aoa_to_sheet([vd,...vdd]); applyHd(ws4, vd);
  XLSX.utils.book_append_sheet(wb, ws4, "💝 Valentine's Day (Feb 14)");

  // Sheet 5: Women's Day (Mar 8 — females only)
  const wd = ["First Name (Female only)","Last Name","Email","Department","Date (08-03 pre-filled)"];
  const wdd = [['Amaka','Okafor','amaka@co.com','Engineering','08-03-2025'],['Kemi','Adeyemi','kemi@co.com','HR','08-03-2025']];
  const ws5 = XLSX.utils.aoa_to_sheet([wd,...wdd]); applyHd(ws5, wd);
  XLSX.utils.book_append_sheet(wb, ws5, "👩 Women's Day (Mar 8)");

  // Sheet 6: Men's Day / Father's Day (Nov 19 — males only)
  const md = ["First Name (Male only)","Last Name","Email","Department","Date (19-11 pre-filled)"];
  const mdd = [['Emeka','Eze','emeka@co.com','Finance','19-11-2025'],['Tunde','Bello','tunde@co.com','Engineering','19-11-2025']];
  const ws6 = XLSX.utils.aoa_to_sheet([md,...mdd]); applyHd(ws6, md);
  XLSX.utils.book_append_sheet(wb, ws6, "👨 Men's/Father's Day (Nov 19)");

  const buf = XLSX.write(wb, { type:'buffer', bookType:'xlsx' });
  res.setHeader('Content-Disposition','attachment; filename="thankeeu_master_template.xlsx"');
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

// POST /api/occasions/import-general — populate all tables from master template
const importGeneralTemplate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error:'No file uploaded' });
    const companyId = req.company.id;
    const wb = XLSX.read(req.file.buffer, { type:'buffer' });
    let totalImported = 0; const errors = [];

    // Get occasion types for this company
    const { data: octypes } = await supabase.from('occasion_types').select('*').eq('company_id', companyId);
    const otMap = Object.fromEntries((octypes||[]).map(ot => [ot.name, ot]));

    // Process Sheet 1: General
    const ws1 = wb.Sheets['📋 General (All Tables)'] || wb.Sheets[wb.SheetNames[0]];
    if (ws1) {
      const rows = XLSX.utils.sheet_to_json(ws1, { header:1, defval:'' });
      const hdr = rows[0].map(h => String(h).toLowerCase());
      const fi = hdr.findIndex(h=>h.includes('first')), li = hdr.findIndex(h=>h.includes('last'));
      const ei = hdr.findIndex(h=>h.includes('email')), di = hdr.findIndex(h=>h.includes('dept'));
      const ri = hdr.findIndex(h=>h.includes('role')), bi = hdr.findIndex(h=>h.includes('birth'));
      const gi = hdr.findIndex(h=>h.includes('gender')), ji = hdr.findIndex(h=>h.includes('job'));
      const pi = hdr.findIndex(h=>h.includes('phone'));

      const { sendEmail } = require('../utils/email');
      const appUrl = process.env.APP_URL || 'https://thankeeu.com';
      const { data: companyData } = await supabase.from('companies').select('name').eq('id', companyId).single();

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const fn = String(row[fi]||'').trim(), ln = String(row[li]||'').trim();
        const email = String(row[ei]||'').trim().toLowerCase();
        if (!fn||!ln||!email) continue;
        const dept = String(row[di]||'').trim();
        const role = String(row[ri]||'').trim().toLowerCase() === 'leader' ? 'team_leader' : 'member';
        const bdRaw = row[bi]; const gender = String(row[gi]||'').trim().toLowerCase();
        const jt = ji>=0 ? String(row[ji]||'').trim() : null;
        const ph = pi>=0 ? String(row[pi]||'').trim() : null;

        // Upsert into company_members
        await supabase.from('company_members').upsert({
          company_id: companyId, first_name: fn, last_name: ln, email,
          department: dept, role, gender:gender||null, job_title:jt, phone:ph||null, status:'approved',
        }, { onConflict:'company_id,email' });

        // Birthday table
        if (bdRaw && otMap['birthday']) {
          const d = parseDateCol(bdRaw);
          if (d) await supabase.from('occasion_members').upsert({
            company_id:companyId, occasion_type_id:otMap['birthday'].id,
            first_name:fn, last_name:ln, email, department:dept, gender:gender||null,
            occasion_date: d.toISOString().split('T')[0],
          }, { onConflict:'company_id,occasion_type_id,email' });
        }
        // Women's Day (females → Mar 8)
        if (gender==='female' && otMap['womens_day']) {
          await supabase.from('occasion_members').upsert({
            company_id:companyId, occasion_type_id:otMap['womens_day'].id,
            first_name:fn, last_name:ln, email, department:dept, gender:'female',
            occasion_date:`${new Date().getFullYear()}-03-08`,
          }, { onConflict:'company_id,occasion_type_id,email' });
        }
        // Men's/Father's Day (males → Nov 19)
        if (gender==='male' && otMap['mens_day']) {
          await supabase.from('occasion_members').upsert({
            company_id:companyId, occasion_type_id:otMap['mens_day'].id,
            first_name:fn, last_name:ln, email, department:dept, gender:'male',
            occasion_date:`${new Date().getFullYear()}-11-19`,
          }, { onConflict:'company_id,occasion_type_id,email' });
        }
        // Valentine's Day (all → Feb 14)
        if (otMap['valentines_day']) {
          await supabase.from('occasion_members').upsert({
            company_id:companyId, occasion_type_id:otMap['valentines_day'].id,
            first_name:fn, last_name:ln, email, department:dept, gender:gender||null,
            occasion_date:`${new Date().getFullYear()}-02-14`,
          }, { onConflict:'company_id,occasion_type_id,email' });
        }

        // POINT 21: Send invite email
        await sendEmail({ to: email, template:'teamMemberInvite', data:{
          name: fn, companyName: companyData?.name||'Your Company',
          companyCode: companyId,
          inviteLink: `${appUrl}/member/signup?company=${companyId}`,
          appUrl,
        }}).catch(()=>{});

        totalImported++;
      }
    }
    res.json({ message:`Imported ${totalImported} employees across all tables`, imported:totalImported, errors });
  } catch (err) {
    console.error('importGeneralTemplate:', err);
    res.status(500).json({ error:'Import failed: '+err.message });
  }
};

// PUT /api/occasions/:occasionTypeId/scope — update notification scope for a whole table
const updateOccasionTypeScope = async (req, res) => {
  try {
    const { occasionTypeId } = req.params;
    const { default_scope } = req.body;
    if (!['all','department'].includes(default_scope))
      return res.status(400).json({ error:'Scope must be "all" or "department"' });
    const { error } = await supabase.from('occasion_types')
      .update({ default_scope, updated_at: new Date() })
      .eq('id', occasionTypeId).eq('company_id', req.company.id);
    if (error) throw error;
    res.json({ message:'Scope updated' });
  } catch (err) { res.status(500).json({ error:'Failed to update scope' }); }
};

// PUT /api/occasions/members/:memberId — edit a member row
const updateOccasionMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const allowed = ['first_name','last_name','email','department','occasion_date','gender','notes','notification_scope','farewell','promotion_level','farewell_scope','promotion_scope','promotion_message'];
    const updates = {};
    for (const k of allowed) { if (req.body[k] !== undefined) updates[k] = req.body[k]; }
    updates.updated_at = new Date();
    const { data, error } = await supabase.from('occasion_members')
      .update(updates).eq('id', memberId).eq('company_id', req.company.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error:'Failed to update' }); }
};

module.exports = {
  OCCASION_CONFIGS,
  getOccasionTypes, createOccasionType,
  downloadOccasionTemplate, importOccasionMembers,
  getOccasionMembers, deleteOccasionMember,
};
