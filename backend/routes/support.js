const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { createTicket, getMyTickets, getAllTickets, replyToTicket } = require('../controllers/supportController');

// Flexible auth middleware — works for individual users AND company accounts
const flexAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'company') {
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, name, email, contact_person, role')
        .eq('id', decoded.companyId)
        .single();
      if (error || !company) return res.status(401).json({ error: 'Invalid token' });
      req.company = company;
    } else {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', decoded.userId)
        .single();
      if (error || !user) return res.status(401).json({ error: 'Invalid token' });
      req.user = user;
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Admin-only auth
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users').select('id, email, full_name, role').eq('id', decoded.userId).single();
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

router.post('/', flexAuth, createTicket);
router.get('/mine', flexAuth, getMyTickets);
router.get('/all', adminAuth, getAllTickets);
router.post('/:ticketId/reply', adminAuth, replyToTicket);

module.exports = router;
