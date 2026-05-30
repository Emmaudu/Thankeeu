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

module.exports = {
  OCCASION_CONFIGS,
  getOccasionTypes, createOccasionType,
  downloadOccasionTemplate, importOccasionMembers,
  getOccasionMembers, deleteOccasionMember,
};
