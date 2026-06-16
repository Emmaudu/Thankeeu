const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

// Verifies a Pals JWT and attaches req.palGroup (+ req.palMember if the
// logged-in person was an invited member rather than the group owner).
const palAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.['tk_pal'] || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'pal') return res.status(401).json({ error: 'Invalid token type' });

    const { data: group, error } = await supabase
      .from('pal_groups')
      .select('id, group_name, group_username, email, logo_url, description, group_size, status, is_verified, pricing_commission_pct')
      .eq('id', decoded.palGroupId)
      .maybeSingle();

    if (error || !group) return res.status(401).json({ error: 'Invalid token' });
    if (group.status !== 'approved') return res.status(403).json({ error: 'This Pals group is not yet approved' });

    req.palGroup = group;

    // If the logged-in identity was a specific invited member, attach it too
    if (decoded.palMemberId) {
      const { data: member } = await supabase
        .from('pal_members')
        .select('id, name, email, role, status')
        .eq('id', decoded.palMemberId)
        .maybeSingle();
      if (member) req.palMember = member;
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { palAuth };
