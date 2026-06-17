const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.['tk_user'] || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', decoded.userId)
      .maybeSingle();

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const adminAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// Accepts any valid token: regular user, HR company, or team member
const anyAuth = async (req, res, next) => {
  const token = req.cookies?.['tk_user'] || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'company') {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, email, contact_person')
        .eq('id', decoded.companyId)
        .maybeSingle();
      if (!company) return res.status(401).json({ error: 'Invalid token' });
      req.company = company;
    } else if (decoded.type === 'company_member') {
      const { data: member } = await supabase
        .from('company_members')
        .select('id, first_name, last_name, email, role, status, company_id')
        .eq('id', decoded.memberId)
        .maybeSingle();
      if (!member || member.status !== 'approved') return res.status(403).json({ error: 'Not authorized' });
      req.member = member;
    } else {
      // Regular user token (no type field or type === 'user')
      const { data: user } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', decoded.userId)
        .maybeSingle();
      if (!user) return res.status(401).json({ error: 'Invalid token' });
      req.user = user;
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Like anyAuth, but never rejects — populates req.user/req.member/req.company
// if a valid token is present, otherwise just proceeds with none of them set.
// Used for routes that must work for anonymous (pre-signup) visitors but
// should still recognize an already-logged-in user if one is present.
const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.['tk_user'] || req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'company') {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, email, contact_person')
        .eq('id', decoded.companyId)
        .maybeSingle();
      if (company) req.company = company;
    } else if (decoded.type === 'company_member') {
      const { data: member } = await supabase
        .from('company_members')
        .select('id, first_name, last_name, email, role, status, company_id')
        .eq('id', decoded.memberId)
        .maybeSingle();
      if (member && member.status === 'approved') req.member = member;
    } else {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', decoded.userId)
        .maybeSingle();
      if (user) req.user = user;
    }
  } catch {
    // Invalid/expired token on an optional-auth route — just proceed as anonymous
  }
  next();
};

module.exports = { auth, adminAuth, anyAuth, optionalAuth };
