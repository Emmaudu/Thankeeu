const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const signup = async (req, res) => {
  try {
    const { full_name, email, password, username } = req.body;

    if (!full_name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (!username || username.trim().length < 3)
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
      return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.toLowerCase().trim();

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const { data: existingUsername } = await supabase
      .from('users').select('id').eq('username', cleanUsername).maybeSingle();
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

    const password_hash = await bcrypt.hash(password, 12);
    const verification_token = crypto.randomBytes(32).toString('hex');

    const { data: user, error } = await supabase
      .from('users')
      .insert({ full_name, email: cleanEmail, username: cleanUsername, password_hash, verification_token })
      .select('id, email, full_name, username, role, avatar_url, is_verified')
      .single();

    if (error) {
      console.error('Signup DB error:', error);
      if (error.code === '23505') return res.status(400).json({ error: 'Email or username already registered' });
      throw error;
    }

    // Send welcome + verification email
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'https://thankeeu.com';
    const verifyLink = `${appUrl}/verify-email?token=${verification_token}`;
    sendEmail({ to: cleanEmail, template: 'emailVerification', data: { name: full_name, verifyLink } })
      .catch(e => console.error('Verification email failed:', e));
    sendEmail({ to: cleanEmail, template: 'welcome', data: { name: full_name } })
      .catch(e => console.error('Welcome email failed:', e));

    const token = generateToken(user.id);

    // Auto-link any cards sent to this email address
    setImmediate(async () => {
      try {
        const { data: sentCards } = await supabase
          .from('cards')
          .select('id, slug, creator_id')
          .eq('recipient_email', cleanEmail)
          .in('status', ['sent', 'active']);
        
        for (const card of (sentCards || [])) {
          await supabase.from('received_cards').upsert({
            card_id: card.id,
            recipient_user_id: user.id,
            transferred_by: card.creator_id,
            transferred_at: new Date(),
          }, { onConflict: 'card_id,recipient_user_id' });
        }
      } catch (e) { console.error('Auto-link cards on signup failed:', e); }
    });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const { data: user } = await supabase
      .from('users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user.id);
    const { password_hash, verification_token, reset_token, reset_token_expires, ...safeUser } = user;

    // Auto-link any newly sent cards to this user
    setImmediate(async () => {
      try {
        const { data: sentCards } = await supabase
          .from('cards').select('id, creator_id')
          .eq('recipient_email', user.email.toLowerCase()).in('status', ['sent', 'active']);
        for (const card of (sentCards || [])) {
          await supabase.from('received_cards').upsert({
            card_id: card.id, recipient_user_id: user.id,
            transferred_by: card.creator_id, transferred_at: new Date(),
          }, { onConflict: 'card_id,recipient_user_id' });
        }
      } catch (e) {}
    });

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, username, role, avatar_url, bio, is_verified, created_at')
      .eq('id', req.user.id)
      .single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, avatar_url, username, bio } = req.body;

    if (username) {
      const clean = username.trim().toLowerCase();
      if (!/^[a-zA-Z0-9_]+$/.test(clean))
        return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores' });
      const { data: taken } = await supabase.from('users').select('id').eq('username', clean).neq('id', req.user.id).maybeSingle();
      if (taken) return res.status(400).json({ error: 'Username already taken' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ full_name, avatar_url, bio, ...(username && { username: username.trim().toLowerCase() }), updated_at: new Date() })
      .eq('id', req.user.id)
      .select('id, email, full_name, username, role, avatar_url, bio')
      .single();
    if (error) throw error;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    const { data } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url')
      .ilike('username', `%${q.trim()}%`)
      .neq('id', req.user.id)
      .limit(8);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'Both passwords are required' });
    if (new_password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.id).single();
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const password_hash = await bcrypt.hash(new_password, 12);
    await supabase.from('users').update({ password_hash }).eq('id', req.user.id);
    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path }); // Cloudinary returns path as URL
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { data: user } = await supabase.from('users').select('id, full_name').eq('email', email).single();
    if (!user) return res.json({ message: 'If email exists, reset link sent' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await supabase.from('users').update({
      reset_token: token, reset_token_expires: expires
    }).eq('id', user.id);

    await sendEmail({ to: email, template: 'passwordReset', data: { token, name: user.full_name } });
    res.json({ message: 'If email exists, reset link sent' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const { data: user } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .single();

    if (!user || new Date(user.reset_token_expires) < new Date())
      return res.status(400).json({ error: 'Invalid or expired reset token' });

    const password_hash = await bcrypt.hash(password, 12);
    await supabase.from('users').update({
      password_hash, reset_token: null, reset_token_expires: null
    }).eq('id', user.id);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin seed — creates admin user if none exists (one-time setup)
const seedAdmin = async (req, res) => {
  try {
    const { data: existingAdmin } = await supabase
      .from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();

    if (existingAdmin) {
      return res.json({ message: 'Admin already exists', seeded: false });
    }

    const adminEmail = 'admin@thankeeu.com';
    const adminPassword = 'Thankeeu@Admin2025!';
    const password_hash = await bcrypt.hash(adminPassword, 12);

    const { data: existingUser } = await supabase
      .from('users').select('id').eq('email', adminEmail).maybeSingle();

    if (existingUser) {
      await supabase.from('users').update({ role: 'admin' }).eq('id', existingUser.id);
      return res.json({ message: 'Existing user upgraded to admin', email: adminEmail, seeded: true });
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        full_name: 'Thankeeu Admin',
        email: adminEmail,
        password_hash,
        role: 'admin',
        is_verified: true
      })
      .select('id, email, full_name, role')
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Admin created', email: adminEmail, seeded: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to seed admin' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Verification token required' });

    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, is_verified')
      .eq('verification_token', token)
      .maybeSingle();

    if (error || !user) return res.status(400).json({ error: 'Invalid or expired verification link' });
    if (user.is_verified) return res.json({ message: 'Email already verified', alreadyVerified: true });

    await supabase.from('users')
      .update({ is_verified: true, verification_token: null })
      .eq('id', user.id);

    // Confirmation email
    sendEmail({ to: user.email, template: 'emailVerified', data: { name: user.full_name } }).catch(() => {});

    res.json({ message: 'Email verified successfully!', user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, email, is_verified, verification_token')
      .eq('id', userId)
      .single();

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.is_verified) return res.status(400).json({ error: 'Email already verified' });

    // Generate fresh token
    const newToken = crypto.randomBytes(32).toString('hex');
    await supabase.from('users').update({ verification_token: newToken }).eq('id', userId);

    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'https://thankeeu.com';
    const verifyLink = `${appUrl}/verify-email?token=${newToken}`;
    await sendEmail({ to: user.email, template: 'emailVerification', data: { name: user.full_name, verifyLink } });

    res.json({ message: 'Verification email sent! Check your inbox.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};


// Single export at the end — after ALL functions are defined
module.exports = {
  signup, login, getMe, updateProfile, searchUsers,
  changePassword, uploadAvatar, forgotPassword, resetPassword, seedAdmin,
  verifyEmail, resendVerification
};
