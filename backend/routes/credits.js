const express = require('express');
const router  = express.Router();
const { auth } = require('../middleware/auth');
const { getBalance, getHistory, purchaseCredits, verifyPurchase, spendCredit } = require('../controllers/creditController');

router.get('/balance',          auth, getBalance);
router.get('/history',          auth, getHistory);
router.post('/purchase',        auth, purchaseCredits);
router.post('/verify/:txRef',   auth, verifyPurchase);
router.get('/verify/:txRef',    auth, verifyPurchase); // FLW redirect
router.post('/spend',           auth, spendCredit);

module.exports = router;
