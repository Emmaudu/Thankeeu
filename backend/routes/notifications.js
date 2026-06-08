const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { getNotifications, getUnreadCount, markAllRead, markOneRead } = require('../controllers/notificationController');

// Flexible auth — works for user, member, company
const flexAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (d.type === 'company') {
      const { data } = await supabase.from('companies').select('id,name,email').eq('id', d.companyId).single();
      if (!data) return res.status(401).json({ error: 'Invalid' });
      req.company = data;
    } else if (d.type === 'company_member') {
      const { data } = await supabase.from('company_members').select('id,first_name,last_name,email,status').eq('id', d.memberId).single();
      if (!data || data.status !== 'approved') return res.status(401).json({ error: 'Invalid' });
      req.member = data;
    } else {
      const { data } = await supabase.from('users').select('id,email,full_name,role').eq('id', d.userId).single();
      if (!data) return res.status(401).json({ error: 'Invalid' });
      req.user = data;
    }
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
};

router.get('/',           flexAuth, getNotifications);
router.get('/count',      flexAuth, getUnreadCount);
router.post('/mark-read', flexAuth, markAllRead);
router.post('/:id/read',  flexAuth, markOneRead);

module.exports = router;
