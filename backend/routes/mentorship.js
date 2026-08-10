'use strict';
const express = require('express');
const router  = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  submitApplication,
  submitContact,
  startSubscription,
  verifySubscription,
  adminListApplications,
  adminUpdateApplication,
  adminListContacts,
  adminListSubscriptions,
} = require('../controllers/mentorshipController');

// Public
router.post('/apply',            submitApplication);
router.post('/contact',          submitContact);
router.post('/subscribe',        startSubscription);
router.get('/subscribe/verify',  verifySubscription);

// Admin (existing thankeeu admin auth)
router.get('/admin/applications',        adminAuth, adminListApplications);
router.put('/admin/applications/:id',    adminAuth, adminUpdateApplication);
router.get('/admin/contacts',            adminAuth, adminListContacts);
router.get('/admin/subscriptions',       adminAuth, adminListSubscriptions);

module.exports = router;
