const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { auth } = require('../middleware/auth');
const { addMessage, reactToMessage, deleteMessage, sendReply, upload } = require('../controllers/messageController');

// Flexible auth: accepts user OR member token (no forced redirect on failure)
const flexAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (d.type === 'company_member') {
      const { data } = await supabase.from('company_members')
        .select('id,first_name,last_name,email,status').eq('id', d.memberId).single();
      if (data?.status === 'approved') req.member = data;
    } else if (d.userId) {
      const { data } = await supabase.from('users')
        .select('id,email,full_name').eq('id', d.userId).single();
      if (data) req.user = data;
    }
    next();
  } catch { next(); }
};

// Reply requires auth (user or member)
const requireAuth = (req, res, next) => {
  if (!req.user && !req.member) return res.status(401).json({ error: 'You must be signed in to send a reply' });
  next();
};

router.post('/:card_slug',       upload.any(), addMessage);
router.post('/react/:message_id', reactToMessage);
router.delete('/:message_id',     auth, deleteMessage);
router.post('/:card_slug/reply',  flexAuth, requireAuth, sendReply);

module.exports = router;
