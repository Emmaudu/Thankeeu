const express = require('express');
const router  = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const {
  companySignup, companyLogin, getCompanyMe,
  updateCompanyProfile, changeCompanyPassword,
  companyForgotPassword, companyResetPassword,
} = require('../controllers/companyController');

router.post('/signup',           companySignup);
router.post('/login',            companyLogin);
router.post('/forgot-password',  companyForgotPassword);
router.post('/reset-password',   companyResetPassword);
router.get('/me',                companyAuth, getCompanyMe);
router.put('/profile',           companyAuth, updateCompanyProfile);
router.put('/password',          companyAuth, changeCompanyPassword);

module.exports = router;
