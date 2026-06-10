const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { getProducts, getProductDenominations, orderGiftCard } = require('../controllers/reloadlyController');

// Auth middleware — accepts user OR member token (gift claim is for both)
const userOrMemberAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (d.type === 'company_member') {
      const { data } = await supabase.from('company_members')
        .select('id,first_name,last_name,email,status').eq('id', d.memberId).single();
      if (!data || data.status !== 'approved') return res.status(401).json({ error: 'Invalid member token' });
      req.member = data;
    } else {
      const { data } = await supabase.from('users')
        .select('id,email,full_name,is_verified').eq('id', d.userId).single();
      if (!data) return res.status(401).json({ error: 'Invalid user token' });
      req.user = data;
    }
    next();
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
};

// Public — browse products (no auth needed to see what's available)
router.get('/products',              getProducts);
router.get('/product/:productId',    getProductDenominations);

// Authenticated — actually purchase (must be logged-in recipient)
router.post('/order', userOrMemberAuth, orderGiftCard);

module.exports = router;
