const express = require('express');
const router = express.Router();
const { auth, anyAuth } = require('../middleware/auth');
const { companyAuth } = require('../middleware/companyAuth');
const { memberAuth } = require('../middleware/memberAuth');
const {
  createCard, getUserCards, getCard, updateCard,
  activateCard, sendCard, deleteCard, getPublicCard,
  getRecipientCard, claimGift, getMemberCards, approveCardScope,
  getCompanyCards, getCompanyDeliveredCards, getCompanyReceivedCards, transferCardToMember
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


// ── Company HR card management ─────────────────────────────────────────────
router.get('/company/mine',       companyAuth, getCompanyCards);
router.get('/company/delivered',  companyAuth, getCompanyDeliveredCards);
router.get('/company/received',   companyAuth, getCompanyReceivedCards);
router.post('/:slug/transfer',    companyAuth, transferCardToMember);


// POST /:slug/notify-signers — HR notifies department or all members to sign a card
router.post('/:slug/notify-signers', companyAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { scope, department } = req.body; // scope: 'all' | 'department'

    const { data: card } = await supabase.from('cards').select('*').eq('slug', slug).single();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Get members to notify
    const supabaseClient = require('../utils/supabase');
    let query = supabaseClient.from('company_members')
      .select('email, first_name, id').eq('company_id', req.company.id).eq('status', 'approved');
    if (scope === 'department' && department) query = query.eq('department', department);
    const { data: members } = await query;

    const { sendEmail } = require('../utils/email');
    const frontendUrl = (process.env.FRONTEND_URL || 'https://thankeeu.com').replace(/\/$/, '');
    let sent = 0;
    for (const m of (members || [])) {
      if (m.email === card.recipient_email) continue;
      await sendEmail({ to: m.email, template: 'occasionNotice', data: {
        icon: '💌',
        occasionLabel: card.occasion?.replace(/_/g,' ') || 'occasion',
        memberName: card.recipient_name,
        memberFirstName: card.recipient_name?.split(' ')[0] || 'them',
        department: department || 'the team',
        companyName: req.company.name,
        cardSlug: slug,
        giftEnabled: card.is_gift_enabled,
        occasionDate: card.send_date ? new Date(card.send_date).toLocaleDateString('en-NG', {day:'numeric',month:'long',year:'numeric'}) : 'soon',
        daysLeft: 7,
        deadline: card.deadline ? new Date(card.deadline).toLocaleDateString('en-NG', {day:'numeric',month:'long'}) : 'soon',
      }}).catch(() => {});
      sent++;
    }

    const { logActivity } = require('../utils/activityLog');
    await logActivity({ company_id: req.company.id, actor_id: req.company.id,
      actor_type: 'hr', actor_name: req.company.name,
      action: 'notified_signers', entity_type: 'card', entity_id: card.id,
      entity_name: card.title || `For ${card.recipient_name}`,
      details: { scope, department, sent }
    }).catch(() => {});

    res.json({ message: `Notified ${sent} team member${sent !== 1 ? 's' : ''} to sign the card.`, sent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

module.exports = router;
