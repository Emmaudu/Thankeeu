const express  = require('express');
const router   = express.Router();
const supabase = require('../utils/supabase');
const { companyAuth } = require('../middleware/companyAuth');
const { memberAuth }  = require('../middleware/memberAuth');

// Combined auth: company HR OR core team member
const hrOrCoreTeamAuth = async (req, res, next) => {
  const tok = req.headers.authorization?.split(' ')[1];
  if (!tok) return res.status(401).json({ error: 'No token' });
  const jwt = require('jsonwebtoken');
  try {
    const d = jwt.verify(tok, process.env.JWT_SECRET);
    if (d.type === 'company') {
      const { data: co } = await supabase.from('companies').select('id,name').eq('id', d.companyId).maybeSingle();
      if (!co) return res.status(401).json({ error: 'Invalid' });
      req.company = co; req.actorType = 'hr'; req.actorName = co.name;
    } else if (d.type === 'company_member') {
      const { data: m } = await supabase.from('company_members')
        .select('id,first_name,last_name,company_id,is_core_team,status').eq('id', d.memberId).maybeSingle();
      if (!m || m.status !== 'approved' || !m.is_core_team)
        return res.status(403).json({ error: 'Core team access only' });
      req.member    = m;
      req.company   = { id: m.company_id };
      req.actorType = 'core_team';
      req.actorName = `${m.first_name} ${m.last_name}`;
    } else {
      return res.status(403).json({ error: 'Company or core team access required' });
    }
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
};

// GET /api/activity-log — fetch company activity logs
router.get('/', hrOrCoreTeamAuth, async (req, res) => {
  try {
    const { limit = 100, offset = 0, action, actor_type, from, to } = req.query;
    let q = supabase.from('activity_logs').select('*')
      .eq('company_id', req.company.id)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
    if (action)     q = q.ilike('action', `%${action}%`);
    if (actor_type) q = q.eq('actor_type', actor_type);
    if (from)       q = q.gte('created_at', from);
    if (to)         q = q.lte('created_at', to);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to load activity log' }); }
});

module.exports = router;
