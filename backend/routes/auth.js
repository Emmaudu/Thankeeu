const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const supabase = require('../utils/supabase');
const { ensureProfileSlug } = require('../utils/profileSlug');
const { authenticate } = require('../middleware/auth');
const { uploadKYC, uploadAvatar, uploadAvatarBuffer, uploadKYCBuffer } = require('../utils/cloudinary');
const { checkPasswordLength } = require('../middleware/sanitize');
const { listBanks, resolveAccountNumber } = require('../utils/flutterwave');
const {
  sendWelcomeEmail,
  sendRequesterVerificationEmail,
  sendTaskerWelcomeEmail,
  sendPasswordResetEmail,
} = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// users.phone is VARCHAR(20). Users paste numbers with spaces, brackets and
// dashes ("+234 (0) 803 123 4567") which blow past 20 chars and make Postgres
// throw "value too long for type character varying(20)". Strip formatting to
// digits and a leading +, then cap at 20 so the insert can never overflow.
const normalizePhone = (raw) => {
  if (!raw) return null;
  let p = String(raw).trim().replace(/[\s()\-.]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  p = p.replace(/(?!^\+)[^\d]/g, '');
  return p.slice(0, 20);
};

const genVerificationToken = () => crypto.randomBytes(32).toString('hex');

const { parseCountry, getCountry } = require('../utils/countries');

/** Market (Taskeeu site) a signup belongs to: the site it was made on. Unknown → reject. */
function readMarket(raw) {
  if (raw === undefined || raw === null || raw === '') return 'NG';
  return parseCountry(raw);
}

/** Save the account's market. Nigeria is the column default, so only others need a write. */
async function saveMarket(userId, market) {
  if (!market || market === 'NG') return null;
  const { error } = await supabase.from('users').update({ market }).eq('id', userId);
  return error || null;
}

// Record a referral if the new user signed up via someone's referral link.
// Best-effort: never throws / never blocks signup. Self-referral and unknown
// slugs are silently ignored, and the DB unique constraint prevents a user
// from being attributed to more than one referrer.
async function attributeReferral(newUserId, rawSlug, rawPin) {
  try {
    // ── Attribution by referral slug (link-based) ──────────────────
    let referrerId = null;
    let slugUsed = null;
    if (rawSlug) {
      const slug = String(rawSlug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (slug) {
        const { data: referrer } = await supabase.from('users').select('id').eq('referral_slug', slug).maybeSingle();
        if (referrer && referrer.id !== newUserId) { referrerId = referrer.id; slugUsed = slug; }
      }
    }
    // ── Attribution by 4-char PIN (poster-based) ───────────────────
    if (!referrerId && rawPin) {
      const pin = String(rawPin).toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
      if (pin.length === 4) {
        const { data: referrer } = await supabase.from('users').select('id').eq('referral_pin', pin).maybeSingle();
        if (referrer && referrer.id !== newUserId) { referrerId = referrer.id; slugUsed = `pin:${pin}`; }
      }
    }
    if (!referrerId) return;
    await supabase.from('users').update({ referred_by: referrerId }).eq('id', newUserId);
    await supabase.from('referrals').insert({ referrer_id: referrerId, referred_user_id: newUserId, slug_used: slugUsed });
  } catch (e) {
    console.warn('attributeReferral warn:', e?.message);
  }
}

// ─── POST /auth/register/requester ────────────────────────────────
// Creates account (unverified), sends verification email link
router.post(
  '/register/requester',
  checkPasswordLength,
  [
    body('email').trim().toLowerCase().isEmail().withMessage('Please enter a valid email address'),
    body('full_name').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: letters, numbers, underscores only'),
    body('phone').trim().isLength({ min: 5 }).withMessage('Please enter a valid phone number with country code'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msg = errors.array()[0]?.msg || 'Please check your details';
      return res.status(400).json({ success: false, message: msg });
    }

    const { email, full_name, username, phone, password } = req.body;
    const market = readMarket(req.body.market);
    if (!market) return res.status(400).json({ success: false, message: 'Please choose the country you live in.' });

    try {
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', 'requester')
        .maybeSingle();
      if (existing) {
        const em = getCountry(existing.market || 'NG');
        if (em.code !== market) {
          return res.status(409).json({ success: false, code: 'WRONG_COUNTRY', country: em.code, country_slug: em.slug,
            message: `This email already has a Taskeeu ${em.name} account. Log in on Taskeeu ${em.name} instead.` });
        }
        return res.status(409).json({ success: false, message: 'Email already registered as a requester' });
      }

      // Check username uniqueness (username added via ALTER TABLE - may not be in schema cache)
      try {
        const { data: usernameTaken } = await supabase
          .from('users').select('id')
          .eq('username', username.toLowerCase()).eq('role', 'requester').maybeSingle();
        if (usernameTaken)
          return res.status(409).json({ success: false, message: 'Username already taken. Please choose another.' });
      } catch (_e) {
        // Schema cache doesn't know username column yet - skip check, DB unique constraint will catch it
        console.warn('Username check skipped (schema cache):', _e?.message);
      }

      const password_hash = await bcrypt.hash(password, 12);
      const verification_token = genVerificationToken();
      const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Insert only original-schema columns to avoid PostgREST schema cache issues
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email, full_name, phone: normalizePhone(phone), password_hash, role: 'requester',
          email_verified: false,
        })
        .select()
        .single();

      if (error) throw error;

      const marketErr = await saveMarket(user.id, market);
      if (marketErr) {
        await supabase.from('users').delete().eq('id', user.id);
        console.error('Register requester market error:', marketErr.message);
        return res.status(503).json({ success: false, message: 'Sign up for this country is not available yet. Please try again later.' });
      }

      // Set ALTER TABLE columns via raw SQL RPC (bypasses schema cache)
      try { await supabase.rpc('set_user_verification_token', {
        p_user_id: user.id,
        p_username: username.toLowerCase(),
        p_token: verification_token,
        p_expires: verification_expires,
      }); } catch(e) { console.warn('set_user_verification_token warn:', e?.message); }

      // Generate and SAVE the referral pin — await it so we know if it worked.
      const generatePin = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      };
      let pin = generatePin();
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase.from('users').select('id').eq('referral_pin', pin).maybeSingle();
        if (!existing) break;
        pin = generatePin();
      }
      const { error: pinError } = await supabase.from('users').update({ referral_pin: pin }).eq('id', user.id);
      if (pinError) console.warn('referral_pin save failed:', pinError.message);

      await supabase.from('requester_profiles').insert({ user_id: user.id });
      await attributeReferral(user.id, req.body.referral_slug, req.body.referral_pin);
      try {
        await sendRequesterVerificationEmail(email, full_name, verification_token);
      } catch (_) {}

      res.status(201).json({
        success: true,
        message: 'Account created! Please check your email to verify your account.',
      });
    } catch (err) {
      console.error('Register requester error:', err);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }
);

// ─── Shared verification logic (used by both routes below) ────────
async function performEmailVerification(token, role) {
  // Look up user by verification token via RPC (token col added via ALTER TABLE)
  const { data: tokenData, error: tokenErr } = await supabase
    .rpc('get_user_by_verification_token', { p_token: token, p_role: role || 'requester' });

  const user = tokenData?.[0] || null;

  if (tokenErr || !user)
    return { ok: false, message: 'Invalid or expired verification link' };

  if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date())
    return { ok: false, message: 'Verification link has expired. Please register again.' };

  // Mark verified, clear token via RPC
  await supabase.from('users').update({ email_verified: true }).eq('id', user.id);
  try { await supabase.rpc('clear_verification_token', { p_user_id: user.id }); } catch(e) { console.warn('clear_verification_token warn:', e?.message); }

  // Send welcome email
  await sendWelcomeEmail(user.email, user.full_name);

  return { ok: true, token: signToken(user.id), role: user.role };
}

// ─── GET /auth/verify-email/check — JSON API ───────────────────────
// Called by the frontend's /auth/verify-email page (via fetch) so the
// link in the email can point at the branded frontend domain instead of
// exposing the raw backend URL to end users, while the actual DB
// verification still happens here on the backend.
router.get('/verify-email/check', async (req, res) => {
  const { token, role } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'Missing token' });

  try {
    const result = await performEmailVerification(token, role);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    res.json({ success: true, token: result.token, role: result.role });
  } catch (err) {
    console.error('Verify email (check) error:', err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// ─── GET /auth/verify-email — legacy direct-hit redirect route ────
// Kept working for any already-sent emails still using the old
// backend-direct link. New emails use /verify-email/check above instead.
router.get('/verify-email', async (req, res) => {
  const { token, role } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'Missing token' });

  try {
    const result = await performEmailVerification(token, role);
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://taskeeu.com'}/auth/verified?token=${result.token}&role=${result.role}`;
    return res.redirect(dashboardUrl);
  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// ─── GET /auth/tasker-approved ─────────────────────────────────────
// Tasker clicks approval link from email → auto logs in → redirects to dashboard
router.get('/tasker-approved', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'Missing token' });

  try {
    // Decode the JWT token issued at approval time
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active')
      .eq('id', decoded.id)
      .eq('role', 'tasker')
      .maybeSingle();

    if (!user || !user.is_active)
      return res.status(400).json({ success: false, message: 'Invalid or expired link' });

    // Issue fresh token and redirect
    const freshToken = signToken(user.id);
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://taskeeu.com'}/auth/verified?token=${freshToken}&role=tasker`;
    return res.redirect(dashboardUrl);
  } catch (err) {
    // Token expired — redirect to login with a message
    const loginUrl = `${process.env.FRONTEND_URL || 'https://taskeeu.com'}/tasker/login?reason=link_expired`;
    return res.redirect(loginUrl);
  }
});

// ─── POST /auth/register/tasker/step1-validate ────────────────────
// Validates basic info WITHOUT creating account. Returns OK if valid.
router.post(
  '/register/tasker/step1-validate',
  checkPasswordLength,
  [
    body('email').trim().toLowerCase().isEmail().withMessage('Please enter a valid email address'),
    body('full_name').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: letters, numbers, and underscores only'),
    body('phone').trim().isLength({ min: 5 }).withMessage('Please enter a valid phone number with country code'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msg = errors.array()[0]?.msg || 'Please check your details';
      return res.status(400).json({ success: false, message: msg });
    }

    const { email, username } = req.body;
    const market = readMarket(req.body.market);
    if (!market) return res.status(400).json({ success: false, message: 'Please choose the country you live in.' });
    try {
      const { data: emailTaken } = await supabase.from('users').select('*').eq('email', email).eq('role', 'tasker').maybeSingle();
      if (emailTaken) {
        const em = getCountry(emailTaken.market || 'NG');
        if (em.code !== market) return res.status(409).json({ success: false, code: 'WRONG_COUNTRY', country: em.code, country_slug: em.slug, message: `This email already has a tasker account on Taskeeu ${em.name}. Log in there instead.` });
        return res.status(409).json({ success: false, message: 'Email already registered as a tasker. Please log in.' });
      }
      try {
        const { data: usernameTaken } = await supabase.from('users').select('id').eq('username', username.toLowerCase()).eq('role', 'tasker').maybeSingle();
        if (usernameTaken) return res.status(409).json({ success: false, message: 'Username already taken. Please choose another.' });
      } catch (_e) { console.warn('Username check skipped (schema cache):', _e?.message); }
      res.json({ success: true, message: 'Details valid' });
    } catch (err) {
      console.error('Step1 validate error:', err?.message || err);
      // Return the actual error in non-production so it can be debugged
      const msg = process.env.NODE_ENV === 'production'
        ? 'Registration check failed. Please try again.'
        : (err?.message || 'Validation failed');
      res.status(500).json({ success: false, message: msg });
    }
  }
);

// ─── POST /auth/register/tasker/step2 (avatar upload) ─────────────
// Photo is uploaded temporarily (no account yet). We store it in a
// temp Cloudinary folder and return the URL for step3 to use.
router.post(
  '/register/tasker/step2',
  uploadAvatar.single('avatar'),
  async (req, res) => {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        return res.json({ success: true, message: 'Photo step skipped', avatar_url: null });
      }
      if (!req.file?.buffer) {
        return res.status(400).json({ success: false, message: 'No image received. Please select a photo.' });
      }
      const result = await uploadAvatarBuffer(req.file.buffer);
      // Return public_id alongside secure_url so the frontend can pass it
      // back to step3. If the user abandons after step2, step3 never runs and
      // the orphaned image remains — this is acceptable since Cloudinary
      // storage is cheap and we clean up on step3 failure anyway.
      res.json({ success: true, message: 'Photo uploaded!', avatar_url: result.secure_url, avatar_public_id: result.public_id });
    } catch (err) {
      console.error('Step2 error:', err?.message || err);
      res.status(400).json({ success: false, message: `Photo upload failed: ${err?.message || 'Unknown error'}. Please try again.` });
    }
  }
);

// ─── POST /auth/register/tasker/step3 (CREATE ACCOUNT + profile + docs) ──
// Account is created HERE at final submission only. No authenticate required.
router.post(
  '/register/tasker/step3',
  uploadKYC.fields([
    { name: 'id_document',      maxCount: 1 },   // required: one of passport/national_id/driver_license/nin
    { name: 'proof_of_address', maxCount: 1 },   // optional in Nigeria, required in international markets
    { name: 'right_to_work',    maxCount: 1 },   // international markets: required
    { name: 'police_check',     maxCount: 1 },   // international markets: optional
  ]),
  async (req, res) => {
    // Declared OUTSIDE the try so the catch block can always reach it.
    // If this lived inside the try, any throw before its initialiser would
    // put it in the temporal dead zone and the catch would raise an
    // uncaught ReferenceError, crashing the process.
    const uploadedPublicIds = [];
    try {
      const {
        email, full_name, username, phone, password,
        task_city, task_state, bio, skills,
        linkedin_url, resume_url, motivation,
        avatar_url, avatar_public_id, id_document_type,
      } = req.body;

      // Track uploaded Cloudinary public_ids for cleanup on failure
      if (avatar_public_id) uploadedPublicIds.push(avatar_public_id);

      // Password length guard (req.body is populated by multer before this runs)
      if (password && Buffer.byteLength(String(password), 'utf8') > 72) {
        return res.status(400).json({ success: false, message: 'Password must be 72 characters or fewer' });
      }

      // ── Validation ────────────────────────────────────────────────
      if (!email || !full_name || !username || !phone || !password)
        return res.status(400).json({ success: false, message: 'Missing required account fields' });
      if (!task_city || !task_state)
        return res.status(400).json({ success: false, message: 'Task city and state are required' });
      if (!motivation || motivation.trim().length < 30)
        return res.status(400).json({ success: false, message: 'Please share your motivation (at least 30 characters)' });
      if (bio && bio.trim().length > 0 && bio.trim().length < 30)
        return res.status(400).json({ success: false, message: 'Your pitch/bio must be at least 30 characters' });
      const market = readMarket(req.body.market);
      if (!market) return res.status(400).json({ success: false, message: 'Please choose the country you live in.' });
      const intl = market !== 'NG';
      if (!req.files?.id_document?.[0])
        return res.status(400).json({ success: false, message: intl ? 'A photo ID is required. Upload your passport, driving licence or national ID card.' : 'An identity document is required. Upload your passport, national ID, driver\'s license, or NIN slip.' });
      if (intl && !req.files?.proof_of_address?.[0])
        return res.status(400).json({ success: false, message: 'Proof of address is required. Upload a recent utility bill, bank statement or council letter.' });
      if (intl && !req.files?.right_to_work?.[0])
        return res.status(400).json({ success: false, message: 'Proof of your right to work is required. Upload a passport, visa, residence permit or work permit.' });

      // ── Upload ID document to Cloudinary ─────────────────────────
      let id_doc_url = null;
      try {
        const result = await uploadKYCBuffer(req.files.id_document[0].buffer);
        id_doc_url = result.secure_url;
      } catch (err) {
        console.error('ID doc upload error:', err?.message);
        return res.status(400).json({ success: false, message: `Identity document upload failed: ${err?.message || 'Please try a smaller file or different format.'}` });
      }

      // ── Upload proof of address (optional) ────────────────────────
      let proof_of_address_url = null;
      if (req.files?.proof_of_address?.[0]) {
        try {
          const result = await uploadKYCBuffer(req.files.proof_of_address[0].buffer);
          proof_of_address_url = result.secure_url;
        } catch (err) {
          console.error('Proof of address upload error:', err?.message);
          // Non-fatal — can be added later in KYC tab
        }
      }

      // ── Right to work and police check (international markets) ────
      let right_to_work_url = null, police_check_url = null;
      for (const [field, setter] of [['right_to_work', (u) => { right_to_work_url = u; }], ['police_check', (u) => { police_check_url = u; }]]) {
        if (!req.files?.[field]?.[0]) continue;
        try {
          const result = await uploadKYCBuffer(req.files[field][0].buffer);
          setter(result.secure_url);
          if (result.public_id) uploadedPublicIds.push(result.public_id);
        } catch (err) {
          console.error(`${field} upload error:`, err?.message);
          if (field === 'right_to_work') return res.status(400).json({ success: false, message: `Right to work document upload failed: ${err?.message || 'Please try a smaller file or different format.'}` });
        }
      }
      if (intl && !proof_of_address_url)
        return res.status(400).json({ success: false, message: 'Proof of address upload failed. Please try a smaller file or a different format.' });

      // ── Uniqueness check ─────────────────────────────────────────
      const [{ data: emailTaken }, { data: usernameTaken }] = await Promise.all([
        supabase.from('users').select('id').eq('email', email).eq('role', 'tasker').maybeSingle(),
        supabase.from('users').select('id').eq('username', username.toLowerCase()).eq('role', 'tasker').maybeSingle(),
      ]);
      if (emailTaken) return res.status(409).json({ success: false, message: 'Email already registered as a tasker. Please log in.' });
      if (usernameTaken) return res.status(409).json({ success: false, message: 'Username already taken. Please choose another.' });

      // ── Create user account ────────────────────────────────────────
      const password_hash = await bcrypt.hash(password, 12);
      const { data: user, error: userErr } = await supabase
        .from('users')
        .insert({
          email, full_name,
          phone: normalizePhone(phone), password_hash, role: 'tasker',
          email_verified: true,
          avatar_url: avatar_url || null,
        })
        .select()
        .single();
      if (userErr) throw userErr;

      // Set username via RPC (ALTER TABLE column — not in schema cache until reloaded).
      // supabase.rpc() reports failures in { error } (it does not throw).
      try {
        const { error: unameErr } = await supabase.rpc('set_user_verification_token', {
          p_user_id: user.id,
          p_username: username.toLowerCase(),
          p_token: null,
          p_expires: null,
        });
        if (unameErr) console.warn('set username RPC warn:', unameErr.message);
      } catch (e) { console.warn('set username RPC warn:', e?.message); }

      // Permanent public profile link (/tasker/<name-slug>). Best-effort.
      await ensureProfileSlug(user.id);

      // skills arrives as 'skills[]' when sent via FormData.append('skills[]', s)
      const rawSkills = req.body['skills[]'] || req.body.skills;
      const skillsArr = rawSkills
        ? (Array.isArray(rawSkills) ? rawSkills : String(rawSkills).split(',').map(s => s.trim()).filter(Boolean))
        : [];

      // Map id_document_type to the correct column
      const docType = (id_document_type || 'national_id').toLowerCase();
      const docCols = {
        national_id:    { national_id_url: id_doc_url },
        driver_license: { driver_license_url: id_doc_url },
        passport:       { passport_url: id_doc_url },
        nin_slip:       { national_id_url: id_doc_url }, // NIN stored as national_id
      };
      const docUpdate = docCols[docType] || { national_id_url: id_doc_url };

      // ── Create tasker profile ─────────────────────────────────────
      // Insert only original-schema columns to avoid PostgREST schema cache issues
      const { error: profileErr } = await supabase.from('tasker_profiles').insert({
        user_id: user.id,
        profile_picture_url: avatar_url || null,
        task_city, task_state,
        bio: bio || null,
        skills: skillsArr,
        proof_of_address_url: proof_of_address_url || null,
        verification_status: 'pending',
        ...docUpdate,  // national_id_url / driver_license_url / passport_url — all in original schema
      });
      if (profileErr) {
        await supabase.from('users').delete().eq('id', user.id); // rollback
        throw profileErr;
      }

      // Market + international documents. Must succeed for international
      // signups, otherwise the tasker would silently land on the Nigerian site.
      if (intl) {
        const marketErr = await saveMarket(user.id, market);
        const { error: docErr } = marketErr ? { error: null } : await supabase.from('tasker_profiles')
          .update({ right_to_work_url, police_check_url }).eq('user_id', user.id);
        if (marketErr || docErr) {
          await supabase.from('users').delete().eq('id', user.id); // cascades the profile
          throw new Error('Sign up for this country is not available yet. Please try again later.');
        }
      }

      // Set ALTER TABLE profile columns via RPC
      try { await supabase.rpc('set_tasker_profile_extras', {
        p_user_id: user.id,
        p_linkedin_url: linkedin_url || null,
        p_resume_url: resume_url || null,
        p_motivation: motivation.trim(),
      }); } catch(e) { console.warn('set_tasker_profile_extras warn:', e?.message); }

      // ── Update country via raw SQL (bypasses PostgREST schema cache) ────────
      const countryCode = intl ? market : (req.body.country || 'NG').toUpperCase();
      try {
        await supabase.rpc('set_user_country', { p_user_id: user.id, p_country: countryCode });
      } catch (_e) {
        // Non-fatal: country can be set later. Log but don't block signup.
        console.warn('Could not set country (schema cache may need reload):', _e?.message);
      }

      // ── Notifications ─────────────────────────────────────────────
      await attributeReferral(user.id, req.body.referral_slug, req.body.referral_pin);
      sendTaskerWelcomeEmail(email, full_name).catch(() => {});

      const { data: admin } = await supabase.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
      if (admin) {
        (async () => {
          try {
            await supabase.from('notifications').insert({
            user_id: admin.id,
            type: 'new_tasker_application',
            title: 'New Tasker Application',
            message: `${full_name} submitted a tasker application with identity documents.`,
            data: { tasker_id: user.id },
            action_url: `/admin?tab=taskers`,
            });
          } catch (_) {}
        })();
      }

      const token = signToken(user.id);
      res.status(201).json({
        success: true,
        message: 'Application submitted! Our team will review within 24–48 hours.',
        token,
        user: { id: user.id, email, full_name, username: user.username, phone, role: 'tasker', market },
      });
    } catch (err) {
      console.error('Step3 error:', err?.message || err);
      // Clean up any Cloudinary uploads done before the failure, so abandoned
      // signups don't leave orphaned images. Wrapped defensively: nothing in
      // the cleanup path may throw, or we lose the error response entirely.
      try {
        if (uploadedPublicIds.length) {
          const { deleteFile } = require('../utils/cloudinary');
          for (const pid of uploadedPublicIds) {
            Promise.resolve(deleteFile(pid)).catch(() => {});
          }
        }
      } catch (cleanupErr) {
        console.error('Step3 cleanup error:', cleanupErr?.message);
      }
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: `Submission failed: ${err?.message || 'Please try again.'}` });
      }
    }
  }
);

// ─── POST /auth/register/tasker/kyc-resume — upload resume (no auth) ─────────
router.post('/register/tasker/kyc-resume', uploadKYC.single('resume'), async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ success: false, message: 'No file received' });
    const result = await uploadKYCBuffer(req.file.buffer);
    res.json({ success: true, resume_url: result.secure_url });
  } catch (err) {
    res.status(500).json({ success: false, message: `Upload failed: ${err?.message}` });
  }
});





// ─── POST /auth/login ──────────────────────────────────────────────

router.post(
  '/login',
  checkPasswordLength,
  [
    body('email').isEmail(),  // no normalizeEmail() — keeps email exactly as typed
    body('password').notEmpty(),
    body('role').optional().isIn(['requester', 'tasker', 'admin']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password, role } = req.body;

    try {
      // Lookup is case-insensitive via ilike to handle case mismatches
      let query = supabase
        .from('users')
        .select('*')
        .ilike('email', email.trim().toLowerCase())
        .eq('is_active', true);

      if (role) query = query.eq('role', role);

      const { data: users, error } = await query;

      if (error || !users || users.length === 0)
        return res.status(401).json({ success: false, message: 'Invalid email or password' });

      const user = users[0];

      // Requester must verify email before logging in
      if (user.role === 'requester' && !user.email_verified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email first. Check your inbox for the verification link.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid)
        return res.status(401).json({ success: false, message: 'Invalid email or password' });

      let taskerStatus = null;
      if (user.role === 'tasker') {
        const { data: profile } = await supabase
          .from('tasker_profiles')
          .select('verification_status, task_city, task_state, is_available')
          .eq('user_id', user.id)
          .maybeSingle();
        taskerStatus = profile;
      }

      const token = signToken(user.id);

      // Auto-generate a referral_pin for requesters who don't have one yet
      // (covers everyone who registered before this feature was built).
      let referralPin = user.referral_pin;
      if (user.role === 'requester' && !referralPin) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let newPin = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        for (let i = 0; i < 5; i++) {
          const { data: taken } = await supabase.from('users').select('id').eq('referral_pin', newPin).maybeSingle();
          if (!taken) break;
          newPin = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        }
        const { error: pe } = await supabase.from('users').update({ referral_pin: newPin }).eq('id', user.id);
        if (!pe) referralPin = newPin;
        else console.warn('Auto-generate pin failed:', pe.message);
      }

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          avatar_url: user.avatar_url,
          country: user.country || 'NG',
          market: user.market || 'NG',
          referral_slug: user.referral_slug || null,
          referral_pin: referralPin || null,
          has_tasker_account: user.role === 'tasker' ? true : (user.has_tasker_account || false),
          has_requester_account: user.role === 'requester' ? true : (user.has_requester_account || false),
          taskerStatus,
        },
      });

      // Best-effort: if the client sent its push subscription endpoint,
      // link it to this user so push notifications reach them even though
      // they subscribed before logging in (e.g. on an installed PWA).
      if (req.body.push_endpoint) {
        Promise.resolve(
          supabase.from('push_subscriptions')
            .update({ user_id: user.id })
            .eq('endpoint', req.body.push_endpoint)
        ).catch(() => {});
      }
    } catch (err) {
      console.error('Login error:', err);
      // Guard against double-send: the success response may already be out.
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Login failed' });
      }
    }
  }
);

// ─── GET /auth/me ──────────────────────────────────────────────────
// ─── POST /auth/refresh — silently extend a valid session ─────────
// Used by the frontend to refresh a token before it expires, so users
// (especially on installed PWAs) are never unexpectedly logged out.
// Requires a valid (not yet expired) token — it's not a re-login.
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const newToken = signToken(req.user.id);
    res.json({ success: true, token: newToken });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not refresh token' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    let profile = null;
    if (req.user.role === 'tasker') {
      const { data } = await supabase
        .from('tasker_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .maybeSingle();
      profile = data;
    } else if (req.user.role === 'requester') {
      const { data } = await supabase
        .from('requester_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .maybeSingle();
      profile = data;
    }

    // Auto-generate referral_pin for existing requesters who never got one
    let userOut = { ...req.user, country: 'NG', market: req.user.market || 'NG' };
    if (req.user.role === 'requester' && !req.user.referral_pin) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let newPin = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      for (let i = 0; i < 5; i++) {
        const { data: taken } = await supabase.from('users').select('id').eq('referral_pin', newPin).maybeSingle();
        if (!taken) break;
        newPin = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      }
      const { error: pe } = await supabase.from('users').update({ referral_pin: newPin }).eq('id', req.user.id);
      if (!pe) userOut.referral_pin = newPin;
    }

    res.json({ success: true, user: userOut, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch user' });
  }
});

// ─── PUT /auth/profile — update name/phone/username (JSON, no file) ────────
router.put('/profile', authenticate, async (req, res) => {
  try {
    const updates = {};
    if (req.body.full_name) updates.full_name = String(req.body.full_name).trim();
    if (req.body.phone)     updates.phone     = normalizePhone(req.body.phone);
    if (req.body.username) {
      const uname = String(req.body.username).toLowerCase().trim();
      if (!/^[a-z0-9_]{3,30}$/.test(uname))
        return res.status(400).json({ success: false, message: 'Username must be 3-30 characters: letters, numbers, underscore only' });
      updates.username = uname;
    }
    updates.updated_at = new Date().toISOString();

    // Remove username from direct update (ALTER TABLE col - schema cache issue)
    const username_to_set = updates.username;
    delete updates.username;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('users').update(updates).eq('id', req.user.id);
      if (error) throw error;
    }

    // Update username via RPC if requested
    if (username_to_set) {
      try {
        await supabase.rpc('set_user_verification_token', {
          p_user_id: req.user.id,
          p_username: username_to_set,
          p_token: null,
          p_expires: null,
        });
      } catch (e) {
        if (e?.message?.includes('unique') || e?.code === '23505')
          return res.status(409).json({ success: false, message: 'Username already taken. Try another.' });
        console.warn('Username update warn:', e?.message);
      }
    }

    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Could not save profile. Try again.' });
  }
});

// ─── POST /auth/profile/avatar — upload avatar separately ──────────
router.post('/profile/avatar', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(503).json({ success: false, message: 'Image uploads not configured yet.' });
    }
    if (!req.file?.buffer) return res.status(400).json({ success: false, message: 'No image provided' });

    const result = await uploadAvatarBuffer(req.file.buffer);
    const avatarUrl = result.secure_url;

    const { error } = await supabase
      .from('users').update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq('id', req.user.id);
    if (error) throw error;

    if (req.user.role === 'tasker') {
      await supabase.from('tasker_profiles')
        .update({ profile_picture_url: avatarUrl })
        .eq('user_id', req.user.id);
    }

    res.json({ success: true, message: 'Avatar updated', avatar_url: avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err?.message || err);
    res.status(500).json({ success: false, message: `Could not upload avatar: ${err?.message || 'Please try again.'}` });
  }
});

// ─── PUT /auth/change-password ─────────────────────────────────────
router.put('/change-password', authenticate, checkPasswordLength, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password || new_password.length < 8)
      return res.status(400).json({ success: false, message: 'Invalid password data' });

    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.id).maybeSingle();
    const valid = await bcrypt.compare(old_password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(new_password, 12);
    // password_changed_at is an ALTER TABLE column - update separately so it's non-fatal
    await supabase.from('users').update({ password_hash: newHash }).eq('id', req.user.id);
    try {
      await supabase.from('users').update({ password_changed_at: new Date().toISOString() }).eq('id', req.user.id);
    } catch (_e) { /* non-fatal: schema cache may not know this column yet */ }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not change password' });
  }
});

// ─── GET /auth/banks — list banks by country (Flutterwave) ─────────
router.get('/banks', async (req, res) => {
  try {
    const country = (req.query.country || 'NG').toUpperCase();
    const banks = await listBanks(country);
    res.json({ success: true, banks });
  } catch (err) {
    console.error('Get banks error:', err?.message);
    res.status(500).json({ success: false, message: 'Could not fetch banks. Please try again.' });
  }
});

// ─── POST /auth/resolve-account — verify bank account (Flutterwave) ─
router.post('/resolve-account', authenticate, async (req, res) => {
  const { account_number, bank_code, country } = req.body || {};
  try {
    if (!account_number || !bank_code)
      return res.status(400).json({ success: false, message: 'account_number and bank_code required' });

    const result = await resolveAccountNumber(account_number, bank_code, (country || 'NG').toUpperCase());
    res.json({ success: true, account_name: result.account_name, account_number: result.account_number });
  } catch (err) {
    console.error('Resolve account error:', err?.message);
    // No manual-verification fallback: if we can't independently confirm the
    // account holder's name with the bank, we don't let the tasker self-report
    // a name and have it treated as verified.
    const status = err?.code === 'BANK_PROVIDER_UNAVAILABLE' ? 503 : 400;
    res.status(status).json({
      success: false,
      message: err?.message || 'Could not verify account. Check the account number and bank, and try again.',
    });
  }
});

// ─── GET /auth/check-username ──────────────────────────────────────
router.get('/check-username', async (req, res) => {
  const { username, role } = req.query;
  if (!username || username.length < 3) return res.json({ available: false });
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.json({ available: false, message: 'Invalid characters' });
  try {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())  // username is ALTER TABLE col
      .eq('role', role || 'requester')
      .maybeSingle();
    res.json({ available: !data });
  } catch {
    res.json({ available: false });
  }
});

// ─── DELETE /auth/account — Self-service account deletion ─────────────────
router.delete('/account', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password is required to delete your account.' });

    // Verify password
    const { data: userData, error: userError } = await supabase
      .from('users').select('password_hash, role, full_name').eq('id', req.user.id).maybeSingle();
    if (userError || !userData) return res.status(404).json({ success: false, message: 'User not found.' });

    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(password, userData.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Incorrect password. Account not deleted.' });

    // For taskers: check for active/ongoing tasks
    if (userData.role === 'tasker') {
      const { data: activeTasks, error: taskCheckError } = await supabase
        .from('tasks').select('id')
        .eq('accepted_tasker_id', req.user.id)
        .in('status', ['ongoing', 'bidding'])
        .limit(1);
      if (taskCheckError) throw taskCheckError;
      if (activeTasks && activeTasks.length > 0) {
        return res.status(400).json({ success: false, message: 'You have active or ongoing tasks. Complete or cancel them before deleting your account.' });
      }
    }

    // For requesters: check for active tasks
    if (userData.role === 'requester') {
      const { data: activeTasks, error: taskCheckError } = await supabase
        .from('tasks').select('id')
        .eq('requester_id', req.user.id)
        .in('status', ['open', 'ongoing', 'bidding'])
        .limit(1);
      if (taskCheckError) throw taskCheckError;
      if (activeTasks && activeTasks.length > 0) {
        return res.status(400).json({ success: false, message: 'You have open or ongoing tasks. Complete or cancel them before deleting your account.' });
      }
    }

    // Soft-delete: anonymize + deactivate rather than hard delete to preserve data integrity
    const anonymized = {
      email: `deleted_${req.user.id}@deleted.taskeeu.com`,
      full_name: 'Deleted User',
      phone: null,
      avatar_url: null,
      is_active: false,
      updated_at: new Date().toISOString(),
    };

    const { error: deleteError } = await supabase.from('users').update(anonymized).eq('id', req.user.id);
    if (deleteError) throw deleteError;

    // Also deactivate tasker profile if exists
    if (userData.role === 'tasker') {
      await supabase
        .from('tasker_profiles')
        .update({ is_available: false, verification_status: 'rejected', updated_at: new Date().toISOString() })
        .eq('user_id', req.user.id);
    }

    res.json({ success: true, message: 'Your account has been permanently deleted.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Could not delete account. Please try again.' });
  }
});

// ─── POST /auth/forgot-password ────────────────────────────────────
// Accepts { email, role } — role must be 'requester' or 'tasker'.
// Always returns 200 regardless of whether the email exists (prevents
// email enumeration). Generates a 1-hour reset token and emails the user.
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('A valid email address is required'),
    body('role').isIn(['requester', 'tasker']).withMessage('Role must be requester or tasker'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    // Always respond the same way whether the email exists or not
    const SAFE_RESPONSE = { success: true, message: 'If that email is registered, a reset link has been sent.' };

    try {
      const { email, role } = req.body;

      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, email, is_active')
        .ilike('email', email.trim().toLowerCase())
        .eq('role', role)
        .eq('is_active', true)
        .maybeSingle();

      if (!user) return res.json(SAFE_RESPONSE); // User not found — silent fail

      // Generate a secure token valid for 1 hour
      const resetToken   = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      // Save token + expiry to users table
      // These are ALTER TABLE columns so we wrap in try/catch but they MUST succeed
      const { error: saveErr } = await supabase
        .from('users')
        .update({
          password_reset_token:   resetToken,
          password_reset_expires: resetExpires,
        })
        .eq('id', user.id);

      if (saveErr) {
        console.error('forgot-password: could not save reset token:', saveErr.message);
        // Return safe response anyway — don't leak that something failed for a real user
        return res.json(SAFE_RESPONSE);
      }

      // Send email (fire-and-forget — don't block response on email delivery)
      sendPasswordResetEmail(user.email, user.full_name, resetToken, role).catch(e =>
        console.error('forgot-password: email send failed:', e?.message)
      );

      return res.json(SAFE_RESPONSE);
    } catch (err) {
      console.error('forgot-password error:', err);
      res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
  }
);

// ─── POST /auth/reset-password ─────────────────────────────────────
// Accepts { token, role, new_password }.
// Validates token, checks expiry, hashes new password, clears token.
router.post(
  '/reset-password',
  checkPasswordLength,
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('role').isIn(['requester', 'tasker']).withMessage('Role must be requester or tasker'),
    body('new_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { token, role, new_password } = req.body;

      // Look up user by reset token + role
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, email, password_reset_token, password_reset_expires, is_active')
        .eq('password_reset_token', token)
        .eq('role', role)
        .eq('is_active', true)
        .maybeSingle();

      if (!user)
        return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });

      // Check expiry
      if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date())
        return res.status(400).json({ success: false, message: 'This reset link has expired. Please request a new one.' });

      // Hash the new password
      const newHash = await bcrypt.hash(new_password, 12);

      // Update password and clear the reset token atomically
      const { error: updateErr } = await supabase
        .from('users')
        .update({
          password_hash:          newHash,
          password_reset_token:   null,
          password_reset_expires: null,
          updated_at:             new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateErr) {
        console.error('reset-password: update failed:', updateErr.message);
        return res.status(500).json({ success: false, message: 'Could not reset password. Please try again.' });
      }

      return res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (err) {
      console.error('reset-password error:', err);
      res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
  }
);

module.exports = router;
