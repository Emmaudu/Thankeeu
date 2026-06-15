const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
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
  // Read from httpOnly cookies first, then Bearer header
  const token = req.cookies?.tk_user
              || req.cookies?.tk_company
              || req.cookies?.tk_member
              || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const jwt = require('jsonwebtoken');
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
router.post('/', anyAuth, createCard);  // anyAuth accepts user + company + member tokens

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

    const { data: card, error: cardErr } = await supabase
      .from('cards').select('*').eq('slug', slug).maybeSingle();
    if (cardErr) throw new Error(`Card query: ${cardErr.message}`);
    if (!card)   return res.status(404).json({ error: 'Card not found' });

    // Verify this card belongs to this company
    if (card.company_id !== req.company.id)
      return res.status(403).json({ error: 'Card does not belong to your company' });

    // Get members to notify — approved + active, exclude the card recipient
    let query = supabase.from('company_members')
      .select('email, first_name, id')
      .eq('company_id', req.company.id)
      .in('status', ['approved', 'active']);
    if (scope === 'department' && department) query = query.eq('department', department);
    const { data: members, error: membersErr } = await query;
    if (membersErr) throw new Error(`Members query: ${membersErr.message}`);

    const { sendEmail }   = require('../utils/email');
    const { logActivity } = require('../utils/activityLog');
    let sent = 0;

    for (const m of (members || [])) {
      if (!m.email) continue;
      // Skip the recipient — they should not see the card early
      if (card.recipient_email &&
          m.email.toLowerCase() === card.recipient_email.toLowerCase()) continue;

      await sendEmail({
        to: m.email,
        template: 'occasionNotice',
        data: {
          icon:            '💌',
          occasionLabel:   card.occasion?.replace(/_/g, ' ') || 'occasion',
          memberName:      card.recipient_name,
          memberFirstName: card.recipient_name?.split(' ')[0] || 'them',
          department:      department || 'the team',
          companyName:     req.company.name,
          cardSlug:        slug,
          giftEnabled:     card.is_gift_enabled,
          occasionDate:    card.send_date
            ? new Date(card.send_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'soon',
          daysLeft: card.deadline
            ? Math.max(1, Math.round((new Date(card.deadline) - Date.now()) / 86400000))
            : 7,
          deadline: card.deadline
            ? new Date(card.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'long' })
            : 'soon',
        },
      }).catch(e => console.error(`[notify-signers] email failed for ${m.email}:`, e.message));
      sent++;
    }

    await logActivity({
      company_id:  req.company.id,
      actor_id:    req.company.id,
      actor_type:  req.actorType || 'hr',
      actor_name:  req.actorName || req.company.name,
      action:      'notified_signers',
      entity_type: 'card',
      entity_id:   card.id,
      entity_name: card.title || `For ${card.recipient_name}`,
      details:     { scope, department: department || null, sent },
    }).catch(() => {});

    res.json({
      message: `Notified ${sent} team member${sent !== 1 ? 's' : ''} to sign the card.`,
      sent,
    });
  } catch (err) {
    console.error('[notify-signers] error:', err.message);
    res.status(500).json({ error: `Failed to send notifications: ${err.message}` });
  }
});;

module.exports = router;
