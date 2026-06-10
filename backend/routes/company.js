const express = require('express');
const router  = express.Router();
const multer = require('multer');
const uploadMem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5*1024*1024 } });
const { companyAuth } = require('../middleware/companyAuth');
const {
  companySignup, companyLogin, getCompanyMe,
  updateCompanyProfile, uploadCompanyLogo, changeCompanyPassword,
  companyForgotPassword, companyResetPassword,
} = require('../controllers/companyController');

router.post('/signup',           companySignup);
router.post('/login',            companyLogin);
router.post('/forgot-password',  companyForgotPassword);
router.post('/reset-password',   companyResetPassword);
router.get('/me',                companyAuth, getCompanyMe);
router.put('/profile',           companyAuth, updateCompanyProfile);
router.put('/password',          companyAuth, changeCompanyPassword);
router.post('/upload-logo',      companyAuth, uploadMem.single('logo'), uploadCompanyLogo);

module.exports = router;
