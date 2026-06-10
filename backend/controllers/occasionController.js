const XLSX   = require('xlsx');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
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
  new_hire:         { label: 'New Employee Welcome',icon: '🌟', dateCol: 'Start Date (DD-MM-YYYY)',       genderCol: false, notifyDays: 3,  isWelcome: true },
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
  const year = new Date().getFullYear();
  const wb   = XLSX.utils.book_new();

  const BASE = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title'];

  const hdStyle = (ws, cols) => {
    cols.forEach((_, i) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[cell]) ws[cell].s = { font:{ bold:true, color:{ rgb:'FFFFFF' } }, fill:{ fgColor:{ rgb:'5B4BDF' } } };
    });
    ws['!cols'] = cols.map(() => ({ wch: 24 }));
  };

  let cols, sampleRows, sheetName, notes;

  // Mother's Day: 2nd Sunday of May
  const md = new Date(year,4,1); const mdOff = (7-md.getDay())%7+8;
  const mothersDate = `${year}-05-${String(mdOff).padStart(2,'0')}`;
  // Father's Day: 3rd Sunday of June
  const fd = new Date(year,5,1); const fdOff = (7-fd.getDay())%7+15;
  const fathersDate = `${year}-06-${String(fdOff).padStart(2,'0')}`;

  switch (occasionName) {
    case 'birthday':
      cols = [...BASE, 'Date of Birth (YYYY-MM-DD)'];
      sampleRows = [
        ['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Content Writer','1992-05-15'],
        ['Tunde','Bello','tunde@co.com','08098765432','Marketing','leader','Marketing Lead','1988-11-22'],
      ];
      sheetName = '🎂 Birthday Import';
      notes = ['BIRTHDAY TEMPLATE — filter column: Date of Birth','','Relevant column: "Date of Birth (YYYY-MM-DD)"',
               'The system uses this to schedule birthday cards annually.','All genders included.','Format: YYYY-MM-DD  e.g. 1992-05-15'];
      break;
    case 'work_anniversary':
      cols = [...BASE, 'Work Start Date (YYYY-MM-DD)'];
      sampleRows = [
        ['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Content Writer','2020-03-01'],
        ['Emeka','Eze','emeka@co.com','08098765432','Finance','leader','Finance Head','2018-07-15'],
      ];
      sheetName = '🏆 Work Anniversary Import';
      notes = ['WORK ANNIVERSARY TEMPLATE — filter column: Work Start Date','','Relevant column: "Work Start Date (YYYY-MM-DD)"',
               'Anniversary cards fire on the same month/day each year.','All genders included.','Format: YYYY-MM-DD  e.g. 2020-03-01'];
      break;
    case 'new_hire':
      cols = [...BASE, 'Start Date (YYYY-MM-DD)'];
      sampleRows = [
        ['Kemi','Adeyemi','kemi@co.com','07012345678','HR','member','HR Associate','2025-02-10'],
        ['Segun','Ola','segun@co.com','08011122233','Product','member','Product Designer','2025-03-01'],
      ];
      sheetName = '🎉 New Hire Import';
      notes = ['NEW HIRE TEMPLATE — filter column: Start Date','','Relevant column: "Start Date (YYYY-MM-DD)"',
               'A welcome card is triggered on or just before the start date.','All genders included.','Format: YYYY-MM-DD'];
      break;
    case 'promotion':
      cols = [...BASE, 'Promotion Date (YYYY-MM-DD)', 'New Job Title (optional)', 'Congratulatory Message (optional)'];
      sampleRows = [
        ['Tunde','Bello','tunde@co.com','08098765432','Engineering','leader','Engineering Manager',
         '2025-03-01','Senior Manager','Congratulations on your well-deserved promotion!'],
      ];
      sheetName = '⭐ Promotion Import';
      notes = ['PROMOTION TEMPLATE — filter column: Promotion Date','','Relevant column: "Promotion Date (YYYY-MM-DD)"',
               'Cards are sent on or just before the Promotion Date.','All genders included.','Format: YYYY-MM-DD'];
      break;
    case 'leaving':
      cols = [...BASE, 'Last Working Day (YYYY-MM-DD)', 'Farewell Message (optional)'];
      sampleRows = [
        ['Zainab','Ibrahim','z@co.com','08055544433','Finance','member','Finance Analyst',
         '2025-02-28','We will miss you dearly! Wishing you all the best.'],
      ];
      sheetName = '👋 Farewell Import';
      notes = ['FAREWELL / LEAVING TEMPLATE — filter column: Last Working Day','','Relevant column: "Last Working Day (YYYY-MM-DD)"',
               'Farewell cards are triggered a few days before this date.','All genders included.','Format: YYYY-MM-DD'];
      break;
    case 'valentine':
      cols = [...BASE, `Valentine Date (${year}-02-14 pre-filled)`];
      sampleRows = [
        ['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Engineer',`${year}-02-14`],
        ['Emeka','Eze','emeka@co.com','08098765432','Marketing','member','Executive',`${year}-02-14`],
        ['Kemi','Adeyemi','kemi@co.com','07012345678','HR','leader','HR Lead',`${year}-02-14`],
      ];
      sheetName = "💝 Valentine's Day Import";
      notes = [`VALENTINE'S DAY TEMPLATE — ALL employees (Male & Female)`,``,
               `Date is pre-filled: ${year}-02-14 (February 14).`,
               `Applies to EVERYONE — no gender filter.`,`Simply list all team members to include.`];
      break;
    case 'womens_day':
      cols = [...BASE, 'Gender (must be: female)', `Women's Day Date (${year}-03-08 pre-filled)`];
      sampleRows = [
        ['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Engineer','female',`${year}-03-08`],
        ['Kemi','Adeyemi','kemi@co.com','07012345678','HR','leader','HR Lead','female',`${year}-03-08`],
      ];
      sheetName = "👩 Women's Day Import";
      notes = [`WOMEN'S DAY TEMPLATE — FEMALE employees only`,``,
               `Date is pre-filled: ${year}-03-08 (March 8).`,
               `IMPORTANT: Only female employees belong here.`,
               `Gender column must say "female" — other rows are skipped.`];
      break;
    case 'mothers_day':
      cols = [...BASE, 'Gender (must be: female)', `Mother's Day Date (${mothersDate} pre-filled)`];
      sampleRows = [
        ['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Engineer','female',mothersDate],
        ['Kemi','Adeyemi','kemi@co.com','07012345678','HR','leader','HR Lead','female',mothersDate],
      ];
      sheetName = "🌹 Mother's Day Import";
      notes = [`MOTHER'S DAY TEMPLATE — FEMALE employees only`,``,
               `Mother's Day ${year}: ${mothersDate} (2nd Sunday of May).`,
               `IMPORTANT: Only female employees belong here.`,
               `Gender column must say "female" — other rows are skipped.`];
      break;
    case 'fathers_day':
      cols = [...BASE, 'Gender (must be: male)', `Father's Day Date (${fathersDate} pre-filled)`];
      sampleRows = [
        ['Emeka','Eze','emeka@co.com','08098765432','Engineering','leader','Lead Dev','male',fathersDate],
        ['Tunde','Bello','tunde@co.com','08055544433','Finance','member','Analyst','male',fathersDate],
      ];
      sheetName = "👔 Father's Day Import";
      notes = [`FATHER'S DAY TEMPLATE — MALE employees only`,``,
               `Father's Day ${year}: ${fathersDate} (3rd Sunday of June).`,
               `IMPORTANT: Only male employees belong here.`,
               `Gender column must say "male" — other rows are skipped.`];
      break;
    default:
      cols = [...BASE, 'Date (YYYY-MM-DD)', 'Notes (optional)'];
      sampleRows = [['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Engineer','2025-06-01','']];
      sheetName = 'Import Template';
      notes = ['Fill in employee details and upload.'];
  }

  // Sheet 1: Data
  const ws = XLSX.utils.aoa_to_sheet([cols, ...sampleRows]);
  hdStyle(ws, cols);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Sheet 2: Instructions
  const instrRows = [...notes.map(n => [n]), [''], ['Column reference:'], ...cols.map((c,i) => [`  Column ${i+1}: ${c}`])];
  const wi = XLSX.utils.aoa_to_sheet(instrRows);
  wi['!cols'] = [{ wch: 72 }];
  if (wi['A1']) wi['A1'].s = { font: { bold:true, sz:13, color:{ rgb:'5B4BDF' } } };
  XLSX.utils.book_append_sheet(wb, wi, '📖 Instructions');

  const buf = XLSX.write(wb, { type:'buffer', bookType:'xlsx' });
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

    // Create member accounts + send invites for all successfully imported rows
    const { data: companyData } = await supabase.from('companies').select('name').eq('id', req.company.id).single();
    const frontendUrl = (process.env.FRONTEND_URL || 'https://thankeeu.com').replace(/\/$/, '');

    for (const row of toInsert) {
      const inviteToken = crypto.randomBytes(24).toString('hex');
      const tempPass    = crypto.randomBytes(8).toString('hex');
      const passHash    = await bcrypt.hash(tempPass, 12);
      const nameParts   = row.first_name ? [row.first_name, row.last_name] : ['Member', ''];

      // Upsert member account
      await supabase.from('company_members').upsert({
        company_id:    req.company.id,
        email:         row.email,
        first_name:    row.first_name,
        last_name:     row.last_name,
        department:    row.department,
        gender:        row.gender || null,
        role:          'member',
        status:        'approved',
        password_hash: passHash,
        invite_token:  inviteToken,
      }, { onConflict: 'company_id,email' }).catch(() => {});

      // Send invite email
      const setPasswordLink = `${frontendUrl}/member/reset-password?token=${inviteToken}&email=${encodeURIComponent(row.email)}`;
      await sendEmail({ to: row.email, template: 'teamMemberInvite', data: {
        name:        row.first_name,
        companyName: companyData?.name || 'Your Company',
        companyCode: req.company.id,
        inviteLink:  setPasswordLink,
        appUrl:      frontendUrl,
      }}).catch(() => {});
    }

    res.json({ message: `Imported ${data.length} members — accounts created and invites sent`, imported: data.length, row_errors: errors });
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

// GET /api/occasions/general-template — Master Excel with ALL occasions
const downloadGeneralTemplate = (req, res) => {
  const year = new Date().getFullYear();
  const wb   = XLSX.utils.book_new();

  // Mother's Day: 2nd Sunday of May
  const md = new Date(year,4,1); const mdOff = (7-md.getDay())%7+8;
  const mothersDate = `${year}-05-${String(mdOff).padStart(2,'0')}`;
  // Father's Day: 3rd Sunday of June
  const fd = new Date(year,5,1); const fdOff = (7-fd.getDay())%7+15;
  const fathersDate = `${year}-06-${String(fdOff).padStart(2,'0')}`;

  const hd = (ws, cols) => {
    cols.forEach((_,i) => {
      const cell = XLSX.utils.encode_cell({ r:0, c:i });
      if (ws[cell]) ws[cell].s = { font:{ bold:true, color:{ rgb:'FFFFFF' } }, fill:{ fgColor:{ rgb:'3B2FA0' } } };
    });
    ws['!cols'] = cols.map(() => ({ wch:26 }));
  };

  // ── SHEET 1: General Master (ALL columns — imports into ALL occasion tables) ──
  const masterCols = [
    'First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title',
    'Gender (male/female)',
    'Date of Birth (YYYY-MM-DD)',         // → Birthday table
    'Work Start Date (YYYY-MM-DD)',        // → Work Anniversary table
    'New Hire Start Date (YYYY-MM-DD)',    // → New Hire table
    'Promotion Date (YYYY-MM-DD)',         // → Promotion table (leave blank if not applicable)
    'Last Working Day (YYYY-MM-DD)',       // → Farewell/Leaving table (leave blank if not applicable)
    'Farewell Message (optional)',
    'Congratulatory Message (optional)',
  ];
  const masterRows = [
    ['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Content Writer',
     'female','1992-05-15','2020-01-10','','','','',''],
    ['Emeka','Eze','emeka@co.com','08098765432','Marketing','leader','Marketing Lead',
     'male','1988-11-22','2019-03-01','','','','',''],
    ['Kemi','Adeyemi','kemi@co.com','07012345678','HR','member','HR Associate',
     'female','1993-07-08','2021-06-01','','','','',''],
    ['Tunde','Bello','tunde@co.com','08055544433','Finance','member','Analyst',
     'male','1985-03-20','2018-09-01','','','','',''],
    // Example: new hire (leave Date of Birth and Work Start Date blank if unknown)
    ['Segun','Ola','segun@co.com','08011122233','Product','member','Product Designer',
     'male','','','2025-03-01','','','',''],
    // Example: employee being promoted
    ['Zainab','Ibrahim','zainab@co.com','08055511100','Finance','leader','Finance Manager',
     'female','1990-08-14','2017-05-01','','2025-03-01','','','Congratulations, Zainab!'],
    // Example: employee leaving
    ['Bola','Adeyemi','bola@co.com','08099988877','Operations','member','Operations Analyst',
     'female','1991-02-28','2019-11-01','','','2025-02-28','We will miss you!',''],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet([masterCols, ...masterRows]);
  hd(ws1, masterCols); XLSX.utils.book_append_sheet(wb, ws1, '📋 MASTER — Import All');

  // ── SHEET 2: How the master populates each table ──
  const ruleRows = [
    ['HOW THE MASTER TEMPLATE AUTO-POPULATES EACH OCCASION TABLE'],[''],
    ['Occasion Table','Gender Filter','Relevant Column','Rule'],
    ['Birthday','All (Male & Female)','Date of Birth','Added if Date of Birth is filled in'],
    ['Work Anniversary','All (Male & Female)','Work Start Date','Added if Work Start Date is filled in'],
    ['New Hire','All (Male & Female)','New Hire Start Date','Added if New Hire Start Date is filled in'],
    ['Valentine\'s Day','All (Male & Female)','Auto — Feb 14','Every row automatically goes here'],
    ['Women\'s Day','Female ONLY','Auto — Mar 8','Only rows where Gender = female'],
    ['Mother\'s Day','Female ONLY','Auto — 2nd Sun May','Only rows where Gender = female'],
    ['Father\'s Day','Male ONLY','Auto — 3rd Sun June','Only rows where Gender = male'],
    ['Promotion','All (Male & Female)','Promotion Date','Added only if Promotion Date is filled in'],
    ['Farewell / Leaving','All (Male & Female)','Last Working Day','Added only if Last Working Day is filled in'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(ruleRows);
  ws2['!cols'] = [{ wch:28 },{ wch:22 },{ wch:32 },{ wch:55 }];
  if (ws2['A1']) ws2['A1'].s = { font:{ bold:true, sz:13, color:{ rgb:'3B2FA0' } } };
  if (ws2['A3']) ws2['A3'].s = { font:{ bold:true, color:{ rgb:'FFFFFF' } }, fill:{ fgColor:{ rgb:'5B4BDF' } } };
  if (ws2['B3']) ws2['B3'].s = { font:{ bold:true, color:{ rgb:'FFFFFF' } }, fill:{ fgColor:{ rgb:'5B4BDF' } } };
  if (ws2['C3']) ws2['C3'].s = { font:{ bold:true, color:{ rgb:'FFFFFF' } }, fill:{ fgColor:{ rgb:'5B4BDF' } } };
  if (ws2['D3']) ws2['D3'].s = { font:{ bold:true, color:{ rgb:'FFFFFF' } }, fill:{ fgColor:{ rgb:'5B4BDF' } } };
  XLSX.utils.book_append_sheet(wb, ws2, '📖 How It Works');

  // ── SHEET 3: Birthday (Date of Birth) ──
  const bCols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title','Date of Birth (YYYY-MM-DD)'];
  const ws3 = XLSX.utils.aoa_to_sheet([bCols,['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Content Writer','1992-05-15']]);
  hd(ws3, bCols); XLSX.utils.book_append_sheet(wb, ws3, '🎂 Birthday');

  // ── SHEET 4: Work Anniversary (Work Start Date) ──
  const waCols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title','Work Start Date (YYYY-MM-DD)'];
  const ws4 = XLSX.utils.aoa_to_sheet([waCols,['Emeka','Eze','emeka@co.com','08098765432','Finance','leader','Finance Head','2018-07-15']]);
  hd(ws4, waCols); XLSX.utils.book_append_sheet(wb, ws4, '🏆 Work Anniversary');

  // ── SHEET 5: New Hire (Start Date) ──
  const nhCols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title','Start Date (YYYY-MM-DD)'];
  const ws5 = XLSX.utils.aoa_to_sheet([nhCols,['Kemi','Adeyemi','kemi@co.com','07012345678','HR','member','HR Associate','2025-02-10']]);
  hd(ws5, nhCols); XLSX.utils.book_append_sheet(wb, ws5, '🎉 New Hire');

  // ── SHEET 6: Valentine's Day (ALL employees, Feb 14) ──
  const vCols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title',`Valentine Date (${year}-02-14 pre-filled)`];
  const ws6 = XLSX.utils.aoa_to_sheet([vCols,
    ['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Engineer',`${year}-02-14`],
    ['Emeka','Eze','emeka@co.com','08098765432','Marketing','member','Executive',`${year}-02-14`],
  ]);
  hd(ws6, vCols); XLSX.utils.book_append_sheet(wb, ws6, "💝 Valentine's Day (All)");

  // ── SHEET 7: Women's Day (Female only, Mar 8) ──
  const wdCols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title','Gender (must be: female)',`Women's Day Date (${year}-03-08 pre-filled)`];
  const ws7 = XLSX.utils.aoa_to_sheet([wdCols,
    ['Amaka','Okafor','amaka@co.com','08012345678','Engineering','member','Engineer','female',`${year}-03-08`],
  ]);
  hd(ws7, wdCols); XLSX.utils.book_append_sheet(wb, ws7, "👩 Women's Day (Female)");

  // ── SHEET 8: Mother's Day (Female only, 2nd Sun May) ──
  const mdCols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title','Gender (must be: female)',`Mother's Day Date (${mothersDate} pre-filled)`];
  const ws8 = XLSX.utils.aoa_to_sheet([mdCols,
    ['Kemi','Adeyemi','kemi@co.com','07012345678','HR','leader','HR Lead','female',mothersDate],
  ]);
  hd(ws8, mdCols); XLSX.utils.book_append_sheet(wb, ws8, "🌹 Mother's Day (Female)");

  // ── SHEET 9: Father's Day (Male only, 3rd Sun June) ──
  const fdCols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title','Gender (must be: male)',`Father's Day Date (${fathersDate} pre-filled)`];
  const ws9 = XLSX.utils.aoa_to_sheet([fdCols,
    ['Emeka','Eze','emeka@co.com','08098765432','Engineering','leader','Lead Dev','male',fathersDate],
    ['Tunde','Bello','tunde@co.com','08055544433','Finance','member','Analyst','male',fathersDate],
  ]);
  hd(ws9, fdCols); XLSX.utils.book_append_sheet(wb, ws9, "👔 Father's Day (Male)");

  // ── SHEET 10: Promotion ──
  const prCols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title','Promotion Date (YYYY-MM-DD)','New Job Title (optional)','Congratulatory Message (optional)'];
  const ws10 = XLSX.utils.aoa_to_sheet([prCols,
    ['Tunde','Bello','tunde@co.com','08098765432','Engineering','leader','Eng Manager','2025-03-01','Senior Manager','Congratulations on your well-deserved promotion!'],
  ]);
  hd(ws10, prCols); XLSX.utils.book_append_sheet(wb, ws10, '⭐ Promotion');

  // ── SHEET 11: Farewell / Leaving ──
  const faCols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title','Last Working Day (YYYY-MM-DD)','Farewell Message (optional)'];
  const ws11 = XLSX.utils.aoa_to_sheet([faCols,
    ['Zainab','Ibrahim','z@co.com','08055544433','Finance','member','Finance Analyst','2025-02-28','We will miss you dearly!'],
  ]);
  hd(ws11, faCols); XLSX.utils.book_append_sheet(wb, ws11, '👋 Farewell / Leaving');

  const buf = XLSX.write(wb, { type:'buffer', bookType:'xlsx' });
  res.setHeader('Content-Disposition','attachment; filename="thankeeu_master_template.xlsx"');
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};
// POST /api/occasions/import-general — import master template → all occasion tables
const importGeneralTemplate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const companyId = req.company.id;
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });

    let totalImported = 0;
    const errors = [];

    // Mother's Day: 2nd Sunday of May
    const year = new Date().getFullYear();
    const md = new Date(year,4,1); const mdOff = (7-md.getDay())%7+8;
    const mothersDate = `${year}-05-${String(mdOff).padStart(2,'0')}`;
    // Father's Day: 3rd Sunday of June
    const fd = new Date(year,5,1); const fdOff = (7-fd.getDay())%7+15;
    const fathersDate = `${year}-06-${String(fdOff).padStart(2,'0')}`;

    // Helper: parse a cell that might be an Excel date serial or a YYYY-MM-DD string
    const parseDate = (val) => {
      if (!val && val !== 0) return null;
      const s = String(val).trim();
      if (!s) return null;
      // Excel date serial
      if (/^\d+(\.\d+)?$/.test(s) && Number(s) > 1000) {
        try {
          const d = XLSX.SSF.parse_date_code(Number(s));
          return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
        } catch { return null; }
      }
      // DD-MM-YYYY or DD/MM/YYYY
      const dmy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
      if (dmy) {
        const y = dmy[3].length===2 ? `20${dmy[3]}` : dmy[3];
        return `${y}-${String(dmy[2]).padStart(2,'0')}-${String(dmy[1]).padStart(2,'0')}`;
      }
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
      return null;
    };

    // Helper: upsert into occasion_members (using occasion_type string, not FK)
    const upsertOccasion = async (type, row) => {
      const { data: existing } = await supabase.from('occasion_members')
        .select('id')
        .eq('company_id', companyId)
        .eq('occasion_type', type)
        .eq('email', row.email)
        .maybeSingle();
      if (existing) {
        await supabase.from('occasion_members')
          .update({ ...row, updated_at: new Date() }).eq('id', existing.id);
      } else {
        await supabase.from('occasion_members').insert({ ...row, company_id: companyId, occasion_type: type });
      }
    };

    // Process the MASTER sheet (Sheet 1)
    const masterSheet = wb.Sheets['📋 MASTER — Import All'] || wb.Sheets[wb.SheetNames[0]];
    if (!masterSheet) return res.status(400).json({ error: 'Master sheet not found. Please use the official master template.' });

    const rows = XLSX.utils.sheet_to_json(masterSheet, { header: 1, defval: '' });
    if (rows.length < 2) return res.status(400).json({ error: 'No data rows found in master sheet.' });

    const hdr = rows[0].map(h => String(h).toLowerCase().trim());
    const ci = (kw) => hdr.findIndex(h => h.includes(kw));

    const fnI  = ci('first');    const lnI  = ci('last');      const emI = ci('email');
    const phI  = ci('phone');    const dpI  = ci('department'); const roI = ci('role');
    const jtI  = ci('job');      const gnI  = ci('gender');
    const dobI = ci('birth');                      // Date of Birth → birthday
    const wsI  = ci('work start');                 // Work Start Date → work_anniversary
    const nhI  = ci('new hire') >= 0 ? ci('new hire') : ci('start date'); // New Hire Start Date
    const prI  = ci('promotion date') >= 0 ? ci('promotion date') : ci('promotion');
    const lwI  = ci('last working');               // Last Working Day → leaving
    const fwI  = ci('farewell');                   // Farewell Message
    const cgI  = ci('congratulat');                // Congratulatory Message

    const { sendEmail } = require('../utils/email');
    const frontendUrl = (process.env.FRONTEND_URL || 'https://thankeeu.com').replace(/\/$/, '');
    const { data: companyData } = await supabase.from('companies').select('name, contact_person').eq('id', companyId).single();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fn    = String(row[fnI] || '').trim();
      const ln    = String(row[lnI] || '').trim();
      const email = String(row[emI] || '').trim().toLowerCase();
      if (!fn || !ln || !email) continue;

      const dept   = dpI >= 0 ? String(row[dpI] || '').trim() || 'General' : 'General';
      const role   = roI >= 0 && String(row[roI] || '').toLowerCase().includes('leader') ? 'leader' : 'member';
      const jt     = jtI >= 0 ? String(row[jtI] || '').trim() || null : null;
      const phone  = phI >= 0 ? String(row[phI] || '').trim() || null : null;
      const gender = gnI >= 0 ? String(row[gnI] || '').trim().toLowerCase() : null;
      const base   = { first_name: fn, last_name: ln, email, department: dept, gender: gender || null, is_active: true };

      // Upsert company_member
      const { data: member } = await supabase.from('company_members')
        .upsert({ company_id: companyId, first_name: fn, last_name: ln, email, department: dept,
                  role, gender: gender || null, job_title: jt, phone, status: 'approved' },
                 { onConflict: 'company_id,email' })
        .select('id').single()
        .catch(() => ({ data: null }));
      const memberId = member?.id;

      // Send invite email
      try {
        const inviteToken = require('crypto').randomBytes(32).toString('hex');
        if (memberId) await supabase.from('company_members').update({ invite_token: inviteToken }).eq('id', memberId);
        const link = `${frontendUrl}/member/reset-password?token=${inviteToken}&email=${encodeURIComponent(email)}`;
        await sendEmail({ to: email,
          subject: `Welcome to ${companyData?.name || 'your company'} on Thankeeu! 🎉`,
          html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;text-align:center;">
            <h2>Welcome, ${fn}!</h2>
            <p>${companyData?.contact_person || companyData?.name || 'Your HR team'} has added you to <strong>${companyData?.name || 'your company'}</strong> on Thankeeu.</p>
            <a href="${link}" style="display:inline-block;background:#7C3AED;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Set your password 🚀</a>
            <p style="color:#aaa;font-size:12px;">This link expires in 7 days.</p></div>`
        }).catch(() => {});
      } catch (_) {}

      const oBase = { ...base, member_id: memberId || null };

      // BIRTHDAY — filter: dobI filled
      const dob = dobI >= 0 ? parseDate(row[dobI]) : null;
      if (dob) {
        const mmdd = dob.slice(5); // MM-DD
        await upsertOccasion('birthday', { ...oBase, occasion_date: `${year}-${mmdd}` });
        totalImported++;
      }

      // WORK ANNIVERSARY — filter: wsI filled
      const wsd = wsI >= 0 ? parseDate(row[wsI]) : null;
      if (wsd) {
        await upsertOccasion('work_anniversary', { ...oBase, occasion_date: wsd });
        totalImported++;
      }

      // NEW HIRE — filter: nhI filled
      const nhd = nhI >= 0 ? parseDate(row[nhI]) : null;
      if (nhd) {
        await upsertOccasion('new_hire', { ...oBase, occasion_date: nhd });
        totalImported++;
      }

      // VALENTINE'S DAY — ALL employees
      await upsertOccasion('valentine', { ...oBase, occasion_date: `${year}-02-14` });
      totalImported++;

      // WOMEN'S DAY — females only
      if (gender === 'female') {
        await upsertOccasion('womens_day', { ...oBase, occasion_date: `${year}-03-08` });
        await upsertOccasion('mothers_day', { ...oBase, occasion_date: mothersDate });
        totalImported += 2;
      }

      // FATHER'S DAY — males only
      if (gender === 'male') {
        await upsertOccasion('fathers_day', { ...oBase, occasion_date: fathersDate });
        totalImported++;
      }

      // PROMOTION — filter: prI filled
      const prd = prI >= 0 ? parseDate(row[prI]) : null;
      if (prd) {
        const cgMsg = cgI >= 0 ? String(row[cgI] || '').trim() : '';
        await upsertOccasion('promotion', { ...oBase, occasion_date: prd,
          meta: JSON.stringify({ promotion_message: cgMsg || null }) });
        totalImported++;
      }

      // LEAVING / FAREWELL — filter: lwI filled
      const lwd = lwI >= 0 ? parseDate(row[lwI]) : null;
      if (lwd) {
        const fwMsg = fwI >= 0 ? String(row[fwI] || '').trim() : '';
        await upsertOccasion('leaving', { ...oBase, occasion_date: lwd, farewell: fwMsg || null });
        totalImported++;
      }
    }

    res.json({
      message: `✅ Master import complete! ${totalImported} occasion entries created/updated across all tables.`,
      imported: totalImported,
      errors,
    });
  } catch (err) {
    console.error('importGeneralTemplate error:', err);
    res.status(500).json({ error: `Import failed: ${err.message}` });
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


// POST /api/occasions/members/:memberId/trigger — immediately create card + notify for new_hire/promotion
const triggerOccasionNow = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { data: m } = await supabase.from('occasion_members')
      .select('*, occasion_types(*)').eq('id', memberId).eq('company_id', req.company.id).single();
    if (!m) return res.status(404).json({ error: 'Member not found' });

    const ot = m.occasion_types;
    if (!ot || !['new_hire','promotion'].includes(ot.name))
      return res.status(400).json({ error: 'Immediate trigger only available for New Hire and Promotion occasions' });

    // Check if already triggered this year
    if (m.last_dept_notified_at) {
      const yr = new Date(m.last_dept_notified_at).getFullYear();
      if (yr === new Date().getFullYear())
        return res.status(400).json({ error: 'Card already created for this occasion this year' });
    }

    const { data: company } = await supabase.from('companies').select('*').eq('id', req.company.id).single();
    const { nanoid } = require('nanoid');
    const slug      = `${m.first_name.toLowerCase()}-${ot.name.replace('_','-')}-${nanoid(6)}`;
    // 5-day signing window, then auto-deliver
    const sendDate  = new Date(Date.now() + 5 * 86400000);
    const deadline  = sendDate;
    const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://thankeeu.com').replace(/\/$/, '');

    // Guard: check no existing card with same slug pattern this year
    const { data: existingCard } = await supabase.from('cards')
      .select('id').eq('occasion_type_id', ot.id).eq('recipient_email', m.email)
      .gte('created_at', `${new Date().getFullYear()}-01-01`).maybeSingle();
    if (existingCard) return res.status(400).json({ error: 'Card already exists for this person this occasion year' });

    const { data: card } = await supabase.from('cards').insert({
      slug, recipient_name: `${m.first_name} ${m.last_name}`,
      recipient_email: m.email, occasion: ot.name,
      title: ot.name === 'promotion'
        ? `Congratulations on your promotion, ${m.first_name}! ${ot.icon}`
        : `Welcome to ${company.name}, ${m.first_name}! ${ot.icon}`,
      design_theme: 'rose_love', background_color: '#FBEAF0',
      status: 'active', is_gift_enabled: true, gift_type: 'pot',
      suggested_amount: 2500, send_date: sendDate.toISOString(),
      deadline: deadline.toISOString(), allow_private_messages: true,
      company_id: req.company.id, occasion_type_id: ot.id,
      notification_scope: ot.default_scope || 'department',
    }).select().single();
    if (!card) throw new Error('Card creation failed');

    await supabase.from('occasion_members')
      .update({ card_slug: slug, last_dept_notified_at: new Date() })
      .eq('id', memberId);

    // Create contribution wallet
    try {
      await supabase.from('contribution_wallets').insert({
        card_id: card.id, company_id: req.company.id,
        total_contributed: 0, platform_fee: 0, net_after_fee: 0, amount_to_celebrant: 0,
      });
    } catch {}

    // Notify colleagues
    let membersQuery = supabase.from('company_members')
      .select('email, first_name').eq('company_id', req.company.id).eq('status', 'approved').neq('email', m.email);
    if (ot.default_scope === 'department') membersQuery = membersQuery.eq('department', m.department);
    const { data: colleagues } = await membersQuery;

    const dlStr = deadline.toLocaleDateString('en', { day: 'numeric', month: 'long' });
    let sent = 0;
    for (const col of (colleagues || [])) {
      const tmpl = ot.name === 'new_hire' ? 'newHireDeptNotice' : 'occasionNotice';
      await sendEmail({ to: col.email, template: tmpl, data: {
        icon: ot.icon, occasionLabel: ot.label,
        newHireName: `${m.first_name} ${m.last_name}`, newHireFirstName: m.first_name,
        memberName: `${m.first_name} ${m.last_name}`, memberFirstName: m.first_name,
        department: m.department, companyName: company.name,
        startDate: new Date().toLocaleDateString('en', { day:'numeric', month:'long', year:'numeric' }),
        jobTitle: m.job_title || '',
        cardSlug: slug, giftEnabled: true,
        occasionDate: new Date().toLocaleDateString('en', { day:'numeric', month:'long' }),
        daysLeft: 5, deadline: dlStr,
      }}).catch(() => {});
      sent++;
    }

    res.json({ message: `Card created and ${sent} colleagues notified to sign. Card will be delivered in 5 days.`, card_slug: slug, sent });
  } catch (err) {
    console.error('triggerOccasionNow:', err);
    res.status(500).json({ error: err.message || 'Trigger failed' });
  }
};

// POST /api/occasions/import-by-name/:occasionName
// Import a per-occasion xlsx template directly by occasion name (not UUID)
// This is what the per-tab upload buttons call
const importByOccasionName = async (req, res) => {
  try {
    const { occasionName } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const companyId = req.company.id;
    const year      = new Date().getFullYear();

    // Mother's / Father's Day dates
    const md = new Date(year,4,1); const mdOff = (7-md.getDay())%7+8;
    const mothersDate = `${year}-05-${String(mdOff).padStart(2,'0')}`;
    const fd = new Date(year,5,1); const fdOff = (7-fd.getDay())%7+15;
    const fathersDate = `${year}-06-${String(fdOff).padStart(2,'0')}`;

    const parseDate = (val) => {
      if (!val && val !== 0) return null;
      const s = String(val).trim();
      if (!s) return null;
      if (/^\d+(\.\d+)?$/.test(s) && Number(s) > 1000) {
        try { const d = XLSX.SSF.parse_date_code(Number(s)); return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`; } catch { return null; }
      }
      const dmy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
      if (dmy) { const y = dmy[3].length===2?`20${dmy[3]}`:dmy[3]; return `${y}-${String(dmy[2]).padStart(2,'0')}-${String(dmy[1]).padStart(2,'0')}`; }
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
      return null;
    };

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rows.length < 2) return res.status(400).json({ error: 'No data rows found. Use the official template.' });

    const hdr = rows[0].map(h => String(h).toLowerCase().trim());
    const ci  = (kw) => hdr.findIndex(h => h.includes(kw));

    const fnI = ci('first');  const lnI = ci('last');  const emI = ci('email');
    const phI = ci('phone');  const dpI = ci('depart'); const roI = ci('role');
    const jtI = ci('job');    const gnI = ci('gender');

    if (fnI<0 || lnI<0 || emI<0) {
      return res.status(400).json({ error: 'Missing First Name, Last Name, or Email columns. Please use the official template.' });
    }

    const upsertOcc = async (type, row) => {
      const { data: ex } = await supabase.from('occasion_members')
        .select('id').eq('company_id', companyId).eq('occasion_type', type).eq('email', row.email).maybeSingle();
      if (ex) {
        await supabase.from('occasion_members').update({ ...row, updated_at: new Date() }).eq('id', ex.id);
      } else {
        await supabase.from('occasion_members').insert({ ...row, company_id: companyId, occasion_type: type });
      }
    };

    let imported = 0; const errors = [];
    const { sendEmail } = require('../utils/email');
    const frontendUrl = (process.env.FRONTEND_URL || 'https://thankeeu.com').replace(/\/$/, '');
    const { data: coData } = await supabase.from('companies').select('name,contact_person').eq('id', companyId).single();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fn    = String(row[fnI]||'').trim();
      const ln    = String(row[lnI]||'').trim();
      const email = String(row[emI]||'').trim().toLowerCase();
      if (!fn||!ln||!email) continue;

      const dept   = dpI>=0 ? String(row[dpI]||'').trim()||'General' : 'General';
      const role   = roI>=0 && String(row[roI]||'').toLowerCase().includes('leader') ? 'leader' : 'member';
      const jt     = jtI>=0 ? String(row[jtI]||'').trim()||null : null;
      const phone  = phI>=0 ? String(row[phI]||'').trim()||null : null;
      const gender = gnI>=0 ? String(row[gnI]||'').trim().toLowerCase()||null : null;

      // Upsert member
      const { data: member } = await supabase.from('company_members')
        .upsert({ company_id:companyId, first_name:fn, last_name:ln, email, department:dept, role, gender:gender||null, job_title:jt, phone, status:'approved' },
                 { onConflict:'company_id,email' }).select('id').single().catch(()=>({data:null}));
      const memberId = member?.id;

      // Send invite email
      try {
        const tok = require('crypto').randomBytes(32).toString('hex');
        if (memberId) await supabase.from('company_members').update({invite_token:tok}).eq('id',memberId);
        const link = `${frontendUrl}/member/reset-password?token=${tok}&email=${encodeURIComponent(email)}`;
        await sendEmail({ to:email, subject:`Welcome to ${coData?.name||'your company'} on Thankeeu! 🎉`,
          html:`<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;text-align:center;"><h2>Welcome, ${fn}!</h2><p>${coData?.contact_person||coData?.name||'HR'} added you to <strong>${coData?.name||'your company'}</strong> on Thankeeu.</p><a href="${link}" style="display:inline-block;background:#7C3AED;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">Set your password 🚀</a><p style="color:#aaa;font-size:12px;">Expires in 7 days.</p></div>`
        }).catch(()=>{});
      } catch(_) {}

      const base = { first_name:fn, last_name:ln, email, department:dept, gender:gender||null, is_active:true, member_id:memberId||null };

      try {
        switch(occasionName) {
          case 'birthday': {
            // date col: last column that has 'birth' or the last column overall
            const dtI = ci('birth')>=0 ? ci('birth') : hdr.length-1;
            const d = parseDate(row[dtI]);
            if (!d) { errors.push(`Row ${i+1}: invalid date for ${fn} ${ln}`); continue; }
            const mmdd = d.slice(5);
            await upsertOcc('birthday', {...base, occasion_date:`${year}-${mmdd}`});
            break;
          }
          case 'work_anniversary': {
            const dtI = ci('work start')>=0 ? ci('work start') : ci('start')>=0 ? ci('start') : hdr.length-1;
            const d = parseDate(row[dtI]);
            if (!d) { errors.push(`Row ${i+1}: invalid date`); continue; }
            await upsertOcc('work_anniversary', {...base, occasion_date:d});
            break;
          }
          case 'new_hire': {
            const dtI = ci('start')>=0 ? ci('start') : hdr.length-1;
            const d = parseDate(row[dtI]);
            if (!d) { errors.push(`Row ${i+1}: invalid date`); continue; }
            await upsertOcc('new_hire', {...base, occasion_date:d});
            break;
          }
          case 'promotion': {
            const dtI = ci('promotion date')>=0?ci('promotion date'):ci('promotion')>=0?ci('promotion'):hdr.length-3;
            const d = parseDate(row[dtI]);
            if (!d) { errors.push(`Row ${i+1}: invalid date`); continue; }
            const newTitle = hdr.findIndex(h=>h.includes('new job'))>=0 ? String(row[hdr.findIndex(h=>h.includes('new job'))]||'').trim() : null;
            const msg = hdr.findIndex(h=>h.includes('congratul'))>=0 ? String(row[hdr.findIndex(h=>h.includes('congratul'))]||'').trim() : null;
            await upsertOcc('promotion', {...base, occasion_date:d, meta:JSON.stringify({promotion_message:msg||null, new_title:newTitle||null})});
            break;
          }
          case 'leaving': {
            const dtI = ci('last working')>=0?ci('last working'):ci('leaving')>=0?ci('leaving'):hdr.length-2;
            const d = parseDate(row[dtI]);
            if (!d) { errors.push(`Row ${i+1}: invalid date`); continue; }
            const fwI2 = ci('farewell');
            const fw = fwI2>=0 ? String(row[fwI2]||'').trim()||null : null;
            await upsertOcc('leaving', {...base, occasion_date:d, farewell:fw});
            break;
          }
          case 'valentine': {
            await upsertOcc('valentine', {...base, occasion_date:`${year}-02-14`});
            break;
          }
          case 'womens_day': {
            if (gender && gender !== 'female') { errors.push(`Row ${i+1}: ${fn} skipped — not female`); continue; }
            await upsertOcc('womens_day', {...base, gender:'female', occasion_date:`${year}-03-08`});
            break;
          }
          case 'mothers_day': {
            if (gender && gender !== 'female') { errors.push(`Row ${i+1}: ${fn} skipped — not female`); continue; }
            await upsertOcc('mothers_day', {...base, gender:'female', occasion_date:mothersDate});
            break;
          }
          case 'fathers_day': {
            if (gender && gender !== 'male') { errors.push(`Row ${i+1}: ${fn} skipped — not male`); continue; }
            await upsertOcc('fathers_day', {...base, gender:'male', occasion_date:fathersDate});
            break;
          }
          default:
            errors.push(`Row ${i+1}: unknown occasion type ${occasionName}`);
            continue;
        }
        imported++;
      } catch(rowErr) {
        errors.push(`Row ${i+1}: ${rowErr.message}`);
      }
    }

    res.json({
      message: `✅ ${imported} records imported into ${occasionName.replace('_',' ')} table.`,
      imported, errors,
    });
  } catch(err) {
    console.error('importByOccasionName error:', err);
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
};

module.exports = {
  OCCASION_CONFIGS,
  getOccasionTypes, createOccasionType,
  downloadOccasionTemplate, importOccasionMembers, importByOccasionName,
  getOccasionMembers, deleteOccasionMember,
  downloadGeneralTemplate, importGeneralTemplate,
  updateOccasionTypeScope, updateOccasionMember, triggerOccasionNow,
};
