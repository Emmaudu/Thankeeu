const bcrypt = require('bcryptjs');
const argon2  = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const {
  validateEmail, validatePassword, sanitizeName, sanitizeUsername,
  sanitizeDate, isSanitizeError,
} = require('../utils/sanitize');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
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
    const raw = req.body;

    // ── Sanitize & validate all fields before any DB access ──────────────
    const cleanEmail    = validateEmail(raw.email);
    const cleanPassword = validatePassword(raw.password);
    const cleanName     = sanitizeName(raw.full_name, 'Full name');
    const cleanUsername = sanitizeUsername(raw.username);
    const cleanDOB      = sanitizeDate(raw.date_of_birth, 'Date of birth');
    // ─────────────────────────────────────────────────────────────────────

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
      email:        cleanEmail,
      full_name:    cleanName,
      username:     cleanUsername,
      password:     await hashPassword(cleanPassword), // hash immediately so plain password never stays in DB
      date_of_birth: cleanDOB,
      code,
      expires_at:   expires,
      created_at:   new Date(),
    }, { onConflict: 'email' });

    // Send code via email
    const appName = 'Thankeeu';
    const emailResult = await sendEmail({
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

    if (!emailResult?.success) {
      console.error('sendVerificationCode: email delivery failed for', cleanEmail, emailResult?.error);
      // Roll back the pending signup so the user isn't stuck in limbo with a code that never arrived
      await supabase.from('pending_signups').delete().eq('email', cleanEmail);
      return res.status(502).json({ error: 'Could not send verification email. Please try again in a moment, or check your email address is correct.' });
    }

    res.json({ ok: true, message: `Verification code sent to ${cleanEmail}` });
  } catch (err) {
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    console.error('sendVerificationCode error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /auth/verify-code — step 2: verify code and create account
const verifyCodeAndSignup = async (req, res) => {
  try {
    const cleanEmail = validateEmail(req.body.email, 'Email');
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Verification code is required' });

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
    }).select('id, email, full_name, username, role, avatar_url, is_verified').maybeSingle();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Email or username already registered' });
      throw error;
    }

    // Clean up pending record
    await supabase.from('pending_signups').delete().eq('email', cleanEmail);

    // ── Welcome credit ──────────────────────────────────────────────────
    // One free credit per new account, so a first card can go out without a
    // payment step. Granted at signup rather than lazily on first use, so the
    // balance endpoint reports it honestly from the moment they land.
    //
    // NOTE: this is one free card per EMAIL ADDRESS, not per person — see
    // DEPLOY_NOTES §5. If farming shows up, gate it on is_verified.
    try {
      // supabase-js RESOLVES with { error } rather than throwing, so the catch
      // alone would never fire and a failed grant would be invisible.
      const { error: creditErr } = await supabase.from('card_credits').insert({
        user_id:           user.id,
        credits_remaining: 1,
        total_purchased:   0,            // granted, never bought
        plan_type_v2:      'welcome_free',
      });
      if (creditErr) console.error('signup: welcome credit failed for', user.id, creditErr.message);
    } catch (thrown) {
      // A missing welcome credit must never block a signup — they can still pay.
      console.error('signup: welcome credit threw for', user.id, thrown.message);
    }

    // Mark any matching guest visitor record as converted (for admin Guests tab)
    try {
      await supabase.from('visitors')
        .update({ converted_to_user: user.id, converted_at: new Date() })
        .eq('email', cleanEmail)
        .is('converted_to_user', null);
    } catch (_) { /* visitors table may not exist yet — non-fatal */ }

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
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    console.error('verifyCodeAndSignup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const signup = async (req, res) => {
  try {
    const raw = req.body;

    // ── Sanitize & validate ───────────────────────────────────────────────
    const cleanEmail    = validateEmail(raw.email);
    const cleanPassword = validatePassword(raw.password);
    const cleanName     = sanitizeName(raw.full_name, 'Full name');
    const cleanUsername = sanitizeUsername(raw.username);
    const cleanDOB      = sanitizeDate(raw.date_of_birth, 'Date of birth');
    // ─────────────────────────────────────────────────────────────────────

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const { data: existingUsername } = await supabase
      .from('users').select('id').eq('username', cleanUsername).maybeSingle();
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

    const password_hash = await hashPassword(cleanPassword);
    const verification_token = crypto.randomBytes(32).toString('hex');

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        full_name: cleanName, email: cleanEmail, username: cleanUsername,
        password_hash, verification_token,
        ...(cleanDOB ? { date_of_birth: cleanDOB } : {}),
        terms_accepted_at: new Date(),
      })
      .select('id, email, full_name, username, role, avatar_url, is_verified')
      .maybeSingle();

    if (error) {
      console.error('Signup DB error:', error);
      if (error.code === '23505') return res.status(400).json({ error: 'Email or username already registered' });
      throw error;
    }

    // ── Welcome credit ──────────────────────────────────────────────────
    // One free credit per new account, so a first card can go out without a
    // payment step. Granted at signup rather than lazily on first use, so the
    // balance endpoint reports it honestly from the moment they land.
    //
    // NOTE: this is one free card per EMAIL ADDRESS, not per person — see
    // DEPLOY_NOTES §5. If farming shows up, gate it on is_verified.
    try {
      // supabase-js RESOLVES with { error } rather than throwing, so the catch
      // alone would never fire and a failed grant would be invisible.
      const { error: creditErr } = await supabase.from('card_credits').insert({
        user_id:           user.id,
        credits_remaining: 1,
        total_purchased:   0,            // granted, never bought
        plan_type_v2:      'welcome_free',
      });
      if (creditErr) console.error('signup: welcome credit failed for', user.id, creditErr.message);
    } catch (thrown) {
      // A missing welcome credit must never block a signup — they can still pay.
      console.error('signup: welcome credit threw for', user.id, thrown.message);
    }

    // Mark any matching guest visitor record as converted (for admin Guests tab)
    try {
      await supabase.from('visitors')
        .update({ converted_to_user: user.id, converted_at: new Date() })
        .eq('email', cleanEmail)
        .is('converted_to_user', null);
    } catch (_) { /* visitors table may not exist yet — non-fatal */ }

    // Send welcome + verification email
    const appUrl = FRONTEND_URL;
    const verifyLink = `${appUrl}/verify-email?token=${verification_token}`;
    sendEmail({ to: cleanEmail, template: 'emailVerification', data: { name: cleanName, verifyLink } })
      .catch(e => console.error('Verification email failed:', e));
    sendEmail({ to: cleanEmail, template: 'welcome', data: { name: cleanName } })
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
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

/**
 * POST /auth/quick-start — one field, no password, for the free test card.
 *
 * The visitor types only an email. We create the account, sign them in, and
 * email them a link to choose a password later.
 *
 * The password we set here is CRYPTOGRAPHICALLY RANDOM and is never shown to
 * anyone, not even the user. A shared default (testcard@#2026#, say) would
 * ship inside the frontend bundle, where anyone can read it, and would then
 * open every quick-start account to whoever can guess an email address —
 * along with that person's cards, their recipients' addresses, and any credits
 * or Send Money history on the account. Random-and-unknown gives the identical
 * one-field experience with none of that.
 *
 * An email that ALREADY has an account is never signed in here: knowing
 * someone's address must not be enough to get into their account. Those get
 * { existing: true } and are asked for their password on the client.
 */
const quickStart = async (req, res) => {
  try {
    const cleanEmail = validateEmail(req.body?.email);
    const cleanName  = req.body?.full_name
      ? sanitizeName(req.body.full_name, 'Full name')
      : (cleanEmail.split('@')[0] || 'Friend');

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) {
      return res.json({ existing: true, message: 'That email already has an account — please sign in.' });
    }

    // 32 random bytes, hashed like any other password and immediately forgotten.
    const throwaway = crypto.randomBytes(32).toString('hex');
    const password_hash = await hashPassword(throwaway);
    const verification_token = crypto.randomBytes(32).toString('hex');
    const reset_token = crypto.randomBytes(32).toString('hex');
    // Generous: they have not chosen a password yet, so this link is their way in.
    const reset_token_expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let username = `${(cleanEmail.split('@')[0] || 'friend').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'friend'}${Math.floor(1000 + Math.random() * 9000)}`;
    let user = null;
    for (let attempt = 0; attempt < 3 && !user; attempt++) {
      const { data, error } = await supabase.from('users').insert({
        full_name: cleanName, email: cleanEmail, username,
        password_hash, verification_token, reset_token, reset_token_expires,
        must_set_password: true, terms_accepted_at: new Date(),
      }).select('id, email, full_name, username, role, avatar_url, is_verified').maybeSingle();
      if (data) { user = data; break; }
      if (error && error.code === '23505') {
        username = `${username.slice(0, 14)}${Math.floor(1000 + Math.random() * 9000)}`;
        continue;                                   // username clash — try another
      }
      if (error) { console.error('quickStart insert error:', error.message); break; }
    }
    if (!user) return res.status(500).json({ error: 'Could not start your card. Please try again.' });

    // Welcome credit, same as every other new account.
    const { error: creditErr } = await supabase.from('card_credits').insert({
      user_id: user.id, credits_remaining: 1, total_purchased: 0, plan_type_v2: 'welcome_free',
    });
    if (creditErr) console.error('quickStart: welcome credit failed for', user.id, creditErr.message);

    // Tell them how to take ownership of the account. Best effort.
    try {
      await sendEmail({
        to: cleanEmail,
        template: 'testCardWelcome',
        data: {
          name: String(cleanName).split(' ')[0],
          resetUrl: `${process.env.FRONTEND_URL || 'https://www.thankeeu.com'}/reset-password?token=${reset_token}`,
        },
      });
    } catch (mailErr) {
      console.error('quickStart: welcome email failed:', mailErr.message);
    }

    const token = generateToken(user.id);
    setCookie(res, 'tk_user', token, process.env.JWT_EXPIRES_IN || '7d');
    return res.json({ token, user, must_set_password: true });
  } catch (err) {
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    console.error('quickStart error:', err.message);
    return res.status(500).json({ error: 'Could not start your card. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const cleanEmail    = validateEmail(req.body.email);
    const cleanPassword = validatePassword(req.body.password);

    const { data: user } = await supabase
      .from('users').select('*').eq('email', cleanEmail).maybeSingle();
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await verifyPassword(cleanPassword, user.password_hash);
    if (valid) await rehashIfLegacy(user.id, cleanPassword, user.password_hash, 'users');
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Note: email verification is encouraged at signup (verification link sent),
    // but is NOT required to log in — login works regardless of is_verified status.

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
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
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
      .maybeSingle();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const raw = req.body;
    const { sanitizeName, sanitizeUsername, sanitizeText, isSanitizeError } = require('../utils/sanitize');

    const cleanName = raw.full_name !== undefined
      ? sanitizeName(raw.full_name, 'Full name', { required: false, maxLen: 100 }) : undefined;
    const cleanBio  = raw.bio !== undefined
      ? sanitizeText(raw.bio, 'Bio', { maxLen: 300 }) : undefined;

    let cleanUsername;
    if (raw.username) {
      cleanUsername = sanitizeUsername(raw.username, 'Username');
      const { data: taken } = await supabase.from('users').select('id').eq('username', cleanUsername).neq('id', req.user.id).maybeSingle();
      if (taken) return res.status(400).json({ error: 'Username already taken' });
    }

    const updates = { updated_at: new Date() };
    if (cleanName     !== undefined) updates.full_name = cleanName;
    if (cleanBio      !== undefined) updates.bio       = cleanBio;
    if (cleanUsername !== undefined) updates.username  = cleanUsername;
    if (raw.avatar_url !== undefined) updates.avatar_url = raw.avatar_url; // URL from Cloudinary — trusted

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, full_name, username, role, avatar_url, bio')
      .maybeSingle();
    if (error) throw error;

    // If the user included a name change, propagate it to all messages
    // they signed as a logged-in user (signer_user_id links them).
    if (cleanName !== undefined) {
      try {
        await supabase
          .from('messages')
          .update({ author_name: cleanName })
          .eq('signer_user_id', req.user.id);
      } catch (syncErr) {
        // Non-fatal — signer_user_id column may not exist yet if migration hasn't run
        console.warn('[updateProfile] author_name sync skipped:', syncErr.message);
      }
    }

    res.json(user);
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { safeQueryString } = require('../utils/paramGuard');
    const q = safeQueryString(req.query.q, 'q', { maxLen: 50 });
    if (!q || q.trim().length < 2)
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    // Strip any non-alphanumeric except spaces/hyphens before passing to ILIKE
    const safeQ = q.trim().replace(/[^a-zA-Z0-9\s\-_'.]/g, '').trim();
    if (!safeQ) return res.json([]);
    const { data } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url')
      .ilike('username', `%${safeQ}%`)
      .neq('id', req.user.id)
      .limit(8);
    res.json(data || []);
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Search failed' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'Both passwords are required' });
    // Use validatePassword which also checks the 72-byte bcrypt limit
    const { validatePassword } = require('../utils/sanitize');
    const cleanNew = validatePassword(new_password, 'New password');
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.id).maybeSingle();
    if (!user) return res.status(404).json({ error: 'Account not found' });
    const valid = await verifyPassword(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const password_hash = await hashPassword(cleanNew);
    await supabase.from('users').update({ password_hash }).eq('id', req.user.id);
    res.json({ message: 'Password changed' });
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Failed to change password' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path }); // Cloudinary returns path as URL
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Upload failed' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    // Validate email format before hitting the DB — prevents garbage strings
    // from being passed to .eq() and leaking timing info via DB errors
    let cleanEmail;
    try { cleanEmail = validateEmail(req.body.email); }
    catch { return res.json({ message: 'If email exists, reset link sent' }); } // silent fail — don't confirm email existence

    const { data: user } = await supabase.from('users').select('id, full_name').eq('email', cleanEmail).maybeSingle();
    if (!user) return res.json({ message: 'If email exists, reset link sent' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await supabase.from('users').update({
      reset_token: token, reset_token_expires: expires
    }).eq('id', user.id);

    await sendEmail({ to: cleanEmail, template: 'passwordReset', data: { token, name: user.full_name } });
    res.json({ message: 'If email exists, reset link sent' });
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.body;
    // Validate new password before hashing — prevents DoS via huge password strings
    let cleanPassword;
    try { cleanPassword = validatePassword(req.body.password); }
    catch (e) { return res.status(400).json({ error: e.error || 'Invalid password' }); }

    if (!token || typeof token !== 'string' || token.length > 200)
      return res.status(400).json({ error: 'Invalid reset token' });

    const { data: user } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token.trim())
      .maybeSingle();

    if (!user || new Date(user.reset_token_expires) < new Date())
      return res.status(400).json({ error: 'Invalid or expired reset token' });

    const password_hash = await hashPassword(cleanPassword);
    await supabase.from('users').update({
      password_hash, reset_token: null, reset_token_expires: null
    }).eq('id', user.id);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

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
      .maybeSingle();

    if (error) throw error;
    res.status(201).json({ message: 'Admin created', email: adminEmail, seeded: true });
  } catch (err) {
    console.error(err);
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

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
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

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
      .maybeSingle();

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
    const { isSanitizeError } = require('../utils/sanitize');

    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });

    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};


// Single export at the end — after ALL functions are defined
module.exports = {
  quickStart,
  sendVerificationCode,
  verifyCodeAndSignup,
  signup, login, getMe, updateProfile, searchUsers,
  changePassword, uploadAvatar, forgotPassword, resetPassword, seedAdmin,
  verifyEmail, resendVerification
};
