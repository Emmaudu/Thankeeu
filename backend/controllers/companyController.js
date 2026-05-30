const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const generateToken = (companyId) =>
  jwt.sign({ companyId, type: 'company' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const companySignup = async (req, res) => {
  try {
    const { name, email, password, contact_person, phone, industry, city, state, country, branch_name } = req.body;
    if (!name || !email || !password || !contact_person)
      return res.status(400).json({ error: 'Name, email, password and contact person are required' });

    const { data: existing } = await supabase.from('companies').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Email already registered as a company' });

    const password_hash = await bcrypt.hash(password, 12);
    const { data: company, error } = await supabase
      .from('companies')
      .insert({ name, email, password_hash, contact_person, phone, industry, city, state, country: country || 'Nigeria' })
      .select('id, name, email, contact_person, phone, industry, logo_url, theme, role')
      .single();

    if (error) throw error;

    // Send welcome email
    await sendEmail({
      to: email,
      template: 'companyWelcome',
      data: { companyName: name, contactPerson: contact_person }
    });

    // Create default branch if branch_name provided
    if (branch_name?.trim()) {
      await supabase.from('company_branches').insert({ company_id: company.id, name: branch_name.trim(), city, state, is_default: true }).catch(() => {});
    }

    // Update company with location
    if (city || state || country) {
      await supabase.from('companies').update({ city, state, country: country || 'Nigeria' }).eq('id', company.id);
    }

    // Seed all default occasion types for this company
    await supabase.rpc('seed_occasion_types', { p_company_id: company.id }).catch(() => {});

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
    const { data: company, error } = await supabase.from('companies').select('*').eq('email', email).single();
    if (error || !company) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, company.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Get subscription status
    const { data: sub } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Create default branch if branch_name provided
    if (branch_name?.trim()) {
      await supabase.from('company_branches').insert({ company_id: company.id, name: branch_name.trim(), city, state, is_default: true }).catch(() => {});
    }

    // Update company with location
    if (city || state || country) {
      await supabase.from('companies').update({ city, state, country: country || 'Nigeria' }).eq('id', company.id);
    }

    // Seed all default occasion types for this company
    await supabase.rpc('seed_occasion_types', { p_company_id: company.id }).catch(() => {});

    const token = generateToken(company.id);
    const { password_hash, reset_token, ...safeCompany } = company;
    res.json({ token, company: { ...safeCompany, subscription: sub || null } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

const getCompanyMe = async (req, res) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, email, contact_person, phone, industry, logo_url, theme, role, bank_name, account_number, account_name, created_at')
      .eq('id', req.company.id)
      .single();
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
    const { name, contact_person, phone, industry, logo_url, theme, bank_name, account_number, account_name } = req.body;
    const { data, error } = await supabase
      .from('companies')
      .update({ name, contact_person, phone, industry, logo_url, theme, bank_name, account_number, account_name, updated_at: new Date() })
      .eq('id', req.company.id)
      .select('id, name, email, contact_person, phone, industry, logo_url, theme, bank_name, account_number, account_name')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changeCompanyPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const { data: company } = await supabase.from('companies').select('password_hash').eq('id', req.company.id).single();
    const valid = await bcrypt.compare(current_password, company.password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const password_hash = await bcrypt.hash(new_password, 12);
    await supabase.from('companies').update({ password_hash }).eq('id', req.company.id);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const companyForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { data: company } = await supabase.from('companies').select('id, name, contact_person').eq('email', email).maybeSingle();
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
    const password_hash = await bcrypt.hash(password, 12);
    await supabase.from('companies').update({ password_hash, reset_token: null, reset_token_expires: null }).eq('id', company.id);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { companySignup, companyLogin, getCompanyMe, updateCompanyProfile, changeCompanyPassword, companyForgotPassword, companyResetPassword };
