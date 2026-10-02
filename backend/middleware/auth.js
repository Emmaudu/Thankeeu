const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

/**
 * Verify JWT and attach user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Basic token format check before verifying
    if (!token || token.split('.').length !== 3) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB to catch deactivated accounts
    const COLS = 'id, email, full_name, username, role, is_active, avatar_url, phone, referral_slug, referral_pin, has_tasker_account, has_requester_account';
    let { data: user, error } = await supabase
      .from('users')
      .select(`${COLS}, market`)
      .eq('id', decoded.id)
      .maybeSingle();
    if (error && /market/i.test(error.message || '')) {
      // INTERNATIONAL_MIGRATION.sql not run yet: everyone is in Nigeria.
      ({ data: user, error } = await supabase.from('users').select(COLS).eq('id', decoded.id).maybeSingle());
      if (user) user.market = 'NG';
    }
    if (user && !user.market) user.market = 'NG';

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Session invalid. Please log in again.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    // Skip password_changed_at check — column added via ALTER TABLE which may not be in schema cache
    // Token expiry (JWT exp claim) is sufficient for security

    req.user = user;

    // Update last_seen asynchronously (don't await)
    Promise.resolve(supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id)).catch(() => {});

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

/**
 * Require specific role(s)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  next();
};

/**
 * Require approved tasker status
 */
const requireApprovedTasker = async (req, res, next) => {
  if (req.user.role !== 'tasker') {
    return res.status(403).json({ success: false, message: 'Only taskers can perform this action' });
  }

  const { data: profile } = await supabase
    .from('tasker_profiles')
    .select('verification_status')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (!profile || profile.verification_status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Your tasker account is pending admin approval',
    });
  }
  next();
};

// Optional auth — attach user if token present but don't block
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user } = await supabase
        .from('users')
        .select('id, email, full_name, username, role, is_active')
        .eq('id', decoded.id)
        .maybeSingle();
      if (user && user.is_active) req.user = user;
    }
  } catch (_) {
    // Ignore errors for optional auth
  }
  next();
};

// softAuth — like authenticate but doesn't block if no token (sets req.user = null)
// JWT is signed with { id } — must use decoded.id not decoded.userId
async function softAuth(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) { req.user = null; return next(); }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, username, role, is_active, avatar_url, phone, referral_slug, referral_pin, has_tasker_account, has_requester_account')
      .eq('id', decoded.id)
      .eq('is_active', true)
      .maybeSingle();
    req.user = user || null;
  } catch (_) { req.user = null; }
  next();
}

module.exports = { authenticate, requireRole, requireApprovedTasker, optionalAuth, softAuth };
