const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, searchUsers, changePassword, uploadAvatar, forgotPassword, resetPassword, seedAdmin } = require('../controllers/authController');
const { upload } = require('../utils/cloudinary');
const { auth } = require('../middleware/auth');

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

module.exports = router;
