const express = require('express');
const router = express.Router();
const { auth, anyAuth } = require('../middleware/auth');
const { companyAuth } = require('../middleware/companyAuth');
const { memberAuth } = require('../middleware/memberAuth');
const {
  createCard, getUserCards, getCard, updateCard,
  activateCard, sendCard, deleteCard, getPublicCard,
  getRecipientCard, claimGift, getMemberCards, approveCardScope
} = require('../controllers/cardController');

// Flexible auth — accepts individual user, team member, OR HR company token
const flexUserAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const jwt = require('jsonwebtoken');
    const supabase = require('../utils/supabase');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'company') {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, email, contact_person')
        .eq('id', decoded.companyId)
        .single();
      if (!company) return res.status(401).json({ error: 'Invalid token' });
      req.company = company;
    } else if (decoded.type === 'company_member') {
      const { data: member } = await supabase
        .from('company_members')
        .select('id, first_name, last_name, email, role, department, status, company_id')
        .eq('id', decoded.memberId)
        .single();
      if (!member || member.status !== 'approved') return res.status(403).json({ error: 'Not authorized' });
      req.member = member;
    } else {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', decoded.userId)
        .single();
      if (!user) return res.status(401).json({ error: 'Invalid token' });
      req.user = user;
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Public
router.get('/public/:slug', getPublicCard);
router.get('/recipient/:slug', getRecipientCard);
router.post('/recipient/:slug/claim', claimGift);

// Member card history (member token only)
router.get('/member-history', memberAuth, getMemberCards);

// Card creation — accepts both user and member tokens
router.post('/', flexUserAuth, createCard);

// All other routes — regular user auth
router.get('/', auth, getUserCards);
router.get('/:slug', flexUserAuth, getCard);
router.put('/:slug', anyAuth, updateCard);
router.post('/:slug/activate', anyAuth, activateCard);
router.post('/:slug/send', anyAuth, sendCard);
router.delete('/:slug', anyAuth, deleteCard);
// HR approves company-wide notification scope
router.post('/:slug/approve-scope', companyAuth, approveCardScope);

module.exports = router;
