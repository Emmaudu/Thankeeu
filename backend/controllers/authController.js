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

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const verification_token = crypto.randomBytes(32).toString('hex');

    const { data: user, error } = await supabase
      .from('users')
      .insert({ full_name, email, password_hash, verification_token })
      .select('id, email, full_name, role, avatar_url')
      .single();

    if (error) throw error;

    await sendEmail({ to: email, template: 'welcome', data: { name: full_name } });

    const token = generateToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users').select('*').eq('email', email).single();
    if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user.id);
    const { password_hash, verification_token, reset_token, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
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
