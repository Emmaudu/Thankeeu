const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { getBankList, verifyAccount, saveBankAccount, getMyAccounts, deleteBankAccount, initiateWithdrawal, withdrawGift } = require('../controllers/bankController');

// Auth — user or member
const userOrMemberAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (d.type === 'company_member') {
      const { data } = await supabase.from('company_members').select('id,first_name,last_name,email,status,role,company_id,department').eq('id', d.memberId).maybeSingle();
      if (!data || data.status !== 'approved') return res.status(401).json({ error: 'Invalid' });
      req.member = data;
    } else {
      const { data } = await supabase.from('users').select('id,email,full_name').eq('id', d.userId).maybeSingle();
      if (!data) return res.status(401).json({ error: 'Invalid' });
      req.user = data;
    }
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
};

router.get('/list',      getBankList);          // public — no auth needed
router.post('/verify',   userOrMemberAuth, verifyAccount);
router.post('/save',     userOrMemberAuth, saveBankAccount);
router.get('/my',        userOrMemberAuth, getMyAccounts);
router.delete('/:id',    userOrMemberAuth, deleteBankAccount);
router.post('/withdraw', userOrMemberAuth, initiateWithdrawal);
router.post('/withdraw-gift', userOrMemberAuth, withdrawGift);

module.exports = router;
