const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { initializeCardPurchase, initializeContribution, verifyPayment, webhook } = require('../controllers/paymentController');

router.post('/webhook', webhook);
router.post('/initialize/purchase', auth, initializeCardPurchase);
router.post('/initialize/contribution', initializeContribution);
router.get('/verify/:reference', verifyPayment);

module.exports = router;
