const express = require('express');
const router  = express.Router();
const { adminAuth } = require('../middleware/auth');
const { submitDemoRequest, getDemoRequests, updateDemoStatus } = require('../controllers/demoController');

// Public
router.post('/request', submitDemoRequest);

// Admin only
router.get('/requests',     adminAuth, getDemoRequests);
router.patch('/requests/:id', adminAuth, updateDemoStatus);

module.exports = router;
