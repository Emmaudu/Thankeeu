const express = require('express');
const router = express.Router();
const {
  signup, login, getMe, updateProfile, searchUsers,
  changePassword, uploadAvatar, forgotPassword, resetPassword,
  seedAdmin, verifyEmail, resendVerification
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
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

module.exports = router;
