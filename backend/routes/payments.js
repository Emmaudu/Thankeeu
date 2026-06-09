const express = require('express');
const router  = express.Router();
const { auth, anyAuth }     = require('../middleware/auth');
const { memberAuth }        = require('../middleware/memberAuth');
const {
  initializePayment,    // generic init
  verifyPayment,        // verify by tx_ref
  initContribution,     // gift contribution init
  verifyContribution,   // verify gift contribution
  initCardFee,          // card creation fee
} = require('../controllers/paymentController');

// ── Flutterwave webhook (handled separately in /webhook/flutterwave) ─────────
// Legacy stub — real webhook is at /api/webhook/flutterwave
router.post('/webhook', (req, res) => res.status(410).json({ message: 'Webhook moved to /api/webhook/flutterwave' }));

// ── Card purchase / card creation fee ────────────────────────────────────────
// anyAuth: accepts regular user, HR company, or team member token
router.post('/initialize/purchase',      anyAuth, initCardFee);
router.post('/initialize/card-fee',      anyAuth, initCardFee);
router.get('/verify/purchase/:reference', anyAuth, async (req, res) => {
  // Map old verify/purchase to new verifyPayment
  req.body = req.body || {};
  return verifyPayment(req, res);
});
router.get('/verify/:txRef',             verifyPayment);   // e.g. after FLW redirect

// ── Gift contributions (public — signers may not be logged in) ────────────────
router.post('/initialize/contribution',  initContribution);
router.post('/verify/contribution',      verifyContribution);

// ── Generic initialize (used by CreateCard, Pricing, etc.) ───────────────────
router.post('/initialize',               initializePayment);

// ── Verify by tx_ref (called after Flutterwave redirect) ─────────────────────
router.get('/verify-contribution/:txRef', verifyContribution);  // After FLW redirect
router.get('/verify-contribution',         verifyContribution);  // With ?tx_ref= query param

module.exports = router;
