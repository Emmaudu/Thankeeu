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

// Reply requires auth OR valid access_token (for email-link recipients)
const requireAuth = async (req, res, next) => {
  if (req.user || req.member) return next();

  // Allow reply via URL access_token (card recipient opened via email link)
  const accessToken = req.query.access_token;
  if (accessToken) {
    const slug = req.params.card_slug;
    let card = null;
    try {
      const { data } = await supabase
        .from('cards').select('id, access_token, recipient_name')
        .eq('slug', slug).maybeSingle();
      card = data;
    } catch {}
    if (card && card.access_token === accessToken) {
      req.accessTokenReply = true;
      req.recipientName = card.recipient_name;
      return next();
    }
  }

  return res.status(401).json({ error: 'You must be signed in to send a reply' });
};

router.post('/:card_slug',       upload.any(), addMessage);
router.post('/react/:message_id', reactToMessage);
router.delete('/:message_id',     auth, deleteMessage);
// Access-token recipients can reply without a login session
router.post('/:card_slug/reply',  flexAuth, sendReply);

module.exports = router;
