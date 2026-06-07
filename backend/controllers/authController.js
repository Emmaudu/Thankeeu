const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const signup = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Use maybeSingle — single() throws if no row found
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const verification_token = crypto.randomBytes(32).toString('hex');

    const { data: user, error } = await supabase
      .from('users')
      .insert({ full_name, email: email.toLowerCase().trim(), password_hash, verification_token })
      .select('id, email, full_name, role, avatar_url')
      .single();

    if (error) {
      console.error('Signup DB error:', error);
      if (error.code === '23505') return res.status(400).json({ error: 'Email already registered' });
      throw error;
    }

    // Send welcome email — don't fail signup if email fails
    sendEmail({ to: email, template: 'welcome', data: { name: full_name } }).catch(e =>
      console.error('Welcome email failed:', e)
    );

    const token = generateToken(user.id);
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

    const { data: user, error } = await supabase
      .from('users').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user.id);
    const { password_hash, verification_token, reset_token, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const { data: credits } = await supabase
      .from('card_credits')
      .select('credits_remaining')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    res.json({ ...req.user, credits_remaining: credits?.credits_remaining || 0 });
  } catch {
    res.json(req.user);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, avatar_url } = req.body;
    const { data: user, error } = await supabase
      .from('users')
      .update({ full_name, avatar_url, updated_at: new Date() })
      .eq('id', req.user.id)
      .select('id, email, full_name, role, avatar_url')
      .single();
    if (error) throw error;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
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

module.exports = { signup, login, getMe, updateProfile, forgotPassword, resetPassword };

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
    
    // Check if email exists
    const { data: existingUser } = await supabase
      .from('users').select('id').eq('email', adminEmail).maybeSingle();
    
    if (existingUser) {
      // Upgrade existing user to admin
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

module.exports.seedAdmin = seedAdmin;
