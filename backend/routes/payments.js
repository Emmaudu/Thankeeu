const express = require('express');
const router  = express.Router();
const { anyAuth } = require('../middleware/auth');
const {
  initCardFee,
  initContribution,
  paymentCallback,
} = require('../controllers/paymentController');

// ── Card creation fee (authenticated) ────────────────────────────────────────
router.post('/initialize/purchase',  anyAuth, initCardFee);
router.post('/initialize/card-fee',  anyAuth, initCardFee);

// ── Gift contributions (public — signers not logged in) ───────────────────────
router.post('/initialize/contribution', initContribution);

// ── Flutterwave redirect callback (same pattern as old Paystack) ──────────────
// FLW redirects browser here after hosted checkout with ?tx_ref=...&status=successful
// Backend verifies, updates DB, then res.redirect() to frontend
router.get('/callback', paymentCallback);

module.exports = router;
