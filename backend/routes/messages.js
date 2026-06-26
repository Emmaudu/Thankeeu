const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { auth } = require('../middleware/auth');
const { addMessage, reactToMessage, deleteMessage, sendReply, updatePosition, upload } = require('../controllers/messageController');
const { validateSlugParam, validateUUIDParam } = require('../utils/paramGuard');

// Flexible auth: accepts user OR member token (no forced redirect on failure)
const flexAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    const d = jwt.verify(token, process.env.JWT_SECRET);
    if (d.type === 'company_member') {
      const { data } = await supabase.from('company_members')
        .select('id,first_name,last_name,email,status').eq('id', d.memberId).maybeSingle();
      if (data?.status === 'approved') req.member = data;
    } else if (d.userId) {
      const { data } = await supabase.from('users')
        .select('id,email,full_name').eq('id', d.userId).maybeSingle();
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

// Position update for album layout — must be BEFORE wildcard /:card_slug
router.patch('/position/:message_id', validateUUIDParam('message_id'), flexAuth, updatePosition);

// IMPORTANT: /react/:message_id and /:message_id (delete) are fixed-segment
// routes that MUST be registered before the /:card_slug wildcard — otherwise
// Express matches 'react' as card_slug and routes to addMessage instead.
router.post('/react/:message_id', validateUUIDParam('message_id'), reactToMessage);
router.delete('/:message_id',     validateUUIDParam('message_id'), auth, deleteMessage);

// upload.any() reports failures (Cloudinary errors, oversized files, etc.) via
// next(err), which would otherwise skip addMessage's own try/catch entirely
// and fall through to the generic global error handler. Catch it here so the
// signer gets a clear, specific reason instead of a vague timeout/500.
const handleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (!err) return next();
    console.error('[messages upload] error:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large — maximum size is 9MB per file. GIFs and images must be under 9MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'You can attach up to 10 files per message.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field. Please try again.' });
    }
    if (err.message?.includes('File size too large') || err.message?.includes('Maximum is')) {
      return res.status(400).json({ error: 'File too large for upload. Please use a GIF or image under 9MB.' });
    }
    if (err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT')) {
      return res.status(504).json({ error: 'Upload timed out — your files may be too large or your connection is slow. Try attaching fewer files or smaller files.' });
    }
    return res.status(502).json({ error: 'Could not upload your files right now. Please check your connection and try again. If the problem continues, try sending without attachments first.' });
  });
};

// Wildcard routes — must be after all fixed-segment routes
router.post('/:card_slug',        validateSlugParam('card_slug'), handleUpload, addMessage);
// Access-token recipients can reply without a login session
router.post('/:card_slug/reply',  validateSlugParam('card_slug'), flexAuth, requireAuth, sendReply);

module.exports = router;
