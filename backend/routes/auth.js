// routes/auth.js
const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
