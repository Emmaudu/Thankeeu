const express = require('express');
const router = express.Router();
const {
  signup, login, getMe, updateProfile, searchUsers,
  changePassword, uploadAvatar, forgotPassword, resetPassword,
  seedAdmin, verifyEmail, resendVerification,
  sendVerificationCode, verifyCodeAndSignup,
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const authLimiterMiddleware = rateLimit({ windowMs: 60*60*1000, max: 5, skipSuccessfulRequests: true, message: { error: 'Too many attempts. Wait 1 hour.' } });
const { upload } = require('../utils/cloudinary');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);
router.get('/search', auth, searchUsers);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/seed-admin', seedAdmin);
router.post('/upload-avatar', auth, upload.single('file'), uploadAvatar);

// Email verification (public — no auth needed for verify link)
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', auth, resendVerification);

// Email-code signup (new 2-step flow for individual users)
router.post('/send-code',    authLimiterMiddleware, sendVerificationCode);
router.post('/verify-code',  verifyCodeAndSignup);

module.exports = router;
