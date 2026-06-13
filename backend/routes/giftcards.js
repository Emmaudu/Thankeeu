const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { getProducts, getProductDenominations, orderGiftCard } = require('../controllers/reloadlyController');

// Auth middleware — accepts user, member, OR company token
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
    } else if (d.type === 'company') {
      // HR account — look up company contact email
      const { data } = await supabase.from('companies')
        .select('id,name,email').eq('id', d.companyId).single();
      if (!data) return res.status(401).json({ error: 'Invalid company token' });
      req.company = data;
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

// GET /api/giftcards/my-history — all gift card & gift claims for this user/member/company
router.get('/my-history', userOrMemberAuth, async (req, res) => {
  try {
    const email = req.user?.email || req.member?.email || req.company?.email;
    if (!email) return res.status(401).json({ error: 'Not authenticated' });

    // Fetch ALL claim types (giftcard, transfer, airtime) for this email
    // Use left join on cards so records survive even if card is deleted
    const { data, error } = await supabase
      .from('gift_claims')
      .select(`
        id, claim_type, amount, status, processed_at, created_at,
        product_name, product_id, redemption_code, reloadly_ref,
        bank_name, account_number, account_name,
        card_id,
        cards(title, recipient_name, slug)
      `)
      .eq('recipient_email', email.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('gift-card history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
