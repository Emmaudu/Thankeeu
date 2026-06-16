const bcrypt = require('bcryptjs');
const argon2  = require('argon2');
const hashPassword = (plain) => argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
const verifyPassword = async (plain, stored) => {
  if (stored && stored.startsWith('$argon2')) return argon2.verify(stored, plain);
  return require('bcryptjs').compare(plain, stored);
};
const rehashIfLegacy = async (id, plain, stored, table, supabase) => {
  if (!stored || stored.startsWith('$argon2')) return;
  try { await supabase.from(table).update({ password_hash: await hashPassword(plain) }).eq('id', id); } catch {}
};

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');

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

const { sendEmail } = require('../utils/email');

const generateToken = (companyId) =>
  jwt.sign({ companyId, type: 'company' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const companySignup = async (req, res) => {
  try {
    const { name, email, password, contact_person, phone, industry, city, state, country, branch_name } = req.body;
    if (!name || !email || !password || !contact_person)
      return res.status(400).json({ error: 'Name, email, password and contact person are required' });

    const cleanEmail = email.toLowerCase().trim();

    const { data: existing } = await supabase.from('companies').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Email already registered as a company' });

    const password_hash = await hashPassword(password, 12);
    const { data: company, error } = await supabase
      .from('companies')
      .insert({ name, email: cleanEmail, password_hash, contact_person, phone, industry, city, state, country: country || '' })
      .select('id, name, email, contact_person, phone, industry, logo_url, theme, role, country')
      .maybeSingle();

    if (error) throw error;

    // Send welcome email
    await sendEmail({
      to: email,
      template: 'companyWelcome',
      data: { companyName: name, contactPerson: contact_person }
    });

    // Create default branch if branch_name provided
    if (branch_name?.trim()) {
      try {
        await supabase.from('company_branches').insert({
          company_id: company.id,
          name: branch_name.trim(),
          city,
          state,
          is_default: true
        });
      } catch (branchError) {
        console.error('Default branch creation failed:', branchError);
      }
    }

    // Update company with location
    if (city || state || country) {
      await supabase.from('companies').update({ city, state, country: country || '' }).eq('id', company.id);
    }

    // Seed all default occasion types for this company
    try {
      await supabase.rpc('seed_occasion_types', { p_company_id: company.id });
    } catch (seedError) {
      console.error('Occasion type seeding failed:', seedError);
    }

    const token = generateToken(company.id);
    res.status(201).json({ token, company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during company signup' });
  }
};

const companyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const { data: company, error } = await supabase.from('companies').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (error || !company) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await verifyPassword(password, company.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Get subscription status
    const { data: sub } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const token = generateToken(company.id);
    const { password_hash, reset_token, ...safeCompany } = company;
    setCookie(res, 'tk_company', token);
    res.json({token, company: { ...safeCompany, subscription: sub || null } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

const getCompanyMe = async (req, res) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, email, contact_person, phone, industry, logo_url, theme, role, country, created_at')
      .eq('id', req.company.id)
      .maybeSingle();
    if (error) throw error;

    const { data: sub } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: memberCount } = await supabase
      .from('team_members')
      .select('count')
      .eq('company_id', company.id)
      .eq('is_active', true);

    res.json({ ...company, subscription: sub || null, member_count: memberCount?.[0]?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

const updateCompanyProfile = async (req, res) => {
  try {
    const { name, contact_person, phone, industry, logo_url, theme, country } = req.body;
    const updates = { name, contact_person, phone, industry, logo_url, theme, updated_at: new Date() };

    if (country !== undefined) updates.country = country;

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', req.company.id)
      .select('id, name, email, contact_person, phone, industry, logo_url, theme, country')
      .maybeSingle();
    if (error) throw error;

    // Note: Workers' Day no longer needs a re-sync step when the country
    // changes. company_members is the single source of truth, and the daily
    // cron computes each member's Workers' Day date fresh from
    // companies.country every run (see utils/occasionEngine.js). Changing
    // the country here takes effect automatically on the next cron run.

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changeCompanyPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const { data: company } = await supabase.from('companies').select('password_hash').eq('id', req.company.id).maybeSingle();
    const valid = await verifyPassword(current_password, company.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const password_hash = await hashPassword(new_password, 12);
    await supabase.from('companies').update({ password_hash }).eq('id', req.company.id);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const companyForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { data: company } = await supabase.from('companies').select('id, name, contact_person').eq('email', (email || '').toLowerCase().trim()).maybeSingle();
    if (!company) return res.json({ message: 'If email exists, reset link sent' });

    const token = crypto.randomBytes(32).toString('hex');
    await supabase.from('companies').update({ reset_token: token, reset_token_expires: new Date(Date.now() + 3600000) }).eq('id', company.id);

    await sendEmail({
      to: email,
      template: 'companyPasswordReset',
      data: { token, companyName: company.name }
    });
    res.json({ message: 'If email exists, reset link sent' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const companyResetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const { data: company } = await supabase.from('companies').select('id, reset_token_expires').eq('reset_token', token).maybeSingle();
    if (!company || new Date(company.reset_token_expires) < new Date())
      return res.status(400).json({ error: 'Invalid or expired token' });
    const password_hash = await hashPassword(password, 12);
    await supabase.from('companies').update({ password_hash, reset_token: null, reset_token_expires: null }).eq('id', company.id);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};


// POST /api/company/upload-logo — upload company logo to Cloudinary
const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const cloudinary = require('cloudinary').v2;
    // Cloudinary configured via env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'thankeeu/company-logos', transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }] },
        (err, res) => err ? reject(err) : resolve(res)
      );
      stream.end(req.file.buffer);
    });
    // Save to DB
    await supabase.from('companies')
      .update({ logo_url: result.secure_url, updated_at: new Date() })
      .eq('id', req.company.id);
    res.json({ logo_url: result.secure_url });
  } catch (err) {
    console.error('Logo upload error:', err);
    res.status(500).json({ error: 'Logo upload failed: ' + err.message });
  }
};

module.exports = {
  uploadCompanyLogo, companySignup, companyLogin, getCompanyMe, updateCompanyProfile, changeCompanyPassword, companyForgotPassword, companyResetPassword };
