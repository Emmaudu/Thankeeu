const express = require('express');
const path = require('path');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');
const {
  gameAuth,
  gamesCompanyAuth,
  listDepartments,
  getDepartmentGame,
  signup,
  login,
  me,
  updateProfile,
  registerForGame,
  dashboard,
  playGame,
  submitGame,
  leaderboard,
  myCongratulationCards,
  pendingCongratulationCards,
  signCongratulationCard,
  visitorSignCongratulationCard,
  gamesCompanySignup,
  gamesCompanyLogin,
  gamesCompanyMe,
  gamesCompanyUpdate,
  gamesCompanyDashboard,
  adminOverview,
  adminCreateDepartment,
  adminDeleteDepartment,
  adminRegenerateWeek,
  adminSendReminders,
  adminProcessCongratulationCards,
  listSponsorships,
  initializeSponsorship,
  verifySponsorship,
  myGameRewards,
  listGameBanks,
  verifyGameBank,
  saveGameBank,
  saveGamesCompanyBank,
  listForumPosts,
  createForumPost,
} = require('../controllers/gamesController');

const uploadGameAvatar = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 400 : 502;
      return res.status(status).json({ error: err.message || 'Profile photo upload failed' });
    }
    next();
  });
};

const uploadGameMedia = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 400 : 502;
      return res.status(status).json({ error: err.message || 'Media upload failed' });
    }
    next();
  });
};
const uploadUrl = (file) => {
  const value = file?.path || file?.secure_url || '';
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `/uploads/${path.basename(value)}`;
};
const allowedCongratsMedia = /^(image|video|audio)\//;

router.get('/departments', listDepartments);
router.get('/departments/:slug', getDepartmentGame);
router.get('/leaderboard', leaderboard);
router.get('/sponsorships', listSponsorships);
router.post('/congratulations/cards/:cardId/sign', visitorSignCongratulationCard);
router.post('/upload-avatar', uploadGameAvatar, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No profile photo uploaded' });
  if (!req.file.mimetype?.startsWith('image/')) return res.status(400).json({ error: 'Profile photo must be an image file' });
  res.json({ url: uploadUrl(req.file) });
});
router.post('/congratulations/media', uploadGameMedia, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No media file uploaded' });
  if (!allowedCongratsMedia.test(req.file.mimetype || '')) return res.status(400).json({ error: 'Upload a GIF, photo, video, or voice note file' });
  res.json({ url: uploadUrl(req.file), mimetype: req.file.mimetype });
});

router.post('/signup', signup);
router.post('/login', login);
router.post('/company/signup', gamesCompanySignup);
router.post('/company/login', gamesCompanyLogin);
router.get('/company/me', gamesCompanyAuth, gamesCompanyMe);
router.put('/company/me', gamesCompanyAuth, gamesCompanyUpdate);
router.get('/company/dashboard', gamesCompanyAuth, gamesCompanyDashboard);
router.post('/company/sponsorships/initialize', gamesCompanyAuth, initializeSponsorship);
router.post('/company/sponsorships/verify', gamesCompanyAuth, verifySponsorship);
router.get('/company/banks', gamesCompanyAuth, listGameBanks);
router.post('/company/banks/verify', gamesCompanyAuth, verifyGameBank);
router.put('/company/banks', gamesCompanyAuth, saveGamesCompanyBank);
router.get('/me', gameAuth, me);
router.put('/me', gameAuth, updateProfile);
router.get('/dashboard', gameAuth, dashboard);
router.post('/departments/:slug/register', gameAuth, registerForGame);
router.get('/departments/:slug/play', gameAuth, playGame);
router.post('/departments/:slug/submit', gameAuth, submitGame);
router.get('/congratulations/cards', gameAuth, myCongratulationCards);
router.get('/congratulations/pending', gameAuth, pendingCongratulationCards);
router.post('/congratulations/signatures/:signatureId/sign', gameAuth, signCongratulationCard);
router.get('/rewards', gameAuth, myGameRewards);
router.get('/banks', gameAuth, listGameBanks);
router.post('/banks/verify', gameAuth, verifyGameBank);
router.put('/banks', gameAuth, saveGameBank);
router.get('/departments/:slug/forum', listForumPosts);
router.post('/departments/:slug/forum', gameAuth, createForumPost);

router.get('/admin/overview', adminAuth, adminOverview);
router.post('/admin/departments', adminAuth, adminCreateDepartment);
router.delete('/admin/departments/:id', adminAuth, adminDeleteDepartment);
router.post('/admin/regenerate-week', adminAuth, adminRegenerateWeek);
router.post('/admin/send-reminders', adminAuth, adminSendReminders);
router.post('/admin/process-congratulations', adminAuth, adminProcessCongratulationCards);

module.exports = router;
