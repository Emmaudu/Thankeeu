const express = require('express');
const router  = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  getStats, getAllUsers, updateUserRole, deleteUser, giftCredits,
  getAllCards, deleteCard, redeliverCard,
  getAllCompanies, deleteCompany, getCompanyTeamMembers,
  getVisitors, setCompanyMultiplier, grantPilot,
  listPalApplications, approvePalGroup, rejectPalGroup,
} = require('../controllers/adminController');
const { adminListPalTickets, adminReplyPalTicket } = require('../controllers/palSupportController');
const { sendNudgeEmails } = require('../controllers/visitorsController');
const { validateUUIDParam } = require('../utils/paramGuard');

router.use(adminAuth);

router.get('/stats',    getStats);
router.get('/visitors', getVisitors);

// Nudge emails — trigger manually from admin panel
router.post('/visitors/nudge', async (req, res) => {
  try {
    await sendNudgeEmails();
    res.json({ ok: true, message: 'Nudge emails dispatched to eligible unconverted visitors.' });
  } catch (err) {
    console.error('admin nudge error:', err.message);
    res.status(500).json({ error: 'Nudge failed: ' + err.message });
  }
});

// Users
router.get('/users',                                         getAllUsers);
router.put('/users/:userId/role',     validateUUIDParam('userId'), updateUserRole);
router.post('/users/:userId/gift-credits', validateUUIDParam('userId'), giftCredits);
router.delete('/users/:userId',       validateUUIDParam('userId'), deleteUser);

// Cards
router.get('/cards',                                    getAllCards);
router.post('/cards/:cardId/redeliver', validateUUIDParam('cardId'), redeliverCard);
router.delete('/cards/:cardId',     validateUUIDParam('cardId'),    deleteCard);

// Companies — fixed routes before /:companyId wildcard
router.get('/companies',                                getAllCompanies);
router.get('/companies/:companyId/members', validateUUIDParam('companyId'), getCompanyTeamMembers);
router.post('/companies/:companyId/set-multiplier', validateUUIDParam('companyId'), setCompanyMultiplier);
router.post('/companies/:companyId/grant-pilot',    validateUUIDParam('companyId'), grantPilot);
router.delete('/companies/:companyId',  validateUUIDParam('companyId'), deleteCompany);

// Pals — fixed routes (tickets) before /:id wildcard
router.get('/pals',                    listPalApplications);
router.get('/pals/tickets',            adminListPalTickets);
router.put('/pals/tickets/:id/reply',  validateUUIDParam('id'), adminReplyPalTicket);
router.post('/pals/:id/approve',       validateUUIDParam('id'), approvePalGroup);
router.post('/pals/:id/reject',        validateUUIDParam('id'), rejectPalGroup);

module.exports = router;
