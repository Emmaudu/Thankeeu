const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { getBankList, verifyAccount, saveBankAccount, getMyAccounts, deleteBankAccount, initiateWithdrawal, withdrawGift } = require('../controllers/bankController');

// Auth — user or member (used for endpoints that read/write owner-specific
// rows in the shared bank_accounts table: save, my, delete, withdraw)
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

// Auth — any logged-in party (user, member, vendor, or pal). Used only for
// the stateless account-name lookup (verifyAccount), which doesn't read or
// write any owner-specific row — it's a pure Flutterwave resolve-account
// proxy. This lets vendors and Thankeeu Pals members auto-verify their bank
// account name the same way users/members already can, without changing
// where vendors/pals actually persist their bank details (they keep saving
// through their own existing endpoints — vendor PUT /vendor/me and pal
// PUT /pals/members/:id — only the verify lookup is shared).
const anyPartyAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.tk_vendor || req.cookies?.tk_pal || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (d.type === 'vendor' || d.type === 'pal' || d.type === 'company_member' || d.userId) {
      next();
    } else {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
};

const { validateUUIDParam } = require('../utils/paramGuard');

router.get('/list',      getBankList);          // public — no auth needed
router.post('/verify',   anyPartyAuth, verifyAccount);
router.post('/save',     userOrMemberAuth, saveBankAccount);
router.get('/my',        userOrMemberAuth, getMyAccounts);
router.delete('/:id',    validateUUIDParam('id'), userOrMemberAuth, deleteBankAccount);
router.post('/withdraw', userOrMemberAuth, initiateWithdrawal);
router.post('/withdraw-gift', userOrMemberAuth, withdrawGift);

module.exports = router;
