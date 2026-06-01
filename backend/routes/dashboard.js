const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getDashboard,
  markNotificationsRead,
  getDashboardStats
} = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(auth);

router.get('/', getDashboard);                          // GET /api/dashboard — main dashboard data
router.get('/stats', getDashboardStats);                // GET /api/dashboard/stats — charts & history
router.post('/notifications/read', markNotificationsRead); // POST /api/dashboard/notifications/read

module.exports = router;
