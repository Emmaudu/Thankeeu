const bcrypt = require('bcryptjs');
const argon2  = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const FRONTEND_URL = (() => {
  let s = (process.env.FRONTEND_URL || '').trim();
  if (s.includes('=') && !s.startsWith('http')) s = s.slice(s.indexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').replace(/\/$/g, '').trim();
  return s.startsWith('http') ? s : 'https://thankeeu.com';
})();

const setCookie = (res, name, token, expiresIn = '7d') => {
  const maxAge = expiresIn.endsWith('d')
    ? parseInt(expiresIn) * 86400000
    : expiresIn.endsWith('h')
    ? parseInt(expiresIn) * 3600000
    : 7 * 86400000;
  res.cookie(name, token, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === 'production',
    sameSite:  'none',        // required for cross-origin (Vercel ↔ Railway)
    maxAge,
    path:      '/',
  });
};
const clearCookie = (res, name) => res.clearCookie(name, { httpOnly: true, secure: true, sameSite: 'none', path: '/' });


// ── Password hashing — argon2id for new passwords, bcrypt for legacy ─────────
const hashPassword = (plain) => argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });

const verifyPassword = async (plain, stored) => {
  // argon2 hashes start with "$argon2"
  if (stored && stored.startsWith('$argon2')) return argon2.verify(stored, plain);
  // Legacy bcrypt hashes start with "$2a$" or "$2b$"
  return bcrypt.compare(plain, stored);
};

// On successful bcrypt login, silently re-hash with argon2 for next time
const rehashIfLegacy = async (userId, plain, stored, table = 'users') => {
  if (!stored || stored.startsWith('$argon2')) return; // already modern
  try {
    const newHash = await hashPassword(plain);
    await supabase.from(table).update({ password_hash: newHash }).eq('id', userId);
  } catch {}
};

const { sendEmail } = require('../utils/email');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /auth/send-verification-code — step 1: validate details, send 6-digit code
const sendVerificationCode = async (req, res) => {
  try {
    const { full_name, email, password, username, date_of_birth } = req.body;

    if (!full_name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (!username || username.trim().length < 3)
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
      return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const cleanEmail    = email.toLowerCase().trim();
    const cleanUsername = username.trim().toLowerCase();

    // Check availability before sending code
    const { data: existing } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const { data: existingUser } = await supabase.from('users').select('id').eq('username', cleanUsername).maybeSingle();
    if (existingUser) return res.status(400).json({ error: 'Username already taken' });

    // Generate 6-digit code, expires in 15 min
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store pending signup in DB (upsert on email)
    await supabase.from('pending_signups').upsert({
      email:      cleanEmail,
      full_name,
      username:   cleanUsername,
      password:   await hashPassword(password), // hash immediately so plain password never stays in DB
      date_of_birth: date_of_birth || null,
      code,
      expires_at: expires,
      created_at: new Date(),
    }, { onConflict: 'email' });

    // Send code via email
    const appName = 'Thankeeu';
    await sendEmail({
      to: cleanEmail,
      subject: `${code} is your ${appName} verification code`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #eee;">
          <h2 style="color:#5B4BDF;margin:0 0 8px;">Verify your email</h2>
          <p style="color:#555;margin:0 0 24px;">Enter this code on the Thankeeu signup page to activate your account:</p>
          <div style="background:#F5F0FF;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
            <p style="font-size:40px;font-weight:800;letter-spacing:12px;color:#5B4BDF;margin:0;">${code}</p>
          </div>
          <p style="color:#888;font-size:13px;margin:0 0 4px;">This code expires in <strong>15 minutes</strong>.</p>
          <p style="color:#888;font-size:13px;margin:0;">If you did not request this, you can safely ignore this email.</p>
        </div>`
    });

    res.json({ ok: true, message: `Verification code sent to ${cleanEmail}` });
  } catch (err) {
    console.error('sendVerificationCode error:', err);
    res.status(500).json({ error: err.message || 'Failed to send verification code' });
  }
};

// POST /auth/verify-code — step 2: verify code and create account
const verifyCodeAndSignup = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    const cleanEmail = email.toLowerCase().trim();

    const { data: pending } = await supabase.from('pending_signups')
      .select('*').eq('email', cleanEmail).maybeSingle();

    if (!pending) return res.status(400).json({ error: 'No pending signup found. Please start over.' });
    if (pending.code !== String(code).trim())
      return res.status(400).json({ error: 'Incorrect code. Please check your email and try again.' });
    if (new Date(pending.expires_at) < new Date())
      return res.status(400).json({ error: 'Code has expired. Please start the signup again.' });

    // Create the account
    const { data: user, error } = await supabase.from('users').insert({
      full_name:          pending.full_name,
      email:              cleanEmail,
      username:           pending.username,
      password_hash:      pending.password,
      is_verified:        true, // email confirmed at signup
      verification_token: null,
      ...(pending.date_of_birth ? { date_of_birth: pending.date_of_birth } : {}),
      terms_accepted_at:  new Date(),
    }).select('id, email, full_name, username, role, avatar_url, is_verified').single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Email or username already registered' });
      throw error;
    }

    // Clean up pending record
    await supabase.from('pending_signups').delete().eq('email', cleanEmail);

    // Send welcome email
    sendEmail({
      to: cleanEmail,
      subject: `Welcome to Thankeeu, ${pending.full_name}!`,
      html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;">
        <h2 style="color:#5B4BDF;">Welcome, ${pending.full_name}!</h2>
        <p style="color:#555;">Your account is verified and ready. Create your first card and start celebrating the people who matter.</p>
        <a href="${process.env.FRONTEND_URL || 'https://thankeeu.com'}/dashboard" style="display:inline-block;background:#5B4BDF;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Go to dashboard</a>
      </div>`
    }).catch(() => {});

    // Auto-link any cards sent to this email
    setImmediate(async () => {
      try {
        const { data: sentCards } = await supabase.from('cards').select('id,slug,creator_id')
          .eq('recipient_email', cleanEmail).in('status',['sent','active']);
        for (const card of (sentCards||[])) {
          await supabase.from('received_cards').upsert({
            card_id: card.id, recipient_user_id: user.id, transferred_by: card.creator_id, transferred_at: new Date(),
          },{ onConflict:'card_id,recipient_user_id' });
        }
      } catch(e) { console.error('Auto-link failed:',e); }
    });

    const token = generateToken(user.id);
    setCookie(res, 'tk_user', token);
    res.json({token, user });
  } catch (err) {
    console.error('verifyCodeAndSignup error:', err);
    res.status(500).json({ error: err.message || 'Failed to create account' });
  }
};

const signup = async (req, res) => {
  try {
    const { full_name, email, password, username, date_of_birth } = req.body;

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

    const password_hash = await hashPassword(password);
    const verification_token = crypto.randomBytes(32).toString('hex');

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        full_name, email: cleanEmail, username: cleanUsername, password_hash, verification_token,
        ...(date_of_birth ? { date_of_birth } : {}),
        terms_accepted_at: new Date(),
      })
      .select('id, email, full_name, username, role, avatar_url, is_verified')
      .single();

    if (error) {
      console.error('Signup DB error:', error);
      if (error.code === '23505') return res.status(400).json({ error: 'Email or username already registered' });
      throw error;
    }

    // Send welcome + verification email
    const appUrl = FRONTEND_URL;
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

    const valid = await verifyPassword(password, user.password_hash);
    if (valid) await rehashIfLegacy(user.id, password, user.password_hash, 'users');
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

    setCookie(res, 'tk_user', token);

    res.json({token, user: safeUser });
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
    const valid = await verifyPassword(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const password_hash = await hashPassword(new_password);
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

    const password_hash = await hashPassword(password);
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
    const password_hash = await hashPassword(adminPassword);

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

    const appUrl = FRONTEND_URL;
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
  sendVerificationCode,
  verifyCodeAndSignup,
  signup, login, getMe, updateProfile, searchUsers,
  changePassword, uploadAvatar, forgotPassword, resetPassword, seedAdmin,
  verifyEmail, resendVerification
};
