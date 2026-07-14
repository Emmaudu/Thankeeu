const bcrypt = require('bcryptjs');
const argon2  = require('argon2');
const {
  validateEmail, validatePassword, sanitizeName, sanitizePhone,
  sanitizeText, isSanitizeError,
} = require('../utils/sanitize');
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
const { generateUniqueCompanySlug } = require('../utils/companySlug');

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

const buildWorkspaceUrl = (slug) => {
  const rawBase = process.env.WORKSPACE_BASE_URL || process.env.FRONTEND_URL || process.env.APP_URL || 'https://thankeeu.com';
  try {
    const url = new URL(rawBase.startsWith('http') ? rawBase : `https://${rawBase}`);
    const protocol = url.protocol || 'https:';
    const port = url.port ? `:${url.port}` : '';
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'localhost' || host.endsWith('.localhost')) return `${protocol}//${slug}.localhost${port}`;
    return `${protocol}//${slug}.${host}${port}`;
  } catch {
    return `https://${slug}.thankeeu.com`;
  }
};

const companySignup = async (req, res) => {
  try {
    const raw = req.body;

    // ── Sanitize & validate ───────────────────────────────────────────────
    const cleanEmail         = validateEmail(raw.email);
    const cleanPassword      = validatePassword(raw.password);
    const cleanName          = sanitizeName(raw.name, 'Company name', { maxLen: 120 });
    const cleanContact       = sanitizeName(raw.contact_person, 'Contact person');
    const cleanPhone         = sanitizePhone(raw.phone);
    const cleanIndustry      = sanitizeText(raw.industry, 'Industry', { maxLen: 80 });
    const cleanCity          = sanitizeText(raw.city, 'City', { maxLen: 80 });
    const cleanState         = sanitizeText(raw.state, 'State', { maxLen: 80 });
    const cleanCountry       = sanitizeText(raw.country, 'Country', { maxLen: 80 });
    const cleanBranchName    = sanitizeText(raw.branch_name, 'Branch name', { maxLen: 120 });
    // ─────────────────────────────────────────────────────────────────────

    const { data: existing } = await supabase.from('companies').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Email already registered as a company' });

    const password_hash = await hashPassword(cleanPassword, 12);
    const slug = await generateUniqueCompanySlug(supabase, cleanName);
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name: cleanName, email: cleanEmail, password_hash, slug,
        contact_person: cleanContact, phone: cleanPhone,
        industry: cleanIndustry, city: cleanCity,
        state: cleanState, country: cleanCountry || '',
      })
      .select('id, name, email, contact_person, phone, industry, logo_url, theme, role, country, slug')
      .maybeSingle();

    if (error) throw error;

    // Send welcome email
    await sendEmail({
      to: cleanEmail,
      template: 'companyWelcome',
      data: { companyName: cleanName, contactPerson: cleanContact }
    });

    // Create default branch if branch_name provided
    if (cleanBranchName) {
      try {
        await supabase.from('company_branches').insert({
          company_id: company.id,
          name: cleanBranchName,
          city: cleanCity,
          state: cleanState,
          is_default: true
        });
      } catch (branchError) {
        console.error('Default branch creation failed:', branchError);
      }
    }

    // Update company with location
    if (cleanCity || cleanState || cleanCountry) {
      await supabase.from('companies').update({
        city: cleanCity, state: cleanState, country: cleanCountry || '',
      }).eq('id', company.id);
    }

    // Seed all default occasion types for this company
    try {
      await supabase.rpc('seed_occasion_types', { p_company_id: company.id });
    } catch (seedError) {
      console.error('Occasion type seeding failed:', seedError);
    }

    const token = generateToken(company.id);
    const workspace_url = buildWorkspaceUrl(company.slug);
    res.status(201).json({ token, company: { ...company, workspace_url }, workspace_url });
  } catch (err) {
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    console.error(err);
    res.status(500).json({ error: 'Server error during company signup' });
  }
};

const companyLogin = async (req, res) => {
  try {
    const cleanEmail    = validateEmail(req.body.email);
    const cleanPassword = validatePassword(req.body.password);

    const { data: company, error } = await supabase.from('companies').select('*').eq('email', cleanEmail).maybeSingle();
    if (error || !company) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await verifyPassword(cleanPassword, company.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    if (req.tenantCompany && req.tenantCompany.id !== company.id) {
      return res.status(403).json({
        error: 'This account does not belong to this workspace',
        code: 'WORKSPACE_MISMATCH',
      });
    }

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
    const workspace_url = buildWorkspaceUrl(safeCompany.slug);
    res.json({token, company: { ...safeCompany, subscription: sub || null, workspace_url }, workspace_url });
  } catch (err) {
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Server error during login' });
  }
};

const getCompanyMe = async (req, res) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, email, contact_person, phone, industry, logo_url, theme, role, country, slug, created_at')
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

    res.json({ ...company, workspace_url: buildWorkspaceUrl(company.slug), subscription: sub || null, member_count: memberCount?.[0]?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

const updateCompanyProfile = async (req, res) => {
  try {
    const raw = req.body;
    const { sanitizeName, sanitizePhone, sanitizeText, isSanitizeError } = require('../utils/sanitize');
    const cleanName    = raw.name           !== undefined ? sanitizeName(raw.name,           'Company name',   { required: false, maxLen: 120 }) : undefined;
    const cleanContact = raw.contact_person !== undefined ? sanitizeName(raw.contact_person, 'Contact person', { required: false, maxLen: 100 }) : undefined;
    const cleanPhone   = raw.phone          !== undefined ? sanitizePhone(raw.phone)         : undefined;
    const cleanIndustry= raw.industry       !== undefined ? sanitizeText(raw.industry,  'Industry', { maxLen: 80  }) : undefined;
    const cleanCountry = raw.country        !== undefined ? sanitizeText(raw.country,   'Country',  { maxLen: 80  }) : undefined;
    const cleanTheme   = raw.theme          !== undefined ? sanitizeText(raw.theme,     'Theme',    { maxLen: 40  }) : undefined;

    const updates = { updated_at: new Date() };
    if (cleanName     !== undefined) updates.name           = cleanName;
    if (cleanContact  !== undefined) updates.contact_person = cleanContact;
    if (cleanPhone    !== undefined) updates.phone          = cleanPhone;
    if (cleanIndustry !== undefined) updates.industry       = cleanIndustry;
    if (cleanCountry  !== undefined) updates.country        = cleanCountry;
    if (cleanTheme    !== undefined) updates.theme          = cleanTheme;
    if (raw.logo_url  !== undefined) updates.logo_url       = raw.logo_url; // URL from Cloudinary — trusted

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', req.company.id)
      .select('id, name, email, contact_person, phone, industry, logo_url, theme, country, slug')
      .maybeSingle();
    if (error) throw error;

    // Note: Workers' Day no longer needs a re-sync step when the country
    // changes. company_members is the single source of truth, and the daily
    // cron computes each member's Workers' Day date fresh from
    // companies.country every run (see utils/occasionEngine.js). Changing
    // the country here takes effect automatically on the next cron run.

    res.json(data);
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changeCompanyPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ error: 'Current and new passwords are required' });
    const { validatePassword, isSanitizeError } = require('../utils/sanitize');
    const cleanNew = validatePassword(new_password, 'New password');
    const { data: company } = await supabase.from('companies').select('password_hash').eq('id', req.company.id).maybeSingle();
    if (!company) return res.status(404).json({ error: 'Account not found' });
    const valid = await verifyPassword(current_password, company.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const password_hash = await hashPassword(cleanNew, 12);
    await supabase.from('companies').update({ password_hash }).eq('id', req.company.id);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    const { isSanitizeError } = require('../utils/sanitize');
    if (isSanitizeError(err)) return res.status(err.status).json({ error: err.error });
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const companyForgotPassword = async (req, res) => {
  try {
    let cleanEmail;
    try { cleanEmail = validateEmail(req.body.email); }
    catch { return res.json({ message: 'If email exists, reset link sent' }); }

    const { data: company } = await supabase.from('companies').select('id, name, contact_person').eq('email', cleanEmail).maybeSingle();
    if (!company) return res.json({ message: 'If email exists, reset link sent' });

    const token = crypto.randomBytes(32).toString('hex');
    await supabase.from('companies').update({ reset_token: token, reset_token_expires: new Date(Date.now() + 3600000) }).eq('id', company.id);

    await sendEmail({
      to: cleanEmail,
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
    const { token } = req.body;
    let cleanPassword;
    try { cleanPassword = validatePassword(req.body.password); }
    catch (e) { return res.status(400).json({ error: e.error || 'Invalid password' }); }

    if (!token || typeof token !== 'string' || token.length > 200)
      return res.status(400).json({ error: 'Invalid reset token' });

    const { data: company } = await supabase.from('companies').select('id, reset_token_expires').eq('reset_token', token.trim()).maybeSingle();
    if (!company || new Date(company.reset_token_expires) < new Date())
      return res.status(400).json({ error: 'Invalid or expired token' });
    const password_hash = await hashPassword(cleanPassword, 12);
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
    res.status(500).json({ error: 'Logo upload failed. Please try again.' });
  }
};

module.exports = {
  uploadCompanyLogo, companySignup, companyLogin, getCompanyMe, updateCompanyProfile, changeCompanyPassword, companyForgotPassword, companyResetPassword };
