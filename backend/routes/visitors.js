const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { trackVisitor, getVisitors, getVisitorStats } = require('../controllers/visitorsController');
router.post('/track', trackVisitor);
router.get('/', adminAuth, getVisitors);
router.get('/stats', adminAuth, getVisitorStats);
module.exports = router;
