const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  gameAuth,
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
  adminOverview,
  adminCreateDepartment,
  adminDeleteDepartment,
  adminRegenerateWeek,
  adminSendReminders,
  adminProcessCongratulationCards,
} = require('../controllers/gamesController');

router.get('/departments', listDepartments);
router.get('/departments/:slug', getDepartmentGame);
router.get('/leaderboard', leaderboard);
router.post('/congratulations/cards/:cardId/sign', visitorSignCongratulationCard);

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', gameAuth, me);
router.put('/me', gameAuth, updateProfile);
router.get('/dashboard', gameAuth, dashboard);
router.post('/departments/:slug/register', gameAuth, registerForGame);
router.get('/departments/:slug/play', gameAuth, playGame);
router.post('/departments/:slug/submit', gameAuth, submitGame);
router.get('/congratulations/cards', gameAuth, myCongratulationCards);
router.get('/congratulations/pending', gameAuth, pendingCongratulationCards);
router.post('/congratulations/signatures/:signatureId/sign', gameAuth, signCongratulationCard);

router.get('/admin/overview', adminAuth, adminOverview);
router.post('/admin/departments', adminAuth, adminCreateDepartment);
router.delete('/admin/departments/:id', adminAuth, adminDeleteDepartment);
router.post('/admin/regenerate-week', adminAuth, adminRegenerateWeek);
router.post('/admin/send-reminders', adminAuth, adminSendReminders);
router.post('/admin/process-congratulations', adminAuth, adminProcessCongratulationCards);

module.exports = router;
