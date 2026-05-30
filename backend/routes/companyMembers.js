const express = require('express');
const router = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const { memberAuth, leaderAuth, hrOrMemberAuth } = require('../middleware/memberAuth');
const {
  memberSignup, memberLogin, getMemberMe, getDepartmentOptions,
  getPendingMembers, getDeptPendingMembers,
  approveMember, rejectMember,
  getMemberDashboard,
  memberForgotPassword, memberResetPassword,
} = require('../controllers/companyMembersController');

// Public
router.post('/signup', memberSignup);
router.post('/login', memberLogin);
router.get('/departments', getDepartmentOptions);
router.post('/forgot-password', memberForgotPassword);
router.post('/reset-password', memberResetPassword);

// Member protected
router.get('/me', memberAuth, getMemberMe);
router.get('/dashboard', memberAuth, getMemberDashboard);
router.get('/dept-pending', leaderAuth, getDeptPendingMembers);

// HR: full member management
router.get('/all', companyAuth, getPendingMembers);
router.post('/:memberId/approve', hrOrMemberAuth, approveMember);
router.post('/:memberId/reject', hrOrMemberAuth, rejectMember);

module.exports = router;
