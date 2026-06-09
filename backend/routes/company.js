// routes/company.js
const express = require('express');
const router = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const {
  companySignup, companyLogin, getCompanyMe,
  updateCompanyProfile, changeCompanyPassword,
  companyForgotPassword, companyResetPassword
} = require('../controllers/companyController');

router.post('/signup', companySignup);
router.post('/login', companyLogin);
router.post('/forgot-password', companyForgotPassword);
router.post('/reset-password', companyResetPassword);
router.get('/me', companyAuth, getCompanyMe);
router.put('/profile', companyAuth, updateCompanyProfile);
router.put('/password', companyAuth, changeCompanyPassword);

module.exports = router;

// ── Core team management ──────────────────────────────────────────────
const {
  getCoreTeam, inviteCoreMember, bulkInviteCoreTeam,
  removeCoreMember, updateCoreMember,
} = require('../controllers/coreTeamController');

router.get('/core-team',              companyAuth, getCoreTeam);
router.post('/core-team/invite',      companyAuth, inviteCoreMember);
router.post('/core-team/bulk-invite', companyAuth, bulkInviteCoreTeam);
router.put('/core-team/:id',          companyAuth, updateCoreMember);
router.delete('/core-team/:id',       companyAuth, removeCoreMember);
