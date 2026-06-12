const supabase = require('../utils/supabase');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const argon2   = require('argon2');
const bcrypt   = require('bcryptjs');
const { sendEmail } = require('../utils/email');

const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();

const hashPassword = (plain) => argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
const verifyPassword = async (plain, stored) => {
  if (!stored) return false;
  if (stored.startsWith('$argon2')) return argon2.verify(stored, plain);
  return bcrypt.compare(plain, stored);
};

const generatePalToken = (palGroupId, palMemberId = null) =>
  jwt.sign({ palGroupId, palMemberId, type: 'pal' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// ── POST /api/pals/signup — apply to create a Pals group ────────────────────
const palSignup = async (req, res) => {
  try {
    const { group_name, group_username, email, password, confirm_password, group_size, description } = req.body;

    if (!group_name || !group_username || !email || !password || !confirm_password)
      return res.status(400).json({ error: 'All required fields must be filled' });
    if (password !== confirm_password)
      return res.status(400).json({ error: 'Passwords do not match' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/^[a-zA-Z0-9_]+$/.test(group_username.trim()))
      return res.status(400).json({ error: 'Group username can only contain letters, numbers and underscores' });

    const size = Math.min(15, Math.max(2, Number(group_size) || 15));
    const cleanUsername = group_username.trim().toLowerCase();
    const cleanEmail    = email.toLowerCase().trim();

    const { data: existing } = await supabase.from('pal_groups').select('id').eq('group_username', cleanUsername).maybeSingle();
    if (existing) return res.status(400).json({ error: 'That group username is already taken' });

    const password_hash = await hashPassword(password);

    const { data: group, error } = await supabase.from('pal_groups').insert({
      group_name: group_name.trim(),
      group_username: cleanUsername,
      email: cleanEmail,
      password_hash,
      group_size: size,
      description: description?.trim() || null,
      status: 'pending',
    }).select('id, group_name, group_username').single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'That group username is already taken' });
      throw error;
    }

    // Notify admin
    sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@thankeeu.com',
      template: 'palApplicationReceived',
      data: { groupName: group.group_name, groupUsername: group.group_username, email: cleanEmail, size, description, adminUrl: `${FRONTEND_URL}/admin?tab=pals` },
    }).catch(() => {});

    res.json({ message: 'Application submitted! We will review it within 24 hours and email you the outcome.' });
  } catch (err) {
    console.error('palSignup error:', err.message);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
};

// ── GET /api/pals/verify-email?token=... ────────────────────────────────────
const palVerifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing verification token' });

    const { data: group } = await supabase.from('pal_groups')
      .select('id, group_name, group_username, status, is_verified')
      .eq('verify_token', token).maybeSingle();

    if (!group) return res.status(400).json({ error: 'Invalid or expired verification link' });
    if (group.status !== 'approved') return res.status(400).json({ error: 'Your group has not been approved yet' });

    await supabase.from('pal_groups').update({ is_verified: true, verify_token: null }).eq('id', group.id);

    res.json({ message: 'Email verified! You can now log in to your Pals dashboard.', group_username: group.group_username });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

// ── POST /api/pals/login — group_username + ANY member's password ───────────
const palLogin = async (req, res) => {
  try {
    const { group_username, password } = req.body;
    if (!group_username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const cleanUsername = group_username.trim().toLowerCase();
    const { data: group } = await supabase.from('pal_groups')
      .select('*').eq('group_username', cleanUsername).maybeSingle();

    if (!group) return res.status(401).json({ error: 'Invalid username or password' });
    if (group.status !== 'approved') return res.status(403).json({ error: 'Your group application is still pending review' });
    if (!group.is_verified) return res.status(403).json({ error: 'Please verify your email first — check your inbox for the verification link' });

    // 1. Try group owner password
    if (await verifyPassword(password, group.password_hash)) {
      const token = generatePalToken(group.id, null);
      return res.json({
        token,
        group: { id: group.id, group_name: group.group_name, group_username: group.group_username, logo_url: group.logo_url, group_size: group.group_size },
        member: null,
      });
    }

    // 2. Try any joined member's password
    const { data: members } = await supabase.from('pal_members')
      .select('id, name, email, password_hash, status').eq('pal_group_id', group.id).eq('status', 'joined');

    for (const m of (members || [])) {
      if (await verifyPassword(password, m.password_hash)) {
        const token = generatePalToken(group.id, m.id);
        return res.json({
          token,
          group: { id: group.id, group_name: group.group_name, group_username: group.group_username, logo_url: group.logo_url, group_size: group.group_size },
          member: { id: m.id, name: m.name, email: m.email },
        });
      }
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (err) {
    console.error('palLogin error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
};

// ── GET /api/pals/me — current session info ──────────────────────────────────
const palMe = async (req, res) => {
  res.json({ group: req.palGroup, member: req.palMember || null });
};

// ── POST /api/pals/accept-invite — invited member sets their own password ───
const acceptInvite = async (req, res) => {
  try {
    const { token, password, confirm_password } = req.body;
    if (!token || !password || !confirm_password) return res.status(400).json({ error: 'All fields are required' });
    if (password !== confirm_password) return res.status(400).json({ error: 'Passwords do not match' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const { data: member } = await supabase.from('pal_members')
      .select('id, pal_group_id, name, email, status').eq('invite_token', token).maybeSingle();

    if (!member) return res.status(400).json({ error: 'Invalid or expired invite link' });

    const password_hash = await hashPassword(password);
    await supabase.from('pal_members').update({ password_hash, status: 'joined', invite_token: null }).eq('id', member.id);

    const { data: group } = await supabase.from('pal_groups').select('id, group_name, group_username, logo_url, group_size').eq('id', member.pal_group_id).single();

    const jwtToken = generatePalToken(member.pal_group_id, member.id);
    res.json({
      message: `Welcome to ${group.group_name}!`,
      token: jwtToken,
      group: { id: group.id, group_name: group.group_name, group_username: group.group_username, logo_url: group.logo_url, group_size: group.group_size },
      member: { id: member.id, name: member.name, email: member.email },
    });
  } catch (err) {
    console.error('acceptInvite error:', err.message);
    res.status(500).json({ error: 'Failed to join group' });
  }
};

// ── GET /api/pals/invite/:token — preview invite before accepting ───────────
const previewInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const { data: member } = await supabase.from('pal_members')
      .select('id, name, email, status, pal_group_id, pal_groups(group_name, group_username, logo_url, description)')
      .eq('invite_token', token).maybeSingle();

    if (!member) return res.status(404).json({ error: 'Invalid or expired invite link' });
    if (member.status === 'joined') return res.status(400).json({ error: 'This invite has already been used. Please log in instead.' });

    res.json({
      name: member.name, email: member.email,
      group_name: member.pal_groups?.group_name,
      group_username: member.pal_groups?.group_username,
      logo_url: member.pal_groups?.logo_url,
      description: member.pal_groups?.description,
    });
  } catch (err) { res.status(500).json({ error: 'Failed to load invite' }); }
};

module.exports = {
  palSignup, palVerifyEmail, palLogin, palMe, acceptInvite, previewInvite,
  hashPassword, verifyPassword, generatePalToken, FRONTEND_URL,
};
