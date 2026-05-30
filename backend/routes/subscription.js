// routes/subscription.js
const express = require('express');
const router = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const { initializeSubscription, verifySubscription, getSubscription, cancelSubscription } = require('../controllers/subscriptionController');

router.use(companyAuth);
router.get('/', getSubscription);
router.post('/initialize', initializeSubscription);
router.get('/verify/:reference', verifySubscription);
router.post('/cancel', cancelSubscription);

module.exports = router;
