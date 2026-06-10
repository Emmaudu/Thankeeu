const express = require('express');
const router  = express.Router();
const { anyAuth } = require('../middleware/auth');
const {
  initCardFee,
  verifyCardFee,
  initContribution,
  verifyContribution,
} = require('../controllers/paymentController');

// Card creation fee (auth required)
router.post('/initialize/purchase',    anyAuth, initCardFee);
router.post('/initialize/card-fee',    anyAuth, initCardFee);
router.get('/verify-card-fee',         anyAuth, verifyCardFee);

// Gift contributions (public)
router.post('/initialize/contribution', initContribution);
router.post('/verify-contribution',     verifyContribution);
router.get('/verify-contribution',      verifyContribution); // ?tx_ref=

module.exports = router;
