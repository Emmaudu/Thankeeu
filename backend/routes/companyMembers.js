const express = require('express');
const router = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const { memberAuth, leaderAuth, hrOrMemberAuth } = require('../middleware/memberAuth');
const { upload } = require('../utils/cloudinary');
const {
  memberSignup, memberLogin, getMemberMe, getDepartmentOptions,
  getPendingMembers, getDeptPendingMembers,
  approveMember, rejectMember,
  getMemberDashboard,
  memberForgotPassword, memberResetPassword,
  updateMemberProfile, changeMemberPassword,
  getMemberReceivedCards, getMemberPendingToSign, getMemberFinancialHistory,
  transferCardToMember, getMemberReminders, createMemberReminder,
  deleteMemberReminder, getMemberFinances,
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
router.put('/profile', memberAuth, updateMemberProfile);
router.get('/received-cards', memberAuth, getMemberReceivedCards);
router.get('/pending-to-sign', memberAuth, getMemberPendingToSign);
router.get('/financial-history', memberAuth, getMemberFinancialHistory);
router.post('/upload-avatar', memberAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path });
  } catch (err) { res.status(500).json({ error: 'Upload failed' }); }
});
router.put('/password', memberAuth, changeMemberPassword);

// Extended dashboard tab endpoints
router.get('/my-cards',        memberAuth, getMemberMyCards);
router.get('/received',        memberAuth, getMemberReceivedCards);
router.post('/transfer-card',  memberAuth, transferCardToMember);
router.get('/reminders',       memberAuth, getMemberReminders);
router.post('/reminders',      memberAuth, createMemberReminder);
router.delete('/reminders/:id', memberAuth, deleteMemberReminder);
router.get('/finances',        memberAuth, getMemberFinances);

// HR: full member management
router.get('/all', companyAuth, getPendingMembers);
router.post('/:memberId/approve', hrOrMemberAuth, approveMember);
router.post('/:memberId/reject', hrOrMemberAuth, rejectMember);

module.exports = router;
