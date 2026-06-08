const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getDashboard, markNotificationsRead, getDashboardStats,
  getFinancialHistory, getDeliveredCards, getReceivedCards,
  getPendingToSign, transferCard, trackCardOpened
} = require('../controllers/dashboardController');

// Public: track card opened (no auth required - called by anyone viewing card)
router.post('/card-opened/:slug', trackCardOpened);

router.use(auth);
router.get('/', getDashboard);
router.get('/stats', getDashboardStats);
router.post('/notifications/read', markNotificationsRead);
router.get('/financial-history', getFinancialHistory);
router.get('/delivered', getDeliveredCards);
router.get('/received', getReceivedCards);
router.get('/pending-to-sign', getPendingToSign);
router.post('/transfer-card', transferCard);


module.exports = router;
