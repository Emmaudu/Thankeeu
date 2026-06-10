const { sendEmail } = require('../utils/email');
const supabase = require('../utils/supabase');
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

    // Upsert — update existing by email per company
    const { data, error } = await supabase
      .from('team_members')
      .upsert(toInsert, { onConflict: 'company_id,email', ignoreDuplicates: false })
      .select();

    if (error) throw error;

    // Point 21: Email every imported member
    setImmediate(async () => {
      const appUrl = process.env.APP_URL || 'https://thankeeu.com';
      let co = null;
      try { const { data } = await supabase.from('companies').select('name').eq('id', req.company.id).single(); co = data; } catch {}
      for (const m of (data||[])) {
        await sendEmail({ to: m.email, template:'teamMemberInvite', data:{
          name: m.first_name,
          companyName: co?.name || 'Your Company',
          companyCode: req.company.id,
          inviteLink: `${appUrl}/member/signup?company=${req.company.id}`,
          appUrl,
        }}).catch(()=>{});
      }
    });

    res.json({
      message: `Successfully imported ${data.length} team members`,
      imported: data.length,
      skipped: rows.length - 1 - toInsert.length,
      row_errors: errors,
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
    await supabase.from('team_members')
      .update({ is_active: false })
      .eq('id', memberId)
      .eq('company_id', req.company.id);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

// Teams dashboard data
const getTeamsDashboard = async (req, res) => {
  try {
    const companyId = req.company.id;
    const today = new Date();
    const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Read from company_members — include all statuses so count is accurate regardless
    const { data: members } = await supabase
      .from('company_members')
      .select('id, first_name, last_name, email, department, role, status, date_of_birth')
      .eq('company_id', companyId)
      .neq('status', 'deactivated');  // include pending + approved, exclude only deactivated

    const all = members || [];
    const departments = [...new Set(all.map(m => m.department).filter(Boolean))];

    // Active cards count
    const { count: activeCards } = await supabase
      .from('cards').select('id', { count: 'exact', head: true })
      .eq('company_id', companyId).eq('status', 'active');

    // Total gifts collected
    const { data: wallets } = await supabase
      .from('contribution_wallets').select('total_contributed')
      .eq('company_id', companyId);
    const totalCollected = (wallets || []).reduce((s, w) => s + (w.total_contributed || 0), 0);

    // Upcoming birthdays from occasion_members
    const { data: upcomingBdays } = await supabase
      .from('occasion_members')
      .select('first_name, last_name, department, occasion_date')
      .eq('company_id', companyId)
      .eq('occasion_type', 'birthday')
      .eq('is_active', true);

    const withDays = (upcomingBdays || []).map(m => {
      if (!m.occasion_date) return null;
      const bd = new Date(m.occasion_date);
      const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
      const diff = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));
      return { ...m, days_until_birthday: diff };
    }).filter(Boolean).sort((a, b) => a.days_until_birthday - b.days_until_birthday);

    const upcoming = withDays.filter(m => m.days_until_birthday <= 30 && m.days_until_birthday > 0);

    res.json({
      stats: {
        total_members:     all.length,
        departments:       departments.length,
        upcoming_birthdays: upcoming.length,
        active_cards:      activeCards || 0,
        total_collected:   totalCollected,
        cards_sent_this_year: 0,
      },
      upcoming_celebrants: upcoming.slice(0, 10),
      departments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load teams dashboard' });
  }
};

module.exports = { downloadTemplate, importTeamMembers, getTeamMembers, getDepartments, deleteTeamMember, getTeamsDashboard };
