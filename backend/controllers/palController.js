const supabase = require('../utils/supabase');
const crypto   = require('crypto');
const XLSX     = require('xlsx');
const { sendEmail } = require('../utils/email');
const { hashPassword, FRONTEND_URL } = require('./palAuthController');

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS — group profile
// ════════════════════════════════════════════════════════════════════════════

const getSettings = async (req, res) => {
  res.json(req.palGroup);
};

const updateSettings = async (req, res) => {
  try {
    const { group_name, description, logo_url } = req.body;
    const updates = { updated_at: new Date() };
    if (group_name !== undefined) updates.group_name = group_name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (logo_url !== undefined) updates.logo_url = logo_url || null;

    const { data, error } = await supabase.from('pal_groups').update(updates).eq('id', req.palGroup.id)
      .select('id, group_name, group_username, email, logo_url, description, group_size, status, is_verified').maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ════════════════════════════════════════════════════════════════════════════
// MEMBERS — list, invite (manual + CSV), profile
// ════════════════════════════════════════════════════════════════════════════

const getMembers = async (req, res) => {
  try {
    const { data, error } = await supabase.from('pal_members')
      .select('id, name, email, department, role, status, birth_date, resignation_date, graduation_date, milestone_date, promotion_date, profile_pic_url, bio, bank_details, created_at')
      .eq('pal_group_id', req.palGroup.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json((data || []).map(m => ({ ...m, profile_complete: !!(m.bio && m.bank_details?.account_number && m.profile_pic_url) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getMemberProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('pal_members').select('*').eq('id', id).eq('pal_group_id', req.palGroup.id).maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Member not found' });
    delete data.password_hash;
    delete data.invite_token;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateMemberProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, profile_pic_url, bank_details, department, role } = req.body;
    const updates = { updated_at: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio?.trim() || null;
    if (profile_pic_url !== undefined) updates.profile_pic_url = profile_pic_url || null;
    if (bank_details !== undefined) updates.bank_details = bank_details || null;
    if (department !== undefined) updates.department = department?.trim() || null;
    if (role !== undefined) updates.role = role?.trim() || null;

    const { data, error } = await supabase.from('pal_members').update(updates)
      .eq('id', id).eq('pal_group_id', req.palGroup.id)
      .select('id, name, email, department, role, bio, profile_pic_url, bank_details').maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Update a member's event date/note — triggers auto-card creation via cron
const updateMemberEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { event, date, note } = req.body; // event: resignation | graduation | milestone | promotion | birth
    const fieldMap = {
      birth:       ['birth_date', null],
      resignation: ['resignation_date', 'resignation_note'],
      graduation:  ['graduation_date', 'graduation_note'],
      milestone:   ['milestone_date', 'milestone_note'],
      promotion:   ['promotion_date', 'promotion_note'],
    };
    const fields = fieldMap[event];
    if (!fields) return res.status(400).json({ error: 'Invalid event type' });

    const updates = { updated_at: new Date(), [fields[0]]: date || null };
    if (fields[1]) updates[fields[1]] = note?.trim() || null;
    // Reset reminder dedupe flags so new event date gets fresh reminders
    if (date) {
      const { data: existing } = await supabase.from('pal_members').select('reminders_sent').eq('id', id).maybeSingle();
      const reminders = existing?.reminders_sent || {};
      Object.keys(reminders).forEach(k => { if (k.startsWith(event)) delete reminders[k]; });
      updates.reminders_sent = reminders;
    }

    const { data, error } = await supabase.from('pal_members').update(updates)
      .eq('id', id).eq('pal_group_id', req.palGroup.id).select().maybeSingle();
    if (error) throw error;
    res.json({ message: 'Event updated', member: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Invite members — manual single add ──────────────────────────────────────
const inviteMember = async (req, res) => {
  try {
    const { name, email, department, role, birth_date, resignation_date, graduation_date, milestone_date, promotion_date } = req.body;
    if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: 'Name and email are required' });

    const result = await inviteOne(req.palGroup, { name, email, department, role, birth_date, resignation_date, graduation_date, milestone_date, promotion_date });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: `Invited ${name}!`, member: result.member });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Invite members — CSV bulk upload ─────────────────────────────────────────
const inviteMembersCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const results = { invited: [], skipped: [], errors: [] };
    for (const row of rows) {
      const name  = String(row.name || row.Name || '').trim();
      const email = String(row.email || row.Email || '').trim();
      if (!name || !email) { results.skipped.push(row); continue; }

      const r = await inviteOne(req.palGroup, {
        name, email,
        department: row.department || row.Department || '',
        role: row.role || row.Role || '',
        birth_date: parseDate(row.birth_date || row['birth date'] || row['Birth Date']),
        resignation_date: parseDate(row.resignation_date || row['resignation date']),
        graduation_date: parseDate(row.graduation_date || row['graduation date']),
        milestone_date: parseDate(row.milestone_date || row['milestone date']),
        promotion_date: parseDate(row.promotion_date || row['promotion date']),
      });
      if (r.error) results.errors.push({ email, error: r.error });
      else results.invited.push(r.member);
    }

    res.json({
      message: `${results.invited.length} invited, ${results.errors.length} errors, ${results.skipped.length} skipped (missing name/email)`,
      ...results,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// Shared invite logic — enforces group_size cap, creates member row + invite email
async function inviteOne(group, data) {
  const cleanEmail = data.email.toLowerCase().trim();

  // Enforce group size cap (owner + members must not exceed group_size)
  const { count } = await supabase.from('pal_members').select('id', { count: 'exact', head: true }).eq('pal_group_id', group.id);
  if ((count || 0) + 1 >= group.group_size) {
    return { error: `Group is full — maximum ${group.group_size} members (including the group owner)` };
  }

  const { data: existing } = await supabase.from('pal_members').select('id, status').eq('pal_group_id', group.id).eq('email', cleanEmail).maybeSingle();
  if (existing) return { error: `${cleanEmail} is already ${existing.status === 'joined' ? 'a member' : 'invited'}` };

  const invite_token = crypto.randomBytes(32).toString('hex');

  const { data: member, error } = await supabase.from('pal_members').insert({
    pal_group_id: group.id,
    name: data.name.trim(),
    email: cleanEmail,
    department: data.department?.trim() || null,
    role: data.role?.trim() || null,
    birth_date: data.birth_date || null,
    resignation_date: data.resignation_date || null,
    graduation_date: data.graduation_date || null,
    milestone_date: data.milestone_date || null,
    promotion_date: data.promotion_date || null,
    status: 'pending',
    invite_token,
  }).select('id, name, email, department, role, status, created_at').maybeSingle();

  if (error) return { error: error.message };

  sendEmail({
    to: cleanEmail,
    template: 'palMemberInvite',
    data: {
      name: data.name.trim(),
      groupName: group.group_name,
      groupUsername: group.group_username,
      joinUrl: `${FRONTEND_URL}/pals/join?token=${invite_token}`,
    },
  }).catch(() => {});

  return { member };
}

// ════════════════════════════════════════════════════════════════════════════
// MY CARDS — cards auto-created for this group's members
// ════════════════════════════════════════════════════════════════════════════

const getMyCards = async (req, res) => {
  try {
    const { data, error } = await supabase.from('cards')
      .select('id, slug, recipient_name, occasion, status, send_date, deadline, created_at, pal_member_id, pal_members:pal_member_id(name)')
      .eq('pal_group_id', req.palGroup.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(c => ({ ...c, recipient_name: c.recipient_name || c.pal_members?.name })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD ANALYTICS
// ════════════════════════════════════════════════════════════════════════════

const getDashboardAnalytics = async (req, res) => {
  try {
    const groupId = req.palGroup.id;

    const { count: totalMembers }  = await supabase.from('pal_members').select('id', { count: 'exact', head: true }).eq('pal_group_id', groupId);
    const { count: joinedMembers } = await supabase.from('pal_members').select('id', { count: 'exact', head: true }).eq('pal_group_id', groupId).eq('status', 'joined');
    const { count: pendingMembers } = await supabase.from('pal_members').select('id', { count: 'exact', head: true }).eq('pal_group_id', groupId).eq('status', 'pending');

    const { data: cards } = await supabase.from('cards').select('id, status, occasion, created_at').eq('pal_group_id', groupId);
    const { data: contribs } = await supabase.from('contributions')
      .select('amount, status, card_id, cards!inner(pal_group_id)')
      .eq('cards.pal_group_id', groupId).eq('status', 'success');

    const totalRaised = (contribs || []).reduce((s, c) => s + (c.amount || 0), 0);
    const commissionPct = req.palGroup.pricing_commission_pct || 3.5;

    const byOccasion = {};
    (cards || []).forEach(c => { byOccasion[c.occasion] = (byOccasion[c.occasion] || 0) + 1; });

    res.json({
      total_members: (totalMembers || 0) + 1, // +1 for group owner
      joined_members: (joinedMembers || 0) + 1,
      pending_members: pendingMembers || 0,
      group_size: req.palGroup.group_size,
      total_cards: (cards || []).length,
      cards_by_occasion: byOccasion,
      total_gift_raised: totalRaised,
      thankeeu_commission: Math.round(totalRaised * (commissionPct / 100)),
      commission_pct: commissionPct,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = {
  getSettings, updateSettings,
  getMembers, getMemberProfile, updateMemberProfile, updateMemberEvent,
  inviteMember, inviteMembersCSV,
  getMyCards, getDashboardAnalytics,
};
