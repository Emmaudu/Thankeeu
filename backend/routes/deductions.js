const express = require('express');
const router = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const { memberAuth, leaderAuth, hrOrMemberAuth } = require('../middleware/memberAuth');
const {
  getWallet, requestDeduction, approveDeduction, rejectDeduction,
  getPendingDeductions, requestCrossDept, getCrossDeptRequests, approveCrossDept,
} = require('../controllers/deductionController');

// Wallet — HR or member can view
router.get('/wallet/:cardId', hrOrMemberAuth, getWallet);

// Deduction requests
router.post('/request', leaderAuth, requestDeduction);
router.get('/pending', companyAuth, getPendingDeductions);
router.post('/:requestId/approve', companyAuth, approveDeduction);
router.post('/:requestId/reject', companyAuth, rejectDeduction);

// Cross-department notification requests
router.post('/cross-dept', hrOrMemberAuth, requestCrossDept);
router.get('/cross-dept', companyAuth, getCrossDeptRequests);
router.post('/cross-dept/:requestId/approve', companyAuth, approveCrossDept);

module.exports = router;
