/**
 * routes/moneyTransfer.js — "Send Money" endpoints.
 *
 * Mounted at /api/money in server.js.
 *
 * Auth model:
 *   • Composing and paying always requires a signed-in user (`auth`).
 *   • Reading and claiming use `optionalAuth`, because the recipient may open
 *     the emailed link before they have an account — the private claim_token
 *     in the URL is what authorises them. Once signed in with the address the
 *     card was sent to, the token is no longer needed.
 */
const express = require('express');
const router  = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const mt = require('../controllers/moneyTransferController');
const { upload } = require('../controllers/messageController');

// Same Cloudinary middleware the group-card messages use, wrapped so multer
// failures come back as clean JSON instead of a 500.
const handleMedia = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (!err) return next();
    console.error('[money media upload]', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Files must be under 50MB.' });
    }
    return res.status(400).json({ error: 'Could not process that file. Try a different one.' });
  });
};

// ── Sender (must be signed in) ──────────────────────────────────────────────
router.post('/draft',            auth, mt.createDraft);
router.post('/media',            auth, handleMedia, mt.uploadMedia);
router.post('/initialize',       auth, mt.initPayment);
router.post('/verify',           auth, mt.verifyPayment);
router.get('/mine',              auth, mt.listMine);
router.get('/received',          auth, mt.listReceived);
router.get('/mine/:slug',        auth, mt.getMine);

// ── Recipient (private token in the URL, or signed in as the recipient) ─────
router.get('/:slug',             optionalAuth, mt.getPublic);
router.post('/:slug/claim',      optionalAuth, mt.claim);

module.exports = router;
