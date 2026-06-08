const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const { signup, login, getMe, updateProfile, searchUsers, changePassword, uploadAvatar, forgotPassword, resetPassword, seedAdmin } = require('../controllers/authController');
const { upload } = require('../utils/cloudinary');
=======
const {
  signup, login, getMe, updateProfile, searchUsers,
  changePassword, uploadAvatar, forgotPassword, resetPassword,
  seedAdmin, verifyEmail, resendVerification
} = require('../controllers/authController');
>>>>>>> 1dd5bef (revamp user dashboard)
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
<<<<<<< HEAD
=======

// Email verification (public — no auth needed for verify link)
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', auth, resendVerification);
>>>>>>> 1dd5bef (revamp user dashboard)

module.exports = router;
