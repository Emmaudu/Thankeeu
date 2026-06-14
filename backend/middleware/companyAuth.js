const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

const companyAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.['tk_company'] || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'company') return res.status(401).json({ error: 'Invalid token type' });

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, email, contact_person, role, theme, logo_url, country')
      .eq('id', decoded.companyId)
      .single();

    if (error || !company) return res.status(401).json({ error: 'Invalid token' });
    req.company = company;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware: company must have active subscription
const requireSubscription = async (req, res, next) => {
  try {
    const { data: sub } = await supabase
      .from('company_subscriptions')
      .select('status, expires_at')
      .eq('company_id', req.company.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!sub) {
      return res.status(402).json({
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }
    req.subscription = sub;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

module.exports = { companyAuth, requireSubscription };
