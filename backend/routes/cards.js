const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { auth, anyAuth, optionalAuth } = require('../middleware/auth');
const { companyAuth } = require('../middleware/companyAuth');
const { memberAuth } = require('../middleware/memberAuth');
const {
  createCard, getUserCards, getCard, updateCard,
  activateCard, sendCard, deleteCard, getPublicCard,
  getRecipientCard, claimGift, getMemberCards, approveCardScope,
  getCompanyCards, getCompanyDeliveredCards, getCompanyReceivedCards, transferCardToMember,
  getClaimGate, getCardLoginType, markClaimed, claimMemberPassword,
  uploadRecipientPhoto,
} = require('../controllers/cardController');
const { getOgImage, getOgMeta } = require('../controllers/ogImageController');
const { uploadRecipientPhoto: photoUpload } = require('../utils/cloudinary');
const { validateSlugParam } = require('../utils/paramGuard');

// Flexible auth — accepts individual user, team member, OR HR company token.
// OPTIONAL: unlike most auth middleware, this never blocks the request when
// no token is present. GET /:slug (getCard) needs to support truly public,
// unauthenticated viewing of a card (e.g. a recipient sharing the plain
// /card/:slug link with family/friends) while still gating sensitive actions
// like gift withdrawal separately, deeper in the app. getCard's own logic
// already correctly treats req.user/req.company/req.member as optional and
// falls back to isCreator=false / isRecipient=false for anonymous visitors —
// filtering private messages, hiding amounts if hide_amounts is set, and
// stripping the access_token from the response. A missing/invalid token
// here is therefore NOT an error condition; only on a malformed token do we
// continue as anonymous rather than fail outright, since a bad token should
// never be able to block a legitimate public view.
const flexUserAuth = async (req, res, next) => {
  const token = req.cookies?.tk_user
              || req.cookies?.tk_company
              || req.cookies?.tk_member
              || req.headers.authorization?.split(' ')[1];
  if (!token) return next(); // anonymous — proceed, getCard treats this as a public viewer
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'company') {
      const { data: company } = await supabase
        .from('companies').select('id, name, email, contact_person')
        .eq('id', decoded.companyId).maybeSingle();
      if (company) req.company = company;
    } else if (decoded.type === 'company_member') {
      const { data: member } = await supabase
        .from('company_members')
        .select('id, first_name, last_name, email, role, department, status, company_id')
        .eq('id', decoded.memberId).maybeSingle();
      if (member && member.status === 'approved') req.member = member;
    } else {
      const { data: user } = await supabase
        .from('users').select('id, email, full_name, role, avatar_url')
        .eq('id', decoded.userId).maybeSingle();
      if (user) req.user = user;
    }
  } catch {
    // Invalid/expired token — fall through as anonymous rather than blocking.
    // A stale cookie should never prevent someone from viewing a public card.
  }
  next();
};

// ── IMPORTANT: specific fixed-segment routes MUST come before /:slug wildcard ──
// Express matches routes in registration order — /company/mine registered after
// /:slug would be captured as slug='company', hitting getCard instead.

// ── Card creation ───────────────────────────────────────────────────────────
router.post('/', optionalAuth, createCard);

// ── User card list ──────────────────────────────────────────────────────────
router.get('/', auth, getUserCards);

// ── Company HR card management (must be before /:slug) ─────────────────────
router.get('/company/mine',       companyAuth, getCompanyCards);
router.get('/company/delivered',  companyAuth, getCompanyDeliveredCards);
router.get('/company/received',   companyAuth, getCompanyReceivedCards);

// ── Member card history ─────────────────────────────────────────────────────
router.get('/member-history', memberAuth, getMemberCards);

// ── Public card routes (must be before /:slug) ─────────────────────────────
// Recipient claim gate — public, no auth needed
router.get('/:slug/claim-gate',  validateSlugParam('slug'), getClaimGate);
router.get('/:slug/login-type',  validateSlugParam('slug'), getCardLoginType);
router.post('/:slug/mark-claimed', validateSlugParam('slug'), optionalAuth, markClaimed);
router.post('/:slug/claim-member-password', validateSlugParam('slug'), claimMemberPassword);

router.get('/public/:slug',           validateSlugParam('slug'), optionalAuth, getPublicCard);
router.get('/recipient/:slug',        validateSlugParam('slug'), getRecipientCard);
router.get('/:slug/og-image',         validateSlugParam('slug'), getOgImage);
router.get('/:slug/og-meta',          validateSlugParam('slug'), getOgMeta);
router.post('/recipient/:slug/claim', validateSlugParam('slug'), claimGift);

// ── Recipient photo upload — creator-only, multipart field: "photo" ────────
// Wraps photoUpload.single() so multer errors (wrong type, file too large)
// return clean JSON 400s instead of falling through to the global 500 handler.
const handlePhotoUpload = (req, res, next) => {
  photoUpload.single('photo')(req, res, (err) => {
    if (!err) return next();
    console.error('[recipient-photo upload] multer error:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Photo must be under 5 MB. Please choose a smaller image.' });
    }
    if (err.message && err.message.toLowerCase().includes('image')) {
      return res.status(400).json({ error: 'Only image files are allowed (JPG, PNG, WebP).' });
    }
    return res.status(400).json({ error: 'Could not process the photo. Please try a different image.' });
  });
};
router.post('/:slug/recipient-photo', validateSlugParam('slug'), optionalAuth,
  handlePhotoUpload, uploadRecipientPhoto);

// ── Slug-based routes (wildcard — must come after all fixed-segment routes) ─
router.get('/:slug',                validateSlugParam('slug'), flexUserAuth, getCard);
router.put('/:slug',                validateSlugParam('slug'), optionalAuth, updateCard);
router.post('/:slug/activate',      validateSlugParam('slug'), optionalAuth, activateCard);
router.post('/:slug/send',          validateSlugParam('slug'), anyAuth, sendCard);
router.delete('/:slug',             validateSlugParam('slug'), anyAuth, deleteCard);
router.post('/:slug/approve-scope', validateSlugParam('slug'), companyAuth, approveCardScope);
router.post('/:slug/transfer',      validateSlugParam('slug'), companyAuth, transferCardToMember);

// POST /:slug/notify-signers — HR notifies department or all members to sign a card
router.post('/:slug/notify-signers', validateSlugParam('slug'), companyAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { scope, department } = req.body;

    const { data: card, error: cardErr } = await supabase
      .from('cards').select('*').eq('slug', slug).maybeSingle();
    if (cardErr || !card) return res.status(404).json({ error: 'Card not found' });
    if (card.company_id !== req.company.id)
      return res.status(403).json({ error: 'Card does not belong to your company' });

    let query = supabase.from('company_members')
      .select('email, first_name, id')
      .eq('company_id', req.company.id)
      .eq('status', 'approved');
    if (scope === 'department' && department) query = query.eq('department', department);
    const { data: members, error: membersErr } = await query;
    if (membersErr) throw membersErr;

    const { sendEmail }   = require('../utils/email');
    const { logActivity } = require('../utils/activityLog');
    let sent = 0;

    for (const m of (members || [])) {
      if (!m.email) continue;
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
    res.status(500).json({ error: 'Failed to send notifications. Please try again.' });
  }
});

// POST /:slug/claim — attach an anonymous pre-signup draft to the now-
// authenticated user's account. Called right after signup/login when the
// client is holding a draft's slug + edit token from localStorage.
router.post('/:slug/claim', validateSlugParam('slug'), auth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { draft_edit_token } = req.body;
    if (!draft_edit_token) return res.status(400).json({ error: 'Missing draft edit token' });

    const { data: card } = await supabase.from('cards')
      .select('id, creator_id, is_draft, draft_edit_token, claimed_at')
      .eq('slug', slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    if (!card.is_draft || card.draft_edit_token !== draft_edit_token) {
      return res.status(403).json({ error: 'Invalid draft token' });
    }
    if (card.creator_id) {
      // Already claimed (e.g. double-submit) — only an issue if it belongs
      // to someone else; if it's already this user's, treat as success.
      if (card.creator_id !== req.user.id) {
        return res.status(409).json({ error: 'This draft has already been claimed by another account' });
      }
      return res.json({ message: 'Draft already linked to your account', slug });
    }

    const { data: updated, error } = await supabase.from('cards')
      .update({ creator_id: req.user.id, claimed_at: new Date(), updated_at: new Date() })
      .eq('slug', slug).eq('draft_edit_token', draft_edit_token) // re-check token atomically
      .select().maybeSingle();

    if (error) {
      console.error('[claim draft] update error:', error.message);
      return res.status(500).json({ error: 'Could not link draft to your account. Please try again.' });
    }
    if (!updated) return res.status(403).json({ error: 'Invalid draft token' });

    res.json({ message: 'Draft linked to your account', slug, card: updated });
  } catch (err) {
    console.error('[claim draft] unexpected error:', err.message);
    res.status(500).json({ error: 'Could not link draft to your account. Please try again.' });
  }
});

module.exports = router;
