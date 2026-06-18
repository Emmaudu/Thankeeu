const express = require('express');
const router  = express.Router();
const { anyAuth, optionalAuth } = require('../middleware/auth');
const {
  initCardFee,
  verifyCardFee,
  initContribution,
  verifyContribution,
  verifyPayment,
} = require('../controllers/paymentController');

// Card creation fee (auth required to init, but NOT to verify)
router.post('/initialize/purchase',    anyAuth, initCardFee);
router.post('/initialize/card-fee',    anyAuth, initCardFee);

// optionalAuth (not anyAuth) — FLW redirect lands here after a full-page reload.
// The user's JWT may have expired during checkout; requiring auth would silently
// leave the card as 'draft' even though the payment succeeded. verifyCardFee
// does not use req.user — it only needs the tx_ref to confirm with FLW.
router.get('/verify-card-fee',         optionalAuth, verifyCardFee);

// Gift contributions (public)
router.post('/initialize/contribution', initContribution);
router.post('/verify-contribution',     verifyContribution);
router.get('/verify-contribution',      verifyContribution); // ?tx_ref=

// Generic verify — PaymentCallback fallback for any payment type
router.get('/verify/:txRef', verifyPayment);
router.get('/verify',        verifyPayment); // ?tx_ref=

module.exports = router;
