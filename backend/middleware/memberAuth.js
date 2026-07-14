const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { requireTenantMatch } = require('./tenant');

// Auth middleware for company members (team leaders + team members)
const memberAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.['tk_member'] || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'company_member') return res.status(401).json({ error: 'Invalid token type' });

    const { data: member, error } = await supabase
      .from('company_members')
      .select('id, first_name, last_name, email, role, department, status, profile_picture_url, company_id')
      .eq('id', decoded.memberId)
      .maybeSingle();

    if (error || !member) return res.status(401).json({ error: 'Invalid token' });
    if (member.status !== 'approved') return res.status(403).json({ error: 'Account not yet approved' });
    if (!requireTenantMatch(req, member.company_id)) {
      return res.status(403).json({
        error: 'This account does not belong to this workspace',
        code: 'WORKSPACE_MISMATCH',
      });
    }

    req.member = member;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Team leader only
const leaderAuth = async (req, res, next) => {
  await memberAuth(req, res, () => {
    if (req.member?.role !== 'team_leader')
      return res.status(403).json({ error: 'Team leader access required' });
    next();
  });
};

// Either HR company OR a member (flexible for shared endpoints)
const hrOrMemberAuth = async (req, res, next) => {
  const token = req.cookies?.['tk_member'] || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === 'company') {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, email, contact_person, role, slug')
        .eq('id', decoded.companyId)
        .maybeSingle();
      if (!company) return res.status(401).json({ error: 'Invalid token' });
      if (!requireTenantMatch(req, company.id)) {
        return res.status(403).json({
          error: 'This account does not belong to this workspace',
          code: 'WORKSPACE_MISMATCH',
        });
      }
      req.company = company;
    } else if (decoded.type === 'company_member') {
      const { data: member } = await supabase
        .from('company_members')
        .select('id, first_name, last_name, email, role, department, status, company_id')
        .eq('id', decoded.memberId)
        .maybeSingle();
      if (!member || member.status !== 'approved') return res.status(403).json({ error: 'Not authorized' });
      if (!requireTenantMatch(req, member.company_id)) {
        return res.status(403).json({
          error: 'This account does not belong to this workspace',
          code: 'WORKSPACE_MISMATCH',
        });
      }
      req.member = member;
    } else {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { memberAuth, leaderAuth, hrOrMemberAuth };
