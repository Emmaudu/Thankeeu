const crypto = require('crypto');
const argon2 = require('argon2');
const hashPassword = (plain) => argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
const { sendEmail } = require('../utils/email');
/**
 * occasionBulkController.js
 * HR can download Excel template, upload it, and sync it to populate all occasion tables.
 * A single "general" template auto-populates birthday, farewell, promotion, valentine, etc.
 */
const supabase = require('../utils/supabase');
const { logActivity } = require('../utils/activityLog');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();

// Fixed occasion dates (some are annual, some need year context)
const OCCASION_FIXED_DATES = {
  valentine:     (year) => `${year}-02-14`,
  womens_day:    (year) => `${year}-03-08`,
  mothers_day:   (year) => {
    // Second Sunday of May
    const d = new Date(year, 4, 1);
    const day = d.getDay();
    const offset = (7 - day + 0) % 7 + 7 + 1; // second Sunday
    return `${year}-05-${String(offset).padStart(2,'0')}`;
  },
  fathers_day:   (year) => {
    // Third Sunday of June
    const d = new Date(year, 5, 1);
    const day = d.getDay();
    const offset = (7 - day + 0) % 7 + 14 + 1;
    return `${year}-06-${String(offset).padStart(2,'0')}`;
  },
};

/**
 * GET /api/occasions/bulk-template
 * Returns CSV template content for bulk import
 * Includes pre-filled dates for Valentine's, Women's Day, etc.
 */
const downloadBulkTemplate = (req, res) => {
  const XLSX = require('xlsx');
  const year = new Date().getFullYear();
  const valDate    = OCCASION_FIXED_DATES.valentine(year);
  const womensDate = OCCASION_FIXED_DATES.womens_day(year);
  const mothersDate = OCCASION_FIXED_DATES.mothers_day(year);
  const fathersDate = OCCASION_FIXED_DATES.fathers_day(year);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Main import sheet
  const cols = ['First Name','Last Name','Email','Phone','Department','Role (member/leader)','Job Title','Gender (male/female)','Date of Birth (YYYY-MM-DD)','Work Start Date (YYYY-MM-DD)','New Hire Start Date (YYYY-MM-DD)','Promotion Date (leave blank if none)','Last Working Day (leave blank if none)','Farewell Message (optional)','Congratulatory Message (optional)'];
  const rows = [
    ['Adaeze','Okonkwo','adaeze@company.com','08012345678','Marketing','member','Content Writer','female','1990-05-15','2020-01-10','','','','',''],
    ['Emeka','Chukwu','emeka@company.com','08098765432','Engineering','leader','Lead Developer','male','1985-11-22','2019-03-01','','','','',''],
    ['Kemi','Bello','kemi@company.com','07012345678','HR','member','HR Associate','female','1993-07-08','2021-06-01','','','','',''],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet([cols, ...rows]);
  ws1['!cols'] = cols.map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(wb, ws1, '📋 Team Import');

  // Sheet 2: Fixed dates reference
  const fixedCols = ['Occasion','Fixed Date for ' + year,'Notes'];
  const fixedRows = [
    ["Valentine's Day", valDate, 'Auto-applied to all employees'],
    ["Women's Day",     womensDate, 'Auto-applied to female employees'],
    ["Mother's Day",    mothersDate, 'Auto-applied to female employees'],
    ["Father's Day",    fathersDate, 'Auto-applied to male employees'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet([fixedCols, ...fixedRows]);
  ws2['!cols'] = [{ wch:22 },{ wch:18 },{ wch:36 }];
  XLSX.utils.book_append_sheet(wb, ws2, '📅 Fixed Dates Reference');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="thankeeu-team-import-${year}.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

/**
 * POST /api/occasions/bulk-sync
 * Body: { employees: [{...}] } — parsed from uploaded CSV/Excel
 * Syncs to company_members + all occasion tables
 */
const bulkSyncEmployees = async (req, res) => {
  try {
    const companyId = req.company.id;
    const { employees } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ error: 'No employee data provided' });
    }

    const year = new Date().getFullYear();
    const results = { created: 0, updated: 0, occasion_rows: 0, errors: [] };

    for (const emp of employees) {
      try {
        const { first_name, last_name, email, department, role, gender,
                date_of_birth, job_title, phone, work_anniversary_date,
                promotion_date, leaving_date } = emp;

        if (!first_name || !last_name || !email) {
          results.errors.push(`Skipped: missing required fields for ${email || 'unknown'}`);
          continue;
        }

        // Upsert company_member
        // Check whether this member already has a password (existing user)
        const { data: existingMember } = await supabase.from('company_members')
          .select('id, password_hash').eq('company_id', companyId).eq('email', email.trim().toLowerCase()).maybeSingle();
        const needsInvite = !existingMember?.password_hash;
        const inviteToken = needsInvite ? crypto.randomBytes(32).toString('hex') : undefined;
        const tempPasswordHash = needsInvite ? await hashPassword(crypto.randomBytes(8).toString('hex')) : undefined;

        const memberData = {
          company_id: companyId, first_name: first_name.trim(), last_name: last_name.trim(),
          email: email.trim().toLowerCase(), department: department?.trim() || 'General',
          role: role === 'leader' ? 'team_leader' : 'team_member', status: 'approved',
          ...(gender && { gender: gender.toLowerCase() }),
          ...(job_title && { job_title }),
          ...(phone && { phone }),
          ...(date_of_birth && { date_of_birth }),
          ...(needsInvite && { password_hash: tempPasswordHash, invite_token: inviteToken }),
          updated_at: new Date(),
        };

        let { data: member, error: mErr } = await supabase
          .from('company_members')
          .upsert(memberData, { onConflict: 'company_id,email' })
          .select('id, status')
          .maybeSingle();

        // Some databases use an enum for `role` ('team_leader'/'team_member')
        // instead of free text ('member'/'team_leader') — retry on that error.
        if (mErr && /role/i.test(mErr.message || '')) {
          memberData.role = role === 'leader' ? 'team_leader' : 'team_member';
          ({ data: member, error: mErr } = await supabase
            .from('company_members')
            .upsert(memberData, { onConflict: 'company_id,email' })
            .select('id, status')
            .maybeSingle());
        }

        if (mErr) { results.errors.push(`Member upsert failed: ${email}`); continue; }
        const memberId  = member.id;

        // Track whether this was a new member (no existing row found before
        // the upsert) vs. an update to an existing one — previously
        // results.created was never incremented and results.updated counted
        // every row, so the response always showed "0 created" even on a
        // first-time import of all-new employees.
        if (existingMember) results.updated++;
        else results.created++;

        // Send invite email to new members who don't have a password yet
        if (needsInvite) {
          try {
            const frontendUrl = (() => { let s=(process.env.FRONTEND_URL||'').trim(); if(s.includes('=')&&!s.startsWith('http'))s=s.slice(s.indexOf('=')+1).trim(); return s.startsWith('http')?s.replace(/\/$/,''):'https://thankeeu.com'; })();
            const link = `${frontendUrl}/member/reset-password?token=${inviteToken}&email=${encodeURIComponent(email.trim().toLowerCase())}`;
            const { data: co } = await supabase.from('companies').select('name, contact_person').eq('id', companyId).maybeSingle();
            await sendEmail({
              to: email.trim().toLowerCase(),
              subject: `Welcome to ${co?.name || 'your company'}'s team on Thankeeu! 🎉`,
              html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;text-align:center;">
                <div style="font-size:48px;margin-bottom:16px;">🎉</div>
                <h2 style="color:#1A1035;margin-bottom:8px;">Welcome, ${first_name}!</h2>
                <p style="color:#666;font-size:14px;margin-bottom:20px;">
                  ${co?.contact_person || co?.name || 'Your HR team'} has added you to <strong>${co?.name || 'your company'}</strong>'s celebration platform on Thankeeu.
                  You'll receive birthday cards, farewell messages, and other celebrations from your team here.
                </p>
                <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#6C5CE7);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:20px;">
                  Set your password & get started 🚀
                </a>
                <p style="color:#aaa;font-size:12px;">This link expires in 7 days.</p>
              </div>`
            }).catch(e => console.warn('Invite email failed:', e.message));
          } catch (emailErr) {
            console.warn('Could not send invite:', emailErr.message);
          }
        }

        // Birthday occasion row
        if (date_of_birth) {
          const bday = date_of_birth.slice(5); // MM-DD
          await supabase.from('occasion_members').upsert({
            company_id: companyId, member_id: memberId,
            occasion_type: 'birthday', email, first_name, last_name,
            department: department || 'General', gender: gender || null,
            occasion_date: `${year}-${bday}`,
            is_active: true,
          }, { onConflict: 'company_id,member_id,occasion_type' });
          results.occasion_rows++;
        }

        // Work anniversary
        if (work_anniversary_date) {
          await supabase.from('occasion_members').upsert({
            company_id: companyId, member_id: memberId,
            occasion_type: 'work_anniversary', email, first_name, last_name,
            department: department || 'General',
            occasion_date: work_anniversary_date,
            is_active: true,
          }, { onConflict: 'company_id,member_id,occasion_type' });
          results.occasion_rows++;
        }

        // Father's Day (males)
        if (gender?.toLowerCase() === 'male') {
          await supabase.from('occasion_members').upsert({
            company_id: companyId, member_id: memberId,
            occasion_type: 'fathers_day', email, first_name, last_name,
            department: department || 'General', gender: 'male',
            occasion_date: OCCASION_FIXED_DATES.fathers_day(year),
            is_active: true,
          }, { onConflict: 'company_id,member_id,occasion_type' });
          results.occasion_rows++;
        }

        // Mother's Day (females)
        if (gender?.toLowerCase() === 'female') {
          await supabase.from('occasion_members').upsert({
            company_id: companyId, member_id: memberId,
            occasion_type: 'mothers_day', email, first_name, last_name,
            department: department || 'General', gender: 'female',
            occasion_date: OCCASION_FIXED_DATES.mothers_day(year),
            is_active: true,
          }, { onConflict: 'company_id,member_id,occasion_type' });
          results.occasion_rows++;
        }

        // Women's Day (females)
        if (gender?.toLowerCase() === 'female') {
          await supabase.from('occasion_members').upsert({
            company_id: companyId, member_id: memberId,
            occasion_type: 'womens_day', email, first_name, last_name,
            department: department || 'General', gender: 'female',
            occasion_date: OCCASION_FIXED_DATES.womens_day(year),
            is_active: true,
          }, { onConflict: 'company_id,member_id,occasion_type' });
          results.occasion_rows++;
        }

        // Valentine's Day (everyone)
        await supabase.from('occasion_members').upsert({
          company_id: companyId, member_id: memberId,
          occasion_type: 'valentine', email, first_name, last_name,
          department: department || 'General',
          occasion_date: OCCASION_FIXED_DATES.valentine(year),
          is_active: true,
          }, { onConflict: 'company_id,member_id,occasion_type' });
        results.occasion_rows++;

        // Promotion if date set
        if (promotion_date) {
          await supabase.from('occasion_members').upsert({
            company_id: companyId, member_id: memberId,
            occasion_type: 'promotion', email, first_name, last_name,
            department: department || 'General',
            occasion_date: promotion_date,
            is_active: true,
            meta: JSON.stringify({ promotion_level: 1 }),
          }, { onConflict: 'company_id,member_id,occasion_type' });
          results.occasion_rows++;
        }

        // Leaving if date set
        if (leaving_date) {
          await supabase.from('occasion_members').upsert({
            company_id: companyId, member_id: memberId,
            occasion_type: 'leaving', email, first_name, last_name,
            department: department || 'General',
            occasion_date: leaving_date,
            is_active: true,
          }, { onConflict: 'company_id,member_id,occasion_type' });
          results.occasion_rows++;
        }

      } catch (empErr) {
        results.errors.push(`Error for ${emp.email}: ${empErr.message}`);
      }
    }

    res.json({
      message: `Sync complete! ${results.created + results.updated} employee${results.created + results.updated === 1 ? '' : 's'} synced (${results.created} new, ${results.updated} updated), ${results.occasion_rows} occasion entries created/updated.`,
      results,
    });

    logActivity({
      company_id:  companyId,
      actor_id:    req.coreTeamMember?.id || companyId,
      actor_type:  req.actorType || 'hr',
      actor_name:  req.actorName || req.company.name || 'HR',
      action:      'imported_members',
      entity_type: 'bulk_sync',
      entity_name: 'Employee bulk sync',
      details:     { updated: results.updated, occasion_rows: results.occasion_rows, errors: results.errors.length },
    }).catch(() => {});
  } catch (err) {
    console.error('bulkSyncEmployees error:', err);
    res.status(500).json({ error: err.message || 'Bulk sync failed' });
  }
};

/**
 * GET /api/occasions/tables
 * Returns all populated occasion tables for the company
 */
const getOccasionTables = async (req, res) => {
  try {
    const companyId = req.company.id;
    const types = ['birthday','work_anniversary','valentine','womens_day','mothers_day',
                   'fathers_day','promotion','leaving','new_hire'];
    const tables = {};

    await Promise.all(types.map(async type => {
      const { data } = await supabase
        .from('occasion_members')
        .select('id, member_id, first_name, last_name, email, department, gender, occasion_date, is_active, meta, notification_scope, occasion_type, farewell, card_slug, celebrant_notified_at, last_dept_notified_at')
        .eq('company_id', companyId)
        .eq('occasion_type', type)
        .eq('is_active', true)
        .order('first_name', { ascending: true });
      tables[type] = data || [];
    }));

    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load occasion tables' });
  }
};

/**
 * PATCH /api/occasions/members/:id
 * Update a single occasion member record (edit fields, set farewell, set notification scope, set promotion level)
 */
const updateOccasionMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { farewell, notification_scope, promotion_level, promotion_message, promotion_send_date, is_active, occasion_date, department } = req.body;

    const updates = { updated_at: new Date() };
    if (farewell !== undefined) updates.farewell = farewell;
    if (notification_scope) updates.notification_scope = notification_scope;
    if (is_active !== undefined) updates.is_active = is_active;
    if (occasion_date) updates.occasion_date = occasion_date;
    if (department) updates.department = department;

    // Promotion level stored in meta
    if (promotion_level !== undefined) {
      const { data: existing } = await supabase.from('occasion_members').select('meta').eq('id', id).maybeSingle();
      const existingMeta = typeof existing?.meta === 'string' ? JSON.parse(existing.meta || '{}') : (existing?.meta || {});
      updates.meta = JSON.stringify({
        ...existingMeta,
        promotion_level: Number(promotion_level),
        ...(promotion_message && { promotion_message }),
        ...(promotion_send_date && { promotion_send_date }),
      });
    }

    const { data, error } = await supabase
      .from('occasion_members')
      .update(updates)
      .eq('id', id)
      .eq('company_id', req.company.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Update failed' });
  }
};

/**
 * DELETE /api/occasions/members/:id
 */
const deleteOccasionMember = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('occasion_members').delete().eq('id', id).eq('company_id', req.company.id);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
};

module.exports = {
  downloadBulkTemplate, bulkSyncEmployees, getOccasionTables,
  updateOccasionMember, deleteOccasionMember,
};
